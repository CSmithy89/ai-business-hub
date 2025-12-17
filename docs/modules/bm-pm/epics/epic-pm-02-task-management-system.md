# Epic PM-02: Task Management System

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
