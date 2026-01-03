# WebSocket Security in Production

Security considerations and best practices for WebSocket connections in HYVVE.

## Overview

HYVVE uses WebSocket connections for:
- Real-time dashboard updates
- HITL approval notifications
- State synchronization across tabs

## Authentication

### Connection Authentication

```typescript
// apps/api/src/realtime/websocket.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class RealtimeGateway {
  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token
        || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.emit('error', { code: 'AUTH_REQUIRED' });
        client.disconnect(true);
        return;
      }

      // Validate JWT
      const payload = await this.authService.validateToken(token);
      if (!payload) {
        client.emit('error', { code: 'INVALID_TOKEN' });
        client.disconnect(true);
        return;
      }

      // Attach user to socket
      client.data.userId = payload.sub;
      client.data.workspaceId = payload.workspaceId;

    } catch (error) {
      client.disconnect(true);
    }
  }
}
```

### Token Refresh

```typescript
// Client-side token refresh
socket.on('token_expiring', async () => {
  const newToken = await refreshAccessToken();
  socket.emit('token_refresh', { token: newToken });
});

// Server-side handling
@SubscribeMessage('token_refresh')
async handleTokenRefresh(client: Socket, data: { token: string }) {
  const payload = await this.authService.validateToken(data.token);
  if (payload) {
    client.data.tokenExpiry = payload.exp;
  } else {
    client.disconnect(true);
  }
}
```

## Authorization

### Room Access Control

```typescript
@SubscribeMessage('join_room')
async handleJoinRoom(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { room: string },
) {
  const { userId, workspaceId } = client.data;
  const room = data.room;

  // Parse room format: workspace:{id}:dashboard or workspace:{id}:approvals
  const [type, roomWorkspaceId] = room.split(':');

  // Verify user belongs to workspace
  if (type === 'workspace') {
    const hasAccess = await this.authService.userBelongsToWorkspace(
      userId,
      roomWorkspaceId,
    );

    if (!hasAccess) {
      return { error: 'ACCESS_DENIED' };
    }
  }

  await client.join(room);
  return { joined: room };
}
```

### Message Authorization

```typescript
@SubscribeMessage('dashboard_action')
async handleDashboardAction(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: DashboardActionDto,
) {
  const { userId, workspaceId } = client.data;

  // Verify action is allowed for this user
  const allowed = await this.rbacService.canPerformAction(
    userId,
    data.action,
    workspaceId,
  );

  if (!allowed) {
    return { error: 'PERMISSION_DENIED' };
  }

  // Process action...
}
```

## Rate Limiting

### Connection Rate Limiting

```typescript
// Limit connections per IP
const connectionCounts = new Map<string, number>();
const MAX_CONNECTIONS_PER_IP = 10;

@WebSocketGateway()
export class RealtimeGateway {
  async handleConnection(client: Socket) {
    const ip = client.handshake.address;

    const count = connectionCounts.get(ip) || 0;
    if (count >= MAX_CONNECTIONS_PER_IP) {
      client.emit('error', { code: 'TOO_MANY_CONNECTIONS' });
      client.disconnect(true);
      return;
    }

    connectionCounts.set(ip, count + 1);
  }

  handleDisconnect(client: Socket) {
    const ip = client.handshake.address;
    const count = connectionCounts.get(ip) || 1;
    connectionCounts.set(ip, count - 1);
  }
}
```

### Message Rate Limiting

```typescript
// Limit messages per client
const messageCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_MESSAGES_PER_MINUTE = 60;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = messageCounts.get(clientId);

  if (!record || now > record.resetAt) {
    messageCounts.set(clientId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= MAX_MESSAGES_PER_MINUTE) {
    return false;
  }

  record.count++;
  return true;
}
```

## Message Validation

### Size Limits

```typescript
// Configure in Socket.io options
@WebSocketGateway({
  maxHttpBufferSize: 1e5, // 100KB max message size
})
```

### Schema Validation

```typescript
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class DashboardActionDto {
  @IsString()
  @MaxLength(100)
  action: string;

  @IsOptional()
  @MaxLength(10000)
  payload?: string;
}

// Use validation pipe
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@SubscribeMessage('dashboard_action')
async handleAction(@MessageBody() data: DashboardActionDto) {
  // data is validated
}
```

## Room Cleanup

### Orphaned Room Prevention

```typescript
class RoomManager {
  private roomLastActivity = new Map<string, number>();

  onRoomActivity(room: string) {
    this.roomLastActivity.set(room, Date.now());
  }

  async cleanupOrphanedRooms(maxAgeMs: number = 300000) {
    const now = Date.now();

    for (const [room, lastActivity] of this.roomLastActivity) {
      if (now - lastActivity > maxAgeMs) {
        const sockets = await this.server.in(room).fetchSockets();
        if (sockets.length === 0) {
          this.roomLastActivity.delete(room);
        }
      }
    }
  }
}
```

### Disconnect Cleanup

```typescript
handleDisconnect(client: Socket) {
  const rooms = [...client.rooms];

  for (const room of rooms) {
    // Leave room
    client.leave(room);

    // Check if room is empty
    this.checkRoomEmpty(room);
  }

  // Clean up client data
  delete client.data.userId;
  delete client.data.workspaceId;
}
```

## Security Headers

### CORS Configuration

```typescript
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
})
```

## Monitoring

### Connection Metrics

```typescript
// Track active connections
const activeConnections = new Gauge({
  name: 'ws_connections_active',
  help: 'Number of active WebSocket connections',
  labelNames: ['workspace'],
});

handleConnection(client: Socket) {
  activeConnections.inc({ workspace: client.data.workspaceId });
}

handleDisconnect(client: Socket) {
  activeConnections.dec({ workspace: client.data.workspaceId });
}
```

### Security Event Logging

```typescript
function logSecurityEvent(event: string, details: object) {
  logger.warn({
    type: 'security_event',
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
}

// Usage
logSecurityEvent('rate_limit_exceeded', { clientId, ip });
logSecurityEvent('unauthorized_room_access', { userId, room });
```

## Production Checklist

- [ ] Token validation on every connection
- [ ] Room access verified against user permissions
- [ ] Rate limiting enabled for connections and messages
- [ ] Message size limits configured
- [ ] CORS restricted to allowed origins
- [ ] Disconnect cleanup properly handles all state
- [ ] Security events logged and monitored
- [ ] Token refresh mechanism in place

## Related Documentation

- [State Sync System](./state-sync.md)
- [Security Review Checklist](../security/review-checklist.md)
