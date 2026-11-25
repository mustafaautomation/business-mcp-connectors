import { Logger } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { createNotionClient } from "../src/index.js";

const logger = new Logger("test", () => {});

describe("notion live", () => {
  it("sends the version header and a select filter", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const client = createNotionClient({
      mode: "live",
      token: "ntn_test",
      env: {},
      logger,
      sleep: async () => undefined,
      fetch: async (input, init) => {
        const url = String(input);
        calls.push({ url, init: init ?? {} });
        if (url.endsWith("/databases/db_clients")) {
          return Response.json({
            id: "db_clients",
            title: [{ plain_text: "Clients" }],
            properties: { Name: { type: "title" }, Status: { type: "select" } },
          });
        }
        if (url.endsWith("/query")) {
          return Response.json({
            results: [
              {
                id: "page_harbor",
                url: "https://www.notion.so/page_harbor",
                parent: { type: "database_id", database_id: "db_clients" },
                properties: {
                  Name: { type: "title", title: [{ plain_text: "Harbor & Co." }] },
                  Status: { type: "select", select: { name: "Active" } },
                },
              },
            ],
            next_cursor: null,
          });
        }
        return Response.json({ results: [], next_cursor: "cur_2" });
      },
    });
    const rows = await client.queryDatabase({
      databaseId: "db_clients",
      filterProperty: "Status",
      filterValue: "Active",
    });
    expect(new Headers(calls[0]?.init.headers).get("notion-version")).toBe("2022-06-28");
    expect(new Headers(calls[0]?.init.headers).get("authorization")).toBe("Bearer ntn_test");
    const query = JSON.parse(String(calls[1]?.init.body)) as {
      filter: { select: { equals: string } };
    };
    expect(query.filter.select.equals).toBe("Active");
    expect(rows.items[0]?.title).toBe("Harbor & Co.");
    expect(rows.items[0]?.properties.Status).toBe("Active");
  });

  it("flattens block children when reading a page", async () => {
    const client = createNotionClient({
      mode: "live",
      token: "ntn_test",
      env: {},
      logger,
      sleep: async () => undefined,
      fetch: async (input) => {
        const url = String(input);
        if (url.includes("/blocks/")) {
          return Response.json({
            results: [
              { type: "heading_1", heading_1: { rich_text: [{ plain_text: "Kickoff" }] } },
              { type: "paragraph", paragraph: { rich_text: [{ plain_text: "Send the agenda." }] } },
            ],
            has_more: false,
          });
        }
        return Response.json({
          id: "page_playbook",
          url: "https://www.notion.so/page_playbook",
          parent: { type: "workspace" },
          properties: { title: { type: "title", title: [{ plain_text: "Onboarding playbook" }] } },
        });
      },
    });
    const page = await client.readPage("page_playbook");
    expect(page.content).toBe("# Kickoff\nSend the agenda.");
    expect(page.parent).toEqual({ type: "workspace" });
  });
});
