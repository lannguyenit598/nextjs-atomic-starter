# Audit: Production Readiness

- **Date:** 2026-10-20
- **Based on:** [`nextjs-atomic-design-audit.md`](nextjs-atomic-design-audit.md), [`dependency-deep-audit.md`](dependency-deep-audit.md)
- **Scope:** close or record the remaining risks before reusing the template. Keep the approved architecture and dependency baseline unchanged.

## Conclusion

| Area                         | Verdict                                                                                                                                                                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEC-1 (missing auth)**     | **Mitigated, fail-closed.** In REST mode, a visitor who is not signed in **cannot** read or write backend data, and also cannot "borrow" `API_TOKEN`. Verified with unit tests, mutation tests, and a real browser against a mock backend (the backend received **0 requests**). |
| **Real authentication**      | **Not yet (intentionally).** The contract is ready; the integration with a sign-in provider needs a decision on the backend side.                                                                                                                                                |
| **Security headers and CSP** | **PASS.** CSP follows the "Without Nonces" pattern from the Next.js docs; 0 CSP violations across the whole E2E suite, in both production and dev.                                                                                                                               |
| **CI**                       | **PASS when run locally; remote NOT VERIFIED.** The workflow passes `actionlint`, and every CI step ran successfully on a clean copy. There has been no real GitHub Actions run: the repo has no remote yet and none of the changes are committed.                               |
| **Dependency stability**     | **PASS.** No packages added. Baseline unchanged.                                                                                                                                                                                                                                 |
| **Template reusability**     | **PASS.** The demo Task was actually removed following the README on a clean copy; all checks are green.                                                                                                                                                                         |
| **Production-ready?**        | **Template: ready for reuse. Production deploy: NOT YET.** There are 2 remaining blockers (section 10): real auth integration, and commit + a green CI run on GitHub.                                                                                                            |

## 1. Tools used

| Capability                                                                      | Purpose                                                                                                                 |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Next.js 16.4.2 docs bundled with the package (`node_modules/next/dist/docs/`)   | `content-security-policy.md`, `authentication-with-cache-components.md`, `unauthorized.md`, `instrumentation-client.md` |
| Context7 (`/colinhacks/zod/v4.6.5`)                                             | Used in the dependency audit (Zod Mini); this part only uses the docs bundled with the package                          |
| Subagent `code-modernization:security-auditor` (read-only)                      | Adversarial review of the SEC-1 and CSP fixes: looking for ways around the guard, env parsing, spoofing, cache leaks    |
| Playwright (real browser)                                                       | E2E; REST scenario with a mock backend; finding the source of CSP violations                                            |
| actionlint v1.7.12 (official binary, SHA-256 verified, placed outside the repo) | Checks the syntax and semantics of the GitHub Actions workflow                                                          |
| Clean copy (only the files git would commit, empty `node_modules`)              | Simulates CI as a fresh clone, and simulates removing the demo                                                          |

## 2. SEC-1: Authentication and Authorization

### 2.1 Endpoints that need protection (inventoried)

| Endpoint                                                                                                               | Type                        | Requirement                                    | Before                   | After                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| `createTaskAction`, `updateTaskAction`, `updateTaskStatusAction`, `deleteTaskAction` (`src/features/tasks/actions.ts`) | Server Action (public POST) | Has a session and the `tasks:write` permission | Not checked              | `requireSession(TASK_PERMISSIONS.write)` is the first line, running **before** the validation step |
| `/tasks`, `/dashboard` (read via repository)                                                                           | Server Component            | Has a session                                  | Not checked              | `getSession()` inside `<Suspense>`; if null, shows "Sign-in required"                              |
| Every backend call (`backendRequest`)                                                                                  | Data access                 | Has a session                                  | Always sends `API_TOKEN` | `requireSession()` runs before `fetch`; sends the user's token if present                          |
| Route Handler, `proxy.ts`                                                                                              |                             |                                                | None                     | None (confirmed by the subagent)                                                                   |

### 2.2 Design (provider-independent, fail-closed)

```text
src/lib/auth.ts           Session, AuthError, getSession(), requireSession(), hasPermission()
src/lib/auth-provider.ts  resolveSession(): THE ONLY INTEGRATION POINT; returns null by default
src/lib/env.ts            AUTH_ALLOW_ANONYMOUS (z.stringbool, default false)
```

| Mode                                          | `getSession()` returns        | Notes                                                                                                   |
| --------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `API_MODE=demo`                               | Demo session (`*`)            | Keeps the local development experience unchanged                                                        |
| `API_MODE=rest` (default)                     | `resolveSession()` → **null** | Fail-closed; prints an `[auth]` warning on the first request                                            |
| `API_MODE=rest` + `AUTH_ALLOW_ANONYMOUS=true` | Anonymous session (`*`)       | Intentional escape hatch, only for use behind a VPN/SSO gateway; the server prints a warning at startup |
| `API_MODE=rest` + provider implemented        | Real session                  | `accessToken` is forwarded to the backend                                                               |

Reasons for each choice:

- **No `unauthorized()` or `forbidden()`:** they are still experimental (`authInterrupts`, per `03-api-reference/04-functions/unauthorized.md`).
- **No session check at the top level of the layout:** it would block the whole segment and break the static shell (`authentication-with-cache-components.md`, Step 2).
- **Read request-time data first, then check the session** (`tasks/page.tsx`, `dashboard/page.tsx`): otherwise the "Sign-in required" branch is precomputed at build time into the static shell. This bug was found by the subagent (P3-1); it was fixed and verified by building in REST mode and then enabling `AUTH_ALLOW_ANONYMOUS` only at runtime.
- **`action-result.ts` recognizes `AuthError` by `name`**, without importing it: this file is also used by the client, while `auth.ts` is `server-only`.

### 2.3 Authentication integration contract

```ts
// src/lib/auth.ts
export type Session = {
  userId: string
  permissions: readonly string[] // e.g. 'orders:write'; '*' = all permissions
  accessToken?: string // the user's token; if present, it is sent to the backend instead of API_TOKEN
}

// src/lib/auth-provider.ts: the ONLY function the project has to write
export async function resolveSession(): Promise<Session | null>
```

Conventions for every new feature (already updated in `docs/create-new-feature.md` and `docs/api-integration.md` §8):

1. **Server Action:** `await requireSession('<feature>:write')` is the first line inside `try`.
2. **Page that reads data:** read request-time data first, then `if (!(await getSession()))` shows the "Sign-in required" state.
3. **Repository that does not go through REST** (for example, calls the DB directly): must call `requireSession()` itself.
4. **`resolveSession()` should return `accessToken`.** Otherwise, every user shares the service account's permissions, and the backend cannot check data ownership (IDOR risk by design).

### 2.4 Backend-dependent parts (decision needed, not done)

| Decision                         | Options                                                                                                                                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in provider                 | JWT issued by the backend (`httpOnly` cookie) / OIDC (Keycloak, Entra ID, Auth0) / backend session cookie. There is a JWT + `/me` example in `docs/api-integration.md` §8; this example has passed typecheck and lint |
| Login and logout screens         | Route group `src/app/(auth)/` + `AuthTemplate`                                                                                                                                                                        |
| Refresh tokens, session lifetime | Per the IdP                                                                                                                                                                                                           |
| Permission list                  | Returned by the backend; mapped into `Session.permissions`                                                                                                                                                            |
| Redirect in `src/proxy.ts`       | Optional, only a UX layer (does not replace the checks in actions and data access)                                                                                                                                    |

### 2.5 Evidence

| Verification                                        | Result                                                                                                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/auth.test.ts`                              | Demo has a session; REST is fail-closed; provider session + permission check (`forbidden`); anonymous only when the flag is enabled                                          |
| `src/lib/api/backend.test.ts`                       | No session: `fetch` is **not called**. User session: header `Bearer user-token`. Anonymous: `Bearer service-token`                                                           |
| `src/features/tasks/actions.test.ts`                | All 4 actions return a "sign in" error when not signed in and a "permission" error when the permission is missing; the repository is not called; auth runs before validation |
| `src/lib/env.test.ts`                               | Real parsing of the `AUTH_ALLOW_ANONYMOUS` variable: `"false"`, `"0"`, `""` and unset all give `false`; `"maybe"` makes the server stop at startup                           |
| Mutation test                                       | Removing the guard in `backendRequest`: 2 tests fail. Removing the guard in `createTaskAction`: 3 tests fail. Restoring: passing again                                       |
| Browser + mock backend, default REST                | `/dashboard`, `/tasks`: "Sign-in required"; trying to create a task: rejected with "…not signed in…"; **backend received 0 requests**                                        |
| Browser + mock backend, `AUTH_ALLOW_ANONYMOUS=true` | Reads and writes work (first end-to-end verification of **writes** in REST mode); an `[auth]` warning at startup                                                             |
| Adversarial subagent review                         | **No way around the guard at P0/P1 level.** 5 P3 findings, all fixed (section 3)                                                                                             |

## 3. Changes made

| File                                                                                                               | Change                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/auth.ts` (new), `src/lib/auth-provider.ts` (new)                                                          | Auth contract, fail-closed policy                                                                                                                                                                                                            |
| `src/lib/env.ts`                                                                                                   | `AUTH_ALLOW_ANONYMOUS` (uses `z.stringbool`; an invalid value stops startup)                                                                                                                                                                 |
| `src/lib/api/backend.ts`                                                                                           | `requireSession()` before every `fetch`; prefers the user's token                                                                                                                                                                            |
| `src/lib/action-result.ts`                                                                                         | Turns `AuthError` into a user-facing message (not logged as an error)                                                                                                                                                                        |
| `src/features/tasks/actions.ts`, `constants.ts`                                                                    | `tasks:write` guard in all 4 actions; `TASK_PERMISSIONS` constant                                                                                                                                                                            |
| `src/app/(app)/tasks/page.tsx`, `dashboard/page.tsx`                                                               | "Sign-in required" state; reads request-time data before checking the session                                                                                                                                                                |
| `src/instrumentation-node.ts`                                                                                      | Warning at startup if `AUTH_ALLOW_ANONYMOUS=true`                                                                                                                                                                                            |
| `next.config.ts`                                                                                                   | CSP and security headers; `poweredByHeader: false`                                                                                                                                                                                           |
| `src/instrumentation-client.ts` (new)                                                                              | `config({ jitless: true })` for Zod (section 4)                                                                                                                                                                                              |
| `e2e/fixtures.ts` (new), `e2e/security.spec.ts` (new), `e2e/tasks.spec.ts`                                         | Fixture that automatically catches CSP violations for **every** E2E test; tests for headers and the theme script                                                                                                                             |
| `.github/workflows/ci.yml`                                                                                         | `permissions: contents: read`; added a `pnpm audit --prod` step                                                                                                                                                                              |
| `public/.gitkeep` (new)                                                                                            | CI bug fix: git does not store the empty `public/` folder, which made the Storybook build fail on a fresh clone                                                                                                                              |
| New tests: `auth.test.ts`, `backend.test.ts`, `env.test.ts`; extended `actions.test.ts`                            | 77 → **85** tests                                                                                                                                                                                                                            |
| `src/lib/**`, `src/components/**` (comments, tests, stories)                                                       | Changed "task" examples to neutral words (`orders`, `item`), so the shared layer does not mention the demo                                                                                                                                   |
| `README.md`, `.env.example`, `docs/api-integration.md` §8, `docs/architecture.md` §9, `docs/create-new-feature.md` | Documentation of the auth contract; the `AUTH_ALLOW_ANONYMOUS` flag; the tutorial uses `requireSession` and an id allowlist (previously the tutorial used `typeof id === 'string'`, which would recreate the SEC-2 bug in every new feature) |

## 4. Security headers and CSP

**Headers sent on every route** (`next.config.ts`):

| Header                    | Value                                                                                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'` (plus `'unsafe-eval'` in dev)`; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
| `X-Content-Type-Options`  | `nosniff`                                                                                                                                                                                                                                              |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`                                                                                                                                                                                                                      |
| `X-Frame-Options`         | `DENY`                                                                                                                                                                                                                                                 |
| `Permissions-Policy`      | `camera=(), microphone=(), geolocation=(), browsing-topics=()`                                                                                                                                                                                         |
| `X-Powered-By`            | Disabled                                                                                                                                                                                                                                               |

**Why no nonce:** the docs state clearly that nonces require every page to be rendered dynamically, and "**Partial Prerendering (PPR) is incompatible** with nonce-based CSP" (`02-guides/content-security-policy.md`, "Static vs Dynamic Rendering with CSP"). `/dashboard` and `/tasks` use PPR. A hash for the theme script does not help either: when a hash is present, the browser ignores `'unsafe-inline'`, and Next's own inline RSC scripts would be blocked.

**`upgrade-insecure-requests` is not included by default:** this directive breaks plain-HTTP deployments on internal networks (subagent P3-2). Turn it back on when running behind HTTPS; HSTS should be set at the proxy or CDN.

**Finding during verification.** The new CSP test caught a real violation in the production build: `script-src eval`.

- **Source:** Zod v4 tries calling `Function("")` to JIT-compile parsers (`zod/v4/core/util.js:218`, `allowsEval`).
- **Consequence:** validation still works (Zod falls back to another approach on its own), but every visit to `/tasks` produced a violation report.
- **Fix:** use the official API `config({ jitless: true })` in `src/instrumentation-client.ts`, which runs only in the browser.
- **Measured cost:** `/dashboard` from 187.3 → 192.6 KiB gzip (+5.3 KiB); `/tasks` +1.1 KiB.

**Verification:**

- `e2e/security.spec.ts`: headers are present and `X-Powered-By` is absent; the theme script still runs under the CSP.
- Fixture `e2e/fixtures.ts`: **every** test fails if there is a `securitypolicyviolation`. Mutation test: removing the `jitless` config makes 7 tests fail with "CSP violation: script-src eval"; restoring it gives 9/9 passing.
- 9/9 E2E pass in production (`CI=1`) and in `pnpm dev`. Server Actions (POST), theme toggle, dialogs and navigation are all not blocked.

**Remaining limitation:** `'unsafe-inline'` for scripts means the CSP does **not** prevent inline XSS. The main line of defence is still React's automatic escaping of content; the only `dangerouslySetInnerHTML` in the app is a constant. A stricter CSP would require turning off PPR to use nonces, or trying SRI (experimental).

## 5. CI and release

| Requirement                                     | Status              | Evidence                                                                                               |
| ----------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------ |
| Node matches `.nvmrc`                           | ✅                  | `actions/setup-node@v7` with `node-version-file: .nvmrc` (24)                                          |
| pnpm matches `packageManager`                   | ✅                  | `pnpm/action-setup@v6` does not set `version`, so it reads `pnpm@12.11.2`                              |
| Install with frozen lockfile                    | ✅ local            | Clean copy: "Lockfile is up to date"                                                                   |
| Typecheck, ESLint, unit tests, build, Storybook | ✅ local            | Clean copy: all exit 0 (after fixing `public/`)                                                        |
| Playwright                                      | ✅ local            | Clean copy: 9/9. The `--with-deps` step only has an effect on Linux, not verified on ubuntu            |
| Workflow syntax                                 | ✅                  | `actionlint` 1.7.12: no errors                                                                         |
| Workflow security                               | ✅ (fixed)          | Added `permissions: contents: read`                                                                    |
| Runs on GitHub Actions                          | ❌ **NOT VERIFIED** | No `git remote`; only 17 files tracked; `pnpm-lock.yaml`, `.nvmrc` and all of `src/` are not committed |

**Real CI bug found and fixed:** the `public/` folder became empty after removing the sample SVGs. Git does not store empty folders, so a clone has no `public/`, and `storybook build` fails with "no such directory: ./public" (because of `staticDirs`). When running locally the bug was hidden because the empty folder still existed. Added `public/.gitkeep`.

**Recommendations (not done):** pin actions by commit SHA to protect against supply-chain attacks via tags; consider using Dependabot or Renovate for updates.

## 6. Dependency stability

- **No packages added.** No Zustand, TanStack Query, Axios or auth library. Storybook is kept.
- No major upgrades. No overrides used.
- **SEC-6:** still only monitored (dev-only, no patch available yet). CI runs `pnpm audit --prod` (no vulnerabilities), so it does not fail because of vulnerabilities that exist only in dev.
- `zod/v4/core` is a subpath of the already installed `zod` package, not a new dependency.

## 7. Template reusability

| Step                             | Result | Evidence                                                                                                                     |
| -------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 1. Clone                         | ✅     | The clean copy contains only the files git would commit                                                                      |
| 2. Configure env                 | ✅     | `.env.example` has all variables, including `AUTH_ALLOW_ANONYMOUS`; with a wrong env the server stops at startup             |
| 3. Run the app                   | ✅     | `pnpm dev` and `pnpm start`; E2E 9/9 in both                                                                                 |
| 4. Remove the demo Task          | ✅     | Followed README step 7 exactly on the copy: typecheck, lint, 35 unit tests, build, Storybook and 2 shared E2E tests all pass |
| 5. Add a feature                 | ✅     | The Product tutorial code (updated for auth) passes typecheck and lint                                                       |
| 6. Connect a REST backend        | ✅     | Mock backend: fail-closed by default; reads and writes work when there is a session                                          |
| 7. Reuse shared components       | ✅     | After removing the demo, `src/components` and `src/lib` have no remaining references to "task"                               |
| 8. Test and build for production | ✅     | Section 9                                                                                                                    |

Change made to keep the template neutral: the CSP check was turned into a shared fixture instead of following the Task flow, so it **does not break when the demo is removed**.

## 8. Remaining risks

| ID  | Level           | Risk                                                                                                                 | Mitigation                                                                                          |
| --- | --------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| R1  | Deploy blocker  | No real auth yet: REST mode rejects everything until `resolveSession()` is implemented                               | Intentional (fail-closed); contract and example in `docs/api-integration.md` §8                     |
| R2  | Release blocker | CI has not run on GitHub; code is not committed                                                                      | Commit (including `pnpm-lock.yaml`, `.nvmrc`, `public/.gitkeep`), push, confirm both jobs are green |
| R3  | P2              | Enabling `AUTH_ALLOW_ANONYMOUS=true` in the wrong place gives every visitor the full permissions of `API_TOKEN`      | Default `false`; a warning at startup; an invalid value stops startup; documented                   |
| R4  | P2              | If the provider does not return `accessToken`, the backend treats every user as the service account (IDOR by design) | Documented in the `auth-provider.ts` docblock and docs §8                                           |
| R5  | P3              | CSP has `'unsafe-inline'`, cannot block inline XSS                                                                   | React escapes automatically; nonces are incompatible with PPR (section 4)                           |
| R6  | P3              | No `upgrade-insecure-requests` and no HSTS                                                                           | Set at the HTTPS layer (proxy or CDN)                                                               |
| R7  | P3              | No rate limiting for Server Actions                                                                                  | The Next docs recommend it for expensive operations; set it at the gateway or backend               |
| R8  | P3              | REST fail-closed has no automated E2E yet (only unit tests, mutation tests and manual browser verification)          | Could add a second Playwright project with a mock backend (`next start` on a separate port)         |
| R9  | P3              | SEC-6 (`braces`, dev-only), ESLint 9 deprecated (DEP-2)                                                              | Monitor upstream                                                                                    |
| R10 | P3              | If demo mode is deployed publicly, anyone can modify the demo data (max 500 tasks, held in RAM)                      | Acceptable for a demo; production must use `API_MODE=rest`                                          |

## 9. Check results (actually run, after all changes)

| Command                                            | Result                                                       |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `pnpm install --frozen-lockfile`                   | Lockfile is up to date                                       |
| `pnpm audit --prod`                                | No known vulnerabilities found                               |
| `pnpm audit`                                       | 1 high (SEC-6, dev-only)                                     |
| `pnpm typecheck`, `pnpm lint`, `pnpm format:check` | Pass                                                         |
| `pnpm test`                                        | **85/85** (15 files)                                         |
| `pnpm test:coverage`                               | 70.3% statements (before: 65.2%)                             |
| `pnpm build`                                       | Pass; `/dashboard`, `/tasks` are still `◐` Partial Prerender |
| `CI=1 pnpm test:e2e` (production)                  | **9/9**, 0 CSP violations                                    |
| `pnpm test:e2e` (dev)                              | **9/9**                                                      |
| `pnpm build-storybook`                             | Pass                                                         |
| `actionlint .github/workflows/ci.yml`              | No errors                                                    |
| Simulated CI on a clean copy                       | Every step exits 0                                           |
| Removing the demo on a clean copy                  | All checks pass                                              |
| Build in REST mode, enable anonymous at runtime    | No `[auth]` warning at build time; the page shows real data  |
| GitHub Actions remote                              | **NOT VERIFIED**                                             |

## 10. Final Production-Readiness Verdict

- **Reusable template: READY.** Architecture, dependencies, secure defaults (fail-closed, CSP), CI and documentation have all been verified; removing the demo has actually been tried.
- **A production application built from the template: NOT READY** until:
  1. `resolveSession()` is implemented with a real sign-in provider, and returns `accessToken` (R1, R4).
  2. Commit, push and confirm GitHub Actions is green (R2).
  3. HTTPS, HSTS and rate limiting are set up at the infrastructure layer (R6, R7).

The serious authorization risk (anonymous visitors using `API_TOKEN`) is **no longer the default**. It only comes back if someone deliberately enables `AUTH_ALLOW_ANONYMOUS=true`.
