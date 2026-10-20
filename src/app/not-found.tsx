import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/atoms/button'
import { EmptyState } from '@/components/molecules/empty-state'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <EmptyState
        icon={<FileQuestion />}
        title="Page not found"
        titleAs="h1"
        description="The page you are looking for does not exist or has been moved."
        action={
          <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
            Back to dashboard
          </Link>
        }
        className="w-full max-w-md"
      />
    </main>
  )
}
