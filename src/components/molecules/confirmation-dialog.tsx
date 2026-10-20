'use client'

import { Button } from '@/components/atoms/button'

import { Alert } from './alert'
import { Dialog } from './dialog'

export type ConfirmationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Use for irreversible actions such as delete. */
  destructive?: boolean
  /** Disables the buttons and shows a spinner on confirm. */
  pending?: boolean
  /** Shown inside the dialog, e.g. when the confirmed action failed. */
  error?: string
  onConfirm: () => void
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  pending = false,
  error,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      title={title}
      description={description}
      className="max-w-md"
    >
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'primary'}
          loading={pending}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
