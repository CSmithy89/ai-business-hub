# Story 02.7: Implement Workspace Deletion

**Story ID:** 02-7
**Epic:** EPIC-02 - Workspace Management
**Status:** Drafted
**Priority:** P1 - High
**Points:** 2
**Created:** 2025-12-02

---

## User Story

**As a** workspace owner
**I want** to delete a workspace
**So that** I can remove unused workspaces

---

## Story Context

Workspace deletion implements a soft delete pattern with a 30-day grace period. This allows for recovery if deletion was accidental while ensuring data is eventually cleaned up.

---

## Acceptance Criteria

### AC-2.7.1: Delete requires confirmation
**Given** owner on workspace settings
**When** clicking delete and confirming with workspace name
**Then**:
- Deletion initiated
- Confirmation required by typing workspace name
- Success message shown

### AC-2.7.2: 30-day grace period
**Given** deleted workspace
**When** checking within 30 days
**Then**:
- Workspace still exists in database with deletedAt set
- Hard delete scheduled for 30 days later

### AC-2.7.3: Access blocked during grace period
**Given** deleted workspace
**When** attempting to access
**Then**:
- Error: "Workspace scheduled for deletion"
- Option to restore shown to owner

### AC-2.7.4: Only owner can delete
**Given** admin (not owner) in settings
**When** viewing delete section
**Then**:
- Delete button not visible to non-owners

### AC-2.7.5: Confirmation email sent
**Given** workspace deleted
**When** deletion confirmed
**Then**:
- Email sent to owner with deletion date
- Instructions for restoration included

---

## Technical Implementation Guidance

### Components to Implement

#### 1. Delete Workspace Section in Settings

**Location:** Add to `apps/web/src/components/settings/workspace-settings-form.tsx`

**Features:**
- Danger zone section at bottom
- Delete button (owner only)
- Confirmation dialog requiring workspace name
- Loading state during deletion
- Redirect to dashboard after deletion

---

### API (Already Implemented)

The DELETE `/api/workspaces/:id` endpoint was implemented in Story 02-1:
- Sets `deletedAt` timestamp
- Sends confirmation email
- Returns 30-day grace period info

---

## Definition of Done

- [ ] Delete section in workspace settings (owner only)
- [ ] Confirmation dialog with workspace name
- [ ] Redirect to dashboard after deletion
- [ ] No linting or type errors
- [ ] Successfully tested in local development

---

## Dependencies

### Upstream Dependencies
- **Story 02-1:** Workspace CRUD (DELETE API)
- **Story 02-6:** Workspace settings (UI integration)

### Downstream Dependencies
- None (final story in epic)

---

## References

- **Tech Spec:** `/docs/sprint-artifacts/tech-spec-epic-02.md`
- **Epic File:** `/docs/epics/EPIC-02-workspace-management.md`

---

## Implementation Notes (2025-12-02)

**Completed:**
- Danger Zone section in workspace settings (owner only)
- Delete confirmation dialog with workspace name verification
- Integration with existing DELETE API endpoint
- Redirect to dashboard after deletion
- Toast notifications for success/error feedback

**UI Features:**
- Red-themed danger zone card for visibility
- Name confirmation prevents accidental deletion
- Loading state during deletion
- Automatic form reset on dialog close

**API Integration:**
- Uses existing DELETE `/api/workspaces/:id` from Story 02-1
- 30-day soft delete grace period handled by backend
- Email notification sent by backend on deletion

---

_Story drafted: 2025-12-02_
_Implementation completed: 2025-12-02_
