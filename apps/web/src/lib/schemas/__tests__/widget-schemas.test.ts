/**
 * Widget Schema Tests
 *
 * Unit tests for Zod widget validation schemas.
 *
 * @see docs/modules/bm-dm/stories/dm-08-1-zod-widget-validation.md
 */

import { describe, it, expect } from 'vitest';
import {
  ProjectStatusDataSchema,
  TaskListDataSchema,
  MetricsDataSchema,
  AlertDataSchema,
  TeamActivityDataSchema,
  WIDGET_SCHEMAS,
  getValidatableWidgetTypes,
} from '../widget-schemas';

describe('Widget Schemas', () => {
  describe('ProjectStatusDataSchema', () => {
    it('should accept valid project status data', () => {
      const validData = {
        projectId: 'proj-123',
        projectName: 'Test Project',
        status: 'on_track',
        progress: 75,
        tasksCompleted: 15,
        tasksTotal: 20,
      };

      const result = ProjectStatusDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept optional fields', () => {
      const validData = {
        id: 'widget-1',
        title: 'Project Overview',
        projectId: 'proj-123',
        projectName: 'Test Project',
        status: 'at_risk',
        progress: 50,
        dueDate: '2025-02-01',
        tasksCompleted: 10,
        tasksTotal: 20,
      };

      const result = ProjectStatusDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status value', () => {
      const invalidData = {
        projectId: 'proj-123',
        projectName: 'Test Project',
        status: 'invalid_status',
        progress: 75,
        tasksCompleted: 15,
        tasksTotal: 20,
      };

      const result = ProjectStatusDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject progress outside 0-100 range', () => {
      const invalidData = {
        projectId: 'proj-123',
        projectName: 'Test Project',
        status: 'on_track',
        progress: 150,
        tasksCompleted: 15,
        tasksTotal: 20,
      };

      const result = ProjectStatusDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative task counts', () => {
      const invalidData = {
        projectId: 'proj-123',
        projectName: 'Test Project',
        status: 'on_track',
        progress: 75,
        tasksCompleted: -1,
        tasksTotal: 20,
      };

      const result = ProjectStatusDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        projectId: 'proj-123',
        // missing projectName, status, etc.
      };

      const result = ProjectStatusDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('TaskListDataSchema', () => {
    it('should accept valid task list data', () => {
      const validData = {
        tasks: [
          {
            id: 'task-1',
            title: 'Complete feature',
            status: 'in_progress',
            priority: 'high',
          },
          {
            id: 'task-2',
            title: 'Write tests',
            status: 'todo',
            priority: 'medium',
            assignee: 'John Doe',
          },
        ],
      };

      const result = TaskListDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty task list', () => {
      const validData = {
        tasks: [],
      };

      const result = TaskListDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept optional limit', () => {
      const validData = {
        tasks: [{ id: 'task-1', title: 'Test', status: 'todo', priority: 'low' }],
        limit: 10,
      };

      const result = TaskListDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid task status', () => {
      const invalidData = {
        tasks: [
          {
            id: 'task-1',
            title: 'Test',
            status: 'invalid',
            priority: 'high',
          },
        ],
      };

      const result = TaskListDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid task priority', () => {
      const invalidData = {
        tasks: [
          {
            id: 'task-1',
            title: 'Test',
            status: 'todo',
            priority: 'critical', // not a valid priority
          },
        ],
      };

      const result = TaskListDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('MetricsDataSchema', () => {
    it('should accept valid metrics data', () => {
      const validData = {
        metrics: [
          { label: 'Revenue', value: 10000 },
          { label: 'Users', value: '1.2k' },
          { label: 'Growth', value: 15, change: { value: 5, direction: 'up' } },
        ],
      };

      const result = MetricsDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty metrics array', () => {
      const validData = {
        metrics: [],
      };

      const result = MetricsDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept metrics with icon', () => {
      const validData = {
        metrics: [{ label: 'Revenue', value: 10000, icon: 'dollar-sign' }],
      };

      const result = MetricsDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid change direction', () => {
      const invalidData = {
        metrics: [
          { label: 'Test', value: 100, change: { value: 5, direction: 'sideways' } },
        ],
      };

      const result = MetricsDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('AlertDataSchema', () => {
    it('should accept valid alert data', () => {
      const validData = {
        severity: 'warning',
        title: 'High CPU Usage',
        message: 'CPU usage has exceeded 90%',
      };

      const result = AlertDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept alert with action', () => {
      const validData = {
        severity: 'error',
        title: 'Service Down',
        message: 'Payment service is not responding',
        action: {
          label: 'View Status',
          href: '/status/payments',
        },
      };

      const result = AlertDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid severity', () => {
      const invalidData = {
        severity: 'critical', // not a valid severity
        title: 'Test',
        message: 'Test message',
      };

      const result = AlertDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing message', () => {
      const invalidData = {
        severity: 'info',
        title: 'Test',
        // missing message
      };

      const result = AlertDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('TeamActivityDataSchema', () => {
    it('should accept valid team activity data', () => {
      const validData = {
        activities: [
          {
            user: 'John Doe',
            action: 'completed task',
            target: 'Feature implementation',
            time: '2 hours ago',
          },
          {
            user: 'Jane Smith',
            action: 'joined project',
            time: '1 day ago',
          },
        ],
      };

      const result = TeamActivityDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty activities', () => {
      const validData = {
        activities: [],
      };

      const result = TeamActivityDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields in activity', () => {
      const invalidData = {
        activities: [
          {
            user: 'John Doe',
            // missing action and time
          },
        ],
      };

      const result = TeamActivityDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('WIDGET_SCHEMAS registry', () => {
    it('should have schemas for all standard widget types', () => {
      expect(WIDGET_SCHEMAS['ProjectStatus']).toBeDefined();
      expect(WIDGET_SCHEMAS['TaskList']).toBeDefined();
      expect(WIDGET_SCHEMAS['Metrics']).toBeDefined();
      expect(WIDGET_SCHEMAS['Alert']).toBeDefined();
      expect(WIDGET_SCHEMAS['TeamActivity']).toBeDefined();
    });

    it('should return undefined for unknown types', () => {
      expect(WIDGET_SCHEMAS['UnknownWidget']).toBeUndefined();
    });
  });

  describe('getValidatableWidgetTypes', () => {
    it('should return all widget types with schemas', () => {
      const types = getValidatableWidgetTypes();
      expect(types).toContain('ProjectStatus');
      expect(types).toContain('TaskList');
      expect(types).toContain('Metrics');
      expect(types).toContain('Alert');
      expect(types).toContain('TeamActivity');
    });
  });
});
