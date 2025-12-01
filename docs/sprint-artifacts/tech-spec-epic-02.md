# Epic Technical Specification: Workspace Management

Date: 2025-12-02
Author: chris
Epic ID: 02
Status: Draft

---

## Overview

Epic 02 implements multi-tenant workspace management for the HYVVE platform. Workspaces serve as the primary isolation boundary for all tenant data, enabling teams to collaborate within shared contexts while maintaining strict separation from other tenants. This epic establishes workspace CRUD operations, member invitation via email, role assignment, workspace switching, and settings management.

Workspace management is foundational to HYVVE's multi-tenancy architecture (ADR-003), where each workspace represents a single tenant. All subsequent platform features (approval queues, AI agents, module data) will be scoped to the active workspace context. The workspace ID flows through JWT claims to enforce tenant isolation at both the application layer (Prisma Client Extension) and database layer (Row-Level Security).

## Objectives and Scope

### In Scope

- Workspace CRUD operations with auto-generated slugs
- Member invitation system with secure tokens and 7-day expiry
- Invitation acceptance for both existing and new users
- Workspace switching with session context update
- Member management (list, update role, remove)
- Workspace settings page (name, avatar, timezone)
- Soft deletion with 30-day grace period

### Out of Scope

- Module-level permission overrides - Epic 03 (RBAC)
- Row-Level Security policy implementation - Epic 03
- API key creation per workspace - Epic 03
- Workspace billing and subscription - Future
- Custom workspace domains - Future
- Workspace templates/cloning - Future

## System Architecture Alignment

### Components Referenced

| Component | Purpose | Package |
|-----------|---------|---------|
| Next.js API Routes | Workspace endpoints | `apps/web/src/app/api/workspaces` |
| Prisma Models | Data persistence | `packages/db` |
| Resend | Invitation emails | External service |
| Zustand Store | Active workspace state | `apps/web/src/stores/workspace.ts` |
| better-auth Session | Workspace context in JWT | `apps/web/src/lib/auth.ts` |

### Architecture Constraints

- **ADR-003**: RLS + Prisma Extension for multi-tenancy - workspace ID = tenant ID
- **ADR-002**: Workspace API in Next.js routes (platform API, not NestJS modules)
- JWT claims must include `workspaceId` for active workspace context
- Prisma extension will auto-filter queries by active workspace (implemented in Epic 03)
- All workspace-scoped data models require `workspaceId` foreign key

---

## Detailed Design

### Services and Modules

| Service | Responsibility | Location | Owner |
|---------|---------------|----------|-------|
| WorkspaceService | CRUD operations, slug generation | `apps/web/src/lib/workspace.ts` | Frontend |
| InvitationService | Token generation, email dispatch | `apps/web/src/lib/invitation.ts` | Frontend |
| WorkspaceStore | Client-side active workspace state | `apps/web/src/stores/workspace.ts` | Frontend |
| SessionService | Update session with workspace context | `apps/web/src/lib/auth.ts` | Frontend |

### Data Models and Contracts

**Prisma Models (packages/db):**

```prisma
model Workspace {
  id              String    @id @default(uuid())
  name            String
  slug            String    @unique
  image           String?
  timezone        String    @default("UTC")

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  members         WorkspaceMember[]
  invitations     WorkspaceInvitation[]
  aiProviders     AIProviderConfig[]
  approvals       ApprovalItem[]
  apiKeys         ApiKey[]

  @@map("workspaces")
}

model WorkspaceMember {
  id                  String    @id @default(uuid())
  userId              String    @map("user_id")
  workspaceId         String    @map("workspace_id")

  role                String    @default("member") // owner, admin, member, viewer, guest
  modulePermissions   Json?     @map("module_permissions")

  invitedBy           String?   @map("invited_by")
  invitedAt           DateTime  @default(now()) @map("invited_at")
  acceptedAt          DateTime? @map("accepted_at")

  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@index([workspaceId])
  @@map("workspace_members")
}

model WorkspaceInvitation {
  id              String    @id @default(uuid())
  workspaceId     String    @map("workspace_id")
  email           String
  role            String    @default("member")
  token           String    @unique
  expiresAt       DateTime  @map("expires_at")

  invitedBy       String    @map("invited_by")
  createdAt       DateTime  @default(now()) @map("created_at")
  acceptedAt      DateTime? @map("accepted_at")

  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, email])
  @@index([token])
  @@map("workspace_invitations")
}
```

**TypeScript Interfaces:**

```typescript
// packages/shared/src/types/workspace.ts
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  modulePermissions: Record<string, unknown> | null;
  invitedBy: string | null;
  invitedAt: Date;
  acceptedAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  expiresAt: Date;
  invitedBy: string;
  createdAt: Date;
  acceptedAt: Date | null;
}
```

### APIs and Interfaces

| Endpoint | Method | Request | Response | Auth |
|----------|--------|---------|----------|------|
| `/api/workspaces` | GET | - | `{ data: Workspace[] }` | Required |
| `/api/workspaces` | POST | `{ name }` | `{ data: Workspace }` | Required |
| `/api/workspaces/:id` | GET | - | `{ data: Workspace }` | Member |
| `/api/workspaces/:id` | PATCH | `{ name?, image?, timezone? }` | `{ data: Workspace }` | Owner/Admin |
| `/api/workspaces/:id` | DELETE | - | `{ success: true }` | Owner |
| `/api/workspaces/:id/members` | GET | - | `{ data: WorkspaceMember[] }` | Member |
| `/api/workspaces/:id/members/:userId` | PATCH | `{ role }` | `{ data: WorkspaceMember }` | Owner/Admin |
| `/api/workspaces/:id/members/:userId` | DELETE | - | `{ success: true }` | Owner/Admin |
| `/api/workspaces/:id/invitations` | GET | - | `{ data: WorkspaceInvitation[] }` | Owner/Admin |
| `/api/workspaces/:id/invitations` | POST | `{ email, role }` | `{ data: WorkspaceInvitation }` | Owner/Admin |
| `/api/workspaces/:id/invitations/:id` | DELETE | - | `{ success: true }` | Owner/Admin |
| `/api/invitations/accept` | POST | `{ token }` | `{ data: Workspace }` | Public |

**Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `WORKSPACE_NOT_FOUND` | 404 | Workspace ID does not exist |
| `SLUG_IN_USE` | 409 | Generated slug already exists |
| `INVITATION_EXPIRED` | 400 | Invitation token past 7-day expiry |
| `INVITATION_NOT_FOUND` | 404 | Invalid invitation token |
| `ALREADY_MEMBER` | 409 | User already belongs to workspace |
| `PENDING_INVITATION` | 409 | Email already has pending invitation |
| `CANNOT_DEMOTE_OWNER` | 403 | Attempting to change owner role |
| `CANNOT_REMOVE_OWNER` | 403 | Attempting to remove workspace owner |
| `WORKSPACE_DELETED` | 410 | Workspace is in deletion grace period |

### Workflows and Sequencing

**Workspace Creation Flow:**
```
User → Create workspace form → Validate name
  → Generate slug (lowercase + nanoid) → Check slug unique
  → Create Workspace record → Create WorkspaceMember (role: owner)
  → Update session with workspaceId → Redirect to dashboard
```

**Member Invitation Flow:**
```
Owner/Admin → Invite form (email, role) → Validate email format
  → Check not already member → Check no pending invitation
  → Generate secure token (32 bytes) → Set 7-day expiry
  → Create WorkspaceInvitation → Send email via Resend
  → Show success toast
```

**Invitation Acceptance Flow:**
```
Invitee → Click email link (/invite/:token) → Validate token
  → Check not expired → Check not already accepted
  → If logged in: Create WorkspaceMember → Update session → Redirect to workspace
  → If not logged in + existing user: Redirect to sign-in with ?invite=token
  → If not logged in + new user: Redirect to sign-up with ?invite=token
  → Mark invitation accepted → Send welcome email
```

**Workspace Switching Flow:**
```
User → Click workspace selector → Show workspace list
  → Select workspace → Validate membership
  → Update session.activeWorkspaceId → Invalidate workspace-scoped queries
  → Redirect to dashboard → Update workspace store
```

**Workspace Deletion Flow:**
```
Owner → Settings → Delete workspace → Confirm with workspace name
  → Set deletedAt = now() → Revoke all member access
  → Send confirmation email → Show deletion banner
  → After 30 days: Hard delete cascade all data
```

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Workspace list (p95) | < 100ms | API monitoring |
| Workspace switch (p95) | < 200ms | Session update + redirect |
| Member list (p95) | < 150ms | Paginated (50 max) |
| Invitation email delivery | < 5 seconds | Resend webhook |

### Security

| Requirement | Implementation | Reference |
|-------------|---------------|-----------|
| Authorization checks | Middleware validates workspace membership | NFR-S8 |
| Invitation tokens | Cryptographically random (32 bytes) | crypto.randomBytes |
| Token single-use | Mark accepted on use | Database constraint |
| Soft delete isolation | Query filter on deletedAt | Prisma where clause |
| Role hierarchy enforcement | Backend validation, not just UI | Service layer |

**Role Permission Matrix:**

| Permission | Owner | Admin | Member | Viewer | Guest |
|------------|-------|-------|--------|--------|-------|
| View workspace | Yes | Yes | Yes | Yes | Limited |
| Update settings | Yes | Yes | No | No | No |
| Invite members | Yes | Yes | No | No | No |
| Remove members | Yes | Yes* | No | No | No |
| Change roles | Yes | Limited** | No | No | No |
| Delete workspace | Yes | No | No | No | No |
| Leave workspace | No*** | Yes | Yes | Yes | Yes |

*Admin cannot remove Owner
**Admin can only promote up to Admin level
***Owner cannot leave, must transfer ownership or delete

### Reliability/Availability

- Workspace service availability: 99.9%
- Invitation email retry: 3 attempts with exponential backoff
- Graceful degradation: If Resend unavailable, queue invitations
- Data consistency: Transactional workspace + member creation

### Observability

| Signal | Type | Purpose |
|--------|------|---------|
| `workspace.created` | Event | New workspace tracking |
| `workspace.deleted` | Event | Deletion monitoring |
| `workspace.member.invited` | Event | Invitation analytics |
| `workspace.member.joined` | Event | Conversion tracking |
| `workspace.member.left` | Event | Churn monitoring |
| `workspace.switched` | Metric | Usage patterns |

---

## Dependencies and Integrations

### npm Dependencies

```json
{
  "nanoid": "^5.0.0",
  "resend": "^3.0.0",
  "zod": "^3.23.0",
  "date-fns": "^3.0.0"
}
```

### External Services

| Service | Purpose | Credentials |
|---------|---------|-------------|
| Resend | Invitation and notification emails | `RESEND_API_KEY` |

### Environment Variables Required

```bash
# Email (inherited from Epic 01)
RESEND_API_KEY=xxx
FROM_EMAIL=noreply@hyvve.io

# Application URL (for invitation links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Epic Dependencies

- **Epic 00** (Complete): Prisma database package, Next.js setup, shared types
- **Epic 01** (Complete): Authentication, session management, user model

### Wireframe References

Settings wireframes are complete. Reference these when implementing UI:

| Story | Wireframe | Description | Assets |
|-------|-----------|-------------|--------|
| 02.4 Workspace Switching | SH-03 | Workspace selector in sidebar | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-03_sidebar_collapsed/code.html) |
| 02.5 Member Management | ST-05 | Team members settings page | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/st-05_settings_team/code.html) |
| 02.6 Workspace Settings | ST-01 | Settings layout with navigation | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/st-01_settings_layout/code.html) |

**Full wireframe index:** [WIREFRAME-INDEX.md](../design/wireframes/WIREFRAME-INDEX.md)

---

## Acceptance Criteria (Authoritative)

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-2.1.1 | User can create workspace | Given authenticated user, when submitting workspace name, then workspace created with auto-slug and user as owner |
| AC-2.1.2 | Slug auto-generated unique | Given workspace name "My Business", when created, then slug like "my-business-abc123" generated |
| AC-2.1.3 | Workspace list returns user's workspaces | Given user in 3 workspaces, when fetching list, then 3 workspaces returned |
| AC-2.1.4 | Workspace update restricted | Given member role, when updating workspace, then 403 Forbidden returned |
| AC-2.1.5 | Workspace soft delete works | Given owner, when deleting, then deletedAt set and access blocked |
| AC-2.2.1 | Owner can invite members | Given owner, when inviting email with role, then invitation created and email sent |
| AC-2.2.2 | Admin can invite members | Given admin, when inviting, then invitation sent |
| AC-2.2.3 | Member cannot invite | Given member role, when inviting, then 403 Forbidden |
| AC-2.2.4 | Duplicate invitation blocked | Given pending invitation for email, when inviting same email, then error returned |
| AC-2.2.5 | Invitation email received | Given invitation sent, when checking inbox, then email received within 5 seconds |
| AC-2.3.1 | Existing user accepts invitation | Given logged-in user with valid token, when accepting, then added to workspace |
| AC-2.3.2 | New user accepts invitation | Given valid token and no account, when accepting, then redirected to sign-up with context |
| AC-2.3.3 | Expired invitation rejected | Given 7+ day old token, when accepting, then error "Invitation expired" |
| AC-2.3.4 | Used invitation rejected | Given already-accepted token, when accepting again, then error returned |
| AC-2.4.1 | User can switch workspaces | Given user in multiple workspaces, when selecting different workspace, then context updated |
| AC-2.4.2 | Session updated on switch | Given workspace switch, when checking session, then activeWorkspaceId updated |
| AC-2.4.3 | Last workspace remembered | Given user switches to workspace B, when returning to app, then workspace B active |
| AC-2.5.1 | Member list shows all members | Given workspace with 5 members, when viewing list, then 5 members with roles shown |
| AC-2.5.2 | Owner can change member roles | Given owner, when changing member to admin, then role updated |
| AC-2.5.3 | Admin cannot demote owner | Given admin, when trying to change owner role, then 403 Forbidden |
| AC-2.5.4 | Member can leave workspace | Given member, when leaving, then removed from workspace |
| AC-2.5.5 | Owner cannot leave | Given owner, when trying to leave, then error "Transfer ownership first" |
| AC-2.6.1 | Settings page accessible | Given owner/admin, when navigating to settings, then workspace settings shown |
| AC-2.6.2 | Name update saves | Given owner, when updating name, then name changed |
| AC-2.6.3 | Avatar upload works | Given owner with image, when uploading, then image saved and displayed |
| AC-2.7.1 | Delete requires confirmation | Given owner on delete, when confirming with workspace name, then deletion initiated |
| AC-2.7.2 | 30-day grace period | Given deleted workspace, when checking after 7 days, then still recoverable |
| AC-2.7.3 | Access blocked during grace | Given deleted workspace, when accessing, then error "Workspace scheduled for deletion" |

---

## Traceability Mapping

| AC | Spec Section | Component(s)/API(s) | Test Idea |
|----|--------------|---------------------|-----------|
| AC-2.1.1 | Data Models, APIs | `POST /api/workspaces`, Workspace, WorkspaceMember | Integration: create workspace, verify owner membership |
| AC-2.1.2 | Workflows | Slug generation function | Unit: slug format validation |
| AC-2.1.3 | APIs | `GET /api/workspaces` | Integration: list returns correct count |
| AC-2.1.4 | Security | Authorization middleware | Integration: member role returns 403 |
| AC-2.1.5 | Workflows | `DELETE /api/workspaces/:id`, soft delete | Integration: deletedAt set, queries exclude |
| AC-2.2.1 | APIs, Workflows | `POST /api/workspaces/:id/invitations` | Integration: invitation created |
| AC-2.2.2 | Security | Role check in middleware | Integration: admin can invite |
| AC-2.2.3 | Security | Role check in middleware | Integration: member cannot invite |
| AC-2.2.4 | Data Models | Unique constraint on email+workspace | Integration: duplicate returns 409 |
| AC-2.2.5 | Dependencies | Resend integration | E2E: email delivery time |
| AC-2.3.1 | Workflows | `/api/invitations/accept` | Integration: member created |
| AC-2.3.2 | Workflows | Accept page, redirect logic | E2E: redirect to sign-up |
| AC-2.3.3 | Workflows | Token expiry validation | Unit: expired token rejected |
| AC-2.3.4 | Data Models | acceptedAt check | Integration: reuse returns error |
| AC-2.4.1 | Workflows | Workspace selector, switch handler | E2E: context changes |
| AC-2.4.2 | Data Models | Session.activeWorkspaceId | Integration: session updated |
| AC-2.4.3 | Workflows | LocalStorage or session persistence | E2E: reload maintains workspace |
| AC-2.5.1 | APIs | `GET /api/workspaces/:id/members` | Integration: returns all members |
| AC-2.5.2 | APIs, Security | `PATCH /api/workspaces/:id/members/:userId` | Integration: role updated |
| AC-2.5.3 | Security | Role hierarchy validation | Integration: admin cannot demote owner |
| AC-2.5.4 | APIs | `DELETE /api/workspaces/:id/members/:userId` | Integration: self-removal works |
| AC-2.5.5 | Security | Owner leave validation | Integration: owner cannot delete self |
| AC-2.6.1 | APIs | `GET /api/workspaces/:id`, settings page | E2E: page renders |
| AC-2.6.2 | APIs | `PATCH /api/workspaces/:id` | Integration: name updated |
| AC-2.6.3 | APIs | Image upload endpoint | Integration: image stored |
| AC-2.7.1 | Workflows | Delete confirmation UI | E2E: confirmation required |
| AC-2.7.2 | Data Models | deletedAt timestamp check | Unit: 30-day window logic |
| AC-2.7.3 | Security | Soft delete middleware | Integration: deleted workspace blocked |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Invitation email deliverability | Medium | Monitor Resend bounce rates, implement retry queue |
| Slug collisions at scale | Low | nanoid(6) provides 56B combinations, add retry logic |
| Orphaned data on deletion | High | Comprehensive cascade delete, 30-day grace period |
| Session sync across tabs | Medium | Use React Query cache invalidation on switch |

### Assumptions

- Users have valid email addresses for invitations
- Resend service available and configured from Epic 01
- better-auth session can store custom claims (workspaceId)
- File storage (for workspace images) available via Supabase Storage or S3

### Open Questions

| Question | Owner | Resolution Deadline |
|----------|-------|---------------------|
| Should workspace image upload go through Supabase Storage? | Architecture | Story 02.6 |
| Maximum members per workspace (free tier limit)? | Product | Story 02.2 |
| Email template branding - reuse from Epic 01? | Design | Story 02.2 |
| Workspace slug - allow manual override? | Product | Story 02.1 |

---

## Test Strategy Summary

### Test Levels

| Level | Scope | Tools | Coverage |
|-------|-------|-------|----------|
| Unit | Slug generation, role validation, token expiry | Vitest | All utility functions |
| Integration | API endpoints, database operations | Vitest + Prisma test client | All workspace endpoints |
| E2E | User flows | Playwright | Create, invite, accept, switch, delete |

### Test Data

- Seed test workspace: "Test Workspace" / slug: "test-workspace-xxx"
- Seed users with different roles in test workspace
- Mock Resend in tests to avoid email sends

### Coverage Targets

- Unit tests: 80% coverage on utilities
- Integration tests: All API endpoints, all role combinations
- E2E tests: Happy paths for create, invite, switch, delete flows

### Edge Cases to Test

- Creating workspace with same name as existing (slug collision)
- Inviting user who is already a member
- Accepting invitation while logged in as different user
- Switching to deleted workspace
- Owner trying to leave without transferring ownership
- Admin trying to demote another admin
- Concurrent invitation acceptance
- Expired invitation reuse attempt
