# Story 03-5: Create PostgreSQL RLS Policies

**Epic:** EPIC-03 - RBAC & Multi-Tenancy
**Story ID:** 03-5
**Points:** 3
**Priority:** P0
**Status:** done

---

## Story Description

**As a** developer
**I want** database-level row security
**So that** data is protected even if application code has bugs

## Acceptance Criteria

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

## Technical Context

### Defense-in-Depth Multi-Tenancy

This story implements the **database layer** of our defense-in-depth multi-tenancy architecture:

1. **PostgreSQL RLS** (this story) - Database-level enforcement
2. **Prisma Client Extension** (Story 03-4, already complete) - ORM-level enforcement
3. **Auth Guards** (Stories 03-2, 03-3, complete) - Application-level enforcement

Even if application code has bugs, RLS policies prevent cross-tenant data leakage.

### Tenant-Scoped Tables

Based on the Prisma schema, the following tables require RLS:

| Table | Workspace Column | Current RLS Status |
|-------|-----------------|-------------------|
| `approval_items` | `workspace_id` | To be enabled |
| `ai_provider_configs` | `workspace_id` | To be enabled |
| `token_usage` | `workspace_id` | To be enabled |
| `api_keys` | `workspace_id` | To be enabled |
| `event_logs` | `workspace_id` | To be enabled |
| `audit_logs` | `workspace_id` | To be enabled |
| `notifications` | `workspace_id` | To be enabled |

**Non-tenant tables (skip RLS):**
- `users` - Global user pool
- `sessions` - Tied to user, not workspace
- `accounts` - OAuth accounts, not workspace-scoped
- `verification_tokens` - Email verification, pre-workspace
- `workspaces` - Protected by ownership check, not RLS
- `workspace_members` - Junction table, uses workspace foreign key
- `workspace_invitations` - Protected by workspace foreign key

### RLS Policy Pattern

All tenant-scoped tables use the same policy pattern:

```sql
-- Enable RLS
ALTER TABLE "table_name" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation ON "table_name"
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));
```

**How it works:**
1. Application sets `app.tenant_id` session variable before queries
2. RLS policy filters all operations to match that tenant
3. If `app.tenant_id` not set, policy evaluates to false → no rows returned
4. Platform admin role can bypass RLS for maintenance

### Platform Admin Role

Create a `platform_admin` role for internal maintenance operations:

```sql
CREATE ROLE platform_admin;
GRANT BYPASSRLS ON ALL TABLES IN SCHEMA public TO platform_admin;
```

**Important:** This role should only be used by internal tooling, never by application code.

### Connection Configuration

**PgBouncer Requirement:**
- Must use **session mode** (not transaction mode)
- RLS relies on `current_setting()` which requires session-level variables
- Document this requirement in deployment docs

**Setting Tenant Context:**

```typescript
// Before executing queries:
await prisma.$executeRaw`SET LOCAL app.tenant_id = ${workspaceId}`
```

## Implementation Plan

### 1. Create Migrations Directory

```bash
mkdir -p packages/db/prisma/migrations
```

### 2. Create RLS Migration

File: `packages/db/prisma/migrations/[timestamp]_enable_rls_policies/migration.sql`

**Migration content:**
- Enable RLS on all tenant tables
- Create tenant isolation policies
- Create platform_admin role with bypass
- Add helpful comments for maintenance

### 3. Create RLS Context Helper

File: `packages/db/src/rls-context.ts`

**Functions:**
- `setTenantContext(prisma, tenantId)` - Set app.tenant_id
- `clearTenantContext(prisma)` - Clear app.tenant_id
- `withRLSContext(tenantId, operation)` - Execute operation with tenant context

### 4. Create Tests

File: `packages/db/src/rls-policies.test.ts`

**Test cases:**
- RLS enabled on all tenant tables
- Queries filtered by tenant context
- Cross-tenant access blocked
- Platform admin bypass works
- Missing context returns no rows

## Testing Strategy

### Database-Level Tests

Use direct PostgreSQL client to test RLS:

```typescript
describe('RLS Policies', () => {
  test('blocks cross-tenant access', async () => {
    // Set context to workspace A
    await setTenantContext(prisma, workspaceA.id)

    // Try to query workspace B data
    const items = await prisma.approvalItem.findMany({
      where: { workspaceId: workspaceB.id }
    })

    // Should return empty (RLS blocks)
    expect(items).toHaveLength(0)
  })

  test('allows same-tenant access', async () => {
    await setTenantContext(prisma, workspaceA.id)

    const items = await prisma.approvalItem.findMany({
      where: { workspaceId: workspaceA.id }
    })

    expect(items.length).toBeGreaterThan(0)
  })
})
```

### Integration with Prisma Extension

Verify RLS works in conjunction with Prisma Tenant Extension:
- Both layers should filter independently
- If one layer has a bug, the other still protects

## Dependencies

### Depends On
- **Epic 00:** Prisma database setup
- **Epic 02:** Workspace models

### Required For
- **Story 03-6:** Module permission overrides (uses audit_logs)
- **Story 03-7:** Audit logging (RLS on audit_logs table)
- **Epic 04:** Approval queue (RLS on approval_items)

## Files to Create/Modify

### New Files
- `packages/db/prisma/migrations/[timestamp]_enable_rls_policies/migration.sql`
- `packages/db/src/rls-context.ts`
- `packages/db/src/rls-policies.test.ts`

### Modified Files
- None (pure additive)

## References

- Epic File: `docs/epics/EPIC-03-rbac-multitenancy.md`
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-03.md` (Section: Story 03.5)
- Architecture: `docs/architecture.md` (ADR-003: Defense-in-depth multi-tenancy)
- Prisma Schema: `packages/db/prisma/schema.prisma`

## Notes

- RLS is the **last line of defense** - even if application code is bypassed, database blocks cross-tenant access
- PgBouncer session mode is **required** for RLS to work
- Platform admin role is for maintenance only, never use in application code
- All tenant tables must have indexed `workspace_id` column (already in schema)
- Monitor query performance after RLS - may need additional indexes

---

**Created:** 2025-12-02
**Developer:** claude-code
**Estimated Completion:** 4 hours

---

## Senior Developer Review

**Reviewer:** Claude (AI)
**Date:** 2025-12-02
**Outcome:** APPROVE

### Summary
Excellent implementation of PostgreSQL RLS policies for defense-in-depth multi-tenancy. All 7 tenant tables protected with proper isolation policies.

### Code Quality
- Clean SQL migration with consistent patterns
- Well-documented helper functions with TypeScript types
- Comprehensive test suite (25+ test cases)

### Security Review
- Tenant isolation policies prevent cross-tenant access
- Platform admin role with BYPASSRLS for maintenance only
- Defense-in-depth: RLS + Prisma Extension + Guards

### Test Coverage
- Setup verification, tenant isolation, cross-tenant blocking
- Context management, all 7 tables tested individually
- Non-tenant tables verified to work without RLS

### Issues Found
- None blocking

### Recommendations
- Document PgBouncer session mode requirement
- Monitor query performance after deployment

**Ready for production deployment.**
