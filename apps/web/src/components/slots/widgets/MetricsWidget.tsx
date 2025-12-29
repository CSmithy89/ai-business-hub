'use client';

/**
 * MetricsWidget
 *
 * Displays key metrics in a responsive grid with optional change indicators.
 * Supports dynamic icons and up/down trend arrows.
 *
 * @see docs/modules/bm-dm/stories/dm-01-3-base-widget-components.md
 *
 * @example
 * render_dashboard_widget({
 *   type: 'Metrics',
 *   data: {
 *     metrics: [
 *       { label: 'Tasks Completed', value: 42, change: { value: 12, direction: 'up' }, icon: 'tasks' },
 *       { label: 'Team Members', value: 8, icon: 'users' },
 *       { label: 'Hours Logged', value: '168h', change: { value: 5, direction: 'down' }, icon: 'clock' }
 *     ]
 *   }
 * })
 */

import type { ComponentType } from 'react';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
  TargetIcon,
  UsersIcon,
  ClockIcon,
  CheckSquareIcon,
  BarChart3Icon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetEmpty } from './WidgetEmpty';
import type { MetricsData } from '../types';

export interface MetricsWidgetProps {
  /** Metrics data */
  data: MetricsData;
  /** Whether the widget is loading */
  isLoading?: boolean;
}

// Icon mapping for common metric types
const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  activity: ActivityIcon,
  target: TargetIcon,
  users: UsersIcon,
  clock: ClockIcon,
  tasks: CheckSquareIcon,
  chart: BarChart3Icon,
};

export function MetricsWidget({ data, isLoading }: MetricsWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton variant="metrics" />;
  }

  if (!data?.metrics || data.metrics.length === 0) {
    return <WidgetEmpty message="No metrics available" />;
  }

  // Calculate grid columns based on number of metrics
  const columnCount = Math.min(data.metrics.length, 4);

  return (
    <Card data-testid="metrics-widget">
      {data.title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{data.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={data.title ? '' : 'pt-6'}>
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {data.metrics.map((metric, index) => {
            const IconComponent = metric.icon
              ? ICON_MAP[metric.icon] || BarChart3Icon
              : null;

            return (
              <div
                key={`${metric.label}-${index}`}
                className="space-y-1"
                data-testid={`metric-item-${index}`}
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {IconComponent && (
                    <IconComponent className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{metric.label}</span>
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  {metric.value}
                </div>
                {metric.change && (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      metric.change.direction === 'up'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                    aria-label={`${metric.change.direction === 'up' ? 'Increased' : 'Decreased'} by ${Math.abs(metric.change.value)}%`}
                  >
                    {metric.change.direction === 'up' ? (
                      <TrendingUpIcon className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <TrendingDownIcon className="h-3 w-3" aria-hidden="true" />
                    )}
                    <span>
                      {metric.change.direction === 'up' ? '+' : '-'}
                      {Math.abs(metric.change.value)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
