import { asyncClient, type ClientOptions, resolveMode, resolveReadOnly } from "@quvantic/mcp-core";
import { LiveNotionClient } from "./live.js";
import { SandboxNotionClient } from "./sandbox.js";
import type { NotionClient } from "./types.js";

export function createNotionClient(options: ClientOptions = {}): NotionClient {
  const mode = resolveMode(options);
  const readOnly = resolveReadOnly(options);
  if (mode === "live") return new LiveNotionClient(options, readOnly);
  return asyncClient(new SandboxNotionClient(options, readOnly));
}
