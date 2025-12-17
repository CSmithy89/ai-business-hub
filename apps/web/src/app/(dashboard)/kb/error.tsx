'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('KB route error:', error)
  }, [error])

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="rounded-lg border p-6 bg-card">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t load the Knowledge Base right now. Try again.
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => reset()}>Retry</Button>
        </div>
      </div>
    </div>
  )
}

