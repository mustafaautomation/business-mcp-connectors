import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type Mode, registerTools } from "@quvantic/mcp-core";
import { createClickupClient } from "./client.js";
import { clickupTools } from "./tools.js";
import type { ClickupClient, ClickupOptions } from "./types.js";

export interface ClickupServer {
  server: McpServer;
  client: ClickupClient;
  mode: Mode;
  readOnly: boolean;
}

export function createClickupServer(options: ClickupOptions = {}): ClickupServer {
  const client = createClickupClient(options);
  const server = new McpServer({ name: "quvantic-clickup", version: "0.1.0" });
  registerTools(server, clickupTools(client), client.readOnly);
  return { server, client, mode: client.mode, readOnly: client.readOnly };
}
