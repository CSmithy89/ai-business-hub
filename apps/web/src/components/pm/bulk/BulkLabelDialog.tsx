/**
 * Bulk Label Dialog
 *
 * Story: PM-03.8 - Bulk Selection & Actions
 *
 * Dialog for adding labels to multiple tasks at once.
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
import { Input } from '@/components/ui/input'

export interface BulkLabelDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void
  /** Number of selected tasks */
  selectedCount: number
  /** Callback when labels are confirmed */
  onConfirm: (labels: string[]) => void
  /** Whether the operation is in progress */
  isProcessing?: boolean
}

/**
 * Bulk Label Dialog Component
 *
 * Allows users to add labels to multiple tasks simultaneously.
 * Labels are comma-separated for batch input.
 */
export function BulkLabelDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isProcessing = false,
}: BulkLabelDialogProps) {
  const [labelInput, setLabelInput] = useState('')

  const handleConfirm = () => {
    // Parse comma-separated labels and trim whitespace
    const labels = labelInput
      .split(',')
      .map((label) => label.trim())
      .filter((label) => label.length > 0)

    if (labels.length > 0) {
      onConfirm(labels)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isProcessing) {
      setLabelInput('')
      onOpenChange(false)
    }
  }

  const isValid = labelInput.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Labels</DialogTitle>
          <DialogDescription>
            Add labels to {selectedCount} task{selectedCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <label
            htmlFor="bulk-label-input"
            className="block text-sm font-medium text-[rgb(var(--color-text-primary))]"
          >
            Label Names
          </label>
          <Input
            id="bulk-label-input"
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="e.g., urgent, backend, review-needed"
            disabled={isProcessing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && isValid) {
                e.preventDefault()
                handleConfirm()
              }
            }}
          />
          <p className="text-xs text-[rgb(var(--color-text-secondary))]">
            Enter multiple labels separated by commas. Each label will be added to all selected
            tasks.
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
            onClick={handleConfirm}
            disabled={!isValid || isProcessing}
          >
            {isProcessing ? 'Adding...' : 'Add Labels'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
