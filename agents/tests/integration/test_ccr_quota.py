"""
CCR Quota Enforcement Integration Tests

Tests CCR (Claude Code Router) quota enforcement:
- Daily quota enforcement
- Quota status reporting
- Warning threshold at 80%
- Workspace isolation

DM-09.7: CCR Operational Verification Tests
@see docs/modules/bm-dm/stories/dm-09-7-ccr-operational-tests.md
"""

import sys
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Setup anyio for async tests
pytest_plugins = ["anyio"]


class TestCCRDailyQuotaEnforcement:
    """Tests for daily quota enforcement."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_enforce_daily_quota_below_limit(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Requests within quota are allowed."""
        tracker, controller = mock_ccr_usage_tracker
        controller.set_usage(50000, 100000)  # 50% used

        status = tracker.get_quota_status()

        assert status.used == 50000
        assert status.limit == 100000
        assert status.remaining == 50000
        assert status.percentage == 0.5
        assert status.alert_level.value == "info"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_enforce_daily_quota_at_limit(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Requests at quota limit trigger critical alert."""
        tracker, controller = mock_ccr_usage_tracker
        controller.exhaust_quota()

        status = tracker.get_quota_status()

        assert status.remaining == 0
        assert status.percentage >= 1.0
        assert status.alert_level.value == "critical"
        assert "critical" in (status.alert_message or "").lower()

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_quota_exceeded_status(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Quota exceeded returns appropriate status."""
        tracker, controller = mock_ccr_usage_tracker
        # Set usage over limit
        controller.set_usage(120000, 100000)  # 120% used

        status = tracker.get_quota_status()

        assert status.used == 120000
        assert status.limit == 100000
        assert status.remaining == 0  # Capped at 0
        assert status.percentage == 1.2
        assert status.alert_level.value == "critical"


class TestCCRQuotaStatusReporting:
    """Tests for quota status reporting."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_quota_status_includes_all_fields(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Quota status includes all required fields."""
        tracker, controller = mock_ccr_usage_tracker
        controller.set_usage(40000, 100000)

        status = tracker.get_quota_status()

        # All required fields present
        assert hasattr(status, "used")
        assert hasattr(status, "limit")
        assert hasattr(status, "remaining")
        assert hasattr(status, "percentage")
        assert hasattr(status, "alert_level")
        assert hasattr(status, "alert_message")

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_quota_status_to_dict(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Quota status can be serialized to dict."""
        tracker, controller = mock_ccr_usage_tracker
        controller.set_usage(60000, 100000)

        status = tracker.get_quota_status()
        result = status.to_dict()

        assert "used" in result
        assert "limit" in result
        assert "remaining" in result
        assert "percentage" in result
        assert "alert_level" in result
        assert "alert_message" in result

        # Percentage should be displayed as percentage (0-100)
        assert result["percentage"] == 60.0

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_usage_metrics_by_provider(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Usage metrics track by provider."""
        tracker, controller = mock_ccr_usage_tracker

        # Record requests for different providers
        tracker.record_request(
            provider="claude",
            task_type="reasoning",
            estimated_tokens=1000,
        )
        tracker.record_request(
            provider="deepseek",
            task_type="code_generation",
            estimated_tokens=2000,
        )
        tracker.record_request(
            provider="claude",
            task_type="general",
            estimated_tokens=500,
        )

        metrics = tracker._metrics

        assert metrics.total_requests == 3
        assert metrics.requests_by_provider["claude"] == 2
        assert metrics.requests_by_provider["deepseek"] == 1
        assert metrics.estimated_tokens == 3500

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_usage_metrics_by_task_type(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Usage metrics track by task type."""
        tracker, controller = mock_ccr_usage_tracker

        # Record requests for different task types
        tracker.record_request(
            provider="claude",
            task_type="reasoning",
            estimated_tokens=1000,
        )
        tracker.record_request(
            provider="claude",
            task_type="code_generation",
            estimated_tokens=2000,
        )
        tracker.record_request(
            provider="claude",
            task_type="reasoning",
            estimated_tokens=1500,
        )

        metrics = tracker._metrics

        assert metrics.requests_by_task_type["reasoning"] == 2
        assert metrics.requests_by_task_type["code_generation"] == 1


class TestCCRWarningThreshold:
    """Tests for warning threshold at 80%."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_warning_at_80_percent(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """80% usage triggers warning alert."""
        tracker, controller = mock_ccr_usage_tracker
        controller.set_warning_level()  # 80%

        status = tracker.get_quota_status()

        assert status.alert_level.value == "warning"
        assert "warning" in (status.alert_message or "").lower()

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_no_warning_below_80_percent(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Below 80% usage has no warning."""
        tracker, controller = mock_ccr_usage_tracker
        controller.set_usage(79000, 100000)  # 79%

        status = tracker.get_quota_status()

        assert status.alert_level.value == "info"
        assert status.alert_message is None

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_critical_at_95_percent(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """95% usage triggers critical alert."""
        tracker, controller = mock_ccr_usage_tracker
        controller.set_critical_level()  # 95%

        status = tracker.get_quota_status()

        assert status.alert_level.value == "critical"
        assert "critical" in (status.alert_message or "").lower()

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_warning_between_80_and_95_percent(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Between 80% and 95% triggers warning (not critical)."""
        tracker, controller = mock_ccr_usage_tracker
        controller.set_usage(90000, 100000)  # 90%

        status = tracker.get_quota_status()

        assert status.alert_level.value == "warning"  # Not critical yet


class TestCCRWorkspaceIsolation:
    """Tests for workspace isolation in quota tracking."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_separate_trackers_per_workspace(self, ccr_enabled, ccr_test_config):
        """Each workspace should have isolated quota tracking."""
        from services.ccr_usage import CCRUsageTracker, UsageMetrics

        # Create separate trackers for different workspaces
        tracker1 = CCRUsageTracker(daily_token_limit=100000)
        tracker2 = CCRUsageTracker(daily_token_limit=100000)

        # Use workspace 1 heavily
        for _ in range(10):
            tracker1.record_request(
                provider="claude",
                task_type="reasoning",
                estimated_tokens=5000,
            )

        # Workspace 2 should be unaffected
        assert tracker1._metrics.estimated_tokens == 50000
        assert tracker2._metrics.estimated_tokens == 0

        # Workspace 2 quota should be at 0%
        status2 = tracker2.get_quota_status()
        assert status2.percentage == 0.0

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_exhaust_one_workspace_others_unaffected(
        self, ccr_enabled, ccr_test_config
    ):
        """Exhausting one workspace quota doesn't affect others."""
        from services.ccr_usage import AlertLevel, CCRUsageTracker

        # Create two trackers
        tracker_ws1 = CCRUsageTracker(daily_token_limit=100000)
        tracker_ws2 = CCRUsageTracker(daily_token_limit=100000)

        # Exhaust workspace 1
        tracker_ws1._metrics.estimated_tokens = 100000

        # Workspace 1 is at critical
        status1 = tracker_ws1.get_quota_status()
        assert status1.alert_level == AlertLevel.CRITICAL

        # Workspace 2 is still at info (no usage)
        status2 = tracker_ws2.get_quota_status()
        assert status2.alert_level == AlertLevel.INFO
        assert status2.remaining == 100000

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_daily_reset_clears_workspace_usage(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Daily reset clears usage for workspace."""
        tracker, controller = mock_ccr_usage_tracker

        # Add usage
        tracker.record_request(
            provider="claude",
            task_type="reasoning",
            estimated_tokens=50000,
        )

        assert tracker._metrics.estimated_tokens == 50000

        # Reset daily
        controller.reset()

        # Usage should be cleared
        assert tracker._metrics.estimated_tokens == 0
        assert tracker._metrics.total_requests == 0
        assert tracker._metrics.requests_by_provider == {}


class TestCCRFallbackTracking:
    """Tests for tracking fallback requests in quota."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_fallback_requests_counted(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Fallback requests are counted in metrics."""
        tracker, controller = mock_ccr_usage_tracker

        # Record normal request
        tracker.record_request(
            provider="claude",
            task_type="reasoning",
            estimated_tokens=1000,
            is_fallback=False,
        )

        # Record fallback request
        tracker.record_request(
            provider="deepseek",
            task_type="reasoning",
            estimated_tokens=1000,
            is_fallback=True,
        )

        assert tracker._metrics.total_requests == 2
        assert tracker._metrics.fallback_count == 1

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_fallback_tokens_counted_toward_quota(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Fallback request tokens count toward quota."""
        tracker, controller = mock_ccr_usage_tracker
        controller.set_usage(0, 10000)  # Start at 0

        # Record fallback requests
        tracker.record_request(
            provider="deepseek",
            task_type="reasoning",
            estimated_tokens=5000,
            is_fallback=True,
        )

        status = tracker.get_quota_status()
        assert status.used == 5000
        assert status.percentage == 0.5


class TestCCRQuotaWithInputOutputTokens:
    """Tests for quota tracking with explicit input/output tokens."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_input_output_tokens_tracked(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Input and output tokens are tracked correctly."""
        tracker, controller = mock_ccr_usage_tracker

        tracker.record_request(
            provider="claude",
            task_type="reasoning",
            input_tokens=1000,
            output_tokens=500,
        )

        assert tracker._metrics.estimated_tokens == 1500

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_estimated_tokens_fallback(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Falls back to estimated_tokens when input/output not provided."""
        tracker, controller = mock_ccr_usage_tracker

        tracker.record_request(
            provider="claude",
            task_type="reasoning",
            estimated_tokens=2000,
        )

        assert tracker._metrics.estimated_tokens == 2000

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_explicit_tokens_override_estimated(
        self, ccr_enabled, ccr_test_config, mock_ccr_usage_tracker
    ):
        """Explicit input/output tokens override estimated_tokens."""
        tracker, controller = mock_ccr_usage_tracker

        tracker.record_request(
            provider="claude",
            task_type="reasoning",
            estimated_tokens=5000,  # This should be ignored
            input_tokens=1000,
            output_tokens=500,
        )

        # Should use input + output, not estimated
        assert tracker._metrics.estimated_tokens == 1500
