import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { Button } from '@/components/atoms/button'

import { ConfirmationDialog } from './confirmation-dialog'

const meta = {
  title: 'Molecules/ConfirmationDialog',
  component: ConfirmationDialog,
  args: {
    open: false,
    onOpenChange: () => {},
    onConfirm: () => {},
    title: 'Delete project?',
    description: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    destructive: true,
  },
} satisfies Meta<typeof ConfirmationDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete project
        </Button>
        <ConfirmationDialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          onConfirm={() => setOpen(false)}
        />
      </>
    )
  },
}
