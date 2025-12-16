# BATCH-17: Phase 2 PM Feature Wireframes

**Batch Number:** 17
**Module:** Core-PM (Platform Core)
**Focus:** Phase 2 Feature Wireframes from Gap Analysis
**Total Wireframes:** 5
**Priority:** P2 (Medium)

---

## References

| Document | Path | Purpose |
|----------|------|---------|
| Core-PM PRD | `docs/modules/bm-pm/PRD.md` | Feature requirements |
| Gap Analysis | `docs/design/wireframes/WIREFRAME-GAP-ANALYSIS.md` | Identified gaps |
| Core-PM Architecture | `docs/modules/bm-pm/architecture.md` | Technical specs |
| Style Guide | `docs/design/STYLE-GUIDE.md` | Brand guidelines |

---

## Wireframe List

| ID | Name | File | Priority | PRD Reference |
|----|------|------|----------|---------------|
| PM-27 | Executive Portfolio Dashboard | `pm-portfolio-dashboard.excalidraw` | P2 | FR-4.6, lines 1361-1366 |
| PM-28 | Daily Briefing (Navi) | `pm-daily-briefing.excalidraw` | P2 | FR-5.3, lines 1381-1385 |
| PM-29 | GitHub/GitLab Integration Panel | `pm-github-integration.excalidraw` | P2 | FR-8.3, lines 1467-1471 |
| PM-30 | CSV Import Wizard | `pm-csv-import.excalidraw` | P2 | FR-8.1, lines 1456-1460 |
| PM-31 | Sprint Enhancements Dashboard | `pm-sprint-enhancements.excalidraw` | P2 | Phase 2, lines 318-321 |

---

## Shared Design Context

### Color Palette
```
Primary Background:     #FFFBF5 (Warm Cream)
Card Background:        #FFFFFF (Pure White)
Border Color:           #f1ebe4 (Warm Border)
Text Primary:           #1a1a2e (Deep Navy)
Text Secondary:         #6b7280 (Gray 500)

PM Theme Color:         #FF9F43 (Sunny Orange) - Atlas agent
Navi Color:             #FF6B6B (Coral) - Orchestrator
Bridge Color:           #20B2AA (Teal) - Integrations
Success/Healthy:        #22C55E (Green 500)
Warning/At Risk:        #F59E0B (Amber 500)
Error/Critical:         #EF4444 (Red 500)
Focus Ring:             #FF6B6B (Coral)
```

### Health Status Colors
```
Excellent:              #22C55E (Green 500)
Good:                   #84CC16 (Lime 500)
Fair:                   #F59E0B (Amber 500)
At Risk:                #F97316 (Orange 500)
Critical:               #EF4444 (Red 500)
```

### Typography
```
Font Family:            Inter
Page Title:             24px / 700 weight / #1a1a2e
Section Heading:        18px / 600 weight / #1a1a2e
Body Text:              14px / 400 weight / #374151
Caption/Meta:           12px / 400 weight / #6b7280
Metric Value:           32px / 700 weight / #1a1a2e
Metric Label:           12px / 500 weight / #6b7280
```

### Component Tokens
```
Border Radius (Cards):  16px
Border Radius (Buttons): 10px
Border Radius (Inputs): 8px
Border Radius (Badges): 6px
Spacing Unit:           4px base (4/8/12/16/24/32)
Shadow (Cards):         0 4px 12px rgba(0,0,0,0.08)
Shadow (Elevated):      0 8px 24px rgba(0,0,0,0.12)
Transition:             150ms ease-out
```

---

## PM-27: Executive Portfolio Dashboard (NEW)

**File:** `pm-portfolio-dashboard.excalidraw`
**Priority:** P2 (Medium)
**PRD Reference:** FR-4.6, lines 1361-1366; Phase 2, line 285
**Goal:** Design a cross-project executive dashboard showing health summaries, aggregate metrics, resource utilization, and risk overview across all projects in a workspace.

### Feature Requirements (from PRD)
```
**FR-4.6: Executive Portfolio Dashboard (Phase 2)**
- Cross-product health summary
- Aggregate metrics
- Resource utilization
- Risk overview
```

### Layout Structure

```
+------------------------------------------------------------------------------+
|  EXECUTIVE PORTFOLIO DASHBOARD                                                 |
|  +--------------------------------------------------------------------------+ |
|  | Portfolio Overview                        [Last 30 Days v] [Export] [...]| |
|  | 12 Active Projects | 847 Total Tasks | 23 Team Members                   | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  AGGREGATE METRICS                                                             |
|  +--------------------------------------------------------------------------+ |
|  | +------------+ +------------+ +------------+ +------------+ +------------+| |
|  | |            | |            | |            | |            | |            || |
|  | |    847     | |    642     | |    76%     | |    4.2     | |    89%     || |
|  | | Total Tasks| | Completed  | | On Track   | | Avg Health | | Delivery   || |
|  | |            | |            | |            | |  Score     | |   Rate     || |
|  | | +12% MTM   | | +8% MTM    | | -3% MTM    | | +0.3 MTM   | | +5% MTM    || |
|  | +------------+ +------------+ +------------+ +------------+ +------------+| |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +-------------------------------------+ +----------------------------------+ |
|  | PRODUCT HEALTH OVERVIEW             | | RISK OVERVIEW                    | |
|  | ----------------------------------- | | -------------------------------- | |
|  |                                     | |                                  | |
|  | PRODUCT          HEALTH    STATUS   | | RISK LEVEL         COUNT        | |
|  | ----------------------------------- | | -------------------------------- | |
|  | Website v2.0     ████████░░  82%   | | Critical (Red)        2         | |
|  |                  [On Track]         | | High (Orange)         5         | |
|  |                                     | | Medium (Amber)       12         | |
|  | Mobile App       ██████████  95%   | | Low (Green)          28         | |
|  |                  [Excellent]        | |                                  | |
|  |                                     | | -------------------------------- | |
|  | API Platform     ██████░░░░  58%   | |                                  | |
|  |                  [At Risk]          | | TOP RISKS                        | |
|  |                                     | | -------------------------------- | |
|  | CRM Integration  ████████░░  78%   | | ! Website v2.0: 3 blockers       | |
|  |                  [On Track]         | | ! API Platform: 5 overdue tasks  | |
|  |                                     | | ! Mobile App: Resource conflict  | |
|  | Marketing Hub    ███████░░░  72%   | |                                  | |
|  |                  [Fair]             | | [View All Risks]                 | |
|  |                                     | |                                  | |
|  | [Show All 12 Projects]              | +----------------------------------+ |
|  +-------------------------------------+                                      |
|                                                                                |
|  +-------------------------------------+ +----------------------------------+ |
|  | RESOURCE UTILIZATION                | | DELIVERY TIMELINE                | |
|  | ----------------------------------- | | -------------------------------- | |
|  |                                     | |                                  | |
|  | TEAM MEMBER      ALLOCATION  AVAIL  | | PROJECT          DUE      STATUS | |
|  | ----------------------------------- | | -------------------------------- | |
|  | Sarah Chen       ████████░░  85%   | | Website v2.0     Dec 20  [=====]| |
|  |   4 projects     15% avail          | | Mobile App       Jan 15  [===--]| |
|  |                                     | | API Platform     Dec 30  [====!]| |
|  | John Martinez    ██████████ 100%   | | CRM Integration  Feb 01  [==---]| |
|  |   3 projects     0% avail           | | Marketing Hub    Jan 30  [===--]| |
|  |                                     | |                                  | |
|  | Maya Johnson     ██████░░░░  60%   | | ! = At Risk                      | |
|  |   2 projects     40% avail          | |                                  | |
|  |                                     | | [View Full Timeline]             | |
|  | [View All Team Members]             | |                                  | |
|  +-------------------------------------+ +----------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | PRODUCT HEALTH GRID (Expanded View)                                       | |
|  | ------------------------------------------------------------------------ | |
|  |                                                                           | |
|  | +-------+ +-------+ +-------+ +-------+ +-------+ +-------+              | |
|  | |Website| |Mobile | | API   | | CRM   | |Market.| |Support|              | |
|  | | v2.0  | | App   | |Platform| |Integr.| | Hub   | |Portal |              | |
|  | |       | |       | |       | |       | |       | |       |              | |
|  | |  82%  | |  95%  | |  58%  | |  78%  | |  72%  | |  88%  |              | |
|  | | [===] | | [===] | | [==!] | | [===] | | [===] | | [===] |              | |
|  | +-------+ +-------+ +-------+ +-------+ +-------+ +-------+              | |
|  |                                                                           | |
|  | Legend: [===] On Track  [==!] At Risk  [=!!] Critical                    | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Project Health Card Detail

```
+------------------------------------------------------------------------------+
|  PRODUCT DETAIL CARD (On hover/click from grid)                                |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Website Redesign v2.0                                    [Open Project]  | |
|  | -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  | HEALTH SCORE                                                              | |
|  | ┌─────────────────────────────────────────────────────────────────────┐  | |
|  | │ ████████████████████████████████████████░░░░░░░░░░  82%             │  | |
|  | │                                                                      │  | |
|  | │ Schedule: ████████░░  80%    Resources: ██████████  92%             │  | |
|  | │ Scope:    ████████░░  78%    Quality:   ████████░░  82%             │  | |
|  | └─────────────────────────────────────────────────────────────────────┘  | |
|  |                                                                           | |
|  | QUICK STATS                                                               | |
|  | ┌───────────────────┬───────────────────┬───────────────────┐            | |
|  | │ 45 Tasks Active   │ 3 Blockers        │ Dec 20 Due Date   │            | |
|  | │ 120 Total         │ 5 At Risk         │ 8 days remaining  │            | |
|  | └───────────────────┴───────────────────┴───────────────────┘            | |
|  |                                                                           | |
|  | PHASE                                                                     | |
|  | ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                              | |
|  | │BRIEF│BRSTR│ REQ │DSGN │IMPL │TEST │DPLY │  Phase 5: Implementation    | |
|  | │ ✓   │ ✓   │ ✓   │ ✓   │ ●   │     │     │                              | |
|  | └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                              | |
|  |                                                                           | |
|  | TEAM                                                                      | |
|  | [👤 Sarah] [👤 John] [👤 Maya] +5 more                                    | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Header Section**
   - Portfolio title
   - Summary stats: Projects, Tasks, Team Members
   - Time range selector
   - Export button

2. **Aggregate Metrics Row**
   - 5 key metrics in cards
   - Large number display
   - Label below
   - Month-over-month trend indicator
   - Green/red trend arrows

3. **Project Health Overview**
   - List of projects with health bars
   - Health percentage and status badge
   - Click to drill down
   - Show more link for all projects

4. **Risk Overview Panel**
   - Risk level breakdown (Critical/High/Medium/Low)
   - Top risks list with project context
   - Action link to view all risks

5. **Resource Utilization**
   - Team members with allocation bars
   - Projects count per member
   - Available capacity percentage
   - Over-allocation warning (red)

6. **Delivery Timeline**
   - Mini Gantt-style progress bars
   - Due dates
   - Status indicators
   - At-risk flagging

7. **Project Health Grid**
   - Card grid for all projects
   - Color-coded health scores
   - Quick visual scan
   - Click for detail card

### Style Notes

- Health bars use gradient fill based on score
- Excellent (90-100%): Green
- Good (75-89%): Lime
- Fair (60-74%): Amber
- At Risk (40-59%): Orange
- Critical (<40%): Red
- Trend indicators: Green arrow up, red arrow down
- Card hover shows shadow elevation

---

## PM-28: Daily Briefing (Navi) (NEW)

**File:** `pm-daily-briefing.excalidraw`
**Priority:** P2 (Medium)
**PRD Reference:** FR-5.3, lines 1381-1385
**Goal:** Design Navi's morning summary interface with configurable time, opt-in/out controls, expandable sections, and one-click actions.

### Feature Requirements (from PRD)
```
**FR-5.3: Daily Briefing**
- Navi's morning summary (configurable time)
- Opt-in/out per user
- Expandable sections
- One-click actions
```

### Layout Structure - Briefing Modal

```
+------------------------------------------------------------------------------+
|  DAILY BRIEFING MODAL                                                          |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  🔴 Good Morning, Sarah!                                                  | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  Here's your daily briefing from Navi                                     | |
|  |  Tuesday, December 17, 2024 • 9:00 AM                                     | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  📊 YOUR DAY AT A GLANCE                                                  | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | 5 Tasks Due Today  |  3 Meetings  |  2 Pending Approvals          |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  📋 DUE TODAY (5)                                          [▼ Collapse] | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | 🔴 High: AUTH-123 - Implement OAuth flow                          |   | |
|  |  |    Website v2.0 • Due: Today 5:00 PM                               |   | |
|  |  |    [Mark Complete] [Extend Deadline]                               |   | |
|  |  |                                                                    |   | |
|  |  | 🟠 Medium: AUTH-124 - Token refresh logic                          |   | |
|  |  |    Website v2.0 • Due: Today EOD                                   |   | |
|  |  |    [Mark Complete] [Extend Deadline]                               |   | |
|  |  |                                                                    |   | |
|  |  | 🟡 Low: DOCS-45 - Update API documentation                         |   | |
|  |  |    API Platform • Due: Today EOD                                   |   | |
|  |  |    [Mark Complete] [Extend Deadline]                               |   | |
|  |  |                                                                    |   | |
|  |  | + 2 more due today...                                              |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  🚨 BLOCKERS & RISKS (3)                                   [▼ Collapse] | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | ⛔ BLOCKER: AUTH-125 is blocked by dependency on API-789           |   | |
|  |  |    Waiting for: John Martinez                                      |   | |
|  |  |    [Ping John] [Reassign Dependency]                               |   | |
|  |  |                                                                    |   | |
|  |  | ⚠️ AT RISK: Sprint 5 has 3 tasks that may miss deadline            |   | |
|  |  |    Estimated completion: Dec 22 (2 days late)                      |   | |
|  |  |    [View Tasks] [Adjust Scope]                                     |   | |
|  |  |                                                                    |   | |
|  |  | ⚠️ AT RISK: API Platform health dropped to 58%                     |   | |
|  |  |    5 overdue tasks, 2 blockers                                     |   | |
|  |  |    [View Dashboard] [Schedule Review]                              |   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  💡 NAVI'S SUGGESTIONS                                     [▼ Collapse] | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | "I noticed AUTH-123 and AUTH-124 are both due today. Consider     |   | |
|  |  |  focusing on AUTH-123 first since AUTH-124 depends on it."        |   | |
|  |  |                                                                    |   | |
|  |  | "The API Platform team could use help. Maya has 40% availability  |   | |
|  |  |  - want me to suggest reassigning some tasks to her?"             |   | |
|  |  |  [Yes, Suggest Reassignment] [No Thanks]                           |   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  📅 UPCOMING THIS WEEK                                     [▼ Collapse] | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Wed Dec 18: Sprint 5 Review (10:00 AM)                             |   | |
|  |  | Thu Dec 19: 8 tasks due, API Platform deadline                     |   | |
|  |  | Fri Dec 20: Website v2.0 Phase 5 target completion                 |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  [Snooze 1 Hour] [Snooze Until Tomorrow]    [Got It, Start My Day]       | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Briefing Settings Panel

```
+------------------------------------------------------------------------------+
|  DAILY BRIEFING SETTINGS                                                       |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Daily Briefing Settings                                                  | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  DELIVERY                                                                 | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Enable Daily Briefing                              [====ON====]   |   | |
|  |  |                                                                    |   | |
|  |  | Delivery Time:  [09:00 AM v]  Timezone: [PST v]                   |   | |
|  |  |                                                                    |   | |
|  |  | Delivery Method:                                                   |   | |
|  |  | [x] In-app notification                                            |   | |
|  |  | [x] Email summary                                                  |   | |
|  |  | [ ] Slack DM                                                       |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  CONTENT SECTIONS                                                         | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Include in briefing:                                               |   | |
|  |  |                                                                    |   | |
|  |  | [x] Tasks due today                                                |   | |
|  |  | [x] Blockers and risks                                             |   | |
|  |  | [x] Navi's suggestions                                             |   | |
|  |  | [x] Upcoming this week                                             |   | |
|  |  | [ ] Team activity summary                                          |   | |
|  |  | [ ] Agent activity summary                                         |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  SCOPE                                                                    | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Include tasks from:                                                |   | |
|  |  |                                                                    |   | |
|  |  | (*) All my assigned projects                                       |   | |
|  |  | ( ) Selected projects only:                                        |   | |
|  |  |     [ ] Website v2.0                                               |   | |
|  |  |     [ ] API Platform                                               |   | |
|  |  |     [ ] Mobile App                                                 |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  QUIET DAYS                                                               | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Skip briefing on:                                                  |   | |
|  |  | [ ] Saturdays  [ ] Sundays  [ ] Holidays                           |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |                                    [Cancel]  [Save Settings]              | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Notification Badge

```
+------------------------------------------------------------------------------+
|  BRIEFING NOTIFICATION (Top nav)                                               |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                                           | |
|  |  [...] [🔔 3] [👤]                                                       | |
|  |            ^                                                              | |
|  |            |                                                              | |
|  |  Notification dropdown includes:                                          | |
|  |  +------------------------------------------+                             | |
|  |  | 🔴 Daily Briefing Ready                  |  <-- Sticky at top         | |
|  |  |    5 tasks due, 3 blockers today         |                             | |
|  |  |    [View Briefing]                       |                             | |
|  |  | ─────────────────────────────────────── |                             | |
|  |  | Other notifications...                   |                             | |
|  |  +------------------------------------------+                             | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Greeting Header**
   - Navi's coral color dot
   - Personalized greeting with user name
   - Date and time of briefing

2. **Day at a Glance**
   - 3-4 key metrics strip
   - Tasks due, meetings, approvals
   - Quick visual summary

3. **Due Today Section**
   - Expandable/collapsible
   - Tasks with priority indicators
   - Project context
   - One-click actions: Complete, Extend

4. **Blockers & Risks**
   - Severity indicators (⛔ blocker, ⚠️ risk)
   - Context and owner info
   - Quick resolution actions
   - Expandable for details

5. **Navi's Suggestions**
   - Conversational AI recommendations
   - Based on workload analysis
   - Actionable buttons for acceptance
   - Can dismiss/ignore

6. **Upcoming This Week**
   - Mini calendar preview
   - Key deadlines highlighted
   - Meetings and milestones

7. **Action Footer**
   - Snooze options (1 hour, tomorrow)
   - "Got It" to dismiss
   - Persists until dismissed

8. **Settings Panel**
   - Enable/disable toggle
   - Delivery time picker
   - Delivery method selection
   - Content section toggles
   - Project scope selection
   - Quiet days configuration

### Style Notes

- Navi sections use coral left border (#FF6B6B)
- Blocker items have red background tint
- Risk items have amber background tint
- Suggestions have subtle coral background
- Expandable sections animate smoothly
- One-click actions are ghost buttons
- "Got It" is primary coral button

---

## PM-29: GitHub/GitLab Integration Panel (NEW)

**File:** `pm-github-integration.excalidraw`
**Priority:** P2 (Medium)
**PRD Reference:** FR-8.3, lines 1467-1471; Phase 2, lines 298-306
**Goal:** Design the task-level development panel showing linked commits, PRs, branches with status sync from GitHub/GitLab.

### Feature Requirements (from PRD)
```
**GitHub/GitLab Deep Integration** *(Competitor-inspired: Linear - best-in-class)*
- Two-way synchronization (bidirectional sync)
- Branch naming conventions: `feat/PM-123-task-title` auto-links
- PR auto-linking: PRs referencing task IDs attach automatically
- Auto-close tasks: PR merge → Task status to Done
- Commit message parsing: `fixes PM-123` transitions task
- Development panel: See all commits, PRs, branches on task

**FR-8.3: GitHub/GitLab (Bridge - Phase 2)**
- PR linking via branch name
- Commit message parsing
- Auto-update on PR merge
- Repository configuration
```

### Layout Structure - Task Development Tab

```
+------------------------------------------------------------------------------+
|  TASK DETAIL - DEVELOPMENT TAB                                                 |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | AUTH-123: Implement OAuth 2.0 with Google                                 | |
|  | [Details] [Subtasks] [Activity] [🔗 Development]  [Comments]              | |
|  |                                  ^^^^^^^^^^^^^^                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |  🔗 Development                                   [Settings] [Refresh]   | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  LINKED REPOSITORY                                                        | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | 🐙 github.com/acme/website-v2                    [Change Repo]     |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  BRANCHES (2)                                                             | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | 🌿 feat/AUTH-123-oauth-google                            [Main]   |   | |
|  |  |    Created by: John Martinez • 3 days ago                          |   | |
|  |  |    Last commit: 2 hours ago • 12 commits ahead                     |   | |
|  |  |                                                                    |   | |
|  |  | 🌿 fix/AUTH-123-callback-url                            [Active]  |   | |
|  |  |    Created by: Sarah Chen • 1 day ago                              |   | |
|  |  |    Last commit: 30 min ago • 3 commits ahead                       |   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  PULL REQUESTS (2)                                                        | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | 🟢 #456: Implement Google OAuth flow                    [Open]    |   | |
|  |  |    feat/AUTH-123-oauth-google → main                               |   | |
|  |  |    By: John Martinez • Opened 2 days ago                           |   | |
|  |  |    ──────────────────────────────────────────────────────────────  |   | |
|  |  |    ✓ CI/CD: All checks passed                                      |   | |
|  |  |    ✓ Reviews: 2/2 approved                                         |   | |
|  |  |    ○ Merge: Ready to merge                                         |   | |
|  |  |    ──────────────────────────────────────────────────────────────  |   | |
|  |  |    [View on GitHub]  [Merge PR]                                    |   | |
|  |  |                                                                    |   | |
|  |  | 🟡 #458: Fix OAuth callback URL handling                 [Draft]  |   | |
|  |  |    fix/AUTH-123-callback-url → feat/AUTH-123-oauth-google          |   | |
|  |  |    By: Sarah Chen • Opened 1 day ago                               |   | |
|  |  |    ──────────────────────────────────────────────────────────────  |   | |
|  |  |    ○ CI/CD: Running...                                             |   | |
|  |  |    ○ Reviews: 0/2 required                                         |   | |
|  |  |    ──────────────────────────────────────────────────────────────  |   | |
|  |  |    [View on GitHub]  [Request Review]                              |   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  RECENT COMMITS (5 of 15)                                [View All]      | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | ● abc1234  Fix redirect URI validation                            |   | |
|  |  |            Sarah Chen • 30 minutes ago                             |   | |
|  |  |                                                                    |   | |
|  |  | ● def5678  Add token refresh logic                                |   | |
|  |  |            John Martinez • 2 hours ago                             |   | |
|  |  |                                                                    |   | |
|  |  | ● ghi9012  Implement OAuth callback handler                       |   | |
|  |  |            John Martinez • 5 hours ago                             |   | |
|  |  |                                                                    |   | |
|  |  | ● jkl3456  Setup Google OAuth credentials                         |   | |
|  |  |            John Martinez • 1 day ago                               |   | |
|  |  |                                                                    |   | |
|  |  | ● mno7890  Initial OAuth setup (fixes AUTH-123)                   |   | |
|  |  |            John Martinez • 3 days ago                              |   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  🩵 BRIDGE ACTIVITY                                                       | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | "I detected PR #456 is ready to merge. Once merged, I'll           |   | |
|  |  |  automatically update this task to 'Done'."                        |   | |
|  |  |                                                                    |   | |
|  |  | Auto-actions enabled:                                              |   | |
|  |  | ✓ Auto-link branches matching AUTH-123                             |   | |
|  |  | ✓ Auto-link PRs referencing AUTH-123                               |   | |
|  |  | ✓ Auto-close task on PR merge                                      |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Repository Configuration Modal

```
+------------------------------------------------------------------------------+
|  REPOSITORY CONFIGURATION                                                      |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Configure GitHub Integration                                             | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  CONNECTED REPOSITORIES                                                   | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | 🐙 github.com/acme/website-v2                          [Default]  |   | |
|  |  |    Connected • Last sync: 2 min ago                    [Remove]   |   | |
|  |  |                                                                    |   | |
|  |  | 🐙 github.com/acme/api-platform                                   |   | |
|  |  |    Connected • Last sync: 5 min ago                    [Remove]   |   | |
|  |  |                                                                    |   | |
|  |  | [+ Add Repository]                                                 |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  BRANCH NAMING CONVENTION                                                 | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Pattern: [feat/{task-id}-{title-slug}                        ]    |   | |
|  |  |                                                                    |   | |
|  |  | Available variables:                                               |   | |
|  |  | {task-id} = AUTH-123  |  {title-slug} = oauth-google              |   | |
|  |  | {type} = feat/fix/etc |  {assignee} = john-martinez               |   | |
|  |  |                                                                    |   | |
|  |  | Preview: feat/AUTH-123-oauth-google                                |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  AUTO-LINK SETTINGS                                                       | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | [x] Auto-link branches matching task ID pattern                    |   | |
|  |  | [x] Auto-link PRs mentioning task ID in title or body              |   | |
|  |  | [x] Auto-link commits with "fixes {task-id}" pattern               |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  AUTO-TRANSITION SETTINGS                                                 | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | When PR is merged:                                                 |   | |
|  |  | (*) Move task to: [Done v]                                         |   | |
|  |  | ( ) No automatic transition                                        |   | |
|  |  |                                                                    |   | |
|  |  | When PR is opened:                                                 |   | |
|  |  | (*) Move task to: [In Review v]                                    |   | |
|  |  | ( ) No automatic transition                                        |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |                                    [Cancel]  [Save Configuration]         | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Development Tab**
   - New tab in task detail modal
   - Badge shows linked item count
   - Teal accent (Bridge agent color)

2. **Linked Repository**
   - Shows connected repo
   - GitHub/GitLab icon indicator
   - Change repo option

3. **Branches Section**
   - List of branches matching task ID
   - Creator and age
   - Commit count ahead of base
   - Activity indicator

4. **Pull Requests Section**
   - PRs linked to task
   - Status: Open, Draft, Merged, Closed
   - CI/CD status
   - Review status
   - Quick actions: View, Merge, Request Review

5. **Recent Commits**
   - Commit hash (shortened)
   - Commit message
   - Author and timestamp
   - Link to view on GitHub

6. **Bridge Activity Panel**
   - Agent insights about development
   - Auto-action status
   - Enabled automation list

7. **Configuration Modal**
   - Repository connections
   - Branch naming convention
   - Auto-link settings
   - Auto-transition rules

### Status Indicators

- 🟢 Open PR (ready for review)
- 🟡 Draft PR
- 🟣 Merged PR
- 🔴 Closed PR (not merged)
- ✓ Check passed
- ○ Check pending/running
- ✕ Check failed

### Style Notes

- GitHub icon: Octocat
- GitLab icon: Fox logo
- Branch icon: 🌿 or git branch icon
- PR status badges match GitHub styling
- Commit hashes in monospace font
- Bridge sections use teal left border

---

## PM-30: CSV Import Wizard (NEW)

**File:** `pm-csv-import.excalidraw`
**Priority:** P2 (Medium)
**PRD Reference:** FR-8.1, lines 1456-1460
**Goal:** Design a multi-step import wizard with file upload, column mapping interface, validation preview, and import progress display.

### Feature Requirements (from PRD)
```
**FR-8.1: CSV Import/Export**
- Column mapping wizard
- Template download
- Batch import with validation
- Export with field selection
```

### Layout Structure - Step 1: Upload

```
+------------------------------------------------------------------------------+
|  CSV IMPORT WIZARD - STEP 1: UPLOAD                                            |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Import Tasks from CSV                                                    | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  PROGRESS                                                                 | |
|  |  [● Upload] ─── [○ Map Columns] ─── [○ Preview] ─── [○ Import]           | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  UPLOAD YOUR FILE                                                         | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  |                     ┌─────────────────────┐                        |   | |
|  |  |                     │                     │                        |   | |
|  |  |                     │    📄               │                        |   | |
|  |  |                     │                     │                        |   | |
|  |  |                     │  Drop CSV file here │                        |   | |
|  |  |                     │        or           │                        |   | |
|  |  |                     │   [Browse Files]    │                        |   | |
|  |  |                     │                     │                        |   | |
|  |  |                     └─────────────────────┘                        |   | |
|  |  |                                                                    |   | |
|  |  |  Supported formats: .csv, .xlsx                                    |   | |
|  |  |  Max file size: 10MB | Max rows: 10,000                            |   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  NEED A TEMPLATE?                                                         | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Download our CSV template with all supported fields:               |   | |
|  |  |                                                                    |   | |
|  |  | [📥 Download Template]  [📖 View Documentation]                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |                                    [Cancel]  [Next: Map Columns →]        | |
|  |                                               (disabled until file)       | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Step 2: Column Mapping

```
+------------------------------------------------------------------------------+
|  CSV IMPORT WIZARD - STEP 2: MAP COLUMNS                                       |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Import Tasks from CSV                                                    | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  PROGRESS                                                                 | |
|  |  [✓ Upload] ─── [● Map Columns] ─── [○ Preview] ─── [○ Import]           | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  FILE INFO                                                                | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | 📄 tasks-export.csv • 245 rows • 12 columns                        |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  MAP YOUR COLUMNS                                                         | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | YOUR CSV COLUMN          →    HYVVE FIELD                         |   | |
|  |  | ─────────────────────────────────────────────────────────────────  |   | |
|  |  |                                                                    |   | |
|  |  | "Task Name" *            →    [Title v]               ✓ Required  |   | |
|  |  |   Sample: "Implement login"                                        |   | |
|  |  |                                                                    |   | |
|  |  | "Description"            →    [Description v]                      |   | |
|  |  |   Sample: "Add OAuth flow..."                                      |   | |
|  |  |                                                                    |   | |
|  |  | "Status"                 →    [Status v]              ⚠️ Map values|   | |
|  |  |   Sample: "In Progress"                                            |   | |
|  |  |   [Configure Value Mapping]                                        |   | |
|  |  |                                                                    |   | |
|  |  | "Priority"               →    [Priority v]            ⚠️ Map values|   | |
|  |  |   Sample: "High"                                                   |   | |
|  |  |   [Configure Value Mapping]                                        |   | |
|  |  |                                                                    |   | |
|  |  | "Assignee Email"         →    [Assignee (by email) v]              |   | |
|  |  |   Sample: "sarah@acme.com"                                         |   | |
|  |  |                                                                    |   | |
|  |  | "Due Date"               →    [Due Date v]            ✓ Auto-detect|   | |
|  |  |   Sample: "2024-12-20"                                             |   | |
|  |  |                                                                    |   | |
|  |  | "Story Points"           →    [Story Points v]                     |   | |
|  |  |   Sample: "5"                                                      |   | |
|  |  |                                                                    |   | |
|  |  | "Epic"                   →    [Parent Task v]                      |   | |
|  |  |   Sample: "Authentication"                                         |   | |
|  |  |                                                                    |   | |
|  |  | "Tags"                   →    [Tags v]                             |   | |
|  |  |   Sample: "frontend, auth"                                         |   | |
|  |  |                                                                    |   | |
|  |  | "old_id"                 →    [-- Skip this column -- v]           |   | |
|  |  |   Sample: "12345"                                                  |   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  UNMAPPED COLUMNS (2)                                                     | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | "created_at", "updated_at" will be skipped                         |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |                        [← Back]  [Cancel]  [Next: Preview →]              | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Value Mapping Modal

```
+------------------------------------------------------------------------------+
|  VALUE MAPPING - STATUS                                                        |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Map "Status" Values                                                      | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  Map your CSV values to HYVVE status options:                             | |
|  |                                                                           | |
|  |  YOUR CSV VALUE          →    HYVVE STATUS                               | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | "In Progress"          →    [In Progress v]           ✓            |   | |
|  |  | "To Do"                →    [To Do v]                 ✓            |   | |
|  |  | "Done"                 →    [Done v]                  ✓            |   | |
|  |  | "Blocked"              →    [Blocked v]               ✓            |   | |
|  |  | "Backlog"              →    [To Do v]                 ✓ (remapped) |   | |
|  |  | "QA"                   →    [In Review v]             ✓ (remapped) |   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  Unrecognized values (will use default: "To Do"):                         | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | "Pending Review" (3 rows)  →  [In Review v]                        |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |                                    [Cancel]  [Apply Mapping]              | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Step 3: Preview

```
+------------------------------------------------------------------------------+
|  CSV IMPORT WIZARD - STEP 3: PREVIEW                                           |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Import Tasks from CSV                                                    | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  PROGRESS                                                                 | |
|  |  [✓ Upload] ─── [✓ Map Columns] ─── [● Preview] ─── [○ Import]           | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  VALIDATION SUMMARY                                                       | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | ✓ 238 tasks ready to import                                        |   | |
|  |  | ⚠️ 5 tasks with warnings (will import with defaults)                |   | |
|  |  | ✕ 2 tasks with errors (will be skipped)                            |   | |
|  |  |                                                                    |   | |
|  |  | Total: 245 rows | Importable: 243 | Skipped: 2                     |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  PREVIEW (First 10 rows)                       [Show Errors Only ▾]      | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | ROW | STATUS | TITLE            | ASSIGNEE    | DUE DATE  | PTS   |   | |
|  |  | ─── | ────── | ──────────────── | ─────────── | ───────── | ───── |   | |
|  |  | 1   | ✓      | Implement login  | Sarah Chen  | Dec 20    | 5     |   | |
|  |  | 2   | ✓      | Add OAuth flow   | John M.     | Dec 22    | 8     |   | |
|  |  | 3   | ⚠️     | Fix header bug   | (not found) | Dec 18    | 2     |   | |
|  |  |     |        | ↳ Assignee "bob@old.com" not found, will be unassigned|   | |
|  |  | 4   | ✕      | Invalid task     | --          | invalid   | abc   |   | |
|  |  |     |        | ↳ Missing required field: Title                      |   | |
|  |  |     |        | ↳ Invalid date format: "TBD"                         |   | |
|  |  |     |        | ↳ Story points must be a number                      |   | |
|  |  | 5   | ✓      | Update docs      | Maya J.     | Dec 25    | 3     |   | |
|  |  | 6   | ✓      | Deploy to prod   | Sarah Chen  | Dec 30    | 5     |   | |
|  |  | ... | ...    | ...              | ...         | ...       | ...   |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  IMPORT OPTIONS                                                           | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Import to: [Website v2.0 v]                                        |   | |
|  |  |                                                                    |   | |
|  |  | [x] Skip rows with errors (2 rows)                                 |   | |
|  |  | [ ] Stop on first error (import nothing)                           |   | |
|  |  | [x] Import rows with warnings using defaults                       |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |                        [← Back]  [Cancel]  [Import 243 Tasks →]           | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Step 4: Import Progress

```
+------------------------------------------------------------------------------+
|  CSV IMPORT WIZARD - STEP 4: IMPORTING                                         |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Import Tasks from CSV                                                    | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  PROGRESS                                                                 | |
|  |  [✓ Upload] ─── [✓ Map Columns] ─── [✓ Preview] ─── [● Import]           | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  IMPORTING...                                                             | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  |  ████████████████████████████████████████░░░░░░░░░░░░  78%        |   | |
|  |  |                                                                    |   | |
|  |  |  Imported 190 of 243 tasks                                         |   | |
|  |  |  Estimated time remaining: ~30 seconds                             |   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  LIVE LOG                                                                 | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | ✓ Row 188: Created "Setup database migrations"                     |   | |
|  |  | ✓ Row 189: Created "Configure CI/CD pipeline"                      |   | |
|  |  | ✓ Row 190: Created "Write unit tests"                              |   | |
|  |  | ○ Row 191: Importing "Integration tests"...                        |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |                                              [Cancel Import]              | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  ═══════════════════════════════════════════════════════════════════════════  |
|                                                                                |
|  IMPORT COMPLETE                                                               |
|  +--------------------------------------------------------------------------+ |
|  |                                                                           | |
|  |  ✓ Import completed successfully!                                        | |
|  |                                                                           | |
|  |  SUMMARY                                                                  | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | ✓ 238 tasks imported successfully                                  |   | |
|  |  | ⚠️ 5 tasks imported with warnings                                   |   | |
|  |  | ✕ 2 tasks skipped due to errors                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  [📥 Download Error Report]  [View Imported Tasks]  [Done]               | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Progress Indicator**
   - 4-step wizard: Upload → Map → Preview → Import
   - Completed steps show checkmark
   - Current step highlighted

2. **Upload Area**
   - Drag-drop zone
   - Browse button
   - File format and limits info
   - Template download

3. **Column Mapping**
   - Two-column layout: CSV → HYVVE
   - Sample data preview
   - Required field indicators
   - Value mapping for enums

4. **Value Mapping Modal**
   - Maps CSV values to system values
   - Auto-detected matches
   - Manual remapping option
   - Default for unrecognized

5. **Preview Table**
   - Validation status per row
   - Expandable error details
   - Filter: Show errors only
   - First 10 rows preview

6. **Import Options**
   - Target product selector
   - Error handling preferences
   - Warning handling preferences

7. **Progress Display**
   - Progress bar with percentage
   - Row counter
   - Time estimate
   - Live log of imports

8. **Completion Summary**
   - Success/warning/error counts
   - Download error report
   - View imported tasks link

### Style Notes

- Progress bar uses coral fill
- Success rows: Green checkmark
- Warning rows: Amber warning icon
- Error rows: Red X icon, expanded details
- Drag-drop zone: Dashed border, highlights on drag
- Live log auto-scrolls to bottom

---

## PM-31: Sprint Enhancements Dashboard (NEW)

**File:** `pm-sprint-enhancements.excalidraw`
**Priority:** P2 (Medium)
**PRD Reference:** Phase 2, lines 318-321
**Goal:** Design sprint enhancements including cooldown period configuration, doom-line projection on burndown, and baseline vs actual comparison charts.

### Feature Requirements (from PRD)
```
6. **Sprint Enhancements** *(Competitor-inspired: Linear, Taiga)*
   - Sprint cooldown period (configurable break between sprints)
   - Doom-line projection (visual deadline risk based on velocity)
   - Baseline comparison snapshots (planned vs actual)
```

### Layout Structure - Sprint Dashboard

```
+------------------------------------------------------------------------------+
|  SPRINT ENHANCEMENTS DASHBOARD                                                 |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Sprint 5: Authentication Phase                    [Settings] [End Sprint]| |
|  | Dec 10 - Dec 24 (14 days) | 45 story points | 12 tasks                   | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | SPRINT HEALTH                                                             | |
|  | +----------------------------------------------------------------------+ | |
|  | | ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          | | |
|  | | │   78%      │ │   32/45    │ │   4 days   │ │  ⚠️ Risk   │          | | |
|  | | │ Progress   │ │  Points    │ │ Remaining  │ │  Doom-Line │          | | |
|  | | │ Completed  │ │ Completed  │ │            │ │  Warning   │          | | |
|  | | └────────────┘ └────────────┘ └────────────┘ └────────────┘          | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | BURNDOWN WITH DOOM-LINE                                                   | |
|  | +----------------------------------------------------------------------+ | |
|  | |                                                                       | | |
|  | | Points                                                                | | |
|  | |  45 ┤ ●                                                              | | |
|  | |     │  ╲                                                              | | |
|  | |  40 ┤   ●╲                                                           | | |
|  | |     │     ╲●    ← Ideal burndown (dashed gray)                       | | |
|  | |  35 ┤      ╲ ●                                                       | | |
|  | |     │       ╲  ●                                                     | | |
|  | |  30 ┤   ●────●──╲──● ← Actual burndown (solid blue)                  | | |
|  | |     │            ╲  ╲                                                | | |
|  | |  25 ┤             ╲  ●                                               | | |
|  | |     │              ╲   ╲                                             | | |
|  | |  20 ┤               ╲    ● ← Current                                 | | |
|  | |     │                ╲     ╲                                         | | |
|  | |  15 ┤                 ╲      ╲                                       | | |
|  | |     │                  ╲       ╲                                     | | |
|  | |  10 ┤                   ╲        ╲                                   | | |
|  | |     │        ════════════════════════ ← DOOM-LINE (red, based on     | | |
|  | |   5 ┤        ↑                      ↑    current velocity)           | | |
|  | |     │        │                      │                                | | |
|  | |   0 ┼────────┼──────────────────────┼─────────────────────────       | | |
|  | |     Dec 10   │      Dec 17          │ Dec 20   Dec 24                | | |
|  | |              │                      │                                | | |
|  | |        Sprint Start            Doom-Line    Sprint End                | | |
|  | |                               (Dec 20)                                | | |
|  | |                                                                       | | |
|  | | Legend: ─── Actual  - - - Ideal  ═══ Doom-Line                       | | |
|  | +----------------------------------------------------------------------+ | |
|  |                                                                          | |
|  | ⚠️ DOOM-LINE WARNING: At current velocity, sprint will complete Dec 26   | |
|  |    (2 days after deadline). Consider reducing scope or adding resources. | |
|  |                                                                          | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +-------------------------------------+ +----------------------------------+ |
|  | BASELINE VS ACTUAL                  | | VELOCITY TREND                   | |
|  | ----------------------------------- | | -------------------------------- | |
|  |                                     | |                                  | |
|  | METRIC        BASELINE   ACTUAL     | | Sprint    Planned  Actual  Trend | |
|  | ----------------------------------- | | -------------------------------- | |
|  | Total Points     45        45       | | Sprint 2     35      32     ↓    | |
|  | Tasks            12        14 (+2)  | | Sprint 3     40      38     ↓    | |
|  | Team Size         5         5       | | Sprint 4     42      44     ↑    | |
|  |                                     | | Sprint 5     45      32*    --   | |
|  | COMPLETION                          | |              * in progress       | |
|  | ----------------------------------- | |                                  | |
|  | Planned Done     45        32       | | Avg Velocity: 38 pts/sprint      | |
|  | Scope Change      0        +3       | |                                  | |
|  | Carryover         0         5       | | Capacity Utilization: 85%        | |
|  |                                     | |                                  | |
|  | [View Scope Changes]                | | [View Full History]              | |
|  +-------------------------------------+ +----------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Sprint Settings - Cooldown Configuration

```
+------------------------------------------------------------------------------+
|  SPRINT SETTINGS                                                               |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Sprint Configuration                                                     | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  SPRINT DURATION                                                          | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Default Sprint Length:  [14 days v]                                |   | |
|  |  |                                                                    |   | |
|  |  | Sprint Start Day:       [Monday v]                                 |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  COOLDOWN PERIOD                                                          | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Enable Cooldown Between Sprints:  [====ON====]                     |   | |
|  |  |                                                                    |   | |
|  |  | Cooldown Duration:  [2 days v]                                     |   | |
|  |  |                                                                    |   | |
|  |  | Purpose: Time for retrospective, planning, and team rest           |   | |
|  |  |                                                                    |   | |
|  |  | ┌─────────────────────────────────────────────────────────────┐   |   | |
|  |  | │ Sprint 5       │ Cooldown │ Sprint 6                        │   |   | |
|  |  | │ Dec 10-24      │ Dec 25-26│ Dec 27 - Jan 10                 │   |   | |
|  |  | │████████████████│░░░░░░░░░░│████████████████████████████████│   |   | |
|  |  | └─────────────────────────────────────────────────────────────┘   |   | |
|  |  |                                                                    |   | |
|  |  | During cooldown:                                                   |   | |
|  |  | [x] Allow retrospective activities                                 |   | |
|  |  | [x] Allow sprint planning for next sprint                          |   | |
|  |  | [ ] Block new task creation                                        |   | |
|  |  | [ ] Send team reminder notification                                |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  DOOM-LINE SETTINGS                                                       | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Show Doom-Line Projection:  [====ON====]                           |   | |
|  |  |                                                                    |   | |
|  |  | Warning Threshold:  [3 days v] before sprint end                   |   | |
|  |  |                                                                    |   | |
|  |  | Calculate based on:                                                |   | |
|  |  | (*) Rolling 3-sprint average velocity                              |   | |
|  |  | ( ) Last sprint velocity only                                      |   | |
|  |  | ( ) All-time average velocity                                      |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  BASELINE SNAPSHOTS                                                       | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Auto-create baseline snapshot:  [====ON====]                       |   | |
|  |  |                                                                    |   | |
|  |  | Snapshot timing:                                                   |   | |
|  |  | (*) At sprint start                                                |   | |
|  |  | ( ) After sprint planning meeting                                  |   | |
|  |  | ( ) Manual only                                                    |   | |
|  |  |                                                                    |   | |
|  |  | Include in baseline:                                               |   | |
|  |  | [x] Total story points                                             |   | |
|  |  | [x] Task count                                                     |   | |
|  |  | [x] Team assignments                                               |   | |
|  |  | [x] Due dates                                                      |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |                                    [Cancel]  [Save Settings]              | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Baseline Comparison Detail

```
+------------------------------------------------------------------------------+
|  BASELINE VS ACTUAL COMPARISON                                                 |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Sprint 5: Baseline Comparison                                            | |
|  |  ─────────────────────────────────────────────────────────────────────   | |
|  |                                                                           | |
|  |  Baseline snapshot: Dec 10, 2024 09:00 AM (Sprint Start)                  | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  SCOPE COMPARISON CHART                                                   | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  |  Baseline (45 pts)    ████████████████████████████████████████    |   | |
|  |  |                                                                    |   | |
|  |  |  Current (48 pts)     ████████████████████████████████████████░░░ |   | |
|  |  |                                                                    |   | |
|  |  |  Completed (32 pts)   █████████████████████████████               |   | |
|  |  |                                                                    |   | |
|  |  |  +3 pts scope creep                                                |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  SCOPE CHANGES LOG                                                        | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | DATE      | CHANGE                              | IMPACT          |   | |
|  |  | ───────── | ─────────────────────────────────── | ─────────────── |   | |
|  |  | Dec 12    | Added: "Fix login redirect"         | +2 pts          |   | |
|  |  | Dec 15    | Added: "Add password reset"         | +3 pts          |   | |
|  |  | Dec 16    | Removed: "Refactor auth module"     | -2 pts          |   | |
|  |  | ───────── | ─────────────────────────────────── | ─────────────── |   | |
|  |  |           | NET CHANGE                          | +3 pts          |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  ═══════════════════════════════════════════════════════════════════════ | |
|  |                                                                           | |
|  |  TASK-LEVEL COMPARISON                                                    | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | TASK           | BASELINE | CURRENT | STATUS                      |   | |
|  |  | ────────────── | ──────── | ─────── | ─────────────────────────── |   | |
|  |  | AUTH-123       | 5 pts    | 5 pts   | ✓ Completed                 |   | |
|  |  | AUTH-124       | 3 pts    | 5 pts   | ⚠️ Re-estimated (+2)        |   | |
|  |  | AUTH-125       | 8 pts    | 8 pts   | ○ In Progress               |   | |
|  |  | AUTH-126       | --       | 2 pts   | + Added mid-sprint          |   | |
|  |  | AUTH-127       | 5 pts    | --      | - Removed (descoped)        |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |                                              [Export Report]  [Close]     | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Sprint Header**
   - Sprint name and phase
   - Date range and duration
   - Total points and task count

2. **Sprint Health Cards**
   - Progress percentage
   - Points completed
   - Days remaining
   - Risk indicator

3. **Burndown with Doom-Line**
   - Standard burndown chart
   - Ideal line (dashed gray)
   - Actual line (solid blue)
   - Doom-line (thick red)
   - Warning callout when at risk

4. **Doom-Line Calculation**
   - Based on rolling velocity
   - Projects when sprint will complete
   - Visual warning on chart
   - Actionable recommendations

5. **Baseline vs Actual Panel**
   - Side-by-side metrics
   - Scope changes highlighted
   - Carryover tracking
   - Link to detailed view

6. **Velocity Trend**
   - Historical sprint data
   - Planned vs actual points
   - Trend indicators
   - Average velocity

7. **Sprint Settings**
   - Duration configuration
   - Cooldown period toggle and duration
   - Cooldown activities permissions
   - Doom-line settings
   - Baseline snapshot settings

8. **Baseline Comparison Detail**
   - Scope comparison chart
   - Change log with dates
   - Task-level diff table
   - Export option

### Style Notes

- Burndown uses blue for actual, gray dashed for ideal
- Doom-line: Thick red (#EF4444) with pulse animation
- Risk warning: Amber background with icon
- Scope creep: Red text for additions
- Completed: Green progress
- Cooldown period: Hatched/striped fill

---

## Next Steps

With BATCH-17 complete, all identified wireframe gaps from the gap analysis have prompts created:

**P1 Wireframes (BATCH-16):**
- PM-25: Visual Dependency Editor
- PM-26: Saved Views Manager

**P2 Wireframes (BATCH-17):**
- PM-27: Executive Portfolio Dashboard
- PM-28: Daily Briefing (Navi)
- PM-29: GitHub/GitLab Integration Panel
- PM-30: CSV Import Wizard
- PM-31: Sprint Enhancements Dashboard

---

_End of BATCH-17: Phase 2 PM Feature Wireframes_
