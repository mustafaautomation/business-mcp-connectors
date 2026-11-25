# @quvantic/mcp-workflow

When a HubSpot deal is `closedwon`, create four ClickUp onboarding tasks, append a row to Google Sheets, and write a note back on the deal.

Portfolio demo, not client work. The default sandbox deal is Harbor & Co. — Analytics Retainer.

```bash
node packages/workflow/dist/cli.js
```

The run is safe to repeat against the same clients: a deal that already has an `[mcp] Onboarding started` note is skipped.

Live mode uses `HUBSPOT_ACCESS_TOKEN`, `CLICKUP_API_TOKEN`, `CLICKUP_LIST_ID`, `GOOGLE_SHEETS_ACCESS_TOKEN`, and `GOOGLE_SHEETS_SPREADSHEET_ID`.

Task names:

1. Send kickoff agenda
2. Provision workspace access
3. Schedule stakeholder interviews
4. Deliver week-1 success plan
