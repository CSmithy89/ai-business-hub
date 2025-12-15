# Story 15.8: Implement Settings Sessions Page

**Story ID:** 15.8
**Epic:** EPIC-15 - UI/UX Platform Foundation
**Priority:** P0 - Critical
**Points:** 3
**Status:** in-progress

---

## User Story

**As a** user concerned about account access
**I want** to see and manage my active sessions
**So that** I can detect unauthorized access and sign out remotely

---

## Context

The sessions page was originally created in Story 01-7 with core functionality. This story enhances it with additional UX improvements required by the UI/UX backlog:

**Existing Features (from Story 01-7):**
- Session list with device type icons
- Browser name and version
- Operating system
- IP address (full)
- Last active timestamp
- "Current session" badge
- Sign out button per session
- "Sign out all other sessions" with confirmation
- Session creation timestamps
- Empty state handling
- Loading and error states

**Enhancements Required (Story 15-8):**
- Auto-refresh every 30 seconds
- IP address partially masked for privacy
- Toast notifications (replace console.log)

**Note:** IP geolocation would require external API (security concern) - deferred.

**Source:** tech-spec-epic-15.md Section 15.8
**Backlog Reference:** Section 4.1 - Sessions

---

## Acceptance Criteria

### Core Functionality (from Story 01-7 - already implemented)

- [x] List all active sessions with:
  - Device type icon (desktop/mobile/tablet)
  - Browser name and version
  - Operating system
  - IP address (partially masked for privacy)
  - Last active timestamp
  - "Current session" badge for this session
- [x] "Sign out" button per session (except current)
- [x] "Sign out all other sessions" button with confirmation
- [x] Session creation timestamps
- [x] Empty state if only current session exists

### Enhancements (Story 15-8)

- [x] Auto-refresh every 30 seconds
- [x] IP address partially masked (e.g., 192.168.xxx.xxx)
- [x] Toast notifications for actions (success/error)

---

## Technical Implementation

### Files to Modify

```
apps/web/src/components/session/session-list.tsx        # Add auto-refresh, toast notifications
apps/web/src/components/session/session-card.tsx        # Mask IP address display
```

### Implementation Strategy

1. Add auto-refresh interval to session-list.tsx:
   - Use `refetchInterval: 30000` in useQuery options
   - Clean up interval on component unmount

2. Update IP address display to mask last two octets:
   - IPv4: 192.168.xxx.xxx
   - IPv6: Show first segment, mask rest
   - This prevents casual snooping while still being useful

3. Replace console.log with sonner toast:
   - Success toast on session revoke
   - Success toast on revoke all other sessions
   - Error toast on failures

---

## Tech Spec Reference

See **tech-spec-epic-15.md** Section: "Story 15.8: Implement Settings Sessions Page"

---

## Definition of Done

- [x] Auto-refresh sessions every 30 seconds
- [x] IP addresses are partially masked
- [x] Toast notifications show for actions
- [x] TypeScript type check passes
- [x] ESLint passes
- [x] Code review completed

---

## Dependencies

- better-auth `listSessions` API (already integrated)
- sonner toast (already installed)
- @tanstack/react-query (already integrated)

---

## Notes

- IP geolocation deferred - would require external API and raises privacy concerns
- Auto-refresh uses refetchInterval for seamless background updates
- Masking IP shows enough info to recognize network without full exposure

---

## Related Stories

- **01-7:** Implement Session Management (foundation)
- **15.7:** Implement Settings Security Page (completed)
- **15.9:** Implement Workspace General Settings

---

_Story created: 2025-12-11_
_Source: EPIC-15 UI/UX Platform Foundation_
_Tech Spec: tech-spec-epic-15.md_

---

## Tasks/Subtasks

- [x] **Task 1:** Add auto-refresh (30s interval) to session list
- [x] **Task 2:** Implement IP address masking utility
- [x] **Task 3:** Update session-card to use masked IP
- [x] **Task 4:** Replace console.log with sonner toast notifications
- [x] **Task 5:** Verify TypeScript type check passes
- [x] **Task 6:** Verify ESLint passes

---

## File List

### Files to Modify

| File | Description |
|------|-------------|
| `apps/web/src/components/session/session-list.tsx` | Add auto-refresh, toast notifications |
| `apps/web/src/components/session/session-card.tsx` | Mask IP address display |
| `apps/web/src/lib/utils/user-agent.ts` | Add IP masking utility |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-11 | Story drafted | Claude Code |
