'use client'

import { Card } from '@/components/ui/card'

interface ApprovalStatsProps {
  pendingCount: number
  autoApprovedToday?: number
  avgResponseTime?: string
  approvalRate?: number
}

/**
 * Stats bar showing key approval queue metrics
 */
export function ApprovalStats({
  pendingCount,
  autoApprovedToday = 0,
  avgResponseTime = '--',
  approvalRate = 0,
}: ApprovalStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Pending Review */}
      <Card className="p-6">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Pending Review</span>
          <span className="mt-2 text-3xl font-bold text-gray-900">{pendingCount}</span>
        </div>
      </Card>

      {/* Auto-Approved Today */}
      <Card className="p-6">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Auto-Approved Today</span>
          <span className="mt-2 text-3xl font-bold text-green-600">{autoApprovedToday}</span>
        </div>
      </Card>

      {/* Avg Response Time */}
      <Card className="p-6">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Avg Response Time</span>
          <span className="mt-2 text-3xl font-bold text-gray-900">{avgResponseTime}</span>
          <span className="text-xs text-gray-400">Placeholder</span>
        </div>
      </Card>

      {/* Approval Rate */}
      <Card className="p-6">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Approval Rate</span>
          <span className="mt-2 text-3xl font-bold text-gray-900">
            {approvalRate > 0 ? `${approvalRate}%` : '--'}
          </span>
          <span className="text-xs text-gray-400">Placeholder</span>
        </div>
      </Card>
    </div>
  )
}
