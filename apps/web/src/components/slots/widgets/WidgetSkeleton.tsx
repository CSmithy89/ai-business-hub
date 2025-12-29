'use client';

/**
 * WidgetSkeleton Component
 *
 * Loading skeleton with variants for different widget types.
 * Matches the layout of each widget type for smooth loading transitions.
 *
 * @see docs/modules/bm-dm/stories/dm-01-3-base-widget-components.md
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface WidgetSkeletonProps {
  /** Skeleton variant matching widget type */
  variant?: 'default' | 'compact' | 'metrics' | 'alert';
}

/**
 * Loading skeleton for widget components.
 * Matches the layout of each widget type for smooth loading transitions.
 */
export function WidgetSkeleton({ variant = 'default' }: WidgetSkeletonProps) {
  switch (variant) {
    case 'compact':
      return (
        <div className="space-y-2 p-4" data-testid="widget-skeleton-compact">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );

    case 'metrics':
      return (
        <Card data-testid="widget-skeleton-metrics">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );

    case 'alert':
      return (
        <div
          className="flex gap-3 rounded-lg border p-4"
          data-testid="widget-skeleton-alert"
        >
          <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      );

    default:
      return (
        <Card data-testid="widget-skeleton-default">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </CardContent>
        </Card>
      );
  }
}
