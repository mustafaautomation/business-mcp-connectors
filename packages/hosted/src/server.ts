import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { clickupTools, createClickupClient } from "@quvantic/mcp-clickup";
import { ConnectorError, Logger, registerTools, type ToolDefinition } from "@quvantic/mcp-core";
import { createHubspotClient, hubspotTools } from "@quvantic/mcp-hubspot";
import { createNotionClient, notionTools } from "@quvantic/mcp-notion";
import { createSheetsClient, sheetsTools } from "@quvantic/mcp-sheets";

const quiet = new Logger("hosted", () => {});

function readOnlyTools(serverName: string, tools: ToolDefinition[]): ToolDefinition[] {
  return tools
    .filter((tool) => tool.readOnly)
    .map((tool) => ({
      ...tool,
      name: `${serverName}_${tool.name}`,
      title: `${serverName} · ${tool.title}`,
    }));
}

/** Fresh sandbox clients. Writes are omitted so the public endpoint cannot mutate fixtures. */
export function createHostedTools(): ToolDefinition[] {
  const options = { mode: "sandbox" as const, readOnly: true, logger: quiet };
  return [
    ...readOnlyTools("hubspot", hubspotTools(createHubspotClient(options))),
    ...readOnlyTools("clickup", clickupTools(createClickupClient(options))),
    ...readOnlyTools("sheets", sheetsTools(createSheetsClient(options))),
    ...readOnlyTools("notion", notionTools(createNotionClient(options))),
  ];
}

export function createHostedMcpServer(): McpServer {
  const server = new McpServer({ name: "quvantic-sandbox", version: "0.1.0" });
  registerTools(server, createHostedTools(), true);
  return server;
}

export interface HostedToolSummary {
  name: string;
  title: string;
  description: string;
}

export function listHostedTools(): HostedToolSummary[] {
  return createHostedTools().map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
  }));
}

export async function callHostedTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const tool = createHostedTools().find((item) => item.name === name);
  if (!tool) {
    throw new ConnectorError("NOT_FOUND", `Tool ${name} is not on the hosted sandbox.`);
  }
  return tool.handler(args);
}
