# BM-CRM Module - Epic Index

**Module:** BM-CRM (AI-Powered CRM)
**Created:** 2025-12-15
**Source:** [PRD](/docs/modules/bm-crm/PRD.md) | [Architecture](/docs/modules/bm-crm/architecture.md)

---

## Overview

BM-CRM is an **8-agent AI team** for customer relationship management. This index tracks all epics and stories for implementing the module across three phases.

### Phase Summary

| Phase | Epics | Stories | Points | Focus |
|-------|-------|---------|--------|-------|
| **MVP (Phase 1)** | 4 | 32 | 89 | Core CRM with 5 agents |
| **Growth Phase 2** | 3 | 18 | 52 | +Sync, +Guardian, integrations |
| **Growth Phase 3** | 4 | 27 | 83 | +Cadence, advanced, Core-PM integration |
| **Total** | **11** | **77** | **224** | Full BM-CRM module |

---

## Phase 1: MVP (Core CRM)

### EPIC-CRM-01: Data Layer & Core CRUD
**Stories:** 8 | **Points:** 21 | **Status:** `backlog`

Implement the foundational data models and CRUD operations for CRM entities.

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| CRM-01.1 | Create CrmContact Prisma model with RLS | 3 | `backlog` |
| CRM-01.2 | Create CrmAccount Prisma model | 2 | `backlog` |
| CRM-01.3 | Create CrmDeal Prisma model | 3 | `backlog` |
| CRM-01.4 | Create CrmActivity Prisma model | 2 | `backlog` |
| CRM-01.5 | Implement Contact CRUD API endpoints | 3 | `backlog` |
| CRM-01.6 | Implement Account CRUD API endpoints | 2 | `backlog` |
| CRM-01.7 | Implement Deal CRUD API endpoints | 3 | `backlog` |
| CRM-01.8 | Implement Activity CRUD API endpoints | 3 | `backlog` |

---

### EPIC-CRM-02: MVP Agent Team
**Stories:** 10 | **Points:** 30 | **Status:** `backlog`

Implement the 5 MVP agents: Clara (orchestrator), Scout (scoring), Atlas (enrichment), Flow (pipeline), Echo (activities).

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| CRM-02.1 | Create CRM team.py with Clara as leader | 5 | `backlog` |
| CRM-02.2 | Implement Clara orchestrator agent | 5 | `backlog` |
| CRM-02.3 | Enhance Scout lead scorer agent | 3 | `backlog` |
| CRM-02.4 | Enhance Atlas data enricher agent | 3 | `backlog` |
| CRM-02.5 | Enhance Flow pipeline manager agent | 3 | `backlog` |
| CRM-02.6 | Create Echo activity tracker agent | 3 | `backlog` |
| CRM-02.7 | Create CRM tools.py with shared tools | 3 | `backlog` |
| CRM-02.8 | Register CRM team in main.py TEAM_CONFIG | 2 | `backlog` |
| CRM-02.9 | Implement A2A Agent Card for CRM team | 2 | `backlog` |
| CRM-02.10 | Create CRM event bus publishers | 1 | `backlog` |

---

### EPIC-CRM-03: Core CRM UI
**Stories:** 8 | **Points:** 22 | **Status:** `backlog`

Build the core CRM user interface including lists, detail views, and pipeline board.

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| CRM-03.1 | Create Contact List page with search/filter | 3 | `backlog` |
| CRM-03.2 | Create Contact Detail page with timeline | 3 | `backlog` |
| CRM-03.3 | Create Account List page | 2 | `backlog` |
| CRM-03.4 | Create Account Detail page | 2 | `backlog` |
| CRM-03.5 | Create Pipeline Kanban board | 5 | `backlog` |
| CRM-03.6 | Create Deal Detail modal/page | 3 | `backlog` |
| CRM-03.7 | Create CRM Dashboard with metrics | 3 | `backlog` |
| CRM-03.8 | Implement "Meet Your CRM Team" onboarding | 1 | `backlog` |

---

### EPIC-CRM-04: MVP Integrations
**Stories:** 6 | **Points:** 16 | **Status:** `backlog`

Implement CSV import/export, basic Gmail integration, and event bus publishing.

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| CRM-04.1 | Implement CSV import with field mapping wizard | 3 | `backlog` |
| CRM-04.2 | Implement CSV export with field selection | 2 | `backlog` |
| CRM-04.3 | Implement Gmail OAuth connection | 3 | `backlog` |
| CRM-04.4 | Implement email activity auto-logging from Gmail | 3 | `backlog` |
| CRM-04.5 | Implement CRM event publishers (all crm.* events) | 3 | `backlog` |
| CRM-04.6 | Create CRM event handlers for platform events | 2 | `backlog` |

---

## Phase 2: Growth

### EPIC-CRM-05: Sync Agent & External CRM Integration
**Stories:** 7 | **Points:** 21 | **Status:** `backlog`

Implement Sync agent with HubSpot and Salesforce bi-directional sync.

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| CRM-05.1 | Create Sync integration agent | 3 | `backlog` |
| CRM-05.2 | Implement HubSpot OAuth and API adapter | 3 | `backlog` |
| CRM-05.3 | Implement HubSpot bi-directional sync | 5 | `backlog` |
| CRM-05.4 | Implement Salesforce OAuth and API adapter | 3 | `backlog` |
| CRM-05.5 | Implement Salesforce bi-directional sync | 5 | `backlog` |
| CRM-05.6 | Create Sync Health Dashboard UI | 2 | `backlog` |
| CRM-05.7 | Implement sync conflict resolution queue | 2 | `backlog` |

---

### EPIC-CRM-06: Guardian Agent & Compliance
**Stories:** 6 | **Points:** 17 | **Status:** `backlog`

Implement Guardian compliance agent for GDPR, consent management, and data retention.

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| CRM-06.1 | Create Guardian compliance agent | 3 | `backlog` |
| CRM-06.2 | Implement consent tracking system | 3 | `backlog` |
| CRM-06.3 | Implement GDPR erasure workflow | 3 | `backlog` |
| CRM-06.4 | Implement data export (portability) | 2 | `backlog` |
| CRM-06.5 | Implement data retention policies | 3 | `backlog` |
| CRM-06.6 | Create compliance audit trail UI | 3 | `backlog` |

---

### EPIC-CRM-07: Custom Scoring & Calendar Integration
**Stories:** 5 | **Points:** 14 | **Status:** `backlog`

Implement custom scoring model configuration and calendar integration.

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| CRM-07.1 | Create scoring model configuration schema | 2 | `backlog` |
| CRM-07.2 | Implement scoring model UI in Settings | 3 | `backlog` |
| CRM-07.3 | Extend Scout to use custom scoring models | 3 | `backlog` |
| CRM-07.4 | Implement Google Calendar integration | 3 | `backlog` |
| CRM-07.5 | Implement Outlook Calendar integration | 3 | `backlog` |

---

## Phase 3: Growth (Advanced)

### EPIC-CRM-08: Cadence Agent & Email Sequences
**Stories:** 8 | **Points:** 26 | **Status:** `backlog`

Implement Cadence outreach agent with email sequences and multi-channel campaigns.

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| CRM-08.1 | Create Cadence outreach agent | 3 | `backlog` |
| CRM-08.2 | Create CrmSequence and CrmSequenceEnrollment models | 3 | `backlog` |
| CRM-08.3 | Implement sequence step state machine | 5 | `backlog` |
| CRM-08.4 | Implement BullMQ job processor for sequences | 3 | `backlog` |
| CRM-08.5 | Implement sequence conflict detection | 3 | `backlog` |
| CRM-08.6 | Create Sequence Builder UI | 5 | `backlog` |
| CRM-08.7 | Create Sequence Enrollment UI | 2 | `backlog` |
| CRM-08.8 | Implement sequence analytics and A/B testing | 2 | `backlog` |

---

### EPIC-CRM-09: Advanced Features
**Stories:** 8 | **Points:** 24 | **Status:** `backlog`

Implement multi-pipeline, advanced analytics, relationship mapping, and mobile PWA.

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| CRM-09.1 | Implement multi-pipeline data model | 3 | `backlog` |
| CRM-09.2 | Create pipeline management UI | 3 | `backlog` |
| CRM-09.3 | Implement deal stage history tracking | 2 | `backlog` |
| CRM-09.4 | Create analytics materialized views | 3 | `backlog` |
| CRM-09.5 | Build advanced reporting dashboard | 5 | `backlog` |
| CRM-09.6 | Implement relationship mapping data model | 2 | `backlog` |
| CRM-09.7 | Create relationship graph visualization | 3 | `backlog` |
| CRM-09.8 | Implement Mobile CRM PWA with offline support | 3 | `backlog` |

---

### EPIC-CRM-10: External Integrations & API
**Stories:** 6 | **Points:** 18 | **Status:** `backlog`

Implement LinkedIn integration, webhooks, Zapier, and public API.

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| CRM-10.1 | Implement LinkedIn/Sales Navigator integration | 3 | `backlog` |
| CRM-10.2 | Implement outbound webhook system | 3 | `backlog` |
| CRM-10.3 | Create webhook management UI | 2 | `backlog` |
| CRM-10.4 | Publish Zapier CRM app | 3 | `backlog` |
| CRM-10.5 | Implement public REST API | 5 | `backlog` |
| CRM-10.6 | Create API key management UI | 2 | `backlog` |

---

### EPIC-CRM-11: Core-PM Integration
**Stories:** 5 | **Points:** 15 | **Status:** `backlog`

Implement deep integration with Core-PM for project linking, KB playbooks, and cross-team coordination.

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| CRM-11.1 | Create CRM playbooks in Knowledge Base | 3 | `backlog` |
| CRM-11.2 | Implement Deal→Project linking on deal won | 3 | `backlog` |
| CRM-11.3 | Add Clara↔Navi A2A coordination for handoffs | 3 | `backlog` |
| CRM-11.4 | Link Echo activities to PM tasks | 3 | `backlog` |
| CRM-11.5 | Create CRM reports as KB verified content | 3 | `backlog` |

---

## Sprint Recommendations

### Sprint 1-2: MVP Foundation (EPIC-CRM-01 + CRM-02)
- Data layer complete
- 5 MVP agents operational
- **Goal:** CRM team can score leads and enrich data

### Sprint 3-4: MVP UI (EPIC-CRM-03 + CRM-04)
- Full CRM UI
- CSV import/Gmail integration
- **Goal:** Usable CRM with agent assistance

### Sprint 5-6: Growth Phase 2 (EPIC-CRM-05 + CRM-06)
- External CRM sync
- GDPR compliance
- **Goal:** Enterprise-ready CRM

### Sprint 7-8: Growth Phase 2 Complete (EPIC-CRM-07)
- Custom scoring
- Calendar integration
- **Goal:** Full Phase 2 feature set

### Sprint 9-10: Growth Phase 3 Part 1 (EPIC-CRM-08)
- Cadence agent
- Email sequences
- **Goal:** Outreach automation

### Sprint 11-12: Growth Phase 3 Part 2 (EPIC-CRM-09 + CRM-10)
- Advanced analytics
- Public API
- Mobile PWA
- **Goal:** External integrations complete

### Sprint 13: Core-PM Integration (EPIC-CRM-11)
- KB playbooks for CRM
- Deal→Project linking
- Cross-team coordination
- **Goal:** Full BM-CRM module complete with Core-PM integration

---

## Dependencies

### Platform Dependencies (All Complete)
- Multi-tenancy with RLS
- BYOAI configuration
- Event bus (Redis Streams)
- Approval queue
- WebSocket gateway
- AgentOS runtime
- Core-PM with Knowledge Base

### External Dependencies
| Integration | API Required | Notes |
|-------------|--------------|-------|
| Clearbit | API key | Enrichment provider |
| Apollo | API key | Enrichment provider |
| HubSpot | OAuth | CRM sync |
| Salesforce | OAuth | CRM sync |
| Gmail | OAuth | Email sync |
| Google Calendar | OAuth | Meeting sync |
| LinkedIn | Sales Navigator | Prospecting |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| External API rate limits | Enrichment delays | Provider waterfall, caching |
| Sync conflicts | Data inconsistency | Conflict resolution queue |
| Sequence spam | User complaints | Daily touch limits |
| LinkedIn API restrictions | Limited features | Sales Navigator requirement |

---

_Generated from BM-CRM PRD v1.4 and Architecture v1.1_
