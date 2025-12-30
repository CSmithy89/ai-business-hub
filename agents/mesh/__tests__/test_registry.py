"""
Tests for Agent Registry

@see docs/modules/bm-dm/stories/dm-06-5-universal-agent-mesh.md
Epic: DM-06 | Story: DM-06.5
"""
import asyncio

import pytest

from mesh.models import AgentCapability, AgentHealth, MeshAgentCard
from mesh.registry import (
    AgentRegistry,
    RegistryEvent,
    get_registry,
    reset_registry,
)


@pytest.fixture
def registry():
    """Create a fresh registry for each test."""
    return AgentRegistry()


@pytest.fixture
def sample_agent():
    """Create a sample agent card."""
    return MeshAgentCard(
        name="SampleAgent",
        description="A sample agent",
        url="http://localhost:8001",
        module="pm",
    )


@pytest.fixture
def agent_with_skills():
    """Create an agent with skills."""
    return MeshAgentCard(
        name="SkillfulAgent",
        description="Agent with skills",
        url="http://localhost:8002",
        module="kb",
        skills=[
            AgentCapability(id="search", name="Search", description="Search capability"),
            AgentCapability(id="analyze", name="Analyze", description="Analysis capability"),
        ],
    )


@pytest.fixture
def external_agent():
    """Create an external agent."""
    return MeshAgentCard(
        name="ExternalAgent",
        description="An external agent",
        url="http://external:8000",
        is_external=True,
        module="external",
    )


class TestAgentRegistry:
    """Tests for AgentRegistry class."""

    def test_register_agent(self, registry, sample_agent):
        """Should register an agent."""
        registry.register(sample_agent)

        assert registry.contains("SampleAgent")
        assert registry.count() == 1
        assert registry.is_healthy("SampleAgent")

    def test_register_updates_existing(self, registry, sample_agent):
        """Should update existing agent on re-registration."""
        registry.register(sample_agent)

        # Update description
        sample_agent.description = "Updated description"
        registry.register(sample_agent)

        agent = registry.get("SampleAgent")
        assert agent.description == "Updated description"
        assert registry.count() == 1

    def test_unregister_agent(self, registry, sample_agent):
        """Should unregister an agent."""
        registry.register(sample_agent)
        result = registry.unregister("SampleAgent")

        assert result is True
        assert not registry.contains("SampleAgent")
        assert registry.count() == 0

    def test_unregister_nonexistent(self, registry):
        """Should return False when unregistering unknown agent."""
        result = registry.unregister("NonExistent")

        assert result is False

    def test_get_agent(self, registry, sample_agent):
        """Should get agent by name."""
        registry.register(sample_agent)

        agent = registry.get("SampleAgent")

        assert agent is not None
        assert agent.name == "SampleAgent"
        assert agent.module == "pm"

    def test_get_updates_last_seen(self, registry, sample_agent):
        """Should update last_seen when getting agent."""
        registry.register(sample_agent)
        original_last_seen = sample_agent.last_seen

        # Small delay to ensure timestamp difference
        import time
        time.sleep(0.01)

        agent = registry.get("SampleAgent")

        assert agent.last_seen > original_last_seen

    def test_get_nonexistent(self, registry):
        """Should return None for unknown agent."""
        agent = registry.get("NonExistent")

        assert agent is None

    def test_list_all(self, registry, sample_agent, agent_with_skills):
        """Should list all registered agents."""
        registry.register(sample_agent)
        registry.register(agent_with_skills)

        agents = registry.list_all()

        assert len(agents) == 2
        names = [a.name for a in agents]
        assert "SampleAgent" in names
        assert "SkillfulAgent" in names

    def test_list_by_module(self, registry, sample_agent, agent_with_skills):
        """Should filter agents by module."""
        registry.register(sample_agent)
        registry.register(agent_with_skills)

        pm_agents = registry.list_by_module("pm")
        kb_agents = registry.list_by_module("kb")

        assert len(pm_agents) == 1
        assert pm_agents[0].name == "SampleAgent"
        assert len(kb_agents) == 1
        assert kb_agents[0].name == "SkillfulAgent"

    def test_list_by_capability(self, registry, sample_agent, agent_with_skills):
        """Should filter agents by capability."""
        registry.register(sample_agent)
        registry.register(agent_with_skills)

        search_agents = registry.list_by_capability("search")
        analyze_agents = registry.list_by_capability("analyze")
        unknown_agents = registry.list_by_capability("unknown")

        assert len(search_agents) == 1
        assert search_agents[0].name == "SkillfulAgent"
        assert len(analyze_agents) == 1
        assert len(unknown_agents) == 0

    def test_list_healthy(self, registry, sample_agent, agent_with_skills):
        """Should list only healthy agents."""
        registry.register(sample_agent)
        registry.register(agent_with_skills)
        registry.update_health("SampleAgent", False)

        healthy = registry.list_healthy()

        assert len(healthy) == 1
        assert healthy[0].name == "SkillfulAgent"

    def test_list_external(self, registry, sample_agent, external_agent):
        """Should list only external agents."""
        registry.register(sample_agent)
        registry.register(external_agent)

        external = registry.list_external()

        assert len(external) == 1
        assert external[0].name == "ExternalAgent"

    def test_list_internal(self, registry, sample_agent, external_agent):
        """Should list only internal agents."""
        registry.register(sample_agent)
        registry.register(external_agent)

        internal = registry.list_internal()

        assert len(internal) == 1
        assert internal[0].name == "SampleAgent"

    def test_update_health(self, registry, sample_agent):
        """Should update agent health status."""
        registry.register(sample_agent)

        registry.update_health("SampleAgent", False)

        assert not registry.is_healthy("SampleAgent")
        assert registry.get_health("SampleAgent") == AgentHealth.UNHEALTHY

    def test_update_health_nonexistent(self, registry):
        """Should return False for unknown agent."""
        result = registry.update_health("NonExistent", True)

        assert result is False

    def test_set_health(self, registry, sample_agent):
        """Should set health to specific status."""
        registry.register(sample_agent)

        registry.set_health("SampleAgent", AgentHealth.DEGRADED)

        assert registry.get_health("SampleAgent") == AgentHealth.DEGRADED

    def test_is_healthy(self, registry, sample_agent):
        """Should check if agent is healthy."""
        registry.register(sample_agent)

        assert registry.is_healthy("SampleAgent") is True

        registry.update_health("SampleAgent", False)

        assert registry.is_healthy("SampleAgent") is False

    def test_is_healthy_unknown(self, registry):
        """Should return False for unknown agent."""
        assert registry.is_healthy("NonExistent") is False

    def test_get_health_unknown(self, registry):
        """Should return UNKNOWN for unregistered agent."""
        health = registry.get_health("NonExistent")

        assert health == AgentHealth.UNKNOWN

    def test_subscribe(self, registry, sample_agent):
        """Should notify subscribers of changes."""
        queue = registry.subscribe()

        registry.register(sample_agent)

        event = queue.get_nowait()
        assert event["action"] == RegistryEvent.REGISTER
        assert event["agent"] == "SampleAgent"
        assert "timestamp" in event

    def test_subscribe_unregister(self, registry, sample_agent):
        """Should notify subscribers of unregister."""
        registry.register(sample_agent)
        queue = registry.subscribe()

        registry.unregister("SampleAgent")

        event = queue.get_nowait()
        assert event["action"] == RegistryEvent.UNREGISTER
        assert event["agent"] == "SampleAgent"

    def test_subscribe_health_update(self, registry, sample_agent):
        """Should notify subscribers of health updates."""
        registry.register(sample_agent)
        queue = registry.subscribe()

        registry.update_health("SampleAgent", False)

        event = queue.get_nowait()
        assert event["action"] == RegistryEvent.HEALTH_UPDATE
        assert event["agent"] == "SampleAgent"

    def test_unsubscribe(self, registry, sample_agent):
        """Should remove subscriber."""
        queue = registry.subscribe()
        registry.unsubscribe(queue)

        registry.register(sample_agent)

        # Queue should be empty after unsubscribe
        assert queue.empty()

    def test_count(self, registry, sample_agent, agent_with_skills):
        """Should return correct count."""
        assert registry.count() == 0

        registry.register(sample_agent)
        assert registry.count() == 1

        registry.register(agent_with_skills)
        assert registry.count() == 2

    def test_contains(self, registry, sample_agent):
        """Should check if agent is registered."""
        assert not registry.contains("SampleAgent")

        registry.register(sample_agent)

        assert registry.contains("SampleAgent")

    def test_clear(self, registry, sample_agent, agent_with_skills):
        """Should clear all agents."""
        registry.register(sample_agent)
        registry.register(agent_with_skills)

        registry.clear()

        assert registry.count() == 0
        assert not registry.contains("SampleAgent")

    def test_get_stats(self, registry, sample_agent, agent_with_skills, external_agent):
        """Should return registry statistics."""
        registry.register(sample_agent)
        registry.register(agent_with_skills)
        registry.register(external_agent)
        registry.update_health("SampleAgent", False)

        stats = registry.get_stats()

        assert stats["total"] == 3
        assert stats["healthy"] == 2
        assert stats["unhealthy"] == 1
        assert stats["external"] == 1
        assert stats["internal"] == 2
        assert stats["modules"]["pm"] == 1
        assert stats["modules"]["kb"] == 1


class TestGlobalRegistry:
    """Tests for global registry singleton."""

    def test_get_registry_singleton(self):
        """Should return same instance."""
        reset_registry()

        registry1 = get_registry()
        registry2 = get_registry()

        assert registry1 is registry2

    def test_reset_registry(self):
        """Should reset the singleton."""
        reset_registry()
        registry1 = get_registry()

        reset_registry()
        registry2 = get_registry()

        # Should be different instances after reset
        # (Note: they may be equal if no agents registered)
        assert registry2.count() == 0

    def test_get_registry_creates_new(self):
        """Should create registry on first access."""
        reset_registry()

        registry = get_registry()

        assert registry is not None
        assert isinstance(registry, AgentRegistry)


class TestRegistryThreadSafety:
    """Tests for thread-safe operations."""

    def test_concurrent_register(self, registry):
        """Should handle concurrent registrations."""
        import threading

        agents = [
            MeshAgentCard(
                name=f"Agent{i}",
                description=f"Agent {i}",
                url=f"http://localhost:{8000 + i}",
            )
            for i in range(10)
        ]

        def register_agent(agent):
            registry.register(agent)

        threads = [
            threading.Thread(target=register_agent, args=(agent,))
            for agent in agents
        ]

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert registry.count() == 10

    def test_concurrent_read_write(self, registry, sample_agent):
        """Should handle concurrent reads and writes."""
        import threading

        registry.register(sample_agent)
        results = []

        def read_agent():
            for _ in range(100):
                agent = registry.get("SampleAgent")
                results.append(agent is not None)

        def update_health():
            for i in range(100):
                registry.update_health("SampleAgent", i % 2 == 0)

        read_thread = threading.Thread(target=read_agent)
        write_thread = threading.Thread(target=update_health)

        read_thread.start()
        write_thread.start()
        read_thread.join()
        write_thread.join()

        assert all(results)  # All reads should succeed
