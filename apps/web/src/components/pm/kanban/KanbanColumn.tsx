/**
 * Kanban Column Component
 *
 * Story: PM-03.2 - Kanban Board Basic
 * Story: PM-03.3 - Kanban Drag & Drop
 *
 * Single column containing task cards.
 * Displays column header with name, count, and WIP limit warning.
 * Supports drag-and-drop functionality as a droppable target.
 */

'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import type { TaskListItem } from '@/hooks/use-pm-tasks'
import type { GroupByOption } from '@/lib/pm/kanban-grouping'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  /** Column ID for droppable */
  columnId: string
  /** Display title for column */
  title: string
  /** Type of grouping (for empty state message) */
  groupType: GroupByOption
  /** Tasks in this column */
  tasks: TaskListItem[]
  /** Callback when task card is clicked */
  onTaskClick: (taskId: string) => void
  /** WIP limit for this column (optional) */
  wipLimit?: number
}

/**
 * Kanban Column Component
 *
 * Renders a single column in the kanban board with:
 * - Header showing name, task count, and WIP limit warning
 * - Droppable area for drag-and-drop
 * - Sortable container with task cards
 * - Empty state message when no tasks
 *
 * Fixed width of 320px (w-80) to maintain consistent column layout.
 */
export function KanbanColumn({
  columnId,
  title,
  groupType,
  tasks,
  onTaskClick,
  wipLimit
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: columnId,
  })

  const isOverLimit = wipLimit !== undefined && tasks.length > wipLimit

  return (
    <div ref={setNodeRef} className="flex flex-col w-80 flex-shrink-0 bg-muted rounded-lg p-4 h-full">
      {/* Column Header */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
          {title}
          <span
            className={cn(
              "ml-2 font-normal",
              isOverLimit
                ? "text-destructive font-semibold"
                : "text-[rgb(var(--color-text-secondary))]"
            )}
          >
            ({tasks.length}{wipLimit !== undefined ? ` / ${wipLimit}` : ''})
          </span>
        </h3>
      </div>

      {/* Task Cards Container */}
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
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
                No tasks in this {groupType === 'status' ? 'status' : groupType}
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
