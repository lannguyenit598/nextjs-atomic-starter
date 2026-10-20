import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { buttonVariants } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

export type PaginationProps = {
  page: number
  pageCount: number
  /** Builds the URL for a page, so pagination works with links (no client JS, shareable URLs). */
  hrefForPage: (page: number) => string
  className?: string
}

/** Page numbers to render: always first/last, current ±1, 'ellipsis' for gaps. */
export function getPageItems(page: number, pageCount: number): (number | 'ellipsis')[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)
  const items: (number | 'ellipsis')[] = []
  for (const p of sorted) {
    const previous = items.at(-1)
    if (typeof previous === 'number' && p - previous > 1) items.push('ellipsis')
    items.push(p)
  }
  return items
}

export function Pagination({ page, pageCount, hrefForPage, className }: PaginationProps) {
  if (pageCount <= 1) return null

  const edgeLink = (target: number, label: string, children: ReactNode) => {
    const disabled = target < 1 || target > pageCount
    const classes = cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')
    return disabled ? (
      // Not focusable or announced: there is nothing to activate.
      <span aria-hidden className={cn(classes, 'pointer-events-none opacity-50')}>
        {children}
      </span>
    ) : (
      <Link href={hrefForPage(target)} aria-label={label} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-2', className)}
    >
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          {edgeLink(
            page - 1,
            'Previous page',
            <>
              <ChevronLeft aria-hidden className="size-4" />
              <span className="hidden sm:inline">Previous</span>
            </>,
          )}
        </li>
        {getPageItems(page, pageCount).map((item, index) => (
          <li key={item === 'ellipsis' ? `ellipsis-${index}` : item} className="hidden sm:block">
            {item === 'ellipsis' ? (
              <span aria-hidden className="px-2 text-muted-foreground">
                …
              </span>
            ) : (
              <Link
                href={hrefForPage(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={buttonVariants({
                  variant: item === page ? 'secondary' : 'ghost',
                  size: 'sm',
                })}
              >
                {item}
              </Link>
            )}
          </li>
        ))}
        <li>
          {edgeLink(
            page + 1,
            'Next page',
            <>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight aria-hidden className="size-4" />
            </>,
          )}
        </li>
      </ul>
    </nav>
  )
}
