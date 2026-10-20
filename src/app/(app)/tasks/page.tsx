import type { Metadata } from 'next'
import { LockKeyhole } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { buttonVariants } from '@/components/atoms/button'
import { Skeleton } from '@/components/atoms/skeleton'
import { EmptyState } from '@/components/molecules/empty-state'
import { PageHeader } from '@/components/molecules/page-header'
import { Pagination } from '@/components/molecules/pagination'
import { TaskFilters } from '@/features/tasks/components/task-filters'
import { TaskFormDialog } from '@/features/tasks/components/task-form-dialog'
import { TaskTable } from '@/features/tasks/components/task-table'
import { TASK_PAGE_SIZE, taskListQuerySchema } from '@/features/tasks/schemas'
import { taskRepository } from '@/features/tasks/services/task-repository'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = { title: 'Tasks' }

/**
 * Static shell (header) renders instantly; the list streams in once search params are known.
 * Search, filter and page state live in the URL.
 */
export default function TasksPage({ searchParams }: PageProps<'/tasks'>) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tasks"
        description="Create, track and update your team's tasks."
        actions={<TaskFormDialog />}
      />
      <Suspense fallback={<TaskListSkeleton />}>
        <TaskList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function TaskList({ searchParams }: Pick<PageProps<'/tasks'>, 'searchParams'>) {
  // Request-time data first, so the session check below is never evaluated at build time.
  const raw = await searchParams
  // Reads are checked here for a clear message; backendRequest() enforces it again (fail-closed).
  if (!(await getSession())) {
    return (
      <EmptyState
        icon={<LockKeyhole />}
        title="Sign-in required"
        description="You need to be signed in to see this page."
      />
    )
  }

  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)
  // URL input is untrusted: invalid values fall back to defaults instead of erroring.
  const query = taskListQuerySchema.parse({
    q: first(raw.q),
    status: first(raw.status),
    page: first(raw.page),
  })

  const result = await taskRepository.list({ ...query, pageSize: TASK_PAGE_SIZE })
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize))

  const hrefForPage = (page: number) => {
    const params = new URLSearchParams()
    if (query.q) params.set('q', query.q)
    if (query.status) params.set('status', query.status)
    if (page > 1) params.set('page', String(page))
    const search = params.toString()
    return search ? `/tasks?${search}` : '/tasks'
  }

  return (
    <div className="flex flex-col gap-4">
      <TaskFilters q={query.q} status={query.status} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {result.total} {result.total === 1 ? 'task' : 'tasks'}
      </p>
      {result.items.length === 0 && result.total > 0 ? (
        // Page number past the end (old link, or the last item on this page was deleted).
        <EmptyState
          title="This page is empty"
          description={`The results only have ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}.`}
          action={
            <Link href={hrefForPage(pageCount)} className={buttonVariants({ variant: 'outline' })}>
              Go to page {pageCount}
            </Link>
          }
        />
      ) : (
        <>
          <TaskTable tasks={result.items} filtered={Boolean(query.q || query.status)} />
          <Pagination page={result.page} pageCount={pageCount} hrefForPage={hrefForPage} />
        </>
      )}
    </div>
  )
}

function TaskListSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <span className="sr-only">Loading tasks…</span>
      <Skeleton className="h-9 w-full sm:w-120" />
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
