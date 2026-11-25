#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { runDemo } from "./demo.js";

async function main(): Promise<void> {
  const lines = await runDemo();
  process.stdout.write(`${lines.join("\n")}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Demo failed.";
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
