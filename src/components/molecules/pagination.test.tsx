import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { getPageItems, Pagination } from './pagination'

describe('getPageItems', () => {
  it('shows everything for few pages', () => {
    expect(getPageItems(1, 3)).toEqual([1, 2, 3])
  })

  it('collapses gaps with ellipsis', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10])
  })
})

describe('Pagination', () => {
  const href = (page: number) => `/items?page=${page}`

  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} pageCount={1} hrefForPage={href} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('marks the current page and disables Previous on the first page', () => {
    render(<Pagination page={1} pageCount={3} hrefForPage={href} />)
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'Previous page' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute('href', '/items?page=2')
  })
})
