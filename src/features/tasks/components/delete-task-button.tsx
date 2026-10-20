'use client'

import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Button } from '@/components/atoms/button'
import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog'
import { callAction } from '@/lib/action-result'

import { deleteTaskAction } from '../actions'
import type { Task } from '../types'

export function DeleteTaskButton({ task }: { task: Pick<Task, 'id' | 'title'> }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const confirm = () =>
    startTransition(async () => {
      const result = await callAction(() => deleteTaskAction(task.id))
      if (result.ok) setOpen(false)
      else setError(result.error)
    })

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${task.title}`}
        onClick={() => {
          setError(undefined)
          setOpen(true)
        }}
      >
        <Trash2 aria-hidden />
      </Button>
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete task?"
        description={`"${task.title}" will be permanently deleted.`}
        confirmLabel="Delete"
        destructive
        pending={pending}
        error={error}
        onConfirm={confirm}
      />
    </>
  )
}
