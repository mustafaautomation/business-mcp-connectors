# @quvantic/mcp-notion

Stdio MCP server for Notion search, pages, and databases.

Portfolio demo, not client work.

## Tools

| Tool             | Access |
| ---------------- | ------ |
| `search`         | read   |
| `read_page`      | read   |
| `read_database`  | read   |
| `query_database` | read   |
| `create_page`    | write  |

## Live mode

`NOTION_API_TOKEN` is an internal integration token. Notion capabilities to enable:

- Read content
- Update content
- Insert content

Share every page and database the server should see with that integration. The client sends `Notion-Version: 2022-06-28`.

`query_database` builds a filter from the database schema: `contains` for text, url, and email; `equals` for select, status, number, and checkbox. Extra properties on `create_page` are sent as rich text. The title uses `titleProperty`, which defaults to `Name` inside a database.
