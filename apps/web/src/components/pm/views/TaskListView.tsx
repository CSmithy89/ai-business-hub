/**
 * Task List View
 *
 * Story: PM-03.1 - Task List View
 *
 * High-performance task list view using TanStack Table with virtualization.
 * Displays tasks in a sortable table with bulk selection, pagination, and column visibility.
 */

'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TaskListItem } from '@/hooks/use-pm-tasks'
import { getViewPreferences, setViewPreferences } from '@/lib/pm/view-preferences'
import { cn } from '@/lib/utils'
import { ColumnVisibilityToggle } from '../table/ColumnVisibilityToggle'
import { createTaskColumns } from '../table/TaskTableColumns'

interface TaskListViewProps {
  /** Task data to display */
  tasks: TaskListItem[]
  /** Project ID for preference persistence */
  projectId: string
  /** Loading state */
  isLoading?: boolean
  /** Callback when task is clicked */
  onTaskClick: (taskId: string) => void
  /** Callback when more tasks should be loaded */
  onLoadMore?: () => void
  /** Whether more tasks can be loaded */
  hasMore?: boolean
  /** Whether currently loading more */
  isLoadingMore?: boolean
}

/**
 * Task List View Component
 *
 * Renders a virtualized, sortable table of tasks with the following features:
 * - Bulk selection with checkboxes
 * - Sortable column headers
 * - Column visibility toggle
 * - Virtualization for performance (500+ tasks)
 * - Pagination with "Load More" button
 */
export function TaskListView({
  tasks,
  projectId,
  isLoading = false,
  onTaskClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: TaskListViewProps) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // Load preferences from localStorage
  useEffect(() => {
    const prefs = getViewPreferences(projectId)

    // Set initial column visibility
    const allColumns = ['select', 'taskNumber', 'title', 'status', 'priority', 'assigneeId', 'dueDate']
    const visibility: VisibilityState = {}
    allColumns.forEach((col) => {
      visibility[col] = prefs.listColumns.includes(col)
    })
    setColumnVisibility(visibility)

    // Set initial sorting
    if (prefs.sortBy) {
      setSorting([
        {
          id: prefs.sortBy,
          desc: prefs.sortOrder === 'desc',
        },
      ])
    }
  }, [projectId])

  // Persist sorting changes
  useEffect(() => {
    if (sorting.length > 0) {
      const sort = sorting[0]
      setViewPreferences(projectId, {
        sortBy: sort.id,
        sortOrder: sort.desc ? 'desc' : 'asc',
      })
    }
  }, [sorting, projectId])

  // Create column definitions
  const columns = useMemo<ColumnDef<TaskListItem>[]>(
    () => createTaskColumns(onTaskClick),
    [onTaskClick]
  )

  // Initialize table
  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null)
  const rows = table.getRowModel().rows

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height in pixels
    overscan: 10, // Render 10 rows above/below viewport
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalHeight = virtualizer.getTotalSize()

  // Get selected task IDs
  const selectedTaskIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => rows[parseInt(key)]?.original.id)
      .filter(Boolean)
  }, [rowSelection, rows])

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Loading tasks…</p>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ChevronRight}
        headline="No tasks found"
        description="No tasks match the current filters."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[rgb(var(--color-text-secondary))]">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          {selectedTaskIds.length > 0 && (
            <span className="ml-2 font-medium text-[rgb(var(--color-text-primary))]">
              ({selectedTaskIds.length} selected)
            </span>
          )}
        </div>
        <ColumnVisibilityToggle table={table} projectId={projectId} />
      </div>

      {/* Table */}
      <Card>
        <div
          ref={parentRef}
          className="relative overflow-auto"
          style={{ height: '600px' }}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[rgb(var(--color-bg-primary))]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody style={{ height: `${totalHeight}px`, position: 'relative' }}>
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index]
                if (!row) return null

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      'cursor-pointer hover:bg-[rgb(var(--color-bg-tertiary))]',
                      row.getIsSelected() && 'bg-[rgb(var(--color-bg-secondary))]'
                    )}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onClick={() => onTaskClick(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <CardContent className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading…' : 'Load More'}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* TODO: Bulk Actions Bar (PM-03.8) */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <Card className="p-4 shadow-lg">
            <p className="text-sm text-[rgb(var(--color-text-primary))]">
              {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''} selected
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">
              Bulk actions will be available in PM-03.8
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
