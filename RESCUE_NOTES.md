# Rescued from Cursor

Source: business-mcp-connectors | Cursor https://cursor.com/agents/bc-21116c0a-9076-5485-952b-14f43ade5169
Scope: All Commits
Captured: 2026-11-25T12:33:54.697Z
Files written: 144

Not in this copy: files Cursor's template created and the agent never changed (e.g. tsconfig, shadcn ui components, lockfiles, public assets) when scope is 'Last Agent Turn'; binaries.

- binary not recoverable from diff view: docs/demo.gif
- binary not recoverable from diff view: site/public/demo.gif
- binary not recoverable from diff view: site/public/og.png
- lockfile incomplete, regenerate: pnpm-lock.yaml

## Repair pass (2026-11-25, Claude)

Status: GREEN locally (Node 25.6.1, pnpm 10.33.4 as pinned in packageManager).

Note: the site is a Vite + React app (not Next). Its shadcn-style ui components
(`site/src/components/ui/*`), `lib/utils.ts`, `data.ts`, tsconfig files and `components.json`
were all present in the rescue, so nothing had to be recreated by hand.

- `pnpm-lock.yaml` regenerated with `pnpm install`; `pnpm install --frozen-lockfile` passes.
- `pnpm lint` (Biome) clean, 139 files. `pnpm typecheck` clean (tsc -b + site tsc).
- `pnpm test`: 56/56 passed in 16 files (the only failure before repair was the test that
  requires `docs/demo.gif` > 10 KB).
- `pnpm build` OK (packages + site/dist). `node scripts/bundle-vercel.mjs <dir>` also bundles.
- `docs/demo.gif` re-recorded for real with `vhs docs/demo.tape` (unchanged tape); copied to
  `site/public/demo.gif` (the landing page loads it from there).
- `site/public/og.png` regenerated as a real 1200x630 headless-Chrome screenshot of the built
  landing page (`vite preview`); no script in the repo for it.
- No source code changes were needed.

Not verified here: GitHub Actions (repo not on GitHub yet) and a Vercel deploy.
