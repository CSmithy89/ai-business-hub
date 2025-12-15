# Story 04-8: Implement Approval Escalation

**Epic:** EPIC-04 - Approval Queue System
**Story ID:** 04-8
**Status:** done
**Points:** 2
**Priority:** P1
**Assignee:** Dev Team

---

## User Story

**As a** platform
**I want** to escalate stale approvals
**So that** important decisions aren't missed

---

## Acceptance Criteria

- [ ] Create scheduled job for escalation check
- [ ] Escalate items past `dueAt`
- [ ] Notify escalation target
- [ ] Update approval with escalation info
- [ ] Emit `approval.escalated` event
- [ ] Configurable escalation chain per workspace

---

## Technical Specification

### Database Changes

**ApprovalItem** (already exists):
- `dueAt: DateTime` - When approval is due
- `escalatedAt: DateTime?` - When it was escalated
- `escalatedToId: String?` - User ID of escalation target

**WorkspaceSettings** (add new fields):
- `enableEscalation: Boolean` - Enable/disable escalation
- `escalationCheckIntervalMinutes: Int` - Check interval (default: 15)
- `escalationTargetUserId: String?` - Default escalation user ID

### Backend Implementation

**ApprovalEscalationService** (`apps/api/src/approvals/services/approval-escalation.service.ts`):
- `checkOverdueApprovals(workspaceId: string)` - Find overdue approvals
- `escalateApproval(approvalId: string)` - Escalate single approval
- `getEscalationTarget(workspaceId: string)` - Get escalation target user
- `notifyEscalationTarget(approval: ApprovalItem, targetUser: User)` - Send notification

**EscalationProcessor** (`apps/api/src/approvals/processors/escalation.processor.ts`):
- BullMQ processor for scheduled escalation job
- Run every 15 minutes (configurable)
- Process all workspaces with escalation enabled

**EscalationConfigDto** (`apps/api/src/approvals/dto/escalation-config.dto.ts`):
- `enableEscalation: boolean`
- `escalationCheckIntervalMinutes: number`
- `escalationTargetUserId?: string`
- `emailNotificationEnabled: boolean`

### API Endpoints

```
GET /api/approvals/escalation-config
PUT /api/approvals/escalation-config
```

### Event Schema

```typescript
{
  type: 'approval.escalated',
  source: 'approval-escalation-service',
  data: {
    approvalId: string;
    workspaceId: string;
    escalatedFrom: string; // original assignee
    escalatedTo: string;   // escalation target
    dueAt: string;
    escalatedAt: string;
  }
}
```

---

## Implementation Notes

### Escalation Logic

1. **Check Interval**: BullMQ recurring job runs every 15 minutes (configurable)
2. **Overdue Detection**: Find approvals where `dueAt < now()` AND `escalatedAt IS NULL` AND `status = 'pending'`
3. **Escalation Target**: For MVP, use workspace settings `escalationTargetUserId`, fallback to first admin/owner
4. **Escalation Process**:
   - Update `escalatedAt` to current timestamp
   - Update `escalatedToId` to target user
   - Keep `assignedToId` as original assignee
   - Emit `approval.escalated` event
   - Log notification (stub for now - actual email in future epic)

### Escalation Chain

For MVP: **Single-level escalation only**
- Original assignee -> Escalation target
- Future: Multi-level chains (admin -> owner -> external)

### Notification Strategy

For this story: **Stub notifications**
- Log escalation event
- Return notification data
- Actual email/in-app notifications: Future epic

---

## Dependencies

- BullMQ must be installed and configured
- Redis connection available
- Existing ApprovalItem model with escalation fields
- WorkspaceSettings model for config storage

---

## Testing Requirements

### Unit Tests

- [ ] ApprovalEscalationService methods
- [ ] getEscalationTarget() with various workspace scenarios
- [ ] escalateApproval() updates correct fields
- [ ] checkOverdueApprovals() filters correctly

### Integration Tests

- [ ] EscalationProcessor runs on schedule
- [ ] Multiple workspaces processed independently
- [ ] Events emitted correctly
- [ ] Escalation config CRUD operations

### Edge Cases

- [ ] No escalation target available (throw error)
- [ ] Approval already escalated (skip)
- [ ] Approval resolved before escalation (skip)
- [ ] Workspace has escalation disabled (skip)

---

## Definition of Done

- [ ] ApprovalEscalationService created with all methods
- [ ] EscalationProcessor created and registered
- [ ] BullMQ queue configured in approvals module
- [ ] Escalation config endpoints functional
- [ ] Prisma schema updated for WorkspaceSettings
- [ ] Unit tests passing
- [ ] Event emission working (stub)
- [ ] Sprint status updated to `in-progress`
- [ ] Code review approved
- [ ] Documentation updated

---

## Out of Scope

- Email/SMS notifications (stub only)
- Multi-level escalation chains
- Custom escalation rules per approval type
- Escalation history tracking
- Configurable escalation delays

---

## Links

- **Epic:** [EPIC-04 - Approval Queue System](../epics/EPIC-04-approval-system.md)
- **Tech Spec:** [Tech Spec - Epic 04](../docs/archive/foundation-phase/sprint-artifacts/tech-spec-epic-04.md)
- **Schema:** [Prisma Schema](../../packages/db/prisma/schema.prisma)

---

## Activity Log

### 2025-12-03
- **Dev**: Story file created
- **Status**: IN PROGRESS
