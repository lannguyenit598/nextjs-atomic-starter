import type { Metadata } from 'next'
import { LockKeyhole } from 'lucide-react'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { EmptyState } from '@/components/molecules/empty-state'
import { PageHeader } from '@/components/molecules/page-header'
import { RecentTasks } from '@/features/tasks/components/recent-tasks'
import { TaskStats } from '@/features/tasks/components/task-stats'
import { taskRepository } from '@/features/tasks/services/task-repository'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = { title: 'Dashboard' }

/** Atomic "Page": the DashboardTemplate filled with real data. */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Overview of your team's work." />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

async function DashboardContent() {
  // Always render per request (fresh data); never bake a build-time snapshot.
  await connection()
  if (!(await getSession())) {
    return (
      <EmptyState
        icon={<LockKeyhole />}
        title="Sign-in required"
        description="You need to be signed in to see this page."
      />
    )
  }
  const [stats, recent] = await Promise.all([
    taskRepository.stats(),
    taskRepository.list({ page: 1, pageSize: 5 }),
  ])
  return (
    <>
      <TaskStats stats={stats} />
      <RecentTasks tasks={recent.items} />
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-6">
      <span className="sr-only">Loading dashboard…</span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  )
}
