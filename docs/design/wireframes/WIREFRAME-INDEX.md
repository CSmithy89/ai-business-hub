# Hyvve - Wireframe Index

**Purpose:** Comprehensive list of all wireframes needed for Hyvve platform
**Created:** 2025-11-29
**Updated:** 2025-11-30
**Status:** Planning

---

## Overview

This document catalogs all wireframes required for the Hyvve platform, organized by category. Each wireframe should be created as an Excalidraw file in this directory.

**Total Wireframes:** 124+

---

## Readiness Assessment

| Category | Wireframes | Readiness | Documentation |
|----------|------------|-----------|---------------|
| **Core Shell & Navigation** | **6** | 🟢 **95%** | **PRD + UX Design complete** |
| **Chat Interface** | **7** | 🟢 **95%** | **UX Design + Taskosaur patterns** |
| Dashboard & Overview | 5 | 🟢 75% | MASTER-PLAN 8.1 |
| **Approval Queue** | **7** | 🟢 **95%** | **PRD confidence routing complete** |
| **AI Team Panel** | **5** | 🟢 **95%** | **Agent identities defined** |
| **Settings Pages** | **8** | 🟢 **95%** | **BYOAI + RBAC complete** |
| **CRM Module** | **14** | 🟢 **95%** | **Research complete** |
| **PM Module** | **16** | 🟢 **95%** | **Research complete** |
| **Data Components** | **6** | 🟢 **95%** | **STYLE-GUIDE specs complete** |
| **Forms & Inputs** | **5** | 🟢 **95%** | **STYLE-GUIDE specs complete** |
| **Feedback & States** | **5** | 🟢 **95%** | **STYLE-GUIDE patterns complete** |
| **Authentication** | **6** | 🟢 **95%** | **PRD + onboarding flow complete** |
| Workflow Builder | 6 | 🔴 30% | Need research |
| Content Module | 5 | 🔴 25% | Need research |
| Email Module | 5 | 🔴 25% | Need research |
| Video Module | 4 | 🔴 20% | Need research |

**Legend:** 🟢 Ready (70%+) | 🟡 Needs Work (50-70%) | 🔴 Needs Research (<50%)

---

## 1. Core Shell & Navigation (6 wireframes) 🟢

> **Status:** Foundation PRD & UX Design complete - Ready for wireframing
> **Reference:** `/docs/prd.md`, `/docs/ux-design.md`

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| SH-01 | `shell-layout.excalidraw` | Main three-panel layout: sidebar (64-256px), main content, chat panel (320-480px) | P0 | Pending |
| SH-02 | `navigation-sidebar.excalidraw` | Collapsed/expanded states, workspace selector, module icons with badges | P0 | Pending |
| SH-03 | `header-bar.excalidraw` | Logo, workspace selector, notification bell with count, user menu, help, settings | P0 | Pending |
| SH-04 | `status-bar.excalidraw` | Agent status indicators, sync status, connection status | P1 | Pending |
| SH-05 | `command-palette.excalidraw` | Cmd+K palette: search, navigation, actions, recent items | P1 | Pending |
| SH-06 | `mobile-layout.excalidraw` | Responsive layouts: mobile (single panel, bottom nav), tablet (two panels) | P2 | Pending |

### Shell Layout Design Specs

**Three-Panel Layout (from UX Design):**
```
┌────────────────────────────────────────────────────────────────────────┐
│  [Logo]  HYVVE                        🔔(3)  [User ▼]  [?] [⚙]        │
├────────┬───────────────────────────────────────────────────────────────┤
│        │                                                    │         │
│  📊    │  [Main Content Area]                               │ 💬 Chat │
│ Dashbd │                                                    │         │
│        │  • Module-specific UI                              │ Agent   │
│  ✅    │  • Data tables                                     │ Panel   │
│Apprvls │  • Forms                                           │         │
│  (5)   │  • Visualizations                                  │         │
│        │                                                    │         │
│  🤖    │                                                    │         │
│ Agents │                                                    │         │
│        │                                                    │         │
│  ⚙️    │                                                    │         │
│Settngs │                                                    │         │
│        │                                                    │         │
│────────│────────────────────────────────────────────────────│─────────│
│ [ws ▼] │                                                    │ [─][□]  │
└────────┴───────────────────────────────────────────────────────────────┘
```

**Panel Dimensions:**
- Sidebar: 64px collapsed, 256px expanded
- Main Content: Flexible, minimum 600px
- Chat Panel: 320-480px, collapsible to icon

**Responsive Breakpoints:**
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single panel, bottom nav |
| Tablet | 640-1024px | Two panels, collapsible chat |
| Desktop | 1024-1440px | Three panels |
| Wide | > 1440px | Three panels, wider main |

**Dark/Light Mode:**
- Light: Warm cream (#FFFBF5) background
- Dark: Near-black (#0a0a0b) with elevated surfaces
- User preference stored in session

---

## 2. Chat Interface (7 wireframes) 🟢

> **Status:** Foundation complete - Ready for wireframing
> **Reference:** `/docs/ux-design.md`, `/docs/research/taskosaur-analysis.md`

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| CH-01 | `chat-panel.excalidraw` | Main chat panel: collapsible, minimize/maximize, persistent across views | P0 | Pending |
| CH-02 | `chat-messages.excalidraw` | Message types: user, agent (with identity), system, action cards | P0 | Pending |
| CH-03 | `chat-input.excalidraw` | Input with @mentions, /commands, attachments, submit button | P0 | Pending |
| CH-04 | `chat-typing-indicator.excalidraw` | Agent processing states with streaming response preview | P1 | Pending |
| CH-05 | `chat-agent-selector.excalidraw` | @mention picker with agent avatars and status indicators | P1 | Pending |
| CH-06 | `chat-attachments.excalidraw` | File preview, image thumbnails, action buttons in messages | P2 | Pending |
| CH-07 | `chat-history.excalidraw` | Conversation sessions list, search, filters | P2 | Pending |

### Chat Interface Design Specs

**Message Types:**

**User Message:**
```
┌────────────────────────────────────────────────┐
│                                    You         │
│ Create a follow-up email for the Johnson deal  │
│                                     2:34 PM    │
└────────────────────────────────────────────────┘
```

**Agent Message (with identity):**
```
┌────────────────────────────────────────────────┐
│ 🐚 Maya                                        │
│ I've drafted a follow-up email for the        │
│ Johnson deal. The tone matches your previous  │
│ communications with them.                     │
│                                               │
│ [📧 View Draft] [✏️ Edit] [📤 Queue to Send]  │
│                                     2:34 PM   │
└────────────────────────────────────────────────┘
```

**System Message:**
```
┌────────────────────────────────────────────────┐
│ ℹ️ System                                       │
│ Email draft queued for approval. You'll be    │
│ notified when it's ready.                     │
│                                     2:35 PM   │
└────────────────────────────────────────────────┘
```

**Action Card (inline approval):**
```
┌────────────────────────────────────────────────┐
│ 📋 Approval Request                            │
│ "Johnson Deal Follow-up Email"                │
│ Confidence: 78% (Quick Review)                │
│                                               │
│ [👀 Preview] [✓ Approve] [✗ Reject]           │
└────────────────────────────────────────────────┘
```

**Chat Panel States:**
- Expanded: Full panel (320-480px)
- Collapsed: Icon only with notification badge
- Minimized: Thin bar at bottom

**Real-time Features:**
- Streaming responses with typing indicator
- Agent avatar with status dot
- Timestamps with relative time
- Message reactions (thumbs up/down for feedback)

---

## 3. Dashboard & Overview (5 wireframes)

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| DB-01 | `dashboard-main.excalidraw` | Main dashboard with metrics, activity feed | P0 | Pending |
| DB-02 | `dashboard-widgets.excalidraw` | Configurable widget cards (metrics, charts) | P1 | Pending |
| DB-03 | `project-progress.excalidraw` | BUILD phase progress visualization | P1 | Pending |
| DB-04 | `quick-actions.excalidraw` | Quick action buttons/shortcuts panel | P2 | Pending |
| DB-05 | `notifications-panel.excalidraw` | Notification center dropdown/panel | P1 | Pending |

---

## 4. Approval Queue (7 wireframes) 🟢

> **Status:** Foundation PRD complete - Ready for wireframing
> **Reference:** `/docs/prd.md` - Section: Approval System (Human-in-the-Loop)

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| AP-01 | `approval-queue.excalidraw` | Main approval list with filtering by type/status/priority, sorting by date/confidence | P0 | Pending |
| AP-02 | `approval-card-high.excalidraw` | High confidence (>85%): Auto-approved view with audit log, 1-click undo | P0 | Pending |
| AP-03 | `approval-card-medium.excalidraw` | Medium confidence (60-85%): Quick review card with preview, 1-click approve | P0 | Pending |
| AP-04 | `approval-card-low.excalidraw` | Low confidence (<60%): Full review with AI reasoning, confidence factors | P0 | Pending |
| AP-05 | `approval-detail.excalidraw` | Expanded approval: full context, preview data, related entities, edit before approve | P0 | Pending |
| AP-06 | `approval-diff.excalidraw` | Before/after diff view for content changes | P1 | Pending |
| AP-07 | `approval-batch.excalidraw` | Batch approve/reject similar items, delegation controls | P2 | Pending |

### Approval Queue Design Specs

**Confidence-Based Routing:**
```
┌─ High (>85%) ─────────────────────────────────────┐
│ 🟢 [Type] "Title"                          [95%]  │
│ Auto-approved · Category · 2 min ago              │
│                                    [View] [↩]     │
└───────────────────────────────────────────────────┘

┌─ Medium (60-85%) ──────────────────────────────────┐
│ 🟡 [Type] "Title"                          [72%]  │
│ Quick review · Category · 15 min ago              │
│ ┌──────────────────────────────────────────────┐  │
│ │ Preview excerpt here...                      │  │
│ └──────────────────────────────────────────────┘  │
│                          [Reject] [✓ Approve]     │
└────────────────────────────────────────────────────┘

┌─ Low (<60%) ───────────────────────────────────────┐
│ 🔴 [Type] "Title"                          [45%]  │
│ Full review required · Category · 1 hour ago      │
│ ┌─ AI Reasoning ─────────────────────────────┐    │
│ │ • Factor 1: score, weight, explanation     │    │
│ │ • Factor 2: score, weight, explanation     │    │
│ │ • Recommendation: review/approve/reject    │    │
│ └────────────────────────────────────────────┘    │
│ [View Full] [Edit] [Reject] [✓ Approve]           │
└────────────────────────────────────────────────────┘
```

**Key UI Elements:**
- Confidence badge with color coding (🟢🟡🔴)
- AI recommendation indicator (approve/reject/review)
- Confidence factors breakdown (factor, score, weight, explanation)
- 48-hour timeout indicator with escalation warning
- Bulk selection checkbox for batch operations
- Delegation dropdown for reassignment

**Filter Options:**
- Type: content, email, campaign, deal, integration, agent_action
- Status: pending, approved, rejected, auto_approved, expired
- Priority: low, medium, high, urgent
- Date range: today, this week, custom
- Assignee: me, unassigned, specific user

---

## 5. AI Team Panel (5 wireframes) 🟢

> **Status:** Foundation complete - Ready for wireframing
> **Reference:** `/docs/design/BRAND-GUIDELINES.md`, `/docs/ux-design.md`

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| AI-01 | `ai-team-overview.excalidraw` | All agents with status indicators, activity summary, token usage | P0 | Pending |
| AI-02 | `agent-card.excalidraw` | Individual agent card: avatar, status, current task, model, tokens used | P0 | Pending |
| AI-03 | `agent-detail.excalidraw` | Expanded agent view: history, configuration, performance metrics | P1 | Pending |
| AI-04 | `agent-activity-feed.excalidraw` | Real-time activity stream with streaming responses | P1 | Pending |
| AI-05 | `agent-config-panel.excalidraw` | Agent-specific settings: model assignment, confidence thresholds | P2 | Pending |

### AI Team Design Specs

**Agent Visual Identity:**

| Agent | Icon | Color | Role | Module |
|-------|------|-------|------|--------|
| Hub | 🎯 | Coral #FF6B6B | Orchestrator | Platform |
| Maya | 🐚 | Teal #20B2AA | CRM Agent | BM-CRM |
| Atlas | 🗺️ | Orange #FF9F43 | PM Agent | BM-PM |
| Sage | 🌿 | Green #2ECC71 | Finance Agent | BM-FIN |
| Nova | ✨ | Pink #FF6B9D | Marketing Agent | BM-MKT |
| Echo | 📊 | Blue #4B7BEC | Analytics Agent | BMT |

**Agent Card Layout:**
```
┌────────────────────────────────────────┐
│ [Icon] Agent Name                      │
│ ●  Status: Active / Idle / Processing  │
│                                        │
│ Current: "Analyzing Q3 sales data..."  │
│ Model: claude-3-sonnet                 │
│ Tokens: 12,450 today                   │
│                                        │
│ [View History] [Configure]             │
└────────────────────────────────────────┘
```

**Status Indicators:**
- 🟢 Active - Currently processing a task
- 🟡 Idle - Available, awaiting requests
- 🔴 Error - Task failed, needs attention
- ⚪ Disabled - Agent turned off

**Real-time Activity Feed:**
- Streaming responses with typing indicator
- Task start/complete timestamps
- Token usage per task
- Approval requests inline

---

## 6. Settings Pages (8 wireframes) 🟢

> **Status:** Foundation PRD complete - Ready for wireframing
> **Reference:** `/docs/prd.md` - BYOAI Configuration, Workspace Management

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| ST-01 | `settings-layout.excalidraw` | Settings page shell with tabs/sections | P0 | Pending |
| ST-02 | `settings-api-keys.excalidraw` | BYOAI key management: add, validate, test, remove (Claude/OpenAI/Gemini/DeepSeek/OpenRouter) | P0 | Pending |
| ST-03 | `settings-model-config.excalidraw` | Agent Model Preferences: per-agent provider/model selection, fallback config, cost indicators, OpenRouter model browser | P0 | Pending |
| ST-04 | `settings-token-usage.excalidraw` | Token usage dashboard: daily/monthly, per-provider, per-agent, cost estimates | P0 | Pending |
| ST-05 | `settings-cost-optimization.excalidraw` | Cost rules, daily limits, budget alerts, DeepSeek fallback toggle | P1 | Pending |
| ST-06 | `settings-workspace.excalidraw` | Workspace settings: name, avatar, timezone, slug | P1 | Pending |
| ST-07 | `settings-members.excalidraw` | Member management: invite, roles (Owner/Admin/Member/Viewer/Guest), module permissions | P1 | Pending |
| ST-08 | `settings-notifications.excalidraw` | Notification preferences: in-app, email, approval alerts | P2 | Pending |

### Settings Design Specs

**BYOAI Configuration:**

**Supported Providers:**
| Provider | Status | Models |
|----------|--------|--------|
| Claude (Anthropic) | Required | claude-3-opus, claude-3-sonnet, claude-3-haiku |
| OpenAI | Required | gpt-4o, gpt-4-turbo, gpt-3.5-turbo |
| Google (Gemini) | Optional | gemini-pro, gemini-pro-vision |
| DeepSeek | Optional | deepseek-chat, deepseek-coder |
| OpenRouter | Optional | 100+ models (Claude, GPT-4, Llama, Mistral, etc.) |

**API Key Card:**
```
┌─────────────────────────────────────────────────┐
│ [Logo] Claude (Anthropic)                       │
│                                                 │
│ API Key: sk-ant-••••••••••••••3f2a              │
│ Status: ✅ Valid (tested 2 hours ago)            │
│ Default Model: claude-3-sonnet                  │
│                                                 │
│ Today: 45,230 tokens ($0.68)                    │
│ This Month: 1.2M tokens ($18.40)                │
│ Limit: 100,000/day                              │
│                                                 │
│ [Test Key] [Edit] [Remove]                      │
└─────────────────────────────────────────────────┘
```

**Token Usage Dashboard:**
- Daily/monthly usage charts
- Per-provider breakdown
- Per-agent breakdown
- Cost estimates in USD
- Budget alert indicators
- Historical comparison

**Agent Model Preferences (ST-03):**
```
┌─────────────────────────────────────────────────────────────┐
│ Agent Model Preferences                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Approval Agent                                               │
│ ┌───────────────────┐  ┌─────────────────┐                  │
│ │ Provider: Claude  │  │ Model: Sonnet   │  💰 Med          │
│ └───────────────────┘  └─────────────────┘                  │
│                                                              │
│ Orchestrator Agent                                           │
│ ┌───────────────────┐  ┌─────────────────┐                  │
│ │ Provider: OpenAI  │  │ Model: GPT-4o   │  💰 Med          │
│ └───────────────────┘  └─────────────────┘                  │
│                                                              │
│ Research Agent                                               │
│ ┌───────────────────┐  ┌─────────────────┐                  │
│ │ Provider:OpenRouter│ │ Model: Llama 3  │  💰 Low          │
│ └───────────────────┘  └─────────────────┘                  │
│  └─ 🔍 Browse 100+ models...                                │
│                                                              │
│ [Save Preferences]                                           │
└─────────────────────────────────────────────────────────────┘
```

**OpenRouter Model Browser (modal when OpenRouter selected):**
```
┌─────────────────────────────────────────────────────────────┐
│ Select OpenRouter Model                    🔍 Search...     │
├─────────────────────────────────────────────────────────────┤
│ ⭐ Popular                                                   │
│   anthropic/claude-3-opus         $15.00/M in  💰💰💰       │
│   openai/gpt-4o                   $5.00/M in   💰💰         │
│   meta-llama/llama-3.1-70b        $0.90/M in   💰           │
│                                                              │
│ 💨 Fast & Cheap                                              │
│   anthropic/claude-3-haiku        $0.25/M in   💰           │
│   mistralai/mistral-7b            $0.07/M in   💰           │
│                                                              │
│ 🧠 Reasoning                                                 │
│   openai/o1-preview               $15.00/M in  💰💰💰       │
│   deepseek/deepseek-r1            $0.55/M in   💰           │
└─────────────────────────────────────────────────────────────┘
```

**Member Roles:**
| Role | Capabilities |
|------|--------------|
| Owner | Full access, delete workspace, transfer ownership |
| Admin | Invite/remove members, configure agents, approve all |
| Member | Create records, run agents, view approvals |
| Viewer | Read-only access to records |
| Guest | Limited access, time-bound |

---

## 7. CRM Module - BM-CRM (14 wireframes) 🟢

> **Status:** Research complete - Ready for wireframing
> **Reference:** `/docs/modules/bm-crm/research/` - All 8 research findings documents

### Core Entity Views (6 wireframes)

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| CRM-01 | `crm-contacts-list.excalidraw` | Contact list with table/kanban toggle, saved views, bulk actions | P1 | Pending |
| CRM-02 | `crm-contact-detail.excalidraw` | Three-panel contact record: info sidebar, main content, activity timeline | P1 | Pending |
| CRM-03 | `crm-company-detail.excalidraw` | Company/Account record with hierarchy, related contacts, org chart | P1 | Pending |
| CRM-04 | `crm-deals-pipeline.excalidraw` | Deal kanban board with stage totals, velocity metrics, quick add | P1 | Pending |
| CRM-05 | `crm-deal-detail.excalidraw` | Deal record with multi-stakeholder contacts, stage history, win probability | P1 | Pending |
| CRM-06 | `crm-activity-timeline.excalidraw` | Polymorphic activity feed (calls, emails, meetings, notes, agent actions) | P2 | Pending |

### Intelligence & Scoring (2 wireframes)

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| CRM-07 | `crm-lead-scoring.excalidraw` | Lead score breakdown: 40% firmographic, 35% behavioral, 25% intent. Tier badges, score history chart | P1 | Pending |
| CRM-08 | `crm-enrichment-panel.excalidraw` | Data enrichment status, one-click enrich, provider badges (Clearbit/Apollo), confidence scores | P1 | Pending |

### Data Operations (2 wireframes)

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| CRM-09 | `crm-import-wizard.excalidraw` | Multi-step CSV import: upload, field mapping, preview, validation, duplicate handling | P1 | Pending |
| CRM-10 | `crm-sync-status.excalidraw` | Integration sync dashboard: HubSpot/Salesforce status, last sync, conflict resolution queue | P2 | Pending |

### Dashboard & Analytics (2 wireframes)

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| CRM-11 | `crm-dashboard.excalidraw` | CRM overview: pipeline value, lead tier distribution, activity metrics, conversion funnel | P1 | Pending |
| CRM-12 | `crm-custom-fields.excalidraw` | Custom field configuration: field types, validation rules, display order | P2 | Pending |

### Agent & Compliance (2 wireframes)

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| CRM-13 | `crm-agent-suggestions.excalidraw` | Scout/Atlas/Flow agent cards: notification levels (silent→blocking), inline actions, feedback thumbs | P1 | Pending |
| CRM-14 | `crm-consent-center.excalidraw` | GDPR consent management, email preferences, suppression list, DSR request handling | P2 | Pending |

### CRM Wireframe Design Specs

**Layout Pattern:** Three-panel layout (Attio/Folk inspired)
- Left: Navigation + quick filters
- Center: Main content (list/board/detail)
- Right: Context panel (timeline, suggestions, enrichment)

**Key Design Elements:**
- Command palette integration (Cmd+K for contact search)
- Lead score badges with color coding (Cold=gray, Warm=amber, Hot=coral, Sales-Ready=green)
- Agent suggestion cards with subtle teal border (Maya's color)
- Enrichment confidence indicators (●●●○○ for 60% confidence)
- Inline editing for rapid data entry
- Skeleton loading states for all async content

**Agent Integration Points:**
- Scout (Lead Scorer): Score badges on contact cards, score breakdown panel
- Atlas (Data Enricher): Enrichment status indicator, one-click enrich button
- Flow (Pipeline Agent): Stage automation suggestions, stuck deal alerts

**Compliance UI:**
- Consent status indicator on contact records
- Visual suppression for opted-out contacts (grayed with icon)
- DSR request status in contact detail header

---

## 8. Project Management Module - BM-PM (16 wireframes) 🟢

> **Status:** Research complete - Ready for wireframing
> **Reference:** `/docs/modules/bm-pm/research/` - All research findings documents

### Product & Project Views (4 wireframes)

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| PM-01 | `pm-product-dashboard.excalidraw` | Products overview: cards with progress bars, phase status, agent count, pending approvals | P1 | Pending |
| PM-02 | `pm-product-detail.excalidraw` | Single product view: phase timeline, metrics summary, team members, BMAD progress | P1 | Pending |
| PM-03 | `pm-phase-view.excalidraw` | Phase/sprint view with burndown chart, capacity bar, sprint backlog | P1 | Pending |
| PM-04 | `pm-sprint-planning.excalidraw` | Sprint planning board: backlog → sprint, capacity visualization, drag-drop assignment | P2 | Pending |

### Task Views (5 wireframes)

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| PM-05 | `pm-task-list.excalidraw` | List/table view with sortable columns, inline editing, bulk actions | P1 | Pending |
| PM-06 | `pm-kanban-board.excalidraw` | Task kanban by state/assignee, drag-drop, quick add, agent badges | P1 | Pending |
| PM-07 | `pm-task-detail.excalidraw` | Slide-out panel: properties, description, activity, subtasks, agent output section | P1 | Pending |
| PM-08 | `pm-calendar-view.excalidraw` | Calendar view for due dates, drag to reschedule | P2 | Pending |
| PM-09 | `pm-timeline-view.excalidraw` | Gantt-style timeline with dependencies, milestones | P2 | Pending |

### Agent Integration (3 wireframes)

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| PM-10 | `pm-intake-queue.excalidraw` | Agent output triage: review, approve, reject, request changes | P1 | Pending |
| PM-11 | `pm-agent-activity.excalidraw` | Agent activity panel: running tasks, progress bars, confidence scores, queue | P1 | Pending |
| PM-12 | `pm-agent-suggestions.excalidraw` | Navigator/Estimator suggestion cards: task breakdown, estimates, workload alerts | P1 | Pending |

### Data Operations & Analytics (4 wireframes)

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| PM-13 | `pm-import-wizard.excalidraw` | Multi-step import: CSV/Jira/Trello, field mapping, preview, duplicate handling | P1 | Pending |
| PM-14 | `pm-filter-builder.excalidraw` | Advanced filter UI: AND/OR logic, date ranges, agent-specific filters | P2 | Pending |
| PM-15 | `pm-reports-dashboard.excalidraw` | Analytics dashboard: velocity chart, burndown, workload distribution, agent metrics | P1 | Pending |
| PM-16 | `pm-burndown-charts.excalidraw` | Burndown/burnup visualization with scope change markers | P2 | Pending |

### PM Wireframe Design Specs

**Layout Pattern:** Plane-inspired three-column layout
- Left: Product/phase navigation + saved views
- Center: Main content (list/board/calendar/timeline)
- Right: Task detail slide-out panel

**Key Design Elements:**
- Command palette (Cmd+K) with PM shortcuts: `c` create, `p` products, `gm` my tasks
- Agent task badges with confidence score (e.g., "🤖 94%")
- Phase progress indicators with BMAD phase colors
- Story point estimates with fibonacci sequence
- Real-time presence indicators (who's viewing)

**Agent Integration Points:**
- Navigator: Task breakdown suggestions, workload balancing alerts, deadline risk badges
- Estimator: Story point suggestions, historical velocity comparison
- Reporter: Status summaries, burndown insights, blocker detection

**Task Types Visual:**
- Epic (purple), Story (blue), Task (gray), Bug (red), Research (teal), Content (coral)
- Agent tasks: robot icon + confidence badge
- Hybrid tasks: human + robot icon

**State Flow:**
- Backlog → Todo → In Progress → In Review → Awaiting Approval → Done
- "Triage" state for new agent outputs
- Visual kanban swimlanes by state group

---

## 9. Data Components (6 wireframes) 🟢

> **Status:** STYLE-GUIDE specs complete - Ready for wireframing
> **Reference:** `/docs/design/STYLE-GUIDE.md` - Section 6: Data Components

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| DC-01 | `data-table.excalidraw` | Configurable data table: sorting, filtering, selection, inline editing, pagination | P0 | Pending |
| DC-02 | `kanban-board.excalidraw` | Generic kanban: drag-drop, WIP limits, collapsed columns, quick add | P0 | Pending |
| DC-03 | `view-selector.excalidraw` | View type switcher: Table/Kanban/Calendar/Timeline with active indicator | P1 | Pending |
| DC-04 | `filter-bar.excalidraw` | Dynamic filter builder: add filter, active pills, clear all | P1 | Pending |
| DC-05 | `bulk-actions.excalidraw` | Bulk action bar: selection count, available actions, clear selection | P1 | Pending |
| DC-06 | `calendar-view.excalidraw` | Calendar view: month/week/day, drag to reschedule, event cards | P2 | Pending |

### Data Components Design Specs

**Data Table (TanStack Table v8):**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ ☐ │ Name ↑↓        │ Email           │ Status    │ Score │ Actions    │
├───┼─────────────────┼─────────────────┼───────────┼───────┼────────────┤
│ ☐ │ John Smith      │ john@acme.com   │ 🟢 Active │ 85    │ ⋮          │
│ ☐ │ Jane Doe        │ jane@corp.io    │ 🟡 Warm   │ 72    │ ⋮          │
│ ☑ │ Bob Wilson      │ bob@startup.co  │ 🔴 Cold   │ 45    │ ⋮          │
├───┴─────────────────┴─────────────────┴───────────┴───────┴────────────┤
│ ◀ 1 2 3 ... 10 ▶                           Showing 1-25 of 250 results │
└─────────────────────────────────────────────────────────────────────────┘
```

**Table Features:**
- Sortable columns with clear ↑↓ indicators
- Inline editing on double-click
- Bulk selection with shift+click range
- Keyboard navigation (arrow keys)
- Skeleton loading states per row
- Resizable columns (drag border)
- Column visibility toggle

**Kanban Board (@atlaskit/pragmatic-drag-and-drop):**
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ TODO (5)     │  │ IN PROGRESS  │  │ DONE (12)    │
│ ───────────  │  │ (3/5) ⚠️     │  │ ───────────  │
│ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │
│ │ Task 1   │ │  │ │ Task 4   │ │  │ │ Task 7   │ │
│ │ 🏷️ P1    │ │  │ │ 👤 Maya  │ │  │ │ ✓ Done   │ │
│ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │
│ [+ Add task] │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Kanban Features:**
- Smooth drag animation (200ms ease-out)
- Column WIP limits with warning indicator
- Collapsed column state (click to expand)
- Quick add at column top
- Optimistic updates (instant UI feedback)
- Card count per column

**View Selector:**
```
┌────────────────────────────────────────────────┐
│  [≡ Table] [▦ Kanban] [📅 Calendar] [═ Timeline]  [+ Save View]  │
└────────────────────────────────────────────────┘
```

**Filter Bar:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [+ Add filter]  Status: Open ✕  │  Assignee: Maya ✕  │  [Clear all]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Forms & Inputs (5 wireframes) 🟢

> **Status:** STYLE-GUIDE specs complete - Ready for wireframing
> **Reference:** `/docs/design/STYLE-GUIDE.md` - Section 8: Forms & Inputs

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| FI-01 | `form-layouts.excalidraw` | Standard form layouts: single column, sections, create/edit modes | P1 | Pending |
| FI-02 | `input-components.excalidraw` | All input types: text, select, date, checkbox, radio, textarea, file | P1 | Pending |
| FI-03 | `input-states.excalidraw` | Input states: default, hover, focus, error, success, disabled | P1 | Pending |
| FI-04 | `modal-dialogs.excalidraw` | Modal and sheet patterns: confirm, form, full-screen | P1 | Pending |
| FI-05 | `inline-editing.excalidraw` | Inline edit: click-to-edit, double-click, edit mode toggle | P2 | Pending |

### Forms & Inputs Design Specs

**Input States:**
```
Default ─────────────────────────
┌─────────────────────────────────┐
│ Placeholder text                │  ← Gray border, gray text
└─────────────────────────────────┘

Focus ───────────────────────────
┌─────────────────────────────────┐
│ Typing here...                  │  ← Coral border, coral glow
└─────────────────────────────────┘

Error ───────────────────────────
┌─────────────────────────────────┐
│ invalid@email                   │  ← Red border
└─────────────────────────────────┘
  ✗ Please enter a valid email

Success ─────────────────────────
┌─────────────────────────────────┐
│ john@company.com           ✓    │  ← Green border, checkmark
└─────────────────────────────────┘
```

**Validation Timing:**
| Field Type | Validate When |
|------------|---------------|
| Email | After blur + format check |
| Password | Real-time strength meter |
| Username | After typing stops (500ms debounce) |
| Phone | After blur + format hint |
| Required | After submission attempt |

**Password Strength:**
```
Password ─────────────────────────
●●●●●●●●●●●●
███████░░░ Strong                ← Real-time strength indicator
```

**Form Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Create Contact                                   ✕  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Name *                                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Email *                                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Company                                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Select company...                           ▼   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
├─────────────────────────────────────────────────────┤
│                           [Cancel]  [Create Contact] │
└─────────────────────────────────────────────────────┘
```

**Form Best Practices:**
1. Explicit labels - Never placeholder-only
2. Single column layout - Easier to scan
3. Logical grouping - Related fields together
4. Smart defaults - Pre-fill when possible
5. Forgiving formats - Accept multiple phone formats
6. Clear CTAs - "Create Contact" not "Submit"
7. Preserve input - Don't clear on error

---

## 11. Feedback & States (5 wireframes) 🟢

> **Status:** STYLE-GUIDE specs complete - Ready for wireframing
> **Reference:** `/docs/design/STYLE-GUIDE.md` - Section 9: Feedback & States

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| FB-01 | `loading-states.excalidraw` | Loading hierarchy: optimistic UI, skeleton, spinner, progress bar | P1 | Pending |
| FB-02 | `empty-states.excalidraw` | Empty states with character illustrations, helpful text, CTA | P1 | Pending |
| FB-03 | `error-states.excalidraw` | Error messages with recovery actions, inline errors, full-page errors | P1 | Pending |
| FB-04 | `toast-notifications.excalidraw` | Toast patterns: success, error, warning, info, with undo action | P1 | Pending |
| FB-05 | `celebration-moments.excalidraw` | Success celebrations: confetti, badges, character animations | P2 | Pending |

### Feedback & States Design Specs

**Loading States Hierarchy:**
| Pattern | Use When | Perceived Speed |
|---------|----------|-----------------|
| Optimistic UI | Action success likely | ⚡ Instant |
| Skeleton Screen | Content structure known | 🏃 Fast |
| Progress Bar | Duration measurable | 🚶 Medium |
| Spinner | Duration unknown, brief | 🐌 Slow |
| Full-page Loader | Avoid if possible | 🦥 Slowest |

**Skeleton Screen:**
```
┌─────────────────────────────────────────────────────┐
│ ████████████████                                    │
│ ████████████████████████████████                    │
│                                                     │
│ ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│ │ ░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░ │  │ ░░░░░░░░░░ │  │
│ │ ░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░ │  │ ░░░░░░░░░░ │  │
│ │ ░░░░░░░░     │  │ ░░░░░░░░     │  │ ░░░░░░░░   │  │
│ └──────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────┘
```
- Animated pulse gradient (1.5s ease-in-out)
- Match content structure shape
- Use for lists, cards, tables

**Empty States:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                [Character Illustration]              │
│                      🎯 Hub                         │
│                                                     │
│            Your approval queue is empty             │
│                                                     │
│    All agent actions have been reviewed. Nice work! │
│    New approvals will appear here automatically.    │
│                                                     │
│               [ View Agent Activity → ]             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Empty State Elements:**
- Character illustration (humanize with agent)
- Short title (what's empty)
- Helpful body text (why + what to do)
- Single CTA button (clear action)
- Agent personality (warm, not sterile)

**Toast Notifications:**
```
Success ─────────────────────────────────────────
┌─────────────────────────────────────────────────┐
│ ✓  Contact created successfully            ✕    │
└─────────────────────────────────────────────────┘

Error with Undo ─────────────────────────────────
┌─────────────────────────────────────────────────┐
│ ✗  Contact deleted                [Undo]   ✕    │
└─────────────────────────────────────────────────┘

Warning ─────────────────────────────────────────
┌─────────────────────────────────────────────────┐
│ ⚠  API key expires in 3 days      [Renew]  ✕    │
└─────────────────────────────────────────────────┘
```

**Toast Positions:**
- Default: Bottom-right
- Destructive: Top-center (more visible)
- Auto-dismiss: 5 seconds (except errors)

**Error Message Guidelines:**
- Human-readable (no technical jargon)
- Concise and precise
- Actionable (how to fix)
- Never blame the user
- Show near the field (inline) or toast (global)

```
❌ Bad: "Error: Invalid input"
✅ Good: "That email doesn't look right. Try something like you@company.com"
```

**Celebration Moments:**
- Complete onboarding → Confetti 🎉
- First task completed → Badge animation 🏅
- Inbox zero / Queue empty → Character celebration 🎭
- Milestone reached → Animated badge
- Payment successful → Checkmark animation ✓

---

## 12. Authentication (6 wireframes) 🟢

> **Status:** PRD specs complete - Ready for wireframing
> **Reference:** `/docs/prd.md` - Authentication & Authorization section

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| AU-01 | `login.excalidraw` | Login page: email/password + Google OAuth, remember me, forgot password | P0 | Pending |
| AU-02 | `register.excalidraw` | Registration: email/password, name, terms checkbox, Google OAuth option | P0 | Pending |
| AU-03 | `email-verification.excalidraw` | Email verification pending, resend link, check spam hint | P0 | Pending |
| AU-04 | `password-reset.excalidraw` | Forgot password flow: email input → check inbox → new password | P0 | Pending |
| AU-05 | `onboarding-wizard.excalidraw` | 4-step wizard: Create workspace → Add API key → Meet AI team → Dashboard | P1 | Pending |
| AU-06 | `workspace-invite.excalidraw` | Invitation acceptance: preview workspace, accept/decline, set password | P1 | Pending |

### Authentication Design Specs

**Login Page:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    [HYVVE Logo]                     │
│                                                     │
│               Welcome back to HYVVE                 │
│                                                     │
│ Email                                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ you@company.com                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Password                                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ••••••••••••                              👁    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ☐ Remember me              [Forgot password?]       │
│                                                     │
│            [ Sign in with Email ]                   │
│                                                     │
│ ──────────────── or ────────────────               │
│                                                     │
│            [ G  Continue with Google ]              │
│                                                     │
│ Don't have an account? [Sign up]                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Onboarding Wizard (4 steps):**
```
Step 1: Create Workspace ─────────────────────────────
┌─────────────────────────────────────────────────────┐
│ ● ○ ○ ○                                    Step 1/4 │
├─────────────────────────────────────────────────────┤
│                                                     │
│              Let's set up your workspace            │
│                                                     │
│ Workspace name                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Acme Corp                                       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Your workspace URL                                  │
│ hyvve.app/acme-corp                                 │
│                                                     │
│                                      [Continue →]   │
└─────────────────────────────────────────────────────┘

Step 2: Add AI Provider ─────────────────────────────
┌─────────────────────────────────────────────────────┐
│ ○ ● ○ ○                                    Step 2/4 │
├─────────────────────────────────────────────────────┤
│                                                     │
│             Connect your AI provider                │
│                                                     │
│    🧠 Claude (Anthropic)  ←  [Recommended]          │
│    🤖 OpenAI                                        │
│    💎 Google Gemini                                 │
│    🔮 DeepSeek                                      │
│                                                     │
│ API Key                                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ sk-ant-...                                      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Test Key]                       [← Back] [Continue →]│
└─────────────────────────────────────────────────────┘

Step 3: Meet Your AI Team ───────────────────────────
┌─────────────────────────────────────────────────────┐
│ ○ ○ ● ○                                    Step 3/4 │
├─────────────────────────────────────────────────────┤
│                                                     │
│               Meet your AI team                     │
│                                                     │
│  🎯 Hub          Your orchestrator                  │
│  🐚 Maya         CRM & relationships                │
│  🗺️ Atlas        Projects & tasks                   │
│  ✨ Nova         Marketing & content                │
│  📊 Echo         Analytics & insights               │
│                                                     │
│  They'll handle 90% of your business operations     │
│  while you focus on what matters.                   │
│                                                     │
│                              [← Back] [Continue →]  │
└─────────────────────────────────────────────────────┘

Step 4: Ready! ──────────────────────────────────────
┌─────────────────────────────────────────────────────┐
│ ○ ○ ○ ●                                    Step 4/4 │
├─────────────────────────────────────────────────────┤
│                                                     │
│                      🎉                             │
│                                                     │
│            You're all set!                          │
│                                                     │
│    Your workspace "Acme Corp" is ready.             │
│    Hub and the team are standing by.                │
│                                                     │
│           [ Go to Dashboard → ]                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Email Verification:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    [HYVVE Logo]                     │
│                                                     │
│                       📧                            │
│                                                     │
│              Check your email                       │
│                                                     │
│    We sent a verification link to:                  │
│    john@company.com                                 │
│                                                     │
│    Click the link to verify your account.           │
│                                                     │
│    Didn't receive it? [Resend email]                │
│                                                     │
│    💡 Check your spam folder                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Rate Limiting (from PRD):**
| Endpoint | Limit | Window |
|----------|-------|--------|
| Sign In | 5 attempts | 15 minutes |
| Sign Up | 3 attempts | 1 hour |
| Password Reset | 3 attempts | 1 hour |
| Email Verification | 5 resends | 1 hour |

**Token Durations:**
| Token | Duration | Purpose |
|-------|----------|---------|
| Access (JWT) | 15 min | API authentication |
| Session | 7-30 days | User session |
| Password Reset | 1 hour | Account recovery |
| Email Verification | 24 hours | Account activation |

---

## 13. Workflow Builder Module (6 wireframes) 🔴

> **Status:** Needs research before wireframing

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| WF-01 | `workflow-dashboard.excalidraw` | Workflow list with status, last run, performance | P1 | Blocked |
| WF-02 | `workflow-creation.excalidraw` | Conversational workflow creation UI | P1 | Blocked |
| WF-03 | `workflow-template-gallery.excalidraw` | Browse/search workflow templates | P1 | Blocked |
| WF-04 | `workflow-canvas.excalidraw` | Visual workflow editor with nodes/edges | P2 | Blocked |
| WF-05 | `workflow-debugging.excalidraw` | Execution timeline, error display, logs | P2 | Blocked |
| WF-06 | `workflow-triggers.excalidraw` | Trigger configuration (schedule, event, manual) | P2 | Blocked |

**Research Needed:**
- [ ] Study n8n/Zapier visual workflow patterns
- [ ] Define conversational workflow creation UX
- [ ] Document trigger types and configuration options

---

## 14. Content Module - BMC (5 wireframes) 🔴

> **Status:** Needs research before wireframing

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| BMC-01 | `content-calendar.excalidraw` | Editorial calendar with drag-drop scheduling | P1 | Blocked |
| BMC-02 | `content-editor.excalidraw` | Rich text editor with AI assist | P1 | Blocked |
| BMC-03 | `content-library.excalidraw` | Asset library with search, tags, folders | P2 | Blocked |
| BMC-04 | `content-templates.excalidraw` | Template gallery and customization | P2 | Blocked |
| BMC-05 | `content-analytics.excalidraw` | Content performance metrics | P2 | Blocked |

**Research Needed:**
- [ ] Study content CMS patterns (Contentful, Strapi)
- [ ] Define AI-assisted writing UX
- [ ] Document content types and workflows

---

## 15. Email Module - BMX (5 wireframes) 🔴

> **Status:** Needs research before wireframing

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| BMX-01 | `email-campaigns.excalidraw` | Campaign list with status, metrics | P1 | Blocked |
| BMX-02 | `email-composer.excalidraw` | Email builder with templates, AI suggest | P1 | Blocked |
| BMX-03 | `email-sequences.excalidraw` | Automated sequence builder | P1 | Blocked |
| BMX-04 | `email-analytics.excalidraw` | Open/click rates, deliverability | P2 | Blocked |
| BMX-05 | `email-templates.excalidraw` | Template library and editor | P2 | Blocked |

**Research Needed:**
- [ ] Study email builder patterns (Mailchimp, SendGrid)
- [ ] Define sequence automation UX
- [ ] Document integration with CRM contacts

---

## 16. Video Module - BMC-Video (4 wireframes) 🔴

> **Status:** Needs research before wireframing

| ID | Wireframe | Description | Priority | Status |
|----|-----------|-------------|----------|--------|
| VID-01 | `video-projects.excalidraw` | Video project list with thumbnails | P2 | Blocked |
| VID-02 | `video-storyboard.excalidraw` | Script/storyboard editor | P2 | Blocked |
| VID-03 | `video-generation.excalidraw` | AI generation progress, preview | P2 | Blocked |
| VID-04 | `video-asset-library.excalidraw` | Generated assets, clips, exports | P2 | Blocked |

**Research Needed:**
- [ ] Study VEO3/Runway/Sora integration patterns
- [ ] Define storyboard-to-video workflow
- [ ] Document asset management for video

---

## Priority Legend

| Priority | Meaning | Target |
|----------|---------|--------|
| P0 | Critical - Core functionality | Phase 1 |
| P1 | High - Important features | Phase 1-2 |
| P2 | Medium - Nice to have | Phase 2-3 |
| P3 | Low - Future enhancement | Phase 3+ |

---

## Wireframe Creation Order

### Sprint 1 - Core Shell (P0)
1. SH-01 Shell Layout
2. CH-01 Chat Panel
3. CH-02 Chat Messages
4. CH-03 Chat Input
5. DB-01 Dashboard Main
6. AP-01 Approval Queue
7. AP-02 Approval Card
8. AI-01 AI Team Overview

### Sprint 2 - Settings & Data (P0-P1)
9. ST-01 Settings Layout
10. ST-02 API Keys
11. ST-03 Model Config
12. DC-01 Data Table
13. DC-02 Kanban Board
14. AU-01 Login
15. AU-02 Register

### Sprint 3 - CRM Module (P1)
16. CRM-01 Contacts List
17. CRM-02 Contact Detail
18. CRM-03 Company Detail
19. CRM-04 Deals Pipeline
20. CRM-05 Deal Detail
21. CRM-07 Lead Scoring
22. CRM-08 Enrichment Panel
23. CRM-09 Import Wizard
24. CRM-11 CRM Dashboard
25. CRM-13 Agent Suggestions

### Sprint 4 - PM Module Core (P1)
26. PM-01 Product Dashboard
27. PM-02 Product Detail
28. PM-03 Phase View
29. PM-05 Task List
30. PM-06 Kanban Board
31. PM-07 Task Detail
32. PM-10 Intake Queue
33. PM-11 Agent Activity
34. PM-12 Agent Suggestions
35. PM-13 Import Wizard
36. PM-15 Reports Dashboard

### Sprint 5 - Remaining CRM & PM (P1-P2)
37. CRM-06 Activity Timeline
38. CRM-10 Sync Status
39. CRM-12 Custom Fields
40. CRM-14 Consent Center
41. PM-04 Sprint Planning
42. PM-08 Calendar View
43. PM-09 Timeline View
44. PM-14 Filter Builder
45. PM-16 Burndown Charts

### Sprint 6+ - Polish & Enhancement
- Remaining P2, P3 wireframes
- Workflow Builder module (after research)
- Content/Email/Video modules (after research)

---

## References

### Design System
- `/docs/design/STYLE-GUIDE.md` - Design tokens and component specs
- `/docs/design/BRAND-GUIDELINES.md` - Hyvve brand colors, typography, AI team

### Platform Foundation (Complete)
- `/docs/prd.md` - Platform Foundation PRD (multi-tenancy, RBAC, approval system, BYOAI)
- `/docs/ux-design.md` - UX Design Document (layout, user flows, component patterns)
- `/docs/architecture.md` - Technical architecture

### Platform Documentation
- `/docs/MASTER-PLAN.md` Section 8 - UI mockups
- `/docs/MODULE-RESEARCH.md` Section 11 - UI/UX patterns
- `/docs/research/taskosaur-analysis.md` - Chat UI, real-time, queue patterns

### CRM Research (Complete)
- `/docs/modules/bm-crm/research/BM-CRM-RESEARCH-CHECKLIST.md` - Research index
- `/docs/modules/bm-crm/research/twenty-crm-analysis.md` - Twenty CRM patterns
- `/docs/modules/bm-crm/research/section-1-contact-company-findings.md` - Entity design, Prisma schemas
- `/docs/modules/bm-crm/research/section-2-lead-scoring-findings.md` - 40/35/25 algorithm, score decay
- `/docs/modules/bm-crm/research/section-3-deal-pipeline-findings.md` - Pipeline stages, velocity metrics
- `/docs/modules/bm-crm/research/section-4-data-enrichment-findings.md` - Clearbit/Apollo, waterfall architecture
- `/docs/modules/bm-crm/research/section-5-external-integrations-findings.md` - HubSpot/Salesforce sync
- `/docs/modules/bm-crm/research/section-6-user-interface-findings.md` - Modern CRM UI patterns (Attio/Folk)
- `/docs/modules/bm-crm/research/section-7-agent-behaviors-findings.md` - Scout/Atlas/Flow behaviors
- `/docs/modules/bm-crm/research/section-8-compliance-privacy-findings.md` - GDPR/CAN-SPAM compliance

### PM Research (Complete)
- `/docs/modules/bm-pm/research/BM-PM-RESEARCH-CHECKLIST.md` - Research index
- `/docs/modules/bm-pm/research/BM-PM-RESEARCH-FINDINGS.md` - Comprehensive findings
- `/docs/modules/bm-pm/research/plane-analysis.md` - Plane patterns (hierarchy, cycles, views)
- `/docs/modules/bm-pm/architecture.md` - Data models, integrations, UI mockups
- `/docs/modules/bm-pm/README.md` - Module overview and roadmap

**PM Research Sections:**
1. Project & Workspace Hierarchy - Business → Product → Phase → Task
2. Issue Management - Task entity, states, relations, rich content
3. Sprint/Cycle Management - BMAD phases, progress snapshots
4. Views & Filters - List, Kanban, Calendar, Timeline, saved views
5. AI Agent Behaviors - Navigator, Estimator, Reporter agents
6. Integrations & Imports - CSV, Jira, GitHub, webhooks
7. Real-Time Collaboration - WebSocket MVP, Y.js deferred
8. PM User Interface - Layout, command palette, agent panels
9. Reporting & Analytics - Burndown, velocity, agent performance

---

## Documentation Gaps (Research Required)

The following documentation is needed before certain wireframe categories can be created:

### 🟡 Categories Needing Enhancement

| Category | Gap | Action Required |
|----------|-----|-----------------|
| Core Shell | Mobile responsive specs | Create mobile breakpoint research |
| Dashboard | Widget specifications | Define metric cards, chart types |
| Settings | Page layouts detail | Document all settings sections |
| Data Components | Table column specs | Define column types, interactions |
| Forms & Inputs | Field specifications | Document validation patterns |
| Authentication | Onboarding flow | Design user onboarding journey |

### 🔴 Categories Needing Research

| Category | Research Topic | Suggested Sources |
|----------|---------------|-------------------|
| Workflow Builder | Visual workflow editor UX | n8n, Zapier, Pipedream |
| Content Module | Content management UX | Contentful, Strapi, Notion |
| Email Module | Email builder patterns | Mailchimp, SendGrid, Klaviyo |
| Video Module | AI video generation UX | Runway, Sora docs when available |

---

## Notes

- Use Excalidraw for rapid wireframing
- Include both light and dark mode variants for P0 screens
- Add annotations for interactive behaviors
- Reference style guide tokens in annotations
- Export PNGs for documentation
- Brand colors: Coral (#FF6B6B), Teal (#20B2AA), Cream (#FFFBF5)
