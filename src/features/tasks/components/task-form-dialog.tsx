'use client'

import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/atoms/button'
import { Dialog } from '@/components/molecules/dialog'

import { createTaskAction, updateTaskAction } from '../actions'
import type { Task } from '../types'
import { TaskForm } from './task-form'

/** Create mode without `task`, edit mode with it. Owns its trigger button and open state. */
export function TaskFormDialog({ task }: { task?: Task }) {
  const [open, setOpen] = useState(false)
  // Closing mid-submit would unmount the form and hide a server error from the user.
  const [submitting, setSubmitting] = useState(false)

  return (
    <>
      {task ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${task.title}`}
          onClick={() => setOpen(true)}
        >
          <Pencil aria-hidden />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden />
          New task
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={(next) => !submitting && setOpen(next)}
        title={task ? 'Edit task' : 'New task'}
        description={task ? 'Update the task details.' : 'Add a task to your list.'}
      >
        <TaskForm
          defaultValues={
            task && {
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate ?? '',
            }
          }
          submitLabel={task ? 'Save changes' : 'Create task'}
          onSubmit={async (values) => {
            setSubmitting(true)
            try {
              return await (task ? updateTaskAction(task.id, values) : createTaskAction(values))
            } finally {
              setSubmitting(false)
            }
          }}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  )
}
