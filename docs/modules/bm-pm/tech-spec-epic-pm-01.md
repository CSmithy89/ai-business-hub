# Epic Technical Specification: Project & Phase Management

Date: 2025-12-17
Author: chris
Epic ID: pm-01
Status: Draft (Enhanced via Pre-mortem + First Principles Analysis)

---

## Overview

Epic PM-01 establishes the foundational data models, APIs, and UI components for project and phase management in the Core-PM platform. This epic delivers the core infrastructure that enables users to create, configure, and manage projects with BMAD phases, providing the organized work tracking foundation that all subsequent PM features depend upon.

This specification covers 9 stories implementing Project CRUD operations, Phase management, Team management, BMAD phase templates, and Budget tracking. It builds on the existing HYVVE Platform Foundation (17 epics, 190 stories completed) and targets the `docs/modules/bm-pm/` module structure.

---

## Objectives and Scope

### In Scope

- **Data Models:** Project, Phase, ProjectTeam, TeamMember Prisma models with full RLS
- **Project API:** Complete CRUD endpoints for projects with workspace isolation
- **Phase API:** Nested phase operations under projects with state machine enforcement
- **UI Pages:** Projects list, Project detail with tabs, Create project modal, Settings page
- **BMAD Templates:** Pre-configured phase templates (7 BUILD + 3 OPERATE phases)
- **Team Management:** Human team roles, capacity planning, permissions
- **Budget Tracking:** Optional budget/spend fields with threshold alerts
- **Real-time Events:** WebSocket events for project and phase changes

### Out of Scope

- Task management (Epic PM-02)
- Views beyond project list and detail (Epic PM-03)
- AI agents (Epic PM-04, PM-05)
- Real-time collaboration/WebSocket infrastructure (Epic PM-06)
- Knowledge Base linking (Epic KB-01)
- External integrations (Epic PM-07)

---

## System Architecture Alignment

### Component Integration

PM-01 integrates with existing platform architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                     │
│  apps/web/src/app/dashboard/pm/                                  │
│  ├── page.tsx (Projects List - PM-01.3)                         │
│  ├── [slug]/                                                     │
│  │   ├── page.tsx (Project Detail - PM-01.5)                    │
│  │   ├── team/ (Team Tab - PM-01.8)                             │
│  │   └── settings/ (Settings Tab - PM-01.6)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (NestJS 10)                         │
│  apps/api/src/modules/pm/                                        │
│  ├── projects/                                                   │
│  │   ├── projects.controller.ts                                 │
│  │   ├── projects.service.ts                                    │
│  │   └── dto/                                                    │
│  ├── phases/                                                     │
│  │   ├── phases.controller.ts                                   │
│  │   └── phases.service.ts                                      │
│  └── teams/                                                      │
│       ├── teams.controller.ts                                   │
│       └── teams.service.ts                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL 16)                       │
│  packages/db/prisma/schema.prisma                                │
│  ├── Project, Phase, ProjectTeam, TeamMember models             │
│  └── RLS policies for workspace isolation                       │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Constraints

1. **Tenant Isolation:** All models must include `workspaceId` with RLS enforcement
2. **Event Bus:** Use existing Redis Streams event bus for `pm.*` events
3. **Auth:** Leverage existing JWT + session infrastructure
4. **Validation:** Use Zod schemas in `@hyvve/shared` for API validation
5. **Slug Generation:** Project slugs auto-generated from name, unique per workspace

---

## Detailed Design

### Services and Modules

| Service | Responsibility | Inputs | Outputs |
|---------|----------------|--------|---------|
| `ProjectsService` | Project CRUD, slug generation, progress aggregation | CreateProjectDto, UpdateProjectDto | Project entity |
| `PhasesService` | Phase CRUD, state machine enforcement, ordering | CreatePhaseDto, UpdatePhaseDto | Phase entity |
| `TeamsService` | Team member management, role assignment | AddMemberDto, UpdateMemberDto | TeamMember entity |
| `TemplatesService` | BMAD template loading, phase generation | TemplateId | Phase[] |

### Data Models and Contracts

#### Project Model

```prisma
model Project {
  id            String        @id @default(cuid())
  workspaceId   String
  businessId    String
  slug          String
  name          String
  description   String?

  // Visual Identity
  color         String        @default("#3B82F6")
  icon          String        @default("folder")
  coverImage    String?

  // Type Classification
  type          ProjectType   @default(CUSTOM)

  // BMAD Configuration
  bmadTemplateId String?
  currentPhase   String?

  // Budget
  budget        Decimal?      @db.Decimal(12, 2)
  actualSpend   Decimal?      @db.Decimal(12, 2)

  // Status
  status        ProjectStatus @default(PLANNING)
  startDate     DateTime?
  targetDate    DateTime?

  // Progress (denormalized)
  totalTasks      Int         @default(0)
  completedTasks  Int         @default(0)
  lastActivityAt  DateTime?

  // Settings
  autoApprovalThreshold Float @default(0.85)
  suggestionMode        Boolean @default(true)

  // Timestamps
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?

  // Relations
  business      Business      @relation(fields: [businessId], references: [id])
  phases        Phase[]
  team          ProjectTeam?

  @@unique([workspaceId, slug])
  @@index([workspaceId])
  @@index([businessId])
  @@index([status])
}

enum ProjectType {
  COURSE | PODCAST | BOOK | NEWSLETTER | VIDEO_SERIES |
  COMMUNITY | SOFTWARE | WEBSITE | CUSTOM
}

enum ProjectStatus {
  PLANNING | ACTIVE | ON_HOLD | COMPLETED | ARCHIVED
}
```

#### Phase Model

```prisma
model Phase {
  id            String        @id @default(cuid())
  projectId     String
  name          String
  description   String?

  // BMAD Mapping
  bmadPhase     BmadPhaseType?
  phaseNumber   Int

  // Timeline
  startDate     DateTime?
  endDate       DateTime?

  // Status
  status        PhaseStatus   @default(UPCOMING)

  // Progress (denormalized)
  totalTasks      Int         @default(0)
  completedTasks  Int         @default(0)
  totalPoints     Int         @default(0)
  completedPoints Int         @default(0)

  // Timestamps
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  project       Project       @relation(fields: [projectId], references: [id])
  tasks         Task[]

  @@index([projectId])
  @@index([status])
}

enum BmadPhaseType {
  PHASE_1_BRIEF | PHASE_2_REQUIREMENTS | PHASE_3_ARCHITECTURE |
  PHASE_4_IMPLEMENTATION | PHASE_5_TESTING | PHASE_6_DEPLOYMENT |
  PHASE_7_LAUNCH | OPERATE_MAINTAIN | OPERATE_ITERATE | OPERATE_SCALE
}

enum PhaseStatus {
  UPCOMING | CURRENT | COMPLETED | CANCELLED
}
```

#### Team Models

```prisma
model ProjectTeam {
  id            String        @id @default(cuid())
  projectId     String        @unique
  leadUserId    String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  project       Project       @relation(fields: [projectId], references: [id])
  members       TeamMember[]

  @@index([leadUserId])
}

model TeamMember {
  id            String        @id @default(cuid())
  teamId        String
  userId        String
  role          TeamRole      @default(DEVELOPER)
  customRoleName String?

  // Capacity
  hoursPerWeek  Float         @default(40)
  productivity  Float         @default(0.8)

  // Permissions
  canAssignTasks      Boolean @default(false)
  canApproveAgents    Boolean @default(false)
  canModifyPhases     Boolean @default(false)

  // Status
  isActive      Boolean       @default(true)
  joinedAt      DateTime      @default(now())

  team          ProjectTeam   @relation(fields: [teamId], references: [id])

  @@unique([teamId, userId])
  @@index([userId])
}

enum TeamRole {
  PROJECT_LEAD | DEVELOPER | DESIGNER | QA_ENGINEER | STAKEHOLDER | CUSTOM
}
```

### APIs and Interfaces

#### Project Endpoints

| Method | Path | Request | Response | Description |
|--------|------|---------|----------|-------------|
| `POST` | `/api/pm/projects` | `CreateProjectDto` | `Project` | Create project |
| `GET` | `/api/pm/projects` | Query params | `PaginatedResponse<Project>` | List projects |
| `GET` | `/api/pm/projects/:id` | - | `ProjectWithRelations` | Get project detail |
| `PATCH` | `/api/pm/projects/:id` | `UpdateProjectDto` | `Project` | Update project |
| `DELETE` | `/api/pm/projects/:id` | - | `void` | Soft delete |

```typescript
// CreateProjectDto
interface CreateProjectDto {
  name: string;           // Required
  businessId: string;     // Required
  description?: string;
  type?: ProjectType;
  color?: string;
  icon?: string;
  bmadTemplateId?: string;
  startDate?: Date;
  targetDate?: Date;
}

// Response includes generated slug
interface Project {
  id: string;
  workspaceId: string;
  businessId: string;
  slug: string;           // Auto-generated from name
  // ... all other fields
}
```

#### Phase Endpoints

| Method | Path | Request | Response | Description |
|--------|------|---------|----------|-------------|
| `POST` | `/api/pm/projects/:projectId/phases` | `CreatePhaseDto` | `Phase` | Create phase |
| `GET` | `/api/pm/projects/:projectId/phases` | - | `Phase[]` | List phases |
| `PATCH` | `/api/pm/phases/:id` | `UpdatePhaseDto` | `Phase` | Update phase |
| `POST` | `/api/pm/phases/:id/start` | - | `Phase` | Start phase |
| `POST` | `/api/pm/phases/:id/complete` | - | `Phase` | Complete phase |

```typescript
// Phase state machine
// UPCOMING → CURRENT → COMPLETED
// Only one phase can be CURRENT per project
```

#### Team Endpoints

| Method | Path | Request | Response | Description |
|--------|------|---------|----------|-------------|
| `GET` | `/api/pm/projects/:projectId/team` | - | `ProjectTeam` | Get team |
| `POST` | `/api/pm/projects/:projectId/team/members` | `AddMemberDto` | `TeamMember` | Add member |
| `PATCH` | `/api/pm/teams/members/:id` | `UpdateMemberDto` | `TeamMember` | Update member |
| `DELETE` | `/api/pm/teams/members/:id` | - | `void` | Remove member |

### Workflows and Sequencing

#### Project Creation Flow

```
User clicks "New Project"
    │
    ▼
Modal opens with wizard steps:
    │
    ├── Step 1: Basics (name, description, type, color, icon)
    │
    ├── Step 2: Template (BMAD template or Kanban-only)
    │
    └── Step 3: Team (assign project lead - required)
    │
    ▼
API: POST /api/pm/projects
    │
    ├── Validate input
    ├── Generate slug from name
    ├── Create Project record
    ├── Create ProjectTeam with lead
    ├── If template: Generate phases from template
    └── Emit pm.project.created event
    │
    ▼
Navigate to /dashboard/pm/[slug]
```

#### Phase State Machine

```
                    ┌─────────────┐
                    │  UPCOMING   │◄─────── (new phase)
                    └──────┬──────┘
                           │ start()
                           ▼
                    ┌─────────────┐
        ┌──────────►│  CURRENT    │ (only one per project)
        │           └──────┬──────┘
        │                  │ complete()
        │                  ▼
        │           ┌─────────────┐
        │           │  COMPLETED  │
        │           └─────────────┘
        │
        │           ┌─────────────┐
        └───────────│  CANCELLED  │◄─────── (admin action)
                    └─────────────┘
```

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Project list load (50 items) | <500ms P95 | API response time |
| Project detail load | <400ms P95 | API response time with phases |
| Create project modal submit | <1s P95 | End-to-end with template generation |
| Phase list render | <100ms | Client-side rendering |

**Optimizations:**
- Paginate project list (default 20, max 100)
- Index on `workspaceId`, `status`, `businessId`
- Denormalize task counts on Project and Phase models

### Security

- **Authentication:** All endpoints require valid JWT token
- **Authorization:** Workspace membership enforced via middleware
- **RLS:** PostgreSQL row-level security on all models with `workspaceId`
- **Team Permissions:** Project lead/admin can manage team; members have limited access
- **Input Validation:** Zod schemas validate all DTOs server-side
- **Soft Delete:** Projects use `deletedAt` for audit trail

```sql
-- RLS Policy Example
CREATE POLICY "tenant_isolation" ON "Project"
  USING (workspace_id = current_setting('app.workspace_id', true)::text);
```

### Reliability/Availability

- **Database:** PostgreSQL with connection pooling (PgBouncer)
- **Error Handling:** Standard NestJS exception filters with structured errors
- **Graceful Degradation:** Frontend shows cached data on API timeout
- **Retry Logic:** React Query retry with exponential backoff

### Observability

| Signal | Implementation |
|--------|----------------|
| **Logging** | Structured JSON logs via Pino/Winston |
| **Metrics** | `pm.project.created`, `pm.project.updated` counters |
| **Tracing** | OpenTelemetry spans for API calls |
| **Alerting** | Error rate > 1% triggers alert |

---

## Dependencies and Integrations

### Internal Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@hyvve/db` | workspace | Prisma schema and client |
| `@hyvve/shared` | workspace | Zod schemas, types |
| `@hyvve/ui` | workspace | shadcn/ui components |
| Platform Auth | existing | JWT validation, session |
| Platform Events | existing | Redis Streams event bus |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/common` | ^10.x | NestJS framework |
| `@prisma/client` | ^6.x | Database ORM |
| `react-hook-form` | ^7.x | Form management |
| `@tanstack/react-query` | ^5.x | Data fetching |
| `zod` | ^3.x | Schema validation |
| `slugify` | ^1.x | Slug generation |

### Integration Points

- **Event Bus:** Emit `pm.project.*`, `pm.phase.*`, `pm.team.*` events
- **Approval Queue:** Future integration for agent-suggested changes
- **Business Model:** Projects linked to Business via `businessId`

---

## Acceptance Criteria (Authoritative)

### Story PM-01.1: Project Data Model & API

1. Prisma migration creates Project table with all columns and indexes
2. POST /api/pm/projects creates project with required fields (name, workspaceId, businessId)
3. Slug auto-generated from name, unique per workspace; append random suffix on collision
4. GET /api/pm/projects returns paginated list with status/type/businessId filters
5. GET /api/pm/projects/:id returns project with phases relation
6. PATCH /api/pm/projects/:id updates allowed fields
7. DELETE /api/pm/projects/:id sets deletedAt (soft delete)
8. All endpoints enforce workspace RLS
9. Events emitted: pm.project.created, pm.project.updated, pm.project.deleted

**Technical Notes (from Pre-mortem/First Principles Analysis):**
- **Slug Collision Handling:** Use `slugify(name)` + check uniqueness. If collision, append `-${nanoid(4)}`.
- **Count Synchronization:** Update `totalTasks`/`completedTasks` via `ProjectsService.updateTaskCounts()` called from `TasksService` on task create/complete/delete. MVP uses service layer with eventual consistency.
- **RLS Verification:** All custom Prisma queries MUST include `where: { workspaceId }`. Add to code review checklist.

### Story PM-01.2: Phase CRUD API

1. Phase model created with projectId relation
2. POST /api/pm/projects/:projectId/phases creates phase with name, phaseNumber
3. GET returns ordered list of phases for project
4. PATCH updates phase fields
5. Only one phase can have status=CURRENT per project
6. State machine enforced: UPCOMING → CURRENT → COMPLETED
7. Events emitted: pm.phase.created, pm.phase.updated, pm.phase.transitioned

**Technical Notes (from Pre-mortem Analysis):**
- **DB Constraint:** Add PostgreSQL CHECK constraint or partial unique index to ensure only one CURRENT phase per project.
- **State Transition Validation:** `PhasesService.start()` must first complete any existing CURRENT phase before setting new one.
- **Fractional Ordering:** Use `phaseNumber` as Float (1.0, 1.5, 2.0) to avoid cascade updates on reorder.

### Story PM-01.3: Project List Page

1. Route /dashboard/pm renders project cards
2. Cards show icon, name, type badge, progress bar
3. Filter bar with status, type, search
4. "New Project" button visible
5. Clicking project navigates to /dashboard/pm/[slug]
6. Empty state shows "Create your first project" CTA
7. Responsive: 3 cols desktop, 2 tablet, 1 mobile

### Story PM-01.4: Create Project Modal

1. Multi-step wizard with 3 steps
2. Step 1: Name, description, type, color, icon
3. Step 2: Template selection (BMAD or Kanban-only)
4. Step 3: Assign project lead (required)
5. Validation on each step before proceeding
6. Success navigates to new project page
7. Cancel closes modal without changes

### Story PM-01.5: Project Detail Page - Overview Tab

1. Route /dashboard/pm/[slug] loads project
2. Header: icon, name, progress ring, status badge
3. Horizontal phase timeline showing all phases
4. Quick stats: tasks, team, days remaining
5. Tab navigation: Overview, Tasks, Team, Docs, Settings
6. 404 page for invalid slug

### Story PM-01.6: Project Settings Page

1. Only project lead/admin can access
2. General section: name, description, dates
3. Automation section: auto-approval threshold, suggestion mode
4. Phases section: reorder, add, edit phases
5. Danger Zone: archive, delete
6. Changes auto-save with "Saved" toast
7. Archive sets status=ARCHIVED

### Story PM-01.7: BMAD Phase Templates

1. Template data in apps/api/src/modules/pm/templates/
2. BMAD Course template: 7 BUILD + 3 OPERATE phases
3. Kanban-only template: single "Backlog" phase
4. Template selection during project creation
5. Phases auto-generated on project create
6. Each phase has suggested task templates (metadata only)

### Story PM-01.8: Project Team Management

1. Team tab shows members with avatar, name, role, capacity
2. Add team member with role and permissions
3. Edit member role and permissions
4. Remove member (with confirmation)
5. Uses ProjectTeam, TeamMember models
6. Events: pm.team.member_added, pm.team.member_removed
7. Transfer project ownership when lead is removed or leaves workspace

**Technical Notes (from First Principles Analysis):**
- **Ownership Transfer:** When lead is removed, prompt to select new lead from team. If no team members, auto-assign to workspace admin.
- **Lead Departure:** On workspace membership removal event, check for orphaned projects and auto-transfer to workspace admin with notification.
- **Permission Guards:** Add `@RequireRole(PROJECT_LEAD, ADMIN)` decorator for team management endpoints.

### Story PM-01.9: Budget Tracking

1. Budget field optional on project
2. Enable budget in project settings
3. Set budget amount (Decimal 12,2)
4. Header shows budget widget with spent/remaining
5. Log expenses with amount, description, date
6. Alerts at 75%, 90%, 100% thresholds
7. MVP: manual expense entry only

---

## Traceability Mapping

| AC # | Spec Section | Component/API | Test Idea |
|------|--------------|---------------|-----------|
| 1.1 | Data Models | Project Prisma model | Migration test, schema validation |
| 1.2 | APIs | POST /api/pm/projects | Integration test with valid DTO |
| 1.3 | APIs | POST /api/pm/projects | Unit test slug generation; collision test with 1000 similar names |
| 1.4 | APIs | GET /api/pm/projects | Integration test with filters |
| 1.5 | APIs | GET /api/pm/projects/:id | Test project with phases response; verify eager loading |
| 1.6 | APIs | PATCH /api/pm/projects/:id | Test partial update |
| 1.7 | APIs | DELETE /api/pm/projects/:id | Verify soft delete |
| 1.8 | Security | RLS Policy | Test cross-workspace isolation; multi-tenant fixtures |
| 1.9 | Observability | Event Bus | Verify event emission; Redis health check |
| 2.1 | Data Models | Phase Prisma model | Migration test |
| 2.5 | Workflows | Phase state machine | Test CURRENT constraint; DB constraint verification |
| 2.6 | Workflows | Phase state machine | Test invalid state transitions return errors |
| 3.1 | Services | Projects List Page | E2E with Playwright |
| 3.7 | Services | Projects List Page | Responsive viewport test |
| 4.1 | Workflows | Create Project Modal | E2E wizard flow |
| 5.1 | Services | Project Detail Page | E2E with slug route |
| 6.1 | Security | Settings Page | Permission guard test; non-lead access denied |
| 7.1 | Data Models | Templates | Unit test template loading |
| 8.1 | Services | Team Tab | E2E team management |
| 8.7 | Workflows | Team Management | Test ownership transfer on lead removal |
| 9.1 | Data Models | Budget fields | Test budget calculation; Decimal precision edge cases |

### Pre-mortem Specific Tests

| Risk Area | Test Type | Test Scenario |
|-----------|-----------|---------------|
| Slug collision | Integration | Create 1000 projects with name "Test Project" - verify unique slugs |
| Phase state | Unit | Attempt to set two phases CURRENT - verify rejection |
| RLS bypass | Security | Call API with mismatched workspaceId - verify 403/404 |
| Permissions | E2E | Non-lead attempts team edit via API - verify 403 |
| Budget precision | Unit | Budget calculations with edge values (0, MAX_DECIMAL, overflow) |
| Event emission | Integration | Verify Redis receives events; test with disconnected Redis |
| Count desync | Integration | Create/delete tasks rapidly; verify counts remain accurate |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Slug collision on similar names | High | Append random suffix if duplicate; integration test with 1000 similar names |
| Phase state machine edge cases | Medium | Add DB constraint CHECK only one CURRENT per project; unit test all transitions |
| Performance with many phases | Low | Pagination, lazy loading if > 20 phases |
| RLS configuration errors | High | Integration tests with multi-tenant fixtures; mandatory code review checklist |
| Cross-tenant data leakage | Critical | Pentest before launch; verify `workspaceId` filter in all custom queries |
| Team permissions bypass via API | High | Add `@RequireRole(PROJECT_LEAD)` guards; E2E tests for permission denial |
| Budget floating point precision | Medium | Use Prisma Decimal throughout; unit tests for edge cases (0, max, overflow) |
| Template changes break existing projects | Medium | Version templates; document as unsupported in MVP, plan Phase 2 migration path |
| Event bus events silently fail | Medium | Add event emission verification in integration tests; Redis health check |
| Denormalized count desync | High | Define count update strategy in service layer; consider DB triggers for Phase 2 |

### Assumptions

1. Business model already exists and is created during onboarding
2. User authentication/session management is complete
3. Event bus infrastructure is operational
4. Workspace membership is enforced by existing middleware
5. shadcn/ui component library is configured

### Open Questions

1. **Q:** Should phase reordering update all phase numbers or use fractional ordering?
   **A:** Recommend fractional ordering (1.0, 1.5, 2.0) to avoid cascade updates.

2. **Q:** Budget currency - single currency or multi-currency support?
   **A:** MVP assumes single currency (workspace default). Multi-currency is Phase 2+.

3. **Q:** Should archived projects be visible in list with filter, or separate archive view?
   **A:** Recommend filter toggle in list view (default: hide archived).

4. **Q:** What happens if the project lead leaves the workspace?
   **A:** Recommend auto-transfer ownership to workspace admin with notification. Add ownership transfer flow to PM-01.8.

5. **Q:** How are denormalized counts (totalTasks, completedTasks) updated?
   **A:** Service layer updates via `ProjectsService.updateTaskCounts()` called from `TasksService`. MVP uses service layer with eventual consistency; Phase 2 consider DB triggers for reliability.

6. **Q:** What happens if user wants to change template (BMAD → Kanban) after project creation?
   **A:** Document as unsupported in MVP. Changing template would orphan existing phases/tasks. Phase 2+ may support controlled migration.

7. **Q:** Should parallel phases be supported for non-sequential workflows?
   **A:** MVP assumes sequential phases. Consider adding `parallelGroup` field in Phase 2 for concurrent phase execution.

---

## Test Strategy Summary

### Unit Tests

- Prisma model validation
- Slug generation logic
- Phase state machine transitions
- DTO validation with Zod

### Integration Tests

- API endpoints with test database
- RLS policy enforcement
- Event emission verification
- Cross-workspace isolation

### E2E Tests (Playwright)

- Project creation wizard flow
- Project list filtering
- Project detail navigation
- Settings page permissions
- Team management CRUD

### Test Coverage Targets

| Layer | Target |
|-------|--------|
| API Services | 80% |
| UI Components | 70% |
| E2E Critical Paths | 100% |

---

*Generated by BMad Master via epic-tech-context workflow*
