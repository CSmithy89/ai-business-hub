# Epic Technical Specification: RBAC & Multi-Tenancy

Date: 2025-12-02
Author: chris
Epic ID: EPIC-03
Status: Draft

---

## Overview

Epic 03 implements defense-in-depth Role-Based Access Control (RBAC) and multi-tenancy for the HYVVE platform. This epic establishes a hierarchical five-role permission system (Owner → Admin → Member → Viewer → Guest), enforces tenant isolation through both application-level (Prisma Client Extension) and database-level (PostgreSQL Row-Level Security) mechanisms, and creates reusable authorization guards for Next.js and NestJS.

This epic is **critical for security and compliance**. The defense-in-depth approach ensures that even if application code has bugs, the database RLS policies prevent cross-tenant data leakage. All subsequent features (approval queues, AI agents, module data) depend on these RBAC and tenant isolation primitives.

The permission system enables fine-grained control with module-level overrides, allowing workspace admins to grant elevated permissions for specific modules (e.g., "Member in workspace, but Admin in CRM module"). Audit logging captures all permission changes for security compliance and investigation.

## Objectives and Scope

### In Scope

- **Permission Matrix**: Centralized permission constants and role-to-permission mapping
- **NestJS Guards**: `AuthGuard`, `TenantGuard`, `RolesGuard` with decorators
- **Next.js Middleware**: `withAuth`, `withPermission`, `withTenant` higher-order functions
- **Prisma Tenant Extension**: Already implemented in Epic 00, to be integrated with tenant context
- **PostgreSQL RLS Policies**: Row-Level Security on all tenant-scoped tables
- **Module Permission Overrides**: JSON field support and validation logic
- **Audit Logging**: Permission change tracking to `audit_logs` table

### Out of Scope

- Custom role creation (Growth feature)
- Time-limited access grants (Growth feature)
- Permission templates (Growth feature)
- SAML/SSO integration (Enterprise feature)
- SCIM user provisioning (Enterprise feature)
- Audit log export for compliance (Growth feature)

## System Architecture Alignment

### Components Referenced

| Component | Purpose | Package |
|-----------|---------|---------|
| Permission Matrix | Centralized permissions | `packages/shared/src/permissions.ts` |
| NestJS Guards | Backend authorization | `apps/api/src/common/guards/` |
| Next.js Middleware | Platform API authorization | `apps/web/src/lib/middleware/` |
| Prisma Extension | Tenant query scoping | `packages/db/src/tenant-extension.ts` |
| RLS Policies | Database-level isolation | PostgreSQL migration |
| Audit Service | Permission change logging | `apps/api/src/audit/` |

### Architecture Constraints

- **ADR-003**: Defense-in-depth multi-tenancy with RLS + Prisma Extension
- **ADR-002**: Hybrid API - Next.js routes for platform, NestJS for modules
- JWT claims must include `workspaceId` for tenant context (already implemented in Epic 01/02)
- PgBouncer must use **session mode** (not transaction mode) to support RLS `current_setting()`
- All tenant-scoped tables require `workspace_id` column with index
- Permission checks must happen at both route handler and service layer

---

## Detailed Design

### Services and Modules

| Service | Responsibility | Location | Owner |
|---------|---------------|----------|-------|
| PermissionService | Role/permission checks, hierarchy validation | `packages/shared/src/permissions.ts` | Shared |
| AuthGuard (NestJS) | JWT validation, user extraction | `apps/api/src/common/guards/auth.guard.ts` | Backend |
| TenantGuard (NestJS) | Workspace context extraction, membership check | `apps/api/src/common/guards/tenant.guard.ts` | Backend |
| RolesGuard (NestJS) | Role requirement validation | `apps/api/src/common/guards/roles.guard.ts` | Backend |
| withAuth (Next.js) | Platform API authentication | `apps/web/src/lib/middleware/with-auth.ts` | Frontend |
| withPermission (Next.js) | Platform API authorization | `apps/web/src/lib/middleware/with-permission.ts` | Frontend |
| withTenant (Next.js) | Platform API tenant context | `apps/web/src/lib/middleware/with-tenant.ts` | Frontend |
| AuditService | Audit log creation | `apps/api/src/audit/audit.service.ts` | Backend |

### Data Models and Contracts

**New Prisma Model (packages/db/prisma/schema.prisma):**

```prisma
model AuditLog {
  id              String    @id @default(uuid())
  workspaceId     String    @map("workspace_id")

  // Event details
  action          String                    // 'role_changed', 'member_added', 'member_removed', 'permission_override_added'
  entityType      String    @map("entity_type")  // 'workspace_member', 'workspace', 'api_key'
  entityId        String    @map("entity_id")

  // Actor
  actorId         String    @map("actor_id")
  actorRole       String    @map("actor_role")

  // Changes
  changes         Json                      // { before: {...}, after: {...} }
  metadata        Json?                     // Additional context

  // Request context
  ipAddress       String?   @map("ip_address")
  userAgent       String?   @map("user_agent")

  createdAt       DateTime  @default(now()) @map("created_at")

  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, createdAt])
  @@index([actorId])
  @@index([entityType, entityId])
  @@map("audit_logs")
}
```

**Update to Workspace Model:**

```prisma
model Workspace {
  // ... existing fields ...
  auditLogs       AuditLog[]
}
```

**Permission Matrix (packages/shared/src/permissions.ts):**

```typescript
/**
 * Comprehensive permission system for HYVVE platform
 * Defines all permissions, role mappings, and validation logic
 */

export const PERMISSIONS = {
  // Workspace management
  WORKSPACE_READ: 'workspace:read',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',

  // Member management
  MEMBERS_VIEW: 'members:view',
  MEMBERS_INVITE: 'members:invite',
  MEMBERS_REMOVE: 'members:remove',
  MEMBERS_CHANGE_ROLE: 'members:change_role',

  // Record management (generic data entities)
  RECORDS_VIEW: 'records:view',
  RECORDS_CREATE: 'records:create',
  RECORDS_EDIT: 'records:edit',
  RECORDS_DELETE: 'records:delete',

  // Approval queue
  APPROVALS_VIEW: 'approvals:view',
  APPROVALS_APPROVE: 'approvals:approve',
  APPROVALS_REJECT: 'approvals:reject',

  // AI agent management
  AGENTS_VIEW: 'agents:view',
  AGENTS_CONFIGURE: 'agents:configure',
  AGENTS_RUN: 'agents:run',

  // API key management
  API_KEYS_VIEW: 'api_keys:view',
  API_KEYS_CREATE: 'api_keys:create',
  API_KEYS_REVOKE: 'api_keys:revoke',

  // Module permissions (for future modules)
  MODULE_VIEW: 'module:view',
  MODULE_ADMIN: 'module:admin',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

/**
 * Role hierarchy and permissions mapping
 */
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest'

/**
 * Role to permissions mapping
 * Each role inherits all permissions from roles below it
 */
export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    // Owners have ALL permissions
    ...Object.values(PERMISSIONS),
  ],

  admin: [
    // Workspace
    PERMISSIONS.WORKSPACE_READ,
    PERMISSIONS.WORKSPACE_UPDATE,

    // Members
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.MEMBERS_INVITE,
    PERMISSIONS.MEMBERS_REMOVE,
    PERMISSIONS.MEMBERS_CHANGE_ROLE, // Limited: cannot demote owner

    // Records
    PERMISSIONS.RECORDS_VIEW,
    PERMISSIONS.RECORDS_CREATE,
    PERMISSIONS.RECORDS_EDIT,
    PERMISSIONS.RECORDS_DELETE,

    // Approvals
    PERMISSIONS.APPROVALS_VIEW,
    PERMISSIONS.APPROVALS_APPROVE,
    PERMISSIONS.APPROVALS_REJECT,

    // Agents
    PERMISSIONS.AGENTS_VIEW,
    PERMISSIONS.AGENTS_CONFIGURE,
    PERMISSIONS.AGENTS_RUN,

    // API Keys
    PERMISSIONS.API_KEYS_VIEW,
    PERMISSIONS.API_KEYS_CREATE,
    PERMISSIONS.API_KEYS_REVOKE,
  ],

  member: [
    // Workspace
    PERMISSIONS.WORKSPACE_READ,

    // Members
    PERMISSIONS.MEMBERS_VIEW,

    // Records (own + assigned)
    PERMISSIONS.RECORDS_VIEW,
    PERMISSIONS.RECORDS_CREATE,
    PERMISSIONS.RECORDS_EDIT, // Own only

    // Approvals
    PERMISSIONS.APPROVALS_VIEW, // Own only

    // Agents
    PERMISSIONS.AGENTS_VIEW,
    PERMISSIONS.AGENTS_RUN,
  ],

  viewer: [
    // Workspace
    PERMISSIONS.WORKSPACE_READ,

    // Members
    PERMISSIONS.MEMBERS_VIEW,

    // Records (read-only)
    PERMISSIONS.RECORDS_VIEW,

    // Agents (view output only)
    PERMISSIONS.AGENTS_VIEW,
  ],

  guest: [
    // Limited read access
    PERMISSIONS.WORKSPACE_READ,
    PERMISSIONS.RECORDS_VIEW, // Very limited
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: WorkspaceRole): Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Check if role A can modify role B
 * Rules:
 * - Owner can modify anyone except themselves
 * - Admin can modify member/viewer/guest, but not owner or other admins
 * - Others cannot modify roles
 */
export function canChangeRole(actorRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  const roleLevel = {
    owner: 5,
    admin: 4,
    member: 3,
    viewer: 2,
    guest: 1,
  }

  // Owner can modify anyone except owners
  if (actorRole === 'owner' && targetRole !== 'owner') {
    return true
  }

  // Admin can modify roles below admin
  if (actorRole === 'admin' && roleLevel[targetRole] < roleLevel.admin) {
    return true
  }

  return false
}

/**
 * Check if role A can remove role B
 * Same rules as canChangeRole
 */
export function canRemoveMember(actorRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  return canChangeRole(actorRole, targetRole)
}

/**
 * Module permission override structure
 * Stored in WorkspaceMember.modulePermissions JSON field
 */
export interface ModulePermissionOverride {
  // Either elevate role for entire module
  role?: 'admin' | 'member' | 'viewer'

  // Or grant specific permissions
  permissions?: Permission[]
}

export type ModulePermissions = Record<string, ModulePermissionOverride>

/**
 * Check if user has permission with module overrides
 */
export function hasModulePermission(
  baseRole: WorkspaceRole,
  moduleId: string,
  permission: Permission,
  modulePermissions?: ModulePermissions | null
): boolean {
  // Check base role permission first
  const hasBase = hasPermission(baseRole, permission)

  // If no overrides, return base check
  if (!modulePermissions || !modulePermissions[moduleId]) {
    return hasBase
  }

  const override = modulePermissions[moduleId]

  // If override has role elevation
  if (override.role) {
    return hasPermission(override.role, permission)
  }

  // If override has specific permissions
  if (override.permissions) {
    return override.permissions.includes(permission)
  }

  return hasBase
}
```

### APIs and Interfaces

**NestJS Guard Usage:**

```typescript
// apps/api/src/approvals/approvals.controller.ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../common/guards/auth.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Public } from '../common/decorators/public.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../common/decorators/current-workspace.decorator'

@Controller('approvals')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class ApprovalsController {

  @Get()
  @Roles('admin', 'owner')
  async listApprovals(
    @CurrentUser() user: User,
    @CurrentWorkspace() workspaceId: string
  ) {
    // AuthGuard validates JWT and extracts user
    // TenantGuard validates workspace membership and extracts workspaceId
    // RolesGuard checks user has admin or owner role
    return this.approvalsService.list(workspaceId)
  }

  @Post(':id/approve')
  @Roles('admin', 'owner')
  async approve(@Param('id') id: string) {
    // Protected by role guards
    return this.approvalsService.approve(id)
  }
}
```

**Next.js Route Handler Usage:**

```typescript
// apps/web/src/app/api/workspaces/[id]/members/route.ts
import { withAuth } from '@/lib/middleware/with-auth'
import { withTenant } from '@/lib/middleware/with-tenant'
import { withPermission } from '@/lib/middleware/with-permission'
import { PERMISSIONS } from '@hyvve/shared'

export const GET = withAuth(
  withTenant(async (req, { user, workspace }) => {
    // User authenticated and workspace validated
    const members = await db.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      include: { user: true },
    })

    return NextResponse.json({ data: members })
  })
)

export const POST = withAuth(
  withTenant(
    withPermission([PERMISSIONS.MEMBERS_INVITE], async (req, { user, workspace }) => {
      // User has MEMBERS_INVITE permission
      const body = await req.json()
      const invitation = await invitationService.create(workspace.id, body, user.id)

      return NextResponse.json({ data: invitation }, { status: 201 })
    })
  )
)
```

**Audit Logging API:**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/audit-logs` | List audit logs for workspace | Owner/Admin |
| GET | `/api/audit-logs?action=role_changed` | Filter by action type | Owner/Admin |
| GET | `/api/audit-logs?actorId={userId}` | Filter by actor | Owner/Admin |

### Workflows and Sequencing

**Permission Check Flow:**

```
Request → AuthGuard/withAuth
  ├─ Validate JWT token
  ├─ Extract user from token
  └─ Attach to request context

  → TenantGuard/withTenant
    ├─ Extract workspaceId from token/params
    ├─ Verify user is workspace member
    ├─ Load member role
    └─ Attach workspace context

    → RolesGuard/withPermission
      ├─ Check required roles/permissions
      ├─ Check module overrides (if applicable)
      └─ Allow/Deny request

      → Route Handler
        ├─ Business logic executes
        └─ Prisma queries auto-scoped by tenant extension
```

**Tenant Extension Integration:**

```typescript
// apps/api/src/common/interceptors/tenant-context.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { tenantContext } from '@hyvve/db'

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest()
    const workspaceId = request.workspaceId // Set by TenantGuard

    if (!workspaceId) {
      throw new Error('Workspace context required')
    }

    // Run handler within tenant context
    return tenantContext.run({ tenantId: workspaceId }, () => next.handle())
  }
}
```

**RLS Policy Activation:**

```sql
-- Migration: Enable RLS on tenant tables
ALTER TABLE approval_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy (same pattern for all tables)
CREATE POLICY tenant_isolation ON approval_items
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));

-- Platform admin bypass role (for maintenance operations)
CREATE ROLE platform_admin;
GRANT BYPASSRLS ON ALL TABLES IN SCHEMA public TO platform_admin;
```

**Connection Configuration for RLS:**

```typescript
// packages/db/src/index.ts
import { PrismaClient } from '@prisma/client'
import { createTenantPrismaClient } from './tenant-extension'

// For operations requiring RLS context setting
export async function withRLSContext<T>(
  workspaceId: string,
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = new PrismaClient()

  try {
    // Set RLS context variable
    await prisma.$executeRaw`SET LOCAL app.tenant_id = ${workspaceId}`

    // Execute operation
    return await operation(prisma)
  } finally {
    await prisma.$disconnect()
  }
}
```

**Module Permission Override Usage:**

```typescript
// Check permission with module context
import { hasModulePermission, PERMISSIONS } from '@hyvve/shared'

async function canUserAccessCRMModule(userId: string, workspaceId: string): Promise<boolean> {
  const member = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  })

  if (!member) return false

  // Check if user has MODULE_ADMIN permission in bm-crm module
  return hasModulePermission(
    member.role,
    'bm-crm',
    PERMISSIONS.MODULE_ADMIN,
    member.modulePermissions as ModulePermissions
  )
}
```

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Permission check (cached) | < 5ms | In-memory lookup |
| Permission check (uncached) | < 50ms | Database query + cache write |
| RLS policy overhead | < 10ms | Query plan analysis |
| Tenant context setup | < 2ms | AsyncLocalStorage overhead |
| Audit log write | < 100ms | Async, non-blocking |

### Security

| Requirement | Implementation | Reference |
|-------------|---------------|-----------|
| Defense-in-depth | RLS + Prisma Extension + Guards | ADR-003 |
| Role hierarchy enforcement | Both frontend and backend validation | Security best practice |
| Audit trail immutability | INSERT-only table, no UPDATE/DELETE | Compliance requirement |
| Tenant isolation | Automatic at Prisma and PostgreSQL levels | NFR-S8 |
| Module override validation | Zod schema validation on JSON field | NFR-S6 |

**Security Testing Requirements:**

- Test cross-tenant access blocked (RLS)
- Test privilege escalation blocked (role validation)
- Test module override abuse (invalid permission grants)
- Test audit log tampering (insert-only enforcement)
- Test concurrent role changes (race conditions)

### Reliability/Availability

- Guards must fail closed (deny on error)
- RLS policies must remain active even if app layer bypassed
- Audit logging must not block primary operations
- Permission cache invalidation on role changes
- Graceful degradation if audit service unavailable

### Observability

| Signal | Type | Purpose |
|--------|------|---------|
| `rbac.permission.denied` | Metric | Track authorization failures |
| `rbac.permission.check` | Metric | Monitor permission check volume |
| `rbac.module_override.applied` | Event | Module permission usage |
| `audit.log.created` | Event | Audit event tracking |
| `tenant.isolation.breach.attempt` | Alert | Security monitoring |

---

## Dependencies and Integrations

### npm Dependencies (No New Dependencies)

All required dependencies already installed in Epic 00-02:
- `@prisma/client` - Database access
- `zod` - Validation
- `@nestjs/common` - Guards and decorators
- `async_hooks` - AsyncLocalStorage (Node.js built-in)

### Database Migration

```prisma
// packages/db/prisma/migrations/XXXXXX_add_audit_logs/migration.sql

-- Create audit_logs table
CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "actor_role" TEXT NOT NULL,
  "changes" JSONB NOT NULL,
  "metadata" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for audit queries
CREATE INDEX "audit_logs_workspace_id_created_at_idx"
  ON "audit_logs"("workspace_id", "created_at");
CREATE INDEX "audit_logs_actor_id_idx"
  ON "audit_logs"("actor_id");
CREATE INDEX "audit_logs_entity_type_entity_id_idx"
  ON "audit_logs"("entity_type", "entity_id");

-- Enable RLS on audit_logs
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "audit_logs"
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));
```

### Epic Dependencies

- **Epic 00** (Complete): Prisma database package, tenant extension pattern
- **Epic 01** (Complete): Authentication, JWT tokens with user context
- **Epic 02** (Complete): Workspace management, member roles

---

## Acceptance Criteria (Authoritative)

### AC-03.1: Permission Matrix

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-03.1.1 | Permission constants defined | Given permission matrix, when importing, then all PERMISSIONS constants are available |
| AC-03.1.2 | Role permissions mapped | Given role, when calling getPermissions(), then correct permission array returned |
| AC-03.1.3 | hasPermission works | Given role and permission, when calling hasPermission(), then correct boolean returned |
| AC-03.1.4 | Role hierarchy enforced | Given admin role, when checking owner permission, then returns false |
| AC-03.1.5 | Module overrides work | Given member with CRM admin override, when checking CRM permission, then returns true |

### AC-03.2: NestJS Guards

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-03.2.1 | AuthGuard validates JWT | Given invalid JWT, when calling protected endpoint, then 401 Unauthorized |
| AC-03.2.2 | TenantGuard extracts workspace | Given valid JWT with workspaceId, when calling endpoint, then workspace context available |
| AC-03.2.3 | TenantGuard validates membership | Given user not in workspace, when calling endpoint, then 403 Forbidden |
| AC-03.2.4 | RolesGuard checks roles | Given member role accessing admin endpoint, when calling, then 403 Forbidden |
| AC-03.2.5 | @Roles decorator works | Given @Roles('owner') decorator, when non-owner calls, then denied |
| AC-03.2.6 | @Public decorator works | Given @Public() decorator, when unauthenticated call, then allowed |

### AC-03.3: Next.js Middleware

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-03.3.1 | withAuth validates session | Given no session, when calling route, then 401 Unauthorized |
| AC-03.3.2 | withTenant validates membership | Given user not in workspace, when calling, then 403 Forbidden |
| AC-03.3.3 | withPermission checks permissions | Given viewer calling members:invite endpoint, then 403 Forbidden |
| AC-03.3.4 | Middleware composition works | Given withAuth(withTenant(handler)), when calling, then both checks applied |
| AC-03.3.5 | User/workspace context passed | Given authenticated request, when in handler, then user and workspace available |

### AC-03.4: Prisma Tenant Extension

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-03.4.1 | Tenant context required | Given no tenant context, when querying, then error thrown |
| AC-03.4.2 | Reads auto-filtered | Given workspace A context, when querying approvals, then only workspace A approvals returned |
| AC-03.4.3 | Creates auto-scoped | Given workspace B context, when creating approval, then workspaceId set to B |
| AC-03.4.4 | Updates auto-scoped | Given workspace A context, when updating workspace B approval, then no rows affected |
| AC-03.4.5 | Non-tenant tables skipped | Given User query, when executed, then no tenant filter applied |

### AC-03.5: PostgreSQL RLS Policies

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-03.5.1 | RLS enabled | Given tenant tables, when checking pg_policies, then RLS enabled |
| AC-03.5.2 | Tenant isolation works | Given connection with app.tenant_id=A, when querying workspace B data, then no rows returned |
| AC-03.5.3 | Platform admin bypass | Given platform_admin role, when querying, then all tenants visible |
| AC-03.5.4 | RLS blocks direct SQL | Given psql connection, when querying without setting tenant_id, then no rows returned |

### AC-03.6: Module Permission Overrides

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-03.6.1 | Override JSON validated | Given invalid override structure, when saving, then validation error |
| AC-03.6.2 | Role elevation works | Given member with CRM admin override, when checking CRM:admin permission, then true |
| AC-03.6.3 | Specific permissions work | Given member with ['records:view'] override, when checking, then only that permission granted |
| AC-03.6.4 | Base role still checked | Given override without records:create, when checking that permission, then base role used |

### AC-03.7: Audit Logging

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-03.7.1 | Role changes logged | Given admin changes member role, when completed, then audit log created |
| AC-03.7.2 | Member addition logged | Given admin invites member, when accepted, then audit log created |
| AC-03.7.3 | Member removal logged | Given owner removes member, when deleted, then audit log created |
| AC-03.7.4 | Before/after captured | Given role change, when checking audit log, then changes field shows both values |
| AC-03.7.5 | Actor recorded | Given admin makes change, when checking log, then actorId and actorRole set |
| AC-03.7.6 | IP and user agent captured | Given request, when logged, then ipAddress and userAgent saved |

---

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Approach |
|----|--------------|--------------|---------------|
| AC-03.1.x | Permission Matrix | `packages/shared/src/permissions.ts` | Unit: permission lookups, role checks |
| AC-03.2.x | NestJS Guards | `apps/api/src/common/guards/*.ts` | Integration: mock requests with different tokens |
| AC-03.3.x | Next.js Middleware | `apps/web/src/lib/middleware/*.ts` | Integration: API route tests with session |
| AC-03.4.x | Prisma Extension | `packages/db/src/tenant-extension.ts` | Integration: database queries with context |
| AC-03.5.x | RLS Policies | PostgreSQL migration | Database: direct SQL queries |
| AC-03.6.x | Module Overrides | Permission functions, DB JSON field | Integration: role checks with overrides |
| AC-03.7.x | Audit Logging | `apps/api/src/audit/audit.service.ts` | Integration: trigger events, verify logs |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| RLS performance overhead on complex queries | Medium | Index optimization, query plan analysis, benchmark tests |
| AsyncLocalStorage context loss in async operations | High | Comprehensive testing of async flows, proper context propagation |
| Module override abuse (privilege escalation) | High | Strict validation, audit logging, UI warnings on overrides |
| PgBouncer session mode scalability | Medium | Monitor connection pool, document scaling recommendations |
| Race condition in concurrent role changes | Medium | Database transactions, optimistic locking |

### Assumptions

- PgBouncer configured in session mode (required for RLS)
- PostgreSQL 12+ available (RLS and current_setting support)
- JWT claims already include `workspaceId` (implemented in Epic 01/02)
- All tenant-scoped tables have `workspace_id` column
- better-auth session context accessible in both Next.js and NestJS

### Open Questions

| Question | Owner | Resolution Deadline |
|----------|-------|---------------------|
| Should module overrides have expiration dates? | Product | Story 03.6 |
| Audit log retention policy (how long to keep)? | Compliance | Story 03.7 |
| Should we expose audit logs in UI or API-only? | Product | Story 03.7 |
| RLS or Prisma Extension for primary defense? | Architecture | Story 03.4 |

---

## Test Strategy Summary

### Test Levels

| Level | Scope | Tools | Coverage |
|-------|-------|-------|----------|
| Unit | Permission functions, role hierarchy | Vitest | 100% of permission logic |
| Integration | Guards, middleware, audit service | Vitest + test database | All authorization paths |
| Database | RLS policies, tenant isolation | Raw SQL + Vitest | All tenant tables |
| E2E | Full authorization flows | Playwright | Critical permission scenarios |

### Test Data

- Seed workspaces with different member roles
- Seed members with module permission overrides
- Seed audit logs for query testing
- Mock JWT tokens with various claims

### Coverage Targets

- Unit tests: 100% of permission utility functions
- Integration tests: All guard/middleware combinations
- Database tests: All RLS policies verified
- E2E tests: Owner/Admin/Member/Viewer/Guest flows

### Edge Cases to Test

- Concurrent role changes for same user
- Role change to same value (idempotent)
- Module override with invalid module ID
- Tenant context switching mid-request
- RLS policy with NULL workspace_id
- Owner attempting to demote themselves
- Admin attempting to grant owner role
- Audit log creation failure (graceful degradation)
- Direct database access bypassing app layer

---

## Story-by-Story Implementation Guide

### Story 03.1: Implement Permission Matrix

**Key Files:**
- `packages/shared/src/permissions.ts` - Permission definitions, role mappings, utility functions

**Implementation Notes:**
- Define all PERMISSIONS as const object
- Create ROLE_PERMISSIONS mapping for each role
- Implement hasPermission, getPermissions, canChangeRole, canRemoveMember
- Implement hasModulePermission with override logic
- Export ModulePermissions type
- Add comprehensive JSDoc comments

**Testing:**
- Unit test all permission check functions
- Test role hierarchy (admin cannot access owner permissions)
- Test module override logic (elevation and specific permissions)
- Test edge cases (undefined role, invalid permission)

**Integration:**
- Export from `packages/shared/src/index.ts`
- Verify importable in both `apps/web` and `apps/api`

---

### Story 03.2: Create Auth Guards for NestJS

**Key Files:**
- `apps/api/src/common/guards/auth.guard.ts` - JWT validation guard
- `apps/api/src/common/guards/tenant.guard.ts` - Workspace context guard
- `apps/api/src/common/guards/roles.guard.ts` - Role requirement guard
- `apps/api/src/common/decorators/roles.decorator.ts` - @Roles() decorator
- `apps/api/src/common/decorators/public.decorator.ts` - @Public() decorator
- `apps/api/src/common/decorators/current-user.decorator.ts` - @CurrentUser() decorator
- `apps/api/src/common/decorators/current-workspace.decorator.ts` - @CurrentWorkspace() decorator

**Implementation Notes:**

**AuthGuard:**
```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check @Public() decorator
    const isPublic = this.reflector.getAllAndOverride('isPublic', [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const token = this.extractToken(request)
    if (!token) throw new UnauthorizedException()

    // Verify JWT with better-auth
    const user = await this.verifyToken(token)
    request.user = user

    return true
  }
}
```

**TenantGuard:**
```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user // Set by AuthGuard

    // Extract workspace from params, body, or token
    const workspaceId = request.params.workspaceId || user.workspaceId
    if (!workspaceId) throw new BadRequestException('Workspace context required')

    // Verify membership
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
    })

    if (!member) throw new ForbiddenException('Not a workspace member')

    request.workspaceId = workspaceId
    request.memberRole = member.role
    request.modulePermissions = member.modulePermissions

    return true
  }
}
```

**RolesGuard:**
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<WorkspaceRole[]>('roles', context.getHandler())
    if (!requiredRoles) return true

    const request = context.switchToHttp().getRequest()
    const memberRole = request.memberRole // Set by TenantGuard

    return requiredRoles.includes(memberRole)
  }
}
```

**Testing:**
- Integration test each guard with mock requests
- Test guard combination (AuthGuard + TenantGuard + RolesGuard)
- Test @Public() bypass
- Test missing token (401)
- Test invalid workspace (403)
- Test insufficient role (403)

---

### Story 03.3: Create Permission Middleware for Next.js

**Key Files:**
- `apps/web/src/lib/middleware/with-auth.ts` - Authentication wrapper
- `apps/web/src/lib/middleware/with-tenant.ts` - Tenant context wrapper
- `apps/web/src/lib/middleware/with-permission.ts` - Permission wrapper

**Implementation Notes:**

**withAuth:**
```typescript
export function withAuth<T>(
  handler: (req: NextRequest, context: { user: User }) => Promise<T>
) {
  return async (req: NextRequest, ...args: any[]) => {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(req, { user: session.user }, ...args)
  }
}
```

**withTenant:**
```typescript
export function withTenant<T>(
  handler: (req: NextRequest, context: { user: User; workspace: Workspace }) => Promise<T>
) {
  return async (req: NextRequest, context: { user: User }, ...args: any[]) => {
    // Extract workspace from URL or session
    const workspaceId = extractWorkspaceId(req)

    // Verify membership
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: context.user.id, workspaceId } },
      include: { workspace: true },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Not a workspace member' },
        { status: 403 }
      )
    }

    return handler(req, { ...context, workspace: member.workspace }, ...args)
  }
}
```

**withPermission:**
```typescript
export function withPermission<T>(
  permissions: Permission[],
  handler: (req: NextRequest, context: any) => Promise<T>
) {
  return async (req: NextRequest, context: any, ...args: any[]) => {
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: context.user.id, workspaceId: context.workspace.id } },
    })

    const hasRequiredPermission = permissions.some(p =>
      hasPermission(member.role, p)
    )

    if (!hasRequiredPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return handler(req, context, ...args)
  }
}
```

**Testing:**
- Integration test each middleware with mock requests
- Test middleware composition
- Test with missing session (401)
- Test with invalid workspace (403)
- Test with insufficient permissions (403)

---

### Story 03.4: Implement Prisma Tenant Extension

**Key Files:**
- `packages/db/src/tenant-extension.ts` - Already implemented, integration needed
- `apps/api/src/common/interceptors/tenant-context.interceptor.ts` - NestJS integration
- `apps/web/src/lib/db.ts` - Next.js integration

**Implementation Notes:**

The Prisma Tenant Extension was already implemented in Epic 00. This story focuses on **integrating** it with the authentication guards.

**NestJS Integration:**
```typescript
// apps/api/src/common/interceptors/tenant-context.interceptor.ts
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest()
    const workspaceId = request.workspaceId // Set by TenantGuard

    if (!workspaceId) {
      throw new InternalServerErrorException('Workspace context missing')
    }

    // Run handler within tenant context (AsyncLocalStorage)
    return tenantContext.run({ tenantId: workspaceId }, () => next.handle())
  }
}

// Apply globally in main.ts
app.useGlobalInterceptors(new TenantContextInterceptor())
```

**Next.js Integration:**
```typescript
// apps/web/src/lib/db.ts
import { tenantContext, createTenantPrismaClient } from '@hyvve/db'

export async function withTenantDb<T>(
  workspaceId: string,
  operation: () => Promise<T>
): Promise<T> {
  return tenantContext.run({ tenantId: workspaceId }, operation)
}
```

**Testing:**
- Test that queries are auto-filtered by workspace
- Test that creates are auto-scoped to workspace
- Test that updates/deletes only affect workspace data
- Test cross-tenant access blocked
- Test non-tenant tables (User, Workspace) unaffected

---

### Story 03.5: Create PostgreSQL RLS Policies

**Key Files:**
- `packages/db/prisma/migrations/XXXXXX_enable_rls/migration.sql` - RLS migration

**Implementation Notes:**

Create migration for all tenant-scoped tables:
- `approval_items`
- `ai_provider_configs`
- `token_usage`
- `api_keys`
- `audit_logs`
- `notifications` (future)

**Migration Template:**
```sql
-- Enable RLS on table
ALTER TABLE "approval_items" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation ON "approval_items"
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));

-- Repeat for all tables...

-- Create platform admin bypass role
CREATE ROLE platform_admin;
GRANT BYPASSRLS ON ALL TABLES IN SCHEMA public TO platform_admin;
```

**Testing:**
- Use direct PostgreSQL client
- Set `app.tenant_id` session variable
- Query tables and verify isolation
- Test without setting variable (should return no rows)
- Test with platform_admin role (should bypass RLS)

**Important:** Document that PgBouncer must use **session mode** (not transaction mode) for RLS to work.

---

### Story 03.6: Implement Module-Level Permission Overrides

**Key Files:**
- `packages/shared/src/permissions.ts` - hasModulePermission function (already done in 03.1)
- `apps/web/src/app/api/workspaces/[id]/members/[userId]/route.ts` - Update member endpoint
- `apps/web/src/components/settings/member-permissions-dialog.tsx` - UI component

**Implementation Notes:**

**API Endpoint:**
```typescript
// PATCH /api/workspaces/:id/members/:userId
export const PATCH = withAuth(
  withTenant(
    withPermission([PERMISSIONS.MEMBERS_CHANGE_ROLE], async (req, { workspace }) => {
      const { userId } = req.params
      const { role, modulePermissions } = await req.json()

      // Validate module permissions structure
      if (modulePermissions) {
        validateModulePermissions(modulePermissions)
      }

      const updated = await prisma.workspaceMember.update({
        where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
        data: { role, modulePermissions },
      })

      // Audit log
      await auditService.log({
        workspaceId: workspace.id,
        action: 'module_permissions_updated',
        entityType: 'workspace_member',
        entityId: updated.id,
        changes: { before: {}, after: { modulePermissions } },
      })

      return NextResponse.json({ data: updated })
    })
  )
)
```

**Validation:**
```typescript
function validateModulePermissions(overrides: unknown): ModulePermissions {
  const schema = z.record(
    z.string(), // module ID
    z.object({
      role: z.enum(['admin', 'member', 'viewer']).optional(),
      permissions: z.array(z.string()).optional(),
    })
  )

  return schema.parse(overrides)
}
```

**Testing:**
- Test valid override structures
- Test invalid structures (validation error)
- Test permission checks with overrides
- Test UI for granting/revoking overrides

---

### Story 03.7: Create Audit Logging for Permission Changes

**Key Files:**
- `apps/api/src/audit/audit.module.ts` - Audit module
- `apps/api/src/audit/audit.service.ts` - Audit logging service
- `apps/api/src/audit/audit.controller.ts` - Audit log API
- `packages/db/prisma/migrations/XXXXXX_add_audit_logs/migration.sql` - Audit table migration

**Implementation Notes:**

**Audit Service:**
```typescript
@Injectable()
export class AuditService {
  async log(params: {
    workspaceId: string
    action: string
    entityType: string
    entityId: string
    actorId: string
    actorRole: string
    changes: { before: any; after: any }
    metadata?: any
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data: params })
    } catch (error) {
      // Non-blocking: log error but don't fail request
      this.logger.error('Failed to create audit log', error)
    }
  }

  async query(workspaceId: string, filters: AuditQueryFilters) {
    return this.prisma.auditLog.findMany({
      where: {
        workspaceId,
        action: filters.action,
        actorId: filters.actorId,
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    })
  }
}
```

**Integration Points:**
- Call `auditService.log()` in:
  - Member role change endpoint
  - Member invitation acceptance
  - Member removal
  - Module permission override changes

**Testing:**
- Test audit log creation on role changes
- Test query with filters (action, actor, date range)
- Test graceful failure (audit error doesn't block operation)
- Test RLS on audit_logs table

---

## Integration Testing Strategy

After all stories are complete, perform integration testing:

1. **End-to-End Authorization Flow:**
   - Create workspace with owner
   - Invite members with different roles
   - Test each role accessing various endpoints
   - Verify 403 errors where expected

2. **Cross-Tenant Isolation Test:**
   - Create two workspaces A and B
   - Add same user to both
   - Switch between workspaces
   - Verify data isolation (cannot access B data from A context)

3. **Module Override Test:**
   - Create member in workspace
   - Grant CRM admin override
   - Verify elevated permissions in CRM context only

4. **Audit Trail Test:**
   - Perform permission changes
   - Query audit logs
   - Verify all changes captured with before/after

5. **RLS Bypass Test:**
   - Directly query PostgreSQL
   - Attempt to bypass application layer
   - Verify RLS blocks unauthorized access

---

## Performance Benchmarking

After implementation, benchmark:

- Permission check latency (cached vs uncached)
- Guard overhead per request
- Tenant context setup time
- RLS query plan overhead
- Audit log write latency

Target: < 50ms overhead for full authorization stack.

---

_This tech spec provides comprehensive guidance for implementing Epic 03: RBAC & Multi-Tenancy with defense-in-depth security, following patterns established in Epic 00-02._
