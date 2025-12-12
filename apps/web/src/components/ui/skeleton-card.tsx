/**
 * Skeleton Card Components
 *
 * Provides skeleton loading placeholders for various card types.
 * Each variant matches the layout of its corresponding actual card
 * to prevent layout shift when content loads.
 *
 * Epic: 16 - Premium Polish & Advanced Features
 * Story: 16-5 - Implement Skeleton Loading Screens
 */

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  className?: string
}

/**
 * Business Card Skeleton
 * Matches BusinessCard layout
 */
export function SkeletonBusinessCard({ className }: SkeletonCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>

      <CardContent>
        <div className="mb-4">
          <Skeleton className="mb-1 h-3 w-28" />
          <Skeleton className="h-8 w-16" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardContent>

      <CardFooter>
        <Skeleton className="h-3 w-40" />
      </CardFooter>
    </Card>
  )
}

/**
 * Agent Card Skeleton
 * Matches AgentCardStandard layout
 */
export function SkeletonAgentCard({ className }: SkeletonCardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex flex-col gap-4">
        {/* Avatar and name */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Status badge */}
        <Skeleton className="h-6 w-20" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Approval Card Skeleton
 * Matches ApprovalCard layout
 */
export function SkeletonApprovalCard({ className }: SkeletonCardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex flex-col gap-4">
        {/* Header with title and badge */}
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-20" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Confidence indicator */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 flex-1" />
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Stat Card Skeleton
 * Matches StatCard layout from approval-stats
 */
export function SkeletonStatCard({ className }: SkeletonCardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-16" />
        </div>
        <Skeleton className="h-5 w-5 rounded" />
      </div>
    </Card>
  )
}

/**
 * Generic Card Skeleton
 * Can be used for any card type
 */
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    </Card>
  )
}
