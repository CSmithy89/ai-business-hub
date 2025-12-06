'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { AgentAvatar } from './AgentAvatar'
import { AgentStatusBadge } from './AgentStatusBadge'
import type { Agent } from '@hyvve/shared'
import { CheckCircle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentCardStandardProps {
  agent: Agent
  onClick?: () => void
  className?: string
}

/**
 * AgentCardStandard Component
 *
 * Standard agent card with performance statistics.
 * Displays avatar, name, role, status, and key metrics.
 * Ideal for list views and dashboard displays.
 *
 * @param agent - Agent data object
 * @param onClick - Click handler for card interaction
 */
export function AgentCardStandard({
  agent,
  onClick,
  className,
}: AgentCardStandardProps) {
  const isClickable = !!onClick

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isClickable && [
          'cursor-pointer',
          'hover:border-gray-400 hover:shadow-lg',
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
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center gap-3">
          <AgentAvatar agent={agent} size="md" showStatus />

          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{agent.role}</p>
          </div>

          <AgentStatusBadge status={agent.status} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Performance (30 days)
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {/* Tasks Completed */}
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {agent.metrics.tasksCompleted}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Tasks</div>
              </div>
            </div>

            {/* Success Rate */}
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {agent.metrics.successRate}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Success</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
