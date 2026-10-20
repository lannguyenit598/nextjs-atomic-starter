import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type DataTableColumn<T> = {
  /** Unique column id. */
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
}

export type DataTableProps<T> = {
  columns: readonly DataTableColumn<T>[]
  rows: readonly T[]
  getRowKey: (row: T) => string
  /** Accessible table name (visually hidden). */
  caption: string
  /** Rendered instead of the table when there are no rows. */
  empty?: ReactNode
  className?: string
}

/**
 * Presentational table: no fetching, sorting state or domain knowledge.
 * Features decide what goes in each cell; pagination/filters are composed around it.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
  empty,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>

  return (
    <div className={cn('overflow-x-auto rounded-lg border bg-card', className)}>
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b bg-muted/50 text-left text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn('px-4 py-3 font-medium', column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="hover:bg-muted/30">
              {columns.map((column) => (
                <td key={column.id} className={cn('px-4 py-3 align-middle', column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
