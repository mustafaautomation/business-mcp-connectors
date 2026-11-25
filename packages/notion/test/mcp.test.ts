import { Logger, withInMemoryClient } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { createNotionServer, NOTION_TOOL_NAMES } from "../src/index.js";

const logger = new Logger("test", () => {});

describe("notion mcp", () => {
  it("lists tools and refuses create_page when read-only", async () => {
    const { server } = createNotionServer({ mode: "sandbox", readOnly: true, logger });
    await withInMemoryClient(server, async (client) => {
      const listed = await client.listTools();
      expect(listed.tools.map((tool) => tool.name).sort()).toEqual([...NOTION_TOOL_NAMES].sort());
      const result = await client.callTool({
        name: "create_page",
        arguments: { parentPageId: "page_playbook", title: "Nope" },
      });
      expect(result.isError).toBe(true);
    });
  });
});
