"""
Dashboard State Schema Tests

Unit tests for the dashboard state Pydantic models, validation,
and cross-language compatibility with TypeScript.

Epic: DM-04 | Story: DM-04.1
"""

import json
import time
from datetime import datetime

import pytest
from pydantic import ValidationError

from .dashboard_state import (
    STATE_VERSION,
    ActivityEntry,
    ActivityState,
    AlertEntry,
    AlertType,
    DashboardState,
    LoadingState,
    MetricEntry,
    MetricsState,
    ProjectStatus,
    ProjectStatusState,
    TrendDirection,
    WidgetsState,
)


class TestStateVersion:
    """Tests for STATE_VERSION constant."""

    def test_state_version_is_one(self):
        """State version should be 1 for initial schema."""
        assert STATE_VERSION == 1


class TestProjectStatus:
    """Tests for ProjectStatus enum."""

    def test_project_status_values(self):
        """All status values should be kebab-case strings."""
        assert ProjectStatus.ON_TRACK.value == "on-track"
        assert ProjectStatus.AT_RISK.value == "at-risk"
        assert ProjectStatus.BEHIND.value == "behind"
        assert ProjectStatus.COMPLETED.value == "completed"


class TestTrendDirection:
    """Tests for TrendDirection enum."""

    def test_trend_direction_values(self):
        """All trend values should be lowercase strings."""
        assert TrendDirection.UP.value == "up"
        assert TrendDirection.DOWN.value == "down"
        assert TrendDirection.NEUTRAL.value == "neutral"


class TestAlertType:
    """Tests for AlertType enum."""

    def test_alert_type_values(self):
        """All alert types should be lowercase strings."""
        assert AlertType.ERROR.value == "error"
        assert AlertType.WARNING.value == "warning"
        assert AlertType.INFO.value == "info"
        assert AlertType.SUCCESS.value == "success"


class TestProjectStatusState:
    """Tests for ProjectStatusState model."""

    def get_valid_data(self) -> dict:
        """Return valid project status data."""
        return {
            "projectId": "proj-123",
            "name": "Test Project",
            "status": "on-track",
            "progress": 75,
            "tasksCompleted": 15,
            "tasksTotal": 20,
            "lastUpdated": int(time.time() * 1000),
        }

    def test_validates_with_all_required_fields(self):
        """Should validate with all required fields present."""
        data = self.get_valid_data()
        state = ProjectStatusState(**data)
        assert state.project_id == "proj-123"
        assert state.name == "Test Project"
        assert state.status == ProjectStatus.ON_TRACK
        assert state.progress == 75

    def test_validates_with_snake_case_input(self):
        """Should accept snake_case field names due to populate_by_name."""
        data = {
            "project_id": "proj-456",
            "name": "Snake Case Project",
            "status": "at-risk",
            "progress": 50,
            "tasks_completed": 5,
            "tasks_total": 10,
            "last_updated": int(time.time() * 1000),
        }
        state = ProjectStatusState(**data)
        assert state.project_id == "proj-456"
        assert state.tasks_completed == 5

    def test_rejects_invalid_status_values(self):
        """Should reject invalid status enum values."""
        data = self.get_valid_data()
        data["status"] = "invalid-status"
        with pytest.raises(ValidationError):
            ProjectStatusState(**data)

    def test_rejects_progress_out_of_range(self):
        """Should reject progress values outside 0-100."""
        data = self.get_valid_data()

        data["progress"] = -1
        with pytest.raises(ValidationError):
            ProjectStatusState(**data)

        data["progress"] = 101
        with pytest.raises(ValidationError):
            ProjectStatusState(**data)

    def test_rejects_negative_task_counts(self):
        """Should reject negative task counts."""
        data = self.get_valid_data()
        data["tasksCompleted"] = -1
        with pytest.raises(ValidationError):
            ProjectStatusState(**data)

    def test_optional_summary_field(self):
        """Should accept optional summary field."""
        data = self.get_valid_data()
        data["summary"] = "Project is progressing well"
        state = ProjectStatusState(**data)
        assert state.summary == "Project is progressing well"

    def test_to_dict_produces_camelcase(self):
        """model_dump with by_alias should produce camelCase keys."""
        data = self.get_valid_data()
        state = ProjectStatusState(**data)
        output = state.model_dump(by_alias=True)

        assert "projectId" in output
        assert "tasksCompleted" in output
        assert "tasksTotal" in output
        assert "lastUpdated" in output
        # Should not have snake_case keys
        assert "project_id" not in output


class TestMetricEntry:
    """Tests for MetricEntry model."""

    def test_validates_with_number_value(self):
        """Should accept numeric values."""
        entry = MetricEntry(id="m1", label="Count", value=42)
        assert entry.value == 42

    def test_validates_with_string_value(self):
        """Should accept string values."""
        entry = MetricEntry(id="m2", label="Status", value="95%")
        assert entry.value == "95%"

    def test_handles_optional_trend_field(self):
        """Should handle optional trend field correctly."""
        # Without trend
        entry1 = MetricEntry(id="m1", label="Test", value=1)
        assert entry1.trend is None

        # With trend
        entry2 = MetricEntry(id="m2", label="Test", value=2, trend="up")
        assert entry2.trend == TrendDirection.UP

    def test_change_percent_alias(self):
        """Should handle changePercent alias correctly."""
        entry = MetricEntry(
            id="m1",
            label="Revenue",
            value=50000,
            changePercent=10.5,
        )
        assert entry.change_percent == 10.5

        output = entry.model_dump(by_alias=True)
        assert "changePercent" in output


class TestMetricsState:
    """Tests for MetricsState model."""

    def test_default_title(self):
        """Should use default title when not provided."""
        state = MetricsState(metrics=[], lastUpdated=int(time.time() * 1000))
        assert state.title == "Key Metrics"

    def test_multiple_metrics(self):
        """Should handle multiple metrics."""
        state = MetricsState(
            title="Sprint Metrics",
            metrics=[
                MetricEntry(id="m1", label="Velocity", value=32),
                MetricEntry(id="m2", label="Bugs", value=5, trend="down"),
            ],
            period="Last 2 weeks",
            lastUpdated=int(time.time() * 1000),
        )
        assert len(state.metrics) == 2


class TestActivityEntry:
    """Tests for ActivityEntry model."""

    def test_validates_activity_entry(self):
        """Should validate activity entry with required fields."""
        entry = ActivityEntry(
            id="act-1",
            user="John Doe",
            action="completed task",
            timestamp=int(time.time() * 1000),
        )
        assert entry.user == "John Doe"
        assert entry.target is None

    def test_optional_fields(self):
        """Should handle optional fields correctly."""
        entry = ActivityEntry(
            id="act-2",
            user="Jane",
            action="updated",
            target="Task XYZ",
            timestamp=int(time.time() * 1000),
            projectId="proj-123",
            userAvatar="https://example.com/avatar.png",
        )
        assert entry.target == "Task XYZ"
        assert entry.project_id == "proj-123"
        assert entry.user_avatar == "https://example.com/avatar.png"


class TestActivityState:
    """Tests for ActivityState model."""

    def test_default_has_more(self):
        """Should default hasMore to False."""
        state = ActivityState(
            activities=[],
            lastUpdated=int(time.time() * 1000),
        )
        assert state.has_more is False

    def test_has_more_alias(self):
        """Should handle hasMore alias correctly."""
        state = ActivityState(
            activities=[],
            hasMore=True,
            lastUpdated=int(time.time() * 1000),
        )
        assert state.has_more is True

        output = state.model_dump(by_alias=True)
        assert output["hasMore"] is True


class TestAlertEntry:
    """Tests for AlertEntry model."""

    def test_all_alert_types(self):
        """Should accept all alert types."""
        for alert_type in AlertType:
            entry = AlertEntry(
                id="a1",
                type=alert_type,
                title="Test",
                message="Test message",
                timestamp=int(time.time() * 1000),
            )
            assert entry.type == alert_type

    def test_uses_enum_values_correctly(self):
        """Enum should serialize to string value."""
        entry = AlertEntry(
            id="a1",
            type=AlertType.WARNING,
            title="Warning",
            message="This is a warning",
            timestamp=int(time.time() * 1000),
        )
        output = entry.model_dump(by_alias=True)
        assert output["type"] == "warning"

    def test_default_dismissable_and_dismissed(self):
        """Should default dismissable to True and dismissed to False."""
        entry = AlertEntry(
            id="a1",
            type="info",
            title="Info",
            message="FYI",
            timestamp=int(time.time() * 1000),
        )
        assert entry.dismissable is True
        assert entry.dismissed is False

    def test_action_fields(self):
        """Should handle action fields correctly."""
        entry = AlertEntry(
            id="a1",
            type="success",
            title="Success",
            message="Action completed",
            timestamp=int(time.time() * 1000),
            actionLabel="View Details",
            actionUrl="/details/123",
        )
        assert entry.action_label == "View Details"
        assert entry.action_url == "/details/123"


class TestLoadingState:
    """Tests for LoadingState model."""

    def test_default_values(self):
        """Should provide sensible defaults."""
        state = LoadingState()
        assert state.is_loading is False
        assert state.loading_agents == []
        assert state.started_at is None

    def test_with_loading_agents(self):
        """Should track loading agents correctly."""
        state = LoadingState(
            isLoading=True,
            loadingAgents=["navi", "pulse"],
            startedAt=int(time.time() * 1000),
        )
        assert state.is_loading is True
        assert state.loading_agents == ["navi", "pulse"]


class TestWidgetsState:
    """Tests for WidgetsState model."""

    def test_all_widgets_can_be_none(self):
        """All widgets except alerts can be None."""
        state = WidgetsState(
            projectStatus=None,
            metrics=None,
            activity=None,
            alerts=[],
        )
        assert state.project_status is None
        assert state.metrics is None
        assert state.activity is None
        assert state.alerts == []

    def test_with_populated_widgets(self):
        """Should handle populated widget states."""
        now = int(time.time() * 1000)
        state = WidgetsState(
            projectStatus=ProjectStatusState(
                projectId="p1",
                name="Project 1",
                status="on-track",
                progress=50,
                tasksCompleted=5,
                tasksTotal=10,
                lastUpdated=now,
            ),
            metrics=None,
            activity=None,
            alerts=[],
        )
        assert state.project_status is not None
        assert state.project_status.name == "Project 1"


class TestDashboardState:
    """Tests for DashboardState model."""

    def test_create_initial_returns_valid_state(self):
        """create_initial() should return valid empty state."""
        state = DashboardState.create_initial()

        assert state.version == STATE_VERSION
        assert state.active_project is None
        assert state.widgets.project_status is None
        assert state.widgets.metrics is None
        assert state.widgets.activity is None
        assert state.widgets.alerts == []
        assert state.loading.is_loading is False
        assert state.errors == {}
        assert state.timestamp > 0

    def test_create_initial_with_context(self):
        """create_initial() should accept context parameters."""
        state = DashboardState.create_initial(
            workspace_id="ws-123",
            user_id="user-456",
            active_project="proj-789",
        )

        assert state.workspace_id == "ws-123"
        assert state.user_id == "user-456"
        assert state.active_project == "proj-789"

    def test_to_frontend_dict_produces_camelcase(self):
        """to_frontend_dict() should produce camelCase keys."""
        state = DashboardState.create_initial(
            workspace_id="ws-1",
            user_id="user-1",
            active_project="proj-1",
        )

        output = state.to_frontend_dict()

        # Check top-level keys
        assert "workspaceId" in output
        assert "userId" in output
        assert "activeProject" in output

        # Should NOT have snake_case keys
        assert "workspace_id" not in output
        assert "user_id" not in output
        assert "active_project" not in output

        # Check nested keys
        assert "isLoading" in output["loading"]
        assert "loadingAgents" in output["loading"]

    def test_to_frontend_dict_excludes_none(self):
        """to_frontend_dict() should exclude None values."""
        state = DashboardState.create_initial()
        output = state.to_frontend_dict()

        # workspace_id and user_id are None, should not be in output
        assert "workspaceId" not in output
        assert "userId" not in output

    def test_json_roundtrip(self):
        """State should survive JSON round-trip."""
        now = int(time.time() * 1000)
        state = DashboardState(
            version=1,
            timestamp=now,
            activeProject="proj-1",
            workspaceId="ws-1",
            userId="user-1",
            widgets=WidgetsState(
                projectStatus=ProjectStatusState(
                    projectId="p1",
                    name="Test",
                    status="on-track",
                    progress=50,
                    tasksCompleted=5,
                    tasksTotal=10,
                    lastUpdated=now,
                ),
            ),
        )

        # Serialize to JSON
        json_str = state.model_dump_json(by_alias=True)

        # Parse back
        parsed = json.loads(json_str)

        # Reconstruct
        restored = DashboardState(**parsed)

        assert restored.active_project == "proj-1"
        assert restored.widgets.project_status is not None
        assert restored.widgets.project_status.name == "Test"


class TestCrossLanguageCompatibility:
    """Tests for cross-language compatibility with TypeScript."""

    def test_python_output_matches_typescript_expectations(self):
        """Python model_dump(by_alias=True) should match TypeScript JSON structure."""
        now = int(time.time() * 1000)
        state = DashboardState.create_initial(workspace_id="ws-1", user_id="user-1")
        state.widgets.project_status = ProjectStatusState(
            projectId="proj-1",
            name="Cross-Language Test",
            status="at-risk",
            progress=25,
            tasksCompleted=2,
            tasksTotal=8,
            lastUpdated=now,
        )
        state.widgets.alerts = [
            AlertEntry(
                id="alert-1",
                type=AlertType.INFO,
                title="Test Alert",
                message="Testing cross-language",
                timestamp=now,
            ),
        ]

        output = state.to_frontend_dict()

        # Verify camelCase structure matches TypeScript
        assert output["version"] == 1
        assert "activeProject" in output or output.get("activeProject") is None
        assert "widgets" in output
        assert "projectStatus" in output["widgets"]
        assert output["widgets"]["projectStatus"]["projectId"] == "proj-1"
        assert output["widgets"]["projectStatus"]["tasksCompleted"] == 2
        assert output["widgets"]["projectStatus"]["tasksTotal"] == 8
        assert output["widgets"]["projectStatus"]["lastUpdated"] == now
        assert output["widgets"]["alerts"][0]["type"] == "info"

    def test_accepts_typescript_format_json(self):
        """Python should accept camelCase JSON from TypeScript."""
        typescript_json = {
            "version": 1,
            "timestamp": int(time.time() * 1000),
            "activeProject": "proj-123",
            "workspaceId": "ws-1",
            "userId": "user-1",
            "widgets": {
                "projectStatus": {
                    "projectId": "proj-1",
                    "name": "From TypeScript",
                    "status": "behind",
                    "progress": 10,
                    "tasksCompleted": 1,
                    "tasksTotal": 10,
                    "lastUpdated": int(time.time() * 1000),
                },
                "metrics": None,
                "activity": None,
                "alerts": [],
            },
            "loading": {
                "isLoading": False,
                "loadingAgents": [],
            },
            "errors": {},
        }

        state = DashboardState(**typescript_json)

        assert state.active_project == "proj-123"
        assert state.workspace_id == "ws-1"
        assert state.widgets.project_status is not None
        assert state.widgets.project_status.name == "From TypeScript"
        assert state.widgets.project_status.status == ProjectStatus.BEHIND

    def test_snake_case_input_also_works(self):
        """Python should also accept snake_case input (populate_by_name)."""
        snake_case_json = {
            "version": 1,
            "timestamp": int(time.time() * 1000),
            "active_project": "proj-snake",
            "workspace_id": "ws-snake",
            "widgets": {
                "project_status": None,
                "metrics": None,
                "activity": None,
                "alerts": [],
            },
            "loading": {
                "is_loading": True,
                "loading_agents": ["test"],
            },
            "errors": {},
        }

        state = DashboardState(**snake_case_json)

        assert state.active_project == "proj-snake"
        assert state.loading.is_loading is True


class TestEnumSerialization:
    """Tests for enum serialization with use_enum_values."""

    def test_project_status_serializes_to_value(self):
        """ProjectStatus enum should serialize to string value."""
        state = ProjectStatusState(
            projectId="p1",
            name="Test",
            status=ProjectStatus.ON_TRACK,
            progress=50,
            tasksCompleted=5,
            tasksTotal=10,
            lastUpdated=int(time.time() * 1000),
        )
        output = state.model_dump(by_alias=True)
        assert output["status"] == "on-track"

    def test_trend_direction_serializes_to_value(self):
        """TrendDirection enum should serialize to string value."""
        entry = MetricEntry(
            id="m1",
            label="Test",
            value=42,
            trend=TrendDirection.UP,
        )
        output = entry.model_dump(by_alias=True)
        assert output["trend"] == "up"

    def test_alert_type_serializes_to_value(self):
        """AlertType enum should serialize to string value."""
        entry = AlertEntry(
            id="a1",
            type=AlertType.WARNING,
            title="Test",
            message="Test",
            timestamp=int(time.time() * 1000),
        )
        output = entry.model_dump(by_alias=True)
        assert output["type"] == "warning"
