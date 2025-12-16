# BM-PM Module - Research Findings

**Purpose:** Comprehensive research findings to inform the BM-PM (Project Management) Module PRD
**Status:** Complete
**Created:** 2025-11-30
**Sources:** Plane Analysis, Taskosaur Analysis, Agno Analysis, docs/archive/foundation-phase/MODULE-RESEARCH.md, MASTER-PLAN.md

---

## Executive Summary

This document consolidates research findings for the BM-PM module across 9 key areas identified in the research checklist. Each section provides:
- Research findings based on analyzed patterns (Plane, Taskosaur, Agno)
- Recommended decisions for AI Business Hub
- Specific implementation guidance

**Key Decisions Made:**
1. **Hierarchy**: Business → Project → Phase → Task (adapting Plane's Workspace → Project → Cycle → Issue)
2. **Issue Types**: Epic, Story, Task, Subtask, Bug, Research, Content (AI-specific additions)
3. **States**: Global state groups with project-level customization
4. **Views**: List, Kanban, Calendar, Timeline for MVP (Spreadsheet/Gantt post-MVP)
5. **Real-time**: WebSocket for MVP, defer Y.js/Hocuspocus to Phase 2
6. **AI Agents**: PM Orchestrator (Navigator), Estimation Agent, Reporting Agent

---

## 1. Project & Workspace Hierarchy

### Research Findings

**Plane Pattern:**
```
Workspace → Project → Module/Cycle → Issue → Sub-Issue
```

**Taskosaur Pattern:**
```
Organization → Workspace → Project → Sprint → Task → Subtask
```

**BM-PM Recommended Pattern:**
```
Business (Tenant) → Project → Phase → Task → Subtask
```

### Hierarchy Structure Decision

| Level | Entity | Description | Key Fields |
|-------|--------|-------------|------------|
| 1 | **Business** | Tenant/organization | slug, name, aiConfig, billing, branding |
| 2 | **Project** | Deliverable being built | template_type (Course, Podcast, SaaS), agent_team |
| 3 | **Phase** | BMAD phase or sprint | phase_type, start_date, end_date, progress_snapshot |
| 4 | **Task** | Work item (human or agent) | assignment_type, assigned_agent, confidence |
| 5 | **Subtask** | Child of task | parent_task_id |

### Questions Answered

**Q1: One workspace per tenant or multiple?**
- **Answer:** One Business per tenant. Multiple Projects per Business.
- **Rationale:** Simpler billing, RBAC, and data isolation. Projects provide natural grouping.

**Q2: Can issues exist without a project?**
- **Answer:** No. All Tasks must belong to a Project.
- **Rationale:** Orphaned tasks complicate reporting and access control.

**Q3: How do we handle issue movement between projects?**
- **Answer:** Support task move with `moved_to_project`, `moved_from_project` tracking.
- **Pattern:** Plane's `moved_to_page`, `moved_to_project` pattern.

**Q4: What's the maximum hierarchy depth?**
- **Answer:** 5 levels (Business → Project → Phase → Task → Subtask)
- **Rationale:** Sub-subtasks add complexity without significant value.

### Project Configuration

```typescript
interface Project {
  id: string;
  businessId: string;
  name: string;
  identifier: string; // e.g., "PROD", "COURSE", max 12 chars
  description: string;

  // BMAD Template
  templateType: 'course' | 'podcast' | 'saas' | 'website' | 'custom';

  // Feature toggles (from Plane pattern)
  phaseViewEnabled: boolean;
  timeTrackingEnabled: boolean;
  intakeViewEnabled: boolean; // Agent output triage

  // Defaults
  defaultAssignee?: string;
  projectLead?: string;
  defaultState?: string;
  estimateType?: string;

  // Agent configuration
  agentTeam: AgentTeamConfig;
  autoApprovalThreshold: number; // 0.0-1.0

  // Archival
  archiveInMonths: number;
  archivedAt?: Date;
}
```

### Project Templates

MVP templates based on BMAD method:
1. **Course Creation** - 7 BUILD phases + OPERATE loops
2. **Podcast Launch** - Content planning → Production → Distribution
3. **SaaS Product** - Discovery → Design → Development → Launch
4. **Custom** - User-defined phases

Each template includes:
- Default phases with suggested durations
- Default task types
- Suggested agent team configuration

### Workspace Settings

```typescript
interface Business {
  id: string;
  slug: string; // URL-friendly unique identifier
  name: string;
  logo?: string;
  timezone: string;

  // BYOAI Configuration (from Taskosaur pattern)
  aiConfig: {
    defaultProvider: 'openai' | 'anthropic' | 'openrouter';
    apiKeys: Record<string, EncryptedKey>;
    defaultModel: string;
    monthlyBudget?: number;
    currentSpend: number;
  };

  // Members
  members: BusinessMember[];

  // Settings
  settings: {
    workingDays: number[]; // 0=Sun, 1=Mon, etc.
    defaultPhaseTemplate: string;
    defaultApprovalTimeout: number; // hours
  };
}
```

### Issue Templates

**Recommended Templates:**

| Template | Fields | Use Case |
|----------|--------|----------|
| Bug Report | repro_steps, expected, actual, severity | Development issues |
| Feature Request | user_story, acceptance_criteria | Product enhancements |
| Agent Task | agent_id, prompt, expected_output, confidence_threshold | AI work items |
| Research Task | research_questions, sources, deliverable | Discovery phase |
| Content Task | content_type, word_count, tone, audience | Content creation |

---

## 2. Issue Management

### Research Findings

**Plane Issue Model:**
- 50+ fields including hierarchy, estimates, dates, custom fields
- Binary storage for Y.js collaborative editing
- Soft delete with `deleted_at`
- External source tracking for imports

**Taskosaur Task Model:**
- TaskType enum (TASK, BUG, EPIC, STORY, SUBTASK)
- Priority enum (LOWEST, LOW, MEDIUM, HIGH, HIGHEST)
- Story points and time estimates
- Custom fields via JSON

### Issue Entity Design

```typescript
interface AgentTask {
  id: string;
  projectId: string;
  phaseId?: string;

  // Core fields
  title: string;
  description: string;
  descriptionHtml: string;

  // Classification
  type: TaskType;
  priority: TaskPriority;
  state: string; // State ID

  // Hierarchy
  parentTaskId?: string;

  // Assignment (BM-PM specific)
  assignmentType: 'HUMAN' | 'AGENT' | 'HYBRID';
  assignees: string[]; // User IDs
  assignedAgent?: string; // Agent config ID

  // Agent-specific (BM-PM specific)
  agentConfidence?: number; // 0.0-1.0
  autoApproved: boolean;
  approvalThreshold: number;
  agentOutput?: {
    type: 'draft' | 'suggestion' | 'analysis';
    content: string;
    generatedAt: Date;
  };

  // Estimates
  storyPoints?: number;
  originalEstimateMinutes?: number;
  remainingEstimateMinutes?: number;

  // Dates
  startDate?: Date;
  targetDate?: Date;
  completedAt?: Date;

  // Relationships (M2M)
  labels: string[];

  // Ordering
  sequenceId: number; // Auto-increment per product
  sortOrder: number;

  // External tracking
  externalSource?: string;
  externalId?: string;

  // Audit
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete
  archivedAt?: Date;
  isDraft: boolean;
}

enum TaskType {
  EPIC = 'epic',
  STORY = 'story',
  TASK = 'task',
  SUBTASK = 'subtask',
  BUG = 'bug',
  // AI-specific types
  RESEARCH = 'research',
  CONTENT = 'content',
  AGENT_REVIEW = 'agent_review',
}

enum TaskPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none',
}
```

### Issue States & Workflow

**State Groups (from Plane):**

```typescript
enum StateGroup {
  BACKLOG = 'backlog',
  UNSTARTED = 'unstarted',
  STARTED = 'started',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  TRIAGE = 'triage', // For agent output review
}
```

**Default States:**

| State | Group | Color | Description |
|-------|-------|-------|-------------|
| Backlog | backlog | #60646C | Not prioritized |
| Todo | unstarted | #60646C | Ready to start |
| In Progress | started | #F59E0B | Active work |
| In Review | started | #8B5CF6 | Human review |
| Awaiting Approval | started | #3B82F6 | Agent output pending approval |
| Done | completed | #46A758 | Completed |
| Cancelled | cancelled | #9AA4BC | Won't do |
| Triage | triage | #4E5355 | Agent submissions |

**State Scope:**
- Global state groups (fixed)
- Project-level custom states (can add states per group)
- Default states auto-created for new products

### Issue Relations

**Relation Types (from Plane):**

```typescript
enum IssueRelationType {
  DUPLICATE = 'duplicate',
  RELATES_TO = 'relates_to',
  BLOCKED_BY = 'blocked_by',
  BLOCKING = 'blocking',
  START_BEFORE = 'start_before',
  START_AFTER = 'start_after',
  FINISH_BEFORE = 'finish_before',
  FINISH_AFTER = 'finish_after',
  // AI-specific
  DEPENDS_ON_APPROVAL = 'depends_on_approval',
  GENERATED_BY = 'generated_by', // Agent task created this
}
```

**Bidirectional Pairs:**
- blocked_by ↔ blocking
- relates_to ↔ relates_to (symmetric)
- duplicate ↔ duplicate (symmetric)
- start_before ↔ start_after
- generated_by ↔ generates

### Rich Content

**Editor Features (from Plane):**
- Markdown support with live preview
- Y.js binary storage for collaboration (Phase 2)
- File attachments with S3/R2 storage
- Image embedding (drag-drop, paste)
- Code blocks with syntax highlighting
- Mentions: @user, #task, [[product]]

**Storage:**
```typescript
interface TaskDescription {
  description: JSON; // Structured content
  descriptionHtml: string; // Rendered HTML
  descriptionStripped: string; // Plain text for search
  descriptionBinary?: Buffer; // Y.js document (Phase 2)
}
```

### Questions Answered

**Q1: What issue types are required for MVP?**
- EPIC, STORY, TASK, SUBTASK, BUG, RESEARCH, CONTENT, AGENT_REVIEW

**Q2: Should states be global or per-project?**
- Global state groups with per-project custom states within groups

**Q3: How do we handle issue versioning/history?**
- Activity log for all changes (from Plane pattern)
- Optional: Full version history for agent-generated content

**Q4: Maximum attachment size and storage limits?**
- 50MB per file, 1GB per product (MVP), configurable per plan

---

## 3. Sprint & Cycle Management

### Research Findings

**Plane Cycles:**
- Cycle entity with start/end dates
- CycleIssue junction table (M2M)
- Progress snapshot JSON for analytics caching
- View props for display customization

**Taskosaur Sprints:**
- Sprint tied to Project
- Fixed duration sprints
- Velocity tracking

### BM-PM Phase Entity

```typescript
interface Phase {
  id: string;
  projectId: string;
  name: string;
  description: string;

  // BMAD Phase Type
  phaseType: BMadPhaseType;
  phaseTemplate?: string; // Template used

  // Timing
  startDate?: Date;
  endDate?: Date;
  timezone: string;

  // Owner
  ownedBy: string;

  // Progress
  progressSnapshot: {
    totalTasks: number;
    completedTasks: number;
    totalPoints: number;
    completedPoints: number;
    agentTasks: number;
    humanTasks: number;
    pendingApprovals: number;
    lastUpdated: Date;
  };

  // Display
  viewProps: Record<string, any>;
  sortOrder: number;

  // Status
  status: 'upcoming' | 'current' | 'completed' | 'cancelled';
  archivedAt?: Date;
}

enum BMadPhaseType {
  // BUILD Phases
  PHASE_1_BRIEF = 'build_1_brief',
  PHASE_2_RESEARCH = 'build_2_research',
  PHASE_3_DESIGN = 'build_3_design',
  PHASE_4_DEVELOP = 'build_4_develop',
  PHASE_5_TEST = 'build_5_test',
  PHASE_6_REVIEW = 'build_6_review',
  PHASE_7_LAUNCH = 'build_7_launch',

  // OPERATE Loops
  OPERATE_MAINTAIN = 'operate_maintain',
  OPERATE_ITERATE = 'operate_iterate',
  OPERATE_SCALE = 'operate_scale',

  // Custom
  CUSTOM_SPRINT = 'custom_sprint',
  CUSTOM_MILESTONE = 'custom_milestone',
}
```

### Phase-Task Junction

```typescript
interface PhaseTask {
  id: string;
  phaseId: string;
  taskId: string;
  addedAt: Date;
  addedBy: string;
}
```

### Questions Answered

**Q1: Fixed-length sprints or flexible cycles?**
- **Answer:** Flexible. BMAD phases have suggested durations but not enforced.
- Support both date-based and milestone-based phases.

**Q2: Can one issue span multiple cycles?**
- **Answer:** No. Task belongs to one phase at a time.
- If task extends, carry over to next phase with link to original.

**Q3: How do we handle incomplete work at sprint end?**
- Options at phase close:
  1. Auto-carry to next phase
  2. Move to backlog
  3. Mark as cancelled
- Track "spillover" metric for reporting

**Q4: Do we need release/version tracking separate from cycles?**
- **Answer:** Not for MVP. Phase 7 (Launch) serves as release marker.
- Future: Add Release entity if versioning needed.

### Sprint Planning

- Sprint backlog: Tasks in phase with status != completed
- Project backlog: Tasks not in any phase
- Capacity: Sum of story points for assigned team members
- Velocity: Average completed points per phase

### Sprint Execution

- Burndown/burnup charts per phase
- Daily progress tracking via progress_snapshot
- Agent progress visible in real-time

---

## 4. Views & Filters

### Research Findings

**Plane Views:**
- IssueView model with filters, display_filters, display_properties
- JSON-based filter storage
- Public/private view access
- Lock views from editing

**Taskosaur:**
- Kanban, List, Calendar, Gantt views
- Filter by any field
- Saved views per user

### View Types for MVP

| View | Priority | Description |
|------|----------|-------------|
| List | P0 | Table with sortable columns |
| Kanban | P0 | Drag-drop board by status |
| Calendar | P1 | Due date visualization |
| Timeline | P2 | Gantt-style for dependencies |
| Spreadsheet | P2 | Excel-like bulk editing |

### Filter System

```typescript
interface ViewFilters {
  // Entity filters
  priority: string[] | null;
  state: string[] | null;
  stateGroup: string[] | null;
  assignees: string[] | null;
  assignedAgent: string[] | null;
  createdBy: string[] | null;
  labels: string[] | null;
  type: string[] | null;

  // Date filters
  startDate: DateFilter | null;
  targetDate: DateFilter | null;
  createdAt: DateFilter | null;

  // Agent-specific
  assignmentType: ('HUMAN' | 'AGENT' | 'HYBRID')[] | null;
  confidenceRange: { min: number; max: number } | null;
  needsApproval: boolean | null;
}

interface DateFilter {
  type: 'before' | 'after' | 'between' | 'this_week' | 'this_month';
  value: string | { start: string; end: string };
}
```

### Display Filters

```typescript
interface DisplayFilters {
  groupBy: 'state' | 'priority' | 'assignee' | 'type' | 'phase' | 'none';
  subGroupBy: string | null;
  orderBy: '-created_at' | 'created_at' | '-priority' | 'target_date' | 'sort_order';
  layout: 'list' | 'kanban' | 'calendar' | 'timeline' | 'spreadsheet';
  showEmptyGroups: boolean;
  showSubIssues: boolean;
  calendarDateRange: string;
}
```

### Display Properties

```typescript
interface DisplayProperties {
  key: boolean; // Task ID (e.g., PROD-123)
  state: boolean;
  priority: boolean;
  assignee: boolean;
  dueDate: boolean;
  startDate: boolean;
  labels: boolean;
  estimate: boolean;
  createdOn: boolean;
  updatedOn: boolean;
  subIssueCount: boolean;
  attachmentCount: boolean;
  linkCount: boolean;
  // Agent-specific
  assignmentType: boolean;
  confidence: boolean;
  agentStatus: boolean;
}
```

### Saved Views

```typescript
interface SavedView {
  id: string;
  name: string;
  description?: string;

  // Scope
  projectId?: string; // null = workspace-level

  // View configuration
  filters: ViewFilters;
  displayFilters: DisplayFilters;
  displayProperties: DisplayProperties;

  // Access
  access: 'private' | 'public';
  ownedBy: string;
  isLocked: boolean;

  // Ordering
  sortOrder: number;

  // Visual
  logoProps: Record<string, any>;
}
```

### Default Views

Pre-configured views for new products:
1. **All Tasks** - List view, no filters
2. **My Tasks** - Assigned to current user
3. **Active Sprint** - Current phase tasks
4. **Agent Queue** - Tasks assigned to agents
5. **Pending Approvals** - Awaiting human review
6. **Blocked** - Tasks with blockers

### Questions Answered

**Q1: Which views are required for MVP?**
- List, Kanban, Calendar (Timeline as P2)

**Q2: Can views be shared across projects?**
- Yes, via workspace-level views (projectId = null)

**Q3: How do we handle view performance with large datasets?**
- Pagination (50 items default)
- Virtual scrolling for Kanban
- Progressive loading for Timeline

**Q4: Do we need a "favorites" or "starred" concept?**
- Yes. Favorites for views, products, and tasks.

---

## 5. AI Agent Behaviors for PM

### Research Findings

**Agno Framework:**
- Multi-agent teams with memory sharing
- Tool definitions and permissions
- Async task execution
- Streaming responses

**BMAD Agents:**
- Specialized personas (PM, Architect, Developer)
- Phase-specific workflows
- Task orchestration

**IAssistantClient Pattern (from remote-coding-agent):**
- Streaming async generators
- Session persistence
- Multi-provider support

### PM Agent Architecture

```
┌─────────────────────────────────────────────────────┐
│                PM Agent Team                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐    ┌──────────────┐               │
│  │  Navigator   │    │   Sentinel   │               │
│  │  (Orchestr.) │    │  (Approval)  │               │
│  └──────┬───────┘    └──────┬───────┘               │
│         │                    │                       │
│         ▼                    ▼                       │
│  ┌──────────────┐    ┌──────────────┐               │
│  │  Estimator   │    │  Reporter    │               │
│  │              │    │              │               │
│  └──────────────┘    └──────────────┘               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Agent Definitions

**Navigator (PM Orchestrator)**
```typescript
interface NavigatorAgent {
  id: 'pm-orchestrator';
  name: 'Navigator';
  persona: 'Strategic project manager with product sense';

  capabilities: [
    'task_triage',
    'sprint_planning_assist',
    'workload_balancing',
    'deadline_risk_detection',
    'dependency_analysis',
  ];

  tools: [
    'create_task',
    'update_task',
    'assign_task',
    'move_to_phase',
    'create_phase',
    'suggest_breakdown',
  ];

  triggers: [
    { event: 'phase_started', action: 'suggest_task_breakdown' },
    { event: 'task_overdue', action: 'alert_and_suggest' },
    { event: 'workload_imbalanced', action: 'suggest_rebalance' },
  ];
}
```

**Estimation Agent**
```typescript
interface EstimatorAgent {
  id: 'pm-estimator';
  name: 'Estimator';
  persona: 'Data-driven estimation specialist';

  capabilities: [
    'story_point_estimation',
    'historical_velocity_analysis',
    'estimation_confidence_scoring',
    'scope_creep_detection',
    'complexity_analysis',
  ];

  tools: [
    'analyze_task_complexity',
    'suggest_estimate',
    'compare_to_historical',
    'flag_uncertainty',
  ];
}
```

**Reporting Agent**
```typescript
interface ReporterAgent {
  id: 'pm-reporter';
  name: 'Reporter';
  persona: 'Insightful analytics and reporting specialist';

  capabilities: [
    'status_report_generation',
    'burndown_analysis',
    'blocker_identification',
    'progress_summaries',
    'risk_highlighting',
  ];

  tools: [
    'generate_daily_standup',
    'generate_sprint_report',
    'identify_blockers',
    'calculate_velocity',
    'forecast_completion',
  ];
}
```

### Cross-Agent Coordination

| PM Agent | Interacts With | Purpose |
|----------|----------------|---------|
| Navigator | CRM Orchestrator | Link projects to deals/contacts |
| Navigator | Content agents | Create content tasks from PM |
| Estimator | All agents | Complexity scoring for any task |
| Reporter | Analytics module | Pull metrics, generate reports |

### Proactivity Level

**Passive Mode (Default):**
- Respond to direct commands
- Surface insights when asked

**Active Mode (Opt-in):**
- Daily standup summary
- Deadline risk alerts (48h before due)
- Workload imbalance notifications
- Sprint completion forecasts

### Auto-Create from Chat

```typescript
// User says: "Add a task to research competitor pricing"
// Navigator parses intent and creates:
{
  type: 'RESEARCH',
  title: 'Research competitor pricing',
  assignmentType: 'AGENT', // Auto-detect
  suggestedAssignee: 'analyst-agent',
  confidence: 0.85,
  needsApproval: true, // Below auto-threshold
}
```

### Questions Answered

**Q1: Which PM agent is highest priority?**
- Navigator (orchestration), then Reporter, then Estimator

**Q2: How proactive should PM agents be?**
- Default passive, active mode opt-in per product

**Q3: Should agents auto-create issues from chat?**
- Yes, with confirmation step unless confidence > threshold

**Q4: How do agents surface blockers and risks?**
- In-app notifications + optional Slack/email
- Blocking badge on affected tasks
- Risk section in daily/weekly reports

---

## 6. Integrations & Imports

### Research Findings

**Plane Integrations:**
- GitHub/GitLab for PR linking
- External source tracking on issues
- Webhook support

**Taskosaur Integrations:**
- IMAP email sync
- Webhook handling
- OAuth connection management

### Import Sources (MVP Priority)

| Source | Priority | Pattern |
|--------|----------|---------|
| CSV/Spreadsheet | P0 | Column mapping UI |
| Jira | P1 | API import with field mapping |
| Trello | P1 | Board/list/card mapping |
| GitHub Issues | P2 | Issue + PR linking |
| Asana | P2 | Project/task mapping |

### Import Data Model

```typescript
interface ImportJob {
  id: string;
  projectId: string;
  source: 'csv' | 'jira' | 'trello' | 'github' | 'asana';
  status: 'pending' | 'mapping' | 'importing' | 'completed' | 'failed';

  // Configuration
  sourceConfig: {
    // Source-specific auth and project selection
  };

  fieldMapping: Record<string, string>; // source field → BM-PM field

  // Progress
  totalItems: number;
  importedItems: number;
  failedItems: number;

  // Results
  importLog: ImportLogEntry[];
}
```

### Developer Integrations

**GitHub/GitLab Integration:**
- PR linking to tasks via branch name (e.g., `feature/PROD-123-add-login`)
- Commit message parsing (`fixes #123`, `closes PROD-123`)
- PR status on task card
- Auto-update task status on PR merge

```typescript
interface GitIntegration {
  projectId: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  repositoryUrl: string;

  // Patterns
  branchPattern: string; // e.g., "{type}/{task_id}-{slug}"
  commitPattern: RegExp; // e.g., /(?:fixes|closes)\s*#?(\d+)/i

  // Automation
  autoTransitionOnPR: boolean;
  prOpenedState: string;
  prMergedState: string;
}
```

### Communication Integrations

| Channel | MVP | Features |
|---------|-----|----------|
| Slack | P1 | Notifications, commands |
| Email | P1 | Notifications |
| Teams | P2 | Notifications |
| Webhooks | P0 | Custom integrations |

### Webhook System

```typescript
interface Webhook {
  id: string;
  projectId: string;
  url: string;
  secret: string; // For signature verification

  events: WebhookEvent[];

  // Status
  enabled: boolean;
  lastTriggeredAt?: Date;
  failureCount: number;
}

type WebhookEvent =
  | 'task.created' | 'task.updated' | 'task.deleted'
  | 'task.state_changed' | 'task.assigned'
  | 'phase.created' | 'phase.completed'
  | 'approval.required' | 'approval.resolved';
```

### Questions Answered

**Q1: Which integrations are must-have for MVP?**
- CSV import, Webhooks, Email notifications

**Q2: Do we build native GitHub or use Zapier?**
- Native GitHub integration (high value, clear patterns from Plane)
- Zapier/Make for long-tail integrations

**Q3: How do we handle import data mapping?**
- UI-based column mapping with preview
- Save mapping templates for reuse

**Q4: Real-time sync or manual import?**
- Manual import for MVP, real-time sync as enhancement

---

## 7. Real-Time Collaboration

### Research Findings

**Plane Real-Time:**
- Y.js + Hocuspocus for collaborative editing
- Redis pub/sub for horizontal scaling
- Binary document storage

**Taskosaur Real-Time:**
- Socket.io for events
- Room-based subscriptions
- Presence tracking

### MVP Approach

**Use WebSocket (Socket.io) for:**
- Task updates (create, update, delete)
- Status changes
- Comment additions
- Agent activity streaming
- Presence indicators

**Defer Y.js/Hocuspocus for:**
- Collaborative task description editing
- Simultaneous cursor visibility

### WebSocket Architecture

```typescript
// Room hierarchy (from Taskosaur pattern)
client.join(`business:${businessId}`);
client.join(`project:${projectId}`);
client.join(`phase:${phaseId}`);
client.join(`task:${taskId}`);

// Event types
type PMSocketEvent =
  | 'task:created' | 'task:updated' | 'task:deleted'
  | 'task:state_changed' | 'task:assigned'
  | 'phase:updated' | 'phase:completed'
  | 'agent:started' | 'agent:progress' | 'agent:completed'
  | 'approval:required' | 'approval:resolved'
  | 'user:joined' | 'user:left';
```

### Presence Tracking

```typescript
interface ProjectPresence {
  projectId: string;
  activeUsers: {
    userId: string;
    userName: string;
    avatar: string;
    currentView: string; // 'kanban', 'task:123', etc.
    lastActivity: Date;
  }[];
}
```

### Offline Support

- **MVP:** No offline support
- **Future:** Service worker for read-only offline viewing, queue actions for sync

### Conflict Resolution

- Last-write-wins for simple fields
- Merge for array fields (labels, assignees)
- Y.js CRDT for description (Phase 2)

### Questions Answered

**Q1: Is real-time collaboration required for MVP?**
- Real-time updates: Yes (via WebSocket)
- Collaborative editing: No (Phase 2)

**Q2: Do we need offline support?**
- Not for MVP

**Q3: How do we handle conflict resolution?**
- Last-write-wins + optimistic updates with rollback

**Q4: What's the expected concurrent user load?**
- MVP: 100 concurrent per product
- Scale: 1000+ with Redis pub/sub

---

## 8. PM User Interface

### Research Findings

**Plane UI:**
- Propel component library (Radix + Tailwind)
- Power-K command palette
- MobX state management
- Contextual actions

**Taskosaur UI:**
- shadcn/ui components
- Slide-out panels
- Drag-and-drop Kanban
- Chat panel integration

### Core Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Project selector | Phase tabs | Search | Avatar     │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│ Sidebar  │                 Main Content                      │
│ --------│                                                   │
│ Projects │  ┌───────────────────────────────────────────┐   │
│ Phases   │  │                                           │   │
│ Views    │  │         Kanban / List / Calendar          │   │
│ Reports  │  │                                           │   │
│ Settings │  │                                           │   │
│          │  └───────────────────────────────────────────┘   │
│          │                                                   │
├──────────┴──────────────────────────────────────────────────┤
│                      Chat Panel (collapsible)                │
└─────────────────────────────────────────────────────────────┘
```

### Kanban Board

- Columns by state or assignee
- Drag-and-drop (pragmatic-drag-and-drop)
- Quick add at column top/bottom
- Card preview: type icon, priority badge, assignee avatar
- Agent tasks: confidence badge, agent icon

### Task Detail View

Slide-out panel (like Plane) with sections:
1. **Header:** Type, ID, title, status dropdown
2. **Properties:** Assignee, priority, dates, phase, estimate
3. **Description:** Rich text editor
4. **Activity:** Timeline of changes, comments
5. **Subtasks:** Nested task list
6. **Relations:** Linked issues
7. **Agent Output:** (if AGENT type) Generated content with approve/reject

### Sprint/Phase View

- Phase header with dates, progress bar
- Sprint backlog (unstarted tasks)
- Active work (started tasks)
- Burndown chart (collapsible)
- Capacity visualization (optional)

### Command Palette

Key sequences (from Plane):
- `c` - Create task
- `p` - Search products
- `gm` - Go to my tasks
- `gp` - Go to phases
- `Cmd+K` - Open palette

### Agent Activity Panel

```typescript
interface AgentActivityItem {
  agentId: string;
  agentName: string;
  taskId: string;
  taskTitle: string;
  status: 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed';
  startedAt: Date;
  progress?: number; // 0-100
  currentStep?: string;
  output?: string;
}
```

### Questions Answered

**Q1: How prominent is chat/agent in PM UI?**
- Collapsible panel at bottom
- Agent activity feed in sidebar or dashboard

**Q2: Mobile/responsive PM requirements?**
- Responsive web MVP (tablet + desktop)
- Mobile app future consideration

**Q3: Dark mode support?**
- Yes, via CSS variables (follow Taskosaur pattern)

**Q4: Customizable dashboard?**
- Phase 2. MVP has fixed dashboard layout.

---

## 9. Reporting & Analytics

### Research Findings

**Plane Analytics:**
- Cycle progress_snapshot caching
- Custom analytics endpoints
- Export capabilities

**Taskosaur:**
- Sprint velocity tracking
- Burndown charts

### Built-In Reports

| Report | Priority | Description |
|--------|----------|-------------|
| Sprint/Phase Burndown | P0 | Remaining work over time |
| Sprint/Phase Burnup | P1 | Completed vs total scope |
| Velocity Trend | P0 | Points completed per phase |
| Cycle Time | P1 | Time from started to done |
| Lead Time | P2 | Time from created to done |
| Workload Distribution | P1 | Tasks per assignee |
| Agent Performance | P0 | Agent task completion, accuracy |
| Approval Metrics | P0 | Approval rate, time-to-approve |

### Analytics Data Model

```typescript
interface PhaseAnalytics {
  phaseId: string;

  // Task counts
  totalTasks: number;
  completedTasks: number;
  cancelledTasks: number;

  // Points
  totalPoints: number;
  completedPoints: number;

  // Time metrics
  averageCycleTime: number; // hours
  averageLeadTime: number;

  // Agent metrics
  agentTasks: number;
  agentCompletedTasks: number;
  agentApprovalRate: number;
  averageConfidence: number;

  // Daily snapshots for charts
  dailySnapshots: {
    date: Date;
    remainingPoints: number;
    completedPoints: number;
    addedPoints: number;
  }[];
}
```

### Dashboards

**Project Dashboard:**
- Active phase progress
- Upcoming deadlines
- Recent activity
- Agent queue status
- Key metrics (velocity, cycle time)

**Portfolio Dashboard (Business-level):**
- Projects overview
- Cross-project metrics
- Resource utilization
- Overall agent performance

### Export Options

- PDF: Sprint report, status summary
- CSV: Task list, metrics data
- API: Full metrics access

### Questions Answered

**Q1: Which reports are required for MVP?**
- Burndown, Velocity, Workload, Agent Performance

**Q2: Do we need a custom report builder?**
- Not for MVP. Fixed reports with filter options.

**Q3: How do reports tie into BMT (Analytics) module?**
- PM events flow to Analytics via event bus
- Analytics module aggregates cross-module insights

**Q4: Real-time vs scheduled report generation?**
- Dashboard: Real-time (cached, 1-minute refresh)
- PDF exports: On-demand generation

---

## Platform Dependencies

| PM Requirement | Platform Feature | Status |
|----------------|------------------|--------|
| Project permissions | RBAC system | Depends on Platform PRD |
| Business isolation | Multi-tenant isolation | Depends on Platform PRD |
| Activity logging | Audit trail | Depends on Platform PRD |
| Agent interactions | Sentinel approval system | Depends on Platform PRD |
| Notifications | Notification system | Depends on Platform PRD |
| Real-time updates | WebSocket infrastructure | Depends on Platform PRD |

---

## BM-CRM Dependencies

| PM Feature | CRM Integration | Notes |
|------------|-----------------|-------|
| Link tasks to contacts | Contact entity | Project can reference deal/contact |
| Customer projects | Company association | Filter projects by company |
| Client billing | Deal pipeline | Track hours against deals |

**Recommendation:** Build BM-CRM first to establish shared entities, or define minimal shared entity interfaces in Platform Foundation.

---

## Implementation Priority

### Phase 1: Core Data Model (Weeks 1-2)
1. Business, Project, Phase, Task entities
2. State management and workflows
3. Basic CRUD APIs
4. Task relations

### Phase 2: Views & UI (Weeks 3-4)
1. List and Kanban views
2. Filter system
3. Task detail panel
4. Navigation and command palette

### Phase 3: Real-Time & Agents (Weeks 5-6)
1. WebSocket events
2. Navigator agent (basic)
3. Approval workflow
4. Agent activity feed

### Phase 4: Integrations & Polish (Weeks 7-8)
1. CSV import
2. Webhook system
3. Reports and analytics
4. Calendar view

---

## Document Status

**Research Complete:** Yes
**Ready for PRD:** Yes
**Next Step:** Create BM-PM PRD using `/bmad:bmm:workflows:prd`

---

**Document Owner:** AI Business Hub Team
**Last Updated:** 2025-11-30
