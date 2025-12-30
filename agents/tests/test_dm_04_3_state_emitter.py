"""
Unit tests for DashboardStateEmitter.

Tests the state emitter functionality including:
- State initialization
- Debouncing behavior
- Immediate emission (emit_now)
- Widget state setters
- Alert management
- Bulk updates from gather results
- Response parsing for Navi, Pulse, Herald

@see docs/modules/bm-dm/stories/dm-04-3-agent-state-emissions.md
Epic: DM-04 | Story: DM-04.3
"""
# Path setup MUST be first - before any project imports
import sys
from pathlib import Path

# Add agents root to path for imports (tests/test_*.py -> agents/)
# Use resolve() to get absolute path
_agents_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_agents_root))

import asyncio
import time
from typing import Any, Dict, List
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from constants.dm_constants import DMConstants
from gateway.state_emitter import DashboardStateEmitter, create_state_emitter
from schemas.dashboard_state import (
    AlertType,
    DashboardState,
    ProjectStatus,
    STATE_VERSION,
)


class TestDashboardStateEmitterInit:
    """Tests for DashboardStateEmitter initialization."""

    def test_init_creates_initial_state(self):
        """State initializes with default values."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        assert emitter.state is not None
        assert emitter.state.version == STATE_VERSION
        assert emitter.state.timestamp > 0
        assert emitter.state.active_project is None
        assert emitter.state.widgets is not None
        assert emitter.state.loading is not None
        assert emitter.state.errors == {}

    def test_init_with_workspace_and_user(self):
        """State initializes with workspace and user IDs."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(
            on_state_change=callback,
            workspace_id="ws_123",
            user_id="user_456",
        )

        assert emitter.state.workspace_id == "ws_123"
        assert emitter.state.user_id == "user_456"

    def test_state_property_returns_state(self):
        """The state property returns the current state."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        state = emitter.state
        assert isinstance(state, DashboardState)


class TestDashboardStateEmitterEmission:
    """Tests for state emission behavior."""

    @pytest.mark.asyncio
    async def test_emit_now_calls_callback_immediately(self):
        """emit_now() calls callback without waiting."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        await emitter.emit_now()

        callback.assert_called_once()
        call_args = callback.call_args[0][0]
        assert isinstance(call_args, dict)
        assert "version" in call_args
        assert "timestamp" in call_args

    @pytest.mark.asyncio
    async def test_emit_now_bypasses_debounce(self):
        """emit_now() ignores pending debounced updates."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        # Schedule a debounced emit
        emitter._schedule_emit()

        # Then emit now
        await emitter.emit_now()

        # Should have called immediately
        callback.assert_called_once()

    @pytest.mark.asyncio
    async def test_callback_receives_camelcase_dict(self):
        """Callback receives camelCase dict for frontend compatibility."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(
            on_state_change=callback,
            workspace_id="ws_123",
        )

        await emitter.emit_now()

        call_args = callback.call_args[0][0]
        # Check camelCase keys
        assert "workspaceId" in call_args
        assert "activeProject" in call_args or call_args.get("activeProject") is None
        # Check no snake_case keys
        assert "workspace_id" not in call_args
        assert "active_project" not in call_args

    @pytest.mark.asyncio
    async def test_schedule_emit_debounces_updates(self):
        """Multiple schedule_emit calls result in single emission after debounce."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        # Schedule multiple emissions rapidly
        emitter._schedule_emit()
        emitter._schedule_emit()
        emitter._schedule_emit()

        # Wait for debounce period
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        # Should only emit once
        assert callback.call_count == 1

    @pytest.mark.asyncio
    async def test_timestamp_updates_on_emit(self):
        """Timestamp is updated when state is emitted."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        original_ts = emitter.state.timestamp
        await asyncio.sleep(0.01)  # Small delay

        await emitter.emit_now()

        assert emitter.state.timestamp > original_ts


class TestLoadingState:
    """Tests for loading state management."""

    @pytest.mark.asyncio
    async def test_set_loading_emits_immediately(self):
        """set_loading emits immediately (no debounce)."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        await emitter.set_loading(True, ["navi", "pulse"])

        callback.assert_called_once()
        call_args = callback.call_args[0][0]
        assert call_args["loading"]["isLoading"] is True
        assert call_args["loading"]["loadingAgents"] == ["navi", "pulse"]
        assert call_args["loading"]["startedAt"] is not None

    @pytest.mark.asyncio
    async def test_set_loading_false_clears_started_at(self):
        """Setting loading to False clears startedAt."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        await emitter.set_loading(True, ["navi"])
        await emitter.set_loading(False)

        call_args = callback.call_args[0][0]
        assert call_args["loading"]["isLoading"] is False
        # startedAt is None and excluded from output dict (exclude_none=True)
        assert call_args["loading"].get("startedAt") is None


class TestErrorState:
    """Tests for error state management."""

    @pytest.mark.asyncio
    async def test_set_error_adds_error(self):
        """set_error adds an error for an agent."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        await emitter.set_error("navi", "Connection timeout")
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        assert emitter.state.errors["navi"] == "Connection timeout"

    @pytest.mark.asyncio
    async def test_set_error_none_clears_error(self):
        """set_error with None clears the error."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        await emitter.set_error("navi", "Some error")
        await emitter.set_error("navi", None)
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        assert "navi" not in emitter.state.errors

    @pytest.mark.asyncio
    async def test_clear_errors_removes_all(self):
        """clear_errors removes all errors."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        await emitter.set_error("navi", "Error 1")
        await emitter.set_error("pulse", "Error 2")
        await emitter.clear_errors()
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        assert emitter.state.errors == {}


class TestWidgetState:
    """Tests for widget state setters."""

    @pytest.mark.asyncio
    async def test_set_active_project(self):
        """set_active_project updates active project."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        await emitter.set_active_project("proj_123")
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        assert emitter.state.active_project == "proj_123"

    @pytest.mark.asyncio
    async def test_set_project_status(self):
        """set_project_status updates project status widget."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        await emitter.set_project_status(
            project_id="proj_123",
            name="Project Alpha",
            status=ProjectStatus.ON_TRACK,
            progress=75,
            tasks_completed=15,
            tasks_total=20,
            summary="Going well!",
        )
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        status = emitter.state.widgets.project_status
        assert status is not None
        assert status.project_id == "proj_123"
        assert status.name == "Project Alpha"
        assert status.status == ProjectStatus.ON_TRACK
        assert status.progress == 75
        assert status.tasks_completed == 15
        assert status.tasks_total == 20
        assert status.summary == "Going well!"

    @pytest.mark.asyncio
    async def test_set_metrics(self):
        """set_metrics updates metrics widget."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        metrics = [
            {"id": "m1", "label": "Velocity", "value": 42, "unit": "pts"},
            {"id": "m2", "label": "Bugs", "value": 3, "trend": "down"},
        ]

        await emitter.set_metrics(
            metrics=metrics,
            title="Sprint Metrics",
            period="Last 2 weeks",
        )
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        metrics_state = emitter.state.widgets.metrics
        assert metrics_state is not None
        assert metrics_state.title == "Sprint Metrics"
        assert metrics_state.period == "Last 2 weeks"
        assert len(metrics_state.metrics) == 2
        assert metrics_state.metrics[0].label == "Velocity"

    @pytest.mark.asyncio
    async def test_set_activity(self):
        """set_activity updates activity widget."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        activities = [
            {
                "id": "a1",
                "user": "Alice",
                "action": "completed task",
                "target": "Fix bug #42",
                "timestamp": int(time.time() * 1000),
            },
            {
                "id": "a2",
                "user": "Bob",
                "action": "commented on",
                "target": "PR #123",
                "timestamp": int(time.time() * 1000),
            },
        ]

        await emitter.set_activity(activities=activities, has_more=True)
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        activity_state = emitter.state.widgets.activity
        assert activity_state is not None
        assert len(activity_state.activities) == 2
        assert activity_state.has_more is True

    @pytest.mark.asyncio
    async def test_set_activity_caps_at_max(self):
        """set_activity caps activities at MAX_ACTIVITIES."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        # Create more activities than the limit
        activities = [
            {
                "id": f"a{i}",
                "user": f"User {i}",
                "action": "did something",
                "timestamp": int(time.time() * 1000),
            }
            for i in range(DMConstants.STATE.MAX_ACTIVITIES + 20)
        ]

        await emitter.set_activity(activities=activities, has_more=False)
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        activity_state = emitter.state.widgets.activity
        assert len(activity_state.activities) == DMConstants.STATE.MAX_ACTIVITIES
        # has_more should be True because we capped
        assert activity_state.has_more is True


class TestAlertManagement:
    """Tests for alert add/dismiss/clear."""

    @pytest.mark.asyncio
    async def test_add_alert_returns_id(self):
        """add_alert returns the alert ID."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        alert_id = await emitter.add_alert(
            alert_type=AlertType.WARNING,
            title="Warning",
            message="Something needs attention",
        )

        assert alert_id is not None
        assert isinstance(alert_id, str)

    @pytest.mark.asyncio
    async def test_add_alert_prepends(self):
        """add_alert prepends alerts (newest first)."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        id1 = await emitter.add_alert(AlertType.INFO, "First", "First alert")
        id2 = await emitter.add_alert(AlertType.INFO, "Second", "Second alert")
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        alerts = emitter.state.widgets.alerts
        assert len(alerts) == 2
        assert alerts[0].id == id2  # Second alert is first
        assert alerts[1].id == id1  # First alert is second

    @pytest.mark.asyncio
    async def test_add_alert_caps_at_max(self):
        """add_alert caps alerts at MAX_ALERTS."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        # Add more alerts than the limit
        for i in range(DMConstants.STATE.MAX_ALERTS + 10):
            await emitter.add_alert(AlertType.INFO, f"Alert {i}", f"Message {i}")

        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        alerts = emitter.state.widgets.alerts
        assert len(alerts) == DMConstants.STATE.MAX_ALERTS

    @pytest.mark.asyncio
    async def test_add_alert_with_custom_id(self):
        """add_alert accepts custom ID."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        alert_id = await emitter.add_alert(
            alert_type=AlertType.ERROR,
            title="Error",
            message="Something went wrong",
            alert_id="custom-id-123",
        )

        assert alert_id == "custom-id-123"

    @pytest.mark.asyncio
    async def test_dismiss_alert(self):
        """dismiss_alert marks alert as dismissed."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        alert_id = await emitter.add_alert(AlertType.INFO, "Test", "Test message")
        await emitter.dismiss_alert(alert_id)
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        alert = emitter.state.widgets.alerts[0]
        assert alert.dismissed is True

    @pytest.mark.asyncio
    async def test_clear_alerts(self):
        """clear_alerts removes all alerts."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        await emitter.add_alert(AlertType.INFO, "Alert 1", "Message 1")
        await emitter.add_alert(AlertType.INFO, "Alert 2", "Message 2")
        await emitter.clear_alerts()
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        assert len(emitter.state.widgets.alerts) == 0


class TestBulkUpdates:
    """Tests for update_from_gather."""

    @pytest.mark.asyncio
    async def test_update_from_gather_processes_all(self):
        """update_from_gather processes results from all agents."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        navi_result = {
            "content": "Project is on track",
            "artifacts": [
                {
                    "project_id": "proj_123",
                    "name": "Project Alpha",
                    "status": "on-track",
                    "progress": 60,
                    "tasks_completed": 6,
                    "tasks_total": 10,
                }
            ],
        }
        pulse_result = {
            "metrics": [
                {"id": "m1", "label": "Health", "value": 85, "unit": "%"},
            ]
        }
        herald_result = {
            "activities": [
                {
                    "id": "a1",
                    "user": "Alice",
                    "action": "completed task",
                    "timestamp": int(time.time() * 1000),
                }
            ]
        }

        await emitter.update_from_gather(
            navi_result=navi_result,
            pulse_result=pulse_result,
            herald_result=herald_result,
        )

        # All widgets should be updated
        assert emitter.state.widgets.project_status is not None
        assert emitter.state.widgets.project_status.project_id == "proj_123"
        assert emitter.state.widgets.metrics is not None
        assert len(emitter.state.widgets.metrics.metrics) == 1
        assert emitter.state.widgets.activity is not None
        assert len(emitter.state.widgets.activity.activities) == 1

    @pytest.mark.asyncio
    async def test_update_from_gather_handles_errors(self):
        """update_from_gather sets errors correctly."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        await emitter.update_from_gather(
            navi_result=None,
            pulse_result=None,
            herald_result=None,
            errors={"navi": "Timeout", "pulse": "Connection error"},
        )

        assert emitter.state.errors == {"navi": "Timeout", "pulse": "Connection error"}

    @pytest.mark.asyncio
    async def test_update_from_gather_clears_errors_when_none(self):
        """update_from_gather clears errors when no errors passed."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        # First set some errors
        await emitter.set_error("navi", "Old error")
        await asyncio.sleep((DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000) + 0.05)

        # Then update without errors
        await emitter.update_from_gather(
            navi_result=None,
            pulse_result=None,
            herald_result=None,
            errors=None,
        )

        assert emitter.state.errors == {}

    @pytest.mark.asyncio
    async def test_update_from_gather_emits_immediately(self):
        """update_from_gather emits immediately (no debounce)."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        await emitter.update_from_gather(
            navi_result={"content": "Test"},
            pulse_result=None,
            herald_result=None,
        )

        # Should have called callback (for emit_now)
        callback.assert_called()


class TestResponseParsing:
    """Tests for response parsing methods."""

    def test_parse_navi_response_from_artifacts(self):
        """_parse_navi_response extracts from artifacts."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        result = {
            "content": "Project summary here",
            "artifacts": [
                {
                    "project_id": "proj_alpha",
                    "name": "Alpha Project",
                    "status": "at-risk",
                    "progress": 45,
                    "tasks_completed": 9,
                    "tasks_total": 20,
                }
            ],
        }

        parsed = emitter._parse_navi_response(result)

        assert parsed is not None
        assert parsed.project_id == "proj_alpha"
        assert parsed.name == "Alpha Project"
        assert parsed.status == ProjectStatus.AT_RISK
        assert parsed.progress == 45
        assert parsed.summary == "Project summary here"

    def test_parse_navi_response_fallback_to_content(self):
        """_parse_navi_response falls back to content when no artifacts."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        result = {
            "content": "Just a summary",
            "project_id": "proj_beta",
        }

        parsed = emitter._parse_navi_response(result)

        assert parsed is not None
        assert parsed.summary == "Just a summary"

    def test_parse_navi_response_handles_error(self):
        """_parse_navi_response returns None on parse error."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        # Empty result with no content or artifacts should return None
        result = {}

        parsed = emitter._parse_navi_response(result)
        # Should return None due to no usable data
        assert parsed is None

    def test_parse_pulse_response_from_metrics(self):
        """_parse_pulse_response extracts from metrics."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        result = {
            "metrics": [
                {"id": "m1", "label": "Velocity", "value": 42},
                {"id": "m2", "label": "Bugs", "value": 5, "trend": "down"},
            ]
        }

        parsed = emitter._parse_pulse_response(result)

        assert parsed is not None
        assert len(parsed.metrics) == 2
        assert parsed.metrics[0].label == "Velocity"

    def test_parse_pulse_response_from_artifacts(self):
        """_parse_pulse_response extracts from artifacts fallback."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        result = {
            "artifacts": [
                {
                    "metrics": [
                        {"id": "m1", "label": "Health", "value": 95},
                    ]
                }
            ]
        }

        parsed = emitter._parse_pulse_response(result)

        assert parsed is not None
        assert len(parsed.metrics) == 1

    def test_parse_pulse_response_handles_error(self):
        """_parse_pulse_response returns None on empty metrics."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        result = {"content": "No metrics here"}

        parsed = emitter._parse_pulse_response(result)
        assert parsed is None

    def test_parse_herald_response_from_activities(self):
        """_parse_herald_response extracts from activities."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        result = {
            "activities": [
                {
                    "id": "a1",
                    "user": "Alice",
                    "action": "completed",
                    "target": "Task 1",
                    "timestamp": int(time.time() * 1000),
                },
            ]
        }

        parsed = emitter._parse_herald_response(result)

        assert parsed is not None
        assert len(parsed.activities) == 1
        assert parsed.activities[0].user == "Alice"

    def test_parse_herald_response_from_artifacts(self):
        """_parse_herald_response extracts from artifacts fallback."""
        callback = MagicMock()
        emitter = DashboardStateEmitter(on_state_change=callback)

        result = {
            "artifacts": [
                {
                    "activities": [
                        {
                            "id": "a1",
                            "user": "Bob",
                            "action": "commented",
                            "timestamp": int(time.time() * 1000),
                        },
                    ]
                }
            ]
        }

        parsed = emitter._parse_herald_response(result)

        assert parsed is not None
        assert len(parsed.activities) == 1


class TestFactoryFunction:
    """Tests for create_state_emitter factory."""

    def test_create_state_emitter_returns_emitter(self):
        """create_state_emitter returns a configured emitter."""
        callback = MagicMock()

        emitter = create_state_emitter(
            on_state_change=callback,
            workspace_id="ws_123",
            user_id="user_456",
        )

        assert isinstance(emitter, DashboardStateEmitter)
        assert emitter.state.workspace_id == "ws_123"
        assert emitter.state.user_id == "user_456"

    def test_create_state_emitter_without_optional_params(self):
        """create_state_emitter works without optional params."""
        callback = MagicMock()

        emitter = create_state_emitter(on_state_change=callback)

        assert isinstance(emitter, DashboardStateEmitter)
        assert emitter.state.workspace_id is None
        assert emitter.state.user_id is None
