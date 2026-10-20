---
name: nextjs-server-client-boundaries
description: "Review or fix Server Component vs Client Component design: 'use client' placement, data fetching location, serialization of props, server-only imports, Suspense/loading, caching and Partial Prerendering. Use when adding 'use client', moving data fetching, seeing hydration or 'server-only' build errors, or a route turns static/dynamic unexpectedly."
---

# Server / Client boundaries

## Read first

`docs/ai/rules/nextjs.md` (R-NX-2…6). For any Next.js API you touch, the matching guide in `node_modules/next/dist/docs/01-app/` (this is Next.js 16 with Cache Components; older knowledge is wrong in places).

## Checklist (apply to every file in scope)

1. **`'use client'` is earned**: the file itself uses state, effects, event handlers or browser APIs. Otherwise remove it. Pages and layouts stay Server Components.
2. **The boundary is a leaf**: interactive parts are small client islands inside server markup (`TaskTable` is server; `TaskStatusSelect` is client).
3. **Props cross cleanly**: plain data, JSX elements, Server Actions. No component references, class instances, `Date` objects or closures from server to client.
4. **No server-only leak**: client files import nothing from `@/lib/env`, `@/lib/auth`, `@/lib/api/backend`, `services/*` (all `server-only`). Shared helpers they need must be isomorphic (`@/lib/utils`, `@/lib/api/http-client`, `@/lib/action-result`).
5. **Data is read on the server**: in an async Server Component inside `<Suspense>`; never `fetch` in a client `useEffect` for page data.
6. **Request-time first**: the async section awaits `searchParams` (or `connection()`) before reading the session or repository.
7. **Caching is deliberate**: no `'use cache'` without a reason; never cache per-user data under a shared key.
8. **States exist**: Suspense fallback (skeleton with `aria-busy`), empty state, error boundary or inline `ActionResult` error.

## Verify

`pnpm build` and read the route table: data routes must be `◐` (Partial Prerender) or `ƒ`, never `○`. A `server-only` violation fails this build. Then `pnpm test:e2e` for affected routes.

## Common mistakes

| Symptom                                                          | Cause                                | Fix                                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Build error "Uncached data was accessed outside of `<Suspense>`" | Async data read at page top level    | Move it into a child component inside `<Suspense>`                                                                        |
| Data frozen to build-time values                                 | Read before any request-time API     | `await searchParams` / `await connection()` first                                                                         |
| "You're importing a component that needs server-only"            | Client file imports a server module  | Pass data as props or call a Server Action                                                                                |
| Hydration mismatch on dates/theme                                | Locale/time differs server vs client | Fixed-locale/UTC formatting (`formatDate`) or inline-script pattern from `02-guides/preventing-flash-before-hydration.md` |

## Output

Per file: boundary verdict (keep/move/remove `'use client'`) with the reason, the route-table line from `pnpm build`.
