# Feature development playbook

How to take a new business feature (Orders, Customers, Invoices…) from an idea to a merged pull request in this template, alone or with an AI coding agent. It covers the **process**: what to decide first, the order of work, what "done" means at each phase, and ready-to-paste prompts.

The code for each file type is in [create-new-feature.md](create-new-feature.md) (a full Product example) and in the living reference `src/features/tasks/`. The binding rules are in [ai/rules/](ai/rules/). This playbook links to them instead of repeating them.

## How the pieces fit

| Piece                                                  | Role                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| This playbook                                          | Process, phase checklists, prompts                            |
| [create-new-feature.md](create-new-feature.md)         | Code for every file of a feature                              |
| `src/features/tasks/`                                  | Working reference: every file type, with tests                |
| Skill `nextjs-feature-development` (`.agents/skills/`) | The same workflow, condensed for agents; loaded automatically |
| [ai/rules/](ai/rules/)                                 | Mandatory rules with IDs (`R-SEC-1`, `R-FEAT-2`…) cited below |

## The phases

```text
0. Brief            → what to build, who may change it, which endpoints
1. Plan             → file list + assumptions, approved before coding
2. Domain           → schemas.ts, types.ts, constants.ts
3. Data access      → services/: demo adapter, REST adapter, selector
4. Mutations        → actions.ts
5. UI               → components/
6. Route + menu     → src/app/(app)/<f>/page.tsx, src/config/navigation.tsx
7. Tests            → unit, component, E2E
8. Verify           → commands for the change type
9. Review           → architecture + security review
10. Pull request    → description, checklist
```

Phases 2–7 are one vertical slice. Build it on demo data first (`API_MODE=demo`); the REST adapter only has to match the contract, and switching to the real backend later changes no component.

---

## Phase 0: Write the feature brief

Most rework comes from decisions made halfway through coding. Fill in this brief before writing code or prompting an agent; paste it into the prompts below.

```markdown
# Feature brief: <Feature name>

## Goal

<One or two sentences: who uses it and what for.>

## Entity: <Name> (singular, e.g. Order)

| Field | Type   | Required | Rules (length, range, format, enum values) | Shown in list? | Editable? |
| ----- | ------ | -------- | ------------------------------------------ | -------------- | --------- |
| id    | string | yes      | backend-generated                          | no             | no        |
|       |        |          |                                            |                |           |

## Operations

- [ ] List with pagination (page size: <n>)
- [ ] Search by: <fields>
- [ ] Filter by: <field = values>
- [ ] Create
- [ ] Edit
- [ ] Delete (with confirmation)
- [ ] Other actions: <e.g. "mark as paid">
- [ ] Dashboard widget: <yes/no, what>

## Permissions

- Write permission: `<feature>:write` (who has it: <roles>)
- Read: every signed-in user / <restriction>

## Backend contract

| Operation | Method + path               | Request body | Response                         |
| --------- | --------------------------- | ------------ | -------------------------------- |
| List      | GET /<f>?q=&page=&pageSize= |              | { items, total, page, pageSize } |
|           |                             |              |                                  |

Differences from the default shape (snake_case, envelope `{ data }`, 0-based pages, other id format): <none / list>.
Backend not ready: <yes/no>. If yes, build on demo data with the default shape.

## UI

- Route: `/<f>`
- List columns: <…>
- Form fields and layout: <…>
- Empty state text: <…>

## Out of scope

- <What will NOT be built now>

## Acceptance criteria

- [ ] <Given/When/Then or plain checks a reviewer can click through>
```

**Done when:** every field has a type and validation rules, every operation maps to an endpoint (or "demo only"), the permission name is chosen and out-of-scope items are written down.

### Prompt: draft the brief from a rough idea

```text
I want to add a new feature to this app: <rough description, e.g. "manage customer orders: list, search by code, filter by status, create, cancel">.

Read src/features/tasks/ and docs/feature-development-playbook.md (Phase 0).
Fill in the feature brief template from that phase. Do not write code.
For every value you had to guess (field rules, endpoints, permissions), mark it "ASSUMPTION" and list open questions for me at the end.
```

---

## Phase 1: Plan

Ask for a plan before code. A plan is cheap to correct; a 15-file diff is not.

The plan should list: every file to create or change (grouped by layer), the permission name, which shared components are reused, which new shared components are needed (ideally none), and the assumptions about the backend.

**Done when:** you have read and approved the file list. Push back on new dependencies, new shared components and barrels (`index.ts`); the rules usually forbid them (R-DEP-1, R-ATOM-4, R-FEAT-6).

### Prompt: plan only

```text
/nextjs-feature-development

Plan (do not implement yet) the feature described in this brief:

<paste the brief>

Output:
1. Files to create/change, grouped by layer (features/<f>, app, config, e2e), one line each on its purpose.
2. Shared components from src/components you will reuse; any new shared component with the reason none of the existing ones fits.
3. The permission string and the Server Actions you will add.
4. Assumptions about the backend contract.
5. The verification commands you will run (from docs/ai/rules/testing.md).
Stop after the plan and wait for my approval.
```

For Codex use `$nextjs-feature-development`; for OpenCode write "use the nextjs-feature-development skill". See [ai/README.md](ai/README.md), section "4. Invoking a skill".

---

## Phase 2: Domain (`schemas.ts`, `types.ts`, `constants.ts`)

The schema is the single source of truth: it validates backend responses, the form on the client and the input of every Server Action.

Checklist:

- [ ] Entity schema (backend response), page schema (`items/total/page/pageSize`), form schema, list-query schema, id schema.
- [ ] Form schema accepts what a native `<form>` submits (strings): `''` for empty optional fields, numbers coerced after a required check (see the Product example, step 1).
- [ ] List-query schema uses `.catch()` defaults: a bad URL parameter falls back to a default instead of crashing the page.
- [ ] Id schema uses the allowlist `^[A-Za-z0-9_-]{1,100}$` because ids go into backend URLs (R-SEC-4).
- [ ] Types are `z.infer` / `z.input` / `z.output` of the schemas, never hand-written copies; `types.ts` also declares the `<F>Repository` contract.
- [ ] `constants.ts`: `<F>_READ_PERMISSION = '<f>:read'`, `<F>_WRITE_PERMISSION = '<f>:write'`, labels, enum → badge variant, select options.
- [ ] REST adapter read methods (`list`, `stats`…) call `requireSession(<F>_READ_PERMISSION)` before `backendRequest()`.

**Done when:** `pnpm typecheck` passes and `schemas.test.ts` covers valid input, each invalid rule and the id allowlist.

### Prompt

```text
Implement Phase 2 (domain) of the approved plan for <feature>: src/features/<f>/schemas.ts, types.ts, constants.ts and schemas.test.ts.
Follow src/features/tasks/schemas.ts, types.ts, constants.ts and the rules R-SEC-4, R-TS-* in docs/ai/rules/.
Brief: <paste or "see above">.
Run pnpm typecheck and pnpm test, report the results, then stop.
```

---

## Phase 3: Data access (`services/`)

Checklist:

- [ ] `demo-<f>-repository.ts`: `import 'server-only'`, a `createDemo<F>Repository(seed)` factory (tests get their own data), a module-level store on `globalThis` so dev reloads keep data, missing ids throw `ApiError` with `NOT_FOUND`.
- [ ] `rest-<f>-repository.ts`: `import 'server-only'`, every call through `backendRequest()` with a response `schema`, ids passed through `encodeURIComponent`. Map snake_case, envelopes or 0-based pages **here**, nowhere else.
- [ ] `<f>-repository.ts`: picks the adapter from `serverEnv.API_MODE`; the only import the rest of the app uses (R-FEAT-4).

**Done when:** `demo-<f>-repository.test.ts` covers list (search, filter, pagination), create, update, delete and `NOT_FOUND`.

### Prompt

```text
Implement Phase 3 (data access) for <feature>: services/demo-<f>-repository.ts (+ test), services/rest-<f>-repository.ts, services/<f>-repository.ts.
Copy the patterns of src/features/tasks/services/. The REST contract is: <paste the table from the brief, or "default shape">.
Seed the demo store with <n> realistic records.
Run pnpm typecheck and pnpm test, report the results, then stop.
```

When the backend uses a different shape, add: "Map the backend format inside rest-<f>-repository.ts only, following docs/api-integration.md section 4."

---

## Phase 4: Mutations (`actions.ts`)

Every Server Action is a public POST endpoint. The order is fixed (R-SEC-1, R-NX-7):

```text
'use server'
try {
  1. await requireSession(<F>_WRITE_PERMISSION)     first line, before anything else
  2. safeParse every argument (ids with the id schema)
  3. call the repository
} catch (error) { return toActionFailure(error) }
4. revalidatePath() for every route that shows the data (list page, dashboard…)
5. return { ok: true }
```

- Parameters are typed `unknown`: nothing from the client is trusted.
- Validation failures return `validationFailure(parsed.error)` so the form shows field errors.
- Never throw to the client, never return raw backend errors (R-SEC-7).

**Done when:** `actions.test.ts` has, per action: signed out → refused and repository not called; missing permission → refused; invalid input → field errors and repository not called; success → repository called and paths revalidated (R-SEC-11). Copy the mocks from `src/features/tasks/actions.test.ts`.

### Prompt

```text
Implement Phase 4 for <feature>: src/features/<f>/actions.ts and actions.test.ts.
Actions: <list, e.g. create, update, delete, markPaid>.
Follow src/features/tasks/actions.ts exactly (R-SEC-1, R-NX-7) and add the negative tests from R-SEC-11, mocking like src/features/tasks/actions.test.ts.
Run pnpm typecheck and pnpm test, report the results, then stop.
```

---

## Phase 5: UI (`components/`)

Build from the design system first: `DataTable`, `PageHeader`, `EmptyState`, `Pagination`, `SearchInput`, `FormField`, `Dialog`, `ConfirmationDialog`, `Alert`, `Badge`, `Button`, `Input`, `Select`, `Textarea`, `StatCard`, `Skeleton`. Run `pnpm storybook` to browse them.

| Component                   | Server or client | Model in `src/features/tasks/components/` |
| --------------------------- | ---------------- | ----------------------------------------- |
| `<f>-table.tsx`             | Server           | `task-table.tsx`                          |
| `<f>-form.tsx`              | Client           | `task-form.tsx`                           |
| `<f>-form-dialog.tsx`       | Client           | `task-form-dialog.tsx`                    |
| `delete-<f>-button.tsx`     | Client           | `delete-task-button.tsx`                  |
| `<f>-filters.tsx`           | Client           | `task-filters.tsx`                        |
| `<f>-badges.tsx` (optional) | Server           | `task-badges.tsx`                         |

Checklist:

- [ ] `'use client'` only on the interactive leaves (form, dialog, filters, buttons with handlers), never on the table or the page (R-NX-2).
- [ ] Client components never import `services/`, `@/lib/env`, `@/lib/auth` or `@/lib/api/backend` (R-NX-3); they receive data as props and call Server Actions.
- [ ] Client calls go through `callAction()`; field errors from the action are shown on the fields.
- [ ] Filters and search only update the URL (`?q=&status=&page=`); the page re-renders on the server (R-NX-12).
- [ ] Icon buttons have an `aria-label` naming the record (`Edit order #123`); destructive actions use `ConfirmationDialog`.
- [ ] Need a new shared component? It must be domain-free and follow [component-guidelines.md](component-guidelines.md) with a story and a test. Prefer a variant of an existing one.

**Done when:** `<f>-form.test.tsx` shows validation errors and calls `onSubmit` for valid input; `pnpm lint` passes (it catches wrong-direction imports).

### Prompt

```text
Implement Phase 5 (UI) for <feature> in src/features/<f>/components/.
Columns: <…>. Form fields: <…>. Filters: <…>.
Reuse src/components only; if you think a new shared component is needed, stop and explain why before creating it.
Follow the server/client split of src/features/tasks/components/ (R-NX-2, R-NX-3) and add <f>-form.test.tsx querying by role/label.
Run pnpm typecheck, pnpm lint and pnpm test, report the results, then stop.
```

---

## Phase 6: Route and menu

Checklist:

- [ ] `src/app/(app)/<f>/page.tsx` with `metadata`, `PageHeader` (create button in `actions`) and an async list section inside `<Suspense>` with a skeleton fallback.
- [ ] Inside the async section, in this order (R-NX-5, R-SEC-2): `await searchParams` (or `await connection()`), then `getSession()` → "Sign-in required" empty state, then `hasPermission(session, <F>_READ_PERMISSION)` → "Permission required" empty state, then parse the query with the list-query schema, then read the repository.
- [ ] Empty list, filtered-empty list and "page past the end" each have a message (R-NX-8). Copy `src/app/(app)/tasks/page.tsx`.
- [ ] Menu entry in `src/config/navigation.tsx` with a `lucide-react` icon.
- [ ] Optional dashboard widget: a feature component rendered from `src/app/(app)/dashboard/page.tsx`, data fetched with `Promise.all` alongside the rest.

**Done when:** `pnpm typecheck` (generates `PageProps<'/<f>'>`) and `pnpm build` pass, and the build output shows the route as partially prerendered (`◐`), not fully dynamic.

### Prompt

```text
Implement Phase 6 for <feature>: src/app/(app)/<f>/page.tsx and the menu entry in src/config/navigation.tsx.
Copy the structure of src/app/(app)/tasks/page.tsx (Suspense, searchParams before getSession, empty states, pagination).
Run pnpm typecheck and pnpm build; report the rendering mode shown for /<f> in the build output, then stop.
```

---

## Phase 7: Tests

By now unit and component tests exist. Add one E2E flow:

- [ ] `e2e/<f>.spec.ts` imports `test` and `expect` from `./fixtures` (fails on any CSP violation, R-TEST-6).
- [ ] Create a record with a unique name, find it via search, edit it, delete it. Tests run serially against one shared demo server, so never depend on seed counts.
- [ ] Query by role and label only (R-TEST-3).

### Prompt

```text
Write e2e/<f>.spec.ts for <feature>: create (unique name), search, edit, delete with confirmation.
Follow e2e/tasks.spec.ts and import test/expect from ./fixtures.
Run pnpm test:e2e and report the result.
```

---

## Phase 8: Verify

A feature touches Server Actions and routes, so the required set is ([ai/rules/testing.md](ai/rules/testing.md)):

```bash
pnpm check        # typecheck, lint, format, unit tests, agent config
pnpm build
pnpm test:e2e
pnpm build-storybook   # only if you added or changed a shared component
```

Then click through the acceptance criteria from the brief in `pnpm dev`, in both themes and at mobile width.

### Prompt

```text
/testing-and-verification
Verify the <feature> change: run every command required for "Server Action / auth / security" and "Route, page, layout" in docs/ai/rules/testing.md.
Report each command with pass/fail and the relevant output. Do not report a command you did not run. If something fails, find the root cause and fix it, then rerun.
```

---

## Phase 9: Review

Run both reviews on the full diff, ideally in a fresh agent session so the reviewer does not share the author's assumptions.

### Prompt: architecture review

```text
/architecture-review
Review the current diff (git diff main...HEAD) for the <feature> feature against docs/ai/rules/: feature boundaries, server/client split, Suspense and data flow, reuse of shared components, unnecessary abstractions or dependencies, accessibility, test coverage.
List findings by severity with file:line. Do not change code.
```

### Prompt: security review

```text
/app-security-review
Review src/features/<f>/actions.ts, services/ and src/app/(app)/<f>/page.tsx: requireSession order and permission name, Zod validation of every argument, id allowlist, error disclosure, fail-closed behaviour in API_MODE=rest, negative tests.
List findings with file:line. Do not change code.
```

Fix what the reviews find, then rerun Phase 8.

---

## Phase 10: Pull request

Checklist for the description:

- [ ] Link to the brief and the acceptance criteria.
- [ ] Files by layer (the plan from Phase 1, updated).
- [ ] Permission name and who needs it on the backend side.
- [ ] Backend contract used and any assumption still open.
- [ ] Commands run and their results (only those actually run, R-TEST-1).
- [ ] Screenshots: list, empty state, form with validation errors, mobile.

### Prompt

```text
Write a pull request description for the <feature> change using the Phase 10 checklist in docs/feature-development-playbook.md.
Base it only on the actual diff and the commands run in this session. Do not commit or push.
```

---

## One-shot mode

For a small, well-specified feature you can run phases 1–8 in one request. You lose the review points between phases, so keep the brief precise.

```text
/nextjs-feature-development

Build this feature end to end:

<paste the brief>

Rules:
- First show the plan (Phase 1 of docs/feature-development-playbook.md) and wait for my "go".
- Then implement phases 2–7 in order, running pnpm typecheck and pnpm test after each phase.
- No new dependencies, no new shared components and no changes outside src/features/<f>, src/app/(app)/<f>, src/config/navigation.tsx and e2e/ without asking.
- Finish with Phase 8 and report every command with its result, the files created by layer, the permission name and open assumptions.
```

## Follow-up prompts

**Connect the feature to the real backend:**

```text
/api-integration
The backend for <feature> is ready. Contract: <paste endpoints and sample JSON responses>.
Update only src/features/<f>/services/rest-<f>-repository.ts (and schemas.ts if the entity changed) so the app works with API_MODE=rest. Add tests for the mapping. Do not change components.
```

**Add a field to an existing feature:**

```text
Add the field <name> (<type>, <rules>) to <feature>: schema, demo seed, REST mapping, form, table column, tests.
Follow the existing files in src/features/<f>/. Run pnpm check and report the results.
```

**Fix a bug in a feature:**

```text
Bug in <feature>: <steps to reproduce, expected vs actual>.
Follow docs/ai/workflows.md section C: write a failing test first, find the root cause (check every caller), fix it there, rerun the test and pnpm check.
```

## Prompting tips

- **Point at files, not ideas.** "Follow `src/features/tasks/actions.ts`" gives better code than "write secure actions".
- **One phase per turn** for anything non-trivial, and read the diff before saying "go".
- **Ask for evidence.** End prompts with "run X and report the result"; agents must only report commands they ran (R-TEST-1).
- **Say what is off limits**: no new packages, no new shared components, no edits outside the feature without asking.
- **Mark assumptions.** Ask the agent to label guesses about the backend as ASSUMPTION so they reach the PR description.
- **Language.** Prompts can be written in any language; code, comments and docs stay in English (R-TS-8).

## Definition of done

- [ ] Brief and acceptance criteria met; out-of-scope list respected.
- [ ] Files follow the feature layout (R-FEAT-5); no import of another feature, no barrels.
- [ ] Every Server Action: `requireSession` first, Zod on every argument, `ActionResult`, `revalidatePath`.
- [ ] Page: Suspense, request data before session, sign-in / empty / error states.
- [ ] Unit, action (with negative cases), component and E2E tests added.
- [ ] `pnpm check`, `pnpm build`, `pnpm test:e2e` pass (and `pnpm build-storybook` if shared UI changed).
- [ ] Architecture and security reviews done, findings fixed.
- [ ] Works in `API_MODE=demo`; REST adapter matches the agreed contract.
