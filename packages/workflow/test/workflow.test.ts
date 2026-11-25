import { createClickupClient } from "@quvantic/mcp-clickup";
import { SANDBOX_CLOCK } from "@quvantic/mcp-core";
import { createHubspotClient } from "@quvantic/mcp-hubspot";
import { createSheetsClient } from "@quvantic/mcp-sheets";
import { describe, expect, it } from "vitest";
import { runDealWonOnboarding } from "../src/index.js";

const now = () => new Date(SANDBOX_CLOCK);

function clients(readOnly = false) {
  return {
    hubspot: createHubspotClient({ mode: "sandbox", readOnly }),
    clickup: createClickupClient({ mode: "sandbox", readOnly }),
    sheets: createSheetsClient({ mode: "sandbox", readOnly }),
    now,
  };
}

describe("deal won onboarding", () => {
  it("creates tasks, a sheet row, and a note for each won deal", async () => {
    const deps = clients();
    const result = await runDealWonOnboarding(deps);
    expect(result.mode).toBe("sandbox");
    expect(result.deals.map((deal) => deal.dealId)).toEqual(["501", "505"]);
    expect(result.skipped).toEqual([]);
    expect(result.deals[0]?.tasks.map((task) => task.name)).toEqual([
      "Send kickoff agenda",
      "Provision workspace access",
      "Schedule stakeholder interviews",
      "Deliver week-1 success plan",
    ]);
    expect(result.deals[0]?.tasks[0]?.dueDate).toBe("2026-11-26");
    expect(result.deals[0]?.sheet.row[1]).toBe("Harbor & Co. — Analytics Retainer");
    expect(result.deals[0]?.sheet.updatedRange).toBe("Won Deals!A2:F2");
    expect(result.deals[1]?.sheet.updatedRange).toBe("Won Deals!A3:F3");
    const again = await runDealWonOnboarding(deps);
    expect(again.deals).toEqual([]);
    expect(again.skipped.map((deal) => deal.dealId)).toEqual(["501", "505"]);
    const notes = await deps.hubspot.listNotes({ objectType: "deal", objectId: "501" });
    expect(
      notes.items.some((note) => note.body.includes("[mcp] Onboarding started for deal 501")),
    ).toBe(true);
  });

  it("refuses a deal that is not closed-won and blocks a read-only run", async () => {
    const deps = clients();
    await expect(runDealWonOnboarding({ ...deps, dealId: "502" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(runDealWonOnboarding({ ...deps, dealId: "nope" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(runDealWonOnboarding(clients(true))).rejects.toMatchObject({ code: "READ_ONLY" });
  });
});
