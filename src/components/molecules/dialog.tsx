'use client'

import { X } from 'lucide-react'
import { useEffect, useId, useReducer, useRef, type ReactNode } from 'react'

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
  const pressedOnBackdrop = useRef(false)
  // Bumped on every native close so the effect re-syncs when the caller vetoed it (kept `open`).
  const [closeCount, onNativeClose] = useReducer((count: number) => count + 1, 0)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open, closeCount])

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
      // Closed some other way, e.g. Chromium makes a repeated Escape non-cancelable and closes the
      // element itself. If the caller vetoes (keeps `open`), the effect reopens it; children stay
      // mounted, so a form being submitted keeps its draft and can still show its error.
      onClose={() => {
        onNativeClose()
        onOpenChange(false)
      }}
      // A click whose target is the <dialog> itself landed on the backdrop (content fills the box).
      // The press must start there too: selecting text and releasing outside also targets the
      // <dialog>, and closing then would throw away what the user typed.
      onPointerDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (pressedOnBackdrop.current && event.target === event.currentTarget) onOpenChange(false)
        pressedOnBackdrop.current = false
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
