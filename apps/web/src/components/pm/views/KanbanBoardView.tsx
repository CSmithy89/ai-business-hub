/**
 * Kanban Board View
 *
 * Story: PM-03.2 - Kanban Board Basic
 * Story: PM-03.3 - Kanban Drag & Drop
 *
 * Main kanban board view with horizontal column layout.
 * Groups tasks by various criteria and supports drag-and-drop.
 */

'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from '../kanban/KanbanColumn'
import { TaskCard } from '../kanban/TaskCard'
import {
  groupTasksIntoColumns,
  getUpdatePayloadFromGrouping,
  type GroupByOption
} from '@/lib/pm/kanban-grouping'
import type { TaskListItem } from '@/hooks/use-pm-tasks'
import { useUpdatePmTask } from '@/hooks/use-pm-tasks'

interface KanbanBoardViewProps {
  /** Array of tasks to display */
  tasks: TaskListItem[]
  /** Callback when task card is clicked */
  onTaskClick: (taskId: string) => void
  /** Grouping option (default: status) */
  groupBy?: GroupByOption
  /** Project ID for WIP limits (optional) */
  projectId?: string
}

/**
 * Kanban Board View Component
 *
 * Renders a horizontal kanban board with drag-and-drop support.
 *
 * Features:
 * - Horizontal scroll layout
 * - Multi-dimensional grouping (status, priority, assignee, type, phase)
 * - Drag-and-drop with optimistic updates
 * - Card count and WIP limit warnings
 * - Empty state for columns with no tasks
 * - Keyboard accessibility
 *
 * Performance:
 * - Uses useMemo to optimize grouping calculation
 * - TaskCard components are memoized
 * - Optimistic updates for snappy UX
 */
export function KanbanBoardView({
  tasks,
  onTaskClick,
  groupBy = 'status',
}: KanbanBoardViewProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const updateTaskMutation = useUpdatePmTask()

  // Configure sensors for mouse, touch, and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Group tasks into columns based on groupBy option
  // TODO: Read WIP limits from project settings when available
  const columns = useMemo(() => {
    return groupTasksIntoColumns(tasks, groupBy)
  }, [tasks, groupBy])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTaskId(null)

    if (!over) return

    const taskId = active.id as string
    const newColumnId = over.id as string

    // Find the task being dragged
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Check if task is already in the target column
    const currentColumn = columns.find(col => col.tasks.some(t => t.id === taskId))
    if (currentColumn?.id === newColumnId) return

    // Determine which field to update based on groupBy
    const updatePayload = getUpdatePayloadFromGrouping(groupBy, newColumnId)

    // Optimistic update
    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        input: updatePayload as any
      })
    } catch (error) {
      // Error handling and rollback handled by React Query onError
      // Toast already shown by useUpdatePmTask hook
      console.error('Failed to update task:', error)
    }
  }

  // Get the active task for the drag overlay
  const activeTask = activeTaskId
    ? tasks.find(t => t.id === activeTaskId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-[calc(100vh-16rem)] overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 pb-4 h-full min-w-min">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              columnId={column.id}
              title={column.title}
              groupType={column.groupType}
              tasks={column.tasks}
              onTaskClick={onTaskClick}
              wipLimit={column.wipLimit}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} onClick={() => {}} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
