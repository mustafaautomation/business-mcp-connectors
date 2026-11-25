export interface SandboxExample {
  tool: string;
  label: string;
  arguments: Record<string, unknown>;
}

/** Presets the landing page offers. Every one is a read against the fiction fixtures. */
export const SANDBOX_EXAMPLES: SandboxExample[] = [
  {
    tool: "hubspot_search_deals",
    label: "HubSpot · won deals",
    arguments: { stage: "closedwon" },
  },
  {
    tool: "hubspot_get_contact",
    label: "HubSpot · Amina Shah",
    arguments: { id: "101" },
  },
  {
    tool: "clickup_list_lists",
    label: "ClickUp · lists",
    arguments: {},
  },
  {
    tool: "clickup_get_task",
    label: "ClickUp · signed SOW",
    arguments: { taskId: "86f0onb01" },
  },
  {
    tool: "sheets_read_range",
    label: "Sheets · pipeline",
    arguments: { range: "Pipeline!A1:D5" },
  },
  {
    tool: "sheets_find_rows",
    label: "Sheets · find Amina",
    arguments: { range: "Contacts!A:D", query: "Amina", column: "Name" },
  },
  {
    tool: "notion_search",
    label: "Notion · onboarding",
    arguments: { query: "onboarding", filter: "page" },
  },
  {
    tool: "notion_query_database",
    label: "Notion · active clients",
    arguments: { databaseId: "db_clients", filterProperty: "Status", filterValue: "Active" },
  },
];
