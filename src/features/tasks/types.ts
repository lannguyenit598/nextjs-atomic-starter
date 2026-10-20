import type { z } from 'zod'

import type {
  taskFormSchema,
  taskListQuerySchema,
  taskPageSchema,
  taskSchema,
  taskStatsSchema,
} from './schemas'

export type Task = z.infer<typeof taskSchema>
export type TaskStatus = Task['status']
export type TaskPriority = Task['priority']
export type TaskPage = z.infer<typeof taskPageSchema>
export type TaskStats = z.infer<typeof taskStatsSchema>
export type TaskFormValues = z.infer<typeof taskFormSchema>
export type TaskListQuery = z.infer<typeof taskListQuerySchema> & { pageSize: number }

/**
 * Data-access contract. The UI and Server Actions only talk to this shape,
 * so switching demo data -> real REST API never touches components.
 */
export type TaskRepository = {
  list(query: TaskListQuery): Promise<TaskPage>
  stats(): Promise<TaskStats>
  create(input: TaskFormValues): Promise<Task>
  update(id: string, input: Partial<TaskFormValues>): Promise<Task>
  remove(id: string): Promise<void>
}
