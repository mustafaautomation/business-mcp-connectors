import type { IncomingMessage, ServerResponse } from "node:http";
import { handleMcpNode } from "../../packages/hosted/src/node.ts";

export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return handleMcpNode(req, res);
}
