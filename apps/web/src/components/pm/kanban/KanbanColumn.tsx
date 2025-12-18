/**
 * Kanban Column Component
 *
 * Story: PM-03.2 - Kanban Board Basic
 *
 * Single column containing task cards for one status.
 * Displays column header with status name and count, scrollable card container,
 * and empty state when no tasks are present.
 */

'use client'

import { TaskCard } from './TaskCard'
import type { TaskListItem } from '@/hooks/use-pm-tasks'

interface KanbanColumnProps {
  /** Display title for column */
  title: string
  /** Tasks in this column */
  tasks: TaskListItem[]
  /** Callback when task card is clicked */
  onTaskClick: (taskId: string) => void
}

/**
 * Kanban Column Component
 *
 * Renders a single status column in the kanban board with:
 * - Header showing status name and task count
 * - Scrollable container with task cards
 * - Empty state message when no tasks
 *
 * Fixed width of 320px (w-80) to maintain consistent column layout.
 */
export function KanbanColumn({ title, tasks, onTaskClick }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-80 flex-shrink-0 bg-muted rounded-lg p-4 h-full">
      {/* Column Header */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
          {title}
          <span className="ml-2 text-[rgb(var(--color-text-secondary))] font-normal">
            ({tasks.length})
          </span>
        </h3>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
            />
          ))
        ) : (
          /* Empty State */
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No tasks in this status
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
