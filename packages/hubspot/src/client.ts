import { asyncClient, type ClientOptions, resolveMode, resolveReadOnly } from "@quvantic/mcp-core";
import { LiveHubspotClient } from "./live.js";
import { SandboxHubspotClient } from "./sandbox.js";
import type { HubspotClient } from "./types.js";

export function createHubspotClient(options: ClientOptions = {}): HubspotClient {
  const mode = resolveMode(options);
  const readOnly = resolveReadOnly(options);
  if (mode === "live") return new LiveHubspotClient(options, readOnly);
  return asyncClient(new SandboxHubspotClient(options, readOnly));
}
