# Story 02.4: Implement Workspace Switching

**Story ID:** 02-4
**Epic:** EPIC-02 - Workspace Management
**Status:** Drafted
**Priority:** P1 - High
**Points:** 2
**Created:** 2025-12-02

---

## User Story

**As a** user who belongs to multiple workspaces
**I want** to switch between my workspaces from the UI
**So that** I can access and work in different workspace contexts

---

## Story Context

Users may belong to multiple workspaces. The workspace switcher allows them to change their active workspace, which updates the session context and reloads relevant data. The active workspace is stored in the session and used for tenant isolation in all subsequent API calls.

---

## Acceptance Criteria

### AC-2.4.1: Workspace selector displays current workspace
**Given** user is logged in with an active workspace
**When** viewing the sidebar/header
**Then**:
- Current workspace name and avatar displayed
- Dropdown trigger clearly visible
- Workspace slug shown if no avatar

### AC-2.4.2: Workspace list shows all memberships
**Given** user belongs to 3 workspaces
**When** opening the workspace selector
**Then**:
- All 3 workspaces listed
- Current workspace has checkmark
- Each shows name and role badge
- Sorted alphabetically

### AC-2.4.3: Switching workspace updates session
**Given** user is in "Workspace A"
**When** selecting "Workspace B" from dropdown
**Then**:
- Session activeWorkspaceId updated
- Page data reloads for new workspace context
- Success indicator shown briefly
- URL remains same (no workspace in URL)

### AC-2.4.4: Create workspace option available
**Given** workspace selector is open
**When** viewing options
**Then**:
- "Create new workspace" option at bottom
- Clicking opens create workspace modal
- After creation, switches to new workspace

### AC-2.4.5: No workspace fallback
**Given** user has no workspaces
**When** viewing dashboard
**Then**:
- Prompted to create first workspace
- No workspace selector visible until workspace exists

---

## Technical Implementation Guidance

### API Endpoint to Implement

#### POST `/api/workspaces/switch` - Switch Active Workspace

**Location:** `apps/web/src/app/api/workspaces/switch/route.ts`

**Request Body:**
```typescript
{
  workspaceId: string;  // UUID of target workspace
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    workspace: {
      id: string;
      name: string;
      slug: string;
    };
  }
}
```

**Implementation Steps:**
1. Validate user is authenticated
2. Verify user has membership in target workspace
3. Update session.activeWorkspaceId
4. Return workspace info

**Error Handling:**
- 401: Not authenticated
- 403: Not a member of workspace
- 404: Workspace not found

---

### Components to Implement

#### WorkspaceSelector Component

**Location:** `apps/web/src/components/workspace/workspace-selector.tsx`

**Features:**
- Current workspace display (name, avatar initials)
- Dropdown with workspace list
- Role badges (Owner, Admin, Member, etc.)
- Create workspace option
- Loading state during switch

---

### Client-Side State

**Location:** `apps/web/src/hooks/use-workspace.ts`

**Hook Features:**
- Get current workspace from session
- Switch workspace function
- Workspace list query
- Invalidate queries on switch

---

## Test Requirements

### Integration Tests

#### Test Suite: POST `/api/workspaces/switch`
- Valid switch updates session
- Invalid workspace ID returns 404
- Non-member returns 403
- Unauthenticated returns 401

---

## Definition of Done

- [ ] API endpoint implemented
- [ ] WorkspaceSelector component created
- [ ] useWorkspace hook implemented
- [ ] Session update working
- [ ] Data reloads on switch
- [ ] No linting or type errors
- [ ] Successfully tested in local development

---

## Dependencies

### Upstream Dependencies
- **Story 02-1:** Workspace CRUD (workspace data)
- **Story 02-3:** Invitation acceptance (session workspace update)

### Downstream Dependencies
- **Story 02-5:** Member management (uses workspace context)
- **Story 02-6:** Workspace settings (uses workspace context)

---

## References

- **Tech Spec:** `/docs/sprint-artifacts/tech-spec-epic-02.md`
- **Epic File:** `/docs/epics/EPIC-02-workspace-management.md`

---

## Implementation Notes (2025-12-02)

**Completed:**
- Switch workspace API endpoint
- useWorkspace hook for client-side management
- WorkspaceSelector dropdown component
- Role badges and workspace initials

**Integration Notes:**
- WorkspaceSelector should be added to sidebar/header layout
- May need CreateWorkspaceModal component for onCreateWorkspace callback

---

_Story drafted: 2025-12-02_
_Implementation completed: 2025-12-02_
