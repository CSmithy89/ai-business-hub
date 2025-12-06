"""
Rate Limiting Middleware for AgentOS (Story 14-7)

Uses slowapi with Redis backend when available, otherwise in-memory.
Keys requests by workspace_id + user_id (from TenantMiddleware) with
remote address fallback.
"""

from typing import Callable
import logging
import os

from fastapi import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)


def _rate_limit_key(req: Request) -> str:
    """
    Derive a key for rate limiting:
    - Prefer workspace_id + user_id (set by TenantMiddleware)
    - Fallback to user_id only
    - Fallback to remote address
    """
    workspace_id = getattr(req.state, "workspace_id", None)
    user_id = getattr(req.state, "user_id", None)

    if workspace_id and user_id:
        return f"{workspace_id}:{user_id}"
    if user_id:
        return f"user:{user_id}"

    return get_remote_address(req)


def create_limiter(redis_url: str | None = None, default_rate: str = "10/minute") -> Limiter:
    """
    Create a SlowAPI limiter with Redis storage when available, otherwise memory.

    Args:
        redis_url: Redis connection string (optional)
        default_rate: Default rate limit string (e.g., '10/minute')
    """
    storage_uri = redis_url or "memory://"

    if not redis_url:
        logger.warning("Rate limiter using in-memory storage (redis_url not set)")

    limiter = Limiter(
        key_func=_rate_limit_key, storage_uri=storage_uri, default_limits=[default_rate]
    )
    return limiter


def init_rate_limiting(app, redis_url: str | None, default_rate: str = "10/minute") -> Limiter:
    """
    Initialize rate limiting on a FastAPI app.
    - Attaches limiter to app state
    - Registers 429 handler
    """
    limiter = create_limiter(redis_url, default_rate)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    return limiter
