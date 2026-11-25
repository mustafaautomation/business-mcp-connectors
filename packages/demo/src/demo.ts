import { createClickupServer } from "@quvantic/mcp-clickup";
import { Logger, readToolJson, SANDBOX_CLOCK, withInMemoryClient } from "@quvantic/mcp-core";
import { createHubspotServer } from "@quvantic/mcp-hubspot";
import { createNotionServer } from "@quvantic/mcp-notion";
import { createSheetsServer } from "@quvantic/mcp-sheets";
import { runDealWonOnboarding } from "@quvantic/mcp-workflow";

const clay = (text: string) => `\x1b[38;5;173m${text}\x1b[0m`;
const pine = (text: string) => `\x1b[38;5;108m${text}\x1b[0m`;
const dim = (text: string) => `\x1b[2m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

function money(amount: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

interface ToolCaller {
  callTool(params: { name: string; arguments?: Record<string, unknown> }): Promise<unknown>;
}

function caller(client: object): ToolCaller {
  return client as ToolCaller;
}

async function tool<T>(
  client: ToolCaller,
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const result = await client.callTool({ name, arguments: args });
  return readToolJson(
    result as { content?: ReadonlyArray<{ type: string; text?: string }>; isError?: boolean },
  ) as T;
}

export async function runDemo(): Promise<string[]> {
  const logger = new Logger("demo", () => {});
  const options = { mode: "sandbox" as const, logger };
  const hubspot = createHubspotServer(options);
  const clickup = createClickupServer(options);
  const sheets = createSheetsServer(options);
  const notion = createNotionServer(options);
  const lines: string[] = [];

  await withInMemoryClient(hubspot.server, async (hubspotClient) => {
    await withInMemoryClient(clickup.server, async (clickupClient) => {
      await withInMemoryClient(sheets.server, async (sheetsClient) => {
        await withInMemoryClient(notion.server, async (notionClient) => {
          lines.push(bold("quvantic business-mcp-connectors"));
          lines.push(dim("sandbox · four stdio servers · one in-memory client"));
          lines.push("");

          const deals = await tool<{ items: { id: string; name: string; amount: string }[] }>(
            caller(hubspotClient),
            "search_deals",
            { stage: "closedwon" },
          );
          lines.push(`${clay("→")} hubspot.search_deals  ${dim("stage=closedwon")}`);
          for (const deal of deals.items) {
            lines.push(`  ${deal.id}  ${deal.name}  ${money(deal.amount)}`);
          }
          lines.push("");

          const lists = await tool<{ id: string; name: string; taskCount: number }[]>(
            caller(clickupClient),
            "list_lists",
          );
          lines.push(`${clay("→")} clickup.list_lists`);
          for (const list of lists) {
            lines.push(
              `  ${list.id.padEnd(18)} ${list.name.padEnd(22)} ${dim(`${list.taskCount} tasks`)}`,
            );
          }
          lines.push("");

          const pipeline = await tool<{ values: string[][] }>(caller(sheetsClient), "read_range", {
            range: "Pipeline!A2:C5",
          });
          lines.push(`${clay("→")} sheets.read_range  ${dim("Pipeline!A2:C5")}`);
          for (const row of pipeline.values) {
            lines.push(`  ${(row[0] ?? "").padEnd(32)} ${row[1] ?? ""}  ${money(row[2] ?? "")}`);
          }
          lines.push("");

          const search = await tool<{ items: { object: string; title: string }[] }>(
            caller(notionClient),
            "search",
            { query: "onboarding", filter: "page" },
          );
          lines.push(`${clay("→")} notion.search  ${dim("query=onboarding")}`);
          for (const hit of search.items) lines.push(`  ${hit.object}  ${hit.title}`);
          lines.push("");

          const workflow = await runDealWonOnboarding({
            hubspot: hubspot.client,
            clickup: clickup.client,
            sheets: sheets.client,
            now: () => new Date(SANDBOX_CLOCK),
          });
          lines.push(`${clay("→")} workflow  ${dim("deal won → ClickUp tasks → sheet row")}`);
          for (const deal of workflow.deals) {
            lines.push(`  ${bold(deal.dealName)}`);
            for (const task of deal.tasks) lines.push(`    ${pine("task")}  ${task.name}`);
            lines.push(`    ${pine("sheet")} ${deal.sheet.updatedRange}`);
          }
          lines.push("");

          const won = await tool<{ values: string[][] }>(caller(sheetsClient), "read_range", {
            range: "Won Deals!A1:B4",
          });
          lines.push(`${clay("→")} sheets.read_range  ${dim("Won Deals!A1:B4")}`);
          for (const row of won.values)
            lines.push(`  ${(row[0] ?? "").padEnd(20)} ${row[1] ?? ""}`);
          lines.push("");

          const taskCount = workflow.deals.reduce((sum, deal) => sum + deal.tasks.length, 0);
          lines.push(
            pine(
              `done · ${workflow.deals.length} deals · ${taskCount} tasks · ${workflow.deals.length} sheet rows`,
            ),
          );
        });
      });
    });
  });

  return lines;
}
