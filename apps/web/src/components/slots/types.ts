/**
 * Slot System Type Definitions
 *
 * Types for the widget registry and rendering system.
 * The Slot System enables AI agents to render dynamic UI components
 * via CopilotKit's useRenderToolCall hook.
 *
 * DM-08.5: Widget types now imported from @hyvve/shared for single source of truth.
 *
 * @see docs/modules/bm-dm/stories/dm-01-2-slot-system-foundation.md
 * @see docs/modules/bm-dm/epics/epic-dm-01-tech-spec.md
 */

import type { ReactNode } from 'react';

// Re-export widget types from shared package (single source of truth)
export {
  WIDGET_TYPES,
  WIDGET_TYPE_LIST,
  isValidWidgetType,
  type WidgetType,
  type BaseWidgetData,
  type RenderWidgetArgs,
  type ProjectStatusData,
  type TaskListData,
  type MetricsData,
  type AlertData,
  type TeamActivityData,
  type KanbanBoardData,
  type GanttChartData,
  type BurndownChartData,
  type WidgetData,
} from '@hyvve/shared';

// Re-export BaseWidgetData as GenericWidgetData for components that need flexible data
export type { BaseWidgetData as GenericWidgetData } from '@hyvve/shared';

/**
 * Props for the WidgetErrorFallback component.
 */
export interface WidgetErrorFallbackProps {
  /** The widget type that failed to render */
  widgetType?: string;
  /** The error that occurred (if any) */
  error?: Error;
  /** Callback to retry rendering */
  onRetry?: () => void;
}

/**
 * Props for the WidgetErrorBoundary component.
 */
export interface WidgetErrorBoundaryProps {
  /** The widget type being rendered */
  widgetType?: string;
  /** Children to render */
  children: ReactNode;
}

/**
 * Props passed to placeholder widgets during development
 */
export interface PlaceholderWidgetProps {
  /** Widget type identifier */
  type: string;
  /** Widget data payload */
  data: Record<string, unknown>;
}
