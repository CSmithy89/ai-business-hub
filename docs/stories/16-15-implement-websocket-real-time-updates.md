# Story 16-15: Implement WebSocket Real-time Updates

**Epic:** EPIC-16 - Premium Polish & Advanced Features
**Priority:** P2
**Points:** 5
**Status:** In Progress

## User Story

As a user viewing the dashboard
I want to see real-time updates without refreshing
So that I stay informed of changes immediately

## Acceptance Criteria

- [ ] WebSocket connection established on dashboard load
- [ ] Real-time updates for approval queue changes
- [ ] Real-time updates for agent status changes
- [ ] Real-time notification delivery
- [ ] Connection status indicator
- [ ] Automatic reconnection on disconnect
- [ ] Graceful degradation if WebSocket unavailable

## Technical Notes

- Socket.io already in stack (per architecture)
- NestJS backend has Gateway support
- Need client-side hooks for consuming events
- Consider connection pooling for multi-tab support

### Event Types to Support

```typescript
// Approval events
'approval:created' | 'approval:resolved' | 'approval:expired'

// Agent events
'agent:status' | 'agent:message'

// Notification events
'notification:new' | 'notification:read'

// Connection events
'connect' | 'disconnect' | 'reconnect'
```

## Files to Create/Modify

- `apps/web/src/hooks/useWebSocket.ts` - Client hook
- `apps/web/src/lib/socket.ts` - Socket.io client setup
- `apps/web/src/providers/WebSocketProvider.tsx` - Context provider
- `apps/api/src/gateways/events.gateway.ts` - NestJS gateway

## Implementation Steps

1. Create Socket.io client configuration
2. Create useWebSocket hook for consuming events
3. Create WebSocketProvider context
4. Add connection status indicator
5. Integrate with approval queue updates
6. Add auto-reconnection logic
7. Test multi-tab behavior

## Testing Checklist

- [ ] Connection established on load
- [ ] Real-time events received
- [ ] Reconnection works after disconnect
- [ ] No duplicate connections in multi-tab
- [ ] Graceful handling of server unavailable
- [ ] TypeScript check passes
- [ ] ESLint passes

## Notes

- Consider using React Query for real-time cache invalidation
- May need to scope events by workspace/tenant
- Test performance with many concurrent connections

## Deferred

Due to complexity and infrastructure requirements, this story is being **deferred** to a future sprint. The implementation requires:

1. Backend WebSocket gateway setup
2. Event emission from services
3. Authentication/authorization for WebSocket connections
4. Multi-tenant event routing

This is better suited as a dedicated infrastructure story rather than a polish story.
