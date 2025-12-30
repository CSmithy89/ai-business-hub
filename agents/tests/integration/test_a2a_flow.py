"""
Integration tests for A2A communication flow.

Tests the complete A2A flow from Dashboard Gateway to PM agents:
- Dashboard can call Navi via A2A
- Dashboard can call multiple agents in parallel
- Error handling for agent failures
- Widget tool call responses

Story: DM-03.5 - End-to-End Testing
@see docs/modules/bm-dm/epics/epic-dm-03-tech-spec.md - Section 3.5
"""

import sys
from unittest.mock import MagicMock

# Mock anthropic module before any imports that might use it
anthropic_mock = MagicMock()
anthropic_mock.types = MagicMock()
anthropic_mock.lib = MagicMock()
anthropic_mock.lib.streaming = MagicMock()
anthropic_mock.lib.streaming._beta_types = MagicMock()

sys.modules["anthropic"] = anthropic_mock
sys.modules["anthropic.types"] = anthropic_mock.types
sys.modules["anthropic.lib"] = anthropic_mock.lib
sys.modules["anthropic.lib.streaming"] = anthropic_mock.lib.streaming
sys.modules["anthropic.lib.streaming._beta_types"] = anthropic_mock.lib.streaming._beta_types

import pytest
from unittest.mock import AsyncMock, patch, Mock
from typing import Dict, Any

# Enable asyncio mode for pytest
pytest_plugins = ["anyio"]


class TestA2AClientIntegration:
    """Integration tests for A2A client connecting to PM agents."""

    @pytest.fixture
    def mock_settings(self):
        """Mock settings for tests."""
        mock = Mock()
        mock.agentos_port = 8001
        return mock

    @pytest.fixture
    def a2a_client(self, mock_settings):
        """Create A2A client with mocked settings."""
        with patch("a2a.client.get_settings", return_value=mock_settings):
            from a2a.client import HyvveA2AClient

            return HyvveA2AClient(base_url="http://test:8001")

    @pytest.mark.anyio
    async def test_call_navi_agent(self, a2a_client):
        """Dashboard Gateway can call Navi via A2A."""
        # Mock successful response from Navi
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {
                "content": "Project Alpha is on track with 75% completion.",
                "tool_calls": [],
                "artifacts": [{"type": "project_summary", "data": {"progress": 75}}],
            },
            "id": "test-1",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            result = await a2a_client.call_agent(
                agent_id="navi",
                task="Get status for Project Alpha",
                context={"project_id": "alpha"},
            )

            assert result.success is True
            assert "Project Alpha" in result.content
            assert result.agent_id == "navi"
            assert len(result.artifacts) == 1
            assert result.duration_ms is not None

    @pytest.mark.anyio
    async def test_call_pulse_agent(self, a2a_client):
        """Dashboard Gateway can call Pulse via A2A."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {
                "content": "Workspace health: Good. 2 tasks at risk.",
                "tool_calls": [],
                "artifacts": [
                    {
                        "type": "health_metrics",
                        "data": {"health_score": 85, "at_risk_tasks": 2},
                    }
                ],
            },
            "id": "test-2",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            result = await a2a_client.call_agent(
                agent_id="pulse",
                task="Get workspace health metrics",
            )

            assert result.success is True
            assert "health" in result.content.lower()
            assert result.agent_id == "pulse"

    @pytest.mark.anyio
    async def test_call_herald_agent(self, a2a_client):
        """Dashboard Gateway can call Herald via A2A."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {
                "content": "5 recent activities: Task completed, PR merged...",
                "tool_calls": [],
                "artifacts": [
                    {
                        "type": "activity_feed",
                        "data": {
                            "activities": [
                                {"user": "John", "action": "completed", "target": "Task 1"}
                            ]
                        },
                    }
                ],
            },
            "id": "test-3",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            result = await a2a_client.call_agent(
                agent_id="herald",
                task="Get recent team activity",
                context={"limit": 5},
            )

            assert result.success is True
            assert "activities" in result.content.lower()
            assert result.agent_id == "herald"

    @pytest.mark.anyio
    async def test_parallel_agent_calls(self, a2a_client):
        """Dashboard can call multiple agents in parallel."""

        def create_mock_response(agent_id: str, content: str):
            mock = Mock()
            mock.status_code = 200
            mock.json.return_value = {
                "jsonrpc": "2.0",
                "result": {"content": content, "tool_calls": [], "artifacts": []},
                "id": f"test-{agent_id}",
            }
            return mock

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()

            # Different responses for different agents
            async def mock_post(path: str, **kwargs):
                if "/navi/" in path:
                    return create_mock_response("navi", "Project status: on track")
                elif "/pulse/" in path:
                    return create_mock_response("pulse", "Health: good")
                elif "/herald/" in path:
                    return create_mock_response("herald", "Recent: 3 activities")
                else:
                    raise ValueError(f"Unknown path: {path}")

            mock_http.post = mock_post
            mock_get.return_value = mock_http

            results = await a2a_client.call_agents_parallel(
                [
                    {"agent_id": "navi", "task": "Get project status"},
                    {"agent_id": "pulse", "task": "Get health"},
                    {"agent_id": "herald", "task": "Get activity"},
                ]
            )

            assert len(results) == 3
            assert "navi" in results
            assert "pulse" in results
            assert "herald" in results
            assert all(r.success for r in results.values())


class TestA2AErrorHandling:
    """Tests for A2A error handling scenarios."""

    @pytest.fixture
    def mock_settings(self):
        """Mock settings for tests."""
        mock = Mock()
        mock.agentos_port = 8001
        return mock

    @pytest.fixture
    def a2a_client(self, mock_settings):
        """Create A2A client with mocked settings."""
        with patch("a2a.client.get_settings", return_value=mock_settings):
            from a2a.client import HyvveA2AClient

            return HyvveA2AClient(base_url="http://test:8001")

    @pytest.mark.anyio
    async def test_unknown_agent_returns_error(self, a2a_client):
        """Unknown agent returns error result."""
        result = await a2a_client.call_agent(
            agent_id="unknown_agent",
            task="Test task",
        )

        assert result.success is False
        assert "Unknown agent" in result.error
        assert result.agent_id == "unknown_agent"

    @pytest.mark.anyio
    async def test_http_error_returns_error_result(self, a2a_client):
        """HTTP errors are handled gracefully."""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            result = await a2a_client.call_agent(
                agent_id="navi",
                task="Test task",
            )

            assert result.success is False
            assert "HTTP 500" in result.error
            assert result.agent_id == "navi"

    @pytest.mark.anyio
    async def test_json_rpc_error_returns_error_result(self, a2a_client):
        """JSON-RPC errors are handled gracefully."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "error": {"code": -32600, "message": "Invalid Request"},
            "id": "test-1",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            result = await a2a_client.call_agent(
                agent_id="navi",
                task="Test task",
            )

            assert result.success is False
            assert "Invalid Request" in result.error

    @pytest.mark.anyio
    async def test_timeout_returns_error_result(self, a2a_client):
        """Timeouts are handled gracefully."""
        import asyncio

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()
            mock_http.post.side_effect = asyncio.TimeoutError()
            mock_get.return_value = mock_http

            result = await a2a_client.call_agent(
                agent_id="navi",
                task="Test task",
                timeout=1,
            )

            assert result.success is False
            assert "Timeout" in result.error

    @pytest.mark.anyio
    async def test_connection_error_returns_error_result(self, a2a_client):
        """Connection errors are handled gracefully."""
        import httpx

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()
            mock_http.post.side_effect = httpx.ConnectError("Connection refused")
            mock_get.return_value = mock_http

            result = await a2a_client.call_agent(
                agent_id="navi",
                task="Test task",
            )

            assert result.success is False
            assert "Connection failed" in result.error

    @pytest.mark.anyio
    async def test_partial_parallel_failures(self, a2a_client):
        """Parallel calls handle partial failures gracefully."""

        def create_mock_response(content: str):
            mock = Mock()
            mock.status_code = 200
            mock.json.return_value = {
                "jsonrpc": "2.0",
                "result": {"content": content, "tool_calls": [], "artifacts": []},
                "id": "test",
            }
            return mock

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()

            call_count = [0]

            async def mock_post(path: str, **kwargs):
                call_count[0] += 1
                if "/pulse/" in path:
                    # Pulse fails
                    raise Exception("Pulse agent unavailable")
                return create_mock_response("Success")

            mock_http.post = mock_post
            mock_get.return_value = mock_http

            results = await a2a_client.call_agents_parallel(
                [
                    {"agent_id": "navi", "task": "Get status"},
                    {"agent_id": "pulse", "task": "Get health"},
                ]
            )

            assert "navi" in results
            assert "pulse" in results
            assert results["navi"].success is True
            assert results["pulse"].success is False
            assert "unavailable" in results["pulse"].error.lower()


class TestWidgetToolCallFlow:
    """Tests for widget rendering tool call flow."""

    @pytest.fixture
    def mock_settings(self):
        """Mock settings for tests."""
        mock = Mock()
        mock.agentos_port = 8001
        return mock

    @pytest.fixture
    def a2a_client(self, mock_settings):
        """Create A2A client with mocked settings."""
        with patch("a2a.client.get_settings", return_value=mock_settings):
            from a2a.client import HyvveA2AClient

            return HyvveA2AClient(base_url="http://test:8001")

    @pytest.mark.anyio
    async def test_navi_returns_widget_tool_calls(self, a2a_client):
        """Navi returns render_dashboard_widget tool calls."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {
                "content": "Here's your project status",
                "tool_calls": [
                    {
                        "name": "render_dashboard_widget",
                        "arguments": {
                            "type": "ProjectStatus",
                            "data": {
                                "projectId": "alpha",
                                "projectName": "Project Alpha",
                                "status": "on_track",
                                "progress": 75,
                            },
                        },
                    }
                ],
                "artifacts": [],
            },
            "id": "test-1",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            result = await a2a_client.call_agent(
                agent_id="navi",
                task="Show project status for Alpha",
            )

            assert result.success is True
            assert len(result.tool_calls) == 1
            assert result.tool_calls[0]["name"] == "render_dashboard_widget"
            assert result.tool_calls[0]["arguments"]["type"] == "ProjectStatus"

    @pytest.mark.anyio
    async def test_pulse_returns_metrics_widget(self, a2a_client):
        """Pulse returns Metrics widget data."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {
                "content": "Here are your workspace metrics",
                "tool_calls": [
                    {
                        "name": "render_dashboard_widget",
                        "arguments": {
                            "type": "Metrics",
                            "data": {
                                "metrics": [
                                    {"label": "Tasks", "value": 42},
                                    {"label": "At Risk", "value": 3},
                                ]
                            },
                        },
                    }
                ],
                "artifacts": [],
            },
            "id": "test-1",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            result = await a2a_client.call_agent(
                agent_id="pulse",
                task="Show workspace metrics",
            )

            assert result.success is True
            assert len(result.tool_calls) == 1
            assert result.tool_calls[0]["arguments"]["type"] == "Metrics"

    @pytest.mark.anyio
    async def test_herald_returns_activity_widget(self, a2a_client):
        """Herald returns TeamActivity widget data."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {
                "content": "Here's recent team activity",
                "tool_calls": [
                    {
                        "name": "render_dashboard_widget",
                        "arguments": {
                            "type": "TeamActivity",
                            "data": {
                                "activities": [
                                    {
                                        "user": "John",
                                        "action": "completed",
                                        "target": "Task 1",
                                        "time": "2h ago",
                                    }
                                ]
                            },
                        },
                    }
                ],
                "artifacts": [],
            },
            "id": "test-1",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            result = await a2a_client.call_agent(
                agent_id="herald",
                task="Show team activity",
            )

            assert result.success is True
            assert len(result.tool_calls) == 1
            assert result.tool_calls[0]["arguments"]["type"] == "TeamActivity"
