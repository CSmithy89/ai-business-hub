/**
 * Kanban Board View
 *
 * Story: PM-03.2 - Kanban Board Basic
 *
 * Main kanban board view with horizontal column layout.
 * Groups tasks by status and displays them in columns.
 * This is DISPLAY ONLY - drag-and-drop will be added in PM-03.3.
 */

'use client'

import { useMemo } from 'react'
import { KanbanColumn } from '../kanban/KanbanColumn'
import { groupTasksByStatus } from '@/lib/pm/kanban-grouping'
import type { TaskListItem } from '@/hooks/use-pm-tasks'

interface KanbanBoardViewProps {
  /** Array of tasks to display */
  tasks: TaskListItem[]
  /** Callback when task card is clicked */
  onTaskClick: (taskId: string) => void
}

/**
 * Kanban Board View Component
 *
 * Renders a horizontal kanban board with columns for each status:
 * Backlog -> To Do -> In Progress -> Review -> Done
 *
 * Features:
 * - Horizontal scroll layout
 * - Task cards grouped by status
 * - Card count in column headers
 * - Empty state for columns with no tasks
 * - Click card to open task detail
 *
 * Performance:
 * - Uses useMemo to optimize grouping calculation
 * - TaskCard components are memoized
 */
export function KanbanBoardView({ tasks, onTaskClick }: KanbanBoardViewProps) {
  // Group tasks by status
  const columns = useMemo(() => groupTasksByStatus(tasks), [tasks])

  return (
    <div className="h-[calc(100vh-16rem)] overflow-x-auto overflow-y-hidden">
      <div className="flex gap-4 pb-4 h-full min-w-min">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            title={column.title}
            tasks={column.tasks}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  )
}
