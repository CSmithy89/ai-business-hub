/**
 * Skeleton Table Components
 *
 * Provides skeleton loading placeholders for tables.
 * Matches table row and cell layouts to prevent layout shift.
 *
 * Epic: 16 - Premium Polish & Advanced Features
 * Story: 16-5 - Implement Skeleton Loading Screens
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonTableProps {
  /** Number of rows to display */
  rows?: number
  /** Number of columns to display */
  columns?: number
  /** Optional className */
  className?: string
}

interface SkeletonTableRowProps {
  /** Number of columns in the row */
  columns?: number
  /** Optional className */
  className?: string
}

/**
 * Single table row skeleton
 */
export function SkeletonTableRow({ columns = 4, className }: SkeletonTableRowProps) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Full table skeleton with header and rows
 */
export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full">
        <thead className="border-b">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Compact table row skeleton (for smaller tables)
 */
export function SkeletonTableRowCompact({ columns = 3, className }: SkeletonTableRowProps) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3 w-full" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Table skeleton with custom cell widths
 * Useful for tables with mixed column sizes
 */
interface SkeletonTableCustomProps {
  /** Array of column widths (Tailwind classes like 'w-1/4', 'w-full', etc.) */
  columnWidths?: string[]
  /** Number of rows to display */
  rows?: number
  /** Optional className */
  className?: string
}

export function SkeletonTableCustom({
  columnWidths = ['w-1/4', 'w-1/2', 'w-1/4'],
  rows = 5,
  className,
}: SkeletonTableCustomProps) {
  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full">
        <thead className="border-b">
          <tr>
            {columnWidths.map((width, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <Skeleton className={cn('h-4', width)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {columnWidths.map((width, colIdx) => (
                <td key={colIdx} className="px-6 py-4">
                  <Skeleton className={cn('h-4', width)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
