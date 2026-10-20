import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Input } from '@/components/atoms/input'

import { FormField } from './form-field'

describe('FormField', () => {
  it('links label, hint and error to the control', () => {
    render(
      <FormField label="Email" hint="Work email" error="Required" required>
        {(field) => <Input {...field} />}
      </FormField>,
    )
    const input = screen.getByRole('textbox', { name: /email/i })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Work email Required')
  })

  it('is valid when there is no error', () => {
    render(<FormField label="Name">{(field) => <Input {...field} />}</FormField>)
    const input = screen.getByRole('textbox', { name: 'Name' })
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })
})
