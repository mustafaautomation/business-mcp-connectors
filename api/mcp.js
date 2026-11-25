import { handleMcpNode } from "../packages/hosted/dist/node.js";

export default function handler(req, res) {
  return handleMcpNode(req, res);
}
