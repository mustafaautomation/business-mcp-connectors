# @quvantic/mcp-core

Shared runtime for the Quvantic business MCP connectors.

Portfolio demo, not client work.

## What it owns

- `sandbox` or `live` mode (`MCP_MODE`, `--sandbox`, `--live`)
- a global read-only switch (`MCP_READ_ONLY`, `--read-only`)
- `requestJson` with timeouts and retries on 429 and 5xx
- cursor pagination helpers
- stderr JSON logs that redact authorization headers, bearer tokens, and token query params
- MCP tool registration that turns `ConnectorError` into a tool error result

Logs go to stderr so a stdio MCP server can keep stdout for the protocol.

## Install

This package is part of the `business-mcp-connectors` monorepo. It is publish-ready and is not published from the demo.
