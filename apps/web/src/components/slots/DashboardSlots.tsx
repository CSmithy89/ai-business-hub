'use client';

/**
 * Dashboard Slots Component
 *
 * Registers the `render_dashboard_widget` tool handler with CopilotKit.
 * This component is a side-effect component - it renders nothing itself
 * but enables agents to render widgets in the dashboard.
 *
 * The Slot System uses CopilotKit's useCopilotAction hook to intercept
 * tool calls from agents and render corresponding React components.
 *
 * DM-03.3 Updates:
 * - Added loading state handling (shows LoadingWidget during inProgress/executing)
 * - Added error state handling (shows ErrorWidget for failures)
 * - Added TeamActivity widget type
 * - Added data error detection
 *
 * Place this component in the dashboard layout to enable widget rendering.
 *
 * @example
 * // In dashboard layout
 * <DashboardSlots />
 *
 * // Agent can then call:
 * render_dashboard_widget({ type: "ProjectStatus", data: { ... } })
 *
 * @see docs/modules/bm-dm/stories/dm-01-2-slot-system-foundation.md
 * @see docs/modules/bm-dm/stories/dm-03-3-widget-rendering-pipeline.md
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { LoadingWidget, ErrorWidget } from './widgets';
import { getWidgetComponent, getRegisteredWidgetTypes } from './widget-registry';
import type { RenderWidgetArgs } from './types';

export function DashboardSlots() {
  useCopilotAction({
    name: 'render_dashboard_widget',
    description: "Render a widget on the user's dashboard",
    parameters: [
      {
        name: 'type',
        type: 'string',
        description:
          'Widget type identifier (ProjectStatus, TaskList, Metrics, Alert, TeamActivity)',
        required: true,
      },
      {
        name: 'data',
        type: 'object',
        description: 'Widget data payload',
        required: true,
      },
    ],
    // Disable calling from UI - this is for rendering only
    available: 'disabled',
    render: ({ args, status }) => {
      const { type, data } = args as RenderWidgetArgs;
      const widgetType = (type as string) || 'Unknown';

      // Show loading state during inProgress or executing
      if (status === 'inProgress' || status === 'executing') {
        return <LoadingWidget type={widgetType} />;
      }

      // Note: CopilotKit status is 'complete' when done - no explicit 'error' status
      // Error handling is done via data.error field from agent responses

      // Validate that we have data to render
      if (data === null || data === undefined) {
        return (
          <ErrorWidget
            message="No data provided for widget"
            widgetType={widgetType}
          />
        );
      }

      // Handle data-level errors from agent responses
      if (typeof data === 'object' && 'error' in data && data.error) {
        // Handle Error objects properly
        const errorMessage =
          data.error instanceof Error
            ? data.error.message
            : String(data.error);
        return (
          <ErrorWidget
            message={errorMessage}
            widgetType={widgetType}
          />
        );
      }

      // Get the widget component from the registry
      const WidgetComponent = getWidgetComponent(widgetType);

      // Handle unknown widget types
      if (!WidgetComponent) {
        return (
          <ErrorWidget
            message={`Unknown widget type: ${widgetType}`}
            widgetType={widgetType}
            availableTypes={getRegisteredWidgetTypes()}
          />
        );
      }

      // Render the widget with error boundary protection
      // Pass data prop directly - widgets handle their own prop types
      return (
        <WidgetErrorBoundary widgetType={widgetType}>
          <WidgetComponent data={data} />
        </WidgetErrorBoundary>
      );
    },
  });

  // This component renders nothing - it's purely for side effects
  return null;
}
