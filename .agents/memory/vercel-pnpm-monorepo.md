---
name: Vercel + pnpm monorepo deployment
description: How to correctly deploy a Vite static site from a pnpm monorepo subdirectory to Vercel
---

## The rule

When a Vite app lives in a monorepo subdirectory (e.g. `artifacts/transactease/`) and Vercel clones the repo root:

- Set `"framework": "vite"` in `vercel.json` — NOT `null`. `null` causes Vercel to treat the output as a Node.js server and search for `app.js/index.js/server.js` instead of `index.html`.
- Set `"outputDirectory": "dist"` (repo root, not the subdirectory path).
- In `vite.config.ts`, make `outDir` conditional: output to `../../dist` (repo root) during `npm_lifecycle_event === "build"`, and to local `dist` during dev.
- Do NOT set a custom `installCommand` in `vercel.json` — Vercel auto-detects pnpm from `pnpm-lock.yaml`.
- Add `"packageManager": "pnpm@X.Y.Z"` to root `package.json` so corepack activates the right version.

## Why

Vercel's `framework: "vite"` preset looks for `index.html` at the repo root's `dist/`. If the Vite app outputs to a subdirectory like `artifacts/transactease/dist/`, Vercel won't find it even if `outputDirectory` explicitly points there — the framework preset wins.

## How to apply

Any time this monorepo deploys a new Vite artifact to Vercel, replicate this pattern:
1. `vercel.json` → `framework: "vite"`, `outputDirectory: "dist"`, explicit `buildCommand` using pnpm filter
2. `vite.config.ts` → conditional `outDir` using `isBuilding` flag
3. Root `package.json` → `packageManager` field set to exact pnpm version from `pnpm --version`
