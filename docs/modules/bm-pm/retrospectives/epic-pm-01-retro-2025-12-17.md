# Epic PM-01 Retrospective: Project & Phase Management

**Epic:** PM-01 (Project & Phase Management)  
**PR:** https://github.com/CSmithy89/ai-business-hub/pull/19  
**Date:** 2025-12-17  
**Facilitator:** Bob (Scrum Master)

## Participants

- chris (Project Lead)
- Alice (Product Owner)
- Charlie (Senior Dev)
- Dana (QA)

---

# Part 1 — Epic Review

## 1) Goal vs Outcome

**Epic goal (from spec):** Users can create, configure, and manage projects with BMAD phases, enabling organized work tracking from day one.

**Outcome:** Delivered end-to-end bm-pm foundations:
- Project CRUD API + events + shared schemas
- Phase CRUD + state machine + CURRENT uniqueness
- PM dashboard routes: projects list, create wizard, project overview, settings, team tab
- BMAD phase template seeding on project creation
- Budget tracking + manual expenses + header widget

## 2) Shipped Scope (What’s In)

**Stories shipped (9/9):**
- PM-01.1 Projects + schema/events
- PM-01.2 Phases + transitions
- PM-01.3 `/dashboard/pm` list + filters
- PM-01.4 create project wizard (Basics → Template → Team)
- PM-01.5 overview page + tab routes
- PM-01.6 settings page (autosave + phases + danger zone)
- PM-01.7 BMAD templates seeding
- PM-01.8 team management (add/edit/remove + reassignment)
- PM-01.9 budget + expenses + threshold alerts

## 3) Quality & Validation

- Epic test report: `docs/modules/bm-pm/epics/epic-pm-01-test-report.md`
- `pnpm turbo test`: PASS
- `pnpm turbo type-check`: PASS
- `pnpm turbo lint`: PASS (warnings only)

## 4) What Went Well (Wins)

Charlie (Senior Dev): “We kept scope crisp per story and still delivered full vertical slices (API + UI + docs).”

Dana (QA): “Strong safety net: unit tests for critical PM services, plus an epic-level validation pass.”

Alice (Product Owner): “The PM UI is coherent: list → create → overview → settings/team feels like a real product surface.”

## 5) What Didn’t Go Well (Pain Points)

Charlie (Senior Dev): “Some workflows assume global sprint paths (`docs/sprint-artifacts`) but bm-pm uses module-local tracking.”

Dana (QA): “DB-dependent work (expenses migration) can’t be fully validated locally if Postgres isn’t running; we need a repeatable ‘apply migrations’ routine in dev/CI.”

## 6) Surprises / Discoveries

- Tooling: `pnpm turbo test` initially failed because `@hyvve/shared` was picking up compiled `dist/*` test files; fixed via `packages/shared/vitest.config.ts`.
- Workflow alignment: retrospective workflow config expects `docs/sprint-artifacts/sprint-status.yaml`, but bm-pm uses `docs/modules/bm-pm/sprint-status.yaml`.
- DB ops: migration for `project_expenses` exists but requires Postgres running to apply in dev environments.

## 7) Decisions & Tradeoffs

- Access model: workspace `member` role can mutate PM resources only if they are the project lead; owners/admins retain access.
- Budget alerts: implemented client-side for MVP (toast thresholds at 75/90/100) to avoid blocking on a notification pipeline for PM.

## 8) Action Items (Improvements)

**Owner: chris**
- Normalize BMAD workflow paths so module sprint status files are discoverable (or add a shim `docs/sprint-artifacts/` index that points to module sprint status).
- Add a “dev DB ready” runbook step to ensure migrations are applied when Postgres is available (specifically `20251217193000_add_project_expenses`).

**Owner: Charlie**
- Address `react-hooks/exhaustive-deps` warning in `ProjectTeamContent.tsx` (avoid recreating memo dependencies).

**Owner: Dana**
- Add a lightweight checklist for epic validation reporting (tests/typecheck/lint/security scan availability).

---

# Part 2 — Next Epic Preparation (PM-02)

## 9) Next Epic Candidate

Alice (Product Owner): “PM-02 (Task Management System) is the next logical epic: tasks depend on projects/phases and we now have those.”

## 10) Readiness Checklist (Before Starting PM-02)

- Confirm DB migration applied in environments where budget/expenses are used.
- Confirm PM-01 routes are visible and navigable in the dashboard (`/dashboard/pm/...`).
- Confirm PM team membership flows are understood (lead vs member permissions) so task assignment rules align.

## 11) Risks to Watch

- Role complexity: task assignment/visibility must respect workspace and project-team membership in a predictable way.
- Data consistency: ensure denormalized counters (`totalTasks`, `completedTasks`, `actualSpend`) stay correct as PM-02 adds task mutations.

## 12) Notes for Future Retros

- Keep “workflow path mismatches” as explicit tech debt items so future automation doesn’t drift from repo conventions.
- Prefer a single, consistent sprint-status location or a clear index for multi-module tracking.

