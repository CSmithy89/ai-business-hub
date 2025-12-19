/**
 * Calendar Day Component
 *
 * Single day cell in calendar grid.
 * Displays up to 3 tasks with "+N more" popover for overflow.
 * Drop target for drag-and-drop rescheduling.
 */

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useDroppable } from '@dnd-kit/core'
import { toast } from 'sonner'
import { CalendarTaskCard } from './CalendarTaskCard'
import { cn } from '@/lib/utils'
import { useUpdatePmTask } from '@/hooks/use-pm-tasks'
import type { TaskListItem } from '@/hooks/use-pm-tasks'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { TASK_PRIORITY_META } from '@/lib/pm/task-meta'

interface CalendarDayProps {
  date: Date
  tasks: TaskListItem[]
  isCurrentMonth: boolean
  isToday: boolean
  onTaskClick: (taskId: string) => void
}

/**
 * Calendar Day Cell Component
 *
 * Features:
 * - Shows date number
 * - Displays up to 3 tasks
 * - "+N more" popover for overflow
 * - Drop target for rescheduling
 * - Highlights today and current month
 */
export function CalendarDay({
  date,
  tasks,
  isCurrentMonth,
  isToday,
  onTaskClick
}: CalendarDayProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const updateTaskMutation = useUpdatePmTask()

  // Drop target setup
  const dateKey = format(date, 'yyyy-MM-dd')
  const { setNodeRef, isOver } = useDroppable({
    id: dateKey,
    data: {
      date: dateKey,
      type: 'calendar-day'
    }
  })

  // Handle task drop
  const handleDrop = async (taskId: string) => {
    const newDueDate = format(date, 'yyyy-MM-dd')

    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        input: {
          dueDate: newDueDate
        }
      })
      toast.success('Task rescheduled')
    } catch (error) {
      // Error already handled by mutation hook
      toast.error('Failed to reschedule task')
    }
  }

  const visibleTasks = tasks.slice(0, 3)
  const hasMoreTasks = tasks.length > 3

  const dateFormatted = format(date, 'EEEE, MMMM d, yyyy')

  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      aria-label={`${dateFormatted}, ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
      aria-describedby={`${dateKey}-drop-hint`}
      className={cn(
        "min-h-[120px] p-2 border-r border-b last:border-r-0",
        !isCurrentMonth && "bg-muted/50 text-muted-foreground",
        isToday && "bg-primary/5 border-primary border-2",
        isOver && "bg-primary/10 ring-2 ring-primary"
      )}
    >
      <span id={`${dateKey}-drop-hint`} className="sr-only">
        Drop task here to reschedule to {dateFormatted}
      </span>
      {/* Date number */}
      <div
        className={cn(
          "text-sm font-medium mb-1",
          isToday && "text-primary font-bold"
        )}
      >
        {format(date, 'd')}
      </div>

      {/* Task cards */}
      <div className="space-y-1">
        {visibleTasks.map(task => (
          <CalendarTaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task.id)}
            onDrop={handleDrop}
          />
        ))}

        {/* "+N more" indicator */}
        {hasMoreTasks && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-6 text-xs text-muted-foreground hover:bg-muted"
              >
                +{tasks.length - 3} more
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <div className="font-semibold text-sm mb-2">
                  Tasks for {format(date, 'MMM d, yyyy')}
                </div>
                {tasks.map(task => {
                  const priorityMeta = TASK_PRIORITY_META[task.priority]
                  return (
                    <div
                      key={task.id}
                      className="p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => {
                        onTaskClick(task.id)
                        setIsPopoverOpen(false)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            priorityMeta.dotClassName
                          )}
                        />
                        <span className="text-sm flex-1">{task.title}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Empty state for current month */}
      {isCurrentMonth && tasks.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-2">
          {/* Intentionally minimal - no "No tasks" text to reduce clutter */}
        </div>
      )}
    </div>
  )
}
