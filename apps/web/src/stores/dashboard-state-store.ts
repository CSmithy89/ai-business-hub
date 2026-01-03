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
  STATE_VERSION,
} from '@/lib/schemas/dashboard-state';
import { DM_CONSTANTS } from '@/lib/dm-constants';
import {
  saveDashboardState,
  getDashboardState,
} from '@/lib/api/dashboard-state';
import {
  applyChange,
  type StateChange,
} from '@/lib/realtime/state-diff';
import {
  migrateState,
  needsMigration,
  getDefaultState,
} from '@/lib/storage/state-migrations';

// =============================================================================
// CONSTANTS (DM-08.6: Imported from centralized dm-constants)
// =============================================================================

const { MAX_ALERTS, MAX_ACTIVITIES, MAX_METRICS, MAX_ACTIVE_TASKS } =
  DM_CONSTANTS.DASHBOARD;

/** Max age for dismissed alerts before cleanup (1 hour) */
const DISMISSED_ALERT_MAX_AGE_MS = 60 * 60 * 1000;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a task is still active (not completed/cancelled/failed).
 */
function isActiveTask(task: TaskProgress): boolean {
  return task.status === 'pending' || task.status === 'running';
}

/**
 * Prioritize active tasks when slicing to MAX_ACTIVE_TASKS.
 * Ensures completed/cancelled tasks don't push out active ones.
 */
function prioritizeActiveTasks(tasks: TaskProgress[]): TaskProgress[] {
  const active = tasks.filter(isActiveTask);
  const inactive = tasks.filter((t) => !isActiveTask(t));

  // Keep all active tasks (up to limit), then fill remaining slots with inactive
  const remainingSlots = Math.max(0, MAX_ACTIVE_TASKS - active.length);
  return [...active, ...inactive.slice(-remainingSlots)].slice(-MAX_ACTIVE_TASKS);
}

/**
 * Filter out old dismissed alerts to prevent memory buildup.
 */
function cleanupDismissedAlerts(alerts: AlertEntry[]): AlertEntry[] {
  const now = Date.now();
  return alerts.filter((alert) => {
    if (!alert.dismissed) return true;
    // Keep dismissed alerts for up to 1 hour for undo purposes
    const alertTime = alert.timestamp ? new Date(alert.timestamp).getTime() : now;
    return now - alertTime < DISMISSED_ALERT_MAX_AGE_MS;
  });
}

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

  // Sync state (DM-11.1)
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Timestamp of last successful sync */
  lastSyncedAt: number | null;
  /** Error from last sync attempt */
  syncError: string | null;

  // Sync actions (DM-11.1)
  /** Sync current state to server */
  syncToServer: () => Promise<void>;
  /** Restore state from server (e.g., on login) */
  restoreFromServer: () => Promise<boolean>;
  /** Clear sync error */
  clearSyncError: () => void;

  // WebSocket sync state (DM-11.2)
  /** Whether WebSocket is connected for state sync */
  wsConnected: boolean;
  /** Current state version for conflict detection */
  stateVersion: number;

  // WebSocket sync actions (DM-11.2)
  /** Apply a remote state update from WebSocket */
  applyRemoteUpdate: (path: string, value: unknown, version: number) => void;
  /** Apply full state from server (reconnection recovery) */
  applyFullState: (state: Record<string, unknown>, version: number) => void;
  /** Set WebSocket connection status */
  setWsConnected: (connected: boolean) => void;
  /** Increment state version (called on local changes) */
  incrementVersion: () => number;
  /** Get current state as plain object for sync */
  getStateForSync: () => Record<string, unknown>;
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
  subscribeWithSelector((set, get) => ({
    // Initial state
    ...createInitialDashboardState(),
    // Pre-computed derived state (DM-08.6)
    activeAlerts: [],
    // Sync state (DM-11.1)
    isSyncing: false,
    lastSyncedAt: null,
    syncError: null,
    // WebSocket sync state (DM-11.2)
    wsConnected: false,
    stateVersion: 0,

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
          stateVersion: current.stateVersion + 1,
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
      set((state) => ({
        activeProject: projectId,
        timestamp: Date.now(),
        stateVersion: state.stateVersion + 1,
      }));
    },

    // =========================================================================
    // WIDGET SETTERS
    // =========================================================================

    setProjectStatus: (status: ProjectStatusState | null) => {
      set((state) => ({
        timestamp: Date.now(),
        stateVersion: state.stateVersion + 1,
        widgets: {
          ...state.widgets,
          projectStatus: status,
        },
      }));
    },

    setMetrics: (metrics: MetricsState | null) => {
      set((state) => ({
        timestamp: Date.now(),
        stateVersion: state.stateVersion + 1,
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
        stateVersion: state.stateVersion + 1,
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
        // Cleanup old dismissed alerts, prepend new, and cap at MAX_ALERTS
        const cleaned = cleanupDismissedAlerts(state.widgets.alerts);
        const newAlerts = [alert, ...cleaned].slice(0, MAX_ALERTS);
        // DM-08.6: Pre-compute activeAlerts
        const activeAlerts = newAlerts.filter((a) => !a.dismissed);
        return {
          timestamp: Date.now(),
          stateVersion: state.stateVersion + 1,
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
          stateVersion: state.stateVersion + 1,
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
        stateVersion: state.stateVersion + 1,
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
      set((state) => ({
        activeTasks: tasks,
        timestamp: Date.now(),
        stateVersion: state.stateVersion + 1,
      }));
    },

    addTask: (task: TaskProgress) => {
      set((state) => ({
        // DM-08.6: Cap at MAX_ACTIVE_TASKS, prioritizing active (pending/running) tasks
        activeTasks: prioritizeActiveTasks([...state.activeTasks, task]),
        timestamp: Date.now(),
        stateVersion: state.stateVersion + 1,
      }));
    },

    updateTask: (taskId: string, update: Partial<TaskProgress>) => {
      set((state) => ({
        activeTasks: state.activeTasks.map((t) =>
          t.taskId === taskId ? { ...t, ...update } : t
        ),
        timestamp: Date.now(),
        stateVersion: state.stateVersion + 1,
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
        stateVersion: state.stateVersion + 1,
      }));
    },

    removeTask: (taskId: string) => {
      set((state) => ({
        activeTasks: state.activeTasks.filter((t) => t.taskId !== taskId),
        timestamp: Date.now(),
        stateVersion: state.stateVersion + 1,
      }));
    },

    // =========================================================================
    // RESET
    // =========================================================================

    reset: () => {
      // DM-08.6: Also reset pre-computed activeAlerts
      // DM-11.1: Also reset sync state
      // DM-11.2: Also reset WebSocket sync state
      set({
        ...createInitialDashboardState(),
        activeAlerts: [],
        isSyncing: false,
        lastSyncedAt: null,
        syncError: null,
        wsConnected: false,
        stateVersion: 0,
      });
    },

    // =========================================================================
    // SYNC ACTIONS (DM-11.1)
    // =========================================================================

    syncToServer: async () => {
      const state = get();

      // Don't sync if already syncing
      if (state.isSyncing) {
        return;
      }

      set({ isSyncing: true, syncError: null });

      try {
        // Extract the dashboard state (without store-specific fields)
        const dashboardState: DashboardState = {
          version: state.version,
          timestamp: state.timestamp,
          activeProject: state.activeProject,
          workspaceId: state.workspaceId,
          userId: state.userId,
          widgets: state.widgets,
          loading: state.loading,
          errors: state.errors,
          activeTasks: state.activeTasks,
        };

        const response = await saveDashboardState(dashboardState, state.version);

        if (response?.success) {
          set({ lastSyncedAt: Date.now(), isSyncing: false });
        } else if (response?.conflictResolution === 'server') {
          // Server has newer version - restore from server
          console.warn('[DashboardStateStore] Conflict detected, restoring from server');
          set({ isSyncing: false });
          // Trigger restore from server
          await get().restoreFromServer();
        } else {
          // Save failed
          set({
            isSyncing: false,
            syncError: 'Failed to sync state to server',
          });
        }
      } catch (error) {
        console.error('[DashboardStateStore] Sync error:', error);
        set({
          isSyncing: false,
          syncError: error instanceof Error ? error.message : 'Sync failed',
        });
      }
    },

    restoreFromServer: async (): Promise<boolean> => {
      const state = get();

      // Don't restore if already syncing
      if (state.isSyncing) {
        return false;
      }

      set({ isSyncing: true, syncError: null });

      try {
        const serverState = await getDashboardState();

        if (!serverState) {
          // No state on server - this is fine for new users
          set({ isSyncing: false, lastSyncedAt: Date.now() });
          return true;
        }

        // Apply server state with conflict resolution
        const currentVersion = state.version;
        const serverVersion = serverState.version;

        if (serverVersion >= currentVersion) {
          // Server is equal or newer - apply server state
          let stateToApply = serverState.state;

          // DM-11.8: Check for schema version mismatch and migrate if needed
          const schemaVersion =
            typeof stateToApply === 'object' &&
            stateToApply !== null &&
            'version' in stateToApply
              ? (stateToApply as { version: number }).version
              : 1;

          if (needsMigration(schemaVersion)) {
            console.log(
              `[DashboardStateStore] State schema migration needed: v${schemaVersion} -> v${STATE_VERSION}`
            );

            const migrationResult = migrateState(stateToApply, schemaVersion);

            if (migrationResult.success) {
              console.log(
                `[DashboardStateStore] State migrated successfully from v${migrationResult.fromVersion} to v${migrationResult.toVersion}`,
                `(${migrationResult.migrationsApplied.length} migrations applied)`
              );
              stateToApply = migrationResult.migratedState as DashboardState;
            } else {
              console.error(
                '[DashboardStateStore] State migration failed, falling back to defaults:',
                migrationResult.error
              );
              // Fall back to default state on migration failure
              const defaultState = getDefaultState() as DashboardState;
              const activeAlerts: AlertEntry[] = [];
              set({
                ...defaultState,
                activeAlerts,
                isSyncing: false,
                lastSyncedAt: Date.now(),
                syncError: `Migration failed: ${migrationResult.error}`,
              });
              return false;
            }
          }

          const validated = validateDashboardState(stateToApply);
          if (validated) {
            const activeAlerts = validated.widgets.alerts.filter((a) => !a.dismissed);
            set({
              ...validated,
              activeAlerts,
              isSyncing: false,
              lastSyncedAt: Date.now(),
              syncError: null,
            });
            return true;
          } else {
            console.warn('[DashboardStateStore] Server state validation failed');
            set({
              isSyncing: false,
              syncError: 'Invalid state received from server',
            });
            return false;
          }
        } else {
          // Local is newer - push to server
          set({ isSyncing: false });
          await get().syncToServer();
          return true;
        }
      } catch (error) {
        console.error('[DashboardStateStore] Restore error:', error);
        set({
          isSyncing: false,
          syncError: error instanceof Error ? error.message : 'Restore failed',
        });
        return false;
      }
    },

    clearSyncError: () => {
      set({ syncError: null });
    },

    // =========================================================================
    // WEBSOCKET SYNC ACTIONS (DM-11.2)
    // =========================================================================

    applyRemoteUpdate: (path: string, value: unknown, version: number) => {
      const state = get();

      // Version-based conflict resolution: only apply if remote is newer or equal
      if (version < state.stateVersion) {
        console.debug(
          '[DashboardStateStore] Ignoring stale remote update:',
          path,
          'remote version:',
          version,
          'local version:',
          state.stateVersion
        );
        return;
      }

      // Apply the change using path-based update
      const currentState = {
        version: state.version,
        timestamp: state.timestamp,
        activeProject: state.activeProject,
        workspaceId: state.workspaceId,
        userId: state.userId,
        widgets: state.widgets,
        loading: state.loading,
        errors: state.errors,
        activeTasks: state.activeTasks,
      };

      const change: StateChange = { path, value };
      const updatedState = applyChange(currentState, change);

      // Validate the updated state
      const validated = validateDashboardState(updatedState as DashboardState);
      if (!validated) {
        console.warn('[DashboardStateStore] Invalid remote update rejected:', path);
        return;
      }

      // DM-08.6: Pre-compute activeAlerts if alerts changed
      const activeAlerts = validated.widgets.alerts.filter((a) => !a.dismissed);

      set({
        ...validated,
        activeAlerts,
        stateVersion: Math.max(state.stateVersion, version),
        timestamp: Date.now(),
      });

      console.debug('[DashboardStateStore] Applied remote update:', path);
    },

    applyFullState: (remoteState: Record<string, unknown>, version: number) => {
      const state = get();

      // Only apply if version is newer
      if (version <= state.stateVersion) {
        console.debug(
          '[DashboardStateStore] Ignoring stale full state:',
          'remote version:',
          version,
          'local version:',
          state.stateVersion
        );
        return;
      }

      // DM-11.8: Check for schema version mismatch and migrate if needed
      let stateToMerge = remoteState;
      const schemaVersion =
        typeof remoteState.version === 'number' ? remoteState.version : 1;

      if (needsMigration(schemaVersion)) {
        console.log(
          `[DashboardStateStore] WebSocket state migration needed: v${schemaVersion} -> v${STATE_VERSION}`
        );

        const migrationResult = migrateState(remoteState, schemaVersion);

        if (migrationResult.success) {
          console.log(
            `[DashboardStateStore] WebSocket state migrated successfully from v${migrationResult.fromVersion} to v${migrationResult.toVersion}`
          );
          stateToMerge = migrationResult.migratedState as Record<string, unknown>;
        } else {
          console.error(
            '[DashboardStateStore] WebSocket state migration failed:',
            migrationResult.error
          );
          // On migration failure, reject the full state update
          return;
        }
      }

      // Merge remote state into current state
      // Remote state may be partial, so we merge carefully
      const mergedState: DashboardState = {
        version: state.version,
        timestamp: Date.now(),
        activeProject:
          (stateToMerge.activeProject as string | null) ?? state.activeProject,
        workspaceId:
          (stateToMerge.workspaceId as string | null) ?? state.workspaceId,
        userId: (stateToMerge.userId as string | null) ?? state.userId,
        widgets: stateToMerge.widgets
          ? { ...state.widgets, ...(stateToMerge.widgets as typeof state.widgets) }
          : state.widgets,
        loading: stateToMerge.loading
          ? { ...state.loading, ...(stateToMerge.loading as typeof state.loading) }
          : state.loading,
        errors: stateToMerge.errors
          ? { ...state.errors, ...(stateToMerge.errors as typeof state.errors) }
          : state.errors,
        activeTasks: stateToMerge.activeTasks
          ? (stateToMerge.activeTasks as typeof state.activeTasks)
          : state.activeTasks,
      };

      // Validate the merged state
      const validated = validateDashboardState(mergedState);
      if (!validated) {
        console.warn('[DashboardStateStore] Invalid full state rejected');
        return;
      }

      // DM-08.6: Pre-compute activeAlerts
      const activeAlerts = validated.widgets.alerts.filter((a) => !a.dismissed);

      set({
        ...validated,
        activeAlerts,
        stateVersion: version,
      });

      console.debug('[DashboardStateStore] Applied full state, version:', version);
    },

    setWsConnected: (connected: boolean) => {
      set({ wsConnected: connected });
    },

    incrementVersion: () => {
      const newVersion = get().stateVersion + 1;
      set({ stateVersion: newVersion, timestamp: Date.now() });
      return newVersion;
    },

    getStateForSync: () => {
      const state = get();
      return {
        version: state.version,
        timestamp: state.timestamp,
        activeProject: state.activeProject,
        workspaceId: state.workspaceId,
        userId: state.userId,
        widgets: state.widgets,
        loading: state.loading,
        errors: state.errors,
        activeTasks: state.activeTasks,
      };
    },
  }))
);

// =============================================================================
// EXPORTS (DM-08.6: Re-export MAX constants from centralized dm-constants)
// =============================================================================

export { MAX_ALERTS, MAX_ACTIVITIES, MAX_METRICS, MAX_ACTIVE_TASKS };
