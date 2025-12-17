# Epic PM-09: Advanced Views

**Goal:** Users get timeline visualization, portfolio dashboard, and enhanced view sharing.

**FRs Covered:** FR-4.4, FR-4.6

---

### Story PM-09.1: Timeline View (Gantt)

**As a** project user,
**I want** a Gantt-style timeline view,
**So that** I can visualize task schedules and dependencies.

**Acceptance Criteria:**

**Given** I select Timeline view
**When** view loads
**Then** shows: horizontal timeline with task bars, dependency arrows, critical path highlighting

**And** drag to adjust start/end dates

**And** drag to resize duration

**And** zoom levels: day, week, month

**Prerequisites:** PM-03.7

**Technical Notes:**
- Library: gantt-task-react or custom
- Performance for 500+ tasks

---

### Story PM-09.2: Executive Portfolio Dashboard

**As a** workspace admin,
**I want** cross-project portfolio view,
**So that** I see all projects at once.

**Acceptance Criteria:**

**Given** I navigate to /dashboard/pm/portfolio
**When** dashboard loads
**Then** shows: all projects with health scores, aggregate metrics, resource utilization across projects, risk overview

**And** filter by status, team, date range

**And** drill-down to project detail

**Prerequisites:** PM-05.6

**Technical Notes:**
- Aggregate queries across projects
- Performance optimization with caching

---

### Story PM-09.3: Resource Utilization View

**As a** workspace admin,
**I want** to see team capacity across projects,
**So that** I can balance workloads.

**Acceptance Criteria:**

**Given** I view resource utilization
**When** data loads
**Then** shows: team members with capacity bars, over/under allocation indicators, project assignment breakdown

**And** drag tasks between assignees

**And** alerts for overloaded members

**Prerequisites:** PM-09.2

**Technical Notes:**
- Hours/week from TeamMember
- Aggregate assigned task estimates

---

### Story PM-09.4: View Templates

**As a** workspace admin,
**I want** to create view templates,
**So that** teams have consistent views.

**Acceptance Criteria:**

**Given** I save a view
**When** I mark as template
**Then** template available to all projects in workspace

**And** new projects can use template as default

**And** template editable by admins only

**Prerequisites:** PM-03.6

**Technical Notes:**
- SavedView with isTemplate flag
- Workspace-scoped templates

---

### Story PM-09.5: View Sharing & Permissions

**As a** project user,
**I want** fine-grained view sharing,
**So that** I control who sees what.

**Acceptance Criteria:**

**Given** I have a saved view
**When** I share it
**Then** options: private (me only), team (project members), public (anyone with link)

**And** shareable URL generated

**And** view updates reflect for viewers

**Prerequisites:** PM-03.6

**Technical Notes:**
- Share token for public links
- Permission check on view access

---

### Story PM-09.6: Dashboard Customization

**As a** project user,
**I want** to customize my dashboard layout,
**So that** I see what matters most.

**Acceptance Criteria:**

**Given** I am on project dashboard
**When** I enter customize mode
**Then** can: drag widgets to reorder, resize widgets, hide/show widgets, add available widgets

**And** layout saved per user per project

**Prerequisites:** PM-05.6

**Technical Notes:**
- react-grid-layout or similar
- Persist to user preferences

---
