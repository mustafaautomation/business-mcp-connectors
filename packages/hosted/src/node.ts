import type { IncomingMessage, ServerResponse } from "node:http";
import { handleMcpRequest, handleSandboxRequest } from "./http.js";

type NodeRequest = IncomingMessage & { body?: unknown };

function headerRecord(headers: IncomingMessage["headers"]): Headers {
  const out = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    out.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return out;
}

async function readBody(req: NodeRequest): Promise<string | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  if (req.body !== undefined) {
    return typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function toWebRequest(req: NodeRequest): Promise<Request> {
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `https://${host}`);
  const body = await readBody(req);
  return new Request(url, {
    method: req.method,
    headers: headerRecord(req.headers),
    body: body === undefined || body === "" ? undefined : body,
  });
}

async function writeNodeResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  res.end(bytes);
}

export async function handleMcpNode(req: NodeRequest, res: ServerResponse): Promise<void> {
  await writeNodeResponse(res, await handleMcpRequest(await toWebRequest(req)));
}

export async function handleSandboxNode(req: NodeRequest, res: ServerResponse): Promise<void> {
  await writeNodeResponse(res, await handleSandboxRequest(await toWebRequest(req)));
}
