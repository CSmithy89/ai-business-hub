/**
 * Month View Component
 *
 * Displays a traditional month calendar grid with 6 weeks.
 * Shows tasks as cards in each day cell.
 */

'use client'

import { useMemo } from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay } from 'date-fns'
import { CalendarDay } from './CalendarDay'
import type { TaskListItem } from '@/hooks/use-pm-tasks'

interface MonthViewProps {
  currentDate: Date
  tasksByDate: Map<string, TaskListItem[]>
  onTaskClick: (taskId: string) => void
}

/**
 * Month View Component
 *
 * Renders a 7-column calendar grid including overflow days from prev/next months.
 * Uses CSS Grid for layout with equal-height rows.
 */
export function MonthView({ currentDate, tasksByDate, onTaskClick }: MonthViewProps) {
  // Calculate all days to display (6-week grid)
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)

    // Include overflow days from prev/next months for full grid
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="h-full flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {weekDays.map(day => (
          <div
            key={day}
            className="p-2 text-center font-semibold text-sm border-r last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - 6 rows × 7 columns */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr border-t">
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDate.get(dateKey) || []
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())

          return (
            <CalendarDay
              key={dateKey}
              date={day}
              tasks={dayTasks}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              onTaskClick={onTaskClick}
            />
          )
        })}
      </div>
    </div>
  )
}
