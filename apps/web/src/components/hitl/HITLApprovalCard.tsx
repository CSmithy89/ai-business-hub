/**
 * HITLApprovalCard Component
 *
 * Generic Human-in-the-Loop approval card component for inline approval UIs.
 * Displays tool details, confidence indicator, risk badges, and approve/reject buttons.
 *
 * Features:
 * - Risk level badge with icon
 * - ConfidenceIndicator integration from Foundation
 * - Tool arguments preview
 * - Configurable approve/reject labels
 * - Optional rejection reason input
 * - Loading state during execution
 *
 * @see docs/modules/bm-dm/stories/dm-05-2-frontend-hitl-handlers.md
 * Epic: DM-05 | Story: DM-05.2
 */
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ConfidenceIndicator } from '@/components/approval/confidence-indicator';
import { cn } from '@/lib/utils';
import {
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { HITLApprovalCardProps } from '@/lib/hitl/types';
import {
  formatToolName,
  formatDescriptionTemplate,
  formatKey,
  formatValue,
  getRiskBadgeVariant,
  getRiskColorClasses,
  getConfidenceLevel,
} from '@/lib/hitl/utils';

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Risk level icon based on risk level.
 */
function RiskIcon({ level }: { level: 'low' | 'medium' | 'high' }) {
  const iconClass = 'h-3.5 w-3.5';
  switch (level) {
    case 'high':
      return <XCircle className={iconClass} />;
    case 'medium':
      return <AlertTriangle className={iconClass} />;
    case 'low':
    default:
      return <Info className={iconClass} />;
  }
}

/**
 * Tool arguments preview section.
 */
function ToolArgsPreview({ args }: { args: Record<string, unknown> }) {
  const entries = Object.entries(args).filter(
    ([key]) => !key.startsWith('_') // Filter internal keys
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md bg-muted/50 p-3 text-sm">
      <div className="space-y-1.5">
        {entries.slice(0, 6).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{formatKey(key)}</span>
            <span className="font-medium text-right truncate max-w-[200px]">
              {formatValue(value, key)}
            </span>
          </div>
        ))}
        {entries.length > 6 && (
          <div className="text-muted-foreground text-xs pt-1">
            +{entries.length - 6} more fields
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Generic HITL approval card for inline approval UIs.
 *
 * @example
 * ```tsx
 * <HITLApprovalCard
 *   args={hitlArgs}
 *   isExecuting={status === 'executing'}
 *   onApprove={() => respond?.({ approved: true })}
 *   onReject={(reason) => respond?.({ approved: false, reason })}
 * />
 * ```
 */
export function HITLApprovalCard({
  args,
  isExecuting = false,
  onApprove,
  onReject,
  title,
  description,
  children,
  className,
}: HITLApprovalCardProps) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const { config, toolName, toolArgs, confidenceScore } = args;
  const { riskLevel, requiresReason, approveLabel, rejectLabel, descriptionTemplate } =
    config;

  // Compute confidence level for ConfidenceIndicator
  const confidenceLevel = useMemo(
    () => getConfidenceLevel(confidenceScore, config),
    [confidenceScore, config]
  );

  // Risk color classes for card border
  const riskColors = getRiskColorClasses(riskLevel);

  // Computed title
  const displayTitle = title || formatToolName(toolName);

  // Computed description
  const displayDescription = useMemo(() => {
    if (description) return description;
    if (descriptionTemplate) {
      return formatDescriptionTemplate(descriptionTemplate, toolArgs);
    }
    return `Approval required for ${formatToolName(toolName)}`;
  }, [description, descriptionTemplate, toolArgs, toolName]);

  // Handle approve
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      // State will be unmounted after response, but just in case
      setIsApproving(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (requiresReason && !showRejectReason) {
      setShowRejectReason(true);
      return;
    }

    setIsRejecting(true);
    try {
      await onReject(rejectReason || undefined);
    } finally {
      setIsRejecting(false);
    }
  };

  // Cancel rejection reason entry
  const handleCancelReject = () => {
    setShowRejectReason(false);
    setRejectReason('');
  };

  const isLoading = isApproving || isRejecting || isExecuting;

  return (
    <Card
      className={cn(
        'border-2 max-w-md animate-in slide-in-from-bottom-4 duration-300',
        `border-l-4 ${riskColors.border}`,
        className
      )}
    >
      <CardHeader className="pb-3">
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant={getRiskBadgeVariant(riskLevel)} className="gap-1">
            <RiskIcon level={riskLevel} />
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
          </Badge>
          <Badge variant="outline" className="text-xs">
            {config.approvalType}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold">{displayTitle}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mt-1">{displayDescription}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Confidence Indicator */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Confidence Score</div>
          <ConfidenceIndicator
            score={confidenceScore}
            level={confidenceLevel}
            size="sm"
            showRecommendation
          />
        </div>

        {/* Tool Arguments Preview */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Action Details</div>
          <ToolArgsPreview args={toolArgs} />
        </div>

        {/* Custom children content */}
        {children}

        {/* Rejection Reason Input */}
        {showRejectReason && (
          <div className="space-y-2 animate-in fade-in-50 duration-200">
            <label className="text-sm font-medium">
              Reason for rejection
              {requiresReason && <span className="text-destructive">*</span>}
            </label>
            <Textarea
              placeholder="Please provide a reason for rejecting this action..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[80px]"
              disabled={isLoading}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        {/* Reject/Cancel Button */}
        {showRejectReason ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelReject}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={isLoading || (requiresReason && !rejectReason.trim())}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Confirm Reject'
              )}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={isLoading}
              className="flex-1"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  {rejectLabel}
                </>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleApprove}
              disabled={isLoading}
              className="flex-1"
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {approveLabel}
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export default HITLApprovalCard;
