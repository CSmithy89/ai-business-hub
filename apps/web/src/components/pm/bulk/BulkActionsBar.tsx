/**
 * Bulk Actions Bar
 *
 * Story: PM-03.8 - Bulk Selection & Actions
 *
 * Fixed bottom bar that appears when tasks are selected.
 * Provides quick access to bulk operations: status, priority, assignee, labels, delete.
 */

'use client'

import { CheckSquare, Flame, Tag, Trash2, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface BulkActionsBarProps {
  /** Number of selected tasks */
  selectedCount: number
  /** Callback when user wants to clear selection */
  onClearSelection: () => void
  /** Callback when user wants to change status */
  onChangeStatus: () => void
  /** Callback when user wants to change priority */
  onChangePriority: () => void
  /** Callback when user wants to change assignee */
  onChangeAssignee: () => void
  /** Callback when user wants to add labels */
  onAddLabels: () => void
  /** Callback when user wants to delete tasks */
  onDelete: () => void
  /** Whether a bulk operation is in progress */
  isProcessing?: boolean
}

/**
 * Bulk Actions Bar Component
 *
 * Renders a fixed bottom bar with action buttons when tasks are selected.
 * Includes:
 * - Selected count display
 * - Clear selection button
 * - Bulk action buttons (status, priority, assignee, labels, delete)
 * - Disabled state during operations
 */
export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onChangeStatus,
  onChangePriority,
  onChangeAssignee,
  onAddLabels,
  onDelete,
  isProcessing = false,
}: BulkActionsBarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <Card
        className={cn(
          'flex items-center gap-3 p-4 shadow-lg',
          'border-[rgb(var(--color-border-primary))]',
          'bg-[rgb(var(--color-bg-primary))]'
        )}
      >
        {/* Selection count */}
        <div className="flex items-center gap-2 border-r border-[rgb(var(--color-border-primary))] pr-3">
          <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
            {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
            className="h-6 w-6 p-0"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onChangeStatus}
            disabled={isProcessing}
            className="gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            Status
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onChangePriority}
            disabled={isProcessing}
            className="gap-2"
          >
            <Flame className="h-4 w-4" />
            Priority
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onChangeAssignee}
            disabled={isProcessing}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Assignee
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onAddLabels}
            disabled={isProcessing}
            className="gap-2"
          >
            <Tag className="h-4 w-4" />
            Labels
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isProcessing}
            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </Card>
    </div>
  )
}
