/**
 * URL State Management for PM Filters
 *
 * Story: PM-03.7 - Advanced Filters
 *
 * Utilities for serializing and parsing filter state to/from URL parameters.
 * Provides debounced URL updates to prevent excessive history entries.
 */

import type { TaskStatus, TaskType, TaskPriority } from '@/hooks/use-pm-tasks'

export type FilterState = {
  status: TaskStatus[]
  priority: TaskPriority | null
  assigneeId: string | null
  type: TaskType | null
  labels: string[]
  dueDateFrom: string | null
  dueDateTo: string | null
  phaseId: string | null
}

/**
 * Serialize filter state to URL search params
 */
export function serializeFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.status.length > 0) {
    params.set('status', filters.status.join(','))
  }

  if (filters.priority) {
    params.set('priority', filters.priority)
  }

  if (filters.assigneeId) {
    params.set('assignee', filters.assigneeId)
  }

  if (filters.type) {
    params.set('type', filters.type)
  }

  if (filters.labels.length > 0) {
    params.set('labels', filters.labels.join(','))
  }

  if (filters.dueDateFrom) {
    params.set('dueDateFrom', filters.dueDateFrom)
  }

  if (filters.dueDateTo) {
    params.set('dueDateTo', filters.dueDateTo)
  }

  if (filters.phaseId) {
    params.set('phase', filters.phaseId)
  }

  return params
}

/**
 * Parse filter state from URL search params
 */
export function parseFilters(params: URLSearchParams): FilterState {
  const statusParam = params.get('status')
  const priorityParam = params.get('priority')
  const assigneeParam = params.get('assignee')
  const typeParam = params.get('type')
  const labelsParam = params.get('labels')
  const dueDateFromParam = params.get('dueDateFrom')
  const dueDateToParam = params.get('dueDateTo')
  const phaseParam = params.get('phase')

  return {
    status: statusParam ? (statusParam.split(',') as TaskStatus[]) : [],
    priority: priorityParam as TaskPriority | null,
    assigneeId: assigneeParam || null,
    type: typeParam as TaskType | null,
    labels: labelsParam ? labelsParam.split(',') : [],
    dueDateFrom: dueDateFromParam || null,
    dueDateTo: dueDateToParam || null,
    phaseId: phaseParam || null,
  }
}

/**
 * Create a debounced function for URL updates
 * Returns both update and cancel functions to prevent memory leaks on unmount
 */
export function createDebouncedUrlUpdate(
  updateUrl: (params: URLSearchParams) => void,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null

  const update = (filters: FilterState) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      const params = serializeFilters(filters)
      updateUrl(params)
      timeoutId = null
    }, delay)
  }

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return { update, cancel }
}

/**
 * Check if filters are empty (no active filters)
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.status.length > 0 ||
    filters.priority !== null ||
    filters.assigneeId !== null ||
    filters.type !== null ||
    filters.labels.length > 0 ||
    filters.dueDateFrom !== null ||
    filters.dueDateTo !== null ||
    filters.phaseId !== null
  )
}

/**
 * Get empty filter state
 */
export function getEmptyFilters(): FilterState {
  return {
    status: [],
    priority: null,
    assigneeId: null,
    type: null,
    labels: [],
    dueDateFrom: null,
    dueDateTo: null,
    phaseId: null,
  }
}
