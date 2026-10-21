import 'server-only'

import { backendRequest } from '@/lib/api/backend'
import { requireSession } from '@/lib/auth'

import { TASK_READ_PERMISSION } from '../constants'
import { taskPageSchema, taskSchema, taskStatsSchema } from '../schemas'
import type { TaskRepository } from '../types'

/**
 * REST adapter. Expected backend contract (adjust paths/mapping here, not in the UI):
 *
 *   GET    /tasks?q=&status=&page=&pageSize=  -> { items: Task[], total, page, pageSize }
 *   GET    /tasks/stats                       -> { total, todo, in_progress, done }
 *   POST   /tasks          body: TaskInput    -> Task
 *   PATCH  /tasks/:id      body: Partial<...> -> Task
 *   DELETE /tasks/:id                         -> 204
 *
 * If your backend uses other field names (e.g. snake_case, `data` envelope), map them
 * in this file so the rest of the app keeps using the `Task` type.
 *
 * Reads check `tasks:read` here as well as in the pages (fail-closed, like the write
 * permission in actions.ts), so a page that forgets its check still cannot fetch the data.
 */
export const restTaskRepository: TaskRepository = {
  list: async ({ q, status, page, pageSize }) => {
    await requireSession(TASK_READ_PERMISSION)
    return backendRequest('/tasks', {
      query: { q, status, page, pageSize },
      schema: taskPageSchema,
    })
  },

  stats: async () => {
    await requireSession(TASK_READ_PERMISSION)
    return backendRequest('/tasks/stats', { schema: taskStatsSchema })
  },

  create: (input) =>
    backendRequest('/tasks', {
      method: 'POST',
      body: input,
      schema: taskSchema,
    }),

  update: (id, input) =>
    backendRequest(`/tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
      schema: taskSchema,
    }),

  remove: async (id) => {
    await backendRequest(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
