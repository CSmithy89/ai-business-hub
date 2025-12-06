'use client'

import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewActivitiesBannerProps {
  count: number
  onClick: () => void
  className?: string
}

/**
 * NewActivitiesBanner Component
 *
 * Notification banner that appears when new activities arrive.
 * Clicking it scrolls to the first new activity.
 */
export function NewActivitiesBanner({
  count,
  onClick,
  className,
}: NewActivitiesBannerProps) {
  if (count === 0) return null

  return (
    <div
      className={cn(
        'sticky top-0 z-10 flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm dark:border-blue-800 dark:bg-blue-950',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <Button
        onClick={onClick}
        variant="ghost"
        size="sm"
        className="gap-2 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:text-blue-300 dark:hover:bg-blue-900 dark:hover:text-blue-200"
      >
        <ArrowUp className="h-4 w-4" />
        <span className="font-medium">
          {count} new {count === 1 ? 'activity' : 'activities'}
        </span>
      </Button>
    </div>
  )
}
