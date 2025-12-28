/**
 * Tests for Agent Response Schemas
 * AI Business Hub - Project Management Module
 *
 * Tests for Zod validation schemas in agent-responses.schema.ts
 */

import { ZodError } from 'zod';
import {
  // Enums
  TaskActionSchema,
  HealthLevelSchema,
  HealthTrendSchema,
  ConfidenceLevelSchema,
  // Phase schemas
  TaskRecommendationSchema,
  PhaseAnalysisSummarySchema,
  PhaseAnalysisOutputSchema,
  IncompleteTaskSchema,
  // Health schemas
  HealthScoreFactorsSchema,
  HealthInsightOutputSchema,
  RiskEntrySchema,
  RiskDetectionOutputSchema,
  TeamCapacityOutputSchema,
  VelocityAnalysisOutputSchema,
  // Estimation schemas
  EstimationOutputSchema,
  SimilarTaskRefSchema,
  VelocityMetricsOutputSchema,
  // Time tracking schemas
  TimeEntryOutputSchema,
  ActiveTimerOutputSchema,
  TimeVelocityOutputSchema,
  WeeklyVelocitySchema,
  TimeSuggestionSchema,
  // Error schema
  AgentErrorOutputSchema,
  // Helpers
  parseAgentResponse,
  isAgentError,
  validateAgentResponse,
} from '../schemas/agent-responses.schema';

describe('Agent Response Schemas', () => {
  describe('Enum Schemas', () => {
    it('should validate TaskAction enum values', () => {
      expect(TaskActionSchema.parse('complete')).toBe('complete');
      expect(TaskActionSchema.parse('carry_over')).toBe('carry_over');
      expect(TaskActionSchema.parse('cancel')).toBe('cancel');
      expect(() => TaskActionSchema.parse('invalid')).toThrow(ZodError);
    });

    it('should validate HealthLevel enum values', () => {
      expect(HealthLevelSchema.parse('EXCELLENT')).toBe('EXCELLENT');
      expect(HealthLevelSchema.parse('GOOD')).toBe('GOOD');
      expect(HealthLevelSchema.parse('WARNING')).toBe('WARNING');
      expect(HealthLevelSchema.parse('CRITICAL')).toBe('CRITICAL');
      expect(() => HealthLevelSchema.parse('POOR')).toThrow(ZodError);
    });

    it('should validate HealthTrend enum values', () => {
      expect(HealthTrendSchema.parse('IMPROVING')).toBe('IMPROVING');
      expect(HealthTrendSchema.parse('STABLE')).toBe('STABLE');
      expect(HealthTrendSchema.parse('DECLINING')).toBe('DECLINING');
    });

    it('should validate ConfidenceLevel enum values', () => {
      expect(ConfidenceLevelSchema.parse('low')).toBe('low');
      expect(ConfidenceLevelSchema.parse('medium')).toBe('medium');
      expect(ConfidenceLevelSchema.parse('high')).toBe('high');
    });
  });

  describe('Phase Analysis Schemas', () => {
    it('should validate TaskRecommendation', () => {
      const valid = {
        task_id: 'task-123',
        action: 'complete',
        reason: 'Task is nearly done',
      };
      expect(TaskRecommendationSchema.parse(valid)).toEqual(valid);
    });

    it('should reject empty task_id', () => {
      const invalid = {
        task_id: '',
        action: 'complete',
        reason: 'Test',
      };
      expect(() => TaskRecommendationSchema.parse(invalid)).toThrow(ZodError);
    });

    it('should validate PhaseAnalysisSummary', () => {
      const valid = {
        ready_for_completion: true,
        blockers: ['Blocker 1'],
        next_phase_preview: 'Testing phase',
        estimated_time_to_complete: '2-3 days',
      };
      expect(PhaseAnalysisSummarySchema.parse(valid)).toEqual(valid);
    });

    it('should validate IncompleteTask with non-negative task_number', () => {
      const valid = {
        id: 'task-456',
        title: 'Implement feature',
        status: 'IN_PROGRESS',
        task_number: 5,
      };
      expect(IncompleteTaskSchema.parse(valid)).toEqual(valid);
    });

    it('should reject negative task_number', () => {
      const invalid = {
        id: 'task-456',
        title: 'Test',
        status: 'TODO',
        task_number: -1,
      };
      expect(() => IncompleteTaskSchema.parse(invalid)).toThrow(ZodError);
    });

    it('should validate full PhaseAnalysisOutput', () => {
      const valid = {
        phase_id: 'phase-001',
        phase_name: 'Development',
        total_tasks: 10,
        completed_tasks: 8,
        incomplete_tasks: [
          { id: 't1', title: 'Task 1', status: 'IN_PROGRESS', task_number: 1 },
        ],
        recommendations: [
          { task_id: 't1', action: 'complete', reason: 'Almost done' },
        ],
        summary: {
          ready_for_completion: true,
          blockers: [],
          next_phase_preview: 'Testing',
        },
      };
      const result = PhaseAnalysisOutputSchema.parse(valid);
      expect(result.phase_id).toBe('phase-001');
      expect(result.incomplete_tasks).toHaveLength(1);
    });
  });

  describe('Health Monitoring Schemas', () => {
    it('should validate HealthScoreFactors within 0-1 range', () => {
      const valid = {
        on_time_delivery: 0.85,
        blocker_impact: 0.9,
        team_capacity: 0.75,
        velocity_trend: 0.8,
      };
      expect(HealthScoreFactorsSchema.parse(valid)).toEqual(valid);
    });

    it('should reject factors outside 0-1 range', () => {
      const invalid = {
        on_time_delivery: 1.5,
        blocker_impact: 0.9,
        team_capacity: 0.75,
        velocity_trend: 0.8,
      };
      expect(() => HealthScoreFactorsSchema.parse(invalid)).toThrow(ZodError);
    });

    it('should validate HealthInsightOutput', () => {
      const valid = {
        score: 85,
        level: 'EXCELLENT',
        trend: 'IMPROVING',
        factors: {
          on_time_delivery: 0.9,
          blocker_impact: 0.85,
          team_capacity: 0.8,
          velocity_trend: 0.75,
        },
        explanation: 'Project is on track',
        suggestions: ['Keep up the good work'],
      };
      const result = HealthInsightOutputSchema.parse(valid);
      expect(result.score).toBe(85);
      expect(result.level).toBe('EXCELLENT');
    });

    it('should reject score outside 0-100 range', () => {
      const invalid = {
        score: 150,
        level: 'EXCELLENT',
        trend: 'STABLE',
        factors: {
          on_time_delivery: 0.9,
          blocker_impact: 0.85,
          team_capacity: 0.8,
          velocity_trend: 0.75,
        },
        explanation: 'Test',
      };
      expect(() => HealthInsightOutputSchema.parse(invalid)).toThrow(ZodError);
    });

    it('should validate RiskEntry', () => {
      const valid = {
        type: 'deadline_warning',
        severity: 'critical',
        title: '5 tasks due in 48h',
        description: 'Multiple deadlines approaching',
        affected_tasks: ['t1', 't2', 't3'],
        affected_users: ['user1'],
      };
      expect(RiskEntrySchema.parse(valid)).toEqual(valid);
    });

    it('should validate RiskDetectionOutput with empty risks', () => {
      const valid = { risks: [] };
      expect(RiskDetectionOutputSchema.parse(valid)).toEqual(valid);
    });

    it('should validate TeamCapacityOutput', () => {
      const valid = {
        overloaded_members: [
          {
            user_id: 'user1',
            user_name: 'John Doe',
            assigned_hours: 50,
            threshold: 40,
            overload_percent: 25,
          },
        ],
        team_health: 'overloaded',
      };
      const result = TeamCapacityOutputSchema.parse(valid);
      expect(result.team_health).toBe('overloaded');
    });

    it('should validate VelocityAnalysisOutput', () => {
      const valid = {
        current_velocity: 15,
        baseline_velocity: 20,
        change_percent: -25,
        trend: 'down',
        alert: false,
      };
      expect(VelocityAnalysisOutputSchema.parse(valid)).toEqual(valid);
    });
  });

  describe('Estimation Schemas', () => {
    it('should validate EstimationOutput', () => {
      const valid = {
        story_points: 5,
        estimated_hours: 12,
        confidence_level: 'medium',
        confidence_score: 0.65,
        basis: 'Based on 3 similar tasks',
        cold_start: false,
        similar_tasks: ['t1', 't2', 't3'],
        complexity_factors: ['Integration required'],
      };
      const result = EstimationOutputSchema.parse(valid);
      expect(result.story_points).toBe(5);
    });

    it('should reject story_points outside 1-21 range', () => {
      const tooLow = {
        story_points: 0,
        estimated_hours: 8,
        confidence_level: 'low',
        confidence_score: 0.3,
        basis: 'Test',
        cold_start: true,
      };
      expect(() => EstimationOutputSchema.parse(tooLow)).toThrow(ZodError);

      const tooHigh = {
        story_points: 34,
        estimated_hours: 8,
        confidence_level: 'low',
        confidence_score: 0.3,
        basis: 'Test',
        cold_start: true,
      };
      expect(() => EstimationOutputSchema.parse(tooHigh)).toThrow(ZodError);
    });

    it('should validate SimilarTaskRef with optional fields', () => {
      const valid = {
        id: 'task-123',
        title: 'Similar Task',
        story_points: 3,
        estimated_hours: 8,
        actual_hours: 10,
      };
      expect(SimilarTaskRefSchema.parse(valid)).toEqual(valid);

      const minimal = {
        id: 'task-456',
        title: 'Another Task',
      };
      expect(SimilarTaskRefSchema.parse(minimal)).toMatchObject(minimal);
    });

    it('should validate VelocityMetricsOutput with null values', () => {
      const valid = {
        avg_points_per_sprint: null,
        avg_hours_per_sprint: null,
        sprint_count: 0,
      };
      const result = VelocityMetricsOutputSchema.parse(valid);
      expect(result.avg_points_per_sprint).toBeNull();
      expect(result.sprint_count).toBe(0);
    });
  });

  describe('Time Tracking Schemas', () => {
    it('should validate TimeEntryOutput', () => {
      const valid = {
        id: 'entry-123',
        task_id: 'task-456',
        user_id: 'user-789',
        hours: 2.5,
        description: 'Worked on feature',
        date: '2024-01-15',
        start_time: '2024-01-15T09:00:00Z',
        end_time: '2024-01-15T11:30:00Z',
      };
      expect(TimeEntryOutputSchema.parse(valid)).toEqual(valid);
    });

    it('should reject hours outside 0.25-24 range', () => {
      const tooLow = {
        id: 'entry-123',
        task_id: 'task-456',
        user_id: 'user-789',
        hours: 0.1,
        date: '2024-01-15',
      };
      expect(() => TimeEntryOutputSchema.parse(tooLow)).toThrow(ZodError);

      const tooHigh = {
        id: 'entry-123',
        task_id: 'task-456',
        user_id: 'user-789',
        hours: 25,
        date: '2024-01-15',
      };
      expect(() => TimeEntryOutputSchema.parse(tooHigh)).toThrow(ZodError);
    });

    it('should validate ActiveTimerOutput', () => {
      const valid = {
        id: 'timer-123',
        task_id: 'task-456',
        task_title: 'Working on feature',
        user_id: 'user-789',
        start_time: '2024-01-15T09:00:00Z',
        elapsed_seconds: 3600,
      };
      expect(ActiveTimerOutputSchema.parse(valid)).toEqual(valid);
    });

    it('should validate TimeVelocityOutput', () => {
      const valid = {
        current_velocity: 18,
        avg_velocity: 20,
        avg_hours_per_point: 4,
        periods: [
          {
            period_start: '2024-01-01',
            period_end: '2024-01-14',
            points_completed: 18,
            hours_logged: 72,
          },
        ],
      };
      const result = TimeVelocityOutputSchema.parse(valid);
      expect(result.periods).toHaveLength(1);
    });

    it('should validate WeeklyVelocity', () => {
      const valid = {
        week_start: '2024-01-08',
        points_completed: 12,
        trend: 'up',
      };
      expect(WeeklyVelocitySchema.parse(valid)).toEqual(valid);
    });

    it('should validate TimeSuggestion', () => {
      const valid = {
        task_id: 'task-123',
        task_title: 'Review PR',
        suggested_hours: 1.5,
        reason: 'Based on commit activity',
        confidence: 0.8,
      };
      expect(TimeSuggestionSchema.parse(valid)).toEqual(valid);
    });
  });

  describe('AgentErrorOutput Schema', () => {
    it('should validate error output with all fields', () => {
      const valid = {
        error: 'PHASE_ANALYSIS_FAILED',
        message: 'Failed to analyze phase: HTTP 500',
        status_code: 500,
        recoverable: true,
      };
      expect(AgentErrorOutputSchema.parse(valid)).toEqual(valid);
    });

    it('should validate minimal error output', () => {
      const minimal = {
        error: 'NETWORK_ERROR',
        message: 'Connection timeout',
      };
      const result = AgentErrorOutputSchema.parse(minimal);
      expect(result.status_code).toBeUndefined();
      expect(result.recoverable).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('should parseAgentResponse safely', () => {
      const valid = {
        story_points: 5,
        estimated_hours: 12,
        confidence_level: 'medium',
        confidence_score: 0.65,
        basis: 'Test',
        cold_start: false,
      };
      const result = parseAgentResponse(EstimationOutputSchema, valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.story_points).toBe(5);
      }
    });

    it('should return error for invalid data in parseAgentResponse', () => {
      const invalid = { story_points: 'not a number' };
      const result = parseAgentResponse(EstimationOutputSchema, invalid);
      expect(result.success).toBe(false);
    });

    it('should identify error responses with isAgentError', () => {
      const error = {
        error: 'TEST_ERROR',
        message: 'Test message',
        recoverable: true,
      };
      expect(isAgentError(error)).toBe(true);

      const notError = { story_points: 5 };
      expect(isAgentError(notError)).toBe(false);
    });

    it('should validateAgentResponse and throw on invalid', () => {
      const valid = {
        story_points: 5,
        estimated_hours: 12,
        confidence_level: 'medium',
        confidence_score: 0.65,
        basis: 'Test',
        cold_start: false,
      };
      expect(() =>
        validateAgentResponse(EstimationOutputSchema, valid),
      ).not.toThrow();

      const invalid = { story_points: 'not a number' };
      expect(() =>
        validateAgentResponse(EstimationOutputSchema, invalid, 'TestContext'),
      ).toThrow(/Invalid agent response/);
    });
  });

  describe('Default Values', () => {
    it('should apply default empty arrays for risks', () => {
      const minimal = {};
      const result = RiskDetectionOutputSchema.parse(minimal);
      expect(result.risks).toEqual([]);
    });

    it('should apply default empty arrays for blockers', () => {
      const minimal = {
        ready_for_completion: true,
        next_phase_preview: 'Next phase',
      };
      const result = PhaseAnalysisSummarySchema.parse(minimal);
      expect(result.blockers).toEqual([]);
    });
  });
});
