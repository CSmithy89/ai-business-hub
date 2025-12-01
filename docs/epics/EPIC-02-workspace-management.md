# Epic 02: Workspace Management

**Epic ID:** EPIC-02
**Status:** Ready for Development
**Priority:** P0 - Critical
**Phase:** Phase 1 - Core Foundation

---

## Epic Overview

Implement multi-tenant workspace management with member invitation and role assignment.

### Business Value
Workspaces enable team collaboration and data isolation. Members can work together within a shared context while maintaining separation from other tenants.

### Success Criteria
- [ ] Users can create workspaces
- [ ] Owners can invite members via email
- [ ] Users can switch between workspaces
- [ ] Member roles are assigned and enforced
- [ ] Workspace settings are editable

---

## Stories

### Story 02.1: Create Workspace CRUD Operations

**Points:** 3
**Priority:** P0

**As a** user
**I want** to create and manage workspaces
**So that** I can organize my business data

**Acceptance Criteria:**
- [ ] POST `/api/workspaces` - Create workspace
  - Auto-generate slug from name
  - Set creator as owner
  - Set default timezone (UTC)
- [ ] GET `/api/workspaces` - List user's workspaces
- [ ] GET `/api/workspaces/:id` - Get workspace details
- [ ] PATCH `/api/workspaces/:id` - Update workspace (owner/admin)
- [ ] DELETE `/api/workspaces/:id` - Soft delete (owner only, 30-day grace)

**API Request/Response:**
```typescript
// POST /api/workspaces
{ name: "My Business" }
// Response
{ data: { id, name, slug, image, timezone, createdAt } }
```

---

### Story 02.2: Implement Member Invitation System

**Points:** 3
**Priority:** P0

**As a** workspace owner/admin
**I want** to invite team members via email
**So that** they can collaborate in my workspace

**Acceptance Criteria:**
- [ ] POST `/api/workspaces/:id/invitations` - Create invitation
  - Generate secure invitation token
  - Set expiry (7 days)
  - Assign role for new member
- [ ] Send invitation email via Resend
- [ ] Create invitation acceptance page
- [ ] Handle existing users vs new signups
- [ ] Limit: 1 pending invitation per email per workspace

**Invitation Email:**
- Workspace name and inviter name
- Role being assigned
- Accept invitation button/link
- Expiry date

---

### Story 02.3: Implement Invitation Acceptance

**Points:** 2
**Priority:** P0

**As an** invited user
**I want** to accept a workspace invitation
**So that** I can join the team

**Acceptance Criteria:**
- [ ] Create accept page at `/invite/:token`
- [ ] Validate token and expiry
- [ ] For existing users: Add to workspace immediately
- [ ] For new users: Redirect to sign-up with invitation context
- [ ] Create `WorkspaceMember` record with assigned role
- [ ] Send welcome email to new member
- [ ] Invalidate invitation token after use

---

### Story 02.4: Implement Workspace Switching

**Points:** 2
**Priority:** P0

**As a** user with multiple workspaces
**I want** to switch between my workspaces
**So that** I can work in different contexts

**Acceptance Criteria:**
- [ ] Store active workspace ID in session
- [ ] Create workspace selector component in sidebar
- [ ] Update session on workspace switch
- [ ] Redirect to dashboard on switch
- [ ] Remember last active workspace
- [ ] Show workspace name/logo in header

**UI Components:**
- Workspace selector dropdown in sidebar
- Workspace name + icon display
- "Create new workspace" option

---

### Story 02.5: Implement Member Management

**Points:** 2
**Priority:** P0

**As a** workspace owner/admin
**I want** to manage team members
**So that** I can control access and roles

**Acceptance Criteria:**
- [ ] GET `/api/workspaces/:id/members` - List members
- [ ] PATCH `/api/workspaces/:id/members/:userId` - Update role
  - Owner cannot be demoted by admin
  - Admin can only promote up to admin level
- [ ] DELETE `/api/workspaces/:id/members/:userId` - Remove member
  - Owner cannot be removed
  - Members can leave (except owner)
- [ ] Create members list UI in settings

**UI Components:**
- Member list with role badges
- Role dropdown for editing
- Remove member button with confirmation

---

### Story 02.6: Create Workspace Settings Page

**Points:** 2
**Priority:** P1

**As a** workspace owner/admin
**I want** to configure workspace settings
**So that** I can customize the experience

**Acceptance Criteria:**
- [ ] Create settings page at `/settings/workspace`
- [ ] Editable fields:
  - Workspace name
  - Workspace image/avatar
  - Timezone
- [ ] Image upload with preview
- [ ] Save with optimistic update
- [ ] Show success/error toast

---

### Story 02.7: Implement Workspace Deletion

**Points:** 2
**Priority:** P1

**As a** workspace owner
**I want** to delete a workspace
**So that** I can remove unused workspaces

**Acceptance Criteria:**
- [ ] Add delete button in workspace settings
- [ ] Require confirmation with workspace name
- [ ] Soft delete (set `deletedAt`)
- [ ] 30-day grace period before hard delete
- [ ] Send confirmation email
- [ ] Prevent access during grace period
- [ ] Allow restoration during grace period

---

## Dependencies

- Epic 00: Project Scaffolding
- Epic 01: Authentication (for user context)

## Technical Notes

### Database Tables Used
- `workspaces` - Workspace records
- `workspace_members` - User-workspace junction
- `workspace_invitations` - Pending invitations

### Slug Generation
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + nanoid(6);
}
```

---

_Epic created: 2025-11-30_
_PRD Reference: FR-2 Workspace Management_
