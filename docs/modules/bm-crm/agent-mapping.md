# BM-CRM Agent Mapping

**Created:** 2025-11-29
**Source:** Party Mode Discussion Session
**Status:** Ready for Implementation

---

## Overview

This document maps CRM user flows to AI agents, defining what each agent does, when it's triggered, and whether human approval is required. This serves as the blueprint for implementing BM-CRM agents using the Agno framework.

---

## Agent Inventory

### Core Platform Agents (Shared)

| Agent | Purpose | Used By |
|-------|---------|---------|
| `OrchestratorAgent` | Routes requests to appropriate module agents | All modules |
| `ApprovalAgent` | Manages human-in-the-loop approval gates | All modules |

### BM-CRM Module Agents

| Agent | Purpose | Trigger |
|-------|---------|---------|
| `LeadScorerAgent` | Score incoming leads based on firmographic/behavioral data | Lead creation, enrichment |
| `DataEnricherAgent` | Enrich contacts with external data (company, title, social) | User-initiated |
| `PipelineAgent` | Manage deal stages and suggest automations | Deal stage change |

---

## User Flow to Agent Mapping

### Flow 1: Lead Capture & Scoring

```
NEW LEAD ARRIVES (form, import, API)
         │
         ▼
┌─────────────────────────────────────┐
│  LeadScorerAgent                    │
│  ─────────────────────────────────  │
│  Trigger: Lead created event        │
│  Action: Calculate lead score       │
│  Approval: None (automatic)         │
│  Output: Score 0-100 + reasoning    │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  CONTACT CARD (UI)                  │
│  Shows: Lead Score badge            │
│  User sees: "78/100" with indicator │
└─────────────────────────────────────┘
```

**Agent Specification:**
```python
lead_scorer = Agent(
    name="LeadScorerAgent",
    model=get_tenant_model(tenant_id),  # BYOAI
    instructions=[
        "Score leads based on firmographic and behavioral data",
        "Factors: company size, industry fit, engagement level, source quality",
        "Return score 0-100 with brief reasoning",
        "High scores (80+) indicate sales-ready leads",
    ],
    output_schema=LeadScore,
    tools=[calculate_score, lookup_company_data],
    db=get_agent_db(tenant_id),
)
```

**Output Schema:**
```python
class LeadScore(BaseModel):
    score: int = Field(ge=0, le=100, description="Lead score 0-100")
    reasoning: str = Field(description="Brief explanation of score")
    factors: dict = Field(description="Breakdown by scoring factor")
    recommended_action: str = Field(description="Suggested next step")
```

---

### Flow 2: Contact Enrichment

```
USER CLICKS [Enrich] BUTTON
         │
         ▼
┌─────────────────────────────────────┐
│  DataEnricherAgent                  │
│  ─────────────────────────────────  │
│  Trigger: User-initiated action     │
│  Action: Lookup external sources    │
│  Approval: None (user initiated)    │
│  Output: Enriched contact data      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  LeadScorerAgent (re-score)         │
│  ─────────────────────────────────  │
│  Trigger: Enrichment complete       │
│  Action: Recalculate with new data  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  CONTACT CARD (UI) - Updated        │
│  Shows: Company, title, LinkedIn    │
│  Shows: Updated lead score          │
└─────────────────────────────────────┘
```

**Agent Specification:**
```python
data_enricher = Agent(
    name="DataEnricherAgent",
    model=get_tenant_model(tenant_id),
    instructions=[
        "Enrich contact with publicly available data",
        "Find: company info, job title, LinkedIn, social profiles",
        "Respect rate limits on external APIs",
        "Return only verified information",
    ],
    tools=[
        lookup_clearbit,
        search_linkedin,
        scrape_company_website,
        verify_email,
    ],
    db=get_agent_db(tenant_id),
)
```

**Tools Required:**
| Tool | Purpose | External API |
|------|---------|--------------|
| `lookup_clearbit` | Company data | Clearbit API |
| `search_linkedin` | Professional profile | LinkedIn API/scrape |
| `scrape_company_website` | Company details | Web scraper |
| `verify_email` | Email validation | Email verification API |

---

### Flow 3: Deal Pipeline Movement

```
USER DRAGS DEAL TO NEW STAGE
         │
         ▼
┌─────────────────────────────────────┐
│  PipelineAgent                      │
│  ─────────────────────────────────  │
│  Trigger: Deal stage change event   │
│  Action: Suggest automations        │
│  Approval: YES - user must confirm  │
│  Output: Automation options         │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  APPROVAL MODAL (UI)                │
│  ─────────────────────────────────  │
│  "Moving to Qualified. Should I..." │
│  □ Send follow-up email template?   │
│  □ Schedule call in 2 days?         │
│  □ Notify sales manager?            │
│  [Apply Selected] [Skip]            │
└─────────────────────────────────────┘
         │
         ▼ (if approved)
┌─────────────────────────────────────┐
│  PipelineAgent (execute)            │
│  ─────────────────────────────────  │
│  Action: Execute selected actions   │
│  Approval: Pre-approved by user     │
└─────────────────────────────────────┘
```

**Agent Specification:**
```python
pipeline_agent = Agent(
    name="PipelineAgent",
    model=get_tenant_model(tenant_id),
    instructions=[
        "When deal moves stages, suggest relevant automations",
        "Consider: follow-up emails, calls, notifications, tasks",
        "Tailor suggestions to the specific stage transition",
        "Always present options - never auto-execute without approval",
    ],
    tools=[
        suggest_automations,  # Returns options list
        Tool(
            execute_automation,
            requires_confirmation=True,  # APPROVAL GATE
        ),
        create_task,
        send_notification,
    ],
    db=get_agent_db(tenant_id),
)
```

**Stage-Specific Automations:**
| From Stage | To Stage | Suggested Automations |
|------------|----------|----------------------|
| Lead | Qualified | Follow-up email, schedule call |
| Qualified | Proposal | Generate proposal draft, notify manager |
| Proposal | Negotiation | Schedule meeting, prepare objection handling |
| Negotiation | Won | Send contract, create onboarding tasks |
| Any | Lost | Send feedback request, schedule re-engage |

---

### Flow 4: High-Value Deal Approval

```
DEAL VALUE EXCEEDS THRESHOLD ($X)
         │
         ▼
┌─────────────────────────────────────┐
│  ApprovalAgent                      │
│  ─────────────────────────────────  │
│  Trigger: Deal value > threshold    │
│  Action: Request manager approval   │
│  Approval: YES - manager must OK    │
│  Output: Approval request           │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  APPROVAL QUEUE (Manager UI)        │
│  ─────────────────────────────────  │
│  "High-value deal requires review"  │
│  Deal: Acme Corp - $50,000          │
│  Requested by: Sales Rep            │
│  [Approve] [Reject] [Request Info]  │
└─────────────────────────────────────┘
         │
         ▼ (if approved)
┌─────────────────────────────────────┐
│  Deal proceeds to next stage        │
│  Audit log: "Approved by Manager"   │
└─────────────────────────────────────┘
```

**Agent Specification:**
```python
approval_agent = Agent(
    name="ApprovalAgent",
    model=get_tenant_model(tenant_id),
    instructions=[
        "Manage approval workflows for high-stakes actions",
        "Route approvals to appropriate approvers based on rules",
        "Track approval status and send reminders",
        "Log all approval decisions for audit",
    ],
    tools=[
        Tool(request_approval, requires_confirmation=True),
        send_approval_reminder,
        log_approval_decision,
    ],
    db=get_agent_db(tenant_id),
)
```

---

## Approval Gates Summary

| Scenario | Agent | Approval Type | Approver |
|----------|-------|---------------|----------|
| Pipeline automations | `PipelineAgent` | User confirmation | Current user |
| High-value deals | `ApprovalAgent` | Manager approval | Sales manager |
| Bulk operations | `ApprovalAgent` | User confirmation | Current user |
| External integrations | `DataEnricherAgent` | None (user-initiated) | N/A |
| Lead scoring | `LeadScorerAgent` | None (automatic) | N/A |

---

## Event Triggers

### Event-Driven Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  EVENT BUS (Redis/BullMQ)                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  contact.created ──────────► LeadScorerAgent.score()            │
│  contact.enriched ─────────► LeadScorerAgent.rescore()          │
│  deal.stage_changed ───────► PipelineAgent.suggest()            │
│  deal.value_threshold ─────► ApprovalAgent.request()            │
│  approval.granted ─────────► PipelineAgent.execute()            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Event Schema (per docs/archive/foundation-phase/MODULE-RESEARCH.md §1.4)

```typescript
interface CRMEvent {
  id: string;
  type: 'contact.created' | 'contact.enriched' | 'deal.stage_changed' | ...;
  timestamp: Date;
  tenantId: string;
  userId: string;
  payload: {
    entityType: 'contact' | 'company' | 'deal';
    entityId: string;
    changes?: Record<string, { old: any; new: any }>;
  };
  metadata: {
    source: 'user' | 'agent' | 'integration';
    agentId?: string;
  };
}
```

---

## Testing Requirements

| Agent | Test Priority | Key Test Cases |
|-------|---------------|----------------|
| `ApprovalAgent` | **CRITICAL** | No action executes without approval flag |
| `LeadScorerAgent` | HIGH | Score consistency, edge cases (missing data) |
| `PipelineAgent` | HIGH | Correct suggestions per stage, approval flow |
| `DataEnricherAgent` | MEDIUM | API failure handling, rate limiting |

### Critical Test: Approval Bypass Prevention

```python
def test_approval_required_tools_cannot_bypass():
    """Ensure requires_confirmation=True is enforced."""
    agent = PipelineAgent(tenant_id="test")

    # Attempt to execute without approval
    result = agent.execute_automation(automation_id="auto_123")

    # Should return pending_approval, NOT executed
    assert result.status == "pending_approval"
    assert result.requires_confirmation == True

    # Only after explicit confirmation
    result = agent.execute_automation(
        automation_id="auto_123",
        confirmation=True,
        approver_id="user_456"
    )
    assert result.status == "executed"
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Set up event bus (Redis + BullMQ)
- [ ] Create agent base class with tenant isolation
- [ ] Implement `get_tenant_model()` for BYOAI
- [ ] Create `get_agent_db()` for scoped persistence

### Phase 2: Agent Implementation
- [ ] `LeadScorerAgent` - automatic scoring
- [ ] `DataEnricherAgent` - user-initiated enrichment
- [ ] `PipelineAgent` - suggestions with approval
- [ ] `ApprovalAgent` - approval workflow management

### Phase 3: UI Integration
- [ ] Lead score badge component
- [ ] Enrich button + loading state
- [ ] Pipeline board with drag-drop
- [ ] Approval modal component
- [ ] Manager approval queue

### Phase 4: Testing
- [ ] Unit tests for each agent
- [ ] Integration tests for approval flows
- [ ] E2E tests for complete user journeys

---

## References

- **Agno Patterns:** `/docs/research/agno-analysis.md`
- **Twenty CRM Research:** `/docs/modules/bm-crm/research/twenty-crm-analysis.md`
- **Event Schema:** `docs/archive/foundation-phase/MODULE-RESEARCH.md §1.4`
- **Shared Data Contracts:** `docs/archive/foundation-phase/MODULE-RESEARCH.md §1.6`

---

**Document Status:** Ready for Implementation
**Next Step:** Create agents using `/bmad:bmb:workflows:create-agent`
