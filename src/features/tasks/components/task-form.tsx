'use client'

import { useState, type FormEvent } from 'react'
import { z } from 'zod'

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Textarea } from '@/components/atoms/textarea'
import { Alert } from '@/components/molecules/alert'
import { FormField } from '@/components/molecules/form-field'
import { callAction, VALIDATION_FAILURE_MESSAGE, type ActionResult } from '@/lib/action-result'

import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../constants'
import { taskFormSchema } from '../schemas'
import type { TaskFormInput } from '../types'

const EMPTY_VALUES: TaskFormInput = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
}

type FieldErrors = Partial<Record<keyof TaskFormInput, string[]>>

export type TaskFormProps = {
  defaultValues?: TaskFormInput
  submitLabel: string
  /** Usually a Server Action. Field errors returned by the server are shown on the fields. */
  onSubmit: (values: TaskFormInput) => Promise<ActionResult>
  onSuccess?: () => void
  onCancel?: () => void
}

export function TaskForm({
  defaultValues = EMPTY_VALUES,
  submitLabel,
  onSubmit,
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    // Same schema as the Server Action, so most mistakes never reach the server.
    const parsed = taskFormSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors)
      // Field errors are not live regions; the alert tells screen reader users why nothing happened.
      setFormError(VALIDATION_FAILURE_MESSAGE)
      return
    }
    setSubmitting(true)
    // Raw values, not parsed.data: the Server Action parses (and transforms) them itself.
    const result = await callAction(() => onSubmit(values as TaskFormInput))
    setSubmitting(false)
    if (result.ok) {
      onSuccess?.()
      return
    }
    setErrors(result.fieldErrors ?? {})
    setFormError(result.error)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {formError && <Alert variant="destructive">{formError}</Alert>}

      <FormField label="Title" required error={errors.title?.[0]}>
        {(field) => (
          <Input data-autofocus name="title" defaultValue={defaultValues.title} {...field} />
        )}
      </FormField>

      <FormField label="Description" error={errors.description?.[0]} hint="Optional">
        {(field) => (
          <Textarea name="description" defaultValue={defaultValues.description} {...field} />
        )}
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Status" error={errors.status?.[0]}>
          {(field) => (
            <Select
              name="status"
              options={TASK_STATUS_OPTIONS}
              defaultValue={defaultValues.status}
              {...field}
            />
          )}
        </FormField>
        <FormField label="Priority" error={errors.priority?.[0]}>
          {(field) => (
            <Select
              name="priority"
              options={TASK_PRIORITY_OPTIONS}
              defaultValue={defaultValues.priority}
              {...field}
            />
          )}
        </FormField>
        <FormField label="Due date" error={errors.dueDate?.[0]}>
          {(field) => (
            <Input type="date" name="dueDate" defaultValue={defaultValues.dueDate} {...field} />
          )}
        </FormField>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" disabled={submitting} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
