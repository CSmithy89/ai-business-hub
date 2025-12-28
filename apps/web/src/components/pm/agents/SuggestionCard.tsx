/**
 * Suggestion Card Component
 *
 * Story: PM-12.1 - Agent UI Components
 *
 * Individual suggestion display with confidence indicator, expandable details,
 * and action buttons for Accept/Reject/Snooze. Supports expiration countdown.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isValid, differenceInHours } from 'date-fns';
import {
  type SuggestionType,
  type SuggestionStatus,
  type AgentName,
  suggestionTypeLabels,
  getSuggestionIcon,
  getConfidenceBadge,
  getConfidenceLabel,
  getAgentConfig,
  SNOOZE_OPTIONS,
  EXPIRY_WARNING_HOURS,
} from './constants';

// ============================================================================
// Types
// ============================================================================

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  confidence: number;
  payload: Record<string, unknown>;
  sourceAgent: AgentName;
  expiresAt: string;
  status: SuggestionStatus;
  createdAt: string;
  updatedAt?: string;
  snoozedUntil?: string;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: () => void;
  onReject: () => void;
  onSnooze: (hours: number) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate time remaining until expiration
 */
function getExpirationInfo(expiresAt: string): {
  isExpired: boolean;
  isExpiring: boolean;
  text: string;
} {
  const expiry = new Date(expiresAt);
  if (!isValid(expiry)) {
    return { isExpired: false, isExpiring: false, text: 'No expiration' };
  }

  const now = new Date();
  const hoursRemaining = differenceInHours(expiry, now);

  if (hoursRemaining < 0) {
    return { isExpired: true, isExpiring: false, text: 'Expired' };
  }

  if (hoursRemaining < EXPIRY_WARNING_HOURS) {
    return {
      isExpired: false,
      isExpiring: true,
      text: `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`,
    };
  }

  return {
    isExpired: false,
    isExpiring: false,
    text: `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`,
  };
}

/**
 * Format date safely with fallback
 */
function formatDateSafe(
  dateString: string | undefined | null,
  formatPattern: string,
  fallback = 'Unknown'
): string {
  if (!dateString) return fallback;
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return fallback;
    return format(date, formatPattern);
  } catch {
    return fallback;
  }
}

// ============================================================================
// Suggestion Card Component
// ============================================================================

/**
 * Suggestion Card Component
 *
 * Displays a suggestion from a PM agent with:
 * - Type badge and title
 * - Confidence indicator (color-coded)
 * - Source agent attribution
 * - Expandable description and payload details
 * - Expiration countdown with warning
 * - Accept/Reject/Snooze action buttons
 *
 * @param suggestion - The suggestion data to display
 * @param onAccept - Callback when accepting the suggestion
 * @param onReject - Callback when rejecting the suggestion
 * @param onSnooze - Callback when snoozing with hours parameter
 * @param isLoading - Whether an action is in progress
 * @param readOnly - Whether to hide action buttons
 *
 * @example
 * ```tsx
 * <SuggestionCard
 *   suggestion={suggestion}
 *   onAccept={() => accept(suggestion.id)}
 *   onReject={() => reject(suggestion.id)}
 *   onSnooze={(hours) => snooze(suggestion.id, hours)}
 * />
 * ```
 */
export function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  onSnooze,
  isLoading,
  readOnly,
}: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [expirationInfo, setExpirationInfo] = useState(() =>
    getExpirationInfo(suggestion.expiresAt)
  );

  // Update expiration every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setExpirationInfo(getExpirationInfo(suggestion.expiresAt));
    }, 60000);

    return () => clearInterval(interval);
  }, [suggestion.expiresAt]);

  const SuggestionIcon = getSuggestionIcon(suggestion.type);
  const agentConfig = getAgentConfig(suggestion.sourceAgent);
  const confidenceBadge = getConfidenceBadge(suggestion.confidence);
  const confidencePercent = Math.round(suggestion.confidence * 100);

  // Determine card styling based on status
  const isResolved = suggestion.status !== 'PENDING';
  const isSnoozed = suggestion.status === 'SNOOZED';

  return (
    <Card
      className={cn(
        'transition-all',
        isResolved && 'opacity-60',
        expirationInfo.isExpiring && !isResolved && 'border-yellow-400',
        expirationInfo.isExpired && !isResolved && 'border-red-400 bg-red-50/50'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Icon */}
            <div className={cn('p-2 rounded-lg shrink-0', agentConfig.badgeColor)}>
              <SuggestionIcon className={cn('w-4 h-4', agentConfig.iconColor)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline">
                  {suggestionTypeLabels[suggestion.type] || suggestion.type}
                </Badge>
                <Badge className={cn(confidenceBadge.bg, confidenceBadge.text)}>
                  {confidencePercent}% {getConfidenceLabel(suggestion.confidence)}
                </Badge>
                {isSnoozed && (
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    Snoozed
                  </Badge>
                )}
                {suggestion.status === 'ACCEPTED' && (
                  <Badge className="bg-green-600 text-white">
                    <Check className="w-3 h-3 mr-1" />
                    Accepted
                  </Badge>
                )}
                {suggestion.status === 'REJECTED' && (
                  <Badge variant="destructive">
                    <X className="w-3 h-3 mr-1" />
                    Rejected
                  </Badge>
                )}
              </div>

              {/* Title */}
              <CardTitle className="text-base leading-tight">
                {suggestion.title}
              </CardTitle>

              {/* Source Agent */}
              <div className="flex items-center gap-2 mt-1">
                <agentConfig.Icon className={cn('w-3 h-3', agentConfig.iconColor)} />
                <span className="text-xs text-muted-foreground">
                  Suggested by {agentConfig.name}
                </span>
              </div>
            </div>
          </div>

          {/* Expand Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {expanded && (
        <CardContent className="space-y-4 pt-2">
          {/* Description */}
          <p className="text-sm text-muted-foreground">{suggestion.description}</p>

          {/* Payload Details */}
          {Object.keys(suggestion.payload).length > 0 && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium mb-2">Suggested Changes:</p>
              <ul className="space-y-1">
                {Object.entries(suggestion.payload).map(([key, value]) => (
                  <li key={key} className="flex gap-2">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="font-medium">
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Created {formatDateSafe(suggestion.createdAt, 'MMM d, h:mm a')}</span>
            </div>
            <div className="flex items-center gap-2">
              {expirationInfo.isExpiring || expirationInfo.isExpired ? (
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              <span
                className={cn(
                  expirationInfo.isExpiring && 'text-yellow-600',
                  expirationInfo.isExpired && 'text-red-600'
                )}
              >
                {expirationInfo.text}
              </span>
            </div>
          </div>

          {/* Snoozed Until */}
          {isSnoozed && suggestion.snoozedUntil && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="text-muted-foreground">
                Snoozed until{' '}
                <span className="font-medium">
                  {formatDateSafe(suggestion.snoozedUntil, 'MMM d, h:mm a')}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      )}

      {/* Actions */}
      {!readOnly && suggestion.status === 'PENDING' && (
        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          {/* Reject */}
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            disabled={isLoading || expirationInfo.isExpired}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <X className="w-4 h-4 mr-1" />
            )}
            Reject
          </Button>

          {/* Snooze */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || expirationInfo.isExpired}
                className="w-full sm:w-auto"
              >
                <Clock className="w-4 h-4 mr-1" />
                Snooze
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {SNOOZE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.hours}
                  onClick={() => onSnooze(option.hours)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Accept */}
          <Button
            size="sm"
            onClick={onAccept}
            disabled={isLoading || expirationInfo.isExpired}
            className={cn(
              'w-full sm:w-auto',
              suggestion.confidence >= 0.85 && 'bg-green-600 hover:bg-green-700'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-1" />
            )}
            Accept
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Compact suggestion card for inline display
 */
export function SuggestionCardCompact({
  suggestion,
  onAccept,
  onReject,
  isLoading,
}: Omit<SuggestionCardProps, 'onSnooze' | 'readOnly'>) {
  const SuggestionIcon = getSuggestionIcon(suggestion.type);
  const agentConfig = getAgentConfig(suggestion.sourceAgent);
  const confidencePercent = Math.round(suggestion.confidence * 100);

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('p-1.5 rounded shrink-0', agentConfig.badgeColor)}>
          <SuggestionIcon className={cn('w-3.5 h-3.5', agentConfig.iconColor)} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{suggestion.title}</p>
          <p className="text-xs text-muted-foreground">
            {confidencePercent}% confidence
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onReject}
          disabled={isLoading}
        >
          <X className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={onAccept}
          disabled={isLoading}
        >
          <Check className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
