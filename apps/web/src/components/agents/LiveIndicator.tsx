'use client'

import { cn } from '@/lib/utils'

interface LiveIndicatorProps {
  isConnected: boolean
  className?: string
}

/**
 * LiveIndicator Component
 *
 * Displays a pulsing "Live" indicator with connection status.
 * Green pulsing dot when connected, gray dot when disconnected.
 */
export function LiveIndicator({ isConnected, className }: LiveIndicatorProps) {
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          'relative flex h-3 w-3 rounded-full',
          isConnected ? 'bg-green-500' : 'bg-gray-500'
        )}
        aria-hidden="true"
      >
        {isConnected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        )}
      </span>
      <span className="text-sm font-medium text-muted-foreground">
        {isConnected ? 'Live' : 'Disconnected'}
      </span>
    </div>
  )
}
