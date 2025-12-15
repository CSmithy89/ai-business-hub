# Epic 03: RBAC & Multi-Tenancy

**Epic ID:** EPIC-03
**Status:** Ready for Development
**Priority:** P0 - Critical
**Phase:** Phase 2 - RBAC & Multi-tenancy

---

## Epic Overview

Implement Role-Based Access Control with hierarchical permissions and defense-in-depth multi-tenancy through RLS + Prisma Client Extensions.

### Business Value
Secure data isolation between tenants and granular permission control ensure enterprise-grade security while maintaining usability.

### Success Criteria
- [ ] Five-role hierarchy enforced (Owner → Admin → Member → Viewer → Guest)
- [ ] RLS policies active on all tenant tables
- [ ] Prisma Client Extension auto-scopes all queries
- [ ] Permission checks on all API endpoints
- [ ] No cross-tenant data leakage

---

## Stories

### Story 03.1: Implement Permission Matrix

**Points:** 3
**Priority:** P0

**As a** developer
**I want** a centralized permission system
**So that** I can consistently check access across the app

**Acceptance Criteria:**
- [ ] Create `packages/shared/src/permissions.ts`
- [ ] Define all permissions as constants
- [ ] Create role-to-permission mapping
- [ ] Create `hasPermission(role, permission)` function
- [ ] Create `getPermissions(role)` function
- [ ] Export from shared package

**Permission Categories:**
```typescript
const PERMISSIONS = {
  WORKSPACE: ['read', 'update', 'delete'],
  MEMBERS: ['view', 'invite', 'remove', 'change_role'],
  RECORDS: ['view', 'create', 'edit', 'delete'],
  APPROVALS: ['view', 'approve', 'reject'],
  AGENTS: ['view', 'configure', 'run'],
  API_KEYS: ['view', 'create', 'revoke'],
}
```

---

### Story 03.2: Create Auth Guards for NestJS

**Points:** 2
**Priority:** P0

**As a** developer
**I want** reusable auth guards for NestJS
**So that** I can protect endpoints consistently

**Acceptance Criteria:**
- [ ] Create `AuthGuard` - Validates JWT token
- [ ] Create `TenantGuard` - Extracts and validates tenant context
- [ ] Create `RolesGuard` - Checks user role permissions
- [ ] Create `@Roles()` decorator for required roles
- [ ] Create `@Public()` decorator for public endpoints
- [ ] Apply guards globally with exceptions

**Usage:**
```typescript
@Controller('approvals')
@UseGuards(AuthGuard, TenantGuard)
export class ApprovalsController {
  @Roles('admin', 'owner')
  @Post(':id/approve')
  approve() { ... }
}
```

---

### Story 03.3: Create Permission Middleware for Next.js

**Points:** 2
**Priority:** P0

**As a** developer
**I want** permission middleware for Next.js API routes
**So that** platform endpoints are protected

**Acceptance Criteria:**
- [ ] Create `withAuth` higher-order function
- [ ] Create `withPermission` for role checks
- [ ] Create `withTenant` for tenant context
- [ ] Integrate with better-auth session
- [ ] Return appropriate HTTP errors (401, 403)

**Usage:**
```typescript
export const PATCH = withAuth(withPermission(['admin', 'owner'], 
  async (req, { user, workspace }) => {
    // Protected handler
  }
));
```

---

### Story 03.4: Implement Prisma Tenant Extension

**Points:** 3
**Priority:** P0

**As a** developer
**I want** automatic tenant scoping on all queries
**So that** data isolation is enforced at the ORM level

**Acceptance Criteria:**
- [ ] Create `packages/db/src/tenant-extension.ts`
- [ ] Use AsyncLocalStorage for tenant context
- [ ] Auto-filter reads by `workspaceId`
- [ ] Auto-inject `workspaceId` on creates
- [ ] Auto-filter updates/deletes by `workspaceId`
- [ ] Skip filtering for global tables (User, Session, etc.)
- [ ] Export `createTenantPrismaClient()` function

**Implementation:**
```typescript
import { AsyncLocalStorage } from 'async_hooks'
export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>()

export function createTenantPrismaClient() {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const context = tenantContext.getStore()
          // Apply tenant filtering...
          return query(args)
        },
      },
    },
  })
}
```

---

### Story 03.5: Create PostgreSQL RLS Policies

**Points:** 3
**Priority:** P0

**As a** developer
**I want** database-level row security
**So that** data is protected even if application code has bugs

**Acceptance Criteria:**
- [ ] Create migration for RLS policies
- [ ] Enable RLS on tenant tables:
  - `approval_items`
  - `ai_provider_configs`
  - `token_usage`
  - `api_keys`
  - `event_logs`
  - `audit_logs`
  - `notifications`
- [ ] Create tenant isolation policies
- [ ] Create `platform_admin` bypass role
- [ ] Configure connection to set `app.tenant_id`
- [ ] Test policies with different roles

**SQL Policy:**
```sql
ALTER TABLE approval_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON approval_items
  FOR ALL
  USING (workspace_id = current_setting('app.tenant_id', true)::uuid);
```

---

### Story 03.6: Implement Module-Level Permission Overrides

**Points:** 2
**Priority:** P1

**As a** workspace admin
**I want** to grant specific module permissions
**So that** I can give targeted access to team members

**Acceptance Criteria:**
- [ ] Add `modulePermissions` JSON field handling
- [ ] Create UI for module permission assignment
- [ ] Check module permissions in guards
- [ ] Allow elevation and restriction per module
- [ ] Document permission override precedence

**Override Schema:**
```typescript
modulePermissions: {
  "bm-crm": { role: "admin" },
  "bmc": { permissions: ["view", "create"] }
}
```

---

### Story 03.7: Create Audit Logging for Permission Changes

**Points:** 2
**Priority:** P1

**As a** security administrator
**I want** all permission changes logged
**So that** I can audit access control modifications

**Acceptance Criteria:**
- [ ] Log role changes to `audit_logs`
- [ ] Log member additions/removals
- [ ] Log permission override changes
- [ ] Include before/after values
- [ ] Include actor (who made the change)
- [ ] Create audit log viewer in settings

---

## Dependencies

- Epic 00: Project Scaffolding
- Epic 01: Authentication
- Epic 02: Workspace Management

## Technical Notes

### Role Hierarchy
```
Platform Admin (internal only)
         ↓
       Owner → Admin → Member → Viewer → Guest
         ↓
    Module Overrides (optional)
```

### Non-Tenant Tables (Skip RLS/Extension)
- User
- Session
- Account
- VerificationToken
- Workspace (uses owner check instead)

---

_Epic created: 2025-11-30_
_PRD Reference: Multi-Tenancy Architecture, Permissions & Roles_
