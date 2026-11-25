import { Logger } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { createNotionClient } from "../src/index.js";

const logger = new Logger("test", () => {});

function client(readOnly = false) {
  return createNotionClient({ mode: "sandbox", readOnly, logger });
}

describe("notion sandbox", () => {
  it("searches the playbook and queries active clients", async () => {
    const notion = client();
    const found = await notion.search({ query: "onboarding" });
    expect(found.items.map((item) => item.title)).toContain("Onboarding playbook");
    const page = await notion.readPage("page_playbook");
    expect(page.content).toContain("kickoff agenda");
    const database = await notion.readDatabase("db_clients");
    expect(database.properties.Status).toBe("select");
    const active = await notion.queryDatabase({
      databaseId: "db_clients",
      filterProperty: "Status",
      filterValue: "active",
    });
    expect(active.items.map((item) => item.id)).toEqual(["page_harbor"]);
  });

  it("creates a page under a database and blocks writes when read-only", async () => {
    const notion = client();
    const created = await notion.createPage({
      parentDatabaseId: "db_clients",
      title: "Brightsail Travel",
      content: "Proposal in review.",
      properties: { Status: "Proposal", Owner: "Samir Haddad" },
    });
    expect(created.id).toBe("page_new_1");
    expect(created.properties.Name).toBe("Brightsail Travel");
    expect(created.properties.Status).toBe("Proposal");
    const locked = client(true);
    await expect(
      locked.createPage({ parentPageId: "page_playbook", title: "Nope" }),
    ).rejects.toMatchObject({ code: "READ_ONLY" });
  });
});
