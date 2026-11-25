import type { IncomingMessage, ServerResponse } from "node:http";
import { handleSandboxNode } from "../../packages/hosted/src/node.ts";

export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleSandboxNode(req, res);
}
