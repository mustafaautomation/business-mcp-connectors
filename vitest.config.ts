import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@quvantic/mcp-core": `${root}packages/core/src/index.ts`,
      "@quvantic/mcp-hubspot": `${root}packages/hubspot/src/index.ts`,
      "@quvantic/mcp-clickup": `${root}packages/clickup/src/index.ts`,
      "@quvantic/mcp-sheets": `${root}packages/sheets/src/index.ts`,
      "@quvantic/mcp-notion": `${root}packages/notion/src/index.ts`,
      "@quvantic/mcp-workflow": `${root}packages/workflow/src/index.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["packages/*/test/**/*.test.ts"],
    restoreMocks: true,
  },
});
