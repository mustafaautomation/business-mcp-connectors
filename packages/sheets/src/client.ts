import { asyncClient, type ClientOptions, resolveMode, resolveReadOnly } from "@quvantic/mcp-core";
import { LiveSheetsClient } from "./live.js";
import { SandboxSheetsClient } from "./sandbox.js";
import type { SheetsClient } from "./types.js";

export function createSheetsClient(options: ClientOptions = {}): SheetsClient {
  const mode = resolveMode(options);
  const readOnly = resolveReadOnly(options);
  if (mode === "live") return new LiveSheetsClient(options, readOnly);
  return asyncClient(new SandboxSheetsClient(options, readOnly));
}
