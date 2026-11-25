# @quvantic/mcp-sheets

Stdio MCP server for Google Sheets: read a range, append rows, and find cells.

Portfolio demo, not client work. The sandbox workbook is `revenue-ops`.

## Tools

| Tool          | Access |
| ------------- | ------ |
| `read_range`  | read   |
| `find_rows`   | read   |
| `append_rows` | write  |

## Live mode

`GOOGLE_SHEETS_ACCESS_TOKEN` is an OAuth access token.

Scope: `https://www.googleapis.com/auth/spreadsheets`

Read-only deployments can use `https://www.googleapis.com/auth/spreadsheets.readonly`, which cannot append.

`GOOGLE_SHEETS_SPREADSHEET_ID` is the default spreadsheet when a tool call omits `spreadsheetId`. Share that spreadsheet with the token's account.

`find_rows` reads the requested range and searches those cells. Header names work when the range includes row 1.
