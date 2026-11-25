# @quvantic/mcp-clickup

Stdio MCP server for ClickUp lists, tasks, and comments.

Portfolio demo, not client work.

```bash
node packages/clickup/dist/cli.js
```

## Tools

| Tool                         | Access |
| ---------------------------- | ------ |
| `list_lists`, `get_list`     | read   |
| `list_tasks`, `get_task`     | read   |
| `create_task`, `update_task` | write  |
| `list_comments`              | read   |
| `create_comment`             | write  |

## Live mode

`CLICKUP_API_TOKEN` is a personal token from ClickUp Settings → Apps. Send it as the raw `Authorization` value. ClickUp does not use OAuth scopes on personal tokens; the token has that user's permissions.

`list_lists` also needs `CLICKUP_TEAM_ID` (workspace id) or `CLICKUP_SPACE_ID`. The deal-won workflow needs `CLICKUP_LIST_ID` in live mode.

In live mode, `list_tasks` cursors are 0-based ClickUp page indexes.
