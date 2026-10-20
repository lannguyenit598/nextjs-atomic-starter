'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Textarea } from '@/components/atoms/textarea'
import { Alert } from '@/components/molecules/alert'
import { FormField } from '@/components/molecules/form-field'
import { callAction, type ActionResult } from '@/lib/action-result'

import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../constants'
import { taskFormSchema } from '../schemas'
import type { TaskFormValues } from '../types'

const EMPTY_VALUES: TaskFormValues = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
}

export type TaskFormProps = {
  defaultValues?: TaskFormValues
  submitLabel: string
  /** Usually a Server Action. Field errors returned by the server are shown on the fields. */
  onSubmit: (values: TaskFormValues) => Promise<ActionResult>
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
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskFormSchema), defaultValues })

  const submit = handleSubmit(async (values) => {
    const result = await callAction(() => onSubmit(values))
    if (result.ok) {
      onSuccess?.()
      return
    }
    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (messages?.[0]) setError(field as keyof TaskFormValues, { message: messages[0] })
    }
    setError('root', { message: result.error })
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {errors.root?.message && <Alert variant="destructive">{errors.root.message}</Alert>}

      <FormField label="Title" required error={errors.title?.message}>
        {(field) => <Input data-autofocus {...field} {...register('title')} />}
      </FormField>

      <FormField label="Description" error={errors.description?.message} hint="Optional">
        {(field) => <Textarea {...field} {...register('description')} />}
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Status" error={errors.status?.message}>
          {(field) => <Select options={TASK_STATUS_OPTIONS} {...field} {...register('status')} />}
        </FormField>
        <FormField label="Priority" error={errors.priority?.message}>
          {(field) => (
            <Select options={TASK_PRIORITY_OPTIONS} {...field} {...register('priority')} />
          )}
        </FormField>
        <FormField label="Due date" error={errors.dueDate?.message}>
          {(field) => <Input type="date" {...field} {...register('dueDate')} />}
        </FormField>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
