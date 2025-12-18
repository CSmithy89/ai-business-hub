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
import type { TaskListItem, TaskStatus, TaskPriority, AssignmentType } from '@/hooks/use-pm-tasks'
import { useBulkUpdatePmTasks, useBulkDeletePmTasks, useUpsertPmTaskLabel } from '@/hooks/use-pm-tasks'
import { getViewPreferences, setViewPreferences } from '@/lib/pm/view-preferences'
import { cn } from '@/lib/utils'
import { ColumnVisibilityToggle } from '../table/ColumnVisibilityToggle'
import { createTaskColumns } from '../table/TaskTableColumns'
import { BulkActionsBar } from '../bulk/BulkActionsBar'
import { BulkStatusDialog } from '../bulk/BulkStatusDialog'
import { BulkPriorityDialog } from '../bulk/BulkPriorityDialog'
import { BulkAssignDialog } from '../bulk/BulkAssignDialog'
import { BulkLabelDialog } from '../bulk/BulkLabelDialog'
import { BulkDeleteDialog } from '../bulk/BulkDeleteDialog'

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

  // Dialog states
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showPriorityDialog, setShowPriorityDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showLabelDialog, setShowLabelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Mutations
  const bulkUpdateMutation = useBulkUpdatePmTasks()
  const bulkDeleteMutation = useBulkDeletePmTasks()
  const upsertLabelMutation = useUpsertPmTaskLabel()

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+A / Ctrl+A - Select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault()
        table.toggleAllRowsSelected(true)
      }

      // Delete / Backspace - Bulk delete (when tasks selected)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTaskIds.length > 0) {
        // Only trigger if not focused in an input/textarea
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setShowDeleteDialog(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [table, selectedTaskIds.length])

  // Bulk action handlers
  const handleClearSelection = () => {
    setRowSelection({})
  }

  const handleBulkStatusChange = async (status: TaskStatus) => {
    await bulkUpdateMutation.mutateAsync({
      input: {
        ids: selectedTaskIds,
        status,
      },
    })
    setShowStatusDialog(false)
    handleClearSelection()
  }

  const handleBulkPriorityChange = async (priority: TaskPriority) => {
    await bulkUpdateMutation.mutateAsync({
      input: {
        ids: selectedTaskIds,
        priority,
      },
    })
    setShowPriorityDialog(false)
    handleClearSelection()
  }

  const handleBulkAssignChange = async (data: {
    assignmentType: AssignmentType
    assigneeId: string | null
  }) => {
    await bulkUpdateMutation.mutateAsync({
      input: {
        ids: selectedTaskIds,
        assignmentType: data.assignmentType,
        assigneeId: data.assigneeId,
      },
    })
    setShowAssignDialog(false)
    handleClearSelection()
  }

  const handleBulkAddLabels = async (labels: string[]) => {
    // Add labels to each task individually
    // This is a workaround until we have a bulk label endpoint
    for (const taskId of selectedTaskIds) {
      for (const labelName of labels) {
        try {
          await upsertLabelMutation.mutateAsync({
            taskId,
            input: { name: labelName },
          })
        } catch (error) {
          // Continue with other labels even if one fails
          console.error('Failed to add label:', error)
        }
      }
    }
    setShowLabelDialog(false)
    handleClearSelection()
  }

  const handleBulkDelete = async () => {
    await bulkDeleteMutation.mutateAsync({
      input: {
        ids: selectedTaskIds,
      },
    })
    setShowDeleteDialog(false)
    handleClearSelection()
  }

  const isProcessing =
    bulkUpdateMutation.isPending ||
    bulkDeleteMutation.isPending ||
    upsertLabelMutation.isPending

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

      {/* Bulk Actions Bar */}
      {selectedTaskIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedTaskIds.length}
          onClearSelection={handleClearSelection}
          onChangeStatus={() => setShowStatusDialog(true)}
          onChangePriority={() => setShowPriorityDialog(true)}
          onChangeAssignee={() => setShowAssignDialog(true)}
          onAddLabels={() => setShowLabelDialog(true)}
          onDelete={() => setShowDeleteDialog(true)}
          isProcessing={isProcessing}
        />
      )}

      {/* Bulk Action Dialogs */}
      <BulkStatusDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        selectedCount={selectedTaskIds.length}
        onConfirm={handleBulkStatusChange}
        isProcessing={isProcessing}
      />

      <BulkPriorityDialog
        open={showPriorityDialog}
        onOpenChange={setShowPriorityDialog}
        selectedCount={selectedTaskIds.length}
        onConfirm={handleBulkPriorityChange}
        isProcessing={isProcessing}
      />

      <BulkAssignDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        selectedCount={selectedTaskIds.length}
        onConfirm={handleBulkAssignChange}
        isProcessing={isProcessing}
      />

      <BulkLabelDialog
        open={showLabelDialog}
        onOpenChange={setShowLabelDialog}
        selectedCount={selectedTaskIds.length}
        onConfirm={handleBulkAddLabels}
        isProcessing={isProcessing}
      />

      <BulkDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedCount={selectedTaskIds.length}
        onConfirm={handleBulkDelete}
        isProcessing={isProcessing}
      />
    </div>
  )
}
