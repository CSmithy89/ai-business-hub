# Story PM-06.3: Real-Time Kanban

**Epic:** PM-06 - Real-Time & Notifications
**Status:** drafted
**Points:** 8
**Priority:** High

---

## User Story

As a **project user**,
I want **the Kanban board to update in real-time**,
So that **I see changes from teammates immediately without refreshing**.

---

## Acceptance Criteria

### AC1: Real-Time Task Creation
**Given** I am viewing the Kanban board
**When** another user creates a new task in any column
**Then** the new task card appears in my view automatically
**And** the task count for that column updates

### AC2: Real-Time Task Movement
**Given** I am viewing the Kanban board
**When** another user drags a task to a different column
**Then** the task card moves to the new column in my view automatically
**And** both column counts update

### AC3: Real-Time Task Updates
**Given** I am viewing a task card on the Kanban board
**When** another user updates the task (title, priority, assignee, etc.)
**Then** the task card updates in my view automatically
**And** shows a subtle animation to indicate the change

### AC4: Optimistic Updates for My Actions
**Given** I drag a task to a different column
**When** the drag completes
**Then** the UI updates immediately (optimistic)
**And** reverts if the server request fails
**And** shows a toast notification on error

### AC5: Conflict Detection
**Given** I am viewing a task card
**When** another user updates the same task while I'm viewing it
**Then** I see a subtle indicator that the task was updated
**And** I can click to refresh the task details

---

## Technical Approach

This story implements **real-time Kanban board updates** using React Query cache invalidation and optimistic updates. It builds on the WebSocket infrastructure from PM-06.1 and PM-06.2.

### Architecture

**React Query Strategy:**
- Use `queryClient.invalidateQueries()` for external updates
- Use optimistic updates for user's own drag-and-drop actions
- Use cache rollback on mutation errors
- Detect conflicts by comparing `updatedAt` timestamps

**Event Handling:**
- Listen to PM task events: `pm.task.created`, `pm.task.updated`, `pm.task.status_changed`
- Invalidate Kanban query cache on external updates
- Skip cache invalidation for user's own actions (correlationId matching)

**Optimistic Updates:**
- On drag completion: immediately update React Query cache
- On API success: refetch to confirm server state
- On API error: rollback cache to previous state and show toast

**Conflict Detection:**
- Compare local `updatedAt` with remote `updatedAt`
- Show warning toast if remote is newer than local
- Provide "Reload" action button in toast

**Animation:**
- Use Framer Motion for smooth task card movements
- Animate task card updates with scale/fade effect
- Highlight newly created tasks with glow effect

---

## Implementation Tasks

### Frontend: Real-Time Kanban Hook
- [ ] Create `apps/web/src/hooks/use-realtime-kanban.ts`:
  - [ ] `useRealtimeKanban({ projectId, phaseId })` hook
  - [ ] Listen to `pm.task.created` events
  - [ ] Listen to `pm.task.updated` events
  - [ ] Listen to `pm.task.status_changed` events
  - [ ] Invalidate Kanban query cache on external updates
  - [ ] Skip invalidation if `correlationId` matches user's session
  - [ ] Show toast for external updates ("Task updated by [user]")
  - [ ] Cleanup event listeners on unmount

### Frontend: Optimistic Drag-and-Drop Updates
- [ ] Update `apps/web/src/components/pm/kanban/KanbanBoard.tsx`:
  - [ ] Use `useMutation` for task status updates
  - [ ] Implement `onMutate` for optimistic cache update
  - [ ] Snapshot previous cache state for rollback
  - [ ] Update cache immediately on drag completion
  - [ ] Implement `onError` to rollback cache and show toast
  - [ ] Implement `onSuccess` to refetch and confirm state
  - [ ] Add `correlationId` to mutation payload

### Frontend: Conflict Detection
- [ ] Create `apps/web/src/hooks/use-task-conflict-detection.ts`:
  - [ ] `useTaskConflictDetection({ taskId, currentlyEditing })` hook
  - [ ] Listen to `pm.task.updated` events
  - [ ] Compare local `updatedAt` with remote `updatedAt`
  - [ ] Show warning toast if conflict detected
  - [ ] Provide "Reload" action button in toast
  - [ ] Track which task user is currently editing (if any)

### Frontend: Task Card Animation
- [ ] Update `apps/web/src/components/pm/kanban/TaskCard.tsx`:
  - [ ] Add Framer Motion `motion.div` wrapper
  - [ ] Implement layout animation for position changes
  - [ ] Add scale/fade animation for task updates
  - [ ] Add glow effect for newly created tasks (first 3 seconds)
  - [ ] Use `animate` prop to trigger animations on data changes

### Frontend: Kanban Board Integration
- [ ] Update `apps/web/src/components/pm/kanban/KanbanBoard.tsx`:
  - [ ] Call `useRealtimeKanban()` hook to enable real-time updates
  - [ ] Pass `isOptimistic` flag to `TaskCard` for visual feedback
  - [ ] Add loading overlay during mutations (optional)
  - [ ] Add error boundary for graceful error handling

### Frontend: Toast Notifications
- [ ] Create toast notification utilities:
  - [ ] `notifyTaskCreated(task, createdBy)` - Show toast for external task creation
  - [ ] `notifyTaskUpdated(task, updatedBy)` - Show toast for external task update
  - [ ] `notifyTaskMoved(task, movedBy, fromStatus, toStatus)` - Show toast for external task move
  - [ ] `notifyConflict(task, updatedBy)` - Show conflict warning with reload action

### Backend: Correlation ID Support
- [ ] Update `apps/api/src/pm/tasks/tasks.service.ts`:
  - [ ] Accept optional `correlationId` in task update requests
  - [ ] Include `correlationId` in Event Bus events
  - [ ] Pass through to WebSocket event payloads
- [ ] Update `apps/api/src/pm/tasks/tasks.controller.ts`:
  - [ ] Extract `X-Correlation-Id` header from requests
  - [ ] Generate UUID if not provided
  - [ ] Pass to service layer

---

## Files to Create/Modify

### Frontend Files (New)
- `apps/web/src/hooks/use-realtime-kanban.ts` - Real-time Kanban updates hook (NEW)
- `apps/web/src/hooks/use-task-conflict-detection.ts` - Conflict detection hook (NEW)
- `apps/web/src/lib/kanban-notifications.ts` - Toast notification utilities (NEW)

### Frontend Files (Modify)
- `apps/web/src/components/pm/kanban/KanbanBoard.tsx` - Add real-time updates and optimistic mutations
- `apps/web/src/components/pm/kanban/TaskCard.tsx` - Add Framer Motion animations
- `apps/web/src/app/(dashboard)/projects/[projectId]/tasks/page.tsx` - Ensure Kanban board uses real-time hook

### Backend Files (Modify)
- `apps/api/src/pm/tasks/tasks.service.ts` - Add correlationId support
- `apps/api/src/pm/tasks/tasks.controller.ts` - Extract correlation ID from headers
- `apps/api/src/pm/tasks/dto/update-task.dto.ts` - Add optional correlationId field (optional)

### Dependencies
- `framer-motion` - Install if not already present: `pnpm add framer-motion`

---

## Testing Requirements

### Unit Tests

**Location:** `apps/web/src/hooks/use-realtime-kanban.spec.ts` (new file)

Test cases:
- Hook listens to `pm.task.created` events
- Hook invalidates cache on external task creation
- Hook skips invalidation if `correlationId` matches session
- Hook shows toast on external task update
- Hook cleans up event listeners on unmount

**Location:** `apps/web/src/hooks/use-task-conflict-detection.spec.ts` (new file)

Test cases:
- Hook detects conflict when remote `updatedAt` is newer
- Hook shows warning toast with reload action
- Hook ignores events if not currently editing task
- Hook ignores events if `correlationId` matches session

### Integration Tests

**Location:** `apps/web/src/components/pm/kanban/KanbanBoard.spec.tsx`

Test cases:
- Kanban board renders with real-time hook enabled
- Task card appears when `pm.task.created` event received
- Task card moves when `pm.task.status_changed` event received
- Task card updates when `pm.task.updated` event received
- Optimistic update applies immediately on drag
- Cache rollback occurs on mutation error
- Toast shown on external task update

### E2E Tests (Playwright)

**Location:** `apps/web/e2e/pm-kanban-realtime.spec.ts` (new file)

Test cases:
- User 1 views Kanban board
- User 2 creates task via API
- User 1 sees new task appear automatically
- User 1 drags task to new column
- UI updates immediately (optimistic)
- User 2 updates task title via API
- User 1 sees title update automatically
- User 1 drags task while User 2 updates it
- Conflict warning appears in User 1's view

### Manual Testing Checklist

- [ ] Open Kanban board in two browser windows (different users)
- [ ] Create task in Window 1
- [ ] Verify task appears in Window 2 automatically
- [ ] Drag task to different column in Window 2
- [ ] Verify task moves in Window 1 automatically
- [ ] Verify column counts update in both windows
- [ ] Drag task in Window 1 (optimistic update)
- [ ] Verify immediate UI update in Window 1
- [ ] Simulate API error (disconnect network)
- [ ] Verify rollback and error toast in Window 1
- [ ] Update task in Window 2 while viewing in Window 1
- [ ] Verify conflict warning appears in Window 1
- [ ] Click "Reload" in conflict toast
- [ ] Verify task refreshes with latest data
- [ ] Test with 3+ concurrent users
- [ ] Test with slow network (throttle to 3G)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Real-time Kanban hook implemented
- [ ] Optimistic drag-and-drop updates working
- [ ] Conflict detection implemented
- [ ] Task card animations added (Framer Motion)
- [ ] Toast notifications for external updates
- [ ] Correlation ID support in backend
- [ ] React Query cache invalidation working
- [ ] Rollback on mutation errors working
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] TypeScript type checks pass
- [ ] ESLint passes (no new errors)
- [ ] Code reviewed and approved
- [ ] Real-time updates working in production-like environment
- [ ] Documentation updated:
  - [ ] Real-time Kanban architecture notes
  - [ ] Optimistic updates pattern documentation
  - [ ] Conflict detection guide

---

## Dependencies

### Prerequisites
- **PM-06.1** (WebSocket Infrastructure) - Required for WebSocket events
- **PM-06.2** (Presence Indicators) - Shares WebSocket patterns
- **PM-03.2** (Kanban Board Basic) - Basic Kanban board exists
- **PM-03.3** (Kanban Drag-and-Drop) - Drag-and-drop functionality exists

### Blocks
- None (can run independently after prerequisites)

### Related
- **PM-06.4** (Notification Preferences) - May integrate task update notifications
- **PM-06.5** (In-App Notifications) - May show task updates in notification center

---

## References

- [Epic Definition](../epics/epic-pm-06-real-time-notifications.md) - Story PM-06.3 (originally listed as PM-06.2 in epic, corrected here)
- [Epic Tech Spec](../epics/epic-pm-06-tech-spec.md) - React Query cache invalidation strategy
- [Module PRD](../PRD.md) - Real-time requirements (FR-7.1, FR-7.4)
- [Module Architecture](../architecture.md) - WebSocket integration
- [Sprint Status](../sprint-status.yaml)
- [PM-06.1 Story](./pm-06-1-websocket-task-updates.md) - WebSocket infrastructure
- [PM-06.2 Story](./pm-06-2-presence-indicators.md) - Presence patterns
- [PM-03.3 Story](./pm-03-3-kanban-drag-drop.md) - Drag-and-drop implementation (if exists)
- [React Query Docs](https://tanstack.com/query/latest) - Optimistic updates guide

---

## Dev Notes

### React Query Cache Invalidation Pattern

```typescript
// apps/web/src/hooks/use-realtime-kanban.ts

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/lib/realtime';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type { PMTaskEventPayload, PMTaskUpdatePayload, PMTaskStatusPayload } from '@/types/realtime';

interface UseRealtimeKanbanOptions {
  projectId: string;
  phaseId?: string;
}

export function useRealtimeKanban({ projectId, phaseId }: UseRealtimeKanbanOptions) {
  const queryClient = useQueryClient();
  const { socket, connected } = useRealtime();
  const session = useSession();

  useEffect(() => {
    if (!socket || !connected) return;

    // Task created: invalidate Kanban query
    const handleTaskCreated = (data: PMTaskEventPayload) => {
      if (data.projectId !== projectId) return;
      if (phaseId && data.phaseId !== phaseId) return;

      // Skip if this is user's own action
      if (data.correlationId === session.data?.correlationId) return;

      // Invalidate Kanban board query
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'kanban'],
      });

      // Show toast notification
      toast.info(`New task created by ${data.createdBy}`, {
        description: data.title,
      });
    };

    // Task updated: update cache optimistically
    const handleTaskUpdated = (data: PMTaskUpdatePayload) => {
      if (data.projectId !== projectId) return;
      if (phaseId && data.phaseId !== phaseId) return;

      // Skip if this is user's own action
      if (data.correlationId === session.data?.correlationId) return;

      // Update task in Kanban cache
      queryClient.setQueryData(['projects', projectId, 'kanban'], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          columns: old.columns.map((column: any) => ({
            ...column,
            tasks: column.tasks.map((task: any) =>
              task.id === data.id
                ? { ...task, ...data }
                : task
            ),
          })),
        };
      });

      // Show toast notification
      toast.info(`Task updated by ${data.updatedBy}`, {
        description: data.title || 'Task details changed',
      });
    };

    // Task status changed: move task between columns
    const handleTaskStatusChanged = (data: PMTaskStatusPayload) => {
      if (data.projectId !== projectId) return;
      if (phaseId && data.phaseId !== phaseId) return;

      // Skip if this is user's own action
      if (data.correlationId === session.data?.correlationId) return;

      // Invalidate to refetch and re-layout
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'kanban'],
      });

      // Show toast notification
      toast.info(`Task moved by ${data.changedBy}`, {
        description: `${data.title} → ${data.toStatus}`,
      });
    };

    // Subscribe to events
    socket.on('pm.task.created', handleTaskCreated);
    socket.on('pm.task.updated', handleTaskUpdated);
    socket.on('pm.task.status_changed', handleTaskStatusChanged);

    // Cleanup
    return () => {
      socket.off('pm.task.created', handleTaskCreated);
      socket.off('pm.task.updated', handleTaskUpdated);
      socket.off('pm.task.status_changed', handleTaskStatusChanged);
    };
  }, [socket, connected, projectId, phaseId, queryClient, session.data?.correlationId]);
}
```

### Optimistic Update Pattern

```typescript
// In KanbanBoard.tsx

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { v4 as uuid } from 'uuid';

const { mutate: updateTaskStatus, isPending } = useMutation({
  mutationFn: async (data: { taskId: string; status: string; correlationId: string }) =>
    api.patch(`/api/pm/tasks/${data.taskId}`, {
      status: data.status,
    }, {
      headers: {
        'X-Correlation-Id': data.correlationId,
      },
    }),

  // Optimistic update: immediately update UI
  onMutate: async (data) => {
    // Generate correlation ID for this mutation
    const correlationId = uuid();

    // Cancel outgoing refetches
    await queryClient.cancelQueries({
      queryKey: ['projects', projectId, 'kanban'],
    });

    // Snapshot previous value
    const previousKanban = queryClient.getQueryData(['projects', projectId, 'kanban']);

    // Optimistically update cache
    queryClient.setQueryData(['projects', projectId, 'kanban'], (old: any) => {
      if (!old) return old;

      const task = findTaskById(old, data.taskId);
      if (!task) return old;

      return {
        ...old,
        columns: old.columns.map((column: any) => ({
          ...column,
          tasks: column.status === data.status
            ? [...column.tasks, { ...task, status: data.status }]
            : column.tasks.filter((t: any) => t.id !== data.taskId),
        })),
      };
    });

    // Return rollback context
    return { previousKanban, correlationId };
  },

  // Rollback on error
  onError: (err, data, context) => {
    if (context?.previousKanban) {
      queryClient.setQueryData(
        ['projects', projectId, 'kanban'],
        context.previousKanban
      );
    }
    toast.error('Failed to update task status', {
      description: err instanceof Error ? err.message : 'Please try again',
    });
  },

  // Refetch on success (WebSocket will also trigger update, but this ensures consistency)
  onSuccess: (result, data) => {
    queryClient.invalidateQueries({
      queryKey: ['projects', projectId, 'kanban'],
    });
  },
});

// Usage in drag handler
const handleDragEnd = (result: DropResult) => {
  if (!result.destination) return;

  const taskId = result.draggableId;
  const newStatus = result.destination.droppableId;

  updateTaskStatus({
    taskId,
    status: newStatus,
    correlationId: uuid(), // Generate correlation ID
  });
};
```

### Conflict Detection Pattern

```typescript
// apps/web/src/hooks/use-task-conflict-detection.ts

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/lib/realtime';
import { toast } from 'sonner';
import type { PMTaskUpdatePayload } from '@/types/realtime';

interface UseTaskConflictDetectionOptions {
  taskId: string;
  currentlyEditing: boolean;
}

export function useTaskConflictDetection({
  taskId,
  currentlyEditing,
}: UseTaskConflictDetectionOptions) {
  const queryClient = useQueryClient();
  const { socket, connected } = useRealtime();
  const localUpdatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    if (!socket || !connected || !currentlyEditing) return;

    const handleTaskUpdated = (data: PMTaskUpdatePayload) => {
      if (data.id !== taskId) return;

      const localTask = queryClient.getQueryData(['tasks', taskId]);

      if (!localTask) return;

      // Compare timestamps
      const localUpdatedAt = new Date(localTask.updatedAt);
      const remoteUpdatedAt = new Date(data.updatedAt);

      if (remoteUpdatedAt > localUpdatedAt) {
        // Conflict detected
        toast.warning(
          `This task was updated by ${data.updatedBy}`,
          {
            description: 'Your changes may conflict.',
            action: {
              label: 'Reload',
              onClick: () => queryClient.invalidateQueries(['tasks', taskId]),
            },
            duration: 10000, // Show for 10 seconds
          }
        );
      }
    };

    socket.on('pm.task.updated', handleTaskUpdated);
    return () => socket.off('pm.task.updated', handleTaskUpdated);
  }, [socket, connected, taskId, currentlyEditing, queryClient]);
}
```

### Framer Motion Animation Pattern

```typescript
// In TaskCard.tsx

import { motion, LayoutGroup } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TaskCardProps {
  task: Task;
  isOptimistic?: boolean;
}

export function TaskCard({ task, isOptimistic }: TaskCardProps) {
  const [isNew, setIsNew] = useState(false);
  const [hasUpdated, setHasUpdated] = useState(false);

  // Detect new tasks (glow effect)
  useEffect(() => {
    if (task.createdAt) {
      const createdTime = new Date(task.createdAt).getTime();
      const now = Date.now();
      if (now - createdTime < 3000) {
        setIsNew(true);
        setTimeout(() => setIsNew(false), 3000);
      }
    }
  }, [task.createdAt]);

  // Detect task updates (scale/fade animation)
  useEffect(() => {
    setHasUpdated(true);
    const timer = setTimeout(() => setHasUpdated(false), 500);
    return () => clearTimeout(timer);
  }, [task.title, task.priority, task.assigneeId]);

  return (
    <LayoutGroup>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: isOptimistic ? 0.7 : 1,
          scale: hasUpdated ? [1, 1.02, 1] : 1,
        }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          layout: { duration: 0.3, ease: 'easeInOut' },
          opacity: { duration: 0.2 },
          scale: { duration: 0.3 },
        }}
        className={cn(
          'rounded-lg border bg-card p-4 shadow-sm',
          isNew && 'ring-2 ring-primary ring-offset-2',
          isOptimistic && 'opacity-70'
        )}
      >
        {/* Task card content */}
        <h3 className="font-medium">{task.title}</h3>
        <p className="text-sm text-muted-foreground">{task.type}</p>
        {/* ... rest of card content */}
      </motion.div>
    </LayoutGroup>
  );
}
```

### Backend Correlation ID Support

```typescript
// apps/api/src/pm/tasks/tasks.controller.ts

import { Headers } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Patch(':id')
async updateTask(
  @Param('id') id: string,
  @Body() updateTaskDto: UpdateTaskDto,
  @Headers('x-correlation-id') correlationId?: string,
  @GetUser() user: User,
) {
  // Generate correlation ID if not provided
  const effectiveCorrelationId = correlationId || uuid();

  return this.tasksService.updateTask(
    id,
    updateTaskDto,
    user.id,
    effectiveCorrelationId
  );
}
```

```typescript
// apps/api/src/pm/tasks/tasks.service.ts

async updateTask(
  taskId: string,
  data: UpdateTaskDto,
  userId: string,
  correlationId: string
) {
  // Update in database
  const task = await this.prisma.task.update({
    where: { id: taskId },
    data: { ...data, updatedAt: new Date() },
    include: { phase: { select: { projectId: true } } },
  });

  // Publish event to Event Bus with correlationId
  await this.eventPublisher.publish('pm.task.updated', {
    id: task.id,
    projectId: task.phase.projectId,
    phaseId: task.phaseId,
    title: task.title,
    status: task.status,
    updatedBy: userId,
    updatedAt: task.updatedAt.toISOString(),
    correlationId, // Include correlation ID
  });

  return task;
}
```

### Performance Considerations

**React Query Optimizations:**
- Use `setQueryData` for small, targeted cache updates
- Use `invalidateQueries` when structure changes (e.g., task moves to different column)
- Use `staleTime` to reduce refetch frequency (e.g., 30 seconds)
- Use `gcTime` to keep cached data for quick navigation

**Animation Performance:**
- Use Framer Motion's layout animations for GPU-accelerated transitions
- Limit animation duration to < 300ms for snappy feel
- Use `will-change: transform` CSS hint for better performance
- Debounce rapid updates to avoid animation overload

**WebSocket Event Handling:**
- Filter events by `projectId` and `phaseId` to reduce unnecessary processing
- Skip cache invalidation for user's own actions (correlationId matching)
- Batch multiple rapid updates into single cache update

**Conflict Detection:**
- Only run conflict detection when user is actively editing
- Use ref to avoid re-running effect on every render
- Limit toast duration to avoid notification overload

### Error Handling

**Optimistic Update Failures:**
- Always snapshot previous cache state before optimistic update
- Rollback cache on mutation error
- Show clear error toast with retry option
- Log errors for debugging

**WebSocket Disconnection:**
- React Query polling provides fallback (60-second interval)
- Automatic reconnection handled by `useRealtime` hook
- Show connection status indicator if repeated failures

**Conflict Resolution:**
- Detect conflicts by comparing `updatedAt` timestamps
- Show warning toast with "Reload" action
- Don't force reload (user decides)
- Consider showing diff view in future story

### Testing Tips

**Manual Testing with Two Browsers:**
1. Open Kanban board in Chrome (User 1)
2. Open Kanban board in Firefox (User 2)
3. Create task in Chrome → Verify appears in Firefox
4. Drag task in Firefox → Verify moves in Chrome
5. Disconnect network in Chrome → Drag task → Verify rollback + error toast

**Simulating Conflicts:**
1. Open task detail in Chrome
2. Update task in Firefox (via API or UI)
3. Verify conflict warning appears in Chrome
4. Click "Reload" → Verify latest data loads

**Performance Testing:**
1. Create 50+ tasks in Kanban board
2. Rapidly drag tasks between columns
3. Verify animations remain smooth (60fps)
4. Monitor React Query DevTools for cache churn

---

## Security Considerations

**Correlation ID Validation:**
- Correlation IDs are UUIDs generated client-side
- Backend validates UUID format (optional)
- Correlation IDs are NOT used for authentication/authorization
- Only used for event tracking and deduplication

**Multi-Tenant Isolation:**
- All WebSocket events include `projectId` for filtering
- Backend validates user has access to project before emitting events
- Frontend filters events by `projectId` to prevent cross-project updates

**Cache Poisoning Prevention:**
- Never trust WebSocket event data blindly
- Always validate event payload structure
- Refetch from server after optimistic update to confirm state
- Use React Query's built-in cache validation

---

## Wireframe Reference

**No specific wireframe for real-time updates** - this story enhances existing Kanban board from PM-03.2/PM-03.3 with real-time behavior.

**Visual Feedback:**
- New tasks: subtle glow effect (ring-2 ring-primary)
- Updated tasks: scale animation (1 → 1.02 → 1)
- Moving tasks: smooth slide animation via Framer Motion layout
- Optimistic updates: reduced opacity (opacity-70)

---
