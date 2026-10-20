'use client'

import { useEffect } from 'react'

import './globals.css'

/**
 * Last-resort boundary for errors in the root layout. Replaces the whole document,
 * so it renders its own <html>/<body> and cannot use the app shell or metadata.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Replace with your error reporting service (Sentry, Datadog...).
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center p-4">
        <title>Something went wrong</title>
        <main className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={retry}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
