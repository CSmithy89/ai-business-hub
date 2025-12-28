"""
Tests for Structured Output Models
AI Business Hub - Project Management Module

Tests for Pydantic models in structured_outputs.py
"""

import pytest
from pydantic import ValidationError

from ..tools.structured_outputs import (
    # Enums
    TaskAction,
    HealthLevel,
    HealthTrend,
    ConfidenceLevel,
    VelocityTrend,
    # Phase models
    PhaseAnalysisOutput,
    PhaseAnalysisSummary,
    IncompleteTask,
    TaskRecommendation,
    PhaseCheckpointOutput,
    PhaseTransitionOutput,
    PhaseTransitionPreview,
    # Health models
    HealthInsightOutput,
    HealthScoreFactors,
    RiskDetectionOutput,
    RiskEntry,
    TeamCapacityOutput,
    TeamCapacityMember,
    VelocityAnalysisOutput,
    BlockerChainsOutput,
    BlockerChain,
    OverdueTasksOutput,
    OverdueTask,
    DueSoonTask,
    # Estimation models
    EstimationOutput,
    VelocityMetricsOutput,
    EstimationMetricsOutput,
    SimilarTaskRef,
    # Time tracking models
    TimeEntryOutput,
    ActiveTimerOutput,
    TimeVelocityOutput,
    VelocityPeriod,
    WeeklyVelocity,
    TimeSuggestion,
    # Error model
    AgentErrorOutput,
)


class TestEnums:
    """Test enum definitions."""

    def test_task_action_values(self):
        assert TaskAction.COMPLETE == "complete"
        assert TaskAction.CARRY_OVER == "carry_over"
        assert TaskAction.CANCEL == "cancel"

    def test_health_level_values(self):
        assert HealthLevel.EXCELLENT == "EXCELLENT"
        assert HealthLevel.GOOD == "GOOD"
        assert HealthLevel.WARNING == "WARNING"
        assert HealthLevel.CRITICAL == "CRITICAL"

    def test_health_trend_values(self):
        assert HealthTrend.IMPROVING == "IMPROVING"
        assert HealthTrend.STABLE == "STABLE"
        assert HealthTrend.DECLINING == "DECLINING"

    def test_confidence_level_values(self):
        assert ConfidenceLevel.LOW == "low"
        assert ConfidenceLevel.MEDIUM == "medium"
        assert ConfidenceLevel.HIGH == "high"


class TestPhaseAnalysisModels:
    """Test phase analysis structured output models."""

    def test_task_recommendation_valid(self):
        rec = TaskRecommendation(
            task_id="task-123",
            action=TaskAction.COMPLETE,
            reason="Task is nearly done",
        )
        assert rec.task_id == "task-123"
        assert rec.action == TaskAction.COMPLETE

    def test_task_recommendation_invalid_empty_task_id(self):
        with pytest.raises(ValidationError):
            TaskRecommendation(
                task_id="",  # Empty not allowed
                action=TaskAction.COMPLETE,
                reason="Test",
            )

    def test_phase_analysis_summary_valid(self):
        summary = PhaseAnalysisSummary(
            ready_for_completion=True,
            blockers=["Blocker 1"],
            next_phase_preview="Next: Beta Testing",
            estimated_time_to_complete="2-3 days",
        )
        assert summary.ready_for_completion is True
        assert len(summary.blockers) == 1

    def test_incomplete_task_valid(self):
        task = IncompleteTask(
            id="task-456",
            title="Implement feature X",
            status="IN_PROGRESS",
            task_number=5,
        )
        assert task.task_number == 5

    def test_incomplete_task_negative_task_number(self):
        with pytest.raises(ValidationError):
            IncompleteTask(
                id="task-456",
                title="Test",
                status="TODO",
                task_number=-1,  # Negative not allowed
            )

    def test_phase_analysis_output_full(self):
        output = PhaseAnalysisOutput(
            phase_id="phase-001",
            phase_name="Development",
            total_tasks=10,
            completed_tasks=8,
            incomplete_tasks=[
                IncompleteTask(
                    id="t1",
                    title="Task 1",
                    status="IN_PROGRESS",
                    task_number=1,
                )
            ],
            recommendations=[
                TaskRecommendation(
                    task_id="t1",
                    action=TaskAction.COMPLETE,
                    reason="Almost done",
                )
            ],
            summary=PhaseAnalysisSummary(
                ready_for_completion=True,
                blockers=[],
                next_phase_preview="Testing",
            ),
        )
        assert output.total_tasks == 10
        assert len(output.incomplete_tasks) == 1
        assert len(output.recommendations) == 1


class TestHealthModels:
    """Test health monitoring structured output models."""

    def test_health_score_factors_valid(self):
        factors = HealthScoreFactors(
            on_time_delivery=0.85,
            blocker_impact=0.90,
            team_capacity=0.75,
            velocity_trend=0.80,
        )
        assert factors.on_time_delivery == 0.85

    def test_health_score_factors_out_of_range(self):
        with pytest.raises(ValidationError):
            HealthScoreFactors(
                on_time_delivery=1.5,  # > 1.0 not allowed
                blocker_impact=0.90,
                team_capacity=0.75,
                velocity_trend=0.80,
            )

    def test_health_insight_output_valid(self):
        output = HealthInsightOutput(
            score=85,
            level=HealthLevel.EXCELLENT,
            trend=HealthTrend.IMPROVING,
            factors=HealthScoreFactors(
                on_time_delivery=0.90,
                blocker_impact=0.85,
                team_capacity=0.80,
                velocity_trend=0.75,
            ),
            explanation="Project is on track",
            suggestions=["Keep up the good work"],
        )
        assert output.score == 85
        assert output.level == HealthLevel.EXCELLENT

    def test_health_insight_score_bounds(self):
        with pytest.raises(ValidationError):
            HealthInsightOutput(
                score=150,  # > 100 not allowed
                level=HealthLevel.EXCELLENT,
                trend=HealthTrend.STABLE,
                factors=HealthScoreFactors(
                    on_time_delivery=0.90,
                    blocker_impact=0.85,
                    team_capacity=0.80,
                    velocity_trend=0.75,
                ),
                explanation="Test",
            )

    def test_risk_entry_valid(self):
        risk = RiskEntry(
            type="deadline_warning",
            severity="critical",
            title="5 tasks due in 48h",
            description="Multiple deadlines approaching",
            affected_tasks=["t1", "t2", "t3"],
            affected_users=["user1"],
        )
        assert risk.severity == "critical"
        assert len(risk.affected_tasks) == 3

    def test_team_capacity_output_valid(self):
        output = TeamCapacityOutput(
            overloaded_members=[
                TeamCapacityMember(
                    user_id="user1",
                    user_name="John Doe",
                    assigned_hours=50.0,
                    threshold=40,
                    overload_percent=25.0,
                )
            ],
            team_health="overloaded",
        )
        assert output.team_health == "overloaded"
        assert len(output.overloaded_members) == 1

    def test_velocity_analysis_output_valid(self):
        output = VelocityAnalysisOutput(
            current_velocity=15.0,
            baseline_velocity=20.0,
            change_percent=-25.0,
            trend=VelocityTrend.DOWN,
            alert=False,
        )
        assert output.change_percent == -25.0
        assert output.trend == VelocityTrend.DOWN

    def test_blocker_chain_valid(self):
        chain = BlockerChain(
            blocker_id="task-blocker",
            blocker_title="API Integration",
            blocked_tasks=[{"id": "t1", "title": "Task 1"}],
            severity="warning",
        )
        assert chain.severity == "warning"


class TestEstimationModels:
    """Test estimation structured output models."""

    def test_estimation_output_valid(self):
        output = EstimationOutput(
            story_points=5,
            estimated_hours=12.0,
            confidence_level=ConfidenceLevel.MEDIUM,
            confidence_score=0.65,
            basis="Based on 3 similar tasks",
            cold_start=False,
            similar_tasks=["t1", "t2", "t3"],
            complexity_factors=["Integration required"],
        )
        assert output.story_points == 5
        assert output.cold_start is False

    def test_estimation_output_story_points_bounds(self):
        # Story points should be 1-21
        with pytest.raises(ValidationError):
            EstimationOutput(
                story_points=0,  # < 1 not allowed
                estimated_hours=8.0,
                confidence_level=ConfidenceLevel.LOW,
                confidence_score=0.3,
                basis="Test",
                cold_start=True,
            )

        with pytest.raises(ValidationError):
            EstimationOutput(
                story_points=34,  # > 21 not allowed
                estimated_hours=8.0,
                confidence_level=ConfidenceLevel.LOW,
                confidence_score=0.3,
                basis="Test",
                cold_start=True,
            )

    def test_similar_task_ref_valid(self):
        ref = SimilarTaskRef(
            id="task-123",
            title="Similar Task",
            story_points=3,
            estimated_hours=8.0,
            actual_hours=10.0,
        )
        assert ref.actual_hours == 10.0

    def test_velocity_metrics_output_nullable(self):
        # Test with null values (cold start case)
        output = VelocityMetricsOutput(
            avg_points_per_sprint=None,
            avg_hours_per_sprint=None,
            sprint_count=0,
        )
        assert output.avg_points_per_sprint is None
        assert output.sprint_count == 0


class TestTimeTrackingModels:
    """Test time tracking structured output models."""

    def test_time_entry_output_valid(self):
        entry = TimeEntryOutput(
            id="entry-123",
            task_id="task-456",
            user_id="user-789",
            hours=2.5,
            description="Worked on feature",
            date="2024-01-15",
            start_time="2024-01-15T09:00:00Z",
            end_time="2024-01-15T11:30:00Z",
        )
        assert entry.hours == 2.5

    def test_time_entry_output_hours_bounds(self):
        with pytest.raises(ValidationError):
            TimeEntryOutput(
                id="entry-123",
                task_id="task-456",
                user_id="user-789",
                hours=0.1,  # < 0.25 not allowed
                date="2024-01-15",
            )

        with pytest.raises(ValidationError):
            TimeEntryOutput(
                id="entry-123",
                task_id="task-456",
                user_id="user-789",
                hours=25.0,  # > 24 not allowed
                date="2024-01-15",
            )

    def test_active_timer_output_valid(self):
        timer = ActiveTimerOutput(
            id="timer-123",
            task_id="task-456",
            task_title="Working on feature",
            user_id="user-789",
            start_time="2024-01-15T09:00:00Z",
            elapsed_seconds=3600,
        )
        assert timer.elapsed_seconds == 3600

    def test_velocity_period_valid(self):
        period = VelocityPeriod(
            period_start="2024-01-01",
            period_end="2024-01-14",
            points_completed=21,
            hours_logged=80.0,
        )
        assert period.points_completed == 21

    def test_time_velocity_output_valid(self):
        output = TimeVelocityOutput(
            current_velocity=18.0,
            avg_velocity=20.0,
            avg_hours_per_point=4.0,
            periods=[
                VelocityPeriod(
                    period_start="2024-01-01",
                    period_end="2024-01-14",
                    points_completed=18,
                    hours_logged=72.0,
                )
            ],
        )
        assert len(output.periods) == 1

    def test_weekly_velocity_valid(self):
        velocity = WeeklyVelocity(
            week_start="2024-01-08",
            points_completed=12,
            trend=VelocityTrend.UP,
        )
        assert velocity.trend == VelocityTrend.UP

    def test_time_suggestion_valid(self):
        suggestion = TimeSuggestion(
            task_id="task-123",
            task_title="Review PR",
            suggested_hours=1.5,
            reason="Based on commit activity",
            confidence=0.8,
        )
        assert suggestion.suggested_hours == 1.5
        assert suggestion.confidence == 0.8


class TestAgentErrorOutput:
    """Test agent error output model."""

    def test_agent_error_output_valid(self):
        error = AgentErrorOutput(
            error="PHASE_ANALYSIS_FAILED",
            message="Failed to analyze phase: HTTP 500",
            status_code=500,
            recoverable=True,
        )
        assert error.error == "PHASE_ANALYSIS_FAILED"
        assert error.status_code == 500

    def test_agent_error_output_minimal(self):
        error = AgentErrorOutput(
            error="NETWORK_ERROR",
            message="Connection timeout",
        )
        assert error.status_code is None
        assert error.recoverable is True  # Default


class TestModelSerialization:
    """Test model serialization/deserialization."""

    def test_estimation_output_to_dict(self):
        output = EstimationOutput(
            story_points=5,
            estimated_hours=12.0,
            confidence_level=ConfidenceLevel.HIGH,
            confidence_score=0.85,
            basis="Based on historical data",
            cold_start=False,
        )
        data = output.model_dump()
        assert data["story_points"] == 5
        assert data["confidence_level"] == "high"

    def test_estimation_output_from_dict(self):
        data = {
            "story_points": 8,
            "estimated_hours": 20.0,
            "confidence_level": "medium",
            "confidence_score": 0.65,
            "basis": "Test basis",
            "cold_start": True,
            "similar_tasks": [],
            "complexity_factors": ["Complex"],
        }
        output = EstimationOutput.model_validate(data)
        assert output.story_points == 8
        assert output.confidence_level == ConfidenceLevel.MEDIUM

    def test_health_insight_output_json_round_trip(self):
        original = HealthInsightOutput(
            score=75,
            level=HealthLevel.GOOD,
            trend=HealthTrend.STABLE,
            factors=HealthScoreFactors(
                on_time_delivery=0.80,
                blocker_impact=0.75,
                team_capacity=0.70,
                velocity_trend=0.65,
            ),
            explanation="Good progress",
            suggestions=["Consider adding more tests"],
        )
        json_str = original.model_dump_json()
        restored = HealthInsightOutput.model_validate_json(json_str)
        assert restored.score == original.score
        assert restored.factors.on_time_delivery == original.factors.on_time_delivery
