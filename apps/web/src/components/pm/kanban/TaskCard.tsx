/**
 * Task Card Component
 *
 * Story: PM-03.2 - Kanban Board Basic
 * Story: PM-03.3 - Kanban Drag & Drop
 * Story: PM-06.3 - Real-Time Kanban (added Framer Motion animations)
 *
 * Individual task card displaying task information in kanban board.
 * Shows type icon, title, priority badge, assignee indicator, and AI badge for agent tasks.
 * Supports drag-and-drop functionality via @dnd-kit/sortable.
 * Animated with Framer Motion for real-time updates.
 */

'use client'

import { memo, useEffect, useState } from 'react'
import { Sparkles, User, Bot } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
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
  /** Whether this card is being optimistically updated */
  isOptimistic?: boolean
}

/**
 * Task Card Component
 *
 * Displays a task card with:
 * - Type icon and title
 * - AI badge for agent-assigned tasks
 * - Task number, priority badge, and assignee indicator
 * - Drag-and-drop support
 * - Framer Motion animations for real-time updates
 *
 * Animations:
 * - New tasks: glow effect (ring) for first 3 seconds
 * - Updated tasks: scale animation (1 -> 1.02 -> 1)
 * - Optimistic updates: reduced opacity (0.7)
 * - Layout changes: smooth position animation
 *
 * Optimized with React.memo to prevent unnecessary re-renders.
 */
export const TaskCard = memo(function TaskCard({
  task,
  onClick,
  isDragging = false,
  isOptimistic = false,
}: TaskCardProps) {
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

  // ========================================
  // Animation States (Story PM-06.3)
  // ========================================

  // Detect newly created tasks (show glow effect for 3 seconds)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    if (task.createdAt) {
      const createdTime = new Date(task.createdAt).getTime()
      const now = Date.now()
      if (now - createdTime < 3000) {
        setIsNew(true)
        const timer = setTimeout(() => setIsNew(false), 3000)
        return () => clearTimeout(timer)
      }
    }
    return undefined
  }, [task.createdAt])

  // Detect task updates (trigger scale animation)
  const [hasUpdated, setHasUpdated] = useState(false)

  useEffect(() => {
    setHasUpdated(true)
    const timer = setTimeout(() => setHasUpdated(false), 500)
    return () => clearTimeout(timer)
  }, [task.title, task.priority, task.assigneeId, task.updatedAt])

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isOptimistic ? 0.7 : 1,
        scale: hasUpdated ? [1, 1.02, 1] : 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        layout: { duration: 0.3, ease: 'easeInOut' },
        opacity: { duration: 0.2 },
        scale: { duration: 0.3 },
      }}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))]',
        (isDragging || isSortableDragging) && 'opacity-50',
        isOptimistic && 'cursor-wait'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <Card
        className={cn(
          'p-3',
          isNew && 'ring-2 ring-primary ring-offset-2'
        )}
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
    </motion.div>
  )
})
