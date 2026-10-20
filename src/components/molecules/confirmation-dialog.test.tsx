import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmationDialog } from './confirmation-dialog'

function setup(props: Partial<Parameters<typeof ConfirmationDialog>[0]> = {}) {
  const onConfirm = vi.fn()
  const onOpenChange = vi.fn()
  render(
    <ConfirmationDialog
      open
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Delete item?"
      description="This cannot be undone."
      confirmLabel="Delete"
      destructive
      {...props}
    />,
  )
  return { onConfirm, onOpenChange }
}

describe('ConfirmationDialog', () => {
  it('is an accessible, labelled dialog', () => {
    setup()
    const dialog = screen.getByRole('dialog', { name: 'Delete item?' })
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
  })

  it('confirms and cancels', async () => {
    const { onConfirm, onOpenChange } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('blocks closing and shows errors while pending', () => {
    setup({ pending: true, error: 'Delete failed' })
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Delete failed')
  })

  it('closes on Escape, but not while pending', () => {
    const { onOpenChange } = setup()
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('keeps the dialog open when Escape is pressed while pending', () => {
    const { onOpenChange } = setup({ pending: true })
    const dialog = screen.getByRole('dialog')
    const notCancelled = fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(notCancelled).toBe(false) // default (native close) prevented
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(dialog).toHaveAttribute('open')
  })

  it('renders no content while closed', () => {
    setup({ open: false })
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })
})
