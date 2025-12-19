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

import { useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useVirtualizer } from '@tanstack/react-virtual'
import { TaskCard } from './TaskCard'
import type { TaskListItem } from '@/hooks/use-pm-tasks'
import type { GroupByOption } from '@/lib/pm/kanban-grouping'
import { cn } from '@/lib/utils'

/** Threshold for enabling virtualization */
const VIRTUALIZATION_THRESHOLD = 20
/** Estimated card height in pixels */
const CARD_HEIGHT = 100
/** Extra cards to render outside viewport */
const OVERSCAN = 5

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
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  })
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const isOverLimit = wipLimit !== undefined && tasks.length > wipLimit
  const shouldVirtualize = tasks.length > VIRTUALIZATION_THRESHOLD

  // Virtualization for columns with many tasks
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => CARD_HEIGHT,
    overscan: OVERSCAN,
    enabled: shouldVirtualize,
  })

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={`${title} column with ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
      aria-describedby={`${columnId}-drop-hint`}
      className={cn(
        "flex flex-col w-80 flex-shrink-0 bg-muted rounded-lg p-4 h-full",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <span id={`${columnId}-drop-hint`} className="sr-only">
        Drop tasks here to move them to {title}
      </span>
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
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {tasks.length > 0 ? (
            shouldVirtualize ? (
              // Virtualized rendering for large lists
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const task = tasks[virtualItem.index]
                  return (
                    <div
                      key={task.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                        paddingBottom: '8px',
                      }}
                    >
                      <TaskCard
                        task={task}
                        onClick={() => onTaskClick(task.id)}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              // Regular rendering for small lists
              <div className="space-y-2">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task.id)}
                  />
                ))}
              </div>
            )
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
