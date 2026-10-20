import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Decorative placeholder; the loading region itself should carry aria-busy or a status message. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div aria-hidden className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
  )
}
