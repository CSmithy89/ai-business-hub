"""
Tests for BYOAI Client

Unit tests for the BYOAIClient HTTP client.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
import respx
import httpx
import pytest

from providers.byoai_client import BYOAIClient, ProviderConfig, CachedConfig


class TestBYOAIClient:
    """Tests for BYOAIClient class."""

    def test_init(self):
        """Test client initialization."""
        client = BYOAIClient(api_base_url="http://localhost:3001")

        assert client.api_base_url == "http://localhost:3001"
        assert client.timeout == 10.0
        assert client.cache_enabled is True

    def test_init_strips_trailing_slash(self):
        """Test that trailing slash is stripped from API URL."""
        client = BYOAIClient(api_base_url="http://localhost:3001/")

        assert client.api_base_url == "http://localhost:3001"

    def test_cache_key_generation(self):
        """Test cache key generation."""
        client = BYOAIClient(api_base_url="http://localhost:3001")

        assert client._get_cache_key("ws_123") == "ws_123:all"
        assert client._get_cache_key("ws_123", "prov_456") == "ws_123:prov_456"

    def test_cache_disabled(self):
        """Test caching when disabled."""
        client = BYOAIClient(
            api_base_url="http://localhost:3001",
            cache_enabled=False,
        )

        # Should return None even after setting
        client._set_cached("test_key", {"data": "test"})
        assert client._get_cached("test_key") is None

    def test_cache_expiry(self):
        """Test cache expiry."""
        client = BYOAIClient(api_base_url="http://localhost:3001")

        # Set with expired cache
        client._cache["test_key"] = CachedConfig(
            config={"data": "test"},
            expires_at=datetime.now() - timedelta(seconds=1),
        )

        assert client._get_cached("test_key") is None

    def test_cache_valid(self):
        """Test valid cache retrieval."""
        client = BYOAIClient(api_base_url="http://localhost:3001")

        config = {"data": "test"}
        client._cache["test_key"] = CachedConfig(
            config=config,
            expires_at=datetime.now() + timedelta(seconds=300),
        )

        assert client._get_cached("test_key") == config

    def test_clear_cache_all(self):
        """Test clearing all cache."""
        client = BYOAIClient(api_base_url="http://localhost:3001")

        client._cache["ws_1:all"] = CachedConfig(
            config={}, expires_at=datetime.now() + timedelta(seconds=300)
        )
        client._cache["ws_2:all"] = CachedConfig(
            config={}, expires_at=datetime.now() + timedelta(seconds=300)
        )

        client.clear_cache()

        assert len(client._cache) == 0

    def test_clear_cache_workspace(self):
        """Test clearing cache for specific workspace."""
        client = BYOAIClient(api_base_url="http://localhost:3001")

        client._cache["ws_1:all"] = CachedConfig(
            config={}, expires_at=datetime.now() + timedelta(seconds=300)
        )
        client._cache["ws_1:prov_1"] = CachedConfig(
            config={}, expires_at=datetime.now() + timedelta(seconds=300)
        )
        client._cache["ws_2:all"] = CachedConfig(
            config={}, expires_at=datetime.now() + timedelta(seconds=300)
        )

        client.clear_cache("ws_1")

        assert "ws_1:all" not in client._cache
        assert "ws_1:prov_1" not in client._cache
        assert "ws_2:all" in client._cache

    @pytest.mark.asyncio
    @respx.mock
    async def test_get_workspace_providers_success(self):
        """Should return providers and cache them."""
        client = BYOAIClient(api_base_url="http://localhost:3001")
        ws_id = "ws_123"
        respx.get(f"http://localhost:3001/api/workspaces/{ws_id}/ai-providers").mock(
            return_value=respx.Response(
                200,
                json={
                    "data": [
                        {
                            "id": "prov_1",
                            "provider": "openai",
                            "defaultModel": "gpt-4o",
                            "isValid": True,
                            "isDefault": True,
                            "maxTokensPerDay": 100000,
                            "tokensUsedToday": 500,
                            "lastValidatedAt": "2024-01-15T10:30:00Z",
                        }
                    ]
                },
            )
        )

        providers = await client.get_workspace_providers(ws_id, jwt_token="token")
        assert len(providers) == 1
        assert isinstance(providers[0], ProviderConfig)
        # Second call hits cache, no new HTTP requests
        providers_cached = await client.get_workspace_providers(ws_id, jwt_token="token")
        assert len(providers_cached) == 1

    @pytest.mark.asyncio
    @respx.mock
    async def test_get_workspace_providers_http_error(self):
        client = BYOAIClient(api_base_url="http://localhost:3001")
        ws_id = "ws_err"
        respx.get(f"http://localhost:3001/api/workspaces/{ws_id}/ai-providers").mock(
            return_value=respx.Response(401)
        )
        with pytest.raises(httpx.HTTPStatusError):
            await client.get_workspace_providers(ws_id, jwt_token="token")

    @pytest.mark.asyncio
    @respx.mock
    async def test_get_provider_not_found(self):
        client = BYOAIClient(api_base_url="http://localhost:3001")
        ws_id = "ws_123"
        provider_id = "missing"
        respx.get(
            f"http://localhost:3001/api/workspaces/{ws_id}/ai-providers/{provider_id}"
        ).mock(return_value=respx.Response(404))

        provider = await client.get_provider(ws_id, provider_id, jwt_token="token")
        assert provider is None

    @pytest.mark.asyncio
    @respx.mock
    async def test_get_provider_json_error(self):
        """Invalid JSON should propagate as exception."""
        client = BYOAIClient(api_base_url="http://localhost:3001")
        ws_id = "ws_123"
        provider_id = "prov_bad"
        respx.get(
            f"http://localhost:3001/api/workspaces/{ws_id}/ai-providers/{provider_id}"
        ).mock(return_value=respx.Response(200, content=b"{ invalid json"))

        with pytest.raises(Exception):
            await client.get_provider(ws_id, provider_id, jwt_token="token")

    @pytest.mark.asyncio
    @respx.mock
    async def test_check_token_limit_timeout(self):
        client = BYOAIClient(api_base_url="http://localhost:3001", timeout=0.1)
        ws_id = "ws_123"
        provider_id = "prov_1"
        respx.get(
            f"http://localhost:3001/api/workspaces/{ws_id}/ai-providers/{provider_id}/limit"
        ).mock(side_effect=httpx.ReadTimeout("timeout"))

        with pytest.raises(httpx.ReadTimeout):
            await client.check_token_limit(ws_id, provider_id, jwt_token="token")

    def test_parse_provider(self):
        """Test provider data parsing."""
        client = BYOAIClient(api_base_url="http://localhost:3001")

        data = {
            "id": "prov_123",
            "provider": "openai",
            "defaultModel": "gpt-4o",
            "isValid": True,
            "isDefault": True,
            "maxTokensPerDay": 100000,
            "tokensUsedToday": 5000,
            "lastValidatedAt": "2024-01-15T10:30:00Z",
            "validationError": None,
        }

        config = client._parse_provider(data)

        assert isinstance(config, ProviderConfig)
        assert config.id == "prov_123"
        assert config.provider == "openai"
        assert config.default_model == "gpt-4o"
        assert config.is_valid is True
        assert config.is_default is True
        assert config.max_tokens_per_day == 100000
        assert config.tokens_used_today == 5000
        assert config.last_validated_at is not None

    def test_parse_provider_minimal(self):
        """Test parsing provider with minimal data."""
        client = BYOAIClient(api_base_url="http://localhost:3001")

        data = {
            "id": "prov_123",
            "provider": "openai",
        }

        config = client._parse_provider(data)

        assert config.id == "prov_123"
        assert config.provider == "openai"
        assert config.default_model == ""
        assert config.is_valid is False
        assert config.is_default is False


@pytest.mark.asyncio
class TestBYOAIClientAsync:
    """Async tests for BYOAIClient."""

    async def test_get_workspace_providers(self):
        """Test fetching workspace providers."""
        client = BYOAIClient(api_base_url="http://localhost:3001")

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": [
                {
                    "id": "prov_1",
                    "provider": "openai",
                    "defaultModel": "gpt-4o",
                    "isValid": True,
                    "isDefault": True,
                },
                {
                    "id": "prov_2",
                    "provider": "claude",
                    "defaultModel": "claude-3-opus",
                    "isValid": True,
                    "isDefault": False,
                },
            ]
        }
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = AsyncMock()
            mock_instance.get.return_value = mock_response
            mock_instance.__aenter__.return_value = mock_instance
            mock_instance.__aexit__.return_value = None
            mock_client.return_value = mock_instance

            providers = await client.get_workspace_providers(
                workspace_id="ws_123",
                jwt_token="test_token",
            )

        assert len(providers) == 2
        assert providers[0].provider == "openai"
        assert providers[1].provider == "claude"

    async def test_get_default_provider(self):
        """Test getting default provider."""
        client = BYOAIClient(api_base_url="http://localhost:3001")

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": [
                {
                    "id": "prov_1",
                    "provider": "openai",
                    "defaultModel": "gpt-4o",
                    "isValid": True,
                    "isDefault": False,
                },
                {
                    "id": "prov_2",
                    "provider": "claude",
                    "defaultModel": "claude-3-opus",
                    "isValid": True,
                    "isDefault": True,
                },
            ]
        }
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = AsyncMock()
            mock_instance.get.return_value = mock_response
            mock_instance.__aenter__.return_value = mock_instance
            mock_instance.__aexit__.return_value = None
            mock_client.return_value = mock_instance

            provider = await client.get_default_provider(
                workspace_id="ws_123",
                jwt_token="test_token",
            )

        assert provider is not None
        assert provider.provider == "claude"
        assert provider.is_default is True

    async def test_get_provider_by_type(self):
        """Test getting provider by type."""
        client = BYOAIClient(api_base_url="http://localhost:3001")

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": [
                {
                    "id": "prov_1",
                    "provider": "openai",
                    "defaultModel": "gpt-4o",
                    "isValid": True,
                },
                {
                    "id": "prov_2",
                    "provider": "claude",
                    "defaultModel": "claude-3-opus",
                    "isValid": True,
                },
            ]
        }
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client:
            mock_instance = AsyncMock()
            mock_instance.get.return_value = mock_response
            mock_instance.__aenter__.return_value = mock_instance
            mock_instance.__aexit__.return_value = None
            mock_client.return_value = mock_instance

            provider = await client.get_provider_by_type(
                workspace_id="ws_123",
                provider_type="claude",
                jwt_token="test_token",
            )

        assert provider is not None
        assert provider.provider == "claude"
