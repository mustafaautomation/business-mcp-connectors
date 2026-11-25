#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { runDealWonOnboarding } from "./index.js";

async function main(): Promise<void> {
  const result = await runDealWonOnboarding();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Workflow failed.";
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
