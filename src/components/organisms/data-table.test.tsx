import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DataTable, type DataTableColumn } from './data-table'

type Row = { id: string; name: string }
const columns: DataTableColumn<Row>[] = [{ id: 'name', header: 'Name', cell: (row) => row.name }]

describe('DataTable', () => {
  it('renders a captioned table with one row per item', () => {
    render(
      <DataTable
        caption="People"
        columns={columns}
        rows={[{ id: '1', name: 'Ada' }]}
        getRowKey={(row) => row.id}
      />,
    )
    const table = screen.getByRole('table', { name: 'People' })
    expect(table).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeInTheDocument()
  })

  it('renders the empty slot instead of an empty table', () => {
    render(
      <DataTable
        caption="People"
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        empty={<p>Nobody here</p>}
      />,
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('Nobody here')).toBeInTheDocument()
  })
})
