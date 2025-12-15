# Story 04-9: Implement Approval Audit Trail

**Epic:** EPIC-04 - Approval Queue System
**Story Points:** 2
**Priority:** P0
**Status:** done

## User Story

**As a** compliance officer
**I want** complete audit trail of approvals
**So that** I can review decisions

## Acceptance Criteria

- [ ] Log all approval actions to `audit_logs`
- [ ] Capture: action, actor, timestamp, before/after
- [ ] Log auto-approvals with AI reasoning
- [ ] Create audit view in approval detail
- [ ] Export capability (future)

## Technical Context

### Existing Audit System (from Epic 03):
- AuditLog Prisma model exists at `packages/db/prisma/schema.prisma`
- AuditService exists at `apps/api/src/audit/audit.service.ts`
- AuditLogViewer component exists at `apps/web/src/components/workspace/AuditLogViewer.tsx`

### Actions to Log:
- `approval.created` - When approval item is created
- `approval.approved` - When approval is manually approved
- `approval.rejected` - When approval is manually rejected
- `approval.auto_approved` - When approval is auto-approved by AI
- `approval.escalated` - When approval is escalated
- `approval.bulk_approved` - When bulk approval is performed
- `approval.bulk_rejected` - When bulk rejection is performed

### AuditLog Schema Fields:
```prisma
model AuditLog {
  id          String @id @default(uuid())
  workspaceId String @map("workspace_id")

  action    String
  entity    String
  entityId  String? @map("entity_id")
  userId    String? @map("user_id")
  ipAddress String? @map("ip_address")
  userAgent String? @map("user_agent")

  oldValues Json? @map("old_values")
  newValues Json? @map("new_values")
  metadata  Json?

  createdAt DateTime @default(now()) @map("created_at")
}
```

## Implementation Tasks

### Backend (NestJS)

1. **Create ApprovalAuditService** (`apps/api/src/approvals/services/approval-audit.service.ts`)
   - Wrapper around existing AuditService for approval-specific logging
   - Methods:
     - `logApprovalCreated(params)` - Log creation with confidence score
     - `logApprovalDecision(params)` - Log approve/reject with before/after
     - `logAutoApproval(params)` - Log auto-approval with AI reasoning
     - `logEscalation(params)` - Log escalation events
     - `logBulkAction(params)` - Log bulk actions
   - Include confidence score and AI reasoning in metadata

2. **Replace AuditLogService stub** in:
   - `ApprovalsService.approve()` and `reject()`
   - `ApprovalsService.bulkAction()`
   - `ApprovalRouterService.routeApproval()`
   - `ApprovalEscalationService.escalateApproval()`

3. **Update ApprovalsModule**
   - Import real AuditService from audit module
   - Replace stub with ApprovalAuditService

### Frontend (Next.js)

4. **Create ApprovalAuditLog Component** (`apps/web/src/components/approval/approval-audit-log.tsx`)
   - Fetch audit logs for specific approval item
   - Timeline view with icons for each action type
   - Display:
     - Action type (badge)
     - Actor (user name/email or "System")
     - Timestamp (formatted)
     - Changes (before/after)
     - AI reasoning (for auto-approvals)

5. **Update Approval Detail Page** (`apps/web/src/app/approvals/[id]/page.tsx`)
   - Add audit log section below approval card
   - Show timeline of all actions

## Data Flow

### Creating Approval
1. ApprovalRouterService creates approval
2. ApprovalAuditService.logApprovalCreated() called
3. AuditLog created with:
   - action: "approval.created"
   - entity: "approval_item"
   - entityId: approval.id
   - newValues: { status, confidenceScore, type }
   - metadata: { aiReasoning, factors }

### Approving/Rejecting
1. ApprovalsService.approve/reject() updates approval
2. ApprovalAuditService.logApprovalDecision() called
3. AuditLog created with:
   - action: "approval.approved" or "approval.rejected"
   - userId: decidedBy
   - oldValues: { status: "pending" }
   - newValues: { status: "approved", decidedAt, decidedBy }
   - metadata: { notes, reason }

### Auto-Approval
1. ApprovalRouterService routes high-confidence approval
2. ApprovalAuditService.logAutoApproval() called
3. AuditLog created with:
   - action: "approval.auto_approved"
   - userId: "system"
   - metadata: { confidenceScore, aiReasoning, factors }

### Escalation
1. ApprovalEscalationService escalates overdue approval
2. ApprovalAuditService.logEscalation() called
3. AuditLog created with:
   - action: "approval.escalated"
   - oldValues: { assignedTo }
   - newValues: { escalatedTo, escalatedAt }

## Definition of Done

- [ ] ApprovalAuditService implemented and integrated
- [ ] All approval actions logged to audit_logs table
- [ ] Audit logs include before/after snapshots
- [ ] AI reasoning captured in metadata for auto-approvals
- [ ] ApprovalAuditLog component displays timeline
- [ ] Approval detail page shows audit history
- [ ] Manual testing confirms all actions logged correctly

## Testing Notes

### Manual Testing Checklist
1. Create approval → Check audit log for creation entry
2. Approve approval → Check audit log for decision entry with before/after
3. Reject approval → Check audit log for rejection entry
4. Create high-confidence approval → Check auto-approval audit log with AI reasoning
5. Escalate approval → Check escalation audit log
6. Bulk approve → Check bulk action audit logs
7. View approval detail page → Verify audit timeline displays

### Test Data
- Create approvals with different confidence scores (90%, 70%, 50%)
- Test with different users (to verify actor tracking)
- Test escalation with overdue approval
- Test bulk actions with multiple items

## Dependencies

- Existing AuditService from Epic 03
- ApprovalItem model with all status transitions
- Approval detail page from Story 04-4

## Notes

- Export functionality deferred to future story
- IP address and user agent can be added later if needed
- Consider pagination for audit logs if approval has many actions
- AI reasoning should be truncated in list view, full in detail view

## Related Files

### Backend
- `apps/api/src/audit/audit.service.ts` - Base audit service
- `apps/api/src/approvals/services/approval-audit.service.ts` - NEW
- `apps/api/src/approvals/approvals.service.ts` - UPDATE
- `apps/api/src/approvals/services/approval-router.service.ts` - UPDATE
- `apps/api/src/approvals/services/approval-escalation.service.ts` - UPDATE
- `apps/api/src/approvals/approvals.module.ts` - UPDATE

### Frontend
- `apps/web/src/components/approval/approval-audit-log.tsx` - NEW
- `apps/web/src/app/approvals/[id]/page.tsx` - UPDATE
- `apps/web/src/components/workspace/AuditLogViewer.tsx` - REFERENCE

### Schema
- `packages/db/prisma/schema.prisma` - AuditLog model (existing)
