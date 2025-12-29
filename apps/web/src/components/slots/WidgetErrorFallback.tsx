'use client';

/**
 * Widget Error Fallback Component
 *
 * Displays error state for unknown widget types or render failures.
 * Used by WidgetErrorBoundary and DashboardSlots when widget rendering fails.
 *
 * Features:
 * - Displays error icon and message
 * - Shows widget type that failed (if known)
 * - Shows error details in development mode
 * - Provides retry button when callback is provided
 *
 * @see docs/modules/bm-dm/stories/dm-01-2-slot-system-foundation.md
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { WidgetErrorFallbackProps } from './types';

export function WidgetErrorFallback({
  widgetType,
  error,
  onRetry,
}: WidgetErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development';

  // Determine the title based on error type
  const title = error
    ? 'Widget Error'
    : widgetType
      ? `Unknown Widget: ${widgetType}`
      : 'Widget Error';

  // Determine the description based on error type
  const description = error
    ? 'This widget encountered an error while rendering.'
    : widgetType
      ? `The widget type "${widgetType}" is not recognized.`
      : 'An unknown error occurred.';

  return (
    <Card className="border-destructive/50 bg-destructive/5" data-testid="widget-error-fallback">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {description}
        </p>

        {/* Show error details in development mode */}
        {isDev && error && (
          <pre
            className="text-xs bg-destructive/10 p-2 rounded overflow-auto max-h-32"
            data-testid="error-details"
          >
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        )}

        {/* Retry button - only show when onRetry is provided */}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
            data-testid="retry-button"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
