# BM-DM — Dynamic Module System

## Overview

The **Dynamic Module System (bm-dm)** is an infrastructure module that implements unified agent-to-user and agent-to-agent communication using industry-standard protocols. It transforms how HYVVE's agents interact with the frontend and each other.

**Module Type:** Infrastructure / Platform Core
**Status:** All 9 Phases Complete (Phase 9 = Observability & Testing)
**Total Scope:** 9 Epics | 58 Stories | 345 Points

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
| DM-03 | Dashboard Agent Integration | 3 | 5 | 34 | **Complete** |
| DM-04 | Shared State & Real-Time | 4 | 5 | 26 | **Complete** |
| DM-05 | Advanced HITL & Streaming | 5 | 5 | 34 | **Complete** |
| DM-06 | Contextual Intelligence | 6 | 6 | 42 | **Complete** |
| DM-07 | Infrastructure Stabilization | 7 | 5 | 29 | **Complete** |
| DM-08 | Quality & Performance Hardening | 8 | 7 | 35 | **Complete** |
| DM-09 | Observability & Testing | 9 | 8 | 50 | **Complete** |

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

### Phase 3: Integration (DM-03) ✅ Complete

End-to-end integration between Dashboard Gateway and frontend Slot system.

**Delivered (5 stories, 34 points):**
- A2A client for inter-agent communication with JSON-RPC 2.0
- Dashboard orchestration tools (get_project_status, get_health_summary, get_recent_activity)
- Widget rendering pipeline with Loading/Error state handling
- Dashboard page integration with responsive grid layout
- Comprehensive E2E, unit, and integration tests

**Key Files:**
- `agents/a2a/client.py` — A2A client implementation
- `agents/gateway/tools.py` — Dashboard orchestration tools
- `apps/web/src/components/slots/widgets/` — Widget components
- `apps/web/src/components/dashboard/` — Dashboard page components

### Phase 4: Shared State (DM-04) ✅ Complete

Shared state synchronization between agents and frontend for real-time updates.

**Delivered (5 stories, 26 points):**
- TypeScript/Python bidirectional state schemas with Zod and Pydantic
- Zustand store with CopilotKit state bridge (`useAgentStateSync`)
- Selector hooks for efficient widget re-renders
- Agent state emitter with debouncing and bulk updates
- State-driven widget wrappers with hybrid rendering mode
- Browser localStorage persistence with cross-tab sync

**Key Files:**
- `apps/web/src/lib/schemas/dashboard-state.ts` — TypeScript Zod schemas
- `agents/schemas/dashboard_state.py` — Python Pydantic models
- `apps/web/src/stores/dashboard-state-store.ts` — Zustand store
- `apps/web/src/hooks/use-agent-state-sync.ts` — State sync bridge
- `agents/gateway/state_emitter.py` — Agent state emitter
- `apps/web/src/components/slots/widgets/StateWidget.tsx` — State widgets

### Phase 5: Advanced Features (DM-05) ✅ Complete

Human-in-the-Loop approval workflows and real-time feedback streaming.

**Delivered (5 stories, 34 points):**
- HITL tool decorators with configurable confidence thresholds
- Frontend HITL handlers with CopilotKit's `renderAndWaitForResponse`
- Approval queue bridge for low-confidence actions (<60%)
- Real-time progress streaming for long-running tasks
- Task manager with timeout, cancellation, and retry support

**Key Files:**
- `agents/hitl/` - HITL decorators, approval bridge, task manager
- `apps/web/src/lib/hitl/` - Frontend HITL hooks and utilities
- `apps/web/src/components/hitl/` - HITL approval UI components
- `apps/web/src/components/progress/` - Task progress components
- `apps/web/src/lib/hooks/use-task-progress.ts` - Progress hooks

### Phase 6: Contextual Intelligence (DM-06) ✅ Complete

Deep context integration, Generative UI composition, and Universal Agent Mesh.

**Delivered (6 stories, 42 points):**
- Deep context providers exposing business, projects, tasks, users, permissions, and activity to CopilotKit
- Agent context consumption with ContextAwareInstructions and response hints
- Generative UI composition with dynamic layouts (single, split, grid, wizard)
- MCP tool integration with subprocess management and A2A bridge
- Universal Agent Mesh with registry, A2A discovery, and intelligent routing
- RAG context indexing with semantic search and event-driven sync

**Key Files:**
- `apps/web/src/lib/context/` — CopilotKit context hooks and providers
- `apps/web/src/lib/generative-ui/` — Layout types and useGenerativeLayout hook
- `apps/web/src/components/generative-ui/` — Dynamic layout components
- `agents/context/` — Context consumption with Pydantic models
- `agents/mcp/` — MCP client, config, and A2A bridge
- `agents/mesh/` — Agent registry, discovery, and router
- `agents/rag/` — Context indexer and sync service

### Phase 7: Infrastructure Stabilization (DM-07) ✅ Complete

Tech debt resolution and CI/CD reliability improvements.

**Delivered (5 stories, 29 points):**
- KB module SSR build fix (window.location → usePathname)
- Python test collection fixes (import paths, conftest.py, __init__.py)
- TypeScript test mock type fixes (custom jest.Mock types pattern)
- DM-02.9 status reconciliation and missing implementation notes
- Keyboard shortcut unification (CopilotChat as primary, DM_CONSTANTS usage)

**Key Fixes:**
- `apps/web/src/app/(dashboard)/kb/layout.tsx` — SSR-safe pathname check
- `agents/tests/conftest.py` — Proper Python import path configuration
- `agents/__init__.py` — Package marker for import resolution
- `apps/api/src/kb/verification/verification.service.spec.ts` — Mock type pattern
- `apps/web/src/components/copilot/CopilotKeyboardShortcut.tsx` — Unified shortcut
- `apps/web/src/components/keyboard/KeyboardShortcuts.tsx` — Legacy handler removed

**Tech Debt Resolved:**
- TD-01: KB SSR build errors
- TD-02: Python test collection failures
- TD-17: TypeScript test type mismatches
- TD-03: Story status inconsistencies
- TD-05: Keyboard shortcut conflicts
- TD-06: DM_CONSTANTS usage for shortcuts

### Phase 8: Quality & Performance Hardening (DM-08) ✅ Complete

Quality improvements and performance optimizations identified from tech debt analysis.

**Delivered (7 stories, 35 points):**
- Zod validation schemas for widget data at frontend boundary
- Dashboard data caching with staleness tracking and TTL expiration
- A2A rate limiting with configurable per-agent thresholds
- Async mock fixtures for pytest with Redis, A2A, and database mocks
- Widget type deduplication with shared TypeScript/Python definitions
- Zustand selector optimization with pre-computed state and shallow comparison
- Pydantic response parser validation for all PM agent responses

**Key Files:**
- `apps/web/src/lib/schemas/widget-schemas.ts` — Zod widget validation schemas
- `agents/services/cache.py` — Dashboard caching service
- `agents/services/rate_limiter.py` — A2A rate limiting
- `agents/tests/fixtures/` — Pytest async mocks (redis, a2a, database)
- `packages/shared/src/types/widget.ts` — Canonical widget type definitions
- `packages/shared/widget-types.json` — JSON for Python sync
- `apps/web/src/stores/dashboard-state-store.ts` — Pre-computed activeAlerts, MAX bounds
- `apps/web/src/hooks/use-dashboard-selectors.ts` — useShallow optimizations
- `agents/pm/schemas/` — Pydantic response validation (navi, pulse, herald)

**Performance Improvements:**
- Pre-computed `activeAlerts` eliminates filtering on every render
- MAX bounds prevent unbounded collection growth (50 alerts, 100 activities, 50 metrics, 20 tasks)
- `useShallow` comparison prevents unnecessary array/object re-renders
- Staleness-aware caching reduces redundant agent calls

### Phase 9: Observability & Testing (DM-09) ✅ Complete

Comprehensive observability infrastructure and end-to-end testing capabilities.

**Delivered (8 stories, 50 points):**
- OpenTelemetry distributed tracing with OTLP export to Jaeger
- Prometheus metrics exposition with custom registry and RequestTimer
- Playwright E2E infrastructure with page object models and fixtures
- Critical flow E2E tests for dashboard, approval queue, and streaming
- Percy visual regression tests for widgets and HITL components
- k6 load testing infrastructure for A2A endpoints and CCR routing
- CCR operational verification tests (70 integration tests)
- localStorage quota management with LRU cleanup and graceful degradation

**Key Files:**
- `agents/observability/` — OpenTelemetry tracing, metrics, decorators
- `agents/api/routes/metrics.py` — Prometheus /metrics endpoint
- `apps/web/tests/support/` — Playwright page objects and fixtures
- `apps/web/tests/e2e/critical-flows/` — Dashboard, approval, streaming tests
- `apps/web/tests/visual/` — Percy widget and HITL visual tests
- `tests/load/k6/` — k6 load test scenarios
- `agents/tests/integration/` — CCR operational tests
- `apps/web/src/lib/storage/quota-handler.ts` — localStorage quota utilities

**Infrastructure Additions:**
- Jaeger tracing via Docker Compose (`docker/docker-compose.yml`)
- Grafana dashboard (`docs/modules/bm-dm/dashboards/agentos-dashboard.json`)
- Percy CI workflow (`.github/workflows/visual.yml`)
- Load test CI workflow (`.github/workflows/load-test.yml`)

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
- **Stories:** [stories/](./stories/) (All 58 stories complete)

## Completion Summary

All 9 epics and 58 stories have been implemented:

1. ~~Draft stories for DM-01 from epic documentation~~ ✅
2. ~~Implement DM-01 (8 stories, 44 points)~~ ✅
3. ~~Context DM-02 epic and draft stories~~ ✅
4. ~~Implement DM-02 (9 stories, 51 points)~~ ✅
5. ~~Context DM-03 epic and draft stories~~ ✅
6. ~~Implement DM-03 (5 stories, 34 points)~~ ✅
7. ~~Context DM-04 epic and draft stories~~ ✅
8. ~~Implement DM-04 (5 stories, 26 points)~~ ✅
9. ~~Context DM-05 epic and draft stories~~ ✅
10. ~~Implement DM-05 (5 stories, 34 points)~~ ✅
11. ~~Context DM-06 epic and draft stories~~ ✅
12. ~~Implement DM-06 (6 stories, 42 points)~~ ✅
13. ~~Implement DM-07 (5 stories, 29 points)~~ ✅ *Tech Debt Stabilization*
14. ~~Implement DM-08 (7 stories, 35 points)~~ ✅ *Quality & Performance Hardening*
15. ~~Implement DM-09 (8 stories, 50 points)~~ ✅ *Observability & Testing*

**Total Delivered:** 345 story points across 58 stories in 9 epics.

## Related Documentation

- [MASTER-PLAN.md](../../MASTER-PLAN.md) — Overall vision and module system
- [Foundation Complete](../../archive/foundation-phase/FOUNDATION-COMPLETE.md) — Platform foundation this builds on
- [Core-PM PRD](../bm-pm/PRD.md) — PM module this integrates with
