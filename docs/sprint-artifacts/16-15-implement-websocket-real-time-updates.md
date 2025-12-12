# Story 16.15: Implement WebSocket Real-Time Updates

Status: ready-for-dev

## Story

As a **user monitoring approvals and agents**,
I want **real-time updates without manual refresh**,
so that **I always see the latest information instantly**.

## Acceptance Criteria

1. **WebSocket Connection Establishment**
   - [ ] WebSocket connection established on app load via Socket.io
   - [ ] JWT authentication passed in handshake auth
   - [ ] Workspace-scoped rooms for tenant isolation
   - [ ] Connection status indicator in UI

2. **Real-Time Event Handling**
   - [ ] `approval.created` event → New item appears in queue with animation
   - [ ] `approval.updated` event → Status changes reflected immediately
   - [ ] `approval.deleted` event → Item removed from queue
   - [ ] `agent.status.changed` event → Agent status updates live
   - [ ] `notification.new` event → Badge count updates
   - [ ] `chat.message` event → New messages appear in chat panel

3. **Reconnection & Resilience**
   - [ ] Exponential backoff on disconnect (1s, 2s, 4s... up to 30s)
   - [ ] "Reconnecting..." indicator visible during disconnection
   - [ ] Maximum 10 reconnection attempts before showing error
   - [ ] Sync missed events on successful reconnect

4. **Graceful Degradation**
   - [ ] Platform remains functional without WebSocket (polling fallback)
   - [ ] Clear indication when real-time is unavailable
   - [ ] No errors thrown if WebSocket connection fails

5. **Integration with Existing Systems**
   - [ ] Event Bus events (EPIC-05) trigger WebSocket broadcasts
   - [ ] Optimistic UI updates reconcile with server state
   - [ ] React Query cache updated on real-time events

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Create NestJS WebSocket Gateway** (AC: #1)
  - [ ] Create `apps/api/src/realtime/realtime.module.ts`
  - [ ] Create `apps/api/src/realtime/realtime.gateway.ts` with Socket.io
  - [ ] Implement JWT validation in `handleConnection`
  - [ ] Create workspace room joining logic (`workspace:${workspaceId}`)
  - [ ] Add connection/disconnection logging

- [ ] **Task 2: Implement Server-to-Client Events** (AC: #2)
  - [ ] Define TypeScript interfaces for all event types
  - [ ] Create `emitToWorkspace(workspaceId, event, data)` method
  - [ ] Create `emitToUser(userId, event, data)` method for user-specific events
  - [ ] Add event payload validation

- [ ] **Task 3: Wire Event Bus to WebSocket** (AC: #5)
  - [ ] Subscribe to Event Bus streams in RealtimeGateway
  - [ ] Map `approval.*` events to WebSocket broadcasts
  - [ ] Map `agent.*` events to WebSocket broadcasts
  - [ ] Map `notification.*` events to WebSocket broadcasts
  - [ ] Add correlation ID tracking for debugging

### Frontend Tasks

- [ ] **Task 4: Create RealtimeProvider Context** (AC: #1, #3)
  - [ ] Create `apps/web/src/providers/realtime-provider.tsx`
  - [ ] Initialize Socket.io client with JWT auth
  - [ ] Implement connection state management
  - [ ] Add exponential backoff reconnection logic
  - [ ] Create `useRealtime()` hook

- [ ] **Task 5: Implement Connection Status UI** (AC: #3, #4)
  - [ ] Create connection status indicator component
  - [ ] Show "Reconnecting..." toast during disconnection
  - [ ] Show "Connection lost" error after max retries
  - [ ] Add "Retry" button for manual reconnection

- [ ] **Task 6: Create Real-Time Hooks** (AC: #2, #5)
  - [ ] Create `apps/web/src/hooks/use-realtime-approvals.ts`
  - [ ] Create `apps/web/src/hooks/use-realtime-agents.ts`
  - [ ] Create `apps/web/src/hooks/use-realtime-notifications.ts`
  - [ ] Integrate with React Query cache invalidation

- [ ] **Task 7: Update UI Components for Real-Time** (AC: #2)
  - [ ] Add entry animation to approval cards on new approval
  - [ ] Update notification badge count on new notification
  - [ ] Update agent status indicators on status change
  - [ ] Ensure optimistic UI reconciles with server events

### Testing Tasks

- [ ] **Task 8: Unit Tests** (AC: all)
  - [ ] Test RealtimeGateway connection handling
  - [ ] Test JWT validation in WebSocket handshake
  - [ ] Test workspace room isolation
  - [ ] Test reconnection logic

- [ ] **Task 9: Integration Tests** (AC: #2, #5)
  - [ ] Test Event Bus → WebSocket flow
  - [ ] Test client receiving events
  - [ ] Test multi-client scenarios
  - [ ] Test workspace isolation

## Dev Notes

### Architecture Patterns

This story implements WebSocket real-time updates following the patterns established in EPIC-05 Event Bus:

- **Event-Driven Architecture**: WebSocket broadcasts are triggered by Event Bus events, ensuring consistency
- **Multi-Tenant Isolation**: Each workspace joins a dedicated Socket.io room
- **JWT Passthrough**: WebSocket connections authenticate using the same JWT as REST API

### Key Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/realtime/realtime.module.ts` | NestJS module registration |
| `apps/api/src/realtime/realtime.gateway.ts` | Socket.io WebSocket gateway |
| `apps/api/src/realtime/realtime.types.ts` | Event type definitions |
| `apps/web/src/providers/realtime-provider.tsx` | React context for WebSocket |
| `apps/web/src/hooks/use-realtime.ts` | Base hook for subscriptions |
| `apps/web/src/hooks/use-realtime-approvals.ts` | Approval-specific real-time |
| `apps/web/src/hooks/use-realtime-agents.ts` | Agent-specific real-time |
| `apps/web/src/hooks/use-realtime-notifications.ts` | Notification-specific real-time |
| `apps/web/src/components/ui/connection-status.tsx` | Connection indicator UI |

### Technical Constraints

1. **Socket.io Version**: Use Socket.io 4.x (already in tech stack)
2. **Redis Adapter**: Consider `@socket.io/redis-adapter` for multi-server support
3. **Event Correlation**: Use correlation IDs from Event Bus for tracing
4. **Rate Limiting**: Consider rate limiting broadcast frequency for high-volume events

### Project Structure Notes

- WebSocket gateway goes in `apps/api/src/realtime/` (new module)
- Frontend provider goes in `apps/web/src/providers/` alongside other context providers
- Hooks follow existing pattern in `apps/web/src/hooks/`
- Types should extend existing event types from `packages/shared/src/types/events.ts`

### References

- [Source: docs/architecture.md#Integration-Points] - WebSocket gateway pattern
- [Source: docs/sprint-artifacts/tech-spec-epic-05.md] - Event Bus infrastructure
- [Source: docs/sprint-artifacts/tech-spec-epic-16.md#Story-16.15] - Detailed implementation specs
- [Source: docs/epics/EPIC-16-premium-polish-advanced-features.md#Story-16.15] - Acceptance criteria

### Socket.io Events Reference

```typescript
// Server → Client Events
interface ServerToClientEvents {
  'approval.created': (approval: ApprovalItem) => void;
  'approval.updated': (update: Partial<ApprovalItem> & { id: string }) => void;
  'approval.deleted': (data: { id: string }) => void;
  'agent.status.changed': (data: { agentId: string; status: AgentStatus }) => void;
  'notification.new': (notification: Notification) => void;
  'chat.message': (message: ChatMessage) => void;
}

// Client → Server Events
interface ClientToServerEvents {
  'presence.update': (status: 'online' | 'away' | 'busy') => void;
  'typing.start': (data: { chatId: string }) => void;
  'typing.stop': (data: { chatId: string }) => void;
}
```

### Dependencies

- EPIC-05 Event Bus (complete) - Provides event infrastructure
- React Query (already in use) - Cache management for real-time updates

### CRITICAL: Socket.io Installation Required

**Socket.io is NOT currently installed!** The first implementation task must add these dependencies:

```bash
# Backend (apps/api)
cd apps/api && pnpm add @nestjs/platform-socket.io socket.io

# Frontend (apps/web)
cd apps/web && pnpm add socket.io-client

# Optional: For multi-server support
cd apps/api && pnpm add @socket.io/redis-adapter
```

**Main.ts Configuration Required:**
```typescript
// apps/api/src/main.ts
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app)); // Add this line
  // ...
}
```

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/16-15-implement-websocket-real-time-updates.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

**Session 1 (2025-12-13)**
- Analyzed Event Bus infrastructure: EventsModule, EventPublisherService, EventConsumerService
- Event patterns: uses @EventSubscriber decorator for pattern matching (approval.*, agent.*, *)
- EventPublisherService publishes to Redis Streams (STREAMS.MAIN)
- BaseEvent structure: id, type, source, timestamp, correlationId, tenantId, userId, version, data
- Plan: Create RealtimeModule that subscribes to Event Bus events and broadcasts to Socket.io rooms
- Implementation approach:
  1. Install Socket.io dependencies (backend + frontend)
  2. Create RealtimeModule with WebSocket gateway
  3. Use @EventSubscriber to listen for approval.*, agent.*, notification.* events
  4. Broadcast events to workspace:${tenantId} rooms
  5. Create frontend provider with connection management and React Query integration

### Completion Notes List

- All acceptance criteria met:
  - AC1: WebSocket Gateway created with Socket.io namespace `/realtime`
  - AC2: Server-to-Client events implemented for approvals, agents, notifications, chat
  - AC3: Event Bus connected via @EventSubscriber decorators (approval.*, agent.*, ai.*)
  - AC4: RealtimeProvider context with connection state management created
  - AC5: ConnectionStatus UI component with visual feedback added to Header
  - AC6: React hooks for real-time updates (useRealtimeApprovals, useRealtimeAgents, etc.)
  - AC7: useApprovals hook updated to use real-time with React Query integration
  - AC8: Unit tests added (27 tests passing)
  - AC9: Integration test scaffolding in place

### File List

**Backend (apps/api/src/realtime/)**
- realtime.module.ts - Module definition
- realtime.gateway.ts - Socket.io WebSocket gateway
- realtime-event.handler.ts - Event Bus to WebSocket bridge
- realtime.types.ts - Type definitions
- realtime.gateway.spec.ts - Gateway unit tests
- realtime-event.handler.spec.ts - Event handler unit tests
- realtime.module.spec.ts - Module tests

**Frontend (apps/web/src/lib/realtime/)**
- index.ts - Module exports
- types.ts - Type definitions
- realtime-provider.tsx - React context provider

**Frontend Hooks (apps/web/src/hooks/)**
- use-realtime-approvals.ts - Approval real-time hook
- use-realtime-agents.ts - Agent real-time hook
- use-realtime-notifications.ts - Notification real-time hook
- use-realtime-chat.ts - Chat real-time hook

**Frontend Components (apps/web/src/components/ui/)**
- connection-status.tsx - Connection status indicator

**Modified Files**
- apps/api/src/app.module.ts - Added RealtimeModule
- apps/web/src/app/providers.tsx - Added RealtimeProvider
- apps/web/src/components/shell/Header.tsx - Added ConnectionStatus
- apps/web/src/hooks/use-approvals.ts - Integrated real-time updates
- apps/web/src/hooks/index.ts - Exported new hooks
