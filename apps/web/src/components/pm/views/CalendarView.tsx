/**
 * Calendar View
 *
 * Story: PM-03.4 - Calendar View
 *
 * Main calendar component with month/week/day views for task scheduling.
 * Displays tasks organized by due date with drag-and-drop rescheduling.
 */

'use client'

import { useState, useMemo } from 'react'
import { addMonths, subMonths, addDays, subDays, format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { MonthView } from '../calendar/MonthView'
import { WeekView } from '../calendar/WeekView'
import { DayView } from '../calendar/DayView'
import { CalendarTaskCard } from '../calendar/CalendarTaskCard'
import type { TaskListItem } from '@/hooks/use-pm-tasks'
import { useUpdatePmTask } from '@/hooks/use-pm-tasks'

type ViewMode = 'month' | 'week' | 'day'

interface CalendarViewProps {
  /** Array of tasks to display */
  tasks: TaskListItem[]
  /** Project ID for context */
  projectId: string
  /** Callback when task card is clicked */
  onTaskClick: (taskId: string) => void
}

/**
 * Calendar View Component
 *
 * Features:
 * - Month/Week/Day view modes
 * - Tasks grouped by due date
 * - Drag-and-drop rescheduling
 * - Navigation (prev/next/today)
 * - Filters tasks without due dates
 *
 * Performance:
 * - Uses useMemo for date calculations and task grouping
 * - Filters tasks early to reduce processing
 */
export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  // Task update mutation for drag-and-drop rescheduling
  const updateTaskMutation = useUpdatePmTask()

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  )

  // Filter tasks to only include those with due dates
  const tasksWithDueDates = useMemo(() => {
    return tasks.filter(task => task.dueDate !== null)
  }, [tasks])

  // Group tasks by date for efficient lookup
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskListItem[]>()

    tasksWithDueDates.forEach(task => {
      if (!task.dueDate) return

      const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd')

      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }

      map.get(dateKey)!.push(task)
    })

    return map
  }, [tasksWithDueDates])

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(subDays(currentDate, 7))
    } else {
      setCurrentDate(subDays(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7))
    } else {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTaskId(null)

    // Check if dropped on a valid target
    if (!over || !over.data.current) return

    const taskId = active.id as string
    const dropData = over.data.current as { date: string; type: string }

    // Only handle calendar-day drops
    if (dropData.type !== 'calendar-day') return

    const newDueDate = dropData.date

    // Find the task to check if date actually changed
    const task = tasksWithDueDates.find(t => t.id === taskId)
    if (!task) return

    const currentDueDate = task.dueDate
      ? format(new Date(task.dueDate), 'yyyy-MM-dd')
      : null

    // Skip if dropping on same date
    if (currentDueDate === newDueDate) return

    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        input: {
          dueDate: newDueDate
        }
      })
      toast.success('Task rescheduled')
    } catch {
      toast.error('Failed to reschedule task')
    }
  }

  // Get active task for drag overlay
  const activeTask = activeTaskId
    ? tasksWithDueDates.find(t => t.id === activeTaskId)
    : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        {/* Header with navigation and view toggle */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center">
              {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
              {viewMode === 'week' && `Week of ${format(currentDate, 'MMM d, yyyy')}`}
              {viewMode === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleToday}
            >
              Today
            </Button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </div>
        </div>

        {/* Calendar content */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              tasksByDate={tasksByDate}
              onTaskClick={onTaskClick}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              tasksByDate={tasksByDate}
              onTaskClick={onTaskClick}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              tasksByDate={tasksByDate}
              onTaskClick={onTaskClick}
            />
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask ? (
          <CalendarTaskCard task={activeTask} onClick={() => {}} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
