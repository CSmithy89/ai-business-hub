'use client';

/**
 * ErrorWidget
 *
 * Error state component for widget rendering failures.
 * Displays error message with optional available widget types hint.
 *
 * @see docs/modules/bm-dm/stories/dm-03-3-widget-rendering-pipeline.md
 *
 * @example
 * // Unknown widget type
 * <ErrorWidget
 *   message="Unknown widget type: InvalidWidget"
 *   availableTypes={['ProjectStatus', 'TaskList', 'Metrics', 'Alert']}
 * />
 *
 * // Widget data error
 * <ErrorWidget
 *   message="Failed to load project data"
 *   widgetType="ProjectStatus"
 * />
 */

import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface ErrorWidgetProps {
  /** Error message to display */
  message: string;
  /** Optional widget type that failed */
  widgetType?: string;
  /** Optional list of available widget types */
  availableTypes?: string[];
  /** Optional retry callback */
  onRetry?: () => void;
}

/**
 * Error widget component for displaying widget rendering failures.
 * Used when a tool call fails or an unknown widget type is requested.
 */
export function ErrorWidget({
  message,
  widgetType,
  availableTypes,
  onRetry,
}: ErrorWidgetProps) {
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

        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2 gap-2"
            data-testid="error-widget-retry"
          >
            <RefreshCwIcon className="h-3 w-3" aria-hidden="true" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
