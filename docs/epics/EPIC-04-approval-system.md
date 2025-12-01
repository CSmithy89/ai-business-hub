# Epic 04: Approval Queue System

**Epic ID:** EPIC-04
**Status:** Ready for Development
**Priority:** P0 - Critical
**Phase:** Phase 3 - Approval System

---

## Epic Overview

Implement the human-in-the-loop approval queue with confidence-based routing, enabling the 90/5 promise of 90% automation with minimal human involvement.

### Business Value
The approval system is the core differentiator of HYVVE - AI agents work autonomously while surfacing important decisions for human review, maintaining control without requiring constant attention.

### Success Criteria
- [ ] Confidence-based routing functional (auto/quick/full)
- [ ] Approval queue dashboard operational
- [ ] 1-click approve for high-confidence items
- [ ] AI reasoning displayed for low-confidence items
- [ ] Bulk approval functionality working
- [ ] Audit trail complete for all decisions

---

## Stories

### Story 04.1: Implement Confidence Calculator Service

**Points:** 3
**Priority:** P0

**As a** platform developer
**I want** a confidence scoring system
**So that** AI actions can be routed appropriately

**Acceptance Criteria:**
- [ ] Create `ConfidenceCalculatorService` in NestJS
- [ ] Define confidence factors interface
- [ ] Implement weighted average scoring
- [ ] Return recommendation: auto/quick/full review
- [ ] Log confidence calculations for debugging
- [ ] Make thresholds configurable per workspace

**Scoring Logic:**
```typescript
interface ConfidenceResult {
  overallScore: number;        // 0-100
  factors: ConfidenceFactor[];
  recommendation: 'approve' | 'review' | 'full_review';
}

// Thresholds
>85% → auto-approve
60-85% → quick review (1-click)
<60% → full review (AI reasoning required)
```

---

### Story 04.2: Create Approval Queue API Endpoints

**Points:** 3
**Priority:** P0

**As a** frontend developer
**I want** approval queue API endpoints
**So that** I can build the approval UI

**Acceptance Criteria:**
- [ ] GET `/api/approvals` - List with filtering/pagination
  - Filter by status, type, priority, assignee
  - Sort by dueAt, confidenceScore, createdAt
- [ ] GET `/api/approvals/:id` - Get full details
- [ ] POST `/api/approvals/:id/approve` - Approve with optional notes
- [ ] POST `/api/approvals/:id/reject` - Reject with required reason
- [ ] POST `/api/approvals/bulk` - Bulk approve/reject
- [ ] Apply tenant and permission guards

---

### Story 04.3: Implement Approval Router

**Points:** 2
**Priority:** P0

**As a** platform
**I want** automatic routing of approval requests
**So that** items reach the right queue

**Acceptance Criteria:**
- [ ] Create `ApprovalRouterService`
- [ ] Route by confidence score:
  - >85%: Create with status `auto_approved`
  - 60-85%: Create with status `pending`, quick review
  - <60%: Create with status `pending`, full review flag
- [ ] Set `dueAt` based on priority (default 48 hours)
- [ ] Assign to default approver or role
- [ ] Emit `approval.requested` event
- [ ] Log routing decision in audit

---

### Story 04.4: Create Approval Queue Dashboard

**Points:** 3
**Priority:** P0

**As a** workspace admin
**I want** to see all pending approvals
**So that** I can make decisions efficiently

**Acceptance Criteria:**
- [ ] Create page at `/approvals`
- [ ] Display queue with columns:
  - Title, Type, Confidence, Priority, Due
- [ ] Filter controls (status, type, priority)
- [ ] Sort controls
- [ ] Quick stats (pending count, urgent count)
- [ ] Badge on sidebar with pending count
- [ ] Responsive design for tablet/desktop

---

### Story 04.5: Create Approval Card Component

**Points:** 3
**Priority:** P0

**As a** approver
**I want** clear approval cards
**So that** I can make quick, informed decisions

**Acceptance Criteria:**
- [ ] Create ApprovalCard component
- [ ] Show confidence score with color indicator:
  - Green (>85%): High confidence
  - Yellow (60-85%): Medium
  - Red (<60%): Low
- [ ] Display AI recommendation
- [ ] Show preview data (expandable)
- [ ] Approve/Reject buttons
- [ ] Add notes input for decision
- [ ] Loading states during action

**Card Variants:**
- Compact (list view)
- Expanded (detail view with AI reasoning)

---

### Story 04.6: Implement AI Reasoning Display

**Points:** 2
**Priority:** P0

**As an** approver reviewing low-confidence items
**I want** to see why the AI is uncertain
**So that** I can make an informed decision

**Acceptance Criteria:**
- [ ] Display `aiReasoning` text
- [ ] Show confidence factors breakdown:
  - Factor name
  - Score (0-100)
  - Weight contribution
  - Explanation
- [ ] Highlight concerning factors in red
- [ ] Collapsible section (expanded by default for <60%)
- [ ] Link to related entities for context

---

### Story 04.7: Implement Bulk Approval

**Points:** 2
**Priority:** P1

**As an** approver with many similar items
**I want** to approve/reject in bulk
**So that** I can be efficient

**Acceptance Criteria:**
- [ ] Add selection checkboxes to queue
- [ ] Show selected count
- [ ] Bulk action buttons (Approve All, Reject All)
- [ ] Add bulk notes input
- [ ] Confirm dialog before bulk action
- [ ] Show progress during bulk operation
- [ ] Handle partial failures gracefully

---

### Story 04.8: Implement Approval Escalation

**Points:** 2
**Priority:** P1

**As a** platform
**I want** to escalate stale approvals
**So that** important decisions aren't missed

**Acceptance Criteria:**
- [ ] Create scheduled job for escalation check
- [ ] Escalate items past `dueAt`
- [ ] Notify escalation target
- [ ] Update approval with escalation info
- [ ] Emit `approval.escalated` event
- [ ] Configurable escalation chain per workspace

---

### Story 04.9: Implement Approval Audit Trail

**Points:** 2
**Priority:** P0

**As a** compliance officer
**I want** complete audit trail of approvals
**So that** I can review decisions

**Acceptance Criteria:**
- [ ] Log all approval actions to `audit_logs`
- [ ] Capture: action, actor, timestamp, before/after
- [ ] Log auto-approvals with AI reasoning
- [ ] Create audit view in approval detail
- [ ] Export capability (future)

---

### Story 04.10: Integrate Approval Agent with AgentOS

**Points:** 3
**Priority:** P1

**As a** platform
**I want** the Approval Agent operational in AgentOS
**So that** approvals can be managed conversationally with monitoring

**Acceptance Criteria:**
- [ ] Implement Agno-based ApprovalAgent in `agents/platform/approval_agent.py`
- [ ] Register agent with AgentOS runtime
- [ ] Connect approval tools:
  - `request_approval` with `requires_confirmation=True` for HITL
  - `get_pending_approvals` for queue queries
  - `approve_item` / `reject_item` for decisions
- [ ] Configure workspace context via tenant middleware
- [ ] Test via AgentOS API endpoints (`/agents/approval/runs`)
- [ ] Verify agent sessions visible in Control Plane

**References:**
- ADR-007: AgentOS for Agent Runtime
- Architecture: NestJS ↔ AgentOS Integration
- `agents/platform/approval_agent.py` (scaffold exists)
- `.bmad/orchestrator/agents/approval-agent.agent.yaml`

---

### Story 04.11: Configure Control Plane Connection

**Points:** 2
**Priority:** P1

**As a** platform operator
**I want** AgentOS connected to the Control Plane
**So that** I can monitor agent sessions and memories

**Acceptance Criteria:**
- [ ] Configure AgentOS to connect to os.agno.com
- [ ] Verify agent sessions visible in Control Plane UI
- [ ] Confirm memory entries accessible
- [ ] Test session history navigation
- [ ] Document Control Plane access for team members
- [ ] Verify no data leaves infrastructure (browser-only connection)

**Technical Notes:**
- Control Plane connects FROM browser TO your AgentOS
- No data sent to Agno servers
- Monitoring is read-only observation

---

### Story 04.12: Implement NestJS ↔ AgentOS Bridge

**Points:** 3
**Priority:** P0

**As a** platform developer
**I want** NestJS to communicate with AgentOS
**So that** business logic can trigger agent actions

**Acceptance Criteria:**
- [ ] Create `AgentOSService` in NestJS
- [ ] Implement methods:
  - `invokeAgent(agentId, params)` - Trigger agent run
  - `getAgentRun(runId)` - Get run status
  - `streamAgentResponse(runId)` - SSE stream connection
- [ ] Configure HTTP client with JWT passthrough
- [ ] Handle errors gracefully (agent unavailable, timeout)
- [ ] Add retry logic with exponential backoff
- [ ] Log all agent invocations for debugging

**Example Usage:**
```typescript
// In NestJS approval service
const result = await this.agentOS.invokeAgent('approval', {
  action: 'review_queue',
  workspaceId: context.workspaceId,
});
```

**References:**
- Architecture: NestJS ↔ AgentOS Integration
- API Gateway routing in nginx.conf

---

## Wireframe References

All Approval Queue wireframes are complete. Reference these when implementing:

| Story | Wireframe | Assets |
|-------|-----------|--------|
| 04.4 Approval Queue Dashboard | AP-01 Approval Queue | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-01_approval_queue_main/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-01_approval_queue_main/screen.png) |
| 04.5 Approval Card | AP-02 Confidence Cards | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-02_approval_card_(confidence_routing_)/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-02_approval_card_(confidence_routing_)/screen.png) |
| 04.6 AI Reasoning Display | AP-03 Approval Detail | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-03_approval_detail_modal/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-03_approval_detail_modal/screen.png) |
| 04.7 Bulk Approval | AP-04 Batch Approval | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-04_batch_approval/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-04_batch_approval/screen.png) |
| General | AP-05 Approval Filters | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-05_approval_filters/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-05_approval_filters/screen.png) |
| 04.9 Audit Trail | AP-06 Approval History | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-06_approval_history/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/ap-06_approval_history/screen.png) |

**Full wireframe index:** [WIREFRAME-INDEX.md](../design/wireframes/WIREFRAME-INDEX.md)

---

## Dependencies

- Epic 00: Project Scaffolding
- Epic 01: Authentication
- Epic 02: Workspace Management
- Epic 03: RBAC & Multi-tenancy

## Technical Notes

### Confidence Thresholds (Configurable)
```typescript
const DEFAULT_THRESHOLDS = {
  autoApprove: 85,
  quickReview: 60,
}
```

### Approval Types
- `content` - Blog posts, social content
- `email` - Email campaigns
- `campaign` - Marketing campaigns
- `deal` - Sales deals
- `integration` - External connections
- `agent_action` - Agent-proposed actions

---

_Epic created: 2025-11-30_
_PRD Reference: FR-3 Approval Queue_
