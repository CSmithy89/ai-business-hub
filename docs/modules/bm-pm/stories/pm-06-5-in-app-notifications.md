# Story PM-06.5: In-App Notifications

**Epic:** PM-06 - Real-Time & Notifications
**Status:** drafted
**Points:** 8

---

## User Story

As a **platform user**,
I want **an in-app notification center with real-time updates**,
So that **I can see all PM notifications in one place and act on them without leaving the app**.

---

## Acceptance Criteria

### AC1: Notification Bell with Unread Count
**Given** a logged-in user with unread notifications
**When** they view the header
**Then** they see a bell icon with an unread count badge

### AC2: Notification Center Dropdown
**Given** user clicks the notification bell
**When** the dropdown opens
**Then** they see notifications grouped by date, newest first, with infinite scroll

### AC3: Mark as Read Functionality
**Given** user clicks on a notification
**When** the notification is clicked
**Then** it is marked as read and navigates to the relevant page

### AC4: Mark All as Read
**Given** user has multiple unread notifications
**When** they click "Mark all as read"
**Then** all notifications are marked as read and the badge updates

### AC5: Real-Time Updates
**Given** user has the notification center open
**When** a new notification is created (by teammate or agent)
**Then** the notification appears immediately via WebSocket without refresh

---

## Technical Approach

This story builds the **in-app notification UI** on top of the existing `Notification` model and notification preferences from PM-06.4. It integrates with the WebSocket infrastructure from PM-06.1 to provide real-time updates.

### Architecture

**Key Components:**
1. **Notification Bell** - Header component with unread badge
2. **Notification Center** - Dropdown panel with infinite scroll
3. **Notification Item** - Individual notification card with actions
4. **WebSocket Integration** - Real-time updates via Socket.io
5. **API Layer** - REST endpoints for CRUD operations

**ADR-PM06-002: Room Scoping Strategy**
- Users auto-join `user:${userId}` room on connection
- Server emits `notification.new` events to user rooms
- Frontend listens for events and invalidates React Query cache

### Data Flow

```
1. Backend creates notification → Saves to DB
2. Backend emits WebSocket event → `notification.new` to user room
3. Frontend receives event → Invalidates React Query cache
4. React Query refetches → Updates notification count and list
5. User clicks notification → Marks as read, navigates to page
```

---

## Implementation Tasks

### Database: Schema Review
- [ ] Verify existing `Notification` model in `packages/db/prisma/schema.prisma`:
  - [ ] Has `userId`, `workspaceId`, `type`, `title`, `message` fields
  - [ ] Has `readAt` timestamp for read/unread tracking
  - [ ] Has `link` field for navigation
  - [ ] Has tenant isolation via `workspaceId`
  - [ ] Has `createdAt` for date grouping
- [ ] No schema changes needed (existing model is sufficient)

### Backend: Shared Types
- [ ] Create notification API types in `packages/shared/src/types/notifications.ts`:
  - [ ] `NotificationDto` - Notification data transfer object
  - [ ] `NotificationListResponse` - Paginated list response
  - [ ] `UnreadCountResponse` - Unread count by type
  - [ ] `MarkReadResponse` - Mark as read response
- [ ] Add pagination types:
  - [ ] `PaginationMeta` - Page, limit, total, hasMore
  - [ ] `NotificationFilters` - Type, read status, workspace filters
- [ ] Export types from `packages/shared/src/index.ts`

### Backend: Notification Center API
- [ ] Create `apps/api/src/pm/notifications/notification-center.controller.ts`:
  - [ ] `GET /api/pm/notifications` - List notifications (paginated)
    - [ ] Query params: `page`, `limit`, `type`, `read`, `workspaceId`
    - [ ] Default limit: 20, max: 100
    - [ ] Return notifications ordered by `createdAt DESC`
    - [ ] Include pagination meta (total, hasMore)
  - [ ] `GET /api/pm/notifications/unread-count` - Get unread count
    - [ ] Query params: `workspaceId` (optional)
    - [ ] Return total count and count by type
  - [ ] `POST /api/pm/notifications/:id/read` - Mark as read
    - [ ] Set `readAt` timestamp
    - [ ] Return updated notification
  - [ ] `POST /api/pm/notifications/bulk-read` - Mark multiple as read
    - [ ] Body: `{ ids: string[] }`
    - [ ] Update all notifications in array
    - [ ] Return count of updated notifications
  - [ ] `POST /api/pm/notifications/read-all` - Mark all as read
    - [ ] Query params: `workspaceId` (optional)
    - [ ] Update all unread notifications for user
    - [ ] Return count of updated notifications
  - [ ] `DELETE /api/pm/notifications/:id` - Delete notification
    - [ ] Soft delete or hard delete (TBD)
    - [ ] Return success response
  - [ ] Use `@UseGuards(JwtAuthGuard)` for all endpoints
  - [ ] Use `@CurrentUser()` decorator to get userId
- [ ] Update `apps/api/src/pm/notifications/notifications.service.ts`:
  - [ ] `listNotifications(userId, filters, pagination)` - Query notifications with filters
  - [ ] `getUnreadCount(userId, workspaceId?)` - Count unread notifications
  - [ ] `markAsRead(notificationId, userId)` - Mark single notification as read
  - [ ] `markManyAsRead(notificationIds, userId)` - Mark multiple as read
  - [ ] `markAllAsRead(userId, workspaceId?)` - Mark all as read
  - [ ] `deleteNotification(notificationId, userId)` - Delete notification
  - [ ] `createNotification(data)` - Create notification (for testing)
  - [ ] All methods include tenant isolation (userId check)
- [ ] Add DTOs in `apps/api/src/pm/notifications/dto/`:
  - [ ] `list-notifications.dto.ts` - Query validation
  - [ ] `bulk-read.dto.ts` - Bulk read validation
  - [ ] Use Zod schemas for validation

### Backend: WebSocket Events
- [ ] Update `apps/api/src/realtime/realtime.types.ts`:
  - [ ] Add `notification.new` event to `ServerToClientEvents` interface
  - [ ] Add `NotificationEventPayload` interface:
    ```typescript
    export interface NotificationEventPayload {
      id: string;
      userId: string;
      workspaceId: string;
      type: string;
      title: string;
      message: string;
      link: string | null;
      createdAt: string;
    }
    ```
  - [ ] Add to `WS_EVENTS` constants
- [ ] Update `apps/api/src/realtime/realtime.gateway.ts`:
  - [ ] Add method `emitNotificationToUser(userId, notification)`:
    - [ ] Emit to `user:${userId}` room
    - [ ] Event: `notification.new`
    - [ ] Payload: `NotificationEventPayload`
- [ ] Update `apps/api/src/pm/notifications/notifications.service.ts`:
  - [ ] Inject `RealtimeGateway`
  - [ ] After creating notification, emit WebSocket event:
    ```typescript
    this.gateway.emitNotificationToUser(userId, notificationPayload);
    ```

### Frontend: React Query Hooks
- [ ] Create `apps/web/src/hooks/use-notifications.ts`:
  - [ ] `useNotifications(workspaceId, filters)` - Infinite query for notifications
    - [ ] Use `useInfiniteQuery` for pagination
    - [ ] Query key: `['notifications', workspaceId, filters]`
    - [ ] Fetch function: `GET /api/pm/notifications`
    - [ ] Get next page param from `meta.hasMore`
  - [ ] `useUnreadCount(workspaceId)` - Query for unread count
    - [ ] Query key: `['notifications', workspaceId, 'unread-count']`
    - [ ] Fetch function: `GET /api/pm/notifications/unread-count`
    - [ ] Refetch interval: 60 seconds (fallback if WebSocket drops)
  - [ ] `useMarkAsRead()` - Mutation to mark notification as read
    - [ ] Mutation function: `POST /api/pm/notifications/:id/read`
    - [ ] Optimistic update: Set `readAt` immediately
    - [ ] Invalidate unread count on success
  - [ ] `useMarkAllAsRead()` - Mutation to mark all as read
    - [ ] Mutation function: `POST /api/pm/notifications/read-all`
    - [ ] Invalidate notification list and unread count
  - [ ] `useDeleteNotification()` - Mutation to delete notification
    - [ ] Mutation function: `DELETE /api/pm/notifications/:id`
    - [ ] Remove from cache optimistically
    - [ ] Invalidate queries on success

### Frontend: Notification Bell Component
- [ ] Create `apps/web/src/components/notifications/NotificationBell.tsx`:
  - [ ] Render bell icon (`Bell` from lucide-react)
  - [ ] Fetch unread count via `useUnreadCount(workspaceId)`
  - [ ] Display badge if count > 0:
    - [ ] Show count if count <= 99
    - [ ] Show "99+" if count > 99
    - [ ] Use shadcn `Badge` component
    - [ ] Position badge absolutely (top-right of bell icon)
  - [ ] Use shadcn `Popover` for dropdown
  - [ ] Click bell toggles popover open/closed
  - [ ] Render `NotificationCenter` inside popover content
  - [ ] Close popover when user clicks notification (navigates away)
  - [ ] Accessible: ARIA labels, keyboard navigation

### Frontend: Notification Center Component
- [ ] Create `apps/web/src/components/notifications/NotificationCenter.tsx`:
  - [ ] Accept props: `workspaceId`, `onClose` callback
  - [ ] Fetch notifications via `useNotifications(workspaceId)`
  - [ ] Display header:
    - [ ] Title: "Notifications"
    - [ ] "Mark all as read" button (right-aligned)
  - [ ] Display notification list:
    - [ ] Group by date: "Today", "Yesterday", "This Week", "Older"
    - [ ] Render `NotificationItem` for each notification
    - [ ] Use shadcn `ScrollArea` for scrolling
    - [ ] Infinite scroll: Detect scroll to bottom, call `fetchNextPage()`
    - [ ] Show loading spinner when `isFetchingNextPage`
  - [ ] Empty state:
    - [ ] Show "No notifications" message with icon
    - [ ] Center vertically
  - [ ] Handle "Mark all as read":
    - [ ] Call `useMarkAllAsRead()` mutation
    - [ ] Show toast on success
    - [ ] Disable button during mutation
  - [ ] Responsive design:
    - [ ] Popover width: 400px on desktop
    - [ ] Full width on mobile
    - [ ] Max height: 500px, scroll inside

### Frontend: Notification Item Component
- [ ] Create `apps/web/src/components/notifications/NotificationItem.tsx`:
  - [ ] Accept props: `notification`, `onRead` callback
  - [ ] Display notification content:
    - [ ] Title (bold if unread)
    - [ ] Message (truncate if > 100 chars)
    - [ ] Timestamp (relative: "2 hours ago")
    - [ ] Type icon (different icons per type)
  - [ ] Visual states:
    - [ ] Unread: Blue left border, light blue background
    - [ ] Read: Gray left border, white background
    - [ ] Hover: Darker background
  - [ ] Click behavior:
    - [ ] Mark as read via `useMarkAsRead()` mutation
    - [ ] Navigate to `notification.link` (if present)
    - [ ] Call `onRead()` callback (closes popover)
  - [ ] Actions menu (three dots):
    - [ ] "Mark as unread" (toggle `readAt`)
    - [ ] "Delete" (confirm dialog)
  - [ ] Use shadcn components:
    - [ ] `Card` for container
    - [ ] `DropdownMenu` for actions
    - [ ] `AlertDialog` for delete confirmation
  - [ ] Accessible: Clickable, keyboard navigation

### Frontend: Notification Type Icons
- [ ] Create `apps/web/src/components/notifications/NotificationIcon.tsx`:
  - [ ] Accept props: `type` (notification type)
  - [ ] Return icon based on type:
    - [ ] `task.assigned` → `UserPlus` icon
    - [ ] `task.mentioned` → `AtSign` icon
    - [ ] `task.due_date_reminder` → `Clock` icon
    - [ ] `agent.task_completed` → `CheckCircle` icon
    - [ ] `project.health_alert` → `AlertTriangle` icon
    - [ ] Default → `Bell` icon
  - [ ] Color-code icons:
    - [ ] Info: Blue
    - [ ] Success: Green
    - [ ] Warning: Yellow
    - [ ] Error: Red

### Frontend: Date Grouping Logic
- [ ] Create `apps/web/src/lib/utils/notification-grouping.ts`:
  - [ ] `groupNotificationsByDate(notifications)` function:
    - [ ] Take array of notifications
    - [ ] Return grouped object: `{ today: [], yesterday: [], thisWeek: [], older: [] }`
    - [ ] Use `date-fns` for date comparisons:
      - [ ] `isToday(date)` → "Today"
      - [ ] `isYesterday(date)` → "Yesterday"
      - [ ] `isThisWeek(date)` → "This Week"
      - [ ] Else → "Older"
  - [ ] `formatRelativeTime(date)` function:
    - [ ] Return "Just now", "5 minutes ago", "2 hours ago", "Yesterday at 3:00 PM", etc.
    - [ ] Use `date-fns` `formatDistanceToNow` or `format`

### Frontend: Real-Time Updates
- [ ] Create `apps/web/src/hooks/use-realtime-notifications.ts`:
  - [ ] Use `useRealtime()` hook to get socket
  - [ ] Listen for `notification.new` events
  - [ ] On event received:
    - [ ] Invalidate `['notifications', workspaceId]` query
    - [ ] Invalidate `['notifications', workspaceId, 'unread-count']` query
    - [ ] Optionally show toast with notification title (if user is not viewing notification center)
  - [ ] Cleanup listener on unmount
- [ ] Integrate into `NotificationBell.tsx`:
  - [ ] Call `useRealtimeNotifications(workspaceId)` hook
  - [ ] Real-time updates automatically refresh badge and list

### Frontend: Header Integration
- [ ] Update `apps/web/src/components/layout/Header.tsx`:
  - [ ] Import `NotificationBell` component
  - [ ] Render bell between workspace selector and user menu
  - [ ] Pass current `workspaceId` as prop
  - [ ] Ensure proper spacing and alignment
  - [ ] Mobile: Show bell in mobile header

---

## Files to Create/Modify

### Backend Files
- `apps/api/src/pm/notifications/notification-center.controller.ts` - NEW: REST API for notification center
- `apps/api/src/pm/notifications/notifications.service.ts` - MODIFY: Add list, count, mark as read methods
- `apps/api/src/pm/notifications/dto/list-notifications.dto.ts` - NEW: Query validation
- `apps/api/src/pm/notifications/dto/bulk-read.dto.ts` - NEW: Bulk read validation
- `apps/api/src/realtime/realtime.types.ts` - MODIFY: Add notification event types
- `apps/api/src/realtime/realtime.gateway.ts` - MODIFY: Add emitNotificationToUser method

### Shared Packages
- `packages/shared/src/types/notifications.ts` - MODIFY: Add notification API types
- `packages/shared/src/index.ts` - MODIFY: Export notification types

### Frontend Files
- `apps/web/src/components/notifications/NotificationBell.tsx` - NEW: Bell icon with badge
- `apps/web/src/components/notifications/NotificationCenter.tsx` - NEW: Dropdown panel
- `apps/web/src/components/notifications/NotificationItem.tsx` - NEW: Individual notification card
- `apps/web/src/components/notifications/NotificationIcon.tsx` - NEW: Type-specific icons
- `apps/web/src/hooks/use-notifications.ts` - NEW: React Query hooks
- `apps/web/src/hooks/use-realtime-notifications.ts` - NEW: WebSocket integration
- `apps/web/src/lib/utils/notification-grouping.ts` - NEW: Date grouping utilities
- `apps/web/src/components/layout/Header.tsx` - MODIFY: Add notification bell

---

## Testing Requirements

### Unit Tests

**Location:** `apps/api/src/pm/notifications/notifications.service.spec.ts`

Test cases:
- List notifications (empty)
- List notifications (with data)
- List notifications (pagination)
- List notifications (filter by type)
- List notifications (filter by read status)
- Get unread count (no notifications)
- Get unread count (with unread)
- Get unread count (by type)
- Mark notification as read (success)
- Mark notification as read (not found - 404)
- Mark notification as read (wrong user - 403)
- Mark multiple as read (bulk)
- Mark all as read (workspace filter)
- Delete notification (success)
- Delete notification (not found - 404)

**Location:** `apps/api/src/pm/notifications/notification-center.controller.spec.ts`

Test cases:
- GET /api/pm/notifications (authenticated)
- GET /api/pm/notifications (unauthenticated - 401)
- GET /api/pm/notifications (pagination)
- GET /api/pm/notifications (filter by type)
- GET /api/pm/notifications (filter by read status)
- GET /api/pm/notifications/unread-count (success)
- POST /api/pm/notifications/:id/read (success)
- POST /api/pm/notifications/bulk-read (success)
- POST /api/pm/notifications/read-all (success)
- DELETE /api/pm/notifications/:id (success)

### Integration Tests

**Location:** `apps/api/test/pm/notification-center.e2e-spec.ts` (new file)

Test cases:
- Create notification, verify in list
- Mark notification as read, verify readAt timestamp
- Mark all as read, verify all notifications updated
- Delete notification, verify removed from list
- Filter notifications by type
- Filter notifications by read status
- Pagination (page 1, page 2, hasMore)
- Tenant isolation (user can't see other user's notifications)

### Frontend Tests

**Location:** `apps/web/src/components/notifications/NotificationBell.test.tsx`

Test cases:
- Render bell icon
- Show badge when unread count > 0
- Hide badge when unread count = 0
- Show "99+" when unread count > 99
- Open popover on click
- Close popover when notification clicked

**Location:** `apps/web/src/components/notifications/NotificationCenter.test.tsx`

Test cases:
- Render notification list
- Group notifications by date
- Show empty state when no notifications
- Mark all as read
- Infinite scroll (load next page)
- Show loading spinner during fetch

**Location:** `apps/web/src/components/notifications/NotificationItem.test.tsx`

Test cases:
- Render notification title and message
- Show unread state (blue border)
- Show read state (gray border)
- Mark as read on click
- Navigate to link on click
- Delete notification (confirm dialog)

### E2E Tests (Playwright)

**Location:** `apps/web/e2e/notification-center.spec.ts` (new file)

Test cases:
- User receives notification, badge appears
- Click bell, notification center opens
- Click notification, marks as read, navigates to page
- Mark all as read, badge disappears
- Real-time update (new notification appears without refresh)
- Delete notification from center

### Manual Testing Checklist

- [ ] Create test notification via backend API
- [ ] Verify badge appears on bell icon
- [ ] Click bell, verify notification center opens
- [ ] Verify notification appears in list
- [ ] Click notification, verify navigation works
- [ ] Verify notification marked as read
- [ ] Verify badge count decrements
- [ ] Create multiple notifications
- [ ] Verify date grouping (Today, Yesterday, This Week, Older)
- [ ] Scroll to bottom, verify next page loads
- [ ] Click "Mark all as read"
- [ ] Verify all notifications marked as read
- [ ] Verify badge disappears
- [ ] Open notification center in two browser tabs
- [ ] Create notification via API
- [ ] Verify notification appears in both tabs (real-time)
- [ ] Delete notification, verify removed from list
- [ ] Test on mobile (responsive layout)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Backend API endpoints implemented (list, count, mark as read, delete)
- [ ] WebSocket events added to realtime gateway
- [ ] React Query hooks implemented
- [ ] Notification bell component implemented
- [ ] Notification center component implemented
- [ ] Notification item component implemented
- [ ] Date grouping logic implemented
- [ ] Real-time updates working via WebSocket
- [ ] Header integration complete
- [ ] Unit tests passing (backend)
- [ ] Integration tests passing
- [ ] Frontend tests passing
- [ ] E2E tests passing (Playwright)
- [ ] TypeScript type checks pass
- [ ] ESLint passes (no new errors)
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] API endpoint documentation
  - [ ] WebSocket event documentation
  - [ ] Component usage examples
  - [ ] Date grouping logic documented

---

## Dependencies

### Prerequisites
- **PM-06.1** (WebSocket Infrastructure) - COMPLETE - Realtime gateway and PM events
- **PM-06.4** (Notification Preferences) - COMPLETE - Preference model extended
- **Existing Notification model** - COMPLETE - Database schema exists
- **Header component** - COMPLETE - Layout infrastructure

### Blocks
- **PM-06.6** (Email Digest Notifications) - Email digests use same notification data

---

## References

- [Epic Definition](../epics/epic-pm-06-real-time-notifications.md) - Story PM-06.5
- [Epic Tech Spec](../epics/epic-pm-06-tech-spec.md) - Notification center architecture
- [Module PRD](../PRD.md) - Notification requirements (FR-8.2)
- [Module Architecture](../architecture.md) - WebSocket and notification patterns
- [Sprint Status](../sprint-status.yaml)
- [Existing Realtime Gateway](../../../../apps/api/src/realtime/realtime.gateway.ts)
- [Notification Preferences Story](./pm-06-4-notification-preferences.md) - Preference model

---

## Dev Notes

### Notification Data Model

Existing `Notification` model (no changes needed):

```prisma
model Notification {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  workspaceId String   @map("workspace_id")
  type        String   // e.g., "task.assigned", "task.mentioned"
  title       String
  message     String
  link        String?  // URL to navigate to
  readAt      DateTime? @map("read_at")
  createdAt   DateTime @default(now()) @map("created_at")

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([userId, readAt])
  @@index([workspaceId])
  @@map("notifications")
}
```

### API Response Formats

**List Notifications:**
```json
{
  "data": [
    {
      "id": "notif-123",
      "userId": "user-456",
      "workspaceId": "ws-789",
      "type": "task.assigned",
      "title": "You were assigned to a task",
      "message": "John Doe assigned you to \"Fix login bug\"",
      "link": "/projects/proj-1/tasks/task-5",
      "readAt": null,
      "createdAt": "2025-12-20T10:30:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

**Unread Count:**
```json
{
  "data": {
    "count": 12,
    "byType": {
      "task.assigned": 3,
      "task.mentioned": 5,
      "agent.task_completed": 2,
      "project.health_alert": 2
    }
  }
}
```

### WebSocket Event Flow

```
1. Backend: Task assigned to user
   ↓
2. NotificationsService.createNotification(...)
   ↓ Saves to DB
3. prisma.notification.create(...)
   ↓ Returns notification
4. RealtimeGateway.emitNotificationToUser(userId, notification)
   ↓ Emits to user room
5. socket.to(`user:${userId}`).emit('notification.new', payload)
   ↓ WebSocket broadcast
6. Frontend: useRealtimeNotifications hook receives event
   ↓ Invalidates cache
7. React Query refetches notifications and unread count
   ↓ UI updates
8. Badge and list update automatically
```

### Infinite Scroll Implementation

```typescript
// Example: Infinite query hook
export function useNotifications(workspaceId: string, filters?: NotificationFilters) {
  return useInfiniteQuery({
    queryKey: ['notifications', workspaceId, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        workspaceId,
        page: String(pageParam),
        limit: '20',
        ...filters,
      });

      const response = await fetch(`/api/pm/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined;
    },
  });
}

// Usage in component
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications(workspaceId);

// Flatten pages
const notifications = data?.pages.flatMap(page => page.data) ?? [];

// Detect scroll to bottom
const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
  if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
};
```

### Date Grouping Example

```typescript
export function groupNotificationsByDate(notifications: Notification[]) {
  const groups = {
    today: [] as Notification[],
    yesterday: [] as Notification[],
    thisWeek: [] as Notification[],
    older: [] as Notification[],
  };

  notifications.forEach(notification => {
    const date = new Date(notification.createdAt);

    if (isToday(date)) {
      groups.today.push(notification);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notification);
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
}
```

### Optimistic Mark as Read

```typescript
const { mutate: markAsRead } = useMutation({
  mutationFn: (notificationId: string) =>
    fetch(`/api/pm/notifications/${notificationId}/read`, { method: 'POST' }),

  onMutate: async (notificationId) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries(['notifications', workspaceId]);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['notifications', workspaceId]);

    // Optimistically update
    queryClient.setQueriesData(['notifications', workspaceId], (old: any) => {
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          data: page.data.map((n: Notification) =>
            n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
          ),
        })),
      };
    });

    return { previous };
  },

  onError: (err, notificationId, context) => {
    // Rollback on error
    queryClient.setQueryData(['notifications', workspaceId], context?.previous);
  },

  onSuccess: () => {
    // Invalidate unread count
    queryClient.invalidateQueries(['notifications', workspaceId, 'unread-count']);
  },
});
```

### Badge Display Logic

```typescript
function formatBadgeCount(count: number): string {
  if (count === 0) return '';
  if (count <= 99) return String(count);
  return '99+';
}

// Usage
<Badge>{formatBadgeCount(unreadCount)}</Badge>
```

### Notification Type Configuration

```typescript
export const NOTIFICATION_CONFIG = {
  'task.assigned': {
    icon: UserPlus,
    color: 'text-blue-500',
    label: 'Task Assigned',
  },
  'task.mentioned': {
    icon: AtSign,
    color: 'text-purple-500',
    label: 'Mentioned',
  },
  'task.due_date_reminder': {
    icon: Clock,
    color: 'text-yellow-500',
    label: 'Due Date Reminder',
  },
  'agent.task_completed': {
    icon: CheckCircle,
    color: 'text-green-500',
    label: 'Agent Completed',
  },
  'project.health_alert': {
    icon: AlertTriangle,
    color: 'text-red-500',
    label: 'Health Alert',
  },
} as const;
```

### Mobile Responsive Design

```typescript
// Popover content responsive width
<PopoverContent
  className={cn(
    "p-0",
    "w-[400px] max-w-[calc(100vw-2rem)]", // 400px on desktop, full width minus padding on mobile
  )}
  align="end"
>
  {/* Notification center content */}
</PopoverContent>
```

### Performance Considerations

- Use React Query's `staleTime` to avoid excessive refetches
- Implement virtual scrolling for large notification lists (optional, only if performance issues)
- Debounce scroll events for infinite scroll
- Cache notification preferences to avoid repeated checks
- Use optimistic updates for instant feedback

### Error Handling

**Backend:**
- Return 404 if notification not found
- Return 403 if user tries to access another user's notification
- Return 400 for invalid query parameters
- Log errors for debugging

**Frontend:**
- Show toast on mark as read error
- Rollback optimistic updates on error
- Retry failed fetches (React Query automatic retry)
- Show empty state if fetch fails
- Graceful degradation if WebSocket disconnected (fallback to polling)

### Accessibility

- Notification bell:
  - ARIA label: "Notifications"
  - ARIA live region for badge updates
  - Keyboard accessible (Tab, Enter)
- Notification center:
  - ARIA role: "dialog"
  - Focus trap when open
  - Close on Escape key
- Notification items:
  - Clickable via keyboard (Enter)
  - Tab navigation between items
  - Screen reader announces unread status

### Future Enhancements (Out of Scope)

- Notification grouping (bundle similar notifications)
- Notification snooze (remind me later)
- Notification templates (customize message format)
- Notification categories (filter by category)
- Notification search
- Export notifications (CSV)
- Desktop push notifications (via Service Worker)
- Sound/vibration on new notification

---

## Implementation

_This section will be filled in during development._

---

## Dev Agent Record

_This section will be filled in during development._

---

## Senior Developer Review

_This section will be filled in during code review._
