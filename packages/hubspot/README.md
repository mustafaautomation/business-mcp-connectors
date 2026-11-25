# @quvantic/mcp-hubspot

Stdio MCP server for HubSpot contacts, companies, deals, and notes.

Portfolio demo, not client work. Sandbox records are fictional.

```bash
MCP_MODE=sandbox npx mcp-hubspot
```

From this repo, after `pnpm build`:

```bash
node packages/hubspot/dist/cli.js --sandbox
node packages/hubspot/dist/cli.js --live --read-only
```

## Tools

| Tool                               | Access |
| ---------------------------------- | ------ |
| `search_contacts`, `get_contact`   | read   |
| `create_contact`, `update_contact` | write  |
| `search_companies`, `get_company`  | read   |
| `create_company`, `update_company` | write  |
| `search_deals`, `get_deal`         | read   |
| `create_deal`, `update_deal`       | write  |
| `list_notes`                       | read   |
| `create_note`                      | write  |

`MCP_READ_ONLY=true` or `--read-only` refuses every write.

## Live mode

`HUBSPOT_ACCESS_TOKEN` is a private-app token.

Scopes:

- `crm.objects.contacts.read`
- `crm.objects.contacts.write`
- `crm.objects.companies.read`
- `crm.objects.companies.write`
- `crm.objects.deals.read`
- `crm.objects.deals.write`

Notes use HubSpot-defined association type ids: contact `202`, company `190`, deal `214`. If the private-app screen lists a separate notes scope, grant read and write there too.

Deal search filters on the `dealstage` id. The default closed-won stage is `closedwon`. The workflow also reads `company` and `contact_email` when those properties exist, and otherwise looks up the company association on `get_deal`.
