# Story PM-06.4: Notification Preferences

**Epic:** PM-06 - Real-Time & Notifications
**Status:** drafted
**Points:** 5

---

## User Story

As a **platform user**,
I want **fine-grained notification preference controls**,
So that **I can customize which PM notifications I receive and when**.

---

## Acceptance Criteria

### AC1: User Can Configure PM Notification Preferences
**Given** a logged-in user
**When** they access notification settings
**Then** they can enable/disable PM notifications by type and channel (email, in-app)

### AC2: Quiet Hours Support
**Given** user has set quiet hours
**When** notifications are generated during quiet hours
**Then** they are suppressed or delayed per user preferences

### AC3: Preferences Persist and Apply Immediately
**Given** user updates notification preferences
**When** preferences are saved
**Then** future notifications respect the updated preferences

---

## Technical Approach

This story **extends the existing `NotificationPreference` model** with PM-specific fields rather than creating new tables. The existing model already handles platform-wide notification preferences (approvals, workspace invites, agent errors).

We add **PM-specific notification types** and **quiet hours configuration** on top of this foundation.

### Architecture

**ADR-PM06-005: Notification Preference Granularity**
- Extend existing `NotificationPreference` model with PM-specific fields
- Each notification type can be toggled per channel (email, in-app)
- Quiet hours apply globally (not per event type)
- All new fields have `@default(true)` (opt-out model)

### Data Model Changes

Extend `NotificationPreference` model in `packages/db/prisma/schema.prisma`:

```prisma
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
```

---

## Implementation Tasks

### Database: Schema Migration
- [ ] Add PM notification fields to `NotificationPreference` model in `packages/db/prisma/schema.prisma`:
  - [ ] Add email preferences: `emailTaskAssigned`, `emailTaskMentioned`, `emailDueDateReminder`, `emailAgentCompletion`, `emailHealthAlert`
  - [ ] Add in-app preferences: `inAppTaskAssigned`, `inAppTaskMentioned`, `inAppDueDateReminder`, `inAppAgentCompletion`, `inAppHealthAlert`
  - [ ] Add quiet hours fields: `quietHoursStart`, `quietHoursEnd`, `quietHoursTimezone`
  - [ ] Add digest settings: `digestEnabled`, `digestFrequency`
  - [ ] All new fields use snake_case `@map()` for database columns
  - [ ] All boolean fields default to `true` (opt-out model)
- [ ] Generate Prisma migration: `pnpm db:migrate:dev --name add-pm-notification-preferences`
- [ ] Run migration against local database
- [ ] Verify existing records get default values

### Backend: Shared Types
- [ ] Create shared types in `packages/shared/src/types/notifications.ts`:
  - [ ] `NotificationPreferenceDto` - DTO for preference CRUD
  - [ ] `PMNotificationType` enum - Task notification types
  - [ ] `NotificationChannel` enum - Email, InApp, Push (future)
  - [ ] `QuietHoursConfig` interface - Quiet hours configuration
  - [ ] `DigestFrequency` type - Daily, weekly
- [ ] Export types from `packages/shared/src/index.ts`

### Backend: Notification Preferences API
- [ ] Create `apps/api/src/pm/notifications/notifications.module.ts`:
  - [ ] Import `PrismaModule`, `AuthModule`
  - [ ] Export `NotificationsService`, `NotificationPreferencesController`
- [ ] Create `apps/api/src/pm/notifications/notifications.service.ts`:
  - [ ] `getUserPreferences(userId: string)` - Get user's notification preferences
  - [ ] `updateUserPreferences(userId: string, data: UpdatePreferencesDto)` - Update preferences
  - [ ] `resetToDefaults(userId: string)` - Reset preferences to defaults
  - [ ] `shouldSendNotification(userId, type, channel)` - Check if notification should be sent
  - [ ] `isInQuietHours(preferences, timestamp)` - Check if timestamp is in quiet hours
  - [ ] Handle preference creation if not exists (auto-create on first access)
- [ ] Create `apps/api/src/pm/notifications/notification-preferences.controller.ts`:
  - [ ] `GET /api/pm/notifications/preferences` - Get user preferences
  - [ ] `PATCH /api/pm/notifications/preferences` - Update preferences
  - [ ] `POST /api/pm/notifications/preferences/reset` - Reset to defaults
  - [ ] Use `@UseGuards(JwtAuthGuard)` for authentication
  - [ ] Use `@CurrentUser()` decorator to get userId
- [ ] Create DTOs in `apps/api/src/pm/notifications/dto/`:
  - [ ] `update-preferences.dto.ts` - Validation for preference updates
  - [ ] Use Zod schemas for validation

### Backend: Quiet Hours Logic
- [ ] Implement quiet hours checking in `notifications.service.ts`:
  - [ ] Parse `quietHoursStart` and `quietHoursEnd` (HH:MM format)
  - [ ] Convert to user's timezone using `quietHoursTimezone`
  - [ ] Check if current time falls within quiet hours
  - [ ] Handle overnight ranges (e.g., 22:00 to 08:00)
  - [ ] Return boolean indicating if notification should be suppressed
- [ ] Add unit tests for quiet hours logic:
  - [ ] Test overnight ranges
  - [ ] Test timezone conversion
  - [ ] Test edge cases (midnight, noon)

### Frontend: Settings Page UI
- [ ] Create `apps/web/src/components/settings/notification-preferences/NotificationPreferencesPanel.tsx`:
  - [ ] Fetch preferences via `GET /api/pm/notifications/preferences`
  - [ ] Display PM notification toggles in grouped sections:
    - [ ] Section: "Task Notifications" (assigned, mentioned, due date)
    - [ ] Section: "Agent Notifications" (completion, health alerts)
    - [ ] Section: "Quiet Hours" (start time, end time, timezone)
    - [ ] Section: "Email Digest" (enabled, frequency)
  - [ ] Each toggle shows both email and in-app channels
  - [ ] Use shadcn `Switch` component for toggles
  - [ ] Use shadcn `Select` component for timezone and digest frequency
  - [ ] Use React Hook Form for form state
  - [ ] Optimistic updates on toggle changes
  - [ ] Show toast on save success/error
- [ ] Add "Reset to Defaults" button:
  - [ ] Confirm via dialog before reset
  - [ ] Call `POST /api/pm/notifications/preferences/reset`
  - [ ] Refresh UI on success
- [ ] Add "Save Changes" button:
  - [ ] Batch updates and call `PATCH /api/pm/notifications/preferences`
  - [ ] Show loading state during save
  - [ ] Disable form during save

### Frontend: Quiet Hours Time Picker
- [ ] Create `apps/web/src/components/settings/notification-preferences/QuietHoursTimePicker.tsx`:
  - [ ] Use shadcn `Input` with `type="time"` for start/end times
  - [ ] Display timezone selector with common timezones
  - [ ] Show visual indicator of quiet hours range
  - [ ] Validate start < end (or overnight if start > end)
  - [ ] Format times in HH:MM format (24-hour)

### Frontend: Settings Navigation
- [ ] Add "Notifications" tab to settings page (`apps/web/src/app/(dashboard)/settings/page.tsx`):
  - [ ] Add to existing settings tabs (API Keys, MCP, Modules)
  - [ ] Route to `/settings/notifications`
  - [ ] Show active state when selected
- [ ] Create route `apps/web/src/app/(dashboard)/settings/notifications/page.tsx`:
  - [ ] Import and render `NotificationPreferencesPanel`
  - [ ] Add page title and description
  - [ ] Responsive layout (mobile-friendly)

### Frontend: React Query Integration
- [ ] Create React Query hooks in `apps/web/src/hooks/use-notification-preferences.ts`:
  - [ ] `useNotificationPreferences()` - Fetch preferences
  - [ ] `useUpdateNotificationPreferences()` - Update preferences mutation
  - [ ] `useResetNotificationPreferences()` - Reset mutation
  - [ ] Invalidate queries on mutation success
  - [ ] Handle loading and error states

---

## Files to Create/Modify

### Database
- `packages/db/prisma/schema.prisma` - Extend NotificationPreference model
- `packages/db/prisma/migrations/XXXXXX_add_pm_notification_preferences/migration.sql` - Generated migration

### Backend Files
- `apps/api/src/pm/notifications/notifications.module.ts` - NEW: Module for notification preferences
- `apps/api/src/pm/notifications/notifications.service.ts` - NEW: Preference CRUD and quiet hours logic
- `apps/api/src/pm/notifications/notification-preferences.controller.ts` - NEW: REST API endpoints
- `apps/api/src/pm/notifications/dto/update-preferences.dto.ts` - NEW: Validation DTOs
- `apps/api/src/pm/pm.module.ts` - Import NotificationsModule

### Shared Packages
- `packages/shared/src/types/notifications.ts` - NEW: Shared notification types
- `packages/shared/src/index.ts` - Export notification types

### Frontend Files
- `apps/web/src/components/settings/notification-preferences/NotificationPreferencesPanel.tsx` - NEW: Main settings panel
- `apps/web/src/components/settings/notification-preferences/QuietHoursTimePicker.tsx` - NEW: Time picker component
- `apps/web/src/app/(dashboard)/settings/notifications/page.tsx` - NEW: Settings page route
- `apps/web/src/app/(dashboard)/settings/page.tsx` - Add notifications tab
- `apps/web/src/hooks/use-notification-preferences.ts` - NEW: React Query hooks

---

## Testing Requirements

### Unit Tests

**Location:** `apps/api/src/pm/notifications/notifications.service.spec.ts`

Test cases:
- Get user preferences (existing record)
- Get user preferences (auto-create if not exists)
- Update user preferences (partial updates)
- Reset to defaults
- Check if notification should be sent (preference enabled)
- Check if notification should be sent (preference disabled)
- Quiet hours detection (within quiet hours)
- Quiet hours detection (outside quiet hours)
- Quiet hours detection (overnight range)
- Quiet hours detection (timezone conversion)
- Quiet hours detection (null quiet hours config)

**Location:** `apps/api/src/pm/notifications/notification-preferences.controller.spec.ts`

Test cases:
- GET /api/pm/notifications/preferences (authenticated)
- GET /api/pm/notifications/preferences (unauthenticated - 401)
- PATCH /api/pm/notifications/preferences (valid data)
- PATCH /api/pm/notifications/preferences (invalid data - 400)
- POST /api/pm/notifications/preferences/reset (success)

### Integration Tests

**Location:** `apps/api/test/pm/notifications.e2e-spec.ts` (new file)

Test cases:
- Full preference update flow (create user, get defaults, update, verify)
- Reset preferences to defaults
- Quiet hours enforcement (notification suppressed during quiet hours)
- Preferences persist across sessions

### Frontend Tests

**Location:** `apps/web/src/components/settings/notification-preferences/NotificationPreferencesPanel.test.tsx`

Test cases:
- Render notification toggles
- Toggle email preference
- Toggle in-app preference
- Set quiet hours start/end times
- Select timezone
- Save changes (success)
- Save changes (error)
- Reset to defaults (with confirmation)

### Manual Testing Checklist

- [ ] Navigate to `/settings/notifications`
- [ ] Verify all PM notification toggles render
- [ ] Toggle "Email - Task Assigned" preference
- [ ] Verify optimistic update (toggle responds immediately)
- [ ] Click "Save Changes"
- [ ] Verify toast success message
- [ ] Refresh page
- [ ] Verify preference persisted
- [ ] Set quiet hours (start: 22:00, end: 08:00, timezone: America/Los_Angeles)
- [ ] Save changes
- [ ] Verify quiet hours saved
- [ ] Click "Reset to Defaults"
- [ ] Confirm dialog
- [ ] Verify all preferences reset to defaults
- [ ] Test on mobile (responsive layout)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Prisma schema extended with PM notification fields
- [ ] Database migration generated and applied
- [ ] Shared types created and exported
- [ ] Backend API endpoints implemented (GET, PATCH, POST)
- [ ] Quiet hours logic implemented and tested
- [ ] React settings panel implemented
- [ ] Quiet hours time picker component implemented
- [ ] Settings navigation updated with notifications tab
- [ ] React Query hooks implemented
- [ ] Unit tests passing (backend)
- [ ] Integration tests passing
- [ ] Frontend tests passing
- [ ] TypeScript type checks pass
- [ ] ESLint passes (no new errors)
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] API endpoint documentation
  - [ ] Notification preference fields documented
  - [ ] Quiet hours behavior documented

---

## Dependencies

### Prerequisites
- **Platform Authentication** (complete) - JWT auth and user context
- **Existing NotificationPreference model** (complete) - Base model exists
- **Settings page infrastructure** (complete) - Settings navigation and routing

### Blocks
- **PM-06.5** (In-App Notification Center) - Notification center reads preferences for filtering
- **PM-06.6** (Email Digest Notifications) - Digest uses `digestEnabled` and `digestFrequency` fields

---

## References

- [Epic Definition](../epics/epic-pm-06-real-time-notifications.md) - Story PM-06.4
- [Epic Tech Spec](../epics/epic-pm-06-tech-spec.md) - Notification preferences architecture (ADR-PM06-005)
- [Module PRD](../PRD.md) - Notification requirements (FR-8.2)
- [Module Architecture](../architecture.md) - Settings page patterns
- [Sprint Status](../sprint-status.yaml)
- [Platform Notification Model](../../../../packages/db/prisma/schema.prisma) - Existing NotificationPreference model

---

## Dev Notes

### Notification Type Mapping

PM notification types and their preference fields:

| Event Type | Email Field | InApp Field | Use Case |
|------------|-------------|-------------|----------|
| `task.assigned` | `emailTaskAssigned` | `inAppTaskAssigned` | User assigned to task |
| `task.mentioned` | `emailTaskMentioned` | `inAppTaskMentioned` | User mentioned in comment |
| `task.due_date_reminder` | `emailDueDateReminder` | `inAppDueDateReminder` | Task due date approaching |
| `agent.task_completed` | `emailAgentCompletion` | `inAppAgentCompletion` | Agent completed task |
| `project.health_alert` | `emailHealthAlert` | `inAppHealthAlert` | Project health status change |

### Quiet Hours Implementation

```typescript
// Example quiet hours check
function isInQuietHours(
  preferences: NotificationPreference,
  timestamp: Date
): boolean {
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
    return false; // No quiet hours configured
  }

  // Convert timestamp to user's timezone
  const userTime = DateTime.fromJSDate(timestamp, {
    zone: preferences.quietHoursTimezone,
  });

  const [startHour, startMinute] = preferences.quietHoursStart.split(':').map(Number);
  const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);

  const start = userTime.set({ hour: startHour, minute: startMinute });
  const end = userTime.set({ hour: endHour, minute: endMinute });

  // Handle overnight ranges (e.g., 22:00 to 08:00)
  if (start > end) {
    // Quiet hours span midnight
    return userTime >= start || userTime <= end;
  } else {
    // Quiet hours within same day
    return userTime >= start && userTime <= end;
  }
}
```

### Preference Update Patterns

**Partial Updates:**
```typescript
// User can update any subset of preferences
PATCH /api/pm/notifications/preferences
{
  "emailTaskAssigned": false,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00"
}

// Only updated fields are changed, others remain unchanged
```

**Auto-Create on First Access:**
```typescript
// If user has no preferences record, auto-create with defaults
async getUserPreferences(userId: string) {
  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!prefs) {
    // Auto-create with defaults
    prefs = await prisma.notificationPreference.create({
      data: { userId },
    });
  }

  return prefs;
}
```

### UI Design Patterns

**Settings Panel Layout:**
```
┌─────────────────────────────────────────────┐
│ Notification Preferences                    │
├─────────────────────────────────────────────┤
│                                             │
│ Task Notifications                          │
│ ┌─────────────────────────────────────────┐ │
│ │ Task Assigned         Email  ●  In-App ●│ │
│ │ Mentioned in Comments Email  ●  In-App ●│ │
│ │ Due Date Reminders    Email  ●  In-App ●│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Agent Notifications                         │
│ ┌─────────────────────────────────────────┐ │
│ │ Task Completed        Email  ●  In-App ●│ │
│ │ Health Alerts         Email  ●  In-App ●│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Quiet Hours                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Start: [22:00▼]  End: [08:00▼]          │ │
│ │ Timezone: [America/Los_Angeles ▼]       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Email Digest                                │
│ ┌─────────────────────────────────────────┐ │
│ │ ● Enabled                               │ │
│ │ Frequency: [Daily ▼]                    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Reset to Defaults]        [Save Changes]  │
└─────────────────────────────────────────────┘
```

### Validation Rules

**Quiet Hours:**
- `quietHoursStart` and `quietHoursEnd` must be in HH:MM format (24-hour)
- Valid range: 00:00 to 23:59
- Timezone must be valid IANA timezone (e.g., "America/Los_Angeles")
- Both start and end must be set, or both must be null

**Digest Frequency:**
- Must be one of: `"daily"`, `"weekly"`
- Default: `"daily"`

### Performance Considerations

- Preferences are cached per user (no need to query on every notification check)
- Use React Query cache for frontend (avoid refetching on every toggle)
- Optimistic updates provide instant feedback
- Batch preference updates (save all changes in one API call)

### Error Handling

**Backend:**
- Return 404 if user not found (should never happen with auth)
- Return 400 for invalid preference values
- Handle timezone parsing errors gracefully
- Log quiet hours check failures for debugging

**Frontend:**
- Show toast on save error
- Rollback optimistic updates on error
- Retry failed saves (React Query automatic retry)
- Validate time inputs client-side before saving

### Future Enhancements (Out of Scope)

- Per-project notification overrides (e.g., mute notifications for specific project)
- Push notification support (mobile apps)
- Notification bundling (group similar notifications)
- Smart notification timing (ML-based optimal send times)
- Email preview templates

---

## Implementation

_This section will be filled in during development._

---

## Dev Agent Record

_This section will be filled in during development._

---

## Senior Developer Review

_This section will be filled in during code review._
