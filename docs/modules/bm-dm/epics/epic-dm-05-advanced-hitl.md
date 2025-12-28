# Epic DM-05: Advanced HITL & Streaming

## Overview

Implement Human-in-the-Loop (HITL) approval workflows and real-time feedback streaming using CopilotKit's advanced features. This epic enables secure blocking authorizations and live progress updates.

## Scope

### From Architecture Doc (Phase 5)

This epic implements Phase 5 of the Dynamic Module System architecture:
- Human-in-the-loop approval workflows
- Real-time feedback from A2A mesh to frontend
- Context awareness via `useCopilotReadable`
- Async task mapping for long-running operations

## Proposed Stories

### Story DM-05.1: HITL Tool Definition

Define human-in-the-loop tools in agents:

- Create `@tool(human_in_the_loop=True)` decorators
- Implement approval tools (contracts, actions)
- Configure tool pause/resume behavior
- Define approval response schemas

**Acceptance Criteria:**
- HITL tools pause for user input
- Approval schema well-defined
- Timeout handling for no response
- Cancel/reject handling

**Points:** 5

### Story DM-05.2: Frontend HITL Handlers

Implement `useHumanInTheLoop` handlers:

- Create approval UI components
- Implement `respond` callback handling
- Add approval confirmation dialogs
- Style approval components

**Acceptance Criteria:**
- HITL hooks intercept tool calls
- Approval UI renders correctly
- Respond callbacks work
- Approval state tracked

**Points:** 8

### Story DM-05.3: Approval Workflow Integration

Integrate HITL with existing approval system:

- Connect HITL to ApprovalQueue
- Map confidence levels to HITL
- Implement escalation paths
- Audit logging for approvals

**Acceptance Criteria:**
- HITL integrates with ApprovalQueue
- Confidence routing works
- Escalations trigger correctly
- All approvals audited

**Points:** 8

### Story DM-05.4: Real-Time Progress Streaming

Stream intermediate progress to frontend:

- A2A Task status updates via AG-UI
- Progress indicators during processing
- Partial result streaming
- Cancel/abort handling

**Acceptance Criteria:**
- Progress updates appear in real-time
- Partial results shown incrementally
- Cancel aborts processing
- Error states communicated

**Points:** 8

### Story DM-05.5: Long-Running Task Support

Handle multi-minute agent operations:

- A2A Task lifecycle management
- Background task polling
- Resume after disconnection
- Task history and status

**Acceptance Criteria:**
- Long tasks don't timeout
- Reconnection resumes progress
- Task history viewable
- Status persists across sessions

**Points:** 5

## Total Points: 34

## Dependencies

- DM-04 (Shared state for progress tracking)
- Foundation Approval system (Epic-05)

## Technical Notes

### HITL Tool Example

```python
from agno.tools import tool

@tool(human_in_the_loop=True)
def approve_budget_increase(project_id: str, amount: float) -> dict:
    """Request approval for budget increase."""
    return {
        "project_id": project_id,
        "amount": amount,
        "current_budget": get_current_budget(project_id)
    }
```

### Frontend Handler Example

```typescript
useHumanInTheLoop({
  name: "approve_budget_increase",
  render: ({ args, respond }) => (
    <BudgetApprovalDialog
      projectId={args.project_id}
      amount={args.amount}
      currentBudget={args.current_budget}
      onApprove={() => respond({ approved: true })}
      onReject={(reason) => respond({ approved: false, reason })}
    />
  )
});
```

### Key Files to Create/Modify

```
apps/web/src/
├── components/
│   └── hitl/
│       ├── ApprovalDialog.tsx
│       ├── BudgetApproval.tsx
│       ├── ContractApproval.tsx
│       └── ProgressIndicator.tsx
└── hooks/
    └── useApprovalHandlers.ts

apps/agents/
├── tools/
│   └── approval_tools.py
└── utils/
    └── task_manager.py
```

## Risks

1. **Approval Timeouts** - Users may not respond promptly
2. **State Consistency** - Approval state must sync correctly
3. **Security** - HITL must enforce proper authorization

## Success Criteria

- HITL workflows block until approved
- Progress streaming works in real-time
- Long-running tasks handle gracefully
- All approvals audited and secure

## References

- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [CopilotKit HITL Documentation](https://docs.copilotkit.ai/reference/hooks/useHumanInTheLoop)
- [Foundation Approval System](../../epics/EPIC-05)
