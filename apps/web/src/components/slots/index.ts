/**
 * Slot System Exports
 *
 * Central export point for the widget slot system.
 * The Slot System enables AI agents to render dynamic UI components
 * via CopilotKit's useCopilotAction hook.
 *
 * @example
 * import { DashboardSlots } from '@/components/slots';
 *
 * // In your layout
 * <DashboardSlots />
 *
 * @see docs/modules/bm-dm/stories/dm-01-2-slot-system-foundation.md
 * @see docs/modules/bm-dm/stories/dm-01-3-base-widget-components.md
 */

// Main component
export { DashboardSlots } from './DashboardSlots';

// Error handling components
export { WidgetErrorBoundary } from './WidgetErrorBoundary';
export { WidgetErrorFallback } from './WidgetErrorFallback';

// Registry utilities
export {
  WIDGET_REGISTRY,
  isValidWidgetType,
  getWidgetComponent,
  getRegisteredWidgetTypes,
  type WidgetProps,
} from './widget-registry';

// Widget components
export {
  // Shared components
  WidgetSkeleton,
  WidgetEmpty,
  // Loading and error states (DM-03.3)
  LoadingWidget,
  ErrorWidget,
  // Widget implementations
  ProjectStatusWidget,
  TaskListWidget,
  MetricsWidget,
  AlertWidget,
  TeamActivityWidget,
  // Props types
  type WidgetSkeletonProps,
  type WidgetEmptyProps,
  type LoadingWidgetProps,
  type ErrorWidgetProps,
  type ProjectStatusWidgetProps,
  type TaskListWidgetProps,
  type MetricsWidgetProps,
  type AlertWidgetProps,
  type TeamActivityWidgetProps,
} from './widgets';

// Types
export type {
  WidgetType,
  WidgetData,
  RenderWidgetArgs,
  WidgetErrorFallbackProps,
  WidgetErrorBoundaryProps,
  ProjectStatusData,
  TaskListData,
  MetricsData,
  AlertData,
  TeamActivityData,
  PlaceholderWidgetProps,
} from './types';
