import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape } from "zod";
import { assertWritable, ConnectorError } from "./errors.js";

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: ZodRawShape;
  readOnly: boolean;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export function jsonResult(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function errorResult(error: unknown): CallToolResult {
  const coded =
    error instanceof ConnectorError
      ? {
          code: error.code,
          message: error.message,
          ...(error.status !== undefined ? { status: error.status } : {}),
        }
      : {
          code: "INTERNAL",
          message: error instanceof Error ? error.message : "Unexpected error.",
        };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(coded, null, 2) }],
  };
}

export function registerTools(server: McpServer, tools: ToolDefinition[], readOnly: boolean): void {
  for (const tool of tools) {
    const blocked = readOnly && !tool.readOnly;
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: blocked
          ? `${tool.description} Disabled while this server is read-only.`
          : tool.description,
        inputSchema: tool.inputSchema,
        annotations: {
          readOnlyHint: tool.readOnly,
          destructiveHint: !tool.readOnly,
          idempotentHint: tool.readOnly,
          openWorldHint: true,
        },
      },
      async (args) => {
        try {
          if (!tool.readOnly) assertWritable(readOnly, tool.title);
          const data = await tool.handler(args as Record<string, unknown>);
          return jsonResult(data);
        } catch (error) {
          return errorResult(error);
        }
      },
    );
  }
}

export function readToolJson(result: {
  content?: ReadonlyArray<{ type: string; text?: string }>;
  isError?: boolean;
}): unknown {
  const block = result.content?.find((item) => item.type === "text");
  if (!block?.text) {
    throw new ConnectorError("EMPTY", "Tool returned no text.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(block.text) as unknown;
  } catch {
    throw new ConnectorError("UPSTREAM", "Tool returned text that was not JSON.");
  }
  if (result.isError) {
    const record = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    const code = typeof record.code === "string" ? record.code : "TOOL_ERROR";
    const message = typeof record.message === "string" ? record.message : block.text;
    throw new ConnectorError(code, message);
  }
  return parsed;
}
