# BM-DM — Dynamic Module System

## Overview

The **Dynamic Module System (bm-dm)** is an infrastructure module that implements unified agent-to-user and agent-to-agent communication using industry-standard protocols. It transforms how HYVVE's agents interact with the frontend and each other.

**Module Type:** Infrastructure / Platform Core
**Status:** Phase 1-2 Complete, Phase 3 Ready
**Total Scope:** 6 Epics | 38 Stories | 231 Points

## Purpose

BM-DM enables:

1. **Generative UI** — Agents can render React components dynamically in the frontend via CopilotKit
2. **Agent-to-Agent Communication** — Agents discover and delegate tasks to each other via Google's A2A protocol
3. **External Tool Integration** — Agents access external tools (GitHub, Brave, etc.) via MCP bridges
4. **Intelligent Model Routing** — CCR (Claude Code Router) for task-based LLM selection with BYOAI hybrid mode

## Protocol Stack

| Protocol | Direction | Purpose | Support |
|----------|-----------|---------|---------|
| **AG-UI** | Frontend ↔ Agent | Generative UI, streaming | Native in Agno |
| **A2A** | Agent ↔ Agent | Task delegation, discovery | Native in Agno (Google standard) |
| **MCP** | Agent ↔ External Tools | GitHub, Brave, custom tools | Via bridge/adapters |

## Key Technologies

- **CopilotKit** — Generative UI framework with `useRenderToolCall` for dynamic widget rendering
- **Agno AgentOS** — Multi-interface agent runtime supporting AG-UI + A2A simultaneously
- **AG-UI Protocol** — Agent-to-User communication standard
- **A2A Protocol** — Google's Agent-to-Agent communication standard
- **MCP** — Model Context Protocol for tool integration
- **CCR (Claude Code Router)** — Intelligent model routing with fallback chains

## Architecture Reference

- **Primary:** [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- **Secondary:** [Remote Coding Agent Patterns](../../architecture/remote-coding-agent-patterns.md) (CCR integration)

## Epic Summary

| Epic | Name | Phase | Stories | Points | Status |
|------|------|-------|---------|--------|--------|
| DM-01 | CopilotKit Frontend Infrastructure | 1 | 8 | 44 | **Complete** |
| DM-02 | Agno Multi-Interface Backend | 2 | 9 | 51 | **Complete** |
| DM-03 | Dashboard Agent Integration | 3 | 5 | 34 | Backlog |
| DM-04 | Shared State & Real-Time | 4 | 5 | 26 | Backlog |
| DM-05 | Advanced HITL & Streaming | 5 | 5 | 34 | Backlog |
| DM-06 | Contextual Intelligence | 6 | 6 | 42 | Backlog |

## Phase Overview

### Phase 1: Frontend Infrastructure (DM-01) ✅ Complete

Installed and configured CopilotKit with AG-UI protocol support for Generative UI capabilities.

**Delivered (8 stories, 44 points):**
- CopilotKit provider with Zustand chat state management
- Slot system with `DashboardSlots` and widget registry
- Base widget components (ProjectStatus, TaskList, Metrics, Alert, Activity)
- CopilotKit Chat integration with AG-UI endpoints
- Context providers for business, projects, and tasks
- CCR routing settings UI with mode selection and fallback chains
- CCR connection status with health monitoring
- CCR quota display with usage progress bars

**Key Files:**
- `apps/web/src/lib/copilotkit/` — CopilotKit configuration
- `apps/web/src/components/slots/` — Slot system and widgets
- `apps/web/src/components/chat/` — Chat panel integration
- `apps/web/src/components/settings/` — CCR config components
- `apps/web/src/hooks/` — CCR hooks (useCCRRouting, useCCRStatus, useCCRQuota)

### Phase 2: Backend Infrastructure (DM-02) ✅ Complete

Configured AgentOS with native AG-UI and A2A protocol support for multi-interface access.

**Delivered (9 stories, 51 points):**
- Agno protocol dependencies (AG-UI, A2A SDK)
- AgentOS multi-interface runtime with AG-UI + A2A endpoints
- A2A AgentCard discovery at `/.well-known/agent.json`
- Dashboard Gateway agent with protocol routing
- Existing agent protocol updates (Navi, Sage, Chrono, Scribe)
- CCR installation configuration with health checking
- CCR-Agno integration with CCRModel provider
- Task-based routing with keyword classification
- Usage monitoring with quota alerts

**Key Files:**
- `agents/main.py` — Multi-interface AgentOS entry point
- `agents/models/ccr_provider.py` — CCRModel extending OpenAIChat
- `agents/models/task_classifier.py` — Task type classification
- `agents/services/ccr_health.py` — CCR health checking service
- `agents/services/ccr_usage.py` — Usage tracking and alerts
- `agents/gateway/agent.py` — Dashboard Gateway agent
- `agents/constants/dm_constants.py` — All routing constants

### Phase 3: Integration (DM-03)
End-to-end integration between Dashboard Gateway and frontend Slot system.

**Key Deliverables:**
- A2A inter-agent communication
- Dashboard orchestration logic
- Widget rendering pipeline
- E2E testing

### Phase 4: Shared State (DM-04)
Shared state synchronization between agents and frontend for real-time updates.

### Phase 5: Advanced Features (DM-05)
Human-in-the-Loop approval workflows and real-time feedback streaming.

### Phase 6: Contextual Intelligence (DM-06)
Bidirectional knowledge sync, Generative UI composition, and Universal Agent Mesh.

## Dependencies

```
DM-01 (Frontend)
    ↓
DM-02 (Backend)
    ↓
DM-03 (Integration)
    ↓
DM-04 (State)
    ↓
DM-05 (HITL) ← Foundation Approval System (already built)
    ↓
DM-06 (Intelligence) ← KB-02 (RAG infrastructure, already built)
```

## The "Slot System" Pattern

Instead of a custom component registry, bm-dm uses CopilotKit's Generative UI:

1. Agent calls a "tool" → `render_widget` with widget type and data
2. Frontend `useRenderToolCall` hook intercepts the tool call
3. Renders the appropriate React component with provided data

This allows agents to dynamically render any registered widget without frontend changes.

## Multi-Interface Agent Pattern

Agno's superpower is running the same agent with multiple protocol interfaces:

```python
agent_os = AgentOS(
    agents=[dashboard_agent],
    interfaces=[
        AGUI(agent=dashboard_agent),  # /agui - for frontend
        A2A(agent=dashboard_agent),   # /a2a - for other agents
    ]
)
```

One agent, multiple protocols = maximum interoperability.

## Sprint Tracking

- **Sprint Status:** [sprint-status.yaml](./sprint-status.yaml)
- **Epic Details:** [epics/](./epics/)
- **Stories:** [stories/](./stories/) (DM-01, DM-02 complete)

## Next Steps

1. ~~Draft stories for DM-01 from epic documentation~~ ✅
2. ~~Implement DM-01 (8 stories, 44 points)~~ ✅
3. ~~Context DM-02 epic and draft stories~~ ✅
4. ~~Implement DM-02 (9 stories, 51 points)~~ ✅
5. Context DM-03 epic and draft stories
6. Begin Phase 3: Dashboard Agent Integration with A2A client setup

## Related Documentation

- [MASTER-PLAN.md](../../MASTER-PLAN.md) — Overall vision and module system
- [Foundation Complete](../../archive/foundation-phase/FOUNDATION-COMPLETE.md) — Platform foundation this builds on
- [Core-PM PRD](../bm-pm/PRD.md) — PM module this integrates with
