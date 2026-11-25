import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const esbuildDir = readdirSync(path.join(root, "node_modules/.pnpm")).find((name) =>
  name.startsWith("esbuild@"),
);
if (!esbuildDir) throw new Error("esbuild is not installed");
const esbuild = require(`./node_modules/.pnpm/${esbuildDir}/node_modules/esbuild/lib/main.js`);

const out = process.argv[2];
if (!out) {
  process.stderr.write("Usage: node scripts/bundle-vercel.mjs <output-dir>\n");
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(path.join(out, "api"), { recursive: true });

const banner =
  "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);";

await esbuild.build({
  entryPoints: {
    mcp: path.join(root, "scripts/vercel-entries/mcp.ts"),
    sandbox: path.join(root, "scripts/vercel-entries/sandbox.ts"),
  },
  absWorkingDir: root,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outdir: path.join(out, "api"),
  entryNames: "[name]",
  banner: { js: banner },
  legalComments: "none",
  logLevel: "info",
});

cpSync(path.join(root, "site/dist"), out, { recursive: true });

writeFileSync(
  path.join(out, "package.json"),
  `${JSON.stringify(
    {
      name: "business-mcp-connectors-demo",
      private: true,
      type: "module",
      description:
        "Read-only sandbox MCP demo. Static site plus bundled /mcp and /api/sandbox functions.",
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  path.join(out, "vercel.json"),
  `${JSON.stringify(
    {
      framework: null,
      buildCommand: "",
      installCommand: "",
      outputDirectory: ".",
      rewrites: [{ source: "/mcp", destination: "/api/mcp" }],
      functions: {
        "api/mcp.js": { maxDuration: 10 },
        "api/sandbox.js": { maxDuration: 10 },
      },
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  path.join(out, "DEPLOY.md"),
  `# Deploy the sandbox demo

This folder is a self-contained Vercel project. The API handlers are bundled. There is no install step and no monorepo.

## Vercel

1. Create a project from this folder (dashboard upload, or \`vercel deploy --prebuilt\` is not required — a normal deploy of this directory is enough).
2. Framework preset: Other.
3. Leave Build Command and Install Command empty. Output directory is the project root.
4. Node.js 20 or newer. The functions are ESM and use only the Node runtime.
5. Add the domain \`mcp-connectors.quvantic.com\`.

## What is public

- \`/\` the landing page. Asset URLs are relative.
- \`GET /api/sandbox\` lists read-only sandbox tools and example arguments.
- \`POST /api/sandbox\` with \`{"tool":"hubspot_search_deals","arguments":{"stage":"closedwon"}}\` runs one read.
- \`POST /mcp\` is stateless Streamable HTTP (JSON responses, no session, no SSE). \`GET /mcp\` returns a short description so a health check does not hold the function open.
- Writes are not registered. No tokens are read. Data is the fiction fixtures.

Hobby functions are capped at 10 seconds. These calls finish in memory.
`,
);
