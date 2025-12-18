/**
 * Bulk Status Dialog
 *
 * Story: PM-03.8 - Bulk Selection & Actions
 *
 * Dialog for changing the status of multiple tasks at once.
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
import type { TaskStatus } from '@/hooks/use-pm-tasks'

export interface BulkStatusDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void
  /** Number of selected tasks */
  selectedCount: number
  /** Callback when status is confirmed */
  onConfirm: (status: TaskStatus) => void
  /** Whether the operation is in progress */
  isProcessing?: boolean
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'AWAITING_APPROVAL', label: 'Awaiting Approval' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

/**
 * Bulk Status Dialog Component
 *
 * Allows users to change the status of multiple tasks simultaneously.
 */
export function BulkStatusDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isProcessing = false,
}: BulkStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | ''>('')

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus as TaskStatus)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isProcessing) {
      setSelectedStatus('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>
            Change the status for {selectedCount} task{selectedCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label
            htmlFor="bulk-status-select"
            className="mb-2 block text-sm font-medium text-[rgb(var(--color-text-primary))]"
          >
            New Status
          </label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as TaskStatus)}
            disabled={isProcessing}
          >
            <SelectTrigger id="bulk-status-select">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
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
            disabled={!selectedStatus || isProcessing}
          >
            {isProcessing ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
