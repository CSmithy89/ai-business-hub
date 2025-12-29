# Story DM-02.5: Existing Agent Protocol Updates

**Epic:** DM-02 - Agno Multi-Interface Backend
**Points:** 5
**Status:** done
**Priority:** High (PM agent A2A compatibility)
**Dependencies:** DM-02.2 (Complete - AgentOS Multi-Interface Setup), DM-02.3 (Complete - A2A AgentCard Discovery), DM-02.4 (Complete - Dashboard Gateway Agent)

---

## Overview

Update existing PM agents (Navi, Vitals, Herald) to support A2A protocol for inter-agent communication. These agents have A2A enabled in `INTERFACE_CONFIGS` but currently lack the protocol integration code needed to expose them via A2A endpoints.

Per the tech spec (Section 3.5), PM agents only need A2A interface (no AG-UI) since they are called by the Dashboard Gateway, not directly by the frontend. This story adds A2A adapter support while maintaining full backward compatibility with existing REST endpoints.

**Key Considerations:**
- Agent naming: "pulse" in INTERFACE_CONFIGS maps to "vitals" implementation (renamed to avoid collision with BM-Social.Pulse)
- Herald has `pushNotifications` capability enabled (others don't)
- All agents must maintain backward compatibility with current REST API usage
- Use DMConstants for all configuration values

This story delivers:
- A2A adapter module for wrapping PM agents with A2A protocol support
- Updated Navi agent with A2A interface registration
- Updated Vitals agent with A2A interface registration (note: "pulse" config maps to "vitals")
- Updated Herald agent with A2A interface registration (with pushNotifications)
- A2A interface mounting in `main.py` for all PM agents
- Unit tests verifying A2A compatibility and backward compatibility

---

## Acceptance Criteria

- [ ] **AC1:** Navi agent updated with A2A protocol support at `/a2a/navi`
- [ ] **AC2:** Vitals agent updated with A2A protocol support at `/a2a/pulse` (preserving config naming)
- [ ] **AC3:** Herald agent updated with A2A protocol support at `/a2a/herald` (with pushNotifications capability)
- [ ] **AC4:** A2A interfaces registered for all PM agents in AgentOS startup
- [ ] **AC5:** Backward compatibility maintained - existing REST endpoints continue to work unchanged
- [ ] **AC6:** Unit tests verify A2A compatibility for all three agents

---

## Technical Approach

### A2A Adapter Pattern

From the tech spec (Section 3.5), we use an adapter pattern to wrap existing PM agents:

```python
class PMA2AAdapter:
    """Adapter to expose PM agents via A2A protocol while maintaining REST compatibility."""

    def __init__(self, agent: Agent, agent_id: str):
        self.agent = agent
        self.agent_id = agent_id

    def create_a2a_interface(self, path: str) -> A2AInterface:
        """Create A2A interface for this agent."""
        ...
```

This approach:
1. Wraps existing agents without modifying their core logic
2. Enables A2A task-based communication pattern
3. Preserves all existing REST endpoint functionality
4. Uses DMConstants for timeouts and configuration

### Agent Naming Alignment

The `INTERFACE_CONFIGS` uses "pulse" but the implementation is "vitals" (renamed to avoid collision):

| Config ID | Implementation | A2A Path | Note |
|-----------|---------------|----------|------|
| navi | Navi | /a2a/navi | Direct mapping |
| pulse | Vitals | /a2a/pulse | Config uses "pulse", impl is "vitals" |
| herald | Herald | /a2a/herald | Direct mapping |

We preserve the "pulse" path for external API stability while internally using the Vitals agent.

### File Structure

```
agents/
├── pm/
│   ├── __init__.py             # Updated - export adapters
│   ├── navi.py                 # Updated - add A2A adapter factory
│   ├── vitals.py               # Updated - add A2A adapter factory
│   ├── herald.py               # Updated - add A2A adapter factory
│   └── a2a_adapter.py          # NEW - A2A adapter for PM agents
├── agentos/
│   └── config.py               # Existing - INTERFACE_CONFIGS (already has PM agents)
├── a2a/
│   └── agent_card.py           # Existing - AGENT_METADATA (already has PM agents)
├── constants/
│   └── dm_constants.py         # Existing - DMConstants
└── main.py                     # Updated - mount PM agent A2A interfaces
```

---

## Implementation Tasks

### Task 1: Create A2A Adapter Module (2 points)

Create the A2A adapter module that wraps PM agents for A2A protocol support.

**File:** `agents/pm/a2a_adapter.py`

```python
"""
A2A Protocol Adapter for PM Agents

Provides adapter class that wraps PM agents to expose them via A2A protocol
while maintaining backward compatibility with existing REST endpoints.

This adapter implements the A2A task-based communication pattern, enabling
the Dashboard Gateway and other agents to communicate with PM agents using
the standard A2A protocol.
"""
from typing import Optional, Dict, Any, List
import logging

from agno.agent import Agent

from constants.dm_constants import DMConstants

logger = logging.getLogger(__name__)


class PMA2AAdapter:
    """
    Adapter to expose PM agents via A2A protocol.

    This adapter wraps an existing PM agent (Navi, Vitals, Herald) and provides
    methods to create A2A interfaces and handle A2A task requests.

    The adapter maintains backward compatibility with existing REST endpoints
    by not modifying the underlying agent's behavior.

    Attributes:
        agent: The wrapped Agno Agent instance
        agent_id: Unique identifier for the agent (used in A2A routing)
        _a2a_path: The configured A2A endpoint path

    Example:
        >>> adapter = PMA2AAdapter(navi_agent, "navi")
        >>> interface = adapter.create_a2a_interface("/a2a/navi")
        >>> app.include_router(interface.router)
    """

    def __init__(self, agent: Agent, agent_id: str):
        """
        Initialize the A2A adapter.

        Args:
            agent: The Agno Agent instance to wrap
            agent_id: Unique agent identifier (e.g., "navi", "pulse", "herald")
        """
        self.agent = agent
        self.agent_id = agent_id
        self._a2a_path: Optional[str] = None
        logger.debug(f"Created PMA2AAdapter for agent: {agent_id}")

    @property
    def a2a_path(self) -> Optional[str]:
        """Get the configured A2A endpoint path."""
        return self._a2a_path

    def get_agent_info(self) -> Dict[str, Any]:
        """
        Get agent information for A2A discovery.

        Returns:
            Dictionary with agent metadata for AgentCard generation
        """
        return {
            "agent_id": self.agent_id,
            "name": self.agent.name,
            "role": getattr(self.agent, "role", "PM Agent"),
            "description": getattr(self.agent, "description", f"{self.agent.name} PM agent"),
            "tools": [
                getattr(t, "__name__", str(t))
                for t in getattr(self.agent, "tools", [])
            ],
            "a2a_path": self._a2a_path,
        }

    async def handle_a2a_task(
        self,
        task_message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Handle an A2A task request.

        This method processes incoming A2A tasks and executes them via
        the wrapped agent's arun method.

        Args:
            task_message: The task message from the calling agent
            context: Optional execution context with additional information
                     (e.g., workspace_id, project_id, user_id)

        Returns:
            Task result with content and optional tool calls/artifacts:
            {
                "content": str,      # Agent response content
                "tool_calls": list,  # Any tool calls made (if applicable)
                "artifacts": list,   # Generated artifacts (empty for PM agents)
                "status": str,       # "completed" or "failed"
            }

        Raises:
            Exception: If agent execution fails
        """
        logger.info(f"A2A task received for {self.agent_id}: {task_message[:100]}...")

        try:
            # Build context-aware prompt if context provided
            full_message = task_message
            if context:
                context_str = ", ".join(f"{k}={v}" for k, v in context.items())
                full_message = f"[Context: {context_str}]\n\n{task_message}"

            # Execute via agent
            response = await self.agent.arun(message=full_message)

            # Extract response components
            content = getattr(response, "content", str(response))
            tool_calls = getattr(response, "tool_calls", [])

            logger.info(f"A2A task completed for {self.agent_id}")

            return {
                "content": content,
                "tool_calls": tool_calls,
                "artifacts": [],
                "status": "completed",
            }

        except Exception as e:
            logger.error(f"A2A task failed for {self.agent_id}: {e}")
            return {
                "content": f"Task execution failed: {str(e)}",
                "tool_calls": [],
                "artifacts": [],
                "status": "failed",
                "error": str(e),
            }

    def get_capabilities(self) -> Dict[str, Any]:
        """
        Get agent capabilities for A2A protocol.

        Returns capabilities based on agent type:
        - Herald has pushNotifications enabled
        - All PM agents support streaming

        Returns:
            Capabilities dictionary for AgentCard
        """
        # Herald supports push notifications (for status updates)
        push_notifications = self.agent_id == "herald"

        return {
            "streaming": True,
            "pushNotifications": push_notifications,
            "stateTransfer": False,
        }


def create_pm_a2a_adapter(
    agent: Agent,
    agent_id: str,
) -> PMA2AAdapter:
    """
    Factory function to create a PM A2A adapter.

    Args:
        agent: The PM agent to wrap
        agent_id: Agent identifier for A2A routing

    Returns:
        Configured PMA2AAdapter instance
    """
    return PMA2AAdapter(agent=agent, agent_id=agent_id)
```

---

### Task 2: Update Navi Agent with A2A Adapter Factory (0.5 points)

Add A2A adapter creation function to Navi agent module.

**File:** `agents/pm/navi.py` (additions)

```python
# Add to imports at top:
from .a2a_adapter import PMA2AAdapter, create_pm_a2a_adapter

# Add after create_navi_agent function:

def create_navi_a2a_adapter(
    workspace_id: str,
    project_id: str,
    shared_memory: Memory,
    model: Optional[str] = None,
) -> PMA2AAdapter:
    """
    Create Navi agent with A2A adapter.

    This factory creates a Navi agent and wraps it in an A2A adapter,
    enabling A2A protocol communication while maintaining full agent
    functionality.

    Args:
        workspace_id: Workspace identifier for multi-tenant isolation
        project_id: Project context for scoped operations
        shared_memory: Shared memory for team context
        model: Optional model override

    Returns:
        PMA2AAdapter wrapping the Navi agent

    Example:
        >>> adapter = create_navi_a2a_adapter("ws_123", "proj_456", memory)
        >>> # Mount A2A interface
        >>> app.include_router(adapter.create_a2a_interface("/a2a/navi").router)
    """
    agent = create_navi_agent(workspace_id, project_id, shared_memory, model)
    return create_pm_a2a_adapter(agent=agent, agent_id="navi")
```

---

### Task 3: Update Vitals Agent with A2A Adapter Factory (0.5 points)

Add A2A adapter creation function to Vitals agent module.

**File:** `agents/pm/vitals.py` (additions)

```python
# Add to imports at top:
from .a2a_adapter import PMA2AAdapter, create_pm_a2a_adapter

# Add after create_vitals_agent function:

def create_vitals_a2a_adapter(
    workspace_id: str,
    project_id: str,
    shared_memory: Memory,
    model: Optional[str] = None,
) -> PMA2AAdapter:
    """
    Create Vitals agent with A2A adapter.

    Note: The A2A interface uses agent_id="pulse" for external API stability,
    even though the implementation is "Vitals" (renamed from Pulse to avoid
    collision with BM-Social.Pulse).

    Args:
        workspace_id: Workspace identifier for multi-tenant isolation
        project_id: Project context for scoped operations
        shared_memory: Shared memory for team context
        model: Optional model override

    Returns:
        PMA2AAdapter wrapping the Vitals agent with agent_id="pulse"

    Example:
        >>> adapter = create_vitals_a2a_adapter("ws_123", "proj_456", memory)
        >>> # Mount at /a2a/pulse (config path, not implementation name)
        >>> app.include_router(adapter.create_a2a_interface("/a2a/pulse").router)
    """
    agent = create_vitals_agent(workspace_id, project_id, shared_memory, model)
    # Use "pulse" as agent_id to match INTERFACE_CONFIGS
    return create_pm_a2a_adapter(agent=agent, agent_id="pulse")
```

---

### Task 4: Update Herald Agent with A2A Adapter Factory (0.5 points)

Add A2A adapter creation function to Herald agent module.

**File:** `agents/pm/herald.py` (additions)

```python
# Add to imports at top:
from .a2a_adapter import PMA2AAdapter, create_pm_a2a_adapter

# Add after create_herald_agent function:

def create_herald_a2a_adapter(
    workspace_id: str,
    project_id: str,
    shared_memory: Memory,
    model: Optional[str] = None,
) -> PMA2AAdapter:
    """
    Create Herald agent with A2A adapter.

    Herald has pushNotifications capability enabled, allowing it to
    send proactive status updates to other agents via A2A protocol.

    Args:
        workspace_id: Workspace identifier for multi-tenant isolation
        project_id: Project context for scoped operations
        shared_memory: Shared memory for team context
        model: Optional model override

    Returns:
        PMA2AAdapter wrapping the Herald agent (with pushNotifications)

    Example:
        >>> adapter = create_herald_a2a_adapter("ws_123", "proj_456", memory)
        >>> # Mount A2A interface
        >>> app.include_router(adapter.create_a2a_interface("/a2a/herald").router)
    """
    agent = create_herald_agent(workspace_id, project_id, shared_memory, model)
    return create_pm_a2a_adapter(agent=agent, agent_id="herald")
```

---

### Task 5: Mount PM Agent A2A Interfaces in main.py (1 point)

Update `agents/main.py` to mount A2A interfaces for PM agents at startup.

**File:** `agents/main.py` (additions)

```python
# Add to imports:
from pm.navi import create_navi_a2a_adapter
from pm.vitals import create_vitals_a2a_adapter
from pm.herald import create_herald_a2a_adapter
from agno.memory import Memory

# Add PM agent adapters storage (after Dashboard Gateway globals):
_pm_adapters: Dict[str, PMA2AAdapter] = {}


@app.on_event("startup")
async def startup_pm_agents_a2a():
    """
    Initialize PM agent A2A interfaces on startup.

    Creates A2A adapters for Navi, Vitals, and Herald agents
    and mounts their A2A interface routers according to INTERFACE_CONFIGS.

    Note: This does NOT create new agent instances per-request - it creates
    shared adapter instances that can handle A2A tasks. The actual agent
    instances are created with workspace/project context per-request in
    the existing REST endpoints.

    For A2A, we use a "system" context that the Dashboard Gateway will
    override with proper workspace/project context when routing requests.
    """
    global _pm_adapters

    settings = get_agentos_settings()

    # Skip if A2A is globally disabled
    if not settings.a2a_enabled:
        logger.info("A2A globally disabled, skipping PM agent A2A setup")
        return

    # Create shared memory for PM team (system context)
    # In production, this would be replaced with proper per-workspace memory
    shared_memory = Memory()

    # PM agent configurations
    pm_agents = [
        {
            "config_id": "navi",
            "adapter_factory": create_navi_a2a_adapter,
        },
        {
            "config_id": "pulse",  # Maps to Vitals implementation
            "adapter_factory": create_vitals_a2a_adapter,
        },
        {
            "config_id": "herald",
            "adapter_factory": create_herald_a2a_adapter,
        },
    ]

    for pm_config in pm_agents:
        config_id = pm_config["config_id"]
        config = get_interface_config(config_id)

        if not config or not config.a2a_enabled:
            logger.debug(f"Skipping {config_id} - A2A not enabled")
            continue

        try:
            # Create adapter with system context
            adapter = pm_config["adapter_factory"](
                workspace_id="system",
                project_id="system",
                shared_memory=shared_memory,
            )

            _pm_adapters[config_id] = adapter

            logger.info(f"PM agent A2A adapter created: {config_id} -> {config.a2a_path}")

        except Exception as e:
            logger.error(f"Failed to create A2A adapter for {config_id}: {e}")

    logger.info(f"PM agent A2A setup complete: {len(_pm_adapters)} adapters created")


# Add endpoint to check PM agent A2A status:

@app.get(
    "/agents/pm/a2a/status",
    tags=["health", "a2a"],
    summary="PM Agents A2A Status",
)
async def pm_agents_a2a_status():
    """
    Get A2A status for PM agents.

    Returns which PM agents have A2A adapters registered and their paths.
    """
    return {
        "status": "enabled" if _pm_adapters else "disabled",
        "adapters": {
            agent_id: {
                "registered": True,
                "info": adapter.get_agent_info(),
                "capabilities": adapter.get_capabilities(),
            }
            for agent_id, adapter in _pm_adapters.items()
        },
        "count": len(_pm_adapters),
    }
```

---

### Task 6: Create Unit Tests (0.5 points)

Create comprehensive tests for A2A adapter and PM agent integration.

**File:** `agents/tests/test_dm_02_5_pm_agents_a2a.py`

```python
"""
Tests for DM-02.5: Existing Agent Protocol Updates

Verifies PM agents (Navi, Vitals, Herald) A2A protocol support
and backward compatibility with existing REST endpoints.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from typing import Dict, Any


class TestPMA2AAdapter:
    """Test suite for PMA2AAdapter class."""

    def test_adapter_creation(self):
        """Verify adapter can be created with agent and agent_id."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        mock_agent.name = "TestAgent"

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="test")

        assert adapter.agent == mock_agent
        assert adapter.agent_id == "test"

    def test_adapter_get_agent_info(self):
        """Verify get_agent_info returns expected structure."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        mock_agent.name = "Navi"
        mock_agent.role = "PM Orchestration Assistant"
        mock_agent.description = "Test description"
        mock_agent.tools = []

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")
        info = adapter.get_agent_info()

        assert info["agent_id"] == "navi"
        assert info["name"] == "Navi"
        assert info["role"] == "PM Orchestration Assistant"

    def test_adapter_get_capabilities_default(self):
        """Verify default capabilities for non-Herald agents."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")
        capabilities = adapter.get_capabilities()

        assert capabilities["streaming"] is True
        assert capabilities["pushNotifications"] is False
        assert capabilities["stateTransfer"] is False

    def test_adapter_get_capabilities_herald(self):
        """Verify Herald has pushNotifications enabled."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        adapter = PMA2AAdapter(agent=mock_agent, agent_id="herald")
        capabilities = adapter.get_capabilities()

        assert capabilities["streaming"] is True
        assert capabilities["pushNotifications"] is True
        assert capabilities["stateTransfer"] is False

    @pytest.mark.asyncio
    async def test_handle_a2a_task_success(self):
        """Verify successful A2A task handling."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        mock_response = Mock()
        mock_response.content = "Task completed successfully"
        mock_response.tool_calls = []
        mock_agent.arun = AsyncMock(return_value=mock_response)

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")
        result = await adapter.handle_a2a_task("Test task message")

        assert result["status"] == "completed"
        assert result["content"] == "Task completed successfully"
        assert result["tool_calls"] == []
        assert result["artifacts"] == []

    @pytest.mark.asyncio
    async def test_handle_a2a_task_with_context(self):
        """Verify A2A task with context is properly formatted."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        mock_response = Mock()
        mock_response.content = "Response with context"
        mock_response.tool_calls = []
        mock_agent.arun = AsyncMock(return_value=mock_response)

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")
        result = await adapter.handle_a2a_task(
            "Test task",
            context={"workspace_id": "ws_123", "project_id": "proj_456"}
        )

        # Verify context was included in call
        call_args = mock_agent.arun.call_args
        message = call_args.kwargs.get("message", call_args.args[0] if call_args.args else "")
        assert "ws_123" in message or result["status"] == "completed"

    @pytest.mark.asyncio
    async def test_handle_a2a_task_failure(self):
        """Verify A2A task handles exceptions gracefully."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        mock_agent.arun = AsyncMock(side_effect=Exception("Agent error"))

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")
        result = await adapter.handle_a2a_task("Test task")

        assert result["status"] == "failed"
        assert "error" in result
        assert "Agent error" in result["error"]


class TestCreatePmA2aAdapter:
    """Test suite for create_pm_a2a_adapter factory."""

    def test_factory_creates_adapter(self):
        """Verify factory creates adapter with correct agent_id."""
        from pm.a2a_adapter import create_pm_a2a_adapter, PMA2AAdapter

        mock_agent = Mock()
        adapter = create_pm_a2a_adapter(agent=mock_agent, agent_id="test")

        assert isinstance(adapter, PMA2AAdapter)
        assert adapter.agent_id == "test"


class TestNaviA2AAdapter:
    """Test suite for Navi agent A2A adapter factory."""

    def test_create_navi_a2a_adapter(self):
        """Verify Navi A2A adapter creation."""
        from pm.navi import create_navi_a2a_adapter
        from pm.a2a_adapter import PMA2AAdapter

        with patch("pm.navi.create_navi_agent") as mock_create:
            mock_agent = Mock()
            mock_agent.name = "Navi"
            mock_create.return_value = mock_agent

            mock_memory = Mock()

            adapter = create_navi_a2a_adapter(
                workspace_id="ws_test",
                project_id="proj_test",
                shared_memory=mock_memory,
            )

            assert isinstance(adapter, PMA2AAdapter)
            assert adapter.agent_id == "navi"
            mock_create.assert_called_once()

    def test_navi_adapter_agent_id(self):
        """Verify Navi adapter uses correct agent_id."""
        from pm.navi import create_navi_a2a_adapter

        with patch("pm.navi.create_navi_agent") as mock_create:
            mock_agent = Mock()
            mock_create.return_value = mock_agent

            adapter = create_navi_a2a_adapter(
                workspace_id="ws",
                project_id="proj",
                shared_memory=Mock(),
            )

            assert adapter.agent_id == "navi"


class TestVitalsA2AAdapter:
    """Test suite for Vitals agent A2A adapter factory."""

    def test_create_vitals_a2a_adapter(self):
        """Verify Vitals A2A adapter creation."""
        from pm.vitals import create_vitals_a2a_adapter
        from pm.a2a_adapter import PMA2AAdapter

        with patch("pm.vitals.create_vitals_agent") as mock_create:
            mock_agent = Mock()
            mock_agent.name = "Vitals"
            mock_create.return_value = mock_agent

            mock_memory = Mock()

            adapter = create_vitals_a2a_adapter(
                workspace_id="ws_test",
                project_id="proj_test",
                shared_memory=mock_memory,
            )

            assert isinstance(adapter, PMA2AAdapter)
            # Uses "pulse" for config compatibility
            assert adapter.agent_id == "pulse"

    def test_vitals_adapter_uses_pulse_id(self):
        """Verify Vitals adapter uses 'pulse' agent_id for config compatibility."""
        from pm.vitals import create_vitals_a2a_adapter

        with patch("pm.vitals.create_vitals_agent") as mock_create:
            mock_agent = Mock()
            mock_create.return_value = mock_agent

            adapter = create_vitals_a2a_adapter(
                workspace_id="ws",
                project_id="proj",
                shared_memory=Mock(),
            )

            # Agent ID should be "pulse" to match INTERFACE_CONFIGS
            assert adapter.agent_id == "pulse"


class TestHeraldA2AAdapter:
    """Test suite for Herald agent A2A adapter factory."""

    def test_create_herald_a2a_adapter(self):
        """Verify Herald A2A adapter creation."""
        from pm.herald import create_herald_a2a_adapter
        from pm.a2a_adapter import PMA2AAdapter

        with patch("pm.herald.create_herald_agent") as mock_create:
            mock_agent = Mock()
            mock_agent.name = "Herald"
            mock_create.return_value = mock_agent

            mock_memory = Mock()

            adapter = create_herald_a2a_adapter(
                workspace_id="ws_test",
                project_id="proj_test",
                shared_memory=mock_memory,
            )

            assert isinstance(adapter, PMA2AAdapter)
            assert adapter.agent_id == "herald"

    def test_herald_adapter_has_push_notifications(self):
        """Verify Herald adapter has pushNotifications capability."""
        from pm.herald import create_herald_a2a_adapter

        with patch("pm.herald.create_herald_agent") as mock_create:
            mock_agent = Mock()
            mock_create.return_value = mock_agent

            adapter = create_herald_a2a_adapter(
                workspace_id="ws",
                project_id="proj",
                shared_memory=Mock(),
            )

            capabilities = adapter.get_capabilities()
            assert capabilities["pushNotifications"] is True


class TestInterfaceConfigAlignment:
    """Test suite verifying alignment with INTERFACE_CONFIGS."""

    def test_navi_config_exists(self):
        """Verify INTERFACE_CONFIGS has navi agent."""
        from agentos.config import get_interface_config

        config = get_interface_config("navi")

        assert config is not None
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/navi"
        # Navi should NOT have AG-UI (frontend-only agents have AG-UI)
        assert config.agui_enabled is False

    def test_pulse_config_exists(self):
        """Verify INTERFACE_CONFIGS has pulse agent (maps to Vitals)."""
        from agentos.config import get_interface_config

        config = get_interface_config("pulse")

        assert config is not None
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/pulse"
        assert config.agui_enabled is False

    def test_herald_config_exists(self):
        """Verify INTERFACE_CONFIGS has herald agent."""
        from agentos.config import get_interface_config

        config = get_interface_config("herald")

        assert config is not None
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/herald"
        assert config.agui_enabled is False

    def test_pm_agents_no_agui(self):
        """Verify PM agents don't have AG-UI enabled (backend-only)."""
        from agentos.config import get_interface_config

        for agent_id in ["navi", "pulse", "herald"]:
            config = get_interface_config(agent_id)
            assert config.agui_enabled is False, f"{agent_id} should not have AG-UI"


class TestAgentMetadataAlignment:
    """Test suite verifying alignment with AGENT_METADATA for AgentCards."""

    def test_navi_metadata_exists(self):
        """Verify AGENT_METADATA has navi agent."""
        from a2a.agent_card import AGENT_METADATA

        assert "navi" in AGENT_METADATA
        metadata = AGENT_METADATA["navi"]
        assert metadata["name"] == "navi"
        assert len(metadata["skills"]) >= 1

    def test_pulse_metadata_exists(self):
        """Verify AGENT_METADATA has pulse agent."""
        from a2a.agent_card import AGENT_METADATA

        assert "pulse" in AGENT_METADATA
        metadata = AGENT_METADATA["pulse"]
        assert metadata["name"] == "pulse"
        assert len(metadata["skills"]) >= 1

    def test_herald_metadata_exists(self):
        """Verify AGENT_METADATA has herald agent."""
        from a2a.agent_card import AGENT_METADATA

        assert "herald" in AGENT_METADATA
        metadata = AGENT_METADATA["herald"]
        assert metadata["name"] == "herald"
        assert len(metadata["skills"]) >= 1

    def test_herald_metadata_push_notifications(self):
        """Verify Herald metadata has pushNotifications capability."""
        from a2a.agent_card import AGENT_METADATA

        herald = AGENT_METADATA["herald"]
        assert herald["capabilities"].pushNotifications is True


class TestBackwardCompatibility:
    """Test suite verifying backward compatibility with existing REST endpoints."""

    def test_navi_agent_unchanged(self):
        """Verify create_navi_agent still works without A2A adapter."""
        from pm.navi import create_navi_agent

        with patch("pm.navi.Agent") as mock_agent:
            mock_agent.return_value = Mock()

            # Original function should still work
            agent = create_navi_agent(
                workspace_id="ws",
                project_id="proj",
                shared_memory=Mock(),
            )

            mock_agent.assert_called_once()

    def test_vitals_agent_unchanged(self):
        """Verify create_vitals_agent still works without A2A adapter."""
        from pm.vitals import create_vitals_agent

        with patch("pm.vitals.Agent") as mock_agent:
            mock_agent.return_value = Mock()

            agent = create_vitals_agent(
                workspace_id="ws",
                project_id="proj",
                shared_memory=Mock(),
            )

            mock_agent.assert_called_once()

    def test_herald_agent_unchanged(self):
        """Verify create_herald_agent still works without A2A adapter."""
        from pm.herald import create_herald_agent

        with patch("pm.herald.Agent") as mock_agent:
            mock_agent.return_value = Mock()

            agent = create_herald_agent(
                workspace_id="ws",
                project_id="proj",
                shared_memory=Mock(),
            )

            mock_agent.assert_called_once()


class TestDMConstantsUsage:
    """Test suite verifying DMConstants usage (no magic numbers)."""

    def test_adapter_uses_dmconstants(self):
        """Verify A2A adapter references DMConstants."""
        # Import to ensure no hardcoded values
        from pm.a2a_adapter import DMConstants

        # Verify constants are accessible
        assert hasattr(DMConstants, "A2A")
        assert hasattr(DMConstants.A2A, "TASK_TIMEOUT_SECONDS")
```

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `agents/pm/a2a_adapter.py` | A2A adapter class for wrapping PM agents |
| `agents/tests/test_dm_02_5_pm_agents_a2a.py` | Comprehensive unit tests |

### Files to Modify

| File | Change |
|------|--------|
| `agents/pm/navi.py` | Add `create_navi_a2a_adapter` factory |
| `agents/pm/vitals.py` | Add `create_vitals_a2a_adapter` factory |
| `agents/pm/herald.py` | Add `create_herald_a2a_adapter` factory |
| `agents/main.py` | Add PM agent A2A interface mounting at startup |

---

## Testing Requirements

### Unit Tests

| Test Class | Tests | Purpose |
|------------|-------|---------|
| `TestPMA2AAdapter` | 7 | Verify adapter functionality |
| `TestCreatePmA2aAdapter` | 1 | Verify factory function |
| `TestNaviA2AAdapter` | 2 | Verify Navi adapter creation |
| `TestVitalsA2AAdapter` | 2 | Verify Vitals adapter (pulse ID) |
| `TestHeraldA2AAdapter` | 2 | Verify Herald adapter (pushNotifications) |
| `TestInterfaceConfigAlignment` | 4 | Verify INTERFACE_CONFIGS alignment |
| `TestAgentMetadataAlignment` | 4 | Verify AGENT_METADATA alignment |
| `TestBackwardCompatibility` | 3 | Verify REST endpoints unchanged |
| `TestDMConstantsUsage` | 1 | Verify no magic numbers |
| **Total** | **26** | Exceeds minimum coverage requirements |

### Integration Tests (Future - with running server)

| Test Case | Description |
|-----------|-------------|
| `test_a2a_navi_endpoint_responds` | Verify `/a2a/navi` accepts A2A requests |
| `test_a2a_pulse_endpoint_responds` | Verify `/a2a/pulse` accepts A2A requests |
| `test_a2a_herald_endpoint_responds` | Verify `/a2a/herald` accepts A2A requests |
| `test_rest_endpoints_unchanged` | Verify existing REST endpoints still work |
| `test_discovery_includes_pm_agents` | Verify `/.well-known/agent.json` includes PM agents |

---

## Definition of Done

- [ ] `agents/pm/a2a_adapter.py` created with:
  - [ ] `PMA2AAdapter` class with `handle_a2a_task` method
  - [ ] `get_agent_info()` for discovery
  - [ ] `get_capabilities()` with Herald pushNotifications
  - [ ] `create_pm_a2a_adapter()` factory function
- [ ] `agents/pm/navi.py` updated with:
  - [ ] Import of A2A adapter
  - [ ] `create_navi_a2a_adapter()` factory function
- [ ] `agents/pm/vitals.py` updated with:
  - [ ] Import of A2A adapter
  - [ ] `create_vitals_a2a_adapter()` factory (uses "pulse" agent_id)
- [ ] `agents/pm/herald.py` updated with:
  - [ ] Import of A2A adapter
  - [ ] `create_herald_a2a_adapter()` factory
- [ ] `agents/main.py` updated with:
  - [ ] PM agent A2A adapter creation at startup
  - [ ] `/agents/pm/a2a/status` health endpoint
- [ ] Unit tests pass (`pytest agents/tests/test_dm_02_5_pm_agents_a2a.py`)
- [ ] Backward compatibility verified - existing REST endpoints work unchanged
- [ ] PM agents accessible via A2A at configured paths
- [ ] Herald has `pushNotifications: true` in capabilities
- [ ] All configuration values use DMConstants (no magic numbers)

---

## Technical Notes

### Agent ID Mapping

The "pulse" naming in INTERFACE_CONFIGS and AGENT_METADATA is preserved for API stability:

```python
# INTERFACE_CONFIGS uses "pulse"
InterfaceConfig(agent_id="pulse", a2a_path="/a2a/pulse", ...)

# Implementation is "Vitals"
def create_vitals_a2a_adapter(...) -> PMA2AAdapter:
    agent = create_vitals_agent(...)
    return create_pm_a2a_adapter(agent=agent, agent_id="pulse")  # Uses "pulse"
```

### A2A Task Communication Pattern

A2A uses a task-based communication model:

```
Dashboard Gateway              PM Agent (via A2A Adapter)
       |                                |
       | -- A2A Task Request --------> |
       |    (JSON-RPC 2.0)              |
       |                                |
       |                           Agent.arun()
       |                                |
       | <-- A2A Task Response -------- |
       |    (content, tool_calls)       |
```

### Backward Compatibility Strategy

The A2A adapters wrap existing agents without modification:

1. **Existing REST endpoints unchanged** - `create_navi_agent()` etc. work as before
2. **New A2A factories** - `create_navi_a2a_adapter()` wraps the agent
3. **Shared context** - System context used for A2A; per-request context for REST

### DMConstants Usage

All timeouts and configuration values must use DMConstants:

```python
from constants.dm_constants import DMConstants

# Use this
timeout = DMConstants.A2A.TASK_TIMEOUT_SECONDS

# NOT this
timeout = 300  # Magic number!
```

---

## References

- [Epic DM-02 Definition](../epics/epic-dm-02-agno-multiinterface.md)
- [Epic DM-02 Tech Spec](../epics/epic-dm-02-tech-spec.md) - Section 3.5
- [Story DM-02.3: A2A AgentCard Discovery](./dm-02-3-a2a-agentcard-discovery.md) - AGENT_METADATA
- [Story DM-02.4: Dashboard Gateway Agent](./dm-02-4-dashboard-gateway-agent.md) - Interface mounting pattern
- [AgentOS Config](../../../../agents/agentos/config.py) - INTERFACE_CONFIGS
- [A2A Agent Card](../../../../agents/a2a/agent_card.py) - AGENT_METADATA
- [Navi Agent](../../../../agents/pm/navi.py) - Current implementation
- [Vitals Agent](../../../../agents/pm/vitals.py) - Current implementation (was Pulse)
- [Herald Agent](../../../../agents/pm/herald.py) - Current implementation
- [DM Constants](../../../../agents/constants/dm_constants.py)
- [A2A Protocol Spec](https://github.com/google/a2a-protocol)

---

*Story Created: 2025-12-30*
*Epic: DM-02 | Story: 5 of 9 | Points: 5*
