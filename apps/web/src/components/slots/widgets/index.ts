/**
 * Widget Components Export
 *
 * All dashboard widget implementations for the Slot System.
 * These widgets are rendered by AI agents via CopilotKit's
 * render_dashboard_widget tool call.
 *
 * @see docs/modules/bm-dm/stories/dm-01-3-base-widget-components.md
 * @see docs/modules/bm-dm/stories/dm-03-3-widget-rendering-pipeline.md
 */

// Shared components
export { WidgetSkeleton, type WidgetSkeletonProps } from './WidgetSkeleton';
export { WidgetEmpty, type WidgetEmptyProps } from './WidgetEmpty';

// Loading and error states (DM-03.3)
export { LoadingWidget, type LoadingWidgetProps } from './LoadingWidget';
export { ErrorWidget, type ErrorWidgetProps } from './ErrorWidget';

// Widget implementations
export {
  ProjectStatusWidget,
  type ProjectStatusWidgetProps,
} from './ProjectStatusWidget';
export { TaskListWidget, type TaskListWidgetProps } from './TaskListWidget';
export { MetricsWidget, type MetricsWidgetProps } from './MetricsWidget';
export { AlertWidget, type AlertWidgetProps } from './AlertWidget';
export {
  TeamActivityWidget,
  type TeamActivityWidgetProps,
} from './TeamActivityWidget';
