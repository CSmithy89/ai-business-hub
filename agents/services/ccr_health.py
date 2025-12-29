"""
CCR Health Check Service

Monitors Claude Code Router (CCR) availability and provider status.
Implements singleton pattern for shared health state across the application.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

import httpx

from agents.constants.dm_constants import DMConstants

logger = logging.getLogger(__name__)


class HealthStatus(str, Enum):
    """Health status values for CCR and providers."""

    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    DEGRADED = "degraded"
    UNKNOWN = "unknown"


class ProviderStatus(str, Enum):
    """Provider availability status."""

    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    RATE_LIMITED = "rate_limited"
    UNKNOWN = "unknown"


@dataclass
class CCRHealthState:
    """Current health state of CCR service."""

    status: HealthStatus = HealthStatus.UNKNOWN
    providers: dict[str, ProviderStatus] = field(default_factory=dict)
    uptime_seconds: int = 0
    last_check: Optional[datetime] = None
    last_error: Optional[str] = None
    consecutive_failures: int = 0


class CCRHealthChecker:
    """
    Monitors CCR service health with periodic checks.

    Features:
    - Async health checking with configurable interval
    - Graceful error handling for unreachable service
    - Provider-level status tracking
    - Singleton instance for shared state

    Uses DMConstants for all configuration values.
    """

    _instance: Optional["CCRHealthChecker"] = None
    _lock: asyncio.Lock = asyncio.Lock()

    def __init__(
        self,
        ccr_url: str,
        check_interval: int = DMConstants.CCR.HEALTH_CHECK_INTERVAL_SECONDS,
        enabled: bool = True,
    ):
        """
        Initialize CCR health checker.

        Args:
            ccr_url: Base URL for CCR service (e.g., http://localhost:3456)
            check_interval: Seconds between health checks (default from DMConstants)
            enabled: Whether health checking is enabled
        """
        self.ccr_url = ccr_url.rstrip("/")
        self.check_interval = check_interval
        self.enabled = enabled
        self._state = CCRHealthState()
        self._running = False
        self._task: Optional[asyncio.Task[None]] = None
        self._client: Optional[httpx.AsyncClient] = None

    @classmethod
    async def get_instance(
        cls,
        ccr_url: Optional[str] = None,
        check_interval: Optional[int] = None,
        enabled: bool = True,
    ) -> "CCRHealthChecker":
        """
        Get singleton instance of CCR health checker.

        Args:
            ccr_url: CCR service URL (required on first call)
            check_interval: Health check interval in seconds
            enabled: Whether health checking is enabled

        Returns:
            Singleton CCRHealthChecker instance

        Raises:
            ValueError: If ccr_url not provided on first instantiation
        """
        async with cls._lock:
            if cls._instance is None:
                if ccr_url is None:
                    raise ValueError("ccr_url required for first instantiation")
                interval = check_interval or DMConstants.CCR.HEALTH_CHECK_INTERVAL_SECONDS
                cls._instance = cls(ccr_url=ccr_url, check_interval=interval, enabled=enabled)
            return cls._instance

    @classmethod
    async def reset_instance(cls) -> None:
        """Reset singleton instance (primarily for testing)."""
        async with cls._lock:
            if cls._instance is not None:
                await cls._instance.stop()
                cls._instance = None

    @property
    def state(self) -> CCRHealthState:
        """Get current health state."""
        return self._state

    @property
    def is_healthy(self) -> bool:
        """Check if CCR is currently healthy."""
        return self._state.status == HealthStatus.HEALTHY

    @property
    def is_running(self) -> bool:
        """Check if health checker is running."""
        return self._running

    async def start(self) -> None:
        """Start periodic health checking."""
        if not self.enabled:
            logger.info("CCR health checking is disabled")
            return

        if self._running:
            logger.warning("CCR health checker already running")
            return

        self._client = httpx.AsyncClient(timeout=DMConstants.CCR.PROVIDER_TIMEOUT_SECONDS)
        self._running = True
        self._task = asyncio.create_task(self._run_health_loop())
        logger.info(
            "CCR health checker started",
            extra={
                "ccr_url": self.ccr_url,
                "check_interval": self.check_interval,
            },
        )

    async def stop(self) -> None:
        """Stop periodic health checking."""
        self._running = False
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

        if self._client is not None:
            await self._client.aclose()
            self._client = None

        logger.info("CCR health checker stopped")

    async def check_health(self) -> CCRHealthState:
        """
        Perform a single health check against CCR.

        Returns:
            Updated CCRHealthState

        Handles connection errors gracefully without raising exceptions.
        """
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=DMConstants.CCR.PROVIDER_TIMEOUT_SECONDS)

        try:
            response = await self._client.get(f"{self.ccr_url}/health")
            response.raise_for_status()

            data = response.json()
            self._update_state_from_response(data)
            self._state.consecutive_failures = 0
            self._state.last_error = None

        except httpx.ConnectError as e:
            self._handle_check_failure(f"Connection failed: {e}")
        except httpx.TimeoutException as e:
            self._handle_check_failure(f"Request timeout: {e}")
        except httpx.HTTPStatusError as e:
            self._handle_check_failure(f"HTTP error {e.response.status_code}: {e}")
        except Exception as e:
            self._handle_check_failure(f"Unexpected error: {e}")

        self._state.last_check = datetime.now(timezone.utc)
        return self._state

    def _update_state_from_response(self, data: dict[str, Any]) -> None:
        """Update internal state from health check response."""
        status_str = data.get("status", "unknown")
        try:
            self._state.status = HealthStatus(status_str)
        except ValueError:
            self._state.status = HealthStatus.UNKNOWN

        providers_data = data.get("providers", {})
        self._state.providers = {}
        for provider, status in providers_data.items():
            try:
                self._state.providers[provider] = ProviderStatus(status)
            except ValueError:
                self._state.providers[provider] = ProviderStatus.UNKNOWN

        self._state.uptime_seconds = data.get("uptime_seconds", 0)

    def _handle_check_failure(self, error_msg: str) -> None:
        """Handle a failed health check."""
        self._state.consecutive_failures += 1
        self._state.last_error = error_msg

        if self._state.consecutive_failures >= DMConstants.CCR.MAX_RETRIES:
            self._state.status = HealthStatus.UNHEALTHY
        else:
            self._state.status = HealthStatus.DEGRADED

        self._state.providers = {}
        logger.warning(
            "CCR health check failed",
            extra={
                "error": error_msg,
                "consecutive_failures": self._state.consecutive_failures,
                "status": self._state.status.value,
            },
        )

    async def _run_health_loop(self) -> None:
        """Background loop for periodic health checks."""
        while self._running:
            try:
                await self.check_health()
                await asyncio.sleep(self.check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.exception("Error in health check loop: %s", e)
                await asyncio.sleep(self.check_interval)

    def get_provider_status(self, provider: str) -> ProviderStatus:
        """Get status for a specific provider."""
        return self._state.providers.get(provider, ProviderStatus.UNKNOWN)

    def to_dict(self) -> dict[str, Any]:
        """Serialize health state to dictionary."""
        return {
            "status": self._state.status.value,
            "providers": {k: v.value for k, v in self._state.providers.items()},
            "uptime_seconds": self._state.uptime_seconds,
            "last_check": self._state.last_check.isoformat() if self._state.last_check else None,
            "last_error": self._state.last_error,
            "consecutive_failures": self._state.consecutive_failures,
            "is_running": self._running,
        }


# Convenience function for singleton access
async def get_ccr_health_checker() -> Optional[CCRHealthChecker]:
    """
    Get the singleton CCR health checker instance.

    Returns None if not initialized yet.
    """
    return CCRHealthChecker._instance
