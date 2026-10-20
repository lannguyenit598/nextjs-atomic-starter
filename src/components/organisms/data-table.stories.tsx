import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Badge } from '@/components/atoms/badge'
import { EmptyState } from '@/components/molecules/empty-state'

import { DataTable, type DataTableColumn } from './data-table'

type User = { id: string; name: string; email: string; role: 'Admin' | 'Member' }

const users: User[] = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' },
  { id: '2', name: 'Alan Turing', email: 'alan@example.com', role: 'Member' },
  { id: '3', name: 'Grace Hopper', email: 'grace@example.com', role: 'Member' },
]

const columns: DataTableColumn<User>[] = [
  { id: 'name', header: 'Name', cell: (u) => <span className="font-medium">{u.name}</span> },
  { id: 'email', header: 'Email', cell: (u) => u.email },
  {
    id: 'role',
    header: 'Role',
    cell: (u) => <Badge variant={u.role === 'Admin' ? 'primary' : 'neutral'}>{u.role}</Badge>,
  },
]

const meta = {
  title: 'Organisms/DataTable',
  component: DataTable<User>,
  args: { caption: 'Users', columns, rows: users, getRowKey: (u: User) => u.id },
} satisfies Meta<typeof DataTable<User>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Empty: Story = { args: { rows: [], empty: <EmptyState title="No users found" /> } }
