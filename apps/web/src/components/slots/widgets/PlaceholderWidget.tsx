/**
 * Placeholder Widget
 *
 * A placeholder component for widget types that are defined but not yet implemented.
 * Shows a consistent "coming soon" UI for KanbanBoard, GanttChart, BurndownChart.
 *
 * DM-08.5: Created for widget type consistency during incremental implementation.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import type { BaseWidgetData } from '../types';

interface PlaceholderWidgetProps {
  data: BaseWidgetData;
  widgetType: string;
  isLoading?: boolean;
}

/**
 * Generic placeholder widget for unimplemented widget types.
 */
export function PlaceholderWidget({
  data,
  widgetType,
  isLoading,
}: PlaceholderWidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-2 border-muted-foreground/25">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          {data.title || widgetType}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
          <p className="text-sm">
            {widgetType} widget coming soon
          </p>
          <p className="text-xs mt-1">
            This visualization will be available in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Kanban Board Widget - Placeholder
 */
export function KanbanBoardWidget({
  data,
  isLoading,
}: {
  data: BaseWidgetData;
  isLoading?: boolean;
}) {
  return (
    <PlaceholderWidget
      data={data}
      widgetType="KanbanBoard"
      isLoading={isLoading}
    />
  );
}

/**
 * Gantt Chart Widget - Placeholder
 */
export function GanttChartWidget({
  data,
  isLoading,
}: {
  data: BaseWidgetData;
  isLoading?: boolean;
}) {
  return (
    <PlaceholderWidget
      data={data}
      widgetType="GanttChart"
      isLoading={isLoading}
    />
  );
}

/**
 * Burndown Chart Widget - Placeholder
 */
export function BurndownChartWidget({
  data,
  isLoading,
}: {
  data: BaseWidgetData;
  isLoading?: boolean;
}) {
  return (
    <PlaceholderWidget
      data={data}
      widgetType="BurndownChart"
      isLoading={isLoading}
    />
  );
}
