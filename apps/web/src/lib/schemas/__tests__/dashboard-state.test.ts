/**
 * Dashboard State Schema Tests
 *
 * Unit tests for the dashboard state schemas, validation functions,
 * and factory helpers. Tests cover both valid and invalid data cases.
 *
 * Epic: DM-04 | Story: DM-04.1
 */
import { describe, expect, it } from 'vitest';
import {
  STATE_VERSION,
  ProjectStatusStateSchema,
  MetricEntrySchema,
  MetricsStateSchema,
  ActivityEntrySchema,
  ActivityStateSchema,
  AlertEntrySchema,
  LoadingStateSchema,
  WidgetsStateSchema,
  DashboardStateSchema,
  DashboardStateUpdateSchema,
  validateDashboardState,
  validateDashboardStateUpdate,
  createInitialDashboardState,
  type DashboardState,
  type ProjectStatusState,
  type MetricEntry,
  type AlertEntry,
} from '../dashboard-state';

describe('Dashboard State Schema', () => {
  // ==========================================================================
  // STATE_VERSION
  // ==========================================================================
  describe('STATE_VERSION', () => {
    it('should be 1 for initial schema', () => {
      expect(STATE_VERSION).toBe(1);
    });
  });

  // ==========================================================================
  // ProjectStatusStateSchema
  // ==========================================================================
  describe('ProjectStatusStateSchema', () => {
    const validProjectStatus: ProjectStatusState = {
      projectId: 'proj-123',
      name: 'Test Project',
      status: 'on-track',
      progress: 75,
      tasksCompleted: 15,
      tasksTotal: 20,
      lastUpdated: Date.now(),
    };

    it('should validate correct ProjectStatusState data', () => {
      const result = ProjectStatusStateSchema.safeParse(validProjectStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectId).toBe('proj-123');
        expect(result.data.status).toBe('on-track');
      }
    });

    it('should accept all valid status values', () => {
      const statuses = ['on-track', 'at-risk', 'behind', 'completed'] as const;
      for (const status of statuses) {
        const data = { ...validProjectStatus, status };
        const result = ProjectStatusStateSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status values', () => {
      const data = { ...validProjectStatus, status: 'invalid-status' };
      const result = ProjectStatusStateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject progress outside 0-100 range', () => {
      expect(
        ProjectStatusStateSchema.safeParse({ ...validProjectStatus, progress: -1 }).success
      ).toBe(false);
      expect(
        ProjectStatusStateSchema.safeParse({ ...validProjectStatus, progress: 101 }).success
      ).toBe(false);
    });

    it('should allow optional summary field', () => {
      const withSummary = { ...validProjectStatus, summary: 'Project is progressing well' };
      const result = ProjectStatusStateSchema.safeParse(withSummary);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary).toBe('Project is progressing well');
      }
    });

    it('should reject negative task counts', () => {
      expect(
        ProjectStatusStateSchema.safeParse({ ...validProjectStatus, tasksCompleted: -1 })
          .success
      ).toBe(false);
    });
  });

  // ==========================================================================
  // MetricEntrySchema
  // ==========================================================================
  describe('MetricEntrySchema', () => {
    it('should validate metric with number value', () => {
      const metric: MetricEntry = {
        id: 'metric-1',
        label: 'Tasks Completed',
        value: 42,
      };
      const result = MetricEntrySchema.safeParse(metric);
      expect(result.success).toBe(true);
    });

    it('should validate metric with string value', () => {
      const metric: MetricEntry = {
        id: 'metric-2',
        label: 'Status',
        value: '95%',
      };
      const result = MetricEntrySchema.safeParse(metric);
      expect(result.success).toBe(true);
    });

    it('should validate metric with all optional fields', () => {
      const metric: MetricEntry = {
        id: 'metric-3',
        label: 'Revenue',
        value: 50000,
        unit: '$',
        trend: 'up',
        change: '+10%',
        changePercent: 10.5,
      };
      const result = MetricEntrySchema.safeParse(metric);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.trend).toBe('up');
        expect(result.data.changePercent).toBe(10.5);
      }
    });

    it('should reject invalid trend values', () => {
      const metric = {
        id: 'metric-4',
        label: 'Test',
        value: 1,
        trend: 'sideways',
      };
      const result = MetricEntrySchema.safeParse(metric);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // MetricsStateSchema
  // ==========================================================================
  describe('MetricsStateSchema', () => {
    it('should validate metrics state with multiple metrics', () => {
      const metricsState = {
        title: 'Sprint Metrics',
        metrics: [
          { id: 'm1', label: 'Velocity', value: 32 },
          { id: 'm2', label: 'Bugs', value: 5, trend: 'down' as const },
        ],
        period: 'Last 2 weeks',
        lastUpdated: Date.now(),
      };
      const result = MetricsStateSchema.safeParse(metricsState);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metrics).toHaveLength(2);
      }
    });

    it('should use default title when not provided', () => {
      const metricsState = {
        metrics: [],
        lastUpdated: Date.now(),
      };
      const result = MetricsStateSchema.safeParse(metricsState);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Key Metrics');
      }
    });
  });

  // ==========================================================================
  // ActivityEntrySchema
  // ==========================================================================
  describe('ActivityEntrySchema', () => {
    it('should validate activity entry', () => {
      const activity = {
        id: 'act-1',
        user: 'John Doe',
        action: 'completed task',
        target: 'Implement login',
        timestamp: Date.now(),
        projectId: 'proj-123',
      };
      const result = ActivityEntrySchema.safeParse(activity);
      expect(result.success).toBe(true);
    });

    it('should allow optional fields', () => {
      const activity = {
        id: 'act-2',
        user: 'Jane',
        action: 'joined project',
        timestamp: Date.now(),
      };
      const result = ActivityEntrySchema.safeParse(activity);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // ActivityStateSchema
  // ==========================================================================
  describe('ActivityStateSchema', () => {
    it('should validate activity state', () => {
      const state = {
        activities: [
          { id: 'a1', user: 'User1', action: 'did something', timestamp: Date.now() },
        ],
        hasMore: true,
        lastUpdated: Date.now(),
      };
      const result = ActivityStateSchema.safeParse(state);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasMore).toBe(true);
      }
    });

    it('should default hasMore to false', () => {
      const state = {
        activities: [],
        lastUpdated: Date.now(),
      };
      const result = ActivityStateSchema.safeParse(state);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasMore).toBe(false);
      }
    });
  });

  // ==========================================================================
  // AlertEntrySchema
  // ==========================================================================
  describe('AlertEntrySchema', () => {
    const validAlert: AlertEntry = {
      id: 'alert-1',
      type: 'warning',
      title: 'Deadline Approaching',
      message: 'Project deadline is in 2 days',
      timestamp: Date.now(),
      dismissable: true,
      dismissed: false,
    };

    it('should validate all alert types', () => {
      const types = ['error', 'warning', 'info', 'success'] as const;
      for (const type of types) {
        const alert = { ...validAlert, type };
        const result = AlertEntrySchema.safeParse(alert);
        expect(result.success).toBe(true);
      }
    });

    it('should include optional action fields', () => {
      const alertWithAction = {
        ...validAlert,
        actionLabel: 'View Project',
        actionUrl: '/projects/123',
      };
      const result = AlertEntrySchema.safeParse(alertWithAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actionLabel).toBe('View Project');
      }
    });

    it('should default dismissable to true and dismissed to false', () => {
      const minimalAlert = {
        id: 'alert-2',
        type: 'info',
        title: 'Info',
        message: 'FYI',
        timestamp: Date.now(),
      };
      const result = AlertEntrySchema.safeParse(minimalAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dismissable).toBe(true);
        expect(result.data.dismissed).toBe(false);
      }
    });
  });

  // ==========================================================================
  // LoadingStateSchema
  // ==========================================================================
  describe('LoadingStateSchema', () => {
    it('should validate loading state', () => {
      const state = {
        isLoading: true,
        loadingAgents: ['navi', 'pulse'],
        startedAt: Date.now(),
      };
      const result = LoadingStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should provide defaults for all fields', () => {
      const result = LoadingStateSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isLoading).toBe(false);
        expect(result.data.loadingAgents).toEqual([]);
        expect(result.data.startedAt).toBeUndefined();
      }
    });
  });

  // ==========================================================================
  // WidgetsStateSchema
  // ==========================================================================
  describe('WidgetsStateSchema', () => {
    it('should validate complete widgets state', () => {
      const widgets = {
        projectStatus: {
          projectId: 'p1',
          name: 'Project 1',
          status: 'on-track',
          progress: 50,
          tasksCompleted: 5,
          tasksTotal: 10,
          lastUpdated: Date.now(),
        },
        metrics: {
          title: 'Metrics',
          metrics: [],
          lastUpdated: Date.now(),
        },
        activity: {
          activities: [],
          hasMore: false,
          lastUpdated: Date.now(),
        },
        alerts: [],
      };
      const result = WidgetsStateSchema.safeParse(widgets);
      expect(result.success).toBe(true);
    });

    it('should allow all widgets to be null except alerts', () => {
      const widgets = {
        projectStatus: null,
        metrics: null,
        activity: null,
        alerts: [],
      };
      const result = WidgetsStateSchema.safeParse(widgets);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // DashboardStateSchema
  // ==========================================================================
  describe('DashboardStateSchema', () => {
    it('should validate complete dashboard state', () => {
      const state: DashboardState = {
        version: 1,
        timestamp: Date.now(),
        activeProject: 'proj-123',
        workspaceId: 'ws-1',
        userId: 'user-1',
        widgets: {
          projectStatus: null,
          metrics: null,
          activity: null,
          alerts: [],
        },
        loading: {
          isLoading: false,
          loadingAgents: [],
        },
        errors: {},
      };
      const result = DashboardStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should apply all defaults correctly', () => {
      const minimalState = {
        timestamp: Date.now(),
      };
      const result = DashboardStateSchema.safeParse(minimalState);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(STATE_VERSION);
        expect(result.data.activeProject).toBeNull();
        expect(result.data.widgets.alerts).toEqual([]);
        expect(result.data.loading.isLoading).toBe(false);
        expect(result.data.errors).toEqual({});
      }
    });

    it('should require timestamp field', () => {
      const result = DashboardStateSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // DashboardStateUpdateSchema
  // ==========================================================================
  describe('DashboardStateUpdateSchema', () => {
    it('should allow partial updates', () => {
      const update = {
        activeProject: 'proj-456',
      };
      const result = DashboardStateUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should allow empty updates', () => {
      const result = DashboardStateUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate partial widget updates', () => {
      const update = {
        widgets: {
          projectStatus: null,
          metrics: null,
          activity: null,
          alerts: [
            {
              id: 'a1',
              type: 'info',
              title: 'New',
              message: 'New alert',
              timestamp: Date.now(),
              dismissable: true,
              dismissed: false,
            },
          ],
        },
      };
      const result = DashboardStateUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // validateDashboardState
  // ==========================================================================
  describe('validateDashboardState', () => {
    it('should return validated state for valid data', () => {
      const state = {
        version: 1,
        timestamp: Date.now(),
        activeProject: null,
        widgets: {
          projectStatus: null,
          metrics: null,
          activity: null,
          alerts: [],
        },
        loading: {
          isLoading: false,
          loadingAgents: [],
        },
        errors: {},
      };
      const result = validateDashboardState(state);
      expect(result).not.toBeNull();
      expect(result?.version).toBe(1);
    });

    it('should return null for invalid data', () => {
      const invalidState = {
        version: 'not-a-number',
        timestamp: 'invalid',
      };
      const result = validateDashboardState(invalidState);
      expect(result).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const result = validateDashboardState({});
      expect(result).toBeNull();
    });

    it('should handle non-object input', () => {
      expect(validateDashboardState(null)).toBeNull();
      expect(validateDashboardState(undefined)).toBeNull();
      expect(validateDashboardState('string')).toBeNull();
      expect(validateDashboardState(123)).toBeNull();
    });
  });

  // ==========================================================================
  // validateDashboardStateUpdate
  // ==========================================================================
  describe('validateDashboardStateUpdate', () => {
    it('should return validated update for valid partial data', () => {
      const update = {
        activeProject: 'proj-new',
        timestamp: Date.now(),
      };
      const result = validateDashboardStateUpdate(update);
      expect(result).not.toBeNull();
      expect(result?.activeProject).toBe('proj-new');
    });

    it('should return null for invalid update data', () => {
      const invalidUpdate = {
        version: 'invalid',
      };
      const result = validateDashboardStateUpdate(invalidUpdate);
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // createInitialDashboardState
  // ==========================================================================
  describe('createInitialDashboardState', () => {
    it('should create valid initial state', () => {
      const state = createInitialDashboardState();

      // Validate against schema
      const result = DashboardStateSchema.safeParse(state);
      expect(result.success).toBe(true);

      // Check defaults
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

    it('should set timestamp to current time', () => {
      const before = Date.now();
      const state = createInitialDashboardState();
      const after = Date.now();

      expect(state.timestamp).toBeGreaterThanOrEqual(before);
      expect(state.timestamp).toBeLessThanOrEqual(after);
    });

    it('should accept optional parameters', () => {
      const state = createInitialDashboardState({
        workspaceId: 'ws-123',
        userId: 'user-456',
        activeProject: 'proj-789',
      });

      expect(state.workspaceId).toBe('ws-123');
      expect(state.userId).toBe('user-456');
      expect(state.activeProject).toBe('proj-789');
    });
  });

  // ==========================================================================
  // Cross-Language Compatibility
  // ==========================================================================
  describe('Cross-Language Compatibility', () => {
    it('should produce JSON that matches Python schema expectations', () => {
      const state = createInitialDashboardState({
        workspaceId: 'ws-1',
        userId: 'user-1',
      });

      // Add some widget data
      state.widgets.projectStatus = {
        projectId: 'proj-1',
        name: 'Test Project',
        status: 'on-track',
        progress: 50,
        tasksCompleted: 5,
        tasksTotal: 10,
        lastUpdated: Date.now(),
      };

      state.widgets.alerts = [
        {
          id: 'alert-1',
          type: 'info',
          title: 'Test Alert',
          message: 'This is a test',
          timestamp: Date.now(),
          dismissable: true,
          dismissed: false,
        },
      ];

      // Serialize to JSON
      const json = JSON.stringify(state);
      const parsed = JSON.parse(json);

      // Verify camelCase keys (TypeScript format)
      expect(parsed).toHaveProperty('workspaceId');
      expect(parsed).toHaveProperty('userId');
      expect(parsed).toHaveProperty('activeProject');
      expect(parsed.widgets).toHaveProperty('projectStatus');
      expect(parsed.widgets.projectStatus).toHaveProperty('projectId');
      expect(parsed.widgets.projectStatus).toHaveProperty('tasksCompleted');
      expect(parsed.widgets.projectStatus).toHaveProperty('tasksTotal');
      expect(parsed.widgets.projectStatus).toHaveProperty('lastUpdated');
    });

    it('should validate Python-style camelCase JSON input', () => {
      // Simulate JSON from Python (using camelCase via aliases)
      const pythonJson = {
        version: 1,
        timestamp: Date.now(),
        activeProject: 'proj-123',
        workspaceId: 'ws-1',
        userId: 'user-1',
        widgets: {
          projectStatus: {
            projectId: 'proj-1',
            name: 'From Python',
            status: 'at-risk',
            progress: 25,
            tasksCompleted: 2,
            tasksTotal: 8,
            lastUpdated: Date.now(),
          },
          metrics: null,
          activity: null,
          alerts: [],
        },
        loading: {
          isLoading: false,
          loadingAgents: [],
        },
        errors: {},
      };

      const result = validateDashboardState(pythonJson);
      expect(result).not.toBeNull();
      expect(result?.widgets.projectStatus?.status).toBe('at-risk');
    });
  });
});
