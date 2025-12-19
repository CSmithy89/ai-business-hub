/**
 * Calendar Task Card Component
 *
 * Draggable task bar displayed in calendar day cells.
 * Shows truncated task title with priority color indicator.
 */

'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { TaskListItem, TaskPriority } from '@/hooks/use-pm-tasks'

interface CalendarTaskCardProps {
  task: TaskListItem
  onClick: () => void
  onDrop?: (taskId: string) => void
  isDragging?: boolean
}

/**
 * Calendar Task Card Component
 *
 * Features:
 * - Draggable for rescheduling
 * - Priority color border
 * - Truncated title text
 * - Click to open detail
 */
export function CalendarTaskCard({ task, onClick, isDragging = false }: CalendarTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingState } = useDraggable({
    id: task.id,
    data: {
      task,
      type: 'calendar-task'
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const priorityColors = getPriorityColors(task.priority)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        // Only open on click, not on drag
        if (!isDraggingState) {
          onClick()
        }
      }}
      className={cn(
        "text-xs p-1.5 rounded border-l-2 cursor-pointer hover:shadow-sm transition-shadow",
        priorityColors.bg,
        priorityColors.border,
        (isDragging || isDraggingState) && "opacity-50 cursor-move"
      )}
    >
      <div className="truncate font-medium">{task.title}</div>
    </div>
  )
}

/**
 * Get priority-based color classes
 */
function getPriorityColors(priority: TaskPriority): { border: string; bg: string } {
  const colors = {
    URGENT: { border: 'border-l-red-500', bg: 'bg-red-50' },
    HIGH: { border: 'border-l-orange-500', bg: 'bg-orange-50' },
    MEDIUM: { border: 'border-l-yellow-500', bg: 'bg-yellow-50' },
    LOW: { border: 'border-l-blue-500', bg: 'bg-blue-50' },
    NONE: { border: 'border-l-gray-500', bg: 'bg-gray-50' },
  }
  return colors[priority] || colors.NONE
}
