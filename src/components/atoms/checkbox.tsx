import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export type CheckboxProps = Omit<ComponentProps<'input'>, 'type'>

/** Native checkbox themed with accent-color. Pair with <Label htmlFor> or wrap in a <label>. */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn('size-4 shrink-0 accent-primary disabled:opacity-50', className)}
      {...props}
    />
  )
}
