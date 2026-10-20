import 'server-only'

import { requireSession } from '@/lib/auth'
import { serverEnv } from '@/lib/env'

import { buildUrl, httpRequest, type HttpRequestOptions } from './http-client'

/**
 * Calls the private REST backend from the server (Server Components, Server Actions, Route Handlers).
 * Base URL, timeout and credentials come from server-only env and never reach the browser.
 *
 * Fail-closed: every call requires a session (src/lib/auth.ts), so a page or action that forgets
 * its own check still cannot reach the backend anonymously. The user's token is forwarded when
 * the session has one; the shared API_TOKEN is only a fallback for an authenticated caller.
 */
export async function backendRequest<T = unknown>(
  path: string,
  options: HttpRequestOptions<T> = {},
): Promise<T> {
  if (serverEnv.API_MODE !== 'rest') {
    throw new Error('backendRequest() requires API_MODE=rest')
  }

  const session = await requireSession()
  const token = session.accessToken ?? serverEnv.API_TOKEN
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  return httpRequest(buildUrl(serverEnv.API_BASE_URL, path, options.query), {
    timeoutMs: serverEnv.API_TIMEOUT_MS,
    ...options,
    headers,
  })
}
