import { cn } from '@/lib/utils'

export type SeparatorProps = {
  orientation?: 'horizontal' | 'vertical'
  /** Decorative separators are hidden from assistive technology. */
  decorative?: boolean
  className?: string
}

export function Separator({
  orientation = 'horizontal',
  decorative = true,
  className,
}: SeparatorProps) {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  )
}
