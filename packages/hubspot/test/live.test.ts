import { Logger } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { createHubspotClient } from "../src/index.js";

const logger = new Logger("test", () => {});

function harness(handler: (url: string, init: RequestInit) => Response, readOnly = false) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    const request = init ?? {};
    calls.push({ url, init: request });
    return handler(url, request);
  };
  const client = createHubspotClient({
    mode: "live",
    readOnly,
    token: "pat-test-token",
    env: {},
    logger,
    fetch: fetchImpl,
    sleep: async () => undefined,
  });
  return { client, calls };
}

describe("hubspot live", () => {
  it("requires a token", () => {
    expect(() => createHubspotClient({ mode: "live", env: {}, logger })).toThrow(
      /HUBSPOT_ACCESS_TOKEN/,
    );
  });

  it("searches contacts with a bearer token", async () => {
    const { client, calls } = harness(() =>
      Response.json({
        results: [
          {
            id: "101",
            properties: {
              email: "amina.shah@harborandco.example",
              firstname: "Amina",
              lastname: "Shah",
              company: "Harbor & Co.",
              jobtitle: "VP Operations",
              phone: null,
              lifecyclestage: "customer",
            },
            createdAt: "2026-10-12T15:00:00.000Z",
            updatedAt: "2026-10-12T15:00:00.000Z",
          },
        ],
        paging: { next: { after: "2" } },
      }),
    );
    const page = await client.searchContacts({ query: "amina", limit: 2 });
    expect(calls[0]?.url).toBe("https://api.hubapi.com/crm/v3/objects/contacts/search");
    expect(new Headers(calls[0]?.init.headers).get("authorization")).toBe("Bearer pat-test-token");
    const body = JSON.parse(String(calls[0]?.init.body)) as { query: string; limit: number };
    expect(body.query).toBe("amina");
    expect(body.limit).toBe(2);
    expect(page.items[0]?.email).toBe("amina.shah@harborandco.example");
    expect(page.nextCursor).toBe("2");
  });

  it("fills a deal company from the association", async () => {
    const { client, calls } = harness((url) => {
      if (url.includes("/associations/companies")) {
        return Response.json({ results: [{ toObjectId: 201 }] });
      }
      if (url.includes("/companies/201")) {
        return Response.json({ id: "201", properties: { name: "Harbor & Co." } });
      }
      return Response.json({
        id: "501",
        properties: {
          dealname: "Harbor & Co. — Analytics Retainer",
          amount: "48000",
          dealstage: "closedwon",
          company: null,
        },
      });
    });
    const deal = await client.getDeal("501");
    expect(deal.company).toBe("Harbor & Co.");
    expect(calls.map((call) => call.url)).toHaveLength(3);
  });

  it("creates a note with the deal association type", async () => {
    const { client, calls } = harness(() =>
      Response.json({
        id: "850",
        properties: { hs_note_body: "Started", hs_timestamp: "2026-11-25T15:04:00.000Z" },
      }),
    );
    const note = await client.createNote({ body: "Started", objectType: "deal", objectId: "501" });
    const body = JSON.parse(String(calls[0]?.init.body)) as {
      associations: { types: { associationTypeId: number }[] }[];
    };
    expect(calls[0]?.url).toBe("https://api.hubapi.com/crm/v3/objects/notes");
    expect(body.associations[0]?.types[0]?.associationTypeId).toBe(214);
    expect(note.associations).toEqual([{ type: "deal", id: "501" }]);
  });

  it("maps 401 to AUTH and does not write when read-only", async () => {
    const { client } = harness(() => Response.json({ message: "nope" }, { status: 401 }));
    await expect(client.getContact("1")).rejects.toMatchObject({ code: "AUTH", status: 401 });
    const readOnly = harness(() => {
      throw new Error("should not fetch");
    }, true);
    await expect(readOnly.client.createContact({ email: "a@b.example" })).rejects.toMatchObject({
      code: "READ_ONLY",
    });
    expect(readOnly.calls).toHaveLength(0);
  });
});
