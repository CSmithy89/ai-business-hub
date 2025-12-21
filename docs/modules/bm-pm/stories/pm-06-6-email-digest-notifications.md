# Story PM-06.6: Email Digest Notifications

**Epic:** PM-06 - Real-Time & Notifications
**Status:** drafted
**Points:** 8

---

## User Story

As a **platform user**,
I want **email digest notifications summarizing unread notifications**,
So that **I can stay informed without being overwhelmed by individual emails**.

---

## Acceptance Criteria

### AC1: Daily/Weekly Digest Emails Based on User Preference
**Given** a user has enabled email digest with daily frequency
**When** the scheduled time arrives and there are unread notifications
**Then** they receive a single digest email summarizing all unread notifications

### AC2: Digest Groups Notifications by Project and Type
**Given** a user has unread notifications from multiple projects
**When** the digest email is generated
**Then** notifications are grouped by project and then by type (task assigned, mentions, etc.)

### AC3: Digest Includes Direct Links to Relevant Pages
**Given** a user receives a digest email
**When** they click on a notification item
**Then** they are taken directly to the relevant page (project, task, etc.)

### AC4: Users Can Unsubscribe from Digest via Link
**Given** a user receives a digest email
**When** they click the unsubscribe link
**Then** their `digestEnabled` preference is set to false and they receive no more digests

---

## Technical Approach

This story implements **scheduled email digest notifications** that aggregate unread notifications and send them as a single summary email. It uses BullMQ for scheduling, reads digest preferences from the `NotificationPreference` model (added in PM-06.4), and tracks last digest sent per user.

### Architecture

**ADR-PM06-006: Email Digest Scheduling**
- Use BullMQ repeatable jobs for daily/weekly scheduling
- Job runs at configurable time (default: 9:00 AM in user's timezone)
- Query unread notifications since last digest sent
- Group notifications by project and type for readability
- Track last digest timestamp per user to avoid duplicates

**Integration Points:**
- Reads `digestEnabled`, `digestFrequency`, `quietHoursTimezone` from `NotificationPreference` (PM-06.4)
- Queries `Notification` model for unread notifications
- Uses platform email service for sending
- Uses BullMQ queue infrastructure (existing)

### Data Model Changes

Add digest tracking field to `NotificationPreference` model:

```prisma
model NotificationPreference {
  // ... existing fields from PM-06.4

  // Digest tracking (NEW)
  lastDigestSentAt DateTime? @map("last_digest_sent_at")

  // ... timestamps
}
```

---

## Implementation Tasks

### Database: Schema Migration
- [ ] Add `lastDigestSentAt` field to `NotificationPreference` model in `packages/db/prisma/schema.prisma`:
  - [ ] Type: `DateTime?` (nullable)
  - [ ] Maps to: `last_digest_sent_at`
  - [ ] Default: null (no digest sent yet)
- [ ] Generate Prisma migration: `pnpm db:migrate:dev --name add-last-digest-sent-at`
- [ ] Run migration against local database
- [ ] Verify field added successfully

### Shared Types
- [ ] Add digest types to `packages/shared/src/types/notifications.ts`:
  - [ ] `DigestNotificationGroup` interface - Grouped notifications by project
  - [ ] `DigestEmailData` interface - Email template data
  - [ ] `DigestSchedule` enum - Daily, weekly scheduling options
  - [ ] `DigestEmailContent` interface - Structured digest content
- [ ] Export types from `packages/shared/src/index.ts`

### Backend: Digest Service
- [ ] Create `apps/api/src/pm/notifications/digest.service.ts`:
  - [ ] `scheduleDigestJobs()` - Schedule digest jobs for all users with `digestEnabled: true`
  - [ ] `processUserDigest(userId: string)` - Process digest for single user
  - [ ] `getUnreadNotificationsSinceLastDigest(userId: string)` - Query unread notifications
  - [ ] `groupNotificationsByProject(notifications: Notification[])` - Group notifications
  - [ ] `generateDigestContent(groups: DigestNotificationGroup[])` - Generate email content
  - [ ] `sendDigestEmail(userId: string, content: DigestEmailContent)` - Send email
  - [ ] `updateLastDigestSentAt(userId: string)` - Update timestamp after sending
  - [ ] Handle users with no unread notifications (skip sending)
  - [ ] Handle users in quiet hours (skip or delay)
  - [ ] Log digest generation and sending metrics

### Backend: BullMQ Digest Queue
- [ ] Create `apps/api/src/pm/notifications/queues/digest.queue.ts`:
  - [ ] Define `DigestQueue` with queue name `pm:digest`
  - [ ] Create job processors for digest generation
  - [ ] Configure repeatable jobs (cron-based):
    - [ ] Daily digest: Run at 9:00 AM in user's timezone
    - [ ] Weekly digest: Run Monday 9:00 AM in user's timezone
  - [ ] Add job retry logic (3 retries with exponential backoff)
  - [ ] Add job timeout (5 minutes max)
- [ ] Create `apps/api/src/pm/notifications/queues/digest.processor.ts`:
  - [ ] Implement `processDigestJob(job: Job)` handler
  - [ ] Call `digestService.processUserDigest(userId)`
  - [ ] Log job completion and errors
  - [ ] Update metrics (digest sent count, errors)

### Backend: Digest Scheduling Controller
- [ ] Create `apps/api/src/pm/notifications/digest-scheduler.service.ts`:
  - [ ] `scheduleAllDigests()` - Called on server startup
  - [ ] Query all users with `digestEnabled: true`
  - [ ] Group users by timezone and frequency
  - [ ] Schedule cron jobs per timezone/frequency combination
  - [ ] Batch users in same timezone for efficiency
  - [ ] Handle timezone conversion (IANA timezone to cron expression)
- [ ] Update `apps/api/src/pm/notifications/notifications.module.ts`:
  - [ ] Import `BullModule` for digest queue
  - [ ] Provide `DigestService`, `DigestSchedulerService`, `DigestProcessor`
  - [ ] Call `scheduleAllDigests()` in `onModuleInit()`

### Backend: Digest Email Template
- [ ] Create `apps/api/src/pm/notifications/templates/digest-email.hbs` (Handlebars template):
  - [ ] Email subject: "Your Daily Digest - {{notificationCount}} unread notifications"
  - [ ] Email header with branding and date range
  - [ ] Loop through project groups:
    - [ ] Project name and link
    - [ ] List of notifications grouped by type
    - [ ] Each notification shows: title, timestamp, direct link
  - [ ] Footer with:
    - [ ] "View all notifications" link to in-app notification center
    - [ ] "Manage preferences" link to settings
    - [ ] "Unsubscribe from digest" link
  - [ ] Responsive HTML/CSS (mobile-friendly)
  - [ ] Plain text fallback version

### Backend: Unsubscribe Link Handling
- [ ] Create `apps/api/src/pm/notifications/digest-unsubscribe.controller.ts`:
  - [ ] `GET /api/pm/notifications/digest/unsubscribe/:token` - Unsubscribe endpoint
  - [ ] Generate signed JWT token with `userId` and `type: digest_unsubscribe`
  - [ ] Validate token signature and expiration (7 days max)
  - [ ] Update user's `digestEnabled: false` in preferences
  - [ ] Return simple HTML page: "You've been unsubscribed from digest emails"
  - [ ] Log unsubscribe events for analytics
- [ ] Add unsubscribe token generation to digest email sending:
  - [ ] Generate JWT with `{ userId, type: 'digest_unsubscribe', exp: 7d }`
  - [ ] Embed in digest email footer: `${APP_URL}/api/pm/notifications/digest/unsubscribe/${token}`

### Backend: Digest Notification Grouping Logic
- [ ] Implement grouping in `digest.service.ts`:
  - [ ] Group by `projectId` first
  - [ ] Within each project, group by notification `type`
  - [ ] Sort projects by name
  - [ ] Sort notification types by priority: assigned > mentioned > due date > agent completion > health alert
  - [ ] Sort notifications within type by timestamp (newest first)
  - [ ] Example structure:
    ```typescript
    {
      projectId: "proj-123",
      projectName: "Website Redesign",
      groups: [
        {
          type: "task.assigned",
          count: 3,
          notifications: [...],
        },
        {
          type: "task.mentioned",
          count: 1,
          notifications: [...],
        },
      ],
    }
    ```

### Backend: Digest Scheduling Timezone Handling
- [ ] Use `luxon` for timezone conversions:
  - [ ] Convert user's `quietHoursTimezone` to IANA timezone
  - [ ] Calculate cron expression for 9:00 AM in user's timezone
  - [ ] Handle DST changes automatically
  - [ ] Group users by timezone to minimize cron jobs
- [ ] Add tests for timezone conversion:
  - [ ] Test daily digest scheduling across timezones
  - [ ] Test weekly digest scheduling (Monday 9:00 AM)
  - [ ] Test DST transitions

### Backend: Digest Metrics and Logging
- [ ] Add Prometheus metrics in `digest.service.ts`:
  - [ ] `pm_digest_emails_sent_total{frequency}` - Total digests sent
  - [ ] `pm_digest_notifications_included_total{type}` - Notifications included in digests
  - [ ] `pm_digest_generation_duration_seconds` - Time to generate digest
  - [ ] `pm_digest_send_errors_total` - Failed digest sends
  - [ ] `pm_digest_unsubscribes_total` - Total unsubscribe events
- [ ] Add structured logging:
  - [ ] Log digest job start/completion
  - [ ] Log user digest generation (userId, notificationCount, groups)
  - [ ] Log email sending success/failure
  - [ ] Log unsubscribe events

### Backend: Digest Preference Updates
- [ ] Update `apps/api/src/pm/notifications/notifications.service.ts`:
  - [ ] When user enables `digestEnabled`, schedule digest job for that user
  - [ ] When user disables `digestEnabled`, remove digest job for that user
  - [ ] When user changes `digestFrequency`, reschedule digest job
  - [ ] When user changes `quietHoursTimezone`, reschedule digest job

### Frontend: Digest Preference UI (PM-06.4 Integration)
- [ ] Verify `apps/web/src/components/settings/notification-preferences/NotificationPreferencesPanel.tsx` includes:
  - [ ] "Email Digest" section (already implemented in PM-06.4)
  - [ ] Toggle for `digestEnabled`
  - [ ] Dropdown for `digestFrequency` (daily, weekly)
  - [ ] Display last digest sent timestamp (if available)
- [ ] Add "Preview Digest" button (optional):
  - [ ] Call `POST /api/pm/notifications/digest/preview` (new endpoint)
  - [ ] Show modal with digest preview (same content as email)

### Frontend: Unsubscribe Page
- [ ] Create `apps/web/src/app/(public)/digest/unsubscribe/[token]/page.tsx`:
  - [ ] Public route (no auth required)
  - [ ] Extract token from URL params
  - [ ] Call `GET /api/pm/notifications/digest/unsubscribe/:token` on page load
  - [ ] Show success message: "You've been unsubscribed from digest emails"
  - [ ] Show link to re-enable in settings (if user is logged in)
  - [ ] Handle expired/invalid token errors

---

## Files to Create/Modify

### Database
- `packages/db/prisma/schema.prisma` - Add `lastDigestSentAt` field to NotificationPreference
- `packages/db/prisma/migrations/XXXXXX_add_last_digest_sent_at/migration.sql` - Generated migration

### Backend Files
- `apps/api/src/pm/notifications/digest.service.ts` - NEW: Digest generation and sending logic
- `apps/api/src/pm/notifications/digest-scheduler.service.ts` - NEW: Schedule digest jobs per user
- `apps/api/src/pm/notifications/digest-unsubscribe.controller.ts` - NEW: Unsubscribe endpoint
- `apps/api/src/pm/notifications/queues/digest.queue.ts` - NEW: BullMQ digest queue
- `apps/api/src/pm/notifications/queues/digest.processor.ts` - NEW: Digest job processor
- `apps/api/src/pm/notifications/templates/digest-email.hbs` - NEW: Email template
- `apps/api/src/pm/notifications/templates/digest-email.text.hbs` - NEW: Plain text template
- `apps/api/src/pm/notifications/notifications.module.ts` - Import digest services
- `apps/api/src/pm/notifications/notifications.service.ts` - Add digest scheduling on preference changes

### Shared Packages
- `packages/shared/src/types/notifications.ts` - Add digest types
- `packages/shared/src/index.ts` - Export digest types

### Frontend Files
- `apps/web/src/app/(public)/digest/unsubscribe/[token]/page.tsx` - NEW: Unsubscribe page
- `apps/web/src/components/settings/notification-preferences/NotificationPreferencesPanel.tsx` - Verify digest UI (from PM-06.4)

---

## Testing Requirements

### Unit Tests

**Location:** `apps/api/src/pm/notifications/digest.service.spec.ts`

Test cases:
- Get unread notifications since last digest
- Get unread notifications when `lastDigestSentAt` is null (first digest)
- Group notifications by project
- Group notifications by type within project
- Generate digest content (HTML and text)
- Skip sending digest when no unread notifications
- Skip sending digest when user in quiet hours
- Update `lastDigestSentAt` after sending
- Handle email sending errors gracefully

**Location:** `apps/api/src/pm/notifications/digest-scheduler.service.spec.ts`

Test cases:
- Schedule digest jobs for all enabled users
- Group users by timezone
- Generate cron expression for user timezone
- Handle daily vs weekly frequency
- Reschedule job when user changes preferences
- Remove job when user disables digest

**Location:** `apps/api/src/pm/notifications/digest-unsubscribe.controller.spec.ts`

Test cases:
- Unsubscribe with valid token
- Reject expired token (401)
- Reject invalid token signature (401)
- Update user preference on unsubscribe
- Log unsubscribe event

### Integration Tests

**Location:** `apps/api/test/pm/digest.e2e-spec.ts` (new file)

Test cases:
- Full digest flow: schedule job, process user, send email, update timestamp
- Daily digest scheduling and execution
- Weekly digest scheduling and execution
- Digest grouping by project and type
- Unsubscribe flow (unsubscribe link, disable preference)
- Preference change triggers rescheduling
- No digest sent when no unread notifications
- Digest respects quiet hours (skipped during quiet hours)

### Frontend Tests

**Location:** `apps/web/src/app/(public)/digest/unsubscribe/[token]/page.test.tsx`

Test cases:
- Render unsubscribe page
- Show success message on valid token
- Show error message on invalid token
- Show re-enable link for logged-in users

### Manual Testing Checklist

- [ ] Enable email digest in settings (`/settings/notifications`)
- [ ] Set digest frequency to "daily"
- [ ] Create test notifications (assign tasks, mention user)
- [ ] Trigger digest job manually (dev env): `pnpm digest:trigger`
- [ ] Verify digest email received
- [ ] Verify notifications grouped by project
- [ ] Verify direct links work (click notification, land on correct page)
- [ ] Click "Unsubscribe" link in email
- [ ] Verify redirected to unsubscribe page
- [ ] Verify `digestEnabled` set to false in database
- [ ] Verify no more digests sent after unsubscribe
- [ ] Re-enable digest in settings
- [ ] Verify digest resumes
- [ ] Change frequency to "weekly"
- [ ] Verify weekly digest scheduled correctly
- [ ] Test timezone handling (set user timezone to different zone)
- [ ] Test quiet hours enforcement (digest skipped during quiet hours)
- [ ] Test with no unread notifications (no email sent)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Prisma schema updated with `lastDigestSentAt` field
- [ ] Database migration generated and applied
- [ ] Shared digest types created and exported
- [ ] Digest service implemented (generation, grouping, sending)
- [ ] Digest scheduler implemented (BullMQ cron jobs)
- [ ] Digest queue and processor implemented
- [ ] Email templates created (HTML and plain text)
- [ ] Unsubscribe endpoint implemented
- [ ] Unsubscribe page implemented (frontend)
- [ ] Digest preference UI verified (from PM-06.4)
- [ ] Timezone conversion logic implemented and tested
- [ ] Quiet hours enforcement implemented
- [ ] Prometheus metrics added
- [ ] Unit tests passing (digest service, scheduler, unsubscribe)
- [ ] Integration tests passing
- [ ] Frontend tests passing
- [ ] TypeScript type checks pass
- [ ] ESLint passes (no new errors)
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] Digest scheduling documentation
  - [ ] Email template customization guide
  - [ ] Unsubscribe flow documentation

---

## Dependencies

### Prerequisites
- **PM-06.4** (Notification Preferences) - Digest settings (`digestEnabled`, `digestFrequency`)
- **Platform Email Service** (complete) - Email sending infrastructure
- **BullMQ Infrastructure** (complete) - Queue and job scheduling
- **JWT Auth** (complete) - Token generation for unsubscribe links

### Blocks
- None - This is the final story in PM-06 epic

---

## References

- [Epic Definition](../epics/epic-pm-06-real-time-notifications.md) - Story PM-06.6
- [Epic Tech Spec](../epics/epic-pm-06-tech-spec.md) - Notification architecture
- [PM-06.4 Story](./pm-06-4-notification-preferences.md) - Digest preference fields
- [Module PRD](../PRD.md) - Email digest requirements (FR-8.3)
- [Module Architecture](../architecture.md) - Email service patterns
- [Sprint Status](../sprint-status.yaml)
- [Platform Email Service](../../../../apps/api/src/email/) - Existing email infrastructure
- [Platform BullMQ Setup](../../../../apps/api/src/queues/) - Existing queue infrastructure

---

## Dev Notes

### Digest Email Structure

**Subject Line:**
```
Your Daily Digest - 12 unread notifications
```

**Email Body Structure:**
```
==============================================
Your Daily Digest
January 15, 2025
==============================================

You have 12 unread notifications from 3 projects.

---

PROJECT: Website Redesign
[View Project]

  TASK ASSIGNED (3)
  - Task #45: Implement homepage hero section
    Assigned by Alice Johnson | 2 hours ago
    [View Task]

  - Task #46: Update navigation menu
    Assigned by Bob Smith | 5 hours ago
    [View Task]

  MENTIONED IN COMMENTS (1)
  - Task #42: Fix mobile responsive layout
    "@john can you review this?" | 3 hours ago
    [View Task]

---

PROJECT: Mobile App
[View Project]

  AGENT COMPLETED (2)
  - Task #78: Generate API documentation
    Completed by Scribe Agent | 1 hour ago
    [View Task]

  DUE DATE REMINDERS (1)
  - Task #80: Submit app store screenshots
    Due in 2 days | 4 hours ago
    [View Task]

---

[View All Notifications] [Manage Preferences]

To stop receiving these digest emails, click here:
[Unsubscribe from Digest]

---
```

### Digest Grouping Logic

**Priority Order for Notification Types:**
1. Task Assigned (`task.assigned`) - Highest priority
2. Mentioned in Comments (`task.mentioned`)
3. Due Date Reminders (`task.due_date_reminder`)
4. Agent Completion (`agent.task_completed`)
5. Health Alerts (`project.health_alert`)

**Grouping Algorithm:**
```typescript
function groupNotifications(notifications: Notification[]) {
  // Group by projectId
  const projectGroups = groupBy(notifications, 'projectId');

  // For each project, group by type
  return Object.entries(projectGroups).map(([projectId, projectNotifs]) => ({
    projectId,
    projectName: projectNotifs[0].projectName,
    groups: Object.entries(groupBy(projectNotifs, 'type'))
      .map(([type, typeNotifs]) => ({
        type,
        count: typeNotifs.length,
        notifications: typeNotifs.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        ),
      }))
      .sort((a, b) => TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]),
  }));
}
```

### Timezone Scheduling

**Daily Digest:**
- Run at 9:00 AM in user's timezone
- Cron expression varies by timezone
- Group users by timezone to minimize cron jobs

**Weekly Digest:**
- Run Monday at 9:00 AM in user's timezone
- Cron expression: `0 9 * * 1` (adjusted for timezone)

**Timezone Grouping:**
```typescript
// Example: Group users by timezone offset
const timezoneGroups = groupBy(users, user => {
  const tz = DateTime.now().setZone(user.quietHoursTimezone);
  return tz.offset; // Group by UTC offset
});

// Schedule one cron job per timezone group
timezoneGroups.forEach(([offset, users]) => {
  const cronExpression = getCronForTimezone(offset, '09:00');
  scheduleJob(cronExpression, async () => {
    await Promise.all(users.map(user => processUserDigest(user.id)));
  });
});
```

### Unsubscribe Token Format

**JWT Payload:**
```typescript
{
  userId: "user-123",
  type: "digest_unsubscribe",
  exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
}
```

**Token Generation:**
```typescript
function generateUnsubscribeToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'digest_unsubscribe',
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
```

**Unsubscribe URL:**
```
https://app.hyvve.com/digest/unsubscribe/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Quiet Hours Enforcement

**Digest Respect Quiet Hours:**
```typescript
async function processUserDigest(userId: string) {
  const preferences = await getUserPreferences(userId);

  // Check if current time is in quiet hours
  if (isInQuietHours(preferences, new Date())) {
    logger.info(`Skipping digest for user ${userId} (in quiet hours)`);
    return; // Skip sending digest
  }

  // Continue with digest generation...
}
```

### Performance Considerations

**Batching:**
- Process digests in batches of 100 users per job
- Avoid overwhelming email service
- Use BullMQ concurrency limits

**Query Optimization:**
- Index on `Notification.readAt` for unread queries
- Index on `NotificationPreference.lastDigestSentAt`
- Use `SELECT` with `include` to minimize queries

**Email Sending:**
- Use async email sending (queue emails, don't wait)
- Retry failed emails with exponential backoff
- Track email delivery status for monitoring

### Error Handling

**Digest Generation Errors:**
- Log error with userId and stack trace
- Continue processing other users (don't fail entire batch)
- Retry failed users after 1 hour

**Email Sending Errors:**
- Retry up to 3 times with exponential backoff
- Log permanent failures for manual investigation
- Don't update `lastDigestSentAt` if sending fails

**Timezone Errors:**
- Fallback to UTC if user timezone is invalid
- Log invalid timezone for manual correction
- Don't fail digest generation

### Monitoring and Alerts

**Key Metrics:**
- Digest emails sent per day/week
- Average notifications per digest
- Digest generation duration
- Email delivery rate (success vs failures)
- Unsubscribe rate

**Alerts:**
- Alert if digest generation takes > 5 minutes
- Alert if email delivery rate drops below 95%
- Alert if unsubscribe rate spikes (> 10% in 24 hours)

### Future Enhancements (Out of Scope)

- Per-project digest customization (only include specific projects)
- Smart digest timing (ML-based optimal send time per user)
- Digest preview in settings (see what digest would look like)
- Digest analytics (open rate, click rate, most engaged notifications)
- Mobile push notification digest (similar to email)
- Digest template customization (user chooses layout/style)

---

## Implementation

_This section will be filled in during development._

---

## Dev Agent Record

_This section will be filled in during development._

---

## Senior Developer Review

_This section will be filled in during code review._
