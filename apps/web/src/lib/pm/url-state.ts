/**
 * URL State Management for PM Filters
 *
 * Story: PM-03.7 - Advanced Filters
 *
 * Utilities for serializing and parsing filter state to/from URL parameters.
 * Provides debounced URL updates to prevent excessive history entries.
 */

import type { TaskStatus, TaskType, TaskPriority } from '@/hooks/use-pm-tasks'

/**
 * Valid enum values for runtime validation
 * These must be kept in sync with the types in use-pm-tasks.ts
 */
const VALID_TASK_STATUSES: readonly TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'AWAITING_APPROVAL',
  'DONE',
  'CANCELLED',
] as const

const VALID_TASK_PRIORITIES: readonly TaskPriority[] = [
  'URGENT',
  'HIGH',
  'MEDIUM',
  'LOW',
  'NONE',
] as const

const VALID_TASK_TYPES: readonly TaskType[] = [
  'EPIC',
  'STORY',
  'TASK',
  'SUBTASK',
  'BUG',
  'RESEARCH',
  'CONTENT',
  'AGENT_REVIEW',
] as const

/**
 * Type guard for TaskStatus
 */
function isValidTaskStatus(value: string): value is TaskStatus {
  return VALID_TASK_STATUSES.includes(value as TaskStatus)
}

/**
 * Type guard for TaskPriority
 */
function isValidTaskPriority(value: string): value is TaskPriority {
  return VALID_TASK_PRIORITIES.includes(value as TaskPriority)
}

/**
 * Type guard for TaskType
 */
function isValidTaskType(value: string): value is TaskType {
  return VALID_TASK_TYPES.includes(value as TaskType)
}

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

  // Validate status values - filter out any invalid entries
  const statuses: TaskStatus[] = statusParam
    ? statusParam.split(',').filter(isValidTaskStatus)
    : []

  // Validate priority - use null if invalid
  const priority: TaskPriority | null =
    priorityParam && isValidTaskPriority(priorityParam) ? priorityParam : null

  // Validate type - use null if invalid
  const type: TaskType | null =
    typeParam && isValidTaskType(typeParam) ? typeParam : null

  return {
    status: statuses,
    priority,
    assigneeId: assigneeParam || null,
    type,
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
