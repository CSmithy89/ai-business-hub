/**
 * Task Table Column Definitions
 *
 * Story: PM-03.1 - Task List View
 *
 * Column definitions for TanStack Table in the Task List View.
 * Defines structure, cell renderers, and sort configuration for each column.
 */

import { type ColumnDef } from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'
import { ArrowDown, ArrowUp, CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { TaskListItem, TaskStatus } from '@/hooks/use-pm-tasks'
import { TASK_PRIORITY_META, TASK_TYPE_META } from '@/lib/pm/task-meta'
import { cn } from '@/lib/utils'

/**
 * Format date for display
 */
function formatDate(value: string | null): string {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

/**
 * Get badge variant for task status
 */
function statusBadgeVariant(
  status: TaskStatus
): 'secondary' | 'outline' | 'success' | 'destructive' {
  if (status === 'DONE') return 'success'
  if (status === 'CANCELLED') return 'destructive'
  if (status === 'IN_PROGRESS') return 'secondary'
  return 'outline'
}

/**
 * Sort header component with visual indicators
 */
function SortHeader({ column, children }: { column: any; children: React.ReactNode }) {
  const isSorted = column.getIsSorted()

  return (
    <button
      type="button"
      className="flex items-center gap-2 font-medium hover:text-[rgb(var(--color-text-primary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))]"
      onClick={() => column.toggleSorting()}
    >
      {children}
      {isSorted === 'asc' && <ArrowUp className="h-4 w-4" aria-label="Sorted ascending" />}
      {isSorted === 'desc' && <ArrowDown className="h-4 w-4" aria-label="Sorted descending" />}
    </button>
  )
}

/**
 * Create column definitions for task list table
 */
export function createTaskColumns(
  onTaskClick: (taskId: string) => void
): ColumnDef<TaskListItem>[] {
  return [
    // Checkbox column for bulk selection
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    // Task number column
    {
      id: 'taskNumber',
      accessorKey: 'taskNumber',
      header: ({ column }) => <SortHeader column={column}>ID</SortHeader>,
      cell: ({ row }) => (
        <button
          type="button"
          className="text-sm font-medium text-[rgb(var(--color-primary-500))] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))]"
          onClick={(e) => {
            e.stopPropagation()
            onTaskClick(row.original.id)
          }}
        >
          #{row.original.taskNumber}
        </button>
      ),
      size: 80,
    },

    // Title column with type icon
    {
      id: 'title',
      accessorKey: 'title',
      header: ({ column }) => <SortHeader column={column}>Title</SortHeader>,
      cell: ({ row }) => {
        const task = row.original
        const typeMeta = TASK_TYPE_META[task.type]
        const TypeIcon = typeMeta.icon

        return (
          <button
            type="button"
            className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))]"
            onClick={(e) => {
              e.stopPropagation()
              onTaskClick(task.id)
            }}
          >
            <TypeIcon
              className={cn('h-4 w-4 shrink-0', typeMeta.iconClassName)}
              aria-hidden="true"
            />
            <span className="truncate text-sm font-medium text-[rgb(var(--color-text-primary))]">
              {task.title}
            </span>
          </button>
        )
      },
      size: 300,
    },

    // Status column
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column }) => <SortHeader column={column}>Status</SortHeader>,
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={statusBadgeVariant(status) as any}>
            {status.replace(/_/g, ' ')}
          </Badge>
        )
      },
      size: 120,
    },

    // Priority column
    {
      id: 'priority',
      accessorKey: 'priority',
      header: ({ column }) => <SortHeader column={column}>Priority</SortHeader>,
      cell: ({ row }) => {
        const priority = row.original.priority
        const meta = TASK_PRIORITY_META[priority]
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn('h-2.5 w-2.5 rounded-full', meta.dotClassName)}
              aria-hidden="true"
            />
            <span className="text-sm text-[rgb(var(--color-text-primary))]">
              {meta.label}
            </span>
          </div>
        )
      },
      size: 100,
    },

    // Assignee column
    {
      id: 'assigneeId',
      accessorKey: 'assigneeId',
      header: ({ column }) => <SortHeader column={column}>Assignee</SortHeader>,
      cell: ({ row }) => {
        const assigneeId = row.original.assigneeId
        const assignmentType = row.original.assignmentType

        if (!assigneeId) {
          return (
            <span className="text-sm text-[rgb(var(--color-text-secondary))]">
              Unassigned
            </span>
          )
        }

        // TODO: Replace with actual user avatar component when available
        // For now, show assignment type
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--color-bg-tertiary))] text-xs font-medium text-[rgb(var(--color-text-primary))]">
              {assignmentType === 'AGENT' ? '🤖' : '👤'}
            </div>
            <span className="text-sm text-[rgb(var(--color-text-primary))] truncate">
              {assignmentType}
            </span>
          </div>
        )
      },
      size: 150,
    },

    // Due date column
    {
      id: 'dueDate',
      accessorKey: 'dueDate',
      header: ({ column }) => <SortHeader column={column}>Due Date</SortHeader>,
      cell: ({ row }) => {
        const dueDate = row.original.dueDate
        const isOverdue =
          dueDate && new Date(dueDate) < new Date() && row.original.status !== 'DONE'

        return (
          <div className="flex items-center gap-2">
            <CalendarDays
              className={cn(
                'h-4 w-4',
                isOverdue ? 'text-red-500' : 'text-[rgb(var(--color-text-secondary))]'
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                'text-sm',
                isOverdue
                  ? 'font-medium text-red-500'
                  : 'text-[rgb(var(--color-text-primary))]'
              )}
            >
              {formatDate(dueDate)}
            </span>
          </div>
        )
      },
      size: 140,
    },
  ]
}
