# BM-CRM Agent Mapping

**Created:** 2025-11-29
**Updated:** 2025-12-24
**Source:** Cross-Module Architecture Registry
**Status:** Aligned with Platform Standards

---

## Overview

This document maps CRM user flows to AI agents, defining what each agent does, when it's triggered, and whether human approval is required. All agents use the platform-standard @handle convention.

**Handle Convention:** `@{module}.{agent-key}` (e.g., `@bm-crm.clara`)

---

## Agent Registry

### Platform Agents (Shared)

| Handle | Display Name | Role | Used By |
|--------|--------------|------|---------|
| `@platform.navigator` | Navigator | Routes requests to appropriate module agents | All modules |
| `@platform.sentinel` | Sentinel | Approval Queue gatekeeper, HITL workflows | All modules |

### BM-CRM Module Agents (8 Total)

| Handle | Display Name | Role | Phase | Trigger |
|--------|--------------|------|-------|---------|
| `@bm-crm.clara` | Clara | Team Lead / Orchestrator | MVP | User requests, morning briefings |
| `@bm-crm.scout` | Scout | Lead Scoring | MVP | Contact creation, enrichment |
| `@bm-crm.atlas` | Atlas | Data Enrichment | MVP | User-initiated, new contacts |
| `@bm-crm.flow` | Flow | Pipeline Management | MVP | Deal stage changes |
| `@bm-crm.tracker` | Tracker | Activity Tracking | MVP | Email, call, meeting events |
| `@bm-crm.sync` | Sync | Integration Specialist | Growth | External CRM sync |
| `@bm-crm.guardian` | Guardian | Compliance (GDPR) | Growth | Data access, consent |
| `@bm-crm.cadence` | Cadence | Outreach Sequences | Growth | Sequence triggers |

> **Note:** Echo was renamed to Tracker to avoid collision with BM-Social Echo agent.

---

## User Flow to Agent Mapping

### Flow 1: Lead Capture & Scoring

```
NEW LEAD ARRIVES (form, import, API)
         │
         ▼
┌─────────────────────────────────────┐
│  @bm-crm.scout (Scout)              │
│  ─────────────────────────────────  │
│  Trigger: crm.contact.created       │
│  Action: Calculate lead score       │
│  Approval: None (automatic)         │
│  Output: Score 0-100 + tier         │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  CONTACT CARD (UI)                  │
│  Shows: Lead Score badge            │
│  Tier: COLD/WARM/HOT/SALES_READY    │
└─────────────────────────────────────┘
```

**Agent Specification:**
```python
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.storage.postgres import PostgresStorage

def create_scout_agent(
    model: str,
    storage: PostgresStorage,
) -> Agent:
    return Agent(
        name="Scout",
        role="Lead Scoring Specialist",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=[
            "You are Scout, the Lead Scoring Specialist.",
            "Score leads using the 40/35/25 algorithm:",
            "- Firmographic (40%): company size, industry, revenue",
            "- Behavioral (35%): email engagement, website visits",
            "- Intent (25%): demo requests, pricing views",
            "Assign tiers: COLD (<50), WARM (50-69), HOT (70-89), SALES_READY (90+)",
        ],
        tools=[calculate_lead_score, get_firmographic_data, get_behavioral_data],
        storage=storage,
    )
```

**Output Schema:**
```python
class LeadScore(BaseModel):
    score: int = Field(ge=0, le=100, description="Lead score 0-100")
    tier: Literal["cold", "warm", "hot", "sales_ready"]
    breakdown: ScoreBreakdown = Field(description="40/35/25 breakdown")
    reasoning: str = Field(description="Brief explanation of score")
    recommended_action: str = Field(description="Suggested next step")
```

---

### Flow 2: Contact Enrichment

```
USER CLICKS [Enrich] BUTTON
         │
         ▼
┌─────────────────────────────────────┐
│  @bm-crm.atlas (Atlas)              │
│  ─────────────────────────────────  │
│  Trigger: User-initiated action     │
│  Action: Provider waterfall lookup  │
│  Approval: None (user initiated)    │
│  Output: Enriched contact data      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  @bm-crm.scout (re-score)           │
│  ─────────────────────────────────  │
│  Trigger: crm.contact.enriched      │
│  Action: Recalculate with new data  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  CONTACT CARD (UI) - Updated        │
│  Shows: Company, title, LinkedIn    │
│  Shows: Updated lead score + tier   │
└─────────────────────────────────────┘
```

**Agent Specification:**
```python
def create_atlas_agent(
    model: str,
    storage: PostgresStorage,
) -> Agent:
    return Agent(
        name="Atlas",
        role="Data Enrichment Specialist",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=[
            "You are Atlas, the Data Enrichment Specialist.",
            "Enrich contacts using provider waterfall: Apollo → Clearbit → Hunter",
            "Track budget per tenant and respect rate limits",
            "Cache enriched data with 30-day TTL",
            "Return only verified information",
        ],
        tools=[
            enrich_contact,
            enrich_company,
            verify_email,
            lookup_apollo,
            lookup_clearbit,
            lookup_hunter,
        ],
        storage=storage,
    )
```

**Provider Waterfall:**
| Priority | Provider | Data Type | Fallback |
|----------|----------|-----------|----------|
| 1 | Apollo | Company, contact | → Clearbit |
| 2 | Clearbit | Company, logo | → Hunter |
| 3 | Hunter | Email verification | → Manual |

---

### Flow 3: Deal Pipeline Movement

```
USER DRAGS DEAL TO NEW STAGE
         │
         ▼
┌─────────────────────────────────────┐
│  @bm-crm.flow (Flow)                │
│  ─────────────────────────────────  │
│  Trigger: crm.deal.stage_changed    │
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
│  @bm-crm.flow (execute)             │
│  ─────────────────────────────────  │
│  Action: Execute selected actions   │
│  Approval: Pre-approved by user     │
└─────────────────────────────────────┘
```

**Agent Specification:**
```python
def create_flow_agent(
    model: str,
    storage: PostgresStorage,
) -> Agent:
    return Agent(
        name="Flow",
        role="Pipeline Manager",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=[
            "You are Flow, the Pipeline Manager.",
            "Suggest relevant automations when deals move stages",
            "Identify stuck deals using SLA thresholds",
            "Calculate pipeline health and forecast revenue",
            "Never auto-execute without user approval",
        ],
        tools=[
            move_deal_stage,
            suggest_next_action,
            identify_stuck_deals,
            calculate_pipeline_health,
            forecast_revenue,
        ],
        storage=storage,
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

### Flow 4: Activity Tracking

```
EMAIL/CALL/MEETING OCCURS
         │
         ▼
┌─────────────────────────────────────┐
│  @bm-crm.tracker (Tracker)          │
│  ─────────────────────────────────  │
│  Trigger: crm.activity.logged       │
│  Action: Update engagement score    │
│  Approval: None (automatic)         │
│  Output: Updated engagement metrics │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  CONTACT TIMELINE (UI)              │
│  Shows: Activity timeline           │
│  Shows: Engagement score trend      │
└─────────────────────────────────────┘
```

**Agent Specification:**
```python
def create_tracker_agent(
    model: str,
    storage: PostgresStorage,
) -> Agent:
    return Agent(
        name="Tracker",
        role="Activity Tracker",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=[
            "You are Tracker, the Activity Tracker.",
            "Log all engagement activities: emails, calls, meetings",
            "Calculate engagement scores using recency/frequency/depth",
            "Identify cold contacts with declining engagement",
            "Award activity points: email +2, click +5, reply +15, call +10, meeting +20",
        ],
        tools=[
            log_activity,
            get_activity_timeline,
            calculate_engagement_score,
            find_cold_contacts,
        ],
        storage=storage,
    )
```

---

### Flow 5: Clara Orchestration

```
USER ASKS "Who should I call today?"
         │
         ▼
┌─────────────────────────────────────┐
│  @bm-crm.clara (Clara)              │
│  ─────────────────────────────────  │
│  Trigger: User request              │
│  Action: Coordinate specialists     │
│  Approval: None                     │
│  Output: Prioritized action list    │
└─────────────────────────────────────┘
         │
         ├──► @bm-crm.scout (get hot leads)
         │
         ├──► @bm-crm.flow (check stuck deals)
         │
         └──► @bm-crm.tracker (get recent activity)
                    │
                    ▼
┌─────────────────────────────────────┐
│  CLARA SYNTHESIZES RESULTS          │
│  ─────────────────────────────────  │
│  "Here are your top 5 calls for     │
│  today, ranked by opportunity..."   │
└─────────────────────────────────────┘
```

**Agent Specification:**
```python
def create_clara_agent(
    model: str,
    storage: PostgresStorage,
) -> Agent:
    return Agent(
        name="Clara",
        role="CRM Team Lead",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=[
            "You are Clara, the CRM Team Lead.",
            "Route requests to specialists: Scout (scoring), Atlas (enrichment), Flow (pipeline), Tracker (activities)",
            "Synthesize multi-agent results into actionable insights",
            "Generate morning briefings with prioritized actions",
            "Coordinate with @platform.navigator for cross-module requests",
        ],
        tools=[
            generate_daily_briefing,
            prioritize_contacts,
            synthesize_team_results,
        ],
        storage=storage,
        team_members=["Scout", "Atlas", "Flow", "Tracker"],
    )
```

---

### Flow 6: High-Value Deal Approval

```
DEAL VALUE EXCEEDS THRESHOLD ($X)
         │
         ▼
┌─────────────────────────────────────┐
│  @platform.sentinel                 │
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
```

---

## A2A Communication Patterns

### Inter-Agent Protocol

BM-CRM agents communicate via the A2A (Agent-to-Agent) protocol:

```
┌─────────────────────────────────────────────────────────────────┐
│  A2A PROTOCOL                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  @bm-crm.clara ─────────► @bm-crm.scout (delegate scoring)      │
│  @bm-crm.clara ─────────► @bm-crm.flow (check pipeline)         │
│  @bm-crm.tracker ───────► @core-pm.navi (link to tasks)         │
│  @bm-crm.clara ─────────► @core-pm.navi (handoff on deal won)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AgentCard Discovery

Each agent exposes an AgentCard for discovery:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Clara",
  "handle": "@bm-crm.clara",
  "description": "CRM Team Lead and Orchestrator",
  "module": "bm-crm",
  "skills": [
    "score_lead",
    "enrich_contact",
    "manage_pipeline",
    "generate_briefing"
  ],
  "endpoints": {
    "rpc": "/a2a/bm-crm/rpc",
    "ws": "/a2a/bm-crm/ws"
  }
}
```

---

## Approval Gates Summary

| Scenario | Agent | Approval Type | Approver |
|----------|-------|---------------|----------|
| Pipeline automations | `@bm-crm.flow` | User confirmation | Current user |
| High-value deals | `@platform.sentinel` | Manager approval | Sales manager |
| Bulk operations | `@platform.sentinel` | User confirmation | Current user |
| Data enrichment | `@bm-crm.atlas` | None (user-initiated) | N/A |
| Lead scoring | `@bm-crm.scout` | None (automatic) | N/A |
| Activity logging | `@bm-crm.tracker` | None (automatic) | N/A |

---

## Event Triggers

### Event-Driven Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  EVENT BUS (Redis Streams)                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  crm.contact.created ────────► @bm-crm.scout.score()            │
│  crm.contact.enriched ───────► @bm-crm.scout.rescore()          │
│  crm.deal.stage_changed ─────► @bm-crm.flow.suggest()           │
│  crm.deal.won ───────────────► @bm-crm.clara.handoff()          │
│  crm.activity.logged ────────► @bm-crm.tracker.update()         │
│  approval.granted ───────────► @bm-crm.flow.execute()           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Event Schema

```typescript
interface CRMEvent {
  id: string;
  type: 'crm.contact.created' | 'crm.contact.enriched' | 'crm.deal.stage_changed' | ...;
  timestamp: Date;
  workspaceId: string;
  userId: string;
  correlationId?: string;
  payload: {
    entityType: 'contact' | 'account' | 'deal' | 'activity';
    entityId: string;
    changes?: Record<string, { old: any; new: any }>;
  };
  metadata: {
    source: 'user' | 'agent' | 'integration';
    agentHandle?: string;
  };
}
```

---

## Testing Requirements

| Agent | Test Priority | Key Test Cases |
|-------|---------------|----------------|
| `@bm-crm.clara` | **CRITICAL** | Team coordination, briefing generation |
| `@bm-crm.scout` | HIGH | Score consistency, tier classification |
| `@bm-crm.flow` | HIGH | Stage validation, approval flow |
| `@bm-crm.atlas` | HIGH | Provider waterfall, budget tracking |
| `@bm-crm.tracker` | MEDIUM | Engagement scoring, activity logging |
| `@platform.sentinel` | **CRITICAL** | Approval bypass prevention |

### Critical Test: Approval Bypass Prevention

```python
def test_approval_required_tools_cannot_bypass():
    """Ensure requires_confirmation=True is enforced."""
    flow = create_flow_agent(model="claude-sonnet-4-20250514", storage=storage)

    # Attempt to execute without approval
    result = flow.execute_automation(automation_id="auto_123")

    # Should return pending_approval, NOT executed
    assert result.status == "pending_approval"
    assert result.requires_confirmation == True

    # Only after explicit confirmation
    result = flow.execute_automation(
        automation_id="auto_123",
        confirmation=True,
        approver_id="user_456"
    )
    assert result.status == "executed"
```

---

## Implementation Checklist

### Phase 1: MVP Agents (5)
- [ ] `@bm-crm.clara` - Team Lead / Orchestrator
- [ ] `@bm-crm.scout` - Lead Scoring
- [ ] `@bm-crm.atlas` - Data Enrichment
- [ ] `@bm-crm.flow` - Pipeline Management
- [ ] `@bm-crm.tracker` - Activity Tracking

### Phase 2: Growth Agents (3)
- [ ] `@bm-crm.sync` - Integration Specialist (HubSpot, Salesforce)
- [ ] `@bm-crm.guardian` - Compliance (GDPR)
- [ ] `@bm-crm.cadence` - Outreach Sequences

### Phase 3: Cross-Module Integration
- [ ] A2A communication with `@core-pm.navi`
- [ ] Deal→Project handoff workflow
- [ ] KB playbook integration

---

## References

- **Cross-Module Architecture:** `/docs/architecture/cross-module-architecture.md`
- **Dynamic Module System:** `/docs/architecture/dynamic-module-system.md`
- **CRM Architecture:** `/docs/modules/bm-crm/architecture.md`
- **CRM PRD:** `/docs/modules/bm-crm/PRD.md`
- **Event Schema:** `/docs/architecture/event-bus.md`

---

_Aligned with Cross-Module Architecture v1.0 (2024-12-24)_
