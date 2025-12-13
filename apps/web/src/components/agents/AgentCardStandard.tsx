'use client'

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AgentAvatar } from './AgentAvatar'
import { AgentStatusBadge } from './AgentStatusBadge'
import type { Agent } from '@hyvve/shared'
import { CheckCircle, TrendingUp, Settings, Activity, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAgentConfig, getAgentColor } from '@/config/agent-colors'

interface AgentCardStandardProps {
  agent: Agent
  onClick?: () => void
  /** Show quick action buttons in footer */
  showActions?: boolean
  /** Callback for configure action */
  onConfigure?: () => void
  /** Callback for view activity action */
  onViewActivity?: () => void
  /** Callback for pause/resume action */
  onTogglePause?: () => void
  className?: string
}

/**
 * AgentCardStandard Component
 *
 * Standard agent card with performance statistics.
 * Displays avatar, name, role, status, and key metrics.
 * Includes quick action buttons and character color accents.
 * Ideal for list views and dashboard displays.
 *
 * Story 15-18: Agent Cards Enhancement
 *
 * @param agent - Agent data object
 * @param onClick - Click handler for card interaction
 * @param showActions - Show quick action buttons
 */
export function AgentCardStandard({
  agent,
  onClick,
  showActions = false,
  onConfigure,
  onViewActivity,
  onTogglePause,
  className,
}: AgentCardStandardProps) {
  const isClickable = !!onClick
  const agentConfig = getAgentConfig(agent.name)
  const agentColor = getAgentColor(agent.name)

  // Determine if agent is paused (using offline status as proxy)
  const isPaused = agent.status === 'offline'

  return (
    <Card
      className={cn(
        'overflow-hidden',
        isClickable && [
          'cursor-pointer card-hover-lift',
          'hover:border-[rgb(var(--color-border-strong))]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))] focus-visible:ring-offset-2',
          'dark:hover:border-gray-600',
        ],
        className
      )}
      style={{
        borderTopColor: agentColor,
        borderTopWidth: '3px',
      }}
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
          <AgentAvatar agent={agent} size="lg" showStatus showColorRing />

          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{agent.role}</p>
          </div>

          <AgentStatusBadge status={agent.status} size="sm" />

          {/* Brief capability description */}
          {agentConfig?.description && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 line-clamp-2">
              {agentConfig.description}
            </p>
          )}
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
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: agentColor }} />
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

      {/* Quick Actions */}
      {showActions && (
        <CardFooter className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onConfigure?.()
            }}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-1" />
            Configure
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onViewActivity?.()
            }}
            className="flex-1"
          >
            <Activity className="h-4 w-4 mr-1" />
            Activity
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePause?.()
            }}
            className="flex-1"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-1" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
