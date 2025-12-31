"""
OpenTelemetry Decorators for HYVVE AgentOS (DM-09.1)

Provides the @traced decorator for creating spans around functions.
Supports both sync and async functions with automatic exception recording.
"""

import asyncio
from functools import wraps
from typing import Any, Callable, TypeVar

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

F = TypeVar("F", bound=Callable[..., Any])


def traced(
    span_name: str | None = None,
    attributes: dict[str, Any] | None = None,
) -> Callable[[F], F]:
    """
    Decorator to create a span around a function.

    Works with both sync and async functions. Automatically:
    - Creates a span with the function name (or custom name)
    - Sets provided attributes on the span
    - Records exceptions with ERROR status
    - Sets OK status on successful completion

    Args:
        span_name: Custom span name (defaults to module.function_name)
        attributes: Static attributes to set on the span

    Returns:
        Decorated function with tracing

    Example:
        @traced("a2a.call", {"agent.type": "gateway"})
        async def call_agent(agent_id: str):
            ...

        @traced()  # Uses function name as span name
        def process_request(data: dict):
            ...

        # Adding dynamic attributes within the span:
        @traced("custom.operation")
        async def my_operation(data: dict):
            span = trace.get_current_span()
            span.set_attribute("data.size", len(data))
            ...
    """

    def decorator(func: F) -> F:
        name = span_name or f"{func.__module__}.{func.__name__}"
        tracer = trace.get_tracer(__name__)

        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            with tracer.start_as_current_span(name) as span:
                if attributes:
                    for key, value in attributes.items():
                        span.set_attribute(key, value)
                try:
                    result = await func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            with tracer.start_as_current_span(name) as span:
                if attributes:
                    for key, value in attributes.items():
                        span.set_attribute(key, value)
                try:
                    result = func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise

        if asyncio.iscoroutinefunction(func):
            return async_wrapper  # type: ignore[return-value]
        return sync_wrapper  # type: ignore[return-value]

    return decorator
