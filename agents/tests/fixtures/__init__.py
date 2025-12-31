"""
Test Fixtures Package

Reusable pytest fixtures for async mocking patterns.
Import these fixtures in conftest.py for automatic availability.

DM-08.4: Created for consistent async mocking across tests.
"""

from .async_mocks import (
    async_mock_factory,
    async_context_manager,
)
from .redis_mocks import (
    mock_redis,
    mock_redis_pipeline,
)
from .a2a_mocks import (
    mock_a2a_client,
    mock_a2a_response,
    create_agent_card,
    create_a2a_error,
)
from .database_mocks import (
    mock_db_session,
    mock_db_transaction,
)

__all__ = [
    # Async mocks
    "async_mock_factory",
    "async_context_manager",
    # Redis mocks
    "mock_redis",
    "mock_redis_pipeline",
    # A2A mocks
    "mock_a2a_client",
    "mock_a2a_response",
    "create_agent_card",
    "create_a2a_error",
    # Database mocks
    "mock_db_session",
    "mock_db_transaction",
]
