/**
 * Dashboard Shared State Schemas
 *
 * These schemas define the structure of state shared between
 * the Dashboard Gateway agent and the frontend via AG-UI protocol.
 * State is synchronized bidirectionally using CopilotKit's
 * useCoAgentStateRender mechanism.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
 * Epic: DM-04 | Story: DM-04.1
 */
import { z } from 'zod';

// =============================================================================
// STATE VERSION
// =============================================================================

/**
 * State schema version for migrations.
 * Increment when making breaking changes to the schema structure.
 */
export const STATE_VERSION = 1;

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Project status values
 */
export const ProjectStatusEnum = z.enum(['on-track', 'at-risk', 'behind', 'completed']);
export type ProjectStatusValue = z.infer<typeof ProjectStatusEnum>;

/**
 * Metric trend direction
 */
export const TrendDirectionEnum = z.enum(['up', 'down', 'neutral']);
export type TrendDirection = z.infer<typeof TrendDirectionEnum>;

/**
 * Alert severity type
 */
export const AlertTypeEnum = z.enum(['error', 'warning', 'info', 'success']);
export type AlertType = z.infer<typeof AlertTypeEnum>;

// =============================================================================
// TASK PROGRESS SCHEMAS (DM-05.4)
// =============================================================================

/**
 * Task step execution status
 */
export const TaskStepStatusEnum = z.enum(['pending', 'running', 'completed', 'failed']);
export type TaskStepStatus = z.infer<typeof TaskStepStatusEnum>;

/**
 * Overall task status
 */
export const TaskStatusEnum = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);
export type TaskStatusValue = z.infer<typeof TaskStatusEnum>;

/**
 * Individual step within a task
 * Tracks execution state and progress of a single step in a multi-step task.
 */
export const TaskStepSchema = z.object({
  /** Step index (0-based) */
  index: z.number().int().min(0),
  /** Step display name */
  name: z.string(),
  /** Step execution status */
  status: TaskStepStatusEnum.default('pending'),
  /** Step start timestamp (Unix ms) */
  startedAt: z.number().optional(),
  /** Step completion timestamp (Unix ms) */
  completedAt: z.number().optional(),
  /** Sub-step progress percentage (0-100) */
  progress: z.number().min(0).max(100).optional(),
});

export type TaskStep = z.infer<typeof TaskStepSchema>;

/**
 * Progress state for a long-running task
 * Tracks overall task status and individual step progress for
 * real-time streaming from the agent.
 */
export const TaskProgressSchema = z.object({
  /** Unique task identifier */
  taskId: z.string(),
  /** Human-readable task name */
  taskName: z.string(),
  /** Overall task status */
  status: TaskStatusEnum.default('pending'),
  /** Index of current step */
  currentStep: z.number().int().min(0).default(0),
  /** Total number of steps */
  totalSteps: z.number().int().min(0).default(0),
  /** List of task steps */
  steps: z.array(TaskStepSchema).default([]),
  /** Task start timestamp (Unix ms) */
  startedAt: z.number().optional(),
  /** Task completion timestamp (Unix ms) */
  completedAt: z.number().optional(),
  /** Estimated total duration in ms */
  estimatedCompletionMs: z.number().optional(),
  /** Error message if task failed */
  error: z.string().optional(),
});

export type TaskProgress = z.infer<typeof TaskProgressSchema>;

// =============================================================================
// WIDGET STATE SCHEMAS
// =============================================================================

/**
 * Project Status Widget State
 * Shows project progress with status indicator and task counts.
 */
export const ProjectStatusStateSchema = z.object({
  /** Unique project identifier */
  projectId: z.string(),
  /** Project display name */
  name: z.string(),
  /** Current project status */
  status: ProjectStatusEnum,
  /** Progress percentage (0-100) */
  progress: z.number().min(0).max(100),
  /** Number of completed tasks */
  tasksCompleted: z.number().int().min(0),
  /** Total number of tasks */
  tasksTotal: z.number().int().min(0),
  /** Last update timestamp (Unix ms) */
  lastUpdated: z.number(),
  /** Optional text summary */
  summary: z.string().optional(),
});

export type ProjectStatusState = z.infer<typeof ProjectStatusStateSchema>;

/**
 * Single Metric Entry
 * Represents a single metric value with optional trend indicator.
 */
export const MetricEntrySchema = z.object({
  /** Unique metric identifier */
  id: z.string(),
  /** Metric display label */
  label: z.string(),
  /** Metric value (can be number or formatted string) */
  value: z.union([z.number(), z.string()]),
  /** Optional unit suffix (e.g., "%", "hrs") */
  unit: z.string().optional(),
  /** Trend direction */
  trend: TrendDirectionEnum.optional(),
  /** Change description (e.g., "+5%") */
  change: z.string().optional(),
  /** Change percentage value */
  changePercent: z.number().optional(),
});

export type MetricEntry = z.infer<typeof MetricEntrySchema>;

/**
 * Metrics Widget State
 * Container for multiple metrics with period context.
 */
export const MetricsStateSchema = z.object({
  /** Widget title */
  title: z.string().default('Key Metrics'),
  /** Array of metric entries */
  metrics: z.array(MetricEntrySchema),
  /** Time period description (e.g., "Last 7 days") */
  period: z.string().optional(),
  /** Last update timestamp (Unix ms) */
  lastUpdated: z.number(),
});

export type MetricsState = z.infer<typeof MetricsStateSchema>;

/**
 * Activity Entry
 * Represents a single activity in the feed.
 */
export const ActivityEntrySchema = z.object({
  /** Unique activity identifier */
  id: z.string(),
  /** User who performed the action */
  user: z.string(),
  /** User avatar URL */
  userAvatar: z.string().optional(),
  /** Action description */
  action: z.string(),
  /** Target of the action (e.g., task name) */
  target: z.string().optional(),
  /** Activity timestamp (Unix ms) */
  timestamp: z.number(),
  /** Related project ID */
  projectId: z.string().optional(),
});

export type ActivityEntry = z.infer<typeof ActivityEntrySchema>;

/**
 * Activity Widget State
 * Container for activity feed with pagination support.
 */
export const ActivityStateSchema = z.object({
  /** Array of activity entries */
  activities: z.array(ActivityEntrySchema),
  /** Whether more activities are available */
  hasMore: z.boolean().default(false),
  /** Last update timestamp (Unix ms) */
  lastUpdated: z.number(),
});

export type ActivityState = z.infer<typeof ActivityStateSchema>;

/**
 * Alert Entry
 * Represents a single alert notification.
 */
export const AlertEntrySchema = z.object({
  /** Unique alert identifier */
  id: z.string(),
  /** Alert severity type */
  type: AlertTypeEnum,
  /** Alert title */
  title: z.string(),
  /** Alert message body */
  message: z.string(),
  /** Alert timestamp (Unix ms) */
  timestamp: z.number(),
  /** Whether the alert can be dismissed */
  dismissable: z.boolean().default(true),
  /** Whether the alert has been dismissed */
  dismissed: z.boolean().default(false),
  /** Optional action button label */
  actionLabel: z.string().optional(),
  /** Optional action URL */
  actionUrl: z.string().optional(),
});

export type AlertEntry = z.infer<typeof AlertEntrySchema>;

// =============================================================================
// LOADING & ERROR STATE SCHEMAS
// =============================================================================

/**
 * Loading State
 * Tracks loading status and which agents are being queried.
 */
export const LoadingStateSchema = z.object({
  /** Whether any loading is in progress */
  isLoading: z.boolean().default(false),
  /** List of agents currently being queried */
  loadingAgents: z.array(z.string()).default([]),
  /** Loading start timestamp (Unix ms) */
  startedAt: z.number().optional(),
});

export type LoadingState = z.infer<typeof LoadingStateSchema>;

/**
 * Error State
 * Map of agent IDs to error messages.
 */
export const ErrorStateSchema = z.record(z.string(), z.string());

export type ErrorState = z.infer<typeof ErrorStateSchema>;

// =============================================================================
// ROOT DASHBOARD STATE SCHEMA
// =============================================================================

/**
 * Widget Container State
 * Holds all widget-specific state objects.
 */
export const WidgetsStateSchema = z.object({
  /** Project status widget data */
  projectStatus: ProjectStatusStateSchema.nullable().default(null),
  /** Metrics widget data */
  metrics: MetricsStateSchema.nullable().default(null),
  /** Activity feed widget data */
  activity: ActivityStateSchema.nullable().default(null),
  /** Alert entries (array, not single widget) */
  alerts: z.array(AlertEntrySchema).default([]),
});

export type WidgetsState = z.infer<typeof WidgetsStateSchema>;

/**
 * Root Dashboard State
 *
 * This is the complete state object shared between agent and frontend
 * via the AG-UI protocol's state synchronization mechanism.
 */
export const DashboardStateSchema = z.object({
  /** Schema version for migrations */
  version: z.number().default(STATE_VERSION),
  /** Last update timestamp (Unix ms) */
  timestamp: z.number(),
  /** Currently focused project ID */
  activeProject: z.string().nullable().default(null),
  /** Current workspace ID */
  workspaceId: z.string().optional(),
  /** Current user ID */
  userId: z.string().optional(),

  /** Widget data container */
  widgets: WidgetsStateSchema.default({
    projectStatus: null,
    metrics: null,
    activity: null,
    alerts: [],
  }),

  /** Loading state */
  loading: LoadingStateSchema.default({
    isLoading: false,
    loadingAgents: [],
  }),

  /** Error state (agentId -> error message) */
  errors: ErrorStateSchema.default({}),

  /** Currently active long-running tasks (DM-05.4) */
  activeTasks: z.array(TaskProgressSchema).default([]),
});

export type DashboardState = z.infer<typeof DashboardStateSchema>;

// =============================================================================
// STATE UPDATE SCHEMAS (Partial updates)
// =============================================================================

/**
 * Partial update for dashboard state.
 * Used for incremental state updates from agents.
 */
export const DashboardStateUpdateSchema = DashboardStateSchema.partial();

export type DashboardStateUpdate = z.infer<typeof DashboardStateUpdateSchema>;

// =============================================================================
// STATE VALIDATION HELPERS
// =============================================================================

/**
 * Validate dashboard state, returning typed result or null on failure.
 *
 * @param data - Unknown data to validate
 * @returns Validated DashboardState or null if invalid
 */
export function validateDashboardState(data: unknown): DashboardState | null {
  const result = DashboardStateSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error('[DashboardState] Validation failed:', result.error.issues);
  return null;
}

/**
 * Validate a partial dashboard state update.
 *
 * @param data - Unknown data to validate
 * @returns Validated DashboardStateUpdate or null if invalid
 */
export function validateDashboardStateUpdate(
  data: unknown
): DashboardStateUpdate | null {
  const result = DashboardStateUpdateSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error('[DashboardState] Update validation failed:', result.error.issues);
  return null;
}

/**
 * Create initial empty dashboard state.
 * Used to initialize the state store and for tests.
 *
 * @param options - Optional initial values
 * @returns Fresh DashboardState with defaults
 */
export function createInitialDashboardState(options?: {
  workspaceId?: string;
  userId?: string;
  activeProject?: string | null;
}): DashboardState {
  return {
    version: STATE_VERSION,
    timestamp: Date.now(),
    activeProject: options?.activeProject ?? null,
    workspaceId: options?.workspaceId,
    userId: options?.userId,
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
    activeTasks: [],
  };
}
