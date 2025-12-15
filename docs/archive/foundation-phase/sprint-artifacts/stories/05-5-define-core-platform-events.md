# Story 05-5: Define Core Platform Events

## Story

**As a** platform developer,
**I want** event handlers that respond to core platform events,
**So that** modules can react to system events and trigger downstream actions.

## Acceptance Criteria

- [ ] All event types from `EventTypes` constant have handlers or are documented
- [ ] Approval events trigger appropriate downstream actions
- [ ] Agent events integrated with AgentOS bridge
- [ ] Event payload interfaces properly typed
- [ ] Event documentation complete
- [ ] Handlers registered via @EventSubscriber decorator
- [ ] Handlers log structured event data for observability

## Technical Notes

### Events Already Defined in packages/shared/src/types/events.ts

- Approval events: APPROVAL_REQUESTED, APPROVAL_APPROVED, APPROVAL_REJECTED, APPROVAL_ESCALATED, APPROVAL_EXPIRED, APPROVAL_AUTO_APPROVED
- Agent events: AGENT_RUN_STARTED, AGENT_RUN_COMPLETED, AGENT_RUN_FAILED, AGENT_CONFIRMATION_REQUESTED, AGENT_CONFIRMATION_GRANTED, AGENT_CONFIRMATION_DENIED

### Implementation

1. Create ApprovalEventHandler with @EventSubscriber for approval events
2. Create AgentEventHandler with @EventSubscriber for agent events
3. Register handlers in respective modules
4. Ensure proper logging for audit trail

## Dependencies

- Story 05-3: Event subscriber decorator (completed)
- packages/shared: Event types already exported

## Status

- [x] Story drafted
- [x] Context generated
- [x] Implementation complete
- [x] Code review passed
- [x] Story done
