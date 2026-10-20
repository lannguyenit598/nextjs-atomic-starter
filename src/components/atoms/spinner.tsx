import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

const spinnerVariants = cva('animate-spin', {
  variants: { size: { sm: 'size-4', md: 'size-6', lg: 'size-8' } },
  defaultVariants: { size: 'md' },
})

export type SpinnerProps = VariantProps<typeof spinnerVariants> & {
  className?: string
  /** Accessible text. Omit when a surrounding element already announces the loading state. */
  label?: string
}

export function Spinner({ size, className, label }: SpinnerProps) {
  const icon = <LoaderCircle aria-hidden className={cn(spinnerVariants({ size }), className)} />
  if (!label) return icon
  return (
    <span role="status" className="inline-flex items-center">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  )
}
