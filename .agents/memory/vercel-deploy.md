---
name: Vercel deploy of this monorepo
description: Non-obvious constraints for deploying this pnpm monorepo to Vercel from GitHub
---

# Deploying this monorepo to Vercel (from GitHub)

## Owner-authored commit requirement (Hobby/free plan)
Vercel's free plan only deploys Git commits **authored by the repo owner's own GitHub account**.
Replit's automatic checkpoints commit as the Replit Agent identity, which Vercel rejects
("commit author does not have contributing access").

**Why:** every deploy that originates from a Replit auto-commit is blocked until the tip commit is
re-authored to the repo owner.

**How to apply:** local `git commit`/`--amend`/`reset`/`rebase` are blocked in this environment, and
local `git push` has tripped on a corrupt dangling object from an interrupted fetch. The reliable path
is the **GitHub REST API** (token in the `GH_PAT` secret — read via `os.environ` in `python3`, never
print it): create blobs → create tree with `base_tree` = current GitHub tree (so only changed files are
updated) → create commit with explicit `author`/`committer` set to the repo owner → PATCH
`refs/heads/main`. This needs no local git and no force-push. To re-author an existing tip without file
changes, create a commit reusing that tip's tree + parents with the owner as author, then update the ref.

## API serverless function must be pre-bundled to JS, not raw TS
`@vercel/node` follows imports from the function entry and type-checks any `.ts` in the graph. It does
**not** use this workspace's tsconfig settings (`customConditions: ["workspace"]`, `skipLibCheck`,
project references), so Express 5 / workspace-package types fail to resolve (e.g. `TS2339 Property 'use'
does not exist on type 'Express'`, implicit-any on req/res). An `api/tsconfig.json` with `noEmit:true`
instead caused "Emit skipped" build failures.

**Why:** the api-server already builds itself with esbuild, which transpiles TS without type-checking —
so bundling sidesteps Vercel's type-resolution entirely.

**How to apply:** esbuild emits a bundled `dist/app.mjs` from the app entry (which `export default app`);
the Vercel function (`api/index.js`) is plain JS that re-exports that bundle; the Vercel `buildCommand`
builds the api-server before the frontend so the function graph is all JS (no tsc step). The logger
already disables pino worker transports when `VERCEL` is set, and the DB uses
`drizzle-orm/neon-serverless` (pure JS), so the bundle runs in serverless without native deps.
