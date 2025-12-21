/**
 * Kanban Board Grouping Utilities
 *
 * Story: PM-03.2 - Kanban Board Basic
 * Story: PM-03.3 - Kanban Drag & Drop
 *
 * Utilities for grouping tasks by various criteria into kanban columns.
 */

import type { TaskListItem, TaskStatus, TaskPriority, TaskType, UpdateTaskInput } from '@/hooks/use-pm-tasks'
import { TASK_TYPE_META, TASK_PRIORITY_META } from './task-meta'

export type GroupByOption = 'status' | 'priority' | 'assignee' | 'type' | 'phase'

export interface KanbanColumn {
  /** Column ID */
  id: string
  /** Display title for column header */
  title: string
  /** Type of grouping this column represents */
  groupType: GroupByOption
  /** Value this column represents (null for "Unassigned"/"No Phase" columns) */
  groupValue: string | null
  /** Tasks in this column */
  tasks: TaskListItem[]
  /** WIP limit for this column (optional) */
  wipLimit?: number
}

/**
 * Status display configuration
 */
const STATUS_CONFIG: Array<{ status: TaskStatus; title: string }> = [
  { status: 'BACKLOG', title: 'Backlog' },
  { status: 'TODO', title: 'To Do' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'REVIEW', title: 'Review' },
  { status: 'DONE', title: 'Done' },
]

/**
 * Options for grouping tasks into columns
 */
export interface GroupingOptions {
  /** WIP limits per column ID */
  wipLimits?: Record<string, number>
  /** Assignee ID to display name lookup */
  assigneeNames?: Record<string, string>
  /** Phase ID to display name lookup */
  phaseNames?: Record<string, string>
}

/**
 * Groups tasks into kanban columns based on the grouping option
 *
 * @param tasks - Array of tasks to group
 * @param groupBy - Grouping option (status, priority, assignee, type, phase)
 * @param options - Optional grouping options (WIP limits, name lookups)
 * @returns Array of kanban columns with tasks grouped by specified criteria
 */
export function groupTasksIntoColumns(
  tasks: TaskListItem[],
  groupBy: GroupByOption,
  options?: GroupingOptions
): KanbanColumn[] {
  const wipLimits = options?.wipLimits
  switch (groupBy) {
    case 'status':
      return groupByStatus(tasks, wipLimits)
    case 'priority':
      return groupByPriority(tasks, wipLimits)
    case 'assignee':
      return groupByAssignee(tasks, wipLimits, options?.assigneeNames)
    case 'type':
      return groupByType(tasks, wipLimits)
    case 'phase':
      return groupByPhase(tasks, wipLimits, options?.phaseNames)
    default:
      return groupByStatus(tasks, wipLimits)
  }
}

/**
 * Groups tasks by status into kanban columns
 *
 * Returns an array of columns in logical workflow order:
 * Backlog -> To Do -> In Progress -> Review -> Done
 *
 * Empty columns are included in the result to maintain column layout.
 *
 * @param tasks - Array of tasks to group
 * @param wipLimits - Optional WIP limits per status
 * @returns Array of kanban columns with tasks grouped by status
 */
export function groupTasksByStatus(tasks: TaskListItem[]): KanbanColumn[] {
  return groupByStatus(tasks)
}

function groupByStatus(tasks: TaskListItem[], wipLimits?: Record<string, number>): KanbanColumn[] {
  // Create a map for quick lookup
  const tasksByStatus = new Map<TaskStatus, TaskListItem[]>()

  // Group tasks by status
  tasks.forEach(task => {
    const statusTasks = tasksByStatus.get(task.status) ?? []
    statusTasks.push(task)
    tasksByStatus.set(task.status, statusTasks)
  })

  // Create columns in order, including empty ones
  return STATUS_CONFIG.map(({ status, title }) => ({
    id: status,
    title,
    groupType: 'status' as const,
    groupValue: status,
    tasks: tasksByStatus.get(status) ?? [],
    wipLimit: wipLimits?.[status],
  }))
}

function groupByPriority(tasks: TaskListItem[], wipLimits?: Record<string, number>): KanbanColumn[] {
  const priorityOrder: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']

  // Group tasks by priority
  const tasksByPriority = new Map<TaskPriority, TaskListItem[]>()
  tasks.forEach(task => {
    const priorityTasks = tasksByPriority.get(task.priority) ?? []
    priorityTasks.push(task)
    tasksByPriority.set(task.priority, priorityTasks)
  })

  return priorityOrder.map(priority => ({
    id: priority,
    title: TASK_PRIORITY_META[priority].label,
    groupType: 'priority' as const,
    groupValue: priority,
    tasks: tasksByPriority.get(priority) ?? [],
    wipLimit: wipLimits?.[priority],
  }))
}

function groupByAssignee(
  tasks: TaskListItem[],
  wipLimits?: Record<string, number>,
  assigneeNames?: Record<string, string>
): KanbanColumn[] {
  // Get unique assignees
  const assigneeIds = Array.from(new Set(tasks.map(t => t.assigneeId).filter(Boolean)))

  // Group tasks by assignee
  const tasksByAssignee = new Map<string | null, TaskListItem[]>()
  tasks.forEach(task => {
    const key = task.assigneeId
    const assigneeTasks = tasksByAssignee.get(key) ?? []
    assigneeTasks.push(task)
    tasksByAssignee.set(key, assigneeTasks)
  })

  // Create columns for each assignee
  const assigneeColumns: KanbanColumn[] = assigneeIds.map(assigneeId => ({
    id: assigneeId!,
    title: getAssigneeDisplayName(assigneeId!, assigneeNames),
    groupType: 'assignee' as const,
    groupValue: assigneeId!,
    tasks: tasksByAssignee.get(assigneeId) ?? [],
    wipLimit: wipLimits?.[assigneeId!],
  }))

  // Add "Unassigned" column
  const unassignedTasks = tasksByAssignee.get(null) ?? []
  assigneeColumns.push({
    id: 'unassigned',
    title: 'Unassigned',
    groupType: 'assignee' as const,
    groupValue: null,
    tasks: unassignedTasks,
    wipLimit: wipLimits?.['unassigned'],
  })

  return assigneeColumns
}

function groupByType(tasks: TaskListItem[], wipLimits?: Record<string, number>): KanbanColumn[] {
  const typeOrder: TaskType[] = [
    'EPIC', 'STORY', 'TASK', 'SUBTASK', 'BUG', 'RESEARCH', 'CONTENT'
  ]

  // Group tasks by type
  const tasksByType = new Map<TaskType, TaskListItem[]>()
  tasks.forEach(task => {
    const typeTasks = tasksByType.get(task.type) ?? []
    typeTasks.push(task)
    tasksByType.set(task.type, typeTasks)
  })

  return typeOrder.map(type => ({
    id: type,
    title: TASK_TYPE_META[type].label,
    groupType: 'type' as const,
    groupValue: type,
    tasks: tasksByType.get(type) ?? [],
    wipLimit: wipLimits?.[type],
  }))
}

function groupByPhase(
  tasks: TaskListItem[],
  wipLimits?: Record<string, number>,
  phaseNames?: Record<string, string>
): KanbanColumn[] {
  // Get unique phases
  const phaseIds = Array.from(new Set(tasks.map(t => t.phaseId).filter(Boolean)))

  // Group tasks by phase
  const tasksByPhase = new Map<string | null, TaskListItem[]>()
  tasks.forEach(task => {
    const key = task.phaseId ? task.phaseId : null
    const phaseTasks = tasksByPhase.get(key) ?? []
    phaseTasks.push(task)
    tasksByPhase.set(key, phaseTasks)
  })

  // Create columns for each phase
  const phaseColumns: KanbanColumn[] = phaseIds.map(phaseId => ({
    id: phaseId!,
    title: getPhaseDisplayName(phaseId!, phaseNames),
    groupType: 'phase' as const,
    groupValue: phaseId!,
    tasks: tasksByPhase.get(phaseId) ?? [],
    wipLimit: wipLimits?.[phaseId!],
  }))

  // Add "No Phase" column
  const noPhaseTasks = tasksByPhase.get(null) ?? []
  phaseColumns.push({
    id: 'no-phase',
    title: 'No Phase',
    groupType: 'phase' as const,
    groupValue: null,
    tasks: noPhaseTasks,
    wipLimit: wipLimits?.['no-phase'],
  })

  return phaseColumns
}

/**
 * Determines which field to update based on grouping and target column
 *
 * @param groupBy - Current grouping option
 * @param targetColumnId - ID of the column the task was dropped into
 * @returns Partial update object for the task
 */
export function getUpdatePayloadFromGrouping(
  groupBy: GroupByOption,
  targetColumnId: string
): Partial<UpdateTaskInput> {
  switch (groupBy) {
    case 'status':
      return { status: targetColumnId as TaskStatus }
    case 'priority':
      return { priority: targetColumnId as TaskPriority }
    case 'assignee':
      return {
        assigneeId: targetColumnId === 'unassigned' ? null : targetColumnId
      }
    case 'type':
      return { type: targetColumnId as TaskType }
    case 'phase':
      // Note: phaseId is not in UpdateTaskInput yet, this will fail until backend supports it
      return {
        phaseId: targetColumnId === 'no-phase' ? null : targetColumnId
      }
    default:
      return {}
  }
}

/**
 * Get display name for an assignee
 * Uses lookup map if provided, otherwise falls back to truncated ID
 */
function getAssigneeDisplayName(assigneeId: string, nameMap?: Record<string, string>): string {
  if (nameMap && nameMap[assigneeId]) {
    return nameMap[assigneeId]
  }
  // Fallback to truncated ID if name not available
  return assigneeId.substring(0, 8) + '...'
}

/**
 * Get display name for a phase
 * Uses lookup map if provided, otherwise falls back to truncated ID
 */
function getPhaseDisplayName(phaseId: string, nameMap?: Record<string, string>): string {
  if (nameMap && nameMap[phaseId]) {
    return nameMap[phaseId]
  }
  // Fallback to truncated ID if name not available
  return phaseId.substring(0, 8) + '...'
}
