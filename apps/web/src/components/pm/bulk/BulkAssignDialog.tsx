/**
 * Bulk Assign Dialog
 *
 * Story: PM-03.8 - Bulk Selection & Actions
 *
 * Dialog for changing the assignee of multiple tasks at once.
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
import type { AssignmentType } from '@/hooks/use-pm-tasks'

export interface BulkAssignDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void
  /** Number of selected tasks */
  selectedCount: number
  /** Callback when assignment is confirmed */
  onConfirm: (data: { assignmentType: AssignmentType; assigneeId: string | null }) => void
  /** Whether the operation is in progress */
  isProcessing?: boolean
}

const ASSIGNMENT_TYPE_OPTIONS: { value: AssignmentType; label: string }[] = [
  { value: 'HUMAN', label: 'Human' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'HYBRID', label: 'Hybrid' },
]

/**
 * Bulk Assign Dialog Component
 *
 * Allows users to change the assignee of multiple tasks simultaneously.
 *
 * Note: For MVP, this sets assignmentType and clears assigneeId.
 * Future enhancement: Add user/agent picker when available.
 */
export function BulkAssignDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isProcessing = false,
}: BulkAssignDialogProps) {
  const [assignmentType, setAssignmentType] = useState<AssignmentType | ''>('')

  const handleConfirm = () => {
    if (assignmentType) {
      // For now, we only set assignment type and clear assigneeId
      // Future: Add user/agent picker to set specific assigneeId
      onConfirm({
        assignmentType: assignmentType as AssignmentType,
        assigneeId: null,
      })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isProcessing) {
      setAssignmentType('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Assignee</DialogTitle>
          <DialogDescription>
            Change the assignment type for {selectedCount} task{selectedCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label
            htmlFor="bulk-assignment-select"
            className="mb-2 block text-sm font-medium text-[rgb(var(--color-text-primary))]"
          >
            Assignment Type
          </label>
          <Select
            value={assignmentType}
            onValueChange={(value) => setAssignmentType(value as AssignmentType)}
            disabled={isProcessing}
          >
            <SelectTrigger id="bulk-assignment-select">
              <SelectValue placeholder="Select assignment type" />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNMENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="mt-2 text-xs text-[rgb(var(--color-text-secondary))]">
            This will set the assignment type and clear the current assignee. Specific assignee
            selection will be available in a future update.
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
            disabled={!assignmentType || isProcessing}
          >
            {isProcessing ? 'Updating...' : 'Update Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
