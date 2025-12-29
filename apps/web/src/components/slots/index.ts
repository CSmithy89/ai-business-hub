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
} from './widget-registry';

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
  PlaceholderWidgetProps,
} from './types';
