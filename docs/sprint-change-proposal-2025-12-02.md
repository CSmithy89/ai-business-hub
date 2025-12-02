# Sprint Change Proposal - Business Onboarding & Foundation Modules

**Date:** 2025-12-02
**Type:** Major Scope Addition
**Status:** APPROVED (Documents Updated)
**Requested By:** chris
**Impact Level:** High

---

## Executive Summary

This change proposal documents the integration of **EPIC-08: Business Onboarding & Foundation Modules** into the HYVVE Platform Foundation project. This represents a significant scope expansion that introduces:

- **3 new foundation modules** (BMV, BMP, BM-Brand)
- **16 new AI agents** across 3 teams
- **Two-level dashboard architecture** (Portfolio + Business)
- **Agno multi-agent framework** as the runtime
- **82 story points** across 23 stories

---

## Change Trigger

New documentation was added to the project:
1. `docs/epics/EPIC-08-business-onboarding.md` - Full epic specification
2. `docs/architecture/agno-implementation-guide.md` - Agno patterns guide
3. `docs/architecture/business-onboarding-architecture.md` - Module architecture
4. `docs/design/wireframes/WIREFRAME-INDEX.md` - 109 wireframes (including 18 for onboarding)
5. `agents/validation/README.md` - BMV team specification
6. `agents/planning/README.md` - BMP team specification
7. `agents/branding/README.md` - BM-Brand team specification
8. `agents/platform/README.md` - Platform orchestrator agents

---

## Impact Analysis

### Documents Analyzed

| Document | Initial Alignment | After Update | Changes Made |
|----------|------------------|--------------|--------------|
| `docs/prd.md` | 40-50% | 95% | Added Business Onboarding section, Foundation Modules, Agent Teams, FR-BO requirements, Implementation Phases 6-7 |
| `docs/architecture.md` | 50-60% | 95% | Added Foundation Modules Architecture section, Agent Session DB Schema, Agno Team patterns, Two-Level Dashboard, API endpoints |
| `docs/ux-design.md` | 60-70% | 95% | Added Business Onboarding user flows (Flows 5-8), Two-Level Dashboard Architecture, Foundation Module agent indicators |
| `docs/epics/EPIC-INDEX.md` | 80% | 100% | Updated dependency graph, added Sprint 11-16 planning, updated Priority Matrix |
| `docs/sprint-artifacts/sprint-status.yaml` | 100% | 100% | Already included EPIC-08 with 23 stories |

---

## Changes Implemented

### 1. PRD Updates (`docs/prd.md`)

**New Section:** "Business Onboarding & Foundation Modules"
- Overview of the business onboarding journey
- Agent Team Architecture (BMV, BMP, BM-Brand)
- Portfolio & Business Dashboard structure
- Business Onboarding Data Model
- 18 new Functional Requirements (FR-BO.1 through FR-BO.18)

**Updated Section:** "Implementation Phases"
- Added Phase 6: Business Onboarding Foundation (Weeks 12-15)
- Added Phase 7: Planning & Branding (Weeks 16-19)
- Updated Phase 8: Launch Prep (Week 20)

### 2. Architecture Updates (`docs/architecture.md`)

**New Section:** "Foundation Modules Architecture (Agno Teams)"
- Team Architecture diagram (BMV, BMP, BM-Brand)
- Agent Session Database Schema (businesses, agent_sessions, agent_memories tables)
- Agno Team Configuration Pattern (Python code example)
- AgentOS API Endpoints (chat, stream, history)
- Two-Level Dashboard Architecture
- Frontend-AgentOS Integration patterns
- Anti-Hallucination Architecture controls

### 3. UX Design Updates (`docs/ux-design.md`)

**New Sections:**
- User Flows 5-8 (Business Onboarding, BMV, BMP, BM-Brand)
- Two-Level Dashboard Architecture (Portfolio + Business)
- Business Context Navigation (Business Switcher)

**Updated Section:** "AI Team Indicators"
- Added Foundation Module Agents table with 16 agents
- Defined icons, colors, and roles for each agent

### 4. Epic Index Updates (`docs/epics/EPIC-INDEX.md`)

**Updated:** Dependency Graph
- Added EPIC-08 as dependent on EPIC-00, 01, 02, 03, 06
- Added BMV/BMP/BM-Brand module nodes

**Updated:** Sprint Planning
- Added Sprint 11-12 (Business Onboarding Foundation)
- Added Sprint 13-14 (Validation + Planning)
- Added Sprint 15-16 (Branding + Integration)

**Updated:** Story Priority Matrix
- P0: Business Onboarding Foundation, Validation Team MVP
- P1: Validation Completion, Planning Team, Module Handoff
- P2: Document Upload, Branding Team, Onboarding Completion

---

## New Story Breakdown

### EPIC-08 Statistics
- **Total Stories:** 23
- **Total Points:** 82
- **Estimated Sprints:** 6 (Sprint 11-16)

### Stories by Section

| Section | Stories | Points | Priority |
|---------|---------|--------|----------|
| Foundation Infrastructure | 4 | 18 | P0 |
| Validation Team (BMV) | 7 | 23 | P0-P1 |
| Planning Team (BMP) | 5 | 17 | P1 |
| Branding Team (BM-Brand) | 5 | 19 | P2 |
| Integration & Handoff | 2 | 5 | P1-P2 |

---

## Technical Decisions Confirmed

### ADR-007: AgentOS for Agent Runtime (Confirmed)
- Agno framework for multi-agent orchestration
- AgentOS as Python/FastAPI microservice
- Control Plane (os.agno.com) for agent monitoring
- JWT passthrough from better-auth
- Shared PostgreSQL with separate tables

### New Architectural Patterns

1. **Agno Team Pattern:** Leader-based coordination with specialist delegation
2. **PostgresStorage:** Agno sessions stored in PostgreSQL for persistence
3. **SSE Streaming:** Real-time agent responses via Server-Sent Events
4. **Anti-Hallucination Controls:** 2+ source requirements, recency checks, confidence marking

---

## Dependencies

### Prerequisites for EPIC-08
- EPIC-00: Project Scaffolding (AgentOS setup) - **DONE**
- EPIC-01: Authentication - **DONE**
- EPIC-02: Workspace Management - **DONE**
- EPIC-03: RBAC & Multi-Tenancy - **DONE**
- EPIC-06: BYOAI Configuration - **Required before stories 08.5+**

### Optional Dependencies
- EPIC-04: Approvals (for HITL patterns)
- EPIC-05: Events (for workflow triggers)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Agno API changes | Medium | Medium | Pin Agno version, monitor releases |
| Agent hallucination | Medium | High | Anti-hallucination architecture, source verification |
| Performance (3 teams) | Low | Medium | Async processing, caching, pagination |
| Scope creep | Medium | Medium | Strict story boundaries, defer enhancements |

---

## Approval

**Documents Updated:** 2025-12-02

| Document | Status |
|----------|--------|
| PRD | Updated |
| Architecture | Updated |
| UX Design | Updated |
| Epic Index | Updated |
| Sprint Status | Verified |

**Change Classification:** Major Scope Addition - Approved for Implementation

---

_Generated by BMAD Correct Course Workflow v1.0_
_Date: 2025-12-02_
_For: chris_
