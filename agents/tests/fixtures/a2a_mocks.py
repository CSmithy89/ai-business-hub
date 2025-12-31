"""
A2A Client Mock Fixtures

Reusable A2A (Agent-to-Agent) client mock patterns for tests.

DM-08.4: Standardized A2A mocking for consistent testing.
"""

from typing import Any, Dict, List, Optional
from unittest.mock import AsyncMock, MagicMock

import pytest

from constants.dm_constants import DMConstants


@pytest.fixture
def mock_a2a_response():
    """
    Factory for creating A2A response objects.

    Creates response objects matching the A2A protocol spec.

    Example:
        def test_agent_call(mock_a2a_response):
            response = mock_a2a_response(
                success=True,
                data={"answer": "42"},
            )
    """

    def _factory(
        success: bool = True,
        data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        task_id: str = "task-123",
        agent_id: str = "test-agent",
    ) -> Dict[str, Any]:
        # JSON-RPC 2.0 spec: response must have result XOR error, never both
        if error is not None:
            return {
                "jsonrpc": "2.0",
                "id": task_id,
                "error": {
                    "code": -32000,
                    "message": error,
                },
            }
        return {
            "jsonrpc": "2.0",
            "id": task_id,
            "result": {
                "success": success,
                "agent_id": agent_id,
                "data": data or {},
            },
        }

    return _factory


@pytest.fixture
def mock_a2a_client(mock_a2a_response):
    """
    Reusable A2A client mock with common methods.

    Provides a mock A2A client with pre-configured async methods
    for discover, invoke, and health check operations.

    Example:
        def test_agent_discovery(mock_a2a_client):
            client, response_factory = mock_a2a_client

            # Configure response
            client.discover.return_value = [
                {"agent_id": "navi", "capabilities": [...]}
            ]

            # Test discovery
            agents = await client.discover()
            assert len(agents) == 1
    """
    client = MagicMock()

    # Discovery methods
    client.discover = AsyncMock(return_value=[])
    client.get_agent_card = AsyncMock(return_value=None)
    client.list_agents = AsyncMock(return_value=[])

    # Invocation methods
    client.invoke = AsyncMock(
        return_value=mock_a2a_response(success=True, data={})
    )
    client.invoke_stream = AsyncMock(return_value=[])
    client.send_message = AsyncMock(return_value=True)

    # Health and status
    client.health_check = AsyncMock(return_value={"status": "healthy"})
    client.ping = AsyncMock(return_value=True)

    # Connection management
    client.connect = AsyncMock()
    client.disconnect = AsyncMock()
    client.is_connected = MagicMock(return_value=True)

    return client, mock_a2a_response


def create_agent_card(
    agent_id: str = "test-agent",
    name: str = "Test Agent",
    description: str = "A test agent",
    capabilities: Optional[List[str]] = None,
    base_url: str = "http://localhost:8000",
) -> Dict[str, Any]:
    """
    Create a mock A2A AgentCard for testing.

    Args:
        agent_id: Unique agent identifier
        name: Human-readable agent name
        description: Agent description
        capabilities: List of capability strings
        base_url: Base URL for agent endpoints

    Example:
        card = create_agent_card(
            agent_id="navi",
            name="Navi",
            capabilities=["task_management", "progress_tracking"],
        )
    """
    return {
        "protocolVersion": DMConstants.A2A.PROTOCOL_VERSION,
        "agentId": agent_id,
        "name": name,
        "description": description,
        "url": f"{base_url}/a2a/{agent_id}",
        "capabilities": {
            "rpc": capabilities or ["invoke", "stream"],
            "events": ["status_update"],
        },
        "authentication": {
            "type": "bearer",
        },
        "metadata": {
            "version": "1.0.0",
            "category": "test",
        },
    }


def create_a2a_error(
    code: int = -32000,
    message: str = "Internal error",
    data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Create a mock A2A error response.

    Args:
        code: JSON-RPC error code
        message: Error message
        data: Additional error data

    Example:
        error = create_a2a_error(
            code=-32600,
            message="Invalid request",
        )
    """
    error = {
        "jsonrpc": "2.0",
        "id": None,
        "error": {
            "code": code,
            "message": message,
        },
    }
    if data:
        error["error"]["data"] = data
    return error
