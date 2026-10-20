import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TaskFilters } from './task-filters'

const replace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/tasks',
}))

beforeEach(() => {
  replace.mockClear()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

// fireEvent (sync) instead of userEvent: userEvent's internal delays hang under fake timers.
const type = (value: string) =>
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search tasks' }), { target: { value } })

describe('TaskFilters', () => {
  it('debounces search into the URL and resets to page 1', () => {
    render(<TaskFilters />)
    type('c')
    type('ci')
    expect(replace).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(300))
    expect(replace).toHaveBeenCalledWith('/tasks?q=ci')
  })

  it('applies status immediately', () => {
    render(<TaskFilters q="ci" />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by status' }), {
      target: { value: 'done' },
    })
    expect(replace).toHaveBeenCalledWith('/tasks?q=ci&status=done')
  })

  it('resyncs inputs when the URL changes elsewhere (Back button, nav link)', () => {
    const { rerender } = render(<TaskFilters q="foo" status="done" />)
    rerender(<TaskFilters />)
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Filter by status' })).toHaveValue('')
  })

  it('keeps text typed after its own debounced update was sent', () => {
    const { rerender } = render(<TaskFilters />)
    const input = screen.getByRole('searchbox')
    type('fo')
    act(() => vi.advanceTimersByTime(300)) // URL -> ?q=fo
    expect(replace).toHaveBeenCalledWith('/tasks?q=fo')
    type('foo') // user keeps typing
    rerender(<TaskFilters q="fo" />) // server response for ?q=fo arrives
    expect(input).toHaveValue('foo')
  })
})
