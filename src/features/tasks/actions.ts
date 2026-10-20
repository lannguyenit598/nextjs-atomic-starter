'use server'

import { revalidatePath } from 'next/cache'

import { toActionFailure, validationFailure, type ActionResult } from '@/lib/action-result'
import { requireSession } from '@/lib/auth'

import { TASK_PERMISSIONS } from './constants'
import { taskFormSchema, taskIdSchema, taskStatusSchema } from './schemas'
import { taskRepository } from './services/task-repository'

/*
 * Server Actions = the mutation entry points for the UI.
 * They are public POST endpoints: each one checks the caller first, then re-validates its input.
 * Nothing from the client (hidden buttons, ids, form values) is trusted.
 */

function revalidateTaskPages() {
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}

export async function createTaskAction(input: unknown): Promise<ActionResult> {
  try {
    await requireSession(TASK_PERMISSIONS.write)
    const parsed = taskFormSchema.safeParse(input)
    if (!parsed.success) return validationFailure(parsed.error)
    await taskRepository.create(parsed.data)
  } catch (error) {
    return toActionFailure(error)
  }
  revalidateTaskPages()
  return { ok: true }
}

export async function updateTaskAction(id: unknown, input: unknown): Promise<ActionResult> {
  try {
    await requireSession(TASK_PERMISSIONS.write)
    const parsedId = taskIdSchema.safeParse(id)
    if (!parsedId.success) return { ok: false, error: 'Invalid task id' }
    const parsed = taskFormSchema.safeParse(input)
    if (!parsed.success) return validationFailure(parsed.error)
    await taskRepository.update(parsedId.data, parsed.data)
  } catch (error) {
    return toActionFailure(error)
  }
  revalidateTaskPages()
  return { ok: true }
}

export async function updateTaskStatusAction(id: unknown, status: unknown): Promise<ActionResult> {
  try {
    await requireSession(TASK_PERMISSIONS.write)
    const parsedId = taskIdSchema.safeParse(id)
    const parsedStatus = taskStatusSchema.safeParse(status)
    if (!parsedId.success || !parsedStatus.success) {
      return { ok: false, error: 'Invalid status update' }
    }
    await taskRepository.update(parsedId.data, { status: parsedStatus.data })
  } catch (error) {
    return toActionFailure(error)
  }
  revalidateTaskPages()
  return { ok: true }
}

export async function deleteTaskAction(id: unknown): Promise<ActionResult> {
  try {
    await requireSession(TASK_PERMISSIONS.write)
    const parsedId = taskIdSchema.safeParse(id)
    if (!parsedId.success) return { ok: false, error: 'Invalid task id' }
    await taskRepository.remove(parsedId.data)
  } catch (error) {
    return toActionFailure(error)
  }
  revalidateTaskPages()
  return { ok: true }
}
