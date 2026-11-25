import { asyncClient, resolveMode, resolveReadOnly } from "@quvantic/mcp-core";
import { LiveClickupClient } from "./live.js";
import { SandboxClickupClient } from "./sandbox.js";
import type { ClickupClient, ClickupOptions } from "./types.js";

export function createClickupClient(options: ClickupOptions = {}): ClickupClient {
  const mode = resolveMode(options);
  const readOnly = resolveReadOnly(options);
  if (mode === "live") return new LiveClickupClient(options, readOnly);
  return asyncClient(new SandboxClickupClient(options, readOnly));
}
