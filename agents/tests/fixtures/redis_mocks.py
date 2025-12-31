"""
Redis Mock Fixtures

Reusable Redis mock patterns for tests.

DM-08.4: Standardized Redis mocking for consistent testing.
"""

from typing import Any, Dict, Optional
from unittest.mock import AsyncMock, MagicMock

import pytest


@pytest.fixture
def mock_redis():
    """
    Reusable Redis mock with all common async methods.

    Provides a MagicMock that behaves like an async Redis client
    with pre-configured methods for get, set, delete, etc.

    Example:
        def test_cache(mock_redis):
            # Configure return value
            mock_redis.get.return_value = b'{"data": "cached"}'

            # Use in test
            result = await some_function(redis=mock_redis)

            # Verify calls
            mock_redis.set.assert_called_once()
    """
    redis = MagicMock()

    # Basic key-value operations
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock(return_value=True)
    redis.setex = AsyncMock(return_value=True)
    redis.setnx = AsyncMock(return_value=True)
    redis.delete = AsyncMock(return_value=1)
    redis.exists = AsyncMock(return_value=0)
    redis.expire = AsyncMock(return_value=True)
    redis.ttl = AsyncMock(return_value=-1)
    redis.pttl = AsyncMock(return_value=-1)

    # Increment/Decrement
    redis.incr = AsyncMock(return_value=1)
    redis.decr = AsyncMock(return_value=0)
    redis.incrby = AsyncMock(return_value=1)

    # Hash operations
    redis.hget = AsyncMock(return_value=None)
    redis.hset = AsyncMock(return_value=1)
    redis.hgetall = AsyncMock(return_value={})
    redis.hdel = AsyncMock(return_value=1)
    redis.hexists = AsyncMock(return_value=False)

    # List operations
    redis.lpush = AsyncMock(return_value=1)
    redis.rpush = AsyncMock(return_value=1)
    redis.lpop = AsyncMock(return_value=None)
    redis.rpop = AsyncMock(return_value=None)
    redis.lrange = AsyncMock(return_value=[])
    redis.llen = AsyncMock(return_value=0)

    # Set operations
    redis.sadd = AsyncMock(return_value=1)
    redis.srem = AsyncMock(return_value=1)
    redis.smembers = AsyncMock(return_value=set())
    redis.sismember = AsyncMock(return_value=False)

    # Pub/Sub
    redis.publish = AsyncMock(return_value=0)
    redis.subscribe = AsyncMock()
    redis.unsubscribe = AsyncMock()

    # Connection management
    redis.ping = AsyncMock(return_value=True)
    redis.close = AsyncMock()

    return redis


@pytest.fixture
def mock_redis_pipeline(mock_redis):
    """
    Mock Redis pipeline for atomic operations.

    Extends mock_redis with pipeline support for multi-command
    transactions.

    Example:
        def test_atomic_ops(mock_redis_pipeline):
            mock_redis, pipeline = mock_redis_pipeline
            pipeline.execute.return_value = [True, True, 42]

            async with mock_redis.pipeline() as pipe:
                await pipe.set("key1", "value1")
                await pipe.set("key2", "value2")
                await pipe.incr("counter")
                results = await pipe.execute()
    """
    pipeline = MagicMock()
    pipeline.set = AsyncMock(return_value=pipeline)
    pipeline.get = AsyncMock(return_value=pipeline)
    pipeline.delete = AsyncMock(return_value=pipeline)
    pipeline.incr = AsyncMock(return_value=pipeline)
    pipeline.execute = AsyncMock(return_value=[True, True])

    # Make pipeline work as async context manager
    pipeline.__aenter__ = AsyncMock(return_value=pipeline)
    pipeline.__aexit__ = AsyncMock(return_value=None)

    mock_redis.pipeline = MagicMock(return_value=pipeline)

    return mock_redis, pipeline


def create_redis_with_data(data: Dict[str, Any]) -> MagicMock:
    """
    Create a Redis mock pre-populated with data.

    Useful for tests that need specific cached state.

    Args:
        data: Dictionary mapping keys to values

    Example:
        redis = create_redis_with_data({
            "user:123": '{"name": "John"}',
            "counter": "42",
        })
        result = await redis.get("user:123")
        assert result == '{"name": "John"}'
    """
    redis = MagicMock()

    async def _get(key: str) -> Optional[bytes]:
        value = data.get(key)
        if value is not None:
            return value.encode() if isinstance(value, str) else value
        return None

    async def _set(key: str, value: Any) -> bool:
        data[key] = value
        return True

    async def _delete(key: str) -> int:
        if key in data:
            del data[key]
            return 1
        return 0

    async def _exists(key: str) -> int:
        return 1 if key in data else 0

    redis.get = AsyncMock(side_effect=_get)
    redis.set = AsyncMock(side_effect=_set)
    redis.delete = AsyncMock(side_effect=_delete)
    redis.exists = AsyncMock(side_effect=_exists)

    return redis
