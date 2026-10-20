import { ListTodo } from 'lucide-react'

import { EmptyState } from '@/components/molecules/empty-state'
import { DataTable, type DataTableColumn } from '@/components/organisms/data-table'
import { formatDate } from '@/lib/utils'

import type { Task } from '../types'
import { TaskPriorityBadge } from './task-badges'
import { DeleteTaskButton } from './delete-task-button'
import { TaskFormDialog } from './task-form-dialog'
import { TaskStatusSelect } from './task-status-select'

const columns: DataTableColumn<Task>[] = [
  {
    id: 'title',
    header: 'Task',
    cell: (task) => (
      <div className="flex max-w-md flex-col gap-0.5">
        <span className="font-medium">{task.title}</span>
        {task.description && (
          <span className="truncate text-xs text-muted-foreground">{task.description}</span>
        )}
      </div>
    ),
  },
  { id: 'status', header: 'Status', cell: (task) => <TaskStatusSelect task={task} /> },
  {
    id: 'priority',
    header: 'Priority',
    cell: (task) => <TaskPriorityBadge priority={task.priority} />,
  },
  {
    id: 'due',
    header: 'Due',
    className: 'whitespace-nowrap text-muted-foreground',
    cell: (task) => (task.dueDate ? formatDate(task.dueDate) : '—'),
  },
  {
    id: 'actions',
    header: <span className="sr-only">Actions</span>,
    className: 'w-px',
    cell: (task) => (
      <div className="flex justify-end gap-1">
        <TaskFormDialog task={task} />
        <DeleteTaskButton task={task} />
      </div>
    ),
  },
]

/** Server Component: composes the generic DataTable organism with task-specific cells. */
export function TaskTable({ tasks, filtered }: { tasks: Task[]; filtered: boolean }) {
  return (
    <DataTable
      caption="Tasks"
      columns={columns}
      rows={tasks}
      getRowKey={(task) => task.id}
      empty={
        <EmptyState
          icon={<ListTodo />}
          title={filtered ? 'No matching tasks' : 'No tasks yet'}
          description={
            filtered
              ? 'Try a different search term or status filter.'
              : 'Create your first task to get started.'
          }
        />
      }
    />
  )
}
