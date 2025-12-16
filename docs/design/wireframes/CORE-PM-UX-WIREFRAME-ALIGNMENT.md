# Core-PM UX ↔ Wireframe Alignment Audit

**Audit Date:** 2025-12-17  
**Scope:** Validate Core-PM wireframes + Stitch prompt batches against the Core-PM UX pack under `docs/modules/bm-pm/ux/` (Phase 1 build-ready, Phase 2+ gated).

---

## Inputs Reviewed

1. **Core-PM UX Pack**
   1. `docs/modules/bm-pm/ux/README.md`
   2. `docs/modules/bm-pm/ux/screens-and-contracts.md`
   3. `docs/modules/bm-pm/ux/information-architecture.md`
   4. `docs/modules/bm-pm/ux/flows.md`
   5. `docs/modules/bm-pm/ux/permissions-matrix.md`
   6. `docs/modules/bm-pm/ux/ui-rules.md`
2. **Wireframe inventory + prior audits**
   1. `docs/design/wireframes/WIREFRAME-INDEX.md` (PM section)
   2. `docs/design/wireframes/CORE-PM-WIREFRAME-AUDIT.md`
   3. `docs/design/wireframes/WIREFRAME-GAP-ANALYSIS.md`
3. **Stitch prompt batches**
   1. Existing PM: `docs/design/wireframes/prompts/BATCH-08-PM-MODULE-PART1.md`, `docs/design/wireframes/prompts/BATCH-09-PM-MODULE-PART2.md`
   2. Core-PM/KB additions: `docs/design/wireframes/prompts/BATCH-12` through `BATCH-19`
4. **Rendered wireframes (HTML exports)**
   1. `docs/design/wireframes/Finished wireframes and html files/pm-01_projects_list_view/`
   2. …
   3. `docs/design/wireframes/Finished wireframes and html files/pm-20_help_&_support_center/`

---

## Executive Summary (Critical Findings)

1. **Terminology standardized:** ✅ **RESOLVED** - The primary PM entity is now **"Project"** (not "Product"). The Core-PM UX pack and PRD have been updated to use: **Business → Project → Phase → Task** with `/dashboard/pm/projects/*` routes.
2. **Phase 1 surface coverage is incomplete:** the UX pack requires dedicated experiences for:
   1. `/dashboard/pm` (PM Home)
   2. `/dashboard/pm/businesses` + detail
   3. `/dashboard/pm/kb` + KB page
   4. `/dashboard/pm/approvals` (Core-PM entrypoint; can link to platform approvals)
   5. `/dashboard/pm/admin`
   Rendered PM wireframes cover tasks/boards, but **do not yet cover KB**, and do not clearly cover the new Business/Project/Phase hierarchy.
3. **Approval overlay is missing from task interactions:** rendered Task Detail and boards do not show “blocked by approval”, “request approval”, or approval decision states, which are mandatory in the UX pack.
4. **BMAD sub-state display is missing:** UX rules require showing primary status plus `task.metadata.bmadState` where relevant; current wireframes show generic columns (“To Do / In Progress / In Review / Done”) without BMAD cues.
5. **`WIREFRAME-INDEX.md` PM mappings appear inconsistent:** several PM rows associate names/IDs with asset links that point to different rendered wireframes. This creates avoidable confusion during Stitch generation and review.

---

## Traceability: UX Screens → Wireframes

Phase 1 UX screen inventory is defined in `docs/modules/bm-pm/ux/screens-and-contracts.md`.

| UX Screen | Route | Current wireframe match | Status vs UX | Required action |
|----------|-------|--------------------------|--------------|-----------------|
| PM Home | `/dashboard/pm` | PM-01 (Projects List View) | 🟡 Partial | Update PM-01 to act as PM Home: add Business/Project context, Phase selector, create actions, approvals widget |
| Businesses | `/dashboard/pm/businesses` | (None in PM set) | 🔴 Missing | Decide: reuse Business Onboarding wireframes or create a minimal Business list/detail pair for Core-PM |
| Business Detail | `/dashboard/pm/businesses/:businessId` | (None in PM set) | 🔴 Missing | Same as above |
| Projects | `/dashboard/pm/projects` | PM-01 (Projects List View) | ✅ Aligned | Ensure fields show Business ownership, Phase status |
| Project Hub | `/dashboard/pm/projects/:projectId` | PM-02 (Project Detail Overview) | 🟡 Partial | Add Phase list + current Phase; add KB panel/link; show BMAD phase indicator if used |
| Phases List | `/dashboard/pm/projects/:projectId/phases` | (None explicit) | 🟡 Partial | Either add a dedicated Phases list wireframe, or ensure PM-02 contains a full Phase list surface with create/edit |
| Phase Board | `/dashboard/pm/projects/:projectId/phases/:phaseId/board` | PM-03 (Task Board / Kanban) | 🟡 Partial | Add Phase context (project + phase); add blocked-by-approval markers; support BMAD sub-state chips; ensure transition rules are visible |
| Project Task List | `/dashboard/pm/projects/:projectId/tasks` | PM-04 (Task List View) | 🟡 Partial | Add project context; bulk actions; filters include `metadata.bmadState`; blocked-by-approval state |
| Task Detail | `/dashboard/pm/projects/:projectId/tasks/:taskId` | PM-05 (Task Detail Modal) | 🔴 Missing UX requirements | Add approvals overlay ("request approval", "blocked until decision"); add "Related KB Pages"; add audit/activity clarity |
| KB Home | `/dashboard/pm/kb` | KB-01/KB-03 prompts (BATCH-12) | 🟡 Planned, not rendered | Generate KB-01..KB-06 wireframes; ensure route + naming aligns with "Project" terminology |
| KB Page | `/dashboard/pm/kb/pages/:pageId` | KB-02/KB-03 prompts (BATCH-12) | 🟡 Planned, not rendered | Generate KB editor/viewer wireframes; include linking to tasks/projects and verification states |
| Approvals | `/dashboard/pm/approvals` | Approval Queue set (existing category) | 🟡 Partial | Add entrypoint in Core-PM nav; add per-task “blocked” linking to approvals |
| Admin | `/dashboard/pm/admin` | Settings/Admin set (existing category) | 🟡 Partial | Ensure Core-PM Admin includes roles/policies + audit surfaces aligned to Core-PM permission intent |

---

## High-Risk UX Gaps (Must Fix Before UI Build)

1. **Entity naming + hierarchy consistency** ✅ **RESOLVED**
   1. The decision is made: **"Project"** is the primary entity name for PM software.
   2. All docs (UX pack, PRD, architecture, KB spec) now use: **Business → Project → Phase → Task**.
   3. IDs use `projectId`, `phaseId`, `taskId`. Routes use `/dashboard/pm/projects/*`.
2. **Approval overlay in PM surfaces**
   1. Task Detail and boards must show approval states and resolution actions (Founder/Admin vs PM).
   2. Without this, the UI will drift from platform governance (and will need redesign after approvals integration).
3. **Status model + BMAD sub-state**
   1. Kanban columns must align to Core-PM `TaskStatus` semantics.
   2. BMAD states must be visible (chip/tag) without creating new core statuses.
4. **Edge states required by UX pack**
   1. Empty workspace (no business/project) → guided setup.
   2. No-permission → disabled actions + explanation.
   3. Blocked-by-approval → link to approval item + next action.
   4. Concurrency indicator → “last updated” and minimal conflict handling path.

---

## Prompt-Batch Alignment Issues (What to fix in Stitch prompts)

This is the fastest way to keep newly generated wireframes aligned with the UX pack.

1. **Terminology is standardized to "Project"** ✅ **RESOLVED**
   1. All UX pack files, PRD, architecture docs now use "Project"
   2. Wireframe prompts should already use "Project" (verify BATCH-17 for Phase 2 features)
   3. Remaining prompts to verify: BATCH-08, BATCH-09, BATCH-13, BATCH-14, BATCH-16
2. **Update doc references inside prompt batches**
   1. Some prompt batches reference `docs/modules/bm-pm/prd.md` (lowercase) while the file is `docs/modules/bm-pm/PRD.md`.
3. **Route + IA cues**
   1. Prompts should explicitly anchor to `/dashboard/pm` and show breadcrumb structure aligned to Business/Project/Phase/Task.
4. **Approvals + blocked states**
   1. Add explicit instruction blocks: show “blocked by approval” banner, and “request approval” CTA when policy requires it.
5. **BMAD state chips**
   1. Add instruction blocks to display `bmadState` chip in list/kanban and in task detail.

---

## `WIREFRAME-INDEX.md` Consistency Check (Action Required)

1. The PM table entries in `docs/design/wireframes/WIREFRAME-INDEX.md` contain naming/asset associations that do not match the rendered HTML export titles (e.g., PM-01 export title is “Projects List View” while the index row label is “Products overview”).
2. Recommendation:
   1. Treat the rendered exports under `Finished wireframes and html files/pm-*` as the source of truth for current PM wireframes.
   2. Update the PM section of `WIREFRAME-INDEX.md` so IDs, names, and asset links match the exports, then layer Core-PM/KB wireframes (BATCH-12..19) as “planned/unrendered”.

---

## Next Actions (Ordered)

1. ✅ **DONE** - Terminology decision: **"Project"** is the standard. UX pack, PRD, architecture all updated.
2. Update the **existing** PM wireframes PM-01/02/03/04/05 to meet Phase 1 UX requirements (context, approvals overlay, BMAD chips).
3. Generate KB wireframes KB-01..KB-06 from `BATCH-12-CORE-PM-KB-PART1.md`, then KB-07..KB-12 from `BATCH-13-CORE-PM-KB-PART2.md` (using "Project" terminology).
4. Fix the PM section in `WIREFRAME-INDEX.md` to eliminate ID/name/asset mismatches.
5. Verify BATCH-17 uses "Project" terminology for Phase 2 features.

