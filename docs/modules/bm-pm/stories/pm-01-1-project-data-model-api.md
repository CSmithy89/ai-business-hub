# Story PM-01.1: Project Data Model & API

Status: done

## Story

As a platform developer,
I want the Project and Phase data models with full CRUD API,
so that the foundation exists for all project management features.

## Acceptance Criteria

1. Given the Prisma schema with Project, Phase models  
   When I run database migrations  
   Then tables are created with all columns, indexes, and relations
2. And POST `/pm/projects` creates a project with:
   - Required: `name`, `workspaceId`, `businessId`
   - Optional: `description`, `type`, `color`, `icon`, `bmadTemplateId`
   - Auto-generated: `slug` (from name), `status=PLANNING`
3. And GET `/pm/projects` returns paginated list with filters (`status`, `type`, `businessId`)
4. And GET `/pm/projects/:id` returns full project with phases
5. And PATCH `/pm/projects/:id` updates allowed fields
6. And DELETE `/pm/projects/:id` soft-deletes (sets `deletedAt`)
7. And all endpoints enforce workspace isolation (TenantGuard + `workspaceId` filtering)

## Tasks / Subtasks

- [x] Define shared PM schemas (AC: 2,3)
  - [x] Add `CreateProject`/`UpdateProject` zod schemas in `@hyvve/shared`
- [x] Implement Projects API (AC: 2,3,4,5,6,7)
  - [x] Create `PmModule` + `ProjectsController` + `ProjectsService`
  - [x] Add DTOs for create/update/list with `class-validator`
  - [x] Implement slug generation (unique per workspace)
  - [x] Implement list pagination + filters + exclude soft-deleted
  - [x] Implement get-by-id includes phases (ordered)
  - [x] Implement update (allowed fields only)
  - [x] Implement soft delete (set `deletedAt`)
  - [x] Publish events: `pm.project.created|updated|deleted`
- [x] Add tests for Projects service (AC: 2,3,6,7)
  - [x] Unit test workspace scoping + soft delete behavior
  - [x] Unit test slug generation collision handling

## Dev Notes

- Nest endpoints are protected via `AuthGuard` + `TenantGuard` and always filter by `workspaceId` in Prisma queries.
- Database models already exist in `packages/db/prisma/schema.prisma` under `CORE-PM: PROJECT MANAGEMENT (bm-pm)`.
- Event publishing uses `apps/api/src/events/event-publisher.service.ts`.

### Project Structure Notes

- API code lives under `apps/api/src/`; add a new `pm/` module and wire it into `apps/api/src/app.module.ts`.
- Shared schemas/types live under `packages/shared/src/`.

### References

- `docs/modules/bm-pm/epics/epic-pm-01-project-phase-management.md` (Story PM-01.1)
- `docs/modules/bm-pm/tech-spec-epic-pm-01.md` (Project/Phase models + API shape)
- `packages/db/prisma/schema.prisma` (Project, Phase models)
- `apps/api/src/common/guards/auth.guard.ts` + `apps/api/src/common/guards/tenant.guard.ts` (workspace isolation)
- `apps/api/src/events/event-publisher.service.ts` (event emission)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-01-1-project-data-model-api.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Implemented `pm/projects` CRUD with workspace scoping + soft delete, plus event emission.  
✅ Added shared PM zod schemas/types and PM event constants in `@hyvve/shared`.  
✅ Added unit tests for `ProjectsService` and regenerated Prisma client so Project/Phase delegates are available.

### File List

- `apps/api/src/app.module.ts`
- `apps/api/src/pm/pm.module.ts`
- `apps/api/src/pm/projects/dto/create-project.dto.ts`
- `apps/api/src/pm/projects/dto/list-projects.query.dto.ts`
- `apps/api/src/pm/projects/dto/update-project.dto.ts`
- `apps/api/src/pm/projects/projects.controller.ts`
- `apps/api/src/pm/projects/projects.module.ts`
- `apps/api/src/pm/projects/projects.service.ts`
- `apps/api/src/pm/projects/projects.service.spec.ts`
- `packages/shared/src/index.ts`
- `packages/shared/src/types/events.ts`
- `packages/shared/src/types/pm.ts`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-01-1-project-data-model-api.md`
- `docs/modules/bm-pm/stories/pm-01-1-project-data-model-api.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- API shape matches the story: create/list/get/update/soft-delete, and `GET /pm/projects/:id` includes phases ordered by `phaseNumber`.
- Workspace scoping is enforced via `TenantGuard` + `workspaceId` filtering.
- Slug collision handling is deterministic and tested.

### Minor Suggestions (Non-blocking)

- Consider using `updateMany`/`findFirstOrThrow` style patterns to reduce TOCTOU windows between the workspace-scoped existence check and the subsequent `update`/`delete`.
- If Redis is optional in some environments, consider best-effort event publishing (log-and-continue) to avoid API hard failures when Redis is down.
