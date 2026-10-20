import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SearchInput } from './search-input'

describe('SearchInput', () => {
  it('shows a clear button only when there is a value', async () => {
    const onClear = vi.fn()
    const { rerender } = render(
      <SearchInput aria-label="Search" value="" onChange={() => {}} onClear={onClear} />,
    )
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()

    rerender(<SearchInput aria-label="Search" value="abc" onChange={() => {}} onClear={onClear} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onClear).toHaveBeenCalledOnce()
  })
})
