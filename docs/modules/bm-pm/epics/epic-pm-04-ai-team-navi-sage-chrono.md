# Epic PM-04: AI Team - Navi, Sage, Chrono

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
