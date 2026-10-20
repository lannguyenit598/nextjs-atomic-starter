import { CircleCheck, CircleDashed, ListTodo, Timer } from 'lucide-react'

import { StatCard } from '@/components/molecules/stat-card'

import type { TaskStats as TaskStatsData } from '../types'

export function TaskStats({ stats }: { stats: TaskStatsData }) {
  const completion = stats.total ? Math.round((stats.done / stats.total) * 100) : 0
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total tasks" value={stats.total} icon={<ListTodo />} />
      <StatCard label="To do" value={stats.todo} icon={<CircleDashed />} />
      <StatCard label="In progress" value={stats.in_progress} icon={<Timer />} />
      <StatCard
        label="Done"
        value={stats.done}
        icon={<CircleCheck />}
        description={`${completion}% complete`}
      />
    </div>
  )
}
