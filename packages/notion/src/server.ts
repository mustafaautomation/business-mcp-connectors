import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ClientOptions, type Mode, registerTools } from "@quvantic/mcp-core";
import { createNotionClient } from "./client.js";
import { notionTools } from "./tools.js";
import type { NotionClient } from "./types.js";

export interface NotionServer {
  server: McpServer;
  client: NotionClient;
  mode: Mode;
  readOnly: boolean;
}

export function createNotionServer(options: ClientOptions = {}): NotionServer {
  const client = createNotionClient(options);
  const server = new McpServer({ name: "quvantic-notion", version: "0.1.0" });
  registerTools(server, notionTools(client), client.readOnly);
  return { server, client, mode: client.mode, readOnly: client.readOnly };
}
