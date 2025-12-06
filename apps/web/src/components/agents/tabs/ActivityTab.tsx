'use client'

import { useState } from 'react'
import { useAgentActivity } from '@/hooks/use-agent'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'
import { Circle, Activity as ActivityIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityTabProps {
  agentId: string
}

/**
 * ActivityTab Component
 *
 * Displays recent agent actions in a timeline format.
 */
export function ActivityTab({ agentId }: ActivityTabProps) {
  const [activityType, setActivityType] = useState<string>('all')
  const { data, isLoading, error } = useAgentActivity(
    agentId,
    1,
    50,
    activityType === 'all' ? undefined : activityType
  )

  // Status badge configuration
  const statusConfig = {
    completed: {
      variant: 'default' as const,
      className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    pending: {
      variant: 'secondary' as const,
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    },
    failed: {
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    },
  }

  // Module badge colors
  const moduleColors: Record<string, string> = {
    validation: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    planning: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    branding: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    crm: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ActivityIcon className="h-5 w-5 animate-spin" />
          <span>Loading activity...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load activity. Please try again.
      </div>
    )
  }

  const activities = data?.data || []

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <label htmlFor="activity-type" className="text-sm font-medium">
          Filter by type:
        </label>
        <Select value={activityType} onValueChange={setActivityType}>
          <SelectTrigger id="activity-type" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="task_started">Task Started</SelectItem>
            <SelectItem value="task_completed">Task Completed</SelectItem>
            <SelectItem value="approval_requested">Approval Requested</SelectItem>
            <SelectItem value="error">Errors</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ActivityIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-1 text-lg font-semibold">No activity found</h3>
          <p className="text-sm text-muted-foreground">
            {activityType === 'all'
              ? 'This agent has not performed any actions yet.'
              : 'No activity of this type found.'}
          </p>
        </div>
      ) : (
        <div className="relative space-y-4 border-l-2 border-muted pl-6">
          {activities.map(activity => (
            <div key={activity.id} className="relative">
              {/* Timeline dot */}
              <Circle
                className={cn(
                  'absolute -left-[29px] top-1 h-4 w-4 fill-current',
                  activity.status === 'completed' && 'text-green-600 dark:text-green-400',
                  activity.status === 'pending' && 'text-yellow-600 dark:text-yellow-400',
                  activity.status === 'failed' && 'text-red-600 dark:text-red-400'
                )}
              />

              {/* Activity card */}
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className={statusConfig[activity.status].className}>
                    {activity.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn('capitalize', moduleColors[activity.module])}
                  >
                    {activity.module}
                  </Badge>
                  {activity.confidenceScore !== undefined && (
                    <Badge variant="outline">
                      Confidence: {activity.confidenceScore}%
                    </Badge>
                  )}
                </div>

                <p className="mb-2 text-sm">{activity.action}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    {formatDistanceToNow(new Date(activity.startedAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {activity.duration && (
                    <span>Duration: {(activity.duration / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination info */}
      {data?.meta && activities.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {activities.length} of {data.meta.total} activities
        </p>
      )}
    </div>
  )
}
