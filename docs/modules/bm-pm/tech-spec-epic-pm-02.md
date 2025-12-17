# Epic Technical Specification: Epic PM-02 - Task Management System

Date: 2025-12-17
Author: chris
Epic ID: pm-02
Status: Draft

---

## Overview

Epic PM-02 delivers the Core-PM task system: create, edit, assign, and track work items with hierarchy, relationships, workflow states, comments, labels, attachments, and an activity timeline.

This epic establishes the canonical API + data model (Prisma/Postgres) for tasks and wires the first UX surfaces needed to operate on tasks (detail panel, quick capture), while aligning with module conventions: multi-tenant workspace scoping, event emission (`pm.task.*`), and the BMAD ↔ Core-PM workflow mapping documented in the PRD.

## Objectives and Scope

**In scope (MVP):**
- Task CRUD with soft-delete and sequential `taskNumber` per project (e.g., `PROJECT-001`)
- Task classification (`TaskType`, `TaskPriority`) and filtering
- Task assignment to humans and/or agents (`AssignmentType`: `HUMAN | AGENT | HYBRID`)
- Task workflow states (`TaskStatus`) and status change logging; `completedAt` on `DONE`
- Task hierarchy (parent/children, max 3 levels) and roll-up calculations (progress indicators)
- Task relations (`TaskRelationType`: blocks/depends/relates/duplicates, etc.) + “blocked” warnings
- Task comments (threaded), labels, attachments, and full activity log display in a task detail panel
- Keyboard-driven quick capture flow for tasks

**Out of scope (explicitly deferred / later epics):**
- Advanced task views (Kanban/Calendar/Timeline) beyond what is required for PM-02 UX surfaces (see PM-03)
- Custom per-project workflow state definitions (Phase 2+ per PRD); MVP uses `TaskStatus`
- External integrations (GitHub/Jira/Asana) (see PM-07)
- Real-time sync/notifications/presence (see PM-06 / KB-02)

## System Architecture Alignment

This epic uses the existing Core-PM stack and conventions:
- **API layer (NestJS)**: add/extend PM module endpoints under `apps/api/src/pm/*` using `AuthGuard`, `TenantGuard`, and `RolesGuard` patterns already used by Projects/Phases.
- **DB layer (Prisma/Postgres)**: use existing schema models in `packages/db/prisma/schema.prisma` (`Task`, `TaskRelation`, `TaskActivity`, `TaskComment`, `TaskAttachment`, `TaskLabel` and enums). Tenant scoping is enforced by `workspaceId` plus the tenant extension/RLS approach already present in the platform.
- **Event bus**: publish task lifecycle events (`pm.task.created`, `pm.task.updated`, `pm.task.status_changed`) consistent with the epic notes and existing event infrastructure.

## Detailed Design

### Services and Modules

**Backend (NestJS):**
- `apps/api/src/pm/tasks/*` (new)
  - `TasksController`: REST endpoints for CRUD, filters, bulk updates, and sub-resources (relations/comments/attachments/labels/activity)
  - `TasksService`: authorization checks, `taskNumber` sequencing, soft-delete semantics, and event publishing
  - DTOs: `CreateTaskDto`, `UpdateTaskDto`, `ListTasksQueryDto`, `BulkUpdateTasksDto` (class-validator)
- Existing PM modules used/extended:
  - `apps/api/src/pm/projects/*` for project scoping and authorization checks (project lead)
  - `apps/api/src/pm/team/*` for valid assignee selection and membership checks

**Frontend (Next.js):**
- `apps/web`: task UX surfaces introduced in this epic
  - Task detail slide-over panel (open from any task link, URL includes `taskId`)
  - Quick task capture modal (keyboard shortcut)
  - Shared UI primitives from `packages/ui` (inputs, dropdowns, slide-over, etc.)

**Shared / DB:**
- `packages/db`: Prisma schema already defines task entities; migrations must ensure task tables exist in Postgres.

### Data Models and Contracts

Authoritative models live in `packages/db/prisma/schema.prisma` and map to Postgres tables:

**Task (`tasks`)**
- Identity/scoping: `id`, `workspaceId`, `projectId`, `phaseId`
- Sequencing: `taskNumber` unique per `projectId`
- Content: `title`, `description` (markdown/rich text)
- Classification: `type: TaskType`, `priority: TaskPriority`
- Assignment: `assignmentType: AssignmentType`, `assigneeId?`, `agentId?`
- Status: `status: TaskStatus`, optional `stateId` for future custom states
- Timeline: `dueDate?`, `startedAt?`, `completedAt?`
- Hierarchy: `parentId?` with `TaskHierarchy` relation
- Approval fields: `approvalRequired`, `approvalStatus`, `approvedBy?`, `approvedAt?`
- Timestamps: `createdAt`, `updatedAt`, `deletedAt?`, `createdBy`

**TaskRelation (`task_relations`)**
- `sourceTaskId`, `targetTaskId`, `relationType: TaskRelationType` (unique tuple)

**TaskActivity (`task_activities`)**
- `taskId`, `userId`, `type: TaskActivityType`, `data: Json?`, `createdAt`

**TaskComment (`task_comments`)**
- Threaded via `parentId?`, soft delete via `deletedAt?`

**TaskAttachment (`task_attachments`)**
- `fileName`, `fileUrl`, `fileType`, `fileSize`, `uploadedBy`, `uploadedAt`

**TaskLabel (`task_labels`)**
- Stored as simple per-task label rows (`taskId`, `name`, `color`), unique per (`taskId`, `name`)

### APIs and Interfaces

All endpoints are workspace-scoped via guards; service-level queries must filter by `workspaceId`.

**Core CRUD**
- `POST /pm/tasks` → create task (generates next `taskNumber` per project)
- `GET /pm/tasks` → list with filters: `phaseId`, `status`, `assigneeId`, `type`, `priority`, plus pagination
- `PATCH /pm/tasks/:id` → update mutable fields; writes `TaskActivity` entries
- `DELETE /pm/tasks/:id` → soft delete (`deletedAt`)

**Bulk operations**
- `PATCH /pm/tasks/bulk` → update status/assignee/phase for multiple task IDs

**Detail sub-resources (MVP)**
- `GET /pm/tasks/:id/activity` → activity timeline (chronological)
- `POST /pm/tasks/:id/comments` / `PATCH /pm/tasks/comments/:commentId` → add/edit comments (author-only edit)
- `POST /pm/tasks/:id/labels` / `DELETE /pm/tasks/:id/labels/:labelId` → add/remove labels
- `POST /pm/tasks/:id/relations` / `DELETE /pm/tasks/:id/relations/:relationId` → manage task relations
- `POST /pm/tasks/:id/attachments` / `GET /pm/tasks/:id/attachments` → attachment upload + listing (storage integration required)

**Events**
- Emit `pm.task.created`, `pm.task.updated`, `pm.task.status_changed` on relevant mutations (per epic notes).

### Workflows and Sequencing

**Create task (standard)**
1. Client calls `POST /pm/tasks` with `projectId`, `phaseId`, `title`, optional classification/assignment.
2. Service computes next `taskNumber` for the `projectId` (transactional to prevent duplicates).
3. Persist `Task`, create `TaskActivity(type=CREATED)`, publish `pm.task.created`.

**Quick capture**
1. User presses `c` on a project page → open quick capture modal.
2. `Enter` creates task and closes; `Shift+Enter` creates and opens detail panel (per epic AC).

**Status changes**
1. Client updates status via `PATCH /pm/tasks/:id { status }`.
2. Service validates transition (MVP: allow transitions between default `TaskStatus` values).
3. If status becomes `DONE`, set `completedAt`; create `TaskActivity(type=STATUS_CHANGED)`, publish `pm.task.status_changed`.

**Hierarchy**
1. From task panel, “Add Subtask” creates a new task with `parentId` set.
2. Server computes roll-ups for parent indicators (subtask counts, completion %); UI may display derived values.

**Relations**
1. User selects relation type and target task.
2. Create `TaskRelation`; if a task is “blocked” (has `BLOCKED_BY`/dependency relation), surface warning badge in UI.

## Non-Functional Requirements

### Performance

- List endpoints must be paginated and indexed to keep task list queries responsive (indexes already defined on `workspaceId`, `phaseId`, `projectId`, `status`, `assigneeId`, `dueDate`, `deletedAt`).
- Avoid N+1 queries for detail panel: load task + sub-resources efficiently (selects/includes).

### Security

- Enforce authenticated access and workspace isolation via guards (`AuthGuard`, `TenantGuard`, `RolesGuard`) and service-level `workspaceId` filters.
- Soft-deleted tasks (`deletedAt`) must be excluded from normal reads.
- Attachment upload/download must use signed URLs or a controlled proxy endpoint; validate max size and allowed content types.

### Reliability/Availability

- `taskNumber` assignment must be concurrency-safe per project (transaction or locking strategy) to guarantee uniqueness.
- Bulk updates should be atomic per request (all-or-nothing) where feasible; at minimum, return per-item failures.

### Observability

- Log task mutations with sufficient context (`workspaceId`, `projectId`, `taskId`, `actorId`), and record user-visible audit via `TaskActivity`.
- Emit task events (`pm.task.*`) for downstream consumers (notifications, analytics, agents) with correlation IDs where available.

## Dependencies and Integrations

- Prisma (`prisma` / `@prisma/client`) for DB access and migrations (`packages/db`)
- NestJS PM API module patterns (`apps/api/src/pm/*`)
- Event bus (Redis Streams) for publishing `pm.task.*` events
- File storage provider (S3-compatible) for task attachments (integration required for PM-02.10)

## Acceptance Criteria (Authoritative)

1. `POST /pm/tasks` creates a task and assigns a sequential `taskNumber` per project.
2. `GET /pm/tasks` supports filters: `phaseId`, `status`, `assigneeId`, `type`, `priority`.
3. `PATCH /pm/tasks/:id` updates fields and records activity.
4. `DELETE /pm/tasks/:id` performs soft delete.
5. Bulk update endpoint supports updating `status`, `assignee`, and `phase` for multiple tasks.
6. Task detail panel shows and edits: title, description, status, priority, assignee, due date, story points; shows activity timeline; deep-links via URL with `taskId`.
7. Quick capture opens via `c`, supports Enter create, Shift+Enter create+open, Escape cancel, and minimal fields.
8. Task type options: Epic, Story, Task, Subtask, Bug, Research, Content, Agent Review; each has distinct icon/color; filters support type and priority.
9. Task hierarchy supports parent/child, “Add Subtask”, max 3 levels; parent shows progress indicators.
10. Task relations support Blocks/Blocked By/Relates To/Duplicates; relations display in panel; blocked tasks show warnings.
11. Task assignment supports team members, agents, and hybrid assignment.
12. Task status options: Backlog, Todo, In Progress, Review, Awaiting Approval, Done, Cancelled; Done sets `completedAt`; activity logged; kanban columns map to state groups.
13. Task labels support create/select, multiple labels per task, and filtering by label.
14. Task attachments support drag/drop upload with progress; show list metadata; download/preview; enforce limits.
15. Task activity log shows chronological events with actor and timestamps; comments editable by author and addable from UI.

## Traceability Mapping

| Acceptance Criteria | Spec Section(s) | Component(s) / API(s) | Test Idea |
|---|---|---|---|
| AC1–AC5 | APIs and Interfaces; Workflows | `POST/GET/PATCH/DELETE /pm/tasks`, `PATCH /pm/tasks/bulk` | API tests validate CRUD, filters, bulk updates, and soft delete |
| AC6 | Workflows; Frontend modules | Task detail panel + `GET /pm/tasks/:id/*` | UI test: open panel, edit fields, URL deep-link; API contract tests |
| AC7 | Workflows | Quick capture modal + `POST /pm/tasks` | UI test for keyboard shortcuts and create+open behavior |
| AC8 | Data models; UI | `TaskType`, `TaskPriority` | API test ensures enums accepted; UI snapshot for type/priority display |
| AC9 | Data models; Workflows | `Task.parentId`, hierarchy relation | API test creates parent/child; UI shows roll-ups |
| AC10 | Data models; Workflows | `TaskRelation`, `TaskRelationType` | API test create relation; UI shows blocked warning |
| AC11 | Data models; Security | `assignmentType`, `assigneeId`, `agentId` | API test assigns human/agent/hybrid; validate membership/agent existence |
| AC12 | Data models; Workflows | `TaskStatus`, `completedAt` | API test status transitions; `DONE` sets timestamp; activity logged |
| AC13 | Data models; UI | `TaskLabel` | API test add/remove labels; UI filter behavior |
| AC14 | Dependencies; Security | `TaskAttachment` + storage | Integration test upload constraints + retrieval; manual verification in dev |
| AC15 | Data models; Observability | `TaskActivity`, `TaskComment` | API test activity entries; comment CRUD and author edit policy |

## Risks, Assumptions, Open Questions

- **Risk:** `taskNumber` sequencing can race under concurrent creates. **Mitigation:** transactional increment strategy and DB uniqueness on (`projectId`, `taskNumber`).
- **Risk:** Attachment storage requires infra + quotas (PM-02.10). **Mitigation:** implement signed URL pattern and enforce limits; document local-dev approach.
- **Assumption:** MVP uses `TaskStatus` as the primary workflow, with BMAD state stored in metadata (per PRD workflow mapping).
- **Question:** Should tasks always belong to a `Phase` in MVP, or can they be unphased/backlog-at-project level?
- **Question:** Relationship types in epic AC differ from PRD’s expanded list (start/finish constraints). MVP implements epic list first; PRD additions deferred.

## Test Strategy Summary

- **API unit/integration tests (Jest)** for `TasksService` and controllers: CRUD, filters, bulk updates, soft delete, sequencing, and activity logging.
- **Frontend tests (Vitest)** for UI components where present (detail panel, quick capture); focus on deterministic state and keyboard interactions.
- **E2E (Playwright)** smoke flows: quick capture, open/edit task, assignment and status transitions.
- Ensure coverage for all Acceptance Criteria rows in the traceability table.
