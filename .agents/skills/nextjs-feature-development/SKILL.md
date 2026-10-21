---
name: nextjs-feature-development
description: 'Build a new business feature (route + data + UI + Server Actions) in this Next.js template, e.g. Product, Order or Customer management. Use when asked to add a feature, module, CRUD screen or domain entity.'
---

# Feature development

A feature is a **vertical slice**: schema → types → repository → Server Actions → components → route → tests. It lives in `src/features/<name>/` and only `src/app/` composes it.

## Read first

- `docs/ai/rules/architecture.md` (R-FEAT, R-ATOM-1), `docs/ai/rules/security.md` (R-SEC-1…4), `docs/ai/rules/nextjs.md` (R-NX-5, R-NX-7).
- The **worked example**: `docs/create-new-feature.md` (Product Management, code verified to typecheck). Copy its shapes.
- The living reference: `src/features/tasks/` (every file type exists there).

## Steps

1. **Requirements.** Write down the entity fields, operations (list/create/update/delete), who may write (permission name `<feature>:write`) and which backend endpoints exist. Done when every field has a type and every operation maps to an endpoint or the demo store. Missing backend facts: ask, or default to the REST contract shape of `src/features/tasks/services/rest-task-repository.ts` and state the assumption.
2. **Schemas** (`schemas.ts`): response schema, form schema, list-query schema with `.catch()` defaults for URL params, id schema with the allowlist `^[A-Za-z0-9_-]{1,100}$` (R-SEC-4).
3. **Types** (`types.ts`): `z.infer` from schemas plus the `<Feature>Repository` contract. No hand-written duplicates of schema types.
4. **Data access** (`services/`): demo adapter (in-memory, `import 'server-only'`, bounded store), REST adapter through `backendRequest()` with response schemas, selector on `serverEnv.API_MODE`.
5. **Server Actions** (`actions.ts`, `'use server'`): `requireSession('<feature>:write')` first, then `safeParse`, then repository, then `revalidatePath`. Return `ActionResult`; errors via `toActionFailure()`.
6. **Components** (`components/`): reuse `src/components/**` (DataTable, FormField, Dialog, ConfirmationDialog, EmptyState, Pagination…). Server Components by default; `'use client'` only on the form/dialog/interactive leaves. Client calls go through `callAction()`.
7. **Route** (`src/app/(app)/<feature>/page.tsx`): `PageHeader` + `<Suspense>` around an async section that awaits `searchParams` **before** `getSession()`, shows "Sign-in required" when there is no session and "Permission required" when `hasPermission(session, '<feature>:read')` fails, then reads the repository. REST read methods call `requireSession('<feature>:read')` before `backendRequest()`. Add `metadata`. Add the nav item in `src/config/navigation.tsx`.
8. **Tests**: schema (valid + invalid + id allowlist), demo repository, actions (signed-out, missing permission, invalid input, success; mock `@/lib/auth` and the repository as in `src/features/tasks/actions.test.ts`), form component, one E2E flow importing from `e2e/fixtures.ts`.
9. **Verify** with the `testing-and-verification` skill (category "Server Action / auth" + "Route"). Done when every command in that row ran and passed.
10. **Docs**: update `docs/api-integration.md` if you introduced a new backend contract.

## Pitfalls

- Importing `@/features/<other>` from inside a feature (R-FEAT-2): lift shared pieces to `components/` or `lib/` instead.
- Calling `getSession()` before awaiting `searchParams`/`connection()`: the result is frozen into the static shell at build time.
- `typeof id === 'string'` as id validation: reintroduces path traversal.
- Adding TanStack Query or Zustand "for the list": the URL + Server Components already cover it (R-DEP-2/3).

## Output

List of created files grouped by layer, the permission name used, the commands run with results, and any assumption about the backend contract.
