/**
 * Dashboard State Store Tests
 *
 * Unit tests for the Zustand dashboard state store.
 * Tests all store actions, state updates, and edge cases.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
 * Epic: DM-04 | Story: DM-04.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import {
  useDashboardStateStore,
  MAX_ALERTS,
} from '../dashboard-state-store';
import {
  createInitialDashboardState,
  STATE_VERSION,
  type ProjectStatusState,
  type MetricsState,
  type ActivityState,
  type AlertEntry,
} from '@/lib/schemas/dashboard-state';

// Reset store before each test
beforeEach(() => {
  act(() => {
    useDashboardStateStore.getState().reset();
  });
});

describe('DashboardStateStore', () => {
  // ===========================================================================
  // INITIALIZATION TESTS
  // ===========================================================================

  describe('initialization', () => {
    it('initializes with default state', () => {
      const state = useDashboardStateStore.getState();

      expect(state.version).toBe(STATE_VERSION);
      expect(state.activeProject).toBeNull();
      expect(state.widgets.projectStatus).toBeNull();
      expect(state.widgets.metrics).toBeNull();
      expect(state.widgets.activity).toBeNull();
      expect(state.widgets.alerts).toEqual([]);
      expect(state.loading.isLoading).toBe(false);
      expect(state.loading.loadingAgents).toEqual([]);
      expect(state.errors).toEqual({});
    });

    it('has a valid timestamp', () => {
      const state = useDashboardStateStore.getState();
      const now = Date.now();

      // Timestamp should be recent (within 1 second)
      expect(state.timestamp).toBeGreaterThan(now - 1000);
      expect(state.timestamp).toBeLessThanOrEqual(now);
    });
  });

  // ===========================================================================
  // FULL STATE UPDATE TESTS
  // ===========================================================================

  describe('setFullState', () => {
    it('sets full state with valid data', () => {
      const newState = createInitialDashboardState({
        workspaceId: 'test-workspace',
        activeProject: 'project-1',
      });

      act(() => {
        useDashboardStateStore.getState().setFullState(newState);
      });

      const state = useDashboardStateStore.getState();
      expect(state.workspaceId).toBe('test-workspace');
      expect(state.activeProject).toBe('project-1');
    });

    it('rejects invalid state data', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      act(() => {
        // @ts-expect-error Testing invalid data
        useDashboardStateStore.getState().setFullState({ invalid: 'data' });
      });

      // State should remain unchanged
      const state = useDashboardStateStore.getState();
      expect(state.activeProject).toBeNull();
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });
  });

  describe('updateState', () => {
    it('merges partial updates correctly', () => {
      const initialTimestamp = useDashboardStateStore.getState().timestamp;

      act(() => {
        useDashboardStateStore.getState().updateState({
          activeProject: 'project-2',
        });
      });

      const state = useDashboardStateStore.getState();
      expect(state.activeProject).toBe('project-2');
      // Timestamp should be updated (>= initial since tests run fast)
      expect(state.timestamp).toBeGreaterThanOrEqual(initialTimestamp);
      // Other state should be preserved
      expect(state.widgets.projectStatus).toBeNull();
    });

    it('deep merges widgets correctly', () => {
      const projectStatus: ProjectStatusState = {
        projectId: 'p1',
        name: 'Test Project',
        status: 'on-track',
        progress: 50,
        tasksCompleted: 5,
        tasksTotal: 10,
        lastUpdated: Date.now(),
      };

      act(() => {
        useDashboardStateStore.getState().updateState({
          widgets: {
            projectStatus,
            metrics: null,
            activity: null,
            alerts: [],
          },
        });
      });

      const state = useDashboardStateStore.getState();
      expect(state.widgets.projectStatus).toEqual(projectStatus);
      // Other widgets should remain null
      expect(state.widgets.metrics).toBeNull();
    });
  });

  // ===========================================================================
  // ACTIVE PROJECT TESTS
  // ===========================================================================

  describe('setActiveProject', () => {
    it('sets active project ID', () => {
      act(() => {
        useDashboardStateStore.getState().setActiveProject('project-123');
      });

      expect(useDashboardStateStore.getState().activeProject).toBe('project-123');
    });

    it('clears active project when null', () => {
      act(() => {
        useDashboardStateStore.getState().setActiveProject('project-123');
        useDashboardStateStore.getState().setActiveProject(null);
      });

      expect(useDashboardStateStore.getState().activeProject).toBeNull();
    });

    it('updates timestamp', () => {
      const initialTimestamp = useDashboardStateStore.getState().timestamp;

      act(() => {
        useDashboardStateStore.getState().setActiveProject('project-123');
      });

      // Timestamp should be updated (>= initial since tests run fast)
      expect(useDashboardStateStore.getState().timestamp).toBeGreaterThanOrEqual(
        initialTimestamp
      );
    });
  });

  // ===========================================================================
  // WIDGET SETTER TESTS
  // ===========================================================================

  describe('setProjectStatus', () => {
    const mockStatus: ProjectStatusState = {
      projectId: 'p1',
      name: 'Test Project',
      status: 'on-track',
      progress: 75,
      tasksCompleted: 15,
      tasksTotal: 20,
      lastUpdated: Date.now(),
      summary: 'Going well',
    };

    it('sets project status widget state', () => {
      act(() => {
        useDashboardStateStore.getState().setProjectStatus(mockStatus);
      });

      expect(useDashboardStateStore.getState().widgets.projectStatus).toEqual(
        mockStatus
      );
    });

    it('clears project status when null', () => {
      act(() => {
        useDashboardStateStore.getState().setProjectStatus(mockStatus);
        useDashboardStateStore.getState().setProjectStatus(null);
      });

      expect(useDashboardStateStore.getState().widgets.projectStatus).toBeNull();
    });
  });

  describe('setMetrics', () => {
    const mockMetrics: MetricsState = {
      title: 'Key Metrics',
      metrics: [
        { id: 'm1', label: 'Tasks', value: 42, trend: 'up' },
        { id: 'm2', label: 'Velocity', value: 8.5, unit: 'pts', trend: 'neutral' },
      ],
      period: 'Last 7 days',
      lastUpdated: Date.now(),
    };

    it('sets metrics widget state', () => {
      act(() => {
        useDashboardStateStore.getState().setMetrics(mockMetrics);
      });

      expect(useDashboardStateStore.getState().widgets.metrics).toEqual(mockMetrics);
    });
  });

  describe('setActivity', () => {
    const mockActivity: ActivityState = {
      activities: [
        {
          id: 'a1',
          user: 'John',
          action: 'completed task',
          target: 'Fix bug',
          timestamp: Date.now(),
        },
      ],
      hasMore: true,
      lastUpdated: Date.now(),
    };

    it('sets activity widget state', () => {
      act(() => {
        useDashboardStateStore.getState().setActivity(mockActivity);
      });

      expect(useDashboardStateStore.getState().widgets.activity).toEqual(
        mockActivity
      );
    });
  });

  // ===========================================================================
  // ALERT TESTS
  // ===========================================================================

  describe('addAlert', () => {
    const createAlert = (id: string): AlertEntry => ({
      id,
      type: 'info',
      title: `Alert ${id}`,
      message: `Message for ${id}`,
      timestamp: Date.now(),
      dismissable: true,
      dismissed: false,
    });

    it('adds alert to the beginning of the list', () => {
      const alert1 = createAlert('1');
      const alert2 = createAlert('2');

      act(() => {
        useDashboardStateStore.getState().addAlert(alert1);
        useDashboardStateStore.getState().addAlert(alert2);
      });

      const alerts = useDashboardStateStore.getState().widgets.alerts;
      expect(alerts).toHaveLength(2);
      expect(alerts[0].id).toBe('2'); // Most recent first
      expect(alerts[1].id).toBe('1');
    });

    it('caps alerts at MAX_ALERTS', () => {
      // Add MAX_ALERTS + 5 alerts
      act(() => {
        for (let i = 0; i < MAX_ALERTS + 5; i++) {
          useDashboardStateStore.getState().addAlert(createAlert(`alert-${i}`));
        }
      });

      const alerts = useDashboardStateStore.getState().widgets.alerts;
      expect(alerts).toHaveLength(MAX_ALERTS);
      // Most recent should be first
      expect(alerts[0].id).toBe(`alert-${MAX_ALERTS + 4}`);
    });
  });

  describe('dismissAlert', () => {
    it('marks alert as dismissed', () => {
      const alert: AlertEntry = {
        id: 'dismiss-test',
        type: 'warning',
        title: 'Test',
        message: 'Test message',
        timestamp: Date.now(),
        dismissable: true,
        dismissed: false,
      };

      act(() => {
        useDashboardStateStore.getState().addAlert(alert);
        useDashboardStateStore.getState().dismissAlert('dismiss-test');
      });

      const alerts = useDashboardStateStore.getState().widgets.alerts;
      expect(alerts[0].dismissed).toBe(true);
    });

    it('does nothing for non-existent alert ID', () => {
      const alert: AlertEntry = {
        id: 'existing',
        type: 'info',
        title: 'Test',
        message: 'Test',
        timestamp: Date.now(),
        dismissable: true,
        dismissed: false,
      };

      act(() => {
        useDashboardStateStore.getState().addAlert(alert);
        useDashboardStateStore.getState().dismissAlert('non-existent');
      });

      const alerts = useDashboardStateStore.getState().widgets.alerts;
      expect(alerts[0].dismissed).toBe(false);
    });
  });

  describe('clearAlerts', () => {
    it('removes all alerts', () => {
      act(() => {
        useDashboardStateStore.getState().addAlert({
          id: '1',
          type: 'info',
          title: 'Test',
          message: 'Test',
          timestamp: Date.now(),
          dismissable: true,
          dismissed: false,
        });
        useDashboardStateStore.getState().addAlert({
          id: '2',
          type: 'warning',
          title: 'Test 2',
          message: 'Test 2',
          timestamp: Date.now(),
          dismissable: true,
          dismissed: false,
        });
        useDashboardStateStore.getState().clearAlerts();
      });

      expect(useDashboardStateStore.getState().widgets.alerts).toEqual([]);
    });
  });

  // ===========================================================================
  // LOADING STATE TESTS
  // ===========================================================================

  describe('setLoading', () => {
    it('sets loading state with agents', () => {
      act(() => {
        useDashboardStateStore.getState().setLoading(true, ['navi', 'pulse']);
      });

      const loading = useDashboardStateStore.getState().loading;
      expect(loading.isLoading).toBe(true);
      expect(loading.loadingAgents).toEqual(['navi', 'pulse']);
      expect(loading.startedAt).toBeDefined();
    });

    it('clears loading state', () => {
      act(() => {
        useDashboardStateStore.getState().setLoading(true, ['navi']);
        useDashboardStateStore.getState().setLoading(false);
      });

      const loading = useDashboardStateStore.getState().loading;
      expect(loading.isLoading).toBe(false);
      expect(loading.loadingAgents).toEqual([]);
      expect(loading.startedAt).toBeUndefined();
    });

    it('sets loading with empty agents array by default', () => {
      act(() => {
        useDashboardStateStore.getState().setLoading(true);
      });

      expect(useDashboardStateStore.getState().loading.loadingAgents).toEqual([]);
    });
  });

  // ===========================================================================
  // ERROR STATE TESTS
  // ===========================================================================

  describe('setError', () => {
    it('adds error for agent', () => {
      act(() => {
        useDashboardStateStore.getState().setError('navi', 'Agent unavailable');
      });

      expect(useDashboardStateStore.getState().errors).toEqual({
        navi: 'Agent unavailable',
      });
    });

    it('removes error when null', () => {
      act(() => {
        useDashboardStateStore.getState().setError('navi', 'Error');
        useDashboardStateStore.getState().setError('navi', null);
      });

      expect(useDashboardStateStore.getState().errors).toEqual({});
    });

    it('handles multiple agent errors', () => {
      act(() => {
        useDashboardStateStore.getState().setError('navi', 'Error 1');
        useDashboardStateStore.getState().setError('pulse', 'Error 2');
      });

      expect(useDashboardStateStore.getState().errors).toEqual({
        navi: 'Error 1',
        pulse: 'Error 2',
      });
    });
  });

  describe('clearErrors', () => {
    it('removes all errors', () => {
      act(() => {
        useDashboardStateStore.getState().setError('navi', 'Error 1');
        useDashboardStateStore.getState().setError('pulse', 'Error 2');
        useDashboardStateStore.getState().clearErrors();
      });

      expect(useDashboardStateStore.getState().errors).toEqual({});
    });
  });

  // ===========================================================================
  // RESET TESTS
  // ===========================================================================

  describe('reset', () => {
    it('resets store to initial state', () => {
      // Modify state
      act(() => {
        useDashboardStateStore.getState().setActiveProject('project-1');
        useDashboardStateStore.getState().setLoading(true, ['navi']);
        useDashboardStateStore.getState().setError('pulse', 'Error');
        useDashboardStateStore.getState().addAlert({
          id: '1',
          type: 'info',
          title: 'Test',
          message: 'Test',
          timestamp: Date.now(),
          dismissable: true,
          dismissed: false,
        });
      });

      // Reset
      act(() => {
        useDashboardStateStore.getState().reset();
      });

      // Verify reset
      const state = useDashboardStateStore.getState();
      expect(state.activeProject).toBeNull();
      expect(state.loading.isLoading).toBe(false);
      expect(state.errors).toEqual({});
      expect(state.widgets.alerts).toEqual([]);
    });
  });

  // ===========================================================================
  // SELECTOR TESTS
  // ===========================================================================

  describe('selectors', () => {
    it('subscribe returns stable action references', () => {
      const setActiveProject1 = useDashboardStateStore.getState().setActiveProject;
      const setActiveProject2 = useDashboardStateStore.getState().setActiveProject;

      expect(setActiveProject1).toBe(setActiveProject2);
    });
  });

  // ===========================================================================
  // SYNC STATE TESTS (DM-11.1)
  // ===========================================================================

  describe('sync state', () => {
    it('initializes with sync state defaults', () => {
      const state = useDashboardStateStore.getState();

      expect(state.isSyncing).toBe(false);
      expect(state.lastSyncedAt).toBeNull();
      expect(state.syncError).toBeNull();
    });

    it('reset clears sync state', () => {
      act(() => {
        // Set some sync state
        useDashboardStateStore.setState({
          isSyncing: true,
          lastSyncedAt: Date.now(),
          syncError: 'Some error',
        });
        useDashboardStateStore.getState().reset();
      });

      const state = useDashboardStateStore.getState();
      expect(state.isSyncing).toBe(false);
      expect(state.lastSyncedAt).toBeNull();
      expect(state.syncError).toBeNull();
    });

    it('clearSyncError clears the sync error', () => {
      act(() => {
        useDashboardStateStore.setState({ syncError: 'Test error' });
        useDashboardStateStore.getState().clearSyncError();
      });

      expect(useDashboardStateStore.getState().syncError).toBeNull();
    });

    it('syncToServer is callable', async () => {
      // Just test that the function exists and can be called
      const state = useDashboardStateStore.getState();
      expect(typeof state.syncToServer).toBe('function');
    });

    it('restoreFromServer is callable', async () => {
      // Just test that the function exists and can be called
      const state = useDashboardStateStore.getState();
      expect(typeof state.restoreFromServer).toBe('function');
    });
  });
});
