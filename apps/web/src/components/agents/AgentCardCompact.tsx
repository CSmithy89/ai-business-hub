'use client'

import { Card } from '@/components/ui/card'
import { AgentAvatar } from './AgentAvatar'
import type { Agent } from '@hyvve/shared'
import { cn } from '@/lib/utils'

interface AgentCardCompactProps {
  agent: Agent
  onClick?: () => void
  className?: string
}

/**
 * AgentCardCompact Component
 *
 * Minimal agent card for grid views.
 * Shows avatar, name, and status indicator in a compact horizontal layout.
 * Optimized for dashboard grid display.
 *
 * @param agent - Agent data object
 * @param onClick - Click handler for card interaction
 */
export function AgentCardCompact({
  agent,
  onClick,
  className,
}: AgentCardCompactProps) {
  const isClickable = !!onClick

  return (
    <Card
      className={cn(
        isClickable && [
          'cursor-pointer card-hover-lift',
          'hover:border-gray-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'dark:hover:border-gray-600',
        ],
        className
      )}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `View ${agent.name} details` : undefined}
    >
      <div className="flex items-center gap-3 p-4">
        <AgentAvatar agent={agent} size="sm" showStatus />

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {agent.name}
          </h3>
        </div>
      </div>
    </Card>
  )
}
