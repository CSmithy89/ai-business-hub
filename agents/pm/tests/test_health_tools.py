"""
Tests for PM Agent health monitoring tools
"""

import os
import pytest
from unittest.mock import patch, Mock
import httpx


@pytest.fixture(autouse=True)
def patch_env():
    """Patch environment before imports"""
    with patch.dict(os.environ, {
        "API_BASE_URL": "http://test-api:3001",
        "AGENT_SERVICE_TOKEN": "test-token",
    }):
        yield


class TestDetectRisks:
    """Tests for detect_risks tool"""

    def test_successful_risk_detection(self, mock_risk_detection_response):
        """Test successful risk detection returns structured output"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            import agents.pm.tools.health_tools as health_module
            importlib.reload(health_module)

            mock_response = Mock()
            mock_response.json.return_value = mock_risk_detection_response
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = health_module.detect_risks(
                    workspace_id="workspace_123",
                    project_id="project_456",
                )

                # Verify result is a RiskDetectionOutput
                from agents.pm.tools.structured_outputs import RiskDetectionOutput
                assert isinstance(result, RiskDetectionOutput)
                assert len(result.risks) == 1
                assert result.risks[0].type == "deadline_warning"
                assert result.risks[0].severity == "warning"

    def test_risk_detection_api_error(self):
        """Test risk detection handles API errors gracefully"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            import agents.pm.tools.health_tools as health_module
            importlib.reload(health_module)

            mock_response = Mock()
            mock_response.status_code = 500
            http_error = httpx.HTTPStatusError(
                "Server Error",
                request=Mock(),
                response=mock_response,
            )
            mock_response.raise_for_status.side_effect = http_error

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = health_module.detect_risks(
                    workspace_id="workspace_123",
                    project_id="project_456",
                )

                # Should return AgentErrorOutput on failure
                from agents.pm.tools.structured_outputs import AgentErrorOutput
                assert isinstance(result, AgentErrorOutput)
                assert result.error == "RISK_DETECTION_FAILED"
                assert result.recoverable is True


class TestCalculateHealthScore:
    """Tests for calculate_health_score tool"""

    def test_successful_health_score(self, mock_health_score_response):
        """Test successful health score calculation"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            import agents.pm.tools.health_tools as health_module
            importlib.reload(health_module)

            mock_response = Mock()
            mock_response.json.return_value = mock_health_score_response
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = health_module.calculate_health_score(
                    workspace_id="workspace_123",
                    project_id="project_456",
                )

                from agents.pm.tools.structured_outputs import HealthInsightOutput
                assert isinstance(result, HealthInsightOutput)
                assert result.score == 75
                assert result.level == "GOOD"
                assert result.trend == "STABLE"

    def test_health_score_levels(self):
        """Test health score returns correct levels"""
        levels = [
            (95, "EXCELLENT"),
            (80, "GOOD"),
            (60, "WARNING"),
            (30, "CRITICAL"),
        ]

        for score, expected_level in levels:
            with patch.dict(os.environ, {
                "API_BASE_URL": "http://test-api:3001",
                "AGENT_SERVICE_TOKEN": "test-token",
            }):
                import importlib
                import agents.pm.tools.common as common_module
                importlib.reload(common_module)
                import agents.pm.tools.health_tools as health_module
                importlib.reload(health_module)

                response_data = {
                    "score": score,
                    "level": expected_level,
                    "trend": "STABLE",
                    "factors": {
                        "on_time_delivery": 0.80,
                        "blocker_impact": 0.15,
                        "team_capacity": 0.90,
                        "velocity_trend": 0.85,
                    },
                    "explanation": f"Score: {score}",
                    "suggestions": [],
                }

                mock_response = Mock()
                mock_response.json.return_value = response_data
                mock_response.raise_for_status = Mock()

                with patch("httpx.Client") as mock_client:
                    mock_client_instance = Mock()
                    mock_client_instance.request.return_value = mock_response
                    mock_client.return_value.__enter__ = Mock(
                        return_value=mock_client_instance
                    )
                    mock_client.return_value.__exit__ = Mock(return_value=False)

                    result = health_module.calculate_health_score(
                        workspace_id="workspace_123",
                        project_id="project_456",
                    )

                    assert result.level == expected_level


class TestCheckTeamCapacity:
    """Tests for check_team_capacity tool"""

    def test_successful_capacity_check(self, mock_team_capacity_response):
        """Test successful team capacity check"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            import agents.pm.tools.health_tools as health_module
            importlib.reload(health_module)

            mock_response = Mock()
            mock_response.json.return_value = mock_team_capacity_response
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = health_module.check_team_capacity(
                    workspace_id="workspace_123",
                    project_id="project_456",
                )

                from agents.pm.tools.structured_outputs import TeamCapacityOutput
                assert isinstance(result, TeamCapacityOutput)
                assert result.team_health == "at_capacity"
                assert len(result.overloaded_members) == 1
                assert result.overloaded_members[0].assigned_hours == 45

    def test_healthy_team_capacity(self):
        """Test team capacity when no one is overloaded"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            import agents.pm.tools.health_tools as health_module
            importlib.reload(health_module)

            response_data = {
                "overloaded_members": [],
                "team_health": "healthy",
            }

            mock_response = Mock()
            mock_response.json.return_value = response_data
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = health_module.check_team_capacity(
                    workspace_id="workspace_123",
                    project_id="project_456",
                )

                assert result.team_health == "healthy"
                assert len(result.overloaded_members) == 0


class TestAnalyzeVelocity:
    """Tests for analyze_velocity tool"""

    def test_successful_velocity_analysis(self, mock_velocity_response):
        """Test successful velocity analysis"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            import agents.pm.tools.health_tools as health_module
            importlib.reload(health_module)

            mock_response = Mock()
            mock_response.json.return_value = mock_velocity_response
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = health_module.analyze_velocity(
                    workspace_id="workspace_123",
                    project_id="project_456",
                )

                from agents.pm.tools.structured_outputs import VelocityAnalysisOutput
                assert isinstance(result, VelocityAnalysisOutput)
                assert result.current_velocity == 25
                assert result.baseline_velocity == 30
                assert result.trend == "DOWN"
                assert result.alert is False

    def test_velocity_alert_triggered(self):
        """Test velocity alert is triggered on significant drop"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            import agents.pm.tools.health_tools as health_module
            importlib.reload(health_module)

            response_data = {
                "current_velocity": 15,
                "baseline_velocity": 30,
                "change_percent": -50.0,
                "trend": "DOWN",
                "alert": True,  # >30% drop triggers alert
            }

            mock_response = Mock()
            mock_response.json.return_value = response_data
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = health_module.analyze_velocity(
                    workspace_id="workspace_123",
                    project_id="project_456",
                )

                assert result.alert is True
                assert result.change_percent == -50.0


class TestDetectBlockerChains:
    """Tests for detect_blocker_chains tool"""

    def test_successful_blocker_chain_detection(self, mock_blocker_chains_response):
        """Test successful blocker chain detection"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            import agents.pm.tools.health_tools as health_module
            importlib.reload(health_module)

            mock_response = Mock()
            mock_response.json.return_value = mock_blocker_chains_response
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = health_module.detect_blocker_chains(
                    workspace_id="workspace_123",
                    project_id="project_456",
                )

                from agents.pm.tools.structured_outputs import BlockerChainsOutput
                assert isinstance(result, BlockerChainsOutput)
                assert len(result.chains) == 1
                assert result.chains[0].severity == "critical"
                assert len(result.chains[0].blocked_tasks) == 3

    def test_no_blocker_chains(self):
        """Test when no blocker chains exist"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            import agents.pm.tools.health_tools as health_module
            importlib.reload(health_module)

            response_data = {"chains": []}

            mock_response = Mock()
            mock_response.json.return_value = response_data
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = health_module.detect_blocker_chains(
                    workspace_id="workspace_123",
                    project_id="project_456",
                )

                assert len(result.chains) == 0


class TestGetOverdueTasks:
    """Tests for get_overdue_tasks tool"""

    def test_successful_overdue_tasks_retrieval(self, mock_overdue_tasks_response):
        """Test successful overdue tasks retrieval"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            import agents.pm.tools.health_tools as health_module
            importlib.reload(health_module)

            mock_response = Mock()
            mock_response.json.return_value = mock_overdue_tasks_response
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = health_module.get_overdue_tasks(
                    workspace_id="workspace_123",
                    project_id="project_456",
                )

                from agents.pm.tools.structured_outputs import OverdueTasksOutput
                assert isinstance(result, OverdueTasksOutput)
                assert len(result.overdue) == 1
                assert len(result.due_soon) == 1
                assert result.overdue[0].days_overdue == 5
                assert result.due_soon[0].hours_remaining == 24

    def test_no_overdue_tasks(self):
        """Test when no tasks are overdue"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)
            import agents.pm.tools.health_tools as health_module
            importlib.reload(health_module)

            response_data = {
                "overdue": [],
                "due_soon": [],
            }

            mock_response = Mock()
            mock_response.json.return_value = response_data
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = health_module.get_overdue_tasks(
                    workspace_id="workspace_123",
                    project_id="project_456",
                )

                assert len(result.overdue) == 0
                assert len(result.due_soon) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
