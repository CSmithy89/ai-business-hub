"""
AgentOS Services

Background services for AgentOS runtime.
"""

from .ccr_health import CCRHealthChecker, get_ccr_health_checker
from .ccr_usage import (
    CCRUsageTracker,
    get_ccr_usage_tracker,
    AlertLevel,
    UsageMetrics,
    QuotaStatus,
)
from .token_counter import (
    count_tokens,
    count_tokens_with_metadata,
    is_tiktoken_available,
    estimate_tokens,
)

__all__ = [
    # Health
    "CCRHealthChecker",
    "get_ccr_health_checker",
    # Usage
    "CCRUsageTracker",
    "get_ccr_usage_tracker",
    "AlertLevel",
    "UsageMetrics",
    "QuotaStatus",
    # Token counting (DM-11.14)
    "count_tokens",
    "count_tokens_with_metadata",
    "is_tiktoken_available",
    "estimate_tokens",
]
