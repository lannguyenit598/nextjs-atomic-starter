import { z } from 'zod'

import { ApiError } from '@/lib/api/http-client'

/**
 * Serializable result returned by Server Actions.
 * Actions return errors instead of throwing so the UI can show them inline
 * (thrown errors in production are replaced by a generic message).
 */
export type ActionResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }

/**
 * For client callers: turns a rejected Server Action call (network drop, deploy skew) into an ActionResult.
 * Don't wrap actions that call redirect(); let those propagate.
 */
export async function callAction(action: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await action()
  } catch (error) {
    console.error(error)
    return { ok: false, error: 'Could not reach the server. Check your connection and try again.' }
  }
}

export function validationFailure(error: z.ZodError): ActionResult {
  return {
    ok: false,
    error: 'Please fix the highlighted fields.',
    fieldErrors: z.flattenError(error).fieldErrors,
  }
}

const USER_FACING_CODES = new Set<ApiError['code']>([
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'TIMEOUT',
  'NETWORK_ERROR',
])

/** Maps any thrown error to a safe, user-facing ActionResult. Unknown errors are logged, not leaked. */
export function toActionFailure(error: unknown): ActionResult {
  // AuthError from src/lib/auth.ts, matched by name: that module is server-only and this one
  // is also imported by client components.
  if (error instanceof Error && error.name === 'AuthError') {
    const forbidden = (error as Error & { reason?: string }).reason === 'forbidden'
    return {
      ok: false,
      error: forbidden
        ? 'You do not have permission to do this.'
        : 'Your session has expired or you are not signed in. Please sign in and try again.',
    }
  }
  console.error(error)
  // Only pass through messages that are meant for end users. 401/403/5xx usually describe
  // server configuration (e.g. a bad service token) or internals.
  if (
    error instanceof ApiError &&
    USER_FACING_CODES.has(error.code) &&
    error.status !== 401 &&
    error.status !== 403
  ) {
    return { ok: false, error: error.message }
  }
  return { ok: false, error: 'Something went wrong. Please try again.' }
}
