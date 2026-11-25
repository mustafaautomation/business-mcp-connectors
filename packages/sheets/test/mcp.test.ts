import { Logger, readToolJson, withInMemoryClient } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { createSheetsServer, SHEETS_TOOL_NAMES } from "../src/index.js";

const logger = new Logger("test", () => {});

describe("sheets mcp", () => {
  it("lists tools and reads the pipeline", async () => {
    const { server } = createSheetsServer({ mode: "sandbox", logger });
    await withInMemoryClient(server, async (client) => {
      const listed = await client.listTools();
      expect(listed.tools.map((tool) => tool.name).sort()).toEqual([...SHEETS_TOOL_NAMES].sort());
      const result = await client.callTool({
        name: "read_range",
        arguments: { range: "Contacts!A1:A2" },
      });
      const body = readToolJson(result) as { values: string[][] };
      expect(body.values[0]?.[0]).toBe("Name");
      expect(body.values[1]?.[0]).toBe("Amina Shah");
    });
  });
});
