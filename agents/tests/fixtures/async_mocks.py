"""
Generic Async Mock Fixtures

Reusable patterns for async mocking in tests.

DM-08.4: Standardized async mock patterns for consistent testing.
"""

from typing import Any, Callable, Optional
from unittest.mock import AsyncMock, MagicMock
from contextlib import asynccontextmanager

import pytest


@pytest.fixture
def async_mock_factory():
    """
    Factory for creating async mocks with custom return values.

    Returns a callable that creates AsyncMock instances with
    optional return values and side effects.

    Example:
        def test_something(async_mock_factory):
            mock = async_mock_factory(return_value={"status": "ok"})
            result = await mock()
            assert result == {"status": "ok"}

            # With side effect
            mock_error = async_mock_factory(side_effect=ValueError("oops"))
    """

    def _factory(
        return_value: Any = None,
        side_effect: Optional[Exception | Callable] = None,
    ) -> AsyncMock:
        mock = AsyncMock()
        if return_value is not None:
            mock.return_value = return_value
        if side_effect is not None:
            mock.side_effect = side_effect
        return mock

    return _factory


@pytest.fixture
def async_context_manager():
    """
    Factory for creating async context manager mocks.

    Useful for mocking async with statements like database sessions
    or file handles.

    Example:
        def test_with_context(async_context_manager):
            mock_session = async_context_manager(
                enter_value=mock_db,
                exit_value=None,
            )
            async with mock_session as db:
                await db.query(...)
    """

    def _factory(
        enter_value: Any = None,
        exit_value: Any = None,
        exit_exception: Optional[Exception] = None,
    ):
        mock = MagicMock()

        @asynccontextmanager
        async def _context():
            yield enter_value
            if exit_exception:
                raise exit_exception

        mock.__aenter__ = AsyncMock(return_value=enter_value)
        mock.__aexit__ = AsyncMock(return_value=exit_value)

        # Make it work as async context manager
        mock.__class__ = type(
            "AsyncContextManager",
            (),
            {
                "__aenter__": mock.__aenter__,
                "__aexit__": mock.__aexit__,
            },
        )

        return mock

    return _factory


class AsyncIteratorMock:
    """
    Mock for async iterators.

    Useful for mocking async generators or streaming responses.

    Example:
        mock_stream = AsyncIteratorMock([chunk1, chunk2, chunk3])
        async for chunk in mock_stream:
            process(chunk)
    """

    def __init__(self, items: list):
        self.items = items
        self.index = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.index >= len(self.items):
            raise StopAsyncIteration
        item = self.items[self.index]
        self.index += 1
        return item


@pytest.fixture
def async_iterator_factory():
    """
    Factory for creating async iterator mocks.

    Example:
        def test_streaming(async_iterator_factory):
            mock_stream = async_iterator_factory([b"chunk1", b"chunk2"])
            chunks = [chunk async for chunk in mock_stream]
            assert len(chunks) == 2
    """

    def _factory(items: list) -> AsyncIteratorMock:
        return AsyncIteratorMock(items)

    return _factory
