/**
 * Skeleton List Components
 *
 * Provides skeleton loading placeholders for list items.
 * Useful for vertical lists, sidebars, and navigation items.
 *
 * Epic: 16 - Premium Polish & Advanced Features
 * Story: 16-5 - Implement Skeleton Loading Screens
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonListProps {
  /** Number of items to display */
  items?: number
  /** Optional className */
  className?: string
}

interface SkeletonListItemProps {
  /** Optional className */
  className?: string
}

/**
 * Single list item skeleton
 * Basic horizontal layout with icon and text
 */
export function SkeletonListItem({ className }: SkeletonListItemProps) {
  return (
    <div className={cn('flex items-center gap-3 py-3', className)}>
      <Skeleton className="h-5 w-5 flex-shrink-0" />
      <Skeleton className="h-4 flex-1" />
    </div>
  )
}

/**
 * List item with secondary text
 * Two-line layout with primary and secondary text
 */
export function SkeletonListItemTwoLine({ className }: SkeletonListItemProps) {
  return (
    <div className={cn('flex items-start gap-3 py-3', className)}>
      <Skeleton className="mt-1 h-5 w-5 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}

/**
 * List item with avatar
 * Horizontal layout with avatar circle, name, and metadata
 */
export function SkeletonListItemWithAvatar({ className }: SkeletonListItemProps) {
  return (
    <div className={cn('flex items-center gap-3 py-3', className)}>
      <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

/**
 * Full list skeleton
 * Vertical list with separator lines
 */
export function SkeletonList({ items = 5, className }: SkeletonListProps) {
  return (
    <div className={cn('divide-y', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  )
}

/**
 * Full list skeleton with two-line items
 */
export function SkeletonListTwoLine({ items = 5, className }: SkeletonListProps) {
  return (
    <div className={cn('divide-y', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItemTwoLine key={i} />
      ))}
    </div>
  )
}

/**
 * Full list skeleton with avatars
 */
export function SkeletonListWithAvatars({ items = 5, className }: SkeletonListProps) {
  return (
    <div className={cn('divide-y', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItemWithAvatar key={i} />
      ))}
    </div>
  )
}

/**
 * Compact list item skeleton
 * Smaller version for sidebars
 */
export function SkeletonListItemCompact({ className }: SkeletonListItemProps) {
  return (
    <div className={cn('flex items-center gap-2 py-2', className)}>
      <Skeleton className="h-4 w-4 flex-shrink-0" />
      <Skeleton className="h-3 flex-1" />
    </div>
  )
}

/**
 * Compact list skeleton
 */
export function SkeletonListCompact({ items = 5, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItemCompact key={i} />
      ))}
    </div>
  )
}
