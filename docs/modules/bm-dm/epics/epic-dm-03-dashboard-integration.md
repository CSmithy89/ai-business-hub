# Epic DM-03: Dashboard Agent Integration

## Overview

Implement end-to-end integration between the Dashboard Gateway agent and the frontend Slot system. This epic proves out the full AG-UI to A2A to UI flow with a working dashboard pilot.

## Scope

### From Architecture Doc (Phase 3)

This epic implements Phase 3 of the Dynamic Module System architecture:
- Dashboard agent orchestration logic
- A2A inter-agent communication
- End-to-end flow verification
- Widget rendering from agent responses

## Proposed Stories

### Story DM-03.1: A2A Client Setup

Implement A2A client for inter-agent communication:

- Create A2A client wrapper utilities
- Configure client for PM agent connections
- Implement task creation and tracking
- Handle streaming responses

**Acceptance Criteria:**
- A2A client connects to PM agents
- Tasks created and tracked successfully
- Streaming responses processed
- Error handling for failed tasks

**Points:** 5

### Story DM-03.2: Dashboard Agent Orchestration

Implement dashboard agent logic for data gathering:

- Create `get_project_status` tool (calls PM agent via A2A)
- Create `get_health_summary` tool (calls Pulse agent via A2A)
- Create `get_recent_activity` tool (calls Herald agent via A2A)
- Implement intelligent tool selection

**Acceptance Criteria:**
- Dashboard agent delegates to specialist agents
- A2A Tasks complete successfully
- Data aggregated from multiple agents
- Proper error handling for agent failures

**Points:** 8

### Story DM-03.3: Widget Rendering Pipeline

Connect agent tool calls to frontend widget rendering:

- Dashboard agent yields `render_dashboard_widget` calls
- Frontend `useRenderToolCall` intercepts and renders
- Data flows from A2A response to widget props
- Loading states during agent processing

**Acceptance Criteria:**
- Agent tool calls render widgets
- Widget data matches agent response
- Loading indicators during processing
- Error widgets for failed renders

**Points:** 8

### Story DM-03.4: Dashboard Page Integration

Create a dedicated dashboard page with agent-driven widgets:

- Create `/dashboard` page with CopilotKit integration
- Implement widget grid layout
- Add chat interface for dashboard queries
- Persist widget preferences

**Acceptance Criteria:**
- Dashboard page renders agent widgets
- Chat queries trigger widget updates
- Grid layout responsive
- Widget preferences saved per user

**Points:** 8

### Story DM-03.5: End-to-End Testing

Comprehensive testing of the full flow:

- E2E tests for dashboard page
- Integration tests for A2A communication
- Unit tests for widget components
- Performance benchmarking

**Acceptance Criteria:**
- E2E tests cover happy path
- A2A communication tested
- Widget rendering tested
- Performance baseline established

**Points:** 5

## Total Points: 34

## Dependencies

- DM-01 (CopilotKit frontend)
- DM-02 (Agno multi-interface backend)

## Technical Notes

### Full Flow Diagram

```
User types "Show status" in Chat
    → CopilotKit sends to /agui endpoint
    → Dashboard Agent receives via AG-UI
    → Dashboard Agent creates A2A Task to PM Agent
    → PM Agent processes and returns result
    → Dashboard Agent yields Tool Call via AG-UI
    → Frontend useRenderToolCall renders the widget
```

### Key Files to Create/Modify

```
apps/web/src/
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           └── page.tsx       # Dashboard page
├── components/
│   └── dashboard/
│       ├── DashboardGrid.tsx
│       └── DashboardChat.tsx

apps/agents/
├── dashboard.py              # Orchestration logic
└── utils/
    └── a2a_client.py        # A2A client utilities
```

## Risks

1. **Latency** - Multiple A2A hops may add delay
2. **Error Propagation** - Errors from sub-agents need clear handling
3. **State Consistency** - Widget data must stay in sync

## Success Criteria

- Full flow works end-to-end
- Average response time < 3 seconds
- All PM agents accessible via A2A
- Dashboard usable for daily workflows

## References

- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [DM-01 Epic](./epic-dm-01-copilotkit-frontend.md)
- [DM-02 Epic](./epic-dm-02-agno-multiinterface.md)
