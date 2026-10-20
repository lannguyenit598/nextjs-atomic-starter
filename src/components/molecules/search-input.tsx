import { Search, X } from 'lucide-react'

import { Input, type InputProps } from '@/components/atoms/input'
import { cn } from '@/lib/utils'

export type SearchInputProps = Omit<InputProps, 'type'> & {
  /** When provided, a clear button appears while the input has a value. */
  onClear?: () => void
}

export function SearchInput({ className, onClear, value, ...props }: SearchInputProps) {
  const showClear = onClear && value !== undefined && String(value).length > 0
  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input type="search" value={value} className="pr-8 pl-8" {...props} />
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  )
}
