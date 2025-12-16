# Project Management Module (BM-PM) - Product Requirements Document

**Module:** BM-PM
**Version:** 1.2
**Author:** AI Business Hub Team
**Created:** 2025-12-15
**Updated:** 2025-12-16
**Status:** Draft (Post-Competitor Research)

---

## Executive Summary

### What We're Building

BM-PM is an AI-powered project management module that transforms how SMB businesses manage their product development lifecycle. Unlike traditional project management tools that simply track tasks, BM-PM provides an **8-agent AI team** that actively manages the PM tool while human teams and other module agents do the actual product building.

### Key Distinction: PM Agents vs Product Teams

```
PM Agent Team (Navi, Sage, Herald, etc.)
├── Manages the PROJECT MANAGEMENT TOOL
├── Handles estimates, reports, planning, tracking
└── Ensures project health and visibility

Product Team (Humans + Module Agents)
├── Actually BUILDS the product
├── Human roles: Lead, Developers, Designers, QA
├── Module agents: CRM agents, Content agents, etc.
└── Orchestrated by Team Leader (human or AI)
```

### Why It Matters

SMB businesses struggle with:
- **Estimation accuracy** - Projects consistently run over time and budget
- **Progress visibility** - Stakeholders lack real-time insight into project health
- **Context switching** - Teams waste time updating multiple tools
- **AI integration** - Existing tools treat AI as an afterthought
- **Team coordination** - Human teams and AI agents work in silos

BM-PM solves these by:
1. Embedding PM agents directly into the workflow
2. Supporting human teams with role-based management
3. Enabling hybrid human + AI task assignments
4. Using BMAD workflows as the core orchestration engine

### What Makes BM-PM Special

1. **BMAD-Native Workflows** - Built on the 7-phase BUILD methodology plus OPERATE loops as the core orchestration engine
2. **8-Agent PM Team** - Comprehensive coverage of all PM functions (estimation, reporting, planning, risk, etc.)
3. **Human + AI Teams** - First-class support for human team roles alongside AI agents
4. **Confidence-Based Routing** - AI outputs flow through the approval queue automatically
5. **Cross-Module Orchestration** - PM agents coordinate with CRM, Content, and Analytics modules
6. **Future Workflow Builder** - BMAD workflows will support user-defined custom workflows

---

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Module ID** | BM-PM |
| **Category** | Operational Module |
| **Complexity** | High |
| **Priority** | P0 (Required for product execution modules) |
| **Estimated Effort** | 10 weeks |
| **Dependencies** | Platform Foundation (complete), BM-CRM (optional integration) |
| **Target Users** | Product Managers, Team Leads, Business Owners, Project Teams |

---

## Success Criteria

### MVP Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Task completion rate | +15% vs manual tracking | Compare pre/post implementation |
| Estimation accuracy | ±25% variance (cold-start), ±15% (calibrated) | Compare estimates to actuals |
| Time to first insight | <30 seconds | AI-generated status reports |
| User adoption | 70% DAU/MAU | Active users tracking tasks |
| Agent task automation | 25% tasks auto-suggested | Navi-generated task suggestions |
| Human team utilization | 80% tasks have human assignee | Role-based assignment tracking |

### Phase 2 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Estimation confidence | 85% accuracy | Historical velocity analysis |
| Proactive risk alerts | 48h lead time | Pulse alerts before deadline miss |
| Cross-module tasks | 40% linked | Tasks linked to CRM/Content |
| Report generation time | <10 seconds | Herald-generated sprint reports |
| Integration sync success | 99% | Bridge GitHub/GitLab operations |

---

## Product Scope

### MVP (Phase 1) - Core Project Management

**Goal:** Functional PM system with 6 AI agents, human team support, and BMAD workflows

#### P0 Features (Must Have)

1. **Product & Phase Management**
   - Business → Product → Phase → Task hierarchy
   - BMAD phase templates (7 BUILD + 3 OPERATE)
   - Custom phase templates (Kanban-only, Simple List)
   - Phase progress tracking with snapshots

2. **Task Management**
   - Full CRUD with soft delete
   - Task types: Epic, Story, Task, Subtask, Bug, Research, Content
   - States: Backlog, Todo, In Progress, Review, Awaiting Approval, Done
   - Story points and time estimates
   - **Quick Capture:** 1-click task creation, keyboard shortcut (`c` key)

3. **Human Team Management**
   - Product team definition with human roles
   - Role types: Product Lead, Developer, Designer, QA, Custom
   - Capacity planning (hours per team member per phase)
   - Role-based task filtering ("My Tasks")

4. **Hybrid Assignments**
   - Tasks can have human assignee + agent assist
   - Assignment types: Human, Agent, Hybrid
   - Agent suggestions in "suggest mode" by default (not auto-create)

5. **MVP Agent Team (6 Agents)**
   - Navi (orchestrator), Sage (estimation), Herald (reporting)
   - Chrono (tracking), Scope (planning), Pulse (risk)

6. **Core Views**
   - List view with sorting/filtering
   - Kanban board by status
   - Product dashboard with metrics

7. **Real-time Updates**
   - WebSocket events for task changes
   - Agent activity streaming
   - Presence indicators

#### P1 Features (Should Have)

1. **Calendar View** - Due date visualization
2. **Notification Controls** - Granular per-event-type preferences
3. **Basic Reports** - Sprint summary, task distribution
4. **Simple Timeline** - Visualization only (no drag-resize)
5. **Visual Dependency Editor** *(Competitor-inspired: Monday, Wrike, OpenProject)*
   - Drag-drop dependency creation on Gantt/Timeline
   - Dependency type selector (FS, SS, FF, SF)
   - Conflict warnings and cycle detection
6. **Planning Poker / Estimation UI** *(Competitor-inspired: Taiga Seed)*
   - Real-time collaborative estimation sessions
   - Reveal-at-once mechanics
   - Voting history and consensus tracking

#### P2 Features (Nice to Have in MVP)

1. **Workload Dashboard** - Cross-product resource view
2. **Simple Mode Toggle** - Hide agent features for light users
3. **CSV Import** - Basic task import with mapping

### Phase 2 - Growth Features

**Goal:** Full agent team, advanced reporting, and integrations

**Features:**
1. **Phase 2 Agents**
   - Bridge (integration manager) - GitHub/GitLab sync
   - Prism (analytics) - Predictive insights

2. **Advanced Views**
   - Timeline/Gantt view with dependencies and drag-resize
   - Saved views and custom filters
   - Executive Portfolio Dashboard (cross-product)
   - Critical path highlighting *(Competitor-inspired: Jira, Wrike)*

3. **Enhanced Reporting**
   - Herald's full report suite (burndown, velocity, forecasts)
   - Stakeholder update generation
   - Export to PDF/CSV
   - **AI-Generated Release Notes** *(Competitor-inspired: ClickUp)*
     - Auto-generate from completed stories in sprint
     - Categorize by type (features, fixes, improvements)
     - Customizable templates

4. **Integrations**
   - **GitHub/GitLab Deep Integration** *(Competitor-inspired: Linear - best-in-class)*
     - Two-way synchronization (bidirectional sync)
     - Branch naming conventions: `feat/PM-123-task-title` auto-links
     - PR auto-linking: PRs referencing task IDs attach automatically
     - Auto-close tasks: PR merge → Task status to Done
     - Commit message parsing: `fixes PM-123` transitions task
     - GitHub Actions triggers: CI/CD events update task status
     - Development panel: See all commits, PRs, branches on task
     - AI commit summaries (Bridge agent generates PR descriptions)
   - Slack notifications
   - Import from Jira/Asana/Trello
   - **MCP Server Implementation** *(Competitor-inspired: Linear, Wrike)*
     - Publish BM-PM as MCP server
     - Tool exposure: tasks, projects, status, estimates
     - Enable external AI agent integration

5. **Budget Tracking**
   - Budget and actual spend fields on Product
   - Cost-per-phase tracking

6. **Sprint Enhancements** *(Competitor-inspired: Linear, Taiga)*
   - Sprint cooldown period (configurable break between sprints)
   - Doom-line projection (visual deadline risk based on velocity)
   - Baseline comparison snapshots (planned vs actual)

### Phase 3 - Vision Features

**Goal:** Custom workflows, advanced analytics, and external API

**Features:**
1. **Workflow Builder**
   - User-defined BMAD workflows
   - Custom phase templates
   - Workflow marketplace

2. **Predictive Analytics (Prism)**
   - ML-based completion forecasting
   - Resource optimization suggestions
   - Quality scoring based on approval patterns

3. **External Integrations**
   - Public REST API
   - Webhooks
   - Zapier integration

4. **Advanced Collaboration**
   - Y.js collaborative editing
   - Task templates library
   - Cross-product dependencies

5. **OKR & Goals Tracking** *(Competitor-inspired: Asana, ClickUp)*
   - Define organizational goals and objectives
   - Link tasks/projects to goals for progress rollup
   - Goal health indicators and status tracking

6. **Enterprise Features** *(Competitor-inspired: OpenProject, Jira)*
   - Portfolio-level dependency tracking
   - Multi-product roadmaps
   - Audit logging and compliance

---

## Agent Team Specification

### PM Agent Team Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PM Agent Team                               │
│              (Manages the PM Tool & Process)                     │
│                                                                  │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │                 Navi (Team Leader)                       │  │
│    │            PM Orchestrator & Coordinator                 │  │
│    │    "I coordinate your PM operations and keep you        │  │
│    │     focused on what matters most."                      │  │
│    └───────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│    ┌───────────┬───────────┼───────────┬───────────┐            │
│    │           │           │           │           │            │
│    ▼           ▼           ▼           ▼           ▼            │
│ ┌──────┐  ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐            │
│ │ Sage │  │Herald│   │Chrono│   │Scope │   │Pulse │            │
│ │      │  │      │   │      │   │      │   │      │            │
│ └──────┘  └──────┘   └──────┘   └──────┘   └──────┘            │
│ Estimator  Reporter   Tracker   Planner    Risk                 │
│                                                                  │
│ ┌──────┐  ┌──────┐                                              │
│ │Bridge│  │Prism │   Phase 2 Agents                             │
│ │      │  │      │                                              │
│ └──────┘  └──────┘                                              │
│ Integrator Analytics                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### MVP Agents (Phase 1)

---

#### 1. Navi - PM Orchestrator (Team Leader)

**Role:** Team leader coordinating all PM operations

**Persona:**
> "I'm Navi, your strategic PM co-pilot. I orchestrate the PM team, route your requests to the right specialist, and ensure nothing falls through the cracks. Ask me anything about your projects."

**Responsibilities:**
- Route user requests to appropriate specialist agent
- Coordinate multi-agent workflows
- Synthesize insights across PM data
- Handle complex queries requiring multiple agents
- Present unified responses to users
- **Suggest** task creation from chat (not auto-create by default)

**Daily Briefing Content (Navi's Morning Summary):**
1. **Today's Focus** - Top 5 prioritized tasks by due date × priority × blocked status
2. **Phase Health** - Current phase progress and any risks (from Pulse)
3. **Stale Tasks Alert** - Tasks without activity in 7+ days (from Chrono)
4. **Upcoming Deadlines** - Tasks due in next 48 hours
5. **Team Workload** - Capacity utilization per team member
6. **Pending Approvals** - Agent outputs awaiting review

**Tools:**
```python
navi_tools = [
    suggest_task,           # Suggest task creation (not auto-create)
    update_task,            # Modify task properties
    assign_task,            # Assign to human or agent
    move_to_phase,          # Move task between phases
    suggest_breakdown,      # Break epic into stories (suggests, doesn't auto-create)
    get_daily_summary,      # Generate morning briefing
    route_to_specialist,    # Delegate to Sage, Herald, etc.
    link_to_crm,            # Link task to CRM contact/deal (optional)
]
```

**Triggers:**
| Event | Action | Approval |
|-------|--------|----------|
| `pm.phase.started` | Suggest task breakdown | Always suggest, never auto |
| `pm.task.overdue` | Alert via Pulse | Notify |
| `chat.message.task_intent` | Suggest task creation | Review before create |
| `user.login.morning` | Deliver daily briefing | Auto |

**Implementation:**
```python
navi = Agent(
    name="Navi",
    role="PM Team Lead",
    model=get_tenant_model(tenant_id),
    instructions=[
        "Coordinate PM operations across Sage, Herald, Chrono, Scope, Pulse, Bridge, and Prism.",
        "Route user requests to the most appropriate specialist agent.",
        "ALWAYS suggest actions, never auto-execute task creation without confirmation.",
        "Synthesize findings into actionable insights with specific next steps.",
        "When users mention tasks in chat, suggest creation with preview, don't auto-create.",
    ],
    storage=PostgresStorage(table_name="pm_sessions"),
)
```

---

#### 2. Sage - Estimation Expert

**Role:** Data-driven estimation and complexity analysis

**Persona:**
> "I'm Sage, your estimation oracle. I analyze task complexity, compare to historical patterns, and provide story point estimates with confidence intervals. Trust but verify - I improve with your feedback."

**Responsibilities:**
- Story point estimation from task descriptions
- Time estimation based on complexity
- Historical velocity analysis
- Complexity scoring (1-10 scale)
- Scope creep detection
- Confidence interval calculation
- **Cold-start handling** - Clear messaging when insufficient history

**Cold-Start Strategy:**
```
IF historical_tasks < 20:
    confidence = "LOW"
    message = "Limited history. Estimate based on complexity analysis.
               Your feedback will improve accuracy."
    show_manual_override = PROMINENT
ELSE:
    confidence = calculated_from_velocity
    message = "Based on {n} similar tasks with {accuracy}% historical accuracy"
```

**Estimation Algorithm:**
```
Complexity Score = (Technical Complexity × 0.4) + (Uncertainty × 0.3) + (Dependencies × 0.3)

Story Points (Fibonacci):
- 1 point: Trivial, <2 hours
- 2 points: Simple, 2-4 hours
- 3 points: Standard, 4-8 hours
- 5 points: Complex, 1-2 days
- 8 points: Very Complex, 2-4 days
- 13 points: Epic-level, needs breakdown

Confidence Interval:
- HIGH (±10%): >50 similar historical tasks
- MEDIUM (±25%): 20-50 similar tasks
- LOW (±40%): <20 similar tasks (cold-start)
```

**Tools:**
```python
sage_tools = [
    analyze_complexity,      # Score task complexity (1-10)
    suggest_estimate,        # Propose story points with confidence
    calculate_time_estimate, # Hours estimate
    compare_historical,      # Match to similar completed tasks
    calculate_velocity,      # Team/phase velocity (points/week)
    detect_scope_creep,      # Flag scope changes mid-phase
    flag_uncertainty,        # Mark high-variance estimates
]
```

**Triggers:**
| Event | Action | Approval |
|-------|--------|----------|
| `pm.task.created` | Suggest estimate if missing | Suggest |
| `pm.task.description_changed` | Re-evaluate estimate | Suggest |
| `pm.phase.planning` | Bulk estimation assist | Review |

---

#### 3. Herald - Reporter & Insights

**Role:** Status reporting and stakeholder communication

**Persona:**
> "I'm Herald, your story summarizer. I transform project data into clear narratives. Ask me for a standup summary, sprint report, or stakeholder update - I'll give you the story behind the numbers."

**Responsibilities:**
- Daily standup summaries
- Sprint/phase reports
- Burndown/burnup chart data
- Progress narratives for stakeholders
- Blocker summaries (coordinating with Pulse)
- Velocity trend analysis
- Forecast completion dates

**Report Types:**

| Report | Frequency | Content |
|--------|-----------|---------|
| Daily Standup | On-demand | Yesterday's completions, today's focus, blockers |
| Sprint Report | End of phase | Velocity, completion %, scope changes, highlights |
| Stakeholder Update | Weekly | Progress summary, risks, timeline status |
| Burndown | Real-time | Remaining work vs ideal trend |
| Velocity Trend | Per phase | Points completed trend over phases |

**Tools:**
```python
herald_tools = [
    generate_standup,        # Daily standup summary
    generate_sprint_report,  # Phase completion report
    generate_stakeholder_update, # Executive summary
    get_burndown_data,       # Chart data for remaining work
    get_burnup_data,         # Chart data for completed work
    calculate_velocity_trend, # Velocity over time
    forecast_completion,     # ETA prediction
    summarize_blockers,      # Blocker narrative (uses Pulse data)
]
```

**Triggers:**
| Event | Action | Approval |
|-------|--------|----------|
| `pm.phase.completed` | Generate sprint report | Auto-generate, notify |
| `user.request.standup` | Generate standup | Auto |
| `schedule.weekly.friday` | Stakeholder update draft | Review before send |

---

#### 4. Chrono - Activity Tracker

**Role:** Activity monitoring and audit trail

**Persona:**
> "I'm Chrono, the keeper of your project history. Nothing escapes my log. I track every change, surface stale tasks, and maintain the audit trail so you always know what happened and when."

**Responsibilities:**
- Activity logging for all task changes
- State transition tracking
- Assignment change monitoring
- Stale task detection (configurable threshold)
- Audit trail maintenance
- Activity timeline generation

**Stale Task Detection:**
```
Default Thresholds (Configurable):
- Backlog: 30 days without activity → Flag as "Needs Review"
- Todo: 14 days without activity → Flag as "Stale"
- In Progress: 7 days without activity → Flag as "Blocked?"
- Review: 3 days without activity → Flag as "Awaiting Action"
```

**Activity Types Tracked:**
- Task created/updated/deleted
- State changes
- Assignment changes
- Comment additions
- Attachment uploads
- Estimate changes
- Phase movements
- Agent interactions

**Tools:**
```python
chrono_tools = [
    log_activity,            # Record any task activity
    get_task_history,        # Full activity timeline for task
    get_product_activity,    # Recent activity across product
    find_stale_tasks,        # Tasks exceeding thresholds
    track_state_change,      # Monitor state transitions
    generate_audit_report,   # Compliance audit trail
]
```

**Triggers:**
| Event | Action | Approval |
|-------|--------|----------|
| `pm.task.*` | Log activity | Auto |
| `schedule.daily` | Stale task scan | Auto, notify if found |
| `pm.compliance.audit_request` | Generate audit report | Auto |

---

#### 5. Scope - Planner & Prioritizer

**Role:** Sprint planning, backlog grooming, and capacity management

**Persona:**
> "I'm Scope, your planning partner. I help you decide what fits in a sprint, prioritize your backlog, and balance workload across your team. Let's make sure you're working on the right things."

**Responsibilities:**
- Sprint/phase planning assistance
- Backlog prioritization (MoSCoW, value scoring)
- Capacity planning based on team availability
- Workload balancing across team members
- Carryover handling at phase end
- Scope recommendations based on velocity

**Capacity Calculation:**
```
Team Capacity (per phase):
= Σ (team_member.available_hours × team_member.productivity_factor)

Recommended Scope:
= Team Capacity × Historical Velocity Factor

Workload Balance Score:
= 1 - (StdDev(member_assignments) / Mean(member_assignments))
```

**Prioritization Framework:**
```
Priority Score = (Business Value × 0.4) + (Urgency × 0.3) + (Dependencies × 0.2) + (Risk × 0.1)

MoSCoW Classification:
- Must Have: Priority Score > 80
- Should Have: 60-80
- Could Have: 40-60
- Won't Have: < 40 (this phase)
```

**Tools:**
```python
scope_tools = [
    suggest_sprint_scope,    # Recommend tasks for phase based on capacity
    prioritize_backlog,      # Apply prioritization framework
    calculate_capacity,      # Team capacity for phase
    balance_workload,        # Suggest reassignments for balance
    handle_carryover,        # End-of-phase incomplete task handling
    analyze_dependencies,    # Identify blocking relationships
]
```

**Triggers:**
| Event | Action | Approval |
|-------|--------|----------|
| `pm.phase.planning_started` | Suggest sprint scope | Review |
| `pm.workload.imbalanced` | Suggest rebalancing | Review |
| `pm.phase.ending` | Carryover recommendations | Review |

---

#### 6. Pulse - Risk & Health Monitor

**Role:** Risk identification, blocker detection, and project health

**Persona:**
> "I'm Pulse, your early warning system. I monitor project health, identify risks before they become problems, and surface blockers so you can act fast. Think of me as your project's vital signs monitor."

**Responsibilities:**
- Risk identification and tracking
- Blocker detection and escalation
- Dependency analysis
- Project health scoring
- Deadline risk alerts (48h warning)
- Resource constraint warnings

**Health Score Calculation:**
```
Project Health Score (0-100):
= (Schedule Health × 0.3) + (Scope Health × 0.25) + (Resource Health × 0.25) + (Quality Health × 0.2)

Schedule Health = (On-time tasks / Total tasks) × 100
Scope Health = 100 - (Scope changes % × 2)
Resource Health = (Capacity utilization between 70-90% = 100, else reduce)
Quality Health = (Approval rate × 100)

Status:
- Healthy: 80-100
- At Risk: 60-79
- Critical: < 60
```

**Risk Categories:**
| Category | Indicators | Alert Threshold |
|----------|------------|-----------------|
| Schedule | Tasks approaching due date | 48 hours |
| Resource | Team member overloaded | >120% capacity |
| Blocker | Task blocked >48 hours | 48 hours |
| Scope | Scope added mid-phase | Any addition |
| Dependency | Dependent task delayed | 24 hours |

**Tools:**
```python
pulse_tools = [
    scan_risks,              # Identify all current risks
    detect_blockers,         # Find blocked tasks
    calculate_health_score,  # Project health calculation
    analyze_dependencies,    # Dependency chain analysis
    forecast_deadline_risk,  # Predict deadline misses
    get_risk_report,         # Comprehensive risk summary
]
```

**Triggers:**
| Event | Action | Approval |
|-------|--------|----------|
| `schedule.hourly` | Risk scan | Auto, alert if critical |
| `pm.task.blocked` | Blocker alert | Notify immediately |
| `pm.task.due_approaching` | Deadline warning | 48h notification |
| `pm.health.critical` | Escalate to Navi | Notify team lead |

---

### Phase 2 Agents

---

#### 7. Bridge - Integration Manager

**Role:** External tool synchronization and imports

**Persona:**
> "I'm Bridge, your connection to the outside world. I sync with GitHub, GitLab, and other tools so your project data stays unified. Import from Jira? Link PRs to tasks? I've got you covered."

**Responsibilities:**
- **GitHub/GitLab Deep Integration** *(Linear-inspired, best-in-class)*
  - Two-way synchronization
  - Branch naming auto-linking
  - PR auto-attachment
  - Commit message parsing
  - GitHub Actions event handling
  - AI-generated PR descriptions
- Import from external PM tools (Jira, Asana, Trello)
- Export capabilities
- Webhook management

**GitHub Integration (Linear-Inspired):**
```
Branch Pattern: {type}/PM-{task-id}-{slug}
Example: feat/PM-123-add-login-form

Auto-Link Trigger:
- Branch created with PM-XXX → Links to task automatically
- PR title contains PM-XXX → Links to task automatically

Commit Patterns:
- "fixes PM-123" → Marks task as Done
- "refs PM-123" → Links commit to task
- "closes PM-123" → Marks task as Done
- "wip PM-123" → Task stays In Progress

PR Events:
- PR Opened → Task moves to "In Review"
- PR Merged → Task moves to "Done"
- PR Closed (not merged) → Task stays in current state

GitHub Actions Integration:
- CI/CD success → Notify task
- CI/CD failure → Flag task with warning
- Deployment → Update task with deployment link

Development Panel (on each task):
- All linked commits (with AI summaries)
- All linked PRs (with status)
- All linked branches (with last activity)
```

**AI Capabilities:**
```
Bridge AI Features:
- Generate PR description from task details
- Summarize commit history for task
- Auto-categorize commits (feat, fix, refactor, docs)
- Suggest task updates based on code changes
```

**Tools:**
```python
bridge_tools = [
    # GitHub/GitLab Integration
    link_pr_to_task,         # Connect GitHub/GitLab PR
    link_branch_to_task,     # Connect branch to task
    parse_commit_references, # Extract task refs from commits
    generate_pr_description, # AI: Generate PR desc from task
    summarize_commits,       # AI: Summarize commits for task
    sync_github_events,      # Process GitHub Actions webhooks

    # Import/Export
    import_from_jira,        # Jira import with field mapping
    import_from_asana,       # Asana import
    import_from_trello,      # Trello import
    import_from_csv,         # CSV import with mapping wizard
    export_to_csv,           # Export tasks to CSV

    # Webhooks
    manage_webhooks,         # Configure outbound webhooks
]
```

---

#### 8. Prism - Analytics & Insights

**Role:** Predictive analytics and optimization

**Persona:**
> "I'm Prism, your analytics lens. I see patterns in your project data, predict outcomes, and suggest optimizations. Want to know if you'll hit your deadline? I'll give you the probability."

**Responsibilities:**
- Predictive completion forecasting
- Trend analysis across projects
- Resource optimization suggestions
- Quality trend analysis
- Cross-product insights
- Anomaly detection

**Predictive Model:**
```
Completion Probability = f(velocity_trend, remaining_work, team_capacity, historical_accuracy)

Forecast Date = Today + (Remaining Points / Adjusted Velocity)
Adjusted Velocity = Historical Velocity × Trend Factor × Capacity Factor

Confidence Bands:
- Optimistic: -20% from forecast
- Realistic: Forecast date
- Pessimistic: +30% from forecast
```

**Tools:**
```python
prism_tools = [
    forecast_completion,     # Predict completion date with confidence
    analyze_velocity_trend,  # Velocity direction and magnitude
    suggest_optimizations,   # Resource reallocation suggestions
    detect_anomalies,        # Unusual patterns in data
    compare_products,        # Cross-product performance comparison
    predict_risks,           # ML-based risk prediction
]
```

---

### Agent Team Configuration

```yaml
# agents/pm/team.py
pm_team:
  name: "PM Team"
  mode: "coordinate"
  leader: "navi"
  members:
    # MVP (Phase 1)
    - navi      # Orchestrator
    - sage      # Estimation
    - herald    # Reporting
    - chrono    # Tracking
    - scope     # Planning
    - pulse     # Risk
    # Phase 2
    - bridge    # Integration
    - prism     # Analytics
  storage: PostgresStorage
  memory:
    shared: true
    key_prefix: "pm_team"
  defaults:
    suggestion_mode: true  # Agents suggest, don't auto-execute
    confidence_threshold: 0.85
```

### Agent Disagreement Resolution Protocol

When agents disagree (e.g., Scope wants to add tasks but Pulse flags resource risk):

1. **Navi reviews disagreement** (as team leader)
2. **Evidence compilation** - Each agent provides reasoning with data
3. **Synthesis attempt** - Navi tries to find middle ground
4. **Human escalation** if confidence <70% or critical impact
5. **Decision logged** in Chrono's activity trail

Example:
```
Scope: "Sprint can fit 15 more points based on velocity"
Pulse: "Team at 95% capacity, risk of burnout"

Navi's synthesis: "Recommend adding 8 points (critical items only).
Flag remaining 7 for next sprint. Monitor team capacity."

[Accept Navi] [Side with Scope] [Side with Pulse] [Custom Decision]
```

---

## Human Team Management

### Product Team Structure

BM-PM supports human teams alongside AI agents:

```
Product
└── Product Team
    ├── Human Team Members
    │   ├── Product Lead (1, required)
    │   ├── Developers (N)
    │   ├── Designers (N)
    │   ├── QA Engineers (N)
    │   └── Custom Roles (N)
    │
    └── AI Agent Team (PM Agents)
        └── Navi, Sage, Herald, Chrono, Scope, Pulse
```

### Human Role Definitions

```typescript
interface ProductTeamMember {
  userId: string;
  productId: string;
  role: TeamRole;
  customRoleName?: string;  // If role is CUSTOM

  // Capacity
  availableHoursPerWeek: number;
  productivityFactor: number;  // 0.0-1.0, default 0.8

  // Permissions
  canAssignTasks: boolean;
  canApproveAgentOutput: boolean;
  canModifyPhases: boolean;

  // Status
  isActive: boolean;
  joinedAt: Date;
}

enum TeamRole {
  PRODUCT_LEAD = 'product_lead',   // Full permissions, single per product
  DEVELOPER = 'developer',
  DESIGNER = 'designer',
  QA_ENGINEER = 'qa',
  STAKEHOLDER = 'stakeholder',     // View-only + comments
  CUSTOM = 'custom',
}
```

### Capacity Planning

```typescript
interface TeamCapacity {
  productId: string;
  phaseId: string;

  // Per-member capacity
  memberCapacity: Array<{
    userId: string;
    availableHours: number;
    allocatedHours: number;
    utilizationPercent: number;
  }>;

  // Aggregate
  totalCapacityHours: number;
  totalAllocatedHours: number;
  overallUtilization: number;

  // Scope recommendation
  recommendedPoints: number;  // Based on velocity × capacity
}
```

### Role-Based Views

| Role | Default View | Filters |
|------|--------------|---------|
| Product Lead | Product Dashboard | All tasks |
| Developer | My Tasks (Kanban) | Assigned to me |
| Designer | My Tasks (List) | Type = Design tasks |
| QA | Review Queue | Status = Review, Type = Bug |
| Stakeholder | Progress Dashboard | View-only |

---

## Functional Requirements

### FR-1: Product Management

**FR-1.1: Product CRUD**
- Create, read, update, delete products
- Product types: Course, Podcast, Book, SaaS, Website, Custom
- Color coding and icon assignment
- Product lead assignment (required)
- PM agent team auto-assigned

**FR-1.2: Product Templates**
- **BMAD templates** (primary, recommended)
  - Course creation template (7 BUILD + 3 OPERATE)
  - Podcast template (Planning → Production → Distribution)
  - SaaS Product template (Discovery → Design → Development → Launch)
- **Flexible templates** (for non-BMAD users)
  - Kanban-only (no phases, just task states)
  - Simple List (minimal structure)
  - Custom template builder

**FR-1.3: Product Settings**
- Auto-approval threshold (0-100%, default: 85%)
- Default assignee per task type
- Phase template selection
- Agent suggestion mode (on/off, default: on)
- Notification preferences
- Archive settings

**FR-1.4: Budget Tracking**
- Budget field on Product (optional)
- Actual spend tracking
- Cost-per-phase breakdown
- Budget alerts at thresholds

### FR-2: Phase Management

**FR-2.1: Phase CRUD**
- Create, read, update, delete phases
- BMAD phase types (BUILD 1-7, OPERATE 1-3, Custom)
- Start/end dates with timezone
- Progress snapshot tracking (daily)

**FR-2.2: Phase Templates**
- Default phases from product template
- Suggested tasks per phase (from BMAD workflows)
- Checkpoint definitions
- Completion criteria

**FR-2.3: Phase Lifecycle**
- States: Upcoming, Current, Completed, Cancelled
- Phase completion workflow with Scope agent
- Incomplete task handling (carryover, backlog, cancel)
- Phase transition approvals

### FR-3: Task Management

**FR-3.1: Task CRUD**
- Full CRUD with soft delete
- Sequential task numbers (PROD-001, PROD-002)
- Rich text description with markdown
- Attachment support (50MB max, 1GB per product)
- **Quick Capture**: `c` key for instant task creation modal

**FR-3.2: Task Classification**
- Types: Epic, Story, Task, Subtask, Bug, Research, Content, Agent Review
- Priorities: Urgent, High, Medium, Low, None
- Labels (many-to-many)

**FR-3.3: Task Assignment**
- **Human Assignment**: Assign to team members by role
- **Agent Assignment**: Assign to module agents (Content, CRM, etc.)
- **Hybrid Assignment**: Human assignee + agent assist
- Agent suggestions require confirmation (not auto-assign)

**FR-3.4: Task Hierarchy**
- Parent-child relationships
- Maximum 3 levels (Epic → Story → Task/Subtask)
- Subtask completion rolls up to parent

**FR-3.5: Task Relations**
- Relation types: Blocks, Blocked By, Relates To, Duplicates
- Start Before/After, Finish Before/After
- Depends on Approval (agent-specific)
- Generated By (agent task lineage)

**FR-3.6: Task States**
- Global state groups: Backlog, Unstarted, Started, Completed, Cancelled, Triage
- Default states per group
- Project-level custom states
- State transition validation

### FR-4: Views & Navigation

**FR-4.1: List View**
- Sortable columns
- Bulk actions (assign, move, delete)
- Pagination (50 default)
- Column visibility toggle

**FR-4.2: Kanban Board**
- Drag-and-drop between columns
- Group by: State, Priority, Assignee, Type, Role
- Card preview: Type icon, priority badge, assignee avatar
- Agent badge on AI-assigned tasks

**FR-4.3: Calendar View**
- Due date visualization
- Month/week/day views
- Drag to reschedule
- Filter by assignee/role

**FR-4.4: Timeline View (Phase 2)**
- Gantt-style visualization
- Dependency arrows
- Critical path highlighting
- Drag-resize for date changes

**FR-4.5: Saved Views**
- Save filter/sort combinations
- Public/private views
- View sharing
- Default views per role

**FR-4.6: Executive Portfolio Dashboard (Phase 2)**
- Cross-product health summary
- Aggregate metrics
- Resource utilization
- Risk overview

### FR-5: Agent Features

**FR-5.1: Suggestion Mode (Default)**
- Agents suggest actions, don't auto-execute
- User confirms before task creation
- Easy override/dismiss suggestions
- Suggestion history for learning

**FR-5.2: Chat-Based Interaction**
- Parse natural language for intent
- Preview card before action
- "Create task: {title}" confirmation
- Multi-step conversations with context

**FR-5.3: Daily Briefing**
- Navi's morning summary (configurable time)
- Opt-in/out per user
- Expandable sections
- One-click actions

**FR-5.4: Estimation Assist (Sage)**
- Suggest estimates on task creation
- Show confidence level and basis
- Prominent manual override
- Cold-start messaging for new products

**FR-5.5: Risk Alerts (Pulse)**
- 48-hour deadline warnings
- Blocker notifications
- Health score dashboard widget
- Escalation to Product Lead

### FR-6: Reporting & Analytics

**FR-6.1: Product Dashboard**
- Phase progress (current + next)
- Active tasks count by state
- Pending approvals
- Agent activity status
- Team workload summary
- Recent activity feed

**FR-6.2: Phase Analytics**
- Burndown chart (Herald)
- Burnup chart
- Velocity trend
- Task state distribution
- Scope changes

**FR-6.3: Reports (Herald)**
- Daily standup summary
- Sprint/phase report
- Stakeholder update
- Export to PDF/CSV

**FR-6.4: Team Reports**
- Workload distribution
- Capacity utilization
- Individual performance
- Agent contribution metrics

### FR-7: Real-Time Features

**FR-7.1: WebSocket Events**
- Task CRUD events
- State change events
- Agent activity events
- Approval events
- Presence events

**FR-7.2: Agent Activity Streaming**
- Real-time progress updates
- Current step visibility
- Artifact generation events
- Completion notifications

**FR-7.3: Presence**
- Active users in product
- Current view per user
- Last activity timestamp

**FR-7.4: Notification Controls**
- Per-event-type preferences
- Quiet hours
- Channel selection (in-app, email, Slack)
- Digest options

### FR-8: Integrations

**FR-8.1: CSV Import/Export**
- Column mapping wizard
- Template download
- Batch import with validation
- Export with field selection

**FR-8.2: Event Bus Integration**
- Publish all pm.* events
- Subscribe to relevant events
- Cross-module linking (CRM optional)

**FR-8.3: GitHub/GitLab (Bridge - Phase 2)**
- PR linking via branch name
- Commit message parsing
- Auto-update on PR merge
- Repository configuration

**FR-8.4: Import from PM Tools (Bridge - Phase 2)**
- Jira import with field mapping
- Asana import
- Trello import
- Migration wizard

---

## Non-Functional Requirements

### Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Task list load | <500ms | P95 latency |
| Kanban board render | <800ms | P95 latency |
| Search response | <300ms | P95 latency |
| Agent suggestion response | <3s | P95 latency |
| Real-time update delivery | <100ms | WebSocket latency |
| Quick capture to save | <1s | Full round-trip |

### Scalability

| Dimension | MVP Target | Growth Target |
|-----------|------------|---------------|
| Products per business | 50 | 500 |
| Tasks per product | 10,000 | 100,000 |
| Team members per product | 20 | 100 |
| Concurrent users per product | 100 | 1,000 |
| Agent concurrent executions | 10/tenant | 100/tenant |

### Security

- **Row Level Security (RLS)** on all PM tables
- **tenantId required** on every model
- **Agent outputs** routed through approval queue
- **Audit logging** via Chrono for all state changes
- **Rate limiting** on API endpoints
- **Role-based permissions** enforced

### Reliability

- **Availability:** 99.9% uptime
- **Data durability:** Point-in-time recovery
- **WebSocket reconnection:** Automatic with state sync
- **Agent failure handling:** Retry with backoff, dead letter queue

---

## Data Model Summary

### Core Entities

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Business   │────<│   Product   │────<│    Phase    │────<│    Task     │
│             │     │             │     │             │     │             │
│ id          │     │ id          │     │ id          │     │ id          │
│ tenantId    │     │ businessId  │     │ productId   │     │ phaseId     │
│ slug        │     │ slug        │     │ name        │     │ taskNumber  │
│ name        │     │ name        │     │ bmadPhase   │     │ title       │
│ aiConfig    │     │ type        │     │ startDate   │     │ type        │
│ settings    │     │ team        │     │ endDate     │     │ status      │
└─────────────┘     │ budget      │     │ progress{}  │     │ assignment{}│
                    │ bmadConfig  │     │ status      │     │ approval{}  │
                    │ progress{}  │     └─────────────┘     └─────────────┘
                    └─────────────┘
```

### Team Entities

```
┌─────────────────┐     ┌─────────────────┐
│ ProductTeam     │────<│ TeamMember      │
│                 │     │                 │
│ productId       │     │ userId          │
│ leadUserId      │     │ productId       │
│ createdAt       │     │ role            │
│                 │     │ capacity{}      │
└─────────────────┘     │ permissions{}   │
                        └─────────────────┘
```

### Supporting Entities

| Entity | Purpose |
|--------|---------|
| `PmTaskActivity` | Activity log (Chrono) |
| `PmTaskRelation` | Task dependencies and links |
| `PmTaskAttachment` | File attachments |
| `PmTaskComment` | Comments and discussions |
| `PmTaskLabel` | Labels (many-to-many) |
| `PmSavedView` | Saved filters and configurations |
| `PmPhaseTemplate` | BMAD phase templates |
| `PmRiskEntry` | Risk tracking (Pulse) |
| `PmCapacityPlan` | Team capacity per phase |

---

## User Experience

### Information Architecture

```
/pm
├── /dashboard                    # PM dashboard (cross-product)
├── /products                     # Product list
│   └── /[productId]              # Product detail
│       ├── /overview             # Product dashboard
│       ├── /team                 # Team management
│       ├── /phases               # Phase list
│       │   └── /[phaseId]        # Phase detail
│       ├── /tasks                # Task views
│       │   ├── /list             # List view
│       │   ├── /kanban           # Kanban board
│       │   ├── /calendar         # Calendar view
│       │   ├── /timeline         # Timeline (Phase 2)
│       │   └── /[taskId]         # Task detail
│       ├── /reports              # Product reports
│       └── /settings             # Product settings
├── /my-tasks                     # Personal task list
├── /portfolio                    # Executive dashboard (Phase 2)
└── /settings                     # PM module settings
    ├── /templates                # Phase templates
    └── /integrations             # GitHub, etc.
```

### Key User Flows

**1. Create Product with Team**
```
[Dashboard] → [+ New Product] → [Select Template] → [Configure]
    → [Add Team Members] → [Assign Roles] → [Create]
         ↓
    BMAD Template (recommended)
    Kanban-only
    Simple List
    Custom...
```

**2. Chat-Based Task Suggestion**
```
[Chat Panel] → "Add a task to research competitors"
    → [Navi suggests task with preview]
    → [User confirms/edits/cancels]
    → [Task created with assignment]
```

**3. Sprint Planning with Scope**
```
[Phase] → [Start Planning] → [Scope analyzes capacity]
    → [Suggests tasks from backlog]
    → [Shows workload distribution]
    → [User approves/adjusts]
    → [Phase planned]
```

**4. Risk Alert Flow**
```
[Pulse detects risk] → [Alert to Navi]
    → [Navi notifies Product Lead]
    → [Risk card with context]
    → [Suggested actions]
    → [User takes action]
```

### Onboarding: "Meet Your PM Team"

When a user first accesses BM-PM:

1. **Introduction Modal**
   - "Your PM Team is ready to help"
   - 8-agent team overview

2. **Agent Introductions**
   - Navi: "I'm your PM co-pilot"
   - Sage: "I help with estimates"
   - Herald: "I summarize your progress"
   - Chrono: "I track everything"
   - Scope: "I help with planning"
   - Pulse: "I watch for risks"

3. **First Product**
   - Guided product creation
   - Template selection (BMAD recommended)
   - Team setup wizard

4. **First Task**
   - Quick capture demo (`c` key)
   - Suggestion mode explanation
   - Assignment types demo

5. **Simple Mode Option**
   - "Prefer a simpler experience?"
   - Toggle to hide agent features
   - Can re-enable anytime

---

## Technical Implementation Specification

### Directory Structure

```
apps/
├── web/src/app/(dashboard)/pm/       # PM frontend
│   ├── products/
│   │   └── [productId]/
│   │       ├── page.tsx              # Product overview
│   │       ├── team/page.tsx         # Team management
│   │       ├── tasks/
│   │       │   ├── kanban/page.tsx
│   │       │   ├── list/page.tsx
│   │       │   ├── calendar/page.tsx
│   │       │   └── timeline/page.tsx # Phase 2
│   │       └── settings/page.tsx
│   ├── dashboard/page.tsx
│   ├── my-tasks/page.tsx
│   └── portfolio/page.tsx            # Phase 2
│
├── api/src/modules/pm/               # PM backend
│   ├── pm.module.ts
│   ├── controllers/
│   │   ├── products.controller.ts
│   │   ├── phases.controller.ts
│   │   ├── tasks.controller.ts
│   │   ├── teams.controller.ts
│   │   └── views.controller.ts
│   ├── services/
│   │   ├── products.service.ts
│   │   ├── phases.service.ts
│   │   ├── tasks.service.ts
│   │   ├── teams.service.ts
│   │   └── analytics.service.ts
│   └── events/
│       ├── pm.events.ts
│       └── pm.handlers.ts
│
agents/
├── pm/
│   ├── team.py                       # PM team definition
│   ├── navi.py                       # Navi orchestrator
│   ├── sage.py                       # Sage estimator
│   ├── herald.py                     # Herald reporter
│   ├── chrono.py                     # Chrono tracker
│   ├── scope.py                      # Scope planner
│   ├── pulse.py                      # Pulse risk monitor
│   ├── bridge.py                     # Bridge integrator (Phase 2)
│   ├── prism.py                      # Prism analytics (Phase 2)
│   ├── tools.py                      # Shared PM tools
│   └── prompts/
│       ├── navi_system.md
│       ├── sage_system.md
│       ├── herald_system.md
│       ├── chrono_system.md
│       ├── scope_system.md
│       └── pulse_system.md
│
packages/db/prisma/
└── schema/
    └── pm.prisma                     # PM data models
```

### Team Factory Pattern

```python
# agents/pm/team.py
from agno import Agent, Team
from agno.storage.postgres import PostgresStorage
from .navi import create_navi
from .sage import create_sage
from .herald import create_herald
from .chrono import create_chrono
from .scope import create_scope
from .pulse import create_pulse

def create_pm_team(tenant_id: str, product_id: str) -> Team:
    """Create PM agent team for a product."""

    storage = PostgresStorage(
        table_name=f"pm_team_{tenant_id}",
        schema="agent_memory"
    )

    navi = create_navi(tenant_id, product_id)
    sage = create_sage(tenant_id, product_id)
    herald = create_herald(tenant_id, product_id)
    chrono = create_chrono(tenant_id, product_id)
    scope = create_scope(tenant_id, product_id)
    pulse = create_pulse(tenant_id, product_id)

    return Team(
        name="PM Team",
        mode="coordinate",
        leader=navi,
        members=[sage, herald, chrono, scope, pulse],
        storage=storage,
        instructions=[
            "You are the PM Team managing this product's project.",
            "Navi leads and coordinates all PM operations.",
            "ALWAYS suggest actions, never auto-execute without confirmation.",
            "Route approvals through Sentinel when confidence < threshold.",
            "Support human team members alongside AI operations.",
        ]
    )
```

### Event Bus Events

```typescript
// PM Event Types
'pm.product.created'
'pm.product.updated'
'pm.product.archived'
'pm.product.team_changed'

'pm.phase.created'
'pm.phase.started'
'pm.phase.completed'
'pm.phase.blocked'

'pm.task.created'
'pm.task.updated'
'pm.task.state_changed'
'pm.task.assigned'
'pm.task.completed'
'pm.task.approval_needed'
'pm.task.approval_resolved'

'pm.team.member_added'
'pm.team.member_removed'
'pm.team.capacity_updated'

'pm.agent.suggestion'
'pm.agent.started'
'pm.agent.progress'
'pm.agent.completed'
'pm.agent.failed'

'pm.risk.detected'
'pm.risk.resolved'
'pm.health.critical'
```

---

## Implementation Phases

### Phase 1: MVP (5 weeks)

**Week 1-2: Data Layer & Core APIs**
- Product, Phase, Task Prisma models
- Team and TeamMember models
- CRUD API endpoints
- RLS policies
- Event bus publishers

**Week 3-4: MVP Agents (6 Agents)**
- Navi orchestrator
- Sage estimator
- Herald reporter
- Chrono tracker
- Scope planner
- Pulse risk monitor
- Agent team configuration

**Week 5: Core UI**
- Product dashboard
- Kanban board
- List view
- Task detail panel
- Team management page
- Quick capture (`c` key)
- WebSocket events

### Phase 2: Growth Features (3 weeks)

**Week 6-7: Phase 2 Agents & Views**
- Bridge integration agent
- Prism analytics agent
- Timeline view
- Saved views
- Portfolio dashboard
- GitHub integration

**Week 8: Advanced Features**
- Import wizard (Jira, Asana)
- Enhanced reporting (Herald)
- Budget tracking
- Slack notifications

### Phase 3: Vision Features (2 weeks)

**Week 9-10: Workflow Builder & API**
- Custom workflow builder
- Public REST API
- Webhooks
- Predictive analytics (Prism)

---

## Epic Summary

| Epic | Phase | Stories | Points | Focus |
|------|-------|---------|--------|-------|
| PM-01: Data Layer | MVP | 12 | 32 | Core data models, team entities |
| PM-02: MVP Agents (Navi, Sage, Herald) | MVP | 10 | 30 | First 3 agents |
| PM-03: MVP Agents (Chrono, Scope, Pulse) | MVP | 9 | 27 | Remaining MVP agents |
| PM-04: Core UI | MVP | 12 | 35 | Views, kanban, task panel |
| PM-05: Real-time & Notifications | MVP | 6 | 16 | WebSocket, preferences |
| PM-06: Bridge Agent & Integrations | Phase 2 | 8 | 24 | GitHub, imports |
| PM-07: Prism Agent & Analytics | Phase 2 | 6 | 18 | Predictive, trends |
| PM-08: Advanced Views | Phase 2 | 6 | 16 | Timeline, portfolio, saved views |
| PM-09: Workflow Builder | Phase 3 | 6 | 18 | Custom workflows |
| PM-10: External API | Phase 3 | 5 | 14 | REST API, webhooks |
| **Total** | | **80** | **230** | |

### MVP Priority Tiers

Within MVP (Phase 1), if timeline pressure occurs:

**P0 (Must Ship):** 48 stories, 130 points
- Data layer complete
- Navi + Sage + Chrono agents
- Kanban + List views
- Basic team management
- Quick capture

**P1 (Should Ship):** 15 stories, 45 points
- Herald + Scope + Pulse agents
- Calendar view
- Full team capacity planning
- Notification controls

**P2 (Nice to Have):** 7 stories, 20 points
- Simple timeline (view only)
- Simple mode toggle
- CSV import

---

## Dependencies

### Platform Dependencies (Complete)

| Dependency | Status | Notes |
|------------|--------|-------|
| Multi-tenancy | Complete | RLS on all tables |
| BYOAI | Complete | Tenant AI configuration |
| Event Bus | Complete | Redis Streams |
| Approval Queue | Complete | Confidence routing |
| WebSocket Gateway | Complete | Real-time events |
| AgentOS | Complete | Agno runtime |

### Module Dependencies

| Module | Dependency Type | Notes |
|--------|-----------------|-------|
| BM-CRM | Optional | Link tasks to contacts/deals |
| BME-* | Consumer | Product execution modules use PM |
| BMT-Analytics | Consumer | PM feeds analytics |

### External Dependencies

| Integration | Required | Phase |
|-------------|----------|-------|
| GitHub | Phase 2 | PR linking |
| GitLab | Phase 2 | PR linking |
| Slack | Phase 2 | Notifications |
| Jira | Phase 2 | Import |
| Asana | Phase 2 | Import |

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Estimation accuracy low (cold-start) | User trust | High | Calibration period, prominent manual override, clear messaging |
| Agent over-suggestion | User annoyance | Medium | Default suggest mode, easy dismiss, learning from feedback |
| Human team adoption | Feature underuse | Medium | Prominent team management, role-based defaults |
| 8-agent complexity | Maintenance overhead | Medium | Clear agent boundaries, shared tools |
| BMAD workflow rigidity | User friction | Low | Flexible templates (Kanban-only, Simple List) |
| Real-time sync conflicts | Data issues | Low | Last-write-wins, Chrono logging |
| Performance at scale | UX degradation | Medium | Pagination, virtual scroll, caching |

---

## References

### Research & Analysis
- [BM-PM Research Findings](/docs/modules/bm-pm/research/BM-PM-RESEARCH-FINDINGS.md)
- [Competitor AI/GitHub/Dependencies Analysis](/docs/modules/bm-pm/research/competitor-analysis.md)
- [Comprehensive Feature Analysis](/docs/modules/bm-pm/research/comprehensive-feature-analysis.md)
- [Plane Analysis](/docs/modules/bm-pm/research/plane-analysis.md)

### Architecture & Guides
- [BM-PM Architecture](/docs/modules/bm-pm/architecture.md)
- [BM-CRM PRD](/docs/modules/bm-crm/PRD.md) - Agent team reference
- [Platform Architecture](/docs/architecture.md)
- [Agno Implementation Guide](/docs/architecture/agno-implementation-guide.md)
- [BMad Development Guide](/docs/guides/bmad-agno-development-guide.md)

### Competitor References
- [Linear](https://linear.app/) - Developer-first PM, best GitHub integration
- [Monday.com](https://monday.com/) - Visual workflows, workload management
- [ClickUp](https://clickup.com/) - All-in-one PM, multi-model AI (ClickUp Brain)
- [Jira](https://www.atlassian.com/software/jira) - Enterprise agile, Rovo agents
- [Asana](https://asana.com/) - Goals/portfolios, AI Studio
- [Wrike](https://www.wrike.com/) - Resource management, proofing, MCP server
- [Notion](https://www.notion.com/) - Flexible databases, sprints
- [Taiga](https://taiga.io/) - Open-source Scrum/Kanban, planning poker
- [OpenProject](https://www.openproject.org/) - Open-source enterprise PM, baselines

---

## Appendix A: Agent System Prompts Summary

### Navi System Prompt
```markdown
You are Navi, the PM Team leader for {{product_name}}.

Your core responsibilities:
1. Coordinate all PM operations across the agent team
2. Route requests to the appropriate specialist (Sage, Herald, etc.)
3. Deliver daily briefings with actionable priorities
4. ALWAYS suggest actions - never auto-execute task creation

When users mention tasks in chat:
- Parse intent and extract details
- Present a preview card for confirmation
- Only create after explicit user confirmation
- Default to suggestion mode, not auto-creation
```

### Sage System Prompt
```markdown
You are Sage, the estimation expert for {{product_name}}.

Your core responsibilities:
1. Provide story point estimates with confidence levels
2. Analyze task complexity on a 1-10 scale
3. Compare to historical similar tasks
4. Be transparent about cold-start limitations

Cold-start behavior:
- If <20 historical tasks, clearly state "Limited history"
- Show prominent manual override option
- Explain basis for estimate (complexity analysis vs velocity)
```

### Pulse System Prompt
```markdown
You are Pulse, the risk and health monitor for {{product_name}}.

Your core responsibilities:
1. Continuously monitor project health (Schedule, Scope, Resource, Quality)
2. Detect blockers within 48 hours
3. Provide deadline risk warnings 48 hours in advance
4. Calculate and report project health score

Alert priorities:
- Critical (immediate): Health score <60, blocker >48h
- Warning (daily): Health score 60-79, approaching deadline
- Info (weekly): Trends, suggestions
```

---

## Appendix B: BMAD Phase Templates

### Course Creation Template (Default)

| Phase | Name | Suggested Duration | Primary Agent | Key Deliverables |
|-------|------|-------------------|---------------|------------------|
| 1 | Brief & Vision | 1 week | Navi | Product brief, success criteria |
| 2 | Requirements | 1 week | Navi + Scope | PRD, user stories |
| 3 | Architecture | 1 week | Navi | Technical design, content structure |
| 4 | Content Development | 4 weeks | Module agents | Course content, assets |
| 5 | Review & Testing | 1 week | Herald + Pulse | QA, beta testing |
| 6 | Production | 1 week | Bridge | Final assets, publishing prep |
| 7 | Launch | 1 week | Navi + Herald | Go-live, marketing |
| O1 | Maintenance | Ongoing | Chrono | Updates, fixes |
| O2 | Iteration | As needed | Scope + Sage | Improvements |
| O3 | Scaling | As needed | Prism | Growth optimization |

### Kanban-Only Template (Flexible)

| Configuration | Value |
|---------------|-------|
| Phases | None (single backlog) |
| States | Backlog, Todo, In Progress, Review, Done |
| BMAD Integration | Optional |
| Best For | Ongoing work, support, small projects |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-15 | Initial PRD |
| 1.1 | 2025-12-16 | Post-elicitation updates: 8 agents, human teams, BMAD strengthening, cold-start strategy, priority tiers |
| 1.2 | 2025-12-16 | Competitor research enhancements: Visual dependency editor (P1), planning poker (P1), Linear-style GitHub deep integration (P2), AI release notes (P2), MCP server (P2), sprint cooldown (P2), doom-line projection (P2), baseline comparison (P2), OKR tracking (P3), enterprise features (P3). Added 9 competitor references. Enhanced Bridge agent with Linear-inspired GitHub integration spec. |

---

_Document generated for AI Business Hub platform_
_Version 1.2 - December 2025_
