# Epic DM-04: Shared State & Real-Time

## Overview

Implement shared state synchronization between agents and the frontend using CopilotKit's `useCoAgentStateRender`. This enables real-time UI updates without explicit tool calls.

## Scope

### From Architecture Doc (Phase 4)

This epic implements Phase 4 of the Dynamic Module System architecture:
- Define shared state schemas
- Implement `useCoAgentStateRender` in frontend
- Agent state updates trigger UI changes
- Real-time widget updates

## Proposed Stories

### Story DM-04.1: State Schema Definition

Define TypeScript and Python state schemas:

- Create `DashboardState` schema (active widgets, layout)
- Create `ProjectContext` schema (current project, phase)
- Create `UserPreferences` schema (settings, filters)
- Ensure schema sync between TS and Python

**Acceptance Criteria:**
- Schemas defined in both languages
- Zod validators for TypeScript
- Pydantic models for Python
- Documentation for all fields

**Points:** 3

### Story DM-04.2: Frontend State Subscription

Implement `useCoAgentStateRender` for state sync:

- Create state subscription hooks
- Subscribe to `DashboardState` changes
- Subscribe to `ProjectContext` changes
- Handle state update events

**Acceptance Criteria:**
- State subscriptions active
- UI updates on state changes
- No unnecessary re-renders
- Error handling for disconnects

**Points:** 5

### Story DM-04.3: Agent State Emissions

Configure agents to emit state updates:

- Dashboard agent emits widget state
- PM agents emit project context
- State updates during task processing
- Incremental state updates

**Acceptance Criteria:**
- Agents emit state via AG-UI
- Frontend receives state updates
- Partial updates supported
- State versioning for conflicts

**Points:** 5

### Story DM-04.4: Real-Time Widget Updates

Widgets update automatically from state:

- Widget list driven by state
- Widget data updates in real-time
- Smooth transitions on updates
- Optimistic UI updates

**Acceptance Criteria:**
- Widgets reflect current state
- Updates appear within 500ms
- Transitions are smooth
- Optimistic updates for actions

**Points:** 8

### Story DM-04.5: State Persistence

Persist and restore state across sessions:

- Save widget layout to database
- Restore state on page load
- Sync state across tabs
- Handle state conflicts

**Acceptance Criteria:**
- State persists across refreshes
- Multi-tab sync working
- Conflicts resolved gracefully
- Migration for state schema changes

**Points:** 5

## Total Points: 26

## Dependencies

- DM-03 (Dashboard integration working)

## Technical Notes

### State Schema Example

```typescript
// apps/web/src/types/agent-state.ts
interface DashboardState {
  widgets: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { w: number; h: number };
    data: Record<string, unknown>;
  }>;
  layout: 'grid' | 'list' | 'compact';
  lastUpdated: string;
}
```

```python
# apps/agents/schemas/state.py
from pydantic import BaseModel

class DashboardState(BaseModel):
    widgets: list[WidgetState]
    layout: Literal['grid', 'list', 'compact']
    last_updated: datetime
```

### Key Files to Create/Modify

```
apps/web/src/
├── types/
│   └── agent-state.ts        # State type definitions
├── hooks/
│   └── useAgentState.ts      # State subscription hooks
└── components/
    └── dashboard/
        └── StatefulDashboard.tsx

apps/agents/
├── schemas/
│   └── state.py              # Python state schemas
└── dashboard.py              # State emission logic
```

## Risks

1. **State Explosion** - Large state may impact performance
2. **Race Conditions** - Concurrent updates need careful handling
3. **Storage Limits** - State persistence size limits

## Success Criteria

- Real-time state sync working
- < 100ms latency for state updates
- State persists across sessions
- Multi-tab sync functional

## References

- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [CopilotKit State Documentation](https://docs.copilotkit.ai/reference/hooks/useCoAgentStateRender)
