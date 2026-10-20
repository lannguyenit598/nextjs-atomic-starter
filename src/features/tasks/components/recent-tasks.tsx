import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { EmptyState } from '@/components/molecules/empty-state'
import { formatDate } from '@/lib/utils'

import type { Task } from '../types'
import { TaskStatusBadge } from './task-badges'

export function RecentTasks({ tasks }: { tasks: Task[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Recently updated</CardTitle>
          <CardDescription>Latest changes across all tasks.</CardDescription>
        </div>
        <Link href="/tasks" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <EmptyState title="No tasks yet" titleAs="h3" />
        ) : (
          <ul className="divide-y">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{task.title}</span>
                  <span className="text-xs text-muted-foreground">
                    Updated {formatDate(task.updatedAt)}
                  </span>
                </div>
                <TaskStatusBadge status={task.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
