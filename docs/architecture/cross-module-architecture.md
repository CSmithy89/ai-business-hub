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
| **BUILD Phase** | Business creation/planning | BMV, BMP, BM-Brand, BM-Marketing |
| **OPERATE Phase** | Day-to-day operations | BM-CRM, BM-Sales*, BM-Email, BM-Social, BM-SEO, BM-Ads, BM-Support, BM-HR, BM-Finance, BM-PR |
| **Horizontal Services** | Cross-cutting capabilities | BM-Analytics |

> *BM-Sales is the only extension module requiring BM-CRM (shared contact/deal data)
> All other OPERATE modules are **standalone** - they work independently but integrate via A2A when multiple are installed
> BM-Analytics aggregates metrics from all installed modules and provides AI-powered insights

### Module Architecture Philosophy

**"Complete Modules, Automatic Integration"**

1. **Every module is complete** - Full agent team, built-in analytics dashboard, all features included
2. **CRM owns contact data** - Other modules read via A2A when CRM is installed
3. **Automatic discovery** - Modules find each other via A2A AgentCards, no configuration needed
4. **BM-Marketing orchestrates** - Coordinates multi-channel campaigns across installed modules
5. **BM-Analytics enhances** - Adds AI insights, recommendations, and automated optimizations

### Module Status Matrix

| Module | Phase | Docs | Runtime | Agent Count | Priority |
|--------|-------|------|---------|-------------|----------|
| **BMV** (Validation) | BUILD | Complete | Active | 5 | P0 - Done |
| **BMP** (Planning) | BUILD | Complete | Active | 5 | P0 - Done |
| **BM-Brand** (Branding) | BUILD | Complete | Active | 6 | P0 - Done |
| **Core-PM** (Project Mgmt) | CORE | Complete | In Progress | 8 | P0 - Active |
| **BM-Marketing** (Campaign Orchestrator) | BUILD | Complete | Not Started | 6 | P1 |
| **BM-CRM** (CRM) | OPERATE | Complete | Partial | 8 | P1 |
| **BM-Sales** (Sales) | OPERATE | Complete | Not Started | 6 | P1 (requires CRM) |
| **BM-Email** (Email) | OPERATE | Complete | Not Started | 6 | P2 - Standalone |
| **BM-Social** (Social) | OPERATE | Research | Not Started | 18 | P2 - Standalone |
| **BM-SEO** (SEO) | OPERATE | Complete | Not Started | 5 | P2 - Standalone |
| **BM-Ads** (Ads) | OPERATE | Complete | Not Started | 6 | P2 - Standalone |
| **BM-Support** (Support) | OPERATE | Research | Not Started | 8 | P2 - Standalone |
| **BM-CMS** (Website/Blog) | OPERATE | Complete | Not Started | 5 | P2 - Standalone |
| **BM-Analytics** (AI Analytics) | HORIZONTAL | Planned | Not Started | 4 | P2 |
| **BM-HR** (HR) | OPERATE | Brief | Not Started | 5 | P3 - Standalone |
| **BM-Finance** (Finance) | OPERATE | Brief | Not Started | 4 | P3 - Standalone |
| **BM-PR** (PR) | OPERATE | Brief | Not Started | 5 | P3 - Standalone |

**Total Agents Defined:** 110 (BM-Content replaced by BM-CMS with 5 agents)

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

### BM-Sales - Sales Management (6) - CRM Extension

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-sales.sterling` | Sterling | Team Lead / Orchestrator | Planned |
| `@bm-sales.quota` | Quota | Quotation Specialist | Planned |
| `@bm-sales.order` | Order | Order Manager | Planned |
| `@bm-sales.price` | Price | Pricing Strategist | Planned |
| `@bm-sales.region` | Region | Territory Manager | Planned |
| `@bm-sales.bounty` | Bounty | Commission Tracker | Planned |

> **Note:** BM-Sales **requires BM-CRM** (shared contact/deal data). Sterling coordinates with Clara for CRM→Sales workflows.

### BM-Marketing - Marketing Strategy (6) - BUILD Phase

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-marketing.maven` | Maven | Team Lead / Orchestrator | Planned |
| `@bm-marketing.channel` | Channel | Channel Strategist | Planned |
| `@bm-marketing.segment` | Segment | Audience Analyst | Planned |
| `@bm-marketing.campaign` | Campaign | Campaign Designer | Planned |
| `@bm-marketing.budget` | Budget | Marketing Economist | Planned |
| `@bm-marketing.measure` | Measure | Attribution Analyst | Planned |

> **Note:** BM-Marketing is a **BUILD phase** campaign orchestrator. Coordinates multi-channel campaigns across installed OPERATE modules via A2A discovery.

### BM-Email - Email Marketing (6) - Standalone

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-email.dispatch` | Dispatch | Team Lead / Orchestrator | Planned |
| `@bm-email.sequence` | Sequence | Journey Architect | Planned |
| `@bm-email.template` | Template | Template Designer | Planned |
| `@bm-email.deliver` | Deliver | Deliverability Expert | Planned |
| `@bm-email.track` | Track | Analytics Tracker | Planned |
| `@bm-email.comply` | Comply | Compliance Monitor | Planned |

> **Note:** BM-Email is **standalone** with built-in analytics. When BM-Marketing is installed, campaigns are coordinated via A2A.

### BM-CMS - Content Management System (5) - Standalone

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-cms.publisher` | Publisher | Team Lead / Orchestrator | Planned |
| `@bm-cms.page` | Page | Page Builder | Planned |
| `@bm-cms.blog` | Blog | Blog Manager | Planned |
| `@bm-cms.media` | Media | Media Library | Planned |
| `@bm-cms.template` | Template | Template Designer | Planned |

> **Note:** BM-CMS is **standalone** for website/blog content. Each module has built-in content creation for its domain; BM-CMS manages web pages and blogs.

### BM-SEO - Search Optimization (5) - Standalone

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-seo.crawler` | Crawler | Team Lead / Site Auditor | Planned |
| `@bm-seo.keyword` | Keyword | Keyword Researcher | Planned |
| `@bm-seo.onpage` | OnPage | On-Page Optimizer | Planned |
| `@bm-seo.technical` | Technical | Technical SEO Specialist | Planned |
| `@bm-seo.rank` | Rank | Rank Tracker | Planned |

> **Note:** BM-SEO is **standalone** with built-in analytics. Shares keyword intelligence with BM-Content and BM-Ads via A2A when installed.

### BM-Ads - Paid Advertising (6) - Standalone

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-ads.buyer` | Buyer | Team Lead / Media Buyer | Planned |
| `@bm-ads.creative` | Creative | Ad Creative Designer | Planned |
| `@bm-ads.target` | Target | Audience Targeting | Planned |
| `@bm-ads.bid` | Bid | Bid Optimizer | Planned |
| `@bm-ads.google` | Google | Google Ads Specialist | Planned |
| `@bm-ads.meta` | Meta | Meta Ads Specialist | Planned |

> **Note:** BM-Ads is **standalone** with built-in analytics. Reads audience segments from BM-Marketing via A2A when installed.

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

### BM-Analytics - AI Analytics (4) - Horizontal Service

| Handle | Display Name | Role | Status |
|--------|--------------|------|--------|
| `@bm-analytics.cortex` | Cortex | Team Lead / Orchestrator | Planned |
| `@bm-analytics.insight` | Insight | Pattern Detector | Planned |
| `@bm-analytics.recommend` | Recommend | Recommendation Engine | Planned |
| `@bm-analytics.automate` | Automate | Automated Optimizer | Planned |

> **Note:** BM-Analytics is a **horizontal service** that enhances all installed modules. Aggregates metrics via A2A, provides AI-powered insights, recommendations, and automated optimizations. Each module has built-in analytics; BM-Analytics adds intelligence.

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
| Lead Score | BM-CRM | BM-Sales, BM-Social, Core-PM |
| Deal/Pipeline | BM-CRM | BM-Sales, BM-Finance, Core-PM |
| Quote | BM-Sales | BM-CRM (read), BM-Finance |
| Order | BM-Sales | BM-Finance (invoicing), Core-PM |
| Pricing Rules | BM-Sales | BM-Finance |
| Territory | BM-Sales | BM-CRM (assignment), Core-PM |
| Commission | BM-Sales | BM-Finance (payroll), BM-HR |
| Social Post | BM-Social | BM-PR, Core-PM |
| Social Mention | BM-Social | BM-Support, BM-PR |
| Conversation | BM-Support | BM-CRM, Core-PM |
| Project/Task | Core-PM | All modules |
| Knowledge Page | Core-PM | All modules |
| Brand Guidelines | BM-Brand | All content modules |
| Invoice | BM-Finance | BM-CRM, BM-Sales |
| Candidate | BM-HR | Core-PM |
| Media Contact | BM-PR | BM-CRM (extends Contact) |
| Press Release | BM-PR | BM-Social |
| Marketing Campaign | BM-Marketing | BM-Email, BM-Content, BM-Ads, BM-Social, Core-PM |
| Audience Segment | BM-Marketing | BM-Email, BM-Ads, BM-Social |
| Channel Strategy | BM-Marketing | All tactical extensions |
| Attribution Event | BM-Marketing | BM-Finance (revenue), Core-PM |
| Marketing Budget | BM-Marketing | BM-Finance, Core-PM |
| Email Sequence | BM-Email | BM-CRM (contact status), BM-Marketing |
| Email Template | BM-Email | BM-Content (assets) |
| Content Asset | BM-Content | BM-Email, BM-Social, BM-Ads, BM-SEO |
| Editorial Calendar | BM-Content | BM-Social (scheduling), BM-Email |
| SEO Audit | BM-SEO | BM-Content (optimization), Core-PM |
| Keyword Research | BM-SEO | BM-Content, BM-Ads |
| Ad Campaign | BM-Ads | BM-Marketing (attribution), BM-Finance |
| Ad Creative | BM-Ads | BM-Content (assets), BM-Brand |

### Event Bus Integration

All modules publish events to Redis Streams with this naming convention:

```
{module}.{entity}.{action}
```

**Key Event Flows:**

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| `crm.contact.created` | BM-CRM | BM-Sales, BM-Social, BM-Support, BM-PR |
| `crm.deal.stage_changed` | BM-CRM | BM-Sales (if "Proposal", suggest quote) |
| `crm.deal.won` | BM-CRM | BM-Sales (complete order), BM-Finance (invoice), Core-PM (project) |
| `crm.deal.lost` | BM-CRM | BM-Sales (expire quotes), Core-PM (archive) |
| `sales.quote.created` | BM-Sales | BM-CRM (update deal) |
| `sales.quote.accepted` | BM-Sales | BM-CRM (advance deal) |
| `sales.order.created` | BM-Sales | BM-Finance (invoice), Core-PM (project) |
| `sales.order.completed` | BM-Sales | BM-Finance (revenue), BM-CRM (close deal) |
| `sales.commission.earned` | BM-Sales | BM-Finance (payroll), BM-HR (compensation) |
| `social.post.published` | BM-Social | BM-PR (amplification tracking) |
| `social.mention.detected` | BM-Social | BM-Support (triage), BM-PR (coverage) |
| `support.conversation.created` | BM-Support | BM-CRM (activity log) |
| `support.csat.submitted` | BM-Support | Core-PM (metrics) |
| `pm.task.completed` | Core-PM | All modules (context) |
| `pm.project.created` | Core-PM | All modules (context) |
| `finance.invoice.paid` | BM-Finance | BM-CRM (deal update), BM-Sales (order update) |
| `hr.candidate.hired` | BM-HR | Core-PM (onboarding project) |
| `pr.coverage.detected` | BM-PR | BM-Social (share), BM-CRM (contact) |
| `marketing.campaign.created` | BM-Marketing | BM-Email, BM-Content, BM-Ads, BM-Social |
| `marketing.campaign.launched` | BM-Marketing | All extensions, Core-PM |
| `marketing.segment.updated` | BM-Marketing | BM-Email (lists), BM-Ads (audiences) |
| `marketing.attribution.recorded` | BM-Marketing | BM-Finance (revenue), Core-PM |
| `email.sequence.started` | BM-Email | BM-CRM (contact activity), BM-Marketing |
| `email.sequence.completed` | BM-Email | BM-Marketing (funnel metrics) |
| `email.sent` | BM-Email | BM-Marketing (metrics) |
| `email.opened` | BM-Email | BM-Marketing, BM-CRM (engagement) |
| `email.clicked` | BM-Email | BM-Marketing, BM-CRM (lead scoring) |
| `content.asset.published` | BM-Content | BM-Social (share), BM-SEO (index) |
| `content.asset.updated` | BM-Content | BM-SEO (re-index) |
| `seo.audit.completed` | BM-SEO | BM-Content (fixes), Core-PM (tasks) |
| `seo.rank.changed` | BM-SEO | BM-Marketing (metrics), Core-PM |
| `ads.campaign.created` | BM-Ads | BM-Marketing (budget), BM-Finance |
| `ads.conversion.recorded` | BM-Ads | BM-Marketing (attribution), BM-CRM (lead) |
| `ads.budget.depleted` | BM-Ads | BM-Marketing (reallocation), Core-PM (alert) |

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
| BM-Marketing | 0 | 0 | 6 | 6 |
| BM-CRM | 0 | 3 | 5 | 8 |
| BM-Sales | 0 | 0 | 6 | 6 |
| BM-Email | 0 | 0 | 6 | 6 |
| BM-Social | 0 | 0 | 18 | 18 |
| BM-SEO | 0 | 0 | 5 | 5 |
| BM-Ads | 0 | 0 | 6 | 6 |
| BM-Support | 0 | 0 | 8 | 8 |
| BM-CMS | 0 | 0 | 5 | 5 |
| BM-Analytics | 0 | 0 | 4 | 4 |
| BM-HR | 0 | 0 | 5 | 5 |
| BM-Finance | 0 | 0 | 4 | 4 |
| BM-PR | 0 | 0 | 5 | 5 |
| **Total** | **18** | **9** | **85** | **110** |

---

## Appendix B: Quick Reference Card

### Agent Handles by Module

```
# Platform Core
@platform.{navigator|sentinel}

# BUILD Phase
@bmv.{vera|marco|cipher|persona|risk}
@bmp.{blake|model|finance|revenue|forecast}
@bm-brand.{bella|sage|vox|iris|artisan|audit}
@bm-marketing.{maven|channel|segment|campaign|budget|measure}  ← Campaign Orchestrator
@core-pm.{navi|oracle|herald|chrono|scope|vitals|scribe|prism}

# OPERATE Phase - Standalone Modules
@bm-crm.{clara|scout|atlas|flow|tracker|sync|guardian|cadence}
@bm-sales.{sterling|quota|order|price|region|bounty}  ← Requires CRM
@bm-email.{dispatch|sequence|template|deliver|track|comply}
@bm-social.{conductor|spark|tempo|metrics|engage|trends|...}
@bm-seo.{crawler|keyword|onpage|technical|rank}
@bm-ads.{buyer|creative|target|bid|google|meta}
@bm-cms.{publisher|page|blog|media|template}
@bm-support.{hub|triage|reply|automate|quality|captain|library|escalate}
@bm-hr.{hunter|gatekeeper|scheduler|interviewer|culture}
@bm-finance.{bookkeeper|controller|cfo|compliance}
@bm-pr.{chief|pitcher|wire|monitor|contacts}

# Horizontal Service
@bm-analytics.{cortex|insight|recommend|automate}  ← AI-Powered Enhancement
```

### Event Naming Convention

```
{module}.{entity}.{action}

Examples:
crm.contact.created
crm.deal.stage_changed
sales.quote.created
sales.order.completed
sales.commission.earned
marketing.campaign.launched
marketing.attribution.recorded
email.sequence.completed
content.asset.published
seo.audit.completed
ads.conversion.recorded
social.post.published
support.conversation.resolved
pm.task.completed
```

---

*Document maintained by: Architecture Team*
*Last updated: 2025-12-24*
*Architecture v2: "Complete Modules, Automatic Integration" - Standalone modules with A2A discovery*
*BM-Content replaced with BM-CMS (website/blog). Total: 110 agents across 18 modules.*
