# Contributing

Portfolio demo, not client work. Issues and pull requests that improve the sample are welcome. Client engagements are described in [docs/OFFER.md](docs/OFFER.md).

## Local loop

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm demo
```

Node 20 or newer. The repo pins pnpm via `packageManager`.

## Adding a tool

1. Add the method to the sandbox client and the live client so both modes return the same JSON shape.
2. Register it in the package `tools.ts` with `readOnly: true` or `false`.
3. Cover the sandbox path and a mocked `fetch` for the live URL, auth header, and error mapping.
4. Put the tool name in the package README table and the root README table.

Write tools must call `assertWritable`. The hosted server only republishes tools marked read-only.

## Secrets

Do not commit `.env` files or tokens. `.env.example` lists the variable names with empty values. Logs must stay free of authorization headers and bearer tokens. If a bug report needs a payload, replace tokens and real customer data with the sandbox records.

## Commits

Use a short imperative subject and say what changed for someone reading the history later.
