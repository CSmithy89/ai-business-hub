# RBAC Specification Research

**Status:** Complete
**Date:** 2025-11-30
**Researcher:** Winston (Architect), Mary (Analyst)

---

## Executive Summary

After analyzing Clerk's organization-based RBAC, Twenty CRM's workspace member roles, and common SaaS patterns, we recommend a **three-tier hierarchical RBAC system** with organization-level roles, workspace-level roles, and optional module-level permissions.

---

## 1. Role Hierarchy Design

### 1.1 Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLATFORM LEVEL                                │
│              (Platform Admin - Internal Only)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   WORKSPACE LEVEL                            ││
│  │        (Owner, Admin, Member, Viewer, Guest)                ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                               ││
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   ││
│  │  │  BM-CRM   │ │   BMC     │ │   BMX     │ │   BMS     │   ││
│  │  │ Module    │ │ Module    │ │ Module    │ │ Module    │   ││
│  │  │Permissions│ │Permissions│ │Permissions│ │Permissions│   ││
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘   ││
│  │                                                               ││
│  │            MODULE LEVEL (Optional Overrides)                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Role Definitions

#### Platform Level (Internal)

| Role | Description | Scope |
|------|-------------|-------|
| **Platform Admin** | HYVVE staff with full system access | All workspaces, system config |
| **Support Agent** | Customer support with read access | View any workspace (support cases) |

#### Workspace Level (Per Tenant)

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Owner** | Workspace creator, billing owner | Full access, billing, delete workspace |
| **Admin** | Delegated administrator | Manage members, settings, all modules |
| **Member** | Standard team member | Use modules, create/edit own content |
| **Viewer** | Read-only access | View dashboards, reports, content |
| **Guest** | Limited external collaborator | Specific module access only |

### 1.3 Permission Inheritance

```
Owner → Admin → Member → Viewer → Guest
  ↓       ↓        ↓        ↓        ↓
  All   Manage   Create   Read    Limited
        + All    + Edit   Only    Read
```

**Inheritance Rules:**
- Higher roles inherit all permissions from lower roles
- Owner can do everything Admin can do, plus billing
- Admin can do everything Member can do, plus manage users
- etc.

---

## 2. Permission Matrix

### 2.1 Core Platform Resources

| Resource | Owner | Admin | Member | Viewer | Guest |
|----------|-------|-------|--------|--------|-------|
| **Workspace Settings** | ✓ Full | ✓ Edit | ✗ | ✗ | ✗ |
| **Billing & Subscription** | ✓ Full | ✗ | ✗ | ✗ | ✗ |
| **Invite Members** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Remove Members** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Change Member Roles** | ✓ | ✓ (not Owner) | ✗ | ✗ | ✗ |
| **API Keys** | ✓ Create | ✓ View | ✗ | ✗ | ✗ |
| **Webhooks** | ✓ Full | ✓ Full | ✗ | ✗ | ✗ |
| **BYOAI Configuration** | ✓ Full | ✓ Edit | ✗ | ✗ | ✗ |
| **Delete Workspace** | ✓ | ✗ | ✗ | ✗ | ✗ |

### 2.2 Module Resources (Default)

| Action | Owner | Admin | Member | Viewer | Guest |
|--------|-------|-------|--------|--------|-------|
| **View Records** | ✓ | ✓ | ✓ | ✓ | Module-specific |
| **Create Records** | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Edit Own Records** | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Edit Any Records** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Delete Own Records** | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Delete Any Records** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Approve Content** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Run Workflows** | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Create Workflows** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Export Data** | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Import Data** | ✓ | ✓ | ✗ | ✗ | ✗ |

### 2.3 Approval Permissions

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| **Request Approval** | ✓ | ✓ | ✓ | ✗ |
| **Approve Items** | ✓ | ✓ | Config | ✗ |
| **Reject Items** | ✓ | ✓ | Config | ✗ |
| **Bypass Approval** | ✓ | Config | ✗ | ✗ |
| **Configure Approval Rules** | ✓ | ✓ | ✗ | ✗ |

*Config = Configurable per workflow/module

---

## 3. Module-Level Permissions

### 3.1 Override System

Users can have different permission levels per module:

```typescript
interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;  // Default role

  // Module-specific overrides
  modulePermissions?: {
    [moduleId: string]: {
      role?: ModuleRole;  // Override workspace role
      permissions?: string[];  // Additional granular permissions
    }
  };
}
```

### 3.2 Example: Sales Manager

A Sales Manager might have:
- **Workspace Role:** Member (standard access to most modules)
- **BMS (Sales) Override:** Admin (manage all deals, see all pipelines)
- **BMC (Content) Override:** Viewer (can view but not create content)

```json
{
  "userId": "user_123",
  "workspaceId": "ws_456",
  "role": "member",
  "modulePermissions": {
    "bms": { "role": "admin" },
    "bmc": { "role": "viewer" }
  }
}
```

### 3.3 Module Permission Matrix (BM-CRM Example)

| Permission | Admin | Manager | Sales Rep | Viewer |
|------------|-------|---------|-----------|--------|
| **View All Contacts** | ✓ | ✓ | Own Only | ✓ |
| **Create Contacts** | ✓ | ✓ | ✓ | ✗ |
| **Edit Any Contact** | ✓ | ✓ | ✗ | ✗ |
| **Delete Contacts** | ✓ | ✓ | ✗ | ✗ |
| **View All Deals** | ✓ | ✓ | Own Only | ✓ |
| **Create Deals** | ✓ | ✓ | ✓ | ✗ |
| **Change Deal Owner** | ✓ | ✓ | ✗ | ✗ |
| **View Pipeline Analytics** | ✓ | ✓ | Limited | ✗ |
| **Export CRM Data** | ✓ | ✓ | ✗ | ✗ |

---

## 4. API Key Permissions

### 4.1 API Key Scoping

API keys can be scoped to specific permissions:

```typescript
interface ApiKey {
  id: string;
  workspaceId: string;
  name: string;
  keyHash: string;  // Hashed key

  // Permission scoping
  scopes: ApiScope[];

  // Rate limiting
  rateLimit: number;  // Requests per minute

  // Metadata
  createdById: string;
  expiresAt?: Date;
  lastUsedAt?: Date;
}

type ApiScope =
  | 'read:contacts'
  | 'write:contacts'
  | 'read:deals'
  | 'write:deals'
  | 'read:content'
  | 'write:content'
  | 'read:analytics'
  | 'webhooks:manage'
  | 'admin:full';  // All permissions
```

### 4.2 API Key Rate Limits

| Key Type | Rate Limit | Scope |
|----------|------------|-------|
| **Full Access** | 1000/min | All endpoints |
| **Read Only** | 5000/min | GET endpoints |
| **Limited Scope** | 500/min | Specified scopes |
| **Webhook Receiver** | 10000/min | Inbound only |

---

## 5. Implementation Schema

### 5.1 Prisma Schema

```prisma
// Core role enum
enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
  GUEST
}

// Workspace member with role
model WorkspaceMember {
  id              String        @id @default(uuid())
  workspaceId     String
  workspace       Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  role            WorkspaceRole @default(MEMBER)

  // Module permission overrides (JSON)
  modulePermissions Json?       // { "bms": { "role": "admin" } }

  // Invitation tracking
  invitedById     String?
  invitedBy       User?         @relation("InvitedBy", fields: [invitedById], references: [id])
  invitedAt       DateTime?
  joinedAt        DateTime      @default(now())

  // Status
  status          String        @default("active") // active, suspended, pending

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([workspaceId, userId])
  @@index([workspaceId])
  @@index([userId])
}

// Custom permissions (for fine-grained control)
model Permission {
  id              String   @id @default(uuid())
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  name            String   // e.g., "deals:approve"
  description     String?

  // Which roles have this permission by default
  defaultRoles    WorkspaceRole[]

  createdAt       DateTime @default(now())

  @@unique([workspaceId, name])
}

// API Keys with scoped permissions
model ApiKey {
  id              String   @id @default(uuid())
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  name            String
  keyPrefix       String   // First 8 chars for identification
  keyHash         String   // SHA-256 hash of full key

  scopes          String[] // ['read:contacts', 'write:deals']
  rateLimit       Int      @default(1000)

  createdById     String
  createdBy       User     @relation(fields: [createdById], references: [id])

  expiresAt       DateTime?
  lastUsedAt      DateTime?

  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId])
  @@index([keyPrefix])
}
```

### 5.2 Permission Checking Utility

```typescript
// lib/permissions.ts

import { WorkspaceRole } from '@prisma/client';

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: WorkspaceRole[] = [
  'GUEST',
  'VIEWER',
  'MEMBER',
  'ADMIN',
  'OWNER',
];

export function hasRole(
  memberRole: WorkspaceRole,
  requiredRole: WorkspaceRole
): boolean {
  const memberIndex = ROLE_HIERARCHY.indexOf(memberRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return memberIndex >= requiredIndex;
}

// Permission definitions
const PERMISSIONS = {
  // Workspace level
  'workspace:settings:read': ['ADMIN', 'OWNER'],
  'workspace:settings:write': ['ADMIN', 'OWNER'],
  'workspace:billing': ['OWNER'],
  'workspace:members:invite': ['ADMIN', 'OWNER'],
  'workspace:members:remove': ['ADMIN', 'OWNER'],
  'workspace:delete': ['OWNER'],

  // Module level (default)
  'module:records:read': ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'],
  'module:records:create': ['MEMBER', 'ADMIN', 'OWNER'],
  'module:records:edit_own': ['MEMBER', 'ADMIN', 'OWNER'],
  'module:records:edit_any': ['ADMIN', 'OWNER'],
  'module:records:delete_own': ['MEMBER', 'ADMIN', 'OWNER'],
  'module:records:delete_any': ['ADMIN', 'OWNER'],

  // Approval
  'approval:request': ['MEMBER', 'ADMIN', 'OWNER'],
  'approval:approve': ['ADMIN', 'OWNER'],
  'approval:bypass': ['OWNER'],

  // Agent
  'agent:run': ['MEMBER', 'ADMIN', 'OWNER'],
  'agent:configure': ['ADMIN', 'OWNER'],

  // Data
  'data:export': ['MEMBER', 'ADMIN', 'OWNER'],
  'data:import': ['ADMIN', 'OWNER'],
} as const;

export function hasPermission(
  memberRole: WorkspaceRole,
  permission: keyof typeof PERMISSIONS,
  moduleOverride?: WorkspaceRole
): boolean {
  const effectiveRole = moduleOverride || memberRole;
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(effectiveRole);
}

// Check if user can perform action on resource
export function canAccess(
  member: { role: WorkspaceRole; modulePermissions?: Record<string, { role?: WorkspaceRole }> },
  moduleId: string,
  permission: keyof typeof PERMISSIONS
): boolean {
  const moduleRole = member.modulePermissions?.[moduleId]?.role;
  return hasPermission(member.role, permission, moduleRole);
}
```

### 5.3 Middleware for Route Protection

```typescript
// middleware/authorize.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { hasPermission } from '@/lib/permissions';

type PermissionKey = keyof typeof PERMISSIONS;

export function withPermission(permission: PermissionKey) {
  return async function middleware(req: NextRequest) {
    const { userId, sessionClaims } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = req.headers.get('x-workspace-id');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace required' }, { status: 400 });
    }

    // Get member role from database or JWT claims
    const member = await getWorkspaceMember(workspaceId, userId);

    if (!member) {
      return NextResponse.json({ error: 'Not a workspace member' }, { status: 403 });
    }

    if (!hasPermission(member.role, permission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', required: permission },
        { status: 403 }
      );
    }

    return NextResponse.next();
  };
}
```

---

## 6. Questions Answered

| Question | Answer |
|----------|--------|
| Team/group-based permissions? | Start with individual, add teams in v2 |
| Inherited permissions? | Yes, role hierarchy with inheritance |
| Default permission for new users? | Member (configurable per workspace) |
| Permission changes for existing data? | Apply immediately, log in audit trail |
| Different roles per module? | Yes, via modulePermissions override |

---

## 7. Default Role for Invitations

```typescript
// Workspace settings
interface WorkspaceSettings {
  defaultInviteRole: WorkspaceRole;  // Default: MEMBER
  requireEmailDomain?: string;  // e.g., "@company.com"
  allowGuestInvites: boolean;  // Default: false
  maxMembers?: number;  // Subscription-based limit
}
```

---

## 8. Implementation Priority

### MVP (Phase 1)
1. ✅ Workspace roles (Owner, Admin, Member, Viewer)
2. ✅ Basic permission checking middleware
3. ✅ Role assignment on invite
4. ✅ Role change by Admin/Owner

### Post-MVP (Phase 2)
5. ⬜ Module-level permission overrides
6. ⬜ Custom permissions
7. ⬜ API key scoping
8. ⬜ Guest role with limited access

### Future (Phase 3)
9. ⬜ Team/group-based permissions
10. ⬜ Approval workflow permissions
11. ⬜ Record-level permissions (row-level in addition to role-level)

---

## Related Documents

- [Multi-Tenant Isolation Research](/docs/research/multi-tenant-isolation-research.md)
- [Twenty CRM Analysis](/docs/modules/bm-crm/research/twenty-crm-analysis.md)
- [PLATFORM-FOUNDATION-RESEARCH-CHECKLIST.md](/docs/research/PLATFORM-FOUNDATION-RESEARCH-CHECKLIST.md)
