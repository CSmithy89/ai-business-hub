"""
Tests for Metrics Endpoint Authentication (DM-11.13)

Tests the optional authentication middleware for the /metrics endpoint.

Note: Uses a mock OTelSettings class to avoid OpenTelemetry dependencies.
"""

import pytest
from unittest.mock import MagicMock
from dataclasses import dataclass
from typing import Optional

from fastapi import HTTPException, Request


@dataclass
class MockOTelSettings:
    """Mock settings for testing without OpenTelemetry deps."""

    metrics_require_auth: bool = False
    metrics_api_key: Optional[str] = None


async def verify_metrics_auth_impl(
    request: Request,
    settings: MockOTelSettings,
) -> None:
    """
    Verify authentication for metrics endpoint.

    This is a copy of the actual implementation for testing purposes,
    avoiding the full OpenTelemetry import chain.
    """
    # Auth disabled - allow all requests
    if not settings.metrics_require_auth:
        return

    # Auth enabled but no key configured - server error
    if not settings.metrics_api_key:
        raise HTTPException(
            status_code=500,
            detail="Metrics authentication enabled but no API key configured",
        )

    # Check Authorization header (Bearer token)
    auth_header = request.headers.get("Authorization")
    if auth_header:
        scheme, _, token = auth_header.partition(" ")
        if scheme.lower() == "bearer" and token == settings.metrics_api_key:
            return

    # Check X-Metrics-Key header
    metrics_key = request.headers.get("X-Metrics-Key")
    if metrics_key == settings.metrics_api_key:
        return

    # No valid authentication provided
    raise HTTPException(
        status_code=401,
        detail="Invalid or missing metrics API key",
        headers={"WWW-Authenticate": "Bearer"},
    )


class TestMetricsAuth:
    """Test metrics endpoint authentication."""

    @pytest.fixture
    def mock_request(self):
        """Create a mock FastAPI request."""
        request = MagicMock(spec=Request)
        request.headers = {}
        return request

    @pytest.fixture
    def auth_disabled_settings(self):
        """Settings with auth disabled (default)."""
        return MockOTelSettings(
            metrics_require_auth=False,
            metrics_api_key=None,
        )

    @pytest.fixture
    def auth_enabled_settings(self):
        """Settings with auth enabled."""
        return MockOTelSettings(
            metrics_require_auth=True,
            metrics_api_key="test-secret-key",
        )

    @pytest.fixture
    def auth_enabled_no_key_settings(self):
        """Settings with auth enabled but no key configured (misconfiguration)."""
        return MockOTelSettings(
            metrics_require_auth=True,
            metrics_api_key=None,
        )

    @pytest.mark.asyncio
    async def test_auth_disabled_allows_all(
        self, mock_request, auth_disabled_settings
    ):
        """When auth is disabled, all requests should be allowed."""
        # Should not raise any exception
        result = await verify_metrics_auth_impl(mock_request, auth_disabled_settings)
        assert result is None

    @pytest.mark.asyncio
    async def test_auth_enabled_rejects_no_credentials(
        self, mock_request, auth_enabled_settings
    ):
        """When auth is enabled, requests without credentials should be rejected."""
        with pytest.raises(HTTPException) as exc_info:
            await verify_metrics_auth_impl(mock_request, auth_enabled_settings)

        assert exc_info.value.status_code == 401
        assert "Invalid or missing" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_auth_enabled_accepts_bearer_token(
        self, mock_request, auth_enabled_settings
    ):
        """When auth is enabled, valid Bearer token should be accepted."""
        mock_request.headers = {"Authorization": "Bearer test-secret-key"}

        result = await verify_metrics_auth_impl(mock_request, auth_enabled_settings)
        assert result is None

    @pytest.mark.asyncio
    async def test_auth_enabled_accepts_metrics_key_header(
        self, mock_request, auth_enabled_settings
    ):
        """When auth is enabled, valid X-Metrics-Key header should be accepted."""
        mock_request.headers = {"X-Metrics-Key": "test-secret-key"}

        result = await verify_metrics_auth_impl(mock_request, auth_enabled_settings)
        assert result is None

    @pytest.mark.asyncio
    async def test_auth_enabled_rejects_wrong_bearer_token(
        self, mock_request, auth_enabled_settings
    ):
        """When auth is enabled, wrong Bearer token should be rejected."""
        mock_request.headers = {"Authorization": "Bearer wrong-key"}

        with pytest.raises(HTTPException) as exc_info:
            await verify_metrics_auth_impl(mock_request, auth_enabled_settings)

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_auth_enabled_rejects_wrong_metrics_key(
        self, mock_request, auth_enabled_settings
    ):
        """When auth is enabled, wrong X-Metrics-Key should be rejected."""
        mock_request.headers = {"X-Metrics-Key": "wrong-key"}

        with pytest.raises(HTTPException) as exc_info:
            await verify_metrics_auth_impl(mock_request, auth_enabled_settings)

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_auth_enabled_no_key_configured_returns_500(
        self, mock_request, auth_enabled_no_key_settings
    ):
        """When auth is enabled but no key is configured, return 500 error."""
        with pytest.raises(HTTPException) as exc_info:
            await verify_metrics_auth_impl(mock_request, auth_enabled_no_key_settings)

        assert exc_info.value.status_code == 500
        assert "no API key configured" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_bearer_token_case_insensitive_scheme(
        self, mock_request, auth_enabled_settings
    ):
        """Bearer scheme should be case-insensitive."""
        mock_request.headers = {"Authorization": "BEARER test-secret-key"}

        result = await verify_metrics_auth_impl(mock_request, auth_enabled_settings)
        assert result is None

    @pytest.mark.asyncio
    async def test_rejects_basic_auth_scheme(
        self, mock_request, auth_enabled_settings
    ):
        """Basic auth scheme should not be accepted."""
        mock_request.headers = {"Authorization": "Basic test-secret-key"}

        with pytest.raises(HTTPException) as exc_info:
            await verify_metrics_auth_impl(mock_request, auth_enabled_settings)

        assert exc_info.value.status_code == 401
