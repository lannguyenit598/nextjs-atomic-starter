import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Shared look for text-like controls (Input, Textarea, Select). Error style follows aria-invalid. */
export const fieldControlClass =
  'w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:outline-destructive'

export type InputProps = ComponentProps<'input'>

export function Input({ className, type = 'text', ...props }: InputProps) {
  return <input type={type} className={cn(fieldControlClass, 'h-9 py-1', className)} {...props} />
}
