'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { useApprovalMutations } from '@/hooks/use-approvals'
import { CheckCircle2, XCircle, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApprovalActionsProps {
  /** Approval item ID */
  approvalId: string
  /** Callback after successful approval */
  onApprove?: () => void
  /** Callback after successful rejection */
  onReject?: () => void
  /** Callback after successful cancellation */
  onCancel?: () => void
  /** Whether to show the cancel button (default: true for pending) */
  showCancel?: boolean
  /** Display variant */
  variant?: 'default' | 'compact'
  /** Custom className */
  className?: string
}

/**
 * Approval action buttons with notes input and confirmation dialogs
 * Handles approve/reject actions with loading states and error handling
 */
export function ApprovalActions({
  approvalId,
  onApprove,
  onReject,
  onCancel,
  showCancel = true,
  variant = 'default',
  className,
}: ApprovalActionsProps) {
  const [notes, setNotes] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const {
    approve,
    reject,
    cancel,
    isApproving,
    isRejecting,
    isCancelling,
    approveError,
    rejectError,
    cancelError,
  } = useApprovalMutations()

  const isLoading = isApproving || isRejecting || isCancelling

  // Handle approve action
  const handleApprove = () => {
    approve(
      { id: approvalId, data: notes ? { notes } : undefined },
      {
        onSuccess: () => {
          setNotes('')
          setShowApproveDialog(false)
          onApprove?.()
        },
      }
    )
  }

  // Handle reject action
  const handleReject = () => {
    reject(
      { id: approvalId, data: notes ? { notes } : undefined },
      {
        onSuccess: () => {
          setNotes('')
          setShowRejectDialog(false)
          onReject?.()
        },
      }
    )
  }

  // Handle cancel action
  const handleCancel = () => {
    cancel(
      { id: approvalId, reason: cancelReason || undefined },
      {
        onSuccess: () => {
          setCancelReason('')
          setShowCancelDialog(false)
          onCancel?.()
        },
      }
    )
  }

  // Compact variant - just buttons
  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-2', className)}>
        <Button
          size="sm"
          variant="default"
          onClick={() => setShowApproveDialog(true)}
          disabled={isLoading}
        >
          {isApproving ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Approving...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Approve
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRejectDialog(true)}
          disabled={isLoading}
        >
          {isRejecting ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Rejecting...
            </>
          ) : (
            <>
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </>
          )}
        </Button>

        {showCancel && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCancelDialog(true)}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </>
            )}
          </Button>
        )}

        {/* Approve Dialog */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve this item?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will approve the AI-generated item. You can optionally add notes
                to explain your decision.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4">
              <Textarea
                placeholder="Add notes (optional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleApprove()
                }}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  'Approve'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>

            {approveError && (
              <p className="text-sm text-red-600 mt-2">
                Error: {approveError.message}
              </p>
            )}
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject this item?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will reject the AI-generated item. Please add notes to explain
                why you are rejecting this item.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4">
              <Textarea
                placeholder="Add notes (required for rejection)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleReject()
                }}
                disabled={isRejecting || !notes.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>

            {rejectError && (
              <p className="text-sm text-red-600 mt-2">
                Error: {rejectError.message}
              </p>
            )}
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this approval request?</AlertDialogTitle>
              <AlertDialogDescription>
                This will withdraw the approval request. The AI action will not proceed.
                You can optionally provide a reason.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4">
              <Textarea
                placeholder="Add reason (optional)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleCancel()
                }}
                disabled={isCancelling}
                className="bg-gray-600 hover:bg-gray-700"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Request'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>

            {cancelError && (
              <p className="text-sm text-red-600 mt-2">
                Error: {cancelError.message}
              </p>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Default variant - full form with notes
  return (
    <div className={cn('space-y-4', className)}>
      {/* Notes Input */}
      <div className="space-y-2">
        <label htmlFor="approval-notes" className="text-sm font-medium text-gray-700">
          Decision Notes
        </label>
        <Textarea
          id="approval-notes"
          placeholder="Add notes about your decision (optional for approval, required for rejection)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="resize-none"
          disabled={isLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleApprove}
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isApproving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Approving...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleReject}
          disabled={isLoading || !notes.trim()}
          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
        >
          {isRejecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Rejecting...
            </>
          ) : (
            <>
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </>
          )}
        </Button>

        {showCancel && (
          <Button
            variant="ghost"
            onClick={() => setShowCancelDialog(true)}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            )}
          </Button>
        )}
      </div>

      {/* Error Messages */}
      {approveError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          Error approving: {approveError.message}
        </div>
      )}
      {rejectError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          Error rejecting: {rejectError.message}
        </div>
      )}
      {cancelError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          Error cancelling: {cancelError.message}
        </div>
      )}

      {/* Cancel Dialog (for default variant) */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this approval request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will withdraw the approval request. The AI action will not proceed.
              You can optionally provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <Textarea
              placeholder="Add reason (optional)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleCancel()
              }}
              disabled={isCancelling}
              className="bg-gray-600 hover:bg-gray-700"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Request'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>

          {cancelError && (
            <p className="text-sm text-red-600 mt-2">
              Error: {cancelError.message}
            </p>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
