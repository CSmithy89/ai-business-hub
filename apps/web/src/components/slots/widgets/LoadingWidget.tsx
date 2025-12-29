'use client';

/**
 * LoadingWidget
 *
 * Loading state wrapper for widgets during tool call execution.
 * Shows a skeleton with an optional loading message indicating the widget type.
 *
 * @see docs/modules/bm-dm/stories/dm-03-3-widget-rendering-pipeline.md
 *
 * @example
 * // During pending tool call status
 * <LoadingWidget type="ProjectStatus" />
 */

import { Loader2Icon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface LoadingWidgetProps {
  /** Optional widget type being loaded */
  type?: string;
  /** Optional message to display */
  message?: string;
}

/**
 * Get a human-readable label for a widget type.
 */
function getWidgetLabel(type?: string): string {
  if (!type) return 'widget';

  // Convert PascalCase to readable format
  const readable = type
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();

  return readable;
}

/**
 * Loading widget component shown during pending tool calls.
 * Provides visual feedback that a widget is being loaded.
 */
export function LoadingWidget({ type, message }: LoadingWidgetProps) {
  const displayMessage = message || `Loading ${getWidgetLabel(type)}...`;

  return (
    <Card data-testid="loading-widget">
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Skeleton content */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-16 w-full" />
        </div>

        {/* Loading indicator */}
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <Loader2Icon className="h-3 w-3 animate-spin" aria-hidden="true" />
          <span>{displayMessage}</span>
        </div>
      </CardContent>
    </Card>
  );
}
