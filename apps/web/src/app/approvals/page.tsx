'use client'

import { useState } from 'react'
import { useApprovals } from '@/hooks/use-approvals'
import { ApprovalStats } from '@/components/approval/approval-stats'
import { ApprovalFilters } from '@/components/approval/approval-filters'
import { ApprovalList } from '@/components/approval/approval-list'
import { Button } from '@/components/ui/button'
import type { ApprovalStatus, ConfidenceLevel } from '@hyvve/shared'

/**
 * Pagination component
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const showPages = pages.filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      (page >= currentPage - 1 && page <= currentPage + 1)
  )

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-r-none"
            >
              Previous
            </Button>
            {showPages.map((page, index) => {
              const prevPage = showPages[index - 1]
              const showEllipsis = prevPage && page - prevPage > 1

              return (
                <div key={page} className="inline-flex">
                  {showEllipsis && (
                    <span className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                      ...
                    </span>
                  )}
                  <Button
                    variant={page === currentPage ? 'default' : 'outline'}
                    onClick={() => onPageChange(page)}
                    className="rounded-none"
                  >
                    {page}
                  </Button>
                </div>
              )
            })}
            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-l-none"
            >
              Next
            </Button>
          </nav>
        </div>
      </div>
    </div>
  )
}

/**
 * Approval Queue Dashboard Page
 */
export default function ApprovalsPage() {
  // Filter and pagination state
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('pending')
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceLevel | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueAt' | 'priority'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

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

  // Calculate stats
  const pendingCount = data?.meta.total || 0
  const autoApprovedToday = 0 // Placeholder - will be implemented in later stories

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
  const filteredApprovals =
    confidenceFilter === 'all'
      ? data?.data || []
      : (data?.data || []).filter((approval) => approval.confidenceLevel === confidenceFilter)

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
          <ApprovalStats
            pendingCount={pendingCount}
            autoApprovedToday={autoApprovedToday}
            avgResponseTime="2.5h"
            approvalRate={92}
          />
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
          <div className="mb-6">
            <ApprovalList
              approvals={filteredApprovals}
              isLoading={isLoading}
              isEmpty={
                !isLoading &&
                (statusFilter !== 'all' ||
                  confidenceFilter !== 'all' ||
                  typeFilter !== '')
              }
            />
          </div>
        )}

        {/* Pagination */}
        {!error && !isLoading && data && data.meta.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={data.meta.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  )
}
