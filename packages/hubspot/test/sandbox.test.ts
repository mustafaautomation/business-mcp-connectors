import { Logger, SANDBOX_CLOCK } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { createHubspotClient } from "../src/index.js";

const logger = new Logger("test", () => {});

function client(readOnly = false) {
  return createHubspotClient({
    mode: "sandbox",
    readOnly,
    logger,
    now: () => new Date(SANDBOX_CLOCK),
  });
}

describe("hubspot sandbox", () => {
  it("finds Amina and paginates contacts", async () => {
    const hubspot = client();
    const found = await hubspot.searchContacts({ query: "AMINA" });
    expect(found.items.map((row) => row.email)).toEqual(["amina.shah@harborandco.example"]);
    const page = await hubspot.searchContacts({ limit: 2 });
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBe("2");
    const next = await hubspot.searchContacts({ limit: 2, cursor: page.nextCursor });
    expect(next.items[0]?.id).toBe("103");
  });

  it("creates, updates, and refuses duplicate emails", async () => {
    const hubspot = client();
    const created = await hubspot.createContact({
      email: "New.Person@Example.com",
      firstName: "New",
      company: "Example Co",
    });
    expect(created.id).toBe("900");
    expect(created.email).toBe("new.person@example.com");
    expect(created.createdAt).toBe(SANDBOX_CLOCK);
    const updated = await hubspot.updateContact(created.id, { jobTitle: "Buyer" });
    expect(updated.jobTitle).toBe("Buyer");
    await expect(
      hubspot.createContact({ email: "amina.shah@harborandco.example" }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(hubspot.getContact("missing")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns closed-won deals and can move a stage", async () => {
    const hubspot = client();
    const won = await hubspot.searchDeals({ stage: "closedwon", limit: 10 });
    expect(won.items.map((row) => row.id)).toEqual(["501", "505"]);
    const moved = await hubspot.updateDeal("502", { stage: "closedwon" });
    expect(moved.stage).toBe("closedwon");
  });

  it("creates a note on a deal and lists it", async () => {
    const hubspot = client();
    const note = await hubspot.createNote({
      body: "Kickoff booked.",
      objectType: "deal",
      objectId: "501",
    });
    const notes = await hubspot.listNotes({ objectType: "deal", objectId: "501" });
    expect(notes.items.map((row) => row.id)).toContain(note.id);
    expect(notes.items.map((row) => row.id)).toContain("801");
    await expect(
      hubspot.createNote({ body: "nope", objectType: "deal", objectId: "missing" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("blocks writes in read-only mode", async () => {
    const hubspot = client(true);
    const before = (await hubspot.searchContacts({ limit: 100 })).items.length;
    await expect(hubspot.createContact({ email: "blocked@example.com" })).rejects.toMatchObject({
      code: "READ_ONLY",
    });
    expect((await hubspot.searchContacts({ limit: 100 })).items.length).toBe(before);
  });
});
