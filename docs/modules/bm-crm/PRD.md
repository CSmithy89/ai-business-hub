# BM-CRM Module - Product Requirements Document

**Author:** Chris
**Date:** 2025-12-15
**Version:** 1.2
**Status:** Draft (Enhanced with 5 elicitation methods)

---

## Executive Summary

BM-CRM is the **AI-first Customer Relationship Management module** for the HYVVE platform. Unlike traditional CRMs that are databases with workflows, BM-CRM is built around an **8-agent AI team** that proactively manages customer relationships, scores leads, enriches data, and automates pipeline operations—all with human oversight through the HYVVE approval system.

### What Makes This Special

BM-CRM represents a paradigm shift from "CRM as software" to "CRM as intelligent assistant team":

1. **Proactive, Not Reactive** - Agents surface insights before you ask
2. **Team-Based AI** - 8 specialized agents coordinated by Clara, not a single "AI feature"
3. **Human-in-the-Loop** - All significant actions require approval via Sentinel
4. **Platform-Native** - Deep integration with HYVVE's BYOAI, event bus, and approval queue
5. **Modular Architecture** - Can operate standalone or as part of full HYVVE suite

---

## Project Classification

**Technical Type:** `saas_b2b` - SaaS B2B Module
**Domain:** `general` (CRM is well-understood domain)
**Complexity:** Medium-High (8 agents, external integrations, compliance)
**Module Type:** Operational module building on HYVVE platform foundation

### Platform Dependencies

BM-CRM requires these platform foundation capabilities (all complete):

| Dependency | Platform Feature | Status |
|------------|------------------|--------|
| Multi-tenancy | Workspace isolation with RLS | ✅ Complete |
| Agent runtime | Agno AgentOS with A2A/AG-UI | ✅ Complete |
| BYOAI | User-provided AI keys | ✅ Complete |
| Approval system | Sentinel agent + approval queue | ✅ Complete |
| Event bus | Redis Streams pub/sub | ✅ Complete |
| Knowledge base | RAG with pgvector | ✅ Complete |

---

## Success Criteria

### Primary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to qualify lead | < 2 minutes | From creation to scored/tiered |
| Data enrichment rate | > 80% of contacts | Auto-enriched within 24h |
| Pipeline automation | > 50% of stage transitions | Agent-suggested actions accepted |
| User time saved | > 60% vs manual CRM | Task completion time comparison |

### Business Metrics

| Metric | Target |
|--------|--------|
| Lead-to-opportunity conversion | Increase by 20% |
| Sales cycle length | Reduce by 15% |
| Data quality score | > 85% completeness |
| Agent suggestion acceptance rate | > 70% |

---

## Product Scope

> **Scope Legend:** `[MVP]` = Phase 1 delivery | `[Growth]` = Post-MVP phases | `[Vision]` = Future roadmap

### MVP - Minimum Viable Product `[MVP]`

**Core Data Layer:** `[MVP]`
- [ ] Contact management (create, read, update, delete, search) `[MVP]`
- [ ] Company/Account management with firmographics `[MVP]`
- [ ] Deal/Opportunity pipeline with customizable stages `[MVP]`
- [ ] Activity logging (manual and automatic) `[MVP]`
- [ ] Tag and custom field support `[MVP]`

**Agent Team (Core 5):** `[MVP]`
- [ ] **Clara** - CRM Orchestrator (team coordination) `[MVP]`
- [ ] **Scout** - Lead Scorer (40/35/25 algorithm) `[MVP]`
- [ ] **Atlas** - Data Enricher (Clearbit/Apollo integration) `[MVP]`
- [ ] **Flow** - Pipeline Manager (stage automations) `[MVP]`
- [ ] **Echo** - Activity Tracker (engagement analysis) `[MVP]`

**Integration:** `[MVP]`
- [ ] CSV import/export `[MVP]`
- [ ] Basic Gmail integration (email logging) `[MVP]`
- [ ] Event bus publishing (crm.* events) `[MVP]`

**UI:** `[MVP]`
- [ ] Contact list with search/filter `[MVP]`
- [ ] Contact detail view with timeline `[MVP]`
- [ ] Company list and detail views `[MVP]`
- [ ] Pipeline kanban board `[MVP]`
- [ ] CRM dashboard with key metrics `[MVP]`
- [ ] "Meet Your CRM Team" onboarding flow `[MVP]`

### Growth Features (Post-MVP) `[Growth]`

**Additional Agents:** `[Growth]`
- [ ] **Sync** - Integration Specialist (HubSpot, Salesforce bi-directional sync) `[Growth-Phase2]`
- [ ] **Guardian** - Compliance Agent (GDPR, consent management) `[Growth-Phase2]`
- [ ] **Cadence** - Outreach Agent (email sequences, multi-channel campaigns) `[Growth-Phase3]`

**Advanced Features:** `[Growth]`
- [ ] Multi-pipeline support (by product/segment) `[Growth-Phase3]`
- [ ] Advanced reporting and analytics `[Growth-Phase3]`
- [ ] Custom scoring model configuration `[Growth-Phase2]`
- [ ] Relationship mapping visualization `[Growth-Phase3]`
- [ ] Mobile CRM views `[Growth-Phase3]`
- [ ] Calendar integration (Google, Outlook) `[Growth-Phase2]`
- [ ] LinkedIn integration `[Growth-Phase3]`

**Integrations:** `[Growth]`
- [ ] HubSpot two-way sync `[Growth-Phase2]`
- [ ] Salesforce two-way sync `[Growth-Phase2]`
- [ ] Zapier/Make webhooks `[Growth-Phase3]`
- [ ] API access for external tools `[Growth-Phase3]`

### Vision (Future) `[Vision]`

- Predictive lead scoring with ML
- Conversation intelligence (call transcription + analysis)
- Revenue forecasting with AI
- Automatic deal coaching
- Multi-object relationships (custom objects)
- Territory management
- Commission tracking

---

## CRM Agent Team Specification

### Team Overview

The BM-CRM module operates as a coordinated **8-agent team**, following the pattern established by the Validation (BMV) and Branding (BM-Brand) teams.

```
┌─────────────────────────────────────────────────────────────┐
│                    CRM TEAM (8 Agents)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                      ┌─────────┐                            │
│                      │  Clara  │ ← Team Leader              │
│                      │  (Orch) │                            │
│                      └────┬────┘                            │
│                           │                                  │
│     ┌─────────┬─────────┼─────────┬─────────┬─────────┐    │
│     │         │         │         │         │         │    │
│ ┌───┴───┐ ┌───┴───┐ ┌───┴───┐ ┌───┴───┐ ┌───┴───┐ ┌───┴───┐│
│ │ Scout │ │ Atlas │ │ Flow  │ │ Echo  │ │ Sync  │ │Cadence││
│ │(Score)│ │(Enrich│ │(Pipe) │ │(Track)│ │(Integ)│ │(Reach)││
│ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘│
│                                                              │
│                      ┌─────────┐                            │
│                      │Guardian │ ← Compliance               │
│                      │(GDPR)   │                            │
│                      └─────────┘                            │
│                                                              │
│ ═══════════════════════════════════════════════════════════ │
│                      ┌─────────┐                            │
│                      │Sentinel │ ← Platform Agent (Shared)  │
│                      │(Approve)│                            │
│                      └─────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### Agent Disagreement Resolution Protocol

When CRM agents have conflicting recommendations, the system follows a clear resolution protocol:

**Scenario Examples:**
1. Scout recommends SALES_READY tier, but Echo shows declining engagement
2. Flow suggests advancing deal stage, but Guardian flags missing consent
3. Cadence wants to enroll contact in sequence, but Atlas shows invalid email

**Resolution Hierarchy:**

| Priority | Agent | Veto Power | Rationale |
|----------|-------|------------|-----------|
| 1 | Guardian | Hard veto | Compliance always wins |
| 2 | Sentinel | Escalation | Platform-level approval authority |
| 3 | Clara | Soft veto | Team lead coordination |
| 4 | Specialist | Advisory | Domain expertise |

**Resolution Process:**
1. **Detection**: Clara monitors for conflicting recommendations
2. **Synthesis**: Clara presents conflict to user with both perspectives
3. **User Decision**: User selects action or asks for more context
4. **Learning**: Decision logged to improve future recommendations

**Conflict Presentation Format:**
```
⚠️ Agent Perspectives Differ

Scout recommends: Mark as SALES_READY (score: 92)
Echo cautions: Engagement declining 30% over 2 weeks

Clara's synthesis: "Score is high but engagement is cooling.
Recommend reaching out before upgrading tier."

[Accept Scout] [Accept Echo] [Ask Clara for more context]
```

---

### Agent Specifications

#### 1. Clara - CRM Orchestrator (Team Leader)

**Role:** Team leader coordinating all CRM operations

**Responsibilities:**
- Route user requests to appropriate specialist agent
- Coordinate multi-agent workflows (e.g., new contact → Scout → Atlas → Flow)
- Synthesize insights across CRM data
- Handle complex queries requiring multiple agents
- Present unified responses to users

**Behaviors:**
- Proactively surfaces daily CRM summary
- Delegates scoring to Scout, enrichment to Atlas, etc.
- Escalates to Sentinel for high-impact decisions
- Maintains conversation context across agents

**Daily Summary Content (Clara's Morning Briefing):**
Clara delivers a personalized daily summary each morning containing:
1. **🎯 Who to Call Today** - Top 5 prioritized contacts by score × recency × deal value (the "just tell me who to call" answer)
2. **Hot Leads Alert** - Contacts that crossed into HOT/SALES_READY overnight
3. **Stale Deals Warning** - Deals stuck past SLA thresholds (Flow's data)
4. **Engagement Spikes** - Contacts with unusual activity (Echo's data)
5. **Follow-up Reminders** - Tasks due today
6. **Pipeline Snapshot** - Quick metrics (deals by stage, weighted value)
7. **Outreach Performance** - Sequence response rates (Cadence's data)

Format: Card-based summary with expandable sections, delivered via in-app notification at user's configured time (default 8:00 AM local).

**"Who to Call" Prioritization Algorithm:**
```
Priority Score = (Lead Score × 0.4) + (Days Since Contact × 0.3) + (Deal Value / 1000 × 0.3)
```
- Excludes contacts with activity in last 24 hours
- Excludes contacts in active sequences (Cadence handling)
- One-click "Call Now" button logs activity and opens phone dialer

**Implementation:**
```python
clara = Agent(
    name="Clara",
    role="CRM Team Lead",
    model=get_tenant_model(tenant_id),
    instructions=[
        "Coordinate CRM operations across Scout, Atlas, Flow, Echo, Sync, Cadence, and Guardian.",
        "Route user requests to the most appropriate specialist agent.",
        "Synthesize findings into actionable insights.",
        "Present results clearly with specific next steps.",
    ],
    storage=PostgresStorage(table_name="crm_sessions"),
)
```

---

#### 2. Scout - Lead Scorer

**Role:** Score and tier leads using the 40/35/25 algorithm

**Responsibilities:**
- Calculate lead scores on contact creation/update
- Apply firmographic (40%), behavioral (35%), intent (25%) weights
- Classify leads into tiers: COLD, WARM, HOT, SALES_READY
- Explain score factors to users
- Trigger alerts on tier changes

**Scoring Algorithm:**
```
Total Score = (Firmographic × 0.40) + (Behavioral × 0.35) + (Intent × 0.25)

Firmographic Factors:
- Company size (employee count)
- Industry fit
- Revenue range
- Geographic match

Behavioral Factors:
- Email engagement (opens, clicks, replies)
- Website activity
- Content downloads
- Social engagement

Intent Factors:
- Demo requests (+40 points)
- Pricing page views (+15 points)
- Trial signup (+50 points)
- Contact sales form (+35 points)
```

**Tier Thresholds (Defaults - Configurable per Tenant):**
| Tier | Default Range | SLA | Configurable |
|------|---------------|-----|--------------|
| SALES_READY | 90-100 | < 4 hours | ✅ |
| HOT | 70-89 | < 24 hours | ✅ |
| WARM | 50-69 | < 48 hours | ✅ |
| COLD | 0-49 | Nurture | ✅ |

> **E-9 Enhancement:** Tier thresholds are configurable per tenant in Settings → CRM → Scoring. Different industries have different qualification criteria - a WARM lead for enterprise software (score 60) might be HOT for a quick-sale product.

**Tools:**
- `calculate_score` - Compute lead score
- `get_score_breakdown` - Explain score factors
- `recalculate_all_scores` - Batch recalculation (requires approval)

---

#### 3. Atlas - Data Enricher

**Role:** Enrich contact and company data from external sources

**Responsibilities:**
- Auto-enrich new contacts with company data
- Find LinkedIn profiles, email verification
- Update firmographic data for scoring
- Track enrichment costs per tenant
- Manage API rate limits

**Data Sources (Priority Order):**
1. Clearbit (primary for company data)
2. Apollo (contact enrichment)
3. Hunter.io (email finding)
4. LinkedIn (professional data)
5. ZeroBounce (email verification)

**Enrichment Workflow:**
1. New contact created → Event triggers Atlas
2. Atlas checks if enrichment needed (missing fields)
3. Waterfall through data sources
4. Update contact with enriched data
5. Trigger Scout to recalculate score
6. Log enrichment cost

**Enrichment Budget Management:** `[MVP]`
- Configurable monthly spend limit per tenant (default: $50/month)
- Real-time spend tracking in Settings → CRM → Enrichment
- Alert thresholds: 50%, 75%, 90% of budget
- Atlas announces: "Enrichment budget at 75%. 127 credits remaining this month."
- Auto-pause enrichment at 100% (optional - can allow overage with warning)
- Per-provider cost tracking (Clearbit vs Apollo vs Hunter)

**Tools:**
- `enrich_contact` - Enrich single contact
- `enrich_company` - Enrich company firmographics
- `verify_email` - Validate email address
- `find_linkedin` - Find LinkedIn profile URL
- `bulk_enrich` - Batch enrichment (requires approval)
- `get_enrichment_spend` - Check current spend vs budget

---

#### 4. Flow - Pipeline Manager

**Role:** Manage deal pipeline and stage automations

**Responsibilities:**
- Track deals through pipeline stages
- Suggest automations on stage transitions
- Identify stuck deals
- Calculate pipeline velocity metrics
- Forecast pipeline value

**Pipeline Stages (Default):**
| Stage | Probability | Automations |
|-------|-------------|-------------|
| Lead | 10% | Send intro email |
| Qualified | 25% | Schedule discovery call |
| Proposal | 50% | Generate proposal draft |
| Negotiation | 75% | Alert manager, set reminders |
| Closed Won | 100% | Onboarding sequence, notify CS |
| Closed Lost | 0% | Feedback request, re-engagement |

**Stuck Deal Detection:**
- Lead: > 7 days without activity
- Qualified: > 14 days without activity
- Proposal: > 21 days without response
- Negotiation: > 30 days without progress

**Tools:**
- `move_deal` - Transition deal stage
- `suggest_next_action` - Get recommended action
- `identify_stuck_deals` - Find stalled deals
- `calculate_pipeline_health` - Get velocity metrics
- `forecast_revenue` - Pipeline forecast

---

#### 5. Echo - Activity Tracker

**Role:** Log and analyze all contact engagement

**Responsibilities:**
- Automatically log emails (sent, received, opened, clicked)
- Log calls (scheduled, completed, outcomes)
- Log meetings (scheduled, attended, notes)
- Analyze engagement patterns
- Surface relationship health scores
- Identify contacts going cold

**Activity Types:**
| Type | Auto-Capture | Points |
|------|--------------|--------|
| Email Sent | Gmail/Outlook | +2 |
| Email Opened | Tracking pixel | +2 |
| Email Clicked | Link tracking | +5 |
| Email Replied | Gmail/Outlook | +15 |
| Call Completed | Manual/Integration | +10 |
| Meeting Held | Calendar sync | +20 |
| Note Added | Manual | +1 |

**Engagement Health Score:**
- Calculate based on recency, frequency, depth
- Flag contacts with declining engagement
- Suggest re-engagement actions

**Tools:**
- `log_activity` - Manual activity logging
- `get_activity_timeline` - Contact activity history
- `calculate_engagement_score` - Relationship health
- `find_cold_contacts` - Contacts needing attention

---

#### 6. Sync - Integration Specialist

**Role:** Handle bi-directional sync with external CRMs

**Responsibilities:**
- Two-way sync with HubSpot, Salesforce, Pipedrive
- Field mapping configuration
- Conflict resolution
- Sync status monitoring
- Integration health alerts

**Sync Modes:**
| Mode | Description |
|------|-------------|
| Real-time | Immediate sync on change |
| Scheduled | Batch sync every 15/30/60 min |
| Manual | On-demand sync |

**Conflict Resolution:**
- Most recent wins (default)
- Source system wins
- Manual resolution queue

**Supported Integrations:**
- HubSpot CRM (contacts, companies, deals)
- Salesforce (contacts, accounts, opportunities)
- Pipedrive (persons, organizations, deals)
- CSV import/export
- Gmail/Outlook (email sync)
- Google/Outlook Calendar (meeting sync)

**Sync Health Dashboard:** `[Growth-Phase2]`
- Visual status indicator per integration (🟢 Healthy, 🟡 Degraded, 🔴 Failed)
- Last sync timestamp and record counts
- Error log with retry status
- Sync proactively alerts: "HubSpot sync failed 3 times. Last error: API rate limit. Retrying in 15 min."
- One-click "Sync Now" and "Pause Sync" actions
- Field mapping visualization showing source → destination

**Tools:**
- `sync_now` - Trigger immediate sync
- `configure_mapping` - Set field mappings
- `get_sync_status` - Check sync health
- `resolve_conflict` - Handle sync conflicts
- `get_sync_errors` - Retrieve recent sync failures

---

#### 7. Guardian - Compliance Agent

**Role:** Ensure CRM data compliance with privacy regulations

**Responsibilities:**
- GDPR right to be forgotten (data deletion)
- Consent tracking and management
- Data retention policy enforcement
- Email opt-out management
- Audit trail for sensitive data access
- Data subject access request handling

**Compliance Features:**
| Feature | Regulation | Implementation |
|---------|------------|----------------|
| Right to erasure | GDPR Art. 17 | Delete all contact data |
| Data portability | GDPR Art. 20 | Export contact data |
| Consent management | GDPR Art. 7 | Track consent per purpose |
| Opt-out handling | CAN-SPAM | Suppression list |
| Retention limits | GDPR Art. 5 | Auto-purge after X days |

**Consent Types:**
- Marketing email consent
- Sales outreach consent
- Data processing consent
- Third-party sharing consent

**Tools:**
- `delete_contact_data` - GDPR erasure (requires approval)
- `export_contact_data` - Data portability
- `record_consent` - Log consent event
- `check_compliance` - Audit contact compliance
- `apply_retention_policy` - Purge old data (requires approval)

---

#### 8. Cadence - Outreach Agent

**Role:** Manage email sequences and multi-channel campaigns

**Responsibilities:**
- Create and manage email sequences
- Multi-channel outreach (email, LinkedIn, SMS)
- Personalization at scale
- Response tracking and follow-up triggers
- A/B testing suggestions
- Optimal send time recommendations

**Sequence Features:**
| Feature | Description |
|---------|-------------|
| Multi-step | Up to 10 steps per sequence |
| Conditional | Branch based on engagement |
| Multi-channel | Email, LinkedIn, SMS |
| Personalization | Merge fields, AI-generated |
| Scheduling | Time zone aware, optimal times |

**Outreach Channels:**
- Email (primary)
- LinkedIn InMail/Connection
- SMS (with consent)
- Phone task reminders

**Sequence Conflict Detection:**
- Detect when user enrolls contact already in active sequence
- Alert: "Contact already in [sequence name] - step 3 of 5. Enroll anyway?"
- Options: Replace existing, Run in parallel, Skip enrollment
- Prevent channel collision (2 emails same day from different sequences)
- Daily limit enforcement per contact (max 2 outreach touches/day)

**Tools:**
- `create_sequence` - Build outreach sequence
- `enroll_contact` - Add contact to sequence (with conflict detection)
- `pause_sequence` - Pause for specific contact
- `suggest_personalization` - AI-generated personalization
- `analyze_sequence_performance` - Get engagement metrics
- `check_sequence_conflicts` - Pre-enrollment conflict check

---

### Agent Interaction Patterns

**New Contact Flow:**
```
User creates contact
    → Clara notifies team
    → Atlas enriches data (auto)
    → Scout calculates score (auto)
    → If WARM+: Flow suggests pipeline action
    → If needs follow-up: Cadence suggests sequence
```

**Deal Stage Change:**
```
User moves deal to Proposal
    → Flow detects stage change
    → Flow suggests: "Generate proposal draft?"
    → If approved → Flow creates draft
    → Echo logs the stage change
    → Scout recalculates score
```

**Compliance Request:**
```
User requests data deletion
    → Guardian receives request
    → Guardian identifies all contact data
    → Guardian creates approval request for Sentinel
    → After approval → Guardian executes deletion
    → Guardian logs audit trail
```

---

## Functional Requirements

### FR-1: Contact Management

**FR-1.1: Contact CRUD**
- Create contacts with minimal required fields (firstName OR email)
- Update contact fields including custom fields
- Soft delete contacts (retain for audit, hide from UI)
- Search contacts by any field with full-text search
- Filter contacts by tags, tier, lifecycle, owner

**FR-1.2: Contact Fields**
- Core: firstName, lastName, email, phone, jobTitle
- Composite (JSON): emails, phones, address, socialLinks
- CRM: leadScore, scoreTier, lifecycle, source
- Consent: emailOptIn, marketingConsent, consentDate
- Custom: customFields JSON with tenant-defined schema

**FR-1.3: Contact Lifecycle**
| Stage | Criteria | Auto-Transition |
|-------|----------|-----------------|
| lead | New contact | Default |
| mql | Score > 50 | Scout triggers |
| sql | Score > 70 + verified | Scout triggers |
| opportunity | Has active deal | Flow triggers |
| customer | Won deal | Flow triggers |
| churned | Lost/cancelled | Flow triggers |

**FR-1.4: Duplicate Detection**
- Detect duplicates on create (email, LinkedIn, name+company)
- Queue duplicates for review
- Merge workflow with field-by-field resolution
- Redirect old IDs to merged contact

---

### FR-2: Company/Account Management

**FR-2.1: Company CRUD**
- Create companies with name (required)
- Auto-create from contact's email domain
- Update firmographic fields
- Soft delete companies
- Search and filter companies

**FR-2.2: Firmographic Fields**
- Identity: name, domain, industry, industryCode (NAICS)
- Size: employeeCount, employeeRange, annualRevenue, revenueRange
- Classification: segment (enterprise/mid-market/smb), type (prospect/customer/partner)
- Health: healthScore, idealCustomerProfile flag
- Hierarchy: parentId for subsidiaries

**FR-2.3: Company-Contact Relationship**
- Many contacts to one company (MVP)
- Contact inherits company firmographics for scoring
- Company health aggregates from contact engagement

---

### FR-3: Deal/Pipeline Management

**FR-3.1: Deal CRUD**
- Create deals with name, value, stage, close date
- Associate deals with contact(s) and company
- Move deals between stages
- Soft delete (close as lost)
- Search and filter deals

**FR-3.2: Pipeline Stages**
- Default 6-stage pipeline (configurable)
- Stage probability mapping
- Required fields per stage
- Stage transition validation
- Multiple pipelines (post-MVP)

**FR-3.3: Pipeline Analytics**
- Conversion rates per stage
- Average time in stage
- Pipeline velocity
- Win/loss analysis
- Forecast (weighted by probability)

---

### FR-4: Activity Tracking

**FR-4.1: Activity Types**
- Email (sent, received, opened, clicked, replied)
- Call (scheduled, completed, no-answer)
- Meeting (scheduled, held, cancelled)
- Note (manual entry)
- Task (created, completed)

**FR-4.2: Activity Logging**
- Manual logging via UI
- Automatic capture from Gmail/Outlook
- Activity-to-contact association
- Activity-to-deal association

**FR-4.3: Activity Timeline**
- Chronological activity feed per contact
- Filter by activity type
- Activity sentiment (positive/neutral/negative)

---

### FR-5: Lead Scoring

**FR-5.1: Score Calculation**
- Real-time scoring on activity
- Batch recalculation for decay
- Configurable weights per tenant
- Score history tracking

**FR-5.2: Score Display** `[MVP]`
- Score badge on contact cards
- **Score explanation tooltip on hover** - Shows top 3 factors: "High: Demo request (+40), Email engagement (+15). Low: No company size data (-10)"
- Score breakdown view (detailed modal)
- Score trend over time (sparkline chart)
- Tier change alerts

**FR-5.3: Tier Actions** `[MVP]`
- Auto-assign owner on tier change
- Notification to assigned user
- SLA timer based on tier
- **Real-time push notifications** for tier upgrades (COLD→WARM, WARM→HOT, HOT→SALES_READY)
- In-app notification badge + optional email/Slack notification
- Notification preferences configurable per user

**FR-5.4: Manual Score Override** `[MVP]`
- Allow sales rep to manually adjust score (+/- 20 points max)
- Require reason selection: "Better fit than data shows", "Worse fit than data shows", "Special circumstances"
- Free-text note for override justification
- Audit trail: who overrode, when, original score, new score, reason
- Override expires after 30 days (returns to calculated score) unless renewed
- Scout acknowledges override: "Score manually adjusted by [user]. Override expires [date]."

---

### FR-6: Data Enrichment

**FR-6.1: Auto-Enrichment**
- Enrich on contact creation (if enabled)
- Enrich on demand (button)
- Batch enrichment (scheduled)

**FR-6.2: Enrichment Sources**
- Configurable provider priority
- Tenant-level API key management
- Usage tracking and limits

**FR-6.3: Enrichment Fields**
- Company: firmographics, social links, tech stack
- Contact: job title, LinkedIn, verified email

---

### FR-7: Integrations

**FR-7.1: CSV Import/Export**
- Import with field mapping wizard
- Duplicate handling options
- Validation report
- Export with custom field selection

**FR-7.2: Email Integration**
- Gmail OAuth connection
- Outlook OAuth connection
- Email sync (sent/received)
- Email tracking (opens/clicks)

**FR-7.3: CRM Sync (Post-MVP)**
- HubSpot two-way sync
- Salesforce two-way sync
- Field mapping configuration
- Conflict resolution

---

### FR-8: Compliance

**FR-8.1: Consent Management**
- Record consent with timestamp and source
- Consent withdrawal handling
- Consent audit trail

**FR-8.2: Data Subject Rights**
- Export all data (portability)
- Delete all data (erasure)
- Rectification workflow

**FR-8.3: Retention**
- Configurable retention periods
- Auto-archive after inactivity
- Auto-purge after retention limit

---

## Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| Contact search | < 500ms for 100k contacts |
| Score calculation | < 200ms per contact |
| Page load (contact list) | < 2s |
| Enrichment API response | < 5s |
| Sync latency | < 30s for real-time |

### Security

- All data encrypted at rest (AES-256)
- TLS 1.3 for data in transit
- API keys encrypted in database
- RBAC for CRM data access
- Audit logging for sensitive operations
- Field-level permissions (post-MVP)

### Scalability

| Metric | MVP Target | Scale Target |
|--------|------------|--------------|
| Contacts per tenant | 50,000 | 1,000,000 |
| Companies per tenant | 10,000 | 200,000 |
| Deals per tenant | 5,000 | 100,000 |
| Activities per contact | 1,000 | 10,000 |

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation for all CRM views
- Screen reader support
- Color contrast ratios met

### Integration

- Event bus: Publish all CRM events
- A2A: CRM agents discoverable via A2A protocol
- AG-UI: Real-time streaming for agent responses
- MCP: CRM tools available as MCP tools

### Agent Proactivity Settings

Users can configure how proactive the CRM agents are:

| Setting | Level | Behavior |
|---------|-------|----------|
| **Quiet** | Low | Agents only respond when asked; no unsolicited suggestions |
| **Helpful** | Medium (default) | Daily briefing + suggestions when viewing relevant data |
| **Proactive** | High | Real-time alerts, suggestions during workflows, contextual tips |

**Per-Agent Granularity:**
- User can adjust proactivity per agent (e.g., Scout proactive, Echo quiet)
- Global setting applies as default, per-agent overrides available
- "Snooze" option: Temporarily silence all agent suggestions for 1h/4h/8h/24h

**Notification Channels:**
| Channel | Opt-in Default | Configurable |
|---------|----------------|--------------|
| In-app notification | ✅ Yes | Yes |
| Email digest | ❌ No | Yes |
| Slack/Teams | ❌ No | Yes (with integration) |
| SMS | ❌ No | Yes (urgent only) |

**Smart Notification Batching:**
To prevent notification fatigue, CRM agents batch non-urgent notifications:
- **Immediate**: SALES_READY tier upgrade, compliance alerts, sync failures
- **Batched (hourly)**: WARM→HOT upgrades, stuck deal warnings, enrichment completions
- **Daily digest**: Activity summaries, sequence performance, pipeline health

Batching rules:
- Max 5 immediate notifications per hour (6th+ batched)
- Similar notifications grouped: "3 contacts moved to HOT tier" not 3 separate alerts
- User can override to "All Immediate" in proactivity settings

---

## Data Model Summary

### Core Entities

```
Contact
├── id, workspaceId
├── firstName, lastName, email, phone
├── jobTitle, department
├── emails (JSON), phones (JSON), address (JSON)
├── leadScore, scoreTier, lifecycle
├── source, sourceDetail
├── customFields (JSON), tags[]
├── accountId → Account
└── ownerId → User

Account (Company)
├── id, workspaceId
├── name, domain
├── employeeCount, employeeRange
├── annualRevenue, revenueRange
├── industry, industryCode
├── segment, type
├── healthScore, idealCustomerProfile
├── parentId → Account (hierarchy)
└── ownerId → User

Deal
├── id, workspaceId
├── name, value, currency
├── stage, probability
├── expectedCloseDate, actualCloseDate
├── lostReason
├── accountId → Account
├── primaryContactId → Contact
└── ownerId → User

Activity
├── id, workspaceId
├── type (email, call, meeting, note, task)
├── subject, body
├── happenedAt
├── sentiment
├── contactId → Contact
├── dealId → Deal
└── createdBy → User
```

---

## User Experience: "Meet Your CRM Team" Onboarding

When users enable the BM-CRM module, they experience a guided onboarding that introduces the agent team:

### Onboarding Flow

**Step 1: Welcome Screen**
```
"Welcome to your AI-powered CRM!
Let's introduce you to the team that will help manage your customer relationships."
```

**Step 2: Team Introduction Carousel**
Each agent gets a card with:
- Agent avatar/icon
- Name and role tagline
- 3 bullet points of what they do
- Example interaction preview

| Agent | Tagline | Key Capability |
|-------|---------|----------------|
| Clara | "Your CRM Team Lead" | "I coordinate the team and deliver your daily briefing" |
| Scout | "Lead Intelligence" | "I score every lead so you focus on the right ones" |
| Atlas | "Data Detective" | "I enrich contacts with company info and social links" |
| Flow | "Pipeline Pilot" | "I keep deals moving and flag stuck opportunities" |
| Echo | "Activity Analyst" | "I track engagement and identify cold contacts" |
| Sync | "Integration Guru" | "I keep your CRM in sync with HubSpot, Salesforce" |
| Guardian | "Compliance Officer" | "I handle GDPR, consent, and data protection" |
| Cadence | "Outreach Specialist" | "I manage your email sequences and follow-ups" |

**Step 3: Quick Preferences**
- "How chatty should we be?" (slider: Quiet → Proactive)
- "Send me morning briefings?" (toggle + time picker)
- "Auto-enrich new contacts?" (toggle)

**Step 4: First Action**
- Import contacts (CSV or CRM sync)
- Or create first contact manually
- Clara confirms: "Your team is ready! I'll send your first briefing tomorrow at [time]."

### Agent Visibility Settings

Users can configure agent visibility per workspace:
- **All Agents Visible**: Full agent attribution on actions
- **Team Only**: Actions attributed to "CRM Team"
- **Silent Mode**: Agents work but no attribution shown

### Single Entry Point: Clara First

**Critical UX Principle:** Users always interact with Clara first. Clara routes internally.

- **Chat interface** → Always opens with Clara greeting
- **@ mentions** → `@Clara` is primary; `@Scout` etc. are advanced
- **Action buttons** → "Ask Clara" not "Ask CRM Team"
- **Error messages** → Clara explains, even for specialist agent errors

This prevents user confusion about which agent to ask. Clara handles routing:
```
User: "Why is this lead scored so low?"
Clara: "Let me check with Scout... [internal routing]"
Clara: "Scout analyzed the score. Here's why: [presents Scout's findings]"
```

Advanced users can still address specialists directly via `@Scout`, `@Atlas`, etc.

---

## Implementation Phases

### Phase 1: Core CRM (MVP)
**Duration:** 4-6 weeks
**Agents:** Clara, Scout, Atlas, Flow, Echo (5)

- [ ] Data model implementation (Contact, Account, Deal, Activity)
- [ ] CRUD APIs for all entities
- [ ] Lead scoring algorithm
- [ ] Basic enrichment (one provider)
- [ ] Pipeline management
- [ ] Activity logging
- [ ] CRM UI (list, detail, pipeline board)
- [ ] Team.py coordination

### Phase 2: Integration & Compliance
**Duration:** 3-4 weeks
**Agents:** + Sync, Guardian (7)

- [ ] CSV import/export
- [ ] Gmail/Outlook integration
- [ ] Consent management
- [ ] GDPR compliance features
- [ ] Integration health monitoring

### Phase 3: Outreach & Advanced
**Duration:** 3-4 weeks
**Agents:** + Cadence (8)

- [ ] Email sequence builder
- [ ] Multi-channel outreach
- [ ] HubSpot/Salesforce sync
- [ ] Advanced reporting
- [ ] Mobile views

---

## References

### Research Documents
- `/docs/modules/bm-crm/research/section-1-contact-company-findings.md`
- `/docs/modules/bm-crm/research/section-2-lead-scoring-findings.md`
- `/docs/modules/bm-crm/research/section-3-deal-pipeline-findings.md`
- `/docs/modules/bm-crm/research/section-4-data-enrichment-findings.md`
- `/docs/modules/bm-crm/research/section-5-external-integrations-findings.md`
- `/docs/modules/bm-crm/research/section-6-user-interface-findings.md`
- `/docs/modules/bm-crm/research/section-7-agent-behaviors-findings.md`
- `/docs/modules/bm-crm/research/section-8-compliance-privacy-findings.md`
- `/docs/modules/bm-crm/research/twenty-crm-analysis.md`

### Architecture Documents
- `/docs/modules/bm-crm/agent-mapping.md`
- `/docs/guides/bmad-agno-development-guide.md`
- `/docs/architecture/a2a-protocol.md`
- `/docs/architecture/ag-ui-protocol.md`

### Wireframes
- `/docs/design/wireframes/WIREFRAME-INDEX.md` (CRM section: 14 wireframes)

---

_This PRD captures the vision for BM-CRM as an AI-first CRM module with an 8-agent team. The module delivers intelligent customer relationship management with human oversight, building on HYVVE's platform foundation._

_Created through collaborative discovery between Chris and AI facilitator._
