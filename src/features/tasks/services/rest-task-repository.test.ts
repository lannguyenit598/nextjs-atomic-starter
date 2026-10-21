import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Session } from '@/lib/auth'

import type { Task } from '../types'

const task: Task = {
  id: 'task-1',
  title: 'Ship it',
  description: '',
  status: 'todo',
  priority: 'low',
  dueDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const reader: Session = { userId: 'u1', permissions: ['tasks:read'], accessToken: 'user-token' }

/** Real adapter + backendRequest + auth policy; only env, identity provider and fetch are faked. */
async function setup(session: Session | null, response: () => Response) {
  vi.resetModules()
  vi.doMock('@/lib/env', () => ({
    serverEnv: { API_MODE: 'rest', API_BASE_URL: 'https://api.test/v1', API_TIMEOUT_MS: 1000 },
  }))
  vi.doMock('@/lib/auth-provider', () => ({ resolveSession: async () => session }))
  const fetchMock = vi.fn<(url: URL, init: RequestInit) => Promise<Response>>(async () =>
    response(),
  )
  vi.stubGlobal('fetch', fetchMock)
  const { restTaskRepository } = await import('./rest-task-repository')
  const call = (index = 0) => {
    const [url, init] = fetchMock.mock.calls[index]
    return { url: String(url), method: init.method, body: init.body }
  }
  return { repo: restTaskRepository, fetchMock, call }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.doUnmock('@/lib/env')
  vi.doUnmock('@/lib/auth-provider')
})

describe('restTaskRepository', () => {
  it('lists with the documented query keys and validates the page', async () => {
    const page = { items: [task], total: 1, page: 2, pageSize: 10 }
    const { repo, call } = await setup(reader, () => Response.json(page))
    await expect(repo.list({ q: 'ship', page: 2, pageSize: 10 })).resolves.toEqual(page)
    expect(call()).toMatchObject({
      url: 'https://api.test/v1/tasks?q=ship&page=2&pageSize=10',
      method: 'GET',
    })
  })

  it('rejects a list response that does not match the contract', async () => {
    const { repo } = await setup(reader, () => Response.json({ data: [task] }))
    await expect(repo.list({ page: 1, pageSize: 10 })).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    })
  })

  it('creates, updates and deletes with the documented methods and paths', async () => {
    const { repo, call } = await setup({ ...reader, permissions: ['tasks:write'] }, () =>
      Response.json(task),
    )
    const input = { title: 'Ship it', description: '', status: 'todo', priority: 'low' } as const
    await repo.create({ ...input, dueDate: null })
    await repo.update('task-1', { status: 'done' })
    expect(call(0)).toMatchObject({
      url: 'https://api.test/v1/tasks',
      method: 'POST',
      body: JSON.stringify({ ...input, dueDate: null }),
    })
    expect(call(1)).toMatchObject({
      url: 'https://api.test/v1/tasks/task-1',
      method: 'PATCH',
      body: JSON.stringify({ status: 'done' }),
    })
  })

  it('reads stats from /tasks/stats', async () => {
    const stats = { total: 3, todo: 1, in_progress: 1, done: 1 }
    const { repo, call } = await setup(reader, () => Response.json(stats))
    await expect(repo.stats()).resolves.toEqual(stats)
    expect(call()).toMatchObject({ url: 'https://api.test/v1/tasks/stats', method: 'GET' })
  })

  it('accepts an empty 204 response on delete', async () => {
    const writer: Session = { ...reader, permissions: ['tasks:write'] }
    const { repo, call } = await setup(writer, () => new Response(null, { status: 204 }))
    await expect(repo.remove('task-1')).resolves.toBeUndefined()
    expect(call()).toMatchObject({ url: 'https://api.test/v1/tasks/task-1', method: 'DELETE' })
  })

  it.each(['list', 'stats'] as const)(
    '%s requires tasks:read before calling the backend',
    async (method) => {
      const { repo, fetchMock } = await setup({ ...reader, permissions: ['tasks:write'] }, () =>
        Response.json({}),
      )
      const read = method === 'list' ? repo.list({ page: 1, pageSize: 10 }) : repo.stats()
      await expect(read).rejects.toMatchObject({ name: 'AuthError', reason: 'forbidden' })
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )
})
