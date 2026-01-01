'use client';

/**
 * ErrorWidget
 *
 * Error state component for widget rendering failures.
 * Displays error message with optional available widget types hint.
 *
 * DM-11.10 Updates:
 * - Added retryCount and maxRetries props for retry limiting
 * - Added loading state during async retry operations
 * - Disabled retry button when max retries exceeded
 * - Shows retry exhausted message when applicable
 *
 * @see docs/modules/bm-dm/stories/dm-03-3-widget-rendering-pipeline.md
 * @see docs/modules/bm-dm/stories/dm-11-10-wire-errorwidget-retry.md
 *
 * @example
 * // Unknown widget type
 * <ErrorWidget
 *   message="Unknown widget type: InvalidWidget"
 *   availableTypes={['ProjectStatus', 'TaskList', 'Metrics', 'Alert']}
 * />
 *
 * // Widget data error with retry
 * <ErrorWidget
 *   message="Failed to load project data"
 *   widgetType="ProjectStatus"
 *   onRetry={() => refetch()}
 *   retryCount={1}
 *   maxRetries={3}
 * />
 */

import { useState } from 'react';
import { AlertCircleIcon, RefreshCwIcon, Loader2Icon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface ErrorWidgetProps {
  /** Error message to display */
  message: string;
  /** Optional widget type that failed */
  widgetType?: string;
  /** Optional list of available widget types */
  availableTypes?: string[];
  /** Optional retry callback (can be async) */
  onRetry?: () => void | Promise<void>;
  /** Current retry count (0 = first attempt) */
  retryCount?: number;
  /** Maximum number of retries allowed (default: 3) */
  maxRetries?: number;
}

/**
 * Error widget component for displaying widget rendering failures.
 * Used when a tool call fails or an unknown widget type is requested.
 *
 * Supports async retry operations with loading state and retry limiting.
 */
export function ErrorWidget({
  message,
  widgetType,
  availableTypes,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
}: ErrorWidgetProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  // Can retry if callback provided, under max retries, and not currently retrying
  const canRetry = Boolean(onRetry) && retryCount < maxRetries && !isRetrying;
  const retriesExhausted = Boolean(onRetry) && retryCount >= maxRetries;

  /**
   * Handle retry button click with async support and loading state.
   */
  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      // Error handling is managed by the parent - we just reset loading state
      console.error('[ErrorWidget] Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Alert
      variant="destructive"
      data-testid="error-widget"
      className="border-destructive/50"
    >
      <AlertCircleIcon className="h-4 w-4" aria-hidden="true" />
      <AlertTitle className="font-medium">
        {widgetType ? `${widgetType} Error` : 'Widget Error'}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p className="text-sm">{message}</p>

        {availableTypes && availableTypes.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Available types:{' '}
            <span className="font-mono">
              {availableTypes.join(', ')}
            </span>
          </p>
        )}

        {/* Retry exhausted message */}
        {retriesExhausted && (
          <p
            className="text-xs text-muted-foreground"
            data-testid="error-widget-retries-exhausted"
          >
            Maximum retries ({maxRetries}) exceeded. Please refresh the page.
          </p>
        )}

        {/* Retry button with loading state */}
        {onRetry && !retriesExhausted && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={!canRetry}
            className="mt-2 gap-2"
            data-testid="error-widget-retry"
          >
            {isRetrying ? (
              <>
                <Loader2Icon
                  className="h-3 w-3 animate-spin"
                  aria-hidden="true"
                  data-testid="error-widget-retry-spinner"
                />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCwIcon className="h-3 w-3" aria-hidden="true" />
                Retry{retryCount > 0 ? ` (${retryCount}/${maxRetries})` : ''}
              </>
            )}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
