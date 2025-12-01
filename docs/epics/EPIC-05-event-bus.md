# Epic 05: Event Bus Infrastructure

**Epic ID:** EPIC-05
**Status:** Ready for Development
**Priority:** P0 - Critical
**Phase:** Phase 4 - Event Bus & BYOAI

---

## Epic Overview

Implement Redis Streams-based event bus for cross-module communication with at-least-once delivery and 30-day retention.

### Business Value
The event bus enables loose coupling between modules, allowing components to react to changes without direct dependencies. This is essential for the modular architecture.

### Success Criteria
- [ ] Events can be published from any module
- [ ] Subscribers receive events reliably
- [ ] Failed events go to dead letter queue
- [ ] Events retained for 30 days
- [ ] Correlation IDs enable tracing

---

## Stories

### Story 05.1: Set Up Redis Streams Infrastructure

**Points:** 2
**Priority:** P0

**As a** developer
**I want** Redis Streams configured
**So that** events can be published and consumed

**Acceptance Criteria:**
- [ ] Configure Redis connection in NestJS
- [ ] Create `EventsModule` with streams setup
- [ ] Configure consumer groups
- [ ] Set retention policy (30 days)
- [ ] Create dead letter queue stream
- [ ] Add health check for Redis connection

**Configuration:**
```typescript
// Event stream: hyvve:events:{tenantId}
// DLQ stream: hyvve:dlq:{tenantId}
// Consumer group: hyvve-platform
```

---

### Story 05.2: Implement Event Publisher

**Points:** 2
**Priority:** P0

**As a** module developer
**I want** to publish events easily
**So that** other modules can react to changes

**Acceptance Criteria:**
- [ ] Create `EventPublisherService`
- [ ] Implement `publish(event: BaseEvent)` method
- [ ] Auto-generate event ID if not provided
- [ ] Add timestamp automatically
- [ ] Include tenant context
- [ ] Generate correlation ID if not provided
- [ ] Log published events

**Event Structure:**
```typescript
interface BaseEvent {
  id: string;
  type: string;          // e.g., "approval.requested"
  source: string;        // e.g., "platform"
  timestamp: string;     // ISO 8601
  correlationId?: string;
  tenantId: string;
  userId: string;
  version: string;       // "1.0"
  data: Record<string, any>;
}
```

---

### Story 05.3: Implement Event Subscriber

**Points:** 3
**Priority:** P0

**As a** module developer
**I want** to subscribe to events
**So that** I can react to changes in other modules

**Acceptance Criteria:**
- [ ] Create `@EventSubscriber()` decorator
- [ ] Implement consumer group reading
- [ ] Acknowledge processed events
- [ ] Handle subscription by event type pattern
- [ ] Support wildcards (e.g., `approval.*`)
- [ ] Provide event context to handler

**Usage:**
```typescript
@EventSubscriber('approval.granted')
async handleApprovalGranted(event: BaseEvent) {
  // Process event
}
```

---

### Story 05.4: Implement Retry and Dead Letter Queue

**Points:** 2
**Priority:** P0

**As a** platform
**I want** failed events to be retried
**So that** transient failures don't lose events

**Acceptance Criteria:**
- [ ] Track processing attempts per event
- [ ] Retry failed events up to 3 times
- [ ] Implement exponential backoff
- [ ] Move to DLQ after max retries
- [ ] Log failures with error details
- [ ] Create DLQ monitoring endpoint

**Retry Schedule:**
- 1st retry: 1 minute
- 2nd retry: 5 minutes
- 3rd retry: 30 minutes
- After 3 failures: Move to DLQ

---

### Story 05.5: Define Core Platform Events

**Points:** 2
**Priority:** P0

**As a** developer
**I want** well-defined platform events
**So that** integration is consistent

**Acceptance Criteria:**
- [ ] Create event type definitions in `packages/shared`
- [ ] Define events:
  - `approval.requested`
  - `approval.granted`
  - `approval.rejected`
  - `approval.expired`
  - `user.invited`
  - `user.joined`
  - `agent.started`
  - `agent.completed`
  - `agent.error`
- [ ] Create TypeScript interfaces for each event
- [ ] Document event payloads

---

### Story 05.6: Implement Event Replay

**Points:** 2
**Priority:** P2

**As an** admin
**I want** to replay events from a specific time
**So that** I can recover from failures

**Acceptance Criteria:**
- [ ] Create admin endpoint for replay
- [ ] Accept time range parameters
- [ ] Filter by event type
- [ ] Re-publish events with replay flag
- [ ] Track replay progress
- [ ] Log replay operations

---

### Story 05.7: Create Event Monitoring Dashboard

**Points:** 2
**Priority:** P1

**As an** admin
**I want** to monitor event flow
**So that** I can detect issues

**Acceptance Criteria:**
- [ ] Create admin page for event monitoring
- [ ] Show event throughput metrics
- [ ] Show DLQ size and contents
- [ ] Allow DLQ event inspection
- [ ] Allow DLQ event retry
- [ ] Show consumer group lag

---

## Dependencies

- Epic 00: Project Scaffolding
- Epic 03: RBAC & Multi-tenancy (for tenant context)

## Technical Notes

### Event Naming Convention
```
{module}.{entity}.{action}

Examples:
- approval.requested
- crm.contact.created
- content.article.published
```

### Redis Configuration
- Use Upstash for serverless Redis
- Or Railway Redis for dedicated instance
- Configure connection pool size

---

_Epic created: 2025-11-30_
_PRD Reference: FR-5 Event Bus_
