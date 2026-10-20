import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Checkbox } from './checkbox'
import { Input } from './input'
import { Label } from './label'
import { Select } from './select'
import { Textarea } from './textarea'

const meta = {
  title: 'Atoms/Form controls',
  parameters: {
    docs: { description: { component: 'Native controls styled with design tokens.' } },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4">
      <Input aria-label="Text" placeholder="Text input" />
      <Input aria-label="Invalid" aria-invalid defaultValue="Invalid value" />
      <Input aria-label="Disabled" disabled placeholder="Disabled" />
      <Textarea aria-label="Notes" placeholder="Textarea" />
      <Select
        aria-label="Status"
        placeholder="All statuses"
        options={[
          { value: 'open', label: 'Open' },
          { value: 'closed', label: 'Closed' },
        ]}
      />
      <div className="flex items-center gap-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms</Label>
      </div>
    </div>
  ),
}
