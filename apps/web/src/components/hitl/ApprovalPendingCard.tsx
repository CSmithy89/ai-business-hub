/**
 * ApprovalPendingCard Component
 *
 * Card component for displaying status of HITL actions that have been
 * queued to the Foundation approval system for full review.
 *
 * Features:
 * - Shows "Queued for Review" status
 * - Displays tool name and confidence score
 * - Links to approval queue for full review
 * - Shows estimated time to resolution
 * - Optional cancel functionality
 *
 * @see docs/modules/bm-dm/stories/dm-05-3-approval-workflow-integration.md
 * Epic: DM-05 | Story: DM-05.3
 */
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatToolName } from '@/lib/hitl/utils';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for ApprovalPendingCard component.
 */
export interface ApprovalPendingCardProps {
  /** Foundation approval ID */
  approvalId: string;
  /** Tool name that triggered the approval */
  toolName: string;
  /** Confidence score (0-100) */
  confidenceScore: number;
  /** When approval was created */
  createdAt: Date | number;
  /** Current status */
  status: 'pending' | 'approved' | 'rejected';
  /** Callback when user clicks to view in queue */
  onViewInQueue?: () => void;
  /** Callback when user cancels (if supported) */
  onCancel?: () => void;
  /** Whether cancellation is in progress */
  isCancelling?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format time elapsed since creation.
 */
function formatTimeElapsed(createdAt: Date | number): string {
  const now = Date.now();
  const created = typeof createdAt === 'number' ? createdAt : createdAt.getTime();
  const elapsed = now - created;

  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ago`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
}

/**
 * Estimate time to resolution based on priority.
 * For low-confidence actions, we assume medium priority (24h).
 */
function estimateTimeToResolution(confidenceScore: number): string {
  // High priority (< 40% confidence): 4-8 hours
  if (confidenceScore < 40) {
    return '4-8 hours';
  }
  // Medium priority (40-60% confidence): 12-24 hours
  return '12-24 hours';
}

// =============================================================================
// STATUS ICON COMPONENT
// =============================================================================

/**
 * Status icon based on approval status.
 */
function StatusIcon({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  switch (status) {
    case 'approved':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'pending':
    default:
      return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Card showing status of a queued approval.
 *
 * @example
 * ```tsx
 * <ApprovalPendingCard
 *   approvalId="approval_123"
 *   toolName="sign_contract"
 *   confidenceScore={45}
 *   createdAt={Date.now()}
 *   status="pending"
 *   onViewInQueue={() => router.push('/approvals')}
 * />
 * ```
 */
export function ApprovalPendingCard({
  approvalId,
  toolName,
  confidenceScore,
  createdAt,
  status,
  onViewInQueue,
  onCancel,
  isCancelling = false,
  className,
}: ApprovalPendingCardProps) {
  // Memoize computed values
  const displayName = useMemo(() => formatToolName(toolName), [toolName]);
  const timeElapsed = useMemo(() => formatTimeElapsed(createdAt), [createdAt]);
  const estimatedTime = useMemo(
    () => estimateTimeToResolution(confidenceScore),
    [confidenceScore]
  );

  // Status configuration
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          variant: 'default' as const,
          bgClass: 'bg-green-50 dark:bg-green-950/20',
          borderClass: 'border-green-200 dark:border-green-800',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          bgClass: 'bg-red-50 dark:bg-red-950/20',
          borderClass: 'border-red-200 dark:border-red-800',
        };
      case 'pending':
      default:
        return {
          label: 'Queued for Review',
          variant: 'secondary' as const,
          bgClass: 'bg-yellow-50 dark:bg-yellow-950/20',
          borderClass: 'border-yellow-200 dark:border-yellow-800',
        };
    }
  }, [status]);

  return (
    <Card
      className={cn(
        'border-2 max-w-md animate-in slide-in-from-bottom-4 duration-300',
        statusConfig.bgClass,
        statusConfig.borderClass,
        className
      )}
    >
      <CardHeader className="pb-3">
        {/* Status badge and icon */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant={statusConfig.variant} className="gap-1.5">
            <StatusIcon status={status} />
            {statusConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{timeElapsed}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {displayName}
          {status === 'pending' && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mt-1">
          {status === 'pending' ? (
            <>
              This action requires full review in the approval queue before it can be executed.
            </>
          ) : status === 'approved' ? (
            <>The action has been approved and will be executed.</>
          ) : (
            <>The action was rejected and will not be executed.</>
          )}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Confidence Score</span>
            <span className="font-medium">{confidenceScore}%</span>
          </div>
          <Progress value={confidenceScore} className="h-2" />
        </div>

        {/* Estimated Time (only for pending) */}
        {status === 'pending' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated resolution: {estimatedTime}</span>
          </div>
        )}

        {/* Low confidence warning */}
        {status === 'pending' && confidenceScore < 40 && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-100/50 dark:bg-amber-900/20 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <span className="text-amber-800 dark:text-amber-200">
              This action has very low confidence and has been marked as high priority for review.
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        {/* Cancel button (only for pending, if supported) */}
        {status === 'pending' && onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isCancelling}
            className="flex-1"
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </>
            )}
          </Button>
        )}

        {/* View in Queue button */}
        {onViewInQueue ? (
          <Button
            variant={status === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={onViewInQueue}
            className="flex-1"
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            View in Queue
          </Button>
        ) : (
          <Button
            variant={status === 'pending' ? 'default' : 'outline'}
            size="sm"
            asChild
            className="flex-1"
          >
            <Link href={`/approvals?id=${encodeURIComponent(approvalId)}`}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              View in Queue
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default ApprovalPendingCard;
