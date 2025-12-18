/**
 * Kanban Board Grouping Utilities
 *
 * Story: PM-03.2 - Kanban Board Basic
 *
 * Utilities for grouping tasks by status into kanban columns.
 */

import type { TaskListItem, TaskStatus } from '@/hooks/use-pm-tasks'

export interface KanbanColumn {
  /** Column ID (matches TaskStatus) */
  id: string
  /** Display title for column header */
  title: string
  /** Status this column represents */
  status: TaskStatus
  /** Tasks in this column */
  tasks: TaskListItem[]
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
 * Groups tasks by status into kanban columns
 *
 * Returns an array of columns in logical workflow order:
 * Backlog -> To Do -> In Progress -> Review -> Done
 *
 * Empty columns are included in the result to maintain column layout.
 *
 * @param tasks - Array of tasks to group
 * @returns Array of kanban columns with tasks grouped by status
 *
 * @example
 * const columns = groupTasksByStatus(tasks)
 * columns.forEach(column => {
 *   console.log(`${column.title} (${column.tasks.length})`)
 * })
 */
export function groupTasksByStatus(tasks: TaskListItem[]): KanbanColumn[] {
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
    status,
    tasks: tasksByStatus.get(status) ?? [],
  }))
}
