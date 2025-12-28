# `docs/modules/` — Module Library, Status, and Agent Registry

This folder is the **documentation source-of-truth** for every HYVVE business module (and Core-PM platform core):
- What the module covers (scope boundaries, integrations, data ownership)
- Which artifacts exist (Brief → Research → PRD → Architecture → Epics/Stories → Sprint status)
- Which **agents** exist per module (so we don’t double-up names/roles)
- Which **research** (open-source + proprietary) is complete vs pending

If you’re starting module work, read these first:
- `docs/archive/foundation-phase/FOUNDATION-COMPLETE.md` (what the platform already delivers)
- `docs/MASTER-PLAN.md` (overall vision + module system)
- `docs/modules/bm-pm/PRD.md` (Core-PM is the orchestration core most modules depend on)

---

## Platform Foundation (Built)

The platform foundation is complete and provides the shared substrate all modules build on:
- Multi-tenancy via `workspaceId` + PostgreSQL RLS
- RBAC + module permissions
- Approval Queue (confidence-based routing) with audit trails
- Redis Streams event bus (pub/sub, DLQ, correlation IDs)
- BYOAI (encrypted key storage; multi-provider)
- WebSocket/SSE real-time UI plumbing

Source: `docs/archive/foundation-phase/FOUNDATION-COMPLETE.md`

---

## Module Artifact Lifecycle (How we track “stage”)

This repo uses a consistent artifact ladder. A module can be “done” in docs but not in code, so we track both.

**1) Brief**
- Small, narrative definition of value proposition, dependencies, workflows, draft models.

**2) Research**
- Checklists + findings, including competitor mapping and “what to copy/avoid”.
- Split into **open-source references** and **proprietary/SaaS references**.

**3) PRD**
- Success metrics, MVP scope, phased roadmap, and UX/approval requirements.

**4) Architecture**
- Data model, event contracts, API contracts, agent orchestration, and integration surfaces.

**5) Execution artifacts**
- Epics/Stories (BMAD state machine: `backlog → drafted → ready-for-dev → in-progress → review → done`)
- Sprint status (`sprint-status.yaml` where present)
- Retrospectives (what to adjust next sprint)

---

## Documentation Standards

**Standardized in December 2025** to ensure consistency across all modules.

### Naming Conventions

| File | Purpose | When to Use |
|------|---------|-------------|
| `README.md` | **Required** - Landing page for module | Always present |
| `MODULE-BRIEF.md` | Initial planning artifact | Brief phase only |
| `PRD.md` | Product requirements | After Brief phase |
| `architecture.md` | Technical architecture | After PRD phase |
| `sprint-status.yaml` | Sprint tracking | During execution |

### DO NOT Use

- ~~`BM-*-MODULE-BRIEF.md`~~ - Use `MODULE-BRIEF.md` (standardized)
- ~~`MODULE-PLAN.md`~~ - Use `PRD.md` or `architecture.md` instead

### Standard Module Structure

```
docs/modules/{module-id}/
├── README.md              # REQUIRED: Landing page
├── MODULE-BRIEF.md        # Optional: Initial planning
├── PRD.md                 # After Brief phase
├── architecture.md        # After PRD phase
├── research/              # Research findings
├── epics/                 # Epic definitions
├── stories/               # Story files
├── tech-specs/            # Technical specifications
├── sprint-status.yaml     # Sprint tracking
└── retrospectives/        # Sprint retrospectives
```

---

## Folder Layout

```
docs/modules/
  bm-ads/         # OPERATE: Paid Advertising (brief; coordinated by bm-marketing)
  bm-analytics/   # OPERATE: Analytics (brief)
  bm-brand/       # BUILD: Branding (docs complete; AgentOS active)
  bm-cms/         # OPERATE: Website/Blog (brief; coordinated by bm-marketing)
  bm-crm/         # OPERATE: CRM (PRD+arch+epics+research; partial AgentOS scaffold)
  bm-dm/          # INFRASTRUCTURE: Dynamic Module System (architecture+epics; implementation backlog)
  bm-email/       # OPERATE: Email Marketing (brief; coordinated by bm-marketing)
  bm-finance/     # OPERATE: Finance (brief)
  bm-hr/          # OPERATE: HR (brief)
  bm-marketing/   # BUILD: Marketing Strategy (architecture plan)
  bm-pm/          # PLATFORM CORE: Project Mgmt + Knowledge Base (PRD+epics+stories+sprint status)
  bm-pr/          # OPERATE: Public Relations (brief)
  bm-sales/       # OPERATE: Sales (architecture plan; extends bm-crm)
  bm-seo/         # OPERATE: SEO (brief; coordinated by bm-marketing)
  bm-social/      # OPERATE: Social (research complete; PRD pending)
  bm-support/     # OPERATE: Support (research complete; PRD pending)
  bmp/            # BUILD: Planning (docs complete; AgentOS active)
  bmv/            # BUILD: Validation (docs complete; AgentOS active)
  README.md       # You are here
```

---

## Module Catalog (Docs + Build Status)

> “Docs status” is what exists under `docs/modules/<module>/`. “Build status” is what exists in runtime/app code today.

| Module | Folder | Layer / Phase | Docs status | Build status (today) | Key docs |
|---|---|---:|---|---|---|
| **BMV (Validation)** | `bmv` | BUILD | Complete docs | **AgentOS active** (`agents/validation/`) | `docs/modules/bmv/README.md` |
| **BMP (Planning)** | `bmp` | BUILD | Complete docs | **AgentOS active** (`agents/planning/`) | `docs/modules/bmp/README.md` |
| **BM-Brand (Branding)** | `bm-brand` | BUILD | Complete docs | **AgentOS active** (`agents/branding/`) | `docs/modules/bm-brand/README.md` |
| **BM-Marketing** | `bm-marketing` | BUILD | Architecture plan | Not implemented | `docs/modules/bm-marketing/README.md` |
| **Core-PM (PM + KB)** | `bm-pm` | Platform Core | PRD/Architecture/Epics/Stories + sprint status | **Complete** (16 epics delivered) | `docs/modules/bm-pm/PRD.md` |
| **BM-DM (Dynamic Module)** | `bm-dm` | Infrastructure | Architecture/Epics + sprint status | **Backlog** (6 epics, 38 stories, 231 pts) | `docs/modules/bm-dm/README.md` |
| **BM-CRM** | `bm-crm` | OPERATE | PRD/Architecture/Epics/Research | **Partial AgentOS scaffold** (`agents/crm/`) | `docs/modules/bm-crm/PRD.md` |
| **BM-Sales** | `bm-sales` | OPERATE | Architecture plan | Not implemented | `docs/modules/bm-sales/README.md` |
| **BM-Social** | `bm-social` | OPERATE | Research complete (PRD pending) | Not implemented | `docs/modules/bm-social/README.md` |
| **BM-Support** | `bm-support` | OPERATE | Research complete (PRD pending) | Not implemented | `docs/modules/bm-support/README.md` |
| **BM-HR** | `bm-hr` | OPERATE | Brief | Not implemented | `docs/modules/bm-hr/MODULE-BRIEF.md` |
| **BM-Finance** | `bm-finance` | OPERATE | Brief | Not implemented | `docs/modules/bm-finance/MODULE-BRIEF.md` |
| **BM-PR** | `bm-pr` | OPERATE | Brief | Not implemented | `docs/modules/bm-pr/MODULE-BRIEF.md` |

Operational build priorities (from foundation wrap-up):
- `docs/archive/foundation-phase/FOUNDATION-COMPLETE.md`

---

## Status Matrix (Artifacts Present)

Legend:
- ✅ present in `docs/modules/<module>/`
- ⏳ planned / pending
- (runtime) indicates live code under `agents/` and/or `apps/*`

| Module | Brief | Research | PRD | Architecture | Epics | Stories | Sprint status | Runtime |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `bmv` | ✅ | ✅ | ✅ (in README) | ⏳ | ⏳ | ⏳ | ⏳ | ✅ AgentOS team (`agents/validation/`) |
| `bmp` | ✅ | ✅ | ✅ (in README) | ⏳ | ⏳ | ⏳ | ⏳ | ✅ AgentOS team (`agents/planning/`) |
| `bm-brand` | ✅ | ⏳ (not in module folder) | ✅ (in README) | ⏳ | ⏳ | ⏳ | ⏳ | ✅ AgentOS team (`agents/branding/`) |
| `bm-marketing` | ✅ (`README.md`) | ⏳ | ⏳ | ✅ (`MODULE-PLAN.md`) | ⏳ | ⏳ | ⏳ | Not implemented |
| `bm-pm` | ✅ (`README.md`) | ✅ (`research/`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete (16 epics delivered) |
| `bm-dm` | ✅ (`README.md`) | ✅ (arch docs) | ✅ (arch docs) | ✅ | ✅ | ✅ | ✅ | Backlog (6 epics, 231 pts) |
| `bm-crm` | ⏳ (PRD acts as brief) | ✅ (`research/`) | ✅ | ✅ | ✅ | ⏳ | ⏳ | Partial AgentOS scaffold (`agents/crm/`) |
| `bm-sales` | ✅ (`README.md`) | ⏳ | ⏳ | ✅ (`MODULE-PLAN.md`) | ⏳ | ⏳ | ⏳ | Not implemented |
| `bm-social` | ✅ | ✅ (`research/`) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Not implemented |
| `bm-support` | ✅ | ✅ (`research/`) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Not implemented |
| `bm-hr` | ✅ (`MODULE-BRIEF.md`) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Not implemented |
| `bm-finance` | ✅ (`MODULE-BRIEF.md`) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Not implemented |
| `bm-pr` | ✅ (`MODULE-BRIEF.md`) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Not implemented |

---

## Agent Registry (Do Not Double Up)

This repo currently has **two parallel “agent naming layers”**:
1. **Runtime persona names** (human-facing): e.g. `Vera`, `Blake`, `Bella`
2. **BMAD YAML agent IDs / codes** (spec-facing): e.g. `validation-orchestrator`, `voice-architect`

There is also a third layer in a few places:
3. **Legacy / doc-only aliases** (e.g. “Blueprint”, “Ledger”, “Mint”) used in some module docs for personality branding.

To avoid collisions in chat/UI, treat the **canonical agent handle** as:

`@{moduleId}.{agentKey}`

Examples:
- `@bmv.vera`, `@bmv.marco`
- `@bmp.blake`, `@bmp.finance`
- `@bm-brand.bella`, `@bm-brand.vox`
- `@platform.sentinel`, `@platform.navigator`

### Platform (Shared) Agents (Already Implemented)

| Handle | Display name | Purpose | Source |
|---|---|---|---|
| `@platform.navigator` | Navigator | Request routing + multi-module orchestration | `agents/platform/orchestrator_agent.py` + `.bmad/orchestrator/agents/orchestrator-agent.agent.yaml` |
| `@platform.sentinel` | Sentinel | Approval Queue gatekeeper + HITL workflows | `agents/platform/approval_agent.py` + `.bmad/orchestrator/agents/approval-agent.agent.yaml` |

### Foundation Teams (Already Implemented in AgentOS)

Source of truth for current runtime state: `agents/` + `docs/archive/foundation-phase/agent-audit-report.md`.

#### BMV (Validation) — `agents/validation/`

| Handle | Display name | Role |
|---|---|---|
| `@bmv.vera` | Vera | Team lead (orchestrator persona) |
| `@bmv.validator` | Validator | Spec/display alias used in docs (`docs/modules/bmv/README.md`) |
| `@bmv.marco` | Marco | Market research (TAM/SAM/SOM) |
| `@bmv.cipher` | Cipher | Competitor analysis |
| `@bmv.persona` | Persona | Customer profiling (ICP/JTBD) |
| `@bmv.risk` | Risk | Feasibility + risk assessment |

#### BMP (Planning) — `agents/planning/`

| Handle | Display name | Role |
|---|---|---|
| `@bmp.blake` | Blake | Team lead (orchestrator) |
| `@bmp.model` | Model | Business model canvas expert |
| `@bmp.finance` | Finance | Financial projections |
| `@bmp.revenue` | Revenue | Monetization/pricing |
| `@bmp.forecast` | Forecast | Growth scenarios |

> Note: `agents/platform/orchestrator_agent.py` currently lists `Finn` in the BMP registry; runtime uses `Finance`. Align this to avoid routing confusion.

#### BM-Brand (Branding) — `agents/branding/`

| Handle | Display name | Role |
|---|---|---|
| `@bm-brand.bella` | Bella | Team lead (orchestrator) |
| `@bm-brand.sage` | Sage | Brand strategy |
| `@bm-brand.vox` | Vox | Brand voice |
| `@bm-brand.iris` | Iris | Visual identity |
| `@bm-brand.artisan` | Artisan | Asset generation |
| `@bm-brand.audit` | Audit | Brand QA/auditing |

### Operational Module Agents (Planned / Partial)

#### BM-CRM (partial AgentOS scaffold) — `agents/crm/`

| Handle | Display name | Role | Build status |
|---|---|---|---|
| `@bm-crm.scout` | Scout | Lead scoring | Scaffold + logic (`agents/crm/lead_scorer_agent.py`) |
| `@bm-crm.atlas` | Atlas | Data enrichment | Scaffold (`agents/crm/data_enricher_agent.py`) |
| `@bm-crm.flow` | Flow | Pipeline automation | Scaffold + logic (`agents/crm/pipeline_agent.py`) |

The BM-CRM PRD defines additional agents that are **not yet present** in AgentOS:
- `Clara` (orchestrator), `Echo` (activity tracker), `Sync`, `Guardian`, `Cadence`
Source: `docs/modules/bm-crm/PRD.md`

### Known Agent Name Collisions (Resolve Before Adding More Agents)

These are currently duplicated *as human-facing names* across multiple modules. Decide whether:
1) we allow duplicates but enforce `@module.agent` handles everywhere, or
2) we rename personas globally so every display name is unique.

Current collisions visible in module docs:
- `Sentinel` (reserved for platform approvals) vs BM-Social "Sentinel" listening agent (`docs/modules/bm-social/MODULE-BRIEF.md`)
- `Scout` (BM-CRM lead scoring) vs BM-Social trend scout (`docs/modules/bm-social/README.md`)
- `Echo` (BM-CRM activity tracker) vs BM-Social engagement agent (`docs/modules/bm-social/README.md`)
- `Pulse` (Core-PM risk) vs BM-Social analytics (`docs/modules/bm-social/README.md`)
- `Sage` (BM-Brand strategist) vs Core-PM estimation agent (`docs/modules/bm-pm/PRD.md`)

**Recommendation:** reserve these names platform-wide:
- `Sentinel`, `Navigator`

…and require all other agents to be addressed via handles (e.g. `@bm-crm.scout`, `@bm-social.scout`) until we explicitly rename.

---

## Agent Name Map (Docs ↔ Runtime)

This is a quick “translation table” for the most common mismatches.

| Module | Doc persona name(s) | Runtime display name(s) today | Notes |
|---|---|---|---|
| BMV | Validator, Marco, Cipher, Persona, Risk | Vera (lead), Marco, Cipher, Persona, Risk | Docs use “Validator” as the orchestrator; runtime lead is “Vera”. |
| BMP | Blueprint, Canvas, Ledger, Mint, Horizon | Blake (lead), Model, Finance, Revenue, Forecast | Docs use personality labels; runtime uses functional names. |
| BM-Brand | Brand Orchestrator, Brand Strategist, Voice Architect, Visual Identity Designer, Asset Generator, Brand Auditor | Bella (lead), Sage, Vox, Iris, Artisan, Audit | Docs use role names; runtime uses shorter persona names. |

---

## Global Agent Index (Existing + Planned)

### Existing in the repo today (runtime-capable)

| Display name | Handle | Scope | Status | Runtime source |
|---|---|---|---|---|
| Navigator | `@platform.navigator` | Platform | Active (scaffold routing) | `agents/platform/orchestrator_agent.py` |
| Sentinel | `@platform.sentinel` | Platform | Active | `agents/platform/approval_agent.py` |
| Vera | `@bmv.vera` | BMV | Active | `agents/validation/team.py` |
| Marco | `@bmv.marco` | BMV | Active | `agents/validation/team.py` |
| Cipher | `@bmv.cipher` | BMV | Active | `agents/validation/team.py` |
| Persona | `@bmv.persona` | BMV | Active | `agents/validation/team.py` |
| Risk | `@bmv.risk` | BMV | Active | `agents/validation/team.py` |
| Blake | `@bmp.blake` | BMP | Active | `agents/planning/team.py` |
| Model | `@bmp.model` | BMP | Active | `agents/planning/team.py` |
| Finance | `@bmp.finance` | BMP | Active | `agents/planning/team.py` |
| Revenue | `@bmp.revenue` | BMP | Active | `agents/planning/team.py` |
| Forecast | `@bmp.forecast` | BMP | Active | `agents/planning/team.py` |
| Bella | `@bm-brand.bella` | BM-Brand | Active | `agents/branding/team.py` |
| Sage | `@bm-brand.sage` | BM-Brand | Active | `agents/branding/team.py` |
| Vox | `@bm-brand.vox` | BM-Brand | Active | `agents/branding/team.py` |
| Iris | `@bm-brand.iris` | BM-Brand | Active | `agents/branding/team.py` |
| Artisan | `@bm-brand.artisan` | BM-Brand | Active | `agents/branding/team.py` |
| Audit | `@bm-brand.audit` | BM-Brand | Active | `agents/branding/team.py` |
| Scout | `@bm-crm.scout` | BM-CRM | Partial scaffold + logic | `agents/crm/lead_scorer_agent.py` |
| Atlas | `@bm-crm.atlas` | BM-CRM | Scaffold | `agents/crm/data_enricher_agent.py` |
| Flow | `@bm-crm.flow` | BM-CRM | Partial scaffold + logic | `agents/crm/pipeline_agent.py` |

### Planned in module docs (name reservations)

If you introduce any of these in AgentOS/UI, first check the collision list above and prefer namespacing handles.

| Planned display name | Module | Notes / collisions |
|---|---|---|
| Navi, Sage, Herald, Chrono, Scope, Pulse, Scribe, Bridge, Prism | Core-PM | `Sage` + `Pulse` collide with existing names in other modules. |
| Clara, Echo, Sync, Guardian, Cadence | BM-CRM | `Echo` collides with BM-Social; `Guardian` is a common name (reserve carefully). |
| Conductor, Spark, Tempo, Pulse, Echo, Scout, Sentinel, Radar, Shield (plus platform specialists) | BM-Social | Multiple collisions (`Pulse`, `Echo`, `Scout`, `Sentinel`). |
| Hub, Triage, Reply, Automate, Quality, Captain, Docs, Escalate | BM-Support | `Docs` is generic; prefer namespacing in UI. |
| Headhunter, Gatekeeper, Coordinator, Interviewer, Culture Keep | BM-HR | `Coordinator` is generic; prefer namespacing in UI. |
| Bookkeeper, Controller, CFO, Auditor | BM-Finance | `Auditor` collides with BM-Brand “Audit” conceptually (not name). |
| Chief Comms Officer, Pitch Perfect, Newswire, Newshound, Rolodex | BM-PR | Prefer consistent “persona” naming format if implemented. |

## Module Index (What Each Covers, Agents, Research)

### BMV — Business Validation (`docs/modules/bmv/`)

**Covers:** market sizing, competitor analysis, customer profiling, feasibility/risk, go/no-go synthesis.  
**Agents (docs):** Validator, Marco, Cipher, Persona, Risk (`docs/modules/bmv/README.md`).  
**Agents (runtime):** Vera-led team implemented in `agents/validation/` (see also `docs/archive/foundation-phase/agent-audit-report.md`).  

**Research**
- Open-source: varies by workflow; see `docs/modules/bmv/research/BMV-RESEARCH-FINDINGS.md`
- Proprietary / paid sources explicitly referenced: Gartner/Forrester/IDC/McKinsey/etc (source tiering documented in `docs/modules/bmv/README.md`)

**Next research gaps:** keep `BMV-RESEARCH-FINDINGS.md` current for new industries/APIs.

---

### BMP — Business Planning (`docs/modules/bmp/`)

**Covers:** business model canvas, financial projections, pricing/revenue models, growth forecasting, investor-ready plan compilation.  
**Agents (docs):** Blueprint (planner), Canvas (model), Ledger (finance), Mint (revenue), Horizon (forecast) (`docs/modules/bmp/README.md`).  
**Agents (runtime):** Blake (lead), Model, Finance, Revenue, Forecast in `agents/planning/`.  

**Research**
- Open-source: see `docs/modules/bmp/research/BMP-RESEARCH-FINDINGS.md`
- Proprietary / SaaS references: e.g. LivePlan/Strategyzer/Leanstack patterns (see research docs)

**Next research gaps:** keep pricing model benchmarks and unit economics templates current.

---

### BM-Brand — Brand Identity (`docs/modules/bm-brand/`)

**Covers:** brand strategy, voice/tone guidelines, visual identity system, asset checklist/generation, brand audits.  
**Agents (docs):** Brand Orchestrator, Brand Strategist, Voice Architect, Visual Identity Designer, Asset Generator, Brand Auditor (`docs/modules/bm-brand/README.md`).  
**Agents (runtime):** Bella-led team implemented in `agents/branding/` (Bella, Sage, Vox, Iris, Artisan, Audit).  

**Research**
- Open-source: varies by workflow; see `docs/modules/bm-brand/README.md` and module data CSV references
- Proprietary / SaaS references: Looka, Brandmark, Coolors, Fontjoy, Namelix (captured in earlier research docs)

**Next research gaps:** keep platform-specific asset specs and brand governance patterns current.

---

### Core-PM — Project Management + Knowledge Base (`docs/modules/bm-pm/`)

**Covers (platform core):**
- Project/phase/task hierarchy and views
- Human + agent assignments with HITL approvals
- Knowledge base (Phase 1: CRUD/search; Phase 2+: collaboration + RAG)

**Agents (planned in PRD):**
- Navi, Sage, Herald, Chrono, Scope, Pulse, Scribe (+ Bridge/Prism in Phase 2)
Source: `docs/modules/bm-pm/PRD.md`

**Build stage:**
- Use `docs/modules/bm-pm/sprint-status.yaml` as the source-of-truth for which stories are done vs pending.

**Research**
- Open-source: Plane-inspired patterns (and others referenced in PRD)
- Proprietary / SaaS: Linear, ClickUp, Monday, Jira, Wrike, etc (see `docs/modules/bm-pm/PRD.md` “References”)

---

### BM-CRM — Customer Relationship Management (`docs/modules/bm-crm/`)

**Covers:** contacts/companies/deals, lead scoring, enrichment, pipeline automation, compliance, integrations, and Core-PM linking.  
**Docs artifacts:** PRD + architecture + epics + research checklist.  
**Agents (PRD):** Clara (lead), Scout, Atlas, Flow, Echo (+ Sync, Guardian, Cadence).  
**Agents (runtime today):** Scout, Atlas, Flow exist as scaffolds in `agents/crm/` (Clara/Echo/etc pending).  

**Research**
- Open-source: Twenty CRM (`docs/modules/bm-crm/research/twenty-crm-analysis.md`)
- Proprietary / SaaS: HubSpot, Salesforce; enrichment providers like Clearbit/Apollo (referenced in PRD)

**Next research gaps (keep checklist current):**
- `docs/modules/bm-crm/research/BM-CRM-RESEARCH-CHECKLIST.md`

---

### BM-Social — Social Media Management (`docs/modules/bm-social/`)

**Covers:** scheduling, multi-platform publishing, content creation, analytics, listening, engagement, approvals.  
**Agents (research):** core + platform specialists; expanded brief defines 18-agent model. 

**Important:** `docs/modules/bm-social/README.md` describes a 16-agent team, while `docs/modules/bm-social/MODULE-BRIEF.md` expands this to 18 and changes several code-name conventions. Standardize before implementation.

**Research**
- Open-source: Postiz (`docs/modules/bm-social/README.md`)
- Proprietary / SaaS: Buffer, Hootsuite, Sprout, Sendible; listening tools like Brandwatch/Talkwalker/etc (`docs/modules/bm-social/README.md`)

**Pending artifacts / work:**
- PRD + architecture + execution epics/stories
- Resolve agent naming collisions (especially `Sentinel`, `Scout`, `Echo`, `Pulse`) before implementing.

---

### BM-Support — Unified Inbox & Customer Support (`docs/modules/bm-support/`)

**Covers:** unified inbox, multi-channel messaging, automation rules, AI response assist, routing, CSAT, widget SDK, real-time.  
**Agents (research):** Hub, Triage, Reply, Automate, Quality, Captain, Docs, Escalate (`docs/modules/bm-support/README.md`).  

**Research**
- Open-source: Chatwoot (`docs/modules/bm-support/README.md`)
- Proprietary / SaaS: captured in research findings/checklist (see module research folder)

**Pending artifacts / work:**
- PRD + architecture + execution epics/stories

---

### BM-HR — Recruiting & People Ops (`docs/modules/bm-hr/`)

**Covers:** sourcing → screening → scheduling → interviewing → onboarding, with Core-PM task integration.
**Agents (brief):** Headhunter, Gatekeeper, Coordinator, Interviewer, Culture Keep (`docs/modules/bm-hr/MODULE-BRIEF.md`).  

**Research (to complete)**
- Open-source: identify OSS ATS/workflows worth copying (not yet captured as checklist in this module folder)
- Proprietary / SaaS: Ashby, Gem, Rippling (brief references)

**Pending artifacts / work:** research checklist + PRD + architecture.

---

### BM-Finance — Fractional CFO & Bookkeeping (`docs/modules/bm-finance/`)

**Covers:** transaction categorization, invoicing/collections, cashflow forecasting, expense/policy audits; integrates with CRM + HR + BMP plan-vs-actual.
**Agents (brief):** Bookkeeper, Controller, CFO, Auditor (`docs/modules/bm-finance/MODULE-BRIEF.md`).  

**Research (to complete)**
- Open-source: identify OSS accounting/bookkeeping patterns worth copying (not yet captured as checklist in this module folder)
- Proprietary / SaaS: Pilot, Bench (brief references)

**Pending artifacts / work:** research checklist + PRD + architecture.

---

### BM-PR — Public Relations (`docs/modules/bm-pr/`)

**Covers:** media relations, press releases, newsroom, monitoring, journalist relationship management; integrates with CRM + Social + Brand.
**Agents (brief):** Chief Comms Officer, Pitch Perfect, Newswire, Newshound, Rolodex (`docs/modules/bm-pr/MODULE-BRIEF.md`).  

**Research (to complete)**
- Open-source: identify OSS PR/newsroom/monitoring patterns worth copying (not yet captured as checklist in this module folder)
- Proprietary / SaaS: Cision, Muck Rack, Prowly (brief references)

**Pending artifacts / work:** research checklist + PRD + architecture.

---

## If You’re Adding a New Module

1. Create `docs/modules/<module-id>/` and start with a `README.md` (or `*-MODULE-BRIEF.md`).
2. Add `research/` with a checklist + findings (split OSS vs proprietary references).
3. Add `PRD.md`, then `architecture.md`.
4. Add epics/stories and a `sprint-status.yaml` once you start implementation.
5. Register agents in **one place**:
   - Docs: add to this file’s “Agent Registry”
   - Runtime: add to `agents/platform/orchestrator_agent.py` registry (or replace it with a DB-driven registry per `docs/archive/foundation-phase/agent-audit-report.md`)
