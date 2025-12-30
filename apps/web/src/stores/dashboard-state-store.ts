/**
 * Dashboard State Store
 *
 * Zustand store for managing dashboard shared state with CopilotKit integration.
 * Subscribes to agent state updates via useCoAgentStateRender and provides
 * optimistic updates for local interactions.
 *
 * The store manages:
 * - Widget state (projectStatus, metrics, activity, alerts)
 * - Loading state with agent tracking
 * - Error state per agent
 * - Active project context
 *
 * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
 * Epic: DM-04 | Story: DM-04.2
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  type DashboardState,
  type DashboardStateUpdate,
  type ProjectStatusState,
  type MetricsState,
  type ActivityState,
  type AlertEntry,
  createInitialDashboardState,
  validateDashboardState,
} from '@/lib/schemas/dashboard-state';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum number of alerts to keep in state */
const MAX_ALERTS = 50;

// =============================================================================
// STORE INTERFACE
// =============================================================================

/**
 * Dashboard State Store Interface
 *
 * Extends the base DashboardState with actions for state manipulation.
 */
export interface DashboardStateStore extends DashboardState {
  // Full state updates
  /** Set the full state from agent (validates before applying) */
  setFullState: (state: DashboardState) => void;
  /** Apply a partial state update (merges with existing state) */
  updateState: (update: DashboardStateUpdate) => void;

  // Active project
  /** Set the currently focused project ID */
  setActiveProject: (projectId: string | null) => void;

  // Widget-specific setters
  /** Set project status widget state */
  setProjectStatus: (status: ProjectStatusState | null) => void;
  /** Set metrics widget state */
  setMetrics: (metrics: MetricsState | null) => void;
  /** Set activity widget state */
  setActivity: (activity: ActivityState | null) => void;
  /** Add a new alert (prepends to list, caps at MAX_ALERTS) */
  addAlert: (alert: AlertEntry) => void;
  /** Mark an alert as dismissed */
  dismissAlert: (alertId: string) => void;
  /** Clear all alerts */
  clearAlerts: () => void;

  // Loading state
  /** Set loading state with optional agent list */
  setLoading: (isLoading: boolean, agents?: string[]) => void;

  // Error state
  /** Set or clear an error for a specific agent */
  setError: (agentId: string, error: string | null) => void;
  /** Clear all errors */
  clearErrors: () => void;

  // Reset
  /** Reset store to initial state */
  reset: () => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

/**
 * Dashboard State Store
 *
 * Uses subscribeWithSelector middleware for efficient re-renders.
 * Components can subscribe to specific state slices and only re-render
 * when those slices change.
 */
export const useDashboardStateStore = create<DashboardStateStore>()(
  subscribeWithSelector((set) => ({
    // Initial state
    ...createInitialDashboardState(),

    // =========================================================================
    // FULL STATE UPDATES
    // =========================================================================

    setFullState: (state: DashboardState) => {
      const validated = validateDashboardState(state);
      if (validated) {
        set(validated);
      } else {
        console.warn('[DashboardStateStore] Invalid state rejected');
      }
    },

    updateState: (update: DashboardStateUpdate) => {
      set((current) => ({
        ...current,
        ...update,
        timestamp: Date.now(),
        // Deep merge for nested objects
        widgets: update.widgets
          ? { ...current.widgets, ...update.widgets }
          : current.widgets,
        loading: update.loading
          ? { ...current.loading, ...update.loading }
          : current.loading,
        errors: update.errors
          ? { ...current.errors, ...update.errors }
          : current.errors,
      }));
    },

    // =========================================================================
    // ACTIVE PROJECT
    // =========================================================================

    setActiveProject: (projectId: string | null) => {
      set({ activeProject: projectId, timestamp: Date.now() });
    },

    // =========================================================================
    // WIDGET SETTERS
    // =========================================================================

    setProjectStatus: (status: ProjectStatusState | null) => {
      set((state) => ({
        timestamp: Date.now(),
        widgets: {
          ...state.widgets,
          projectStatus: status,
        },
      }));
    },

    setMetrics: (metrics: MetricsState | null) => {
      set((state) => ({
        timestamp: Date.now(),
        widgets: {
          ...state.widgets,
          metrics,
        },
      }));
    },

    setActivity: (activity: ActivityState | null) => {
      set((state) => ({
        timestamp: Date.now(),
        widgets: {
          ...state.widgets,
          activity,
        },
      }));
    },

    addAlert: (alert: AlertEntry) => {
      set((state) => ({
        timestamp: Date.now(),
        widgets: {
          ...state.widgets,
          // Prepend new alert and cap at MAX_ALERTS
          alerts: [alert, ...state.widgets.alerts].slice(0, MAX_ALERTS),
        },
      }));
    },

    dismissAlert: (alertId: string) => {
      set((state) => ({
        timestamp: Date.now(),
        widgets: {
          ...state.widgets,
          alerts: state.widgets.alerts.map((a) =>
            a.id === alertId ? { ...a, dismissed: true } : a
          ),
        },
      }));
    },

    clearAlerts: () => {
      set((state) => ({
        timestamp: Date.now(),
        widgets: {
          ...state.widgets,
          alerts: [],
        },
      }));
    },

    // =========================================================================
    // LOADING STATE
    // =========================================================================

    setLoading: (isLoading: boolean, agents: string[] = []) => {
      set({
        loading: {
          isLoading,
          loadingAgents: agents,
          startedAt: isLoading ? Date.now() : undefined,
        },
      });
    },

    // =========================================================================
    // ERROR STATE
    // =========================================================================

    setError: (agentId: string, error: string | null) => {
      set((state) => {
        const errors = { ...state.errors };
        if (error === null) {
          delete errors[agentId];
        } else {
          errors[agentId] = error;
        }
        return { errors, timestamp: Date.now() };
      });
    },

    clearErrors: () => {
      set({ errors: {}, timestamp: Date.now() });
    },

    // =========================================================================
    // RESET
    // =========================================================================

    reset: () => {
      set(createInitialDashboardState());
    },
  }))
);

// =============================================================================
// EXPORTS
// =============================================================================

export { MAX_ALERTS };
