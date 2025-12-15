# Story 15.10a: Implement Workspace Roles Page

**Story ID:** 15.10a
**Epic:** EPIC-15 - UI/UX Platform Foundation
**Priority:** P0 - Critical
**Points:** 3
**Status:** in-progress

---

## User Story

**As a** workspace admin
**I want** to view role definitions and permissions
**So that** I understand what each role can do and assign appropriate roles to members

---

## Context

The workspace roles page was created in Story 09-14 with custom role management. This story adds a permission matrix visualization required by the UI/UX backlog.

**Already Implemented (from Story 09-14):**
- Roles page at `/settings/workspace/roles`
- Built-in roles display (owner, admin, member, viewer, guest)
- Custom role cards with edit/delete
- Create role modal

**Enhancement (Story 15-10a):**
- Permission matrix table showing capabilities per role

**Source:** EPIC-15 tech spec Section 15.10a
**Backlog Reference:** Section 4.2 - Roles

---

## Acceptance Criteria

### Core Functionality (already implemented)

- [x] Create page at `/settings/workspace/roles`
- [x] Display 5 default roles in cards

### Enhancement (Story 15-10a)

- [x] Permission matrix table showing capabilities per role:
  - Columns: Permission categories
  - Rows: Roles
  - Cells: ✓ / ✗ indicators
- [x] Permission categories to display:
  - Workspace Settings
  - Member Management
  - Billing & Subscription
  - Business Management
  - AI Agent Configuration
  - Approval Actions
  - Data Export
- [x] Visual hierarchy: Owner at top, descending permissions
- [x] Responsive layout for table (horizontal scroll on mobile)

---

## Technical Implementation

### Files to Create/Modify

```
apps/web/src/components/settings/permission-matrix.tsx  # NEW - Permission matrix component
apps/web/src/app/(dashboard)/settings/workspace/roles/page.tsx  # Add matrix to page
```

### Implementation Strategy

1. Create permission matrix component with:
   - Static permission definitions per role
   - Table layout with roles as rows
   - Permission categories as columns
   - Check/X icons for indicators
2. Add the matrix to the roles page

---

## Definition of Done

- [x] Permission matrix table displays correctly
- [x] All roles and permission categories shown
- [x] TypeScript type check passes
- [x] ESLint passes
- [x] Code review completed

---

## Dependencies

- Existing roles-list component
- shadcn/ui table components

---

## Notes

- Permission matrix is read-only display
- Uses static permission definitions (not from API)
- Responsive with horizontal scroll on mobile

---

## Related Stories

- **09-14:** Implement Custom Role Creation (foundation)
- **15.10:** Fix and Implement Workspace Members Page

---

_Story created: 2025-12-11_
_Source: EPIC-15 UI/UX Platform Foundation_

---

## Tasks/Subtasks

- [x] **Task 1:** Create permission-matrix.tsx component
- [x] **Task 2:** Define permission categories and role capabilities
- [x] **Task 3:** Add matrix to roles page
- [x] **Task 4:** Verify TypeScript type check passes
- [x] **Task 5:** Verify ESLint passes

---

## File List

### Files to Create

| File | Description |
|------|-------------|
| `apps/web/src/components/settings/permission-matrix.tsx` | Permission matrix table |

### Files to Modify

| File | Description |
|------|-------------|
| `apps/web/src/app/(dashboard)/settings/workspace/roles/page.tsx` | Add matrix component |

---

## Code Review

### Changes Summary
- Created new `permission-matrix.tsx` component with:
  - Static role definitions (Owner, Admin, Billing, Member, Viewer, Guest)
  - 7 permission categories (Workspace, Members, Billing, Business, AI Agents, Approvals, Export)
  - Visual permission matrix with check/X indicators
  - Role color badges matching existing design patterns
  - Responsive layout with horizontal scroll on mobile
  - Short column names on small screens, full names on larger
  - Legend explaining check/X indicators
- Updated roles page to include PermissionMatrix component
- Added story comment to page component

### Code Quality
- TypeScript: No errors
- ESLint: No new errors (pre-existing `<img>` warnings only)
- Follows existing component patterns and shadcn/ui conventions
- Uses proper semantic table structure
- Responsive design implemented

### Testing Results
- Permission matrix displays correctly with all roles and categories
- Visual hierarchy shows Owner at top with most permissions
- Horizontal scroll works on mobile
- Role badges use consistent color scheme

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-11 | Story drafted | Claude Code |
| 2025-12-11 | Implementation complete | Claude Code |
