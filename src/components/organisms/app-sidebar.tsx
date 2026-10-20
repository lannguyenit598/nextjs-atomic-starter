import Link from 'next/link'
import type { ReactNode } from 'react'

import { NavMenu, type NavItem } from '@/components/molecules/nav-menu'
import { cn } from '@/lib/utils'

export type AppSidebarProps = {
  brand: ReactNode
  items: readonly NavItem[]
  className?: string
}

/** Desktop navigation column. On small screens use MobileNav instead. */
export function AppSidebar({ brand, items, className }: AppSidebarProps) {
  return (
    <aside className={cn('flex h-full flex-col gap-4 border-r bg-card p-4', className)}>
      <Link href="/" className="px-3 py-1 text-base font-semibold">
        {brand}
      </Link>
      <nav aria-label="Main" className="flex-1">
        <NavMenu items={items} />
      </nav>
    </aside>
  )
}
