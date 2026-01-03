'use client';

/**
 * Dashboard Slots Component - Dual-Mode Widget Rendering
 *
 * Supports both:
 * 1. Tool-call rendering (useCopilotAction) - for explicit agent responses (DM-03)
 * 2. State-driven rendering (state widgets) - for real-time updates (DM-04)
 *
 * The component operates in three modes:
 * - 'hybrid' (default): Both tool calls AND state updates render widgets
 * - 'tool-only': Only render from tool calls (DM-03 compatibility mode)
 * - 'state-only': Only render from state updates
 *
 * DM-04.4 Updates:
 * - Added mode prop for hybrid/tool-only/state-only rendering
 * - Added useAgentStateSync hook for state synchronization
 * - Added state widget grid rendering
 * - Added smooth animations with Tailwind CSS transitions
 *
 * DM-11.10 Updates:
 * - Added retry callback wiring for ErrorWidget
 * - Connected retry button to dashboard state refresh
 *
 * @example
 * // Default hybrid mode - both tool calls and state work
 * <DashboardSlots />
 *
 * // Tool-only mode for DM-03 compatibility
 * <DashboardSlots mode="tool-only" />
 *
 * // State-only mode for pure real-time
 * <DashboardSlots mode="state-only" />
 *
 * @see docs/modules/bm-dm/stories/dm-01-2-slot-system-foundation.md
 * @see docs/modules/bm-dm/stories/dm-03-3-widget-rendering-pipeline.md
 * @see docs/modules/bm-dm/stories/dm-04-4-realtime-widget-updates.md
 * @see docs/modules/bm-dm/stories/dm-11-10-wire-errorwidget-retry.md
 */

import { useCallback } from 'react';
import { useCopilotAction } from '@copilotkit/react-core';
import { useAgentStateSync } from '@/hooks/use-agent-state-sync';
import { useDashboardStateStore } from '@/stores/dashboard-state-store';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { LoadingWidget, ErrorWidget } from './widgets';
import {
  StateProjectStatusWidget,
  StateMetricsWidget,
  StateActivityWidget,
  StateAlertsWidget,
} from './widgets/StateWidget';
import { getWidgetComponent, getRegisteredWidgetTypes } from './widget-registry';
import { validateAndLogWidgetData } from '@/lib/utils/validate-widget';
import type { RenderWidgetArgs, WidgetData } from './types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * DashboardSlots Props
 */
export interface DashboardSlotsProps {
  /**
   * Rendering mode:
   * - 'hybrid' (default): Both tool calls AND state updates render widgets
   * - 'tool-only': Only render from tool calls (DM-03 behavior)
   * - 'state-only': Only render from state updates
   */
  mode?: 'hybrid' | 'tool-only' | 'state-only';
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * DashboardSlots - Dual-Mode Widget Rendering
 *
 * Renders widgets from both tool calls (DM-03) and state updates (DM-04).
 * In hybrid mode, tool-rendered widgets appear in the CopilotKit chat,
 * while state-driven widgets appear in the dashboard grid.
 */
export function DashboardSlots({ mode = 'hybrid' }: DashboardSlotsProps) {
  // Initialize state sync (subscribes to agent state via CopilotKit)
  // This bridges agent state emissions to the Zustand store
  useAgentStateSync({
    debug: process.env.NODE_ENV === 'development',
  });

  // Get store actions for retry handling (DM-11.10)
  const clearErrors = useDashboardStateStore((s) => s.clearErrors);

  /**
   * Handle retry for tool-call errors.
   *
   * In the context of CopilotKit tool-call rendering, we can't directly
   * re-trigger the action. Instead, this callback:
   * 1. Clears any stored errors
   * 2. Logs the retry attempt for debugging
   * 3. Notifies user to resend their request
   *
   * Full retry functionality requires re-sending the chat message,
   * which is handled by CopilotKit's message history.
   */
  const handleToolRetry = useCallback(() => {
    console.log('[DashboardSlots] Tool retry requested - clearing errors');
    clearErrors();
    // Note: Full retry would require re-sending the original message
    // For now, this clears error state and allows the user to retry manually
  }, [clearErrors]);

  // Tool-call rendering (for explicit agent responses - DM-03)
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
      // Skip tool rendering in state-only mode
      if (mode === 'state-only') {
        return <></>;
      }

      // Guard against undefined args during initial render
      const safeArgs = (args || {}) as RenderWidgetArgs;
      const { type, data } = safeArgs;
      const widgetType = (type as string) || 'Unknown';

      // Show loading state during inProgress or executing
      if (status === 'inProgress' || status === 'executing') {
        return (
          <div className="animate-in fade-in-50 duration-300">
            <LoadingWidget type={widgetType} />
          </div>
        );
      }

      // Note: CopilotKit status is 'complete' when done - no explicit 'error' status
      // Error handling is done via data.error field from agent responses

      // Validate that we have data to render
      if (data === null || data === undefined) {
        return (
          <div className="animate-in fade-in-50 duration-300">
            <ErrorWidget
              message="No data provided for widget"
              widgetType={widgetType}
              onRetry={handleToolRetry}
            />
          </div>
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
          <div className="animate-in fade-in-50 duration-300">
            <ErrorWidget
              message={errorMessage}
              widgetType={widgetType}
              onRetry={handleToolRetry}
            />
          </div>
        );
      }

      // Get the widget component from the registry
      const WidgetComponent = getWidgetComponent(widgetType);

      // Handle unknown widget types
      if (!WidgetComponent) {
        return (
          <div className="animate-in fade-in-50 duration-300">
            <ErrorWidget
              message={`Unknown widget type: ${widgetType}`}
              widgetType={widgetType}
              availableTypes={getRegisteredWidgetTypes()}
              onRetry={handleToolRetry}
            />
          </div>
        );
      }

      // Validate widget data before rendering (DM-08.1)
      const validationResult = validateAndLogWidgetData<WidgetData>(widgetType, data);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        return (
          <div className="animate-in fade-in-50 duration-300">
            <ErrorWidget
              message={`Invalid widget data: ${errorMessages}`}
              widgetType={widgetType}
              onRetry={handleToolRetry}
            />
          </div>
        );
      }

      // Render the widget with error boundary protection
      // Pass validated data - type is now confirmed correct
      // Cast to WidgetData since validation ensures correct structure
      return (
        <div className="widget-from-tool animate-in fade-in-50 duration-300">
          <WidgetErrorBoundary widgetType={widgetType}>
            <WidgetComponent data={validationResult.data as WidgetData} />
          </WidgetErrorBoundary>
        </div>
      );
    },
  });

  // State-driven widgets (skip in tool-only mode)
  if (mode === 'tool-only') {
    return null;
  }

  // Render state-driven widget grid
  return (
    <div className="dashboard-state-widgets space-y-4" data-testid="dashboard-state-widgets">
      {/* Alerts at top - high visibility */}
      <StateAlertsWidget />

      {/* Main widgets in responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StateProjectStatusWidget />
        <StateMetricsWidget />
        <StateActivityWidget />
      </div>
    </div>
  );
}
