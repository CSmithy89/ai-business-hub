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
 * @see docs/modules/bm-dm/stories/dm-01-3-base-widget-components.md
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { WidgetErrorFallback } from './WidgetErrorFallback';
import { getWidgetComponent } from './widget-registry';
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
          'Widget type identifier (ProjectStatus, TaskList, Metrics, Alert)',
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
    render: ({ args }) => {
      const { type, data } = args as RenderWidgetArgs;

      // Get the widget component from the registry
      const WidgetComponent = getWidgetComponent(type);

      // Handle unknown widget types
      if (!WidgetComponent) {
        return <WidgetErrorFallback widgetType={type} />;
      }

      // Render the widget with error boundary protection
      // Pass data prop directly - widgets handle their own prop types
      return (
        <WidgetErrorBoundary widgetType={type}>
          <WidgetComponent data={data} />
        </WidgetErrorBoundary>
      );
    },
  });

  // This component renders nothing - it's purely for side effects
  return null;
}
