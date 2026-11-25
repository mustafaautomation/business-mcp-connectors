import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ConnectorError } from "@quvantic/mcp-core";
import { SANDBOX_EXAMPLES } from "./catalog.js";
import { callHostedTool, createHostedMcpServer, listHostedTools } from "./server.js";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept, mcp-protocol-version, mcp-session-id",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/**
 * Stateless Streamable HTTP. GET is a short description so a browser or health
 * check does not hold a serverless function open on an SSE stream.
 * POST speaks MCP with JSON responses (no long-lived session).
 */
export async function handleMcpRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (request.method === "GET") {
    return json({
      name: "quvantic-sandbox",
      mode: "sandbox",
      readOnly: true,
      protocol: "mcp-streamable-http",
      post: "/mcp",
    });
  }
  if (request.method === "DELETE")
    return new Response(null, { status: 200, headers: JSON_HEADERS });
  if (request.method !== "POST") return json({ code: "METHOD", message: "Use POST." }, 405);

  const server = createHostedMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    const response = await transport.handleRequest(request);
    const bytes = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(JSON_HEADERS)) {
      if (key === "content-type" && headers.has("content-type")) continue;
      headers.set(key, value);
    }
    return new Response(bytes, { status: response.status, headers });
  } finally {
    await transport.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
}

export async function handleSandboxRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (request.method === "GET") {
    return json({
      mode: "sandbox",
      readOnly: true,
      tools: listHostedTools(),
      examples: SANDBOX_EXAMPLES,
    });
  }
  if (request.method !== "POST") return json({ code: "METHOD", message: "Use POST." }, 405);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: { code: "VALIDATION", message: "Body must be JSON." } }, 400);
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const tool = typeof record.tool === "string" ? record.tool : "";
  const args =
    record.arguments && typeof record.arguments === "object" && !Array.isArray(record.arguments)
      ? (record.arguments as Record<string, unknown>)
      : {};
  try {
    const result = await callHostedTool(tool, args);
    return json({ ok: true, result });
  } catch (error) {
    const coded =
      error instanceof ConnectorError
        ? { code: error.code, message: error.message }
        : { code: "INTERNAL", message: error instanceof Error ? error.message : "Call failed." };
    const status = coded.code === "NOT_FOUND" ? 404 : 400;
    return json({ ok: false, error: coded }, status);
  }
}
