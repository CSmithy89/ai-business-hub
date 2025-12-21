# Epic PM-06: Real-Time & Notifications - Technical Specification

**Epic:** PM-06
**Component:** Core-PM (Platform Core)
**Version:** 1.0
**Author:** AI Business Hub Team
**Created:** 2025-12-19
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Data Models](#data-models)
4. [API Design](#api-design)
5. [WebSocket Event Types](#websocket-event-types)
6. [Frontend Integration](#frontend-integration)
7. [Story Dependencies](#story-dependencies)
8. [Technical Risks](#technical-risks)

---

## Overview

### Epic Goal

Enable real-time updates, presence awareness, and configurable notifications across the PM module, ensuring users see live changes from teammates and agents without manual refresh.

### Scope

**Functional Requirements Covered:**
- **FR-7.1**: Real-time task updates via WebSocket
- **FR-7.2**: Presence indicators (who's viewing project/task)
- **FR-7.3**: Agent activity streaming
- **FR-7.4**: Optimistic UI updates with conflict detection
- **FR-8.2**: Notification preferences and in-app notification center

**Out of Scope (Future Epics):**
- Email digest notifications (FR-8.3)
- External webhook integrations (PM-07)
- Slack/Teams notification channels (Phase 3)

### Key Technical Approach

PM-06 **extends the existing WebSocket infrastructure** (`apps/api/src/realtime/`) rather than creating new systems. The existing gateway already handles:
- JWT authentication
- Workspace room isolation
- Connection management
- Rate limiting
- Redis pub/sub for multi-instance support

PM-06 adds **PM-specific event types** and **presence tracking** on top of this foundation.

---

## Architecture Decisions

### ADR-PM06-001: Extend Existing WebSocket Gateway

**Status:** Accepted

**Context:** Platform already has a Socket.io gateway in `apps/api/src/realtime/` with authentication, room management, and connection tracking.

**Decision:** Extend existing gateway with PM-specific events rather than creating a separate PM WebSocket service.

**Consequences:**
- **Pros:**
  - Reuse battle-tested authentication and rate limiting
  - Single WebSocket connection per client (not one per module)
  - Consistent event format across platform
  - Simplified client connection management
- **Cons:**
  - PM events share connection limits with approval/agent events
  - Changes to gateway affect all modules

**Implementation:** Add PM event types to `realtime.types.ts` and broadcast methods to `realtime.gateway.ts`.

---

### ADR-PM06-002: Room Scoping Strategy

**Status:** Accepted

**Context:** PM events need both workspace-wide and project-specific scoping.

**Decision:** Use hierarchical room structure:
```typescript
// Existing rooms (already implemented)
workspace:${workspaceId}  // All workspace members
user:${userId}             // User-specific events

// New PM-specific rooms (to be added)
project:${projectId}       // All project team members
task:${taskId}             // Users viewing specific task
```

**Consequences:**
- Users auto-join `workspace` and `user` rooms on connection
- Users join `project` rooms when navigating to project pages
- Users join `task` rooms when opening task detail panel
- Room management happens client-side via `room.join` / `room.leave` messages

**Implementation:** Add project/task room helpers to `realtime.types.ts`.

---

### ADR-PM06-003: Redis Pub/Sub for Multi-Instance Support

**Status:** Accepted

**Context:** Production deployment may have multiple NestJS API instances behind load balancer.

**Decision:** Use Redis Pub/Sub (via Socket.io Redis Adapter) to broadcast events across instances.

**Consequences:**
- Event emitted on instance A reaches clients connected to instance B
- Requires Redis connection (already available in platform)
- Adds ~5-10ms latency to event delivery
- Enables horizontal scaling without WebSocket sticky sessions

**Implementation:** Configure Socket.io Redis Adapter in `realtime.module.ts`:
```typescript
import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

---

### ADR-PM06-004: Presence Tracking with Redis

**Status:** Accepted

**Context:** Need to track who's viewing projects/tasks with <5min latency, and clean up stale presence on disconnect.

**Decision:** Use Redis sorted sets with heartbeat mechanism:
```
Key: presence:project:${projectId}
Value: ZADD with score = timestamp, member = userId
TTL: None (manual cleanup on heartbeat timeout)

Key: presence:user:${userId}:location
Value: JSON { projectId, taskId?, page, timestamp }
TTL: 5 minutes (auto-expire if client disconnects)
```

**Consequences:**
- Presence data persists across WebSocket reconnections
- Stale entries auto-expire after 5 minutes
- Query is fast: `ZRANGEBYSCORE presence:project:${projectId} ${now - 5min} ${now}`
- Redis memory usage: ~200 bytes per active user per project

**Implementation:** Create `PresenceService` in `apps/api/src/realtime/presence.service.ts`.

---

### ADR-PM06-005: Notification Preference Granularity

**Status:** Accepted

**Context:** Users need fine-grained control over notification types and channels.

**Decision:** Extend existing `NotificationPreference` model (already has platform-wide fields) with PM-specific fields:
```prisma
model NotificationPreference {
  // ... existing fields (emailApprovals, inAppApprovals, etc.)

  // PM-specific fields (to be added)
  emailTaskAssigned      Boolean @default(true)
  emailTaskMentioned     Boolean @default(true)
  emailDueDateReminder   Boolean @default(true)
  emailAgentCompletion   Boolean @default(true)
  emailHealthAlert       Boolean @default(true)

  inAppTaskAssigned      Boolean @default(true)
  inAppTaskMentioned     Boolean @default(true)
  inAppDueDateReminder   Boolean @default(true)
  inAppAgentCompletion   Boolean @default(true)
  inAppHealthAlert       Boolean @default(true)

  quietHoursStart        String? // HH:MM format (e.g., "22:00")
  quietHoursEnd          String? // HH:MM format (e.g., "08:00")
  digestEnabled          Boolean @default(false)
  digestFrequency        String  @default("daily") // daily, weekly
}
```

**Consequences:**
- Each notification type can be toggled per channel
- Quiet hours apply globally (not per event type)
- Digest batches low-priority notifications
- Existing platform notifications unaffected

---

## Data Models

### Schema Changes (Prisma)

```prisma
// ============================================
// PM NOTIFICATION PREFERENCES (Extension)
// ============================================

// Extend existing NotificationPreference model
model NotificationPreference {
  id     String @id @default(uuid())
  userId String @unique @map("user_id")

  // Existing platform fields (not modified)
  emailApprovals        Boolean @default(true) @map("email_approvals")
  emailWorkspaceInvites Boolean @default(true) @map("email_workspace_invites")
  emailAgentErrors      Boolean @default(true) @map("email_agent_errors")
  emailDigest           String  @default("daily") @map("email_digest")

  inAppApprovals        Boolean @default(true) @map("in_app_approvals")
  inAppWorkspaceInvites Boolean @default(true) @map("in_app_workspace_invites")
  inAppAgentUpdates     Boolean @default(true) @map("in_app_agent_updates")

  // PM-specific email preferences (NEW)
  emailTaskAssigned      Boolean @default(true) @map("email_task_assigned")
  emailTaskMentioned     Boolean @default(true) @map("email_task_mentioned")
  emailDueDateReminder   Boolean @default(true) @map("email_due_date_reminder")
  emailAgentCompletion   Boolean @default(true) @map("email_agent_completion")
  emailHealthAlert       Boolean @default(true) @map("email_health_alert")

  // PM-specific in-app preferences (NEW)
  inAppTaskAssigned      Boolean @default(true) @map("in_app_task_assigned")
  inAppTaskMentioned     Boolean @default(true) @map("in_app_task_mentioned")
  inAppDueDateReminder   Boolean @default(true) @map("in_app_due_date_reminder")
  inAppAgentCompletion   Boolean @default(true) @map("in_app_agent_completion")
  inAppHealthAlert       Boolean @default(true) @map("in_app_health_alert")

  // Quiet hours (NEW)
  quietHoursStart        String? @map("quiet_hours_start") // HH:MM format
  quietHoursEnd          String? @map("quiet_hours_end")   // HH:MM format
  quietHoursTimezone     String  @default("UTC") @map("quiet_hours_timezone")

  // Digest settings (NEW)
  digestEnabled          Boolean @default(false) @map("digest_enabled")
  digestFrequency        String  @default("daily") @map("digest_frequency") // daily, weekly

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("notification_preferences")
}

// Notification model (existing, no changes needed)
// Already has userId, workspaceId, type, title, message, readAt, etc.
```

### No New Models Required

PM-06 does **not** require new database tables. It extends:
1. **Existing `NotificationPreference` model** with PM-specific fields
2. **Existing `Notification` model** (no changes needed)
3. **Redis data structures** for presence tracking (no Prisma model)

---

## API Design

### REST Endpoints (NestJS)

All endpoints under `/api/pm/` prefix (consistent with PM-01 to PM-05 epics).

#### Notification Preferences

```typescript
// Get user's notification preferences
GET /api/pm/notifications/preferences
Response: {
  data: {
    userId: string;
    emailTaskAssigned: boolean;
    // ... all preference fields
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
    digestEnabled: boolean;
    digestFrequency: 'daily' | 'weekly';
    updatedAt: string;
  }
}

// Update notification preferences
PATCH /api/pm/notifications/preferences
Body: {
  emailTaskAssigned?: boolean;
  inAppTaskAssigned?: boolean;
  quietHoursStart?: string | null; // "22:00"
  quietHoursEnd?: string | null;   // "08:00"
  digestEnabled?: boolean;
  digestFrequency?: 'daily' | 'weekly';
}
Response: { data: NotificationPreference }

// Reset to defaults
POST /api/pm/notifications/preferences/reset
Response: { data: NotificationPreference }
```

#### Notification Center

```typescript
// List notifications (paginated)
GET /api/pm/notifications
Query: {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, max: 100
  type?: string;        // Filter: task.assigned, task.mentioned, etc.
  read?: boolean;       // Filter: true (read), false (unread), undefined (all)
  workspaceId?: string; // Optional workspace filter
}
Response: {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }
}

// Get unread count
GET /api/pm/notifications/unread-count
Query: {
  workspaceId?: string; // Optional workspace filter
}
Response: {
  data: {
    count: number;
    byType: Record<string, number>; // { "task.assigned": 3, "task.mentioned": 1 }
  }
}

// Mark notification as read
POST /api/pm/notifications/:id/read
Response: { data: { id: string; readAt: string } }

// Mark multiple notifications as read
POST /api/pm/notifications/bulk-read
Body: {
  ids: string[];
}
Response: { data: { updated: number } }

// Mark all as read
POST /api/pm/notifications/read-all
Query: {
  workspaceId?: string; // Optional workspace filter
}
Response: { data: { updated: number } }

// Delete notification
DELETE /api/pm/notifications/:id
Response: { success: true }
```

#### Presence (Read-Only)

```typescript
// Get active users for a project
GET /api/pm/projects/:projectId/presence
Response: {
  data: {
    users: Array<{
      userId: string;
      userName: string;
      userAvatar: string | null;
      location: {
        page: 'overview' | 'tasks' | 'settings' | 'docs';
        taskId?: string; // If viewing specific task
      };
      lastSeen: string; // ISO timestamp
    }>;
    total: number;
  }
}

// Get active users for a task
GET /api/pm/tasks/:taskId/presence
Response: {
  data: {
    users: Array<{
      userId: string;
      userName: string;
      userAvatar: string | null;
      lastSeen: string;
    }>;
    total: number;
  }
}
```

---

## WebSocket Event Types

### PM-Specific Events (New)

Add to `apps/api/src/realtime/realtime.types.ts`:

```typescript
export interface ServerToClientEvents {
  // ... existing events (approval, agent, notification, chat)

  // PM Task Events (NEW)
  'pm.task.created': (data: PMTaskEventPayload) => void;
  'pm.task.updated': (data: PMTaskUpdatePayload) => void;
  'pm.task.deleted': (data: { id: string; projectId: string }) => void;
  'pm.task.status_changed': (data: PMTaskStatusPayload) => void;
  'pm.task.assigned': (data: PMTaskAssignmentPayload) => void;

  // PM Phase Events (NEW)
  'pm.phase.started': (data: PMPhaseEventPayload) => void;
  'pm.phase.completed': (data: PMPhaseEventPayload) => void;
  'pm.phase.updated': (data: PMPhaseEventPayload) => void;

  // PM Project Events (NEW)
  'pm.project.updated': (data: PMProjectEventPayload) => void;
  'pm.project.team_changed': (data: PMTeamChangePayload) => void;

  // PM Agent Events (NEW)
  'pm.agent.suggestion': (data: PMAgentSuggestionPayload) => void;
  'pm.agent.progress': (data: PMAgentProgressPayload) => void;

  // PM Presence Events (NEW)
  'pm.presence.joined': (data: PresencePayload) => void;
  'pm.presence.left': (data: PresencePayload) => void;
  'pm.presence.updated': (data: PresencePayload) => void;
}

export interface ClientToServerEvents {
  // ... existing events

  // PM Presence (NEW)
  'pm.presence.update': (data: {
    projectId: string;
    taskId?: string;
    page: 'overview' | 'tasks' | 'settings' | 'docs';
  }) => void;
}

// ============================================
// PM Event Payloads
// ============================================

export interface PMTaskEventPayload {
  id: string;
  projectId: string;
  phaseId: string;
  taskNumber: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  agentId: string | null;
  createdBy: string;
  createdAt: string;
  correlationId?: string;
}

export interface PMTaskUpdatePayload {
  id: string;
  projectId: string;
  phaseId?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  dueDate?: string | null;
  updatedBy: string;
  updatedAt: string;
  correlationId?: string;
}

export interface PMTaskStatusPayload {
  id: string;
  projectId: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  updatedAt: string;
  correlationId?: string;
}

export interface PMTaskAssignmentPayload {
  id: string;
  projectId: string;
  oldAssigneeId: string | null;
  newAssigneeId: string | null;
  assignedBy: string;
  assignedAt: string;
  correlationId?: string;
}

export interface PMPhaseEventPayload {
  id: string;
  projectId: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  completedAt?: string;
  correlationId?: string;
}

export interface PMProjectEventPayload {
  id: string;
  workspaceId: string;
  name: string;
  status: string;
  updatedBy: string;
  updatedAt: string;
  correlationId?: string;
}

export interface PMTeamChangePayload {
  projectId: string;
  action: 'added' | 'removed' | 'role_changed';
  userId: string;
  userName: string;
  role?: string;
  changedBy: string;
  changedAt: string;
  correlationId?: string;
}

export interface PMAgentSuggestionPayload {
  id: string;
  projectId: string;
  agentId: string;
  agentName: string;
  type: 'task' | 'phase' | 'risk' | 'estimate';
  suggestion: string;
  confidence: number;
  createdAt: string;
  correlationId?: string;
}

export interface PMAgentProgressPayload {
  runId: string;
  projectId: string;
  agentId: string;
  agentName: string;
  status: 'working' | 'paused' | 'completed';
  currentStep: string;
  progress: number; // 0-100
  estimatedCompletion?: string;
  correlationId?: string;
}

export interface PresencePayload {
  userId: string;
  userName: string;
  userAvatar: string | null;
  projectId: string;
  taskId?: string;
  page: 'overview' | 'tasks' | 'settings' | 'docs';
  timestamp: string;
}
```

### Room Helper Functions (New)

Add to `apps/api/src/realtime/realtime.types.ts`:

```typescript
/**
 * Generate room name for project-specific events
 */
export function getProjectRoom(projectId: string): string {
  return `project:${projectId}`;
}

/**
 * Generate room name for task-specific events
 */
export function getTaskRoom(taskId: string): string {
  return `task:${taskId}`;
}
```

### Event Constants (New)

Add to `apps/api/src/realtime/realtime.types.ts`:

```typescript
export const WS_EVENTS = {
  // ... existing events

  // PM Events (NEW)
  PM_TASK_CREATED: 'pm.task.created',
  PM_TASK_UPDATED: 'pm.task.updated',
  PM_TASK_DELETED: 'pm.task.deleted',
  PM_TASK_STATUS_CHANGED: 'pm.task.status_changed',
  PM_TASK_ASSIGNED: 'pm.task.assigned',

  PM_PHASE_STARTED: 'pm.phase.started',
  PM_PHASE_COMPLETED: 'pm.phase.completed',
  PM_PHASE_UPDATED: 'pm.phase.updated',

  PM_PROJECT_UPDATED: 'pm.project.updated',
  PM_PROJECT_TEAM_CHANGED: 'pm.project.team_changed',

  PM_AGENT_SUGGESTION: 'pm.agent.suggestion',
  PM_AGENT_PROGRESS: 'pm.agent.progress',

  PM_PRESENCE_JOINED: 'pm.presence.joined',
  PM_PRESENCE_LEFT: 'pm.presence.left',
  PM_PRESENCE_UPDATED: 'pm.presence.updated',
} as const;
```

---

## Frontend Integration

### React Query Cache Invalidation Strategy

PM-06 uses **React Query** for server state management with **automatic cache invalidation** on WebSocket events:

```typescript
// apps/web/src/hooks/use-realtime-pm.ts (NEW)

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/lib/realtime';
import { PMTaskEventPayload, PMTaskUpdatePayload } from '@/lib/realtime/types';

export function useRealtimePM() {
  const queryClient = useQueryClient();
  const { socket, connected } = useRealtime();

  useEffect(() => {
    if (!socket || !connected) return;

    // Task created: invalidate project tasks list
    const handleTaskCreated = (data: PMTaskEventPayload) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.projectId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['phases', data.phaseId, 'tasks'] });
    };

    // Task updated: update task detail cache + invalidate lists
    const handleTaskUpdated = (data: PMTaskUpdatePayload) => {
      // Update task detail cache optimistically
      queryClient.setQueryData(['tasks', data.id], (old: any) => ({
        ...old,
        ...data,
      }));

      // Invalidate lists to reflect changes in grouping/filtering
      queryClient.invalidateQueries({ queryKey: ['projects', data.projectId, 'tasks'] });
      if (data.phaseId) {
        queryClient.invalidateQueries({ queryKey: ['phases', data.phaseId, 'tasks'] });
      }
    };

    // Task deleted: remove from caches
    const handleTaskDeleted = (data: { id: string; projectId: string }) => {
      queryClient.removeQueries({ queryKey: ['tasks', data.id] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.projectId, 'tasks'] });
    };

    // Subscribe to events
    socket.on('pm.task.created', handleTaskCreated);
    socket.on('pm.task.updated', handleTaskUpdated);
    socket.on('pm.task.deleted', handleTaskDeleted);

    // Cleanup
    return () => {
      socket.off('pm.task.created', handleTaskCreated);
      socket.off('pm.task.updated', handleTaskUpdated);
      socket.off('pm.task.deleted', handleTaskDeleted);
    };
  }, [socket, connected, queryClient]);
}
```

### Optimistic Updates Approach

PM-06 uses **optimistic updates** for user actions with **automatic rollback** on error:

```typescript
// Example: Task status update with optimistic UI

const { mutate: updateTaskStatus } = useMutation({
  mutationFn: (data: { taskId: string; status: string }) =>
    api.patch(`/api/pm/tasks/${data.taskId}`, { status: data.status }),

  // Optimistic update: immediately update UI
  onMutate: async (data) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['tasks', data.taskId] });

    // Snapshot previous value
    const previousTask = queryClient.getQueryData(['tasks', data.taskId]);

    // Optimistically update cache
    queryClient.setQueryData(['tasks', data.taskId], (old: any) => ({
      ...old,
      status: data.status,
      updatedAt: new Date().toISOString(),
    }));

    // Return rollback context
    return { previousTask };
  },

  // Rollback on error
  onError: (err, data, context) => {
    if (context?.previousTask) {
      queryClient.setQueryData(['tasks', data.taskId], context.previousTask);
    }
    toast.error('Failed to update task status');
  },

  // Refetch on success (WebSocket will also trigger update, but this ensures consistency)
  onSuccess: (result, data) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', data.taskId] });
  },
});
```

### Conflict Detection

PM-06 detects **concurrent edits** by comparing `updatedAt` timestamps:

```typescript
// Show conflict warning if remote update is newer than local data

useEffect(() => {
  if (!socket || !connected) return;

  const handleTaskUpdated = (data: PMTaskUpdatePayload) => {
    const localTask = queryClient.getQueryData(['tasks', data.id]);

    if (localTask && localTask.id === currentlyEditingTaskId) {
      // User is editing this task - check for conflict
      const localUpdatedAt = new Date(localTask.updatedAt);
      const remoteUpdatedAt = new Date(data.updatedAt);

      if (remoteUpdatedAt > localUpdatedAt) {
        toast.warning(
          `This task was updated by ${data.updatedBy}. Your changes may conflict.`,
          {
            action: {
              label: 'Reload',
              onClick: () => queryClient.invalidateQueries(['tasks', data.id]),
            },
          }
        );
      }
    }
  };

  socket.on('pm.task.updated', handleTaskUpdated);
  return () => socket.off('pm.task.updated', handleTaskUpdated);
}, [socket, connected, currentlyEditingTaskId]);
```

### Notification Center Component Design

```typescript
// apps/web/src/components/pm/notifications/NotificationCenter.tsx (NEW)

interface NotificationCenterProps {
  workspaceId: string;
}

export function NotificationCenter({ workspaceId }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);

  // Query for notifications with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications', workspaceId],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/api/pm/notifications?workspaceId=${workspaceId}&page=${pageParam}`),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
  });

  // Real-time unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', workspaceId, 'unread-count'],
    queryFn: () => api.get(`/api/pm/notifications/unread-count?workspaceId=${workspaceId}`),
  });

  // Listen for new notifications
  const { socket } = useRealtime();
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      queryClient.invalidateQueries(['notifications', workspaceId]);
      queryClient.invalidateQueries(['notifications', workspaceId, 'unread-count']);
    };

    socket.on('notification.new', handleNewNotification);
    return () => socket.off('notification.new', handleNewNotification);
  }, [socket, workspaceId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount?.data.count > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center">
              {unreadCount.data.count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {data?.pages.flatMap(page => page.data).map(notification => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>

          {hasNextPage && (
            <div className="p-4">
              <Button
                variant="ghost"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
```

---

## Story Dependencies

### Sequencing and Prerequisites

```
PM-06.1 (WebSocket Infrastructure)
    │
    ├──> PM-06.2 (Real-Time UI Updates)
    │       │
    │       ├──> PM-06.3 (Agent Activity Streaming)
    │       └──> PM-06.4 (Presence Indicators)
    │
    └──> PM-06.5 (Notification Preferences)
            │
            └──> PM-06.6 (In-App Notification Center)
```

**Critical Path:**
1. **PM-06.1** must complete first (extends gateway, adds PM event types)
2. **PM-06.2** and **PM-06.5** can run in parallel after PM-06.1
3. **PM-06.3** and **PM-06.4** depend on PM-06.2 (share cache invalidation patterns)
4. **PM-06.6** depends on PM-06.5 (reads preferences for filtering)

**Story Estimates:**
| Story | Points | Rationale |
|-------|--------|-----------|
| PM-06.1 | 5 | Extend existing gateway, add PM events, configure Redis adapter |
| PM-06.2 | 8 | React Query integration, optimistic updates, conflict detection |
| PM-06.3 | 5 | Agent progress events, streaming UI, toast notifications |
| PM-06.4 | 5 | Redis presence tracking, heartbeat mechanism, presence UI |
| PM-06.5 | 5 | Extend Prisma model, preference API, quiet hours logic |
| PM-06.6 | 8 | Notification center UI, infinite scroll, mark as read, filtering |
| **Total** | **36** | |

---

## Technical Risks

### Risk 1: WebSocket Scalability

**Description:** Multiple NestJS instances may have 100+ concurrent WebSocket connections each.

**Impact:** High - Could exhaust file descriptors or memory.

**Mitigation:**
- Set `MAX_CONNECTIONS_PER_WORKSPACE = 100` (already configured)
- Set `MAX_CONNECTIONS_PER_USER = 5` (already configured)
- Monitor connection counts with Prometheus metrics
- Use Redis Pub/Sub adapter (distributes load)
- Enable Socket.io compression for reduced bandwidth

**Likelihood:** Medium

---

### Risk 2: Presence Data Staleness

**Description:** Users may appear "online" for 5+ minutes after closing browser (Redis TTL delay).

**Impact:** Low - Minor UX annoyance, not a functional issue.

**Mitigation:**
- Send `presence.left` event on `beforeunload` (best-effort)
- Redis TTL set to 5 minutes (acceptable staleness)
- UI shows "last seen" timestamp (not just "online")
- Heartbeat every 30 seconds keeps presence fresh

**Likelihood:** Low (only on abrupt disconnects)

---

### Risk 3: Cache Invalidation Race Conditions

**Description:** WebSocket event arrives before REST API response, causing outdated cache.

**Impact:** Medium - User sees stale data briefly.

**Mitigation:**
- Use optimistic updates (user action immediately updates UI)
- WebSocket events re-invalidate even if already updated
- React Query automatic cache deduplication (same key won't refetch twice)
- Add `correlationId` to track user's own mutations (skip cache invalidation if own action)

**Likelihood:** Low (React Query handles most cases)

---

### Risk 4: Notification Preferences Migration

**Description:** Existing users have no PM notification preferences (new fields).

**Impact:** Medium - Defaults must be sensible.

**Mitigation:**
- All new fields have `@default(true)` (opt-out model)
- Run Prisma migration to add fields with defaults
- No data backfill needed (Prisma handles defaults)
- Add "Reset to defaults" button in UI for testing

**Likelihood:** Low (Prisma handles gracefully)

---

### Risk 5: Redis Memory Usage (Presence)

**Description:** 10,000 users × 200 bytes = 2MB of presence data. Not an issue at MVP scale, but could grow.

**Impact:** Low - Redis easily handles this.

**Mitigation:**
- Use sorted sets (efficient)
- 5-minute TTL auto-expires old entries
- Monitor Redis memory usage
- If needed, shard presence by project (multiple Redis keys)

**Likelihood:** Very Low

---

## Implementation Notes

### Backend Service Integration Points

```typescript
// Example: TasksService emits PM events after CRUD operations

// apps/api/src/pm/tasks/tasks.service.ts

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RealtimeGateway, // Inject gateway
  ) {}

  async updateTask(taskId: string, data: UpdateTaskDto, userId: string) {
    // Update in database
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { ...data, updatedAt: new Date() },
      include: { phase: { select: { projectId: true } } },
    });

    // Broadcast WebSocket event
    this.gateway.emitToWorkspace(task.phase.projectId, 'pm.task.updated', {
      id: task.id,
      projectId: task.phase.projectId,
      phaseId: task.phaseId,
      title: task.title,
      status: task.status,
      updatedBy: userId,
      updatedAt: task.updatedAt.toISOString(),
    });

    return task;
  }
}
```

### Frontend Hook Usage

```typescript
// apps/web/src/app/(dashboard)/projects/[projectId]/page.tsx

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  // Enable real-time updates for this page
  useRealtimePM();

  // Presence tracking
  usePresence({ projectId: params.projectId, page: 'overview' });

  // Query tasks (automatically updates on WebSocket events)
  const { data: tasks } = useQuery({
    queryKey: ['projects', params.projectId, 'tasks'],
    queryFn: () => api.get(`/api/pm/projects/${params.projectId}/tasks`),
  });

  return (
    <div>
      <ProjectHeader projectId={params.projectId} />
      <TaskList tasks={tasks} />
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// apps/api/src/pm/notifications/notifications.service.spec.ts

describe('NotificationsService', () => {
  it('should respect quiet hours', () => {
    const prefs = {
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      quietHoursTimezone: 'America/Los_Angeles',
    };

    const now = new Date('2025-01-15T23:00:00-08:00'); // 11 PM PST
    expect(service.isInQuietHours(prefs, now)).toBe(true);
  });

  it('should not send email if preference is off', async () => {
    const prefs = { emailTaskAssigned: false };
    await service.sendNotification('task.assigned', userId, data);

    expect(emailService.send).not.toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
// apps/api/src/realtime/realtime.gateway.spec.ts

describe('RealtimeGateway - PM Events', () => {
  it('should broadcast task update to project room', async () => {
    const client = await createTestClient();
    await client.emit('room.join', { projectId: 'proj-123' });

    gateway.emitToWorkspace('workspace-1', 'pm.task.updated', taskPayload);

    await expect(client).toReceiveEvent('pm.task.updated', taskPayload);
  });
});
```

### E2E Tests (Playwright)

```typescript
// apps/web/e2e/pm-realtime.spec.ts

test('task status updates in real-time', async ({ page, context }) => {
  // User 1: Open project page
  await page.goto('/projects/proj-123/tasks');

  // User 2: Update task status (simulate via API)
  await context.request.patch('/api/pm/tasks/task-456', {
    data: { status: 'IN_PROGRESS' },
  });

  // User 1: Should see update without refresh
  await expect(page.locator('[data-task-id="task-456"]')).toHaveAttribute(
    'data-status',
    'IN_PROGRESS'
  );
});
```

---

## Monitoring & Observability

### Key Metrics

```typescript
// Prometheus metrics to add

// WebSocket connections by workspace
realtime_websocket_connections_total{workspaceId}

// PM events emitted per minute
realtime_pm_events_emitted_total{eventType}

// Presence updates per minute
realtime_presence_updates_total{projectId}

// Notification delivery latency
notification_delivery_duration_seconds{type, channel}

// Cache invalidation count
pm_cache_invalidations_total{queryKey}
```

### Logging

```typescript
// Structured logs for PM real-time events

logger.info({
  event: 'pm.task.updated',
  taskId: task.id,
  projectId: task.projectId,
  workspaceId: task.workspaceId,
  updatedBy: userId,
  connectedClients: gateway.getWorkspaceClientCount(workspaceId),
  latencyMs: Date.now() - startTime,
});
```

---

## References

- **Platform Architecture:** `/home/chris/projects/work/Ai-Business-Hub-pm-06/docs/architecture.md`
- **Module Architecture:** `/home/chris/projects/work/Ai-Business-Hub-pm-06/docs/modules/bm-pm/architecture.md`
- **Existing WebSocket Gateway:** `/home/chris/projects/work/Ai-Business-Hub-pm-06/apps/api/src/realtime/realtime.gateway.ts`
- **Epic Definition:** `/home/chris/projects/work/Ai-Business-Hub-pm-06/docs/modules/bm-pm/epics/epic-pm-06-real-time-notifications.md`
- **Sprint Status:** `/home/chris/projects/work/Ai-Business-Hub-pm-06/docs/modules/bm-pm/sprint-status.yaml`

---

**Changelog:**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-19 | Initial tech spec for PM-06 |

---

**Next Steps:**

1. Review tech spec with team
2. Update `sprint-status.yaml` to change `pm-06: backlog` → `pm-06: contexted`
3. Draft first story (PM-06.1: WebSocket Infrastructure)
4. Schedule PM-06.1 for next sprint
