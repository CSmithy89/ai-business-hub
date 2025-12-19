/**
 * Column Visibility Toggle
 *
 * Story: PM-03.1 - Task List View
 *
 * Popover component for managing column visibility in the task list.
 * Allows users to show/hide columns with persistence to localStorage.
 */

'use client'

import { type Table } from '@tanstack/react-table'
import { Columns } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { TaskListItem } from '@/hooks/use-pm-tasks'
import { setViewPreferences } from '@/lib/pm/view-preferences'

interface ColumnVisibilityToggleProps {
  table: Table<TaskListItem>
  projectId: string
}

/**
 * Column display names
 */
const COLUMN_LABELS: Record<string, string> = {
  select: 'Selection',
  taskNumber: 'ID',
  title: 'Title',
  status: 'Status',
  priority: 'Priority',
  assigneeId: 'Assignee',
  dueDate: 'Due Date',
}

/**
 * Column Visibility Toggle Component
 *
 * Provides a popover interface for toggling column visibility.
 * Changes are persisted to localStorage per project.
 */
export function ColumnVisibilityToggle({
  table,
  projectId,
}: ColumnVisibilityToggleProps) {
  const columns = table.getAllColumns().filter((column) => column.getCanHide())

  const handleVisibilityChange = (columnId: string, visible: boolean) => {
    // Update table state
    table.getColumn(columnId)?.toggleVisibility(visible)

    // Persist to localStorage
    const visibleColumns = table
      .getAllColumns()
      .filter((col) => col.getIsVisible())
      .map((col) => col.id)

    setViewPreferences(projectId, {
      listColumns: visibleColumns,
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          aria-label="Column visibility"
        >
          <Columns className="h-4 w-4" />
          <span>Columns</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[200px]">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
            Toggle columns
          </h4>
          <p className="text-xs text-[rgb(var(--color-text-secondary))]">
            Show or hide table columns
          </p>
        </div>
        <div className="mt-4 space-y-2">
          {columns.map((column) => {
            const label = COLUMN_LABELS[column.id] || column.id
            const isVisible = column.getIsVisible()

            return (
              <div
                key={column.id}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`column-${column.id}`}
                  checked={isVisible}
                  onCheckedChange={(value) => {
                    handleVisibilityChange(column.id, !!value)
                  }}
                  aria-label={`Toggle ${label} column`}
                />
                <label
                  htmlFor={`column-${column.id}`}
                  className="flex-1 cursor-pointer text-sm text-[rgb(var(--color-text-primary))] hover:text-[rgb(var(--color-text-secondary))]"
                >
                  {label}
                </label>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
