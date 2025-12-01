# BM-PM Module PRD - Research Checklist

**Purpose:** Research tasks to complete before creating the BM-PM (Project Management) Module PRD
**Status:** ✅ COMPLETE
**Created:** 2025-11-30
**Completed:** 2025-11-30
**Output:** See [BM-PM-RESEARCH-FINDINGS.md](./BM-PM-RESEARCH-FINDINGS.md) for comprehensive findings

---

## Overview

This checklist identifies project management-specific gaps that need research before writing the BM-PM PRD. We've already completed Plane analysis, providing a strong foundation.

**Existing Research:**
- `/docs/modules/bm-pm/research/plane-analysis.md` - Plane patterns
- `/docs/modules/bm-pm/architecture.md` - Initial architecture notes
- `/docs/modules/bm-pm/README.md` - Module overview

---

## 1. Project & Workspace Hierarchy

**Current State:** Plane patterns documented, our hierarchy needs definition

### Research Tasks

- [ ] **Hierarchy Structure**
  - [ ] Workspace → Project → Issue (like Plane)?
  - [ ] Support for sub-projects or modules?
  - [ ] Issue hierarchy (Epic → Story → Task → Subtask)?
  - [ ] Cross-project dependencies

- [ ] **Project Configuration**
  - [ ] Project templates
  - [ ] Default settings per project
  - [ ] Project visibility (public, private, internal)
  - [ ] Archive vs delete behavior

- [ ] **Workspace Settings**
  - [ ] Workspace-level defaults
  - [ ] Billing/subscription at workspace level?
  - [ ] Workspace member management
  - [ ] Workspace-to-tenant relationship

- [ ] **Issue Templates**
  - [ ] Bug report template
  - [ ] Feature request template
  - [ ] Task template
  - [ ] Custom template builder

### Questions to Answer

1. One workspace per tenant or multiple?
2. Can issues exist without a project?
3. How do we handle issue movement between projects?
4. What's the maximum hierarchy depth?

### Reference Sources

- [ ] Review Plane hierarchy in depth (from analysis)
- [ ] Study Linear's project/team structure
- [ ] Research Jira project schemes
- [ ] Analyze Notion's workspace model

---

## 2. Issue Management

**Current State:** Plane patterns known, specific requirements needed

### Research Tasks

- [ ] **Issue Entity Design**
  - [ ] Core fields (title, description, status, priority, etc.)
  - [ ] Custom fields architecture
  - [ ] Issue types (Bug, Feature, Task, Epic, etc.)
  - [ ] Labels/tags system
  - [ ] Assignee and reporter fields

- [ ] **Issue States & Workflow**
  - [ ] Default states (Backlog, Todo, In Progress, Done, Cancelled)
  - [ ] Custom state configuration
  - [ ] State transitions and rules
  - [ ] Workflow automation triggers

- [ ] **Issue Relations**
  - [ ] Parent/child relationships
  - [ ] Blocking/blocked-by links
  - [ ] Related/duplicate links
  - [ ] Dependency tracking

- [ ] **Rich Content**
  - [ ] Markdown description support
  - [ ] File attachments
  - [ ] Image embedding
  - [ ] Code snippets
  - [ ] Mentions (@user, #issue)

### Questions to Answer

1. What issue types are required for MVP?
2. Should states be global or per-project?
3. How do we handle issue versioning/history?
4. Maximum attachment size and storage limits?

### Reference Sources

- [ ] Review Plane issue model (from analysis)
- [ ] Study Linear issue properties
- [ ] Research GitHub Issues approach
- [ ] Analyze Shortcut story model

---

## 3. Sprint & Cycle Management

**Current State:** Plane cycles documented, our implementation TBD

### Research Tasks

- [ ] **Cycle/Sprint Entity**
  - [ ] Cycle name, dates, description
  - [ ] Cycle-to-project relationship
  - [ ] Cycle status (upcoming, current, completed)
  - [ ] Cycle capacity planning

- [ ] **Sprint Planning**
  - [ ] Issue-to-cycle assignment
  - [ ] Cycle scope management
  - [ ] Sprint backlog vs product backlog
  - [ ] Velocity tracking

- [ ] **Sprint Execution**
  - [ ] Daily standup support?
  - [ ] Burndown/burnup charts
  - [ ] Sprint progress tracking
  - [ ] Mid-sprint scope changes

- [ ] **Sprint Retrospective**
  - [ ] Retrospective templates
  - [ ] Action items tracking
  - [ ] Velocity trends
  - [ ] Sprint completion metrics

### Questions to Answer

1. Fixed-length sprints or flexible cycles?
2. Can one issue span multiple cycles?
3. How do we handle incomplete work at sprint end?
4. Do we need release/version tracking separate from cycles?

### Reference Sources

- [ ] Review Plane cycle implementation (from analysis)
- [ ] Study Jira sprint mechanics
- [ ] Research Linear cycles approach
- [ ] Analyze Clubhouse/Shortcut iterations

---

## 4. Views & Filters

**Current State:** Plane views documented, implementation needed

### Research Tasks

- [ ] **View Types**
  - [ ] List view (table)
  - [ ] Board view (Kanban)
  - [ ] Calendar view
  - [ ] Timeline/Gantt view
  - [ ] Spreadsheet view

- [ ] **Filter System**
  - [ ] Filter by any field
  - [ ] AND/OR filter logic
  - [ ] Date range filters
  - [ ] Custom filter expressions

- [ ] **Saved Views**
  - [ ] Personal saved views
  - [ ] Shared team views
  - [ ] View templates
  - [ ] Default view per project

- [ ] **Grouping & Sorting**
  - [ ] Group by field (status, assignee, priority)
  - [ ] Multi-level grouping
  - [ ] Custom sort orders
  - [ ] Manual ordering

### Questions to Answer

1. Which views are required for MVP?
2. Can views be shared across projects?
3. How do we handle view performance with large datasets?
4. Do we need a "favorites" or "starred" concept?

### Reference Sources

- [ ] Review Plane views system (from analysis)
- [ ] Study Notion database views
- [ ] Research Airtable view patterns
- [ ] Analyze Monday.com view types

---

## 5. AI Agent Behaviors for PM

**Current State:** Not yet defined for BM-PM

### Research Tasks

- [ ] **PM Orchestrator Agent**
  - [ ] What tasks does the PM agent handle?
  - [ ] Sprint planning assistance
  - [ ] Issue triage and categorization
  - [ ] Workload balancing suggestions
  - [ ] Deadline risk detection

- [ ] **Estimation Agent**
  - [ ] Story point estimation assistance
  - [ ] Historical velocity analysis
  - [ ] Estimation confidence scoring
  - [ ] Scope creep detection

- [ ] **Reporting Agent**
  - [ ] Status report generation
  - [ ] Burndown analysis
  - [ ] Blocker identification
  - [ ] Progress summaries

- [ ] **Cross-Agent Coordination**
  - [ ] How do PM agents interact with CRM agents?
  - [ ] Project linked to deals/contacts?
  - [ ] Content creation from issues?

### Questions to Answer

1. Which PM agent is highest priority?
2. How proactive should PM agents be?
3. Should agents auto-create issues from chat?
4. How do agents surface blockers and risks?

### Reference Sources

- [ ] Study Linear's auto-assignment
- [ ] Research GitHub Copilot for Issues
- [ ] Analyze Asana's workload features
- [ ] Review Notion AI for project management

---

## 6. Integrations & Imports

**Current State:** Not specified

### Research Tasks

- [ ] **Import Sources**
  - [ ] Jira import
  - [ ] Trello import
  - [ ] Asana import
  - [ ] CSV/spreadsheet import
  - [ ] GitHub Issues import

- [ ] **Developer Integrations**
  - [ ] GitHub/GitLab PR linking
  - [ ] Branch-to-issue association
  - [ ] Commit message parsing (#123)
  - [ ] CI/CD status on issues

- [ ] **Communication Integrations**
  - [ ] Slack notifications
  - [ ] Teams notifications
  - [ ] Email notifications
  - [ ] Webhook support

- [ ] **Time & Resource**
  - [ ] Time tracking integration
  - [ ] Calendar sync
  - [ ] Resource management tools

### Questions to Answer

1. Which integrations are must-have for MVP?
2. Do we build native GitHub or use Zapier?
3. How do we handle import data mapping?
4. Real-time sync or manual import?

### Reference Sources

- [ ] Review Plane integration approach
- [ ] Study Linear's GitHub integration
- [ ] Research Jira Cloud integrations
- [ ] Analyze Notion integrations

---

## 7. Real-Time Collaboration

**Current State:** Plane uses Y.js, decision needed

### Research Tasks

- [ ] **Real-Time Features**
  - [ ] Collaborative document editing
  - [ ] Live cursor/presence
  - [ ] Real-time issue updates
  - [ ] Comment threading

- [ ] **Technology Stack**
  - [ ] Y.js for CRDT (like Plane)?
  - [ ] WebSocket requirements
  - [ ] Offline support needs
  - [ ] Conflict resolution

- [ ] **Presence Indicators**
  - [ ] Who's viewing an issue
  - [ ] Who's editing what
  - [ ] Activity feed real-time
  - [ ] Typing indicators in comments

### Questions to Answer

1. Is real-time collaboration required for MVP?
2. Do we need offline support?
3. How do we handle conflict resolution?
4. What's the expected concurrent user load?

### Reference Sources

- [ ] Review Plane Y.js implementation
- [ ] Study Liveblocks for collaboration
- [ ] Research Tiptap collaborative editing
- [ ] Analyze Figma's real-time approach

---

## 8. PM User Interface

**Current State:** Wireframe placeholders exist

### Research Tasks

- [ ] **Issue List/Board**
  - [ ] Kanban board layout
  - [ ] Drag-drop interactions
  - [ ] Quick issue creation
  - [ ] Bulk actions

- [ ] **Issue Detail View**
  - [ ] Layout and sections
  - [ ] Activity/history timeline
  - [ ] Sub-issue display
  - [ ] Related issues panel

- [ ] **Sprint View**
  - [ ] Sprint planning board
  - [ ] Burndown chart
  - [ ] Sprint backlog management
  - [ ] Capacity visualization

- [ ] **Navigation & Shortcuts**
  - [ ] Command palette (like Plane's Power-K)
  - [ ] Keyboard shortcuts
  - [ ] Quick search
  - [ ] Recent items

### Questions to Answer

1. How prominent is chat/agent in PM UI?
2. Mobile/responsive PM requirements?
3. Dark mode support?
4. Customizable dashboard?

### Reference Sources

- [ ] Review Plane UI patterns (from analysis)
- [ ] Study Linear's minimalist UI
- [ ] Research Notion's flexible layouts
- [ ] Analyze Height.app interface

---

## 9. Reporting & Analytics

**Current State:** Not specified

### Research Tasks

- [ ] **Built-In Reports**
  - [ ] Sprint velocity
  - [ ] Burndown/burnup charts
  - [ ] Issue resolution time
  - [ ] Cycle time analysis
  - [ ] Team workload distribution

- [ ] **Custom Reports**
  - [ ] Report builder UI
  - [ ] Field selection
  - [ ] Grouping and aggregation
  - [ ] Chart types available

- [ ] **Dashboards**
  - [ ] Personal dashboards
  - [ ] Team dashboards
  - [ ] Project dashboards
  - [ ] Widget library

- [ ] **Export & Sharing**
  - [ ] PDF export
  - [ ] Share links
  - [ ] Scheduled reports
  - [ ] API access to data

### Questions to Answer

1. Which reports are required for MVP?
2. Do we need a custom report builder?
3. How do reports tie into BMT (Analytics) module?
4. Real-time vs scheduled report generation?

### Reference Sources

- [ ] Review Plane analytics
- [ ] Study Jira reporting
- [ ] Research Linear insights
- [ ] Analyze Monday.com dashboards

---

## Research Priority Order

### Phase 1: Core Data Model (Do First)
1. Project & Workspace Hierarchy (Section 1)
2. Issue Management (Section 2)
3. Sprint & Cycle Management (Section 3)

### Phase 2: User Experience
4. Views & Filters (Section 4)
5. PM User Interface (Section 8)
6. Real-Time Collaboration (Section 7)

### Phase 3: Intelligence & Integration
7. AI Agent Behaviors (Section 5)
8. Integrations & Imports (Section 6)
9. Reporting & Analytics (Section 9)

---

## Completion Tracking

| Section | Research Status | Notes |
|---------|-----------------|-------|
| 1. Hierarchy | ✅ Complete | Business → Product → Phase → Task hierarchy defined |
| 2. Issue Management | ✅ Complete | Task entity, states, relations documented |
| 3. Sprints/Cycles | ✅ Complete | Phase entity with BMAD phase types |
| 4. Views & Filters | ✅ Complete | List, Kanban, Calendar views; filter system |
| 5. AI Agents | ✅ Complete | Navigator, Estimator, Reporter agents |
| 6. Integrations | ✅ Complete | Import sources, GitHub, webhooks |
| 7. Real-Time | ✅ Complete | WebSocket MVP, Y.js deferred |
| 8. User Interface | ✅ Complete | Layout, Kanban, task detail, command palette |
| 9. Reporting | ✅ Complete | Burndown, velocity, agent performance |

---

## Dependencies on Platform Foundation

These items depend on Platform Foundation PRD being complete:

| PM Requirement | Platform Dependency |
|----------------|---------------------|
| Project permissions | RBAC system |
| Workspace isolation | Multi-tenant isolation |
| Activity logging | Audit trail infrastructure |
| Agent interactions | Approval system (Sentinel) |
| Notifications | Notification system |
| Real-time updates | WebSocket infrastructure |

---

## Dependencies on BM-CRM

These items may benefit from BM-CRM being built first:

| PM Feature | CRM Dependency |
|------------|----------------|
| Link issues to contacts/deals | Contact entity exists |
| Customer-facing projects | Company association |
| Client project billing | Deal pipeline integration |

---

## Next Steps

~~1. Complete Platform Foundation research (blockers)~~
~~2. Optionally complete BM-CRM first (shared entities)~~
~~3. Work through Phase 1 PM sections~~
~~4. Document findings in this folder~~
~~5. Once Phase 1-2 complete, ready to start BM-PM PRD~~

### ✅ Research Complete - Ready for PRD

All research sections have been completed. Findings are documented in:
- **[BM-PM-RESEARCH-FINDINGS.md](./BM-PM-RESEARCH-FINDINGS.md)** - Comprehensive findings with recommendations

**Next Action:** Create BM-PM PRD using `/bmad:bmm:workflows:prd`

---

**Document Status:** ✅ Research Complete
**Owner:** AI Business Hub Team
**Completed:** 2025-11-30
