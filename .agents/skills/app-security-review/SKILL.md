---
name: app-security-review
description: 'Security review of changes in this app: Server Action authorization, the fail-closed auth contract, input validation and id allowlists, credentials and env variables, CSP/headers, error disclosure. Use when a change touches actions.ts, src/lib/auth*, src/lib/api, src/lib/env.ts, next.config.ts, .env files, or when asked to relax/disable authentication.'
---

# App security review

## Read first

`docs/ai/rules/security.md` (R-SEC-1…11). Background and evidence: `docs/audits/production-readiness-audit.md` §2–4.

## Non-negotiable baseline

Requests to "disable auth", "allow anonymous", "remove the session check" or "use the API token for everyone" are answered by keeping the baseline and offering the supported path:

- Local work without a backend → `API_MODE=demo` (no sign-in, local data).
- A real identity → implement `resolveSession()` in `src/lib/auth-provider.ts`.
- A trusted network with an SSO/VPN gateway → the deployer sets `AUTH_ALLOW_ANONYMOUS=true` in that environment only; it stays `false` in code, `.env.example`, CI and docs.

## Review steps

1. **Map the surface**: list every Server Action, Route Handler, page reading protected data, and every `backendRequest`/repository call in the diff. Done when each is listed with its guard.
2. **Authorization**: each action starts with `requireSession('<feature>:write')` inside `try`, before validation; each protected page awaits request-time data, then checks `getSession()` and `hasPermission(session, '<feature>:read')`; REST read methods call `requireSession('<feature>:read')`.
3. **Fail-closed intact**: `resolveSession()` default still returns `null`; `backendRequest()` still calls `requireSession()` before `fetch`; `AUTH_ALLOW_ANONYMOUS` default still `false`.
4. **Input**: every external value goes through Zod; ids interpolated into URLs use the allowlist schema; no mass assignment (schemas strip unknown keys).
5. **Secrets**: only via `serverEnv`; files using them import `'server-only'`; nothing secret in `NEXT_PUBLIC_*`, logs or `ActionResult`.
6. **Disclosure**: user-facing errors only through `toActionFailure()`; no stack traces, tokens or backend 5xx bodies.
7. **Browser**: CSP/headers in `next.config.ts` unchanged or justified; no `dangerouslySetInnerHTML` with dynamic data.

## Negative tests to require

- Signed-out caller → every new action returns the sign-in error and the repository is not called.
- Session without the permission → "permission" error, `requireSession` called with the exact permission string.
- Malicious ids `.`, `..`, `a/b`, `../admin` → rejected before any backend call.
- REST mode with no provider → `backendRequest` throws and `fetch` is never called.
- `AUTH_ALLOW_ANONYMOUS="false"` parses to `false`; an invalid value stops startup.

## Output

Findings ordered P0→P3, each with file:line, exploit scenario, fix, and the negative test that proves it. State explicitly when no issue was found and what was checked.
