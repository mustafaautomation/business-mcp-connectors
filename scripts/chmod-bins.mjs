import { chmodSync, existsSync } from "node:fs";

const bins = [
  "packages/hubspot/dist/cli.js",
  "packages/clickup/dist/cli.js",
  "packages/sheets/dist/cli.js",
  "packages/notion/dist/cli.js",
  "packages/workflow/dist/cli.js",
  "packages/demo/dist/cli.js",
];

for (const file of bins) {
  if (!existsSync(file)) {
    process.stderr.write(`Missing ${file}. Run tsc -b first.\n`);
    process.exit(1);
  }
  chmodSync(file, 0o755);
}
