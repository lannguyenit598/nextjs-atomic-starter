'use client'

import { useOptimistic, useState, useTransition } from 'react'

import { Select } from '@/components/atoms/select'
import { callAction } from '@/lib/action-result'

import { updateTaskStatusAction } from '../actions'
import { TASK_STATUS_OPTIONS } from '../constants'
import type { Task, TaskStatus } from '../types'

/** Inline status change with optimistic UI; reverts automatically if the server rejects it. */
export function TaskStatusSelect({ task }: { task: Pick<Task, 'id' | 'title' | 'status'> }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status)
  const [error, setError] = useState<string>()
  const [, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-1">
      <Select
        aria-label={`Status of ${task.title}`}
        className="w-36"
        options={TASK_STATUS_OPTIONS}
        value={optimisticStatus}
        onChange={(event) => {
          const next = event.target.value as TaskStatus
          setError(undefined)
          startTransition(async () => {
            setOptimisticStatus(next)
            const result = await callAction(() => updateTaskStatusAction(task.id, next))
            if (!result.ok) setError(result.error)
          })
        }}
      />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
