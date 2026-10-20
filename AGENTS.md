<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Atomic Design Next.js Starter: agent instructions

Reusable Next.js 16 (App Router, Cache Components) + React 19 + strict TypeScript + Tailwind 4 template for admin, internal, SaaS and REST-backed apps. These instructions bind every agent (Claude Code, Codex, Antigravity, OpenCode). Human docs are under `docs/`.

## Architecture

Hybrid **Atomic Design** (shared UI) + **feature modules** (business code). Import direction only flows downward:

```text
src/app/            routing + page composition      → features, components, config, lib
src/features/<f>/   one business domain             → components, lib (relative imports inside <f>)
src/components/     domain-free design system       → lib, lower Atomic levels
src/lib/            technical infrastructure        → nothing above it
```

Atomic Design is a composition model, not a mandatory five-layer hierarchy; an Atomic "Page" is `app/**/page.tsx`, an Atomic "Template" is not `layout.tsx`.

## Non-negotiable rules

1. Business concepts live in `src/features/<f>/`; `src/components/` stays domain-free (R-ATOM-1, R-FEAT-1/2, lint-enforced).
2. Server Components by default; `'use client'` only on interactive leaves; client code never imports `server-only` modules (R-NX-2/3).
3. Request-time data is read inside `<Suspense>`, awaiting `searchParams`/`connection()` before session or data reads (R-NX-5).
4. Every Server Action starts with `requireSession('<feature>:write')`, then validates input with Zod, returns `ActionResult` (R-SEC-1, R-NX-7).
5. REST mode stays fail-closed: `resolveSession()` defaults to `null`, `backendRequest()` requires a session, `AUTH_ALLOW_ANONYMOUS` defaults to `false` (R-SEC-3/6).
6. Untrusted input goes through Zod; ids in backend URLs use the allowlist schema (R-SEC-4, R-TS-2).
7. Data access only through the feature repository; no `fetch` in components (R-FEAT-4).
8. Existing dependencies and native APIs first; a new package needs a written justification (R-DEP-1…4).
9. Report only checks you actually ran (R-TEST-1). Commit or push only when explicitly asked.
10. Write code comments, docs, rules and skills in English; `README.vi.md` is the only Vietnamese file and mirrors `README.md` (R-TS-8).

## Workflow

1. Pick the matching skill: skills are listed by your agent from `.agents/skills/` (Claude Code: `.claude/skills/`, generated adapters). Tasks without a skill (bug fix, adding a dependency): `docs/ai/workflows.md`.
2. Read the rule file for the area you change before editing it:
   - routes, rendering, caching → `docs/ai/rules/nextjs.md`
   - components, folders, imports → `docs/ai/rules/architecture.md`
   - types, validation, errors → `docs/ai/rules/typescript.md`
   - actions, auth, env, headers → `docs/ai/rules/security.md`
   - packages → `docs/ai/rules/dependencies.md`
   - tests, what to run → `docs/ai/rules/testing.md`
3. Make the smallest change that meets the requirement; follow the patterns in `src/features/tasks/`.
4. Verify per the table in `docs/ai/rules/testing.md`.

## Verification

`pnpm check` (typecheck, lint, format, unit tests, agent config) is the minimum for any code change. Add `pnpm build`, `pnpm test:e2e`, `pnpm build-storybook` as the testing rules require. After editing `.agents/` run `pnpm agents:sync`.
