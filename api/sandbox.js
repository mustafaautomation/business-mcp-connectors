import { handleSandboxNode } from "../packages/hosted/dist/node.js";

export default function handler(req, res) {
  return handleSandboxNode(req, res);
}
