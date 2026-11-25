import { Logger } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { createSheetsClient } from "../src/index.js";

const logger = new Logger("test", () => {});

describe("sheets live", () => {
  it("appends with a bearer token and finds inside the read window", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const client = createSheetsClient({
      mode: "live",
      token: "ya29.test",
      env: { GOOGLE_SHEETS_SPREADSHEET_ID: "sheet_123" },
      logger,
      sleep: async () => undefined,
      fetch: async (input, init) => {
        const url = String(input);
        calls.push({ url, init: init ?? {} });
        if (url.includes(":append")) {
          return Response.json({ updates: { updatedRange: "Won Deals!A2:F2", updatedRows: 1 } });
        }
        return Response.json({
          range: "Pipeline!A1:D2",
          values: [
            ["Deal", "Stage", "Amount", "Owner"],
            ["Lumenfield Q2 launch site", "contractsent", "18500", "Maya Okonkwo"],
          ],
        });
      },
    });
    const found = await client.findRows({
      range: "Pipeline!A1:D10",
      query: "lumen",
      column: "Deal",
    });
    expect(found.matches).toHaveLength(1);
    expect(found.matches[0]?.row).toBe(2);
    const appended = await client.appendRows({
      range: "Won Deals!A:F",
      values: [["2026-11-25", "Harbor", "Harbor & Co.", "48000", "a@harborandco.example", "t1"]],
    });
    expect(appended.updatedRange).toBe("Won Deals!A2:F2");
    expect(new Headers(calls[0]?.init.headers).get("authorization")).toBe("Bearer ya29.test");
    expect(calls[1]?.url).toContain("/spreadsheets/sheet_123/values/");
    expect(calls[1]?.url).toContain(":append");
    expect(calls[1]?.url).toContain("valueInputOption=USER_ENTERED");
  });

  it("does not call the API for a read-only append", async () => {
    const client = createSheetsClient({
      mode: "live",
      token: "ya29.test",
      env: { GOOGLE_SHEETS_SPREADSHEET_ID: "sheet_123" },
      readOnly: true,
      logger,
      fetch: async () => {
        throw new Error("should not fetch");
      },
    });
    await expect(client.appendRows({ range: "Pipeline", values: [["x"]] })).rejects.toMatchObject({
      code: "READ_ONLY",
    });
  });
});
