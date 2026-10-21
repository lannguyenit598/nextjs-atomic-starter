# Usage guide

A step-by-step walkthrough for turning this template into your own app: from the first `pnpm install` to a production deployment. Each step lists the files to touch, the commands to run and how to tell it worked. The "why" and full code samples live in the linked docs; this guide only tells you which one to open when.

| You want to…                                    | Read                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| Get the app running and make it yours           | Steps 1–4 below                                                    |
| Understand the layers and import rules          | [architecture.md](architecture.md)                                 |
| Decide where a component goes and how to build  | [component-guidelines.md](component-guidelines.md)                 |
| Build a full CRUD feature, file by file         | [create-new-feature.md](create-new-feature.md)                     |
| Plan a feature and prompt an AI agent per phase | [feature-development-playbook.md](feature-development-playbook.md) |
| Connect a real REST backend and authentication  | [api-integration.md](api-integration.md)                           |
| Know which checks a change needs                | [ai/rules/testing.md](ai/rules/testing.md)                         |
| Use Claude Code, Codex, Antigravity or OpenCode | [ai/README.md](ai/README.md)                                       |

---

## 1. Prerequisites

- **Node.js** `^22.22.2`, `^24.15.0` or `>=26` (`engines` in `package.json`). The version used locally and in CI is in `.nvmrc` (24): run `nvm use` or `fnm use`.
- **pnpm**, pinned by `packageManager` in `package.json`. Enable it once per machine:

```bash
corepack enable
```

Use only `pnpm`. `npm` and `yarn` ignore `pnpm-lock.yaml` and produce a different dependency tree.

**Done when:** `node -v` matches `.nvmrc` and `pnpm -v` matches `packageManager`.

## 2. Create your project

1. On GitHub click **Use this template**, or clone and reset history:

   ```bash
   git clone <template-url> my-app && cd my-app
   rm -rf .git && git init
   ```

2. Install and start:

   ```bash
   pnpm install
   cp .env.example .env.local   # optional: the defaults already run demo mode
   pnpm dev                     # http://localhost:3000
   ```

`pnpm install` also installs the Husky pre-commit hook (`prepare` script).

**Done when:** http://localhost:3000 redirects to `/dashboard` and shows the demo stats.

## 3. Tour the demo

The template ships with one complete example feature, **Tasks**, running on in-memory data (`API_MODE=demo`, no backend, no sign-in).

| Where                        | What it shows                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `/dashboard`                 | Stat cards and recent tasks, streamed inside `<Suspense>`                                               |
| `/tasks`                     | Search, status filter and pagination stored in the URL (`?q=&status=&page=`); create/edit/delete dialog |
| Theme button (header)        | Light/dark switch, saved in `localStorage`, follows the OS by default                                   |
| `pnpm storybook` (port 6006) | Every shared component in isolation, with the accessibility addon                                       |

Demo data lives in the server's memory: it **resets on restart** and is not shared between server instances. It is for development and tests only.

While touring, open `src/features/tasks/` side by side: every new feature you write copies its shape.

## 4. Make it yours

Change these before writing any feature code:

| What                    | Where                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Package name            | `name` in `package.json`                                                                                                                         |
| App name (sidebar, tab) | `NEXT_PUBLIC_APP_NAME` in `.env.local` / deployment env; fallback in `src/config/site.ts`                                                        |
| Meta description        | `description` in `src/config/site.ts`                                                                                                            |
| Page language           | `lang="en"` on `<html>` in `src/app/layout.tsx` (e.g. `lang="vi"` for a Vietnamese UI; screen readers and spell check use it)                    |
| Fonts                   | `next/font/google` imports in `src/app/layout.tsx`; Vietnamese text needs `subsets: ['latin', 'vietnamese']`                                     |
| Colors, radius, shadows | CSS variables in `src/app/globals.css`. Edit **both** the `:root` (light) and `[data-theme='dark']` blocks. Never hard-code colors in components |
| Favicon                 | `src/app/favicon.ico`                                                                                                                            |
| Menu                    | `mainNavigation` in `src/config/navigation.tsx` (icons from `lucide-react`)                                                                      |
| Home page               | `redirects()` in `next.config.ts` sends `/` to `/dashboard`; change the destination or remove it and add `src/app/(app)/page.tsx`                |

Components only use token utilities (`bg-primary`, `text-muted-foreground`, `rounded-md`…), so changing a token restyles the whole app in both themes.

**Done when:** `pnpm dev` shows your name, colors and menu, and `pnpm check` passes.

## 5. Where code goes

Imports only flow downward. ESLint enforces it (`eslint.config.mjs`), so a wrong import fails `pnpm lint`.

```text
src/app/            routing + page composition      → features, components, config, lib
src/features/<f>/   one business domain             → components, lib (relative imports inside <f>)
src/components/     domain-free design system       → lib, lower Atomic levels
src/lib/            technical infrastructure        → nothing above it
```

| You are adding…                                                | Put it in                                               |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| A URL, layout, `loading.tsx`, `error.tsx`, metadata            | `src/app/(app)/<route>/`                                |
| Anything that knows a business word (order, customer, invoice) | `src/features/<feature>/`                               |
| A UI piece reusable with no business knowledge                 | `src/components/{atoms,molecules,organisms,templates}/` |
| Fetch wrappers, auth, env, formatting helpers                  | `src/lib/`                                              |
| App-wide static settings (menu, site name)                     | `src/config/`                                           |

Rules of thumb:

- A feature never imports another feature. Shared code moves down to `components/` or `lib/`.
- Server Components by default. Add `'use client'` only to the small interactive leaf (a dialog, a form, a filter), never to a page.
- Components never call `fetch`. Data goes through the feature repository (`services/`).

Details: [architecture.md](architecture.md), [component-guidelines.md](component-guidelines.md).

## 6. Daily workflow

```bash
pnpm dev           # app with hot reload
pnpm test:watch    # Vitest in watch mode while you code
pnpm storybook     # when working on shared components
pnpm check         # before every commit: typecheck, lint, format, unit tests, agent config
```

- The pre-commit hook runs ESLint and Prettier on staged files only. It does not replace `pnpm check`.
- Extra checks depend on what you changed (route, Server Action, dependency…). The table in [ai/rules/testing.md](ai/rules/testing.md) lists them; before a release run everything:

  ```bash
  pnpm check && pnpm build && pnpm test:e2e && pnpm build-storybook
  ```

- First E2E run on a machine: `pnpm exec playwright install chromium`.

## 7. Common tasks

### Add a static page

1. Create `src/app/(app)/<route>/page.tsx`; it gets the sidebar and header from `src/app/(app)/layout.tsx`.
2. Export `metadata` (`{ title: '…' }`); the root layout appends the app name.
3. Add a menu entry in `src/config/navigation.tsx` if it should appear in the sidebar.

A page that reads request data (`searchParams`, cookies, the session, backend data) must do it inside `<Suspense>` and await `searchParams` or `connection()` first. Copy the pattern from `src/app/(app)/tasks/page.tsx` (search params) or `src/app/(app)/dashboard/page.tsx` (`connection()`).

### Add a shared component

1. Check `src/components/` first; extend an existing component with a variant before creating a new one.
2. Pick the level: atom (one element), molecule (a few atoms), organism (a section), template (page layout with slots).
3. Create `<name>.tsx` with `cva` variants and `cn()` from `src/lib/utils.ts`; props in, no data fetching, no business words.
4. Add `<name>.stories.tsx` (`title: '<Level>/<Name>'`) and `<name>.test.tsx` that queries by role/label.
5. Run `pnpm check` and `pnpm build-storybook`.

Details: [component-guidelines.md](component-guidelines.md). Agent skill: `atomic-component-development`.

### Add a business feature

Follow [create-new-feature.md](create-new-feature.md), which builds a Product feature step by step. For the process (feature brief, phases, review, ready-to-paste agent prompts) use [feature-development-playbook.md](feature-development-playbook.md). The checklist:

```text
src/features/<f>/schemas.ts                    Zod schemas: entity, form input, list query, id
src/features/<f>/types.ts                      inferred types + <F>Repository contract
src/features/<f>/constants.ts                  labels, badge mapping, '<f>:read' / '<f>:write' permissions
src/features/<f>/services/demo-<f>-repository.ts
src/features/<f>/services/rest-<f>-repository.ts
src/features/<f>/services/<f>-repository.ts    picks demo or rest from API_MODE
src/features/<f>/actions.ts                    Server Actions
src/features/<f>/components/                   table (server), form + dialog (client)
src/app/(app)/<f>/page.tsx                     route
src/config/navigation.tsx                      menu entry
```

Every Server Action follows the same order (see `src/features/tasks/actions.ts`):

1. `await requireSession('<f>:write')`: first line, before anything else.
2. Parse every argument with Zod (`safeParse`); ids use the id schema.
3. Call the repository inside `try`, map errors with `toActionFailure()`.
4. `revalidatePath()` the pages that show the data.
5. Return an `ActionResult`; never throw to the client.

Forms are a native `<form>` with the same Zod schema on the client and server: copy `src/features/tasks/components/task-form.tsx`. Client callers wrap the action in `callAction()` so a network failure shows a message instead of crashing.

Agent skill: `nextjs-feature-development`.

### Add a permission

Permissions are plain strings (`'orders:read'`, `'orders:write'`) declared in the feature's `constants.ts`. Actions and the REST adapter check them with `requireSession(permission)`; pages use `hasPermission(session, permission)` to show "Permission required". Write does not imply read. `'*'` grants everything. Your backend decides which permissions a user has; `resolveSession()` returns them (step 8).

### Allow a third-party origin (analytics, CDN, browser-side API)

The Content-Security-Policy in `next.config.ts` only allows `'self'`. Add the origin to the matching directive (`script-src`, `img-src`, `connect-src`…). Every E2E test fails on a CSP violation (`e2e/fixtures.ts`), so a missing origin shows up in `pnpm test:e2e`.

## 8. Connect your backend

1. Set the server env in `.env.local` (and later in the deployment):

   ```bash
   API_MODE=rest
   API_BASE_URL=https://api.internal.example.com/v1
   API_TOKEN=            # optional service token, server-side only
   API_TIMEOUT_MS=10000
   ```

2. Restart `pnpm dev`. The env is validated at startup (`src/lib/env.ts`); a missing or malformed value stops the server with an `Invalid environment configuration` message.
3. Match the contract: either the backend returns what `rest-<f>-repository.ts` expects, or you adapt that one file (snake_case, envelopes, 0-based pages…). Components do not change.

The browser never calls the backend: every request goes through the Next.js server, so the token and internal URL stay private and CORS is not needed.

Details and the default Tasks contract: [api-integration.md](api-integration.md). Agent skill: `api-integration`.

### Authentication

In `API_MODE=rest` the template is **fail-closed**: until you implement sign-in, every page shows "Sign-in required", every mutation is refused and `backendRequest()` refuses to call the backend.

1. Implement `resolveSession()` in `src/lib/auth-provider.ts`, the only auth function you write. Return `{ userId, permissions, accessToken }` for a signed-in caller, `null` otherwise.
2. Return the user's own `accessToken` whenever possible. Without it the backend receives the shared `API_TOKEN` and sees every user as the same service account.
3. Add login/logout routes (for example a `src/app/(auth)/` route group) according to your identity provider.

Example implementations (backend JWT cookie, OIDC, backend session cookie): [api-integration.md](api-integration.md), section "8. Authentication".

> **Warning:** `AUTH_ALLOW_ANONYMOUS=true` skips sign-in and gives **every visitor** the full rights of `API_TOKEN`. Use it only when the app is already protected in front of Next.js (VPN, SSO gateway). The server logs a warning at startup when it is on.

Never put tokens or internal URLs in `NEXT_PUBLIC_*` variables: those are inlined into the browser bundle.

## 9. Testing

| Kind      | Location                        | Command         |
| --------- | ------------------------------- | --------------- |
| Unit      | `*.test.ts` next to the source  | `pnpm test`     |
| Component | `*.test.tsx` next to the source | `pnpm test`     |
| E2E       | `e2e/*.spec.ts`                 | `pnpm test:e2e` |

- Query by role and label (`getByRole('button', { name: 'Save' })`), never by CSS class.
- Async Server Components can't be rendered in Vitest: test their schema, repository and actions, and cover the page with E2E.
- E2E specs import `test` and `expect` from `e2e/fixtures.ts`, not from `@playwright/test`.
- E2E always runs in demo mode against one shared server, so tests run serially and create uniquely named data. Locally Playwright starts `pnpm dev` (or reuses a running one); in CI it runs `pnpm start` after `pnpm build`.
- Action tests mock the repository, `next/cache` and `requireSession`, and include negative cases (not signed in, forbidden, invalid input): see `src/features/tasks/actions.test.ts`.

## 10. Remove the demo

When your first real feature works, delete the Tasks example:

1. Delete `src/features/tasks/`, `src/app/(app)/tasks/` and `e2e/tasks.spec.ts`.
2. Remove the `Tasks` entry from `src/config/navigation.tsx`.
3. Rewrite `src/app/(app)/dashboard/page.tsx`: it imports the Tasks feature throughout, so replace its content with your own widgets (or delete the page and change the `/` redirect in `next.config.ts`).
4. Run `pnpm check && pnpm build && pnpm test:e2e`. Type and lint errors point at any reference you missed.

## 11. Working with AI coding agents

Claude Code, Codex, Antigravity and OpenCode read the same rules: `AGENTS.md` (always loaded), `docs/ai/rules/` (detailed rules) and `.agents/skills/` (task workflows).

- Agents pick a skill on their own when your request matches it. To call one explicitly in Claude Code: `/nextjs-feature-development add an Order feature`. Syntax for the other agents: [ai/README.md](ai/README.md), section "4. Invoking a skill".
- Useful skills: `nextjs-feature-development`, `atomic-component-development`, `api-integration`, `app-security-review`, `architecture-review`, `testing-and-verification`, `release-readiness`.
- Edit only `.agents/` and `docs/ai/`. `.claude/` is generated: run `pnpm agents:sync` after a change; `pnpm check` (via `agents:check`) fails if they drift.

## 12. Deploy to production

```bash
pnpm build && pnpm start
```

Before the first deployment:

- [ ] `API_MODE=rest` and `API_BASE_URL` set in the deployment env. Demo mode loses data on restart and is not shared between instances.
- [ ] `resolveSession()` implemented; `AUTH_ALLOW_ANONYMOUS` unset or `false` unless a VPN/SSO gateway protects the app.
- [ ] Secrets only in server env, never in `NEXT_PUBLIC_*`; `.env.local` not committed.
- [ ] An error reporter (Sentry, Datadog…) hooked into `src/lib/action-result.ts` and `src/app/(app)/error.tsx`; by default errors are only logged on the server.
- [ ] Behind HTTPS: HSTS at your proxy/CDN, or `upgrade-insecure-requests` in the CSP (`next.config.ts`).
- [ ] CI green: `.github/workflows/ci.yml` runs audit, typecheck, lint, format, agent config, unit tests, build, Storybook build and E2E on every push to `main` and every pull request.

Agent skill for the final check: `release-readiness`.

## 13. Troubleshooting

| Symptom                                                                     | Cause and fix                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Every page shows "Sign-in required" after switching to `API_MODE=rest`      | Expected (fail-closed). Implement `resolveSession()` in `src/lib/auth-provider.ts`. The server log says `[auth] No authentication provider configured`             |
| The server exits at startup with `Invalid environment configuration`        | An env value failed validation in `src/lib/env.ts`, usually a missing or relative `API_BASE_URL` in rest mode. Fix the value named in the message                  |
| Lint: `Shared UI must not depend on features or routes`                     | A file in `src/components` or `src/lib` imports `@/features/*` or `@/app/*`. Pass the data in through props instead                                                |
| Lint: `Use relative imports inside a feature; never import another feature` | Inside a feature use `./` and `../` imports; move code shared by two features down to `components/` or `lib/`                                                      |
| Build error about `server-only`                                             | A Client Component (directly or through an import) pulls in a server-only module such as `src/lib/env.ts` or a repository. Fetch on the server and pass props down |
| E2E fails with `Content-Security-Policy violations`                         | The page loaded a resource from an origin not allowed in `next.config.ts`. Add the origin to the right directive                                                   |
| A Server Action returns "Something went wrong"                              | The real error is logged on the server only (by design). Check the `pnpm dev` / server output                                                                      |
| `pnpm check` fails at `agents:check`                                        | `.claude/` is out of date with `.agents/`. Run `pnpm agents:sync`                                                                                                  |
| Demo data disappeared                                                       | Demo mode is in memory: any server restart resets it                                                                                                               |
| E2E can't start: port 3000 in use                                           | Locally Playwright reuses a running `pnpm dev`. Stop the other process or set `PORT=3001 pnpm test:e2e`                                                            |
