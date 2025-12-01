# Multi-Tenant Data Isolation Research

**Status:** Complete
**Date:** 2025-11-30
**Researcher:** Winston (Architect)

---

## Executive Summary

After analyzing Twenty CRM, Supabase RLS patterns, and Prisma multi-tenancy approaches, we recommend **Row-Level Security (RLS) with Application-Level Middleware** as the optimal isolation strategy for HYVVE's SMB SaaS platform.

---

## 1. Isolation Strategies Compared

### 1.1 Schema-per-Tenant (Twenty CRM Approach)

**How it works:**
- Each workspace gets its own PostgreSQL schema
- Tables duplicated per tenant: `workspace_abc123.contacts`, `workspace_def456.contacts`
- Metadata stored in shared `core` schema

```
PostgreSQL Database
├── core (shared)
│   ├── workspace
│   ├── user
│   └── objectMetadata
├── workspace_abc123
│   ├── person
│   ├── company
│   └── opportunity
└── workspace_def456
    ├── person
    ├── company
    └── opportunity
```

**Pros:**
- Complete data isolation
- Easy per-tenant backup/restore
- No risk of cross-tenant data leaks
- Can use different schemas per tenant (custom objects)

**Cons:**
- Complex migration management (run migrations per schema)
- Connection pool overhead
- Harder to query across tenants (admin/analytics)
- Schema proliferation at scale

**Best for:** Enterprise SaaS with strict compliance requirements

### 1.2 Row-Level Security (Supabase Approach)

**How it works:**
- Single schema with `tenant_id` column on all tables
- PostgreSQL RLS policies automatically filter queries
- Tenant context set via session variable

```sql
-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "tenant_isolation" ON contacts
  FOR ALL
  USING (tenant_id = (SELECT current_setting('app.tenant_id')::uuid));

-- Set tenant context (in application)
SET app.tenant_id = 'abc-123-uuid';
```

**Pros:**
- Database-level enforcement (defense in depth)
- Simple schema management
- Works with standard Prisma migrations
- Easy cross-tenant admin queries (bypass RLS for admin role)

**Cons:**
- Must remember to set tenant context on every connection
- Slight query overhead from policy evaluation
- All tenants share same schema (no custom objects without JSONB)

**Best for:** SMB SaaS with standard schema needs

### 1.3 Application-Level Filtering (Prisma Middleware)

**How it works:**
- Prisma middleware automatically adds `WHERE tenant_id = ?` to all queries
- No database-level enforcement

```typescript
// Prisma middleware for tenant filtering
prisma.$use(async (params, next) => {
  const tenantId = getTenantIdFromContext();

  if (params.action === 'findMany' || params.action === 'findFirst') {
    params.args.where = { ...params.args.where, tenantId };
  }

  if (params.action === 'create') {
    params.args.data = { ...params.args.data, tenantId };
  }

  return next(params);
});
```

**Pros:**
- Simple implementation
- Full Prisma compatibility
- Easy to understand and debug

**Cons:**
- No database-level enforcement
- Raw SQL queries bypass middleware
- Relies on developer discipline

**Best for:** Quick MVP with trusted developers

---

## 2. Recommended Approach: Hybrid RLS + Prisma Middleware

For HYVVE, we recommend a **defense-in-depth** approach combining both strategies:

### 2.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Extract tenant_id from JWT (workspaceId claim)               │
│  2. Prisma middleware adds tenant filter to all queries          │
│  3. Set PostgreSQL session variable for RLS                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  4. RLS policies enforce tenant isolation as backup              │
│  5. Admin role can bypass RLS for cross-tenant operations        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Implementation

#### Step 1: Prisma Schema with tenant_id

```prisma
model Contact {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  email       String
  firstName   String?
  lastName    String?
  // ... other fields

  @@index([tenantId])
  @@map("contacts")
}
```

#### Step 2: Prisma Client Extension (Recommended over Middleware)

```typescript
// lib/prisma-tenant.ts
import { PrismaClient } from '@prisma/client';

export function createTenantPrismaClient(tenantId: string) {
  const prisma = new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Add tenant filter to reads
          if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(operation)) {
            args.where = { ...args.where, tenantId };
          }

          // Add tenant to creates
          if (['create', 'createMany'].includes(operation)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map(d => ({ ...d, tenantId }));
            } else {
              args.data = { ...args.data, tenantId };
            }
          }

          // Add tenant filter to updates/deletes
          if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            args.where = { ...args.where, tenantId };
          }

          return query(args);
        },
      },
    },
  });

  return prisma;
}
```

#### Step 3: PostgreSQL RLS Policies (Defense in Depth)

```sql
-- Enable RLS on all tenant tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation_contacts ON contacts
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_accounts ON accounts
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ... repeat for all tables

-- Create admin bypass role
CREATE ROLE platform_admin;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY; -- Force RLS even for table owners
GRANT BYPASSRLS ON DATABASE hyvve TO platform_admin; -- Admin can bypass
```

#### Step 4: Set Tenant Context on Connection

```typescript
// middleware/tenant-context.ts
import { PrismaClient } from '@prisma/client';

export async function withTenantContext<T>(
  prisma: PrismaClient,
  tenantId: string,
  operation: () => Promise<T>
): Promise<T> {
  // Set PostgreSQL session variable for RLS
  await prisma.$executeRawUnsafe(
    `SET app.tenant_id = '${tenantId}'`
  );

  try {
    return await operation();
  } finally {
    // Reset context
    await prisma.$executeRawUnsafe(`RESET app.tenant_id`);
  }
}
```

---

## 3. Decision: Tenant ID Implementation

### 3.1 UUID vs Integer

| Aspect | UUID | Integer |
|--------|------|---------|
| Collision risk | Virtually zero | Requires sequence |
| URL safety | Yes (no enumeration) | Enumerable |
| Performance | Slightly slower | Faster |
| Storage | 16 bytes | 4-8 bytes |
| Migration | Easier (no coordination) | Needs central authority |

**Decision:** Use **UUID** for tenant_id
- Matches our user/workspace ID strategy
- Prevents tenant enumeration attacks
- Simplifies distributed ID generation

### 3.2 Tables Requiring tenant_id

**Core Platform Tables:**
- `workspaces` (is the tenant - no tenant_id needed)
- `workspace_members` (links users to tenants)
- `api_keys` (scoped to tenant)
- `webhooks` (scoped to tenant)
- `audit_logs` (scoped to tenant)

**Module Tables (all need tenant_id):**
- `contacts`
- `accounts`
- `deals`
- `activities`
- `content`
- `email_templates`
- `email_campaigns`
- `workflows`
- `agents`
- `agent_sessions`
- ... all module-specific tables

### 3.3 Foreign Key Cascade Behavior

```prisma
model Contact {
  tenantId    String    @map("tenant_id")
  tenant      Workspace @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // When workspace deleted, cascade delete contacts
}
```

**Cascade Rules:**
- Workspace deletion → Cascade delete all tenant data
- Soft delete by default for user data
- Hard delete for truly orphaned data

---

## 4. Query Scoping Pattern

### 4.1 Standard Query (with Prisma Extension)

```typescript
// Automatically scoped to tenant
const contacts = await tenantPrisma.contact.findMany({
  where: { lifecycle: 'lead' },
  orderBy: { createdAt: 'desc' },
});
// Generates: SELECT * FROM contacts WHERE tenant_id = ? AND lifecycle = 'lead'
```

### 4.2 Cross-Tenant Admin Query

```typescript
// Use admin client without tenant extension
const adminPrisma = new PrismaClient();

// Set admin role for RLS bypass
await adminPrisma.$executeRaw`SET ROLE platform_admin`;

const allContacts = await adminPrisma.contact.findMany({
  select: {
    tenantId: true,
    _count: true,
  },
  groupBy: ['tenantId'],
});
```

### 4.3 Escape Hatch Pattern

```typescript
// For specific cross-tenant operations (e.g., data migration)
async function migrateContactsBetweenTenants(
  sourceTenantId: string,
  targetTenantId: string
) {
  // Requires explicit admin context
  const adminPrisma = getAdminPrismaClient();

  await adminPrisma.$transaction(async (tx) => {
    const contacts = await tx.contact.findMany({
      where: { tenantId: sourceTenantId },
    });

    await tx.contact.createMany({
      data: contacts.map(c => ({ ...c, tenantId: targetTenantId })),
    });
  });
}
```

---

## 5. Compliance & Data Retention

### 5.1 GDPR Considerations

- **Right to be forgotten:** Soft delete with 30-day retention, then hard delete
- **Data portability:** Export endpoint per tenant
- **Data location:** Single region by default, EU option later

### 5.2 Tenant Data Retention

```typescript
// Scheduled job for data retention
async function enforceDataRetention() {
  const retentionDays = 30;
  const cutoff = subDays(new Date(), retentionDays);

  // Hard delete soft-deleted records past retention
  await prisma.contact.deleteMany({
    where: {
      deletedAt: { lt: cutoff },
    },
  });
}
```

### 5.3 Tenant Deletion Process

1. Soft delete workspace (sets `deletedAt`)
2. Immediately revoke all access tokens
3. 30-day grace period for data recovery
4. Background job hard deletes all tenant data
5. Audit log entry preserved (anonymized)

---

## 6. Performance Considerations

### 6.1 Indexing Strategy

```sql
-- Composite indexes for common queries
CREATE INDEX idx_contacts_tenant_email ON contacts(tenant_id, email);
CREATE INDEX idx_contacts_tenant_lifecycle ON contacts(tenant_id, lifecycle);
CREATE INDEX idx_deals_tenant_stage ON deals(tenant_id, stage);
CREATE INDEX idx_activities_tenant_target ON activities(tenant_id, target_type, target_id);
```

### 6.2 RLS Performance

From Supabase documentation:
> "Add an index on the column used in RLS policies for significant performance improvement"

```sql
-- B-tree index on tenant_id (created automatically with foreign key, but explicit is better)
CREATE INDEX idx_contacts_tenant ON contacts USING btree (tenant_id);
```

### 6.3 Connection Pooling

Use PgBouncer or Prisma Data Proxy for connection pooling:
- Session mode required for RLS (maintains `app.tenant_id` variable)
- Transaction mode not compatible with session variables

---

## 7. Questions Answered

| Question | Answer |
|----------|--------|
| Expected tenant count Year 1? | 100-500 (SMB focus) |
| Expected tenant count Year 3? | 5,000-10,000 |
| Do tenants share data? | No (isolated by design) |
| Compliance requirements? | SOC2 (future), GDPR (launch) |
| Tenant deletion retention? | 30 days soft delete |

---

## 8. Final Recommendation

### For HYVVE MVP:

1. **Use Row-Level Security + Prisma Client Extension**
2. **UUID for tenant_id** (matches workspace.id)
3. **Composite indexes** on (tenant_id, frequently_queried_column)
4. **Cascade delete** tenant data when workspace deleted
5. **30-day soft delete** retention for GDPR compliance

### Implementation Priority:

1. ✅ Add `tenantId` column to Prisma schema
2. ✅ Create Prisma Client Extension for auto-filtering
3. ✅ Add RLS policies as defense-in-depth
4. ✅ Create admin role for cross-tenant operations
5. ✅ Implement tenant deletion workflow

---

## Related Documents

- [Twenty CRM Analysis](/docs/modules/bm-crm/research/twenty-crm-analysis.md)
- [PLATFORM-FOUNDATION-RESEARCH-CHECKLIST.md](/docs/research/PLATFORM-FOUNDATION-RESEARCH-CHECKLIST.md)
