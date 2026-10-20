import { z } from 'zod'

/**
 * Single source of truth for the Task domain. Types in ./types.ts are inferred from these.
 * - taskSchema:       shape of a task coming from the backend (response validation)
 * - taskFormSchema:   what the user may submit (client + Server Action validation)
 * - taskListQuerySchema: untrusted URL search params -> safe query object
 */

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const

export const taskStatusSchema = z.enum(TASK_STATUSES)
export const taskPrioritySchema = z.enum(TASK_PRIORITIES)

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z.iso.date().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
})

export const taskPageSchema = z.object({
  items: z.array(taskSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
})

export const taskStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  todo: z.number().int().nonnegative(),
  in_progress: z.number().int().nonnegative(),
  done: z.number().int().nonnegative(),
})

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: 'Title must be at least 3 characters' })
    .max(120, { error: 'Title must be at most 120 characters' }),
  description: z
    .string()
    .trim()
    .max(1000, { error: 'Description must be at most 1000 characters' }),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  /** '' = no due date (what an empty <input type="date"> submits). */
  dueDate: z.union([z.literal(''), z.iso.date({ error: 'Enter a valid date' })]),
})

// Allowlist: ids are interpolated into backend URLs, so '.'/'..' (which URL parsing collapses
// into parent paths) and other special characters must never get through.
export const taskIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/)

export const TASK_PAGE_SIZE = 10

export const taskListQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: taskStatusSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
})
