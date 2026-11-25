import { Logger, readToolJson, withInMemoryClient } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { createHubspotServer, HUBSPOT_TOOL_NAMES } from "../src/index.js";

const logger = new Logger("test", () => {});

describe("hubspot mcp", () => {
  it("lists the documented tools and searches deals", async () => {
    const { server } = createHubspotServer({ mode: "sandbox", logger });
    await withInMemoryClient(server, async (client) => {
      const listed = await client.listTools();
      expect(listed.tools.map((tool) => tool.name).sort()).toEqual([...HUBSPOT_TOOL_NAMES].sort());
      const result = await client.callTool({
        name: "search_deals",
        arguments: { stage: "closedwon" },
      });
      const body = readToolJson(result) as { items: { id: string }[] };
      expect(body.items.map((row) => row.id)).toEqual(["501", "505"]);
    });
  });

  it("returns a tool error for writes in read-only mode", async () => {
    const { server } = createHubspotServer({ mode: "sandbox", readOnly: true, logger });
    await withInMemoryClient(server, async (client) => {
      const result = await client.callTool({
        name: "create_contact",
        arguments: { email: "blocked@example.com" },
      });
      expect(result.isError).toBe(true);
      expect(readToolJson({ ...result, isError: false })).toMatchObject({ code: "READ_ONLY" });
    });
  });
});
