# Dynamic Module System (bm-dm) - Epic Index

## Overview

The Dynamic Module System implements the "Unified Protocol" architecture using Agno's native multi-protocol support (AG-UI + A2A) combined with CopilotKit for Generative UI.

**Total: 6 Epics | 31 Stories | 188 Points**

## Architecture Reference

- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md) - Primary (AG-UI, A2A, CopilotKit)
- [Remote Coding Agent Patterns](../../architecture/remote-coding-agent-patterns.md) - CCR Integration (DM-01.6-8, DM-02.6-9)

## Epic Summary

| Epic | Name | Phase | Stories | Points | Status |
| --- | --- | --- | --- | --- | --- |
| DM-01 | CopilotKit Frontend Infrastructure | 1 | 5 | 26 | Backlog |
| DM-02 | Agno Multi-Interface Backend | 2 | 5 | 26 | Backlog |
| DM-03 | Dashboard Agent Integration | 3 | 5 | 34 | Backlog |
| DM-04 | Shared State & Real-Time | 4 | 5 | 26 | Backlog |
| DM-05 | Advanced HITL & Streaming | 5 | 5 | 34 | Backlog |
| DM-06 | Contextual Intelligence | 6 | 6 | 42 | Backlog |

## Phase 1: Frontend Infrastructure

### [DM-01: CopilotKit Frontend Infrastructure](./epic-dm-01-copilotkit-frontend.md)

Install and configure CopilotKit with AG-UI protocol support to enable Generative UI capabilities.

**Key Deliverables:**
- CopilotKit provider configuration
- Slot system using `useRenderToolCall`
- Base widget components
- Context providers via `useCopilotReadable`

## Phase 2: Backend Infrastructure

### [DM-02: Agno Multi-Interface Backend](./epic-dm-02-agno-multiinterface.md)

Configure AgentOS with native AG-UI and A2A protocol support for multi-interface access.

**Key Deliverables:**
- AgentOS multi-interface setup
- A2A AgentCard discovery endpoints
- Dashboard Gateway agent
- Protocol updates for existing agents

## Phase 3: Integration

### [DM-03: Dashboard Agent Integration](./epic-dm-03-dashboard-integration.md)

End-to-end integration between Dashboard Gateway and frontend Slot system.

**Key Deliverables:**
- A2A inter-agent communication
- Dashboard orchestration logic
- Widget rendering pipeline
- E2E testing

## Phase 4: Shared State

### [DM-04: Shared State & Real-Time](./epic-dm-04-shared-state.md)

Shared state synchronization between agents and frontend for real-time updates.

**Key Deliverables:**
- State schema definitions
- Frontend state subscriptions
- Agent state emissions
- State persistence

## Phase 5: Advanced Features

### [DM-05: Advanced HITL & Streaming](./epic-dm-05-advanced-hitl.md)

Human-in-the-Loop approval workflows and real-time feedback streaming.

**Key Deliverables:**
- HITL tool definitions
- Approval UI components
- Progress streaming
- Long-running task support

## Phase 6: Contextual Intelligence

### [DM-06: Contextual Intelligence](./epic-dm-06-contextual-intelligence.md)

Bidirectional knowledge sync, Generative UI composition, and Universal Agent Mesh.

**Key Deliverables:**
- Deep context providers
- Generative UI layouts
- MCP tool integration
- Universal Agent Mesh

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
DM-05 (HITL) ← Foundation Approval System
    ↓
DM-06 (Intelligence) ← KB-02 (RAG)
```

## Protocol Overview

| Protocol | Purpose | Agno Support |
| --- | --- | --- |
| AG-UI | Frontend ↔ Agent | Native |
| A2A | Agent ↔ Agent | Native |
| MCP | Agent ↔ Tools | Via bridge |

## Key Technologies

- **CopilotKit** - Generative UI framework
- **Agno AgentOS** - Multi-interface agent runtime
- **AG-UI Protocol** - Agent-to-User communication
- **A2A Protocol** - Agent-to-Agent communication (Google standard)
- **MCP** - Model Context Protocol for tool integration
- **CCR (Claude Code Router)** - Intelligent model routing and BYOAI hybrid mode
