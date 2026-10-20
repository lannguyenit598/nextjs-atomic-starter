import 'server-only'

import { serverEnv } from '@/lib/env'

import { resolveSession } from './auth-provider'

/** What the app knows about the caller. Fill it in src/lib/auth-provider.ts. */
export type Session = {
  userId: string
  /**
   * Coarse permissions checked by Server Actions, e.g. 'orders:write'. '*' grants everything.
   * Fine-grained rules (ownership, tenants) belong to the backend, which receives `accessToken`.
   */
  permissions: readonly string[]
  /** The user's own backend token. When set, it is sent instead of the shared API_TOKEN. */
  accessToken?: string
}

export class AuthError extends Error {
  readonly reason: 'unauthenticated' | 'forbidden'

  constructor(reason: 'unauthenticated' | 'forbidden') {
    super(reason === 'unauthenticated' ? 'Sign-in required' : 'Permission denied')
    this.name = 'AuthError'
    this.reason = reason
  }
}

// Demo data is local and disposable, so demo mode needs no sign-in.
const DEMO_SESSION: Session = { userId: 'demo', permissions: ['*'] }
const ANONYMOUS_SESSION: Session = { userId: 'anonymous', permissions: ['*'] }

/** The current caller, or null. Reads request data (cookies), so call it inside <Suspense>. */
export async function getSession(): Promise<Session | null> {
  if (serverEnv.API_MODE === 'demo') return DEMO_SESSION
  if (serverEnv.AUTH_ALLOW_ANONYMOUS) return ANONYMOUS_SESSION
  return resolveSession()
}

export function hasPermission(session: Session, permission: string) {
  return session.permissions.includes('*') || session.permissions.includes(permission)
}

/**
 * Use at the top of every Server Action / Route Handler and in data access code.
 * Throws AuthError; `toActionFailure` turns it into a user-facing ActionResult.
 */
export async function requireSession(permission?: string): Promise<Session> {
  const session = await getSession()
  if (!session) throw new AuthError('unauthenticated')
  if (permission && !hasPermission(session, permission)) throw new AuthError('forbidden')
  return session
}
