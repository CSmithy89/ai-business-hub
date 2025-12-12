# Story 15.10: Fix and Implement Workspace Members Page

**Story ID:** 15.10
**Epic:** EPIC-15 - UI/UX Platform Foundation
**Priority:** P0 - Critical
**Points:** 5
**Status:** in-progress

---

## User Story

**As a** workspace admin
**I want** to manage team members
**So that** I can control who has access to my workspace

---

## Context

The workspace members page was created in Story 09-10 through 09-13 with extensive functionality. This story adds enhancements from the UI/UX audit:

**Already Implemented (from Epic 09):**
- Members table with avatar, name, email, role badge, status, last active
- Invite member modal with email input and role selection
- Pending invitations section with resend/cancel
- Role change dropdown per member
- Remove member with confirmation
- Search filter by name/email
- Filter by role and status
- Team stats cards

**Enhancements (Story 15-10):**
- Add pagination for large teams (>20 members)
- Add "billing" role option (for future use)

**Source:** EPIC-15 tech spec Section 15.10
**Backlog Reference:** Section 4.2 - Members

---

## Acceptance Criteria

### Core Functionality (already implemented)

- [x] Display members table with columns:
  - Avatar + Name
  - Email
  - Role (dropdown for role change)
  - Status (Active, Pending)
  - Last Active timestamp
  - Actions menu (Remove, Change Role)
- [x] Invite member modal with email input and role selection
- [x] Pending invitations section with resend/cancel options
- [x] Role change dropdown per member
- [x] Remove member with confirmation
- [x] Search filter by name/email

### Enhancements (Story 15-10)

- [x] Pagination for large teams (>20 members per page)
- [x] Add "billing" role option to role list

---

## Technical Implementation

### Files to Modify

```
apps/web/src/components/settings/members-list.tsx  # Add pagination, billing role
```

### Implementation Strategy

1. Add pagination state (page, pageSize)
2. Slice filtered members for current page
3. Add pagination controls at bottom of table
4. Add "billing" to ROLES constant

---

## Definition of Done

- [x] Pagination works for >20 members
- [x] Billing role option added
- [x] TypeScript type check passes
- [x] ESLint passes
- [x] Code review completed

---

## Dependencies

- Existing members-list component
- Workspace members API

---

## Notes

- Billing role is for future use when subscription management is implemented
- Pagination prevents performance issues with large teams

---

## Related Stories

- **09-10:** Team Members Stats Cards (foundation)
- **09-13:** Add Last Active and Status to Members Table
- **15.10a:** Implement Workspace Roles Page

---

_Story created: 2025-12-11_
_Source: EPIC-15 UI/UX Platform Foundation_

---

## Tasks/Subtasks

- [x] **Task 1:** Add billing role to ROLES constant
- [x] **Task 2:** Add pagination state and logic
- [x] **Task 3:** Add pagination controls UI
- [x] **Task 4:** Verify TypeScript type check passes
- [x] **Task 5:** Verify ESLint passes

---

## File List

### Files to Modify

| File | Description |
|------|-------------|
| `apps/web/src/components/settings/members-list.tsx` | Add pagination and billing role |

---

## Code Review

### Changes Summary
- Added `billing` role to ROLES constant with orange color scheme
- Added PAGE_SIZE constant (20 members per page)
- Added pagination state (currentPage)
- Added pagination calculations (totalPages, startIndex, endIndex, paginatedMembers)
- Added pagination controls UI (Previous/Next buttons with page info)
- Updated table to use paginatedMembers instead of filteredMembers

### Code Quality
- TypeScript: ✅ No errors
- ESLint: ✅ No new errors (pre-existing warnings only)
- Follows existing component patterns
- Pagination logic is clean and efficient

### Testing Results
- Members list renders correctly with pagination
- Pagination controls appear only when >20 members
- Page navigation works correctly
- Billing role appears in role change dropdown

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-11 | Story drafted | Claude Code |
| 2025-12-11 | Implementation complete | Claude Code |
