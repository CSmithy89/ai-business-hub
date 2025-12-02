# Story 02.5: Implement Member Management

**Story ID:** 02-5
**Epic:** EPIC-02 - Workspace Management
**Status:** Drafted
**Priority:** P1 - High
**Points:** 3
**Created:** 2025-12-02

---

## User Story

**As a** workspace owner or admin
**I want** to view and manage workspace members
**So that** I can control team access and roles

---

## Story Context

Member management allows owners and admins to view the member list, change member roles, and remove members from the workspace. This provides essential team administration capabilities.

---

## Acceptance Criteria

### AC-2.5.1: List workspace members
**Given** a workspace with 5 members
**When** owner fetches GET `/api/workspaces/:id/members`
**Then**:
- All 5 members returned
- Each includes: id, name, email, role, joinedAt, invitedBy
- Sorted by role hierarchy then name

### AC-2.5.2: Update member role
**Given** a member with "member" role
**When** owner sends PATCH `/api/workspaces/:id/members/:userId`
**Then**:
- Member role updated
- HTTP 200 returned with updated member
- Event emitted: workspace.member.role_changed

### AC-2.5.3: Cannot demote owner
**Given** the workspace owner
**When** attempting to change their role
**Then**:
- HTTP 403 returned
- Error code: "CANNOT_DEMOTE_OWNER"
- Error message: "Cannot change the owner's role"

### AC-2.5.4: Remove member
**Given** a member (not owner)
**When** owner sends DELETE `/api/workspaces/:id/members/:userId`
**Then**:
- Member record deleted
- HTTP 200 returned
- Event emitted: workspace.member.removed

### AC-2.5.5: Cannot remove owner
**Given** the workspace owner
**When** attempting to remove them
**Then**:
- HTTP 403 returned
- Error code: "CANNOT_REMOVE_OWNER"
- Error message: "Cannot remove the workspace owner"

### AC-2.5.6: Member can view list
**Given** a user with "member" role
**When** fetching the members list
**Then**:
- All members returned
- (Read-only access is allowed)

### AC-2.5.7: Member cannot modify
**Given** a user with "member" role
**When** attempting to update or remove a member
**Then**:
- HTTP 403 returned
- Error: "Owner or Admin role required"

---

## Technical Implementation Guidance

### API Endpoints to Implement

#### 1. GET `/api/workspaces/:id/members` - List Members

**Location:** `apps/web/src/app/api/workspaces/[id]/members/route.ts`

**Response (200):**
```typescript
{
  success: true;
  data: Array<{
    id: string;
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
    role: WorkspaceRole;
    invitedAt: string;
    acceptedAt: string | null;
    invitedBy: {
      id: string;
      name: string | null;
    } | null;
  }>
}
```

---

#### 2. PATCH `/api/workspaces/:id/members/:userId` - Update Role

**Location:** `apps/web/src/app/api/workspaces/[id]/members/[userId]/route.ts`

**Request Body:**
```typescript
{
  role: WorkspaceRole;  // 'admin' | 'member' | 'viewer' | 'guest'
}
```

**Response (200):**
```typescript
{
  success: true;
  data: { userId: string; role: string; }
}
```

---

#### 3. DELETE `/api/workspaces/:id/members/:userId` - Remove Member

**Location:** `apps/web/src/app/api/workspaces/[id]/members/[userId]/route.ts`

**Response (200):**
```typescript
{
  success: true;
  message: "Member removed successfully";
}
```

---

## Definition of Done

- [ ] All API endpoints implemented
- [ ] Authorization checks for owner/admin
- [ ] Owner protection (cannot demote/remove)
- [ ] No linting or type errors
- [ ] Successfully tested in local development

---

## Dependencies

### Upstream Dependencies
- **Story 02-1:** Workspace CRUD (workspace exists)
- **Story 02-3:** Invitation acceptance (members exist)

### Downstream Dependencies
- **Story 02-6:** Workspace settings (member UI)

---

## References

- **Tech Spec:** `/docs/sprint-artifacts/tech-spec-epic-02.md`
- **Epic File:** `/docs/epics/EPIC-02-workspace-management.md`

---

## Implementation Notes (2025-12-02)

**Completed:**
- GET `/api/workspaces/:id/members` - List members with user details, sorted by role hierarchy
- PATCH `/api/workspaces/:id/members/:userId` - Update member role with permission checks
- DELETE `/api/workspaces/:id/members/:userId` - Remove member with owner protection

**Authorization Logic:**
- Any member can view the members list (read-only)
- Owner/Admin required to update roles or remove members
- Owner role cannot be changed or removed (protected)
- Admin cannot promote to owner (ownership transfer separate)
- Admin cannot remove other admins (only owner can)

**Events Emitted:**
- `workspace.member.role_changed` - When role updated
- `workspace.member.removed` - When member removed

---

_Story drafted: 2025-12-02_
_Implementation completed: 2025-12-02_
