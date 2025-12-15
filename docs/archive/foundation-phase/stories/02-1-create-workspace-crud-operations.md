# Story 02.1: Create Workspace CRUD Operations

**Story ID:** 02-1
**Epic:** EPIC-02 - Workspace Management
**Status:** Drafted
**Priority:** P0 - Critical
**Points:** 3
**Created:** 2025-12-02

---

## User Story

**As a** user
**I want** to create and manage workspaces
**So that** I can organize my business data within isolated tenant contexts

---

## Story Context

Workspaces are the foundational multi-tenant isolation boundary for HYVVE. Each workspace represents a single tenant, and all platform features (approval queues, AI agents, module data) will be scoped to the active workspace context. This story implements the core CRUD operations that enable users to create, view, update, and delete workspaces.

The workspace ID flows through JWT claims (via better-auth session) to enforce tenant isolation at both the application layer (Prisma Client Extension in Epic 03) and database layer (Row-Level Security policies in Epic 03). When a user creates a workspace, they are automatically assigned as the owner, establishing the foundation for role-based access control.

Slug generation is automatic to ensure human-readable, SEO-friendly identifiers while guaranteeing uniqueness through nanoid suffixes.

---

## Acceptance Criteria

### AC-2.1.1: User can create workspace
**Given** an authenticated user
**When** submitting a workspace name via POST `/api/workspaces`
**Then** workspace is created with:
- Auto-generated unique slug (format: `{sanitized-name}-{nanoid(6)}`)
- User set as owner role in `WorkspaceMember` table
- Default timezone set to UTC
- Workspace ID returned in response
- User's session updated with new workspace as active context

### AC-2.1.2: Slug auto-generated unique
**Given** a workspace name "My Business"
**When** creating the workspace
**Then** a slug like "my-business-abc123" is generated where:
- Name is lowercase, alphanumeric + hyphens only
- Trailing/leading hyphens removed
- 6-character nanoid suffix appended for uniqueness
- Slug uniqueness validated before insertion

### AC-2.1.3: Workspace list returns user's workspaces
**Given** a user who is a member of 3 workspaces
**When** fetching GET `/api/workspaces`
**Then** all 3 workspaces are returned with:
- Workspace details (id, name, slug, image, timezone)
- User's role in each workspace
- Workspaces sorted by most recently updated

### AC-2.1.4: Workspace update restricted
**Given** a user with "member" role in a workspace
**When** attempting PATCH `/api/workspaces/:id` to update workspace
**Then** request is rejected with:
- HTTP 403 Forbidden status
- Error message: "Insufficient permissions. Owner or Admin role required."

### AC-2.1.5: Workspace soft delete works
**Given** a user with "owner" role
**When** deleting workspace via DELETE `/api/workspaces/:id`
**Then**:
- `deletedAt` timestamp is set to current time
- Workspace remains in database (soft delete)
- All member access is blocked with error "Workspace scheduled for deletion"
- 30-day grace period begins before hard deletion
- Confirmation email sent to owner

---

## Technical Implementation Guidance

### API Endpoints to Implement

#### 1. POST `/api/workspaces` - Create Workspace

**Location:** `apps/web/src/app/api/workspaces/route.ts`

**Request Body:**
```typescript
{
  name: string; // 3-50 characters
}
```

**Response (201):**
```typescript
{
  data: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    timezone: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

**Implementation Steps:**
1. Validate request body with Zod schema
2. Generate slug using slug generation utility
3. Check slug uniqueness (retry with new nanoid if collision)
4. Create workspace in transaction:
   - Insert `Workspace` record
   - Insert `WorkspaceMember` record (role: "owner", userId: session.userId)
5. Update session with `activeWorkspaceId = workspace.id`
6. Return workspace data
7. Emit event: `workspace.created`

**Error Handling:**
- 400: Invalid name (too short/long, invalid characters)
- 409: Slug collision after 3 retry attempts
- 500: Database transaction failure

---

#### 2. GET `/api/workspaces` - List User's Workspaces

**Location:** `apps/web/src/app/api/workspaces/route.ts`

**Query Parameters:** None

**Response (200):**
```typescript
{
  data: Array<{
    id: string;
    name: string;
    slug: string;
    image: string | null;
    timezone: string;
    createdAt: string;
    updatedAt: string;
    role: WorkspaceRole; // User's role in this workspace
  }>
}
```

**Implementation Steps:**
1. Get authenticated user ID from session
2. Query workspaces where:
   - User has `WorkspaceMember` record
   - `deletedAt IS NULL` (exclude soft-deleted)
3. Join with `WorkspaceMember` to include user's role
4. Sort by `updatedAt DESC`
5. Return workspace array

---

#### 3. GET `/api/workspaces/:id` - Get Workspace Details

**Location:** `apps/web/src/app/api/workspaces/[id]/route.ts`

**Path Parameters:**
- `id`: Workspace UUID

**Response (200):**
```typescript
{
  data: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    timezone: string;
    createdAt: string;
    updatedAt: string;
    memberCount: number; // Total active members
    userRole: WorkspaceRole; // Current user's role
  }
}
```

**Implementation Steps:**
1. Validate workspace ID format
2. Check user membership in workspace
3. Query workspace with member count aggregate
4. Return workspace data with user's role

**Error Handling:**
- 404: Workspace not found or user not a member
- 410: Workspace is soft-deleted

---

#### 4. PATCH `/api/workspaces/:id` - Update Workspace

**Location:** `apps/web/src/app/api/workspaces/[id]/route.ts`

**Path Parameters:**
- `id`: Workspace UUID

**Request Body:**
```typescript
{
  name?: string; // 3-50 characters
  image?: string; // URL or file path
  timezone?: string; // Valid IANA timezone
}
```

**Response (200):**
```typescript
{
  data: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    timezone: string;
    updatedAt: string;
  }
}
```

**Authorization:** Owner or Admin role required

**Implementation Steps:**
1. Validate workspace ID and user membership
2. Check user role is "owner" or "admin"
3. Validate request body fields
4. If name changed: regenerate slug with new name
5. Update workspace record
6. Return updated workspace
7. Emit event: `workspace.updated`

**Error Handling:**
- 403: User lacks owner/admin role
- 400: Invalid timezone or name
- 404: Workspace not found

---

#### 5. DELETE `/api/workspaces/:id` - Soft Delete Workspace

**Location:** `apps/web/src/app/api/workspaces/[id]/route.ts`

**Path Parameters:**
- `id`: Workspace UUID

**Response (200):**
```typescript
{
  success: true;
  message: "Workspace scheduled for deletion in 30 days";
  deletedAt: string;
}
```

**Authorization:** Owner role only

**Implementation Steps:**
1. Validate workspace ID and user membership
2. Check user role is exactly "owner"
3. Update workspace: `deletedAt = now()`
4. Revoke access for all members (block in middleware)
5. Send confirmation email to owner
6. Schedule hard delete job (30 days from now)
7. Return success response
8. Emit event: `workspace.deleted`

**Error Handling:**
- 403: User is not owner
- 404: Workspace not found
- 409: Workspace already deleted

---

### Database Models

Reference `packages/db/schema.prisma`:

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
```

---

### Shared Types

**Location:** `packages/shared/src/types/workspace.ts`

```typescript
import { z } from 'zod';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be under 50 characters'),
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  image: z.string().url().nullable().optional(),
  timezone: z.string().optional(), // Validate against IANA timezone list
});

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

export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
  memberCount?: number;
}
```

---

### Utilities to Create

#### Slug Generation

**Location:** `apps/web/src/lib/workspace.ts`

```typescript
import { nanoid } from 'nanoid';

export function generateSlug(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  const uniqueSuffix = nanoid(6);
  return `${sanitized}-${uniqueSuffix}`;
}

export async function generateUniqueSlug(
  name: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const slug = generateSlug(name);
    const exists = await checkExists(slug);

    if (!exists) {
      return slug;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique slug after 3 attempts');
}
```

---

### Authorization Middleware

**Location:** `apps/web/src/middleware/workspace-auth.ts`

```typescript
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function requireWorkspaceMembership(
  req: NextRequest,
  workspaceId: string
): Promise<{ userId: string; role: string }> {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Unauthorized', { cause: { status: 401 } });
  }

  const member = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: workspaceId,
      },
    },
    include: {
      workspace: true,
    },
  });

  if (!member) {
    throw new Error('Workspace not found', { cause: { status: 404 } });
  }

  if (member.workspace.deletedAt) {
    throw new Error('Workspace scheduled for deletion', { cause: { status: 410 } });
  }

  return {
    userId: session.user.id,
    role: member.role,
  };
}

export function requireRole(userRole: string, allowedRoles: string[]): void {
  if (!allowedRoles.includes(userRole)) {
    throw new Error('Insufficient permissions', { cause: { status: 403 } });
  }
}
```

---

## Test Requirements

### Unit Tests

**Location:** `apps/web/src/lib/__tests__/workspace.test.ts`

- Slug generation with valid names
- Slug generation with special characters
- Slug generation with empty/whitespace names
- Unique slug generation with collision retry
- Slug format validation (lowercase, hyphens, nanoid suffix)

### Integration Tests

**Location:** `apps/web/src/app/api/workspaces/__tests__/workspaces.test.ts`

#### Test Suite: POST `/api/workspaces`
- Create workspace with valid name
- Verify owner membership created
- Verify session updated with workspace ID
- Reject unauthenticated requests (401)
- Reject invalid name (400)
- Handle slug collision gracefully

#### Test Suite: GET `/api/workspaces`
- List all user's workspaces
- Return correct role for each workspace
- Exclude soft-deleted workspaces
- Sort by most recent update
- Return empty array for user with no workspaces

#### Test Suite: GET `/api/workspaces/:id`
- Get workspace details with member count
- Return user's role in workspace
- Reject non-member access (404)
- Reject soft-deleted workspace (410)

#### Test Suite: PATCH `/api/workspaces/:id`
- Owner can update all fields
- Admin can update all fields
- Member cannot update (403)
- Regenerate slug on name change
- Validate timezone format

#### Test Suite: DELETE `/api/workspaces/:id`
- Owner can soft delete
- Set deletedAt timestamp
- Block member access after deletion
- Admin cannot delete (403)
- Member cannot delete (403)

### E2E Tests

**Location:** `apps/web/tests/e2e/workspace-crud.spec.ts`

1. **Happy Path: Create Workspace Flow**
   - Sign in as user
   - Navigate to create workspace page
   - Fill in workspace name
   - Submit form
   - Verify workspace appears in list
   - Verify user redirected to dashboard

2. **Workspace Update Flow**
   - Sign in as workspace owner
   - Navigate to workspace settings
   - Update workspace name and timezone
   - Save changes
   - Verify changes persisted

3. **Workspace Deletion Flow**
   - Sign in as workspace owner
   - Navigate to workspace settings
   - Click delete workspace
   - Confirm with workspace name
   - Verify deletion confirmation shown
   - Verify workspace no longer accessible

4. **Authorization Edge Cases**
   - Member attempts to update workspace settings (blocked)
   - Member attempts to delete workspace (blocked)
   - Non-member attempts to access workspace (blocked)

---

## Definition of Done

- [ ] All API endpoints implemented and functional
- [ ] Slug generation utility created and tested
- [ ] Authorization middleware implemented
- [ ] Workspace and WorkspaceMember models migrated to database
- [ ] Shared TypeScript types defined
- [ ] Zod validation schemas created
- [ ] All acceptance criteria met and tested
- [ ] Unit tests written (80%+ coverage on utilities)
- [ ] Integration tests written (all endpoints, all roles)
- [ ] E2E tests written (happy paths + edge cases)
- [ ] Error handling implemented for all failure modes
- [ ] API responses follow standard format
- [ ] Event emissions implemented (workspace.created, workspace.updated, workspace.deleted)
- [ ] Code reviewed and approved
- [ ] Documentation updated (API reference if exists)
- [ ] No linting or type errors
- [ ] Successfully tested in local development environment

---

## Dependencies

### Upstream Dependencies
- **Epic 00:** Monorepo structure, Prisma package, Next.js setup
- **Epic 01:** Authentication system, session management, user model

### Downstream Dependencies
- **Story 02.2:** Member invitation system (requires workspace CRUD)
- **Story 02.4:** Workspace switching (requires workspace list API)
- **Story 02.5:** Member management (requires workspace authorization)
- **Story 02.6:** Workspace settings (requires update API)
- **Story 02.7:** Workspace deletion (requires soft delete API)

---

## Implementation Notes

### Session Management
After workspace creation, update the better-auth session to include the new workspace as the active context:

```typescript
// apps/web/src/lib/auth.ts
export async function setActiveWorkspace(workspaceId: string) {
  const session = await getSession();

  // Update session with activeWorkspaceId claim
  await updateSession({
    ...session,
    activeWorkspaceId: workspaceId,
  });
}
```

### Slug Collision Handling
With nanoid(6), collision probability is extremely low (56 billion combinations). Retry logic ensures robustness:

```typescript
// Retry up to 3 times on collision
// Log collision events for monitoring
// If all attempts fail, return 500 error
```

### Soft Delete Strategy
- Set `deletedAt` timestamp instead of hard delete
- Add database query filter: `WHERE deletedAt IS NULL`
- Schedule background job to hard delete after 30 days
- Implement restoration endpoint in future story if needed

### Performance Considerations
- Index on `workspaces.slug` for uniqueness check (unique constraint)
- Index on `workspace_members.workspaceId` for member queries
- Index on `workspace_members.userId` for user's workspace list
- Consider caching workspace list (invalidate on create/update/delete)

### Security Considerations
- Always validate workspace ownership/membership before operations
- Never trust client-side role claims - query database
- Prevent role escalation through proper authorization checks
- Audit log all workspace deletion actions

---

## Open Questions

| Question | Owner | Status | Resolution |
|----------|-------|--------|------------|
| Should workspace slug allow manual override by user? | Product | Open | Defer to Story 02.6 if needed |
| Image upload to Supabase Storage or S3? | Architecture | Open | Story 02.6 implementation |
| Maximum workspace limit per user (free tier)? | Product | Open | Defer to future billing epic |
| Should soft-deleted workspaces appear in list with status? | Product | Open | Currently: excluded from list |

---

## References

- **Tech Spec:** `/docs/archive/foundation-phase/sprint-artifacts/tech-spec-epic-02.md`
- **Epic File:** `/docs/epics/EPIC-02-workspace-management.md`
- **Architecture:** `/docs/architecture.md` (ADR-003 Multi-tenancy)
- **PRD:** `/docs/prd.md` (FR-2 Workspace Management)

---

_Story drafted: 2025-12-02_
_Ready for refinement and approval by SM_
