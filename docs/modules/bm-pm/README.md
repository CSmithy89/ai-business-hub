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
2. **Hierarchy:** `Workspace → Business → Product → Phase → Task`
3. Event bus payloads currently use `tenantId`; treat it as an alias (`tenantId == workspaceId`) until naming is standardized platform-wide.

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/modules/bm-pm/PRD.md` | Requirements, phases, scope boundaries, DoD |
| `docs/modules/bm-pm/architecture.md` | Target architecture + data model + integration notes |
| `docs/modules/bm-pm/kb-specification.md` | Detailed KB behavior + UX requirements |
| `docs/modules/bm-pm/ux/README.md` | UX pack (flows, screens, permissions, UI rules) |
| `docs/modules/bm-pm/research/` | Research inputs (Plane/Taskosaur/etc.; may reference “BM-PM”) |

## Phase Summary (Execution Intent)

1. **Phase 1 (MVP):** PM CRUD + KB CRUD + full-text search + HITL integration + Socket.io updates
2. **Phase 2:** Yjs/Hocuspocus collaboration + pgvector embeddings + verified content governance
3. **Phase 3:** workflow builder + public API + AI-native KB features (all gated by approvals)
