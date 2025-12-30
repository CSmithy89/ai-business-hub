"""
Tests for Discovery Service

@see docs/modules/bm-dm/stories/dm-06-5-universal-agent-mesh.md
Epic: DM-06 | Story: DM-06.5
"""
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from mesh.discovery import (
    AgentNotFoundError,
    DiscoveryError,
    DiscoveryService,
    InvalidAgentCardError,
    configure_discovery_service,
    get_discovery_service,
    shutdown_discovery_service,
)
from mesh.models import AgentHealth
from mesh.registry import get_registry, reset_registry


@pytest.fixture
def discovery_service():
    """Create a discovery service for testing."""
    return DiscoveryService(
        discovery_urls=["http://external-agent:8000"],
        scan_interval=60,
        auto_register=False,
    )


@pytest.fixture
def mock_agent_response():
    """Sample agent card response."""
    return {
        "name": "ExternalAgent",
        "description": "An external agent",
        "url": "http://external-agent:8000",
        "version": "1.0.0",
        "skills": [
            {
                "id": "analyze",
                "name": "Analyze",
                "description": "Data analysis",
                "inputModes": ["text", "json"],
                "outputModes": ["text"],
            }
        ],
        "capabilities": {"streaming": True},
        "defaultInputModes": ["text"],
        "defaultOutputModes": ["text"],
        "module": "external",
    }


@pytest.fixture(autouse=True)
def reset_global_state():
    """Reset global state before each test."""
    reset_registry()
    yield
    reset_registry()


class TestDiscoveryService:
    """Tests for DiscoveryService class."""

    def test_init_defaults(self):
        """Should initialize with default values."""
        service = DiscoveryService()

        assert service.discovery_urls == []
        assert service.scan_interval == 300
        assert service.auto_register is True
        assert not service.is_running

    def test_init_with_config(self, discovery_service):
        """Should initialize with provided config."""
        assert discovery_service.discovery_urls == ["http://external-agent:8000"]
        assert discovery_service.scan_interval == 60
        assert discovery_service.auto_register is False

    @pytest.mark.asyncio
    async def test_start_initializes_client(self, discovery_service):
        """Should initialize HTTP client on start."""
        # Don't actually scan
        with patch.object(discovery_service, "scan", new_callable=AsyncMock):
            await discovery_service.start()

            assert discovery_service._client is not None
            assert discovery_service.is_running is True

            await discovery_service.stop()

    @pytest.mark.asyncio
    async def test_start_performs_initial_scan(self, discovery_service):
        """Should perform initial scan on start."""
        scan_mock = AsyncMock(return_value=[])

        with patch.object(discovery_service, "scan", scan_mock):
            await discovery_service.start()

            scan_mock.assert_called_once()

            await discovery_service.stop()

    @pytest.mark.asyncio
    async def test_stop_cleans_up(self, discovery_service):
        """Should clean up on stop."""
        with patch.object(discovery_service, "scan", new_callable=AsyncMock):
            await discovery_service.start()
            await discovery_service.stop()

            assert discovery_service.is_running is False
            assert discovery_service._client is None

    @pytest.mark.asyncio
    async def test_stop_cancels_periodic_scan(self, discovery_service):
        """Should cancel periodic scan task on stop."""
        with patch.object(discovery_service, "scan", new_callable=AsyncMock):
            await discovery_service.start()

            # Verify scan task exists
            assert discovery_service._scan_task is not None

            await discovery_service.stop()

            assert discovery_service._scan_task is None

    @pytest.mark.asyncio
    async def test_discover_agent_parses_response(
        self, discovery_service, mock_agent_response
    ):
        """Should parse agent card from response."""
        mock_response = MagicMock()
        mock_response.json.return_value = mock_agent_response
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        discovery_service._client = mock_client

        agent = await discovery_service.discover_agent("http://external-agent:8000")

        assert agent is not None
        assert agent.name == "ExternalAgent"
        assert agent.description == "An external agent"
        assert agent.is_external is True
        assert len(agent.skills) == 1
        assert agent.skills[0].id == "analyze"

    @pytest.mark.asyncio
    async def test_discover_agent_registers_when_enabled(self, mock_agent_response):
        """Should register agent when auto_register is True."""
        service = DiscoveryService(auto_register=True)

        mock_response = MagicMock()
        mock_response.json.return_value = mock_agent_response
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        service._client = mock_client

        await service.discover_agent("http://external-agent:8000")

        registry = get_registry()
        assert registry.contains("ExternalAgent")

    @pytest.mark.asyncio
    async def test_discover_agent_not_found(self, discovery_service):
        """Should raise AgentNotFoundError for 404."""
        mock_response = MagicMock()
        mock_response.status_code = 404

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        discovery_service._client = mock_client

        with pytest.raises(AgentNotFoundError):
            await discovery_service.discover_agent("http://external-agent:8000")

    @pytest.mark.asyncio
    async def test_discover_agent_connection_error(self, discovery_service):
        """Should raise DiscoveryError on connection failure."""
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.ConnectError("Connection refused")
        discovery_service._client = mock_client

        with pytest.raises(DiscoveryError) as exc_info:
            await discovery_service.discover_agent("http://external-agent:8000")

        assert "Connection failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_discover_agent_timeout(self, discovery_service):
        """Should raise DiscoveryError on timeout."""
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.TimeoutException("Timeout")
        discovery_service._client = mock_client

        with pytest.raises(DiscoveryError) as exc_info:
            await discovery_service.discover_agent("http://external-agent:8000")

        assert "Timeout" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_discover_agent_invalid_card(self, discovery_service):
        """Should raise InvalidAgentCardError for invalid response."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"invalid": "data"}  # Missing name
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        discovery_service._client = mock_client

        with pytest.raises(InvalidAgentCardError):
            await discovery_service.discover_agent("http://external-agent:8000")

    @pytest.mark.asyncio
    async def test_scan_discovers_all_urls(
        self, discovery_service, mock_agent_response
    ):
        """Should scan all discovery URLs."""
        discovery_service.discovery_urls = [
            "http://agent1:8000",
            "http://agent2:8000",
        ]

        # Create different responses for each URL
        responses = [
            MagicMock(
                json=MagicMock(
                    return_value={**mock_agent_response, "name": f"Agent{i}"}
                ),
                status_code=200,
                raise_for_status=MagicMock(),
            )
            for i in range(2)
        ]

        mock_client = AsyncMock()
        mock_client.get.side_effect = responses
        discovery_service._client = mock_client

        agents = await discovery_service.scan()

        assert len(agents) == 2
        assert mock_client.get.call_count == 2

    @pytest.mark.asyncio
    async def test_scan_handles_failures(
        self, discovery_service, mock_agent_response
    ):
        """Should continue scanning even if some URLs fail."""
        discovery_service.discovery_urls = [
            "http://agent1:8000",
            "http://agent2:8000",
        ]

        success_response = MagicMock()
        success_response.json.return_value = mock_agent_response
        success_response.status_code = 200
        success_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get.side_effect = [
            httpx.ConnectError("Failed"),
            success_response,
        ]
        discovery_service._client = mock_client

        agents = await discovery_service.scan()

        # Should have one successful discovery
        assert len(agents) == 1

    @pytest.mark.asyncio
    async def test_scan_requires_started_service(self, discovery_service):
        """Should raise error if service not started."""
        with pytest.raises(RuntimeError) as exc_info:
            await discovery_service.scan()

        assert "not started" in str(exc_info.value)

    def test_add_discovery_url(self, discovery_service):
        """Should add URL to discovery list."""
        discovery_service.add_discovery_url("http://new-agent:8000")

        assert "http://new-agent:8000" in discovery_service.discovery_urls

    def test_add_discovery_url_no_duplicates(self, discovery_service):
        """Should not add duplicate URLs."""
        discovery_service.add_discovery_url("http://external-agent:8000")

        # Count occurrences
        count = discovery_service.discovery_urls.count("http://external-agent:8000")
        assert count == 1

    def test_remove_discovery_url(self, discovery_service):
        """Should remove URL from discovery list."""
        result = discovery_service.remove_discovery_url("http://external-agent:8000")

        assert result is True
        assert "http://external-agent:8000" not in discovery_service.discovery_urls

    def test_remove_discovery_url_not_found(self, discovery_service):
        """Should return False when URL not in list."""
        result = discovery_service.remove_discovery_url("http://nonexistent:8000")

        assert result is False

    def test_get_discovery_urls(self, discovery_service):
        """Should return copy of URL list."""
        urls = discovery_service.get_discovery_urls()

        assert urls == ["http://external-agent:8000"]
        # Verify it's a copy
        urls.append("http://test:8000")
        assert "http://test:8000" not in discovery_service.discovery_urls

    @pytest.mark.asyncio
    async def test_check_agent_health_healthy(
        self, discovery_service, mock_agent_response
    ):
        """Should return HEALTHY for successful check."""
        # Register an agent first
        registry = get_registry()
        from mesh.models import MeshAgentCard

        agent = MeshAgentCard(
            name="TestAgent",
            description="Test",
            url="http://test:8000",
        )
        registry.register(agent)

        mock_response = MagicMock()
        mock_response.status_code = 200

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        discovery_service._client = mock_client

        health = await discovery_service.check_agent_health("TestAgent")

        assert health == AgentHealth.HEALTHY
        assert registry.is_healthy("TestAgent")

    @pytest.mark.asyncio
    async def test_check_agent_health_unhealthy(self, discovery_service):
        """Should return UNHEALTHY on connection failure."""
        registry = get_registry()
        from mesh.models import MeshAgentCard

        agent = MeshAgentCard(
            name="TestAgent",
            description="Test",
            url="http://test:8000",
        )
        registry.register(agent)

        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.ConnectError("Failed")
        discovery_service._client = mock_client

        health = await discovery_service.check_agent_health("TestAgent")

        assert health == AgentHealth.UNHEALTHY
        assert not registry.is_healthy("TestAgent")

    @pytest.mark.asyncio
    async def test_check_agent_health_unknown_agent(self, discovery_service):
        """Should return UNKNOWN for unregistered agent."""
        discovery_service._client = AsyncMock()

        health = await discovery_service.check_agent_health("NonExistent")

        assert health == AgentHealth.UNKNOWN

    @pytest.mark.asyncio
    async def test_health_check_all(self, discovery_service):
        """Should check health of all external agents."""
        registry = get_registry()
        from mesh.models import MeshAgentCard

        # Register external agents
        for i in range(2):
            agent = MeshAgentCard(
                name=f"External{i}",
                description="External",
                url=f"http://external{i}:8000",
                is_external=True,
            )
            registry.register(agent)

        # Also register an internal agent
        internal = MeshAgentCard(
            name="Internal",
            description="Internal",
            url="http://internal:8000",
            is_external=False,
        )
        registry.register(internal)

        mock_response = MagicMock()
        mock_response.status_code = 200

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        discovery_service._client = mock_client

        results = await discovery_service.health_check_all()

        # Should only check external agents
        assert len(results) == 2
        assert "External0" in results
        assert "External1" in results
        assert "Internal" not in results


class TestParseAgentCard:
    """Tests for agent card parsing."""

    def test_parse_minimal_card(self):
        """Should parse minimal agent card."""
        service = DiscoveryService()

        data = {
            "name": "MinimalAgent",
            "description": "Minimal",
            "url": "http://minimal:8000",
        }

        agent = service._parse_agent_card(data, "http://minimal:8000")

        assert agent.name == "MinimalAgent"
        assert agent.description == "Minimal"
        assert agent.is_external is True
        assert agent.skills == []

    def test_parse_card_uses_base_url_fallback(self):
        """Should use base_url when url not in response."""
        service = DiscoveryService()

        data = {
            "name": "NoUrlAgent",
        }

        agent = service._parse_agent_card(data, "http://fallback:8000")

        assert agent.url == "http://fallback:8000"

    def test_parse_card_with_skills(self):
        """Should parse skills correctly."""
        service = DiscoveryService()

        data = {
            "name": "SkillfulAgent",
            "skills": [
                {
                    "id": "search",
                    "name": "Search",
                    "description": "Search capability",
                    "inputModes": ["text"],
                    "outputModes": ["text", "json"],
                    "tags": ["search", "query"],
                }
            ],
        }

        agent = service._parse_agent_card(data, "http://test:8000")

        assert len(agent.skills) == 1
        assert agent.skills[0].id == "search"
        assert agent.skills[0].input_modes == ["text"]
        assert agent.skills[0].output_modes == ["text", "json"]

    def test_parse_card_missing_name(self):
        """Should raise error for missing name."""
        service = DiscoveryService()

        with pytest.raises(InvalidAgentCardError) as exc_info:
            service._parse_agent_card({}, "http://test:8000")

        assert "missing 'name'" in str(exc_info.value)


class TestGlobalDiscoveryService:
    """Tests for global discovery service singleton."""

    @pytest.mark.asyncio
    async def test_get_discovery_service_singleton(self):
        """Should return same instance."""
        await shutdown_discovery_service()

        service1 = get_discovery_service()
        service2 = get_discovery_service()

        assert service1 is service2

        await shutdown_discovery_service()

    @pytest.mark.asyncio
    async def test_configure_discovery_service(self):
        """Should configure and return service."""
        await shutdown_discovery_service()

        service = await configure_discovery_service(
            discovery_urls=["http://test:8000"],
            scan_interval=120,
        )

        assert service.discovery_urls == ["http://test:8000"]
        assert service.scan_interval == 120

        await shutdown_discovery_service()

    @pytest.mark.asyncio
    async def test_shutdown_discovery_service(self):
        """Should shutdown the service."""
        service = await configure_discovery_service()

        with patch.object(service, "scan", new_callable=AsyncMock):
            await service.start()
            await shutdown_discovery_service()

            assert not service.is_running
