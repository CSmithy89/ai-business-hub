'use client'

import { useParams, useRouter } from 'next/navigation'
import { useApproval } from '@/hooks/use-approvals'
import { ApprovalCard } from '@/components/approval/approval-card'
import { ApprovalAuditLog } from '@/components/approval/approval-audit-log'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'

/**
 * Approval Detail Page
 *
 * Shows full approval details with expanded ApprovalCard.
 * Includes audit trail timeline (Story 04-9).
 */
export default function ApprovalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const approvalId = params.id as string

  // Fetch approval data
  const { data, isLoading, error } = useApproval(approvalId)

  // Handle action completion - navigate back to list
  const handleActionComplete = () => {
    router.push('/approvals')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header with back button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Approval Details</h1>
          </div>

          {/* Loading skeleton */}
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Loading approval details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header with back button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Approval Details</h1>
          </div>

          {/* Error message */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Approval
            </h3>
            <p className="text-red-700 mb-4">{error.message}</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/approvals')}
              >
                Back to Approvals
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not found state
  if (!data?.data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header with back button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Approval Details</h1>
          </div>

          {/* Not found message */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Approval Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The approval item you are looking for could not be found.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/approvals')}
            >
              Back to Approvals
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const approval = data.data

  // Success state - show approval card
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Approval Details</h1>
          <p className="mt-2 text-gray-600">
            Review the details below and approve or reject this item
          </p>
        </div>

        {/* Approval Card - Expanded Variant */}
        <ApprovalCard
          approval={approval}
          variant="expanded"
          showActions={true}
          onActionComplete={handleActionComplete}
        />

        {/* Audit Trail - Story 04-9 */}
        <div className="mt-8">
          <ApprovalAuditLog
            approvalId={approvalId}
            workspaceId={approval.workspaceId}
          />
        </div>
      </div>
    </div>
  )
}
