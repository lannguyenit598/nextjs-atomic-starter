import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ApiError, buildUrl, httpRequest } from './http-client'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => vi.unstubAllGlobals())

describe('buildUrl', () => {
  it('keeps the base path and skips empty query values', () => {
    const url = buildUrl('https://api.test/v1/', '/orders', {
      q: 'a b',
      status: undefined,
      page: 2,
    })
    expect(url.toString()).toBe('https://api.test/v1/orders?q=a+b&page=2')
  })
})

describe('httpRequest', () => {
  it('sends JSON and returns schema-validated data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ id: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    const data = await httpRequest('https://api.test/x', {
      method: 'POST',
      body: { a: 1 },
      schema: z.object({ id: z.number() }),
    })

    expect(data).toEqual({ id: 1 })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"a":1}')
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
  })

  it('returns undefined for empty (204) responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(httpRequest('https://api.test/x', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('throws ApiError with the server message and a status-based code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ detail: 'Order not found' }, 404)))
    const error = await httpRequest('https://api.test/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'Order not found' })
  })

  it('maps 422 to VALIDATION_ERROR and keeps the body as details', async () => {
    const body = { message: 'Invalid', errors: { title: ['required'] } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(body, 422)))
    await expect(httpRequest('https://api.test/x')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: body,
    })
  })

  it('rejects responses that do not match the schema', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ id: 'not-a-number' })))
    await expect(
      httpRequest('https://api.test/x', { schema: z.object({ id: z.number() }) }),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('maps fetch failures to NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    await expect(httpRequest('https://api.test/x')).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('times out slow requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) =>
            init.signal?.addEventListener('abort', () => reject(init.signal?.reason)),
          ),
      ),
    )
    await expect(httpRequest('https://api.test/x', { timeoutMs: 10 })).rejects.toMatchObject({
      code: 'TIMEOUT',
    })
  })

  it('rethrows caller cancellation untouched', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) =>
            init.signal?.addEventListener('abort', () => reject(init.signal?.reason)),
          ),
      ),
    )
    const request = httpRequest('https://api.test/x', { signal: controller.signal })
    controller.abort()
    await expect(request).rejects.toHaveProperty('name', 'AbortError')
  })
})
