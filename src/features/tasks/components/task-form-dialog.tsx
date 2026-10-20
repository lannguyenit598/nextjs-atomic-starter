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
        onOpenChange={setOpen}
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
          onSubmit={(values) =>
            task ? updateTaskAction(task.id, values) : createTaskAction(values)
          }
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  )
}
