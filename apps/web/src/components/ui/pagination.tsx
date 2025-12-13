'use client'

/**
 * Pagination Component
 *
 * Reusable pagination component with accessibility support.
 * Supports simple (prev/next) and numbered page navigation.
 *
 * Story: 16-X - Extract shared pagination component
 */

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Total number of items (for display) */
  totalItems?: number
  /** Items per page (for calculating "Showing X-Y of Z") */
  itemsPerPage?: number
  /** Show page numbers (default: false for simple mode) */
  showPageNumbers?: boolean
  /** Custom class name for the container */
  className?: string
  /** Label for screen readers (default: "Pagination") */
  ariaLabel?: string
}

/**
 * Calculate which page numbers to display with ellipsis
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []

  // Always show first page
  pages.push(1)

  // Calculate range around current page
  const rangeStart = Math.max(2, currentPage - 1)
  const rangeEnd = Math.min(totalPages - 1, currentPage + 1)

  // Add ellipsis after first page if needed
  if (rangeStart > 2) {
    pages.push('ellipsis')
  }

  // Add pages in range
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i)
  }

  // Add ellipsis before last page if needed
  if (rangeEnd < totalPages - 1) {
    pages.push('ellipsis')
  }

  // Always show last page if more than 1 page
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}

/**
 * Pagination Component
 *
 * @example Simple pagination (prev/next only)
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalPages={10}
 *   onPageChange={setPage}
 * />
 * ```
 *
 * @example With page numbers
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalPages={10}
 *   onPageChange={setPage}
 *   showPageNumbers
 * />
 * ```
 *
 * @example With item counts
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalPages={10}
 *   totalItems={100}
 *   itemsPerPage={10}
 *   onPageChange={setPage}
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  showPageNumbers = false,
  className,
  ariaLabel = 'Pagination',
}: PaginationProps) {
  // Don't render if only 1 page
  if (totalPages <= 1) {
    return null
  }

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  // Calculate showing range
  const showingStart = itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null
  const showingEnd = itemsPerPage && totalItems
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : null

  const pageNumbers = showPageNumbers ? getPageNumbers(currentPage, totalPages) : []

  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      className={cn('flex items-center justify-between', className)}
    >
      {/* Showing X-Y of Z info */}
      <div className="text-sm text-muted-foreground">
        {showingStart && showingEnd && totalItems ? (
          <span>
            Showing <span className="font-medium">{showingStart}</span>-
            <span className="font-medium">{showingEnd}</span> of{' '}
            <span className="font-medium">{totalItems}</span>
          </span>
        ) : (
          <span>
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </span>
        )}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          aria-label="Go to previous page"
          className={cn(showPageNumbers && 'rounded-r-none')}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className={cn(showPageNumbers ? 'sr-only' : 'ml-1')}>Previous</span>
        </Button>

        {/* Page numbers (if enabled) */}
        {showPageNumbers && pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            )
          }

          const isCurrentPage = page === currentPage
          return (
            <Button
              key={page}
              variant={isCurrentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={isCurrentPage ? 'page' : undefined}
              className="rounded-none min-w-[36px]"
            >
              {page}
            </Button>
          )
        })}

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          aria-label="Go to next page"
          className={cn(showPageNumbers && 'rounded-l-none')}
        >
          <span className={cn(showPageNumbers ? 'sr-only' : 'mr-1')}>Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}

/**
 * Simple pagination info display (no navigation)
 */
export interface PaginationInfoProps {
  /** Current count of items shown */
  currentCount: number
  /** Total number of items */
  totalCount: number
  /** Custom class name */
  className?: string
}

export function PaginationInfo({ currentCount, totalCount, className }: PaginationInfoProps) {
  return (
    <p className={cn('text-center text-sm text-muted-foreground', className)}>
      Showing {currentCount} of {totalCount}
    </p>
  )
}
