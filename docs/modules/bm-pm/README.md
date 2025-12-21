# Core-PM: Project Management + Knowledge Base (Platform Core)

> **Status:** Draft (target design; not fully implemented)
> **Component ID:** Core-PM
> **Former name:** BM-PM (legacy naming in some research docs)
> **Last Updated:** 2025-12-16

## What Core-PM Is

Core-PM is **platform core infrastructure**, not an optional module. It provides:

1. **Project Management:** products, phases, tasks, teams, views, reporting hooks
2. **Knowledge Base:** wiki pages, versioning, search (Phase 1), collaboration + RAG (Phase 2)
3. **Orchestration:** the shared “command & control” surface used by all BM-* modules
4. **Human-in-the-loop:** reuses HYVVE’s approval queue and audit system (no parallel gating system)

## Tenancy + Hierarchy (Canonical)

1. **Isolation boundary:** Workspace (`workspaceId`)
2. **Hierarchy:** `Workspace → Business → Project → Phase → Task`
3. Event bus payloads currently use `tenantId`; treat it as an alias (`tenantId == workspaceId`) until naming is standardized platform-wide.

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/modules/bm-pm/PRD.md` | Requirements, phases, scope boundaries, DoD |
| `docs/modules/bm-pm/architecture.md` | Target architecture + data model + integration notes |
| `docs/modules/bm-pm/kb-specification.md` | Detailed KB behavior + UX requirements |
| `docs/modules/bm-pm/ux/README.md` | UX pack (flows, screens, permissions, UI rules) |
| `docs/modules/bm-pm/research/` | Research inputs (Plane/Taskosaur/etc.; may reference “BM-PM”) |

## AI Team Agents (PM-04)

Core-PM includes three specialized AI agents built on the Agno framework:

### Navi (Project Navigator)
- **Purpose:** Daily briefings and intelligent suggestions
- **Features:**
  - Daily briefing generation (overdue tasks, upcoming deadlines, blockers)
  - Proactive suggestion cards (prioritization, risk alerts, recommendations)
  - Chat interface with slash commands (`/status`, `/suggest`, `/prioritize`, `/risks`, `/help`)
  - Configurable briefing preferences (frequency, time, focus areas)

### Sage (Estimation Specialist)
- **Purpose:** Story point estimation and calibration
- **Features:**
  - Task complexity analysis (scope, technical, uncertainty factors)
  - Story point suggestions (Fibonacci scale: 1, 2, 3, 5, 8, 13, 21)
  - Similar task comparison for accuracy
  - Calibration factor tracking with weighted learning
  - Accept/reject workflow with override capability

### Chrono (Time Intelligence)
- **Purpose:** Time tracking and velocity analytics
- **Features:**
  - Start/stop timer functionality
  - Manual time entry logging
  - Project velocity calculation (configurable sprint periods)
  - Velocity trends and trend analysis
  - Hours-per-point averages for capacity planning

## Phase Summary (Execution Intent)

1. **Phase 1 (MVP):** PM CRUD + KB CRUD + full-text search + HITL integration + Socket.io updates + AI Team (Navi, Sage, Chrono)
2. **Phase 2:** Yjs/Hocuspocus collaboration + pgvector embeddings + verified content governance
3. **Phase 3:** workflow builder + public API + AI-native KB features (all gated by approvals)

## PM-09 Advanced Views (Implemented)

**Capabilities**
- **Timeline/Gantt View**: Drag/resize task schedules, dependency arrows, critical path highlighting
- **Portfolio Dashboard**: Workspace-level health metrics, filters, project drill-down
- **Dependencies Dashboard**: Cross-project dependency visibility and relation filters
- **Custom View Builder**: Column visibility + sorting for saved views
- **View Sharing**: Shareable saved view links via `viewId`
- **View Templates**: Workspace-local templates for reuse

**Routes**
- `/dashboard/pm/portfolio` - Portfolio dashboard
- `/dashboard/pm/dependencies` - Dependencies dashboard
- `/dashboard/pm/[slug]/tasks?viewId=...` - Shared view deep link

**Performance Notes**
- Timeline rows virtualize for large lists (threshold: 500+ tasks).
- Portfolio responses are cached in Redis for 60s (best-effort if Redis is unavailable).
- Dependencies endpoint supports pagination (`limit`, `offset`) to avoid truncation.

**Limitations**
- Critical path calculation uses dependency relations (`BLOCKS`, `BLOCKED_BY`, `DEPENDS_ON`, `DEPENDENCY_OF`).
- Dependencies list defaults to the first page (use pagination for large datasets).
