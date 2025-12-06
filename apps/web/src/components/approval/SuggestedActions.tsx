'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SuggestedAction } from '@hyvve/shared'
import {
  Lightbulb,
  CheckCircle2,
  Calendar,
  FileText,
  X,
  ChevronRight,
} from 'lucide-react'

interface SuggestedActionsProps {
  actions: SuggestedAction[]
  onActionClick?: (action: SuggestedAction) => void
  onDismiss?: (actionId: string) => void
  className?: string
}

/**
 * SuggestedActions Component
 *
 * Displays recommended actions based on confidence factors.
 * Each action shows icon, name, reason, and priority badge.
 * Actions can be clicked to execute or dismissed.
 */
export function SuggestedActions({
  actions,
  onActionClick,
  onDismiss,
  className,
}: SuggestedActionsProps) {
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(new Set())

  if (!actions || actions.length === 0) {
    return null
  }

  const visibleActions = actions.filter((action) => !dismissedActions.has(action.id))

  if (visibleActions.length === 0) {
    return null
  }

  const handleDismiss = (actionId: string) => {
    setDismissedActions((prev) => new Set(prev).add(actionId))
    onDismiss?.(actionId)
  }

  const getActionIcon = (actionName: string) => {
    const name = actionName.toLowerCase()
    if (name.includes('review') || name.includes('guidelines')) {
      return <FileText className="h-5 w-5" />
    }
    if (name.includes('schedule') || name.includes('time')) {
      return <Calendar className="h-5 w-5" />
    }
    if (name.includes('request') || name.includes('human')) {
      return <CheckCircle2 className="h-5 w-5" />
    }
    return <Lightbulb className="h-5 w-5" />
  }

  const getPriorityBadge = (priority: SuggestedAction['priority']) => {
    const variants = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    }
    return (
      <Badge variant="outline" className={cn('text-xs capitalize', variants[priority])}>
        {priority} priority
      </Badge>
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Suggested Actions
          </h3>
        </div>

        <div className="space-y-2">
          {visibleActions.map((action) => (
            <Card
              key={action.id}
              className="group relative p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                  {getActionIcon(action.action)}
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {action.action}
                    </h4>
                    {getPriorityBadge(action.priority)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {action.reason}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {onActionClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onActionClick(action)}
                      className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(action.id)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  )
}
