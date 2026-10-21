import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TaskForm } from './task-form'

describe('TaskForm', () => {
  it('validates on the client before calling the server', async () => {
    const onSubmit = vi.fn()
    render(<TaskForm submitLabel="Create task" onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Create task' }))

    expect(await screen.findByText('Title must be at least 3 characters')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /title/i })).toHaveAttribute('aria-invalid', 'true')
    // Announced to screen readers, not only shown next to the field.
    expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('re-announces the same error on a repeated failed submit', async () => {
    render(<TaskForm submitLabel="Create task" onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Create task' }))
    const first = screen.getByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: 'Create task' }))
    // A fresh alert node is announced again; an unchanged one is not.
    expect(screen.getByRole('alert')).not.toBe(first)
  })

  it('submits typed values and reports success', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true })
    const onSuccess = vi.fn()
    render(<TaskForm submitLabel="Create task" onSubmit={onSubmit} onSuccess={onSuccess} />)

    await userEvent.type(screen.getByRole('textbox', { name: /title/i }), 'Write tests')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Priority' }), 'high')
    await userEvent.click(screen.getByRole('button', { name: 'Create task' }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Write tests',
      description: '',
      status: 'todo',
      priority: 'high',
      dueDate: '',
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('shows an inline error when the action call itself fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onSubmit = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    render(<TaskForm submitLabel="Create task" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByRole('textbox', { name: /title/i }), 'Offline task')
    await userEvent.click(screen.getByRole('button', { name: 'Create task' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server')
  })

  it('shows server-side field and form errors', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      error: 'Please fix the highlighted fields.',
      fieldErrors: { title: ['Title already exists'] },
    })
    render(
      <TaskForm
        submitLabel="Save"
        onSubmit={onSubmit}
        defaultValues={{
          title: 'Dup',
          description: '',
          status: 'todo',
          priority: 'low',
          dueDate: '',
        }}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Title already exists')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields.')
  })
})
