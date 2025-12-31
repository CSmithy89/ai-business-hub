/**
 * Widget Type Definitions
 *
 * Single source of truth for widget types used across the platform.
 * These types are shared between:
 * - Frontend (Next.js/React via widget-registry.tsx)
 * - Backend (NestJS API)
 * - Agents (Python AgentOS via gateway/tools.py)
 *
 * DM-08.5: Created to deduplicate widget type definitions.
 *
 * @packageDocumentation
 */

/**
 * All available widget types.
 *
 * When adding a new widget type:
 * 1. Add the type name here
 * 2. Register the component in apps/web/src/components/slots/widget-registry.tsx
 * 3. The Python WIDGET_TYPES list will be validated against these at build time
 */
export const WIDGET_TYPES = {
  /** Project status summary with progress indicator */
  PROJECT_STATUS: 'ProjectStatus',
  /** List of tasks with status and priority */
  TASK_LIST: 'TaskList',
  /** Key metrics display with trend indicators */
  METRICS: 'Metrics',
  /** Alert/notification message display */
  ALERT: 'Alert',
  /** Kanban-style board view */
  KANBAN_BOARD: 'KanbanBoard',
  /** Gantt chart timeline view */
  GANTT_CHART: 'GanttChart',
  /** Sprint burndown chart */
  BURNDOWN_CHART: 'BurndownChart',
  /** Team activity feed */
  TEAM_ACTIVITY: 'TeamActivity',
} as const;

/**
 * Type representing any valid widget type string.
 */
export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];

/**
 * List of all widget type values for iteration and validation.
 * Used by Python agents for type checking.
 */
export const WIDGET_TYPE_LIST: WidgetType[] = Object.values(WIDGET_TYPES);

/**
 * Check if a string is a valid widget type.
 */
export function isValidWidgetType(type: string): type is WidgetType {
  return WIDGET_TYPE_LIST.includes(type as WidgetType);
}

/**
 * Base data interface that all widget data payloads extend.
 * All widgets can have an optional id, title, and timestamp.
 */
export interface BaseWidgetData {
  /** Optional unique identifier for the widget instance */
  id?: string;
  /** Optional title to display in the widget header */
  title?: string;
  /** Timestamp when the data was generated */
  timestamp?: string;
  /** Additional data fields for flexibility */
  [key: string]: unknown;
}

/**
 * Arguments for the render_dashboard_widget tool call.
 */
export interface RenderWidgetArgs {
  /** The type of widget to render */
  type: WidgetType | string;
  /** Data payload for the widget */
  data: BaseWidgetData & Record<string, unknown>;
  /** Optional slot ID for widget placement */
  slotId?: string;
}

// ============================================
// Widget-specific data types
// ============================================

/**
 * Data for ProjectStatus widget.
 */
export interface ProjectStatusData extends BaseWidgetData {
  projectId: string;
  projectName: string;
  status: 'on_track' | 'at_risk' | 'behind';
  progress: number;
  dueDate?: string;
  tasksCompleted: number;
  tasksTotal: number;
}

/**
 * Data for TaskList widget.
 */
export interface TaskListData extends BaseWidgetData {
  tasks: Array<{
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    assignee?: string;
  }>;
  limit?: number;
}

/**
 * Data for Metrics widget.
 */
export interface MetricsData extends BaseWidgetData {
  metrics: Array<{
    label: string;
    value: number | string;
    change?: { value: number; direction: 'up' | 'down' };
    icon?: string;
  }>;
}

/**
 * Data for Alert widget.
 */
export interface AlertData extends BaseWidgetData {
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
  action?: { label: string; href: string };
}

/**
 * Data for TeamActivity widget.
 */
export interface TeamActivityData extends BaseWidgetData {
  activities: Array<{
    user: string;
    action: string;
    target?: string;
    time: string;
  }>;
}

/**
 * Data for KanbanBoard widget.
 */
export interface KanbanBoardData extends BaseWidgetData {
  columns: Array<{
    id: string;
    title: string;
    cards: Array<{
      id: string;
      title: string;
      description?: string;
      assignee?: string;
    }>;
  }>;
}

/**
 * Data for GanttChart widget.
 */
export interface GanttChartData extends BaseWidgetData {
  tasks: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    progress?: number;
    dependencies?: string[];
  }>;
}

/**
 * Data for BurndownChart widget.
 */
export interface BurndownChartData extends BaseWidgetData {
  sprintName?: string;
  startDate: string;
  endDate: string;
  points: Array<{
    date: string;
    ideal: number;
    actual: number;
  }>;
}

/**
 * Union type of all widget data types.
 */
export type WidgetData =
  | ProjectStatusData
  | TaskListData
  | MetricsData
  | AlertData
  | TeamActivityData
  | KanbanBoardData
  | GanttChartData
  | BurndownChartData;
