# Story 09-13: Add Last Active and Status to Members Table

**Story ID:** 09-13
**Epic:** EPIC-09 - UI Auth Layer
**Status:** done
**Points:** 3
**Priority:** P1

---

## User Story

**As a** workspace admin
**I want** to see when team members were last active and their current status
**So that** I can monitor team engagement and availability

---

## Acceptance Criteria

- [x] Add "Last Active" column to members table showing relative time (e.g., "5 minutes ago", "2 hours ago", "3 days ago")
- [x] Add "Status" indicator (online/offline/away based on last activity)
- [x] Status badge with color coding (green=online, yellow=away, gray=offline)
- [x] Online: active within 5 minutes
- [x] Away: active within 30 minutes
- [x] Offline: more than 30 minutes ago
- [x] Show "Never" for users who haven't logged in
- [x] Tooltip on status badge showing exact timestamp
- [x] Responsive design - hide "Last Active" and "Status" columns on smaller screens

---

## Technical Requirements

### Date Utilities

**File:** `apps/web/src/lib/date-utils.ts`

Added helper functions:

```typescript
/**
 * User activity status types
 */
export type ActivityStatus = 'online' | 'away' | 'offline';

/**
 * Calculates activity status based on last active timestamp.
 * - Online: active within 5 minutes
 * - Away: active within 30 minutes
 * - Offline: more than 30 minutes ago
 */
export function getActivityStatus(
  lastActiveAt: Date | string | number | null | undefined
): ActivityStatus

/**
 * Formats last active time with "Never" fallback.
 * Used for displaying user activity in member lists.
 */
export function formatLastActive(
  lastActiveAt: Date | string | number | null | undefined,
  options?: DateFormatOptions
): string
```

### API Endpoint Updates

**File:** `apps/web/src/app/api/workspaces/[id]/members/route.ts`

**Changes:**

1. **Database Query Enhancement:**
   - Include user's most recent session in the query
   - Join with sessions table to get `updatedAt` timestamp
   - Order sessions by `updatedAt` desc and take the most recent

2. **Response Schema:**
   - Added `lastActiveAt` field to member response
   - Value is the `updatedAt` timestamp from the user's most recent session
   - Returns `null` if user has no sessions (never logged in)

```typescript
// Query includes user sessions
sessions: {
  select: {
    updatedAt: true,
  },
  orderBy: {
    updatedAt: 'desc',
  },
  take: 1,
}

// Response includes lastActiveAt
lastActiveAt: member.user.sessions[0]?.updatedAt?.toISOString() ?? null
```

### Component Updates

**File:** `apps/web/src/components/settings/members-list.tsx`

**Changes:**

1. **Interface Updates:**
   - Added `lastActiveAt: string | null` to `Member` interface

2. **New Component: StatusBadge**
   - Shows activity status with color-coded indicator
   - Green dot for online, yellow for away, gray for offline
   - Tooltip displays exact timestamp on hover
   - Uses shadcn/ui Tooltip component

3. **Status Colors:**
   ```typescript
   const STATUS_COLORS: Record<ActivityStatus, string> = {
     online: 'bg-green-500',
     away: 'bg-yellow-500',
     offline: 'bg-gray-400',
   }
   ```

4. **Member Row Layout:**
   - Restructured layout to accommodate new columns
   - Added Status column (hidden on mobile, visible on sm+)
   - Added Last Active column (hidden on mobile/tablet, visible on lg+)
   - Responsive flex layout with proper text truncation
   - Status and Last Active positioned between member info and role

**Component Structure:**
```
Member Row:
├── Avatar + Name/Email (flex-1, always visible)
├── Status Badge (hidden sm:block)
├── Last Active (hidden lg:block)
└── Role Badge + Actions Menu (always visible)
```

### Responsive Breakpoints

- **Mobile (< 640px):** Show only name, email, role, and actions
- **Tablet (640px - 1023px):** Add status indicator
- **Desktop (1024px+):** Show all columns including last active time

---

## Implementation Details

### Status Calculation Logic

```typescript
const activityStatus = getActivityStatus(member.lastActiveAt)
const lastActive = formatLastActive(member.lastActiveAt)

// Status colors
if (diffMinutes < 5) return 'online'   // Green
if (diffMinutes < 30) return 'away'    // Yellow
return 'offline'                        // Gray
```

### Tooltip Content

Shows formatted timestamp:
- If `lastActiveAt` exists: "Last active: Jan 15, 2024, 2:30 PM"
- If `null`: "Never logged in"

### Session Tracking

Activity is based on the `updatedAt` field of the user's sessions:
- Sessions are updated on each authenticated request
- The most recent session's `updatedAt` timestamp represents last activity
- If user has no sessions, `lastActiveAt` is `null`

---

## Dependencies

- **UI Components:** shadcn/ui Badge, Tooltip, TooltipProvider, TooltipTrigger, TooltipContent
- **Icons:** None (uses CSS for status dots)
- **Date Library:** Uses existing date-fns utilities via date-utils
- **Database:** Existing Session model with updatedAt field

---

## Testing Considerations

1. **Status Accuracy:**
   - Verify online status for recent activity (< 5 min)
   - Verify away status for medium-term activity (5-30 min)
   - Verify offline status for old activity (> 30 min)
   - Verify "Never" display for users with no sessions

2. **Responsive Behavior:**
   - Test on mobile: only name, email, role visible
   - Test on tablet: status indicator appears
   - Test on desktop: all columns visible

3. **Tooltip Functionality:**
   - Hover over status badge shows exact timestamp
   - Timestamp is formatted correctly
   - "Never logged in" shows for null lastActiveAt

4. **Performance:**
   - Session join doesn't significantly slow down members query
   - Limited to 1 session per user (take: 1)

---

## Files Modified

1. `apps/web/src/lib/date-utils.ts` - Added helper functions
2. `apps/web/src/app/api/workspaces/[id]/members/route.ts` - Added session data to query
3. `apps/web/src/components/settings/members-list.tsx` - Added UI columns and StatusBadge

---

## Notes

- Uses session `updatedAt` as a proxy for user activity
- Better-auth automatically updates sessions on authenticated requests
- Status thresholds (5 min, 30 min) are configurable in date-utils
- Responsive design ensures good UX on all screen sizes
- No database schema changes required (uses existing Session model)

---

## Definition of Done

- [x] Helper functions added to date-utils with proper TypeScript types
- [x] API endpoint returns lastActiveAt for all members
- [x] StatusBadge component displays correct status with color coding
- [x] Last Active column shows relative time or "Never"
- [x] Tooltip shows exact timestamp on hover
- [x] Responsive design hides columns appropriately on smaller screens
- [x] TypeScript strict mode compliance
- [x] Component follows existing patterns in codebase
- [x] Story documentation created

---

## Future Enhancements

- Real-time status updates using WebSocket/SSE
- Custom status messages (similar to Slack)
- "Do Not Disturb" mode
- Status history/analytics
- Configurable status thresholds per workspace

---

## Senior Developer Review

**Reviewer:** Claude (Senior Developer)
**Date:** 2025-12-05
**Status:** ✅ APPROVED

### Summary

Story 09.13 is well-implemented with clean helper functions, proper API integration, and good responsive design. All acceptance criteria met.

### Acceptance Criteria Status

| Criteria | Status |
|----------|--------|
| Last Active column with relative time | ✅ Pass |
| Status indicator (online/away/offline) | ✅ Pass |
| Color-coded status badges | ✅ Pass |
| Activity thresholds (5/30 min) | ✅ Pass |
| "Never" for no login history | ✅ Pass |

### Code Quality Highlights

1. **Clean Helper Functions** - Reusable date utilities
2. **Efficient Query** - Session join with limit
3. **Responsive Design** - Columns hidden on mobile
4. **Tooltip Enhancement** - Exact timestamp on hover
5. **Type Safety** - Proper ActivityStatus type

**Quality Score:** 9/10

**Recommendation:** APPROVE for merge

---

_Story completed: 2025-12-05_
