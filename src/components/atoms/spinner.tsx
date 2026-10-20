import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

export type SpinnerProps = {
  className?: string
  /** Accessible text. Omit when a surrounding element already announces the loading state. */
  label?: string
}

export function Spinner({ className, label }: SpinnerProps) {
  const icon = <LoaderCircle aria-hidden className={cn('size-4 animate-spin', className)} />
  if (!label) return icon
  return (
    <span role="status" className="inline-flex items-center">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  )
}
