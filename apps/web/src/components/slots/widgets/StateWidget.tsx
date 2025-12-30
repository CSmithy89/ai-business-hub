'use client';

/**
 * State-Driven Widget Wrappers
 *
 * Higher-order components that connect widgets to the Zustand dashboard state store.
 * Widgets automatically re-render when their corresponding state updates via
 * CopilotKit's AG-UI state synchronization.
 *
 * These wrappers:
 * - Subscribe to specific state slices using selector hooks
 * - Show LoadingWidget when loading AND no cached data
 * - Show ErrorWidget when agent errors AND no cached data
 * - Transform state schema data to widget prop formats
 * - Apply smooth animations for widget transitions
 *
 * @see docs/modules/bm-dm/stories/dm-04-4-realtime-widget-updates.md
 * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
 * Epic: DM-04 | Story: DM-04.4
 */

import {
  useProjectStatus,
  useMetrics,
  useTeamActivity,
  useAlerts,
  useAnyLoading,
  useWidgetError,
} from '@/hooks/use-dashboard-selectors';
import { useDashboardStateStore } from '@/stores/dashboard-state-store';
import { LoadingWidget } from './LoadingWidget';
import { ErrorWidget } from './ErrorWidget';
import { ProjectStatusWidget } from './ProjectStatusWidget';
import { MetricsWidget } from './MetricsWidget';
import { TeamActivityWidget } from './TeamActivityWidget';
import { AlertWidget } from './AlertWidget';
import type {
  ProjectStatusData,
  MetricsData,
  TeamActivityData,
  AlertData,
} from '../types';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format Unix timestamp (ms) to relative time string
 *
 * @param ts Unix timestamp in milliseconds
 * @returns Relative time string ("Just now", "5m ago", etc.)
 *
 * @example
 * formatTimestamp(Date.now() - 30000) // "30s ago"
 * formatTimestamp(Date.now() - 300000) // "5m ago"
 */
export function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;

  if (diff < 1000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return new Date(ts).toLocaleDateString();
}

/**
 * Convert state schema status to widget prop status format
 * State uses hyphens: 'on-track', 'at-risk', 'behind'
 * Widget uses underscores: 'on_track', 'at_risk', 'behind'
 */
function convertStatusFormat(
  status: 'on-track' | 'at-risk' | 'behind' | 'completed'
): 'on_track' | 'at_risk' | 'behind' {
  if (status === 'on-track') return 'on_track';
  if (status === 'at-risk') return 'at_risk';
  if (status === 'completed') return 'on_track'; // Treat completed as on-track
  return 'behind';
}

// =============================================================================
// STATE WIDGET COMPONENTS
// =============================================================================

/**
 * State-connected Project Status Widget
 *
 * Subscribes to project status state from the Zustand store.
 * Handles loading, error, and data states automatically.
 *
 * Agent: navi (Project Navigator)
 *
 * @returns JSX.Element | null
 */
export function StateProjectStatusWidget() {
  const status = useProjectStatus();
  const isLoading = useAnyLoading();
  const error = useWidgetError('navi');

  // Show loading only when loading AND no cached data
  if (isLoading && !status) {
    return (
      <div className="animate-in fade-in-50 duration-300" data-testid="state-project-status-loading">
        <LoadingWidget type="ProjectStatus" />
      </div>
    );
  }

  // Show error only when error AND no cached data
  if (error && !status) {
    return (
      <div className="animate-in fade-in-50 duration-300" data-testid="state-project-status-error">
        <ErrorWidget message={error} widgetType="ProjectStatus" />
      </div>
    );
  }

  // No data yet - render nothing
  if (!status) {
    return null;
  }

  // Transform state schema to widget data format
  const widgetData: ProjectStatusData = {
    projectId: status.projectId,
    projectName: status.name,
    status: convertStatusFormat(status.status),
    progress: status.progress,
    tasksCompleted: status.tasksCompleted,
    tasksTotal: status.tasksTotal,
    // Note: dueDate not in state schema, but optional in widget
  };

  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="state-project-status">
      <ProjectStatusWidget data={widgetData} />
    </div>
  );
}

/**
 * State-connected Metrics Widget
 *
 * Subscribes to metrics state from the Zustand store.
 * Transforms state metric format to widget metric format.
 *
 * Agent: pulse (Metrics Agent)
 *
 * @returns JSX.Element | null
 */
export function StateMetricsWidget() {
  const metrics = useMetrics();
  const isLoading = useAnyLoading();
  const error = useWidgetError('pulse');

  // Show loading only when loading AND no cached data
  if (isLoading && !metrics) {
    return (
      <div className="animate-in fade-in-50 duration-300" data-testid="state-metrics-loading">
        <LoadingWidget type="Metrics" />
      </div>
    );
  }

  // Show error only when error AND no cached data
  if (error && !metrics) {
    return (
      <div className="animate-in fade-in-50 duration-300" data-testid="state-metrics-error">
        <ErrorWidget message={error} widgetType="Metrics" />
      </div>
    );
  }

  // No data yet - render nothing
  if (!metrics) {
    return null;
  }

  // Transform state schema to widget data format
  // State uses: trend ('up'|'down'|'neutral'), changePercent
  // Widget uses: change { value, direction }
  const widgetData: MetricsData = {
    title: metrics.title,
    metrics: metrics.metrics.map((m) => ({
      label: m.label,
      value: m.value,
      icon: m.unit, // Map unit to icon (optional, may need adjustment)
      change:
        m.trend && m.trend !== 'neutral' && m.changePercent !== undefined
          ? {
              value: Math.abs(m.changePercent),
              direction: m.trend,
            }
          : undefined,
    })),
  };

  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="state-metrics">
      <MetricsWidget data={widgetData} />
    </div>
  );
}

/**
 * State-connected Team Activity Widget
 *
 * Subscribes to activity state from the Zustand store.
 * Formats timestamps to relative time strings.
 *
 * Agent: herald (Activity Agent)
 *
 * @returns JSX.Element | null
 */
export function StateActivityWidget() {
  const activity = useTeamActivity();
  const isLoading = useAnyLoading();
  const error = useWidgetError('herald');

  // Show loading only when loading AND no cached data
  if (isLoading && !activity) {
    return (
      <div className="animate-in fade-in-50 duration-300" data-testid="state-activity-loading">
        <LoadingWidget type="TeamActivity" />
      </div>
    );
  }

  // Show error only when error AND no cached data
  if (error && !activity) {
    return (
      <div className="animate-in fade-in-50 duration-300" data-testid="state-activity-error">
        <ErrorWidget message={error} widgetType="TeamActivity" />
      </div>
    );
  }

  // No data yet - render nothing
  if (!activity) {
    return null;
  }

  // Transform state schema to widget data format
  // State uses: timestamp (number)
  // Widget uses: time (string - formatted)
  const widgetData: TeamActivityData = {
    title: 'Recent Activity',
    activities: activity.activities.map((a) => ({
      user: a.user,
      action: a.action,
      target: a.target,
      time: formatTimestamp(a.timestamp),
    })),
  };

  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="state-activity">
      <TeamActivityWidget data={widgetData} />
    </div>
  );
}

/**
 * State-connected Alerts Widget
 *
 * Subscribes to alerts state from the Zustand store.
 * Renders a stack of AlertWidget components for non-dismissed alerts.
 *
 * Agents: any (alerts can come from any agent)
 *
 * @returns JSX.Element | null
 */
export function StateAlertsWidget() {
  const alerts = useAlerts();
  const dismissAlert = useDashboardStateStore((s) => s.dismissAlert);

  // No alerts to display
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 animate-in fade-in-50 duration-300" data-testid="state-alerts">
      {alerts.map((alert) => {
        // Transform state schema to widget data format
        // State uses: type ('error'|'warning'|'info'|'success')
        // Widget uses: severity (same values)
        const widgetData: AlertData = {
          severity: alert.type,
          title: alert.title,
          message: alert.message,
          action:
            alert.actionLabel && alert.actionUrl
              ? { label: alert.actionLabel, href: alert.actionUrl }
              : undefined,
        };

        return (
          <div
            key={alert.id}
            className="relative"
            data-testid={`state-alert-${alert.id}`}
          >
            <AlertWidget data={widgetData} />
            {/* Dismiss button if alert is dismissable */}
            {alert.dismissable && (
              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Dismiss alert"
                data-testid={`dismiss-alert-${alert.id}`}
              >
                <svg
                  className="h-4 w-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
