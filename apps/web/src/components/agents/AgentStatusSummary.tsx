'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { Agent, AgentStatus } from '@hyvve/shared'
import { Activity, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentStatusSummaryProps {
  agents: Agent[]
  onStatusClick?: (status: AgentStatus | 'all') => void
  isLoading?: boolean
}

interface StatusStat {
  label: string
  count: number
  status: AgentStatus | 'all'
  icon: React.ElementType
  color: {
    bg: string
    text: string
    iconBg: string
    iconColor: string
    hoverBg: string
  }
}

/**
 * AgentStatusSummary Component
 *
 * Displays summary statistics of agent statuses.
 * Shows counts for online, busy, offline, and error states.
 * Clicking a stat filters agents by that status.
 */
export function AgentStatusSummary({
  agents,
  onStatusClick,
  isLoading,
}: AgentStatusSummaryProps) {
  // Calculate status counts
  const statusCounts = {
    online: agents.filter((a) => a.status === 'online').length,
    busy: agents.filter((a) => a.status === 'busy').length,
    offline: agents.filter((a) => a.status === 'offline').length,
    error: agents.filter((a) => a.status === 'error').length,
  }

  const stats: StatusStat[] = [
    {
      label: 'Online',
      count: statusCounts.online,
      status: 'online',
      icon: Activity,
      color: {
        bg: 'bg-green-50 dark:bg-green-950/30',
        text: 'text-green-900 dark:text-green-100',
        iconBg: 'bg-green-100 dark:bg-green-900/50',
        iconColor: 'text-green-600 dark:text-green-400',
        hoverBg: 'hover:bg-green-100 dark:hover:bg-green-900/40',
      },
    },
    {
      label: 'Busy',
      count: statusCounts.busy,
      status: 'busy',
      icon: Loader2,
      color: {
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        text: 'text-yellow-900 dark:text-yellow-100',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/50',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        hoverBg: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/40',
      },
    },
    {
      label: 'Offline',
      count: statusCounts.offline,
      status: 'offline',
      icon: Clock,
      color: {
        bg: 'bg-gray-50 dark:bg-gray-950/30',
        text: 'text-gray-900 dark:text-gray-100',
        iconBg: 'bg-gray-100 dark:bg-gray-900/50',
        iconColor: 'text-gray-600 dark:text-gray-400',
        hoverBg: 'hover:bg-gray-100 dark:hover:bg-gray-900/40',
      },
    },
    {
      label: 'Error',
      count: statusCounts.error,
      status: 'error',
      icon: AlertCircle,
      color: {
        bg: 'bg-red-50 dark:bg-red-950/30',
        text: 'text-red-900 dark:text-red-100',
        iconBg: 'bg-red-100 dark:bg-red-900/50',
        iconColor: 'text-red-600 dark:text-red-400',
        hoverBg: 'hover:bg-red-100 dark:hover:bg-red-900/40',
      },
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const isClickable = !!onStatusClick

        return (
          <Card
            key={stat.status}
            className={cn(
              'transition-all duration-200',
              stat.color.bg,
              'border-transparent',
              isClickable && [
                'cursor-pointer',
                stat.color.hoverBg,
                'hover:shadow-md',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              ]
            )}
            onClick={
              isClickable ? () => onStatusClick(stat.status) : undefined
            }
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onStatusClick(stat.status)
                    }
                  }
                : undefined
            }
            tabIndex={isClickable ? 0 : undefined}
            role={isClickable ? 'button' : undefined}
            aria-label={
              isClickable
                ? `Filter by ${stat.label.toLowerCase()} status`
                : undefined
            }
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className={cn('rounded-lg p-3', stat.color.iconBg)}>
                <Icon
                  className={cn('h-6 w-6', stat.color.iconColor)}
                  aria-hidden="true"
                />
              </div>

              <div className="flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    stat.color.text,
                    'opacity-80'
                  )}
                >
                  {stat.label}
                </p>
                <p className={cn('text-2xl font-bold', stat.color.text)}>
                  {isLoading ? (
                    <span className="inline-block h-8 w-12 animate-pulse rounded bg-current opacity-20" />
                  ) : (
                    stat.count
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
