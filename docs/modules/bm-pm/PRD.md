# Core: Project Management & Knowledge Base - Product Requirements Document

**Component:** Core-PM
**Version:** 2.0
**Author:** AI Business Hub Team
**Created:** 2025-12-15
**Updated:** 2025-12-16
**Status:** Draft (Architecture Revision - PM as Platform Core)

---

## Read First (Scope + Terminology)

1. This PRD describes the **target** Core-PM design; many sections are not yet implemented in `apps/web`, `apps/api`, or `packages/db`.
2. **Canonical tenancy identifier:** use `workspaceId` across Core-PM docs/models/APIs. `tenantId` appears in the event bus payloads today and must be treated as an alias (`tenantId == workspaceId`) until/unless the platform standardizes naming.
3. Approval routing, audit logs, and the Redis Streams event bus already exist in the platform; Core-PM should reuse them rather than introducing parallel systems.
4. **Future (non-goal for Phase 1–3):** separating a “tenant” concept from “workspace” would be a platform-wide breaking change. Core-PM assumes `workspaceId` is the isolation boundary.
5. UX flows and UI interaction rules are defined in `docs/modules/bm-pm/ux/README.md`.

## Status Legend (Docs vs Repo)

| Label | Meaning | Expectation |
|-------|---------|-------------|
| **Implemented** | Exists in the repo today | Doc should link to real paths and current behavior |
| **Planned (Phase 1)** | Target for MVP build | Doc may show proposed shapes, clearly marked |
| **Planned (Phase 2+)** | Post-MVP work | Doc must be explicit about gating/dependencies |

## Glossary (Core Terms)

| Term | Canonical meaning in this repo | ID field(s) |
|------|-------------------------------|-------------|
| **Workspace** | Primary tenant/isolation boundary (RLS, billing, membership) | `workspaceId` |
| **Business** | A workspace-owned business entity (onboarding context) | `businessId` (scoped to workspace) |
| **Product** | A deliverable being built/operated under a business | `productId` (scoped to business/workspace) |
| **Phase** | A time-boxed work segment (BMAD phase or custom template) | `phaseId` (scoped to product/workspace) |
| **Task** | Unit of work (Epic/Story/Task/etc.) with assignment + status | `taskId` (scoped to product/workspace) |
| **Approval Queue** | Platform-wide approval system (Sentinel/ApprovalItem) | `approvalId` |
| **Awaiting Approval** | A task state indicating work is blocked on an approval decision | links to `approvalId` |

## Workflow State Mapping (BMAD ↔ Core-PM)

BMAD story states in this repo follow: `backlog → drafted → ready-for-dev → in-progress → review → done`.

Core-PM must support this without inventing a second competing workflow. **Proposed MVP mapping:**

| BMAD story state | Core-PM `TaskStatus` | Additional field (recommended) |
|------------------|----------------------|--------------------------------|
| backlog | `BACKLOG` | `task.metadata.bmadState = "backlog"` |
| drafted | `BACKLOG` | `task.metadata.bmadState = "drafted"` |
| ready-for-dev | `TODO` | `task.metadata.bmadState = "ready-for-dev"` |
| in-progress | `IN_PROGRESS` | `task.metadata.bmadState = "in-progress"` |
| review | `REVIEW` | `task.metadata.bmadState = "review"` |
| done | `DONE` | `task.metadata.bmadState = "done"` |

Notes:
1. “Awaiting Approval” is **orthogonal**: it can apply to any BMAD state when an approval gate is required.
2. “Drafted/ready-for-dev” are **sub-states**; keep Core-PM’s primary status model stable while preserving BMAD precision in metadata.

## Executive Summary

### Architectural Position: Platform Core

**Core-PM is not a module—it is the platform's foundational infrastructure.**

Unlike optional business modules (BM-CRM, BM-Content, etc.), Project Management and Knowledge Base are essential platform capabilities that:

1. **Enable all business modules** - Every module (CRM, Content, Analytics) uses PM for orchestration
2. **Provide team command & control** - Agent teams are managed from both chat windows AND the PM interface
3. **Store organizational knowledge** - The Knowledge Base with RAG integration powers AI context across the platform
4. **Execute BMAD workflows** - The 7 BUILD phases + 3 OPERATE loops run through Core-PM

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          PLATFORM CORE                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────┐      ┌─────────────────────────────────┐  │
│   │    Project Management   │      │        Knowledge Base           │  │
│   │                         │      │                                 │  │
│   │  • Products/Projects    │◄────►│  • Wiki Pages (Yjs collab)     │  │
│   │  • Agent Teams (9)      │      │  • RAG-Powered Search          │  │
│   │  • BMAD Workflow Engine │      │  • @mentions & #references     │  │
│   │  • Human + AI Hybrid    │      │  • Verified Content System     │  │
│   │                         │      │  • Vector Embeddings           │  │
│   └─────────────────────────┘      └─────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                           ▲                    ▲
                           │                    │
           ┌───────────────┼────────────────────┼───────────────┐
           │               │                    │               │
     ┌─────┴─────┐   ┌─────┴─────┐        ┌─────┴─────┐   ┌─────┴─────┐
     │  BM-CRM   │   │BM-Content │        │BM-Finance │   │  BM-...   │
     │ (Module)  │   │ (Module)  │        │ (Module)  │   │ (Module)  │
     └───────────┘   └───────────┘        └───────────┘   └───────────┘
```

### What We're Building

Core-PM provides:

1. **AI-Powered Project Management** - A **9-agent PM team** that actively manages projects while human teams and module agents build products
2. **Collaborative Knowledge Base** - A Plane-inspired wiki system with real-time Yjs collaboration, RAG integration, and AI-powered search

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

Knowledge Base (Scribe, Wiki, RAG)
├── Stores organizational knowledge
├── Real-time collaborative editing
├── AI-powered search and context
└── Links to tasks, projects, and modules
```

### Why It Matters

SMB businesses struggle with:
- **Estimation accuracy** - Projects consistently run over time and budget
- **Progress visibility** - Stakeholders lack real-time insight into project health
- **Context switching** - Teams waste time updating multiple tools
- **AI integration** - Existing tools treat AI as an afterthought
- **Team coordination** - Human teams and AI agents work in silos
- **Knowledge fragmentation** - Critical information scattered across tools
- **AI context** - AI agents lack access to organizational knowledge

Core-PM solves these by:
1. Embedding PM agents directly into the workflow
2. Supporting human teams with role-based management
3. Enabling hybrid human + AI task assignments
4. Using BMAD workflows as the core orchestration engine
5. **Centralizing knowledge in a searchable, AI-accessible wiki**
6. **RAG integration for AI context across all modules**

### What Makes Core-PM Special

1. **BMAD-Native Workflows** - Built on the 7-phase BUILD methodology plus OPERATE loops as the core orchestration engine
2. **9-Agent PM Team** - Comprehensive coverage of all PM functions (estimation, reporting, planning, risk, etc.)
3. **Human + AI Teams** - First-class support for human team roles alongside AI agents
4. **Confidence-Based Routing** - AI outputs flow through the approval queue automatically
5. **Cross-Module Orchestration** - PM agents coordinate with CRM, Content, and Analytics modules
6. **Future Workflow Builder** - BMAD workflows will support user-defined custom workflows
7. **Integrated Knowledge Base** - Yjs collaborative wiki with RAG-powered AI search
8. **Verified Content System** - Mark authoritative content for AI prioritization (ClickUp Brain-inspired)

---

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Component ID** | Core-PM |
| **Category** | **Platform Core** (not optional module) |
| **Complexity** | High |
| **Priority** | P0 (Platform foundation—all modules depend on this) |
| **Estimated Effort** | 14 weeks |
| **Dependencies** | Platform Foundation (complete). **Core-PM enables all other modules.** |
| **Target Users** | All platform users—Product Managers, Team Leads, Business Owners, Project Teams |
| **Sub-Components** | Project Management, Knowledge Base |

### Core vs Module Distinction

| Aspect | Core (PM & KB) | Module (CRM, Content, etc.) |
|--------|----------------|----------------------------|
| **Required** | Yes—always available | Optional—can be disabled |
| **Foundation** | Provides infrastructure | Consumes infrastructure |
| **Team Control** | Manages all agent teams | Has its own agent team |
| **KB Access** | Owns the Knowledge Base | Reads from Knowledge Base |
| **Workflow Engine** | Runs BMAD workflows | Participates in workflows |

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
| **KB adoption** | 50% of products have linked KB pages | Page-to-project linking |
| **KB search accuracy** | 80% relevant results | RAG search quality score |

### Phase 2 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Estimation confidence | 85% accuracy | Historical velocity analysis |
| Proactive risk alerts | 48h lead time | Pulse alerts before deadline miss |
| Cross-module tasks | 40% linked | Tasks linked to CRM/Content |
| Report generation time | <10 seconds | Herald-generated sprint reports |
| Integration sync success | 99% | Bridge GitHub/GitLab operations |
| **KB verified content** | 30% of pages verified | Authoritative content flagging |
| **AI context utilization** | 60% of AI responses use KB | RAG context inclusion rate |

---

## Product Scope

### MVP (Phase 1) - Core PM + Knowledge Base Foundation

**Goal:** Functional PM system with 6 AI agents, human team support, BMAD workflows, AND foundational Knowledge Base

#### P0 Features (Must Have)

**PROJECT MANAGEMENT**

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

**KNOWLEDGE BASE (MVP)**

8. **Wiki Page System** *(Competitor-inspired: Plane, Notion, Confluence)*
   - KnowledgePage model: title, content (JSON), parent_id, workspace_id
   - Rich text content with Tiptap/ProseMirror (JSON storage)
   - Hierarchical page nesting (unlimited depth)
   - Page CRUD with soft delete
   - Page versioning with history

9. **Basic KB Navigation**
   - Sidebar page tree navigation
   - Breadcrumb navigation
   - Full-text search (PostgreSQL tsvector)
   - Recent pages list

10. **Project-KB Linking**
    - Link KB pages to Products/Projects
    - ProjectPage many-to-many relationship
    - Quick-link from task to KB page
    - KB sidebar in project view

#### P1 Features (Should Have)

**PROJECT MANAGEMENT**

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

**KNOWLEDGE BASE (P1)**

7. **Real-Time Collaboration (Yjs)** *(Competitor-inspired: Plane, Notion)*
   - Yjs CRDT for conflict-free editing
   - Cursor presence (see other editors)
   - Real-time sync across sessions
   - Offline editing with sync on reconnect

8. **@Mentions & #References**
   - @mention users in KB pages
   - #reference tasks, projects, or other pages
   - Backlinks display (see what links to this page)
   - Auto-complete for mentions/references

#### P2 Features (Nice to Have in MVP)

1. **Workload Dashboard** - Cross-product resource view
2. **Simple Mode Toggle** - Hide agent features for light users
3. **CSV Import** - Basic task import with mapping
4. **KB Templates** - Pre-built page templates (meeting notes, project charter, etc.)

### Phase 2 - Growth Features

**Goal:** Full agent team, advanced reporting, integrations, AND RAG-powered Knowledge Base

**PROJECT MANAGEMENT**

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
     - Publish Core-PM as MCP server
     - Tool exposure: tasks, projects, status, estimates, KB search
     - Enable external AI agent integration

5. **Budget Tracking**
   - Budget and actual spend fields on Product
   - Cost-per-phase tracking

6. **Sprint Enhancements** *(Competitor-inspired: Linear, Taiga)*
   - Sprint cooldown period (configurable break between sprints)
   - Doom-line projection (visual deadline risk based on velocity)
   - Baseline comparison snapshots (planned vs actual)

**KNOWLEDGE BASE (Phase 2)**

7. **RAG Integration** *(Core differentiator)*
   - Vector embeddings for all KB pages (pgvector)
   - Semantic search across KB
   - AI agents automatically search KB for context
   - Configurable embedding model (tenant BYOAI)
   - Chunking strategy for optimal retrieval

8. **Verified Content System** *(Competitor-inspired: ClickUp Brain Verified Wiki)*
   - Mark pages as "Verified" (authoritative)
   - Verified content prioritized in AI search
   - Verification workflow (owner signs off)
   - Verification expiration (auto-expire after N days)
   - Visual indicator on verified pages

9. **Scribe Agent** - Knowledge Base Manager
   - Auto-summarize long pages
   - Suggest related content
   - Detect stale pages (no updates in N days)
   - Generate KB insights (coverage gaps, popular pages)
   - Draft page content from tasks/discussions

10. **Advanced KB Features**
    - Page comments and discussions
    - Embed diagrams (Excalidraw integration)
    - Table blocks (database-like tables in pages)
    - Export to Markdown/PDF
    - Import from Notion/Confluence

### Phase 3 - Vision Features

**Goal:** Custom workflows, advanced analytics, external API, AND AI-native Knowledge Base

**PROJECT MANAGEMENT**

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

**KNOWLEDGE BASE (Phase 3)**

7. **AI-Native KB Features**
   - AI auto-generates page drafts from project context
   - Automatic knowledge extraction from completed tasks
   - AI Q&A over KB (chat with your knowledge base)
   - Smart summaries and TL;DR generation
   - Knowledge gap detection (what's missing?)

8. **Advanced RAG Features**
   - Multi-modal embeddings (images, diagrams)
   - Cross-workspace KB federation (enterprise)
   - Custom embedding fine-tuning
   - RAG analytics (what context is being used?)

9. **KB Governance**
   - Content ownership and permissions
   - Review workflows for sensitive pages
   - Archival policies
   - KB analytics dashboard

10. **External KB Integrations**
    - Sync from external docs (Google Docs, Dropbox Paper)
    - Public documentation portal
    - API for KB content
    - Webhook triggers on KB changes

---

## Agent Team Specification

### Core-PM Agent Team Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Core-PM Agent Team                            │
│         (Manages PM Tool, Knowledge Base & Process)              │
│                                                                  │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │                 Navi (Team Leader)                       │  │
│    │       PM Orchestrator & Coordinator + KB Navigator       │  │
│    │    "I coordinate your PM operations, help you find       │  │
│    │     knowledge, and keep you focused on what matters."   │  │
│    └───────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│    ┌───────────┬───────────┼───────────┬───────────┬───────┐    │
│    │           │           │           │           │       │    │
│    ▼           ▼           ▼           ▼           ▼       ▼    │
│ ┌──────┐  ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐ ┌──────┐   │
│ │ Sage │  │Herald│   │Chrono│   │Scope │   │Pulse │ │Scribe│   │
│ │      │  │      │   │      │   │      │   │      │ │      │   │
│ └──────┘  └──────┘   └──────┘   └──────┘   └──────┘ └──────┘   │
│ Estimator  Reporter   Tracker   Planner    Risk     KB Manager  │
│                                                                  │
│ ┌──────┐  ┌──────┐                                              │
│ │Bridge│  │Prism │   Phase 2 Agents (PM)                        │
│ │      │  │      │                                              │
│ └──────┘  └──────┘                                              │
│ Integrator Analytics                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Responsibilities Summary

| Agent | Primary Domain | KB Integration |
|-------|----------------|----------------|
| **Navi** | PM Orchestration | Searches KB for context, routes KB queries to Scribe |
| **Sage** | Estimation | References historical KB docs for estimation context |
| **Herald** | Reporting | Can generate reports into KB pages |
| **Chrono** | Activity Tracking | Tracks KB page changes alongside task changes |
| **Scope** | Planning | Links planning docs in KB to sprints |
| **Pulse** | Risk Monitoring | Checks KB for risk documentation |
| **Scribe** | **Knowledge Base** | Manages KB content, RAG, verification |
| **Bridge** | Integrations | Imports external docs into KB |
| **Prism** | Analytics | Analyzes KB usage and coverage |

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
    # Task Management
    suggest_task,           # Suggest task creation (not auto-create)
    update_task,            # Modify task properties
    assign_task,            # Assign to human or agent
    move_to_phase,          # Move task between phases
    suggest_breakdown,      # Break epic into stories (suggests, doesn't auto-create)
    get_daily_summary,      # Generate morning briefing
    route_to_specialist,    # Delegate to Sage, Herald, etc.
    link_to_crm,            # Link task to CRM contact/deal (optional)

    # Knowledge Base Navigation
    search_kb,              # Full-text and semantic KB search
    get_related_kb_pages,   # Find KB pages related to current task/project
    link_kb_to_task,        # Link a KB page to a task
    route_to_scribe,        # Delegate KB operations to Scribe
]
```

**Triggers:**
| Event | Action | Approval |
|-------|--------|----------|
| `pm.phase.started` | Suggest task breakdown | Always suggest, never auto |
| `pm.task.overdue` | Alert via Pulse | Notify |
| `chat.message.task_intent` | Suggest task creation | Review before create |
| `chat.message.kb_query` | Search KB and return context | Auto |
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

    # Knowledge Base Import
    import_docs_to_kb,       # Import external docs into KB
]
```

---

#### 8. Scribe - Knowledge Base Manager

**Role:** Knowledge Base management, RAG operations, and content quality

**Persona:**
> "I'm Scribe, your knowledge keeper. I organize your wiki, ensure content stays fresh, and power the AI's understanding of your business. Ask me to find information, summarize pages, or help you write documentation."

**Responsibilities:**
- KB page CRUD operations
- Content organization and structure
- RAG pipeline management
- Semantic search execution
- Stale content detection
- Verification workflow management
- Auto-summarization of long content
- Related content suggestions

**KB Architecture:**
```
Knowledge Base
├── Workspaces (tenant-level)
│   └── Root Pages
│       └── Nested Pages (unlimited depth)
│
├── Project Links (many-to-many)
│   └── ProjectPage join table
│
├── RAG Pipeline
│   ├── Content Chunking
│   ├── Embedding Generation (tenant BYOAI)
│   └── Vector Storage (pgvector)
│
└── Verification System
    ├── Verified (authoritative)
    ├── Unverified (default)
    └── Expired (needs re-verification)
```

**Stale Content Detection:**
```
Default Thresholds (Configurable):
- Page not updated in 90 days → Flag as "Needs Review"
- Page not viewed in 180 days → Suggest archival
- Linked project completed → Prompt for knowledge capture
- Verification expired → Flag for re-verification
```

**RAG Configuration:**
```python
rag_config = {
    "chunk_size": 512,           # Tokens per chunk
    "chunk_overlap": 50,         # Overlap between chunks
    "embedding_model": "tenant_default",  # Use tenant's BYOAI
    "top_k": 5,                  # Results per query
    "verified_boost": 1.5,       # Boost verified content
    "recency_decay": 0.95,       # Recent content slight boost
}
```

**Tools:**
```python
scribe_tools = [
    # Page Management
    create_kb_page,          # Create new KB page
    update_kb_page,          # Update page content
    delete_kb_page,          # Soft delete page
    move_kb_page,            # Move to new parent
    duplicate_kb_page,       # Clone page
    get_page_history,        # Version history

    # Search & Discovery
    search_kb,               # Full-text + semantic search
    find_related_pages,      # Pages related to topic/task
    get_backlinks,           # Pages linking to this page
    suggest_content,         # AI-suggest content for query

    # RAG Operations
    generate_embeddings,     # Create/update embeddings for page
    query_rag,               # Semantic search with RAG
    get_context_for_task,    # Get KB context for a task

    # Quality & Verification
    mark_verified,           # Mark page as verified
    expire_verification,     # Remove verification status
    detect_stale_pages,      # Find outdated content
    suggest_updates,         # AI-suggest content updates
    summarize_page,          # Generate TL;DR

    # Organization
    link_page_to_project,    # Link to Product/Project
    unlink_page,             # Remove project link
    generate_toc,            # Generate table of contents
    suggest_structure,       # AI-suggest page organization
]
```

**Triggers:**
| Event | Action | Approval |
|-------|--------|----------|
| `kb.page.created` | Generate embeddings | Auto |
| `kb.page.updated` | Update embeddings | Auto |
| `pm.project.completed` | Suggest knowledge capture | Suggest |
| `schedule.weekly` | Stale page scan | Auto, notify |
| `kb.verification.expired` | Alert page owner | Notify |
| `chat.message.kb_query` | RAG search | Auto |

**Implementation:**
```python
scribe = Agent(
    name="Scribe",
    role="KB Manager",
    model=get_tenant_model(tenant_id),
    instructions=[
        "Manage the Knowledge Base for this workspace.",
        "Ensure content is organized, searchable, and up-to-date.",
        "Prioritize verified content in search results.",
        "Suggest knowledge capture when projects complete.",
        "Help users find information quickly using RAG.",
        "Flag stale content for review.",
    ],
    storage=PostgresStorage(table_name="kb_sessions"),
)
```

---

#### 9. Prism - Analytics & Insights

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
# (proposed) Core-PM team config shape (location/format TBD)
core_pm_team:
  name: "Core PM Team"
  mode: "coordinate"
  leader: "navi"
  members:
    # MVP (Phase 1)
    - navi      # Orchestrator + KB Navigator
    - sage      # Estimation
    - herald    # Reporting
    - chrono    # Tracking
    - scope     # Planning
    - pulse     # Risk
    # Phase 2
    - bridge    # Integration
    - scribe    # Knowledge Base Manager
    - prism     # Analytics
  storage: PostgresStorage
  memory:
    shared: true
    key_prefix: "core_pm_team"
  defaults:
    suggestion_mode: true  # Agents suggest, don't auto-execute
    confidence_threshold: 0.85
    kb_rag_enabled: true   # Enable RAG for all agents
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

Core-PM supports human teams alongside AI agents:

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
    └── AI Agent Team (Core-PM Agents)
        ├── MVP: Navi, Sage, Herald, Chrono, Scope, Pulse
        └── Phase 2: Bridge, Scribe, Prism
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
| Agent concurrent executions | 10/workspace | 100/workspace |

### Security

- **Row Level Security (RLS)** on all PM tables
- **workspaceId required** on every Core-PM model (RLS isolation boundary). Where legacy code uses `tenantId` (event bus), treat it as `workspaceId`.
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
│ workspaceId │     │ businessId  │     │ productId   │     │ phaseId     │
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

### Knowledge Base Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ KnowledgePage   │────<│ PageVersion     │     │ PageEmbedding   │
│                 │     │                 │     │                 │
│ id              │     │ id              │     │ id              │
│ workspaceId     │     │ content (JSON)  │     │ chunkIndex      │
│ parentId        │     │ version         │     │ chunkText       │
│ title           │     │ createdBy       │     │ embedding[]     │
│ slug            │     │ createdAt       │     │ createdAt       │
│ content (JSON)  │     │ changeNote      │     └─────────────────┘
│ isVerified      │     └─────────────────┘
│ verifiedAt      │
│ verifiedBy      │     ┌─────────────────┐
│ verifyExpires   │     │ ProjectPage     │ (Many-to-Many)
│ ownerId         │     │                 │
│ viewCount       │     │ productId       │
│ lastViewedAt    │     │ pageId          │
│ createdAt       │     │ isPrimary       │
│ updatedAt       │     │ createdAt       │
│ deletedAt       │     └─────────────────┘
└─────────────────┘
         │
         └────< (self-referential: parent-child hierarchy)
```

### Knowledge Base Entity Details

| Entity | Purpose |
|--------|---------|
| `KnowledgePage` | Wiki page with rich text content (Tiptap JSON) |
| `PageVersion` | Version history for each page edit |
| `PageEmbedding` | Vector embeddings for RAG (pgvector) |
| `ProjectPage` | Many-to-many link between Products and KB pages |
| `PageComment` | Comments/discussions on KB pages |
| `PageMention` | @mentions and #references within pages |

### Knowledge Base Schema (Prisma)

```prisma
model KnowledgePage {
  id            String    @id @default(cuid())
  workspaceId   String
  parentId      String?
  title         String
  slug          String
  content       Json      // Tiptap/ProseMirror JSON
  contentText   String    // Plain text for full-text search

  // Verification
  isVerified    Boolean   @default(false)
  verifiedAt    DateTime?
  verifiedById  String?
  verifyExpires DateTime?

  // Ownership
  ownerId       String

  // Analytics
  viewCount     Int       @default(0)
  lastViewedAt  DateTime?

  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // Relations
  parent        KnowledgePage?   @relation("PageHierarchy", fields: [parentId], references: [id])
  children      KnowledgePage[]  @relation("PageHierarchy")
  versions      PageVersion[]
  embeddings    PageEmbedding[]
  projects      ProjectPage[]
  comments      PageComment[]

  @@index([workspaceId])
  @@index([parentId])
  @@index([ownerId])
  @@index([isVerified])
}

model PageEmbedding {
  id          String    @id @default(cuid())
  pageId      String
  chunkIndex  Int
  chunkText   String
  embedding   Unsupported("vector(1536)")  // pgvector
  createdAt   DateTime  @default(now())

  page        KnowledgePage @relation(fields: [pageId], references: [id])

  @@index([pageId])
}
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
| `KbPageActivity` | Activity log for KB pages (Chrono) |

---

## User Experience

### Information Architecture

```
/pm                                   # Project Management (Core)
├── /dashboard                        # PM dashboard (cross-product)
├── /products                         # Product list
│   └── /[productId]                  # Product detail
│       ├── /overview                 # Product dashboard
│       ├── /team                     # Team management
│       ├── /phases                   # Phase list
│       │   └── /[phaseId]            # Phase detail
│       ├── /tasks                    # Task views
│       │   ├── /list                 # List view
│       │   ├── /kanban               # Kanban board
│       │   ├── /calendar             # Calendar view
│       │   ├── /timeline             # Timeline (Phase 2)
│       │   └── /[taskId]             # Task detail
│       ├── /docs                     # Project-linked KB pages (sidebar)
│       ├── /reports                  # Product reports
│       └── /settings                 # Product settings
├── /my-tasks                         # Personal task list
├── /portfolio                        # Executive dashboard (Phase 2)
└── /settings                         # PM settings
    ├── /templates                    # Phase templates
    └── /integrations                 # GitHub, etc.

/kb                                   # Knowledge Base (Core)
├── /                                 # KB home (recent, favorites)
├── /search                           # KB search results
├── /[pageSlug]                       # Page view/edit
│   ├── /history                      # Version history
│   └── /comments                     # Page discussions
├── /new                              # Create new page
├── /verified                         # Verified pages list
├── /stale                            # Pages needing review
└── /settings                         # KB settings
    ├── /verification                 # Verification policies
    ├── /rag                          # RAG configuration
    └── /templates                    # Page templates
```

### Command Bar Integration

The command bar (`Cmd+K`) provides unified access to both PM and KB:

```
Command Bar Actions:
├── "Create task..." → Quick task creation
├── "Create page..." → Quick KB page creation
├── "Search KB: {query}" → Semantic KB search
├── "Find task: {query}" → Task search
├── "Go to product..." → Product navigation
├── "Go to page..." → KB page navigation
└── "Ask Navi..." → Chat with PM agent
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

**5. Create KB Page and Link to Project**
```
[KB Home] → [+ New Page] → [Select Template (optional)]
    → [Enter Title] → [Rich text editor with Yjs]
    → [Link to Project] → [Select Product]
    → [Save] → [Page created with embeddings]
```

**6. AI-Powered KB Search**
```
[Command Bar: "Search KB: deployment process"]
    → [Scribe performs RAG search]
    → [Results ranked by relevance + verification]
    → [Verified content highlighted]
    → [Click to view/edit page]
```

**7. Knowledge Capture from Completed Project**
```
[Project completed] → [Scribe suggests knowledge capture]
    → [Auto-draft page from project summary]
    → [User reviews and edits]
    → [Links to project for context]
    → [Verification workflow (optional)]
```

**8. Verify KB Content**
```
[KB Page] → [Mark as Verified]
    → [Select verification expiry (30/60/90 days)]
    → [Page marked verified with badge]
    → [Boosted in AI search results]
```

### Onboarding: "Meet Your Core-PM Team"

When a user first accesses Core-PM:

1. **Introduction Modal**
   - "Your Core-PM Team is ready to help"
   - 9-agent team overview (including Scribe for KB)

2. **Agent Introductions**
   - Navi: "I'm your PM co-pilot and knowledge navigator"
   - Sage: "I help with estimates"
   - Herald: "I summarize your progress"
   - Chrono: "I track everything"
   - Scope: "I help with planning"
   - Pulse: "I watch for risks"
   - Scribe: "I manage your knowledge base" *(Phase 2)*

3. **First Product**
   - Guided product creation
   - Template selection (BMAD recommended)
   - Team setup wizard

4. **First Task**
   - Quick capture demo (`c` key)
   - Suggestion mode explanation
   - Assignment types demo

5. **First KB Page**
   - Create a project documentation page
   - Link to product
   - Quick template selection

6. **Simple Mode Option**
   - "Prefer a simpler experience?"
   - Toggle to hide agent features
   - Can re-enable anytime

---

## Technical Implementation Specification

### Directory Structure

This section is split into:
1. **Current repo structure** (what exists today)
2. **Proposed Core-PM additions** (what will be created when Core-PM is implemented)

#### Current (as of 2025-12-16)

- Frontend routes live under `apps/web/src/app/` (App Router); Core-PM routes do **not** exist yet.
- Backend features live under `apps/api/src/` (feature folders like `approvals/`, `events/`, `realtime/`); there is no `src/modules/*` layout today.
- Database schema is currently a single file: `packages/db/prisma/schema.prisma`.
- Agent runtime lives under `agents/` with domain teams like `agents/validation/`, `agents/planning/`, `agents/knowledge/`.

#### Proposed Core-PM additions (Planned)

```
apps/
├── web/src/app/(dashboard)/core-pm/          # Core-PM UI (planned)
│   ├── products/                            # Product pages (Phase 1)
│   ├── tasks/                               # Kanban/List (Phase 1), timeline (Phase 2)
│   └── kb/                                  # KB CRUD (Phase 1), collab/RAG (Phase 2)
│
├── api/src/core-pm/                          # Core-PM API (planned)
│   ├── pm/                                   # Products/Phases/Tasks
│   ├── kb/                                   # Pages/Search/Verification
│   └── events/                               # Event publishing via existing event bus
│
agents/                                       # AgentOS runtime (existing)
└── (planned) agents/core_pm/                 # New Core-PM team + tools (future)

packages/db/prisma/schema.prisma              # Single schema file (current)
```

### Team Factory Pattern

```python
# (proposed) Core-PM team factory (pattern aligned with existing teams in agents/*/team.py)
from agno.team import Team

def create_core_pm_team(
    session_id: str,
    user_id: str,
    workspace_id: str,
    business_id: str,
    product_id: str,
) -> Team:
    """Create Core-PM agent team for a product (Phase-gated feature flags)."""

    # MVP Agents (Phase 1)
    navi = create_navi(...)
    sage = create_sage(...)
    herald = create_herald(...)
    chrono = create_chrono(...)
    scope = create_scope(...)
    pulse = create_pulse(...)

    # Phase 2 Agents (initialized only when enabled)
    scribe = create_scribe(...)

    return Team(
        name="Core-PM Team",
        mode="coordinate",
        leader=navi,
        members=[sage, herald, chrono, scope, pulse, scribe],
        instructions=[
            "You are the Core-PM Team managing this product and its knowledge.",
            "Navi leads and coordinates all PM and KB operations.",
            "ALWAYS suggest actions, never auto-execute without confirmation.",
            "Route approvals through Sentinel when confidence < threshold.",
            "Support human team members alongside AI operations.",
            "Use Scribe for all KB operations and RAG search.",
            "Prioritize verified KB content in all AI responses.",
        ]
    )
```

### Event Bus Events

```typescript
// Planned Core-PM event types (not yet present in packages/shared/src/types/events.ts)
// Phase 1 should continue to use existing platform events:
// - approval.* (ApprovalItem lifecycle)
// - agent.* (Agent run lifecycle)
// - workspace.* (membership changes)
//
// Only add pm.* / kb.* when they are typed + validated (Zod) in packages/shared.

// PM Event Types (planned)
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

// KB Event Types
'kb.page.created'
'kb.page.updated'
'kb.page.deleted'
'kb.page.moved'
'kb.page.viewed'

'kb.page.verified'
'kb.page.verification_expired'
'kb.page.unverified'

'kb.page.linked_to_project'
'kb.page.unlinked_from_project'

'kb.embedding.created'
'kb.embedding.updated'
'kb.embedding.deleted'

'kb.search.performed'
'kb.rag.query'
'kb.rag.context_used'

'kb.stale.detected'
'kb.stale.resolved'

'kb.comment.created'
'kb.comment.updated'
'kb.comment.deleted'
```

---

## Scope Boundaries (Prevent Phase Leakage)

Core-PM is the platform core, but Phase 1 still needs strict boundaries to ship safely and avoid “Phase 2-by-accident”.

### Explicitly Out of Scope in Phase 1 (MVP)

1. Real-time collaborative KB editing (Yjs/Hocuspocus)
2. pgvector embeddings + semantic search (RAG)
3. Verified content governance (verification workflows + expiry enforcement)
4. Import/export from Notion/Confluence/PDF beyond basic Markdown export
5. Public REST API + webhooks for third parties
6. Custom workflow builder (user-defined workflows)

### Explicitly Out of Scope in Phase 2 (unless re-scoped)

1. Full “AI-native KB” auto-generation suite (Phase 3)
2. External API stability guarantees and versioning (Phase 3)
3. Workflow builder GA (Phase 3)

## Event Strategy (Typed + Validated)

1. Phase 1 should reuse existing platform event bus contracts (`packages/shared/src/types/events.ts`):
   - approval.* (ApprovalItem lifecycle)
   - agent.* (Agent run lifecycle)
   - workspace.* (membership changes)
2. pm.* / kb.* domain events are allowed only after:
   - EventTypes are added to `packages/shared/src/types/events.ts`
   - Payload schemas are added to `packages/shared/src/schemas/events.ts`
   - Producers/consumers validate payloads at runtime
3. Real-time updates in Phase 1 should follow the existing Socket.io patterns in `apps/api/src/realtime/` (KB collaboration via Yjs/Hocuspocus remains Phase 2).

## Implementation Phases

### Phase 1: MVP (6 weeks)

**Week 1-2: Data Layer & Core APIs**
- Product, Phase, Task Prisma models
- Team and TeamMember models
- **KnowledgePage, PageVersion models**
- CRUD API endpoints
- RLS policies
- Event bus publishers

**Week 3-4: MVP Agents (6 Agents)**
- Navi orchestrator (with KB search routing)
- Sage estimator
- Herald reporter
- Chrono tracker
- Scope planner
- Pulse risk monitor
- Agent team configuration

**Week 5: Core PM UI**
- Product dashboard
- Kanban board
- List view
- Task detail panel
- Team management page
- Quick capture (`c` key)
- WebSocket events

**Week 6: Core KB Foundation**
- KB page CRUD (frontend + backend)
- Rich text editor (Tiptap)
- Page hierarchy navigation
- Full-text search (PostgreSQL tsvector)
- Project-KB linking (ProjectPage)
- Basic KB home page

### Phase 2: Growth Features (4 weeks)

**Week 7-8: Phase 2 Agents & Views**
- Bridge integration agent
- **Scribe KB manager agent**
- Prism analytics agent
- Timeline view
- Saved views
- Portfolio dashboard
- GitHub integration

**Week 9: KB RAG & Collaboration**
- **Yjs real-time collaboration**
- **pgvector embeddings**
- **Semantic search (RAG)**
- **@mentions and #references**
- Cursor presence

**Week 10: KB Advanced Features**
- **Verified content system**
- **Stale page detection**
- Page templates
- Import from Notion/Confluence
- Export to Markdown/PDF

**Week 11: Advanced PM Features**
- Import wizard (Jira, Asana)
- Enhanced reporting (Herald)
- Budget tracking
- Slack notifications

### Phase 3: Vision Features (3 weeks)

**Week 12-13: Workflow Builder & API**
- Custom workflow builder
- Public REST API
- Webhooks
- Predictive analytics (Prism)
- **KB API endpoints**

**Week 14: AI-Native KB**
- **AI auto-generates page drafts**
- **Knowledge extraction from completed tasks**
- **AI Q&A over KB**
- **Knowledge gap detection**
- **Advanced RAG features**

---

## Phase Exit Criteria (Definition of Done)

### Phase 1 (MVP) Exit Criteria

1. Data model + RLS
   - Core-PM tables exist with `workspaceId` isolation and RLS validated against cross-workspace access attempts
2. API + permissions
   - CRUD endpoints for Products/Phases/Tasks and KB Pages/Versions (no collaboration required)
   - Authorization rules documented and enforced (who can create/edit/verify)
3. UI
   - Kanban + List views, quick capture, task detail, team management
   - KB CRUD + navigation + full-text search (FTS)
4. HITL + audit
   - Agent suggestions route through existing ApprovalItem flow
   - Critical state transitions are audit logged using existing audit/event infrastructure
5. Quality gates
   - `pnpm type-check` + `pnpm lint` pass; deterministic tests for new services
   - Baseline P95 performance for list/search endpoints measured

### Phase 2 Exit Criteria

1. Collaboration
   - Yjs/Hocuspocus live editing works with authentication, authorization, and persistence
2. Semantic search
   - pgvector extension installed via migrations; embeddings pipeline operational and backfillable
3. Governance
   - Verified content workflow implemented with explicit permission rules + UI affordances
4. Scalability
   - Vector index strategy chosen and tuned; background jobs for embedding refresh are observable/retriable

### Phase 3 Exit Criteria

1. Workflow builder
   - User-defined workflows are persisted, versioned, and executed safely with approval gates
2. External API
   - Public API + webhooks with authentication, rate limits, versioning policy, and documentation
3. AI-native KB
   - Auto-generation, extraction, and gap detection features ship with explicit approval gates and clear provenance

## Traceability Matrix (Starter)

| Capability | PRD reference | Data model | API surface (planned) | Phase 1 events | Phase 1 tests |
|-----------|---------------|------------|------------------------|----------------|--------------|
| Product CRUD | FR-1 | Product | `apps/api/src/core-pm/pm/*` | approval.* when agent-created | Service + authorization tests |
| Phase CRUD | FR-2 | Phase | `apps/api/src/core-pm/pm/*` | none required | Service tests + ordering rules |
| Task workflow | FR-3 | Task | `apps/api/src/core-pm/pm/*` | approval.* + agent.* | State transition tests |
| KB CRUD | KB-01/KB-02 | KnowledgePage, PageVersion | `apps/api/src/core-pm/kb/*` | agent.* for drafts | Versioning + permissions tests |
| KB full-text search | KB-02 | KnowledgePage.contentText | `GET /kb/search` | none required | Query tests (fixtures) |

## Epic Summary

### Project Management Epics

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
| **PM Subtotal** | | **80** | **230** | |

### Knowledge Base Epics

| Epic | Phase | Stories | Points | Focus |
|------|-------|---------|--------|-------|
| KB-01: Data Layer | MVP | 8 | 21 | KB models, versioning, linking |
| KB-02: Core KB UI | MVP | 10 | 28 | Page editor, navigation, search |
| KB-03: Scribe Agent | Phase 2 | 8 | 24 | KB management, stale detection |
| KB-04: RAG Pipeline | Phase 2 | 10 | 32 | Embeddings, semantic search |
| KB-05: Real-Time Collab | Phase 2 | 6 | 18 | Yjs, cursors, presence |
| KB-06: Verified Content | Phase 2 | 5 | 14 | Verification workflow |
| KB-07: AI-Native KB | Phase 3 | 8 | 26 | Auto-generation, Q&A |
| KB-08: KB API & Governance | Phase 3 | 5 | 14 | REST API, permissions |
| **KB Subtotal** | | **60** | **177** | |

### Combined Totals

| Phase | Stories | Points |
|-------|---------|--------|
| MVP (PM + KB) | 57 | 189 |
| Phase 2 (PM + KB) | 59 | 170 |
| Phase 3 (PM + KB) | 24 | 72 |
| **Grand Total** | **140** | **407** |

### MVP Priority Tiers

Within MVP (Phase 1), if timeline pressure occurs:

**P0 (Must Ship):** 55 stories, 145 points
- PM data layer complete
- KB data layer complete
- Navi + Sage + Chrono agents
- Kanban + List views
- Basic KB page CRUD
- Basic team management
- Quick capture

**P1 (Should Ship):** 18 stories, 52 points
- Herald + Scope + Pulse agents
- Calendar view
- Full team capacity planning
- Notification controls
- KB full-text search
- Project-KB linking

**P2 (Nice to Have):** 9 stories, 25 points
- Simple timeline (view only)
- Simple mode toggle
- CSV import
- KB templates

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
| **pgvector** | Complete | Vector embeddings for RAG |

### What Core-PM Enables (Downstream)

| Component | How It Uses Core-PM |
|-----------|---------------------|
| BM-CRM | Link tasks to contacts/deals, agent orchestration |
| BM-Content | Content project management, KB for content assets |
| BME-* modules | Product execution via PM workflows |
| All AI agents | Search KB for context (RAG) |
| Platform chat | Navi answers questions with KB context |

### Module Dependencies (Core-PM Provides)

| Module | Dependency Type | Notes |
|--------|-----------------|-------|
| BM-CRM | Optional | Link tasks to contacts/deals |
| BME-* | Consumer | Product execution modules use PM |
| BMT-Analytics | Consumer | PM feeds analytics |
| **All Modules** | **RAG Consumer** | All modules can search KB |

### External Dependencies

| Integration | Required | Phase |
|-------------|----------|-------|
| GitHub | Phase 2 | PR linking |
| GitLab | Phase 2 | PR linking |
| Slack | Phase 2 | Notifications |
| Jira | Phase 2 | Import |
| Asana | Phase 2 | Import |
| **Notion** | Phase 2 | KB import |
| **Confluence** | Phase 2 | KB import |

---

## Risk Register

### Project Management Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Estimation accuracy low (cold-start) | User trust | High | Calibration period, prominent manual override, clear messaging |
| Agent over-suggestion | User annoyance | Medium | Default suggest mode, easy dismiss, learning from feedback |
| Human team adoption | Feature underuse | Medium | Prominent team management, role-based defaults |
| 9-agent complexity | Maintenance overhead | Medium | Clear agent boundaries, shared tools |
| BMAD workflow rigidity | User friction | Low | Flexible templates (Kanban-only, Simple List) |
| Real-time sync conflicts | Data issues | Low | Last-write-wins, Chrono logging |
| Performance at scale | UX degradation | Medium | Pagination, virtual scroll, caching |

### Knowledge Base Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| RAG search quality | User frustration | Medium | Verified content boost, embedding quality tuning |
| Yjs collaboration conflicts | Data loss | Low | CRDT guarantees, version history rollback |
| KB stale content | Misleading AI | Medium | Stale detection, verification expiry, Scribe alerts |
| Embedding cost (BYOAI) | User cost | Medium | Batch processing, incremental updates, caching |
| KB adoption | Feature underuse | Medium | Project linking, quick templates, onboarding |
| Large KB performance | Slow search | Low | Vector index optimization, pagination |
| Unverified content in AI | Wrong answers | Medium | Visual indicators, verification prioritization |

---

## References

### Research & Analysis
- [Core-PM Research Findings](/docs/modules/bm-pm/research/BM-PM-RESEARCH-FINDINGS.md)
- [Competitor AI/GitHub/Dependencies Analysis](/docs/modules/bm-pm/research/competitor-analysis.md)
- [Comprehensive Feature Analysis](/docs/modules/bm-pm/research/comprehensive-feature-analysis.md)
- [Plane Analysis](/docs/modules/bm-pm/research/plane-analysis.md) - KB architecture reference

### Architecture & Guides
- [Core-PM Architecture](/docs/modules/bm-pm/architecture.md)
- [Knowledge Base Specification](/docs/modules/bm-pm/kb-specification.md)
- [BM-CRM PRD](/docs/modules/bm-crm/PRD.md) - Agent team reference
- [Platform Architecture](/docs/architecture.md)
- [Agno Implementation Guide](/docs/architecture/agno-implementation-guide.md)
- [BMad Development Guide](/docs/guides/bmad-agno-development-guide.md)

### Competitor References

**Project Management:**
- [Linear](https://linear.app/) - Developer-first PM, best GitHub integration
- [Monday.com](https://monday.com/) - Visual workflows, workload management
- [ClickUp](https://clickup.com/) - All-in-one PM, multi-model AI (ClickUp Brain)
- [Jira](https://www.atlassian.com/software/jira) - Enterprise agile, Rovo agents
- [Asana](https://asana.com/) - Goals/portfolios, AI Studio
- [Wrike](https://www.wrike.com/) - Resource management, proofing, MCP server
- [Taiga](https://taiga.io/) - Open-source Scrum/Kanban, planning poker
- [OpenProject](https://www.openproject.org/) - Open-source enterprise PM, baselines

**Knowledge Base:**
- [Plane](https://plane.so/) - Pages/wiki with Yjs, ProjectPage linking
- [Notion](https://www.notion.com/) - Flexible databases, real-time collab
- [Confluence](https://www.atlassian.com/software/confluence) - Enterprise wiki, Jira integration
- [ClickUp Brain](https://clickup.com/ai) - Verified Wiki for AI prioritization

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

### Scribe System Prompt (Phase 2)
```markdown
You are Scribe, the Knowledge Base manager for {{workspace_name}}.

Your core responsibilities:
1. Manage KB pages (create, organize, maintain)
2. Execute RAG searches for context
3. Detect stale content and suggest updates
4. Manage verification workflows
5. Auto-summarize long content

KB operations:
- Prioritize verified content in all search results
- Generate embeddings for new/updated pages
- Alert page owners when verification expires
- Suggest knowledge capture when projects complete

When users ask questions:
- Search KB using semantic search (RAG)
- Include top verified sources in response
- If KB lacks information, clearly state "No KB content found"
- Suggest creating KB page to capture new knowledge
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
| States | Backlog, Todo, In Progress, Review, Awaiting Approval, Done, Cancelled *(configurable)* |
| BMAD Integration | Optional |
| Best For | Ongoing work, support, small projects |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-15 | Initial PRD |
| 1.1 | 2025-12-16 | Post-elicitation updates: 8 agents, human teams, BMAD strengthening, cold-start strategy, priority tiers |
| 1.2 | 2025-12-16 | Competitor research enhancements: Visual dependency editor (P1), planning poker (P1), Linear-style GitHub deep integration (P2), AI release notes (P2), MCP server (P2), sprint cooldown (P2), doom-line projection (P2), baseline comparison (P2), OKR tracking (P3), enterprise features (P3). Added 9 competitor references. Enhanced Bridge agent with Linear-inspired GitHub integration spec. |
| **2.0** | **2025-12-16** | **Major architectural revision: PM as Platform Core + Knowledge Base.** Key changes: (1) Changed from BM-PM module to Core-PM platform component, (2) Added Knowledge Base with Yjs real-time collab, RAG integration, verified content system, (3) Added Scribe agent for KB management, (4) Updated Navi with KB search routing, (5) Added KB data models (KnowledgePage, PageVersion, PageEmbedding), (6) Added /kb routes and user flows, (7) Added 8 KB epics (60 stories, 177 points), (8) Total scope now 140 stories, 407 points across 14 weeks, (9) Updated risk register with KB-specific risks. |

---

_Document generated for AI Business Hub platform_
_Version 2.0 - December 2025_
