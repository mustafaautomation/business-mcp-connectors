import { Logger } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { createSheetsClient, SANDBOX_SPREADSHEET_ID } from "../src/index.js";

const logger = new Logger("test", () => {});

function client(readOnly = false) {
  return createSheetsClient({ mode: "sandbox", readOnly, logger });
}

describe("sheets sandbox", () => {
  it("reads a bounded range and finds a column", async () => {
    const sheets = client();
    const range = await sheets.readRange({ range: "Pipeline!A1:D2" });
    expect(range.values).toEqual([
      ["Deal", "Stage", "Amount", "Owner"],
      ["Lumenfield Q2 launch site", "contractsent", "18500", "Maya Okonkwo"],
    ]);
    const found = await sheets.findRows({ range: "Pipeline!A:D", query: "kiln", column: "Deal" });
    expect(found.matches.map((match) => match.row)).toEqual([3]);
    expect(found.spreadsheetId).toBe(SANDBOX_SPREADSHEET_ID);
  });

  it("appends under the header on Won Deals", async () => {
    const sheets = client();
    const appended = await sheets.appendRows({
      range: "Won Deals!A:F",
      values: [
        [
          "2026-11-25T15:04Z",
          "Harbor & Co. — Analytics Retainer",
          "Harbor & Co.",
          48000,
          "a@harborandco.example",
          "86f0new01",
        ],
      ],
    });
    expect(appended.updatedRange).toBe("Won Deals!A2:F2");
    expect(appended.values[0]?.[3]).toBe("48000");
    const read = await sheets.readRange({ range: "Won Deals" });
    expect(read.values).toHaveLength(2);
  });

  it("rejects a bad range and blocks appends when read-only", async () => {
    const sheets = client(true);
    await expect(sheets.readRange({ range: "Missing!A1" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(sheets.appendRows({ range: "Pipeline", values: [["x"]] })).rejects.toMatchObject({
      code: "READ_ONLY",
    });
  });
});
