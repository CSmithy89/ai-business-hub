"""
CCR Usage Monitoring and Alerts

Tracks CCR usage metrics and generates quota alerts.
Provides operational visibility into provider distribution and token usage.

DM-09.1: Added OpenTelemetry tracing for quota monitoring.
DM-09.2: Added Prometheus metrics for CCR request monitoring.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional

from opentelemetry import trace

from agents.constants.dm_constants import DMConstants
from agents.observability.metrics import record_ccr_request

logger = logging.getLogger(__name__)

# Get tracer for CCR usage tracking
_tracer = trace.get_tracer(__name__)


class AlertLevel(str, Enum):
    """Alert severity levels for quota monitoring."""

    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class UsageMetrics:
    """Aggregated usage metrics."""

    total_requests: int = 0
    requests_by_provider: Dict[str, int] = field(default_factory=dict)
    requests_by_task_type: Dict[str, int] = field(default_factory=dict)
    estimated_tokens: int = 0
    fallback_count: int = 0
    last_reset: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serialize metrics to dictionary."""
        return {
            "total_requests": self.total_requests,
            "requests_by_provider": self.requests_by_provider.copy(),
            "requests_by_task_type": self.requests_by_task_type.copy(),
            "estimated_tokens": self.estimated_tokens,
            "fallback_count": self.fallback_count,
            "last_reset": self.last_reset.isoformat() if self.last_reset else None,
        }


@dataclass
class QuotaStatus:
    """Quota status with alert level."""

    used: int = 0
    limit: int = 0
    remaining: int = 0
    percentage: float = 0.0
    alert_level: AlertLevel = AlertLevel.INFO
    alert_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serialize quota status to dictionary."""
        return {
            "used": self.used,
            "limit": self.limit,
            "remaining": self.remaining,
            "percentage": round(self.percentage * 100, 2),
            "alert_level": self.alert_level.value,
            "alert_message": self.alert_message,
        }


class CCRUsageTracker:
    """
    Tracks CCR usage and generates quota alerts.

    Features:
    - Request counting by provider and task type
    - Quota threshold monitoring with alerts
    - Daily usage reset
    - Singleton pattern for shared state

    All thresholds from DMConstants.
    """

    _instance: Optional["CCRUsageTracker"] = None

    def __init__(self, daily_token_limit: int = 0):
        """
        Initialize usage tracker.

        Args:
            daily_token_limit: Daily token limit (0 = unlimited)
        """
        self.daily_token_limit = daily_token_limit
        self._metrics = UsageMetrics(last_reset=datetime.now(timezone.utc))
        self._warning_threshold = DMConstants.CCR.QUOTA_WARNING_THRESHOLD
        self._critical_threshold = DMConstants.CCR.QUOTA_CRITICAL_THRESHOLD

    @classmethod
    def get_instance(cls, daily_token_limit: int = 0) -> "CCRUsageTracker":
        """
        Get singleton instance.

        Args:
            daily_token_limit: Daily token limit (used on first call)

        Returns:
            Singleton CCRUsageTracker instance
        """
        if cls._instance is None:
            cls._instance = cls(daily_token_limit=daily_token_limit)
        return cls._instance

    @classmethod
    def reset_instance(cls) -> None:
        """Reset singleton instance (for testing)."""
        cls._instance = None

    @property
    def metrics(self) -> UsageMetrics:
        """Get current usage metrics."""
        return self._metrics

    def record_request(
        self,
        provider: str,
        task_type: str,
        estimated_tokens: int = 0,
        is_fallback: bool = False,
        input_tokens: int = 0,
        output_tokens: int = 0,
    ) -> None:
        """
        Record a CCR request.

        Args:
            provider: Provider used (claude, deepseek, gemini, openrouter)
            task_type: Task type routed to
            estimated_tokens: Estimated token usage (deprecated, use input/output)
            is_fallback: Whether this was a fallback request
            input_tokens: Number of input tokens (DM-09.2)
            output_tokens: Number of output tokens (DM-09.2)
        """
        # DM-09.1: Add tracing span for CCR request recording
        with _tracer.start_as_current_span("ccr.record_request") as span:
            span.set_attribute("ccr.provider", provider)
            span.set_attribute("ccr.task_type", task_type)
            span.set_attribute("ccr.estimated_tokens", estimated_tokens)
            span.set_attribute("ccr.is_fallback", is_fallback)
            span.set_attribute("ccr.input_tokens", input_tokens)
            span.set_attribute("ccr.output_tokens", output_tokens)

            self._metrics.total_requests += 1

            # Track by provider
            if provider not in self._metrics.requests_by_provider:
                self._metrics.requests_by_provider[provider] = 0
            self._metrics.requests_by_provider[provider] += 1

            # Track by task type
            if task_type not in self._metrics.requests_by_task_type:
                self._metrics.requests_by_task_type[task_type] = 0
            self._metrics.requests_by_task_type[task_type] += 1

            # Track tokens (use explicit input/output if provided, fallback to estimated)
            total_tokens = (input_tokens + output_tokens) or estimated_tokens
            self._metrics.estimated_tokens += total_tokens

            # Track fallbacks
            if is_fallback:
                self._metrics.fallback_count += 1

            # Add cumulative metrics to span
            span.set_attribute("ccr.total_requests", self._metrics.total_requests)
            span.set_attribute("ccr.total_tokens", self._metrics.estimated_tokens)

            # DM-09.2: Record Prometheus metrics
            record_ccr_request(
                provider=provider,
                task_type=task_type,
                status="fallback" if is_fallback else "success",
                input_tokens=input_tokens or (estimated_tokens // 2),
                output_tokens=output_tokens or (estimated_tokens // 2),
            )

            logger.debug(
                "CCR request recorded",
                extra={
                    "provider": provider,
                    "task_type": task_type,
                    "estimated_tokens": estimated_tokens,
                    "is_fallback": is_fallback,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                },
            )

            # Check quota and emit alert if needed
            self._check_quota_alerts()

    def get_quota_status(self) -> QuotaStatus:
        """
        Get current quota status with alert level.

        Returns:
            QuotaStatus with usage and alert info
        """
        # DM-09.1: Add tracing span for quota status check
        with _tracer.start_as_current_span("ccr.get_quota_status") as span:
            used = self._metrics.estimated_tokens
            limit = self.daily_token_limit

            span.set_attribute("ccr.quota.used", used)
            span.set_attribute("ccr.quota.limit", limit)

            # Handle unlimited quota
            if limit == 0:
                span.set_attribute("ccr.quota.unlimited", True)
                return QuotaStatus(
                    used=used,
                    limit=0,
                    remaining=0,
                    percentage=0.0,
                    alert_level=AlertLevel.INFO,
                    alert_message=None,
                )

            remaining = max(0, limit - used)
            percentage = used / limit if limit > 0 else 0.0

            alert_level, alert_message = self._determine_alert(percentage)

            span.set_attribute("ccr.quota.remaining", remaining)
            span.set_attribute("ccr.quota.percentage", percentage)
            span.set_attribute("ccr.quota.alert_level", alert_level.value)

            return QuotaStatus(
                used=used,
                limit=limit,
                remaining=remaining,
                percentage=percentage,
                alert_level=alert_level,
                alert_message=alert_message,
            )

    def _determine_alert(self, percentage: float) -> tuple[AlertLevel, Optional[str]]:
        """
        Determine alert level based on usage percentage.

        Args:
            percentage: Usage percentage (0.0 to 1.0+)

        Returns:
            Tuple of (AlertLevel, optional message)
        """
        if percentage >= self._critical_threshold:
            return (
                AlertLevel.CRITICAL,
                f"CCR quota critical: {percentage * 100:.1f}% used",
            )
        elif percentage >= self._warning_threshold:
            return (
                AlertLevel.WARNING,
                f"CCR quota warning: {percentage * 100:.1f}% used",
            )
        else:
            return (AlertLevel.INFO, None)

    def _check_quota_alerts(self) -> None:
        """Check quota and emit log alerts if thresholds exceeded."""
        status = self.get_quota_status()

        if status.alert_level == AlertLevel.CRITICAL:
            logger.critical(
                "CCR quota critical",
                extra={
                    "used": status.used,
                    "limit": status.limit,
                    "percentage": status.percentage * 100,
                },
            )
        elif status.alert_level == AlertLevel.WARNING:
            logger.warning(
                "CCR quota warning",
                extra={
                    "used": status.used,
                    "limit": status.limit,
                    "percentage": status.percentage * 100,
                },
            )

    def reset_daily(self) -> None:
        """Reset daily usage counters."""
        logger.info(
            "Resetting CCR daily usage",
            extra={"previous_tokens": self._metrics.estimated_tokens},
        )
        self._metrics = UsageMetrics(last_reset=datetime.now(timezone.utc))

    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive metrics summary.

        Returns:
            Dict with metrics, quota status, and health info
        """
        return {
            "metrics": self._metrics.to_dict(),
            "quota": self.get_quota_status().to_dict(),
            "thresholds": {
                "warning": self._warning_threshold,
                "critical": self._critical_threshold,
            },
        }


# Convenience function for singleton access
def get_ccr_usage_tracker() -> CCRUsageTracker:
    """Get the singleton CCR usage tracker."""
    return CCRUsageTracker.get_instance()
