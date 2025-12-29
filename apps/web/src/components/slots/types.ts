/**
 * Slot System Type Definitions
 *
 * Types for the widget registry and rendering system.
 * The Slot System enables AI agents to render dynamic UI components
 * via CopilotKit's useRenderToolCall hook.
 *
 * @see docs/modules/bm-dm/stories/dm-01-2-slot-system-foundation.md
 * @see docs/modules/bm-dm/epics/epic-dm-01-tech-spec.md
 */

import type { ReactNode } from 'react';

/**
 * Valid widget types that can be rendered by agents.
 * Add new widget types here as they are implemented.
 */
export type WidgetType = 'ProjectStatus' | 'TaskList' | 'Metrics' | 'Alert' | 'TeamActivity';

/**
 * Base widget data interface.
 * All widget data payloads should extend this.
 */
export interface WidgetData {
  /** Optional unique identifier for the widget instance */
  id?: string;
  /** Optional title to display in the widget header */
  title?: string;
  /** Additional data fields */
  [key: string]: unknown;
}

/**
 * Arguments passed to render_dashboard_widget tool call.
 */
export interface RenderWidgetArgs {
  /** The type of widget to render */
  type: WidgetType | string; // string allows for graceful handling of unknown types
  /** Data payload for the widget */
  data: WidgetData;
}

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

// ============================================
// Widget-specific data types (for DM-01.3)
// ============================================

/**
 * Data for ProjectStatusWidget
 * Shows project progress with status indicator
 */
export interface ProjectStatusData extends WidgetData {
  projectId: string;
  projectName: string;
  status: 'on_track' | 'at_risk' | 'behind';
  progress: number; // 0-100
  dueDate?: string;
  tasksCompleted: number;
  tasksTotal: number;
}

/**
 * Data for TaskListWidget
 * Displays a list of tasks with status and priority
 */
export interface TaskListData extends WidgetData {
  tasks: Array<{
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    assignee?: string;
  }>;
  limit?: number;
}

/**
 * Data for MetricsWidget
 * Shows key metrics with optional change indicators
 */
export interface MetricsData extends WidgetData {
  metrics: Array<{
    label: string;
    value: number | string;
    change?: { value: number; direction: 'up' | 'down' };
    icon?: string;
  }>;
}

/**
 * Data for AlertWidget
 * Displays an alert message with severity level
 */
export interface AlertData extends WidgetData {
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: { label: string; href: string };
}

/**
 * Data for TeamActivityWidget
 * Shows recent team activity feed
 */
export interface TeamActivityData extends WidgetData {
  activities: Array<{
    user: string;
    action: string;
    target?: string;
    time: string;
  }>;
}

/**
 * Props passed to placeholder widgets during development
 */
export interface PlaceholderWidgetProps {
  /** Widget type identifier */
  type: string;
  /** Widget data payload */
  data: WidgetData;
}
