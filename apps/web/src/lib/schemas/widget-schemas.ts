/**
 * Widget Data Zod Schemas
 *
 * Runtime validation schemas for widget data payloads.
 * These schemas ensure data integrity at the rendering boundary,
 * preventing runtime crashes from malformed agent responses.
 *
 * @see docs/modules/bm-dm/stories/dm-08-1-zod-widget-validation.md
 * @see apps/web/src/components/slots/types.ts (TypeScript interfaces)
 */

import { z } from 'zod';

// =============================================================================
// BASE SCHEMA
// =============================================================================

/**
 * Base widget data schema.
 * All widget data schemas should extend this.
 */
export const BaseWidgetDataSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
});

// =============================================================================
// WIDGET-SPECIFIC SCHEMAS
// =============================================================================

/**
 * ProjectStatus widget data schema.
 * Shows project progress with status indicator.
 */
export const ProjectStatusDataSchema = BaseWidgetDataSchema.extend({
  projectId: z.string(),
  projectName: z.string(),
  status: z.enum(['on_track', 'at_risk', 'behind']),
  progress: z.number().min(0).max(100),
  dueDate: z.string().optional(),
  tasksCompleted: z.number().int().nonnegative(),
  tasksTotal: z.number().int().nonnegative(),
});

/**
 * TaskList widget data schema.
 * Displays a list of tasks with status and priority.
 */
export const TaskListDataSchema = BaseWidgetDataSchema.extend({
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.enum(['todo', 'in_progress', 'done']),
      priority: z.enum(['low', 'medium', 'high']),
      assignee: z.string().optional(),
    })
  ),
  limit: z.number().int().positive().optional(),
});

/**
 * Metrics widget data schema.
 * Shows key metrics with optional change indicators.
 */
export const MetricsDataSchema = BaseWidgetDataSchema.extend({
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.union([z.number(), z.string()]),
      change: z
        .object({
          value: z.number(),
          direction: z.enum(['up', 'down']),
        })
        .optional(),
      icon: z.string().optional(),
    })
  ),
});

/**
 * Alert widget data schema.
 * Displays an alert message with severity level.
 */
export const AlertDataSchema = BaseWidgetDataSchema.extend({
  severity: z.enum(['info', 'warning', 'error', 'success']),
  title: z.string().optional(),
  message: z.string(),
  action: z
    .object({
      label: z.string(),
      href: z.string(),
    })
    .optional(),
});

/**
 * TeamActivity widget data schema.
 * Shows recent team activity feed.
 */
export const TeamActivityDataSchema = BaseWidgetDataSchema.extend({
  activities: z.array(
    z.object({
      user: z.string(),
      action: z.string(),
      target: z.string().optional(),
      time: z.string(),
    })
  ),
});

/**
 * KanbanBoard widget data schema.
 * Displays cards in kanban columns.
 *
 * @see packages/shared/src/types/widget.ts - KanbanBoardData interface
 */
export const KanbanBoardDataSchema = BaseWidgetDataSchema.extend({
  columns: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      cards: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string().optional(),
          assignee: z.string().optional(),
        })
      ),
    })
  ),
});

/**
 * GanttChart widget data schema.
 * Displays project timeline with task dependencies.
 *
 * @see packages/shared/src/types/widget.ts - GanttChartData interface
 */
export const GanttChartDataSchema = BaseWidgetDataSchema.extend({
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      start: z.string(),
      end: z.string(),
      progress: z.number().min(0).max(100).optional(),
      dependencies: z.array(z.string()).optional(),
    })
  ),
});

/**
 * BurndownChart widget data schema.
 * Shows sprint burndown progress.
 *
 * @see packages/shared/src/types/widget.ts - BurndownChartData interface
 */
export const BurndownChartDataSchema = BaseWidgetDataSchema.extend({
  sprintName: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  points: z.array(
    z.object({
      date: z.string(),
      ideal: z.number().nonnegative(),
      actual: z.number().nonnegative(),
    })
  ),
});

// =============================================================================
// SCHEMA REGISTRY
// =============================================================================

/**
 * Schema registry mapping widget types to their Zod schemas.
 * Widget types use PascalCase to match the WIDGET_REGISTRY.
 */
export const WIDGET_SCHEMAS: Record<string, z.ZodSchema> = {
  ProjectStatus: ProjectStatusDataSchema,
  TaskList: TaskListDataSchema,
  Metrics: MetricsDataSchema,
  Alert: AlertDataSchema,
  TeamActivity: TeamActivityDataSchema,
  KanbanBoard: KanbanBoardDataSchema,
  GanttChart: GanttChartDataSchema,
  BurndownChart: BurndownChartDataSchema,
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ProjectStatusData = z.infer<typeof ProjectStatusDataSchema>;
export type TaskListData = z.infer<typeof TaskListDataSchema>;
export type MetricsData = z.infer<typeof MetricsDataSchema>;
export type AlertData = z.infer<typeof AlertDataSchema>;
export type TeamActivityData = z.infer<typeof TeamActivityDataSchema>;
export type KanbanBoardData = z.infer<typeof KanbanBoardDataSchema>;
export type GanttChartData = z.infer<typeof GanttChartDataSchema>;
export type BurndownChartData = z.infer<typeof BurndownChartDataSchema>;

/**
 * Get the list of widget types that have validation schemas.
 */
export function getValidatableWidgetTypes(): string[] {
  return Object.keys(WIDGET_SCHEMAS);
}
