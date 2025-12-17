# Epic PM-06: Real-Time & Notifications

**Goal:** Users get live updates, presence awareness, and configurable notifications.

**FRs Covered:** FR-7, FR-8.2

## Wireframe References

| Story | Wireframe | Assets |
|-------|-----------|--------|
| PM-06: Notifications Center | PM-16 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-16_notifications_center/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-16_notifications_center/screen.png) |
| PM-06: Presence Bar | RT-02 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/rt-02_presence_bar/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/rt-02_presence_bar/screen.png) |
| PM-06: Conflict Resolution | RT-03 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/rt-03_conflict_resolution/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/rt-03_conflict_resolution/screen.png) |

---

### Story PM-06.1: WebSocket Infrastructure

**As a** platform developer,
**I want** WebSocket event broadcasting for PM events,
**So that** UI updates in real-time.

**Acceptance Criteria:**

**Given** existing WebSocket gateway
**When** PM events occur (task CRUD, status change, etc.)
**Then** events broadcast to subscribed clients

**And** events are room-scoped (workspace, project)

**And** event types: pm.task.*, pm.phase.*, pm.project.*

**Prerequisites:** Platform WebSocket (complete)

**Technical Notes:**
- Extend existing gateway in `apps/api/src/gateway/`
- Use Redis pub/sub for multi-instance

---

### Story PM-06.2: Real-Time UI Updates

**As a** project user,
**I want** the UI to update without refresh,
**So that** I see changes from teammates immediately.

**Acceptance Criteria:**

**Given** I am viewing project tasks
**When** another user updates a task
**Then** my view updates automatically

**And** optimistic updates for my own actions

**And** conflict handling (notify if concurrent edit)

**Prerequisites:** PM-06.1

**Technical Notes:**
- React Query cache invalidation on WS events
- Toast for external changes

---

### Story PM-06.3: Agent Activity Streaming

**As a** project user,
**I want** to see agent work in progress,
**So that** I know what AI is doing.

**Acceptance Criteria:**

**Given** an agent is processing a request
**When** work is in progress
**Then** UI shows: agent status indicator, current step description, progress percentage (if known)

**And** completion notification with results

**Prerequisites:** PM-06.1

**Technical Notes:**
- Agent progress events via WebSocket
- Loading state in agent panel

---

### Story PM-06.4: Presence Indicators

**As a** project user,
**I want** to see who else is viewing the project,
**So that** I'm aware of team activity.

**Acceptance Criteria:**

**Given** multiple users on same project
**When** I view project header
**Then** shows avatars of active users (last 5 minutes)

**And** tooltip shows full list

**And** shows which view each user is on

**Prerequisites:** PM-06.1

**Technical Notes:**
- Presence heartbeat every 30 seconds
- Redis for presence tracking

---

### Story PM-06.5: Notification Preferences

**As a** platform user,
**I want** to configure my notification preferences,
**So that** I get relevant alerts without noise.

**Acceptance Criteria:**

**Given** I am in user settings
**When** I configure notifications
**Then** I can toggle per event type: task assigned, task mentioned, due date reminder, agent completion, health alert

**And** per channel: in-app, email, (future: Slack)

**And** quiet hours setting (no notifications between X and Y)

**And** digest option (batch non-urgent into daily email)

**Prerequisites:** Platform notifications (complete)

**Technical Notes:**
- Extend NotificationPreference model
- Respect preferences in notification service

---

### Story PM-06.6: In-App Notification Center

**As a** platform user,
**I want** a notification inbox,
**So that** I can see and manage all alerts.

**Acceptance Criteria:**

**Given** I click notification bell
**When** dropdown opens
**Then** shows: unread notifications (highlighted), read notifications, "Mark all read" button

**And** click notification navigates to source

**And** unread count badge on bell icon

**And** infinite scroll with pagination

**Prerequisites:** PM-06.5

**Technical Notes:**
- Extend existing notification UI
- Filter by type

---
