'use client'

import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

export type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

/**
 * Modal dialog built on the native <dialog> element + showModal(): the browser provides
 * the focus trap, inert background, Escape-to-close, top-layer rendering and focus return.
 * Children mount only while open, so forms inside start fresh every time.
 * To choose the initially focused element, mark it with `data-autofocus`
 * (React's autoFocus runs before showModal() and would be overridden).
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Route Escape through state so callers can veto closing (e.g. while a request is pending).
      onCancel={(event) => {
        event.preventDefault()
        onOpenChange(false)
      }}
      // Safety net: keeps state in sync if the element is closed any other way.
      onClose={() => onOpenChange(false)}
      // A click whose target is the <dialog> itself landed on the backdrop (content fills the box).
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false)
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border bg-card p-0 text-card-foreground shadow-lg',
        className,
      )}
    >
      {open && (
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="text-lg leading-none font-semibold">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              className="-mt-2 -mr-2 size-8"
              onClick={() => onOpenChange(false)}
            >
              <X aria-hidden />
            </Button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
