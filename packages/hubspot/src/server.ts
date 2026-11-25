import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ClientOptions, type Mode, registerTools } from "@quvantic/mcp-core";
import { createHubspotClient } from "./client.js";
import { hubspotTools } from "./tools.js";
import type { HubspotClient } from "./types.js";

export interface HubspotServer {
  server: McpServer;
  client: HubspotClient;
  mode: Mode;
  readOnly: boolean;
}

export function createHubspotServer(options: ClientOptions = {}): HubspotServer {
  const client = createHubspotClient(options);
  const server = new McpServer({ name: "quvantic-hubspot", version: "0.1.0" });
  registerTools(server, hubspotTools(client), client.readOnly);
  return { server, client, mode: client.mode, readOnly: client.readOnly };
}
