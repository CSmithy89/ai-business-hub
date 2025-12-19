/**
 * Bulk Delete Dialog
 *
 * Story: PM-03.8 - Bulk Selection & Actions
 *
 * Confirmation dialog for deleting multiple tasks at once.
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface BulkDeleteDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void
  /** Number of selected tasks */
  selectedCount: number
  /** Callback when deletion is confirmed */
  onConfirm: () => void
  /** Whether the operation is in progress */
  isProcessing?: boolean
}

/**
 * Bulk Delete Dialog Component
 *
 * Displays a confirmation dialog before deleting multiple tasks.
 * Includes a warning indicator and clear messaging about the destructive action.
 */
export function BulkDeleteDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isProcessing = false,
}: BulkDeleteDialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isProcessing) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle>Delete Tasks</DialogTitle>
              <DialogDescription>
                Delete {selectedCount} task{selectedCount !== 1 ? 's' : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-[rgb(var(--color-text-primary))]">
            Are you sure you want to delete {selectedCount} task{selectedCount !== 1 ? 's' : ''}?
            This action will soft delete the task{selectedCount !== 1 ? 's' : ''}, and{' '}
            {selectedCount === 1 ? 'it' : 'they'} can be recovered by an administrator if needed.
          </p>
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
            variant="destructive"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Deleting...' : 'Delete Tasks'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
