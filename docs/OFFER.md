# I will build MCP connectors for your business tools

Portfolio demo, not client work. The Harbor & Co. records in this repo are fiction. This page is a paste-ready Upwork proposal and Fiverr gig for Mustafa ([GitHub](https://github.com/mustafaautomation)). The sample servers are HubSpot, ClickUp, Google Sheets, and Notion. A client engagement uses your real objects and scopes.

Market context for this offer: recent Upwork posts for a small read-only MCP server and for AI agents with MCP and voice integration were listed around $20–48/hr. The packages below are fixed scope so a buyer can see what lands, not an open hourly meter.

## Upwork proposal

I build MCP servers that sit between Claude, Cursor, or another MCP client and the tools your team already pays for.

You get a stdio server per system, with a read-only switch, sandbox fixtures so we can demo before any token exists, and a live mode that uses a least-privilege API token. Shared code covers retries, pagination, and logs that do not print secrets. I hand over the Claude Desktop, Claude Code, and Cursor config, plus tests.

A working sample is the business-mcp-connectors repo: HubSpot, ClickUp, Google Sheets, and Notion, and a workflow that turns a won deal into onboarding tasks and a sheet row. Happy to scope the same shape around your stack.

## Fiverr gig

**Title:** I will build MCP connectors for your business tools

**Tags:** MCP, Claude, Cursor, HubSpot, API integration

**Gallery:** terminal demo of the sandbox workflow, plus the architecture diagram from the README.

### Packages

#### Starter — $400

One read-only connector, up to 8 tools. Sandbox fixtures with realistic records, live mode on your token, and a config snippet for Claude Desktop, Claude Code, or Cursor. Short README with the scopes the token needs.

Typical Fiverr delivery window: 4 days.

#### Growth — $900

One read/write connector (up to 14 tools) or two read-only connectors. Includes the read-only flag, retries, redacted logs, vitest coverage for sandbox and mocked live HTTP, and scope notes. One round of tool-name revisions.

Typical Fiverr delivery window: 7 days.

#### Ops workflow — $1,800

Up to three connectors, read and write, plus one cross-tool workflow (for example: deal won → tasks → a sheet or database row). Sandbox demo, live tokens, tests, client configs, and a handoff note that lists every env var. One revision of the workflow steps.

Typical Fiverr delivery window: 14 days.

Add-ons, quoted after a look at the API: extra tools beyond the package, OAuth instead of a static token, an HTTP transport in addition to stdio, or a voice-agent hookup that calls the same tools.

## What I need from you

- The systems and the exact actions the model should take.
- Whether production must be read-only.
- A token with the minimum scopes, created by you. I do not ask for passwords.
- One sample record I can use while wiring live mode, or permission to test against sandbox data only.

## FAQ

**Is this sample a client project?**
No. Portfolio demo, not client work. Names such as Harbor & Co. and Northline Studio are made up.

**Do you need my password or a seat in the workspace?**
No. Create a private app, personal token, or internal integration and share the minimum pages or boards. Put the token in an environment variable. The servers do not write tokens into logs.

**Can the server be read-only?**
Yes. `MCP_READ_ONLY=true` or `--read-only` refuses every write tool and leaves the reads in place.

**Which clients do you set up?**
Claude Desktop, Claude Code, and Cursor. The transport is stdio, which those three already speak. Other MCP clients that spawn a local process work the same way.

**What if the vendor API changes?**
Tools return a stable JSON shape rather than a raw vendor payload. If a field moves, the adapter changes and the tests say so. I do not promise to monitor the API after handoff unless we agree a retainer.

**Will you publish the server to npm?**
Only if you ask. The sample packages are publish-ready and have not been published.

**Can you add a tool that is not on the list?**
Yes, inside the package's tool count, as long as the vendor API supports it. Destructive actions stay behind the read-only switch.

**Do you store customer data?**
The sandbox keeps fixtures in memory. Live mode calls the vendor and returns the result to the MCP client. Nothing in this design sends those payloads to a third server of mine.
