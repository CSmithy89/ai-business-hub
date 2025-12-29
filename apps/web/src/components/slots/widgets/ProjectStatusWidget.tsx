'use client';

/**
 * ProjectStatusWidget
 *
 * Displays project health, progress bar, and status indicators.
 * Used by AI agents to show project status on the dashboard.
 *
 * @see docs/modules/bm-dm/stories/dm-01-3-base-widget-components.md
 *
 * @example
 * render_dashboard_widget({
 *   type: 'ProjectStatus',
 *   data: {
 *     projectId: 'proj_123',
 *     projectName: 'Website Redesign',
 *     status: 'on_track',
 *     progress: 75,
 *     tasksCompleted: 15,
 *     tasksTotal: 20,
 *     dueDate: '2025-01-15'
 *   }
 * })
 */

import {
  CalendarIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetEmpty } from './WidgetEmpty';
import type { ProjectStatusData } from '../types';

export interface ProjectStatusWidgetProps {
  /** Project status data */
  data: ProjectStatusData;
  /** Whether the widget is loading */
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  on_track: {
    label: 'On Track',
    icon: CheckCircle2Icon,
    className:
      'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  },
  at_risk: {
    label: 'At Risk',
    icon: AlertTriangleIcon,
    className:
      'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  },
  behind: {
    label: 'Behind',
    icon: XCircleIcon,
    className:
      'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
} as const;

export function ProjectStatusWidget({
  data,
  isLoading,
}: ProjectStatusWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton variant="default" />;
  }

  if (!data || !data.projectName) {
    return <WidgetEmpty message="No project data available" />;
  }

  const statusConfig = STATUS_CONFIG[data.status] || STATUS_CONFIG.on_track;
  const StatusIcon = statusConfig.icon;

  const formattedDueDate = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const progress = Math.min(100, Math.max(0, data.progress));

  return (
    <Card data-testid="project-status-widget">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium line-clamp-1">
            {data.projectName}
          </CardTitle>
          <Badge
            variant="outline"
            className={`flex-shrink-0 gap-1 ${statusConfig.className}`}
          >
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            <span>{statusConfig.label}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2"
            aria-label={`Project progress: ${Math.round(progress)}%`}
          />
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">Tasks: </span>
              <span className="font-medium">
                {data.tasksCompleted}/{data.tasksTotal}
              </span>
            </div>
          </div>
          {formattedDueDate && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formattedDueDate}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
