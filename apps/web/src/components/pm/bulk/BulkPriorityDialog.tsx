/**
 * Bulk Priority Dialog
 *
 * Story: PM-03.8 - Bulk Selection & Actions
 *
 * Dialog for changing the priority of multiple tasks at once.
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TaskPriority } from '@/hooks/use-pm-tasks'
import { TASK_PRIORITY_META, TASK_PRIORITIES } from '@/lib/pm/task-meta'
import { cn } from '@/lib/utils'

export interface BulkPriorityDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void
  /** Number of selected tasks */
  selectedCount: number
  /** Callback when priority is confirmed */
  onConfirm: (priority: TaskPriority) => void
  /** Whether the operation is in progress */
  isProcessing?: boolean
}

/**
 * Bulk Priority Dialog Component
 *
 * Allows users to change the priority of multiple tasks simultaneously.
 */
export function BulkPriorityDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isProcessing = false,
}: BulkPriorityDialogProps) {
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | ''>('')

  const handleConfirm = () => {
    if (selectedPriority) {
      onConfirm(selectedPriority as TaskPriority)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isProcessing) {
      setSelectedPriority('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Priority</DialogTitle>
          <DialogDescription>
            Change the priority for {selectedCount} task{selectedCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label
            htmlFor="bulk-priority-select"
            className="mb-2 block text-sm font-medium text-[rgb(var(--color-text-primary))]"
          >
            New Priority
          </label>
          <Select
            value={selectedPriority}
            onValueChange={(value) => setSelectedPriority(value as TaskPriority)}
            disabled={isProcessing}
          >
            <SelectTrigger id="bulk-priority-select">
              <SelectValue placeholder="Select a priority" />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((priority) => {
                const meta = TASK_PRIORITY_META[priority]
                return (
                  <SelectItem key={priority} value={priority}>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn('h-2.5 w-2.5 rounded-full', meta.dotClassName)}
                        aria-hidden="true"
                      />
                      <span>{meta.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPriority || isProcessing}
          >
            {isProcessing ? 'Updating...' : 'Update Priority'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
