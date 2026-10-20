import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type AppHeaderProps = {
  /** Left side, e.g. the MobileNav trigger and app name on small screens. */
  start?: ReactNode
  /** Right side, e.g. ThemeToggle, user menu. */
  end?: ReactNode
  className?: string
}

export function AppHeader({ start, end, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-2">{start}</div>
      <div className="flex items-center gap-2">{end}</div>
    </header>
  )
}
