import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Pagination } from './pagination'

const meta = {
  title: 'Molecules/Pagination',
  component: Pagination,
  args: { page: 5, pageCount: 12, hrefForPage: (page: number) => `?page=${page}` },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Middle: Story = {}
export const FirstPage: Story = { args: { page: 1 } }
export const FewPages: Story = { args: { page: 2, pageCount: 3 } }
