import type { BadgeVariant } from '@/components/atoms/badge'

import { TASK_PRIORITIES, TASK_STATUSES } from './schemas'
import type { TaskPriority, TaskStatus } from './types'

/** Permission strings checked by Server Actions (see Session.permissions in src/lib/auth.ts). */
export const TASK_PERMISSIONS = { write: 'tasks:write' } as const

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export const TASK_STATUS_BADGE: Record<TaskStatus, BadgeVariant> = {
  todo: 'neutral',
  in_progress: 'primary',
  done: 'success',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const TASK_PRIORITY_BADGE: Record<TaskPriority, BadgeVariant> = {
  low: 'outline',
  medium: 'warning',
  high: 'destructive',
}

export const TASK_STATUS_OPTIONS = TASK_STATUSES.map((value) => ({
  value,
  label: TASK_STATUS_LABELS[value],
}))

export const TASK_PRIORITY_OPTIONS = TASK_PRIORITIES.map((value) => ({
  value,
  label: TASK_PRIORITY_LABELS[value],
}))
