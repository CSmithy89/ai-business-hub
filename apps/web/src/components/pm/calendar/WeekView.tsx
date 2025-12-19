/**
 * Week View Component
 *
 * Displays a 7-column week view with current week's tasks.
 */

'use client'

import { useMemo } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns'
import { CalendarDay } from './CalendarDay'
import type { TaskListItem } from '@/hooks/use-pm-tasks'

interface WeekViewProps {
  currentDate: Date
  tasksByDate: Map<string, TaskListItem[]>
  onTaskClick: (taskId: string) => void
}

/**
 * Week View Component
 *
 * Renders a 7-column grid showing the current week.
 * Each column is a day with tasks displayed vertically.
 */
export function WeekView({ currentDate, tasksByDate, onTaskClick }: WeekViewProps) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [currentDate])

  return (
    <div className="h-full flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {days.map(day => (
          <div
            key={day.toISOString()}
            className="p-2 text-center border-r last:border-r-0"
          >
            <div className="font-semibold text-sm">{format(day, 'EEE')}</div>
            <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className="flex-1 grid grid-cols-7 border-t">
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDate.get(dateKey) || []
          const isToday = isSameDay(day, new Date())

          return (
            <CalendarDay
              key={dateKey}
              date={day}
              tasks={dayTasks}
              isCurrentMonth={true}
              isToday={isToday}
              onTaskClick={onTaskClick}
            />
          )
        })}
      </div>
    </div>
  )
}
