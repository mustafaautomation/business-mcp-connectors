export const disclaimer = "Portfolio demo, not client work";

export const githubUrl = "https://github.com/mustafaautomation/business-mcp-connectors";

export const connectors = [
  {
    id: "hubspot",
    name: "HubSpot",
    bin: "mcp-hubspot",
    summary: "Contacts, companies, deals, and notes on the CRM v3 API.",
    scopes: "crm.objects.contacts, companies, and deals, read and write.",
    reads: [
      "search_contacts",
      "get_contact",
      "search_companies",
      "get_company",
      "search_deals",
      "get_deal",
      "list_notes",
    ],
    writes: [
      "create_contact",
      "update_contact",
      "create_company",
      "update_company",
      "create_deal",
      "update_deal",
      "create_note",
    ],
  },
  {
    id: "clickup",
    name: "ClickUp",
    bin: "mcp-clickup",
    summary: "Lists, tasks, and comments. Personal token, raw Authorization header.",
    scopes: "The token carries that user's permissions. list_lists needs a team or space id.",
    reads: ["list_lists", "get_list", "list_tasks", "get_task", "list_comments"],
    writes: ["create_task", "update_task", "create_comment"],
  },
  {
    id: "sheets",
    name: "Google Sheets",
    bin: "mcp-sheets",
    summary: "Read a range, find cells, append rows. Sandbox workbook: revenue-ops.",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
    reads: ["read_range", "find_rows"],
    writes: ["append_rows"],
  },
  {
    id: "notion",
    name: "Notion",
    bin: "mcp-notion",
    summary: "Search, read a page or database, query rows, create a page.",
    scopes: "Read content, Update content, Insert content. Share each parent with the integration.",
    reads: ["search", "read_page", "read_database", "query_database"],
    writes: ["create_page"],
  },
] as const;

export const packages = [
  {
    name: "Starter",
    price: "$400",
    detail:
      "One read-only connector, up to 8 tools, sandbox fixtures, and a config for one client.",
  },
  {
    name: "Growth",
    price: "$900",
    detail:
      "One read/write connector or two read-only ones, tests, retries, and the read-only flag.",
  },
  {
    name: "Ops workflow",
    price: "$1,800",
    detail:
      "Up to three connectors plus one cross-tool workflow, sandbox and live, with a handoff note.",
  },
] as const;

export const faqs = [
  {
    q: "Is the Harbor & Co. pipeline a real client?",
    a: "No. Portfolio demo, not client work. The companies, people, and amounts are fiction on .example addresses.",
  },
  {
    q: "Do you need a password?",
    a: "No. Live mode takes a private-app token, a ClickUp personal token, a Sheets access token, or a Notion integration token. Logs redact authorization headers.",
  },
  {
    q: "Can production stay read-only?",
    a: "Yes. MCP_READ_ONLY=true or --read-only refuses every write tool and leaves search and read in place.",
  },
  {
    q: "Which clients does the stdio server fit?",
    a: "Claude Desktop, Claude Code, and Cursor. The snippets are in docs/clients.",
  },
] as const;

export const offerLine = "I will build MCP connectors for your business tools";

export const clientConfig = `{
  "mcpServers": {
    "hubspot": {
      "command": "node",
      "args": ["ABSOLUTE_PATH/packages/hubspot/dist/cli.js"],
      "env": { "MCP_MODE": "sandbox" }
    },
    "clickup": {
      "command": "node",
      "args": ["ABSOLUTE_PATH/packages/clickup/dist/cli.js"],
      "env": { "MCP_MODE": "sandbox" }
    },
    "sheets": {
      "command": "node",
      "args": ["ABSOLUTE_PATH/packages/sheets/dist/cli.js"],
      "env": { "MCP_MODE": "sandbox" }
    },
    "notion": {
      "command": "node",
      "args": ["ABSOLUTE_PATH/packages/notion/dist/cli.js"],
      "env": { "MCP_MODE": "sandbox" }
    }
  }
}`;

export const clientTargets = [
  {
    id: "cursor",
    label: "Cursor",
    where: ".cursor/mcp.json",
  },
  {
    id: "claude-code",
    label: "Claude Code",
    where: ".mcp.json in the project",
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    where: "claude_desktop_config.json",
  },
] as const;
