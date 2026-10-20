import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Input } from '@/components/atoms/input'

import { FormField } from './form-field'

const meta = {
  title: 'Molecules/FormField',
  component: FormField,
  args: {
    label: 'Email',
    hint: 'We never share your email.',
    children: (field) => <Input type="email" placeholder="you@company.com" {...field} />,
  },
} satisfies Meta<typeof FormField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Required: Story = { args: { required: true } }
export const WithError: Story = { args: { error: 'Enter a valid email address' } }
