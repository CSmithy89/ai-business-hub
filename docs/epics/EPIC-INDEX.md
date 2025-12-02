# HYVVE Platform Foundation - Epic Index

**Created:** 2025-11-30
**Status:** Ready for Sprint Planning

---

## Epic Summary

| Epic | Name | Stories | Points | Priority | Phase | Wireframes |
|------|------|---------|--------|----------|-------|------------|
| EPIC-00 | Project Scaffolding | 7 | 17 | P0 | Phase 1 | - (infrastructure) |
| EPIC-01 | Authentication | 8 | 19 | P0 | Phase 1 | ✅ 6 wireframes (AU-01 to AU-06) |
| EPIC-02 | Workspace Management | 7 | 16 | P0 | Phase 1 | ✅ 1 wireframe (ST-06) |
| EPIC-03 | RBAC & Multi-tenancy | 7 | 17 | P0 | Phase 2 | - (backend) |
| EPIC-04 | Approval System | 12 | 29 | P0 | Phase 3 | ✅ 7 wireframes (AP-01 to AP-07) |
| EPIC-05 | Event Bus | 7 | 15 | P0 | Phase 4 | - (infrastructure) |
| EPIC-06 | BYOAI Configuration | 11 | 28 | P0 | Phase 4 | ✅ 4 wireframes (ST-02 to ST-05) |
| EPIC-07 | UI Shell | 10 | 24 | P0 | Phase 1-3 | ✅ 43 wireframes (SH, CH, AI, DB, DC, FI, FS, ST-01/07/08, PM-16-20) |
| EPIC-08 | Business Onboarding | 23 | 82 | P0/P1/P2 | Phase 5-6 | ✅ 18 wireframes (BO-01 to BO-18) |
| **Total** | | **92** | **247** | | | **79 linked** + 30 future (CRM, PM) |

> **Note:** Story counts updated 2025-12-01 to include AgentOS integration (ADR-007), IAssistantClient (06.10), Agent Model Preferences (06.11)
> **Note:** EPIC-08 added 2025-12-01 - Business Onboarding with BMV, BMP, BM-Brand modules (23 stories, 82 points)

---

## Phase Breakdown

### Phase 1: Core Foundation
**Target:** Foundational infrastructure and authentication

| Epic | Stories | Focus |
|------|---------|-------|
| EPIC-00 | 7 | Monorepo, Next.js, NestJS, Prisma, AgentOS |
| EPIC-01 | 8 | better-auth, email/password, OAuth |
| EPIC-02 | 7 | Workspace CRUD, invitations, switching |
| EPIC-07 | 4 | Layout, sidebar, header, basic shell |

**Phase 1 Stories:** 26
**Phase 1 Points:** ~58

### Phase 2: RBAC & Multi-tenancy
**Target:** Security and data isolation

| Epic | Stories | Focus |
|------|---------|-------|
| EPIC-03 | 7 | Permissions, guards, RLS, Prisma extension |

**Phase 2 Stories:** 7
**Phase 2 Points:** ~17

### Phase 3: Approval System
**Target:** Human-in-the-loop workflows

| Epic | Stories | Focus |
|------|---------|-------|
| EPIC-04 | 12 | Confidence routing, queue, cards, agents, AgentOS integration |
| EPIC-07 | 3 | Chat panel, notifications |

**Phase 3 Stories:** 15
**Phase 3 Points:** ~35

### Phase 4: Event Bus & BYOAI
**Target:** Cross-module communication and AI integration

| Epic | Stories | Focus |
|------|---------|-------|
| EPIC-05 | 7 | Redis Streams, pub/sub, DLQ |
| EPIC-06 | 11 | Provider abstraction, encryption, usage tracking, AgentOS integration, IAssistantClient, Agent Model Preferences |

**Phase 4 Stories:** 18
**Phase 4 Points:** ~43

### Phase 5: UI Polish
**Target:** Complete UI features

| Epic | Stories | Focus |
|------|---------|-------|
| EPIC-07 | 3 | Command palette, shortcuts, mobile |

**Phase 5 Stories:** 3
**Phase 5 Points:** ~12

### Phase 6: Business Onboarding
**Target:** Foundation Modules (BMV, BMP, BM-Brand)

| Epic | Stories | Focus |
|------|---------|-------|
| EPIC-08 | 23 | Business Validation (8 workflows), Planning (9 workflows), Branding (7 workflows), Integration |

**Phase 6 Stories:** 23
**Phase 6 Points:** ~82

**Sub-phases:**
- Phase 6a (P0): Foundation + Validation MVP - 8 stories, ~30 points
- Phase 6b (P1): Full Validation + Planning - 8 stories, ~33 points
- Phase 6c (P2): Branding + Polish - 7 stories, ~19 points

---

## Sprint Planning Recommendations

### Sprint 1 (Foundation)
- EPIC-00: All stories (Project Scaffolding + AgentOS Setup)
- EPIC-07: Stories 07.1, 07.2 (Layout, Sidebar)
**Points:** ~22

### Sprint 2 (Auth)
- EPIC-01: Stories 01.1-01.4 (Core Auth)
- EPIC-07: Story 07.3 (Header)
**Points:** ~12

### Sprint 3 (Auth + Workspaces)
- EPIC-01: Stories 01.5-01.8 (OAuth, Sessions, UI)
- EPIC-02: Stories 02.1-02.2 (Workspace CRUD, Invites)
**Points:** ~14

### Sprint 4 (Workspaces + RBAC)
- EPIC-02: Stories 02.3-02.7 (Members, Settings)
- EPIC-03: Stories 03.1-03.3 (Permissions, Guards)
**Points:** ~16

### Sprint 5 (RBAC + Multi-tenancy)
- EPIC-03: Stories 03.4-03.7 (RLS, Extension, Audit)
**Points:** ~10

### Sprint 6-7 (Approval System + AgentOS Integration)
- EPIC-04: All stories (includes Control Plane, NestJS ↔ AgentOS bridge)
- EPIC-07: Story 07.4 (Chat Panel)
**Points:** ~32

### Sprint 8-9 (Event Bus + BYOAI)
- EPIC-05: All stories
- EPIC-06: All stories (includes AgentOS BYOAI integration)
**Points:** ~37

### Sprint 10 (Polish)
- EPIC-07: Stories 07.5-07.10 (Theme, Command, Keyboard, Mobile)
**Points:** ~13

### Sprint 11-12 (Business Onboarding Foundation)
- EPIC-08: Stories 08.1-08.4 (Database models, Portfolio Dashboard, Wizard, Document Upload)
- EPIC-08: Stories 08.5-08.8 (Validation Team config, Chat, Idea Intake, Market Sizing)
**Points:** ~32

### Sprint 13-14 (Validation + Planning)
- EPIC-08: Stories 08.9-08.11 (Competitor Mapping, Customer Discovery, Validation Synthesis)
- EPIC-08: Stories 08.12-08.16 (Planning Team config, Planning Page, BMC, Financials, Plan Synthesis)
**Points:** ~25

### Sprint 15-16 (Branding + Integration)
- EPIC-08: Stories 08.17-08.21 (Branding Team config, Branding Page, Brand Strategy, Visual Identity, Asset Generation)
- EPIC-08: Stories 08.22-08.23 (Module Handoff, Completion Handoff)
**Points:** ~25

---

## Story Priority Matrix

### P0 (Critical - Must Have for MVP)
- All scaffolding stories (including AgentOS setup - Story 00.7)
- Core authentication (sign-up, sign-in, session)
- Workspace CRUD and invitations
- Permission guards and RLS
- Approval queue and routing
- NestJS ↔ AgentOS bridge (Story 04.12)
- AI provider configuration (including AgentOS integration - Story 06.9, IAssistantClient - Story 06.10)
- Dashboard layout and navigation
- **Business Onboarding Foundation:** Database models, Portfolio Dashboard, Wizard (Stories 08.1-08.3)
- **Validation Team MVP:** Team config, Chat, Idea Intake, Market Sizing, Synthesis (Stories 08.5-08.8, 08.11)

### P1 (High - Important Features)
- OAuth providers
- Member management
- Module permission overrides
- Bulk approval
- Approval Agent integration (Story 04.10)
- Control Plane connection (Story 04.11)
- Token usage dashboard
- Command palette
- Notifications
- **Validation Completion:** Competitor Mapping, Customer Discovery (Stories 08.9-08.10)
- **Planning Team:** Team config, Planning Page, BMC, Financials, Plan Synthesis (Stories 08.12-08.16)
- **Module Handoff:** Workflow handoffs between BMV→BMP→Brand (Story 08.22)

### P2 (Medium - Nice to Have)
- Event replay
- Provider health monitoring
- Mobile navigation
- Advanced keyboard shortcuts
- **Document Upload Pipeline:** Extract existing business docs (Story 08.4)
- **Branding Team:** Team config, Branding Page, Brand workflows (Stories 08.17-08.21)
- **Onboarding Completion:** Handoff to BM-PM (Story 08.23)

---

## Dependency Graph

```
EPIC-00 (Scaffolding + AgentOS)
    │
    ├── EPIC-01 (Auth) ─────────────────────────┐
    │       │                                    │
    │       ├── EPIC-02 (Workspaces) ───────────┤
    │       │       │                            │
    │       │       └── EPIC-03 (RBAC) ─────────┤
    │       │               │                    │
    │       │               ├── EPIC-04 (Approvals)
    │       │               │       │
    │       │               └── EPIC-05 (Events)
    │       │                       │
    │       └───────────────────────┴── EPIC-06 (BYOAI)
    │                                       │
    │                                       └── EPIC-08 (Business Onboarding)
    │                                               │
    │                                               ├── BMV (Validation Team)
    │                                               ├── BMP (Planning Team)
    │                                               └── BM-Brand (Branding Team)
    │
    └── EPIC-07 (UI Shell) ─────── [Parallel with all epics]
```

**EPIC-08 Dependencies:**
- Requires: EPIC-00 (AgentOS), EPIC-01 (Auth), EPIC-02 (Workspaces), EPIC-03 (RBAC), EPIC-06 (BYOAI)
- Optional: EPIC-04 (Approvals for HITL), EPIC-05 (Events for workflow triggers)

---

## Files Reference

| Epic | File |
|------|------|
| EPIC-00 | `docs/epics/EPIC-00-project-scaffolding.md` |
| EPIC-01 | `docs/epics/EPIC-01-authentication.md` |
| EPIC-02 | `docs/epics/EPIC-02-workspace-management.md` |
| EPIC-03 | `docs/epics/EPIC-03-rbac-multitenancy.md` |
| EPIC-04 | `docs/epics/EPIC-04-approval-system.md` |
| EPIC-05 | `docs/epics/EPIC-05-event-bus.md` |
| EPIC-06 | `docs/epics/EPIC-06-byoai.md` |
| EPIC-07 | `docs/epics/EPIC-07-ui-shell.md` |
| EPIC-08 | `docs/epics/EPIC-08-business-onboarding.md` |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `/docs/prd.md` | Product requirements |
| `/docs/architecture.md` | Technical architecture |
| `/docs/ux-design.md` | UX design decisions |
| `/docs/design/wireframes/WIREFRAME-INDEX.md` | **109 completed wireframes** |
| `/docs/api/openapi.yaml` | API specification |
| `/packages/db/prisma/schema.prisma` | Database schema |

---

_Generated by BMAD Create Epics and Stories Workflow v1.0_
_Date: 2025-11-30_
_Updated: 2025-12-01 (AgentOS integration - ADR-007, IAssistantClient - 06.10, Agent Model Preferences - 06.11)_
_For: chris_
