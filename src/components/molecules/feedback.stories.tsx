import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Inbox, Users } from 'lucide-react'

import { Button } from '@/components/atoms/button'

import { Alert } from './alert'
import { EmptyState } from './empty-state'
import { StatCard } from './stat-card'

const meta = { title: 'Molecules/Feedback & data display' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Alerts: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-3">
      <Alert title="Heads up">Informational message.</Alert>
      <Alert variant="success" title="Saved">
        Your changes were saved.
      </Alert>
      <Alert variant="destructive" title="Request failed">
        The server could not be reached.
      </Alert>
    </div>
  ),
}

export const Empty: Story = {
  render: () => (
    <EmptyState
      icon={<Inbox />}
      title="No items yet"
      description="Create your first item to get started."
      action={<Button>Create item</Button>}
    />
  ),
}

export const Stat: Story = {
  render: () => (
    <StatCard
      className="max-w-xs"
      label="Active users"
      value="1,284"
      icon={<Users />}
      description="+12% this week"
    />
  ),
}
