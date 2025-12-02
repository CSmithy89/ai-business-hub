# Epic Technical Specification: Approval Queue System

Date: 2025-12-02
Author: chris
Epic ID: EPIC-04
Status: Draft

---

## Overview

Epic 04 implements the **Approval Queue System** with confidence-based routing for the HYVVE platform. This epic delivers the core differentiator of the 90/5 promise: AI agents work autonomously while surfacing important decisions for human review through intelligent confidence scoring and routing.

The approval system enables:
- **Auto-approval** for high-confidence actions (>85%) - execute immediately
- **Quick review** for medium-confidence actions (60-85%) - 1-click approval
- **Full review** for low-confidence actions (<60%) - detailed AI reasoning displayed

This epic integrates the **Approval Agent** with AgentOS runtime, establishing the NestJS↔AgentOS bridge pattern that will be used by all future AI agents. The Control Plane at os.agno.com provides monitoring, session management, and memory visualization for all agent interactions.

## Objectives and Scope

### In Scope

- **Confidence Scoring Engine**: ConfidenceCalculatorService with weighted factor analysis
- **Approval Routing Logic**: ApprovalRouterService for confidence-based queue assignment
- **Approval CRUD APIs**: REST endpoints for list, detail, approve, reject, bulk operations
- **Approval Queue Dashboard**: Filterable, sortable list with real-time updates
- **Approval Card Component**: Confidence visualization, AI reasoning display
- **Bulk Actions**: Multi-select approve/reject with progress tracking
- **Escalation System**: BullMQ scheduled jobs for overdue approval escalation
- **Audit Trail**: Complete logging of all approval decisions to audit_logs table
- **Approval Agent (AgentOS)**: Agno-based agent with HITL tools (`requires_confirmation`)
- **NestJS↔AgentOS Bridge**: HTTP client service with JWT passthrough and SSE streaming
- **Control Plane Integration**: Connection configuration for agent monitoring at os.agno.com

### Out of Scope

- Custom approval workflows (Growth feature)
- Approval templates (Growth feature)
- SLA-based routing (Enterprise feature)
- Approval delegation chains (Enterprise feature)
- Mobile app approval interface (Growth feature)
- Email-based approvals (Growth feature)
- Advanced analytics/reporting (Growth feature)

---

## System Architecture Alignment

### Components Referenced

| Component | Purpose | Package |
|-----------|---------|---------|
| ConfidenceCalculatorService | Calculate weighted confidence scores | `apps/api/src/approvals/confidence-calculator.service.ts` |
| ApprovalRouterService | Route approvals based on confidence thresholds | `apps/api/src/approvals/approval-router.service.ts` |
| ApprovalsService | CRUD operations, business logic | `apps/api/src/approvals/approvals.service.ts` |
| ApprovalEscalationService | Scheduled escalation jobs | `apps/api/src/approvals/approval-escalation.service.ts` |
| AgentOSService | NestJS↔AgentOS bridge | `apps/api/src/agentos/agentos.service.ts` |
| ApprovalAgent | Agno-based approval agent | `agents/platform/approval_agent.py` |
| Approval Queue Dashboard | Frontend list view | `apps/web/src/app/(dashboard)/approvals/page.tsx` |
| Approval Card Component | Confidence visualization | `apps/web/src/components/approval/approval-card.tsx` |
| ApprovalItem Prisma Model | Database schema | `packages/db/prisma/schema.prisma` |

### Architecture Constraints

- **ADR-002**: Hybrid API - Approvals are NestJS module APIs, not Next.js API routes
- **ADR-003**: Defense-in-depth multi-tenancy - ApprovalItem requires RLS policies
- **ADR-004**: Redis Streams for event bus - Emit `approval.requested`, `approval.approved`, `approval.rejected` events
- **ADR-007**: AgentOS for agent runtime - Approval Agent runs in Python/FastAPI AgentOS service
- JWT claims must include `workspaceId` for tenant context (already implemented in Epic 01/02)
- All approval actions must be logged to `audit_logs` table (Epic 03 implementation)
- BullMQ queues require Redis connection (already configured in Epic 00)
- Control Plane connection is browser-based, no data sent to Agno servers

---

## Detailed Design

### Services and Modules

| Service | Responsibility | Location | Owner |
|---------|---------------|----------|-------|
| ConfidenceCalculatorService | Calculate confidence scores from factors, return recommendation | `apps/api/src/approvals/confidence-calculator.service.ts` | Backend |
| ApprovalRouterService | Route approvals by confidence threshold, assign default approver | `apps/api/src/approvals/approval-router.service.ts` | Backend |
| ApprovalsService | CRUD operations, approval lifecycle management | `apps/api/src/approvals/approvals.service.ts` | Backend |
| ApprovalEscalationService | Check for overdue approvals, escalate to next level | `apps/api/src/approvals/approval-escalation.service.ts` | Backend |
| AgentOSService | HTTP client for AgentOS, JWT passthrough, SSE streaming | `apps/api/src/agentos/agentos.service.ts` | Backend |
| ApprovalsController | REST API endpoints | `apps/api/src/approvals/approvals.controller.ts` | Backend |
| ApprovalAgent | Conversational approval management, HITL tools | `agents/platform/approval_agent.py` | AgentOS |
| ApprovalQueue (component) | Dashboard list view | `apps/web/src/app/(dashboard)/approvals/page.tsx` | Frontend |
| ApprovalCard (component) | Confidence visualization, action buttons | `apps/web/src/components/approval/approval-card.tsx` | Frontend |

### Data Models and Contracts

**New Prisma Model (packages/db/prisma/schema.prisma):**

```prisma
model ApprovalItem {
  id              String   @id @default(uuid())
  workspaceId     String   @map("workspace_id")

  // Item details
  type            String   // 'content', 'email', 'campaign', 'deal', 'integration', 'agent_action'
  title           String
  description     String?  @db.Text
  previewData     Json?    @map("preview_data")

  // Confidence scoring
  confidenceScore Float    @map("confidence_score")  // 0-100
  factors         Json     // ConfidenceFactor[]
  aiReasoning     String?  @map("ai_reasoning") @db.Text

  // Routing
  status          String   @default("pending") // 'pending', 'approved', 'rejected', 'auto_approved', 'escalated'
  recommendation  String   // 'approve', 'review', 'full_review'
  reviewType      String   @map("review_type") // 'auto', 'quick', 'full'
  priority        String   @default("medium") // 'low', 'medium', 'high', 'urgent'

  // Assignment
  assignedToId    String?  @map("assigned_to_id")
  assignedAt      DateTime? @map("assigned_at")

  // Escalation
  dueAt           DateTime @map("due_at")
  escalatedAt     DateTime? @map("escalated_at")
  escalatedToId   String?  @map("escalated_to_id")

  // Decision
  decidedById     String?  @map("decided_by_id")
  decidedAt       DateTime? @map("decided_at")
  decisionNotes   String?  @map("decision_notes") @db.Text

  // Agent context
  agentId         String?  @map("agent_id")
  agentRunId      String?  @map("agent_run_id")

  // Related entities
  sourceModule    String?  @map("source_module")  // 'crm', 'content', 'campaign'
  sourceId        String?  @map("source_id")

  // Audit
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  assignedTo      User?     @relation("AssignedApprovals", fields: [assignedToId], references: [id])
  decidedBy       User?     @relation("DecidedByApprovals", fields: [decidedById], references: [id])
  escalatedTo     User?     @relation("EscalatedApprovals", fields: [escalatedToId], references: [id])

  @@index([workspaceId, status])
  @@index([workspaceId, dueAt])
  @@index([assignedToId, status])
  @@index([status, priority])
  @@map("approval_items")
}
```

**Confidence Factor Structure:**

```typescript
interface ConfidenceFactor {
  factor: string;           // 'historical_accuracy', 'data_quality', 'risk_level', 'user_preference'
  score: number;            // 0-100
  weight: number;           // 0-1 (weights sum to 1.0)
  explanation: string;      // Human-readable explanation
  concerning?: boolean;     // Flag for red highlighting
}

interface ConfidenceResult {
  overallScore: number;     // 0-100 weighted average
  factors: ConfidenceFactor[];
  recommendation: 'approve' | 'review' | 'full_review';
  reasoning?: string;       // Optional AI-generated reasoning for low confidence
}
```

**Preview Data Structure:**

```typescript
interface PreviewData {
  // Type-specific preview content
  [key: string]: any;

  // Example for content approval:
  // { contentType: 'blog_post', title: '...', excerpt: '...' }

  // Example for email approval:
  // { subject: '...', preview: '...', recipients: 100 }
}
```

**Update to User Model:**

```prisma
model User {
  // ... existing fields ...

  assignedApprovals ApprovalItem[] @relation("AssignedApprovals")
  decidedApprovals  ApprovalItem[] @relation("DecidedByApprovals")
  escalatedApprovals ApprovalItem[] @relation("EscalatedApprovals")
}
```

**Update to Workspace Model:**

```prisma
model Workspace {
  // ... existing fields ...

  approvals ApprovalItem[]
}
```

### APIs and Interfaces

**NestJS Controller Endpoints:**

```typescript
// apps/api/src/approvals/approvals.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../common/guards/auth.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentWorkspace } from '../common/decorators/current-workspace.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('approvals')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class ApprovalsController {

  @Get()
  @Roles('admin', 'owner', 'member')
  async listApprovals(
    @CurrentWorkspace() workspaceId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Returns paginated list with filters
  }

  @Get(':id')
  @Roles('admin', 'owner', 'member')
  async getApproval(@Param('id') id: string) {
    // Returns full approval details with AI reasoning
  }

  @Post(':id/approve')
  @Roles('admin', 'owner')
  async approveItem(
    @Param('id') id: string,
    @Body() dto: ApproveItemDto,
    @CurrentUser() user: User,
  ) {
    // Approve approval item with optional notes
  }

  @Post(':id/reject')
  @Roles('admin', 'owner')
  async rejectItem(
    @Param('id') id: string,
    @Body() dto: RejectItemDto,
    @CurrentUser() user: User,
  ) {
    // Reject approval item with required reason
  }

  @Post('bulk')
  @Roles('admin', 'owner')
  async bulkAction(
    @Body() dto: BulkActionDto,
    @CurrentUser() user: User,
  ) {
    // Bulk approve/reject multiple items
  }
}
```

**DTOs:**

```typescript
// apps/api/src/approvals/dto/approve-item.dto.ts
export class ApproveItemDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

// apps/api/src/approvals/dto/reject-item.dto.ts
export class RejectItemDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// apps/api/src/approvals/dto/bulk-action.dto.ts
export class BulkActionDto {
  @IsArray()
  @ArrayMinSize(1)
  ids: string[];

  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateIf(o => o.action === 'reject')
  @IsString()
  @IsNotEmpty()
  reason?: string;
}

// apps/api/src/approvals/dto/create-approval-item.dto.ts
export class CreateApprovalItemDto {
  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  previewData?: any;

  @IsArray()
  factors: ConfidenceFactor[];

  @IsOptional()
  @IsString()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsString()
  agentRunId?: string;

  @IsOptional()
  @IsString()
  sourceModule?: string;

  @IsOptional()
  @IsString()
  sourceId?: string;
}
```

**API Endpoint Summary:**

| Method | Endpoint | Description | Auth | Request | Response |
|--------|----------|-------------|------|---------|----------|
| GET | `/api/approvals` | List approvals with filters | Owner/Admin/Member | Query params | Paginated list |
| GET | `/api/approvals/:id` | Get approval details | Owner/Admin/Member | - | Full approval |
| POST | `/api/approvals/:id/approve` | Approve item | Owner/Admin | `{ notes? }` | Updated item |
| POST | `/api/approvals/:id/reject` | Reject item | Owner/Admin | `{ reason, notes? }` | Updated item |
| POST | `/api/approvals/bulk` | Bulk action | Owner/Admin | `{ ids[], action, notes?, reason? }` | Updated items |

**AgentOS Service Interface:**

```typescript
// apps/api/src/agentos/agentos.service.ts
@Injectable()
export class AgentOSService {
  private readonly httpService: HttpService;
  private readonly agentosUrl: string;

  constructor(private configService: ConfigService) {
    this.agentosUrl = this.configService.get('AGENTOS_URL', 'http://localhost:7777');
    this.httpService = new HttpService();
  }

  /**
   * Invoke an agent run
   */
  async invokeAgent(
    agentId: string,
    params: AgentParams,
    jwt: string,
  ): Promise<AgentRunResponse> {
    const response = await this.httpService.post(
      `${this.agentosUrl}/agents/${agentId}/runs`,
      params,
      {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }

  /**
   * Get agent run status
   */
  async getAgentRun(runId: string, jwt: string): Promise<AgentRun> {
    const response = await this.httpService.get(
      `${this.agentosUrl}/runs/${runId}`,
      {
        headers: { 'Authorization': `Bearer ${jwt}` },
      },
    );

    return response.data;
  }

  /**
   * Stream agent response via SSE
   */
  streamAgentResponse(runId: string, jwt: string): Observable<AgentChunk> {
    // Return SSE observable
    // Implementation uses EventSource or similar
  }
}
```

### Workflows and Sequencing

**Confidence Calculation Flow:**

```
Agent Action Request
      |
      v
┌──────────────────────────┐
│ Validate Request         │
│ - Check required fields  │
│ - Validate factors       │
└───────────┬──────────────┘
            |
            v
┌──────────────────────────┐
│ ConfidenceCalculator     │
│ - Weight factors         │
│ - Calculate score        │
│ - Generate reasoning     │
└───────────┬──────────────┘
            |
            v
┌──────────────────────────┐
│ Determine Recommendation │
│ >85% → approve           │
│ 60-85% → review          │
│ <60% → full_review       │
└───────────┬──────────────┘
            |
            v
┌──────────────────────────┐
│ Return ConfidenceResult  │
└──────────────────────────┘
```

**Approval Routing Flow:**

```
ConfidenceResult
      |
      v
┌──────────────────────────┐
│ ApprovalRouter           │
│ - Check threshold        │
│ - Determine status       │
│ - Set review type        │
└───────────┬──────────────┘
            |
      ┌─────┴─────┐
      |           |
  >85%         <85%
      |           |
      v           v
┌─────────┐ ┌─────────┐
│Auto     │ │Create   │
│Approve  │ │Pending  │
│         │ │Item     │
└────┬────┘ └────┬────┘
     |           |
     v           v
┌─────────────────────────┐
│ Emit Event              │
│ - approval.approved     │
│ - approval.requested    │
└────────┬────────────────┘
         |
         v
┌────────────────────────┐
│ Audit Log              │
└────────────────────────┘
```

**Approval Decision Flow:**

```
User Opens Queue
      |
      v
┌────────────────────────┐
│ List Approvals         │
│ - Filter by status     │
│ - Sort by due date     │
└────────┬───────────────┘
         |
         v
┌────────────────────────┐
│ Select Item            │
│ - View details         │
│ - View AI reasoning    │
└────────┬───────────────┘
         |
    ┌────┴────┐
    |         |
Approve   Reject
    |         |
    v         v
┌────────┐ ┌────────┐
│Update  │ │Update  │
│Status  │ │Status  │
│Add     │ │Add     │
│Notes   │ │Reason  │
└───┬────┘ └───┬────┘
    |         |
    └────┬────┘
         |
         v
┌────────────────────────┐
│ Emit Event             │
│ - approval.approved    │
│ - approval.rejected    │
└────────┬───────────────┘
         |
         v
┌────────────────────────┐
│ Create Audit Log       │
└────────┬───────────────┘
         |
         v
┌────────────────────────┐
│ Notify Requestor       │
└────────────────────────┘
```

**Escalation Flow (BullMQ Job):**

```
Cron: Every 15 minutes
      |
      v
┌────────────────────────┐
│ Query Overdue Items    │
│ WHERE status='pending' │
│ AND dueAt < NOW()      │
└────────┬───────────────┘
         |
         v
┌────────────────────────┐
│ For Each Item:         │
│ - Find escalation      │
│   target (owner/admin) │
│ - Update item          │
│ - Set escalatedAt      │
│ - Set escalatedToId    │
└────────┬───────────────┘
         |
         v
┌────────────────────────┐
│ Emit Event             │
│ - approval.escalated   │
└────────┬───────────────┘
         |
         v
┌────────────────────────┐
│ Notify Escalation      │
│ Target                 │
└────────────────────────┘
```

**NestJS↔AgentOS Integration Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│   User interacts with Approval Agent via chat interface     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ POST /api/agentos/agent/approval/chat
                            │ Authorization: Bearer <jwt>
                            │
                            v
┌─────────────────────────────────────────────────────────────┐
│                        NestJS API                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ApprovalsController                                   │  │
│  │ - Extract JWT from request                           │  │
│  │ - Validate workspace context                         │  │
│  └─────────────┬────────────────────────────────────────┘  │
│                │                                             │
│                v                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ AgentOSService                                        │  │
│  │ - Forward request to AgentOS                         │  │
│  │ - Pass JWT in Authorization header                   │  │
│  │ - Handle response/streaming                          │  │
│  └─────────────┬────────────────────────────────────────┘  │
│                │                                             │
└────────────────┼─────────────────────────────────────────────┘
                 │
                 │ HTTP POST http://agentos:7777/agents/approval/runs
                 │ Authorization: Bearer <jwt>
                 │
                 v
┌─────────────────────────────────────────────────────────────┐
│                     AgentOS (Python)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ TenantMiddleware                                      │  │
│  │ - Decode JWT                                         │  │
│  │ - Extract workspace_id from claims                   │  │
│  │ - Inject into request.state                          │  │
│  └─────────────┬────────────────────────────────────────┘  │
│                │                                             │
│                v                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ApprovalAgent (Agno)                                  │  │
│  │ - Access workspace context                           │  │
│  │ - Execute agent logic                                │  │
│  │ - Call approval tools (requires_confirmation=True)   │  │
│  │ - Return response                                    │  │
│  └─────────────┬────────────────────────────────────────┘  │
│                │                                             │
└────────────────┼─────────────────────────────────────────────┘
                 │
                 │ Database Query (PostgreSQL)
                 │ SET LOCAL app.tenant_id = <workspace_id>
                 │
                 v
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL                               │
│  - approval_items (RLS enforced)                            │
│  - agent_sessions                                           │
│  - agent_memories                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Confidence calculation | < 100ms | Function execution time |
| Approval list query (100 items) | < 200ms | Database query + serialization |
| Approval detail query | < 50ms | Single record fetch |
| Approval action (approve/reject) | < 300ms | Update + event + audit log |
| Bulk action (10 items) | < 2 seconds | Sequential processing |
| Escalation job execution | < 5 seconds | Full job run (all workspaces) |
| AgentOS invocation | < 1 second | HTTP round-trip time |
| SSE streaming latency | < 100ms | First chunk to client |

### Security

| Requirement | Implementation | Reference |
|-------------|---------------|-----------|
| Tenant isolation | RLS + Prisma Extension on ApprovalItem | ADR-003 |
| Role-based access | Admin/Owner only for approve/reject | Epic 03 |
| Audit logging | All approval actions logged | AC-04.9 |
| JWT validation | AuthGuard validates token | Epic 01 |
| Workspace context | TenantGuard validates membership | Epic 02 |
| Confidence score integrity | Server-side calculation only | Security best practice |
| AgentOS authentication | JWT passthrough from better-auth | ADR-007 |

**Security Testing Requirements:**

- Test cross-tenant access blocked (RLS)
- Test non-admin cannot approve/reject
- Test confidence score cannot be manipulated
- Test audit log immutability
- Test bulk action permission checks
- Test AgentOS JWT validation

### Reliability/Availability

- Approval creation must succeed even if event emission fails (non-blocking)
- Audit logging must not block approval actions (async)
- Escalation job must handle partial failures (continue processing other items)
- AgentOS unavailability should not break approval UI (graceful degradation)
- Bulk actions must handle partial failures (return success/failure per item)
- Control Plane connection failure should not affect agent functionality

### Observability

| Signal | Type | Purpose |
|--------|------|---------|
| `approval.created` | Event | Track approval creation |
| `approval.approved` | Event | Track approval decisions |
| `approval.rejected` | Event | Track approval decisions |
| `approval.escalated` | Event | Track escalation events |
| `approval.auto_approved` | Event | Track auto-approval usage |
| `approval.bulk_action` | Event | Track bulk operations |
| `approval.confidence.low` | Metric | Monitor low-confidence items |
| `approval.escalation.timeout` | Alert | Alert on escalation failures |
| `agentos.invocation.latency` | Metric | Monitor AgentOS performance |
| `agentos.invocation.error` | Alert | Alert on AgentOS failures |

**Logging Requirements:**

```typescript
// Confidence calculation
logger.info('Confidence calculated', {
  approvalId: item.id,
  score: result.overallScore,
  recommendation: result.recommendation,
  factorCount: result.factors.length,
});

// Routing decision
logger.info('Approval routed', {
  approvalId: item.id,
  reviewType: item.reviewType,
  status: item.status,
  assignedTo: item.assignedToId,
});

// Approval decision
logger.info('Approval decided', {
  approvalId: item.id,
  decision: 'approved', // or 'rejected'
  decidedBy: user.id,
  durationMs: decidedAt - createdAt,
});

// Escalation
logger.warn('Approval escalated', {
  approvalId: item.id,
  originalAssignee: item.assignedToId,
  escalatedTo: item.escalatedToId,
  overdueBy: now - item.dueAt,
});

// AgentOS invocation
logger.info('AgentOS invoked', {
  agentId: 'approval',
  runId: response.runId,
  duration: response.duration,
});
```

---

## Dependencies and Integrations

### npm Dependencies (Already Installed)

All required dependencies installed in Epic 00-03:
- `@nestjs/common`, `@nestjs/core` - NestJS framework
- `@nestjs/bull` - BullMQ integration
- `bull` - Queue management
- `@prisma/client` - Database access
- `class-validator`, `class-transformer` - DTO validation
- `@nestjs/axios` - HTTP client
- `rxjs` - Reactive programming

### Database Migration

```sql
-- Migration: Add ApprovalItem model
-- packages/db/prisma/migrations/XXXXXX_add_approval_items/migration.sql

-- Create approval_items table
CREATE TABLE "approval_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,

  -- Item details
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "preview_data" JSONB,

  -- Confidence scoring
  "confidence_score" DOUBLE PRECISION NOT NULL,
  "factors" JSONB NOT NULL,
  "ai_reasoning" TEXT,

  -- Routing
  "status" TEXT NOT NULL DEFAULT 'pending',
  "recommendation" TEXT NOT NULL,
  "review_type" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'medium',

  -- Assignment
  "assigned_to_id" TEXT,
  "assigned_at" TIMESTAMP(3),

  -- Escalation
  "due_at" TIMESTAMP(3) NOT NULL,
  "escalated_at" TIMESTAMP(3),
  "escalated_to_id" TEXT,

  -- Decision
  "decided_by_id" TEXT,
  "decided_at" TIMESTAMP(3),
  "decision_notes" TEXT,

  -- Agent context
  "agent_id" TEXT,
  "agent_run_id" TEXT,

  -- Related entities
  "source_module" TEXT,
  "source_id" TEXT,

  -- Audit
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "approval_items_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "approval_items_assigned_to_id_fkey"
    FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT "approval_items_decided_by_id_fkey"
    FOREIGN KEY ("decided_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT "approval_items_escalated_to_id_fkey"
    FOREIGN KEY ("escalated_to_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for approval queries
CREATE INDEX "approval_items_workspace_id_status_idx"
  ON "approval_items"("workspace_id", "status");

CREATE INDEX "approval_items_workspace_id_due_at_idx"
  ON "approval_items"("workspace_id", "due_at");

CREATE INDEX "approval_items_assigned_to_id_status_idx"
  ON "approval_items"("assigned_to_id", "status");

CREATE INDEX "approval_items_status_priority_idx"
  ON "approval_items"("status", "priority");

-- Enable RLS on approval_items
ALTER TABLE "approval_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "approval_items"
  FOR ALL
  USING (workspace_id::text = current_setting('app.tenant_id', true));
```

### Epic Dependencies

- **Epic 00** (Complete): Turborepo, Next.js, NestJS, Prisma, Docker, AgentOS environment
- **Epic 01** (Complete): Authentication, JWT tokens, session management
- **Epic 02** (Complete): Workspace management, member roles
- **Epic 03** (Complete): RBAC guards, RLS policies, audit logging

---

## Acceptance Criteria (Authoritative)

### AC-04.1: Confidence Calculator Service

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.1.1 | Service created | Given ConfidenceCalculatorService, when instantiated, then service is available |
| AC-04.1.2 | Factor interface defined | Given ConfidenceFactor type, when imported, then type has score, weight, explanation fields |
| AC-04.1.3 | Weighted average calculated | Given factors with weights summing to 1.0, when calculate(), then overallScore is weighted average |
| AC-04.1.4 | Recommendation returned | Given overallScore, when >85, then recommendation is 'approve'; when 60-85, then 'review'; when <60, then 'full_review' |
| AC-04.1.5 | Calculation logged | Given calculate() called, when completed, then confidence calculation logged with score and factors |
| AC-04.1.6 | Thresholds configurable | Given workspace settings, when calculate(), then uses workspace-specific thresholds (not hardcoded) |

### AC-04.2: Approval Queue API Endpoints

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.2.1 | List endpoint exists | Given GET /api/approvals, when called with valid JWT, then returns paginated list |
| AC-04.2.2 | Filtering works | Given status filter, when GET /api/approvals?status=pending, then only pending items returned |
| AC-04.2.3 | Sorting works | Given sort parameter, when GET /api/approvals?sort=dueAt, then items sorted by due date |
| AC-04.2.4 | Detail endpoint exists | Given GET /api/approvals/:id, when called, then returns full approval with factors and reasoning |
| AC-04.2.5 | Approve endpoint exists | Given POST /api/approvals/:id/approve, when called by admin, then item status set to 'approved' |
| AC-04.2.6 | Reject endpoint exists | Given POST /api/approvals/:id/reject with reason, when called, then item status set to 'rejected' |
| AC-04.2.7 | Bulk endpoint exists | Given POST /api/approvals/bulk with ids array, when called, then all items updated |
| AC-04.2.8 | Tenant guard applied | Given user not in workspace, when calling any endpoint, then 403 Forbidden |
| AC-04.2.9 | Roles guard applied | Given member calling approve endpoint, when not admin/owner, then 403 Forbidden |

### AC-04.3: Approval Router

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.3.1 | Router service created | Given ApprovalRouterService, when instantiated, then service available |
| AC-04.3.2 | Auto-approve routing | Given confidenceScore > 85, when route(), then status set to 'auto_approved' |
| AC-04.3.3 | Quick review routing | Given confidenceScore 60-85, when route(), then status 'pending' with reviewType 'quick' |
| AC-04.3.4 | Full review routing | Given confidenceScore < 60, when route(), then status 'pending' with reviewType 'full' |
| AC-04.3.5 | Due date set | Given priority, when route(), then dueAt set (default 48 hours, urgent 24 hours) |
| AC-04.3.6 | Default assignee set | Given workspace settings, when route(), then assignedToId set to default approver or owner |
| AC-04.3.7 | Event emitted | Given routing complete, when successful, then 'approval.requested' or 'approval.approved' event emitted |
| AC-04.3.8 | Audit logged | Given routing complete, when successful, then audit log created with routing decision |

### AC-04.4: Approval Queue Dashboard

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.4.1 | Page exists | Given /approvals route, when navigated, then dashboard page renders |
| AC-04.4.2 | Columns displayed | Given approval list, when rendered, then shows Title, Type, Confidence, Priority, Due columns |
| AC-04.4.3 | Filter controls | Given filter dropdowns, when status selected, then list filtered by status |
| AC-04.4.4 | Sort controls | Given column header click, when clicked, then list sorted by that column |
| AC-04.4.5 | Stats displayed | Given pending approvals, when dashboard loads, then shows pending count and urgent count |
| AC-04.4.6 | Badge on sidebar | Given pending approvals, when sidebar rendered, then badge shows count |
| AC-04.4.7 | Responsive design | Given tablet/desktop viewport, when resized, then layout adapts |

### AC-04.5: Approval Card Component

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.5.1 | Component created | Given ApprovalCard component, when rendered with approval, then displays correctly |
| AC-04.5.2 | Confidence color indicator | Given confidenceScore > 85, when rendered, then shows green; 60-85 yellow; <60 red |
| AC-04.5.3 | AI recommendation shown | Given approval.recommendation, when rendered, then displays recommendation text |
| AC-04.5.4 | Preview data expandable | Given approval.previewData, when collapse button clicked, then preview expands/collapses |
| AC-04.5.5 | Action buttons | Given approval card, when rendered, then shows Approve and Reject buttons |
| AC-04.5.6 | Notes input | Given action button clicked, when modal opens, then notes input available |
| AC-04.5.7 | Loading states | Given approve clicked, when processing, then button shows loading spinner |
| AC-04.5.8 | Compact variant | Given variant='compact', when rendered, then shows minimal info (list view) |
| AC-04.5.9 | Expanded variant | Given variant='expanded', when rendered, then shows full details including AI reasoning |

### AC-04.6: AI Reasoning Display

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.6.1 | Reasoning text displayed | Given approval.aiReasoning, when rendered, then reasoning text shown |
| AC-04.6.2 | Factors breakdown shown | Given approval.factors, when rendered, then each factor displayed with name, score, weight |
| AC-04.6.3 | Factor explanation shown | Given factor.explanation, when rendered, then explanation text displayed |
| AC-04.6.4 | Concerning factors highlighted | Given factor.concerning = true, when rendered, then factor displayed in red |
| AC-04.6.5 | Collapsible section | Given reasoning section, when collapsed, then factors hidden; when expanded, then factors shown |
| AC-04.6.6 | Auto-expand for low confidence | Given confidenceScore < 60, when card rendered, then reasoning section auto-expanded |
| AC-04.6.7 | Related entities linked | Given approval.sourceModule and sourceId, when rendered, then link to entity displayed |

### AC-04.7: Bulk Approval

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.7.1 | Checkboxes added | Given approval list, when rendered, then each item has checkbox |
| AC-04.7.2 | Selected count shown | Given items selected, when checked, then count displayed (e.g. "3 selected") |
| AC-04.7.3 | Bulk buttons shown | Given items selected, when count > 0, then Approve All and Reject All buttons appear |
| AC-04.7.4 | Bulk notes input | Given bulk action clicked, when modal opens, then notes input available for all items |
| AC-04.7.5 | Confirmation dialog | Given bulk action clicked, when confirmed, then confirmation dialog shows before processing |
| AC-04.7.6 | Progress shown | Given bulk action processing, when in progress, then progress bar shows X of Y completed |
| AC-04.7.7 | Partial failures handled | Given bulk action with failure, when completed, then shows success count and error count |

### AC-04.8: Approval Escalation

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.8.1 | Scheduled job exists | Given BullMQ queue, when escalation job scheduled, then job runs every 15 minutes |
| AC-04.8.2 | Overdue items queried | Given job runs, when executed, then queries approvals WHERE status='pending' AND dueAt < NOW() |
| AC-04.8.3 | Escalation target found | Given overdue approval, when escalating, then finds workspace owner or admin as target |
| AC-04.8.4 | Approval updated | Given escalation, when completed, then escalatedAt and escalatedToId set |
| AC-04.8.5 | Event emitted | Given escalation complete, when successful, then 'approval.escalated' event emitted |
| AC-04.8.6 | Notification sent | Given escalation complete, when successful, then notification sent to escalation target |
| AC-04.8.7 | Escalation chain configurable | Given workspace settings, when escalating, then follows configured escalation chain |

### AC-04.9: Approval Audit Trail

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.9.1 | Audit log on approve | Given approval approved, when completed, then audit log created with action='approval_approved' |
| AC-04.9.2 | Audit log on reject | Given approval rejected, when completed, then audit log created with action='approval_rejected' |
| AC-04.9.3 | Audit log on auto-approve | Given auto-approval, when completed, then audit log created with AI reasoning |
| AC-04.9.4 | Before/after captured | Given approval decision, when logged, then oldValues and newValues fields populated |
| AC-04.9.5 | Actor recorded | Given decision, when logged, then userId and actorRole fields set |
| AC-04.9.6 | IP and user agent captured | Given request, when logged, then ipAddress and userAgent saved |
| AC-04.9.7 | Audit view in detail | Given approval detail page, when rendered, then audit trail section shows all related logs |

### AC-04.10: Approval Agent with AgentOS

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.10.1 | Agent implemented | Given `agents/platform/approval_agent.py`, when file exists, then Agno-based ApprovalAgent defined |
| AC-04.10.2 | Agent registered | Given AgentOS runtime, when started, then approval agent accessible at /agents/approval/runs |
| AC-04.10.3 | request_approval tool | Given agent tools, when agent.tools, then `request_approval` tool exists with requires_confirmation=True |
| AC-04.10.4 | get_pending_approvals tool | Given agent tools, when agent.tools, then `get_pending_approvals` tool exists |
| AC-04.10.5 | approve_item tool | Given agent tools, when agent.tools, then `approve_item` tool exists with requires_confirmation=True |
| AC-04.10.6 | reject_item tool | Given agent tools, when agent.tools, then `reject_item` tool exists with requires_confirmation=True |
| AC-04.10.7 | Workspace context injected | Given JWT with workspace_id claim, when agent invoked, then workspace context available in tools |
| AC-04.10.8 | AgentOS API tested | Given POST /agents/approval/runs, when called with valid JWT, then returns agent response |
| AC-04.10.9 | Control Plane visible | Given agent session, when viewing Control Plane, then session appears in UI |

### AC-04.11: Control Plane Connection

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.11.1 | AgentOS configured | Given AgentOS config, when AGNO_CONTROL_PLANE_URL set, then connects to os.agno.com |
| AC-04.11.2 | Sessions visible | Given agent run, when viewing Control Plane, then session visible in Sessions list |
| AC-04.11.3 | Memories accessible | Given agent with memory, when viewing Control Plane, then memory entries displayed |
| AC-04.11.4 | Session history works | Given session, when clicking in Control Plane, then conversation history loaded |
| AC-04.11.5 | Team documented | Given documentation, when team members read, then instructions for accessing Control Plane included |
| AC-04.11.6 | Data stays local | Given Control Plane connection, when used, then verified no data sent to Agno servers (browser-only) |

### AC-04.12: NestJS↔AgentOS Bridge

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-04.12.1 | Service created | Given AgentOSService, when instantiated in NestJS, then service available |
| AC-04.12.2 | invokeAgent method | Given invokeAgent(agentId, params), when called, then HTTP POST to AgentOS with JWT |
| AC-04.12.3 | getAgentRun method | Given getAgentRun(runId), when called, then returns agent run status |
| AC-04.12.4 | streamAgentResponse method | Given streamAgentResponse(runId), when called, then returns SSE observable |
| AC-04.12.5 | JWT passthrough | Given request with JWT, when invokeAgent(), then JWT passed in Authorization header |
| AC-04.12.6 | Error handling | Given AgentOS unavailable, when invokeAgent(), then graceful error returned (not crash) |
| AC-04.12.7 | Retry logic | Given timeout, when invokeAgent() fails, then retries with exponential backoff |
| AC-04.12.8 | Invocation logged | Given invokeAgent(), when called, then logs agent invocation with agentId, runId, duration |

---

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Approach |
|----|--------------|--------------|---------------|
| AC-04.1.x | Confidence Calculator | `apps/api/src/approvals/confidence-calculator.service.ts` | Unit: calculate() with various factors |
| AC-04.2.x | API Endpoints | `apps/api/src/approvals/approvals.controller.ts` | Integration: API tests with mock DB |
| AC-04.3.x | Approval Router | `apps/api/src/approvals/approval-router.service.ts` | Unit: route() with different scores |
| AC-04.4.x | Queue Dashboard | `apps/web/src/app/(dashboard)/approvals/page.tsx` | E2E: Playwright test navigation |
| AC-04.5.x | Approval Card | `apps/web/src/components/approval/approval-card.tsx` | Component: Storybook + unit tests |
| AC-04.6.x | AI Reasoning | `apps/web/src/components/approval/ai-reasoning.tsx` | Component: Storybook + unit tests |
| AC-04.7.x | Bulk Approval | `apps/web/src/components/approval/bulk-actions.tsx` | E2E: Playwright test selection |
| AC-04.8.x | Escalation | `apps/api/src/approvals/approval-escalation.service.ts` | Integration: BullMQ job test |
| AC-04.9.x | Audit Trail | `apps/api/src/audit/audit.service.ts` | Integration: verify logs created |
| AC-04.10.x | Approval Agent | `agents/platform/approval_agent.py` | Integration: AgentOS API tests |
| AC-04.11.x | Control Plane | AgentOS configuration | Manual: verify UI access |
| AC-04.12.x | NestJS Bridge | `apps/api/src/agentos/agentos.service.ts` | Integration: mock AgentOS server |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Confidence calculation accuracy | High | Iterative tuning with real data, A/B testing thresholds |
| AgentOS downtime blocking approvals | Medium | Graceful degradation: UI still works, agent unavailable message |
| Bulk action performance on large selections | Medium | Limit to 50 items max, progress tracking, abort capability |
| Escalation spam if too aggressive | Medium | Configurable escalation frequency per workspace |
| Control Plane connection issues | Low | Browser-based connection, not critical for functionality |

### Assumptions

- Redis is already configured and running (Epic 00)
- BullMQ queues are operational (Epic 00)
- JWT claims include `workspaceId` (Epic 01/02)
- Audit logging is functional (Epic 03)
- RLS policies are active (Epic 03)
- AgentOS runtime is deployed and accessible (Epic 00)
- better-auth JWT can be used for AgentOS authentication

### Open Questions

| Question | Owner | Resolution Deadline |
|----------|-------|---------------------|
| Should auto-approved items be shown in queue or hidden? | Product | Story 04.4 |
| What is the default escalation chain (owner → admin → ?)? | Product | Story 04.8 |
| Should we support approval comments/discussion threads? | Product | Post-Epic 04 (Growth) |
| Should confidence thresholds be workspace-level or user-level? | Product | Story 04.1 |
| Should AgentOS use same PostgreSQL or separate database? | Architecture | Story 04.10 |
| How should Control Plane access be shared with team? | Operations | Story 04.11 |

---

## Test Strategy Summary

### Test Levels

| Level | Scope | Tools | Coverage |
|-------|-------|-------|----------|
| Unit | Confidence calculator, router, utilities | Vitest | 100% of business logic |
| Integration | API endpoints, services, agent tools | Vitest + test DB | All API paths, agent flows |
| Component | React components (cards, dashboard) | Vitest + React Testing Library | All UI states |
| E2E | Full approval flows (create → approve → audit) | Playwright | Critical user journeys |
| Load | Bulk actions, escalation jobs | k6 | Performance targets |

### Test Data

- Seed workspaces with approval settings (thresholds, escalation chains)
- Seed approval items with varying confidence scores
- Seed users with different roles (owner, admin, member)
- Mock AgentOS responses for integration tests
- Mock confidence factors for calculator tests

### Coverage Targets

- Unit tests: 100% of ConfidenceCalculator, ApprovalRouter
- Integration tests: All API endpoints (GET, POST with various filters)
- Component tests: All card variants (compact, expanded, with/without reasoning)
- E2E tests: Owner approves/rejects, bulk actions, escalation flow
- Load tests: 100 concurrent approvals, 1000 items in queue

### Edge Cases to Test

- Confidence score exactly 85 (boundary)
- Confidence score exactly 60 (boundary)
- Approval with no assignee (fallback to owner)
- Escalation with no higher role available
- Bulk action with partial network failures
- AgentOS timeout during invocation
- Approval already decided by another user (race condition)
- Workspace with no default approver configured
- Auto-approved item later manually reviewed
- Control Plane disconnected (should not affect functionality)

---

## Story-by-Story Implementation Guide

### Story 04.1: Implement Confidence Calculator Service

**Key Files:**
- `apps/api/src/approvals/confidence-calculator.service.ts` - Main service
- `packages/shared/src/types/approval.ts` - TypeScript interfaces

**Implementation Notes:**

```typescript
// apps/api/src/approvals/confidence-calculator.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ConfidenceFactor {
  factor: string;
  score: number;        // 0-100
  weight: number;       // 0-1
  explanation: string;
  concerning?: boolean;
}

export interface ConfidenceResult {
  overallScore: number;
  factors: ConfidenceFactor[];
  recommendation: 'approve' | 'review' | 'full_review';
  reasoning?: string;
}

@Injectable()
export class ConfidenceCalculatorService {
  constructor(
    private configService: ConfigService,
    private logger: Logger,
  ) {}

  calculate(
    factors: ConfidenceFactor[],
    workspaceId: string,
  ): ConfidenceResult {
    // Validate weights sum to 1.0
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new BadRequestException('Factor weights must sum to 1.0');
    }

    // Calculate weighted average
    const overallScore = factors.reduce(
      (sum, f) => sum + (f.score * f.weight),
      0
    );

    // Get workspace thresholds (default: 85, 60)
    const thresholds = await this.getWorkspaceThresholds(workspaceId);

    // Determine recommendation
    const recommendation = this.getRecommendation(overallScore, thresholds);

    // Generate reasoning for low confidence
    const reasoning = overallScore < thresholds.quick
      ? this.generateReasoning(factors, overallScore)
      : undefined;

    // Log calculation
    this.logger.log('Confidence calculated', {
      workspaceId,
      score: overallScore,
      recommendation,
      factorCount: factors.length,
    });

    return {
      overallScore,
      factors,
      recommendation,
      reasoning,
    };
  }

  private async getWorkspaceThresholds(workspaceId: string) {
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    return {
      autoApprove: settings?.autoApproveThreshold || 85,
      quick: settings?.quickReviewThreshold || 60,
    };
  }

  private getRecommendation(
    score: number,
    thresholds: { autoApprove: number; quick: number },
  ): 'approve' | 'review' | 'full_review' {
    if (score >= thresholds.autoApprove) return 'approve';
    if (score >= thresholds.quick) return 'review';
    return 'full_review';
  }

  private generateReasoning(
    factors: ConfidenceFactor[],
    overallScore: number,
  ): string {
    const lowFactors = factors.filter(f => f.score < 60);
    const concerningFactors = factors.filter(f => f.concerning);

    const lines: string[] = [
      `Overall confidence is low (${overallScore.toFixed(1)}/100).`,
    ];

    if (lowFactors.length > 0) {
      lines.push(`\nFactors requiring attention:`);
      lowFactors.forEach(f => {
        lines.push(`- ${f.factor}: ${f.explanation}`);
      });
    }

    if (concerningFactors.length > 0) {
      lines.push(`\nConcerning factors:`);
      concerningFactors.forEach(f => {
        lines.push(`- ${f.factor}: ${f.explanation}`);
      });
    }

    return lines.join('\n');
  }
}
```

**Testing:**
- Unit test calculate() with various factor combinations
- Test weight validation (must sum to 1.0)
- Test threshold boundaries (exactly 85, exactly 60)
- Test reasoning generation for low confidence
- Test workspace-specific thresholds

**Integration:**
- Export ConfidenceCalculatorService from ApprovalsModule
- Import in ApprovalRouterService
- Create DTO for CreateApprovalItemDto with factors array

---

### Story 04.2: Create Approval Queue API Endpoints

**Key Files:**
- `apps/api/src/approvals/approvals.controller.ts` - REST controller
- `apps/api/src/approvals/approvals.service.ts` - Business logic
- `apps/api/src/approvals/dto/*.dto.ts` - DTOs
- `apps/api/src/approvals/approvals.module.ts` - Module definition

**Implementation Notes:**

```typescript
// apps/api/src/approvals/approvals.service.ts
@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private auditService: AuditService,
  ) {}

  async list(
    workspaceId: string,
    filters: ApprovalFilters,
    pagination: Pagination,
  ) {
    const where: Prisma.ApprovalItemWhereInput = {
      workspaceId,
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.assignedTo && { assignedToId: filters.assignedTo }),
    };

    const [items, total] = await Promise.all([
      this.prisma.approvalItem.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          decidedBy: { select: { id: true, name: true } },
        },
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.approvalItem.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        hasMore: total > pagination.page * pagination.limit,
      },
    };
  }

  async findOne(id: string, workspaceId: string) {
    const item = await this.prisma.approvalItem.findFirst({
      where: { id, workspaceId },
      include: {
        assignedTo: true,
        decidedBy: true,
        escalatedTo: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Approval item not found');
    }

    return item;
  }

  async approve(
    id: string,
    workspaceId: string,
    userId: string,
    notes?: string,
  ) {
    const item = await this.findOne(id, workspaceId);

    if (item.status !== 'pending' && item.status !== 'escalated') {
      throw new BadRequestException('Item already decided');
    }

    const updated = await this.prisma.approvalItem.update({
      where: { id },
      data: {
        status: 'approved',
        decidedById: userId,
        decidedAt: new Date(),
        decisionNotes: notes,
      },
    });

    // Emit event
    await this.eventBus.publish('approval.approved', {
      approvalId: id,
      workspaceId,
      decidedBy: userId,
      type: item.type,
    });

    // Audit log
    await this.auditService.log({
      workspaceId,
      action: 'approval_approved',
      entity: 'approval_item',
      entityId: id,
      userId,
      oldValues: { status: item.status },
      newValues: { status: 'approved', notes },
    });

    return updated;
  }

  async reject(
    id: string,
    workspaceId: string,
    userId: string,
    reason: string,
    notes?: string,
  ) {
    const item = await this.findOne(id, workspaceId);

    if (item.status !== 'pending' && item.status !== 'escalated') {
      throw new BadRequestException('Item already decided');
    }

    const updated = await this.prisma.approvalItem.update({
      where: { id },
      data: {
        status: 'rejected',
        decidedById: userId,
        decidedAt: new Date(),
        decisionNotes: `${reason}\n\n${notes || ''}`.trim(),
      },
    });

    await this.eventBus.publish('approval.rejected', {
      approvalId: id,
      workspaceId,
      decidedBy: userId,
      reason,
    });

    await this.auditService.log({
      workspaceId,
      action: 'approval_rejected',
      entity: 'approval_item',
      entityId: id,
      userId,
      oldValues: { status: item.status },
      newValues: { status: 'rejected', reason, notes },
    });

    return updated;
  }

  async bulkAction(
    ids: string[],
    action: 'approve' | 'reject',
    workspaceId: string,
    userId: string,
    reason?: string,
    notes?: string,
  ) {
    const results = {
      success: [],
      failed: [],
    };

    for (const id of ids) {
      try {
        if (action === 'approve') {
          await this.approve(id, workspaceId, userId, notes);
        } else {
          await this.reject(id, workspaceId, userId, reason, notes);
        }
        results.success.push(id);
      } catch (error) {
        results.failed.push({ id, error: error.message });
      }
    }

    return results;
  }
}
```

**Testing:**
- Integration test all endpoints with test database
- Test filtering (status, type, priority, assignedTo)
- Test sorting (dueAt, createdAt, confidenceScore)
- Test pagination (page, limit)
- Test approve with notes
- Test reject with reason
- Test bulk action with partial failures
- Test 403 for non-admin users
- Test 404 for non-existent approval

---

### Story 04.3: Implement Approval Router

**Key Files:**
- `apps/api/src/approvals/approval-router.service.ts` - Routing logic
- `apps/api/src/approvals/approvals.module.ts` - Module registration

**Implementation Notes:**

```typescript
// apps/api/src/approvals/approval-router.service.ts
@Injectable()
export class ApprovalRouterService {
  constructor(
    private prisma: PrismaService,
    private confidenceCalculator: ConfidenceCalculatorService,
    private eventBus: EventBusService,
    private auditService: AuditService,
    private logger: Logger,
  ) {}

  async routeApproval(
    dto: CreateApprovalItemDto,
    workspaceId: string,
  ): Promise<ApprovalItem> {
    // Calculate confidence
    const confidenceResult = await this.confidenceCalculator.calculate(
      dto.factors,
      workspaceId,
    );

    // Determine status and review type
    const { status, reviewType } = this.determineRouting(confidenceResult);

    // Get default assignee if not auto-approved
    const assignedToId = status === 'auto_approved'
      ? null
      : await this.getDefaultApprover(workspaceId);

    // Calculate due date based on priority
    const dueAt = this.calculateDueDate(dto.priority || 'medium');

    // Create approval item
    const item = await this.prisma.approvalItem.create({
      data: {
        workspaceId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        previewData: dto.previewData,
        confidenceScore: confidenceResult.overallScore,
        factors: confidenceResult.factors as any,
        aiReasoning: confidenceResult.reasoning,
        recommendation: confidenceResult.recommendation,
        reviewType,
        status,
        priority: dto.priority || 'medium',
        assignedToId,
        assignedAt: assignedToId ? new Date() : null,
        dueAt,
        agentId: dto.agentId,
        agentRunId: dto.agentRunId,
        sourceModule: dto.sourceModule,
        sourceId: dto.sourceId,
      },
    });

    // Emit event
    const eventType = status === 'auto_approved'
      ? 'approval.approved'
      : 'approval.requested';

    await this.eventBus.publish(eventType, {
      approvalId: item.id,
      workspaceId,
      type: item.type,
      confidenceScore: item.confidenceScore,
      reviewType: item.reviewType,
    });

    // Audit log
    await this.auditService.log({
      workspaceId,
      action: status === 'auto_approved' ? 'approval_auto_approved' : 'approval_routed',
      entity: 'approval_item',
      entityId: item.id,
      userId: null, // System action
      newValues: {
        status,
        reviewType,
        confidenceScore: item.confidenceScore,
        assignedToId,
      },
    });

    this.logger.log('Approval routed', {
      approvalId: item.id,
      workspaceId,
      status,
      reviewType,
      confidenceScore: item.confidenceScore,
    });

    return item;
  }

  private determineRouting(result: ConfidenceResult): {
    status: string;
    reviewType: string;
  } {
    if (result.recommendation === 'approve') {
      return { status: 'auto_approved', reviewType: 'auto' };
    } else if (result.recommendation === 'review') {
      return { status: 'pending', reviewType: 'quick' };
    } else {
      return { status: 'pending', reviewType: 'full' };
    }
  }

  private async getDefaultApprover(workspaceId: string): Promise<string> {
    // Try to get configured default approver from settings
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (settings?.defaultApproverId) {
      return settings.defaultApproverId;
    }

    // Fallback to workspace owner
    const owner = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, role: 'owner' },
    });

    return owner?.userId;
  }

  private calculateDueDate(priority: string): Date {
    const hours = {
      urgent: 24,
      high: 36,
      medium: 48,
      low: 72,
    }[priority] || 48;

    return addHours(new Date(), hours);
  }
}
```

**Testing:**
- Unit test routing logic with different confidence scores
- Test auto-approve (>85)
- Test quick review (60-85)
- Test full review (<60)
- Test due date calculation by priority
- Test default approver lookup (configured vs owner fallback)
- Test event emission
- Test audit logging

---

### Story 04.4: Create Approval Queue Dashboard

**Key Files:**
- `apps/web/src/app/(dashboard)/approvals/page.tsx` - Dashboard page
- `apps/web/src/components/approval/approval-list.tsx` - List component
- `apps/web/src/hooks/use-approvals.ts` - React Query hook
- `apps/web/src/lib/api/approvals.ts` - API client

**Implementation Notes:**

```typescript
// apps/web/src/app/(dashboard)/approvals/page.tsx
import { ApprovalList } from '@/components/approval/approval-list';
import { ApprovalFilters } from '@/components/approval/approval-filters';
import { ApprovalStats } from '@/components/approval/approval-stats';

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; page?: string };
}) {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Approval Queue</h1>
        <ApprovalStats />
      </div>

      <ApprovalFilters />

      <ApprovalList
        status={searchParams.status}
        type={searchParams.type}
        page={parseInt(searchParams.page || '1')}
      />
    </div>
  );
}

// apps/web/src/components/approval/approval-list.tsx
'use client';

import { useApprovals } from '@/hooks/use-approvals';
import { ApprovalCard } from './approval-card';
import { Pagination } from '@/components/ui/pagination';

export function ApprovalList({
  status,
  type,
  page,
}: {
  status?: string;
  type?: string;
  page: number;
}) {
  const { data, isLoading, error } = useApprovals({
    status,
    type,
    page,
    limit: 20,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading approvals</div>;

  return (
    <div>
      <div className="space-y-4">
        {data.data.map((approval) => (
          <ApprovalCard
            key={approval.id}
            approval={approval}
            variant="compact"
          />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(data.meta.total / data.meta.limit)}
      />
    </div>
  );
}

// apps/web/src/hooks/use-approvals.ts
import { useQuery } from '@tanstack/react-query';
import { approvalsApi } from '@/lib/api/approvals';

export function useApprovals(filters: ApprovalFilters) {
  return useQuery({
    queryKey: ['approvals', filters],
    queryFn: () => approvalsApi.list(filters),
  });
}

// apps/web/src/lib/api/approvals.ts
export const approvalsApi = {
  list: async (filters: ApprovalFilters) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());

    const response = await fetch(`/api/approvals?${params}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) throw new Error('Failed to load approvals');

    return response.json();
  },

  approve: async (id: string, notes?: string) => {
    const response = await fetch(`/api/approvals/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) throw new Error('Failed to approve');

    return response.json();
  },

  reject: async (id: string, reason: string, notes?: string) => {
    const response = await fetch(`/api/approvals/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ reason, notes }),
    });

    if (!response.ok) throw new Error('Failed to reject');

    return response.json();
  },
};
```

**Testing:**
- E2E test dashboard navigation
- Test filter controls (status, type dropdowns)
- Test sort controls (column header clicks)
- Test pagination (next/prev buttons)
- Test approval stats display (pending count, urgent count)
- Test responsive layout on tablet/desktop

---

### Story 04.5: Create Approval Card Component

**Key Files:**
- `apps/web/src/components/approval/approval-card.tsx` - Main component
- `apps/web/src/components/approval/confidence-badge.tsx` - Confidence indicator
- `apps/web/src/components/approval/approval-actions.tsx` - Action buttons

**Implementation Notes:**

```typescript
// apps/web/src/components/approval/approval-card.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBadge } from './confidence-badge';
import { ApprovalActions } from './approval-actions';
import { AIReasoning } from './ai-reasoning';
import { cn } from '@/lib/utils';

interface ApprovalCardProps {
  approval: ApprovalItem;
  variant?: 'compact' | 'expanded';
  onApprove?: (id: string, notes?: string) => void;
  onReject?: (id: string, reason: string, notes?: string) => void;
}

export function ApprovalCard({
  approval,
  variant = 'compact',
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const [isExpanded, setIsExpanded] = useState(variant === 'expanded');

  return (
    <Card className={cn(
      "p-6",
      variant === 'compact' && "hover:shadow-lg transition-shadow"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{approval.title}</h3>
            <ConfidenceBadge score={approval.confidenceScore} />
            <Badge variant={priorityVariant(approval.priority)}>
              {approval.priority}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            {approval.type} • Due {formatDistanceToNow(approval.dueAt, { addSuffix: true })}
          </p>
        </div>

        {variant === 'compact' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        )}
      </div>

      {/* Description */}
      {approval.description && (
        <p className="text-sm mb-4">{approval.description}</p>
      )}

      {/* Preview Data */}
      {approval.previewData && isExpanded && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <pre className="text-xs">
            {JSON.stringify(approval.previewData, null, 2)}
          </pre>
        </div>
      )}

      {/* AI Reasoning */}
      {isExpanded && approval.reviewType === 'full' && (
        <AIReasoning
          reasoning={approval.aiReasoning}
          factors={approval.factors}
          defaultExpanded={approval.confidenceScore < 60}
        />
      )}

      {/* Actions */}
      <ApprovalActions
        approvalId={approval.id}
        onApprove={onApprove}
        onReject={onReject}
      />
    </Card>
  );
}

// apps/web/src/components/approval/confidence-badge.tsx
export function ConfidenceBadge({ score }: { score: number }) {
  const color = score >= 85 ? 'green' : score >= 60 ? 'yellow' : 'red';

  return (
    <Badge
      className={cn(
        "font-mono",
        color === 'green' && "bg-green-100 text-green-800",
        color === 'yellow' && "bg-yellow-100 text-yellow-800",
        color === 'red' && "bg-red-100 text-red-800"
      )}
    >
      {score.toFixed(0)}% confidence
    </Badge>
  );
}

// apps/web/src/components/approval/approval-actions.tsx
export function ApprovalActions({
  approvalId,
  onApprove,
  onReject,
}: {
  approvalId: string;
  onApprove?: (id: string, notes?: string) => void;
  onReject?: (id: string, reason: string, notes?: string) => void;
}) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove?.(approvalId, notes);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      alert('Rejection reason is required');
      return;
    }

    setIsRejecting(true);
    try {
      await onReject?.(approvalId, reason, notes);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default" disabled={isApproving}>
            {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Approval</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button onClick={handleApprove} disabled={isApproving}>
              Confirm Approval
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" disabled={isRejecting}>
            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Approval</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for rejection (required)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
            <Textarea
              placeholder="Optional additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button onClick={handleReject} disabled={isRejecting}>
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Testing:**
- Component test both variants (compact, expanded)
- Test confidence badge colors (green >85, yellow 60-85, red <60)
- Test expand/collapse toggle
- Test approve button with notes
- Test reject button with reason validation
- Test loading states during actions
- Storybook stories for all variants

---

### Story 04.6: Implement AI Reasoning Display

**Key Files:**
- `apps/web/src/components/approval/ai-reasoning.tsx` - Reasoning component
- `apps/web/src/components/approval/confidence-factors.tsx` - Factors breakdown

**Implementation Notes:**

```typescript
// apps/web/src/components/approval/ai-reasoning.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfidenceFactors } from './confidence-factors';

interface AIReasoningProps {
  reasoning?: string;
  factors: ConfidenceFactor[];
  defaultExpanded?: boolean;
}

export function AIReasoning({
  reasoning,
  factors,
  defaultExpanded = false,
}: AIReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const concerningFactors = factors.filter(f => f.concerning);

  return (
    <div className="mb-4 border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4 bg-muted hover:bg-muted/80 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span className="font-medium">AI Reasoning</span>
          {concerningFactors.length > 0 && (
            <Badge variant="destructive">{concerningFactors.length} concerning</Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {reasoning && (
            <div className="prose prose-sm">
              <p className="whitespace-pre-line">{reasoning}</p>
            </div>
          )}

          <ConfidenceFactors factors={factors} />
        </div>
      )}
    </div>
  );
}

// apps/web/src/components/approval/confidence-factors.tsx
export function ConfidenceFactors({
  factors,
}: {
  factors: ConfidenceFactor[];
}) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Confidence Factors</h4>

      {factors.map((factor, index) => (
        <div
          key={index}
          className={cn(
            "p-3 rounded-lg border",
            factor.concerning ? "border-red-200 bg-red-50" : "border-gray-200"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{factor.factor}</span>
                {factor.concerning && (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{factor.explanation}</p>
            </div>

            <div className="text-right ml-4">
              <div className="font-mono text-sm font-medium">
                {factor.score.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">
                weight: {(factor.weight * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={cn(
                "h-1.5 rounded-full",
                factor.concerning ? "bg-red-600" : "bg-blue-600"
              )}
              style={{ width: `${factor.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Testing:**
- Component test with reasoning text
- Test factors breakdown display
- Test concerning factor highlighting (red border)
- Test collapsible behavior
- Test default expanded for low confidence (<60%)
- Test progress bars for each factor
- Storybook stories with various factor combinations

---

### Story 04.7: Implement Bulk Approval

**Key Files:**
- `apps/web/src/components/approval/bulk-actions.tsx` - Bulk action controls
- `apps/web/src/hooks/use-bulk-approval.ts` - Bulk action hook
- Update `approval-list.tsx` to support selection

**Implementation Notes:**

```typescript
// apps/web/src/components/approval/bulk-actions.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useBulkApproval } from '@/hooks/use-bulk-approval';

export function BulkActions({
  selectedIds,
  onClearSelection,
}: {
  selectedIds: string[];
  onClearSelection: () => void;
}) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  const { mutate, isPending, progress } = useBulkApproval();

  const handleBulkAction = () => {
    if (action === 'reject' && !reason.trim()) {
      alert('Rejection reason is required');
      return;
    }

    mutate(
      { ids: selectedIds, action, reason, notes },
      {
        onSuccess: () => {
          onClearSelection();
          setAction(null);
          setNotes('');
          setReason('');
        },
      }
    );
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white border shadow-lg rounded-lg p-4">
      <div className="flex items-center gap-4">
        <span className="font-medium">{selectedIds.length} selected</span>

        <Button
          onClick={() => setAction('approve')}
          disabled={isPending}
        >
          Approve All
        </Button>

        <Button
          variant="destructive"
          onClick={() => setAction('reject')}
          disabled={isPending}
        >
          Reject All
        </Button>

        <Button
          variant="ghost"
          onClick={onClearSelection}
          disabled={isPending}
        >
          Clear
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={action !== null} onOpenChange={() => setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve' : 'Reject'} {selectedIds.length} Items
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {action === 'reject' && (
              <Textarea
                placeholder="Reason for rejection (required)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            )}

            <Textarea
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {isPending && (
              <div className="space-y-2">
                <Progress value={(progress.completed / progress.total) * 100} />
                <p className="text-sm text-muted-foreground">
                  {progress.completed} of {progress.total} completed
                </p>
              </div>
            )}

            <Button
              onClick={handleBulkAction}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Processing...' : `Confirm ${action === 'approve' ? 'Approval' : 'Rejection'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Update approval-list.tsx to support selection
export function ApprovalList({ ... }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  return (
    <div>
      <div className="space-y-4">
        {data.data.map((approval) => (
          <div key={approval.id} className="flex gap-4">
            <Checkbox
              checked={selectedIds.includes(approval.id)}
              onCheckedChange={() => toggleSelection(approval.id)}
            />
            <ApprovalCard approval={approval} variant="compact" />
          </div>
        ))}
      </div>

      <BulkActions
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
      />
    </div>
  );
}

// apps/web/src/hooks/use-bulk-approval.ts
export function useBulkApproval() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  return useMutation({
    mutationFn: async ({
      ids,
      action,
      reason,
      notes,
    }: {
      ids: string[];
      action: 'approve' | 'reject';
      reason?: string;
      notes?: string;
    }) => {
      setProgress({ completed: 0, total: ids.length });

      const response = await fetch('/api/approvals/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ ids, action, reason, notes }),
      });

      if (!response.ok) throw new Error('Bulk action failed');

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}
```

**Testing:**
- E2E test checkbox selection
- Test select all / deselect all
- Test bulk approve with notes
- Test bulk reject with reason
- Test progress bar during processing
- Test partial failures display
- Test clear selection

---

### Story 04.8: Implement Approval Escalation

**Key Files:**
- `apps/api/src/approvals/approval-escalation.service.ts` - Escalation logic
- `apps/api/src/approvals/approval-escalation.processor.ts` - BullMQ processor
- `apps/api/src/approvals/approvals.module.ts` - Register queue

**Implementation Notes:**

```typescript
// apps/api/src/approvals/approval-escalation.service.ts
@Injectable()
export class ApprovalEscalationService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private logger: Logger,
  ) {}

  async checkAndEscalate(): Promise<void> {
    const now = new Date();

    // Find overdue approvals
    const overdueItems = await this.prisma.approvalItem.findMany({
      where: {
        status: 'pending',
        dueAt: { lt: now },
      },
      include: {
        assignedTo: true,
        workspace: {
          include: {
            members: {
              where: { role: { in: ['owner', 'admin'] } },
              include: { user: true },
            },
          },
        },
      },
    });

    this.logger.log(`Found ${overdueItems.length} overdue approvals`);

    for (const item of overdueItems) {
      try {
        await this.escalateItem(item);
      } catch (error) {
        this.logger.error(`Failed to escalate approval ${item.id}`, error);
      }
    }
  }

  private async escalateItem(item: ApprovalItem) {
    // Find escalation target
    const escalationTarget = this.findEscalationTarget(
      item.assignedToId,
      item.workspace.members,
    );

    if (!escalationTarget) {
      this.logger.warn(`No escalation target for approval ${item.id}`);
      return;
    }

    // Update approval
    await this.prisma.approvalItem.update({
      where: { id: item.id },
      data: {
        status: 'escalated',
        escalatedAt: new Date(),
        escalatedToId: escalationTarget.userId,
      },
    });

    // Emit event
    await this.eventBus.publish('approval.escalated', {
      approvalId: item.id,
      workspaceId: item.workspaceId,
      originalAssignee: item.assignedToId,
      escalatedTo: escalationTarget.userId,
      overdueBy: Date.now() - item.dueAt.getTime(),
    });

    this.logger.warn('Approval escalated', {
      approvalId: item.id,
      originalAssignee: item.assignedToId,
      escalatedTo: escalationTarget.userId,
    });
  }

  private findEscalationTarget(
    currentAssigneeId: string,
    workspaceMembers: WorkspaceMember[],
  ): WorkspaceMember | null {
    // Escalation chain: member → admin → owner
    const currentMember = workspaceMembers.find(m => m.userId === currentAssigneeId);

    if (currentMember?.role === 'member') {
      // Escalate to admin
      const admin = workspaceMembers.find(m => m.role === 'admin');
      if (admin) return admin;
    }

    if (currentMember?.role === 'admin' || currentMember?.role === 'member') {
      // Escalate to owner
      const owner = workspaceMembers.find(m => m.role === 'owner');
      if (owner) return owner;
    }

    // No escalation target found
    return null;
  }
}

// apps/api/src/approvals/approval-escalation.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('approval-escalation')
export class ApprovalEscalationProcessor extends WorkerHost {
  constructor(private escalationService: ApprovalEscalationService) {
    super();
  }

  async process(job: Job): Promise<void> {
    await this.escalationService.checkAndEscalate();
  }
}

// apps/api/src/approvals/approvals.module.ts
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'approval-escalation',
    }),
  ],
  controllers: [ApprovalsController],
  providers: [
    ApprovalsService,
    ApprovalRouterService,
    ConfidenceCalculatorService,
    ApprovalEscalationService,
    ApprovalEscalationProcessor,
  ],
})
export class ApprovalsModule implements OnModuleInit {
  constructor(
    @InjectQueue('approval-escalation') private queue: Queue,
  ) {}

  async onModuleInit() {
    // Schedule escalation job every 15 minutes
    await this.queue.add(
      'check-escalations',
      {},
      {
        repeat: {
          every: 15 * 60 * 1000, // 15 minutes
        },
      },
    );
  }
}
```

**Testing:**
- Integration test escalation job
- Test overdue query (dueAt < now)
- Test escalation target lookup (member → admin → owner)
- Test approval update (status, escalatedAt, escalatedToId)
- Test event emission
- Test no escalation target scenario

---

### Story 04.9: Implement Approval Audit Trail

**Key Files:**
- Update `apps/api/src/approvals/approvals.service.ts` to log all actions
- `apps/web/src/components/approval/audit-trail.tsx` - UI component
- Update `apps/web/src/app/(dashboard)/approvals/[id]/page.tsx` for detail view

**Implementation Notes:**

```typescript
// Already implemented in ApprovalsService (Story 04.2)
// Ensure all actions call auditService.log()

// apps/web/src/components/approval/audit-trail.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export function AuditTrail({ approvalId }: { approvalId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['approval-audit', approvalId],
    queryFn: async () => {
      const response = await fetch(`/api/audit-logs?entity=approval_item&entityId=${approvalId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      return response.json();
    },
  });

  if (isLoading) return <div>Loading audit trail...</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Audit Trail</h3>

      <div className="space-y-2">
        {data.data.map((log: AuditLog) => (
          <div key={log.id} className="flex gap-4 p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{actionLabel(log.action)}</span>
                <span className="text-sm text-muted-foreground">
                  by {log.userId || 'System'}
                </span>
              </div>

              {log.oldValues && log.newValues && (
                <div className="text-xs text-muted-foreground">
                  <code>
                    {JSON.stringify(log.oldValues)} → {JSON.stringify(log.newValues)}
                  </code>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(log.createdAt), 'PPpp')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Testing:**
- Integration test audit log creation on all actions
- Test audit trail UI display
- Test before/after values captured
- Test actor (userId, actorRole) recorded
- Test IP and user agent captured

---

### Story 04.10: Integrate Approval Agent with AgentOS

**Key Files:**
- `agents/platform/approval_agent.py` - Agno-based agent
- `agents/platform/tools/approval_tools.py` - Agent tools
- `agents/middleware/tenant.py` - Tenant context middleware

**Implementation Notes:**

```python
# agents/platform/approval_agent.py
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.storage.postgres import PostgresStorage
from .tools.approval_tools import (
    request_approval_tool,
    get_pending_approvals_tool,
    approve_item_tool,
    reject_item_tool,
)

def create_approval_agent(
    user_id: str,
    workspace_id: str,
    session_id: str,
) -> Agent:
    """Create Approval Agent with HITL tools."""

    return Agent(
        name="ApprovalAgent",
        agent_id="approval",
        model=Claude(id="claude-sonnet-4-20250514"),
        tools=[
            request_approval_tool,
            get_pending_approvals_tool,
            approve_item_tool,
            reject_item_tool,
        ],
        instructions=[
            "You are the Approval Agent for HYVVE platform.",
            "You help users manage their approval queue.",
            "IMPORTANT: Always use requires_confirmation for approve/reject actions.",
            "Provide clear reasoning for your recommendations.",
        ],
        storage=PostgresStorage(
            table_name="agent_sessions",
            db_url=os.getenv("DATABASE_URL"),
        ),
        session_id=session_id,
        user_id=user_id,
        additional_context={
            "workspace_id": workspace_id,
        },
        markdown=True,
    )

# agents/platform/tools/approval_tools.py
from agno.tools import tool
from typing import List, Dict

@tool(requires_confirmation=True)
def request_approval(
    type: str,
    title: str,
    description: str,
    factors: List[Dict],
    workspace_id: str,
) -> str:
    """
    Request approval for an AI action.

    IMPORTANT: This tool requires human confirmation before execution.

    Args:
        type: Type of approval (content, email, campaign, etc.)
        title: Title of the approval item
        description: Detailed description
        factors: List of confidence factors
        workspace_id: Workspace context

    Returns:
        Approval ID if created, error message if failed
    """
    # POST to NestJS API
    response = requests.post(
        f"{NESTJS_API_URL}/approvals/route",
        json={
            "type": type,
            "title": title,
            "description": description,
            "factors": factors,
        },
        headers={
            "Authorization": f"Bearer {get_jwt_from_context()}",
        },
    )

    if response.status_code == 201:
        approval = response.json()
        return f"Approval created with ID: {approval['id']}"
    else:
        return f"Failed to create approval: {response.text}"

@tool()
def get_pending_approvals(workspace_id: str, status: str = "pending") -> List[Dict]:
    """
    Get pending approvals for the workspace.

    Args:
        workspace_id: Workspace context
        status: Filter by status (default: pending)

    Returns:
        List of pending approval items
    """
    response = requests.get(
        f"{NESTJS_API_URL}/approvals",
        params={"status": status},
        headers={
            "Authorization": f"Bearer {get_jwt_from_context()}",
        },
    )

    if response.status_code == 200:
        return response.json()["data"]
    else:
        return []

@tool(requires_confirmation=True)
def approve_item(approval_id: str, notes: str = None) -> str:
    """
    Approve an approval item.

    IMPORTANT: This tool requires human confirmation before execution.

    Args:
        approval_id: ID of approval to approve
        notes: Optional notes

    Returns:
        Success message or error
    """
    response = requests.post(
        f"{NESTJS_API_URL}/approvals/{approval_id}/approve",
        json={"notes": notes},
        headers={
            "Authorization": f"Bearer {get_jwt_from_context()}",
        },
    )

    if response.status_code == 200:
        return f"Approval {approval_id} approved successfully"
    else:
        return f"Failed to approve: {response.text}"

@tool(requires_confirmation=True)
def reject_item(approval_id: str, reason: str, notes: str = None) -> str:
    """
    Reject an approval item.

    IMPORTANT: This tool requires human confirmation before execution.

    Args:
        approval_id: ID of approval to reject
        reason: Reason for rejection (required)
        notes: Optional notes

    Returns:
        Success message or error
    """
    response = requests.post(
        f"{NESTJS_API_URL}/approvals/{approval_id}/reject",
        json={"reason": reason, "notes": notes},
        headers={
            "Authorization": f"Bearer {get_jwt_from_context()}",
        },
    )

    if response.status_code == 200:
        return f"Approval {approval_id} rejected successfully"
    else:
        return f"Failed to reject: {response.text}"

# agents/middleware/tenant.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import jwt
import os

class TenantMiddleware(BaseHTTPMiddleware):
    """Inject workspace_id from JWT into agent context."""

    async def dispatch(self, request: Request, call_next):
        # Extract JWT from Authorization header
        auth_header = request.headers.get("Authorization", "")

        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                # Decode JWT (use same secret as better-auth)
                secret = os.getenv("BETTER_AUTH_SECRET")
                claims = jwt.decode(token, secret, algorithms=["HS256"])

                # Inject into request state
                request.state.user_id = claims.get("sub")
                request.state.workspace_id = claims.get("workspace_id")
            except jwt.DecodeError:
                pass

        return await call_next(request)
```

**Testing:**
- Integration test agent invocation via AgentOS API
- Test request_approval tool with requires_confirmation
- Test get_pending_approvals tool
- Test approve_item tool with confirmation
- Test reject_item tool with confirmation
- Test workspace context injection
- Verify agent session visible in Control Plane

---

### Story 04.11: Configure Control Plane Connection

**Key Files:**
- `agents/config.py` - AgentOS configuration
- `docs/agentos-setup.md` - Documentation

**Implementation Notes:**

```python
# agents/config.py
import os
from agno.settings import AgnoSettings

settings = AgnoSettings(
    # Control Plane connection
    control_plane_url=os.getenv("AGNO_CONTROL_PLANE_URL", "https://os.agno.com"),

    # Agent runtime
    port=int(os.getenv("AGENTOS_PORT", 7777)),
    host=os.getenv("AGENTOS_HOST", "0.0.0.0"),

    # Database
    database_url=os.getenv("DATABASE_URL"),

    # Redis
    redis_url=os.getenv("REDIS_URL"),
)
```

**Documentation:**

```markdown
# AgentOS Control Plane Access

The HYVVE platform uses AgentOS for agent runtime with the Control Plane at os.agno.com for monitoring.

## Accessing Control Plane

1. Navigate to https://os.agno.com
2. Click "Connect to AgentOS"
3. Enter your AgentOS URL: `http://localhost:7777` (dev) or `https://agents.hyvve.io` (prod)
4. Browse agent sessions, memories, and knowledge

## Important Notes

- Control Plane connects FROM your browser TO AgentOS
- No data is sent to Agno servers
- Connection is read-only monitoring
- All data stays in your infrastructure

## Available Features

- **Sessions**: View all agent conversations
- **Memories**: Browse agent memory entries
- **Knowledge**: Explore knowledge base
- **Chat**: Interact with agents directly (testing)
```

**Testing:**
- Manual test: Access Control Plane UI
- Verify sessions visible
- Verify memories accessible
- Test session history navigation
- Document access instructions for team

---

### Story 04.12: Implement NestJS↔AgentOS Bridge

**Key Files:**
- `apps/api/src/agentos/agentos.module.ts` - Module definition
- `apps/api/src/agentos/agentos.service.ts` - HTTP client
- `apps/api/src/agentos/agentos.controller.ts` - REST endpoints

**Implementation Notes:**

```typescript
// apps/api/src/agentos/agentos.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';

export interface AgentParams {
  message: string;
  session_id?: string;
  [key: string]: any;
}

export interface AgentRunResponse {
  run_id: string;
  agent_id: string;
  status: string;
  response?: string;
}

@Injectable()
export class AgentOSService {
  private readonly agentosUrl: string;
  private readonly logger = new Logger(AgentOSService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.agentosUrl = this.configService.get('AGENTOS_URL', 'http://localhost:7777');
  }

  /**
   * Invoke an agent run
   */
  async invokeAgent(
    agentId: string,
    params: AgentParams,
    jwt: string,
  ): Promise<AgentRunResponse> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.agentosUrl}/agents/${agentId}/runs`,
          params,
          {
            headers: {
              'Authorization': `Bearer ${jwt}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 second timeout
          },
        ),
      );

      const duration = Date.now() - startTime;

      this.logger.log('AgentOS invoked', {
        agentId,
        runId: response.data.run_id,
        duration,
      });

      return response.data;
    } catch (error) {
      this.logger.error('AgentOS invocation failed', {
        agentId,
        error: error.message,
        duration: Date.now() - startTime,
      });

      throw new Error(`Failed to invoke agent: ${error.message}`);
    }
  }

  /**
   * Get agent run status
   */
  async getAgentRun(runId: string, jwt: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.agentosUrl}/runs/${runId}`,
          {
            headers: { 'Authorization': `Bearer ${jwt}` },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get agent run', {
        runId,
        error: error.message,
      });

      throw new Error(`Failed to get agent run: ${error.message}`);
    }
  }

  /**
   * Stream agent response via SSE
   */
  streamAgentResponse(runId: string, jwt: string): Observable<any> {
    // Implementation using EventSource or similar
    // Return observable that emits chunks
    throw new Error('Not implemented - use SSE library');
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

// apps/api/src/agentos/agentos.controller.ts
@Controller('agentos')
@UseGuards(AuthGuard, TenantGuard)
export class AgentOSController {
  constructor(private agentosService: AgentOSService) {}

  @Post('agent/:agentId/chat')
  async chatWithAgent(
    @Param('agentId') agentId: string,
    @Body() body: { message: string; session_id?: string },
    @Req() request: Request,
  ) {
    const jwt = this.extractJWT(request);

    return this.agentosService.invokeAgent(agentId, body, jwt);
  }

  @Get('runs/:runId')
  async getAgentRun(
    @Param('runId') runId: string,
    @Req() request: Request,
  ) {
    const jwt = this.extractJWT(request);

    return this.agentosService.getAgentRun(runId, jwt);
  }

  private extractJWT(request: Request): string {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing JWT');
    }
    return authHeader.substring(7);
  }
}
```

**Testing:**
- Integration test invokeAgent() with mock AgentOS
- Test JWT passthrough in Authorization header
- Test getAgentRun() with mock response
- Test error handling (timeout, unavailable)
- Test retry logic with exponential backoff
- Test logging of invocations

---

## Integration Testing Strategy

After all stories are complete, perform integration testing:

1. **End-to-End Approval Flow:**
   - Create approval via ApprovalRouter
   - View in queue dashboard
   - Approve via UI
   - Verify event emitted
   - Verify audit log created

2. **Confidence Routing Test:**
   - Create approval with >85% confidence → auto-approved
   - Create approval with 70% confidence → pending, quick review
   - Create approval with 50% confidence → pending, full review with reasoning

3. **Escalation Test:**
   - Create approval with past due date
   - Run escalation job
   - Verify status changed to escalated
   - Verify notification sent

4. **Bulk Action Test:**
   - Select 10 approvals
   - Bulk approve
   - Verify all updated
   - Test partial failure handling

5. **AgentOS Integration Test:**
   - Invoke Approval Agent via NestJS
   - Test request_approval tool
   - Test approve_item tool with confirmation
   - Verify Control Plane session visible

---

## Performance Benchmarking

After implementation, benchmark:

- Confidence calculation: Target < 100ms
- Approval list query (100 items): Target < 200ms
- Approval approve/reject: Target < 300ms
- Bulk action (10 items): Target < 2 seconds
- Escalation job (full workspace): Target < 5 seconds
- AgentOS invocation round-trip: Target < 1 second

---

_This tech spec provides comprehensive guidance for implementing Epic 04: Approval Queue System with confidence-based routing, AgentOS integration, and Control Plane monitoring._
