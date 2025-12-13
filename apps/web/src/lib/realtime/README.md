# Realtime Module

WebSocket-based real-time communication system for HYVVE platform.

## Overview

This module provides real-time bidirectional communication between the frontend and backend using Socket.io. It handles:

- Approval queue updates (created, updated, deleted)
- Agent status changes and run progress
- Notifications
- Chat messages
- Connection state management with automatic reconnection

## Architecture

```
RealtimeProvider (React Context)
    └── Socket.io Client
            └── /realtime namespace
                    ├── JWT Authentication (handshake)
                    ├── Workspace Room Isolation
                    └── Event Subscriptions
```

## Usage

### Provider Setup

Wrap your application with `RealtimeProvider`:

```tsx
// In your app layout or root component
import { RealtimeProvider } from '@/lib/realtime';

function App({ children }) {
  return (
    <RealtimeProvider>
      {children}
    </RealtimeProvider>
  );
}
```

### Subscribing to Events

```tsx
import { useRealtime } from '@/lib/realtime';
import { WS_EVENTS } from '@/lib/realtime/types';

function ApprovalComponent() {
  const { subscribe, isConnected } = useRealtime();

  useEffect(() => {
    // Subscribe returns an unsubscribe function
    const unsubscribe = subscribe(WS_EVENTS.APPROVAL_CREATED, (data) => {
      console.log('New approval:', data);
    });

    return () => unsubscribe();
  }, [subscribe]);

  return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
}
```

### Emitting Events

```tsx
import { useRealtime } from '@/lib/realtime';

function TypingIndicator() {
  const { emit } = useRealtime();

  const handleTyping = () => {
    emit('typing.start', { chatId: 'chat-123' });
  };

  return <input onChange={handleTyping} />;
}
```

## Events

### Server-to-Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `approval.created` | ApprovalEventPayload | New approval item created |
| `approval.updated` | ApprovalUpdatePayload | Approval item updated |
| `approval.deleted` | { id: string } | Approval item deleted |
| `agent.status.changed` | AgentStatusPayload | Agent status changed |
| `agent.run.started` | AgentRunPayload | Agent run started |
| `agent.run.completed` | AgentRunPayload | Agent run completed |
| `agent.run.failed` | AgentRunFailedPayload | Agent run failed |
| `notification.new` | NotificationPayload | New notification |
| `chat.message` | ChatMessagePayload | New chat message |
| `connection.status` | ConnectionStatusPayload | Connection state change |
| `sync.state` | SyncStatePayload | State sync response |

### Client-to-Server Events

| Event | Payload | Rate Limit | Description |
|-------|---------|------------|-------------|
| `presence.update` | { status: 'online' \| 'away' \| 'busy' } | 3/10s | Update presence |
| `typing.start` | { chatId: string } | 5/5s | Start typing |
| `typing.stop` | { chatId: string } | 5/5s | Stop typing |
| `room.join` | { workspaceId: string } | 5/60s | Join workspace room |
| `room.leave` | { workspaceId: string } | 5/60s | Leave workspace room |
| `sync.request` | { lastEventId?, since? } | 3/30s | Request state sync |

## Authentication

Authentication is handled via Socket.io handshake:

```typescript
// Client sends in handshake.auth:
{
  token: string;      // Session token from better-auth
  userId: string;
  workspaceId: string;
  email: string;
  sessionId: string;
}
```

The server validates the token against the sessions database table.

## Connection States

| State | Description |
|-------|-------------|
| `disconnected` | Not connected |
| `connecting` | Initial connection attempt |
| `connected` | Successfully connected |
| `reconnecting` | Attempting to reconnect |
| `error` | Connection error |

## Configuration

```tsx
<RealtimeProvider config={{
  url: 'https://api.example.com',           // WebSocket server URL
  maxReconnectAttempts: 10,                 // Max reconnection attempts
  reconnectBaseDelay: 1000,                 // Base delay for backoff (ms)
  reconnectMaxDelay: 30000,                 // Max delay between attempts (ms)
}}>
```

## Debugging

### Common Issues

#### 1. Connection Fails Immediately

**Symptoms:** Socket disconnects right after connecting

**Causes:**
- Invalid or expired session token
- CORS not configured on backend
- WebSocket server not running

**Debug Steps:**
1. Check browser DevTools Network tab for WebSocket connection
2. Verify token exists: `getCurrentSessionToken()` returns value
3. Check API server logs for authentication errors
4. Verify CORS origins in `apps/api/src/realtime/realtime.gateway.ts`

#### 2. Events Not Received

**Symptoms:** Connected but events not triggering

**Causes:**
- Not subscribed to correct event name
- Workspace room not joined
- Event not emitted by server

**Debug Steps:**
1. Verify subscription uses correct event name from `WS_EVENTS`
2. Check server logs for event emissions
3. Verify workspaceId matches between client and server

#### 3. Rate Limiting

**Symptoms:** Events silently dropped, console shows "Rate limited" warning

**Solution:** Client-side rate limiting is working as intended. Review the rate limits table above and reduce emission frequency if needed.

### Debug Logging

Enable verbose logging in development:

```typescript
// In browser console
localStorage.setItem('debug', 'socket.io-client:socket')
```

### Monitoring Connection State

```tsx
import { useRealtime } from '@/lib/realtime';

function ConnectionDebug() {
  const { connectionState, isConnected, connectionError } = useRealtime();

  useEffect(() => {
    console.log('[Realtime Debug]', {
      status: connectionState.status,
      reconnectAttempt: connectionState.reconnectAttempt,
      error: connectionState.error,
      lastConnectedAt: connectionState.lastConnectedAt,
    });
  }, [connectionState]);

  return null;
}
```

## Security

- JWT tokens are validated server-side against database sessions
- Workspace isolation via Socket.io rooms
- Client-side rate limiting prevents event spam
- CORS restricted to allowed origins
- Server-side rate limiting (TODO: Implement per-connection limits)

## Files

| File | Description |
|------|-------------|
| `realtime-provider.tsx` | React context provider and hooks |
| `types.ts` | TypeScript type definitions |
| `index.ts` | Public exports |
