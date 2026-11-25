import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { CLICKUP_TOOL_NAMES } from "@quvantic/mcp-clickup";
import { HUBSPOT_TOOL_NAMES } from "@quvantic/mcp-hubspot";
import { NOTION_TOOL_NAMES } from "@quvantic/mcp-notion";
import { SHEETS_TOOL_NAMES } from "@quvantic/mcp-sheets";
import { describe, expect, it } from "vitest";
import { runDemo } from "../src/demo.js";

const root = resolve(import.meta.dirname, "../../..");

describe("sandbox demo", () => {
  it("calls tools on every connector and runs the workflow", async () => {
    const text = (await runDemo()).join("\n");
    expect(text).toContain("hubspot.search_deals");
    expect(text).toContain("Harbor & Co. — Analytics Retainer");
    expect(text).toContain("clickup.list_lists");
    expect(text).toContain("notion.search");
    expect(text).toContain("Onboarding playbook");
    expect(text).toContain("Send kickoff agenda");
    expect(text).toContain("done · 2 deals · 8 tasks · 2 sheet rows");
  });
});

describe("portfolio surface", () => {
  const readme = readFileSync(resolve(root, "README.md"), "utf8");
  const offer = readFileSync(resolve(root, "docs/OFFER.md"), "utf8");
  const site = readFileSync(resolve(root, "site/src/data.ts"), "utf8");
  const names = [
    ...HUBSPOT_TOOL_NAMES,
    ...CLICKUP_TOOL_NAMES,
    ...SHEETS_TOOL_NAMES,
    ...NOTION_TOOL_NAMES,
  ];

  it("keeps the tool list in the README and the landing page", () => {
    for (const name of names) {
      expect(readme).toContain(name);
      expect(site).toContain(name);
    }
    expect(names).toHaveLength(30);
  });

  it("marks the work as a portfolio demo", () => {
    for (const text of [readme, offer, site]) {
      expect(text).toContain("Portfolio demo, not client work");
    }
    expect(offer).toContain("I will build MCP connectors for your business tools");
    expect(offer).toContain("$400");
    expect(offer).toContain("$900");
    expect(offer).toContain("$1,800");
    expect(readme).toContain("```mermaid");
  });

  it("ships client configs and the demo gif", () => {
    for (const name of ["claude-desktop.mcp.json", "claude-code.mcp.json", "cursor.mcp.json"]) {
      const file = resolve(root, "docs/clients", name);
      const parsed = JSON.parse(readFileSync(file, "utf8")) as {
        mcpServers: Record<string, { command: string }>;
      };
      expect(Object.keys(parsed.mcpServers).sort()).toEqual([
        "clickup",
        "hubspot",
        "notion",
        "sheets",
      ]);
    }
    const gif = resolve(root, "docs/demo.gif");
    expect(existsSync(gif)).toBe(true);
    expect(statSync(gif).size).toBeGreaterThan(10_000);
  });
});
