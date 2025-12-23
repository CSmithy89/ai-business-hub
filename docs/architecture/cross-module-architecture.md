# Cross-Module Architecture & Agent Registry

**Version:** 1.0
**Created:** 2024-12-24
**Status:** Planning Document (Source of Truth)

This document is the authoritative reference for:
- All HYVVE modules and their scope boundaries
- Complete agent registry with resolved naming conflicts
- Cross-module data flows and integration patterns
- Shared platform services

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Agent Registry (Complete)](#2-agent-registry-complete)
3. [Name Collision Resolutions](#3-name-collision-resolutions)
4. [Cross-Module Data Flows](#4-cross-module-data-flows)
5. [Shared Platform Services](#5-shared-platform-services)
6. [Module Interaction Patterns](#6-module-interaction-patterns)
7. [Implementation Priority](#7-implementation-priority)

---

## 1. Module Overview

### Module Categories

| Category | Purpose | Modules |
|----------|---------|---------|
| **Platform Core** | Foundation infrastructure | Core-PM |
| **BUILD Phase** | Business creation/planning | BMV, BMP, BM-Brand |
| **OPERATE Phase** | Day-to-day operations | BM-CRM, BM-Social, BM-Support, BM-HR, BM-Finance, BM-PR |

### Module Status Matrix

| Module | Phase | Docs | Runtime | Agent Count | Priority |
|--------|-------|------|---------|-------------|----------|
| **BMV** (Validation) | BUILD | Complete | Active | 5 | P0 - Done |
| **BMP** (Planning) | BUILD | Complete | Active | 5 | P0 - Done |
| **BM-Brand** (Branding) | BUILD | Complete | Active | 6 | P0 - Done |
| **Core-PM** (Project Mgmt) | CORE | Complete | In Progress | 8 | P0 - Active |
| **BM-CRM** (CRM) | OPERATE | Complete | Partial | 8 | P1 |
| **BM-Social** (Social) | OPERATE | Research | Not Started | 18 | P2 |
| **BM-Support** (Support) | OPERATE | Research | Not Started | 8 | P2 |
| **BM-HR** (HR) | OPERATE | Brief | Not Started | 5 | P3 |
| **BM-Finance** (Finance) | OPERATE | Brief | Not Started | 4 | P3 |
| **BM-PR** (PR) | OPERATE | Brief | Not Started | 5 | P3 |

**Total Agents Defined:** 72

---

## 2. Agent Registry (Complete)

### Handle Convention

All agents use the format: `@{module}.{agent-key}`

Reserved platform handles:
- `@platform.*` - Core platform agents only
- `@core-pm.*` - Project management agents

### Platform Agents (2)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@platform.navigator` | Navigator | Request routing, multi-module orchestration | Active |
| `@platform.sentinel` | Sentinel | Approval Queue gatekeeper, HITL workflows | Active |

### BMV - Business Validation (5)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bmv.vera` | Vera | Team Lead / Orchestrator | Active |
| `@bmv.marco` | Marco | Market Research (TAM/SAM/SOM) | Active |
| `@bmv.cipher` | Cipher | Competitive Intelligence | Active |
| `@bmv.persona` | Persona | Customer Profiling (ICP/JTBD) | Active |
| `@bmv.risk` | Risk | Feasibility & Risk Assessment | Active |

### BMP - Business Planning (5)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bmp.blake` | Blake | Team Lead / Orchestrator | Active |
| `@bmp.model` | Model | Business Model Canvas | Active |
| `@bmp.finance` | Finance | Financial Projections | Active |
| `@bmp.revenue` | Revenue | Monetization Strategy | Active |
| `@bmp.forecast` | Forecast | Growth Forecasting | Active |

### BM-Brand - Brand Identity (6)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-brand.bella` | Bella | Team Lead / Orchestrator | Active |
| `@bm-brand.sage` | Sage | Brand Strategy | Active |
| `@bm-brand.vox` | Vox | Voice Architecture | Active |
| `@bm-brand.iris` | Iris | Visual Identity | Active |
| `@bm-brand.artisan` | Artisan | Asset Generation | Active |
| `@bm-brand.audit` | Audit | Brand Consistency | Active |

### Core-PM - Project Management (8)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@core-pm.navi` | Navi | Team Lead / KB Navigator | In Progress |
| `@core-pm.oracle` | Oracle | Estimation Expert | In Progress |
| `@core-pm.herald` | Herald | Status Reporter | In Progress |
| `@core-pm.chrono` | Chrono | Time Tracking | In Progress |
| `@core-pm.scope` | Scope | Phase Management | In Progress |
| `@core-pm.vitals` | Vitals | Health Monitor | In Progress |
| `@core-pm.scribe` | Scribe | Knowledge Base Manager | Planned (Phase 2) |
| `@core-pm.prism` | Prism | Predictive Analytics | Planned (Phase 2) |

> **Note:** `Sage` renamed to `Oracle`, `Pulse` renamed to `Vitals` to avoid collisions.

### BM-CRM - Customer Relationship Management (8)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-crm.clara` | Clara | Team Lead / Orchestrator | Planned |
| `@bm-crm.scout` | Scout | Lead Scoring | Partial |
| `@bm-crm.atlas` | Atlas | Data Enrichment | Scaffold |
| `@bm-crm.flow` | Flow | Pipeline Management | Partial |
| `@bm-crm.tracker` | Tracker | Activity Tracking | Planned |
| `@bm-crm.sync` | Sync | Integration Specialist | Planned |
| `@bm-crm.guardian` | Guardian | Compliance (GDPR) | Planned |
| `@bm-crm.cadence` | Cadence | Outreach Sequences | Planned |

> **Note:** `Echo` renamed to `Tracker` to avoid collision with BM-Social.

### BM-Social - Social Media Management (18)

#### Core Agents (6)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-social.conductor` | Conductor | Team Lead / Orchestrator | Planned |
| `@bm-social.spark` | Spark | Content Strategist | Planned |
| `@bm-social.tempo` | Tempo | Schedule Manager | Planned |
| `@bm-social.metrics` | Metrics | Analytics | Planned |
| `@bm-social.engage` | Engage | Engagement Manager | Planned |
| `@bm-social.trends` | Trends | Trend Scout | Planned |

> **Note:** `Pulse` renamed to `Metrics`, `Echo` renamed to `Engage`, `Scout` renamed to `Trends`.

#### Platform Specialists (9)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-social.chirp` | Chirp | Twitter/X Specialist | Planned |
| `@bm-social.link` | Link | LinkedIn Specialist | Planned |
| `@bm-social.meta` | Meta | Facebook Specialist | Planned |
| `@bm-social.gram` | Gram | Instagram Specialist | Planned |
| `@bm-social.tok` | Tok | TikTok Specialist | Planned |
| `@bm-social.tube` | Tube | YouTube Specialist | Planned |
| `@bm-social.pin` | Pin | Pinterest Specialist | Planned |
| `@bm-social.thread` | Thread | Threads Specialist | Planned |
| `@bm-social.blue` | Blue | Bluesky Specialist | Planned |

#### Specialized Agents (3)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-social.watchdog` | Watchdog | Brand Monitoring / Listening | Planned |
| `@bm-social.radar` | Radar | Competitive Intelligence | Planned |
| `@bm-social.shield` | Shield | Crisis Response | Planned |

> **Note:** `Sentinel` renamed to `Watchdog` (Sentinel reserved for platform).

### BM-Support - Customer Support (8)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-support.hub` | Hub | Team Lead / Orchestrator | Planned |
| `@bm-support.triage` | Triage | Routing & Assignment | Planned |
| `@bm-support.reply` | Reply | Response Drafting | Planned |
| `@bm-support.automate` | Automate | Automation Rules | Planned |
| `@bm-support.quality` | Quality | QA Monitor | Planned |
| `@bm-support.captain` | Captain | AI Assistant | Planned |
| `@bm-support.library` | Library | Knowledge Manager | Planned |
| `@bm-support.escalate` | Escalate | Escalation Handler | Planned |

> **Note:** `Docs` renamed to `Library` for clarity.

### BM-HR - Human Resources (5)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-hr.hunter` | Hunter | Talent Sourcing | Planned |
| `@bm-hr.gatekeeper` | Gatekeeper | Resume Screening | Planned |
| `@bm-hr.scheduler` | Scheduler | HR Scheduling | Planned |
| `@bm-hr.interviewer` | Interviewer | Hiring Assistant | Planned |
| `@bm-hr.culture` | Culture | People Operations | Planned |

> **Note:** `Headhunter` shortened to `Hunter`, `Coordinator` renamed to `Scheduler`, `Culture Keep` shortened to `Culture`.

### BM-Finance - Finance & Accounting (4)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-finance.bookkeeper` | Bookkeeper | Transaction Categorization | Planned |
| `@bm-finance.controller` | Controller | AR/Invoicing | Planned |
| `@bm-finance.cfo` | CFO | Cash Flow Strategy | Planned |
| `@bm-finance.compliance` | Compliance | Expense Auditing | Planned |

> **Note:** `Auditor` renamed to `Compliance` to avoid confusion with BM-Brand.Audit.

### BM-PR - Public Relations (5)

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-pr.chief` | Chief | PR Strategy | Planned |
| `@bm-pr.pitcher` | Pitcher | Media Relations | Planned |
| `@bm-pr.wire` | Wire | Press Distribution | Planned |
| `@bm-pr.monitor` | Monitor | Media Tracking | Planned |
| `@bm-pr.contacts` | Contacts | Media Database | Planned |

> **Note:** Names simplified for consistency (`Pitch Perfect` → `Pitcher`, etc.).

---

## 3. Name Collision Resolutions

### Resolved Collisions

| Original Name | Conflict | Resolution |
|---------------|----------|------------|
| **Sentinel** | Platform vs BM-Social | BM-Social → `@bm-social.watchdog` |
| **Scout** | BM-CRM vs BM-Social | BM-Social → `@bm-social.trends` |
| **Echo** | BM-CRM vs BM-Social | BM-CRM → `@bm-crm.tracker`, BM-Social → `@bm-social.engage` |
| **Pulse** | Core-PM vs BM-Social | Core-PM → `@core-pm.vitals`, BM-Social → `@bm-social.metrics` |
| **Sage** | BM-Brand vs Core-PM | Core-PM → `@core-pm.oracle` |
| **Auditor** | BM-Brand vs BM-Finance | BM-Finance → `@bm-finance.compliance` |
| **Docs** | Generic name | BM-Support → `@bm-support.library` |

### Reserved Platform Names (Never Reuse)

These names are permanently reserved for platform-level agents:

- `Sentinel` - Approval Queue
- `Navigator` - Request Router
- `Bridge` - Integration Manager (future)

### Naming Guidelines for New Agents

1. **Check this registry first** - No duplicate display names
2. **Use the handle convention** - `@{module}.{key}`
3. **Prefer short, memorable names** - 1-2 syllables ideal
4. **Avoid generic terms** - `Manager`, `Helper`, `Agent`, `Bot`
5. **Consider the persona** - Names should reflect the agent's personality

---

## 4. Cross-Module Data Flows

### BUILD Phase Pipeline

```
┌─────────────┐     Market data, risks     ┌─────────────┐
│     BMV     │ ────────────────────────▶ │     BMP     │
│ (Validate)  │     Customer profiles      │   (Plan)    │
└─────────────┘     Competitor analysis    └──────┬──────┘
                                                  │
                    Business model                │
                    Financial projections         │
                    Feature priorities            ▼
                                           ┌─────────────┐
                                           │  BM-Brand   │
                                           │  (Brand)    │
                                           └──────┬──────┘
                    Brand guidelines              │
                    Voice/Visual specs            │
                    Asset requirements            ▼
                                           ┌─────────────┐
                                           │   Core-PM   │
                                           │  (Execute)  │
                                           └─────────────┘
```

### OPERATE Phase Integrations

```
                         ┌─────────────────────────────────┐
                         │           Core-PM               │
                         │   (Central Project Tracking)    │
                         └─────────────────────────────────┘
                                        ▲
        ┌───────────────┬───────────────┼───────────────┬───────────────┐
        │               │               │               │               │
        ▼               ▼               ▼               ▼               ▼
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│  BM-CRM   │◀─▶│ BM-Social │◀─▶│BM-Support │   │  BM-HR    │   │BM-Finance │
│(Customers)│   │ (Social)  │   │ (Support) │   │(Employees)│   │(Finances) │
└─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
      │               │               │               │               │
      │               │               │               │               │
      └───────────────┴───────┬───────┴───────────────┴───────────────┘
                              │
                              ▼
                       ┌───────────┐
                       │   BM-PR   │
                       │   (PR)    │
                       └───────────┘
```

### Data Ownership Matrix

| Data Entity | Owner Module | Consumers |
|-------------|--------------|-----------|
| Contact/Company | BM-CRM | All modules |
| Lead Score | BM-CRM | BM-Social, Core-PM |
| Deal/Pipeline | BM-CRM | BM-Finance, Core-PM |
| Social Post | BM-Social | BM-PR, Core-PM |
| Social Mention | BM-Social | BM-Support, BM-PR |
| Conversation | BM-Support | BM-CRM, Core-PM |
| Project/Task | Core-PM | All modules |
| Knowledge Page | Core-PM | All modules |
| Brand Guidelines | BM-Brand | All content modules |
| Invoice | BM-Finance | BM-CRM |
| Candidate | BM-HR | Core-PM |
| Media Contact | BM-PR | BM-CRM (extends Contact) |
| Press Release | BM-PR | BM-Social |

### Event Bus Integration

All modules publish events to Redis Streams with this naming convention:

```
{module}.{entity}.{action}
```

**Key Event Flows:**

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| `crm.contact.created` | BM-CRM | BM-Social, BM-Support, BM-PR |
| `crm.deal.won` | BM-CRM | BM-Finance (invoice), Core-PM (project) |
| `crm.deal.lost` | BM-CRM | Core-PM (archive) |
| `social.post.published` | BM-Social | BM-PR (amplification tracking) |
| `social.mention.detected` | BM-Social | BM-Support (triage), BM-PR (coverage) |
| `support.conversation.created` | BM-Support | BM-CRM (activity log) |
| `support.csat.submitted` | BM-Support | Core-PM (metrics) |
| `pm.task.completed` | Core-PM | All modules (context) |
| `pm.project.created` | Core-PM | All modules (context) |
| `finance.invoice.paid` | BM-Finance | BM-CRM (deal update) |
| `hr.candidate.hired` | BM-HR | Core-PM (onboarding project) |
| `pr.coverage.detected` | BM-PR | BM-Social (share), BM-CRM (contact) |

---

## 5. Shared Platform Services

All modules leverage these platform-level services:

### Approval Queue (Sentinel)

**Confidence-Based Routing:**
- `>85%` confidence → Auto-execute
- `60-85%` confidence → Quick approval (1-click)
- `<60%` confidence → Full review

**High-Impact Actions Requiring Approval:**
- Content publishing (social posts, press releases)
- Financial transactions (invoices, payments)
- Customer communications (email campaigns)
- Data deletion (GDPR compliance)
- Hiring decisions (offers, rejections)

### Event Bus (Redis Streams)

**Features:**
- Pub/sub with consumer groups
- Dead letter queue (DLQ) for failed events
- Correlation IDs for request tracing
- Event replay capability

### BYOAI (Bring Your Own AI)

**Provider Support:**
- Claude (Anthropic)
- OpenAI (GPT-4)
- Google (Gemini)
- OpenRouter (100+ models)
- DeepSeek

**Usage Tracking:**
- Token consumption per agent
- Cost attribution per module
- Budget limits per workspace

### Knowledge Base (Core-PM)

**Available to All Modules:**
- Full-text search (PostgreSQL tsvector)
- Semantic search (pgvector embeddings)
- RAG integration for agent context
- Verified content system

### Real-Time Updates

**WebSocket/SSE Infrastructure:**
- Agent activity streaming
- Task status updates
- Notification delivery
- Collaborative editing (Yjs)

---

## 6. Module Interaction Patterns

### A2A (Agent-to-Agent) Protocol

Modules communicate via Google's A2A protocol:

```python
# Example: BM-CRM.Scout calling Core-PM.Navi
from a2a import A2AClient

client = A2AClient("http://core-pm:8000/a2a/navi")
task = await client.send_task({
    "message": {
        "role": "user",
        "parts": [{"text": "Create onboarding project for new customer"}]
    }
})
```

### AG-UI (Agent-to-User) Protocol

Frontend communication via CopilotKit:

```typescript
// Example: Dashboard rendering via agent tool call
useRenderToolCall({
  name: "render_dashboard_widget",
  render: ({ args }) => <DashboardWidget {...args.data} />
});
```

### Cross-Module Tool Calls

Agents can call tools from other modules via the platform:

| Calling Agent | Tool | Target Module |
|---------------|------|---------------|
| `@bm-crm.flow` | `create_onboarding_project` | Core-PM |
| `@bm-social.engage` | `create_support_ticket` | BM-Support |
| `@bm-support.triage` | `get_contact_history` | BM-CRM |
| `@bm-hr.culture` | `create_project` | Core-PM |
| `@bm-finance.controller` | `update_deal_status` | BM-CRM |
| `@bm-pr.pitcher` | `schedule_social_post` | BM-Social |

---

## 7. Implementation Priority

### Phase 1: Foundation (Complete)

- [x] Platform agents (Navigator, Sentinel)
- [x] BMV team (Vera, Marco, Cipher, Persona, Risk)
- [x] BMP team (Blake, Model, Finance, Revenue, Forecast)
- [x] BM-Brand team (Bella, Sage, Vox, Iris, Artisan, Audit)

### Phase 2: Core-PM (In Progress)

- [ ] Core-PM agents (Navi, Oracle, Herald, Chrono, Scope, Vitals)
- [ ] Knowledge Base infrastructure
- [ ] Event bus integration
- [ ] Real-time updates

### Phase 3: BM-CRM (Next)

- [ ] Complete Clara orchestrator
- [ ] Finish Scout, Atlas, Flow implementations
- [ ] Add Tracker, Sync, Guardian, Cadence
- [ ] CRM ↔ Core-PM integration

### Phase 4: BM-Social + BM-Support

- [ ] BM-Social core agents (Conductor, Spark, Tempo, Metrics, Engage, Trends)
- [ ] Platform specialists (prioritize top 3-4 platforms first)
- [ ] BM-Support core agents (Hub, Triage, Reply)
- [ ] Social ↔ Support mention routing

### Phase 5: Remaining Modules

- [ ] BM-HR agents
- [ ] BM-Finance agents
- [ ] BM-PR agents
- [ ] Full cross-module integration testing

---

## Appendix A: Agent Count Summary

| Module | Active | Partial | Planned | Total |
|--------|--------|---------|---------|-------|
| Platform | 2 | 0 | 0 | 2 |
| BMV | 5 | 0 | 0 | 5 |
| BMP | 5 | 0 | 0 | 5 |
| BM-Brand | 6 | 0 | 0 | 6 |
| Core-PM | 0 | 6 | 2 | 8 |
| BM-CRM | 0 | 3 | 5 | 8 |
| BM-Social | 0 | 0 | 18 | 18 |
| BM-Support | 0 | 0 | 8 | 8 |
| BM-HR | 0 | 0 | 5 | 5 |
| BM-Finance | 0 | 0 | 4 | 4 |
| BM-PR | 0 | 0 | 5 | 5 |
| **Total** | **18** | **9** | **47** | **72** |

---

## Appendix B: Quick Reference Card

### Agent Handles by Module

```
@platform.{navigator|sentinel}
@bmv.{vera|marco|cipher|persona|risk}
@bmp.{blake|model|finance|revenue|forecast}
@bm-brand.{bella|sage|vox|iris|artisan|audit}
@core-pm.{navi|oracle|herald|chrono|scope|vitals|scribe|prism}
@bm-crm.{clara|scout|atlas|flow|tracker|sync|guardian|cadence}
@bm-social.{conductor|spark|tempo|metrics|engage|trends|...}
@bm-support.{hub|triage|reply|automate|quality|captain|library|escalate}
@bm-hr.{hunter|gatekeeper|scheduler|interviewer|culture}
@bm-finance.{bookkeeper|controller|cfo|compliance}
@bm-pr.{chief|pitcher|wire|monitor|contacts}
```

### Event Naming Convention

```
{module}.{entity}.{action}

Examples:
crm.contact.created
crm.deal.stage_changed
social.post.published
support.conversation.resolved
pm.task.completed
```

---

*Document maintained by: Architecture Team*
*Last updated: 2024-12-24*
