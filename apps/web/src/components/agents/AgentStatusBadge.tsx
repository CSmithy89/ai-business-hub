'use client'

import { Badge } from '@/components/ui/badge'
import type { AgentStatus } from '@hyvve/shared'
import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentStatusBadgeProps {
  status: AgentStatus
  size?: 'sm' | 'md'
  className?: string
}

/**
 * AgentStatusBadge Component
 *
 * Color-coded status badge with icon and text.
 * Displays agent's current operational status.
 *
 * @param status - Agent status (online | busy | offline | error)
 * @param size - Badge size
 */
export function AgentStatusBadge({
  status,
  size = 'md',
  className,
}: AgentStatusBadgeProps) {
  // Status configurations with colors
  const statusConfig = {
    online: {
      label: 'Online',
      className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      iconClassName: 'text-green-600 dark:text-green-400',
    },
    busy: {
      label: 'Busy',
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      iconClassName: 'text-yellow-600 dark:text-yellow-400',
    },
    offline: {
      label: 'Offline',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      iconClassName: 'text-gray-600 dark:text-gray-400',
    },
    error: {
      label: 'Error',
      className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      iconClassName: 'text-red-600 dark:text-red-400',
    },
  }

  const config = statusConfig[status]
  const iconSize = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <Badge
      variant="outline"
      className={cn(config.className, textSize, className)}
    >
      <Circle
        className={cn('mr-1.5 fill-current', iconSize, config.iconClassName)}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  )
}
