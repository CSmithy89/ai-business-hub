# BM-CRM Module PRD - Research Checklist

**Purpose:** Research tasks to complete before creating the BM-CRM Module PRD
**Status:** ✅ COMPLETE
**Created:** 2025-11-30
**Completed:** 2025-11-30
**Output:** See individual section findings files in this folder

---

## Overview

This checklist identifies CRM-specific gaps that need research before writing the BM-CRM PRD. We've already completed Twenty CRM analysis, but module-specific requirements need deeper investigation.

**Existing Research:**
- `/docs/modules/bm-crm/research/twenty-crm-analysis.md` - Twenty CRM patterns
- `/docs/modules/bm-crm/agent-mapping.md` - Agent-to-user-flow mapping

---

## 1. Contact & Company Data Model

**Current State:** Basic concept, no detailed schema

### Research Tasks

- [ ] **Contact Entity Design**
  - [ ] Core fields (name, email, phone, title, etc.)
  - [ ] Custom fields architecture (like Twenty CRM)
  - [ ] Contact source tracking (where did they come from)
  - [ ] Contact lifecycle stages
  - [ ] Duplicate detection strategy

- [ ] **Company Entity Design**
  - [ ] Core fields (name, domain, industry, size, etc.)
  - [ ] Company hierarchy (parent/subsidiary)
  - [ ] Company-to-contact relationship
  - [ ] Firmographic data fields for scoring

- [ ] **Relationship Tracking**
  - [ ] Contact-to-company (many-to-many?)
  - [ ] Contact-to-contact relationships (reporting, referrals)
  - [ ] Company-to-company relationships
  - [ ] Relationship strength/type classification

- [ ] **Data Quality**
  - [ ] Required vs optional fields
  - [ ] Email/phone validation rules
  - [ ] Data completeness scoring
  - [ ] Merge/dedup workflow

### Questions to Answer

1. Should contacts exist without a company?
2. Can one contact belong to multiple companies?
3. What standard for industry classification (NAICS, SIC, custom)?
4. How do we handle contact opt-out/unsubscribe status?

### Reference Sources

- [ ] Review Twenty CRM contact model in depth
- [ ] Research HubSpot contact properties
- [ ] Study Salesforce standard objects
- [ ] Review Clay.com enrichment fields

---

## 2. Lead Scoring System

**Current State:** Algorithm defined (40/35/25), implementation pending

### Research Tasks

- [ ] **Scoring Factors Deep Dive**
  - [ ] Firmographic signals and weights
    - [ ] Company size scoring (employee count, revenue)
    - [ ] Industry fit scoring
    - [ ] Geographic scoring
    - [ ] Technology stack signals
  - [ ] Behavioral signals and weights
    - [ ] Email engagement (opens, clicks, replies)
    - [ ] Website activity (pages, time, frequency)
    - [ ] Content downloads
    - [ ] Event attendance
  - [ ] Intent signals and weights
    - [ ] Demo/trial requests
    - [ ] Pricing page visits
    - [ ] Competitor comparisons
    - [ ] Direct outreach

- [ ] **Score Decay & Recalculation**
  - [ ] How often to recalculate scores
  - [ ] Time-based score decay (old activity counts less)
  - [ ] Negative scoring (unsubscribes, bounces)
  - [ ] Score history tracking

- [ ] **Tier Thresholds**
  - [ ] Cold/Warm/Hot/Sales-Ready boundaries
  - [ ] Should thresholds be tenant-configurable?
  - [ ] Automatic tier-based routing rules
  - [ ] Alert triggers per tier change

- [ ] **Machine Learning Consideration**
  - [ ] Rule-based vs ML scoring trade-offs
  - [ ] Training data requirements
  - [ ] Model update frequency
  - [ ] Explainability requirements

### Questions to Answer

1. Should scoring be real-time or batch?
2. How do we handle missing data in scoring?
3. Should tenants customize scoring weights?
4. Do we need score explanations for sales reps?

### Reference Sources

- [ ] Research HubSpot lead scoring
- [ ] Study Clearbit Reveal scoring
- [ ] Review MadKudu ML scoring approach
- [ ] Analyze 6sense intent data patterns

---

## 3. Deal Pipeline Management

**Current State:** Stage automations defined, UI/data model incomplete

### Research Tasks

- [ ] **Deal Entity Design**
  - [ ] Core fields (name, value, stage, close date, etc.)
  - [ ] Deal-to-contact relationship (multi-stakeholder)
  - [ ] Deal-to-company relationship
  - [ ] Custom fields for deals
  - [ ] Deal tags/categories

- [ ] **Pipeline Configuration**
  - [ ] Default pipeline stages
  - [ ] Custom pipeline support (per product/segment)
  - [ ] Stage probability mapping
  - [ ] Required fields per stage
  - [ ] Stage transition rules

- [ ] **Pipeline Analytics**
  - [ ] Conversion rates per stage
  - [ ] Average time in stage
  - [ ] Win/loss analysis
  - [ ] Pipeline velocity metrics
  - [ ] Forecast accuracy

- [ ] **Deal Activities**
  - [ ] Activity types (call, email, meeting, note)
  - [ ] Activity logging (manual vs automatic)
  - [ ] Activity-to-deal association
  - [ ] Next action tracking

### Questions to Answer

1. Multiple pipelines per tenant or just one?
2. Can deals move backward in pipeline?
3. How do we handle split deals or deal linking?
4. What triggers "stuck deal" detection?

### Reference Sources

- [ ] Review Twenty CRM opportunity model
- [ ] Study Pipedrive pipeline UX
- [ ] Research Close.com deal management
- [ ] Analyze HubSpot deal properties

---

## 4. Data Enrichment System

**Current State:** Stub functions, no API integrations

### Research Tasks

- [ ] **Enrichment Sources**
  - [ ] Clearbit (company + person data)
  - [ ] LinkedIn (professional data)
  - [ ] ZoomInfo (B2B intelligence)
  - [ ] Hunter.io (email finding)
  - [ ] FullContact (social profiles)
  - [ ] Open data sources (Crunchbase API, etc.)

- [ ] **Enrichment Workflow**
  - [ ] Auto-enrich on contact creation?
  - [ ] Manual enrich button?
  - [ ] Bulk enrichment jobs?
  - [ ] Enrichment queue management

- [ ] **Data Mapping**
  - [ ] Map external fields to internal schema
  - [ ] Conflict resolution (existing vs enriched data)
  - [ ] Data freshness tracking
  - [ ] Enrichment confidence scores

- [ ] **Cost Management**
  - [ ] API credit tracking per provider
  - [ ] Cost per enrichment estimate
  - [ ] Tenant enrichment quotas
  - [ ] Caching strategy to reduce API calls

- [ ] **Email Verification**
  - [ ] Real-time verification vs batch
  - [ ] Verification providers (ZeroBounce, NeverBounce)
  - [ ] Verification status field
  - [ ] Re-verification schedule

### Questions to Answer

1. Which enrichment provider for MVP?
2. Real-time enrichment or async job?
3. How do we handle enrichment failures?
4. Should enrichment overwrite or append data?

### Reference Sources

- [ ] Review Clearbit API documentation
- [ ] Study Clay.com enrichment architecture
- [ ] Research Apollo.io data model
- [ ] Analyze Lusha API patterns

---

## 5. CRM External Integrations

**Current State:** Not specified

### Research Tasks

- [ ] **Two-Way Sync Candidates**
  - [ ] HubSpot CRM sync
  - [ ] Salesforce sync
  - [ ] Pipedrive sync
  - [ ] Which fields sync both ways?
  - [ ] Conflict resolution strategy

- [ ] **Import/Export**
  - [ ] CSV import with field mapping
  - [ ] CSV/Excel export
  - [ ] Bulk import validation
  - [ ] Import history/rollback

- [ ] **Email Integration**
  - [ ] Gmail/Outlook contact sync
  - [ ] Email tracking (opens, clicks)
  - [ ] Email logging to contact timeline
  - [ ] BCC email capture

- [ ] **Calendar Integration**
  - [ ] Meeting sync to activities
  - [ ] Calendar availability for scheduling
  - [ ] Meeting outcome logging

### Questions to Answer

1. Which CRM integrations are must-have vs nice-to-have?
2. Real-time sync or scheduled batch sync?
3. How do we handle record ownership across systems?
4. What's the dedup strategy for imported data?

### Reference Sources

- [ ] Research HubSpot API v3
- [ ] Study Salesforce REST API
- [ ] Review Zapier CRM integration patterns
- [ ] Analyze Segment CDP approach

---

## 6. CRM User Interface

**Current State:** Wireframe placeholders exist

### Research Tasks

- [ ] **Contact List View**
  - [ ] Default columns and sorting
  - [ ] Filter/search capabilities
  - [ ] Bulk actions (tag, enrich, export)
  - [ ] Saved views/segments
  - [ ] Infinite scroll vs pagination

- [ ] **Contact Detail View**
  - [ ] Information layout (sections, tabs)
  - [ ] Activity timeline
  - [ ] Related deals display
  - [ ] Quick actions (call, email, task)
  - [ ] Edit mode vs view mode

- [ ] **Pipeline Board**
  - [ ] Kanban drag-drop UX
  - [ ] Card information display
  - [ ] Stage totals and metrics
  - [ ] Filter and search on board
  - [ ] Quick deal creation

- [ ] **Dashboard & Reports**
  - [ ] Key metrics widgets
  - [ ] Pipeline overview chart
  - [ ] Activity metrics
  - [ ] Lead source breakdown
  - [ ] Custom report builder?

### Questions to Answer

1. Do we need a relationship map visualization?
2. Mobile CRM requirements?
3. Inline editing vs modal editing?
4. How prominent is AI/agent interaction in CRM UI?

### Reference Sources

- [ ] Review Twenty CRM UI patterns (already done)
- [ ] Study Attio modern CRM UX
- [ ] Research Folk CRM interface
- [ ] Analyze Affinity relationship views

---

## 7. CRM Agent Behaviors

**Current State:** Agent specs created, detailed behaviors needed

### Research Tasks

- [ ] **Scout (Lead Scorer) Behaviors**
  - [ ] When does Scout automatically score?
  - [ ] How does Scout explain scores to users?
  - [ ] What chat commands should Scout support?
  - [ ] How does Scout handle manual score overrides?

- [ ] **Atlas (Data Enricher) Behaviors**
  - [ ] When does Atlas auto-enrich vs wait for request?
  - [ ] How does Atlas report enrichment results?
  - [ ] What happens when enrichment fails?
  - [ ] How does Atlas handle rate limits/quotas?

- [ ] **Flow (Pipeline Agent) Behaviors**
  - [ ] What automations does Flow suggest proactively?
  - [ ] How does Flow notify about stuck deals?
  - [ ] What approval requests does Flow generate?
  - [ ] How does Flow interact with other agents?

- [ ] **Cross-Agent Coordination**
  - [ ] When does Scout trigger Atlas for enrichment?
  - [ ] When does Flow escalate to Sentinel (approval)?
  - [ ] How do agents share context about a contact?

### Questions to Answer

1. Should agents be proactive or reactive by default?
2. What's the agent notification style (chat, sidebar, toast)?
3. How do users give feedback on agent suggestions?
4. Can users "mute" certain agent behaviors?

### Reference Sources

- [ ] Study Taskosaur agent interactions
- [ ] Research Intercom Resolution Bot patterns
- [ ] Review Drift conversational CRM
- [ ] Analyze Clay.com AI agent UX

---

## 8. CRM Compliance & Privacy

**Current State:** Not addressed

### Research Tasks

- [ ] **GDPR Compliance**
  - [ ] Right to be forgotten (data deletion)
  - [ ] Data export (portability)
  - [ ] Consent tracking
  - [ ] Lawful basis documentation

- [ ] **CAN-SPAM / Email Compliance**
  - [ ] Unsubscribe handling
  - [ ] Email preference center
  - [ ] Suppression list management
  - [ ] Bounce handling

- [ ] **Data Retention**
  - [ ] Retention policies per data type
  - [ ] Automatic data purging
  - [ ] Archive vs delete decisions
  - [ ] Audit log retention

- [ ] **Access Controls**
  - [ ] Record ownership model
  - [ ] Territory/team-based access
  - [ ] Field-level permissions
  - [ ] Audit trail for sensitive data

### Questions to Answer

1. What regions/regulations must we comply with?
2. How long to retain contact data by default?
3. Do we need a DPO (Data Protection Officer) role?
4. How do we handle data subject access requests?

### Reference Sources

- [ ] Research GDPR requirements for CRM
- [ ] Study HubSpot compliance features
- [ ] Review Salesforce Shield capabilities
- [ ] Analyze OneTrust CRM patterns

---

## Research Priority Order

### Phase 1: Core Data Model (Do First)
1. Contact & Company Data Model (Section 1)
2. Deal Pipeline Management (Section 3)
3. Lead Scoring System (Section 2)

### Phase 2: Intelligence & Integration
4. Data Enrichment System (Section 4)
5. CRM External Integrations (Section 5)
6. CRM Agent Behaviors (Section 7)

### Phase 3: UI & Compliance
7. CRM User Interface (Section 6)
8. CRM Compliance & Privacy (Section 8)

---

## Completion Tracking

| Section | Research Status | Output File |
|---------|-----------------|-------------|
| 1. Contact & Company Data | ✅ Complete | `section-1-contact-company-findings.md` |
| 2. Lead Scoring | ✅ Complete | `section-2-lead-scoring-findings.md` |
| 3. Deal Pipeline | ✅ Complete | `section-3-deal-pipeline-findings.md` |
| 4. Data Enrichment | ✅ Complete | `section-4-data-enrichment-findings.md` |
| 5. External Integrations | ✅ Complete | `section-5-external-integrations-findings.md` |
| 6. User Interface | ✅ Complete | `section-6-user-interface-findings.md` |
| 7. Agent Behaviors | ✅ Complete | `section-7-agent-behaviors-findings.md` |
| 8. Compliance | ✅ Complete | `section-8-compliance-privacy-findings.md` |

---

## Dependencies on Platform Foundation

These items depend on Platform Foundation PRD being complete:

| CRM Requirement | Platform Dependency |
|-----------------|---------------------|
| Contact ownership | RBAC system |
| Team-based access | Multi-tenant isolation |
| Activity logging | Audit trail infrastructure |
| Agent interactions | Approval system (Sentinel) |
| Enrichment APIs | External integration framework |

---

## Next Steps

1. ✅ ~~Complete Platform Foundation research (blockers)~~ - See Platform checklist
2. ✅ ~~Work through Phase 1 CRM sections~~ - All complete
3. ✅ ~~Document findings in this folder~~ - 8 findings files created
4. ✅ ~~Update this checklist as items are completed~~ - Done
5. **READY:** Start BM-CRM PRD using findings as foundation

---

## Research Summary

All 8 research sections have been completed with comprehensive findings documented:

1. **Contact & Company Data Model** - Entity design, relationships, lifecycle stages, Prisma schemas
2. **Lead Scoring System** - 40/35/25 algorithm, scoring signals, decay formulas, tier thresholds
3. **Deal Pipeline Management** - Pipeline stages, velocity metrics, stage automations
4. **Data Enrichment** - Clearbit/Apollo comparison, waterfall architecture, email verification
5. **External Integrations** - HubSpot/Salesforce sync, CSV import, Gmail/Calendar integration
6. **User Interface** - Modern CRM patterns, Kanban board, contact detail layout, mobile design
7. **Agent Behaviors** - Scout/Atlas/Flow behaviors, notification UX, feedback mechanisms
8. **Compliance & Privacy** - GDPR/CAN-SPAM compliance, retention policies, access controls

**Total Deliverables:** 8 detailed findings documents with Prisma schemas, TypeScript interfaces, and implementation recommendations.

---

**Document Status:** Research Complete - Ready for PRD
**Owner:** AI Business Hub Team
