'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfidenceIndicator, ConfidenceBadge } from './confidence-indicator'
import { ApprovalActions } from './approval-actions'
import { ApprovalQuickActions } from './approval-quick-actions'
import { AIReasoningSection } from './ai-reasoning-section'
import { ConfidenceBreakdown } from './ConfidenceBreakdown'
import { formatDistanceToNow } from 'date-fns'
import type { ApprovalItem } from '@hyvve/shared'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Clock, Tag } from 'lucide-react'
import { AgentBadge } from '@/components/agents/agent-avatar'
import { cn } from '@/lib/utils'

interface ApprovalCardProps {
  /** Approval item data */
  approval: ApprovalItem
  /** Card display variant */
  variant?: 'compact' | 'expanded'
  /** Show approve/reject actions */
  showActions?: boolean
  /** Callback after action completion */
  onActionComplete?: () => void
  /** Enable selection mode with checkbox */
  selectable?: boolean
  /** Is this item selected */
  selected?: boolean
  /** Callback when selection changes */
  onSelect?: (id: string, selected: boolean) => void
  /** Custom className */
  className?: string
}

/**
 * ApprovalCard Component
 *
 * Displays approval items with two variants:
 * - Compact: For list views, shows summary with link to details
 * - Expanded: For detail views, shows full context with actions
 */
export function ApprovalCard({
  approval,
  variant = 'compact',
  showActions = true,
  onActionComplete,
  selectable = false,
  selected = false,
  onSelect,
  className,
}: ApprovalCardProps) {
  const [showPreviewData, setShowPreviewData] = useState(false)

  // Handle checkbox change
  const handleSelectChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(approval.id, checked)
    }
  }

  // Determine border color based on confidence level
  const borderColor = {
    high: 'border-l-green-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-red-500',
  }[approval.confidenceLevel]

  // Determine priority configuration
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

  // Only show actions if status is pending
  const canShowActions = showActions && approval.status === 'pending'

  // Compact variant - for list view
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'border-l-4 transition-shadow hover:shadow-md',
          borderColor,
          selected && 'ring-2 ring-blue-500 ring-offset-2',
          className
        )}
      >
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Selection checkbox */}
              {selectable && approval.status === 'pending' && (
                <div className="pt-1">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={handleSelectChange}
                    aria-label={`Select ${approval.title}`}
                  />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">{approval.title}</h3>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Tag className="mr-1 h-3 w-3" />
                    {approval.type}
                  </Badge>

                  <ConfidenceBadge score={approval.confidenceScore} level={approval.confidenceLevel} />

                  <Badge variant={priorityConfig.variant} className="text-xs">
                    {priorityConfig.label} Priority
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {approval.description && (
            <p className="line-clamp-2 text-sm text-gray-600">{approval.description}</p>
          )}

          {/* Confidence Indicator */}
          <ConfidenceIndicator
            score={approval.confidenceScore}
            level={approval.confidenceLevel}
            size="sm"
            showRecommendation
          />

          {/* Metadata and Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {createdAgo}
              </span>
              {dueDate && (
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Due {dueDate}
                </span>
              )}
              <AgentBadge agentName={approval.createdBy} size="xs" />
            </div>

            <div className="flex gap-2">
              {canShowActions && (
                <ApprovalQuickActions
                  approvalId={approval.id}
                />
              )}

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

  // Expanded variant - for detail view
  return (
    <Card className={cn('border-l-4', borderColor, className)}>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <Tag className="mr-1 h-3 w-3" />
              {approval.type}
            </Badge>
            <Badge variant={priorityConfig.variant}>
              {priorityConfig.label} Priority
            </Badge>
            {approval.status !== 'pending' && (
              <Badge
                variant={
                  approval.status === 'approved' || approval.status === 'auto_approved'
                    ? 'default'
                    : 'destructive'
                }
              >
                {approval.status === 'auto_approved' ? 'Auto-Approved' : approval.status.toUpperCase()}
              </Badge>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900">{approval.title}</h2>

          {approval.description && (
            <p className="text-gray-600">{approval.description}</p>
          )}
        </div>

        {/* Confidence Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Confidence Score
          </h3>
          <ConfidenceIndicator
            score={approval.confidenceScore}
            level={approval.confidenceLevel}
            size="lg"
            showRecommendation
          />
        </div>

        {/* Confidence Breakdown */}
        <ConfidenceBreakdown
          approvalId={approval.id}
          initialConfidence={approval.confidenceScore}
        />

        {/* Preview Data Section */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowPreviewData(prev => !prev)}
            className="flex items-center justify-between w-full text-left"
            aria-expanded={showPreviewData}
            aria-controls={`preview-data-${approval.id}`}
          >
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Preview Data
            </h3>
            {showPreviewData ? (
              <ChevronUp className="h-5 w-5 text-gray-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
            )}
          </button>

          {showPreviewData && (
            <div
              id={`preview-data-${approval.id}`}
              className="rounded-lg bg-gray-50 p-4 overflow-x-auto"
            >
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(approval.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* AI Reasoning Section */}
        <AIReasoningSection
          confidenceScore={approval.confidenceScore}
          factors={approval.factors}
          aiReasoning={approval.aiReasoning}
          sourceModule={approval.sourceModule}
          sourceId={approval.sourceId}
        />

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>Created by</span>
            <AgentBadge agentName={approval.createdBy} size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{createdAgo}</span>
          </div>
          {dueDate && (
            <div className="flex items-center gap-2 text-red-600 font-medium">
              <Clock className="h-4 w-4" />
              <span>Due {dueDate}</span>
            </div>
          )}
          {approval.reviewedBy && (
            <div className="flex items-center gap-2">
              <span>Reviewed by <span className="font-medium">{approval.reviewedBy}</span></span>
              {approval.reviewedAt && (
                <span> {formatDistanceToNow(new Date(approval.reviewedAt), { addSuffix: true })}</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {canShowActions && (
          <div className="pt-6 border-t border-gray-200">
            <ApprovalActions
              approvalId={approval.id}
              variant="default"
              onApprove={onActionComplete}
              onReject={onActionComplete}
            />
          </div>
        )}
      </div>
    </Card>
  )
}
