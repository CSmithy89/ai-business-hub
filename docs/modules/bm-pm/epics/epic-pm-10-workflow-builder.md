# Epic PM-10: Workflow Builder

**Goal:** Users can create custom workflows and automations for their projects.

## Wireframe References

| Story | Wireframe | Assets |
|-------|-----------|--------|
| PM-10.1: Workflow Builder UI | PM-32 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-32_workflow_builder/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-32_workflow_builder/screen.png) |

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
