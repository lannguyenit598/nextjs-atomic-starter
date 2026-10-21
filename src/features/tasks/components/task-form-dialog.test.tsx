import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createTaskAction } from '../actions'
import { TaskFormDialog } from './task-form-dialog'

vi.mock('../actions', () => ({ createTaskAction: vi.fn(), updateTaskAction: vi.fn() }))

describe('TaskFormDialog', () => {
  it('cannot be dismissed while the form is submitting', async () => {
    let resolve: (value: { ok: true }) => void = () => {}
    vi.mocked(createTaskAction).mockReturnValue(new Promise((r) => (resolve = r)))
    render(<TaskFormDialog />)

    await userEvent.click(screen.getByRole('button', { name: 'New task' }))
    await userEvent.type(screen.getByRole('textbox', { name: /title/i }), 'Pending task')
    await userEvent.click(screen.getByRole('button', { name: 'Create task' }))

    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()

    resolve({ ok: true })
    expect(await screen.findByRole('button', { name: 'New task' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /title/i })).not.toBeInTheDocument()
  })
})
