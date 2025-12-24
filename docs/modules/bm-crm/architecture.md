# BM-CRM Module Architecture

**Author:** Chris
**Date:** 2025-12-16
**Version:** 1.1
**Status:** Draft (Updated for Core-PM integration)
**Parent:** [Platform Architecture](/docs/architecture.md)

---

## Overview

This document defines the **module-specific architecture** for BM-CRM. It builds on the HYVVE Platform Foundation architecture and focuses on CRM-specific technical decisions not covered by the foundation.

### Scope

This architecture covers:
- CRM agent team coordination patterns
- External data enrichment integration
- Lead scoring engine design
- Email sequence state machine
- CRM-specific event patterns
- Data retention and compliance implementation
- **Growth features architecture** (Phase 2 & 3)

For platform-level architecture (multi-tenancy, auth, event bus, BYOAI), see [Platform Architecture](/docs/architecture.md).

### Phase Legend

| Phase | Timeline | Focus |
|-------|----------|-------|
| **MVP** | Phase 1 | Core CRM with 5 agents (Clara, Scout, Atlas, Flow, Tracker) |
| **Growth-Phase2** | Phase 2 | +Sync, +Guardian, custom scoring, calendar integration |
| **Growth-Phase3** | Phase 3 | +Cadence, multi-pipeline, analytics, mobile, LinkedIn |
| **Vision** | Future | Predictive ML, conversation intelligence, revenue forecasting |

---

## Module Dependencies

BM-CRM depends on these platform foundation capabilities:

| Platform Capability | CRM Usage |
|---------------------|-----------|
| **Multi-tenancy (RLS)** | All CRM data tenant-scoped |
| **BYOAI** | AI provider selection for agent execution |
| **Event Bus** | Publish CRM events, subscribe to platform/pm events |
| **Approval Queue** | High-impact CRM actions require approval |
| **WebSocket Gateway** | Real-time tier change notifications |
| **AgentOS** | CRM team execution runtime |
| **AG-UI Protocol** | Frontend communication via CopilotKit (Generative UI) |
| **A2A Protocol** | Inter-module agent communication (Clara↔Navi) |
| **MCP Protocol** | External tool integration (enrichment providers) |
| **Core-PM** | Project linking, KB for playbooks, task integration |

> **Protocol Reference:** See [Dynamic Module System](/docs/architecture/dynamic-module-system.md) for details on the "Unified Protocol" architecture (Agno + CopilotKit).

Note: Core-PM is platform core but not fully implemented yet; BM-CRM must degrade gracefully (queue/skip Core-PM link features) until Core-PM endpoints and models land.

---

## Agent Team Architecture `[MVP]`

### Team Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRM TEAM BOUNDARY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     CLARA (Leader)                        │   │
│  │  - Routes user requests to specialists                    │   │
│  │  - Synthesizes multi-agent results                        │   │
│  │  - Maintains conversation context                         │   │
│  │  - Generates daily briefing                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│      ┌───────────┬───────────┼───────────┬───────────┐          │
│      │           │           │           │           │          │
│  ┌───┴───┐   ┌───┴───┐   ┌───┴───┐   ┌───┴───┐   ┌───┴───┐     │
│  │ Scout │   │ Atlas │   │ Flow  │   │Tracker│   │Growth │     │
│  │(Score)│   │(Enrich│   │(Pipe) │   │(Track)│   │Agents │     │
│  └───────┘   └───────┘   └───────┘   └───────┘   └───────┘     │
│      │           │           │           │                      │
│  ┌───┴───────────┴───────────┴───────────┴──────────────────┐   │
│  │                    SHARED TOOLS (tools.py)                │   │
│  │  - calculate_lead_score     - enrich_contact             │   │
│  │  - move_deal_stage          - log_activity               │   │
│  │  - get_engagement_score     - request_crm_approval       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    A2A / Event Bus
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                      PLATFORM LAYER                              │
│   Sentinel (Approval)  │  Event Bus  │  Core-PM (Navi + KB)     │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Communication Patterns

BM-CRM uses the "Unified Protocol" architecture from the platform:

| Protocol | Purpose | Usage |
|----------|---------|-------|
| **AG-UI** | Frontend↔Agent | CopilotKit Generative UI, "Ask Clara" chat |
| **A2A** | Agent↔Agent | Clara↔Navi coordination, inter-module tasks |
| **MCP** | Agent↔Tools | External enrichment APIs, third-party services |

**1. User Request Flow (AG-UI via CopilotKit)**
```
Browser → CopilotKit → AG-UI → Clara → [Scout|Atlas|Flow|Tracker] → Clara → AG-UI → UI Render
```
- User interacts via "Ask Clara" chat or Generative UI components
- CopilotKit's `useCoAgent` manages state synchronization
- Clara routes to appropriate specialist(s)
- Results rendered via Generative UI or streamed text

**2. Event-Driven Flow (Asynchronous)**
```
Event → CRM Event Handler → Agent → [Action/Approval Request]
```
- Platform events (e.g., `user.signup`) trigger CRM handlers
- CRM events (e.g., `crm.contact.created`) trigger agent workflows
- High-impact actions create approval requests

**3. Inter-Module Communication (A2A)**
```
Other Module Agent → A2A RPC → Clara → [Delegate] → Response
```
- External modules invoke CRM via A2A protocol
- Clara acts as gateway, routing to specialists

**4. Core-PM Cross-Team Coordination `[Growth-Phase3]`**
```
Clara ←→ Navi (A2A)
  │
  ├── Deal Won → Create Onboarding Project
  ├── Activity Logged → Link to PM Task
  ├── KB Query → Search CRM Playbooks
  └── Customer Handoff → Cross-Team Context Transfer
```
- Clara coordinates with Navi for project/task integration
- CRM playbooks stored in KB via Scribe agent
- Deal lifecycle events can trigger PM workflows
- Tracker activities can reference PM tasks

---

## Data Enrichment Architecture `[MVP]`

### Provider Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    ATLAS (Enrichment Agent)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │            ENRICHMENT ORCHESTRATOR                   │     │
│  │  - Provider selection (waterfall)                    │     │
│  │  - Budget enforcement                                │     │
│  │  - Rate limiting                                     │     │
│  │  - Cache-first strategy                              │     │
│  └─────────────────────────────────────────────────────┘     │
│                           │                                   │
│    ┌──────────────────────┼──────────────────────┐           │
│    │                      │                      │           │
│  ┌─┴──────────┐    ┌──────┴──────┐    ┌─────────┴─┐         │
│  │  CLEARBIT  │    │   APOLLO    │    │  HUNTER   │         │
│  │  Adapter   │    │   Adapter   │    │  Adapter  │         │
│  └────────────┘    └─────────────┘    └───────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           │
                    External APIs
```

### Provider Adapter Pattern

Each enrichment provider implements a common interface:

```python
# agents/crm/enrichment/base.py

from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Optional

class EnrichmentResult(BaseModel):
    success: bool
    data: Optional[dict]
    source: str
    credits_used: int
    error: Optional[str] = None

class EnrichmentProvider(ABC):
    """Base class for enrichment providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name (e.g., 'clearbit', 'apollo')."""
        pass

    @property
    @abstractmethod
    def cost_per_lookup(self) -> float:
        """Cost in credits per lookup."""
        pass

    @abstractmethod
    async def enrich_contact(self, email: str) -> EnrichmentResult:
        """Enrich contact by email."""
        pass

    @abstractmethod
    async def enrich_company(self, domain: str) -> EnrichmentResult:
        """Enrich company by domain."""
        pass

    @abstractmethod
    async def check_rate_limit(self) -> bool:
        """Check if rate limit allows a request."""
        pass
```

### Enrichment Waterfall Strategy

```python
# ADR-CRM-001: Enrichment Provider Selection

ENRICHMENT_WATERFALL = {
    "contact": ["apollo", "clearbit", "hunter"],
    "company": ["clearbit", "apollo"],
    "email_verify": ["zerobounce", "hunter"]
}

# Strategy:
# 1. Check cache first (7-day TTL for company, 30-day for contact)
# 2. Try providers in waterfall order
# 3. Stop on first success
# 4. Track which provider succeeded for analytics
```

### Budget Enforcement

```
┌────────────────────────────────────────────────────┐
│              ENRICHMENT BUDGET TRACKER             │
├────────────────────────────────────────────────────┤
│  Tenant: workspace_123                             │
│  Monthly Budget: $50.00                            │
│  Current Spend: $32.45 (65%)                       │
│  Remaining: $17.55                                 │
├────────────────────────────────────────────────────┤
│  Alert Thresholds:                                 │
│  ├── 50% → In-app notification                    │
│  ├── 75% → In-app + email to admin                │
│  ├── 90% → Slack alert (if configured)            │
│  └── 100% → Auto-pause (configurable)             │
└────────────────────────────────────────────────────┘
```

**Database Table:**
```sql
CREATE TABLE crm_enrichment_usage (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  credits_used INT NOT NULL,
  cost_usd DECIMAL(10,4) NOT NULL,
  entity_type TEXT NOT NULL, -- 'contact' | 'company'
  entity_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id)
    REFERENCES workspaces(id)
);

CREATE INDEX idx_enrichment_workspace_month
  ON crm_enrichment_usage(workspace_id, DATE_TRUNC('month', created_at));
```

### Enrichment Caching Strategy

| Data Type | Cache Location | TTL | Invalidation |
|-----------|----------------|-----|--------------|
| Company firmographics | PostgreSQL (JSON column) | 30 days | Manual refresh |
| Contact job title | PostgreSQL | 30 days | Manual refresh |
| Email verification | Redis | 7 days | On bounce |
| Social links | PostgreSQL | 90 days | Manual refresh |
| Tech stack | PostgreSQL | 30 days | On company update |

**Cache Key Pattern:**
```
enrich:{workspace_id}:{entity_type}:{entity_id}:{field}
```

---

## Lead Scoring Engine `[MVP]`

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SCOUT (Scoring Agent)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              SCORING ENGINE                          │     │
│  │                                                      │     │
│  │  Input: Contact + Account + Activities               │     │
│  │                    │                                 │     │
│  │         ┌─────────┴─────────┐                       │     │
│  │         │ SCORE CALCULATOR   │                       │     │
│  │         ├───────────────────┤                       │     │
│  │         │ Firmographic: 40% │ ← Account data        │     │
│  │         │ Behavioral:   35% │ ← Activity data       │     │
│  │         │ Intent:       25% │ ← Event signals       │     │
│  │         └─────────┬─────────┘                       │     │
│  │                   │                                 │     │
│  │         ┌─────────┴─────────┐                       │     │
│  │         │ TIER CLASSIFIER    │                       │     │
│  │         ├───────────────────┤                       │     │
│  │         │ 90-100: SALES_READY│                       │     │
│  │         │ 70-89:  HOT        │                       │     │
│  │         │ 50-69:  WARM       │                       │     │
│  │         │ 0-49:   COLD       │                       │     │
│  │         └───────────────────┘                       │     │
│  │                                                      │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Scoring Triggers

| Trigger Event | Scoring Action | Latency Target |
|---------------|----------------|----------------|
| `crm.contact.created` | Full score calculation | < 2s |
| `crm.contact.enriched` | Recalculate firmographic | < 500ms |
| `crm.activity.logged` | Recalculate behavioral | < 500ms |
| `crm.deal.stage_changed` | Recalculate intent | < 500ms |
| `cron:nightly` | Decay stale scores | Batch |

### Score Calculation Flow

```python
# agents/crm/scoring/engine.py

async def calculate_score(contact_id: str) -> ScoreResult:
    """
    Calculate lead score with breakdown.

    ADR-CRM-002: Scoring is event-driven, not polling.
    Each component is calculated from cached data when possible.
    """
    # 1. Gather inputs (parallel)
    contact, account, activities = await asyncio.gather(
        get_contact(contact_id),
        get_account_for_contact(contact_id),
        get_recent_activities(contact_id, days=90)
    )

    # 2. Calculate component scores
    firmographic_score = calculate_firmographic(account)  # 0-100
    behavioral_score = calculate_behavioral(activities)   # 0-100
    intent_score = calculate_intent(contact, activities)  # 0-100

    # 3. Apply weights (configurable per tenant)
    weights = await get_tenant_weights(contact.workspace_id)
    total = (
        firmographic_score * weights.firmographic +
        behavioral_score * weights.behavioral +
        intent_score * weights.intent
    )

    # 4. Classify tier
    tier = classify_tier(total, await get_tenant_thresholds(contact.workspace_id))

    # 5. Detect tier change
    previous_tier = contact.score_tier
    tier_changed = tier != previous_tier

    # 6. Return with breakdown
    return ScoreResult(
        score=total,
        tier=tier,
        tier_changed=tier_changed,
        previous_tier=previous_tier,
        breakdown={
            "firmographic": firmographic_score,
            "behavioral": behavioral_score,
            "intent": intent_score,
        }
    )
```

### Score Caching

```
Score Cache (Redis):
├── score:{contact_id}:total → 78
├── score:{contact_id}:tier → "HOT"
├── score:{contact_id}:breakdown → {"firmographic": 80, ...}
├── score:{contact_id}:calculated_at → 2025-12-15T10:30:00Z
└── TTL: 24 hours (recalculated on activity)
```

**Invalidation:** Scores are recalculated on any trigger event, so TTL is a fallback for stale data.

---

## Email Sequence State Machine `[Growth-Phase3]`

### State Diagram

```
                    ┌─────────────┐
                    │   CREATED   │
                    └──────┬──────┘
                           │ enroll_contact()
                           ▼
        ┌──────────────────────────────────────┐
        │                                      │
        ▼                                      │
┌───────────────┐                              │
│  STEP_PENDING │◄─────────────────────────────┤
└───────┬───────┘    next_step() (more steps)  │
        │                                      │
        │ send_step()                          │
        ▼                                      │
┌───────────────┐                              │
│  STEP_SENT    │                              │
└───────┬───────┘                              │
        │                                      │
   ┌────┴────────────────────┐                 │
   │                         │                 │
   ▼                         ▼                 │
┌─────────┐           ┌────────────┐           │
│ REPLIED │           │ NO_RESPONSE│───────────┘
└────┬────┘           └────────────┘
     │
     ▼
┌─────────────┐
│  COMPLETED  │
└─────────────┘

Parallel States:
┌──────────┐  ┌──────────┐  ┌─────────────┐
│  PAUSED  │  │ BOUNCED  │  │ UNSUBSCRIBED│
└──────────┘  └──────────┘  └─────────────┘
```

### Sequence Enrollment Table

```sql
CREATE TABLE crm_sequence_enrollments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  sequence_id TEXT NOT NULL,
  current_step INT DEFAULT 1,
  status TEXT DEFAULT 'pending', -- pending, active, paused, completed, bounced, unsubscribed
  enrolled_at TIMESTAMP DEFAULT NOW(),
  next_send_at TIMESTAMP,
  completed_at TIMESTAMP,
  metadata JSONB,

  CONSTRAINT fk_contact FOREIGN KEY (contact_id) REFERENCES crm_contacts(id),
  CONSTRAINT fk_sequence FOREIGN KEY (sequence_id) REFERENCES crm_sequences(id),
  UNIQUE(contact_id, sequence_id)
);

CREATE INDEX idx_sequence_next_send
  ON crm_sequence_enrollments(next_send_at)
  WHERE status = 'active';
```

### Sequence Step Execution

```python
# BullMQ job processor for sequence steps

async def process_sequence_step(job: Job):
    """
    Process a scheduled sequence step.

    ADR-CRM-003: Sequences use BullMQ delayed jobs.
    Each step schedules the next step on completion.
    """
    enrollment_id = job.data["enrollment_id"]
    enrollment = await get_enrollment(enrollment_id)

    # Guard conditions
    if enrollment.status != "active":
        return {"skipped": True, "reason": enrollment.status}

    # Get current step
    sequence = await get_sequence(enrollment.sequence_id)
    step = sequence.steps[enrollment.current_step - 1]

    # Execute step based on channel
    match step.channel:
        case "email":
            result = await send_email_step(enrollment, step)
        case "linkedin":
            result = await queue_linkedin_step(enrollment, step)
        case "task":
            result = await create_task_step(enrollment, step)

    # Update enrollment
    if enrollment.current_step < len(sequence.steps):
        # Schedule next step
        next_step = sequence.steps[enrollment.current_step]
        delay_ms = next_step.delay_hours * 60 * 60 * 1000
        await queue.add(
            "sequence_step",
            {"enrollment_id": enrollment_id},
            {"delay": delay_ms}
        )
        await update_enrollment(enrollment_id, {
            "current_step": enrollment.current_step + 1,
            "next_send_at": datetime.now() + timedelta(hours=next_step.delay_hours)
        })
    else:
        # Sequence complete
        await update_enrollment(enrollment_id, {
            "status": "completed",
            "completed_at": datetime.now()
        })
        await emit_event("crm.sequence.completed", {
            "contact_id": enrollment.contact_id,
            "sequence_id": enrollment.sequence_id
        })

    return result
```

### Conflict Detection

```python
# Before enrollment, check for conflicts

async def check_enrollment_conflicts(contact_id: str, sequence_id: str) -> list[Conflict]:
    """
    Detect potential conflicts before enrolling in sequence.

    ADR-CRM-004: Prevent channel collision and over-contact.
    """
    conflicts = []

    # 1. Already in this sequence?
    existing = await get_active_enrollment(contact_id, sequence_id)
    if existing:
        conflicts.append(Conflict(
            type="duplicate",
            message=f"Contact already in sequence at step {existing.current_step}"
        ))

    # 2. In another active sequence?
    other_sequences = await get_active_sequences_for_contact(contact_id)
    for enrollment in other_sequences:
        conflicts.append(Conflict(
            type="parallel",
            message=f"Contact in '{enrollment.sequence.name}' - step {enrollment.current_step}/{len(enrollment.sequence.steps)}"
        ))

    # 3. Daily touch limit exceeded?
    today_touches = await count_today_outreach(contact_id)
    if today_touches >= 2:
        conflicts.append(Conflict(
            type="rate_limit",
            message=f"Contact already received {today_touches} outreach touches today"
        ))

    return conflicts
```

---

## CRM Event Patterns `[MVP]`

### Event Schema

All CRM events follow the platform event schema with CRM-specific data:

```typescript
// CRM Event Types
interface CrmContactCreatedEvent extends BaseEvent {
  type: 'crm.contact.created';
  data: {
    contactId: string;
    email: string | null;
    source: string;
    shouldEnrich: boolean;
  };
}

interface CrmContactScoredEvent extends BaseEvent {
  type: 'crm.contact.scored';
  data: {
    contactId: string;
    score: number;
    tier: 'COLD' | 'WARM' | 'HOT' | 'SALES_READY';
    previousTier: string | null;
    tierChanged: boolean;
    breakdown: {
      firmographic: number;
      behavioral: number;
      intent: number;
    };
  };
}

interface CrmDealStageChangedEvent extends BaseEvent {
  type: 'crm.deal.stage_changed';
  data: {
    dealId: string;
    fromStage: string;
    toStage: string;
    value: number;
    triggeredBy: 'user' | 'agent' | 'automation';
  };
}
```

### Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRM EVENT FLOWS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CONTACT CREATED FLOW                                           │
│  ─────────────────                                              │
│  User creates contact                                           │
│       │                                                          │
│       ▼                                                          │
│  crm.contact.created ──┬──► Atlas: Enrich contact               │
│                        │                                         │
│                        └──► Scout: Calculate initial score       │
│                                    │                             │
│                                    ▼                             │
│                        crm.contact.scored ──► Flow: Check tier   │
│                                                   │              │
│                                                   ▼              │
│                                    (If HOT+) crm.lead.qualified  │
│                                                                  │
│  DEAL CLOSED FLOW                                               │
│  ───────────────                                                │
│  User closes deal as Won                                        │
│       │                                                          │
│       ▼                                                          │
│  crm.deal.stage_changed (to: Closed Won)                        │
│       │                                                          │
│       ├──► crm.deal.won ──► External: Notify CS module          │
│       │                                                          │
│       └──► Contact lifecycle update (to: customer)              │
│                  │                                               │
│                  ▼                                               │
│       crm.contact.lifecycle_changed                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Event Handlers (NestJS)

```typescript
// apps/api/src/crm/events/crm-event.handler.ts

@Injectable()
export class CrmEventHandler {
  constructor(
    private readonly eventsService: EventsService,
    private readonly crmAgentClient: CrmAgentClient,
  ) {}

  @OnEvent('crm.contact.created')
  async handleContactCreated(event: CrmContactCreatedEvent) {
    const { contactId, shouldEnrich } = event.data;

    // Trigger enrichment if enabled
    if (shouldEnrich) {
      await this.crmAgentClient.invokeAgent('atlas', {
        task: 'enrich_contact',
        params: { contactId }
      });
    }

    // Trigger scoring
    await this.crmAgentClient.invokeAgent('scout', {
      task: 'score_lead',
      params: { contactId }
    });
  }

  @OnEvent('crm.contact.scored')
  async handleContactScored(event: CrmContactScoredEvent) {
    const { contactId, tier, tierChanged, previousTier } = event.data;

    if (tierChanged && tier === 'SALES_READY') {
      // High-priority lead - notify immediately
      await this.eventsService.emit('notification.urgent', {
        type: 'lead_qualified',
        contactId,
        message: `Lead upgraded from ${previousTier} to SALES_READY`
      });
    }
  }
}
```

---

## Data Retention & Compliance `[Growth-Phase2]`

### GDPR Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    GUARDIAN (Compliance Agent)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DATA SUBJECT REQUEST FLOWS                                     │
│  ─────────────────────────                                      │
│                                                                  │
│  1. ERASURE (Right to be Forgotten)                             │
│     Request ──► Guardian identifies all data                    │
│                    │                                             │
│                    ▼                                             │
│     Data inventory created (contacts, activities, deals)        │
│                    │                                             │
│                    ▼                                             │
│     Approval request ──► Sentinel (requires admin approval)     │
│                    │                                             │
│                    ▼                                             │
│     Execute deletion ──► Audit log entry                        │
│                    │                                             │
│                    ▼                                             │
│     crm.compliance.erasure_completed event                      │
│                                                                  │
│  2. DATA EXPORT (Portability)                                   │
│     Request ──► Guardian collects all data                      │
│                    │                                             │
│                    ▼                                             │
│     Generate JSON/CSV export                                    │
│                    │                                             │
│                    ▼                                             │
│     Store in secure temp location (24h expiry)                  │
│                    │                                             │
│                    ▼                                             │
│     Send download link to requester                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Retention Policies

```sql
-- Retention configuration table
CREATE TABLE crm_retention_policies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'contact', 'activity', 'deal'
  retention_days INT NOT NULL,
  action TEXT NOT NULL, -- 'archive', 'delete', 'anonymize'
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  UNIQUE(workspace_id, entity_type)
);

-- Default policies (applied if no custom policy)
INSERT INTO crm_retention_policies (id, workspace_id, entity_type, retention_days, action)
VALUES
  ('default_contact', 'default', 'contact', 730, 'anonymize'),  -- 2 years
  ('default_activity', 'default', 'activity', 365, 'delete'),   -- 1 year
  ('default_deal', 'default', 'deal', 1095, 'archive');         -- 3 years
```

### Anonymization Strategy

```python
# Guardian's anonymization for expired contacts

async def anonymize_contact(contact_id: str) -> AuditLog:
    """
    Anonymize contact while preserving aggregate data.

    ADR-CRM-005: Anonymize over delete for analytics preservation.
    """
    contact = await get_contact(contact_id)

    # Fields to anonymize
    anonymized = {
        "firstName": "Anonymized",
        "lastName": "User",
        "email": f"anon_{contact_id[:8]}@anonymized.local",
        "phone": None,
        "address": None,
        "socialLinks": None,
        "customFields": {},  # Clear PII from custom fields
    }

    # Preserve for analytics
    preserved = {
        "leadScore": contact.lead_score,  # Preserved
        "scoreTier": contact.score_tier,  # Preserved
        "lifecycle": contact.lifecycle,    # Preserved
        "source": contact.source,          # Preserved
        "accountId": contact.account_id,   # Preserved (company association)
    }

    await update_contact(contact_id, {**anonymized, **preserved})

    # Log for audit
    return await create_audit_log({
        "action": "anonymize",
        "entityType": "contact",
        "entityId": contact_id,
        "workspaceId": contact.workspace_id,
        "reason": "retention_policy",
        "fieldsAnonymized": list(anonymized.keys())
    })
```

### Consent Tracking

```sql
CREATE TABLE crm_consents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  consent_type TEXT NOT NULL, -- 'marketing_email', 'sales_outreach', 'data_processing', 'third_party'
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMP,
  withdrawn_at TIMESTAMP,
  source TEXT NOT NULL, -- 'form', 'import', 'manual', 'api'
  ip_address TEXT,
  evidence_url TEXT, -- Link to form submission or document
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_contact FOREIGN KEY (contact_id) REFERENCES crm_contacts(id)
);

CREATE INDEX idx_consent_contact ON crm_consents(contact_id);
CREATE INDEX idx_consent_type ON crm_consents(consent_type, granted);
```

---

## Integration Sync Architecture `[Growth-Phase2]`

### Sync Engine Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNC (Integration Agent)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  SYNC ENGINE                             │    │
│  │                                                          │    │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │    │
│  │  │  INBOUND    │   │  CONFLICT   │   │  OUTBOUND   │    │    │
│  │  │  PROCESSOR  │◄─►│  RESOLVER   │◄─►│  PROCESSOR  │    │    │
│  │  └──────┬──────┘   └─────────────┘   └──────┬──────┘    │    │
│  │         │                                    │           │    │
│  │         ▼                                    ▼           │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │            FIELD MAPPING ENGINE                  │    │    │
│  │  │  BM-CRM Field ←→ External CRM Field             │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ADAPTERS                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │ HubSpot  │  │Salesforce│  │ Pipedrive│  │   CSV    │  │   │
│  │  │ Adapter  │  │ Adapter  │  │ Adapter  │  │ Adapter  │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Sync Modes

| Mode | Trigger | Latency | Use Case |
|------|---------|---------|----------|
| **Real-time** | Webhook | < 30s | Critical updates (deal closed) |
| **Scheduled** | Cron (15min) | 15-30 min | Bulk changes |
| **Manual** | User action | Immediate | Force sync |

### Conflict Resolution

```python
# Conflict resolution strategies

class ConflictStrategy(Enum):
    MOST_RECENT_WINS = "most_recent_wins"  # Default
    SOURCE_WINS = "source_wins"            # External CRM is source of truth
    TARGET_WINS = "target_wins"            # BM-CRM is source of truth
    MANUAL = "manual"                      # Queue for user resolution

async def resolve_conflict(
    local_record: dict,
    remote_record: dict,
    field: str,
    strategy: ConflictStrategy
) -> dict:
    """
    Resolve sync conflict for a specific field.

    ADR-CRM-006: Default to most_recent_wins for simplicity.
    Allow per-field strategy override.
    """
    match strategy:
        case ConflictStrategy.MOST_RECENT_WINS:
            if local_record["updatedAt"] > remote_record["updatedAt"]:
                return {"winner": "local", "value": local_record[field]}
            else:
                return {"winner": "remote", "value": remote_record[field]}

        case ConflictStrategy.SOURCE_WINS:
            return {"winner": "remote", "value": remote_record[field]}

        case ConflictStrategy.TARGET_WINS:
            return {"winner": "local", "value": local_record[field]}

        case ConflictStrategy.MANUAL:
            await create_sync_conflict({
                "field": field,
                "localValue": local_record[field],
                "remoteValue": remote_record[field],
                "localUpdatedAt": local_record["updatedAt"],
                "remoteUpdatedAt": remote_record["updatedAt"]
            })
            return {"winner": "pending", "value": None}
```

---

## Growth Features Architecture

This section documents architectural decisions for Growth-Phase2 and Growth-Phase3 features.

---

### Multi-Pipeline Support `[Growth-Phase3]`

Enable multiple deal pipelines per workspace (e.g., by product line, region, or segment).

**Data Model Extension:**

```sql
CREATE TABLE crm_pipelines (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  stages JSONB NOT NULL, -- [{name, order, probability, color}]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  UNIQUE(workspace_id, name)
);

-- Add pipeline_id to deals
ALTER TABLE crm_deals ADD COLUMN pipeline_id TEXT REFERENCES crm_pipelines(id);
```

**Architecture Pattern:**
- Each pipeline has its own stage configuration
- Deals can be moved between pipelines (with stage mapping)
- Pipeline-specific metrics and forecasting
- Default pipeline auto-assigned on deal creation

**Flow Agent Extension:**
```python
# New tools for multi-pipeline
def get_pipeline_metrics(pipeline_id: str) -> dict
def move_deal_to_pipeline(deal_id: str, target_pipeline_id: str, stage_mapping: dict) -> dict
def compare_pipelines(pipeline_ids: list[str]) -> dict
```

---

### Advanced Reporting & Analytics `[Growth-Phase3]`

Comprehensive CRM analytics with drill-down capabilities.

**Report Types:**

| Report | Description | Data Source |
|--------|-------------|-------------|
| Pipeline Velocity | Time in each stage, conversion rates | crm_deals + crm_deal_stage_history |
| Lead Source ROI | Conversion by source channel | crm_contacts + crm_deals |
| Rep Performance | Activity metrics per sales rep | crm_activities + crm_deals |
| Cohort Analysis | Win rates by contact creation date | crm_contacts + crm_deals |
| Forecast Accuracy | Predicted vs actual close rates | crm_deals (historical) |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYTICS ENGINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  REPORT BUILDER │    │  CHART RENDERER │                     │
│  │  - SQL queries  │───►│  - Line/Bar     │                     │
│  │  - Aggregations │    │  - Funnel       │                     │
│  │  - Filters      │    │  - Cohort       │                     │
│  └─────────────────┘    └─────────────────┘                     │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MATERIALIZED VIEWS (Nightly)                │    │
│  │  - mv_pipeline_metrics                                   │    │
│  │  - mv_rep_performance                                    │    │
│  │  - mv_source_conversion                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Database Tables:**

```sql
-- Stage history for velocity tracking
CREATE TABLE crm_deal_stage_history (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  changed_by TEXT NOT NULL,
  time_in_stage_hours INT,

  CONSTRAINT fk_deal FOREIGN KEY (deal_id) REFERENCES crm_deals(id)
);

CREATE INDEX idx_stage_history_deal ON crm_deal_stage_history(deal_id);

-- Materialized view for pipeline metrics
CREATE MATERIALIZED VIEW mv_pipeline_metrics AS
SELECT
  workspace_id,
  stage,
  COUNT(*) as deal_count,
  SUM(value) as total_value,
  AVG(EXTRACT(EPOCH FROM (changed_at - LAG(changed_at) OVER (PARTITION BY deal_id ORDER BY changed_at)))/3600) as avg_hours_in_stage
FROM crm_deals d
JOIN crm_deal_stage_history h ON d.id = h.deal_id
GROUP BY workspace_id, stage;
```

---

### Custom Scoring Model Configuration `[Growth-Phase2]`

Allow tenants to customize scoring weights and factors.

**Configuration Schema:**

```typescript
interface ScoringModelConfig {
  workspaceId: string;
  name: string;
  isActive: boolean;
  weights: {
    firmographic: number;  // 0-100, must sum to 100
    behavioral: number;
    intent: number;
  };
  firmographicFactors: {
    employeeCount: { ranges: { min: number; max: number; score: number }[] };
    industry: { values: { industry: string; score: number }[] };
    revenue: { ranges: { min: number; max: number; score: number }[] };
  };
  behavioralFactors: {
    emailOpens: { weight: number; decayDays: number };
    emailClicks: { weight: number; decayDays: number };
    websiteVisits: { weight: number; decayDays: number };
  };
  intentFactors: {
    demoRequest: number;
    pricingPageView: number;
    trialSignup: number;
    contactSalesForm: number;
  };
  tierThresholds: {
    salesReady: number;  // default 90
    hot: number;         // default 70
    warm: number;        // default 50
  };
}
```

**Database Table:**

```sql
CREATE TABLE crm_scoring_models (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  UNIQUE(workspace_id, name)
);
```

**Scout Agent Extension:**
- Load active scoring model for tenant
- Apply custom weights and factors
- Recalculate all scores when model changes (requires approval)

---

### Relationship Mapping Visualization `[Growth-Phase3]`

Visual graph of relationships between contacts, companies, and deals.

**Data Model:**

```sql
CREATE TABLE crm_relationships (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  from_entity_type TEXT NOT NULL, -- 'contact', 'account', 'deal'
  from_entity_id TEXT NOT NULL,
  to_entity_type TEXT NOT NULL,
  to_entity_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL, -- 'reports_to', 'works_with', 'decision_maker', 'influencer'
  strength INT DEFAULT 50, -- 0-100
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX idx_relationship_from ON crm_relationships(from_entity_type, from_entity_id);
CREATE INDEX idx_relationship_to ON crm_relationships(to_entity_type, to_entity_id);
```

**Visualization Architecture:**
- Use React Flow or D3.js for graph rendering
- Server returns graph data (nodes + edges)
- Client-side layout with force-directed algorithm
- Zoom, pan, and click-to-drill-down

**API Response:**

```typescript
interface RelationshipGraph {
  nodes: {
    id: string;
    type: 'contact' | 'account' | 'deal';
    label: string;
    data: Record<string, any>;
  }[];
  edges: {
    source: string;
    target: string;
    type: string;
    strength: number;
  }[];
}
```

---

### Mobile CRM Architecture `[Growth-Phase3]`

Responsive web + optional PWA for mobile access.

**Approach:** Progressive Web App (PWA) with offline-first patterns.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE CRM (PWA)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   SERVICE WORKER                         │    │
│  │  - Cache static assets                                   │    │
│  │  - Queue offline actions                                 │    │
│  │  - Background sync                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   OFFLINE STORAGE                        │    │
│  │  - IndexedDB for contacts (last 500)                    │    │
│  │  - IndexedDB for deals (active pipeline)                │    │
│  │  - Pending actions queue                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   MOBILE-FIRST VIEWS                     │    │
│  │  - Contact list (swipe actions)                         │    │
│  │  - Contact detail (tap-to-call)                         │    │
│  │  - Quick log activity                                   │    │
│  │  - Pipeline board (swipe to advance)                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Offline viewing of recent contacts and active deals
- Queue actions (log call, update status) for sync when online
- Push notifications for tier changes and deal updates
- Click-to-call integration with native phone app

---

### Calendar Integration `[Growth-Phase2]`

Bi-directional sync with Google Calendar and Outlook.

**Integration Pattern:**

```
┌──────────────────┐     ┌──────────────────┐
│  GOOGLE CALENDAR │     │ OUTLOOK CALENDAR │
│  (OAuth + API)   │     │ (OAuth + Graph)  │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         └──────────┬─────────────┘
                    │
         ┌──────────▼──────────┐
         │  CALENDAR ADAPTER   │
         │  - Fetch events     │
         │  - Create meetings  │
         │  - Update events    │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  ECHO AGENT         │
         │  - Log meetings     │
         │  - Match to contact │
         │  - Update activity  │
         └─────────────────────┘
```

**Database:**

```sql
CREATE TABLE crm_calendar_connections (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'outlook'
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  calendar_id TEXT,
  last_sync_at TIMESTAMP,
  sync_enabled BOOLEAN DEFAULT true,

  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  UNIQUE(workspace_id, user_id, provider)
);
```

**Sync Logic:**
- Poll for new events every 15 minutes
- Match event attendees to CRM contacts by email
- Auto-create activity records for matched meetings
- Two-way: Create calendar event when meeting scheduled in CRM

---

### LinkedIn Integration `[Growth-Phase3]`

Sales Navigator integration for prospecting and engagement tracking.

**Capabilities:**

| Feature | API Required | Description |
|---------|--------------|-------------|
| Profile lookup | LinkedIn API | Fetch profile by URL |
| Connection status | Sales Navigator | Track if connected |
| InMail send | Sales Navigator | Queue InMail via Cadence |
| Activity sync | Webhook | Log LinkedIn engagement |

**Architecture:**
- OAuth connection to LinkedIn/Sales Navigator
- Store LinkedIn profile URL on contact
- Cadence agent supports "linkedin" channel type
- Activity tracking via webhook (connection accepted, message replied)

**Limitations:**
- LinkedIn API is restrictive; Sales Navigator required for full features
- InMail quotas enforced by LinkedIn
- Profile data refresh limited by API rate limits

---

### Webhooks & Zapier Integration `[Growth-Phase3]`

Outbound webhooks for external automation platforms.

**Webhook Configuration:**

```sql
CREATE TABLE crm_webhooks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['crm.contact.created', 'crm.deal.won']
  secret_encrypted TEXT NOT NULL, -- For HMAC signature
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE TABLE crm_webhook_deliveries (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INT,
  response_body TEXT,
  delivered_at TIMESTAMP DEFAULT NOW(),
  retry_count INT DEFAULT 0,

  CONSTRAINT fk_webhook FOREIGN KEY (webhook_id) REFERENCES crm_webhooks(id)
);
```

**Delivery Pattern:**
- Events trigger webhook queue job
- Sign payload with HMAC-SHA256 using secret
- Retry with exponential backoff (max 5 attempts)
- Log all deliveries for debugging

**Zapier Integration:**
- Publish CRM app to Zapier
- Triggers: Contact created, Deal stage changed, Deal won/lost
- Actions: Create contact, Update contact, Log activity

---

### Public API `[Growth-Phase3]`

RESTful API for external integrations.

**Authentication:**
- API keys per workspace (stored encrypted)
- Rate limiting: 100 requests/minute per key
- Scoped permissions per key (read-only, read-write)

**Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/contacts` | GET, POST | List/create contacts |
| `/api/v1/contacts/:id` | GET, PATCH, DELETE | CRUD single contact |
| `/api/v1/accounts` | GET, POST | List/create accounts |
| `/api/v1/deals` | GET, POST | List/create deals |
| `/api/v1/activities` | GET, POST | List/create activities |
| `/api/v1/webhooks` | GET, POST, DELETE | Manage webhooks |

**API Key Table:**

```sql
CREATE TABLE crm_api_keys (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Hashed, not stored in plain
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  scopes TEXT[] NOT NULL, -- ['contacts:read', 'contacts:write', ...]
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);
```

---

## Architecture Decision Records (ADRs)

### ADR-CRM-001: Enrichment Provider Waterfall

**Context:** Multiple enrichment providers exist with varying cost, coverage, and accuracy.

**Decision:** Use waterfall strategy - try providers in priority order, stop on first success.

**Consequences:**
- Lower cost (use cheaper providers first when possible)
- Higher coverage (fallback to secondary providers)
- Complexity in tracking which provider succeeded

---

### ADR-CRM-002: Event-Driven Scoring

**Context:** Lead scores need to reflect latest data but constant recalculation is expensive.

**Decision:** Scores are recalculated on specific trigger events, not on polling.

**Consequences:**
- Lower compute cost
- Scores always reflect current state (no stale polling windows)
- Must ensure all relevant events trigger recalculation

---

### ADR-CRM-003: BullMQ for Sequence Steps

**Context:** Email sequences need reliable delayed execution with retry.

**Decision:** Use BullMQ delayed jobs, each step schedules the next.

**Consequences:**
- Reliable execution with automatic retry
- Easy to pause/resume sequences
- Visibility into queue state

---

### ADR-CRM-004: Sequence Conflict Prevention

**Context:** Contacts can be enrolled in multiple sequences causing over-contact.

**Decision:** Implement conflict detection before enrollment, enforce daily touch limits.

**Consequences:**
- Better contact experience
- User must resolve conflicts explicitly
- Some automation friction

---

### ADR-CRM-005: Anonymization Over Deletion

**Context:** GDPR requires data deletion, but analytics need historical data.

**Decision:** Anonymize PII fields instead of hard delete, preserve aggregatable fields.

**Consequences:**
- Analytics preserved
- Compliance achieved
- Slightly higher storage cost

---

### ADR-CRM-006: Most Recent Wins for Sync Conflicts

**Context:** Two-way sync creates conflicts when same record updated in both systems.

**Decision:** Default to most_recent_wins, allow per-field strategy override.

**Consequences:**
- Simple default behavior
- Risk of losing intentional local changes
- Per-field override adds complexity

---

## API Contracts

### Internal API (NestJS ↔ CRM Agents)

```typescript
// POST /agents/crm/runs
interface CrmTeamRunRequest {
  task: string;
  context?: {
    contactId?: string;
    dealId?: string;
    accountId?: string;
  };
  stream?: boolean;
}

interface CrmTeamRunResponse {
  runId: string;
  status: 'completed' | 'pending_approval' | 'error';
  result?: {
    content: string;
    artifacts?: any[];
  };
  approvalId?: string;
}
```

### A2A API (External Modules → CRM)

```json
// POST /a2a/crm/rpc
{
  "jsonrpc": "2.0",
  "method": "run",
  "params": {
    "task": "Get contact score breakdown",
    "context": {
      "contact_id": "ct_123abc"
    }
  },
  "id": 1
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "content": "Contact score: 78 (HOT)\n- Firmographic: 80/100\n- Behavioral: 75/100\n- Intent: 70/100",
    "data": {
      "score": 78,
      "tier": "HOT",
      "breakdown": {
        "firmographic": 80,
        "behavioral": 75,
        "intent": 70
      }
    }
  },
  "id": 1
}
```

---

## Performance Considerations

### Expected Load

| Metric | MVP Target | Scale Target |
|--------|------------|--------------|
| Contacts per workspace | 50,000 | 1,000,000 |
| Score calculations/day | 10,000 | 500,000 |
| Enrichment requests/day | 500 | 10,000 |
| Sequence emails/day | 1,000 | 50,000 |

### Optimization Strategies

1. **Score Caching:** Redis cache with 24h TTL, invalidate on trigger events
2. **Batch Enrichment:** Queue bulk enrichment for nightly processing
3. **Sequence Batching:** Group sequence emails for efficient sending
4. **Index Strategy:** Composite indexes on (workspace_id, score_tier), (workspace_id, lifecycle)

---

## Security Considerations

### CRM-Specific Security

| Concern | Mitigation |
|---------|------------|
| Enrichment API keys | Stored in tenant's BYOAI encrypted store |
| Sync credentials | OAuth tokens with refresh, stored encrypted |
| Score manipulation | Manual overrides require reason, audit logged |
| Data export | Approval required for bulk export |
| Sequence abuse | Daily touch limits, spam pattern detection |

### Approval Requirements

| Action | Requires Approval |
|--------|-------------------|
| Bulk enrichment (>100) | Yes |
| Bulk score recalculation | Yes |
| Data export | Yes |
| Data deletion (GDPR) | Yes |
| Sync full import | Yes |
| Single contact operations | No |

---

## References

- [Platform Architecture](/docs/architecture.md)
- [A2A Protocol](/docs/architecture/a2a-protocol.md)
- [AG-UI Protocol](/docs/architecture/ag-ui-protocol.md)
- [BM-CRM PRD](/docs/modules/bm-crm/PRD.md)
- [BMAD Agno Development Guide](/docs/guides/bmad-agno-development-guide.md)

---

_This module architecture document defines CRM-specific technical decisions. It is designed to be read alongside the Platform Architecture and PRD._
