import { Logger, readToolJson, withInMemoryClient } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { CLICKUP_TOOL_NAMES, createClickupServer } from "../src/index.js";

const logger = new Logger("test", () => {});

describe("clickup mcp", () => {
  it("lists tools and reads a list", async () => {
    const { server } = createClickupServer({ mode: "sandbox", logger });
    await withInMemoryClient(server, async (client) => {
      const listed = await client.listTools();
      expect(listed.tools.map((tool) => tool.name).sort()).toEqual([...CLICKUP_TOOL_NAMES].sort());
      const result = await client.callTool({
        name: "get_list",
        arguments: { listId: "list_onboarding" },
      });
      const body = readToolJson(result) as { name: string };
      expect(body.name).toBe("Client onboarding");
    });
  });

  it("rejects comments in read-only mode", async () => {
    const { server } = createClickupServer({ mode: "sandbox", readOnly: true, logger });
    await withInMemoryClient(server, async (client) => {
      const result = await client.callTool({
        name: "create_comment",
        arguments: { taskId: "86f0onb01", comment: "nope" },
      });
      expect(result.isError).toBe(true);
    });
  });
});
