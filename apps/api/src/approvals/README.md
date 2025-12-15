# Approvals Module

Approval Queue System for the HYVVE platform. Provides confidence-based approval routing and queue management for AI-generated content and decisions.

## Overview

The Approvals module implements a sophisticated approval system that:
- Calculates confidence scores based on multiple factors
- Routes items automatically based on confidence (auto-approve, quick review, or full review)
- Manages approval queue with filtering, sorting, and pagination
- Supports bulk approve/reject operations
- Escalates overdue approvals to prevent missed decisions
- Emits events for approval lifecycle (via `EventPublisherService`)
- Logs all decisions to audit trail (via `ApprovalAuditService`)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Approvals Module                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Controllers:                                                   │
│  └─ ApprovalsController: REST API endpoints                    │
│                                                                 │
│  Services:                                                      │
│  ├─ ApprovalsService: CRUD operations                          │
│  ├─ ConfidenceCalculatorService: Score calculation             │
│  ├─ ApprovalRouterService: Routing logic                       │
│  ├─ ApprovalEscalationService: Escalation logic (04-8)         │
│  └─ EscalationSchedulerService: Job scheduling (04-8)          │
│                                                                 │
│  Processors:                                                    │
│  └─ EscalationProcessor: BullMQ processor (04-8)               │
│                                                                 │
│  Integrations:                                                  │
│  ├─ EventPublisherService: Event emission                       │
│  └─ ApprovalAuditService: Audit logging                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Confidence-Based Routing

The system automatically routes approval requests based on confidence score:

| Score Range | Status | Review Type | Action |
|-------------|--------|-------------|--------|
| 85-100% | `auto_approved` | auto | Immediately executed |
| 60-84% | `pending` | quick | 1-click approval required |
| 0-59% | `pending` | full | Full review with reasoning |

## Escalation System (Story 04-8)

### Overview

Automatically escalates approvals that are past their due date to ensure important decisions aren't missed.

### How It Works

1. **Scheduled Check**: BullMQ job runs every 15 minutes (configurable)
2. **Find Overdue**: Queries approvals where `dueAt < now()` AND `escalatedAt IS NULL` AND `status = 'pending'`
3. **Escalate**: Updates approval with escalation timestamp and target user
4. **Notify**: Sends notification to escalation target (stub - logs only)
5. **Emit Event**: Emits `approval.escalated` event for downstream processing

### Escalation Target Priority

1. `WorkspaceSettings.escalationTargetUserId` (if configured)
2. First workspace member with role = 'owner'
3. First workspace member with role = 'admin'
4. Throws error if no valid target found

### Configuration

Escalation is configured per workspace via `WorkspaceSettings`:

```typescript
{
  enableEscalation: boolean;              // Enable/disable feature
  escalationCheckIntervalMinutes: number; // Check interval (default: 15)
  escalationTargetUserId?: string;        // Default escalation target
  enableEscalationNotifications: boolean; // Enable notifications
}
```

### API Endpoints

```
GET  /api/approvals/escalation-config      # Get config (admin/owner)
PUT  /api/approvals/escalation-config      # Update config (owner only)
```

### Events

```typescript
{
  type: 'approval.escalated',
  source: 'approval-escalation-service',
  data: {
    approvalId: string;
    workspaceId: string;
    escalatedFrom: string;  // Original assignee
    escalatedTo: string;    // Escalation target
    dueAt: string;
    escalatedAt: string;
  }
}
```

## Database Models

### ApprovalItem

```prisma
model ApprovalItem {
  id          String @id @default(uuid())
  workspaceId String @map("workspace_id")

  type        String
  title       String
  description String? @db.Text

  confidenceScore   Int
  confidenceFactors Json?
  aiRecommendation  String
  aiReasoning       String? @db.Text

  previewUrl      String?
  previewData     Json?
  relatedEntities Json?

  sourceModule String?
  sourceId     String?

  status   String @default("pending")
  priority String @default("medium")

  requestedBy   String
  assignedToId  String?
  escalatedToId String?  // Story 04-8

  dueAt        DateTime
  escalatedAt  DateTime?  // Story 04-8
  resolvedAt   DateTime?
  resolvedById String?

  resolution Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([workspaceId, status])
  @@index([assignedToId, status])
  @@index([dueAt])
  @@map("approval_items")
}
```

### WorkspaceSettings (Escalation Fields)

```prisma
model WorkspaceSettings {
  // ... other fields

  // Escalation Settings (Story 04-8)
  enableEscalation                 Boolean @default(true)
  escalationCheckIntervalMinutes   Int     @default(15)
  escalationTargetUserId           String?
  enableEscalationNotifications    Boolean @default(true)

  @@map("workspace_settings")
}
```

## API Endpoints

### Approval Queue

```
GET  /api/approvals                        # List approvals
GET  /api/approvals/:id                    # Get approval details
POST /api/approvals/:id/approve            # Approve item
POST /api/approvals/:id/reject             # Reject item
POST /api/approvals/bulk                   # Bulk approve/reject
```

### Escalation Config

```
GET  /api/approvals/escalation-config      # Get escalation config
PUT  /api/approvals/escalation-config      # Update escalation config
```

## Usage Examples

### Creating an Approval via Router

```typescript
import { ApprovalRouterService } from './approvals/services/approval-router.service';

// Inject service
constructor(private approvalRouter: ApprovalRouterService) {}

// Create approval with confidence factors
const approval = await this.approvalRouter.routeApproval(
  workspaceId,
  'agent-123',
  'content.article',
  'Publish blog post: "10 AI Tips"',
  [
    { name: 'content_quality', score: 90, weight: 30 },
    { name: 'grammar_check', score: 95, weight: 20 },
    { name: 'seo_optimization', score: 80, weight: 15 },
    { name: 'brand_consistency', score: 70, weight: 20 },
    { name: 'factual_accuracy', score: 85, weight: 15 },
  ],
  {
    description: 'AI-generated blog post ready for review',
    previewData: { wordCount: 1500, readingTime: '7 min' },
    priority: 'medium',
    sourceModule: 'content-agent',
    sourceId: 'article-456',
  }
);

// Result:
// - If confidence >= 85%: auto_approved
// - If confidence 60-84%: pending (quick review)
// - If confidence < 60%: pending (full review)
```

### Configuring Escalation

```typescript
// Update escalation config
await approvalsService.updateEscalationConfig(workspaceId, {
  enableEscalation: true,
  escalationCheckIntervalMinutes: 30, // Check every 30 minutes
  escalationTargetUserId: 'user-owner-123',
  enableEscalationNotifications: true,
});
```

### Manual Escalation Trigger (Testing)

```typescript
import { EscalationSchedulerService } from './approvals/services/escalation-scheduler.service';

// Manually trigger escalation check
const result = await escalationScheduler.triggerManually();
// Returns: { jobId, status: 'queued', message }
```

## BullMQ Queue Configuration

### Queue Registration

Queue is registered in `ApprovalsModule`:

```typescript
BullModule.registerQueue({
  name: 'approval-escalation',
})
```

### Global Connection

Redis connection configured in `AppModule`:

```typescript
BullModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    connection: {
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      password: configService.get('REDIS_PASSWORD'),
    },
  }),
})
```

### Job Schedule

- **Job Name**: `check-escalations`
- **Schedule**: Every 15 minutes (`*/15 * * * *`)
- **Processor**: `EscalationProcessor`
- **Service**: `ApprovalEscalationService.processAllWorkspaces()`

## Environment Variables

```env
# Redis Configuration (required for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Optional
```

## Testing

### Unit Tests

```bash
# Run all approval tests
npm test -- approvals

# Run specific test files
npm test -- approvals.service.spec.ts
npm test -- approval-escalation.service.spec.ts
npm test -- escalation.processor.spec.ts
```

### Integration Tests

```bash
# Run integration tests
npm test -- --testPathPattern=integration
```

### Manual Testing

```typescript
// 1. Create approval with short due date
const approval = await approvalRouter.routeApproval(
  workspaceId,
  'test-agent',
  'test.approval',
  'Test Approval',
  [{ name: 'test', score: 70, weight: 100 }],
  { priority: 'urgent' } // Due in 4 hours
);

// 2. Manually set dueAt to past date
await prisma.approvalItem.update({
  where: { id: approval.id },
  data: { dueAt: new Date(Date.now() - 1000 * 60 * 60) } // 1 hour ago
});

// 3. Trigger escalation manually
const result = await escalationScheduler.triggerManually();

// 4. Verify escalation
const escalated = await prisma.approvalItem.findUnique({
  where: { id: approval.id }
});
console.log(escalated.escalatedAt); // Should be set
console.log(escalated.escalatedToId); // Should have target user ID
```

## Future Enhancements

- [ ] Multi-level escalation chains (Story 04-9+)
- [ ] Real email/SMS notifications (Epic 05)
- [ ] Custom escalation rules per approval type
- [ ] Escalation history tracking
- [ ] Configurable escalation delays
- [ ] Re-escalation after timeout
- [ ] Escalation SLA tracking
- [ ] Escalation analytics dashboard

## Related Stories

- **04-1**: Confidence Calculator Service (dependency)
- **04-2**: Approval Queue API Endpoints (dependency)
- **04-3**: Approval Router (dependency)
- **04-4**: Approval Queue Dashboard
- **04-5**: Approval Card Component
- **04-6**: AI Reasoning Display
- **04-7**: Bulk Approval
- **04-8**: Approval Escalation (this story)
- **04-9**: Approval Audit Trail (next)
- **05-2**: Event Publisher (future - real events)

## Support

For questions or issues, contact the platform team or refer to:
- Epic: [EPIC-04 - Approval Queue System](../../docs/epics/EPIC-04-approval-system.md)
- Tech Spec: [Tech Spec - Epic 04](../../docs/sprint-artifacts/tech-spec-epic-04.md)
- Story: [Story 04-8](../../docs/stories/04-8-implement-approval-escalation.md)
