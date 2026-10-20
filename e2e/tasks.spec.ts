import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

const unique = (label: string) => `${label} ${Date.now()}`

async function createTask(page: Page, title: string) {
  await page.getByRole('button', { name: 'New task' }).click()
  const dialog = page.getByRole('dialog', { name: 'New task' })
  await dialog.getByRole('textbox', { name: /title/i }).fill(title)
  await dialog.getByRole('button', { name: 'Create task' }).click()
  await expect(dialog).toBeHidden()
}

test('home redirects to the dashboard and navigation works', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.getByText('Total tasks')).toBeVisible()

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Tasks' }).click()
  await expect(page.getByRole('heading', { name: 'Tasks', level: 1 })).toBeVisible()
  await expect(page.getByRole('table', { name: 'Tasks' })).toBeVisible()
})

test('task lifecycle: create, search, update status, edit, delete', async ({ page }) => {
  const title = unique('E2E task')
  await page.goto('/tasks')

  await createTask(page, title)
  await expect(page.getByRole('cell', { name: title, exact: true })).toBeVisible()

  // Search narrows the list via the URL
  await page.getByRole('searchbox', { name: 'Search tasks' }).fill(title)
  await expect(page).toHaveURL(/q=E2E/)
  await expect(page.getByRole('row')).toHaveCount(2) // header + 1 result

  // Status change persists across reload
  await page.getByRole('combobox', { name: `Status of ${title}` }).selectOption('done')
  await expect(page.getByRole('combobox', { name: `Status of ${title}` })).toHaveValue('done')
  await page.reload()
  await expect(page.getByRole('combobox', { name: `Status of ${title}` })).toHaveValue('done')

  // Edit
  const renamed = `${title} (edited)`
  await page.getByRole('button', { name: `Edit ${title}` }).click()
  const editDialog = page.getByRole('dialog', { name: 'Edit task' })
  await editDialog.getByRole('textbox', { name: /title/i }).fill(renamed)
  await editDialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(editDialog).toBeHidden()
  await expect(page.getByRole('cell', { name: renamed, exact: true })).toBeVisible()

  // Delete with confirmation
  await page.getByRole('button', { name: `Delete ${renamed}` }).click()
  await page
    .getByRole('dialog', { name: 'Delete task?' })
    .getByRole('button', { name: 'Delete' })
    .click()
  await expect(page.getByRole('cell', { name: renamed, exact: true })).toBeHidden()
  await expect(page.getByText('No matching tasks')).toBeVisible()
})

test('filter by status uses the URL', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('combobox', { name: 'Filter by status' }).selectOption('in_progress')
  await expect(page).toHaveURL(/status=in_progress/)
  const statuses = page.getByRole('combobox', { name: /^Status of / })
  await expect(statuses.first()).toHaveValue('in_progress')
  for (const value of await statuses.evaluateAll((els) =>
    els.map((el) => (el as HTMLSelectElement).value),
  )) {
    expect(value).toBe('in_progress')
  }
})

test('form validation and dialog keyboard behaviour', async ({ page }) => {
  await page.goto('/tasks')
  const trigger = page.getByRole('button', { name: 'New task' })
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: 'New task' })
  await expect(dialog.getByRole('textbox', { name: /title/i })).toBeFocused()
  await dialog.getByRole('button', { name: 'Create task' }).click()
  await expect(dialog.getByText('Title must be at least 3 characters')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('out-of-range page explains itself and links back', async ({ page }) => {
  await page.goto('/tasks?page=99')
  await expect(page.getByText('This page is empty')).toBeVisible()
  await page.getByRole('link', { name: /Go to page \d+/ }).click()
  await expect(page.getByRole('table', { name: 'Tasks' })).toBeVisible()
})

// Filters use router.replace (no history entry), so the drift case is a nav link, not Back.
test('filter inputs reset when navigating to the unfiltered list', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('searchbox', { name: 'Search tasks' }).fill('review')
  await page.getByRole('combobox', { name: 'Filter by status' }).selectOption('done')
  await expect(page).toHaveURL(/q=review&status=done/)
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Tasks' }).click()
  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue('')
  await expect(page.getByRole('combobox', { name: 'Filter by status' })).toHaveValue('')
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('navigation drawer opens and closes on navigate', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const drawer = page.getByRole('dialog', { name: 'Navigation' })
    await drawer.getByRole('link', { name: 'Tasks' }).click()
    await expect(page).toHaveURL(/\/tasks$/)
    await expect(drawer).toBeHidden()
  })
})
