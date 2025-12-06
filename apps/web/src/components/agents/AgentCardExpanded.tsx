'use client'

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AgentAvatar } from './AgentAvatar'
import { AgentStatusBadge } from './AgentStatusBadge'
import type { Agent } from '@hyvve/shared'
import { CheckCircle, TrendingUp, MessageSquare, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentCardExpandedProps {
  agent: Agent
  onConfigure?: () => void
  onChat?: () => void
  className?: string
}

/**
 * AgentCardExpanded Component
 *
 * Full-featured agent card with action buttons.
 * Extends AgentCardStandard with "Chat with Agent" and "Configure" actions.
 * Used in detail views and modals.
 *
 * @param agent - Agent data object
 * @param onConfigure - Handler for configure button
 * @param onChat - Handler for chat button
 */
export function AgentCardExpanded({
  agent,
  onConfigure,
  onChat,
  className,
}: AgentCardExpandedProps) {
  return (
    <Card className={cn('transition-shadow duration-200', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center gap-3">
          <AgentAvatar agent={agent} size="lg" showStatus />

          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{agent.role}</p>
          </div>

          <AgentStatusBadge status={agent.status} size="md" />
        </div>
      </CardHeader>

      <CardContent className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-4">
        {/* Description */}
        {agent.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {agent.description}
          </p>
        )}

        {/* Performance Stats */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Performance (30 days)
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Tasks Completed */}
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {agent.metrics.tasksCompleted}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Tasks Completed</div>
              </div>
            </div>

            {/* Success Rate */}
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {agent.metrics.successRate}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {/* Chat with Agent - Primary Action */}
          {onChat && (
            <Button
              onClick={onChat}
              className="flex-1"
              size="lg"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat with Agent
            </Button>
          )}

          {/* Configure - Secondary Action */}
          {onConfigure && (
            <Button
              onClick={onConfigure}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
