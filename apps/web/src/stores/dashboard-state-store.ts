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
import type {
  DashboardState,
  DashboardStateUpdate,
  ProjectStatusState,
  MetricsState,
  ActivityState,
  AlertEntry,
  TaskProgress,
  TaskStep,
} from '@/lib/schemas/dashboard-state';
import {
  createInitialDashboardState,
  validateDashboardState,
} from '@/lib/schemas/dashboard-state';
import { DM_CONSTANTS } from '@/lib/dm-constants';

// =============================================================================
// CONSTANTS (DM-08.6: Imported from centralized dm-constants)
// =============================================================================

const { MAX_ALERTS, MAX_ACTIVITIES, MAX_METRICS, MAX_ACTIVE_TASKS } =
  DM_CONSTANTS.DASHBOARD;

// =============================================================================
// STORE INTERFACE
// =============================================================================

/**
 * Dashboard State Store Interface
 *
 * Extends the base DashboardState with actions for state manipulation.
 * DM-08.6: Added pre-computed derived state (activeAlerts) for optimized selectors.
 */
export interface DashboardStateStore extends DashboardState {
  // Pre-computed derived state (DM-08.6)
  /** Pre-computed list of non-dismissed alerts (avoids filtering in selectors) */
  activeAlerts: AlertEntry[];
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

  // Task progress actions (DM-05.4)
  /** Set all active tasks (replaces existing) */
  setActiveTasks: (tasks: TaskProgress[]) => void;
  /** Add a new task to active tasks */
  addTask: (task: TaskProgress) => void;
  /** Update a task by ID with partial data */
  updateTask: (taskId: string, update: Partial<TaskProgress>) => void;
  /** Update a specific step within a task */
  updateTaskStep: (taskId: string, stepIndex: number, update: Partial<TaskStep>) => void;
  /** Remove a task by ID */
  removeTask: (taskId: string) => void;

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
    // Pre-computed derived state (DM-08.6)
    activeAlerts: [],

    // =========================================================================
    // FULL STATE UPDATES
    // =========================================================================

    setFullState: (state: DashboardState) => {
      const validated = validateDashboardState(state);
      if (validated) {
        // DM-08.6: Pre-compute activeAlerts on full state update
        const activeAlerts = validated.widgets.alerts.filter((a) => !a.dismissed);
        set({ ...validated, activeAlerts });
      } else {
        console.warn('[DashboardStateStore] Invalid state rejected');
      }
    },

    updateState: (update: DashboardStateUpdate) => {
      set((current) => {
        // Deep merge for nested objects
        const newWidgets = update.widgets
          ? { ...current.widgets, ...update.widgets }
          : current.widgets;

        // DM-08.6: Pre-compute activeAlerts if alerts changed
        const newAlerts = newWidgets.alerts;
        const activeAlerts =
          newAlerts !== current.widgets.alerts
            ? newAlerts.filter((a) => !a.dismissed)
            : current.activeAlerts;

        return {
          ...current,
          ...update,
          timestamp: Date.now(),
          widgets: newWidgets,
          loading: update.loading
            ? { ...current.loading, ...update.loading }
            : current.loading,
          errors: update.errors
            ? { ...current.errors, ...update.errors }
            : current.errors,
          // Active tasks from agent updates replace existing (DM-05.4)
          activeTasks: update.activeTasks ?? current.activeTasks,
          activeAlerts,
        };
      });
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
          // DM-08.6: Cap metrics at MAX_METRICS
          metrics: metrics
            ? {
                ...metrics,
                metrics: metrics.metrics.slice(0, MAX_METRICS),
              }
            : null,
        },
      }));
    },

    setActivity: (activity: ActivityState | null) => {
      set((state) => ({
        timestamp: Date.now(),
        widgets: {
          ...state.widgets,
          // DM-08.6: Cap activities at MAX_ACTIVITIES
          activity: activity
            ? {
                ...activity,
                activities: activity.activities.slice(0, MAX_ACTIVITIES),
              }
            : null,
        },
      }));
    },

    addAlert: (alert: AlertEntry) => {
      set((state) => {
        // Prepend new alert and cap at MAX_ALERTS
        const newAlerts = [alert, ...state.widgets.alerts].slice(0, MAX_ALERTS);
        // DM-08.6: Pre-compute activeAlerts
        const activeAlerts = newAlerts.filter((a) => !a.dismissed);
        return {
          timestamp: Date.now(),
          widgets: {
            ...state.widgets,
            alerts: newAlerts,
          },
          activeAlerts,
        };
      });
    },

    dismissAlert: (alertId: string) => {
      set((state) => {
        const newAlerts = state.widgets.alerts.map((a) =>
          a.id === alertId ? { ...a, dismissed: true } : a
        );
        // DM-08.6: Pre-compute activeAlerts (just remove the dismissed one)
        const activeAlerts = state.activeAlerts.filter((a) => a.id !== alertId);
        return {
          timestamp: Date.now(),
          widgets: {
            ...state.widgets,
            alerts: newAlerts,
          },
          activeAlerts,
        };
      });
    },

    clearAlerts: () => {
      set((state) => ({
        timestamp: Date.now(),
        widgets: {
          ...state.widgets,
          alerts: [],
        },
        // DM-08.6: Clear pre-computed activeAlerts
        activeAlerts: [],
      }));
    },

    // =========================================================================
    // LOADING STATE
    // =========================================================================

    setLoading: (isLoading: boolean, agents: string[] = []) => {
      set({
        timestamp: Date.now(),
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
    // TASK PROGRESS (DM-05.4)
    // =========================================================================

    setActiveTasks: (tasks: TaskProgress[]) => {
      set({ activeTasks: tasks, timestamp: Date.now() });
    },

    addTask: (task: TaskProgress) => {
      set((state) => ({
        // DM-08.6: Cap active tasks at MAX_ACTIVE_TASKS
        activeTasks: [...state.activeTasks, task].slice(-MAX_ACTIVE_TASKS),
        timestamp: Date.now(),
      }));
    },

    updateTask: (taskId: string, update: Partial<TaskProgress>) => {
      set((state) => ({
        activeTasks: state.activeTasks.map((t) =>
          t.taskId === taskId ? { ...t, ...update } : t
        ),
        timestamp: Date.now(),
      }));
    },

    updateTaskStep: (taskId: string, stepIndex: number, update: Partial<TaskStep>) => {
      set((state) => ({
        activeTasks: state.activeTasks.map((t) => {
          if (t.taskId !== taskId) return t;
          return {
            ...t,
            steps: t.steps.map((s, i) =>
              i === stepIndex ? { ...s, ...update } : s
            ),
          };
        }),
        timestamp: Date.now(),
      }));
    },

    removeTask: (taskId: string) => {
      set((state) => ({
        activeTasks: state.activeTasks.filter((t) => t.taskId !== taskId),
        timestamp: Date.now(),
      }));
    },

    // =========================================================================
    // RESET
    // =========================================================================

    reset: () => {
      // DM-08.6: Also reset pre-computed activeAlerts
      set({ ...createInitialDashboardState(), activeAlerts: [] });
    },
  }))
);

// =============================================================================
// EXPORTS (DM-08.6: Re-export MAX constants from centralized dm-constants)
// =============================================================================

export { MAX_ALERTS, MAX_ACTIVITIES, MAX_METRICS, MAX_ACTIVE_TASKS };
