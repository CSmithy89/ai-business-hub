# Epic Technical Specification: Advanced Views

Date: 2025-12-22
Author: chris
Epic ID: pm-09
Status: Draft

---

## Overview

PM-09 delivers Phase 2 advanced views for Core-PM: a timeline/Gantt view with dependency visualization and critical-path cues, an executive portfolio dashboard for cross-project health, a resource utilization view for capacity balancing, and saved view template/sharing capabilities. These additions extend the existing list and kanban experiences to support schedule, dependency, and capacity decisions using the same Core-PM task and team data.

This epic aligns to FR-4.4 and FR-4.6 in the Core-PM PRD and is grounded in the documented wireframes (PM-06, PM-13, PM-26, PM-27) and IA routes. It remains workspace-scoped, reuses Core-PM platform services, and avoids redefining tenancy or workflows.

## Objectives and Scope

In scope:
- Timeline/Gantt view at `/dashboard/pm/projects/:id/tasks/timeline` with zoom (day/week/month), drag-to-reschedule, duration resize, dependency arrows, and critical path highlighting.
- Executive portfolio dashboard at `/dashboard/pm/portfolio` showing cross-project health scores, aggregate metrics, risk overview, filters, and drill-down to project detail.
- Resource utilization view at `/dashboard/pm/resources` with capacity bars, over/under allocation indicators, assignment breakdown, and task drag between assignees.
- Saved view templates (workspace-scoped) with admin-only edit and default application to new projects.
- View sharing with private/team/public options and shareable URLs; shared views update for viewers.
- Dashboard customization with widget add/remove, drag/reorder, resize, and per-user-per-project persistence.

Out of scope:
- Workflow builder and custom workflow states (PM-10).
- External API/webhooks and third-party integrations beyond existing Phase 2 work (PM-11, GitHub/Jira).
- KB RAG, Yjs collaboration, or verified content workflows.
- New pm.* event types until added to shared schemas; continue using existing platform events and Socket.io patterns.

## System Architecture Alignment

Advanced Views align with the Core-PM architecture by keeping UI surfaces in `apps/web` under `/dashboard/pm` routes and routing data through NestJS Core-PM services and REST endpoints (including `/api/pm/views`) as defined in `docs/modules/bm-pm/architecture.md`. Data persists in PostgreSQL via Prisma with workspace-scoped filtering and RLS enforcement (`workspaceId` as the canonical tenant).

Portfolio and resource views use aggregate queries over Projects, Phases, Tasks, TeamMember capacity, and SavedView configurations; caching is applied where indicated in the PRD/architecture for performance. Real-time updates follow existing Socket.io patterns and platform event types (approval.* and agent.*) until pm.* events are formalized in `packages/shared`.

## Detailed Design

### Services and Modules

- Web (Core-PM UI)
  - Timeline/Gantt view (`/dashboard/pm/projects/:id/tasks/timeline`): renders task bars, dependency arrows, zoom controls, drag/resize interactions.
  - Portfolio dashboard (`/dashboard/pm/portfolio`): cross-project summaries with filters and drill-down links.
  - Resource utilization (`/dashboard/pm/resources`): capacity bars, allocation warnings, drag-to-reassign.
  - Saved views manager (PM-26 wireframe): create/edit saved views and templates.
  - Dashboard customization: widget layout management per user/project.
- API (NestJS Core-PM services)
  - Projects/Phases/Tasks services for task scheduling and state updates.
  - Teams/TeamMember service for capacity and assignment data.
  - Saved Views service backing `/api/pm/views` (list/create/update/delete).
  - Real-time updates via Socket.io gateway (existing platform pattern).
- Data layer (Prisma + Postgres with RLS)
  - Workspace-scoped access enforced by `workspaceId` and RLS policies.
  - Aggregation/caching for portfolio-level metrics as noted in epic technical notes.

### Data Models and Contracts

- Project: `id`, `workspaceId`, `businessId`, `name`, `status`; relationships: Project has many Phases and TeamMembers. Portfolio health metrics are computed from project task/phase aggregates (not stored as core fields).
- Phase: `id`, `projectId`, `name`, `status`, `bmadPhase` (per architecture ERD); relationship: Phase belongs to Project and has many Tasks.
- Task: `id`, `phaseId`, `title`, `description`, `type`, `status`, `priority`, `startDate`, `dueDate`, `parentId`, `assignment` (human/agent/hybrid), `estimate`/`storyPoints`, `metadata.bmadState` (per PRD task contract); relationship: Task belongs to Phase and can have dependencies via TaskRelation.
- TaskRelation: `fromTaskId`, `toTaskId`, `dependencyType` (FS/SS/FF/SF per PRD P1 dependency editor); relationship: Task↔Task dependency graph used for arrows/critical path.
- TeamMember: `userId`, `projectId`, `role`, `capacityHoursPerWeek` (capacity planning in PRD); relationships: TeamMember belongs to Project and is referenced by Task assignment.
- SavedView: `id`, `workspaceId`, optional `projectId`, `name`, `ownerId`, `visibility` (private/team/public), `isTemplate`, `shareToken` (public only), `config` (filters/sort/columns/view type), `updatedAt`.
- DashboardLayout: `userId`, `projectId`, `layoutConfig` (widget order/sizes/visibility), `updatedAt` for per-user/per-project persistence.

### APIs and Interfaces

- Tasks (timeline/data source)
  - List tasks: existing `/api/pm/*/tasks` list endpoint with filters (projectId, phaseId, status, assignee, date range). Response returns Task fields needed for timeline rendering plus related TaskRelation records for dependencies.
  - Update schedule: `/api/pm/tasks/:id` update endpoint accepts schedule fields (`startDate`, `dueDate`) and returns updated Task.
  - Update assignment: `/api/pm/tasks/:id/assign` (or standard update endpoint) accepts assignment payload and returns updated Task.
- Views
  - `GET /api/pm/views` → returns SavedView list with `id`, `name`, `visibility`, `isTemplate`, `config`, `updatedAt`.
  - `POST /api/pm/views` → request: `name`, `config`, `visibility`, optional `projectId`, `isTemplate`; response: SavedView.
  - `GET /api/pm/views/:id` → response: SavedView.
  - `PUT /api/pm/views/:id` → request: editable SavedView fields; response: SavedView.
  - `DELETE /api/pm/views/:id` → deletes saved view.
- Projects/Teams (portfolio + resource)
  - Project list/details endpoints under `/api/pm/products/*` (architecture doc naming) supply portfolio aggregates; team membership endpoints supply TeamMember capacity and assignment context.
  - Align route naming with UI `/projects` routes during implementation (doc notes use “products” vs “projects”).
- Sharing
  - Public share endpoint (route TBD) accepts `shareToken` and returns SavedView `config` plus read-only metadata; access is allowed only for `visibility=public`.

### Workflows and Sequencing

- Timeline view
  1. User selects Timeline → UI loads tasks + dependencies for the project.
  2. Render Gantt bars and dependency arrows; highlight critical path per acceptance criteria.
  3. Drag/resize updates task start/end dates via task update endpoint.
  4. Broadcast updates over existing Socket.io channels so other viewers refresh.
- Portfolio dashboard
  1. User opens `/dashboard/pm/portfolio` → API aggregates project health, metrics, and risk overview.
  2. User applies filters (status/team/date) → re-query with filter params.
  3. Drill-down navigates to project detail route.
- Resource utilization
  1. Load team members + assigned task estimates/capacity.
  2. Compute over/under allocation indicators.
  3. Drag task between assignees → update task assignment, refresh utilization.
- Saved views/templates/sharing
  1. User saves a view configuration → store SavedView.
  2. Admin marks as template → set `isTemplate=true` for workspace.
  3. User shares view → set visibility + generate share token; viewers see live updates.
- Dashboard customization
  1. User enters customize mode, reorders/resizes widgets.
  2. Persist layout per user/project for future sessions.

## Non-Functional Requirements

### Performance

- Web performance targets from platform PRD: LCP < 2.5s, TTI < 3.5s.
- API performance targets from platform PRD: p95 < 500ms, p99 < 2000ms.
- Core-PM performance targets from architecture: task list load < 500ms P95, kanban render < 800ms P95, DB query time < 100ms P95, WebSocket message latency < 100ms P95.
- Advanced views (timeline/portfolio/resource) should meet or improve existing Core-PM render/query baselines; no separate targets defined in source docs.

### Security

- Enforce workspace isolation via RLS and `workspaceId` scoping (canonical tenancy per PRD/architecture).
- Encrypt all traffic in transit with TLS 1.3 and all API keys at rest with AES-256-GCM.
- JWT token signing/verification per BetterAuth (HS256) and rate limiting on public endpoints.
- CSRF protection on state-changing endpoints, XSS mitigation with CSP headers, SQL injection prevention via parameterized queries.
- Audit logging for security-sensitive operations; maintain OWASP Top 10 compliance.
- Support encryption master key rotation (runbook/tooling referenced in platform PRD).

### Reliability/Availability

- Platform uptime target > 99.5% (PRD success metric) applies to Core-PM views and APIs.
- Event delivery remains at-least-once via Redis Streams (platform architecture); timeline/portfolio views consume standard REST data and do not require new delivery guarantees.

### Observability

- Instrument Core-PM endpoints and portfolio/resource aggregates with OpenTelemetry tracing (platform architecture).
- Capture request latency and error rates for `/api/pm/*` endpoints; monitor DB query time against <100ms P95 target.
- Track WebSocket latency and message throughput for real-time updates (target <100ms P95).
- Emit metrics for cache hit rates on portfolio aggregates and view loads; log view-share access (private/team/public) for audit.

## Dependencies and Integrations

- Monorepo tooling: `pnpm-workspace.yaml` with `apps/*` and `packages/*`.
- Web dependencies (apps/web):
  - Next.js 15, React 19, Tailwind CSS 4, shadcn/ui base.
  - `@tanstack/react-table` + `@tanstack/react-virtual` for large lists/virtualization.
  - `@dnd-kit/*` for drag-and-drop interactions (assignment moves, widget layout).
  - `recharts` available for portfolio metrics visualization.
  - `socket.io-client` for real-time updates.
- API dependencies (apps/api):
  - NestJS 10, Prisma 6, Socket.io, BullMQ/Redis, PostgreSQL client.
  - `@hocuspocus/server` and `yjs` present for KB collaboration (not required for PM-09).
- Agents runtime: `agents/requirements.txt` (AgentOS/Agno runtime).
- Library gaps per epic technical notes:
  - Timeline/Gantt library (e.g., gantt-task-react or custom) is not currently in package manifests.
  - Dashboard customization library (e.g., react-grid-layout) is not currently in package manifests.

## Acceptance Criteria (Authoritative)

1. Timeline view renders horizontal timeline with task bars, dependency arrows, and critical path highlighting.
2. Timeline supports drag to adjust task start/end dates.
3. Timeline supports drag-to-resize task duration.
4. Timeline supports zoom levels: day, week, month.
5. Portfolio dashboard at `/dashboard/pm/portfolio` shows all projects with health scores, aggregate metrics, resource utilization, and risk overview.
6. Portfolio dashboard supports filters by status, team, and date range.
7. Portfolio dashboard supports drill-down to project detail.
8. Resource utilization view shows team members with capacity bars, over/under allocation indicators, and project assignment breakdown.
9. Resource utilization view supports dragging tasks between assignees.
10. Resource utilization view alerts for overloaded team members.
11. Saved view templates: when a view is marked as a template, it is available to all projects in the workspace.
12. New projects can use a template as the default view.
13. Templates are editable by admins only.
14. View sharing supports private (me), team (project members), and public (anyone with link) visibility.
15. Public sharing generates a shareable URL.
16. Shared views reflect updates for viewers.
17. Dashboard customization mode allows drag to reorder, resize widgets, hide/show widgets, and add widgets.
18. Dashboard layout is saved per user per project.

## Traceability Mapping

| AC | Spec Section(s) | Component(s)/API(s) | Test Idea |
| --- | --- | --- | --- |
| 1-4 | Detailed Design → Workflows and Sequencing; APIs and Interfaces | Timeline UI (`/dashboard/pm/projects/:id/tasks/timeline`), Tasks API (`/api/pm/*/tasks`), TaskRelation model | UI renders bars/arrows; drag/resize updates task dates; zoom toggles day/week/month. |
| 5-7 | Detailed Design → Workflows and Sequencing | Portfolio UI (`/dashboard/pm/portfolio`), Projects API (`/api/pm/products`) | Load dashboard, apply filters, verify aggregate metrics and project drill-down links. |
| 8-10 | Detailed Design → Data Models; Workflows and Sequencing | Resource UI (`/dashboard/pm/resources`), TeamMember data, Tasks API | Verify capacity bars and overload indicators; drag task to new assignee updates assignment and utilization. |
| 11-13 | Detailed Design → Data Models and Contracts; APIs and Interfaces | SavedView model, `/api/pm/views` | Create view, mark as template, validate workspace availability and admin-only edits. |
| 14-16 | Detailed Design → Data Models and Contracts; APIs and Interfaces | SavedView visibility + share token, share URL handler | Verify private/team/public access; share URL works; updates propagate to viewers. |
| 17-18 | Detailed Design → Workflows and Sequencing | Dashboard customization UI, user/project preference storage | Drag/reorder/resize widgets; persistence across reload for same user/project. |

## Risks, Assumptions, Open Questions

- Risk: Timeline/Gantt performance at 500+ tasks (explicit epic note); requires virtualization and efficient dependency rendering.
  - Mitigation: Benchmark with synthetic 500+ task datasets; enforce virtualization and dependency rendering thresholds before rollout.
- Risk: Portfolio aggregates may be expensive without caching (epic technical notes); define cache strategy early.
  - Mitigation: Precompute portfolio metrics with short TTL caching and invalidate on task/phase updates.
- Risk: Share tokens and public view access introduce data exposure if permission checks are incomplete.
  - Mitigation: Restrict public access to view-only endpoints; enforce visibility checks and audit share access.
- Risk: Dependency modeling (TaskRelation) must be implemented/validated to support critical path and arrows.
  - Mitigation: Implement TaskRelation schema with cycle detection and validation rules before timeline release.

- Assumption: Core-PM Project/Phase/Task/TeamMember/SavedView models exist or will be added as per PRD/architecture.
  - Next step: Confirm schema coverage in `packages/db` and create migration tasks if missing.
- Assumption: Workspace-scoped RLS and `workspaceId` tenancy are already enforced by platform standards.
  - Next step: Validate RLS policies against PM-09 endpoints during implementation.
- Assumption: Existing Socket.io patterns can be reused for real-time updates (no new pm.* events required yet).
  - Next step: Confirm channel/event usage in `apps/api/src/websocket` and reuse for timeline/resource updates.
- Assumption: PM wireframes (PM-06, PM-13, PM-26, PM-27) are the UI source of truth for these screens.
  - Next step: Cross-check UI specs with UX pack and update if mismatches are found.

- Question: Which Gantt/timeline library will be used (gantt-task-react vs custom), and what are the performance benchmarks?
  - Next step: Prototype with candidate libraries and record render/interaction benchmarks.
- Question: How are portfolio “health scores” and aggregate metrics calculated (formula/inputs)?
  - Next step: Define health score formula with PM stakeholders and document in analytics spec.
- Question: What is the public share URL format and which service will authorize share-token access?
  - Next step: Decide share route and authorization handler in the API layer.
- Question: What is the canonical source for capacity (TeamMember capacity vs derived from phase allocation)?
  - Next step: Decide capacity source of truth and document in TeamMember contract.

## Follow-up Tasks (from Open Questions)

- FU-01: Select Timeline/Gantt Library + Benchmarks
  - Task: Prototype candidate libraries and capture render/interaction benchmarks at 100/500/1000 tasks with dependencies.
  - Output: Benchmark notes + recommended library with rationale and constraints.
- FU-02: Define Portfolio Health Score Formula
  - Task: Specify health score inputs (schedule, scope, risk, capacity) and weighting; document formulas and data sources.
  - Output: Metrics spec for portfolio dashboard and API aggregation.
- FU-03: Define Share URL + Authorization
  - Task: Decide share route (UI + API), token format, and access checks for public links; include audit logging requirements.
  - Output: Share access contract and security checklist.
- FU-04: Decide Capacity Source of Truth
  - Task: Choose capacity source of truth, document precedence rules, and update TeamMember contract if needed.
  - Output: Capacity model decision note tied to resource utilization view.

## Test Strategy Summary

- Unit tests (NestJS): SavedView service (templates, sharing, visibility), portfolio aggregation queries, assignment updates.
- API tests (NestJS + Supertest): `/api/pm/views` CRUD, project/team/task list endpoints used by advanced views.
- UI tests (Vitest/RTL): timeline rendering, zoom controls, view template CRUD UI, dashboard customization interactions.
- E2E tests (Playwright): timeline drag/resize, resource drag-to-assign, portfolio filters, share link access.
- Performance checks: validate rendering and API response times against existing Core-PM targets (task list <500ms P95, kanban render <800ms P95).
