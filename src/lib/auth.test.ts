import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Session } from './auth'

const REST = { API_MODE: 'rest', API_BASE_URL: 'https://api.test/v1', API_TIMEOUT_MS: 1000 }

/** Loads the real auth module with a given env and identity-provider result. */
async function loadAuth(env: object, providerSession: Session | null = null) {
  vi.resetModules()
  vi.doMock('@/lib/env', () => ({ serverEnv: env }))
  vi.doMock('./auth-provider', () => ({ resolveSession: async () => providerSession }))
  return import('./auth')
}

afterEach(() => {
  vi.doUnmock('@/lib/env')
  vi.doUnmock('./auth-provider')
})

describe('auth policy', () => {
  it('demo mode has a local session with all permissions', async () => {
    const { requireSession } = await loadAuth({ API_MODE: 'demo' })
    await expect(requireSession('orders:write')).resolves.toMatchObject({ userId: 'demo' })
  })

  it('REST mode fails closed when no provider session exists', async () => {
    const { getSession, requireSession } = await loadAuth({ ...REST, AUTH_ALLOW_ANONYMOUS: false })
    expect(await getSession()).toBeNull()
    await expect(requireSession()).rejects.toMatchObject({
      name: 'AuthError',
      reason: 'unauthenticated',
    })
  })

  it('REST mode uses the provider session and enforces permissions', async () => {
    const reader: Session = { userId: 'u1', permissions: ['orders:read'] }
    const { requireSession } = await loadAuth({ ...REST, AUTH_ALLOW_ANONYMOUS: false }, reader)
    await expect(requireSession('orders:read')).resolves.toBe(reader)
    await expect(requireSession('orders:write')).rejects.toMatchObject({ reason: 'forbidden' })
  })

  it('anonymous access only when explicitly allowed', async () => {
    const { requireSession } = await loadAuth({ ...REST, AUTH_ALLOW_ANONYMOUS: true })
    await expect(requireSession('orders:write')).resolves.toMatchObject({ userId: 'anonymous' })
  })
})
