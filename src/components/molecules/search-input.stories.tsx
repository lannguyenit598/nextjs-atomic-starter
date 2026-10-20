import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { SearchInput } from './search-input'

const meta = { title: 'Molecules/SearchInput', component: SearchInput } satisfies Meta<
  typeof SearchInput
>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  render: function Render() {
    const [value, setValue] = useState('invoice')
    return (
      <SearchInput
        aria-label="Search"
        placeholder="Search…"
        className="max-w-xs"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onClear={() => setValue('')}
      />
    )
  },
}
