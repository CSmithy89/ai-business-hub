"""
Unit tests for DM-02.9: CCR Usage Monitoring & Alerts

Tests the CCR usage tracker including:
- Request recording
- Quota threshold alerts
- Metrics aggregation
- Daily reset
"""

import sys
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

# Mock httpx before importing modules
httpx_mock = MagicMock()
sys.modules["httpx"] = httpx_mock

# Now import our modules
from constants.dm_constants import DMConstants
from services.ccr_usage import (
    AlertLevel,
    CCRUsageTracker,
    QuotaStatus,
    UsageMetrics,
    get_ccr_usage_tracker,
)


class TestAlertLevel:
    """Tests for AlertLevel enum."""

    def test_alert_level_values(self) -> None:
        """Verify all expected alert levels exist."""
        assert AlertLevel.INFO.value == "info"
        assert AlertLevel.WARNING.value == "warning"
        assert AlertLevel.CRITICAL.value == "critical"


class TestUsageMetrics:
    """Tests for UsageMetrics dataclass."""

    def test_default_metrics(self) -> None:
        """Verify default metrics values."""
        metrics = UsageMetrics()
        assert metrics.total_requests == 0
        assert metrics.requests_by_provider == {}
        assert metrics.requests_by_task_type == {}
        assert metrics.estimated_tokens == 0
        assert metrics.fallback_count == 0

    def test_to_dict(self) -> None:
        """Verify to_dict serialization."""
        now = datetime.now(timezone.utc)
        metrics = UsageMetrics(
            total_requests=10,
            requests_by_provider={"claude": 5, "deepseek": 5},
            requests_by_task_type={"reasoning": 6, "code_generation": 4},
            estimated_tokens=1000,
            fallback_count=2,
            last_reset=now,
        )

        data = metrics.to_dict()
        assert data["total_requests"] == 10
        assert data["requests_by_provider"]["claude"] == 5
        assert data["estimated_tokens"] == 1000
        assert data["last_reset"] is not None


class TestQuotaStatus:
    """Tests for QuotaStatus dataclass."""

    def test_default_status(self) -> None:
        """Verify default quota status."""
        status = QuotaStatus()
        assert status.used == 0
        assert status.limit == 0
        assert status.percentage == 0.0
        assert status.alert_level == AlertLevel.INFO

    def test_to_dict(self) -> None:
        """Verify to_dict serialization."""
        status = QuotaStatus(
            used=800,
            limit=1000,
            remaining=200,
            percentage=0.8,
            alert_level=AlertLevel.WARNING,
            alert_message="CCR quota warning",
        )

        data = status.to_dict()
        assert data["used"] == 800
        assert data["percentage"] == 80.0  # Converted to percentage
        assert data["alert_level"] == "warning"


class TestCCRUsageTrackerInit:
    """Tests for CCRUsageTracker initialization."""

    def test_init_with_defaults(self) -> None:
        """Verify initialization with defaults."""
        tracker = CCRUsageTracker()
        assert tracker.daily_token_limit == 0
        assert tracker.metrics.total_requests == 0

    def test_init_with_limit(self) -> None:
        """Verify initialization with token limit."""
        tracker = CCRUsageTracker(daily_token_limit=100000)
        assert tracker.daily_token_limit == 100000


class TestCCRUsageTrackerSingleton:
    """Tests for singleton pattern."""

    def setup_method(self) -> None:
        """Reset singleton before each test."""
        CCRUsageTracker.reset_instance()

    def teardown_method(self) -> None:
        """Reset singleton after each test."""
        CCRUsageTracker.reset_instance()

    def test_get_instance_creates_singleton(self) -> None:
        """Verify get_instance creates singleton."""
        instance1 = CCRUsageTracker.get_instance()
        instance2 = CCRUsageTracker.get_instance()
        assert instance1 is instance2

    def test_reset_instance(self) -> None:
        """Verify reset clears singleton."""
        instance1 = CCRUsageTracker.get_instance()
        CCRUsageTracker.reset_instance()
        instance2 = CCRUsageTracker.get_instance()
        assert instance1 is not instance2


class TestCCRUsageTrackerRecording:
    """Tests for request recording."""

    def setup_method(self) -> None:
        """Create fresh tracker for each test."""
        CCRUsageTracker.reset_instance()
        self.tracker = CCRUsageTracker(daily_token_limit=10000)

    def test_record_single_request(self) -> None:
        """Test recording a single request."""
        self.tracker.record_request(
            provider="claude",
            task_type="reasoning",
            estimated_tokens=100,
        )

        assert self.tracker.metrics.total_requests == 1
        assert self.tracker.metrics.requests_by_provider["claude"] == 1
        assert self.tracker.metrics.requests_by_task_type["reasoning"] == 1
        assert self.tracker.metrics.estimated_tokens == 100

    def test_record_multiple_requests(self) -> None:
        """Test recording multiple requests."""
        self.tracker.record_request(provider="claude", task_type="reasoning", estimated_tokens=100)
        self.tracker.record_request(provider="deepseek", task_type="code_generation", estimated_tokens=200)
        self.tracker.record_request(provider="claude", task_type="reasoning", estimated_tokens=150)

        assert self.tracker.metrics.total_requests == 3
        assert self.tracker.metrics.requests_by_provider["claude"] == 2
        assert self.tracker.metrics.requests_by_provider["deepseek"] == 1
        assert self.tracker.metrics.requests_by_task_type["reasoning"] == 2
        assert self.tracker.metrics.estimated_tokens == 450

    def test_record_fallback_request(self) -> None:
        """Test recording a fallback request."""
        self.tracker.record_request(
            provider="deepseek",
            task_type="code_generation",
            is_fallback=True,
        )

        assert self.tracker.metrics.fallback_count == 1


class TestCCRUsageTrackerQuota:
    """Tests for quota status calculation."""

    def setup_method(self) -> None:
        """Create fresh tracker for each test."""
        CCRUsageTracker.reset_instance()

    def test_unlimited_quota(self) -> None:
        """Test quota status with unlimited (0) limit."""
        tracker = CCRUsageTracker(daily_token_limit=0)
        tracker.record_request(provider="claude", task_type="reasoning", estimated_tokens=1000)

        status = tracker.get_quota_status()
        assert status.limit == 0
        assert status.percentage == 0.0
        assert status.alert_level == AlertLevel.INFO

    def test_quota_under_warning(self) -> None:
        """Test quota status under warning threshold."""
        tracker = CCRUsageTracker(daily_token_limit=10000)
        # Use 50% of quota
        tracker.record_request(provider="claude", task_type="reasoning", estimated_tokens=5000)

        status = tracker.get_quota_status()
        assert status.percentage == 0.5
        assert status.alert_level == AlertLevel.INFO

    def test_quota_at_warning(self) -> None:
        """Test quota status at warning threshold."""
        tracker = CCRUsageTracker(daily_token_limit=10000)
        # Use 80% of quota
        tracker.record_request(provider="claude", task_type="reasoning", estimated_tokens=8000)

        status = tracker.get_quota_status()
        assert status.percentage == 0.8
        assert status.alert_level == AlertLevel.WARNING
        assert "warning" in (status.alert_message or "").lower()

    def test_quota_at_critical(self) -> None:
        """Test quota status at critical threshold."""
        tracker = CCRUsageTracker(daily_token_limit=10000)
        # Use 95% of quota
        tracker.record_request(provider="claude", task_type="reasoning", estimated_tokens=9500)

        status = tracker.get_quota_status()
        assert status.percentage == 0.95
        assert status.alert_level == AlertLevel.CRITICAL
        assert "critical" in (status.alert_message or "").lower()

    def test_quota_over_limit(self) -> None:
        """Test quota status over limit."""
        tracker = CCRUsageTracker(daily_token_limit=10000)
        # Use 110% of quota
        tracker.record_request(provider="claude", task_type="reasoning", estimated_tokens=11000)

        status = tracker.get_quota_status()
        assert status.percentage == 1.1
        assert status.remaining == 0
        assert status.alert_level == AlertLevel.CRITICAL


class TestCCRUsageTrackerReset:
    """Tests for daily reset functionality."""

    def setup_method(self) -> None:
        """Create fresh tracker for each test."""
        CCRUsageTracker.reset_instance()

    def test_reset_daily(self) -> None:
        """Test daily reset clears metrics."""
        tracker = CCRUsageTracker(daily_token_limit=10000)
        tracker.record_request(provider="claude", task_type="reasoning", estimated_tokens=5000)

        assert tracker.metrics.total_requests == 1
        assert tracker.metrics.estimated_tokens == 5000

        tracker.reset_daily()

        assert tracker.metrics.total_requests == 0
        assert tracker.metrics.estimated_tokens == 0
        assert tracker.metrics.requests_by_provider == {}
        assert tracker.metrics.last_reset is not None


class TestCCRUsageTrackerMetrics:
    """Tests for metrics summary."""

    def setup_method(self) -> None:
        """Create fresh tracker for each test."""
        CCRUsageTracker.reset_instance()

    def test_get_metrics_summary(self) -> None:
        """Test comprehensive metrics summary."""
        tracker = CCRUsageTracker(daily_token_limit=10000)
        tracker.record_request(provider="claude", task_type="reasoning", estimated_tokens=1000)
        tracker.record_request(provider="deepseek", task_type="code_generation", estimated_tokens=500)

        summary = tracker.get_metrics_summary()

        assert "metrics" in summary
        assert "quota" in summary
        assert "thresholds" in summary

        assert summary["metrics"]["total_requests"] == 2
        assert summary["quota"]["used"] == 1500
        assert summary["thresholds"]["warning"] == DMConstants.CCR.QUOTA_WARNING_THRESHOLD
        assert summary["thresholds"]["critical"] == DMConstants.CCR.QUOTA_CRITICAL_THRESHOLD


class TestDMConstantsUsage:
    """Verify DMConstants are used correctly."""

    def test_warning_threshold_exists(self) -> None:
        """Verify warning threshold defined."""
        assert DMConstants.CCR.QUOTA_WARNING_THRESHOLD == 0.8

    def test_critical_threshold_exists(self) -> None:
        """Verify critical threshold defined."""
        assert DMConstants.CCR.QUOTA_CRITICAL_THRESHOLD == 0.95

    def test_thresholds_order(self) -> None:
        """Verify thresholds are in correct order."""
        assert DMConstants.CCR.QUOTA_WARNING_THRESHOLD < DMConstants.CCR.QUOTA_CRITICAL_THRESHOLD


class TestGetCCRUsageTracker:
    """Tests for convenience function."""

    def setup_method(self) -> None:
        """Reset singleton before each test."""
        CCRUsageTracker.reset_instance()

    def teardown_method(self) -> None:
        """Reset singleton after each test."""
        CCRUsageTracker.reset_instance()

    def test_get_ccr_usage_tracker(self) -> None:
        """Test convenience function returns singleton."""
        tracker1 = get_ccr_usage_tracker()
        tracker2 = get_ccr_usage_tracker()
        assert tracker1 is tracker2
