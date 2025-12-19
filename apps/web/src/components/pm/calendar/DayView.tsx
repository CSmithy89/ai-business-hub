/**
 * Day View Component
 *
 * Displays all tasks for a single day in a list format.
 */

'use client'

import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { TaskListItem } from '@/hooks/use-pm-tasks'
import { TASK_PRIORITY_META } from '@/lib/pm/task-meta'
import { Badge } from '@/components/ui/badge'

interface DayViewProps {
  currentDate: Date
  tasksByDate: Map<string, TaskListItem[]>
  onTaskClick: (taskId: string) => void
}

/**
 * Day View Component
 *
 * Shows a single day's tasks in a vertical list.
 * Displays full task details including priority, status, and description preview.
 */
export function DayView({ currentDate, tasksByDate, onTaskClick }: DayViewProps) {
  const dateKey = format(currentDate, 'yyyy-MM-dd')
  const tasks = tasksByDate.get(dateKey) || []

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h2>

        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No tasks due today</p>
            <p className="text-sm mt-2">Create a task or check another date</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <DayTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Day Task Card for Day View
 */
function DayTaskCard({ task, onClick }: { task: TaskListItem; onClick: () => void }) {
  const priorityMeta = TASK_PRIORITY_META[task.priority]

  return (
    <div
      className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-3 h-3 rounded-full mt-1",
            priorityMeta.dotClassName
          )}
        />
        <div className="flex-1">
          <h3 className="font-semibold">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>#{task.taskNumber}</span>
            <Badge variant={getStatusVariant(task.status)}>
              {task.status.replace(/_/g, ' ')}
            </Badge>
            <span>{priorityMeta.label}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Get status badge variant
 */
function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'DONE') return 'default'
  if (status === 'CANCELLED') return 'destructive'
  if (status === 'IN_PROGRESS') return 'secondary'
  return 'outline'
}
