---
name: api-integration
description: 'Connect a REST endpoint or backend resource: Zod response schemas, repository adapter (demo + REST), backendRequest, error mapping, auth token forwarding. Use when wiring a feature to a real backend, changing an API contract, or mapping a backend that uses snake_case, envelopes or 0-based paging.'
---

# API integration

## Read first

`docs/api-integration.md` (contract, error codes, adapting a different backend, auth §8), `docs/ai/rules/security.md`, `src/lib/api/http-client.ts`, `src/lib/api/backend.ts`.

## Steps

1. **Contract.** Write the endpoint table (method, path, query, body, response, error shape) from the backend's docs or OpenAPI. Done when every repository method maps to one row. Unknown parts: ask; never guess field names silently.
2. **Response schemas** in the feature's `schemas.ts`. If the backend shape differs from the domain type, add a backend schema with `.transform()` to the domain type **inside the REST adapter**, so the UI keeps using the domain type (example in `docs/api-integration.md` §4).
3. **Repository contract** in `types.ts`; the UI and actions depend only on it.
4. **REST adapter** (`services/rest-<f>-repository.ts`, `import 'server-only'`): every call through `backendRequest(path, { method, query, body, schema })`. Ids in paths only after the id allowlist and with `encodeURIComponent`.
5. **Demo adapter** stays working (bounded in-memory store) so local dev and E2E run without the backend.
6. **Errors**: rely on `ApiError` codes (`NOT_FOUND`, `VALIDATION_ERROR`, `TIMEOUT`, `NETWORK_ERROR`, `INVALID_RESPONSE`, `HTTP_ERROR`). To show backend field errors, map `error.details` to `fieldErrors` in the action. Never pass 5xx/401/403 text to users.
7. **Auth**: nothing to add per call. `backendRequest()` already requires a session and forwards `session.accessToken` (fallback `API_TOKEN`). New identity logic goes only in `src/lib/auth-provider.ts`.
8. **Client-side fetching** only for polling/infinite scroll/autocomplete: a Route Handler (BFF) that calls the repository after `requireSession()`; the browser never calls the backend directly.
9. **Tests**: adapter with mocked `fetch` (success, 404, 422, invalid response), schema transforms. Verify with the `testing-and-verification` skill.

## Pitfalls

- `fetch` or `backendRequest` inside components (R-FEAT-4).
- Reading `process.env` directly instead of `serverEnv`; adding `NEXT_PUBLIC_` to anything backend-related.
- Skipping `schema:` on `backendRequest`: invalid backend data then breaks the UI far from its cause.

## Output

Endpoint table, files changed, error mapping decisions, test results; mark which parts were verified against a real or mock backend.
