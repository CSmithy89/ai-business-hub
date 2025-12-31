"""
Rate Limiting Middleware for AgentOS (Story 14-7, DM-08.3)

Uses slowapi with Redis backend when available, otherwise in-memory.
Keys requests by workspace_id + user_id (from TenantMiddleware) with
remote address fallback.

DM-08.3: Added get_limiter() for use by routes in separate modules.
DM-09.1: Added OpenTelemetry tracing for rate limit decisions.
"""

from typing import Callable, Optional
import hashlib
import logging

from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from opentelemetry import trace

logger = logging.getLogger(__name__)

# Get tracer for rate limiting spans
_tracer = trace.get_tracer(__name__)

# Module-level limiter reference (set by init_rate_limiting)
_limiter: Optional[Limiter] = None


def _hash_key(raw: str) -> str:
    """Normalize key component to avoid collisions/length issues."""
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _rate_limit_key(req: Request | None = None) -> str:
    """
    Derive a key for rate limiting.

    SlowAPI calls this function with request to generate rate limit keys.
    The optional None parameter supports certain SlowAPI call patterns.

    Key derivation priority:
    - Prefer workspace_id + user_id (set by TenantMiddleware)
    - Fallback to user_id only
    - Fallback to remote address

    Args:
        req: The FastAPI Request object (optional for SlowAPI compatibility)

    Returns:
        A hashed key string for rate limiting
    """
    # DM-09.1: Add tracing span for rate limit key derivation
    with _tracer.start_as_current_span("rate_limit.derive_key") as span:
        if req is None:
            span.set_attribute("rate_limit.key_type", "unknown")
            return "ip:unknown"

        workspace_id = getattr(req.state, "workspace_id", None)
        user_id = getattr(req.state, "user_id", None)
        endpoint = str(req.url.path) if req.url else "unknown"

        span.set_attribute("rate_limit.endpoint", endpoint)

        if workspace_id and user_id:
            span.set_attribute("rate_limit.key_type", "workspace+user")
            span.set_attribute("rate_limit.has_workspace_id", True)
            span.set_attribute("rate_limit.has_user_id", True)
            return f"id:{_hash_key(f'{str(workspace_id)}:{str(user_id)}')}"
        if user_id:
            span.set_attribute("rate_limit.key_type", "user")
            span.set_attribute("rate_limit.has_workspace_id", False)
            span.set_attribute("rate_limit.has_user_id", True)
            return f"user:{_hash_key(str(user_id))}"

        remote = get_remote_address(req)
        span.set_attribute("rate_limit.key_type", "ip")
        span.set_attribute("rate_limit.has_workspace_id", False)
        span.set_attribute("rate_limit.has_user_id", False)
        return f"ip:{_hash_key(str(remote))}"


class NoopLimiter:
    """Fallback limiter that leaves routes unthrottled but preserves decorator shape."""

    default_limits = []

    def limit(self, *args, **kwargs):  # noqa: D401
        # Support both @limiter.limit and @limiter.limit("x/minute") usage
        if args and callable(args[0]) and len(args) == 1 and not kwargs:
            return args[0]

        def decorator(fn: Callable):
            return fn

        return decorator


def create_limiter(redis_url: str | None = None, default_rate: str = "10/minute") -> Limiter:
    """
    Create a SlowAPI limiter with Redis storage when available, otherwise memory.

    Args:
        redis_url: Redis connection string (optional)
        default_rate: Default rate limit string (e.g., '10/minute')

    Returns:
        Limiter configured with rate limit headers (X-RateLimit-Limit,
        X-RateLimit-Remaining, X-RateLimit-Reset) enabled.
    """
    storage_uri = redis_url or "memory://"

    if not redis_url:
        logger.warning("Rate limiter using in-memory storage (redis_url not set)")

    limiter = Limiter(
        key_func=_rate_limit_key,
        storage_uri=storage_uri,
        default_limits=[default_rate],
        headers_enabled=True,  # Enable X-RateLimit-* headers in responses
    )
    return limiter


def init_rate_limiting(app, redis_url: str | None, default_rate: str = "10/minute"):
    """
    Initialize rate limiting on a FastAPI app.
    - Attaches limiter to app state
    - Registers 429 handler
    - Adds SlowAPI middleware for enforcement
    - Sets module-level _limiter for use by get_limiter()
    """
    global _limiter  # noqa: PLW0603

    # DM-09.1: Add tracing span for rate limiting initialization
    with _tracer.start_as_current_span("rate_limit.init") as span:
        span.set_attribute("rate_limit.default_rate", default_rate)
        span.set_attribute("rate_limit.has_redis", redis_url is not None)

        try:
            limiter = create_limiter(redis_url, default_rate)
            app.state.limiter = limiter
            _limiter = limiter  # DM-08.3: Store for get_limiter()
            app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
            app.add_middleware(SlowAPIMiddleware)

            span.set_attribute("rate_limit.storage_type", "redis" if redis_url else "memory")
            span.set_attribute("rate_limit.init_success", True)

            return limiter
        except Exception as exc:  # noqa: BLE001
            logger.error("Rate limiting initialization failed, continuing without limits: %s", exc, exc_info=True)
            span.set_attribute("rate_limit.init_success", False)
            span.set_attribute("rate_limit.error", str(exc))

            limiter = NoopLimiter()
            app.state.limiter = limiter
            _limiter = limiter
            return limiter


def get_limiter() -> Limiter | NoopLimiter:
    """
    Get the initialized rate limiter for use in route decorators.

    DM-08.3: This allows routes in separate modules to apply rate limiting
    using the same limiter instance initialized in main.py.

    Returns:
        The shared Limiter instance, or NoopLimiter if not initialized.

    Example:
        from middleware.rate_limit import get_limiter
        from constants.dm_constants import DMConstants

        limiter = get_limiter()

        @router.get("/endpoint")
        @limiter.limit(DMConstants.RATE_LIMITS.A2A_DISCOVERY)
        async def my_endpoint(request: Request):
            ...
    """
    global _limiter  # noqa: PLW0602
    if _limiter is None:
        logger.warning("get_limiter() called before init_rate_limiting(), returning NoopLimiter")
        return NoopLimiter()
    return _limiter
