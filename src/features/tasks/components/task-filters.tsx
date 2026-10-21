'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import { Select } from '@/components/atoms/select'
import { Spinner } from '@/components/atoms/spinner'
import { SearchInput } from '@/components/molecules/search-input'

import { TASK_STATUS_OPTIONS } from '../constants'
import { TASK_SEARCH_MAX_LENGTH } from '../schemas'
import type { TaskStatus } from '../types'

const SEARCH_DEBOUNCE_MS = 300

/**
 * Filters live in the URL (?q=&status=), so results are server-rendered, shareable and
 * survive reloads. This component only edits the URL; the page re-fetches.
 */
export function TaskFilters({ q = '', status }: { q?: string; status?: TaskStatus }) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState(q)
  const [statusValue, setStatusValue] = useState<string>(status ?? '')
  const [pending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // URL values we last rendered with / last navigated to. When the URL changes for another
  // reason (Back/Forward, a nav link), reset the inputs; when it is our own debounced
  // update arriving, keep what the user has typed since.
  const [seen, setSeen] = useState({ q, status: status ?? '' })
  const [sent, setSent] = useState({ q, status: status ?? '' })
  if (seen.q !== q || seen.status !== (status ?? '')) {
    setSeen({ q, status: status ?? '' })
    if (sent.q !== q || sent.status !== (status ?? '')) {
      setQuery(q)
      setStatusValue(status ?? '')
      setSent({ q, status: status ?? '' })
    }
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  // Changing a filter always goes back to page 1.
  function navigate(nextQuery: string, nextStatus: string) {
    clearTimeout(timer.current)
    setSent({ q: nextQuery.trim(), status: nextStatus })
    const params = new URLSearchParams()
    if (nextQuery.trim()) params.set('q', nextQuery.trim())
    if (nextStatus) params.set('status', nextStatus)
    const search = params.toString()
    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname))
  }

  return (
    <form
      role="search"
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault()
        navigate(query, statusValue)
      }}
    >
      <SearchInput
        aria-label="Search tasks"
        placeholder="Search tasks…"
        className="sm:w-72"
        maxLength={TASK_SEARCH_MAX_LENGTH}
        value={query}
        onChange={(event) => {
          const next = event.target.value
          setQuery(next)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => navigate(next, statusValue), SEARCH_DEBOUNCE_MS)
        }}
        onClear={() => {
          setQuery('')
          navigate('', statusValue)
        }}
      />
      <Select
        aria-label="Filter by status"
        className="sm:w-44"
        placeholder="All statuses"
        options={TASK_STATUS_OPTIONS}
        value={statusValue}
        onChange={(event) => {
          setStatusValue(event.target.value)
          navigate(query, event.target.value)
        }}
      />
      {pending && <Spinner label="Updating results" />}
    </form>
  )
}
