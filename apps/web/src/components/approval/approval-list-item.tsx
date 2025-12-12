'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AgentBadge } from '@/components/agents/agent-avatar'
import { Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ApprovalItem } from '@hyvve/shared'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ApprovalListItemProps {
  approval: ApprovalItem
}

/**
 * Simple approval list item card
 *
 * Story 15-25: Apply Agent Character Colors Throughout
 * - Uses AgentBadge component for displaying agent name with character color
 * - Uses design tokens for text colors
 */
export function ApprovalListItem({ approval }: ApprovalListItemProps) {
  // Determine badge variant based on confidence level
  const badgeVariant = {
    high: 'default' as const,
    medium: 'secondary' as const,
    low: 'destructive' as const,
  }[approval.confidenceLevel]

  // Determine priority label and variant
  const priorityConfig = {
    1: { label: 'Low', variant: 'outline' as const },
    2: { label: 'Medium', variant: 'secondary' as const },
    3: { label: 'High', variant: 'destructive' as const },
  }[approval.priority] || { label: 'Unknown', variant: 'outline' as const }

  // Format dates
  const createdAgo = formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })
  const dueDate = approval.dueAt
    ? formatDistanceToNow(new Date(approval.dueAt), { addSuffix: true })
    : null

  return (
    <Card
      className={cn(
        'border-l-4 p-6 transition-shadow hover:shadow-md',
        approval.confidenceLevel === 'high' && 'border-l-green-500',
        approval.confidenceLevel === 'medium' && 'border-l-yellow-500',
        approval.confidenceLevel === 'low' && 'border-l-red-500'
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Header with title and badges */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{approval.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {approval.type}
              </Badge>
              <Badge variant={badgeVariant} className="text-xs">
                {approval.confidenceLevel.toUpperCase()} ({approval.confidenceScore}%)
              </Badge>
              <Badge variant={priorityConfig.variant} className="text-xs">
                {priorityConfig.label} Priority
              </Badge>
            </div>
          </div>
        </div>

        {/* Description preview */}
        {approval.description && (
          <p className="line-clamp-2 text-sm text-gray-600">{approval.description}</p>
        )}

        {/* Metadata and actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[rgb(var(--color-text-secondary))]">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {createdAgo}
            </span>
            {dueDate && (
              <span className="text-[rgb(var(--color-error-500))] font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Due {dueDate}
              </span>
            )}
            {approval.createdBy && <AgentBadge agentName={approval.createdBy} size="xs" />}
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/approvals/${approval.id}`}>
                View Details
              </Link>
            </Button>
          </div>
        </div>

        {/* Status badge for non-pending items */}
        {approval.status !== 'pending' && (
          <div className="pt-2 border-t border-gray-100">
            <Badge
              variant={
                approval.status === 'approved' || approval.status === 'auto_approved'
                  ? 'default'
                  : 'destructive'
              }
            >
              {approval.status === 'auto_approved' ? 'Auto-Approved' : approval.status.toUpperCase()}
            </Badge>
            {approval.reviewedBy && (
              <span className="ml-2 text-xs text-gray-500">
                by {approval.reviewedBy}{' '}
                {approval.reviewedAt &&
                  formatDistanceToNow(new Date(approval.reviewedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
