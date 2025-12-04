"""
BYOAI Client

HTTP client for fetching AI provider configurations from the NestJS API.
Handles authentication via JWT tokens and caches configurations.
"""

import httpx
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


@dataclass
class ProviderConfig:
    """AI Provider configuration from the API."""
    id: str
    provider: str  # 'openai', 'claude', 'gemini', 'deepseek', 'openrouter'
    default_model: str
    is_valid: bool
    is_default: bool
    api_key: Optional[str] = None  # Decrypted API key (only available via secure endpoint)

    # Token limits
    max_tokens_per_day: int = 0
    tokens_used_today: int = 0

    # Health status
    last_validated_at: Optional[datetime] = None
    validation_error: Optional[str] = None


@dataclass
class CachedConfig:
    """Cached provider configuration with expiry."""
    config: ProviderConfig
    expires_at: datetime


class BYOAIClient:
    """
    Client for fetching BYOAI provider configurations from the NestJS API.

    Usage:
        client = BYOAIClient(api_base_url="http://localhost:3001")
        config = await client.get_workspace_providers(
            workspace_id="ws_123",
            jwt_token="eyJ..."
        )
    """

    # Cache TTL in seconds
    CACHE_TTL = 300  # 5 minutes

    def __init__(
        self,
        api_base_url: str,
        timeout: float = 10.0,
        cache_enabled: bool = True,
    ):
        """
        Initialize BYOAI client.

        Args:
            api_base_url: Base URL of the NestJS API (e.g., http://localhost:3001)
            timeout: HTTP request timeout in seconds
            cache_enabled: Whether to cache provider configurations
        """
        self.api_base_url = api_base_url.rstrip('/')
        self.timeout = timeout
        self.cache_enabled = cache_enabled
        self._cache: Dict[str, CachedConfig] = {}

        logger.info(f"BYOAIClient initialized with API: {self.api_base_url}")

    def _get_cache_key(self, workspace_id: str, provider_id: Optional[str] = None) -> str:
        """Generate cache key for provider config."""
        if provider_id:
            return f"{workspace_id}:{provider_id}"
        return f"{workspace_id}:all"

    def _get_cached(self, cache_key: str) -> Optional[Any]:
        """Get cached configuration if not expired."""
        if not self.cache_enabled:
            return None

        cached = self._cache.get(cache_key)
        if cached and cached.expires_at > datetime.now():
            return cached.config
        return None

    def _set_cached(self, cache_key: str, config: Any) -> None:
        """Cache configuration with TTL."""
        if not self.cache_enabled:
            return

        self._cache[cache_key] = CachedConfig(
            config=config,
            expires_at=datetime.now() + timedelta(seconds=self.CACHE_TTL),
        )

    def clear_cache(self, workspace_id: Optional[str] = None) -> None:
        """Clear cache for a workspace or all caches."""
        if workspace_id:
            keys_to_remove = [k for k in self._cache if k.startswith(workspace_id)]
            for key in keys_to_remove:
                del self._cache[key]
        else:
            self._cache.clear()

    async def get_workspace_providers(
        self,
        workspace_id: str,
        jwt_token: str,
    ) -> List[ProviderConfig]:
        """
        Fetch all AI provider configurations for a workspace.

        Args:
            workspace_id: Workspace ID
            jwt_token: JWT authentication token

        Returns:
            List of ProviderConfig objects
        """
        cache_key = self._get_cache_key(workspace_id)
        cached = self._get_cached(cache_key)
        if cached:
            logger.debug(f"Cache hit for workspace providers: {workspace_id}")
            return cached

        url = f"{self.api_base_url}/api/workspaces/{workspace_id}/ai-providers"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {jwt_token}",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()

                data = response.json()
                providers = data.get("data", [])

                configs = [self._parse_provider(p) for p in providers]
                self._set_cached(cache_key, configs)

                logger.info(f"Fetched {len(configs)} providers for workspace {workspace_id}")
                return configs

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching providers: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"Error fetching providers: {str(e)}")
            raise

    async def get_provider(
        self,
        workspace_id: str,
        provider_id: str,
        jwt_token: str,
    ) -> Optional[ProviderConfig]:
        """
        Fetch a specific AI provider configuration.

        Args:
            workspace_id: Workspace ID
            provider_id: Provider ID
            jwt_token: JWT authentication token

        Returns:
            ProviderConfig if found, None otherwise
        """
        cache_key = self._get_cache_key(workspace_id, provider_id)
        cached = self._get_cached(cache_key)
        if cached:
            logger.debug(f"Cache hit for provider: {provider_id}")
            return cached

        url = f"{self.api_base_url}/api/workspaces/{workspace_id}/ai-providers/{provider_id}"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {jwt_token}",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()

                data = response.json()
                provider = data.get("data")

                if provider:
                    config = self._parse_provider(provider)
                    self._set_cached(cache_key, config)
                    return config

                return None

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            logger.error(f"HTTP error fetching provider: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"Error fetching provider: {str(e)}")
            raise

    async def get_default_provider(
        self,
        workspace_id: str,
        jwt_token: str,
    ) -> Optional[ProviderConfig]:
        """
        Fetch the default AI provider for a workspace.

        Args:
            workspace_id: Workspace ID
            jwt_token: JWT authentication token

        Returns:
            Default ProviderConfig if found, None otherwise
        """
        providers = await self.get_workspace_providers(workspace_id, jwt_token)

        # Find default provider
        for provider in providers:
            if provider.is_default:
                return provider

        # If no default, return first valid provider
        for provider in providers:
            if provider.is_valid:
                return provider

        return None

    async def get_provider_by_type(
        self,
        workspace_id: str,
        provider_type: str,  # 'openai', 'claude', etc.
        jwt_token: str,
    ) -> Optional[ProviderConfig]:
        """
        Fetch provider configuration by provider type.

        Args:
            workspace_id: Workspace ID
            provider_type: Provider type (openai, claude, gemini, etc.)
            jwt_token: JWT authentication token

        Returns:
            ProviderConfig if found, None otherwise
        """
        providers = await self.get_workspace_providers(workspace_id, jwt_token)

        for provider in providers:
            if provider.provider == provider_type:
                return provider

        return None

    async def check_token_limit(
        self,
        workspace_id: str,
        provider_id: str,
        jwt_token: str,
    ) -> Dict[str, Any]:
        """
        Check token limit status for a provider.

        Args:
            workspace_id: Workspace ID
            provider_id: Provider ID
            jwt_token: JWT authentication token

        Returns:
            Token limit status dict
        """
        url = f"{self.api_base_url}/api/workspaces/{workspace_id}/ai-providers/{provider_id}/limit"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {jwt_token}",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()

                data = response.json()
                return data.get("data", {})

        except Exception as e:
            logger.error(f"Error checking token limit: {str(e)}")
            raise

    async def record_token_usage(
        self,
        workspace_id: str,
        provider_id: str,
        jwt_token: str,
        input_tokens: int,
        output_tokens: int,
        model: str,
        agent_name: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> bool:
        """
        Record token usage for a request.

        Args:
            workspace_id: Workspace ID
            provider_id: Provider ID
            jwt_token: JWT authentication token
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model used
            agent_name: Optional agent name
            request_id: Optional request ID for tracking

        Returns:
            True if recorded successfully
        """
        url = f"{self.api_base_url}/api/workspaces/{workspace_id}/ai-providers/usage"

        payload = {
            "providerId": provider_id,
            "inputTokens": input_tokens,
            "outputTokens": output_tokens,
            "model": model,
            "agentName": agent_name,
            "requestId": request_id,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {jwt_token}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()

                logger.debug(f"Recorded token usage: {input_tokens + output_tokens} tokens")
                return True

        except Exception as e:
            logger.error(f"Error recording token usage: {str(e)}")
            return False

    def _parse_provider(self, data: Dict[str, Any]) -> ProviderConfig:
        """Parse provider data from API response."""
        last_validated = data.get("lastValidatedAt")
        if last_validated and isinstance(last_validated, str):
            try:
                last_validated = datetime.fromisoformat(last_validated.replace("Z", "+00:00"))
            except ValueError:
                last_validated = None

        return ProviderConfig(
            id=data.get("id", ""),
            provider=data.get("provider", ""),
            default_model=data.get("defaultModel", ""),
            is_valid=data.get("isValid", False),
            is_default=data.get("isDefault", False),
            api_key=data.get("apiKey"),  # Only present in secure endpoints
            max_tokens_per_day=data.get("maxTokensPerDay", 0),
            tokens_used_today=data.get("tokensUsedToday", 0),
            last_validated_at=last_validated,
            validation_error=data.get("validationError"),
        )
