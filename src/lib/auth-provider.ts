import 'server-only'

import type { Session } from './auth'

let warned = false

/**
 * AUTHENTICATION INTEGRATION POINT: the one function to implement for your identity provider.
 *
 * Return the signed-in caller, or null when there is none. Called on the server only, per request.
 * Typical implementations (pick what your backend uses, see docs/api-integration.md §8):
 *  - Backend-issued JWT in an httpOnly cookie: read `(await cookies()).get(...)`, verify it,
 *    return `{ userId, permissions, accessToken }` so the backend receives the user's own token.
 *  - OIDC (Keycloak, Entra ID, Auth0...): read the session of your OIDC library.
 *  - Session cookie owned by the backend: call its "/me" endpoint with the cookie.
 *
 * `permissions` are the strings features check, e.g. 'tasks:read' (pages, REST reads) and
 * 'tasks:write' (Server Actions); write does not imply read. '*' grants everything.
 *
 * Return `accessToken` whenever you can. Without it, backendRequest() falls back to the shared
 * API_TOKEN, so the backend sees every signed-in user as the same service account and cannot
 * enforce per-user rules (ownership, tenants). That is only acceptable for team-wide shared data.
 *
 * The default is FAIL-CLOSED: in API_MODE=rest nobody is signed in, so every backend call and
 * mutation is refused until this is implemented (or AUTH_ALLOW_ANONYMOUS=true is set).
 */
export async function resolveSession(): Promise<Session | null> {
  if (!warned) {
    warned = true
    console.warn(
      '[auth] No authentication provider configured: all REST data access is denied. ' +
        'Implement resolveSession() in src/lib/auth-provider.ts.',
    )
  }
  return null
}
