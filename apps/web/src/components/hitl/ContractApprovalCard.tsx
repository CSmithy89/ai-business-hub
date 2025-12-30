/**
 * ContractApprovalCard Component
 *
 * Specialized HITL approval card for contract signing actions.
 * Displays contract-specific details including contract ID, amount, and parties.
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
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  User,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { ContractApprovalCardProps } from '@/lib/hitl/types';
import {
  formatCurrency,
  getRiskColorClasses,
  getConfidenceLevel,
} from '@/lib/hitl/utils';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Contract-specific approval card for signing contracts.
 *
 * @example
 * ```tsx
 * <ContractApprovalCard
 *   args={hitlArgs}
 *   contractId="C-2024-001"
 *   amount={50000}
 *   signatoryName="John Doe"
 *   onApprove={() => respond?.({ approved: true })}
 *   onReject={(reason) => respond?.({ approved: false, reason })}
 * />
 * ```
 */
export function ContractApprovalCard({
  args,
  isExecuting = false,
  onApprove,
  onReject,
  contractId,
  amount,
  signatoryName,
  termsSummary,
  title,
  description,
  className,
}: ContractApprovalCardProps) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const { config, toolArgs, confidenceScore } = args;
  const { riskLevel, requiresReason, approveLabel, rejectLabel } = config;

  // Extract values from toolArgs if not provided as props
  const displayContractId = contractId ?? (toolArgs.contract_id as string) ?? (toolArgs.contractId as string);
  const displayAmount = amount ?? (toolArgs.amount as number);
  const displaySignatory = signatoryName ?? (toolArgs.signatory_name as string) ?? (toolArgs.signatoryName as string);
  const displayTerms = termsSummary ?? (toolArgs.terms_summary as string) ?? (toolArgs.termsSummary as string);

  // Compute confidence level
  const confidenceLevel = useMemo(
    () => getConfidenceLevel(confidenceScore, config),
    [confidenceScore, config]
  );

  // Risk color classes for card border
  const riskColors = getRiskColorClasses(riskLevel);

  // Handle approve
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
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
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {title || 'Contract Signing'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description || 'Review and sign the contract'}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            High Risk Action
          </Badge>
          <Badge variant="outline" className="text-xs">
            Legal
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contract Details */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          {/* Contract ID */}
          {displayContractId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contract ID
              </span>
              <span className="font-mono font-medium">{displayContractId}</span>
            </div>
          )}

          {/* Amount */}
          {displayAmount !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount
              </span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(displayAmount)}
              </span>
            </div>
          )}

          {/* Signatory */}
          {displaySignatory && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Signatory
              </span>
              <span className="font-medium">{displaySignatory}</span>
            </div>
          )}
        </div>

        {/* Terms Summary */}
        {displayTerms && (
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Terms Summary
            </div>
            <p className="text-sm">{displayTerms}</p>
          </div>
        )}

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1 text-green-700 border-green-300 bg-green-50">
            <ShieldCheck className="h-3 w-3" />
            Legal Reviewed
          </Badge>
          <Badge variant="outline" className="gap-1 text-blue-700 border-blue-300 bg-blue-50">
            <CheckCircle2 className="h-3 w-3" />
            Finance Approved
          </Badge>
        </div>

        {/* Divider */}
        <div className="border-t my-2" />

        {/* Confidence Indicator */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">AI Confidence</div>
          <ConfidenceIndicator
            score={confidenceScore}
            level={confidenceLevel}
            size="sm"
            showRecommendation
          />
        </div>

        {/* Rejection Reason Input */}
        {showRejectReason && (
          <div className="space-y-2 animate-in fade-in-50 duration-200">
            <label className="text-sm font-medium">
              Reason for rejection
              {requiresReason && <span className="text-destructive">*</span>}
            </label>
            <Textarea
              placeholder="Please provide a reason for not signing this contract..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[80px]"
              disabled={isLoading}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
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
                  Cancelling...
                </>
              ) : (
                'Confirm Cancel'
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
                  Cancelling...
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
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
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

export default ContractApprovalCard;
