#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { runStdioServer } from "@quvantic/mcp-core";
import { createClickupServer } from "./server.js";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runStdioServer(() => createClickupServer(), "clickup");
}
