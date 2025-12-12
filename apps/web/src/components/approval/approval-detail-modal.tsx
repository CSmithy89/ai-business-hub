/**
 * Approval Detail Modal Component
 *
 * Modal view for detailed approval item inspection with confidence breakdown,
 * AI reasoning, and approve/reject actions.
 *
 * Story 15-17: Approval Cards with Confidence Visualization
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfidenceIndicator } from './confidence-indicator';
import { ConfidenceBreakdown } from './ConfidenceBreakdown';
import { AIReasoningSection } from './ai-reasoning-section';
import { ApprovalActions } from './approval-actions';
import { AgentBadge } from '@/components/agents/agent-avatar';
import { formatDistanceToNow } from 'date-fns';
import type { ApprovalItem } from '@hyvve/shared';
import { Clock, Tag, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface ApprovalDetailModalProps {
  /** The approval item to display */
  approval: ApprovalItem | null;
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback after action completion */
  onActionComplete?: () => void;
}

/**
 * ApprovalDetailModal Component
 *
 * Provides a full-screen modal view of an approval item with:
 * - Full context display
 * - AI reasoning explanation (collapsible)
 * - Confidence factors breakdown
 * - Approve/Reject with optional comment
 */
export function ApprovalDetailModal({
  approval,
  open,
  onOpenChange,
  onActionComplete,
}: ApprovalDetailModalProps) {
  const [showPreviewData, setShowPreviewData] = useState(false);

  if (!approval) return null;

  // Format dates
  const createdAgo = formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true });
  const dueDate = approval.dueAt
    ? formatDistanceToNow(new Date(approval.dueAt), { addSuffix: true })
    : null;

  // Priority configuration
  const priorityConfig = {
    1: { label: 'Low', variant: 'outline' as const },
    2: { label: 'Medium', variant: 'secondary' as const },
    3: { label: 'High', variant: 'destructive' as const },
  }[approval.priority] || { label: 'Unknown', variant: 'outline' as const };

  // Determine if actions can be shown
  const canShowActions = approval.status === 'pending';

  const handleActionComplete = () => {
    onActionComplete?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mb-2">
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
          <DialogTitle className="text-xl">{approval.title}</DialogTitle>
          {approval.description && (
            <DialogDescription>{approval.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
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

          <div className="border-t border-gray-200" />

          {/* Confidence Breakdown */}
          <ConfidenceBreakdown
            approvalId={approval.id}
            initialConfidence={approval.confidenceScore}
          />

          <div className="border-t border-gray-200" />

          {/* Preview Data Section */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowPreviewData(prev => !prev)}
              className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              aria-expanded={showPreviewData}
              aria-controls={`preview-data-modal-${approval.id}`}
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
                id={`preview-data-modal-${approval.id}`}
                className="rounded-lg bg-gray-50 p-4 overflow-x-auto max-h-96"
              >
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {(() => {
                    try {
                      const json = JSON.stringify(approval.data, null, 2);
                      // Truncate very large preview data for performance
                      if (json.length > 10000) {
                        return `${json.slice(0, 10000)}\n\n... [truncated - ${json.length} total characters]`;
                      }
                      return json;
                    } catch {
                      return '[Unable to display preview data: circular reference or non-serializable data]';
                    }
                  })()}
                </pre>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200" />

          {/* AI Reasoning Section */}
          <AIReasoningSection
            confidenceScore={approval.confidenceScore}
            factors={approval.factors}
            aiReasoning={approval.aiReasoning}
            sourceModule={approval.sourceModule}
            sourceId={approval.sourceId}
          />

          <div className="border-t border-gray-200" />

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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

          {/* Source Link */}
          {approval.sourceModule && approval.sourceId && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`/${approval.sourceModule}/${approval.sourceId}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Source
                </a>
              </Button>
            </div>
          )}

          {/* Actions */}
          {canShowActions && (
            <>
              <div className="border-t border-gray-200" />
              <ApprovalActions
                approvalId={approval.id}
                variant="default"
                onApprove={handleActionComplete}
                onReject={handleActionComplete}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing approval detail modal state
 */
export function useApprovalDetailModal() {
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (approval: ApprovalItem) => {
    setSelectedApproval(approval);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Delay clearing approval to allow close animation
    setTimeout(() => setSelectedApproval(null), 200);
  };

  return {
    selectedApproval,
    isOpen,
    openModal,
    closeModal,
    setIsOpen,
  };
}
