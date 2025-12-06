'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

type ActivityType =
  | 'task_started'
  | 'task_completed'
  | 'approval_requested'
  | 'approval_processed'
  | 'error'
  | 'config_changed'

interface ActivityFilterValues {
  agentId?: string
  type?: ActivityType
  status?: 'pending' | 'completed' | 'failed'
}

interface ActivityFiltersProps {
  filters: ActivityFilterValues
  onFiltersChange: (filters: ActivityFilterValues) => void
  availableAgents?: Array<{ id: string; name: string }>
}

/**
 * ActivityFilters Component
 *
 * Filter controls for the activity feed.
 * Includes dropdowns for Agent, Type, and Status filtering.
 */
export function ActivityFilters({
  filters,
  onFiltersChange,
  availableAgents = [],
}: ActivityFiltersProps) {
  const hasFilters = filters.agentId || filters.type || filters.status

  const handleClearFilters = () => {
    onFiltersChange({})
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
      {/* Agent Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="agent-filter" className="text-sm font-medium">
          Agent:
        </label>
        <Select
          value={filters.agentId || 'all'}
          onValueChange={value =>
            onFiltersChange({ ...filters, agentId: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger id="agent-filter" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {availableAgents.map(agent => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="type-filter" className="text-sm font-medium">
          Type:
        </label>
        <Select
          value={filters.type || 'all'}
          onValueChange={value =>
            onFiltersChange({
              ...filters,
              type: value === 'all' ? undefined : (value as ActivityType),
            })
          }
        >
          <SelectTrigger id="type-filter" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="task_started">Task Started</SelectItem>
            <SelectItem value="task_completed">Task Completed</SelectItem>
            <SelectItem value="approval_requested">Approval Requested</SelectItem>
            <SelectItem value="approval_processed">Approval Processed</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="config_changed">Config Changed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium">
          Status:
        </label>
        <Select
          value={filters.status || 'all'}
          onValueChange={value =>
            onFiltersChange({
              ...filters,
              status: value === 'all' ? undefined : (value as 'pending' | 'completed' | 'failed'),
            })
          }
        >
          <SelectTrigger id="status-filter" className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2 ml-auto">
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}
