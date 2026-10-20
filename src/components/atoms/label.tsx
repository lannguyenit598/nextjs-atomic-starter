import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export type LabelProps = ComponentProps<'label'> & { required?: boolean }

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label className={cn('text-sm leading-none font-medium', className)} {...props}>
      {children}
      {required && (
        <span aria-hidden className="ml-0.5 text-destructive">
          *
        </span>
      )}
    </label>
  )
}
