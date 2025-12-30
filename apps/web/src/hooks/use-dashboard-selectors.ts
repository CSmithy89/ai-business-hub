'use client';

/**
 * Dashboard Selector Hooks
 *
 * Specialized selector hooks for efficient re-renders when accessing
 * dashboard state. Each hook subscribes to a specific slice of state,
 * preventing unnecessary re-renders when unrelated state changes.
 *
 * These hooks use Zustand's subscribeWithSelector middleware internally,
 * which performs shallow equality checks on the selected state.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
 * Epic: DM-04 | Story: DM-04.2
 */

import {
  useDashboardStateStore,
  type DashboardStateStore,
} from '@/stores/dashboard-state-store';
import type {
  ProjectStatusState,
  MetricsState,
  ActivityState,
  AlertEntry,
  ErrorState,
} from '@/lib/schemas/dashboard-state';

// =============================================================================
// WIDGET SELECTORS
// =============================================================================

/**
 * Select project status widget state.
 *
 * Only re-renders when projectStatus changes.
 *
 * @returns ProjectStatusState or null if not loaded
 *
 * @example
 * ```tsx
 * function ProjectStatusCard() {
 *   const status = useProjectStatus();
 *   if (!status) return <Skeleton />;
 *   return <Card>{status.name}: {status.progress}%</Card>;
 * }
 * ```
 */
export function useProjectStatus(): ProjectStatusState | null {
  return useDashboardStateStore((state) => state.widgets.projectStatus);
}

/**
 * Select metrics widget state.
 *
 * Only re-renders when metrics changes.
 *
 * @returns MetricsState or null if not loaded
 *
 * @example
 * ```tsx
 * function MetricsPanel() {
 *   const metrics = useMetrics();
 *   if (!metrics) return <Skeleton />;
 *   return <MetricsList items={metrics.metrics} />;
 * }
 * ```
 */
export function useMetrics(): MetricsState | null {
  return useDashboardStateStore((state) => state.widgets.metrics);
}

/**
 * Select activity/team activity widget state.
 *
 * Only re-renders when activity changes.
 *
 * @returns ActivityState or null if not loaded
 *
 * @example
 * ```tsx
 * function ActivityFeed() {
 *   const activity = useTeamActivity();
 *   if (!activity) return <Skeleton />;
 *   return <ActivityList items={activity.activities} />;
 * }
 * ```
 */
export function useTeamActivity(): ActivityState | null {
  return useDashboardStateStore((state) => state.widgets.activity);
}

/**
 * Select non-dismissed alerts only.
 *
 * Filters out dismissed alerts automatically.
 * Only re-renders when alerts change.
 *
 * @returns Array of non-dismissed AlertEntry objects
 *
 * @example
 * ```tsx
 * function AlertsBanner() {
 *   const alerts = useAlerts();
 *   if (alerts.length === 0) return null;
 *   return <AlertStack alerts={alerts} />;
 * }
 * ```
 */
export function useAlerts(): AlertEntry[] {
  return useDashboardStateStore((state) =>
    state.widgets.alerts.filter((alert) => !alert.dismissed)
  );
}

/**
 * Select all alerts including dismissed ones.
 *
 * @returns Array of all AlertEntry objects
 */
export function useAllAlerts(): AlertEntry[] {
  return useDashboardStateStore((state) => state.widgets.alerts);
}

// =============================================================================
// LOADING SELECTORS
// =============================================================================

/**
 * Select whether a specific widget is loading.
 *
 * @param widgetAgent - Agent ID associated with the widget
 * @returns boolean indicating if the widget is loading
 *
 * @example
 * ```tsx
 * function ProjectStatus() {
 *   const isLoading = useWidgetLoading('navi');
 *   if (isLoading) return <Spinner />;
 *   // ...
 * }
 * ```
 */
export function useWidgetLoading(widgetAgent: string): boolean {
  return useDashboardStateStore(
    (state) =>
      state.loading.isLoading &&
      state.loading.loadingAgents.includes(widgetAgent)
  );
}

/**
 * Select whether any loading is in progress.
 *
 * @returns boolean indicating if any agent is loading
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const isLoading = useAnyLoading();
 *   return <DashboardContent isLoading={isLoading} />;
 * }
 * ```
 */
export function useAnyLoading(): boolean {
  return useDashboardStateStore((state) => state.loading.isLoading);
}

/**
 * Select the list of currently loading agents.
 *
 * @returns Array of agent IDs that are currently loading
 */
export function useLoadingAgents(): string[] {
  return useDashboardStateStore((state) => state.loading.loadingAgents);
}

// =============================================================================
// ERROR SELECTORS
// =============================================================================

/**
 * Select error for a specific widget/agent.
 *
 * @param agentId - Agent ID to check for errors
 * @returns Error message string or undefined if no error
 *
 * @example
 * ```tsx
 * function MetricsWidget() {
 *   const error = useWidgetError('pulse');
 *   if (error) return <ErrorCard message={error} />;
 *   // ...
 * }
 * ```
 */
export function useWidgetError(agentId: string): string | undefined {
  return useDashboardStateStore((state) => state.errors[agentId]);
}

/**
 * Select all errors.
 *
 * @returns ErrorState (Record<string, string>) of all agent errors
 */
export function useErrors(): ErrorState {
  return useDashboardStateStore((state) => state.errors);
}

/**
 * Check if any errors exist.
 *
 * @returns boolean indicating if any errors are present
 */
export function useHasErrors(): boolean {
  return useDashboardStateStore((state) => Object.keys(state.errors).length > 0);
}

// =============================================================================
// CONTEXT SELECTORS
// =============================================================================

/**
 * Select the active project ID.
 *
 * @returns Active project ID or null
 */
export function useActiveProject(): string | null {
  return useDashboardStateStore((state) => state.activeProject);
}

/**
 * Select the last update timestamp.
 *
 * @returns Unix timestamp in milliseconds
 */
export function useLastUpdated(): number {
  return useDashboardStateStore((state) => state.timestamp);
}

// =============================================================================
// ACTION SELECTORS
// =============================================================================

/**
 * Selector that extracts all actions from the store in a single subscription.
 * Actions are stable references that don't change between renders.
 */
const actionsSelector = (s: DashboardStateStore) => ({
  setFullState: s.setFullState,
  updateState: s.updateState,
  setActiveProject: s.setActiveProject,
  setProjectStatus: s.setProjectStatus,
  setMetrics: s.setMetrics,
  setActivity: s.setActivity,
  addAlert: s.addAlert,
  dismissAlert: s.dismissAlert,
  clearAlerts: s.clearAlerts,
  setLoading: s.setLoading,
  setError: s.setError,
  clearErrors: s.clearErrors,
  reset: s.reset,
});

/**
 * Select all store actions without state.
 *
 * Returns stable action references that don't cause re-renders.
 * Uses a single store subscription for efficiency.
 *
 * @returns Object with all store actions
 */
export function useDashboardActions() {
  return useDashboardStateStore(actionsSelector);
}
