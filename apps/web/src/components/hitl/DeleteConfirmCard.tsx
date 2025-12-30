/**
 * DeleteConfirmCard Component
 *
 * Specialized HITL approval card for destructive/deletion actions.
 * Displays warning styling and optionally requires typing the item name to confirm.
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfidenceIndicator } from '@/components/approval/confidence-indicator';
import { cn } from '@/lib/utils';
import {
  Trash2,
  AlertTriangle,
  XCircle,
  Loader2,
  ShieldAlert,
  Archive,
  Bell,
} from 'lucide-react';
import type { DeleteConfirmCardProps } from '@/lib/hitl/types';
import { getConfidenceLevel } from '@/lib/hitl/utils';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Deletion confirmation card with warning styling.
 *
 * @example
 * ```tsx
 * <DeleteConfirmCard
 *   args={hitlArgs}
 *   itemName="My Project"
 *   itemType="project"
 *   requireNameConfirmation={true}
 *   onApprove={() => respond?.({ approved: true })}
 *   onReject={(reason) => respond?.({ approved: false, reason })}
 * />
 * ```
 */
export function DeleteConfirmCard({
  args,
  isExecuting = false,
  onApprove,
  onReject,
  itemName,
  itemType = 'item',
  requireNameConfirmation = false,
  title,
  description,
  className,
}: DeleteConfirmCardProps) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const { config, toolArgs, confidenceScore } = args;
  const { requiresReason, approveLabel, rejectLabel } = config;

  // Extract values from toolArgs if not provided as props
  const displayItemName =
    itemName ??
    (toolArgs.project_name as string) ??
    (toolArgs.projectName as string) ??
    (toolArgs.name as string);
  const displayItemType =
    itemType ?? (toolArgs.item_type as string) ?? (toolArgs.itemType as string) ?? 'item';
  const archiveFirst = toolArgs.archive_first ?? toolArgs.archiveFirst ?? true;
  const notifyTeam = toolArgs.notify_team ?? toolArgs.notifyTeam ?? true;

  // Compute confidence level
  const confidenceLevel = useMemo(
    () => getConfidenceLevel(confidenceScore, config),
    [confidenceScore, config]
  );

  // Check if confirmation is valid
  const isConfirmationValid = !requireNameConfirmation || confirmationInput === displayItemName;

  // Handle approve
  const handleApprove = async () => {
    if (!isConfirmationValid) return;

    setIsApproving(true);
    try {
      onApprove();
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
      onReject(rejectReason || undefined);
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
        'border-l-4 border-l-red-500 border-red-200',
        className
      )}
    >
      <CardHeader className="pb-3">
        {/* Header with warning icon */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-700">
              {title || `Delete ${displayItemType.charAt(0).toUpperCase() + displayItemType.slice(1)}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description || 'This action cannot be undone'}
            </p>
          </div>
        </div>

        {/* Warning badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant="destructive" className="gap-1">
            <ShieldAlert className="h-3 w-3" />
            Destructive Action
          </Badge>
          <Badge variant="outline" className="text-xs">
            {displayItemType}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Warning Message */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-800">
                You are about to delete &quot;{displayItemName}&quot;
              </p>
              <p className="text-sm text-red-700">
                This will permanently remove the {displayItemType} and all associated data.
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Deletion Options */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Deletion Settings
          </div>
          <div className="flex flex-wrap gap-2">
            {archiveFirst && (
              <Badge variant="secondary" className="gap-1">
                <Archive className="h-3 w-3" />
                Archive first
              </Badge>
            )}
            {notifyTeam && (
              <Badge variant="secondary" className="gap-1">
                <Bell className="h-3 w-3" />
                Notify team
              </Badge>
            )}
          </div>
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

        {/* Name Confirmation Input */}
        {requireNameConfirmation && !showRejectReason && (
          <div className="space-y-2 animate-in fade-in-50 duration-200">
            <label className="text-sm font-medium">
              Type <span className="font-mono text-red-600">{displayItemName}</span> to confirm
            </label>
            <Input
              type="text"
              placeholder={displayItemName}
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              disabled={isLoading}
              className={cn(
                'font-mono',
                confirmationInput &&
                  confirmationInput !== displayItemName &&
                  'border-red-300 focus-visible:ring-red-500'
              )}
            />
            {confirmationInput && confirmationInput !== displayItemName && (
              <p className="text-xs text-red-600">
                Name doesn&apos;t match. Please type exactly: {displayItemName}
              </p>
            )}
          </div>
        )}

        {/* Rejection Reason Input */}
        {showRejectReason && (
          <div className="space-y-2 animate-in fade-in-50 duration-200">
            <label className="text-sm font-medium">
              Reason for cancellation
              {requiresReason && <span className="text-destructive">*</span>}
            </label>
            <Textarea
              placeholder="Please provide a reason for not deleting this item..."
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
              Back
            </Button>
            <Button
              variant="outline"
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
                  ...
                </>
              ) : (
                <>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  {rejectLabel}
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleApprove}
              disabled={isLoading || !isConfirmationValid}
              className="flex-1"
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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

export default DeleteConfirmCard;
