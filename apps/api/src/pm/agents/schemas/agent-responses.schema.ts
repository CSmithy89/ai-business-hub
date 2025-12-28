/**
 * Agent Response Schemas
 * AI Business Hub - Project Management Module
 *
 * Zod validation schemas for PM agent responses.
 * These schemas mirror the Python Pydantic models in:
 * agents/pm/tools/structured_outputs.py
 *
 * Use these for validating responses from Python agents
 * and ensuring type-safe data flow between systems.
 */

import { z } from 'zod';

// ==============================================================================
// Enums
// ==============================================================================

export const TaskActionSchema = z.enum(['complete', 'carry_over', 'cancel']);
export type TaskAction = z.infer<typeof TaskActionSchema>;

export const HealthLevelSchema = z.enum([
  'EXCELLENT',
  'GOOD',
  'WARNING',
  'CRITICAL',
]);
export type HealthLevel = z.infer<typeof HealthLevelSchema>;

export const HealthTrendSchema = z.enum(['IMPROVING', 'STABLE', 'DECLINING']);
export type HealthTrend = z.infer<typeof HealthTrendSchema>;

export const ConfidenceLevelSchema = z.enum(['low', 'medium', 'high']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const VelocityTrendSchema = z.enum(['up', 'down', 'stable']);
export type VelocityTrend = z.infer<typeof VelocityTrendSchema>;

export const RiskSeveritySchema = z.enum(['info', 'warning', 'critical']);
export type RiskSeverity = z.infer<typeof RiskSeveritySchema>;

export const TeamHealthSchema = z.enum([
  'healthy',
  'at_capacity',
  'overloaded',
]);
export type TeamHealth = z.infer<typeof TeamHealthSchema>;

// ==============================================================================
// Phase Analysis Schemas (Scope Agent)
// ==============================================================================

export const TaskRecommendationSchema = z.object({
  task_id: z.string().min(1).max(100),
  action: TaskActionSchema,
  reason: z.string().max(500),
});
export type TaskRecommendation = z.infer<typeof TaskRecommendationSchema>;

export const PhaseAnalysisSummarySchema = z.object({
  ready_for_completion: z.boolean(),
  blockers: z.array(z.string()).max(20).default([]),
  next_phase_preview: z.string().max(200),
  estimated_time_to_complete: z.string().max(50).nullable().optional(),
});
export type PhaseAnalysisSummary = z.infer<typeof PhaseAnalysisSummarySchema>;

export const IncompleteTaskSchema = z.object({
  id: z.string(),
  title: z.string().max(500),
  status: z.string(),
  task_number: z.number().int().nonnegative(),
});
export type IncompleteTask = z.infer<typeof IncompleteTaskSchema>;

export const PhaseAnalysisOutputSchema = z.object({
  phase_id: z.string(),
  phase_name: z.string().max(200),
  total_tasks: z.number().int().nonnegative(),
  completed_tasks: z.number().int().nonnegative(),
  incomplete_tasks: z.array(IncompleteTaskSchema).default([]),
  recommendations: z.array(TaskRecommendationSchema).max(100).default([]),
  summary: PhaseAnalysisSummarySchema,
});
export type PhaseAnalysisOutput = z.infer<typeof PhaseAnalysisOutputSchema>;

export const PhaseCheckpointOutputSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  checkpoint_date: z.string(),
  status: z.string(),
  description: z.string().max(1000).nullable().optional(),
});
export type PhaseCheckpointOutput = z.infer<typeof PhaseCheckpointOutputSchema>;

export const PhaseTransitionPreviewSchema = z.object({
  tasks_to_complete: z.number().int().nonnegative(),
  tasks_to_carry_over: z.number().int().nonnegative(),
  tasks_to_cancel: z.number().int().nonnegative(),
  affected_tasks: z.array(z.record(z.unknown())).default([]),
});
export type PhaseTransitionPreview = z.infer<
  typeof PhaseTransitionPreviewSchema
>;

export const PhaseTransitionOutputSchema = z.object({
  phase_id: z.string(),
  phase_name: z.string().max(200),
  next_phase_id: z.string().nullable().optional(),
  next_phase_name: z.string().max(200).nullable().optional(),
  transition_preview: PhaseTransitionPreviewSchema,
});
export type PhaseTransitionOutput = z.infer<typeof PhaseTransitionOutputSchema>;

// ==============================================================================
// Health Monitoring Schemas (Pulse Agent)
// ==============================================================================

export const HealthFactorSchema = z.object({
  name: z.string().max(100),
  score: z.number().min(0).max(1),
  description: z.string().max(500).nullable().optional(),
});
export type HealthFactor = z.infer<typeof HealthFactorSchema>;

export const RiskEntrySchema = z.object({
  type: z.string(),
  severity: RiskSeveritySchema,
  title: z.string().max(200),
  description: z.string().max(1000),
  affected_tasks: z.array(z.string()).default([]),
  affected_users: z.array(z.string()).default([]),
});
export type RiskEntry = z.infer<typeof RiskEntrySchema>;

export const HealthScoreFactorsSchema = z.object({
  on_time_delivery: z.number().min(0).max(1),
  blocker_impact: z.number().min(0).max(1),
  team_capacity: z.number().min(0).max(1),
  velocity_trend: z.number().min(0).max(1),
});
export type HealthScoreFactors = z.infer<typeof HealthScoreFactorsSchema>;

export const HealthInsightOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  level: HealthLevelSchema,
  trend: HealthTrendSchema,
  factors: HealthScoreFactorsSchema,
  explanation: z.string().max(1000),
  suggestions: z.array(z.string()).max(10).default([]),
});
export type HealthInsightOutput = z.infer<typeof HealthInsightOutputSchema>;

export const RiskDetectionOutputSchema = z.object({
  risks: z.array(RiskEntrySchema).default([]),
});
export type RiskDetectionOutput = z.infer<typeof RiskDetectionOutputSchema>;

export const TeamCapacityMemberSchema = z.object({
  user_id: z.string(),
  user_name: z.string().nullable().optional(),
  assigned_hours: z.number().nonnegative(),
  threshold: z.number().int().default(40),
  overload_percent: z.number().nonnegative(),
});
export type TeamCapacityMember = z.infer<typeof TeamCapacityMemberSchema>;

export const TeamCapacityOutputSchema = z.object({
  overloaded_members: z.array(TeamCapacityMemberSchema).default([]),
  team_health: TeamHealthSchema,
});
export type TeamCapacityOutput = z.infer<typeof TeamCapacityOutputSchema>;

export const VelocityAnalysisOutputSchema = z.object({
  current_velocity: z.number().nonnegative(),
  baseline_velocity: z.number().nonnegative(),
  change_percent: z.number(),
  trend: VelocityTrendSchema,
  alert: z.boolean(),
});
export type VelocityAnalysisOutput = z.infer<
  typeof VelocityAnalysisOutputSchema
>;

export const BlockerChainSchema = z.object({
  blocker_id: z.string(),
  blocker_title: z.string().max(500),
  blocked_tasks: z.array(z.record(z.unknown())),
  severity: z.enum(['warning', 'critical']),
});
export type BlockerChain = z.infer<typeof BlockerChainSchema>;

export const BlockerChainsOutputSchema = z.object({
  chains: z.array(BlockerChainSchema).default([]),
});
export type BlockerChainsOutput = z.infer<typeof BlockerChainsOutputSchema>;

export const OverdueTaskSchema = z.object({
  id: z.string(),
  title: z.string().max(500),
  due_date: z.string(),
  days_overdue: z.number().int().nonnegative(),
  assignee: z.string().nullable().optional(),
});
export type OverdueTask = z.infer<typeof OverdueTaskSchema>;

export const DueSoonTaskSchema = z.object({
  id: z.string(),
  title: z.string().max(500),
  due_date: z.string(),
  hours_remaining: z.number().nonnegative(),
  assignee: z.string().nullable().optional(),
});
export type DueSoonTask = z.infer<typeof DueSoonTaskSchema>;

export const OverdueTasksOutputSchema = z.object({
  overdue: z.array(OverdueTaskSchema).default([]),
  due_soon: z.array(DueSoonTaskSchema).default([]),
});
export type OverdueTasksOutput = z.infer<typeof OverdueTasksOutputSchema>;

// ==============================================================================
// Estimation Schemas (Sage Agent)
// ==============================================================================

export const SimilarTaskRefSchema = z.object({
  id: z.string(),
  title: z.string().max(500),
  story_points: z.number().int().min(0).max(21).nullable().optional(),
  estimated_hours: z.number().nonnegative().nullable().optional(),
  actual_hours: z.number().nonnegative().nullable().optional(),
});
export type SimilarTaskRef = z.infer<typeof SimilarTaskRefSchema>;

export const EstimationOutputSchema = z.object({
  story_points: z.number().int().min(1).max(21),
  estimated_hours: z.number().nonnegative(),
  confidence_level: ConfidenceLevelSchema,
  confidence_score: z.number().min(0).max(1),
  basis: z.string().max(500),
  cold_start: z.boolean(),
  similar_tasks: z.array(z.string()).max(10).default([]),
  complexity_factors: z.array(z.string()).max(10).default([]),
});
export type EstimationOutput = z.infer<typeof EstimationOutputSchema>;

export const VelocityMetricsOutputSchema = z.object({
  avg_points_per_sprint: z.number().nonnegative().nullable().optional(),
  avg_hours_per_sprint: z.number().nonnegative().nullable().optional(),
  sprint_count: z.number().int().nonnegative(),
});
export type VelocityMetricsOutput = z.infer<typeof VelocityMetricsOutputSchema>;

export const EstimationMetricsOutputSchema = z.object({
  average_error: z.number().nonnegative().nullable().optional(),
  average_accuracy: z.number().nullable().optional(),
  total_estimations: z.number().int().nonnegative(),
});
export type EstimationMetricsOutput = z.infer<
  typeof EstimationMetricsOutputSchema
>;

// ==============================================================================
// Time Tracking Schemas (Chrono Agent)
// ==============================================================================

export const TimeEntryOutputSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  user_id: z.string(),
  hours: z.number().min(0.25).max(24),
  description: z.string().max(500).nullable().optional(),
  date: z.string(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
});
export type TimeEntryOutput = z.infer<typeof TimeEntryOutputSchema>;

export const ActiveTimerOutputSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  task_title: z.string().max(500),
  user_id: z.string(),
  start_time: z.string(),
  elapsed_seconds: z.number().int().nonnegative(),
  description: z.string().max(500).nullable().optional(),
});
export type ActiveTimerOutput = z.infer<typeof ActiveTimerOutputSchema>;

export const VelocityPeriodSchema = z.object({
  period_start: z.string(),
  period_end: z.string(),
  points_completed: z.number().int().nonnegative(),
  hours_logged: z.number().nonnegative(),
});
export type VelocityPeriod = z.infer<typeof VelocityPeriodSchema>;

export const TimeVelocityOutputSchema = z.object({
  current_velocity: z.number().nonnegative(),
  avg_velocity: z.number().nonnegative(),
  avg_hours_per_point: z.number().nonnegative(),
  periods: z.array(VelocityPeriodSchema).default([]),
});
export type TimeVelocityOutput = z.infer<typeof TimeVelocityOutputSchema>;

export const WeeklyVelocitySchema = z.object({
  week_start: z.string(),
  points_completed: z.number().int().nonnegative(),
  trend: VelocityTrendSchema,
});
export type WeeklyVelocity = z.infer<typeof WeeklyVelocitySchema>;

export const TimeSuggestionSchema = z.object({
  task_id: z.string(),
  task_title: z.string().max(500),
  suggested_hours: z.number().min(0.25).max(24),
  reason: z.string().max(500),
  confidence: z.number().min(0).max(1),
});
export type TimeSuggestion = z.infer<typeof TimeSuggestionSchema>;

// ==============================================================================
// Error Output Schema
// ==============================================================================

export const AgentErrorOutputSchema = z.object({
  error: z.string(),
  message: z.string().max(1000),
  status_code: z.number().int().nullable().optional(),
  recoverable: z.boolean().default(true),
});
export type AgentErrorOutput = z.infer<typeof AgentErrorOutputSchema>;

// ==============================================================================
// Validation Helpers
// ==============================================================================

/**
 * Safely parse and validate agent response data.
 * Returns { success: true, data } or { success: false, error }.
 */
export function parseAgentResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): z.SafeParseReturnType<unknown, T> {
  return schema.safeParse(data);
}

/**
 * Check if a response is an error response from an agent tool.
 */
export function isAgentError(data: unknown): data is AgentErrorOutput {
  return AgentErrorOutputSchema.safeParse(data).success;
}

/**
 * Validate and throw if invalid (use in services that expect valid data).
 */
export function validateAgentResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessage = context
      ? `${context}: ${result.error.message}`
      : result.error.message;
    throw new Error(`Invalid agent response: ${errorMessage}`);
  }
  return result.data;
}
