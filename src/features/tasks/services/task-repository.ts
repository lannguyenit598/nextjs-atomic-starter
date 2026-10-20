import 'server-only'

import { serverEnv } from '@/lib/env'

import type { TaskRepository } from '../types'
import { demoTaskRepository } from './demo-task-repository'
import { restTaskRepository } from './rest-task-repository'

/** The only entry point for task data. Chosen once from API_MODE (see .env.example). */
export const taskRepository: TaskRepository =
  serverEnv.API_MODE === 'rest' ? restTaskRepository : demoTaskRepository
