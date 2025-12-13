'use client'

import { useState } from 'react'
import { useApprovals, useBulkApprovalMutation } from '@/hooks/use-approvals'
import { useApprovalOrder } from '@/hooks/use-approval-order'
import { ApprovalStats } from '@/components/approval/approval-stats'
import { ApprovalFilters } from '@/components/approval/approval-filters'
import { ApprovalList } from '@/components/approval/approval-list'
import { BulkActionBar } from '@/components/approval/bulk-action-bar'
import { BulkConfirmDialog } from '@/components/approval/bulk-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import type { ApprovalStatus, ConfidenceLevel } from '@hyvve/shared'
import type { BulkApprovalResponse } from '@/hooks/use-approvals'
import { toast } from 'sonner'

/**
 * Approval Queue Dashboard Content (Client Component)
 */
export function ApprovalsContent() {
  // Filter and pagination state
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('pending')
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceLevel | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueAt' | 'priority'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null)
  const [bulkNotes, setBulkNotes] = useState<string>('')
  const [showBulkDialog, setShowBulkDialog] = useState(false)

  // Bulk approval mutation
  const bulkMutation = useBulkApprovalMutation()

  // Build filter object for API
  const filters = {
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter || undefined,
    sortBy,
    sortOrder,
    page: currentPage,
    limit: itemsPerPage,
  }

  // Fetch approvals data
  const { data, isLoading, error } = useApprovals(filters)

  // Handle filter changes - reset to page 1
  const handleFilterChange = (callback: () => void) => {
    callback()
    setCurrentPage(1)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Filter approvals by confidence level on client side (API doesn't support this filter yet)
  const confidenceFiltered =
    confidenceFilter === 'all'
      ? data?.data || []
      : (data?.data || []).filter((approval) => approval.confidenceLevel === confidenceFilter)

  // Apply custom ordering via drag-and-drop
  const {
    orderedApprovals: filteredApprovals,
    updateOrder,
    undoReorder,
  } = useApprovalOrder(confidenceFiltered)

  // Selection handlers
  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const pendingIds = filteredApprovals
      .filter(a => a.status === 'pending')
      .map(a => a.id)
    setSelectedIds(new Set(pendingIds))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
    setBulkNotes('')
  }

  // Bulk action handlers
  const handleBulkApprove = (notes?: string) => {
    setBulkAction('approve')
    setBulkNotes(notes || '')
    setShowBulkDialog(true)
  }

  const handleBulkReject = (notes: string) => {
    setBulkAction('reject')
    setBulkNotes(notes)
    setShowBulkDialog(true)
  }

  const handleBulkConfirm = () => {
    if (!bulkAction) return

    // Guard against empty selection
    if (selectedIds.size === 0) {
      toast.warning('No items selected')
      setShowBulkDialog(false)
      return
    }

    bulkMutation.mutate(
      {
        ids: Array.from(selectedIds),
        action: bulkAction,
        notes: bulkNotes || undefined,
        reason: bulkAction === 'reject' ? bulkNotes : undefined,
      },
      {
        onSuccess: (response: BulkApprovalResponse) => {
          // Show success message
          if (response.failed.length === 0) {
            toast.success(
              `Successfully ${bulkAction === 'approve' ? 'approved' : 'rejected'} ${response.succeeded.length} items`
            )
            handleClearSelection()
          } else if (response.succeeded.length === 0) {
            toast.error(`All ${selectedIds.size} items failed to process`)
          } else {
            toast.success(
              `${response.succeeded.length} succeeded, ${response.failed.length} failed`
            )
            // Keep only failed items selected
            const failedIds = new Set(response.failed.map(f => f.id))
            setSelectedIds(failedIds)
          }
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to process bulk action')
        },
      }
    )
  }

  const handleBulkCancel = () => {
    setShowBulkDialog(false)
    setBulkAction(null)
  }

  const handleBulkClose = () => {
    setShowBulkDialog(false)
    setBulkAction(null)
    setBulkNotes('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Approval Queue</h1>
          <p className="mt-2 text-gray-600">
            Review and approve AI-generated actions that require your attention
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <ApprovalStats />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ApprovalFilters
            statusFilter={statusFilter}
            onStatusChange={(status) => handleFilterChange(() => setStatusFilter(status))}
            confidenceFilter={confidenceFilter}
            onConfidenceChange={(confidence) =>
              handleFilterChange(() => setConfidenceFilter(confidence))
            }
            typeFilter={typeFilter}
            onTypeChange={(type) => handleFilterChange(() => setTypeFilter(type))}
            sortBy={sortBy}
            onSortByChange={(sort) => handleFilterChange(() => setSortBy(sort))}
            sortOrder={sortOrder}
            onSortOrderChange={(order) => handleFilterChange(() => setSortOrder(order))}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Approvals</h3>
            <p className="text-red-700">{error.message}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Approval List */}
        {!error && (
          <div className="mb-6 pb-32">
            <ApprovalList
              approvals={filteredApprovals}
              isLoading={isLoading}
              isEmpty={
                !isLoading &&
                (statusFilter !== 'all' ||
                  confidenceFilter !== 'all' ||
                  typeFilter !== '')
              }
              selectable={statusFilter === 'pending' || statusFilter === 'all'}
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              draggable={statusFilter === 'pending' || statusFilter === 'all'}
              onOrderChange={updateOrder}
              onUndoReorder={undoReorder}
            />
          </div>
        )}

        {/* Pagination */}
        {!error && !isLoading && data && data.meta.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={data.meta.totalPages}
            totalItems={data.meta.total}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            showPageNumbers
            className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
          />
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
      />

      {/* Bulk Confirm Dialog */}
      <BulkConfirmDialog
        open={showBulkDialog}
        action={bulkAction || 'approve'}
        count={selectedIds.size}
        notes={bulkNotes}
        isLoading={bulkMutation.isPending}
        result={bulkMutation.data}
        onConfirm={handleBulkConfirm}
        onCancel={handleBulkCancel}
        onClose={handleBulkClose}
      />
    </div>
  )
}
