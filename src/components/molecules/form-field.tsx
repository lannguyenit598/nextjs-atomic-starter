import { useId, type ReactNode } from 'react'

import { Label } from '@/components/atoms/label'
import { cn } from '@/lib/utils'

/** Props to spread onto the control so label, hint and error are announced together. */
export type FormFieldControlProps = {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

export type FormFieldProps = {
  label: string
  /** Rendered below the control and linked via aria-describedby. */
  hint?: string
  error?: string
  required?: boolean
  className?: string
  /** Render prop: receives the id/aria props to spread onto the input. */
  children: (controlProps: FormFieldControlProps) => ReactNode
}

export function FormField({ label, hint, error, required, className, children }: FormFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ')

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
