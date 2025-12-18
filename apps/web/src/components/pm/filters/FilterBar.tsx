/**
 * Filter Bar Component
 *
 * Story: PM-03.7 - Advanced Filters
 *
 * Comprehensive filter bar for tasks with URL state persistence.
 * Supports filtering by status, priority, assignee, type, labels, due date range, and phase.
 */

'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusFilter } from './StatusFilter'
import { PriorityFilter } from './PriorityFilter'
import { AssigneeFilter } from './AssigneeFilter'
import { TypeFilter } from './TypeFilter'
import { LabelFilter } from './LabelFilter'
import { DateRangeFilter } from './DateRangeFilter'
import { PhaseFilter } from './PhaseFilter'
import { FilterChip } from './FilterChip'
import {
  type FilterState,
  serializeFilters,
  parseFilters,
  hasActiveFilters,
  getEmptyFilters,
} from '@/lib/pm/url-state'
import type { TaskListItem, TaskStatus, TaskPriority, TaskType } from '@/hooks/use-pm-tasks'
import { TASK_PRIORITY_META, TASK_TYPE_META } from '@/lib/pm/task-meta'
import { usePmTeam } from '@/hooks/use-pm-team'
import { usePmProject } from '@/hooks/use-pm-projects'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

interface FilterBarProps {
  /** Project ID */
  projectId: string
  /** Project slug */
  projectSlug: string
  /** All tasks (for label extraction) */
  tasks: TaskListItem[]
  /** Callback when filters change */
  onFiltersChange: (filters: FilterState) => void
  /** Optional className */
  className?: string
}

/**
 * FilterBar Component
 *
 * Main filter bar that combines all filter components and manages URL state.
 * Features:
 * - Multi-select status filter
 * - Single-select priority, type, assignee, phase filters
 * - Multi-select label filter with autocomplete
 * - Date range picker for due dates
 * - Active filter chips with remove buttons
 * - "Clear All" button
 * - URL state persistence (debounced)
 */
export function FilterBar({
  projectId,
  projectSlug,
  tasks,
  onFiltersChange,
  className,
}: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Parse initial filters from URL
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  // Fetch project data for phase names
  const { data: projectData } = usePmProject(projectSlug)
  const project = projectData?.data

  // Fetch team data for assignee names
  const { data: teamData } = usePmTeam(projectId)
  const team = teamData?.data

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  // Update URL with debouncing
  const updateUrl = (newFilters: FilterState) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const params = serializeFilters(newFilters)
      const currentParams = new URLSearchParams(searchParams.toString())

      // Preserve non-filter params (like taskId)
      const nonFilterKeys = ['taskId']
      nonFilterKeys.forEach((key) => {
        const value = currentParams.get(key)
        if (value) params.set(key, value)
      })

      const currentPath = window.location.pathname
      const newUrl = params.toString() ? `${currentPath}?${params.toString()}` : currentPath
      router.replace(newUrl as any, { scroll: false })
    }, 300)
  }

  // Filter update handlers
  const handleStatusChange = (status: TaskStatus[]) => {
    updateUrl({ ...filters, status })
  }

  const handlePriorityChange = (priority: TaskPriority | null) => {
    updateUrl({ ...filters, priority })
  }

  const handleAssigneeChange = (assigneeId: string | null) => {
    updateUrl({ ...filters, assigneeId })
  }

  const handleTypeChange = (type: TaskType | null) => {
    updateUrl({ ...filters, type })
  }

  const handleLabelsChange = (labels: string[]) => {
    updateUrl({ ...filters, labels })
  }

  const handleDateRangeChange = (from: string | null, to: string | null) => {
    updateUrl({ ...filters, dueDateFrom: from, dueDateTo: to })
  }

  const handlePhaseChange = (phaseId: string | null) => {
    updateUrl({ ...filters, phaseId })
  }

  const handleClearAll = () => {
    updateUrl(getEmptyFilters())
  }

  // Remove individual filter
  const removeStatusFilter = (status: TaskStatus) => {
    handleStatusChange(filters.status.filter((s) => s !== status))
  }

  const removePriorityFilter = () => {
    handlePriorityChange(null)
  }

  const removeAssigneeFilter = () => {
    handleAssigneeChange(null)
  }

  const removeTypeFilter = () => {
    handleTypeChange(null)
  }

  const removeLabelFilter = (label: string) => {
    handleLabelsChange(filters.labels.filter((l) => l !== label))
  }

  const removeDateRangeFilter = () => {
    handleDateRangeChange(null, null)
  }

  const removePhaseFilter = () => {
    handlePhaseChange(null)
  }

  // Get assignee name
  const getAssigneeName = (userId: string) => {
    const member = team?.members.find((m) => m.userId === userId)
    return member?.user?.name || member?.user?.email || 'Unknown'
  }

  // Get phase name
  const getPhaseName = (phaseId: string) => {
    const phase = project?.phases.find((p) => p.id === phaseId)
    return phase ? `Phase ${phase.phaseNumber}: ${phase.name}` : 'Unknown'
  }

  const hasFilters = hasActiveFilters(filters)

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4">
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filters:</span>
          </div>

          <StatusFilter value={filters.status} onChange={handleStatusChange} />
          <PriorityFilter value={filters.priority} onChange={handlePriorityChange} />
          <TypeFilter value={filters.type} onChange={handleTypeChange} />
          <AssigneeFilter
            value={filters.assigneeId}
            onChange={handleAssigneeChange}
            projectId={projectId}
          />
          <PhaseFilter
            value={filters.phaseId}
            onChange={handlePhaseChange}
            projectSlug={projectSlug}
          />
          <DateRangeFilter
            from={filters.dueDateFrom}
            to={filters.dueDateTo}
            onChange={handleDateRangeChange}
          />
          <LabelFilter value={filters.labels} onChange={handleLabelsChange} tasks={tasks} />

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>

        {/* Active Filter Chips */}
        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="text-xs text-muted-foreground">Active:</span>

            {filters.status.map((status) => (
              <FilterChip
                key={status}
                label={status.replace(/_/g, ' ')}
                onRemove={() => removeStatusFilter(status)}
              />
            ))}

            {filters.priority && (
              <FilterChip
                label={TASK_PRIORITY_META[filters.priority].label}
                onRemove={removePriorityFilter}
                icon={
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      TASK_PRIORITY_META[filters.priority].dotClassName
                    )}
                  />
                }
              />
            )}

            {filters.type && (
              <FilterChip
                label={TASK_TYPE_META[filters.type].label}
                onRemove={removeTypeFilter}
              />
            )}

            {filters.assigneeId && (
              <FilterChip
                label={getAssigneeName(filters.assigneeId)}
                onRemove={removeAssigneeFilter}
              />
            )}

            {filters.phaseId && (
              <FilterChip label={getPhaseName(filters.phaseId)} onRemove={removePhaseFilter} />
            )}

            {(filters.dueDateFrom || filters.dueDateTo) && (
              <FilterChip
                label={
                  filters.dueDateFrom && filters.dueDateTo
                    ? `${format(parseISO(filters.dueDateFrom), 'MMM d')} - ${format(parseISO(filters.dueDateTo), 'MMM d')}`
                    : filters.dueDateFrom
                      ? `From ${format(parseISO(filters.dueDateFrom), 'MMM d')}`
                      : `Until ${format(parseISO(filters.dueDateTo!), 'MMM d')}`
                }
                onRemove={removeDateRangeFilter}
              />
            )}

            {filters.labels.map((label) => (
              <FilterChip key={label} label={label} onRemove={() => removeLabelFilter(label)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
