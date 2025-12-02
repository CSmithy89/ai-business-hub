'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { BulkApprovalResponse } from '@/hooks/use-approvals'

interface BulkConfirmDialogProps {
  /** Dialog open state */
  open: boolean
  /** Bulk action type */
  action: 'approve' | 'reject'
  /** Number of items selected */
  count: number
  /** Optional notes for the action */
  notes?: string
  /** Loading state during API call */
  isLoading: boolean
  /** Result of bulk operation (if completed) */
  result?: BulkApprovalResponse
  /** Callback when user confirms action */
  onConfirm: () => void
  /** Callback when user cancels */
  onCancel: () => void
  /** Callback to close dialog after completion */
  onClose: () => void
}

/**
 * BulkConfirmDialog Component
 *
 * Confirmation dialog for bulk approve/reject operations.
 * Shows three states:
 * 1. Confirmation - Ask user to confirm action
 * 2. Progress - Show progress during API call
 * 3. Results - Show success/failure summary
 */
export function BulkConfirmDialog({
  open,
  action,
  count,
  notes,
  isLoading,
  result,
  onConfirm,
  onCancel,
  onClose,
}: BulkConfirmDialogProps) {
  // Determine dialog state
  const isConfirming = !isLoading && !result
  const isProcessing = isLoading
  const isComplete = !isLoading && result

  // Calculate success/failure counts
  const succeededCount = result?.succeeded.length || 0
  const failedCount = result?.failed.length || 0
  const hasFailures = failedCount > 0
  const hasSuccesses = succeededCount > 0

  // Action text
  const actionText = action === 'approve' ? 'Approve' : 'Reject'
  const actionPast = action === 'approve' ? 'approved' : 'rejected'

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-lg">
        {/* Confirmation State */}
        {isConfirming && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Confirm Bulk {actionText}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Are you sure you want to {action} <strong>{count} items</strong>?
                </p>
                {notes && (
                  <div className="rounded-md bg-gray-50 p-3 text-sm">
                    <p className="font-medium text-gray-700 mb-1">Notes:</p>
                    <p className="text-gray-600">{notes}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  This action cannot be undone. All selected items will be {actionPast}.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm}
                className={
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }
              >
                {actionText} {count} Items
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}

        {/* Processing State */}
        {isProcessing && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Processing...</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  {actionText}ing {count} items. Please wait...
                </p>
                <Progress value={undefined} className="w-full" />
                <p className="text-xs text-gray-500">
                  This may take a few moments depending on the number of items.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </>
        )}

        {/* Results State */}
        {isComplete && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {!hasFailures && (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Bulk {actionText} Complete
                  </>
                )}
                {hasFailures && hasSuccesses && (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Bulk {actionText} Partially Complete
                  </>
                )}
                {hasFailures && !hasSuccesses && (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    Bulk {actionText} Failed
                  </>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                {/* Success summary */}
                {hasSuccesses && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">
                      <strong>{succeededCount}</strong> {succeededCount === 1 ? 'item' : 'items'}{' '}
                      {actionPast} successfully
                    </span>
                  </div>
                )}

                {/* Failure summary */}
                {hasFailures && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-gray-700">
                        <strong>{failedCount}</strong> {failedCount === 1 ? 'item' : 'items'} failed
                      </span>
                    </div>

                    {/* Show first 3 failures */}
                    <div className="rounded-md bg-red-50 p-3 space-y-2 max-h-48 overflow-y-auto">
                      <p className="text-xs font-medium text-red-900">Failed Items:</p>
                      {result.failed.slice(0, 3).map((failure) => (
                        <div key={failure.id} className="text-xs">
                          <Badge variant="outline" className="text-red-700 border-red-300">
                            {failure.id.slice(0, 8)}...
                          </Badge>
                          <span className="ml-2 text-red-600">{failure.error}</span>
                        </div>
                      ))}
                      {result.failed.length > 3 && (
                        <p className="text-xs text-red-600 italic">
                          ...and {result.failed.length - 3} more
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      Failed items remain selected so you can retry or review them.
                    </p>
                  </div>
                )}

                {/* All success message */}
                {!hasFailures && (
                  <p className="text-sm text-gray-600">
                    All selected items have been {actionPast}. The approval queue has been updated.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
