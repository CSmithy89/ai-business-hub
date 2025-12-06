'use client'

import { Button } from '@/components/ui/button'
import { useApprovalQuickActions } from '@/hooks/use-approval-quick-actions'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApprovalQuickActionsProps {
  /** Approval item ID */
  approvalId: string
  /** Custom className */
  className?: string
}

/**
 * Quick action buttons for approve/reject without opening dialogs
 *
 * Features:
 * - Approve button (green/primary) with Check icon
 * - Reject button (red/destructive) with X icon
 * - Loading states during API call
 * - Optimistic UI updates
 * - Toast notifications for success/error
 * - Error handling with automatic rollback
 */
export function ApprovalQuickActions({
  approvalId,
  className,
}: ApprovalQuickActionsProps) {
  const {
    approve,
    reject,
    isApproving,
    isRejecting,
  } = useApprovalQuickActions()

  const isLoading = isApproving || isRejecting

  // Handle approve action
  const handleApprove = () => {
    approve({ id: approvalId })
  }

  // Handle reject action
  const handleReject = () => {
    reject({ id: approvalId })
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700 text-white"
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
        variant="destructive"
        onClick={handleReject}
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
    </div>
  )
}
