/**
 * Task Card Component
 *
 * Story: PM-03.2 - Kanban Board Basic
 * Story: PM-03.3 - Kanban Drag & Drop
 *
 * Individual task card displaying task information in kanban board.
 * Shows type icon, title, priority badge, assignee indicator, and AI badge for agent tasks.
 * Supports drag-and-drop functionality via @dnd-kit/sortable.
 */

'use client'

import { memo } from 'react'
import { Sparkles, User, Bot } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TaskListItem } from '@/hooks/use-pm-tasks'
import { TASK_TYPE_META, TASK_PRIORITY_META } from '@/lib/pm/task-meta'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  /** Task data to display */
  task: TaskListItem
  /** Callback when card is clicked */
  onClick: () => void
  /** Whether this card is being dragged (for DragOverlay) */
  isDragging?: boolean
}

/**
 * Task Card Component
 *
 * Displays a task card with:
 * - Type icon and title
 * - AI badge for agent-assigned tasks
 * - Task number, priority badge, and assignee indicator
 * - Drag-and-drop support
 *
 * Optimized with React.memo to prevent unnecessary re-renders.
 */
export const TaskCard = memo(function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
  const typeMeta = TASK_TYPE_META[task.type]
  const TypeIcon = typeMeta.icon
  const priorityMeta = TASK_PRIORITY_META[task.priority]

  // Determine assignee indicator
  const isAgentAssigned = task.assignmentType === 'AGENT' || task.assignmentType === 'HYBRID'
  const AssigneeIcon = isAgentAssigned ? Bot : User

  // Set up sortable behavior
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))]',
        (isDragging || isSortableDragging) && 'opacity-50'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Top Row: Type Icon, Title, AI Badge */}
      <div className="flex items-start gap-2 mb-2">
        <TypeIcon
          className={cn('h-4 w-4 shrink-0 mt-0.5', typeMeta.iconClassName)}
          aria-hidden="true"
        />
        <span className="flex-1 text-sm font-medium text-[rgb(var(--color-text-primary))] line-clamp-2">
          {task.title}
        </span>
        {isAgentAssigned && (
          <Sparkles
            className="h-4 w-4 shrink-0 text-purple-500"
            aria-label="AI-assigned task"
          />
        )}
      </div>

      {/* Bottom Row: Task Number, Priority, Assignee */}
      <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))]">
        <span className="font-medium">#{task.taskNumber}</span>
        <span className="flex items-center gap-1">
          <span
            className={cn('h-2 w-2 rounded-full', priorityMeta.dotClassName)}
            aria-hidden="true"
          />
          <span className="sr-only">{priorityMeta.label} priority</span>
        </span>
        <AssigneeIcon
          className="h-3.5 w-3.5"
          aria-label={isAgentAssigned ? 'Agent assigned' : 'Human assigned'}
        />
      </div>
    </Card>
  )
})
