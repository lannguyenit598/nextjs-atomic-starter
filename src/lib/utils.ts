import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge class names; later Tailwind classes win over earlier conflicting ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' })

/** Formats an ISO date ("2026-01-31") or datetime the same on server and client (UTC, no hydration drift). */
export function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}
