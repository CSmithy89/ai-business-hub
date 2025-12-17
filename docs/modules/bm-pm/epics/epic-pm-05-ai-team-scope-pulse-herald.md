# Epic PM-05: AI Team - Scope, Pulse, Herald

**Goal:** Users get AI-powered phase management, health monitoring, and automated reporting.

**FRs Covered:** FR-5.5, FR-6.1-6.4

---

### Story PM-05.1: Scope Agent - Phase Management

**As a** project lead,
**I want** AI assistance managing phase transitions,
**So that** phases complete cleanly.

**Acceptance Criteria:**

**Given** a phase is nearing completion
**When** Scope analyzes phase status
**Then** suggests: tasks to complete, tasks to carry over, tasks to cancel

**And** generates phase completion summary

**And** requires human approval for phase transition

**Prerequisites:** PM-01.2

**Technical Notes:**
- Agno agent in `agents/platform/scope/`
- Tools: analyze_phase, suggest_transition

---

### Story PM-05.2: Scope Phase Transition Flow

**As a** project lead,
**I want** a guided phase transition workflow,
**So that** nothing falls through the cracks.

**Acceptance Criteria:**

**Given** I click "Complete Phase"
**When** transition modal opens
**Then** shows: incomplete tasks with action options (complete, carry over, cancel), completion summary, next phase preview

**And** Scope pre-fills recommendations

**And** "Confirm Transition" moves to next phase

**Prerequisites:** PM-05.1

**Technical Notes:**
- Modal with task checklist
- Bulk task operations on confirm

---

### Story PM-05.3: Scope Checkpoint Reminders

**As a** project lead,
**I want** reminders for phase checkpoints,
**So that** I don't miss important milestones.

**Acceptance Criteria:**

**Given** phase has checkpoint date
**When** checkpoint approaches (3 days, 1 day, day-of)
**Then** notification sent with: checkpoint name, outstanding items, suggested actions

**And** one-click to open phase review

**Prerequisites:** PM-05.1

**Technical Notes:**
- Cron job checks upcoming checkpoints

---

### Story PM-05.4: Pulse Agent - Health Monitoring

**As a** project user,
**I want** continuous project health monitoring,
**So that** I'm warned of issues early.

**Acceptance Criteria:**

**Given** Pulse monitors project continuously
**When** risk detected (overdue, blocked, overloaded)
**Then** notification sent to relevant users

**And** risk types: 48-hour deadline warning, blocker chain detected, team member overloaded, velocity drop

**And** severity: info, warning, critical

**Prerequisites:** PM-02.1

**Technical Notes:**
- Agno agent in `agents/platform/pulse/`
- Scheduled check every 15 minutes

---

### Story PM-05.5: Pulse Health Dashboard Widget

**As a** project user,
**I want** a health score visible on dashboard,
**So that** I see project status at a glance.

**Acceptance Criteria:**

**Given** I am on project overview
**When** I view health widget
**Then** shows: health score (0-100), risk indicators (colored dots), trend arrow (improving/declining)

**And** click opens detailed health panel

**And** Pulse explains score factors

**Prerequisites:** PM-05.4

**Technical Notes:**
- Health score algorithm in Pulse agent
- Real-time updates via WebSocket

---

### Story PM-05.6: Project Dashboard

**As a** project user,
**I want** a comprehensive project dashboard,
**So that** I see all key metrics in one place.

**Acceptance Criteria:**

**Given** I am on project overview
**When** dashboard loads
**Then** shows widgets: phase progress, task stats by state, pending approvals, agent activity, team workload, recent activity feed

**And** widgets are responsive (2 col on tablet, 1 on mobile)

**And** refresh button updates all widgets

**Prerequisites:** PM-01.5

**Technical Notes:**
- Dashboard component with widget grid
- React Query for data fetching

---

### Story PM-05.7: Phase Analytics

**As a** project user,
**I want** phase performance analytics,
**So that** I can track progress and velocity.

**Acceptance Criteria:**

**Given** I am on phase detail
**When** I view analytics tab
**Then** shows: burndown chart, burnup chart, velocity trend, task state distribution, scope change log

**And** Herald generates charts from PhaseSnapshot data

**And** can toggle between chart types

**Prerequisites:** PM-05.1

**Technical Notes:**
- Chart library: Recharts or Chart.js
- PhaseSnapshot model stores daily snapshots

---

### Story PM-05.8: Herald Agent - Automated Reports

**As a** project lead,
**I want** automated status reports,
**So that** stakeholders stay informed without manual effort.

**Acceptance Criteria:**

**Given** report is scheduled or triggered
**When** Herald generates report
**Then** report includes: executive summary, progress by phase, key accomplishments, blockers/risks, next priorities

**And** report types: daily standup, sprint summary, stakeholder update

**And** export to PDF or share link

**And** scheduled or on-demand

**Prerequisites:** PM-05.7

**Technical Notes:**
- Agno agent in `agents/platform/herald/`
- Template-based report generation

---
