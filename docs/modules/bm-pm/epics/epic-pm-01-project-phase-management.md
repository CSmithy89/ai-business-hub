# Epic PM-01: Project & Phase Management

**Goal:** Users can create, configure, and manage projects with BMAD phases, enabling organized work tracking from day one.

**FRs Covered:** FR-1, FR-2

## Wireframe References

| Story | Wireframe | Assets |
|-------|-----------|--------|
| PM-01.3: Projects List | PM-01 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-01_projects_list_view/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-01_projects_list_view/screen.png) |
| PM-01.5: Project Detail | PM-02 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-02_project_detail_overview/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-02_project_detail_overview/screen.png) |
| PM-01.6: Project Settings | PM-10 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-10_project_settings/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-10_project_settings/screen.png) |
| PM-01.7: BMAD Phases | PM-21 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-21_bmad_phase_view/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-21_bmad_phase_view/screen.png) |
| Project Templates | PM-14 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-14_project_templates/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-14_project_templates/screen.png) |

---

### Story PM-01.1: Project Data Model & API

**As a** platform developer,
**I want** the Project and Phase data models with full CRUD API,
**So that** the foundation exists for all project management features.

**Acceptance Criteria:**

**Given** the Prisma schema with Project, Phase models
**When** I run database migrations
**Then** tables are created with all columns, indexes, and relations

**And** POST /api/pm/projects creates a project with:
- Required: name, workspaceId, businessId
- Optional: description, type, color, icon, bmadTemplateId
- Auto-generated: slug (from name), status=PLANNING

**And** GET /api/pm/projects returns paginated list with filters (status, type, businessId)

**And** GET /api/pm/projects/:id returns full project with phases

**And** PATCH /api/pm/projects/:id updates allowed fields

**And** DELETE /api/pm/projects/:id soft-deletes (sets deletedAt)

**And** all endpoints enforce workspace RLS

**Prerequisites:** Schema (completed)

**Technical Notes:**
- NestJS controller + service in `apps/api/src/modules/pm/`
- Events: `pm.project.created`, `pm.project.updated`, `pm.project.deleted`
- Zod validation schemas in `@hyvve/shared`

---

### Story PM-01.2: Phase CRUD API

**As a** platform developer,
**I want** Phase CRUD operations nested under projects,
**So that** projects can have structured work phases.

**Acceptance Criteria:**

**Given** a project exists
**When** I POST /api/pm/projects/:projectId/phases
**Then** a phase is created with required fields (name, phaseNumber)

**And** GET /api/pm/projects/:projectId/phases returns ordered list

**And** PATCH /api/pm/phases/:id updates phase fields

**And** only one phase can have status=CURRENT per project

**And** phase state machine enforced: UPCOMING → CURRENT → COMPLETED

**Prerequisites:** PM-01.1

**Technical Notes:**
- Events: `pm.phase.created`, `pm.phase.updated`, `pm.phase.transitioned`

---

### Story PM-01.3: Project List Page

**As a** workspace user,
**I want** to see all my projects in a filterable list,
**So that** I can navigate to any project quickly.

**Acceptance Criteria:**

**Given** I am logged into a workspace with projects
**When** I navigate to `/dashboard/pm`
**Then** I see project cards with icon, name, type badge, progress bar

**And** filter bar with status, type, search

**And** "New Project" button prominently displayed

**And** clicking a project navigates to `/dashboard/pm/[slug]`

**And** empty state shows "Create your first project" CTA

**Prerequisites:** PM-01.1

**Technical Notes:**
- Route: `apps/web/src/app/dashboard/pm/page.tsx`
- React Query for data fetching
- Responsive: 3 cols desktop, 2 tablet, 1 mobile

---

### Story PM-01.4: Create Project Modal

**As a** workspace user,
**I want** to create a new project with template selection,
**So that** I can start managing work immediately.

**Acceptance Criteria:**

**Given** I click "New Project"
**When** the modal opens
**Then** I see a multi-step wizard:

Step 1 - Basics: Name, description, type, color, icon
Step 2 - Template: BMAD templates or flexible options
Step 3 - Team: Assign project lead (required)

**And** on success, navigates to new project page

**Prerequisites:** PM-01.1, PM-01.3

**Technical Notes:**
- Dialog from shadcn/ui
- react-hook-form + zod validation

---

### Story PM-01.5: Project Detail Page - Overview Tab

**As a** project user,
**I want** to see project overview with phases and progress,
**So that** I understand the current state at a glance.

**Acceptance Criteria:**

**Given** I navigate to `/dashboard/pm/[slug]`
**When** the page loads
**Then** I see header (icon, name, progress ring, status badge)

**And** horizontal phase timeline showing all phases

**And** quick stats (tasks, team, days remaining)

**And** tab navigation (Overview, Tasks, Team, Docs, Settings)

**Prerequisites:** PM-01.1, PM-01.2

**Technical Notes:**
- Route: `apps/web/src/app/dashboard/pm/[slug]/page.tsx`
- Parallel routes for tabs

---

### Story PM-01.6: Project Settings Page

**As a** project lead,
**I want** to configure project settings,
**So that** I can customize behavior for my team.

**Acceptance Criteria:**

**Given** I am project lead or admin
**When** I navigate to Settings tab
**Then** I can configure: General (name, description, dates), Automation (auto-approval threshold, suggestion mode), Phases (reorder, add, edit), Danger Zone (archive, delete)

**And** changes auto-save with "Saved" toast

**Prerequisites:** PM-01.5

**Technical Notes:**
- Only lead/admin/owner can access
- Archive sets status=ARCHIVED

---

### Story PM-01.7: BMAD Phase Templates

**As a** project creator,
**I want** pre-configured phase templates,
**So that** I get a structured starting point.

**Acceptance Criteria:**

**Given** I select a BMAD template during project creation
**When** project is created
**Then** phases are auto-generated (Course: 7 BUILD + 3 OPERATE phases)

**And** Kanban-Only template creates single "Backlog" phase

**And** each phase has suggested task templates

**Prerequisites:** PM-01.2, PM-01.4

**Technical Notes:**
- Templates in `apps/api/src/modules/pm/templates/`

---

### Story PM-01.8: Project Team Management

**As a** project lead,
**I want** to manage my project team,
**So that** I can assign roles and control access.

**Acceptance Criteria:**

**Given** I am on project Team tab
**When** I view the team
**Then** I see team members with avatar, name, role, capacity

**And** I can add team members with role and permissions

**And** I can edit/remove members (with task reassignment)

**Prerequisites:** PM-01.5

**Technical Notes:**
- Uses ProjectTeam, TeamMember models
- Events: `pm.team.member_added`, `pm.team.member_removed`

---

### Story PM-01.9: Budget Tracking

**As a** project lead,
**I want** to track project budget,
**So that** I can monitor spending against plan.

**Acceptance Criteria:**

**Given** I enable budget in project settings
**When** I set a budget amount
**Then** header shows budget widget with spent/remaining

**And** I can log expenses with amount, description, date

**And** alerts at 75%, 90%, 100% thresholds

**Prerequisites:** PM-01.5

**Technical Notes:**
- Budget as Decimal(12,2) on Project
- MVP: manual expense entry only

---
