"""
Tests for Mesh Router

@see docs/modules/bm-dm/stories/dm-06-5-universal-agent-mesh.md
Epic: DM-06 | Story: DM-06.5
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from mesh.models import AgentCapability, MeshAgentCard
from mesh.registry import get_registry, reset_registry
from mesh.router import (
    MeshRouter,
    NoAgentFoundError,
    RoutingError,
    get_router,
    reset_router,
)


@pytest.fixture(autouse=True)
def reset_global_state():
    """Reset global state before each test."""
    reset_registry()
    reset_router()
    yield
    reset_registry()
    reset_router()


@pytest.fixture
def router():
    """Create a fresh router for each test."""
    return MeshRouter()


@pytest.fixture
def pm_agent():
    """Create a PM agent."""
    return MeshAgentCard(
        name="PMAgent",
        description="PM agent",
        url="http://localhost:8001",
        module="pm",
        skills=[
            AgentCapability(id="planning", name="Planning", description="Planning"),
            AgentCapability(id="tracking", name="Tracking", description="Tracking"),
        ],
    )


@pytest.fixture
def kb_agent():
    """Create a KB agent."""
    return MeshAgentCard(
        name="KBAgent",
        description="KB agent",
        url="http://localhost:8002",
        module="kb",
        skills=[
            AgentCapability(id="search", name="Search", description="Search"),
            AgentCapability(id="analyze", name="Analyze", description="Analysis"),
        ],
    )


@pytest.fixture
def external_agent():
    """Create an external agent."""
    return MeshAgentCard(
        name="ExternalAgent",
        description="External agent",
        url="http://external:8000",
        module="external",
        is_external=True,
        skills=[
            AgentCapability(id="planning", name="Planning", description="External planning"),
        ],
    )


@pytest.fixture
def populated_registry(pm_agent, kb_agent, external_agent):
    """Setup registry with agents."""
    registry = get_registry()
    registry.register(pm_agent)
    registry.register(kb_agent)
    registry.register(external_agent)
    return registry


class TestMeshRouter:
    """Tests for MeshRouter class."""

    def test_router_accesses_registry(self, router):
        """Should access the global registry."""
        assert router.registry is not None
        assert router.registry is get_registry()

    def test_find_agent_by_preferred_module(
        self, router, populated_registry, pm_agent
    ):
        """Should find agent by preferred module."""
        agent = router.find_agent_for_task("planning", preferred_module="pm")

        assert agent is not None
        assert agent.name == "PMAgent"

    def test_find_agent_by_capability(
        self, router, populated_registry
    ):
        """Should find agent by capability."""
        agent = router.find_agent_for_task("search")

        assert agent is not None
        assert agent.name == "KBAgent"

    def test_find_agent_prefers_internal(
        self, router, populated_registry
    ):
        """Should prefer internal agents over external."""
        # Both PMAgent and ExternalAgent have "planning" capability
        agent = router.find_agent_for_task("planning")

        assert agent is not None
        assert agent.name == "PMAgent"  # Internal preferred
        assert agent.is_external is False

    def test_find_agent_falls_back_to_external(self, router, external_agent):
        """Should fall back to external if no internal agents."""
        registry = get_registry()
        registry.register(external_agent)

        agent = router.find_agent_for_task("planning")

        assert agent is not None
        assert agent.name == "ExternalAgent"
        assert agent.is_external is True

    def test_find_agent_filters_unhealthy(
        self, router, populated_registry, pm_agent
    ):
        """Should filter out unhealthy agents."""
        registry = get_registry()
        registry.update_health("PMAgent", False)

        # PM agent is unhealthy, should fall back to external
        agent = router.find_agent_for_task("planning", preferred_module="pm")

        # Should fall back to external agent since PM is unhealthy
        assert agent.name == "ExternalAgent"

    def test_find_agent_no_match(self, router, populated_registry):
        """Should return None when no agent matches."""
        # Make all agents unhealthy
        registry = get_registry()
        registry.update_health("PMAgent", False)
        registry.update_health("KBAgent", False)
        registry.update_health("ExternalAgent", False)

        agent = router.find_agent_for_task("unknown_capability")

        assert agent is None

    def test_find_agent_preferred_module_fallback(
        self, router, populated_registry
    ):
        """Should use any agent from preferred module if no capability match."""
        agent = router.find_agent_for_task(
            "unknown_capability",
            preferred_module="pm",
        )

        assert agent is not None
        assert agent.module == "pm"

    def test_find_agent_round_robin(self, router):
        """Should use round-robin for multiple candidates."""
        registry = get_registry()

        # Register multiple agents with same capability
        for i in range(3):
            agent = MeshAgentCard(
                name=f"Agent{i}",
                description=f"Agent {i}",
                url=f"http://localhost:{8000 + i}",
                module="pm",
                skills=[
                    AgentCapability(id="task", name="Task", description="Task"),
                ],
            )
            registry.register(agent)

        # Call multiple times - should round-robin
        selected = set()
        for _ in range(3):
            agent = router.find_agent_for_task("task", preferred_module="pm")
            selected.add(agent.name)

        # Should have selected different agents (round-robin)
        assert len(selected) == 3

    def test_find_agents_for_broadcast_by_module(
        self, router, populated_registry
    ):
        """Should find agents for broadcast by module."""
        agents = router.find_agents_for_broadcast(module_filter="pm")

        assert len(agents) == 1
        assert agents[0].name == "PMAgent"

    def test_find_agents_for_broadcast_by_capability(
        self, router, populated_registry
    ):
        """Should find agents for broadcast by capability."""
        agents = router.find_agents_for_broadcast(capability_filter="planning")

        assert len(agents) == 2  # PMAgent and ExternalAgent

    def test_find_agents_for_broadcast_exclude_external(
        self, router, populated_registry
    ):
        """Should exclude external agents when specified."""
        agents = router.find_agents_for_broadcast(
            capability_filter="planning",
            include_external=False,
        )

        assert len(agents) == 1
        assert agents[0].name == "PMAgent"

    def test_find_agents_for_broadcast_all(
        self, router, populated_registry
    ):
        """Should return all healthy agents when no filter."""
        agents = router.find_agents_for_broadcast()

        assert len(agents) == 3

    @pytest.mark.asyncio
    async def test_route_request_success(self, router, populated_registry):
        """Should route request via A2A client."""
        mock_result = MagicMock()
        mock_result.success = True
        mock_result.model_dump.return_value = {"content": "Success", "success": True}

        mock_client = AsyncMock()
        mock_client.call_agent.return_value = mock_result

        # Create a proper async mock for get_a2a_client
        mock_get_client = AsyncMock(return_value=mock_client)

        # Create a mock module with the get_a2a_client function
        mock_a2a_client_module = MagicMock()
        mock_a2a_client_module.get_a2a_client = mock_get_client

        with patch.dict("sys.modules", {"a2a": MagicMock(), "a2a.client": mock_a2a_client_module}):
            result = await router.route_request(
                task_type="planning",
                message="Create project plan",
                preferred_module="pm",
            )

        assert result["agent"] == "PMAgent"
        assert result["success"] is True
        mock_client.call_agent.assert_called_once()

    @pytest.mark.asyncio
    async def test_route_request_no_agent(self, router):
        """Should return error when no agent found."""
        result = await router.route_request(
            task_type="nonexistent",
            message="Test message",
        )

        assert "error" in result
        assert "No agent found" in result["error"]

    @pytest.mark.asyncio
    async def test_route_request_a2a_error(self, router, populated_registry):
        """Should handle A2A client errors."""
        mock_client = AsyncMock()
        mock_client.call_agent.side_effect = Exception("Connection failed")

        async def mock_get_client():
            return mock_client

        with patch.dict("sys.modules", {"a2a": MagicMock(), "a2a.client": MagicMock()}):
            with patch("a2a.client.get_a2a_client", mock_get_client):
                result = await router.route_request(
                    task_type="planning",
                    message="Test",
                    preferred_module="pm",
                )

        assert "error" in result
        assert result["agent"] == "PMAgent"

    @pytest.mark.asyncio
    async def test_route_request_no_a2a_client(self, router, populated_registry):
        """Should handle missing A2A client gracefully."""
        # Test that ImportError is handled - remove a2a from sys.modules
        import sys
        # Remove any existing a2a module
        a2a_mods = [k for k in sys.modules.keys() if k.startswith("a2a")]
        saved_mods = {k: sys.modules.pop(k) for k in a2a_mods if k in sys.modules}

        try:
            # Simulate import error by making import fail
            import builtins
            original_import = builtins.__import__

            def mock_import(name, *args, **kwargs):
                if name == "a2a.client" or name.startswith("a2a"):
                    raise ImportError("No module named 'a2a'")
                return original_import(name, *args, **kwargs)

            builtins.__import__ = mock_import

            result = await router.route_request(
                task_type="planning",
                message="Test",
            )

            assert "error" in result
            assert "not available" in result["error"]
        finally:
            builtins.__import__ = original_import
            # Restore modules
            sys.modules.update(saved_mods)

    @pytest.mark.asyncio
    async def test_broadcast_request_success(self, router, populated_registry):
        """Should broadcast to multiple agents."""
        mock_result1 = MagicMock()
        mock_result1.success = True
        mock_result1.model_dump.return_value = {"content": "Response 1"}

        mock_result2 = MagicMock()
        mock_result2.success = True
        mock_result2.model_dump.return_value = {"content": "Response 2"}

        mock_client = AsyncMock()
        mock_client.call_agents_parallel.return_value = {
            "PMAgent": mock_result1,
            "KBAgent": mock_result2,
        }

        async def mock_get_client():
            return mock_client

        with patch.dict("sys.modules", {"a2a": MagicMock(), "a2a.client": MagicMock()}):
            with patch("a2a.client.get_a2a_client", mock_get_client):
                results = await router.broadcast_request(
                    message="Status update",
                    module_filter=None,
                    include_external=False,
                )

        # Should have broadcast to PM and KB (internal) agents
        assert len(results) >= 2

    @pytest.mark.asyncio
    async def test_broadcast_request_no_agents(self, router):
        """Should return empty list when no agents match."""
        results = await router.broadcast_request(
            message="Test",
            module_filter="nonexistent",
        )

        assert results == []

    @pytest.mark.asyncio
    async def test_broadcast_request_by_module(self, router, populated_registry):
        """Should broadcast only to specified module."""
        mock_result = MagicMock()
        mock_result.success = True
        mock_result.model_dump.return_value = {"content": "Response"}

        mock_client = AsyncMock()
        mock_client.call_agents_parallel.return_value = {
            "PMAgent": mock_result,
        }

        async def mock_get_client():
            return mock_client

        with patch.dict("sys.modules", {"a2a": MagicMock(), "a2a.client": MagicMock()}):
            with patch("a2a.client.get_a2a_client", mock_get_client):
                results = await router.broadcast_request(
                    message="PM status",
                    module_filter="pm",
                )

        assert len(results) == 1
        assert results[0]["agent"] == "PMAgent"

    def test_get_routing_info(self, router, populated_registry):
        """Should return routing analysis."""
        info = router.get_routing_info("planning")

        assert info["task_type"] == "planning"
        assert info["total_agents"] == 3
        assert info["healthy_agents"] == 3
        assert info["capability_matches"] == 2  # PMAgent and ExternalAgent
        assert info["selected_agent"] == "PMAgent"
        assert info["is_external"] is False

    def test_get_routing_info_no_match(self, router):
        """Should handle no matching agents."""
        info = router.get_routing_info("unknown")

        assert info["capability_matches"] == 0
        assert info["selected_agent"] is None


class TestGlobalRouter:
    """Tests for global router singleton."""

    def test_get_router_singleton(self):
        """Should return same instance."""
        reset_router()

        router1 = get_router()
        router2 = get_router()

        assert router1 is router2

    def test_reset_router(self):
        """Should reset the singleton."""
        reset_router()
        router1 = get_router()

        reset_router()

        # After reset, should get new instance
        # (verify by checking round-robin index is empty)
        router2 = get_router()
        assert router2._round_robin_index == {}

    def test_get_router_creates_new(self):
        """Should create router on first access."""
        reset_router()

        router = get_router()

        assert router is not None
        assert isinstance(router, MeshRouter)


class TestRoutingPriority:
    """Tests for routing priority logic."""

    def test_priority_1_preferred_module_with_capability(self, router):
        """Priority 1: Preferred module with matching capability."""
        registry = get_registry()

        # PM agent with capability
        pm_with = MeshAgentCard(
            name="PMWithCap",
            description="PM with capability",
            url="http://pm:8000",
            module="pm",
            skills=[AgentCapability(id="test", name="Test", description="Test")],
        )

        # KB agent with capability (should not be selected)
        kb_with = MeshAgentCard(
            name="KBWithCap",
            description="KB with capability",
            url="http://kb:8000",
            module="kb",
            skills=[AgentCapability(id="test", name="Test", description="Test")],
        )

        registry.register(pm_with)
        registry.register(kb_with)

        agent = router.find_agent_for_task("test", preferred_module="pm")

        assert agent.name == "PMWithCap"

    def test_priority_2_capability_match(self, router):
        """Priority 2: Capability match when no module preference."""
        registry = get_registry()

        # Agent with capability
        with_cap = MeshAgentCard(
            name="WithCap",
            description="Has capability",
            url="http://test:8000",
            module="test",
            skills=[AgentCapability(id="special", name="Special", description="Special")],
        )

        # Agent without capability
        without_cap = MeshAgentCard(
            name="WithoutCap",
            description="No capability",
            url="http://test2:8000",
            module="test",
            skills=[],
        )

        registry.register(with_cap)
        registry.register(without_cap)

        agent = router.find_agent_for_task("special")

        assert agent.name == "WithCap"

    def test_priority_3_health_filter(self, router):
        """Priority 3: Only healthy agents considered."""
        registry = get_registry()

        unhealthy = MeshAgentCard(
            name="Unhealthy",
            description="Unhealthy agent",
            url="http://unhealthy:8000",
            module="pm",
            skills=[AgentCapability(id="test", name="Test", description="Test")],
        )

        healthy = MeshAgentCard(
            name="Healthy",
            description="Healthy agent",
            url="http://healthy:8000",
            module="pm",
            skills=[AgentCapability(id="test", name="Test", description="Test")],
        )

        registry.register(unhealthy)
        registry.register(healthy)
        registry.update_health("Unhealthy", False)

        agent = router.find_agent_for_task("test", preferred_module="pm")

        assert agent.name == "Healthy"

    def test_priority_4_internal_over_external(self, router):
        """Priority 4: Internal agents preferred over external."""
        registry = get_registry()

        internal = MeshAgentCard(
            name="Internal",
            description="Internal agent",
            url="http://internal:8000",
            module="test",
            is_external=False,
            skills=[AgentCapability(id="test", name="Test", description="Test")],
        )

        external = MeshAgentCard(
            name="External",
            description="External agent",
            url="http://external:8000",
            module="test",
            is_external=True,
            skills=[AgentCapability(id="test", name="Test", description="Test")],
        )

        registry.register(external)  # Register external first
        registry.register(internal)

        agent = router.find_agent_for_task("test")

        assert agent.name == "Internal"
        assert agent.is_external is False

    def test_priority_5_fallback_to_any_healthy(self, router):
        """Priority 5: Any healthy agent as fallback."""
        registry = get_registry()

        fallback = MeshAgentCard(
            name="Fallback",
            description="Fallback agent",
            url="http://fallback:8000",
            module="other",
            skills=[],  # No matching capability
        )

        registry.register(fallback)

        # No capability match, no module preference
        agent = router.find_agent_for_task("nonexistent")

        assert agent.name == "Fallback"
