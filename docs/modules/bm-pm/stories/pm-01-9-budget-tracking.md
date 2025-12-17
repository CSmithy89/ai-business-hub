# Story PM-01.9: Budget Tracking

Status: done

## Story

As a project lead,
I want to track project budget,
so that I can monitor spending against plan.

## Acceptance Criteria

1. Given I enable budget in project settings  
   When I set a budget amount  
   Then the project header shows a budget widget with spent/remaining
2. And I can log expenses with amount, description, and date
3. And alerts trigger at 75%, 90%, and 100% thresholds

## Tasks / Subtasks

- [x] Add expenses storage model (AC: 2)
- [x] Add API endpoints to list + create expenses (AC: 2)
- [x] Extend project update API to support budget enable/disable + amount (AC: 1)
- [x] Implement budget section in project settings (AC: 1,2,3)
- [x] Show budget widget in project overview header (AC: 1)

## Dev Notes

- Project already includes `budget` and `actualSpend` fields. Expenses are stored in a new `ProjectExpense` table and increment `actualSpend` on create.
- Threshold alerts are implemented client-side (toast warnings/errors) when logging expenses or updating budget settings.

### References

- `docs/modules/bm-pm/epics/epic-pm-01-project-phase-management.md` (Story PM-01.9)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-01-9-budget-tracking.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added `ProjectExpense` model and a migration to create the `project_expenses` table (DB needs to be running to apply).  
✅ Added expense list/create endpoints and updated project PATCH to accept `budget` updates and initialize `actualSpend` when enabling budgets.  
✅ Implemented Settings budget section with expense logging + threshold alerts, and added a budget widget to the Overview header.

### File List

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/20251217193000_add_project_expenses/migration.sql`
- `packages/shared/src/types/pm.ts`
- `apps/api/src/pm/pm.module.ts`
- `apps/api/src/pm/projects/dto/update-project.dto.ts`
- `apps/api/src/pm/projects/projects.service.ts`
- `apps/api/src/pm/expenses/expenses.module.ts`
- `apps/api/src/pm/expenses/expenses.controller.ts`
- `apps/api/src/pm/expenses/expenses.service.ts`
- `apps/api/src/pm/expenses/dto/create-expense.dto.ts`
- `apps/web/src/hooks/use-pm-expenses.ts`
- `apps/web/src/hooks/use-pm-projects.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/settings/ProjectSettingsContent.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/ProjectOverviewContent.tsx`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-01-9-budget-tracking.md`
- `docs/modules/bm-pm/stories/pm-01-9-budget-tracking.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Budget tracking uses normalized expense storage and keeps the project’s `actualSpend` denormalized for fast reads.
- UI meets acceptance criteria with budget enablement, expense logging, and clear header visibility.

### Minor Suggestions (Non-blocking)

- When Postgres is available, apply the migration via `pnpm --filter @hyvve/db db:migrate` to ensure runtime parity.

