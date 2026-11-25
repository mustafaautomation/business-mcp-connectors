import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ClientOptions, type Mode, registerTools } from "@quvantic/mcp-core";
import { createSheetsClient } from "./client.js";
import { sheetsTools } from "./tools.js";
import type { SheetsClient } from "./types.js";

export interface SheetsServer {
  server: McpServer;
  client: SheetsClient;
  mode: Mode;
  readOnly: boolean;
}

export function createSheetsServer(options: ClientOptions = {}): SheetsServer {
  const client = createSheetsClient(options);
  const server = new McpServer({ name: "quvantic-sheets", version: "0.1.0" });
  registerTools(server, sheetsTools(client), client.readOnly);
  return { server, client, mode: client.mode, readOnly: client.readOnly };
}
