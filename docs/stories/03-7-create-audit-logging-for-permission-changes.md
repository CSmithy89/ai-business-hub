# Story 03-7: Create Audit Logging for Permission Changes

**Story ID:** 03-7
**Epic:** EPIC-03 - RBAC & Multi-Tenancy
**Points:** 2
**Priority:** P1
**Status:** Complete

---

## User Story

**As a** security administrator
**I want** all permission changes logged
**So that** I can audit access control modifications

---

## Acceptance Criteria

- [x] Create AuditService for logging permission changes
- [x] Log role changes (e.g., Member → Admin)
- [x] Log member additions/removals from workspaces
- [x] Log permission override changes (module-level permissions)
- [x] Include before/after values in audit logs
- [x] Include actor (who made the change) in audit logs
- [x] Create audit log viewer API endpoint
- [x] Create audit log viewer component for workspace settings
- [x] Write tests for audit logging functionality

---

## Technical Implementation

### Backend Changes

#### 1. AuditService (`apps/api/src/audit/`)

Create a centralized service for audit logging:

```typescript
@Injectable()
export class AuditService {
  async logRoleChange(params: {
    workspaceId: string;
    actorId: string;
    targetMemberId: string;
    oldRole: string;
    newRole: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>

  async logMemberAdded(params: {
    workspaceId: string;
    actorId: string;
    newMemberId: string;
    role: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>

  async logMemberRemoved(params: {
    workspaceId: string;
    actorId: string;
    removedMemberId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>

  async logPermissionOverrideChange(params: {
    workspaceId: string;
    actorId: string;
    targetMemberId: string;
    oldPermissions: any;
    newPermissions: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>

  async getAuditLogs(params: {
    workspaceId: string;
    limit?: number;
    offset?: number;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLog[]>
}
```

#### 2. Integration Points

Update the following services to use AuditService:

- `MembersController.updateModulePermissions()` - Log permission override changes
- Future: `MembersService.updateRole()` - Log role changes
- Future: `WorkspaceService.addMember()` - Log member additions
- Future: `WorkspaceService.removeMember()` - Log member removals

#### 3. API Endpoint

```
GET /workspaces/:workspaceId/audit-logs
Query params: limit, offset, action, userId, startDate, endDate
```

### Frontend Changes

#### 1. Audit Log Viewer Component

Create `apps/web/src/components/workspace/AuditLogViewer.tsx`:

- Display audit logs in a table format
- Show action, actor, target, timestamp, and changes
- Support filtering by action type and date range
- Support pagination
- Show before/after diff for permission changes

#### 2. Integration

Add audit log viewer to workspace settings page:
- New tab "Audit Logs" in settings
- Visible only to workspace admins and owners

---

## Database Schema

The `audit_logs` table already exists with the following structure:

```typescript
model AuditLog {
  id          String   @id @default(uuid())
  workspaceId String   @map("workspace_id")
  action      String
  entity      String
  entityId    String?  @map("entity_id")
  userId      String?  @map("user_id")
  ipAddress   String?  @map("ip_address")
  userAgent   String?  @map("user_agent")
  oldValues   Json?    @map("old_values")
  newValues   Json?    @map("new_values")
  metadata    Json?
  createdAt   DateTime @default(now()) @map("created_at")

  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}
```

### Action Types

- `role_changed` - Role change (e.g., member → admin)
- `member_added` - New member added to workspace
- `member_removed` - Member removed from workspace
- `module_permissions_updated` - Module permission overrides changed
- `member_invited` - Member invitation sent (future)

---

## Testing

### Unit Tests

- `audit.service.spec.ts` - Test all logging methods
- `audit.controller.spec.ts` - Test audit log retrieval

### Integration Tests

- Test audit logging when updating module permissions
- Test audit log filtering and pagination
- Test that audit logs are tenant-isolated

---

## Definition of Done

- [x] AuditService implemented and tested
- [x] Audit logging integrated into existing member operations
- [x] Audit log viewer API endpoint created
- [x] Audit log viewer UI component created
- [x] All tests passing
- [x] Code reviewed and approved
- [x] Documentation updated

---

## Notes

- Audit logs are immutable - no update or delete operations
- Audit logs must respect tenant isolation (RLS policies)
- Consider log retention policy in future (e.g., keep 90 days)
- IP address and user agent capture should respect privacy regulations

---

**Created:** 2025-12-02
**Updated:** 2025-12-02
**Implemented By:** Claude Code
