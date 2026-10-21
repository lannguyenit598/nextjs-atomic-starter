import { describe, expect, it } from 'vitest'

import { taskFormSchema, taskIdSchema, taskListQuerySchema } from './schemas'

const valid = { title: 'Ship it', description: '', status: 'todo', priority: 'low', dueDate: '' }

describe('taskFormSchema', () => {
  it('accepts valid input and trims text', () => {
    expect(taskFormSchema.parse({ ...valid, title: '  Ship it  ' }).title).toBe('Ship it')
  })

  it('rejects short titles, bad enums and bad dates', () => {
    const result = taskFormSchema.safeParse({
      ...valid,
      title: 'ab',
      status: 'archived',
      dueDate: '31/12/2026',
    })
    expect(result.success).toBe(false)
    const fields = result.error?.issues.map((issue) => issue.path[0])
    expect(fields).toEqual(expect.arrayContaining(['title', 'status', 'dueDate']))
  })
})

describe('taskListQuerySchema', () => {
  it('falls back to safe defaults for invalid URL params', () => {
    expect(taskListQuerySchema.parse({ q: undefined, status: 'bogus', page: 'abc' })).toEqual({
      q: undefined,
      status: undefined,
      page: 1,
    })
  })

  it('parses valid params', () => {
    expect(taskListQuerySchema.parse({ q: ' x ', status: 'done', page: '2' })).toEqual({
      q: 'x',
      status: 'done',
      page: 2,
    })
  })

  it('truncates an over-long search instead of dropping it', () => {
    expect(taskListQuerySchema.parse({ q: 'x'.repeat(150) }).q).toBe('x'.repeat(100))
  })
})

describe('taskIdSchema', () => {
  it('accepts generated ids', () => {
    expect(taskIdSchema.safeParse('task-12').success).toBe(true)
    expect(taskIdSchema.safeParse(crypto.randomUUID()).success).toBe(true)
  })

  it.each(['', '.', '..', 'a/b', '../admin', 'a?x=1', 'a b'])(
    'rejects %j (would change the backend URL path)',
    (id) => {
      expect(taskIdSchema.safeParse(id).success).toBe(false)
    },
  )
})
