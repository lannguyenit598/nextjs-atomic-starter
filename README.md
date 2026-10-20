# Atomic Design Next.js Template

**English** | [Tiếng Việt](README.vi.md)

A starter template for production Next.js projects: admin dashboards, internal tools, SaaS apps and management systems backed by a REST API.

Architecture: **Hybrid Atomic Design + Feature-Based**.

- **Atomic Design** organizes the shared UI components (the design system).
- **Feature modules** organize business functionality.

---

## Tech stack

| Area      | Libraries                                                                                            | Why                                               |
| --------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Framework | Next.js 16 (App Router, Cache Components), React 19, strict TypeScript                               | Server Components, Server Actions, streaming      |
| Styling   | Tailwind CSS 4, CSS variables (design tokens), `class-variance-authority`, `clsx` + `tailwind-merge` | Centralized tokens, typed variants                |
| Icons     | `lucide-react`                                                                                       | Lightweight, tree-shakable                        |
| Forms     | Native `<form>` + Zod 4                                                                              | One schema for both client and server validation  |
| Data      | Native `fetch` + typed client (`src/lib/api`)                                                        | No extra library; works on both server and client |
| Testing   | Vitest, React Testing Library, Playwright                                                            | Unit/component + E2E                              |
| Quality   | ESLint (next + boundaries), Prettier, Husky + lint-staged, GitHub Actions                            |                                                   |
| Docs UI   | Storybook 10 (`@storybook/nextjs-vite`, a11y addon)                                                  | Build and review components in isolation          |

**Deliberately not used:**

- **A full UI library** (MUI, Ant Design...). Components are written in-house and live in the repo.
- **A headless library for dialogs.** The native `<dialog>` element is used: the browser handles focus trapping, Escape and focus return.
- **TanStack Query.** The demo only needs Server Components + Server Actions. For when to add it, see [docs/api-integration.md](docs/api-integration.md) (section "Client-side fetching").
- **Global state** (Redux/Zustand). There is no real need yet; filter state lives in the URL.
- **ESLint 10 / TypeScript 6+.** The plugins in `eslint-config-next` 16.4 don't support them yet (peer dependencies). The template stays on ESLint 9 and TypeScript 5.9.

## Requirements

- Node.js `^22.22.2`, `^24.15.0` or `>=26` (constrained by Vitest, jsdom and lint-staged). The version shared by local and CI is in `.nvmrc` (24); run `nvm use` or `fnm use` to select it.
- pnpm (version pinned in the `packageManager` field of `package.json`). Install it via Corepack:

```bash
corepack enable   # once per machine; afterwards `pnpm` uses the project's version
```

## Install and run

```bash
pnpm install
cp .env.example .env.local     # optional: demo mode is the default
pnpm dev                       # http://localhost:3000
```

### Environment

| Variable               | Scope  | Default        | Meaning                                                                                |
| ---------------------- | ------ | -------------- | -------------------------------------------------------------------------------------- |
| `API_MODE`             | server | `demo`         | `demo` = in-memory data, `rest` = call a real backend                                  |
| `API_BASE_URL`         | server | (none)         | Required when `API_MODE=rest`                                                          |
| `API_TOKEN`            | server | (none)         | Service token, sent as `Authorization: Bearer` (server-side only)                      |
| `API_TIMEOUT_MS`       | server | `10000`        | Timeout per request                                                                    |
| `AUTH_ALLOW_ANONYMOUS` | server | `false`        | **Dangerous.** `true` = skip sign-in in `API_MODE=rest`; only behind a VPN/SSO gateway |
| `NEXT_PUBLIC_APP_NAME` | public | `Atomic Admin` | App name, inlined into the browser bundle                                              |

- Env is validated with Zod in `src/lib/env.ts`. `src/instrumentation.ts` runs this check when the server starts: an invalid configuration makes the process exit with code 1 and a clear message.
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. **Never** put secrets in them.

## Scripts

| Command                                   | What it does                                                     |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                                | Dev server (Turbopack)                                           |
| `pnpm build` / `pnpm start`               | Production build / run the build                                 |
| `pnpm typecheck`                          | Generate route types + `tsc --noEmit`                            |
| `pnpm lint` / `pnpm lint:fix`             | ESLint (including the layer dependency rules)                    |
| `pnpm format` / `pnpm format:check`       | Prettier (sorts Tailwind classes automatically)                  |
| `pnpm test` / `pnpm test:watch`           | Vitest                                                           |
| `pnpm test:e2e`                           | Playwright (first time: `pnpm exec playwright install chromium`) |
| `pnpm storybook` / `pnpm build-storybook` | Storybook at http://localhost:6006                               |
| `pnpm check`                              | typecheck + lint + format:check + test + agents:check            |
| `pnpm agents:sync` / `pnpm agents:check`  | Generate/validate AI agent config (see `docs/ai/README.md`)      |

A pre-commit hook (Husky + lint-staged) runs ESLint and Prettier on staged files.

## Project structure

```text
src/
├── app/                      # ROUTING ONLY: routes, layouts, loading/error, metadata
│   ├── layout.tsx            # Root layout: fonts, theme script, globals.css
│   ├── not-found.tsx
│   ├── global-error.tsx      # Last-resort error boundary (root layout errors)
│   ├── globals.css           # Design tokens (CSS variables) + Tailwind theme
│   └── (app)/                # Route group: screens that use DashboardTemplate
│       ├── layout.tsx        # Plugs organisms into DashboardTemplate
│       ├── error.tsx         # Error boundary that keeps the shell
│       ├── dashboard/page.tsx
│       └── tasks/page.tsx
├── components/               # SHARED DESIGN SYSTEM (no business logic)
│   ├── atoms/                # Button, Input, Select, Badge, Card, Spinner, Skeleton...
│   ├── molecules/            # FormField, SearchInput, Dialog, ConfirmationDialog, Pagination...
│   ├── organisms/            # AppSidebar, AppHeader, MobileNav, DataTable
│   └── templates/            # DashboardTemplate
├── features/                 # BUSINESS FEATURES
│   └── tasks/
│       ├── schemas.ts        # Zod schemas = the domain's source of truth
│       ├── types.ts          # Types inferred from schemas + TaskRepository contract
│       ├── constants.ts      # Labels, status → badge mapping
│       ├── actions.ts        # Server Actions (mutations)
│       ├── services/         # Data access: demo adapter, REST adapter, selector
│       └── components/       # Feature-specific UI: TaskTable, TaskForm...
├── lib/                      # Shared infrastructure, independent of features
│   ├── api/http-client.ts    # Typed fetch: timeout, ApiError, response validation
│   ├── api/backend.ts        # server-only: calls the backend with base URL + token
│   ├── auth.ts               # server-only: Session, getSession(), requireSession() (fail-closed)
│   ├── auth-provider.ts      # resolveSession(): sign-in provider integration point
│   ├── env.ts                # server-only env (Zod)
│   ├── action-result.ts      # Standard Server Action return type
│   ├── theme.ts              # Light/dark theme
│   └── utils.ts              # cn(), formatDate()
├── config/                   # navigation.tsx, site.ts
├── instrumentation.ts        # Runs on server start: validates env (fail fast)
├── instrumentation-client.ts # Runs in the browser before hydration: Zod config for the CSP
└── test/                     # Vitest setup
e2e/                          # Playwright specs; fixtures.ts fails any test with a CSP violation
docs/                         # Architecture docs and guides; docs/ai/ = rules for AI agents
.agents/                      # Shared AI agent skills + scoped rules (source)
.claude/                      # Generated from .agents/ for Claude Code (pnpm agents:sync)
scripts/                      # sync-agent-config.mjs
.storybook/                   # Storybook config
.github/workflows/ci.yml      # CI
```

There is no `src/hooks/`, `src/providers/` or `src/types/` yet because no code needs them. Create them when needed, following the rules in [docs/architecture.md](docs/architecture.md) (section "Dependency rules").

## Testing

```bash
pnpm test                 # unit + component (jsdom)
pnpm exec playwright install chromium   # once
pnpm test:e2e             # E2E: runs `pnpm dev` locally, `pnpm start` in CI
```

| Type      | Location                           | What it tests                                                                 |
| --------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| Unit      | `*.test.ts` next to the source     | Schemas, repositories, HTTP client, Server Actions (with a mocked repository) |
| Component | `*.test.tsx` next to the component | Behavior and accessibility: roles, labels, disabled/error states              |
| E2E       | `e2e/*.spec.ts`                    | Real browser flows: task CRUD, filters, dialog focus, mobile nav              |

Conventions:

- Query by role and label (`getByRole('button', { name: 'Save' })`), not by CSS class. Tests written this way also check accessibility.
- Async Server Components can't be rendered with RTL. Unit-test their logic (repositories, schemas) and cover the whole page with E2E.
- jsdom doesn't support `<dialog>.showModal()` yet. `src/test/setup.ts` provides a minimal stub; real focus behavior is tested with Playwright.

## Starting a new project from the template

Full step-by-step walkthrough (setup, customization, features, backend, deployment, troubleshooting): [docs/usage-guide.md](docs/usage-guide.md). Short version:

1. Copy the repo (GitHub: **Use this template**, or `git clone`, delete `.git` and run `git init`).
2. Change `name` in `package.json` and `NEXT_PUBLIC_APP_NAME`.
3. Change colors and fonts in `src/app/globals.css` (edit tokens only, not components).
4. Edit the menu in `src/config/navigation.tsx`.
5. Add features by following [docs/create-new-feature.md](docs/create-new-feature.md) (code) and [docs/feature-development-playbook.md](docs/feature-development-playbook.md) (process and AI agent prompts).
6. Connect your backend by following [docs/api-integration.md](docs/api-integration.md): set `API_MODE=rest` and `API_BASE_URL`.
7. When you no longer need the demo: delete `src/features/tasks`, `src/app/(app)/tasks`, the `Tasks` item in navigation, the task section of the dashboard and `e2e/tasks.spec.ts`.

## AI coding agents

Claude Code, Codex, Antigravity and OpenCode share one set of rules and skills: `AGENTS.md` (entry point), `docs/ai/rules/` (rules), `.agents/skills/` (skills). Usage and maintenance: [docs/ai/README.md](docs/ai/README.md).

## Production

```bash
pnpm build && pnpm start
```

> **Authentication (fail-closed):** the template doesn't pick a sign-in provider for you. In `API_MODE=rest`, until you implement `resolveSession()` in `src/lib/auth-provider.ts`, every page shows "Sign-in required", every mutation is refused, and **no request reaches the backend**. See [docs/api-integration.md](docs/api-integration.md), section "Authentication". Demo mode needs no sign-in.

- Demo mode keeps data in server memory: it is **lost on restart** and **not shared between instances**. Production must use `API_MODE=rest`.
- Server Action errors are logged on the server. Hook up an error reporter (Sentry, Datadog...) in `src/lib/action-result.ts` and `src/app/(app)/error.tsx`.
