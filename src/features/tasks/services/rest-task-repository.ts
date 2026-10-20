import 'server-only'

import { backendRequest } from '@/lib/api/backend'

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
 */
export const restTaskRepository: TaskRepository = {
  list: ({ q, status, page, pageSize }) =>
    backendRequest('/tasks', { query: { q, status, page, pageSize }, schema: taskPageSchema }),

  stats: () => backendRequest('/tasks/stats', { schema: taskStatsSchema }),

  create: (input) =>
    backendRequest('/tasks', {
      method: 'POST',
      body: { ...input, dueDate: input.dueDate || null },
      schema: taskSchema,
    }),

  update: (id, input) =>
    backendRequest(`/tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input.dueDate === undefined ? input : { ...input, dueDate: input.dueDate || null },
      schema: taskSchema,
    }),

  remove: async (id) => {
    await backendRequest(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
