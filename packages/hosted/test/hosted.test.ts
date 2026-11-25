import { describe, expect, it } from "vitest";
import {
  callHostedTool,
  handleMcpRequest,
  handleSandboxRequest,
  listHostedTools,
} from "../src/index.js";

describe("hosted sandbox", () => {
  it("publishes only read tools, prefixed by connector", () => {
    const names = listHostedTools().map((tool) => tool.name);
    expect(names).toContain("hubspot_search_deals");
    expect(names).toContain("clickup_list_lists");
    expect(names).toContain("sheets_read_range");
    expect(names).toContain("notion_search");
    expect(
      names.some(
        (name) => name.includes("create") || name.includes("update") || name.includes("append"),
      ),
    ).toBe(false);
  });

  it("runs a sandbox read and rejects an unknown tool", async () => {
    const deals = (await callHostedTool("hubspot_search_deals", { stage: "closedwon" })) as {
      items: { id: string }[];
    };
    expect(deals.items.map((deal) => deal.id)).toEqual(["501", "505"]);
    await expect(
      callHostedTool("hubspot_create_contact", { email: "a@b.example" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("answers GET /mcp with a short description", async () => {
    const response = await handleMcpRequest(new Request("https://demo.example/mcp"));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { name: string; readOnly: boolean };
    expect(body.name).toBe("quvantic-sandbox");
    expect(body.readOnly).toBe(true);
  });

  it("serves tools/call over stateless Streamable HTTP", async () => {
    const init = await handleMcpRequest(
      new Request("https://demo.example/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "test", version: "0.0.0" },
          },
        }),
      }),
    );
    expect(init.status).toBe(200);
    const initBody = (await init.json()) as { result: { serverInfo: { name: string } } };
    expect(initBody.result.serverInfo.name).toBe("quvantic-sandbox");

    const call = await handleMcpRequest(
      new Request("https://demo.example/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "mcp-protocol-version": "2025-03-26",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "hubspot_search_deals", arguments: { stage: "closedwon" } },
        }),
      }),
    );
    expect(call.status).toBe(200);
    const callBody = (await call.json()) as { result: { content: { text: string }[] } };
    const payload = JSON.parse(callBody.result.content[0]?.text ?? "{}") as {
      items: { id: string }[];
    };
    expect(payload.items.map((deal) => deal.id)).toEqual(["501", "505"]);
  });

  it("serves the try-a-tool JSON API", async () => {
    const catalog = await handleSandboxRequest(new Request("https://demo.example/api/sandbox"));
    const listed = (await catalog.json()) as { examples: { tool: string }[] };
    expect(listed.examples[0]?.tool).toBe("hubspot_search_deals");

    const response = await handleSandboxRequest(
      new Request("https://demo.example/api/sandbox", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tool: "notion_search",
          arguments: { query: "onboarding", filter: "page" },
        }),
      }),
    );
    const body = (await response.json()) as { ok: boolean; result: { items: { title: string }[] } };
    expect(body.ok).toBe(true);
    expect(body.result.items.map((item) => item.title)).toContain("Onboarding playbook");
  });
});
