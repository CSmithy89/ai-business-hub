# Core-PM (bm-pm) - Epic Breakdown

**Author:** Chris
**Date:** 2025-12-17
**Module:** Core-PM (Project Management + Knowledge Base)
**Status:** Draft

---

## Overview

This document provides the complete epic and story breakdown for Core-PM, the platform's project management and knowledge base module. It transforms requirements from the [PRD](./PRD.md) into implementable stories organized by user value delivery.

**Living Document Notice:** This breakdown incorporates PRD, Architecture, and UX Design specifications. Stories include technical implementation details for autonomous development.

### Epic Summary

| Phase | Epic | Title | Stories | Focus |
|-------|------|-------|---------|-------|
| MVP | PM-01 | Project & Phase Management | 9 | Project CRUD, phases, templates, teams |
| MVP | PM-02 | Task Management System | 11 | Task CRUD, hierarchy, assignment, states |
| MVP | PM-03 | Views & Navigation | 8 | List, Kanban, Calendar, saved views |
| MVP | PM-04 | AI Team: Navi, Sage, Chrono | 9 | Orchestration, estimation, time tracking |
| MVP | PM-05 | AI Team: Scope, Pulse, Herald | 8 | Phase mgmt, health, reporting |
| MVP | PM-06 | Real-Time & Notifications | 6 | WebSocket, presence, preferences |
| MVP | KB-01 | Knowledge Base Foundation | 10 | Pages, hierarchy, search, linking |
| **MVP Total** | | | **61** | |
| Phase 2 | KB-02 | KB Real-Time & RAG | 8 | Yjs collab, embeddings, semantic search |
| Phase 2 | KB-03 | KB Verification & Scribe | 7 | Verified content, AI KB management |
| Phase 2 | PM-07 | Integrations & Bridge Agent | 7 | GitHub, CSV, PM tool import |
| Phase 2 | PM-08 | Prism Agent & Analytics | 6 | Predictive insights, trends |
| Phase 2 | PM-09 | Advanced Views | 6 | Timeline, portfolio, view sharing |
| **Phase 2 Total** | | | **34** | |
| Phase 3 | KB-04 | AI-Native Knowledge Base | 6 | AI drafts, Q&A, gap detection |
| Phase 3 | PM-10 | Workflow Builder | 5 | Custom workflows, automations |
| Phase 3 | PM-11 | External API & Governance | 5 | REST API, webhooks |
| **Phase 3 Total** | | | **16** | |
| **Grand Total** | | | **111** | |

---

## Functional Requirements Inventory

### Core-PM Requirements (FR-1 to FR-8)

| FR | Description | Epic Coverage |
|----|-------------|---------------|
| FR-1 | Project Management (CRUD, Templates, Settings, Budget) | PM-01 |
| FR-2 | Phase Management (CRUD, Templates, Lifecycle) | PM-01 |
| FR-3 | Task Management (CRUD, Classification, Assignment, Hierarchy, Relations, States) | PM-02 |
| FR-4.1-4.3 | Views & Navigation (List, Kanban, Calendar) | PM-03 |
| FR-4.4-4.6 | Advanced Views (Timeline, Portfolio, Saved Views) | PM-03, PM-09 |
| FR-5.1-5.4 | Agent Features (Suggestions, Chat, Briefing, Estimation) | PM-04 |
| FR-5.5 | Risk Alerts (Pulse) | PM-05 |
| FR-6 | Reporting & Analytics | PM-05, PM-08 |
| FR-7 | Real-Time Features (WebSocket, Presence, Notifications) | PM-06 |
| FR-8.1 | CSV Import/Export | PM-07 |
| FR-8.2 | Event Bus Integration | PM-06 |
| FR-8.3-8.4 | External Integrations (GitHub, PM Tools) | PM-07 |

### Knowledge Base Requirements (KB-F1 to KB-F8)

| FR | Description | Epic Coverage |
|----|-------------|---------------|
| KB-F1 | Wiki Page System (CRUD, Rich Text, Hierarchy, Versioning) | KB-01 |
| KB-F2 | Basic Navigation (Sidebar, Breadcrumbs, Recent, Search) | KB-01 |
| KB-F3 | Project-KB Linking | KB-01 |
| KB-F4 | Real-Time Collaboration (Yjs) | KB-02 |
| KB-F5 | @Mentions & #References | KB-03 |
| KB-F6 | RAG Integration (Embeddings, Semantic Search) | KB-02 |
| KB-F7 | Verified Content System | KB-03 |
| KB-F8 | AI-Native KB (Drafts, Q&A, Gap Detection) | KB-04 |

---

## FR Coverage Map

| FR | Epic | Stories |
|----|------|---------|
| FR-1.1 | PM-01 | PM-01.1, PM-01.3, PM-01.4 |
| FR-1.2 | PM-01 | PM-01.7 |
| FR-1.3 | PM-01 | PM-01.6 |
| FR-1.4 | PM-01 | PM-01.9 |
| FR-2.1 | PM-01 | PM-01.2 |
| FR-2.2 | PM-01 | PM-01.7 |
| FR-2.3 | PM-01 | PM-01.2, PM-01.6 |
| FR-3.1-3.6 | PM-02 | PM-02.1 through PM-02.11 |
| FR-4.1 | PM-03 | PM-03.1 |
| FR-4.2 | PM-03 | PM-03.2, PM-03.3 |
| FR-4.3 | PM-03 | PM-03.4 |
| FR-4.5 | PM-03 | PM-03.6 |
| FR-4.4 | PM-09 | PM-09.1 |
| FR-4.6 | PM-09 | PM-09.2 |
| FR-5.1-5.2 | PM-04 | PM-04.1 through PM-04.4 |
| FR-5.3 | PM-04 | PM-04.5 |
| FR-5.4 | PM-04 | PM-04.6, PM-04.7 |
| FR-5.5 | PM-05 | PM-05.4, PM-05.5 |
| FR-6.1-6.2 | PM-05 | PM-05.6, PM-05.7 |
| FR-6.3-6.4 | PM-05 | PM-05.8 |
| FR-7.1-7.4 | PM-06 | PM-06.1 through PM-06.6 |
| FR-8.1 | PM-07 | PM-07.1, PM-07.2 |
| FR-8.2 | PM-06 | PM-06.1 |
| FR-8.3 | PM-07 | PM-07.3, PM-07.4 |
| FR-8.4 | PM-07 | PM-07.5, PM-07.6 |
| KB-F1 | KB-01 | KB-01.1 through KB-01.4 |
| KB-F2 | KB-01 | KB-01.5 through KB-01.7 |
| KB-F3 | KB-01 | KB-01.8, KB-01.9 |
| KB-F4 | KB-02 | KB-02.1 through KB-02.4 |
| KB-F5 | KB-03 | KB-03.5, KB-03.6 |
| KB-F6 | KB-02 | KB-02.5 through KB-02.8 |
| KB-F7 | KB-03 | KB-03.1 through KB-03.4 |
| KB-F8 | KB-04 | KB-04.1 through KB-04.6 |

---

# MVP EPICS

---

## Epic PM-01: Project & Phase Management

**Goal:** Users can create, configure, and manage projects with BMAD phases, enabling organized work tracking from day one.

**FRs Covered:** FR-1, FR-2

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

## Epic PM-02: Task Management System

**Goal:** Users can create, assign, and track work items with full hierarchy, relationships, and state management.

**FRs Covered:** FR-3

---

### Story PM-02.1: Task Data Model & API

**As a** platform developer,
**I want** Task CRUD API with full feature support,
**So that** users can manage work items.

**Acceptance Criteria:**

**Given** the Task Prisma model
**When** I POST /api/pm/tasks
**Then** task is created with auto-generated taskNumber (PROJECT-001)

**And** GET /api/pm/tasks supports filters: phaseId, status, assigneeId, type, priority

**And** PATCH /api/pm/tasks/:id updates fields with activity logging

**And** DELETE soft-deletes task

**And** bulk operations: PATCH /api/pm/tasks/bulk (status, assignee, phase)

**Prerequisites:** PM-01.1

**Technical Notes:**
- taskNumber is sequential per project
- Events: `pm.task.created`, `pm.task.updated`, `pm.task.status_changed`

---

### Story PM-02.2: Task Detail Panel

**As a** project user,
**I want** to view and edit task details in a slide-out panel,
**So that** I can manage tasks without leaving the current view.

**Acceptance Criteria:**

**Given** I click a task in any view
**When** the panel slides open
**Then** I see: title (editable inline), description (rich text), status dropdown, priority dropdown, assignee selector, due date picker, story points input

**And** activity timeline at bottom

**And** close button returns to previous view

**And** URL updates to include taskId for direct linking

**Prerequisites:** PM-02.1

**Technical Notes:**
- Slide-over panel (right side, 480px wide)
- Auto-save on field blur

---

### Story PM-02.3: Quick Task Capture

**As a** project user,
**I want** to create tasks quickly with a keyboard shortcut,
**So that** I can capture ideas without friction.

**Acceptance Criteria:**

**Given** I am on any project page
**When** I press `c` key
**Then** quick capture modal opens with: title input (focused), phase dropdown (current phase default), "Create" and "Create & Open" buttons

**And** Enter creates task and closes modal

**And** Shift+Enter creates and opens detail panel

**And** Escape closes without creating

**Prerequisites:** PM-02.1

**Technical Notes:**
- Global keyboard listener on project pages
- Minimal fields for speed

---

### Story PM-02.4: Task Type & Priority

**As a** project user,
**I want** to classify tasks by type and priority,
**So that** I can organize and filter work.

**Acceptance Criteria:**

**Given** I am editing a task
**When** I set type
**Then** options are: Epic, Story, Task, Subtask, Bug, Research, Content, Agent Review

**And** each type has distinct icon and color

**And** priority options: Urgent (red), High (orange), Medium (yellow), Low (blue), None (gray)

**And** filters in list/kanban support type and priority

**Prerequisites:** PM-02.2

**Technical Notes:**
- TaskType and TaskPriority enums in schema

---

### Story PM-02.5: Task Hierarchy

**As a** project user,
**I want** to create parent-child task relationships,
**So that** I can break down work into subtasks.

**Acceptance Criteria:**

**Given** a task exists
**When** I click "Add Subtask" in task panel
**Then** new task is created with parentId set

**And** parent task shows subtask count and completion percentage

**And** maximum 3 levels: Epic → Story → Task/Subtask

**And** completing all children auto-suggests completing parent

**Prerequisites:** PM-02.2

**Technical Notes:**
- Self-referential relation on Task model
- Roll-up calculations for progress

---

### Story PM-02.6: Task Relations

**As a** project user,
**I want** to link related tasks,
**So that** I can track dependencies and connections.

**Acceptance Criteria:**

**Given** I am in task detail panel
**When** I click "Add Relation"
**Then** I can select relation type: Blocks, Blocked By, Relates To, Duplicates

**And** I can search/select target task

**And** relations display in panel with links to related tasks

**And** "Blocked" tasks show warning badge

**Prerequisites:** PM-02.2

**Technical Notes:**
- TaskRelation model with sourceTaskId, targetTaskId, relationType

---

### Story PM-02.7: Task Assignment

**As a** project user,
**I want** to assign tasks to team members or agents,
**So that** work is distributed and tracked.

**Acceptance Criteria:**

**Given** I am editing task assignment
**When** I open assignee selector
**Then** I see: team members (with avatars), agents (with AI badge), "Unassigned" option

**And** selecting member sets assigneeId

**And** selecting agent sets agentId and assignmentType=AGENT

**And** can set both for HYBRID assignment

**Prerequisites:** PM-02.2, PM-01.8

**Technical Notes:**
- AssignmentType enum: HUMAN, AGENT, HYBRID

---

### Story PM-02.8: Task States & Workflow

**As a** project user,
**I want** tasks to follow a configurable workflow,
**So that** task progress is tracked consistently.

**Acceptance Criteria:**

**Given** default task states exist
**When** I change task status
**Then** options are: Backlog, Todo, In Progress, Review, Awaiting Approval, Done, Cancelled

**And** state change logs to activity

**And** moving to Done sets completedAt timestamp

**And** kanban columns map to state groups

**Prerequisites:** PM-02.1

**Technical Notes:**
- TaskStatus enum with default states
- Future: custom states per project (Phase 2)

---

### Story PM-02.9: Task Labels

**As a** project user,
**I want** to tag tasks with labels,
**So that** I can categorize and filter by custom criteria.

**Acceptance Criteria:**

**Given** I am in task detail panel
**When** I click "Add Label"
**Then** I can select existing labels or create new

**And** labels have name and color

**And** multiple labels per task allowed

**And** filter by label in list/kanban views

**Prerequisites:** PM-02.2

**Technical Notes:**
- TaskLabel model with name, color

---

### Story PM-02.10: Task Attachments

**As a** project user,
**I want** to attach files to tasks,
**So that** relevant documents are accessible.

**Acceptance Criteria:**

**Given** I am in task detail panel
**When** I drag/drop or click "Attach File"
**Then** file uploads with progress indicator

**And** supported: images, PDFs, docs (50MB max per file)

**And** attachments list shows name, size, uploader, date

**And** click to download/preview

**Prerequisites:** PM-02.2

**Technical Notes:**
- TaskAttachment model
- Upload to S3/compatible storage
- 1GB storage limit per project

---

### Story PM-02.11: Task Activity Log

**As a** project user,
**I want** to see task history,
**So that** I understand what changed and when.

**Acceptance Criteria:**

**Given** I am viewing task detail
**When** I scroll to activity section
**Then** I see chronological log: status changes, assignments, comments, field edits

**And** each entry shows: user avatar, action description, timestamp

**And** comments are inline-editable by author

**And** "Add comment" input at bottom

**Prerequisites:** PM-02.2

**Technical Notes:**
- TaskActivity model with type enum
- TaskComment model for threaded comments

---

## Epic PM-03: Views & Navigation

**Goal:** Users can visualize work in list, kanban, and calendar formats with powerful filtering and saved views.

**FRs Covered:** FR-4.1-4.3, FR-4.5

---

### Story PM-03.1: List View

**As a** project user,
**I want** to see tasks in a sortable table,
**So that** I can scan and manage many tasks efficiently.

**Acceptance Criteria:**

**Given** I am on project Tasks tab with List view selected
**When** the view loads
**Then** I see table with columns: checkbox, task number, title, status, priority, assignee, due date

**And** column headers are clickable for sorting

**And** bulk select via checkboxes enables bulk actions bar

**And** pagination at 50 rows with "Load More"

**And** column visibility toggle in view settings

**Prerequisites:** PM-02.1

**Technical Notes:**
- Use TanStack Table
- Virtualization for performance

---

### Story PM-03.2: Kanban Board

**As a** project user,
**I want** to see tasks in a kanban board,
**So that** I can visualize workflow and drag tasks between states.

**Acceptance Criteria:**

**Given** I select Kanban view
**When** the board loads
**Then** I see columns for each status (Backlog, Todo, In Progress, Review, Done)

**And** tasks appear as cards with: type icon, title, priority badge, assignee avatar

**And** agent-assigned tasks show AI badge

**And** drag-drop moves task between columns (updates status)

**And** card count per column in header

**Prerequisites:** PM-02.8

**Technical Notes:**
- Use @dnd-kit for drag-drop
- Optimistic updates with rollback on error

---

### Story PM-03.3: Kanban Grouping Options

**As a** project user,
**I want** to group kanban by different criteria,
**So that** I can see work from different perspectives.

**Acceptance Criteria:**

**Given** I am on Kanban view
**When** I click "Group By" dropdown
**Then** options are: Status (default), Priority, Assignee, Type, Phase

**And** selecting option re-renders board with new columns

**And** "Unassigned" column for null values

**And** WIP limits can be set per column (visual warning when exceeded)

**Prerequisites:** PM-03.2

**Technical Notes:**
- Store grouping preference in saved view

---

### Story PM-03.4: Calendar View

**As a** project user,
**I want** to see tasks on a calendar,
**So that** I can manage deadlines visually.

**Acceptance Criteria:**

**Given** I select Calendar view
**When** the view loads
**Then** I see month calendar with tasks on due dates

**And** tasks show as colored bars (by priority)

**And** click task opens detail panel

**And** drag task to new date updates dueDate

**And** week and day views available

**Prerequisites:** PM-02.1

**Technical Notes:**
- Use FullCalendar or custom implementation
- Filter by assignee

---

### Story PM-03.5: Filter Bar

**As a** project user,
**I want** to filter tasks by multiple criteria,
**So that** I can focus on relevant work.

**Acceptance Criteria:**

**Given** I am on any task view
**When** I interact with filter bar
**Then** I can filter by: status (multi-select), priority, assignee, type, labels, due date range, phase

**And** active filters show as chips

**And** "Clear All" resets filters

**And** filter state persists in URL (shareable)

**Prerequisites:** PM-03.1

**Technical Notes:**
- URL params: ?status=TODO,IN_PROGRESS&assignee=user_123

---

### Story PM-03.6: Saved Views

**As a** project user,
**I want** to save filter/sort combinations,
**So that** I can quickly access common views.

**Acceptance Criteria:**

**Given** I have filters applied
**When** I click "Save View"
**Then** modal prompts for view name

**And** I can mark as default view

**And** saved views appear in view dropdown

**And** I can share view (makes public to team)

**And** edit/delete saved views

**Prerequisites:** PM-03.5

**Technical Notes:**
- SavedView model stores filters, sort, columns as JSON

---

### Story PM-03.7: View Switcher

**As a** project user,
**I want** to switch between view types easily,
**So that** I can use the best visualization for my current task.

**Acceptance Criteria:**

**Given** I am on Tasks tab
**When** I use view switcher
**Then** toggle buttons for: List, Kanban, Calendar

**And** view preference persists per user per project

**And** filters persist across view switches

**Prerequisites:** PM-03.1, PM-03.2, PM-03.4

**Technical Notes:**
- Store preference in localStorage and user settings

---

### Story PM-03.8: Search & Command Bar

**As a** project user,
**I want** to search tasks and navigate quickly,
**So that** I can find anything fast.

**Acceptance Criteria:**

**Given** I press `Cmd/Ctrl + K`
**When** command bar opens
**Then** I can: search tasks by title/number, navigate to pages, run quick actions (create task, switch view)

**And** recent items shown by default

**And** results update as I type (debounced)

**Prerequisites:** PM-02.1

**Technical Notes:**
- Extend existing CommandBar component
- Index tasks for fast search

---

## Epic PM-04: AI Team - Navi, Sage, Chrono

**Goal:** Users get AI-powered orchestration, estimation, and time tracking assistance.

**FRs Covered:** FR-5.1-5.4, FR-6.3 (partial)

---

### Story PM-04.1: Navi Agent Foundation

**As a** project user,
**I want** Navi as my PM orchestration assistant,
**So that** I get contextual help managing my project.

**Acceptance Criteria:**

**Given** I am on a project page
**When** I open the chat panel
**Then** Navi is available with PM context

**And** Navi can answer questions about project status

**And** Navi can suggest actions based on context

**And** Navi uses project KB for context (RAG)

**Prerequisites:** PM-01.5

**Technical Notes:**
- Agno agent in `agents/platform/navi/`
- Tools: get_project_status, list_tasks, search_kb

---

### Story PM-04.2: Navi Suggestion Mode

**As a** project user,
**I want** Navi to suggest actions without auto-executing,
**So that** I stay in control.

**Acceptance Criteria:**

**Given** suggestionMode is enabled (default)
**When** Navi suggests creating a task
**Then** preview card shows: proposed title, description, assignee

**And** buttons: "Create", "Edit & Create", "Dismiss"

**And** suggestion history is logged for learning

**Prerequisites:** PM-04.1

**Technical Notes:**
- ApprovalItem integration for suggestions
- Confidence score determines suggestion vs auto

---

### Story PM-04.3: Navi Chat Commands

**As a** project user,
**I want** to give Navi natural language commands,
**So that** I can manage tasks conversationally.

**Acceptance Criteria:**

**Given** I type in Navi chat
**When** I say "Create a task for reviewing the API design"
**Then** Navi parses intent and shows preview

**And** commands supported: create task, update task, move to phase, assign to, set priority

**And** multi-step conversations maintain context

**Prerequisites:** PM-04.1

**Technical Notes:**
- Intent parsing via LLM
- Tool calls for actions

---

### Story PM-04.4: Navi Daily Briefing

**As a** project user,
**I want** a morning summary of my project status,
**So that** I start the day informed.

**Acceptance Criteria:**

**Given** daily briefing is enabled in preferences
**When** I log in (or at configured time)
**Then** notification shows with expandable briefing:
- Tasks due today
- Overdue tasks
- Blockers detected
- Recent team activity
- AI recommendations

**And** one-click actions for common responses

**And** can snooze or dismiss

**Prerequisites:** PM-04.1

**Technical Notes:**
- Cron job generates briefing at configured time
- Notification via WebSocket + email (optional)

---

### Story PM-04.5: Sage Agent - Task Estimation

**As a** project user,
**I want** AI-powered task estimates,
**So that** I can plan more accurately.

**Acceptance Criteria:**

**Given** I create or edit a task
**When** task has description and type
**Then** Sage suggests: story points, estimated hours, confidence level (low/medium/high)

**And** basis shown: "Based on similar tasks in this project"

**And** prominent "Override" button to set manual estimate

**And** cold-start message for new projects: "Limited data - estimate may vary"

**Prerequisites:** PM-02.2

**Technical Notes:**
- Agno agent in `agents/platform/sage/`
- Uses historical task data when available

---

### Story PM-04.6: Sage Estimation Learning

**As a** platform,
**I want** Sage to learn from actual vs estimated,
**So that** estimates improve over time.

**Acceptance Criteria:**

**Given** a task is completed
**When** actual time is recorded
**Then** Sage compares actual vs estimated

**And** adjusts future estimates based on patterns

**And** project-specific learning (not cross-project)

**Prerequisites:** PM-04.5

**Technical Notes:**
- Store estimation accuracy metrics
- Rolling average adjustments

---

### Story PM-04.7: Chrono Agent - Time Tracking

**As a** project user,
**I want** to track time spent on tasks,
**So that** I can measure effort and improve estimates.

**Acceptance Criteria:**

**Given** I am working on a task
**When** I click "Start Timer" in task panel
**Then** timer starts with elapsed time display

**And** timer persists across page navigation

**And** "Stop" logs time entry with optional note

**And** manual time entry also available

**And** time entries visible in task activity

**Prerequisites:** PM-02.2

**Technical Notes:**
- TimeEntry model (to be added if not exists)
- Timer state in localStorage + sync to server

---

### Story PM-04.8: Chrono Time Reports

**As a** project lead,
**I want** to see time reports,
**So that** I can understand where time is spent.

**Acceptance Criteria:**

**Given** time has been tracked
**When** I view Chrono reports
**Then** I see: time by task, time by phase, time by team member

**And** compare estimated vs actual

**And** export to CSV

**Prerequisites:** PM-04.7

**Technical Notes:**
- Aggregate queries on TimeEntry

---

### Story PM-04.9: Agent Panel UI

**As a** project user,
**I want** a unified agent interaction panel,
**So that** I can easily access AI assistants.

**Acceptance Criteria:**

**Given** I am on a project page
**When** I click the chat icon
**Then** panel slides open with agent selector: Navi (orchestration), Sage (estimation), Chrono (time)

**And** conversation history per agent per project

**And** typing indicator when agent is thinking

**And** can minimize panel while keeping active

**Prerequisites:** PM-04.1

**Technical Notes:**
- Shared AgentPanel component
- WebSocket for real-time responses

---

## Epic PM-05: AI Team - Scope, Pulse, Herald

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

## Epic PM-06: Real-Time & Notifications

**Goal:** Users get live updates, presence awareness, and configurable notifications.

**FRs Covered:** FR-7, FR-8.2

---

### Story PM-06.1: WebSocket Infrastructure

**As a** platform developer,
**I want** WebSocket event broadcasting for PM events,
**So that** UI updates in real-time.

**Acceptance Criteria:**

**Given** existing WebSocket gateway
**When** PM events occur (task CRUD, status change, etc.)
**Then** events broadcast to subscribed clients

**And** events are room-scoped (workspace, project)

**And** event types: pm.task.*, pm.phase.*, pm.project.*

**Prerequisites:** Platform WebSocket (complete)

**Technical Notes:**
- Extend existing gateway in `apps/api/src/gateway/`
- Use Redis pub/sub for multi-instance

---

### Story PM-06.2: Real-Time UI Updates

**As a** project user,
**I want** the UI to update without refresh,
**So that** I see changes from teammates immediately.

**Acceptance Criteria:**

**Given** I am viewing project tasks
**When** another user updates a task
**Then** my view updates automatically

**And** optimistic updates for my own actions

**And** conflict handling (notify if concurrent edit)

**Prerequisites:** PM-06.1

**Technical Notes:**
- React Query cache invalidation on WS events
- Toast for external changes

---

### Story PM-06.3: Agent Activity Streaming

**As a** project user,
**I want** to see agent work in progress,
**So that** I know what AI is doing.

**Acceptance Criteria:**

**Given** an agent is processing a request
**When** work is in progress
**Then** UI shows: agent status indicator, current step description, progress percentage (if known)

**And** completion notification with results

**Prerequisites:** PM-06.1

**Technical Notes:**
- Agent progress events via WebSocket
- Loading state in agent panel

---

### Story PM-06.4: Presence Indicators

**As a** project user,
**I want** to see who else is viewing the project,
**So that** I'm aware of team activity.

**Acceptance Criteria:**

**Given** multiple users on same project
**When** I view project header
**Then** shows avatars of active users (last 5 minutes)

**And** tooltip shows full list

**And** shows which view each user is on

**Prerequisites:** PM-06.1

**Technical Notes:**
- Presence heartbeat every 30 seconds
- Redis for presence tracking

---

### Story PM-06.5: Notification Preferences

**As a** platform user,
**I want** to configure my notification preferences,
**So that** I get relevant alerts without noise.

**Acceptance Criteria:**

**Given** I am in user settings
**When** I configure notifications
**Then** I can toggle per event type: task assigned, task mentioned, due date reminder, agent completion, health alert

**And** per channel: in-app, email, (future: Slack)

**And** quiet hours setting (no notifications between X and Y)

**And** digest option (batch non-urgent into daily email)

**Prerequisites:** Platform notifications (complete)

**Technical Notes:**
- Extend NotificationPreference model
- Respect preferences in notification service

---

### Story PM-06.6: In-App Notification Center

**As a** platform user,
**I want** a notification inbox,
**So that** I can see and manage all alerts.

**Acceptance Criteria:**

**Given** I click notification bell
**When** dropdown opens
**Then** shows: unread notifications (highlighted), read notifications, "Mark all read" button

**And** click notification navigates to source

**And** unread count badge on bell icon

**And** infinite scroll with pagination

**Prerequisites:** PM-06.5

**Technical Notes:**
- Extend existing notification UI
- Filter by type

---

## Epic KB-01: Knowledge Base Foundation

**Goal:** Users can create wiki pages, organize them hierarchically, and link them to projects.

**FRs Covered:** KB-F1, KB-F2, KB-F3

---

### Story KB-01.1: KB Data Model & API

**As a** platform developer,
**I want** KnowledgePage CRUD API,
**So that** users can manage wiki content.

**Acceptance Criteria:**

**Given** KnowledgePage Prisma model
**When** I POST /api/kb/pages
**Then** page is created with: title, slug (auto-generated), content (empty JSON), parentId (optional)

**And** GET /api/kb/pages returns tree structure

**And** GET /api/kb/pages/:id returns page with content

**And** PATCH /api/kb/pages/:id updates fields

**And** DELETE soft-deletes (30-day recovery)

**Prerequisites:** Schema (complete)

**Technical Notes:**
- NestJS module in `apps/api/src/modules/kb/`
- Events: `kb.page.created`, `kb.page.updated`, `kb.page.deleted`

---

### Story KB-01.2: Page Version History

**As a** KB user,
**I want** page version history,
**So that** I can see changes and restore previous versions.

**Acceptance Criteria:**

**Given** page content is updated
**When** save occurs
**Then** new PageVersion record created with content snapshot

**And** GET /api/kb/pages/:id/versions returns version list

**And** GET /api/kb/pages/:id/versions/:version returns specific version

**And** POST /api/kb/pages/:id/versions/:version/restore reverts page

**Prerequisites:** KB-01.1

**Technical Notes:**
- Version created on significant changes (not every keystroke)
- Diff view between versions (Phase 2)

---

### Story KB-01.3: Rich Text Editor (Tiptap)

**As a** KB user,
**I want** a rich text editor for pages,
**So that** I can create formatted content.

**Acceptance Criteria:**

**Given** I am editing a page
**When** editor loads
**Then** I can: format text (bold, italic, underline, strike), create headings (H1-H4), create lists (bullet, numbered, checklist), add links, add code blocks, add tables (basic)

**And** toolbar shows formatting options

**And** keyboard shortcuts work (Cmd+B for bold, etc.)

**And** content saved as Tiptap JSON

**Prerequisites:** KB-01.1

**Technical Notes:**
- Tiptap with StarterKit extension
- Content stored as JSON in content field

---

### Story KB-01.4: Page Auto-Save

**As a** KB user,
**I want** automatic saving,
**So that** I don't lose work.

**Acceptance Criteria:**

**Given** I am editing a page
**When** I pause typing (2 seconds)
**Then** content auto-saves

**And** "Saving..." indicator shows during save

**And** "Saved" indicator confirms completion

**And** manual save via Cmd+S also works

**And** unsaved changes warning on navigation

**Prerequisites:** KB-01.3

**Technical Notes:**
- Debounced save (2 seconds)
- contentText extracted from JSON for FTS

---

### Story KB-01.5: Page Tree Navigation

**As a** KB user,
**I want** a sidebar tree showing page hierarchy,
**So that** I can navigate the knowledge base.

**Acceptance Criteria:**

**Given** I am on KB section
**When** sidebar loads
**Then** shows collapsible tree of pages

**And** current page highlighted

**And** drag-drop to reorder/reparent

**And** right-click context menu: New Subpage, Rename, Delete

**And** "New Page" button at root level

**Prerequisites:** KB-01.1

**Technical Notes:**
- Recursive tree component
- Optimistic reordering

---

### Story KB-01.6: Breadcrumb Navigation

**As a** KB user,
**I want** breadcrumbs showing page hierarchy,
**So that** I know where I am.

**Acceptance Criteria:**

**Given** I am viewing a nested page
**When** breadcrumbs render
**Then** shows: KB Home > Parent > Current Page

**And** each segment is clickable

**And** truncates middle segments if too long

**Prerequisites:** KB-01.5

**Technical Notes:**
- Build path from parent chain

---

### Story KB-01.7: KB Full-Text Search

**As a** KB user,
**I want** to search page content,
**So that** I can find information quickly.

**Acceptance Criteria:**

**Given** I am on KB section
**When** I type in search box
**Then** results show pages matching query

**And** highlights matching text snippets

**And** results ranked by relevance

**And** recent searches saved

**Prerequisites:** KB-01.1

**Technical Notes:**
- PostgreSQL tsvector on contentText
- ts_headline for snippets

---

### Story KB-01.8: Recent Pages & Favorites

**As a** KB user,
**I want** quick access to recent and favorite pages,
**So that** I can return to important content.

**Acceptance Criteria:**

**Given** I view the KB sidebar
**When** I look at quick access section
**Then** shows: Recent (last 10 viewed), Favorites (starred pages)

**And** star icon on page to add to favorites

**And** click recent/favorite navigates to page

**Prerequisites:** KB-01.5

**Technical Notes:**
- viewCount and lastViewedAt on KnowledgePage
- Favorites in user preferences

---

### Story KB-01.9: Project-KB Linking

**As a** project user,
**I want** to link KB pages to projects,
**So that** documentation is connected to work.

**Acceptance Criteria:**

**Given** I am on a KB page
**When** I click "Link to Project"
**Then** modal shows project list to select

**And** page appears in project Docs tab

**And** can mark one page as "Primary" for project

**And** backlinks section shows linked projects

**Prerequisites:** KB-01.1, PM-01.5

**Technical Notes:**
- ProjectPage join table
- isPrimary flag for main doc

---

### Story KB-01.10: Project Docs Tab

**As a** project user,
**I want** to see linked KB pages in project,
**So that** I access documentation in context.

**Acceptance Criteria:**

**Given** I am on project Docs tab
**When** tab loads
**Then** shows: Primary doc (if set) prominently, other linked pages list, "Link Existing Page" button, "Create New Page" button (auto-links)

**And** click opens page in KB section

**Prerequisites:** KB-01.9

**Technical Notes:**
- Tab in project detail page
- Filter ProjectPage by projectId

---

# PHASE 2 EPICS

---

## Epic KB-02: KB Real-Time & RAG

**Goal:** Users get collaborative editing with live cursors and AI-powered semantic search.

**FRs Covered:** KB-F4, KB-F6

---

### Story KB-02.1: Hocuspocus Server Setup

**As a** platform developer,
**I want** Yjs/Hocuspocus server for real-time editing,
**So that** multiple users can edit simultaneously.

**Acceptance Criteria:**

**Given** Hocuspocus dependencies installed
**When** server starts
**Then** WebSocket endpoint available for Yjs sync

**And** authentication via JWT

**And** document state persisted to yjsState column

**And** debounced save to PostgreSQL (5 seconds)

**Prerequisites:** KB-01.1

**Technical Notes:**
- Hocuspocus in `apps/api/src/modules/kb/hocuspocus/`
- Separate port or path for WS

---

### Story KB-02.2: Collaborative Editor Integration

**As a** KB user,
**I want** to edit pages with others simultaneously,
**So that** we can collaborate in real-time.

**Acceptance Criteria:**

**Given** multiple users open same page
**When** one user types
**Then** other users see changes immediately

**And** no conflicts (CRDT handles merging)

**And** offline edits sync when reconnected

**Prerequisites:** KB-02.1

**Technical Notes:**
- Tiptap Collaboration extension
- IndexedDB for offline persistence

---

### Story KB-02.3: Cursor Presence

**As a** KB user,
**I want** to see other users' cursors,
**So that** I know where they're editing.

**Acceptance Criteria:**

**Given** multiple users editing
**When** user moves cursor
**Then** others see colored cursor with name label

**And** selection highlighting visible

**And** user list shows who's currently editing

**Prerequisites:** KB-02.2

**Technical Notes:**
- Tiptap CollaborationCursor extension
- Color generated from userId

---

### Story KB-02.4: Offline Editing Support

**As a** KB user,
**I want** to edit pages offline,
**So that** I can work without connectivity.

**Acceptance Criteria:**

**Given** I lose network connection
**When** I continue editing
**Then** changes saved locally (IndexedDB)

**And** "Offline" indicator shows

**And** on reconnect, changes sync automatically

**And** conflicts resolved via CRDT

**Prerequisites:** KB-02.2

**Technical Notes:**
- y-indexeddb provider
- Network status detection

---

### Story KB-02.5: pgvector Setup & Migration

**As a** platform developer,
**I want** pgvector extension enabled,
**So that** we can store embeddings for RAG.

**Acceptance Criteria:**

**Given** PostgreSQL database
**When** migration runs
**Then** vector extension enabled

**And** PageEmbedding table created with vector column

**And** ivfflat index created for fast similarity search

**Prerequisites:** KB-01.1

**Technical Notes:**
- CREATE EXTENSION IF NOT EXISTS vector
- Index with lists=100 for MVP scale

---

### Story KB-02.6: Embedding Generation Pipeline

**As a** platform,
**I want** automatic embedding generation on page save,
**So that** pages are searchable semantically.

**Acceptance Criteria:**

**Given** page content is saved
**When** content differs from last embedding
**Then** text extracted and chunked (512 tokens, 50 overlap)

**And** embeddings generated via tenant's BYOAI config

**And** stored in PageEmbedding table

**And** old embeddings replaced

**Prerequisites:** KB-02.5

**Technical Notes:**
- Background job for embedding generation
- Queue to avoid blocking saves

---

### Story KB-02.7: Semantic Search

**As a** KB user,
**I want** to search by meaning not just keywords,
**So that** I find relevant content even with different wording.

**Acceptance Criteria:**

**Given** pages have embeddings
**When** I search "how to deploy"
**Then** results include pages about "deployment process" and "release workflow"

**And** results ranked by vector similarity

**And** verified pages boosted (1.5x)

**And** hybrid search: combines FTS + semantic

**Prerequisites:** KB-02.6

**Technical Notes:**
- POST /api/kb/search/semantic
- Cosine similarity with pgvector

---

### Story KB-02.8: Agent KB Context API

**As a** platform agent,
**I want** to query KB for relevant context,
**So that** I can provide informed responses.

**Acceptance Criteria:**

**Given** agent needs context
**When** agent calls RAG API
**Then** returns top-k relevant chunks

**And** formatted context string ready for LLM

**And** source citations included

**Prerequisites:** KB-02.7

**Technical Notes:**
- POST /api/kb/rag/query
- Used by Navi and other agents

---

## Epic KB-03: KB Verification & Scribe Agent

**Goal:** Users get verified content marking and AI-powered KB management.

**FRs Covered:** KB-F5, KB-F7

---

### Story KB-03.1: Verification System

**As a** KB user,
**I want** to mark pages as verified,
**So that** AI prioritizes authoritative content.

**Acceptance Criteria:**

**Given** I am page owner or admin
**When** I click "Mark as Verified"
**Then** dropdown shows expiration options: 30, 60, 90 days, never

**And** page shows verified badge with expiry date

**And** verified pages get 1.5x boost in search

**Prerequisites:** KB-01.1

**Technical Notes:**
- isVerified, verifiedAt, verifyExpires fields
- POST /api/kb/pages/:id/verify

---

### Story KB-03.2: Verification Expiration

**As a** platform,
**I want** verification to expire,
**So that** outdated content is flagged.

**Acceptance Criteria:**

**Given** page has verifyExpires date
**When** date is reached
**Then** page flagged as "Verification Expired"

**And** owner notified

**And** page still searchable but with warning badge

**And** stale pages list shows expired verifications

**Prerequisites:** KB-03.1

**Technical Notes:**
- Daily cron job checks expirations
- Notification to page owner

---

### Story KB-03.3: Re-verification Workflow

**As a** page owner,
**I want** easy re-verification,
**So that** I can keep content current.

**Acceptance Criteria:**

**Given** page verification expired
**When** I review the page
**Then** "Re-verify" button available

**And** can update expiration period

**And** activity log shows re-verification

**Prerequisites:** KB-03.2

**Technical Notes:**
- Same verify endpoint, updates timestamps

---

### Story KB-03.4: Stale Content Dashboard

**As a** KB admin,
**I want** to see pages needing review,
**So that** I can maintain KB quality.

**Acceptance Criteria:**

**Given** I navigate to /kb/stale
**When** dashboard loads
**Then** shows: expired verifications, pages not updated in 90+ days, pages with low view count

**And** bulk actions: verify, delete, assign for review

**Prerequisites:** KB-03.2

**Technical Notes:**
- Query filters for stale detection

---

### Story KB-03.5: @Mention Support

**As a** KB user,
**I want** to @mention users in pages,
**So that** I can reference team members.

**Acceptance Criteria:**

**Given** I type "@" in editor
**When** autocomplete shows
**Then** I can search and select team members

**And** mention renders as clickable chip

**And** mentioned user notified

**Prerequisites:** KB-01.3

**Technical Notes:**
- Tiptap Mention extension
- PageMention model stores mentions

---

### Story KB-03.6: #Task Reference Support

**As a** KB user,
**I want** to reference tasks in pages,
**So that** I can link documentation to work.

**Acceptance Criteria:**

**Given** I type "#" in editor
**When** autocomplete shows
**Then** I can search tasks by number or title

**And** reference renders as clickable chip (#PM-123)

**And** click navigates to task

**Prerequisites:** KB-01.3, PM-02.1

**Technical Notes:**
- Custom Tiptap extension for task references
- PageMention with mentionType=TASK

---

### Story KB-03.7: Scribe Agent Foundation

**As a** platform,
**I want** Scribe agent for KB management,
**So that** AI helps maintain documentation.

**Acceptance Criteria:**

**Given** Scribe is active
**When** asked about KB
**Then** can: create pages from context, summarize existing pages, detect stale content, suggest structure improvements

**And** all actions require human approval

**Prerequisites:** KB-01.1

**Technical Notes:**
- Agno agent in `agents/platform/scribe/`
- Tools: create_page, update_page, search_kb, analyze_structure

---

## Epic PM-07: Integrations & Bridge Agent

**Goal:** Users can import/export data and connect to external tools.

**FRs Covered:** FR-8.1, FR-8.3, FR-8.4

---

### Story PM-07.1: CSV Export

**As a** project user,
**I want** to export tasks to CSV,
**So that** I can share data externally.

**Acceptance Criteria:**

**Given** I am on task list
**When** I click "Export CSV"
**Then** modal shows field selection

**And** download generates with selected fields

**And** respects current filters

**Prerequisites:** PM-03.1

**Technical Notes:**
- Server-side CSV generation
- Stream for large exports

---

### Story PM-07.2: CSV Import

**As a** project user,
**I want** to import tasks from CSV,
**So that** I can migrate from other tools.

**Acceptance Criteria:**

**Given** I click "Import CSV"
**When** wizard opens
**Then** step 1: upload file, step 2: column mapping, step 3: preview & validate, step 4: import with progress

**And** validation errors shown per row

**And** can skip or fix invalid rows

**Prerequisites:** PM-02.1

**Technical Notes:**
- Batch import with transaction
- Template download available

---

### Story PM-07.3: Bridge Agent Foundation

**As a** platform,
**I want** Bridge agent for external integrations,
**So that** AI manages cross-tool sync.

**Acceptance Criteria:**

**Given** Bridge is active
**When** integration is configured
**Then** Bridge monitors external changes

**And** suggests updates to PM tasks

**And** all sync actions require approval

**Prerequisites:** PM-06.1

**Technical Notes:**
- Agno agent in `agents/platform/bridge/`
- Webhook handlers for external events

---

### Story PM-07.4: GitHub Integration

**As a** project user,
**I want** tasks linked to GitHub PRs,
**So that** development work is tracked.

**Acceptance Criteria:**

**Given** GitHub integration configured
**When** PR includes task number (PM-123) in branch or description
**Then** task shows PR link

**And** PR merge can auto-complete task (optional)

**And** PR status visible in task panel

**Prerequisites:** PM-07.3

**Technical Notes:**
- GitHub OAuth + webhooks
- Branch naming convention: feature/PM-123-description

---

### Story PM-07.5: Jira Import Wizard

**As a** new user,
**I want** to import from Jira,
**So that** I can migrate my existing projects.

**Acceptance Criteria:**

**Given** I start Jira import
**When** wizard opens
**Then** step 1: Jira connection, step 2: project selection, step 3: field mapping, step 4: import with progress

**And** maps: Epic→Epic, Story→Story, Bug→Bug, etc.

**And** preserves hierarchy and relations

**Prerequisites:** PM-07.3

**Technical Notes:**
- Jira REST API integration
- Batch import with rate limiting

---

### Story PM-07.6: Asana/Trello Import

**As a** new user,
**I want** to import from Asana or Trello,
**So that** I can migrate easily.

**Acceptance Criteria:**

**Given** I select import source
**When** wizard completes
**Then** tasks imported with: title, description, assignee (if mapped), due date, status

**And** labels preserved where possible

**Prerequisites:** PM-07.3

**Technical Notes:**
- OAuth for each platform
- Similar wizard flow to Jira

---

### Story PM-07.7: Integration Settings UI

**As a** workspace admin,
**I want** to manage integrations,
**So that** I control external connections.

**Acceptance Criteria:**

**Given** I am in workspace settings
**When** I view Integrations tab
**Then** shows: available integrations with connect/disconnect, connected integrations with status, configuration options per integration

**Prerequisites:** PM-07.3

**Technical Notes:**
- Store credentials encrypted
- Connection health check

---

## Epic PM-08: Prism Agent & Predictive Analytics

**Goal:** Users get AI-powered trend analysis and predictive insights.

**FRs Covered:** FR-6 (advanced)

---

### Story PM-08.1: Prism Agent Foundation

**As a** platform,
**I want** Prism agent for predictive analytics,
**So that** AI provides forward-looking insights.

**Acceptance Criteria:**

**Given** sufficient project history
**When** Prism analyzes data
**Then** generates: completion predictions, risk forecasts, trend analysis

**And** explains reasoning

**And** confidence levels shown

**Prerequisites:** PM-05.7

**Technical Notes:**
- Agno agent in `agents/platform/prism/`
- Requires minimum data threshold

---

### Story PM-08.2: Completion Predictions

**As a** project lead,
**I want** predicted completion dates,
**So that** I can plan accurately.

**Acceptance Criteria:**

**Given** project has velocity history
**When** Prism predicts
**Then** shows: predicted end date, confidence range (optimistic/pessimistic), factors affecting prediction

**And** updates as velocity changes

**Prerequisites:** PM-08.1

**Technical Notes:**
- Based on velocity and remaining work
- Monte Carlo simulation for ranges

---

### Story PM-08.3: Risk Forecasting

**As a** project lead,
**I want** predicted risks,
**So that** I can mitigate before they occur.

**Acceptance Criteria:**

**Given** project patterns analyzed
**When** risks identified
**Then** shows: predicted risk, probability, potential impact, suggested mitigation

**And** auto-creates RiskEntry (pending approval)

**Prerequisites:** PM-08.1

**Technical Notes:**
- Pattern matching from historical data
- Cross-project learning (same workspace)

---

### Story PM-08.4: Trend Dashboards

**As a** project lead,
**I want** trend visualizations,
**So that** I understand project trajectory.

**Acceptance Criteria:**

**Given** I view analytics
**When** trends load
**Then** shows: velocity trend (4 weeks), scope trend, completion rate trend, team productivity trend

**And** anomaly highlighting

**And** drill-down to details

**Prerequisites:** PM-08.1

**Technical Notes:**
- Charts with trend lines
- Statistical significance indicators

---

### Story PM-08.5: What-If Scenarios

**As a** project lead,
**I want** to model scenarios,
**So that** I can plan for changes.

**Acceptance Criteria:**

**Given** I open scenario planner
**When** I adjust variables
**Then** shows impact on: completion date, resource needs, risk levels

**And** variables: add/remove scope, change team size, adjust velocity

**Prerequisites:** PM-08.1

**Technical Notes:**
- Interactive sliders
- Real-time recalculation

---

### Story PM-08.6: Analytics Export

**As a** project lead,
**I want** to export analytics,
**So that** I can share with stakeholders.

**Acceptance Criteria:**

**Given** I am viewing analytics
**When** I click export
**Then** options: PDF report, CSV data, image (chart)

**And** scheduled exports available

**Prerequisites:** PM-08.4

**Technical Notes:**
- PDF generation with charts
- Scheduled via cron

---

## Epic PM-09: Advanced Views

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

# PHASE 3 EPICS

---

## Epic KB-04: AI-Native Knowledge Base

**Goal:** Users get AI-powered documentation generation, Q&A, and gap detection.

**FRs Covered:** KB-F8

---

### Story KB-04.1: AI Page Drafts

**As a** KB user,
**I want** AI to draft pages from context,
**So that** documentation is faster to create.

**Acceptance Criteria:**

**Given** I click "AI Draft"
**When** I describe what I need
**Then** Scribe generates page draft

**And** draft appears in editor for review/edit

**And** sources cited if based on existing KB

**Prerequisites:** KB-03.7

**Technical Notes:**
- Uses project context + existing KB
- Human edits before publish

---

### Story KB-04.2: Smart Summarization

**As a** KB user,
**I want** AI summaries of long pages,
**So that** I can quickly understand content.

**Acceptance Criteria:**

**Given** I view a long page
**When** I click "Summarize"
**Then** AI generates TL;DR summary

**And** can insert summary at top of page

**And** key points bullet list

**Prerequisites:** KB-03.7

**Technical Notes:**
- On-demand summarization
- Cache summary until page changes

---

### Story KB-04.3: Q&A Chat Interface

**As a** KB user,
**I want** to chat with the KB,
**So that** I can ask questions naturally.

**Acceptance Criteria:**

**Given** I open KB chat
**When** I ask a question
**Then** AI answers using KB content

**And** sources cited with links

**And** follow-up questions maintain context

**And** "Not found" if no relevant content

**Prerequisites:** KB-02.8

**Technical Notes:**
- RAG-powered chat
- Conversation history

---

### Story KB-04.4: Knowledge Extraction

**As a** Scribe agent,
**I want** to extract docs from completed tasks,
**So that** knowledge is captured automatically.

**Acceptance Criteria:**

**Given** task with significant description/comments completed
**When** Scribe detects knowledge opportunity
**Then** suggests creating KB page from task content

**And** draft page pre-filled

**And** requires human approval

**Prerequisites:** KB-04.1

**Technical Notes:**
- Triggered on task completion
- Filters for meaningful content

---

### Story KB-04.5: Gap Detection

**As a** KB admin,
**I want** AI to identify documentation gaps,
**So that** I know what's missing.

**Acceptance Criteria:**

**Given** I run gap analysis
**When** Scribe analyzes
**Then** shows: topics mentioned but not documented, frequently asked but no page, outdated pages (based on product changes)

**And** suggestions for new pages

**Prerequisites:** KB-03.7

**Technical Notes:**
- Cross-reference with project/task data
- Natural language analysis

---

### Story KB-04.6: KB Templates

**As a** KB user,
**I want** page templates,
**So that** I create consistent documentation.

**Acceptance Criteria:**

**Given** I create new page
**When** I select template
**Then** page pre-filled with: structure, headings, placeholder content

**And** templates: Meeting Notes, Decision Record, Process Doc, Technical Spec

**And** custom templates creatable

**Prerequisites:** KB-01.1

**Technical Notes:**
- Template stored as page with isTemplate flag
- Copy on use

---

## Epic PM-10: Workflow Builder

**Goal:** Users can create custom workflows and automations for their projects.

---

### Story PM-10.1: Workflow Builder UI

**As a** project admin,
**I want** a visual workflow builder,
**So that** I can create custom automations.

**Acceptance Criteria:**

**Given** I open workflow builder
**When** I design workflow
**Then** can add: triggers (task created, status changed, etc.), conditions (if status = X), actions (assign, notify, update field)

**And** drag-drop interface

**And** preview execution path

**Prerequisites:** PM-02.8

**Technical Notes:**
- Node-based editor
- Store as JSON workflow definition

---

### Story PM-10.2: Workflow Triggers

**As a** workflow designer,
**I want** various trigger options,
**So that** workflows start automatically.

**Acceptance Criteria:**

**Given** I select trigger
**When** choosing options
**Then** available: task created, task status changed, task assigned, due date approaching, custom schedule

**And** filter conditions per trigger

**Prerequisites:** PM-10.1

**Technical Notes:**
- Event bus integration for triggers

---

### Story PM-10.3: Workflow Actions

**As a** workflow designer,
**I want** various action options,
**So that** workflows do useful things.

**Acceptance Criteria:**

**Given** I add action
**When** choosing options
**Then** available: update task field, assign task, send notification, create related task, move to phase, call webhook

**And** action chaining

**Prerequisites:** PM-10.1

**Technical Notes:**
- Action executor service
- Rate limiting for webhook calls

---

### Story PM-10.4: Workflow Testing

**As a** workflow designer,
**I want** to test workflows before activating,
**So that** I verify behavior.

**Acceptance Criteria:**

**Given** workflow is designed
**When** I click "Test"
**Then** can select sample task

**And** shows simulated execution

**And** no actual changes made

**Prerequisites:** PM-10.1

**Technical Notes:**
- Dry-run mode
- Visual execution trace

---

### Story PM-10.5: Workflow Management

**As a** project admin,
**I want** to manage active workflows,
**So that** I control automations.

**Acceptance Criteria:**

**Given** workflows exist
**When** I view workflow list
**Then** shows: name, trigger, status (active/paused), last run

**And** can activate/pause workflows

**And** execution history with logs

**Prerequisites:** PM-10.1

**Technical Notes:**
- Workflow execution logging
- Error handling and retry

---

## Epic PM-11: External API & Governance

**Goal:** Developers can access PM functionality via REST API with proper governance.

---

### Story PM-11.1: REST API Design

**As a** platform developer,
**I want** documented REST API for PM,
**So that** external systems can integrate.

**Acceptance Criteria:**

**Given** API design complete
**When** documented
**Then** covers: projects CRUD, phases CRUD, tasks CRUD, views, search

**And** OpenAPI 3.0 spec

**And** versioned (v1)

**Prerequisites:** PM-02.1

**Technical Notes:**
- Extend existing API patterns
- Rate limiting per API key

---

### Story PM-11.2: API Authentication

**As a** API consumer,
**I want** secure authentication,
**So that** my integrations are protected.

**Acceptance Criteria:**

**Given** API key exists
**When** making API calls
**Then** authenticate via: API key in header, OAuth 2.0 for user context

**And** scoped permissions per key

**And** key management in settings

**Prerequisites:** PM-11.1

**Technical Notes:**
- Extend existing ApiKey model
- Scope: pm:read, pm:write, pm:admin

---

### Story PM-11.3: Webhook Configuration

**As a** project admin,
**I want** to configure webhooks,
**So that** external systems receive events.

**Acceptance Criteria:**

**Given** I configure webhook
**When** events occur
**Then** POST request sent to configured URL

**And** event types: task.created, task.updated, task.completed, phase.transitioned

**And** retry on failure (3 attempts)

**And** webhook logs for debugging

**Prerequisites:** PM-06.1

**Technical Notes:**
- Webhook delivery queue
- Signature verification (HMAC)

---

### Story PM-11.4: API Documentation Portal

**As a** developer,
**I want** interactive API docs,
**So that** I can explore and test.

**Acceptance Criteria:**

**Given** I access /api/docs
**When** docs load
**Then** shows: endpoint list, request/response examples, "Try It" functionality, authentication guide

**Prerequisites:** PM-11.1

**Technical Notes:**
- Swagger UI or Redoc
- Auto-generated from OpenAPI spec

---

### Story PM-11.5: API Rate Limiting & Governance

**As a** platform admin,
**I want** API rate limiting,
**So that** the platform stays performant.

**Acceptance Criteria:**

**Given** API is used
**When** limits exceeded
**Then** 429 response with retry-after header

**And** default: 1000 requests/hour per key

**And** configurable per workspace plan

**And** usage dashboard in settings

**Prerequisites:** PM-11.1

**Technical Notes:**
- Redis-based rate limiting
- Usage metrics tracking

---

# Summary

## FR Coverage Matrix (Validated)

All Functional Requirements from PRD and KB Specification are covered:

| Phase | FRs Covered | Stories |
|-------|-------------|---------|
| MVP | FR-1 through FR-7, KB-F1 through KB-F3 | 61 |
| Phase 2 | FR-8, KB-F4 through KB-F7 | 34 |
| Phase 3 | KB-F8, Custom Workflows, API | 16 |

## Epic Dependencies

```
PM-01 → PM-02 → PM-03
         ↓
       PM-04 → PM-05 → PM-06

KB-01 → KB-02 → KB-03 → KB-04

PM-07, PM-08, PM-09 (parallel after PM-06)
PM-10, PM-11 (parallel after PM-09)
```

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document will evolve as implementation progresses. Stories may be split, merged, or reordered based on discoveries during development._
