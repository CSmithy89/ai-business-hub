'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useApprovalMetrics, type ApprovalMetrics } from '@/hooks/use-approval-metrics'
import { Clock, CheckCircle, Timer, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  valueColor?: string
  subtitle?: string
}

/**
 * Individual stat card component
 */
function StatCard({ label, value, icon, valueColor, subtitle }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">{label}</span>
          <span className={cn('mt-2 text-3xl font-bold', valueColor || 'text-gray-900')}>
            {value}
          </span>
          {subtitle && <span className="text-xs text-gray-400 mt-1">{subtitle}</span>}
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </Card>
  )
}

/**
 * Loading skeleton for stat cards
 */
function StatCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex flex-col">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-9 w-16" />
      </div>
    </Card>
  )
}

interface ApprovalStatsProps {
  /** Override metrics data (for testing or server-side rendering) */
  initialData?: ApprovalMetrics
  /** Custom className */
  className?: string
}

/**
 * Stats bar showing key approval queue metrics
 *
 * Features:
 * - Fetches metrics automatically from API
 * - Shows loading skeletons while fetching
 * - 5-minute cache for performance
 * - Auto-refetch every 5 minutes
 */
export function ApprovalStats({ initialData, className }: ApprovalStatsProps) {
  const { data: metrics, isLoading, error } = useApprovalMetrics()

  // Use initial data or fetched data
  const displayMetrics = metrics || initialData

  if (isLoading && !displayMetrics) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  if (error && !displayMetrics) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        <Card className="p-6 col-span-full">
          <p className="text-sm text-red-600">Failed to load metrics. Please try again.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      <StatCard
        label="Pending Review"
        value={displayMetrics?.pendingCount ?? 0}
        icon={<Clock className="h-5 w-5" />}
      />
      <StatCard
        label="Auto-Approved Today"
        value={displayMetrics?.autoApprovedToday ?? 0}
        icon={<CheckCircle className="h-5 w-5" />}
        valueColor="text-green-600"
      />
      <StatCard
        label="Avg Response Time"
        value={displayMetrics?.avgResponseTime ? `${displayMetrics.avgResponseTime}h` : '--'}
        icon={<Timer className="h-5 w-5" />}
      />
      <StatCard
        label="Approval Rate"
        value={displayMetrics?.approvalRate ? `${displayMetrics.approvalRate}%` : '--'}
        icon={<TrendingUp className="h-5 w-5" />}
      />
    </div>
  )
}
