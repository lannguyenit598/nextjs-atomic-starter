import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/lib/api/http-client'
import { AuthError, requireSession } from '@/lib/auth'

import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
  updateTaskStatusAction,
} from './actions'
import { taskRepository } from './services/task-repository'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth')>()),
  requireSession: vi.fn(),
}))
vi.mock('./services/task-repository', () => ({
  taskRepository: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))

const repo = vi.mocked(taskRepository)
const valid = { title: 'Ship it', description: '', status: 'todo', priority: 'low', dueDate: '' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSession).mockResolvedValue({ userId: 'u1', permissions: ['tasks:write'] })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('task Server Actions', () => {
  it('re-validates input on the server and returns field errors', async () => {
    const result = await createTaskAction({ ...valid, title: '' })
    expect(result).toMatchObject({ ok: false, fieldErrors: { title: expect.any(Array) } })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('creates a task with parsed data', async () => {
    const result = await createTaskAction({ ...valid, title: '  Ship it ', extra: 'ignored' })
    expect(result).toEqual({ ok: true })
    expect(repo.create).toHaveBeenCalledWith({ ...valid, dueDate: null })
  })

  it('rejects unknown statuses', async () => {
    expect(await updateTaskStatusAction('task-1', 'archived')).toMatchObject({ ok: false })
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('surfaces 4xx API messages', async () => {
    repo.remove.mockRejectedValue(
      new ApiError('Task not found', { status: 404, code: 'NOT_FOUND' }),
    )
    expect(await deleteTaskAction('task-1')).toEqual({ ok: false, error: 'Task not found' })
  })

  it('rejects path-traversal ids before calling the backend', async () => {
    expect(await deleteTaskAction('..')).toMatchObject({ ok: false })
    expect(repo.remove).not.toHaveBeenCalled()
  })

  it('maps a backend 401 to the sign-in message without leaking its text', async () => {
    repo.remove.mockRejectedValue(
      new ApiError('Invalid service token for tenant 42', { status: 401, code: 'HTTP_ERROR' }),
    )
    const result = await deleteTaskAction('task-1')
    expect(JSON.stringify(result)).not.toContain('token')
    // With per-user tokens a 401 means the session expired: ask the user to sign in again.
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/sign in/i) })
  })

  it('hides 5xx and unknown error details', async () => {
    repo.remove.mockRejectedValue(
      new ApiError('db password wrong', { status: 500, code: 'HTTP_ERROR' }),
    )
    const result = await deleteTaskAction('task-1')
    expect(result).toMatchObject({ ok: false })
    expect(JSON.stringify(result)).not.toContain('password')
  })

  describe('authorization', () => {
    const calls = {
      create: () => createTaskAction(valid),
      update: () => updateTaskAction('task-1', valid),
      status: () => updateTaskStatusAction('task-1', 'done'),
      delete: () => deleteTaskAction('task-1'),
    }

    it.each(Object.entries(calls))('%s is blocked for signed-out callers', async (_, call) => {
      vi.mocked(requireSession).mockRejectedValue(new AuthError('unauthenticated'))
      const result = await call()
      expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/sign in/i) })
      expect(repo.create).not.toHaveBeenCalled()
      expect(repo.update).not.toHaveBeenCalled()
      expect(repo.remove).not.toHaveBeenCalled()
    })

    it.each(Object.entries(calls))('%s requires the tasks:write permission', async (_, call) => {
      vi.mocked(requireSession).mockRejectedValue(new AuthError('forbidden'))
      expect(await call()).toMatchObject({ ok: false, error: expect.stringMatching(/permission/i) })
      expect(requireSession).toHaveBeenCalledWith('tasks:write')
      expect(repo.update).not.toHaveBeenCalled()
    })

    it('checks the caller before validating input', async () => {
      vi.mocked(requireSession).mockRejectedValue(new AuthError('unauthenticated'))
      expect(await createTaskAction({ title: '' })).not.toHaveProperty('fieldErrors')
    })
  })
})
