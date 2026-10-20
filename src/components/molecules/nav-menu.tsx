'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type NavItem = {
  href: string
  label: string
  /** Pass an element (<ListTodo />), not a component: elements can cross the server/client boundary. */
  icon?: ReactNode
}

export type NavMenuProps = {
  items: readonly NavItem[]
  /** Called after a link is clicked, e.g. to close a mobile drawer. */
  onNavigate?: () => void
  className?: string
}

export function NavMenu({ items, onNavigate, className }: NavMenuProps) {
  const pathname = usePathname()
  return (
    <ul className={cn('flex flex-col gap-1', className)}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-4',
                active && 'bg-accent text-accent-foreground',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
