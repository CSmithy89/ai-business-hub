'use client'

import { ApprovalListItem } from './approval-list-item'
import type { ApprovalItem } from '@hyvve/shared'

interface ApprovalListProps {
  approvals: ApprovalItem[]
  isLoading?: boolean
  isEmpty?: boolean
}

/**
 * Skeleton loading card
 */
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}

/**
 * Empty state message
 */
function EmptyState({ hasFilters }: { hasFilters?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <svg
          className="h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasFilters ? 'No approvals found' : 'No pending approvals'}
      </h3>
      <p className="text-gray-600 max-w-md">
        {hasFilters
          ? 'Try adjusting your filters to see more results.'
          : 'All caught up! There are no approvals waiting for your review.'}
      </p>
    </div>
  )
}

/**
 * Approval list container with loading and empty states
 */
export function ApprovalList({ approvals, isLoading, isEmpty }: ApprovalListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    )
  }

  // Empty state
  if (isEmpty || approvals.length === 0) {
    return <EmptyState hasFilters={isEmpty} />
  }

  // List of approvals
  return (
    <div className="space-y-4">
      {approvals.map((approval) => (
        <ApprovalListItem key={approval.id} approval={approval} />
      ))}
    </div>
  )
}
