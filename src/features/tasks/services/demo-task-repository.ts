import 'server-only'

import { ApiError } from '@/lib/api/http-client'

import { TASK_PRIORITIES, TASK_STATUSES } from '../schemas'
import type { Task, TaskRepository } from '../types'

/**
 * DEMO PERSISTENCE ONLY. Tasks live in server memory:
 * - reset on every server restart / deploy
 * - not shared between server instances (serverless, multiple pods)
 * Use API_MODE=rest for anything real. See docs/api-integration.md.
 */

// Anyone can write to the shared demo store, so keep it bounded.
const MAX_TASKS = 500

// Simulated network latency so loading states are visible in demo mode.
const LATENCY_MS = process.env.NODE_ENV === 'test' ? 0 : 300

const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS))

const SEED_TITLES = [
  'Set up CI pipeline',
  'Design login screen',
  'Write API contract for orders',
  'Fix pagination bug in reports',
  'Review pull request #42',
  'Migrate database to v2 schema',
  'Prepare sprint demo',
  'Update onboarding docs',
  'Add audit logging',
  'Investigate slow dashboard query',
  'Configure error monitoring',
  'Refactor invoice service',
  'Plan Q3 roadmap',
  'Rotate API credentials',
  'Add export to CSV',
  'Improve form accessibility',
  'Clean up feature flags',
  'Load test checkout flow',
  'Translate UI to Vietnamese',
  'Archive old projects',
  'Set up staging environment',
  'Write unit tests for billing',
  'Review security checklist',
  'Customer feedback triage',
]

export function seedTasks(): Task[] {
  const base = Date.UTC(2026, 0, 1)
  const day = 24 * 60 * 60 * 1000
  return SEED_TITLES.map((title, index) => {
    const created = new Date(base + index * day).toISOString()
    return {
      id: `task-${index + 1}`,
      title,
      description: index % 3 === 0 ? '' : `Details for "${title}".`,
      status: TASK_STATUSES[index % TASK_STATUSES.length],
      priority: TASK_PRIORITIES[(index * 2) % TASK_PRIORITIES.length],
      dueDate:
        index % 4 === 0 ? null : new Date(base + (index + 14) * day).toISOString().slice(0, 10),
      createdAt: created,
      updatedAt: created,
    }
  })
}

function notFound(id: string): never {
  throw new ApiError(`Task "${id}" was not found`, { status: 404, code: 'NOT_FOUND' })
}

/** `tasks` is mutated in place; pass a fresh array per test for isolation. */
export function createDemoTaskRepository(tasks: Task[]): TaskRepository {
  return {
    async list({ q, status, page, pageSize }) {
      await delay()
      const needle = q?.toLowerCase()
      const matches = tasks
        .filter((task) => !status || task.status === status)
        .filter(
          (task) =>
            !needle ||
            task.title.toLowerCase().includes(needle) ||
            task.description.toLowerCase().includes(needle),
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      const start = (page - 1) * pageSize
      return {
        items: matches.slice(start, start + pageSize),
        total: matches.length,
        page,
        pageSize,
      }
    },

    async stats() {
      await delay()
      const count = (status: Task['status']) => tasks.filter((t) => t.status === status).length
      return {
        total: tasks.length,
        todo: count('todo'),
        in_progress: count('in_progress'),
        done: count('done'),
      }
    },

    async create(input) {
      await delay()
      if (tasks.length >= MAX_TASKS) {
        throw new ApiError(`Demo limit reached (${MAX_TASKS} tasks). Delete some tasks first.`, {
          status: 422,
          code: 'VALIDATION_ERROR',
        })
      }
      const now = new Date().toISOString()
      const task: Task = {
        id: crypto.randomUUID(),
        ...input,
        createdAt: now,
        updatedAt: now,
      }
      tasks.push(task)
      return task
    },

    async update(id, input) {
      await delay()
      const index = tasks.findIndex((task) => task.id === id)
      if (index === -1) notFound(id)
      const updated: Task = {
        ...tasks[index],
        ...input,
        updatedAt: new Date().toISOString(),
      }
      tasks[index] = updated
      return updated
    },

    async remove(id) {
      await delay()
      const index = tasks.findIndex((task) => task.id === id)
      if (index === -1) notFound(id)
      tasks.splice(index, 1)
    },
  }
}

// Kept on globalThis so the data survives dev hot reloads (module re-evaluation).
const globalStore = globalThis as typeof globalThis & { __demoTasks?: Task[] }

export const demoTaskRepository = createDemoTaskRepository(
  (globalStore.__demoTasks ??= seedTasks()),
)
