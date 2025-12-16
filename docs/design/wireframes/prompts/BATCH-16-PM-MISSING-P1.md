# BATCH-16: Missing P1 PM Wireframes

**Batch Number:** 16
**Module:** Core-PM (Platform Core)
**Focus:** Missing P1 Wireframes from Gap Analysis
**Total Wireframes:** 2
**Priority:** P1 (High)

---

## References

| Document | Path | Purpose |
|----------|------|---------|
| Core-PM PRD | `docs/modules/bm-pm/prd.md` | Feature requirements |
| Gap Analysis | `docs/design/wireframes/WIREFRAME-GAP-ANALYSIS.md` | Identified gaps |
| Core-PM Architecture | `docs/modules/bm-pm/architecture.md` | Technical specs |
| Style Guide | `docs/design/STYLE-GUIDE.md` | Brand guidelines |

---

## Wireframe List

| ID | Name | File | Priority | PRD Reference |
|----|------|------|----------|---------------|
| PM-25 | Visual Dependency Editor | `pm-visual-dependency-editor.excalidraw` | P1 | Section 5, lines 242-245 |
| PM-26 | Saved Views Manager | `pm-saved-views.excalidraw` | P1 | FR-4.5, lines 1355-1359 |

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
Dependency Lines:       #3B82F6 (Blue 500)
Critical Path:          #EF4444 (Red 500)
Success/Valid:          #22C55E (Green 500)
Warning/Conflict:       #F59E0B (Amber 500)
Focus Ring:             #FF6B6B (Coral)
```

### Dependency Type Colors
```
Finish-to-Start (FS):   #3B82F6 (Blue) - Most common
Start-to-Start (SS):    #8B5CF6 (Purple)
Finish-to-Finish (FF):  #22C55E (Green)
Start-to-Finish (SF):   #F59E0B (Amber) - Rare
```

### Typography
```
Font Family:            Inter
Page Title:             24px / 700 weight / #1a1a2e
Section Heading:        18px / 600 weight / #1a1a2e
Body Text:              14px / 400 weight / #374151
Caption/Meta:           12px / 400 weight / #6b7280
Dependency Label:       11px / 500 weight / white on dependency color
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

## PM-25: Visual Dependency Editor (NEW)

**File:** `pm-visual-dependency-editor.excalidraw`
**Priority:** P1 (High)
**PRD Reference:** Section 5, lines 242-245; Competitor-inspired from Monday, Wrike, OpenProject
**Goal:** Design a full-screen dependency management view with drag-drop dependency creation, dependency type selection, critical path highlighting, and conflict detection.

### Feature Requirements (from PRD)
```
5. **Visual Dependency Editor** *(Competitor-inspired: Monday, Wrike, OpenProject)*
   - Drag-drop dependency creation on Gantt/Timeline
   - Dependency type selector (FS, SS, FF, SF)
   - Conflict warnings and cycle detection
```

### Layout Structure

```
+------------------------------------------------------------------------------+
|  VISUAL DEPENDENCY EDITOR                                                      |
|  +--------------------------------------------------------------------------+ |
|  | Project: Website Redesign v2.0                    [Timeline] [Full Screen]| |
|  | Dependencies: 12 total | 3 on critical path     [Zoom -] [100%] [Zoom +]| |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | TOOLBAR                                                                   | |
|  | +----------------------------------------------------------------------+ | |
|  | | [+ Add Dependency]  [FS v] [Show Critical Path]  [Detect Conflicts]   | | |
|  | |                                                                        | | |
|  | | Filter: [All Tasks v]  [All Types v]  Search: [____________]          | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | DEPENDENCY CANVAS (Gantt-integrated view)                                 | |
|  |                                                                           | |
|  | TASK NAME                    | Dec 15  16  17  18  19  20  21  22  23    | |
|  | ---------------------------- | ------------------------------------------ | |
|  |                              |                                            | |
|  | Epic: Authentication         |                                            | |
|  |   |                          |                                            | |
|  |   +-- Task: OAuth Setup      | [======]                                   | |
|  |   |                          |    |                                       | |
|  |   |                          |    | FS (blue line)                        | |
|  |   |                          |    v                                       | |
|  |   +-- Task: Token Storage    |        [====]                              | |
|  |   |                          |           |                                | |
|  |   |                          |           | FS (red = critical path)       | |
|  |   |                          |           v                                | |
|  |   +-- Task: Session Mgmt     |              [========]                    | |
|  |                              |                                            | |
|  | Epic: User Profile           |                                            | |
|  |   |                          |                                            | |
|  |   +-- Task: Profile API      | [====]         SS (purple, dashed)         | |
|  |   |                          |    |--------------------------->|          | |
|  |   +-- Task: Profile UI       |    |           [============]   |          | |
|  |   |                          |               |                 |          | |
|  |   |                          |               | FF (green)      |          | |
|  |   |                          |               v                 |          | |
|  |   +-- Task: Avatar Upload    |                   [====]<------+          | |
|  |                              |                                            | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | LEGEND                                                                    | |
|  | +----------------------------------------------------------------------+ | |
|  | | [--] FS: Finish-to-Start (blue)    [- -] SS: Start-to-Start (purple) | | |
|  | | [--] FF: Finish-to-Finish (green)  [- -] SF: Start-to-Finish (amber) | | |
|  | | [==] Critical Path (red, bold)     [!] Conflict/Cycle (warning)      | | |
|  | +----------------------------------------------------------------------+ | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Drag-Drop Dependency Creation

```
+------------------------------------------------------------------------------+
|  CREATING A DEPENDENCY                                                         |
|                                                                                |
|  1. HOVER STATE - Connection points appear                                     |
|  +--------------------------------------------------------------------------+ |
|  |                                                                           | |
|  |   +-- Task: OAuth Setup      | [======]O  <-- "O" connection point        | |
|  |   |                          |         ^     appears on hover             | |
|  |   |                          |         |     (right edge = finish,        | |
|  |   |                          |         |      left edge = start)          | |
|  |   +-- Task: Token Storage    |O[====]                                     | |
|  |                              | ^                                          | |
|  |                              | left edge = start point                    | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  2. DRAG STATE - Line follows cursor                                           |
|  +--------------------------------------------------------------------------+ |
|  |                                                                           | |
|  |   +-- Task: OAuth Setup      | [======]o----+                             | |
|  |   |                          |              |  dragging line              | |
|  |   |                          |              |  (dashed while dragging)    | |
|  |   |                          |              v                             | |
|  |   +-- Task: Token Storage    |O[====]<------+                             | |
|  |                              | ^                                          | |
|  |                              | drop target highlighted                    | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  3. DROP - Type selector appears                                               |
|  +--------------------------------------------------------------------------+ |
|  |                                                                           | |
|  |   Connection created! Select type:                                        | |
|  |   +---------------------------+                                           | |
|  |   | Dependency Type           |                                           | |
|  |   | +-------+-------+-------+ |                                           | |
|  |   | |  FS   |  SS   |  FF   | |  (SF rarely used, collapsed)              | |
|  |   | | (rec) |       |       | |                                           | |
|  |   | +-------+-------+-------+ |                                           | |
|  |   | [More options v]          |                                           | |
|  |   |                           |                                           | |
|  |   | Lag time: [0] days        |                                           | |
|  |   |                           |                                           | |
|  |   | [Cancel]  [Create]        |                                           | |
|  |   +---------------------------+                                           | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Dependency Type Selector Detail

```
+------------------------------------------------------------------------------+
|  DEPENDENCY TYPE PICKER (Expanded)                                             |
|  +--------------------------------------------------------------------------+ |
|  |                                                                           | |
|  |  Select Dependency Type                                          [x]     | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  +----------------------------+  +----------------------------+           | |
|  |  | [*] Finish-to-Start (FS)   |  | [ ] Start-to-Start (SS)    |           | |
|  |  |                            |  |                            |           | |
|  |  |  Task B starts after       |  |  Task B starts when        |           | |
|  |  |  Task A finishes           |  |  Task A starts             |           | |
|  |  |                            |  |                            |           | |
|  |  |  [A]----->|                |  |  [A]----->                 |           | |
|  |  |           [B]----->        |  |  [B]----->                 |           | |
|  |  |                            |  |                            |           | |
|  |  |  Most common (85%)         |  |  Parallel tasks            |           | |
|  |  +----------------------------+  +----------------------------+           | |
|  |                                                                           | |
|  |  +----------------------------+  +----------------------------+           | |
|  |  | [ ] Finish-to-Finish (FF)  |  | [ ] Start-to-Finish (SF)   |           | |
|  |  |                            |  |                            |           | |
|  |  |  Task B finishes when      |  |  Task B finishes when      |           | |
|  |  |  Task A finishes           |  |  Task A starts             |           | |
|  |  |                            |  |                            |           | |
|  |  |  [A]--------->|            |  |  [A]----->                 |           | |
|  |  |       [B]---->|            |  |       |<-----[B]           |           | |
|  |  |                            |  |                            |           | |
|  |  |  Sync completion           |  |  Rarely used               |           | |
|  |  +----------------------------+  +----------------------------+           | |
|  |                                                                           | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  Advanced Options:                                                        | |
|  |  +---------------------------------------+                                | |
|  |  | Lag Time:  [-]  [  0  ]  [+]  days    |                                | |
|  |  | (negative = lead time, positive = lag)|                                | |
|  |  +---------------------------------------+                                | |
|  |                                                                           | |
|  |                                    [Cancel]  [Create Dependency]          | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Critical Path Highlighting

```
+------------------------------------------------------------------------------+
|  CRITICAL PATH VIEW                                                            |
|                                                                                |
|  [Show Critical Path] toggled ON                                               |
|  +--------------------------------------------------------------------------+ |
|  |                                                                           | |
|  |  Critical path determines project end date.                               | |
|  |  Any delay on these tasks delays the project.                             | |
|  |                                                                           | |
|  |  TASK NAME                    | Dec 15  16  17  18  19  20  21  22  23    | |
|  |  ---------------------------- | ------------------------------------------ | |
|  |                               |                                            | |
|  |    Task: OAuth Setup (CP)    | [======] <-- red border, bold              | |
|  |                               |    ||                                      | |
|  |                               |    || red dependency line (critical)       | |
|  |                               |    vv                                      | |
|  |    Task: Token Storage (CP)  |        [====]                              | |
|  |                               |           ||                               | |
|  |                               |           ||                               | |
|  |                               |           vv                               | |
|  |    Task: Session Mgmt (CP)   |              [========]                    | |
|  |                               |                       |                    | |
|  |                               |                       v                    | |
|  |    Task: Integration Test    |                          [===]   DONE!     | |
|  |                               |                                            | |
|  |  Non-critical tasks shown muted (50% opacity)                             | |
|  |                                                                           | |
|  |  +--------------------------------------------------------------+        | |
|  |  | CRITICAL PATH SUMMARY                                         |        | |
|  |  | Total Duration: 8 days  |  4 tasks  |  Slack: 0 days          |        | |
|  |  | Project End: Dec 23, 2024                                     |        | |
|  |  +--------------------------------------------------------------+        | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Conflict/Cycle Detection

```
+------------------------------------------------------------------------------+
|  CONFLICT & CYCLE WARNINGS                                                     |
|                                                                                |
|  [Detect Conflicts] shows validation results                                   |
|  +--------------------------------------------------------------------------+ |
|  |                                                                           | |
|  |  CONFLICT PANEL                                             [x]          | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  ! 2 Issues Detected                                                      | |
|  |                                                                           | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | [!] CYCLE DETECTED                                      Critical  |   | |
|  |  | ----------------------------------------------------------------- |   | |
|  |  |                                                                   |   | |
|  |  | Circular dependency found:                                        |   | |
|  |  |                                                                   |   | |
|  |  | Task A --> Task B --> Task C --> Task A                           |   | |
|  |  |    ^                              |                               |   | |
|  |  |    +------------------------------+                               |   | |
|  |  |                                                                   |   | |
|  |  | This creates an impossible schedule.                              |   | |
|  |  |                                                                   |   | |
|  |  | Suggestion: Remove dependency from Task C to Task A               |   | |
|  |  |                                                                   |   | |
|  |  | [View in Canvas]  [Remove C->A Dependency]                        |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | [!] DATE CONFLICT                                       Warning   |   | |
|  |  | ----------------------------------------------------------------- |   | |
|  |  |                                                                   |   | |
|  |  | Task "Deploy to Production" is scheduled before its dependency    |   | |
|  |  | "Integration Testing" completes.                                  |   | |
|  |  |                                                                   |   | |
|  |  | Integration Testing ends: Dec 22                                  |   | |
|  |  | Deploy scheduled: Dec 20                                          |   | |
|  |  |                                                                   |   | |
|  |  | [View in Canvas]  [Auto-Adjust Dates]                             |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Toolbar**
   - [+ Add Dependency] - Opens manual add modal
   - Type dropdown - Default for new dependencies
   - [Show Critical Path] toggle
   - [Detect Conflicts] button
   - Filters: Task, Type, Search

2. **Canvas Area**
   - Gantt-style timeline integrated
   - Tasks with connection points
   - Dependency lines with type colors
   - Critical path highlighted
   - Zoom controls

3. **Connection Points**
   - Appear on task hover
   - Left edge = Start point
   - Right edge = Finish point
   - Drag from source to target

4. **Dependency Lines**
   - Color-coded by type
   - Solid for FS/FF
   - Dashed for SS/SF
   - Arrow indicates direction
   - Bold red for critical path

5. **Type Selector**
   - Visual explanation of each type
   - Recommended type highlighted
   - Lag/lead time input
   - Cancel/Create actions

6. **Conflict Panel**
   - Lists all detected issues
   - Severity badges
   - Visual diagram of cycles
   - Quick-fix actions
   - Navigate to problem

### Integration with PM-06 Timeline/Gantt

- Dependency Editor is a full-screen mode of Timeline
- Toggle: [Timeline] [Dependencies] in header
- Shared canvas, enhanced for dependency editing
- Syncs changes back to timeline view

### Style Notes

- Dependency lines use SVG paths with curved corners
- Connection points are 12px circles
- Critical path uses 3px stroke weight
- Non-critical uses 2px stroke weight
- Conflict warnings use amber (#F59E0B) pulse animation
- Cycle errors use red (#EF4444) with badge

---

## PM-26: Saved Views Manager (NEW)

**File:** `pm-saved-views.excalidraw`
**Priority:** P1 (High)
**PRD Reference:** FR-4.5, lines 1355-1359
**Goal:** Design saved views functionality allowing users to save filter/sort combinations, share views publicly or privately, and set default views per role.

### Feature Requirements (from PRD)
```
**FR-4.5: Saved Views**
- Save filter/sort combinations
- Public/private views
- View sharing
- Default views per role
```

### Layout Structure - Views Dropdown

```
+------------------------------------------------------------------------------+
|  SAVED VIEWS DROPDOWN (In Project Header)                                      |
|                                                                                |
|  Project: Website Redesign v2.0                                                |
|  +--------------------------------------------------------------------------+ |
|  | View: [My Sprint Tasks v]                     [+ New View] [Manage Views]| |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  DROPDOWN EXPANDED:                                                            |
|  +----------------------------------+                                          |
|  | SAVED VIEWS                 [x]  |                                          |
|  | -------------------------------- |                                          |
|  |                                  |                                          |
|  | MY VIEWS                         |                                          |
|  | +------------------------------+ |                                          |
|  | | * My Sprint Tasks       [...]| |  <-- Current (asterisk)                 |
|  | |   Tasks assigned to me,      | |                                          |
|  | |   Sprint 5, sorted by prio   | |                                          |
|  | +------------------------------+ |                                          |
|  | | o My Blocked Tasks      [...]| |                                          |
|  | |   Status: Blocked            | |                                          |
|  | +------------------------------+ |                                          |
|  | | o Overdue Items         [...]| |                                          |
|  | |   Due date: Past due         | |                                          |
|  | +------------------------------+ |                                          |
|  |                                  |                                          |
|  | SHARED WITH ME                   |                                          |
|  | +------------------------------+ |                                          |
|  | | o Sprint Planning       [...]| |  <-- Shared by Sarah                    |
|  | |   By Sarah Chen              | |                                          |
|  | +------------------------------+ |                                          |
|  |                                  |                                          |
|  | DEFAULT VIEWS                    |                                          |
|  | +------------------------------+ |                                          |
|  | | o All Tasks             [...]| |                                          |
|  | | o Board View (Kanban)   [...]| |                                          |
|  | | o Timeline              [...]| |                                          |
|  | +------------------------------+ |                                          |
|  |                                  |                                          |
|  | -------------------------------- |                                          |
|  | [+ Save Current View]            |                                          |
|  +----------------------------------+                                          |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Save View Modal

```
+------------------------------------------------------------------------------+
|  SAVE VIEW MODAL                                                               |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Save Current View                                                        | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  View Name *                                                              | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | My Sprint Tasks                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  Description (optional)                                                   | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Tasks assigned to me in the current sprint, sorted by priority    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  CURRENT FILTERS (What will be saved)                                     | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | Assignee:     Me (Sarah Chen)                                      |   | |
|  |  | Sprint:       Sprint 5                                             |   | |
|  |  | Status:       To Do, In Progress                                   |   | |
|  |  | Sort:         Priority (High to Low)                               |   | |
|  |  | Group By:     Epic                                                 |   | |
|  |  | View Type:    List                                                 |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  VISIBILITY                                                               | |
|  |                                                                           | |
|  |  (*) Private - Only I can see this view                                   | |
|  |  ( ) Team - Share with project team members                               | |
|  |  ( ) Public - Anyone in workspace can access                              | |
|  |                                                                           | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  DEFAULT SETTINGS                                                         | |
|  |                                                                           | |
|  |  [ ] Set as my default view for this project                              | |
|  |  [ ] Suggest as default for role: [Developer v]                           | |
|  |                                                                           | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |                                    [Cancel]  [Save View]                   | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Manage Views Panel

```
+------------------------------------------------------------------------------+
|  MANAGE SAVED VIEWS PANEL                                                      |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Manage Saved Views                                                       | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  [My Views]  [Shared]  [Role Defaults]                                    | |
|  |  _________                                                                | |
|  |                                                                           | |
|  |  MY VIEWS (4)                                                             | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | VIEW               | VISIBILITY | DEFAULT  | ACTIONS                |   | |
|  |  | ----------------------------------------------------------------- |   | |
|  |  | My Sprint Tasks    | Private    | * Yes    | [Edit] [Share] [...]  |   | |
|  |  | ----------------------------------------------------------------- |   | |
|  |  | My Blocked Tasks   | Private    |          | [Edit] [Share] [...]  |   | |
|  |  | ----------------------------------------------------------------- |   | |
|  |  | Overdue Items      | Team       |          | [Edit] [Share] [...]  |   | |
|  |  | ----------------------------------------------------------------- |   | |
|  |  | Code Review Queue  | Public     |          | [Edit] [Share] [...]  |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  [+ Create New View]                                                      | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  ROLE DEFAULTS TAB:                                                            |
|  +--------------------------------------------------------------------------+ |
|  |  Role Defaults (Admin only)                                               | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  Set default views for each role. Users can override with personal prefs. | |
|  |                                                                           | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | ROLE               | DEFAULT VIEW         | SET BY                 |   | |
|  |  | ----------------------------------------------------------------- |   | |
|  |  | Developer          | Sprint Board         | Sarah Chen             |   | |
|  |  | ----------------------------------------------------------------- |   | |
|  |  | Designer           | Timeline View        | (System Default)       |   | |
|  |  | ----------------------------------------------------------------- |   | |
|  |  | Project Manager    | All Tasks + Status   | John Martinez          |   | |
|  |  | ----------------------------------------------------------------- |   | |
|  |  | QA                 | Testing Queue        | Maya Johnson           |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  [Edit Role Defaults]                                                     | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Share View Dialog

```
+------------------------------------------------------------------------------+
|  SHARE VIEW DIALOG                                                             |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  |                                                              [x]          | |
|  |  Share View: "Code Review Queue"                                          | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  SHARE WITH                                                               | |
|  |                                                                           | |
|  |  Search team members...                                                   | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  CURRENTLY SHARED WITH                                                    | |
|  |  +-------------------------------------------------------------------+   | |
|  |  |                                                                    |   | |
|  |  | [x] John Martinez     Developer     Can view        [Remove]       |   | |
|  |  | [x] Maya Johnson      Designer      Can view        [Remove]       |   | |
|  |  |                                                                    |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |                                                                           | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  QUICK SHARE                                                              | |
|  |                                                                           | |
|  |  (*) Specific people (selected above)                                     | |
|  |  ( ) All project members                                                  | |
|  |  ( ) Entire workspace                                                     | |
|  |                                                                           | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |  SHARE LINK                                                               | |
|  |  +-------------------------------------------------------------------+   | |
|  |  | https://app.hyvve.io/project/123/view/456        [Copy Link]       |   | |
|  |  +-------------------------------------------------------------------+   | |
|  |  Anyone with this link and project access can use this view              | |
|  |                                                                           | |
|  |  -----------------------------------------------------------------------  | |
|  |                                                                           | |
|  |                                    [Cancel]  [Update Sharing]             | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### View Indicator in UI

```
+------------------------------------------------------------------------------+
|  VIEW INDICATOR (When custom view is active)                                   |
|                                                                                |
|  +--------------------------------------------------------------------------+ |
|  | Website Redesign v2.0                                                     | |
|  | [Overview] [Tasks] [Timeline] [Board] [Files] [Team]                      | |
|  +--------------------------------------------------------------------------+ |
|  |                                                                           | |
|  | +-----------------------------------------------------------------------+ | |
|  | | VIEW: My Sprint Tasks                                          [x]    | | |
|  | | -------------------------------------------------------------------- | | |
|  | | Filters: Assignee=Me, Sprint=5, Status=To Do/In Progress              | | |
|  | | Sort: Priority (High to Low) | Grouped by: Epic                       | | |
|  | |                                                                        | | |
|  | | [Edit Filters]  [Save Changes]  [Clear View]                          | | |
|  | +-----------------------------------------------------------------------+ | |
|  |                                                                           | |
|  | TASK LIST (Filtered)                                                      | |
|  | +-----------------------------------------------------------------------+ | |
|  | | [x] AUTH-123: Implement OAuth     High    In Progress    Dec 18       | | |
|  | | [ ] AUTH-124: Token refresh       High    To Do          Dec 20       | | |
|  | | [ ] AUTH-125: Session timeout     Medium  To Do          Dec 22       | | |
|  | +-----------------------------------------------------------------------+ | |
|  |                                                                           | |
|  | Showing 3 of 45 tasks (filtered)                                          | |
|  |                                                                           | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Key Elements

1. **Views Dropdown**
   - Position: Project header, next to project name
   - Shows current view name
   - Categorized sections: My Views, Shared, Defaults
   - Quick access to save current view
   - Manage Views link

2. **Save View Modal**
   - Name and description fields
   - Shows current filters being saved
   - Visibility options: Private/Team/Public
   - Default settings per user or role

3. **Manage Views Panel**
   - Tab navigation: My Views, Shared, Role Defaults
   - Table with edit/share/delete actions
   - Admin-only role defaults tab
   - Create new view button

4. **Share Dialog**
   - Person search/picker
   - List of current shares
   - Quick share radio options
   - Shareable link with copy

5. **View Indicator Bar**
   - Shows when custom view is active
   - Displays applied filters summary
   - Quick edit/save/clear actions
   - Dismissable

### Filter Types Supported

- Assignee (single/multiple)
- Status (single/multiple)
- Priority (single/multiple)
- Sprint (single/multiple)
- Epic/Parent (single/multiple)
- Due date (range/relative)
- Tags (include/exclude)
- Custom fields

### Sort Options

- Priority (High to Low, Low to High)
- Due Date (Nearest first, Farthest first)
- Created Date (Newest, Oldest)
- Updated Date (Newest, Oldest)
- Status (custom order)
- Assignee (alphabetical)

### Group By Options

- None (flat list)
- Epic
- Sprint
- Assignee
- Status
- Priority

### Style Notes

- View dropdown uses 320px width
- Current view has asterisk (*) indicator
- Shared views show "By [Name]" attribution
- Default views have subtle gray background
- Active view indicator uses coral left border
- Filter chips are removable with X icon

---

## Next Batch

**BATCH-17:** Phase 2 Missing PM Wireframes (P2)
- PM-27: Executive Portfolio Dashboard
- PM-28: Daily Briefing (Navi)
- PM-29: GitHub/GitLab Integration Panel
- PM-30: CSV Import Wizard
- PM-31: Sprint Enhancements Dashboard

---

_End of BATCH-16: Missing P1 PM Wireframes_
