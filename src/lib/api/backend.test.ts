import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Session } from '@/lib/auth'

const env = (allowAnonymous: boolean) => ({
  API_MODE: 'rest',
  API_BASE_URL: 'https://api.test/v1',
  API_TOKEN: 'service-token',
  API_TIMEOUT_MS: 1000,
  AUTH_ALLOW_ANONYMOUS: allowAnonymous,
})

/** Real backendRequest + real auth policy; only env, identity provider and fetch are faked. */
async function setup(allowAnonymous: boolean, providerSession: Session | null) {
  vi.resetModules()
  vi.doMock('@/lib/env', () => ({ serverEnv: env(allowAnonymous) }))
  vi.doMock('@/lib/auth-provider', () => ({ resolveSession: async () => providerSession }))
  const fetchMock = vi.fn(async () => Response.json({ ok: true }))
  vi.stubGlobal('fetch', fetchMock)
  const { backendRequest } = await import('./backend')
  return { backendRequest, fetchMock }
}

const authHeader = (fetchMock: ReturnType<typeof vi.fn>) =>
  new Headers((fetchMock.mock.calls[0] as [string, RequestInit])[1].headers).get('Authorization')

afterEach(() => {
  vi.unstubAllGlobals()
  vi.doUnmock('@/lib/env')
  vi.doUnmock('@/lib/auth-provider')
})

describe('backendRequest (fail-closed)', () => {
  it('never calls the backend without a session, so the service token cannot be borrowed', async () => {
    const { backendRequest, fetchMock } = await setup(false, null)
    await expect(backendRequest('/orders', { method: 'DELETE' })).rejects.toMatchObject({
      name: 'AuthError',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("forwards the signed-in user's own token instead of the service token", async () => {
    const { backendRequest, fetchMock } = await setup(false, {
      userId: 'u1',
      permissions: [],
      accessToken: 'user-token',
    })
    await backendRequest('/orders')
    expect(authHeader(fetchMock)).toBe('Bearer user-token')
  })

  it('uses the service token only for an allowed caller', async () => {
    const { backendRequest, fetchMock } = await setup(true, null)
    await backendRequest('/orders')
    expect(authHeader(fetchMock)).toBe('Bearer service-token')
  })
})
