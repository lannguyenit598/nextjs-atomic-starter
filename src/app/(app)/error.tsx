'use client'

import { useEffect } from 'react'

import { Button } from '@/components/atoms/button'
import { Alert } from '@/components/molecules/alert'

/** Catches render/data errors in app pages; the shell (sidebar/header) stays usable. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Replace with your error reporting service (Sentry, Datadog...).
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-start gap-4">
      <Alert variant="destructive" title="Something went wrong">
        The data could not be loaded. Check your connection or try again.
      </Alert>
      <Button variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  )
}
