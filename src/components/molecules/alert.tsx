import { cva, type VariantProps } from 'class-variance-authority'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  'flex gap-3 rounded-md border p-3 text-sm [&_svg]:mt-0.5 [&_svg]:size-4',
  {
    variants: {
      variant: {
        info: 'bg-muted/50',
        success: 'border-success/40 bg-success/10',
        destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: { variant: 'info' },
  },
)

const icons = { info: Info, success: CircleCheck, destructive: CircleAlert }

export type AlertProps = VariantProps<typeof alertVariants> & {
  title?: string
  children?: ReactNode
  className?: string
}

/** Inline message. Destructive alerts use role="alert" so screen readers announce them immediately. */
export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const Icon = icons[variant ?? 'info']
  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
    >
      <Icon aria-hidden className="shrink-0" />
      <div className="flex flex-col gap-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  )
}
