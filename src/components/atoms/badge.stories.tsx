import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Badge } from './badge'

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  args: { children: 'Badge' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(['neutral', 'primary', 'success', 'warning', 'destructive', 'outline'] as const).map(
        (v) => (
          <Badge key={v} {...args} variant={v}>
            {v}
          </Badge>
        ),
      )}
    </div>
  ),
}
