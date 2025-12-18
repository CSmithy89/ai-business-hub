# Epic PM-02 Retrospective: Task Management System

**Epic:** PM-02 (Task Management System)  
**PR:** https://github.com/CSmithy89/ai-business-hub/pull/22  
**Date:** 2025-12-18  
**Facilitator:** Bob (Scrum Master)

## Participants

- chris (Project Lead)
- Alice (Product Owner)
- Charlie (Senior Dev)
- Dana (QA)
- Winston (Architect)

---

# Part 1 — Epic Review

## 1) Goal vs Outcome

**Epic goal:** Users can create, assign, and track work items with hierarchy, relationships, and state management.

**Outcome:** PM-02 delivered an end-to-end task system with the first usable UX surface:
- Task CRUD API + workspace scoping + soft delete + list filters + bulk updates
- Task detail sheet (URL-driven deep link via `taskId`) with activity timeline
- Quick capture (`c`) for fast task creation
- Task classification (type/priority), hierarchy (parent/child), assignment (human/agent/hybrid)
- Relations + blocked indicators, comments (author edit/delete), attachments (upload + metadata), labels (create/upsert + filtering)

## 2) Shipped Scope (What’s In)

**Stories shipped (11/11):**
- PM-02.1 Task data model & API
- PM-02.2 Task detail panel (sheet)
- PM-02.3 Quick task capture
- PM-02.4 Task type & priority
- PM-02.5 Task hierarchy
- PM-02.6 Task assignment
- PM-02.7 Task state workflow
- PM-02.8 Task relations
- PM-02.9 Task comments
- PM-02.10 Task attachments
- PM-02.11 Task labels

## 3) Evidence (Stories, Reviews, PR, Commits)

**Story records:** `docs/modules/bm-pm/stories/pm-02-*.md`  
All stories are marked `Status: done` and each includes a **Senior Developer Review (AI): APPROVE**.

**Epic tech spec:** `docs/modules/bm-pm/tech-spec-epic-pm-02.md`

**PR review signal:** PR #22 included cross-story integration feedback that wasn’t visible at single-story scope:
- Nest module DI scope must import provider-exporting modules (e.g., `CommonModule`, `EventsModule`)
- Route ordering: `PATCH /pm/tasks/bulk` must be declared before `PATCH /pm/tasks/:id`
- DTO validation gaps can yield 500s (Prisma/runtime) instead of clean 400s (validation)
- DTO transform edge cases (`@Type(() => Number|Date)`) can silently coerce `null`/`''` into `0`/epoch
- Web stability: list `queryKey` determinism and safe enable conditions; guard async double-submits on quick-capture

## 4) What Went Well (Wins)

Alice (Product Owner): “The task surface is real now: quick capture → open detail → edit/assign → collaborate with comments/labels/attachments.”

Charlie (Senior Dev): “We shipped vertical slices consistently (API + UI + tests) and the base primitives are strong for PM-03.”

Dana (QA): “The service-level unit tests in `apps/api` gave confidence for the critical logic (sequencing, relations, comments, labels, bulk).”

## 5) What Didn’t Go Well (Pain Points)

- Some “system-level” issues were only caught at PR review time (DI scope and route ordering), suggesting we need a lightweight integration sanity checklist for new modules/controllers.
- DTO transform edge cases are easy to miss and can silently corrupt intent (e.g., `null` → epoch/0).
- BMAD workflow tooling assumes global sprint paths; bm-pm tracking is module-local (`docs/modules/bm-pm/...`), which causes friction in automation.

## 6) Surprises / Discoveries

- The automated PR review caught real cross-cutting defects early enough to fix before merge (good signal that review automation is adding value when focused on integration correctness).
- PM-03 will stress the system in predictable ways (list ergonomics, filters, optimistic updates, drag/drop), so hardening is highest-leverage before deeper UI work.

## 7) Decisions & Tradeoffs

- Attachment upload is MVP’d via a Next.js route + storage adapter, then metadata persisted through Nest tasks API (fast iteration, but requires clear validation boundaries).
- Labels are per-task (simple MVP) with case-insensitive upsert behavior (pragmatic now; revisit global label taxonomy later if needed).
- Relations create inverse relations for the supported set (keeps UX consistent; requires care around duplication/uniqueness and activity logging).

## 8) Quality & Validation

- Baseline gates: `pnpm type-check`, `pnpm lint`, `pnpm test` (local + CI).
- CI note: CI failures during the epic were intermittently due to GitHub billing/spend limits (non-code), but we still treat CI as the acceptance gate.

## 9) Follow-up Work (PM-02 Hardening Pass)

**Goal:** reduce PM-03 risk by tightening correctness, determinism, and ergonomics without expanding scope.

**Completed in hardening**
- [x] DTO validation + safe transforms for optional numeric/date inputs (avoid `null`/`''` coercion to `0`/epoch; reject missing required fields with 400s).
- [x] Task list query support for `parentId` across fetch + caching semantics.

**Still to do**
- [ ] Replace unsafe `zodResolver(... as unknown as ...)` casts once resolver typings align with Zod v4 (dependency/typing follow-up).
- [ ] Add regression tests for DTO transform edge cases (`null`, `''`, invalid date strings) and list filtering by `parentId`.
- [ ] Confirm event payload consistency (`PM_TASK_UPDATED` vs `PM_TASK_STATUS_CHANGED` for bulk) and document payload shapes for consumers.

---

# Part 2 — Next Epic Preparation (PM-03)

## 10) Next Epic Candidate

PM-03: Views & Navigation (`docs/modules/bm-pm/epics/epic-pm-03-views-navigation.md`)

## 11) Readiness Checklist (Before Starting PM-03)

- Confirm list semantics are stable for list/kanban/calendar views (filters, ordering, pagination).
- Confirm bulk update route is reachable and safe for kanban drag/drop and multi-select operations.
- Confirm task detail sheet open/close via URL param is stable under navigation and refetching.
- Keep hardening pass items above green before pulling PM-03 scope into dev.

## 12) Closing Notes

Bob (Scrum Master): “PM-02 delivered real capability. The next best step is to harden the primitives so PM-03 can move fast without rework.”

