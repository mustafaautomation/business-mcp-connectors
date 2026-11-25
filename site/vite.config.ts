import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { type Connect, defineConfig, type PreviewServer, type ViteDevServer } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

async function readRawBody(req: Connect.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sandboxMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url ?? "";
    const pathOnly = url.split("?")[0] ?? "";
    if (pathOnly !== "/mcp" && pathOnly !== "/api/sandbox") {
      next();
      return;
    }
    try {
      const hosted = await import("../packages/hosted/dist/http.js");
      const body =
        req.method === "GET" || req.method === "HEAD" ? undefined : await readRawBody(req);
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
      const request = new Request(new URL(url, "http://127.0.0.1:44721"), {
        method: req.method,
        headers,
        body,
      });
      const response =
        pathOnly === "/mcp"
          ? await hosted.handleMcpRequest(request)
          : await hosted.handleSandboxRequest(request);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          ok: false,
          error: {
            code: "INTERNAL",
            message: error instanceof Error ? error.message : "Sandbox failed.",
          },
        }),
      );
    }
  };
}

function attachSandbox(server: ViteDevServer | PreviewServer): void {
  server.middlewares.use(sandboxMiddleware());
}

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "quvantic-sandbox",
      configureServer: attachSandbox,
      configurePreviewServer: attachSandbox,
    },
  ],
  resolve: {
    alias: { "@": path.resolve(root, "src") },
  },
  server: { host: "0.0.0.0", port: 44721, strictPort: true },
  preview: { host: "0.0.0.0", port: 44721, strictPort: true },
});
