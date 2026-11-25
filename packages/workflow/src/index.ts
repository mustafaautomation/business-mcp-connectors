import { type ClickupClient, createClickupClient, type Priority } from "@quvantic/mcp-clickup";
import {
  type ClientOptions,
  ConnectorError,
  type Page,
  requireEnv,
  resolveMode,
} from "@quvantic/mcp-core";
import {
  createHubspotClient,
  type Deal,
  type HubspotClient,
  type Note,
} from "@quvantic/mcp-hubspot";
import {
  createSheetsClient,
  SANDBOX_SPREADSHEET_ID,
  type SheetsClient,
} from "@quvantic/mcp-sheets";

const MARKER = "[mcp] Onboarding started";

const TASKS: {
  name: string;
  days: number;
  priority: Priority;
  description: (company: string, deal: string) => string;
}[] = [
  {
    name: "Send kickoff agenda",
    days: 1,
    priority: "high",
    description: (company, deal) =>
      `Send a 30-minute kickoff agenda for ${deal}. Confirm attendees at ${company}.`,
  },
  {
    name: "Provision workspace access",
    days: 1,
    priority: "high",
    description: (company) => `Open the project workspace and invite the ${company} operators.`,
  },
  {
    name: "Schedule stakeholder interviews",
    days: 3,
    priority: "normal",
    description: (company) =>
      `Book three interviews with the ${company} team that will use the work.`,
  },
  {
    name: "Deliver week-1 success plan",
    days: 5,
    priority: "normal",
    description: (_company, deal) => `Write the week-1 plan for ${deal} and send it after kickoff.`,
  },
];

export interface WorkflowTask {
  id: string;
  name: string;
  dueDate: string | null;
}

export interface ProcessedDeal {
  dealId: string;
  dealName: string;
  company: string;
  amount: string;
  contactEmail: string;
  tasks: WorkflowTask[];
  sheet: { spreadsheetId: string; updatedRange: string; row: string[] };
  noteId: string;
}

export interface SkippedDeal {
  dealId: string;
  dealName: string;
  reason: string;
}

export interface WorkflowResult {
  mode: "sandbox" | "live";
  deals: ProcessedDeal[];
  skipped: SkippedDeal[];
}

export interface WorkflowOptions extends ClientOptions {
  hubspot?: HubspotClient;
  clickup?: ClickupClient;
  sheets?: SheetsClient;
  dealId?: string;
  listId?: string;
  spreadsheetId?: string;
  range?: string;
}

function addDays(date: Date, days: number): string {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy.toISOString().slice(0, 10);
}

async function collectNotes(hubspot: HubspotClient, dealId: string): Promise<Note[]> {
  const notes: Note[] = [];
  let cursor: string | undefined;
  do {
    const page: Page<Note> = await hubspot.listNotes({
      objectType: "deal",
      objectId: dealId,
      limit: 100,
      cursor,
    });
    notes.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return notes;
}

async function loadDeals(hubspot: HubspotClient, dealId: string | undefined): Promise<Deal[]> {
  if (dealId) {
    const deal = await hubspot.getDeal(dealId);
    if (deal.stage !== "closedwon") {
      throw new ConnectorError(
        "VALIDATION",
        `Deal ${deal.id} is ${deal.stage || "unset"}, not closedwon.`,
      );
    }
    return [deal];
  }
  const deals: Deal[] = [];
  let cursor: string | undefined;
  do {
    const page = await hubspot.searchDeals({ stage: "closedwon", limit: 100, cursor });
    deals.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return deals;
}

export async function runDealWonOnboarding(options: WorkflowOptions = {}): Promise<WorkflowResult> {
  const hubspot = options.hubspot ?? createHubspotClient(options);
  const clickup = options.clickup ?? createClickupClient(options);
  const sheets = options.sheets ?? createSheetsClient(options);
  const mode = hubspot.mode;
  const env = options.env ?? process.env;
  const now = options.now ?? (() => new Date());
  const listId =
    options.listId ?? (mode === "sandbox" ? "list_onboarding" : requireEnv("CLICKUP_LIST_ID", env));
  const spreadsheetId =
    options.spreadsheetId ??
    (mode === "sandbox" ? SANDBOX_SPREADSHEET_ID : requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID", env));
  const range = options.range ?? "Won Deals!A:F";
  const deals = await loadDeals(hubspot, options.dealId);
  const result: WorkflowResult = { mode, deals: [], skipped: [] };

  for (const deal of deals) {
    const notes = await collectNotes(hubspot, deal.id);
    const marker = `${MARKER} for deal ${deal.id}`;
    if (notes.some((note) => note.body.includes(marker))) {
      result.skipped.push({
        dealId: deal.id,
        dealName: deal.name,
        reason: "Onboarding note already exists.",
      });
      continue;
    }
    const company = deal.company || "Unknown company";
    const tasks: WorkflowTask[] = [];
    for (const template of TASKS) {
      const created = await clickup.createTask({
        listId,
        name: template.name,
        description: template.description(company, deal.name),
        priority: template.priority,
        dueDate: addDays(now(), template.days),
        tags: ["onboarding"],
        status: "to do",
      });
      tasks.push({ id: created.id, name: created.name, dueDate: created.dueDate });
    }
    const row = [
      `${now().toISOString().slice(0, 16)}Z`,
      deal.name,
      company,
      deal.amount,
      deal.contactEmail,
      tasks.map((task) => task.id).join(" "),
    ];
    const sheet = await sheets.appendRows({ spreadsheetId, range, values: [row] });
    const note = await hubspot.createNote({
      objectType: "deal",
      objectId: deal.id,
      timestamp: now().toISOString(),
      body: `${marker}. ClickUp tasks: ${tasks.map((task) => task.id).join(", ")}.`,
    });
    result.deals.push({
      dealId: deal.id,
      dealName: deal.name,
      company,
      amount: deal.amount,
      contactEmail: deal.contactEmail,
      tasks,
      sheet: { spreadsheetId, updatedRange: sheet.updatedRange, row },
      noteId: note.id,
    });
  }
  return result;
}

export function describeWorkflowMode(options: WorkflowOptions = {}): "sandbox" | "live" {
  return options.hubspot?.mode ?? resolveMode(options);
}
