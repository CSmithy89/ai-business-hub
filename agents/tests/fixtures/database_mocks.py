"""
Database Mock Fixtures

Reusable database session mock patterns for tests.

DM-08.4: Standardized database mocking for consistent testing.
"""

from typing import Any, Dict, List, Optional
from unittest.mock import AsyncMock, MagicMock

import pytest


@pytest.fixture
def mock_db_session():
    """
    Reusable async database session mock.

    Provides a mock that behaves like an async database session
    with common CRUD operations.

    Example:
        def test_repository(mock_db_session):
            session = mock_db_session

            # Configure query result
            session.execute.return_value.scalars.return_value.all.return_value = [
                {"id": 1, "name": "Test"}
            ]

            # Test repository
            result = await repo.find_all(session)
            assert len(result) == 1
    """
    session = MagicMock()

    # Query execution
    session.execute = AsyncMock()
    session.scalar = AsyncMock(return_value=None)
    session.scalars = AsyncMock(return_value=MagicMock(all=MagicMock(return_value=[])))

    # CRUD operations
    session.add = MagicMock()
    session.add_all = MagicMock()
    session.delete = AsyncMock()
    session.merge = AsyncMock()
    session.refresh = AsyncMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()

    # Query builder pattern
    result_mock = MagicMock()
    result_mock.scalars.return_value.all.return_value = []
    result_mock.scalars.return_value.first.return_value = None
    result_mock.scalars.return_value.one.return_value = None
    result_mock.scalars.return_value.one_or_none.return_value = None
    result_mock.scalar.return_value = None
    result_mock.scalar_one.return_value = None
    result_mock.scalar_one_or_none.return_value = None
    result_mock.fetchone.return_value = None
    result_mock.fetchall.return_value = []
    result_mock.rowcount = 0

    session.execute.return_value = result_mock

    return session


@pytest.fixture
def mock_db_transaction(mock_db_session):
    """
    Mock database transaction context manager.

    Extends mock_db_session with transaction support for testing
    atomic operations.

    Example:
        def test_atomic_operation(mock_db_transaction):
            session, transaction = mock_db_transaction

            async with transaction:
                await session.execute(...)
                await session.commit()

            session.commit.assert_called_once()
    """
    transaction = MagicMock()
    transaction.__aenter__ = AsyncMock(return_value=mock_db_session)
    transaction.__aexit__ = AsyncMock(return_value=None)

    # Also support begin() pattern
    mock_db_session.begin = MagicMock(return_value=transaction)
    mock_db_session.begin_nested = MagicMock(return_value=transaction)

    return mock_db_session, transaction


def create_mock_model(
    model_class: Optional[type] = None,
    data: Optional[Dict[str, Any]] = None,
    **kwargs: Any,
) -> MagicMock:
    """
    Create a mock database model instance.

    Useful for testing without actual ORM models.

    Args:
        model_class: Optional model class to mock
        data: Dictionary of attribute values
        **kwargs: Additional attributes to set

    Example:
        mock_user = create_mock_model(
            data={
                "id": "user-123",
                "email": "test@example.com",
                "name": "Test User",
            }
        )
        assert mock_user.email == "test@example.com"
    """
    model = MagicMock(spec=model_class) if model_class else MagicMock()

    # Set attributes from data dict
    if data:
        for key, value in data.items():
            setattr(model, key, value)

    # Set attributes from kwargs
    for key, value in kwargs.items():
        setattr(model, key, value)

    return model


def create_query_result(
    items: List[Any],
    total: Optional[int] = None,
) -> MagicMock:
    """
    Create a mock query result with items.

    Mimics SQLAlchemy result patterns for scalars().all(), etc.

    Args:
        items: List of result items
        total: Optional total count (for pagination)

    Example:
        users = [create_mock_model(data={"id": i}) for i in range(3)]
        result = create_query_result(users, total=100)

        session.execute.return_value = result
        all_users = (await session.execute(query)).scalars().all()
        assert len(all_users) == 3
    """
    result = MagicMock()

    # Scalars pattern
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = items
    scalars_mock.first.return_value = items[0] if items else None
    scalars_mock.one.return_value = items[0] if items else None
    scalars_mock.one_or_none.return_value = items[0] if items else None
    result.scalars.return_value = scalars_mock

    # Direct scalar patterns
    result.scalar.return_value = items[0] if items else None
    result.scalar_one.return_value = items[0] if items else None
    result.scalar_one_or_none.return_value = items[0] if items else None

    # Fetch patterns
    result.fetchone.return_value = items[0] if items else None
    result.fetchall.return_value = items

    # Row count
    result.rowcount = len(items)

    # Total count for pagination
    if total is not None:
        result.scalar.return_value = total

    return result
