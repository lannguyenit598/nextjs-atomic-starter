import { Badge } from '@/components/atoms/badge'

import {
  TASK_PRIORITY_BADGE,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_BADGE,
  TASK_STATUS_LABELS,
} from '../constants'
import type { TaskPriority, TaskStatus } from '../types'

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={TASK_STATUS_BADGE[status]}>{TASK_STATUS_LABELS[status]}</Badge>
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={TASK_PRIORITY_BADGE[priority]}>{TASK_PRIORITY_LABELS[priority]}</Badge>
}
