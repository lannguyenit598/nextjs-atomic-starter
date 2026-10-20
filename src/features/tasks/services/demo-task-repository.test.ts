import { beforeEach, describe, expect, it } from 'vitest'

import type { TaskRepository } from '../types'
import { createDemoTaskRepository, seedTasks } from './demo-task-repository'

let repo: TaskRepository

beforeEach(() => {
  repo = createDemoTaskRepository(seedTasks())
})

describe('demo task repository', () => {
  it('paginates', async () => {
    const page = await repo.list({ page: 3, pageSize: 10 })
    expect(page.total).toBe(24)
    expect(page.items).toHaveLength(4)
  })

  it('filters by status and case-insensitive search', async () => {
    const done = await repo.list({ status: 'done', page: 1, pageSize: 50 })
    expect(done.items.every((task) => task.status === 'done')).toBe(true)

    const search = await repo.list({ q: 'REVIEW', page: 1, pageSize: 50 })
    expect(search.items.map((task) => task.title)).toEqual(
      expect.arrayContaining(['Review pull request #42', 'Review security checklist']),
    )
  })

  it('creates, updates and deletes a task', async () => {
    const created = await repo.create({
      title: 'Write docs',
      description: '',
      status: 'todo',
      priority: 'high',
      dueDate: '',
    })
    expect(created.dueDate).toBeNull()
    expect((await repo.list({ page: 1, pageSize: 1 })).items[0].id).toBe(created.id)

    const updated = await repo.update(created.id, { status: 'done', dueDate: '2026-02-01' })
    expect(updated).toMatchObject({ status: 'done', dueDate: '2026-02-01', title: 'Write docs' })

    await repo.remove(created.id)
    expect((await repo.stats()).total).toBe(24)
  })

  it('caps the shared demo store', async () => {
    const input = {
      title: 'x'.repeat(3),
      description: '',
      status: 'todo',
      priority: 'low',
      dueDate: '',
    } as const
    const full = createDemoTaskRepository(seedTasks())
    for (let i = 24; i < 500; i++) await full.create(input)
    await expect(full.create(input)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('reports missing tasks as NOT_FOUND', async () => {
    await expect(repo.update('missing', { status: 'done' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    })
    await expect(repo.remove('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('counts tasks per status', async () => {
    const stats = await repo.stats()
    expect(stats.todo + stats.in_progress + stats.done).toBe(stats.total)
  })
})
