# Epic DM-02: Agno Multi-Interface Backend

## Overview

Configure AgentOS with native AG-UI and A2A protocol support, enabling agents to be accessed via multiple interfaces simultaneously. This epic establishes the backend infrastructure for the Dynamic Module System.

## Scope

### From Architecture Doc (Phase 2)

This epic implements Phase 2 of the Dynamic Module System architecture:
- Install Agno AG-UI and A2A dependencies
- Configure AgentOS with multi-interface support
- Update existing agents for protocol compatibility
- Set up A2A discovery endpoints

## Proposed Stories

### Story DM-02.1: Agno Protocol Dependencies

Install and configure Agno protocol support:

- Install `agno[agui,a2a]` or individual packages
- Verify `ag-ui-protocol` and `a2a-sdk` installation
- Update `pyproject.toml` with new dependencies
- Test basic protocol imports

**Acceptance Criteria:**
- All protocol packages installed successfully
- Imports work without errors
- Version compatibility verified
- Development environment updated

**Points:** 2

### Story DM-02.2: AgentOS Multi-Interface Setup

Configure AgentOS to expose multiple interfaces:

- Update `agents/main.py` with interface configuration
- Configure AGUI interface for frontend communication
- Configure A2A interface for inter-agent communication
- Set up interface routing paths

**Acceptance Criteria:**
- AgentOS starts with both interfaces
- `/agui` endpoint responds to AG-UI requests
- `/a2a` endpoint responds to A2A requests
- Both interfaces serve same agent

**Points:** 5

### Story DM-02.3: A2A AgentCard Discovery

Implement A2A discovery endpoints:

- Configure `/.well-known/agent.json` endpoint
- Generate AgentCard with capabilities
- Include skill definitions from agent tools
- Add streaming and notification capabilities

**Acceptance Criteria:**
- AgentCard endpoint returns valid JSON-LD
- All agent skills listed correctly
- Capabilities accurately described
- External agents can discover via endpoint

**Points:** 3

### Story DM-02.4: Dashboard Gateway Agent

Create the Dashboard Gateway agent with multi-protocol support:

- Create `agents/dashboard.py` with gateway agent
- Implement `render_dashboard_widget` tool
- Configure for AG-UI frontend access
- Configure for A2A backend coordination

**Acceptance Criteria:**
- Dashboard agent accessible via AG-UI
- Dashboard agent accessible via A2A
- Tool calls properly serialized
- Agent handles both text and tool responses

**Points:** 8

### Story DM-02.5: Existing Agent Protocol Updates

Update existing PM agents for A2A compatibility:

- Add A2A interface to Navi agent
- Add A2A interface to Pulse agent
- Add A2A interface to Herald agent
- Ensure backward compatibility with current API

**Acceptance Criteria:**
- PM agents respond to A2A Tasks
- Existing REST endpoints still work
- Agent responses properly formatted
- No breaking changes to current flows

**Points:** 8

### Story DM-02.6: CCR Installation & Configuration

Install and configure Claude Code Router (CCR) for intelligent model routing:

- Clone and set up CCR-custom fork (VisionCraft3r/ccr-custom)
- Configure `~/.claude-code-router/config.json` with providers
- Set up CLI subscription connections (Claude, Codex, Gemini)
- Configure fallback chains for provider failures
- Test CCR proxy startup and health checks

**Acceptance Criteria:**
- CCR starts successfully on configured port (default 3456)
- Provider connections verified
- Fallback chains trigger correctly on failure
- Health endpoint responds with provider status

**Points:** 5

### Story DM-02.7: CCR-Agno Integration

Integrate Agno agents with CCR routing layer:

- Create `agents/models/ccr_provider.py` for CCR model wrapper
- Update agent model selection to support CCR routing
- Implement hybrid mode (CCR vs BYOAI per agent)
- Add CCR connection health checks to agent startup

**Acceptance Criteria:**
- Agents can route through CCR
- Hybrid mode allows per-agent BYOAI or CCR
- CCR failures trigger BYOAI fallback
- Agent startup validates CCR connection

**Points:** 5

### Story DM-02.8: CCR Task-Based Routing

Configure intelligent task-based routing through CCR:

- Define routing rules (reasoning → Claude, code → DeepSeek, etc.)
- Configure BMAD agent detection for per-agent routing
- Set up transformer chains for provider compatibility
- Test routing decisions match expectations

**Acceptance Criteria:**
- Tasks route to appropriate providers by type
- Per-agent model overrides work
- Transformers correctly adapt request/response formats
- Routing decisions logged for debugging

**Points:** 5

### Story DM-02.9: CCR Usage Monitoring & Alerts

Implement usage tracking and quota notifications for CCR:

- Create usage tracking service for CCR calls
- Implement quota threshold detection
- Configure notifications for low quota alerts
- Add usage metrics to monitoring dashboard

**Acceptance Criteria:**
- API calls tracked per provider
- Alerts trigger at configurable thresholds (e.g., 80%, 95%)
- Notifications sent via configured channels
- Usage data available in metrics endpoint

**Points:** 5

## Total Points: 51

## Dependencies

- DM-01 (for end-to-end testing with frontend)

## Technical Notes

### Key Files to Create/Modify

```
apps/agents/
├── main.py                    # AgentOS multi-interface config
├── dashboard.py               # Dashboard Gateway agent
├── pm/
│   ├── navi.py               # Add A2A interface
│   ├── pulse.py              # Add A2A interface
│   └── herald.py             # Add A2A interface
└── interfaces/
    └── config.py             # Interface configuration
```

### AgentOS Configuration Example

```python
from agno.os import AgentOS
from agno.os.interfaces.agui import AGUI
from agno.os.interfaces.a2a import A2A

agent_os = AgentOS(
    agents=[dashboard_agent, navi_agent, pulse_agent],
    interfaces=[
        AGUI(agent=dashboard_agent, path="/agui"),
        A2A(agent=dashboard_agent, path="/a2a/dashboard"),
        A2A(agent=navi_agent, path="/a2a/navi"),
        A2A(agent=pulse_agent, path="/a2a/pulse"),
    ]
)
```

## Technical Requirements (Lessons from PM-08/PM-12)

### Constants (Define Before Implementation)

All magic numbers MUST be defined as constants in a dedicated file:

```python
# agents/constants/dm_constants.py

class DMConstants:
    """Dynamic Module System constants - no magic numbers in code."""

    # AgentOS Configuration
    class AGENTCOS:
        DEFAULT_PORT = 8000
        WORKER_COUNT = 4
        REQUEST_TIMEOUT_SECONDS = 30
        KEEP_ALIVE_SECONDS = 65
        MAX_CONCURRENT_TASKS = 100

    # A2A Protocol
    class A2A:
        TASK_TIMEOUT_SECONDS = 300
        MAX_TASK_QUEUE_SIZE = 1000
        AGENT_DISCOVERY_CACHE_TTL_SECONDS = 300
        HEARTBEAT_INTERVAL_SECONDS = 30
        MAX_MESSAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

    # AG-UI Protocol
    class AGUI:
        STREAM_CHUNK_SIZE_BYTES = 4096
        MAX_STREAM_DURATION_SECONDS = 600
        TOOL_CALL_TIMEOUT_SECONDS = 60
        MAX_TOOL_CALLS_PER_REQUEST = 50

    # CCR Configuration
    class CCR:
        DEFAULT_PORT = 3456
        HEALTH_CHECK_INTERVAL_SECONDS = 30
        PROVIDER_TIMEOUT_SECONDS = 60
        MAX_RETRIES = 3
        RETRY_BACKOFF_MULTIPLIER = 2.0
        QUOTA_WARNING_THRESHOLD = 0.8
        QUOTA_CRITICAL_THRESHOLD = 0.95

    # Dashboard Agent
    class DASHBOARD:
        MAX_WIDGETS_PER_REQUEST = 12
        WIDGET_DATA_TTL_SECONDS = 60
        CACHE_SIZE_MB = 100
        CONCURRENT_AGENT_CALLS = 5

    # Performance
    class PERFORMANCE:
        P50_RESPONSE_TARGET_MS = 200
        P95_RESPONSE_TARGET_MS = 500
        P99_RESPONSE_TARGET_MS = 1000
        MAX_MEMORY_MB = 512
```

### Rate Limiting Requirements

Backend endpoints need rate limiting for compute-intensive operations:

| Endpoint | Rate Limit | Burst | Rationale |
|----------|------------|-------|-----------|
| `/agui` | 100/min | 30 | Streaming is expensive |
| `/a2a` | 200/min | 50 | Inter-agent communication |
| `/.well-known/agent.json` | 60/min | 20 | Discovery polling |
| CCR proxy | 1000/min | 200 | High-volume model calls |
| Dashboard agent | 60/min | 20 | Orchestration overhead |

**Implementation Pattern:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/agui")
@limiter.limit("100/minute")
async def agui_endpoint(request: Request):
    ...
```

### Performance Budgets

| Metric | Target | Critical | Measurement |
|--------|--------|----------|-------------|
| **A2A Task Latency (P50)** | <200ms | <500ms | Task completion time |
| **A2A Task Latency (P95)** | <500ms | <1000ms | Task completion time |
| **AG-UI Time to First Token** | <100ms | <300ms | Stream start |
| **AgentCard Discovery** | <50ms | <100ms | JSON response time |
| **Memory per Agent** | <100MB | <200MB | Heap measurement |
| **Concurrent Tasks** | >50 | >20 | Load test |

**Monitoring:**
- Prometheus metrics for all endpoints
- Grafana dashboards for latency percentiles
- Alert on P95 > critical threshold

### Agent Naming Conventions (Finalized)

To avoid PM-12's mid-flight rename scenario, agent names are finalized HERE:

| Agent | Internal Name | Display Name | A2A Endpoint |
|-------|--------------|--------------|--------------|
| Dashboard Gateway | `dashboard_gateway` | Gateway | `/a2a/dashboard` |
| Orchestrator | `dm_orchestrator` | Conductor | `/a2a/conductor` |
| Widget Renderer | `widget_renderer` | Canvas | `/a2a/canvas` |

**DO NOT rename these after implementation begins.**

### N+1 Query Prevention

From PM-08 lessons, prevent N+1 patterns:

```python
# BAD - N+1 query in loop
for widget in widgets:
    data = await fetch_widget_data(widget.id)  # N queries

# GOOD - Batch fetch
widget_ids = [w.id for w in widgets]
data_map = await fetch_widget_data_batch(widget_ids)  # 1 query
for widget in widgets:
    data = data_map.get(widget.id)
```

**Code Review Checklist Item:** Verify no database calls inside loops.

### Authentication & Authorization

- All A2A endpoints require service-to-service auth tokens
- AG-UI endpoints inherit existing BYOAI authentication
- CCR proxy validates per-agent permissions
- Dashboard agent verifies workspace membership before data access

### Error Handling Standards

```python
from agno.errors import AgentError, TaskError

class DMError(AgentError):
    """Base error for DM module."""
    pass

class WidgetRenderError(DMError):
    """Widget rendering failed."""
    code = "DM_WIDGET_RENDER_ERROR"

class A2ATimeoutError(DMError):
    """A2A task timed out."""
    code = "DM_A2A_TIMEOUT"

# Always include error codes for debugging
try:
    result = await agent.run(task)
except TaskError as e:
    logger.error(f"Task failed: {e.code}", extra={"task_id": task.id})
    raise DMError(f"Agent task failed: {e.code}")
```

### Testing Requirements

- Unit tests for all agent tools (pytest)
- Integration tests for A2A protocol flows
- Load tests for concurrent task handling
- Contract tests for AgentCard schema
- Mock CCR for unit tests

### Observability Requirements

```python
# Structured logging
import structlog
logger = structlog.get_logger()

# Required log fields
logger.info(
    "a2a_task_completed",
    task_id=task.id,
    agent=agent.name,
    duration_ms=duration,
    status="success",
)

# Metrics
from prometheus_client import Counter, Histogram

a2a_tasks_total = Counter(
    "dm_a2a_tasks_total",
    "Total A2A tasks",
    ["agent", "status"]
)
a2a_task_duration = Histogram(
    "dm_a2a_task_duration_seconds",
    "A2A task duration",
    ["agent"]
)
```

## Risks

1. **Protocol Version Compatibility** - Agno, AG-UI, A2A versions must align
2. **Performance Overhead** - Multiple interfaces may add latency
3. **Authentication** - Must integrate with existing BYOAI auth
4. **N+1 Queries** - Dashboard aggregation must batch database calls
5. **Memory Pressure** - Multiple agents running simultaneously

## Success Criteria

- All agents accessible via appropriate protocols
- A2A discovery working for external agents
- No regressions in existing agent functionality
- Documentation updated with new endpoints

## References

- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [Remote Coding Agent Patterns (CCR Section)](../../architecture/remote-coding-agent-patterns.md)
- [CCR-Custom Fork](https://github.com/VisionCraft3r/ccr-custom)
- [Agno Documentation](https://docs.agno.com)
- [A2A Protocol Spec](https://github.com/google/a2a-protocol)
