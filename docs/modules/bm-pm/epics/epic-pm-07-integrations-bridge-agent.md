# Epic PM-07: Integrations & Bridge Agent

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
