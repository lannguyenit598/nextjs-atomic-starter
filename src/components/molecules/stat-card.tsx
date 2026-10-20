import type { ReactNode } from 'react'

import { Card } from '@/components/atoms/card'
import { cn } from '@/lib/utils'

export type StatCardProps = {
  label: string
  value: ReactNode
  icon?: ReactNode
  description?: string
  className?: string
}

export function StatCard({ label, value, icon, description, className }: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-2 p-5', className)}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        {icon && (
          <span aria-hidden className="[&_svg]:size-4">
            {icon}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </Card>
  )
}
