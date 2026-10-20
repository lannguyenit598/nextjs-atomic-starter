<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules

- Architecture and dependency rules: `docs/architecture.md`. Component placement: `docs/component-guidelines.md`.
- `src/components/**` is a domain-free design system; business code lives in `src/features/<name>/`. ESLint enforces the import boundaries.
- Server Components by default; `'use client'` only on interactive leaves.
- Server Actions re-validate input with the feature's Zod schema and return `ActionResult`.
- Data access goes through the feature repository (`services/*-repository.ts`), never `fetch` in components.
- Before finishing: `pnpm check && pnpm build`.
