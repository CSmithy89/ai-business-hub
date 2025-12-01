# Batch 8: PM Module Part 1 - Google Stitch Wireframe Prompts

## Prompts 71-80: Project Management Core Components

---

## Global Design System (Copy into each prompt)

```
HYVVE Design System Specifications:

COLORS:
- Primary Coral: #FF6B6B (buttons, links, active states)
- Secondary Teal: #20B2AA (secondary actions, accents)
- Background Cream: #FFFBF5 (main background)
- Surface White: #FFFFFF (cards, panels)
- Border Light: #E8E4E0 (dividers, borders)
- Text Primary: #1A1A1A (headings, body)
- Text Secondary: #6B6B6B (labels, captions)
- Text Muted: #9CA3AF (placeholders, disabled)

STATUS COLORS:
- Success Green: #10B981
- Warning Amber: #F59E0B
- Error Red: #EF4444
- Info Blue: #3B82F6

AGENT COLORS:
- Hub (Orchestrator): #FF6B6B coral
- Maya (Content): #20B2AA teal
- Atlas (Data): #FF9F43 orange
- Sage (Strategy): #2ECC71 green
- Nova (Creative): #FF6B9D pink
- Echo (Support): #4B7BEC blue

TYPOGRAPHY:
- Font Family: 'Inter', -apple-system, sans-serif
- Code Font: 'JetBrains Mono', monospace
- Base Size: 16px
- Scale: 12px, 14px, 16px, 18px, 20px, 24px, 32px, 48px
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Line Heights: 1.2 (headings), 1.5 (body), 1.6 (relaxed)

SPACING (4px base):
- 4px (xs), 8px (sm), 12px (md), 16px (lg), 20px (xl), 24px (2xl), 32px (3xl), 48px (4xl), 64px (5xl)

BORDER RADIUS:
- 4px (sm), 8px (md), 12px (lg), 16px (xl), 9999px (full/pill)

SHADOWS:
- xs: 0 1px 2px rgba(0,0,0,0.04)
- sm: 0 2px 4px rgba(0,0,0,0.04)
- md: 0 4px 6px rgba(0,0,0,0.04)
- lg: 0 8px 16px rgba(0,0,0,0.06)
- xl: 0 16px 32px rgba(0,0,0,0.08)

TRANSITIONS:
- fast: 100ms ease
- normal: 150ms ease
- slow: 250ms ease
- slide: 300ms cubic-bezier(0.4, 0, 0.2, 1)

Z-INDEX:
- dropdown: 1000
- sticky: 1020
- modal-backdrop: 1040
- modal: 1050
- popover: 1060
- tooltip: 1070
- toast: 1080
```

---

## Prompt 71: PM-01 Projects List View

```
Create an HTML/CSS wireframe for a Project Management Projects List page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Display all projects with multiple view options (list, grid, board), filtering, search, and project creation. Projects contain tasks, milestones, and team assignments.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ [📁] Projects                              [+ New Project]  │
│ Manage your team's work                                     │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search projects...]         [Status ▾] [Team ▾] [▤ ▦ ▥]│
│                                                             │
│ 12 projects │ 3 active │ 2 at risk │ 7 on track            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ACTIVE PROJECTS                                         │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📁 Website Redesign                       ⭐ [⋮]    │ │ │
│ │ │                                                     │ │ │
│ │ │ Client: Acme Corp │ Due: Dec 15, 2024              │ │ │
│ │ │                                                     │ │ │
│ │ │ Progress ████████████░░░░░░ 65%                     │ │ │
│ │ │                                                     │ │ │
│ │ │ 👤👤👤 +2 │ 24/36 tasks │ 🟢 On Track              │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📁 Mobile App Development                    [⋮]    │ │ │
│ │ │                                                     │ │ │
│ │ │ Client: TechStart │ Due: Jan 30, 2025              │ │ │
│ │ │                                                     │ │ │
│ │ │ Progress ████████░░░░░░░░░░ 40%                     │ │ │
│ │ │                                                     │ │ │
│ │ │ 👤👤👤👤 │ 18/45 tasks │ 🟡 At Risk                │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📁 Marketing Campaign Q4                     [⋮]    │ │ │
│ │ │                                                     │ │ │
│ │ │ Internal │ Due: Nov 30, 2024                        │ │ │
│ │ │                                                     │ │ │
│ │ │ Progress ██████████████████ 90%                     │ │ │
│ │ │                                                     │ │ │
│ │ │ 👤👤 │ 27/30 tasks │ 🟢 On Track                   │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─── COMPLETED ─────────────────────────────────────────────┐
│ │ [Expand to show 7 completed projects]                    │
│ └───────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘

VIEW TOGGLE:
- Icons: List (▤), Grid (▦), Board (▥)
- Size: 36x36px each
- Container: bg #F5F5F5, rounded 8px, padding 4px
- Active: bg #FFFFFF, shadow-sm
- Default: opacity 0.6, hover opacity 1

PROJECT CARD (List View):
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 12px
- Padding: 20px
- Margin: 12px 0
- Hover: shadow-md, border-color #FF6B6B
- Cursor: pointer

PROJECT CARD CONTENT:
- Icon: 24px folder icon, colored by project type
- Name: 18px semibold #1A1A1A
- Starred: ⭐ icon if favorited
- Client/type: 14px regular #6B6B6B
- Due date: 14px regular #6B6B6B

PROGRESS BAR:
- Height: 8px
- Background: #E8E4E0
- Border radius: 4px
- Fill: gradient based on progress
  - On track: #10B981
  - At risk: #F59E0B
  - Behind: #EF4444
- Percentage: 14px semibold, right-aligned

TEAM AVATARS:
- Size: 28px circles
- Overlap: -8px margin
- Max display: 4, then "+N" counter
- Border: 2px solid #FFFFFF

STATUS BADGES:
- On Track 🟢: bg #D1FAE5, text #065F46
- At Risk 🟡: bg #FEF3C7, text #92400E
- Behind 🔴: bg #FEE2E2, text #991B1B
- On Hold ⏸️: bg #E5E7EB, text #374151
- Completed ✓: bg #DBEAFE, text #1E40AF

SECTION HEADERS:
- Text: 12px semibold uppercase #6B6B6B
- Letter-spacing: 1px
- Collapsible with chevron icon

GRID VIEW (alternative):
- Cards: 300px min-width, flex-wrap
- Same content, stacked vertically
- 3 columns desktop, 2 tablet, 1 mobile

BOARD VIEW (alternative):
- Columns: To Start, In Progress, Review, Completed
- Cards: smaller, draggable
- Horizontal scroll on mobile

NEW PROJECT BUTTON:
- Primary style
- Dropdown on click: Blank project, From template

FILTERS:
- Status: All, Active, Completed, On Hold
- Team: multi-select team members
- Client: multi-select clients

EMPTY STATE:
- Icon: 64px folder illustration
- Title: "No projects yet"
- Description: "Create your first project to start organizing work"
- CTA: "Create Project"

Include skeleton loading state and all view variants.
```

---

## Prompt 72: PM-02 Project Detail Overview

```
Create an HTML/CSS wireframe for a Project Detail Overview page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Comprehensive project dashboard showing progress, tasks, milestones, team, files, and AI-generated insights all in one view.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ [← Projects] Website Redesign                     ⭐ [⋮]   │
│ Acme Corp │ Due: Dec 15, 2024 │ 🟢 On Track                │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Tasks] [Timeline] [Files] [Team] [Settings]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────────────────────┬───────────────────────────┐   │
│ │ PROJECT PROGRESS          │ KEY METRICS               │   │
│ │                           │                           │   │
│ │      ┌─────────┐          │ ┌─────────┐ ┌─────────┐   │   │
│ │      │         │          │ │ 24      │ │ 12      │   │   │
│ │      │   65%   │          │ │ Tasks   │ │ Tasks   │   │   │
│ │      │         │          │ │ Done    │ │ Left    │   │   │
│ │      └─────────┘          │ └─────────┘ └─────────┘   │   │
│ │                           │                           │   │
│ │   24/36 tasks complete    │ ┌─────────┐ ┌─────────┐   │   │
│ │   On track for deadline   │ │ 3       │ │ 18      │   │   │
│ │                           │ │ Days    │ │ Days    │   │   │
│ │                           │ │ Sprint  │ │ Project │   │   │
│ │                           │ └─────────┘ └─────────┘   │   │
│ └───────────────────────────┴───────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI PROJECT INSIGHTS                                  │ │
│ │                                                         │ │
│ │ • Project velocity is 15% faster than similar projects  │ │
│ │ • 2 tasks at risk of missing deadline: "API integration"│ │
│ │   and "Payment gateway setup" - Consider reassignment   │ │
│ │ • Team workload balanced. Sarah has 20% capacity.       │ │
│ │                                                         │ │
│ │ [View Recommendations]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│ │ UPCOMING MILESTONES     │ │ RECENT ACTIVITY            │ │
│ │                         │ │                            │ │
│ │ ○─── Nov 20            │ │ ○ Task completed           │ │
│ │ │   Design Review       │ │ │ "Header design"          │ │
│ │ │   3 tasks remaining   │ │ │ Sarah Chen • 2h ago     │ │
│ │ │                       │ │ │                          │ │
│ │ ○─── Dec 1             │ │ ○ Comment added            │ │
│ │ │   Development Sprint 1│ │ │ "Looks great!"           │ │
│ │ │   8 tasks remaining   │ │ │ Mike Johnson • 4h ago   │ │
│ │ │                       │ │ │                          │ │
│ │ ○─── Dec 15            │ │ ○ File uploaded            │ │
│ │     Final Delivery      │ │   "mockups_v2.fig"        │ │
│ │     12 tasks remaining  │ │   Jane Doe • Yesterday    │ │
│ │                         │ │                            │ │
│ │ [View All Milestones]   │ │ [View All Activity]        │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ TEAM                                         [Manage →] │ │
│ │                                                         │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │ │
│ │ │ 👤          │ │ 👤          │ │ 👤          │  [+ Add]│ │
│ │ │ Sarah Chen  │ │ Mike Johnson│ │ Jane Doe    │         │ │
│ │ │ Lead        │ │ Developer   │ │ Designer    │         │ │
│ │ │ 8 tasks     │ │ 12 tasks    │ │ 6 tasks     │         │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

HEADER SECTION:
- Back link: 14px medium #FF6B6B
- Project name: 28px bold #1A1A1A
- Star toggle: 24px, filled #F59E0B when active
- More menu: dropdown with Edit, Archive, Delete
- Metadata: 14px regular #6B6B6B, pipe separated

TAB NAVIGATION:
- Container: border-bottom 1px #E8E4E0
- Tab: padding 16px 24px, 14px medium
- Default: #6B6B6B
- Active: #FF6B6B, border-bottom 2px #FF6B6B
- Hover: #1A1A1A

PROGRESS DONUT:
- Size: 120px diameter
- Stroke: 12px
- Background stroke: #E8E4E0
- Progress stroke: #10B981 (on track), #F59E0B (at risk), #EF4444 (behind)
- Center text: 32px bold percentage
- Label below: 14px regular #6B6B6B

METRIC CARDS:
- Size: 100px x 80px
- Background: #FAFAFA
- Border radius: 12px
- Value: 28px bold #1A1A1A
- Label: 12px regular #6B6B6B
- Grid: 2x2 with 12px gap

AI INSIGHTS CARD:
- Background: linear-gradient(135deg, #FFFBF5 0%, #FFF5F5 100%)
- Border: 1px solid #FFE8E8
- Border radius: 16px
- Padding: 20px
- Icon: 🤖 20px
- Title: 16px semibold #1A1A1A
- Bullets: 14px regular #6B6B6B

MILESTONE TIMELINE:
- Container: bg #FFFFFF, rounded 16px, padding 20px
- Timeline: 2px solid #E8E4E0
- Node: 12px circle, bg #E8E4E0, upcoming bg #FF6B6B
- Date: 12px semibold #6B6B6B
- Name: 16px semibold #1A1A1A
- Tasks remaining: 14px regular #6B6B6B

ACTIVITY FEED (compact):
- Timeline style
- Icon: 20px, varies by type
- Title: 14px medium #1A1A1A
- Detail: 12px regular #6B6B6B
- Author + time: 12px regular #9CA3AF

TEAM CARDS:
- Width: 140px
- Background: #FAFAFA
- Border radius: 12px
- Padding: 16px
- Text align: center
- Avatar: 48px circle
- Name: 14px semibold #1A1A1A
- Role: 12px regular #6B6B6B
- Task count: 12px regular #9CA3AF

Include quick actions (add task, log time, upload file) and responsive layout.
```

---

## Prompt 73: PM-03 Task Board (Kanban)

```
Create an HTML/CSS wireframe for a Project Task Board (Kanban) view for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Kanban-style task board for visualizing and managing project tasks across different stages with drag-and-drop functionality.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ Website Redesign › Tasks                     [+ Add Task]   │
│ [Board] [List] [Calendar]        [Filter ▾] [Group by ▾]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ TO DO       │ │ IN PROGRESS │ │ IN REVIEW   │ │ DONE    │ │
│ │ 8 tasks     │ │ 5 tasks     │ │ 3 tasks     │ │ 20 tasks│ │
│ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────┤ │
│ │             │ │             │ │             │ │         │ │
│ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │┌───────┐│ │
│ │ │ 🔴 High │ │ │ │ 🟡 Med  │ │ │ │ 🟢 Low  │ │ ││ ✓     ││ │
│ │ │ API     │ │ │ │ Header  │ │ │ │ Icons   │ │ ││ Login ││ │
│ │ │ integr. │ │ │ │ design  │ │ │ │ update  │ │ │└───────┘│ │
│ │ │         │ │ │ │         │ │ │ │         │ │ │         │ │
│ │ │ 👤 Mike │ │ │ │ 👤Sarah │ │ │ │ 👤 Jane │ │ │┌───────┐│ │
│ │ │ Dec 10  │ │ │ │ Nov 20  │ │ │ │ Nov 25  │ │ ││ ✓     ││ │
│ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ ││ Signup││ │
│ │             │ │             │ │             │ │└───────┘│ │
│ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │         │ │
│ │ │ 🟡 Med  │ │ │ │ 🔴 High │ │ │ │ 🟡 Med  │ │ │┌───────┐│ │
│ │ │ Payment │ │ │ │ Mobile  │ │ │ │ Copy    │ │ ││ ✓     ││ │
│ │ │ gateway │ │ │ │ respons.│ │ │ │ review  │ │ ││ Footer││ │
│ │ │         │ │ │ │         │ │ │ │         │ │ │└───────┘│ │
│ │ │ 👤 Mike │ │ │ │ 👤Sarah │ │ │ │ 👤 Jane │ │ │         │ │
│ │ │ Dec 15  │ │ │ │ Nov 22  │ │ │ │ Nov 24  │ │ │   ...   │ │
│ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │         │ │
│ │             │ │             │ │             │ │         │ │
│ │ ┌─────────┐ │ │ ┌─────────┐ │ │             │ │         │ │
│ │ │ 🟢 Low  │ │ │ │ 🟢 Low  │ │ │             │ │         │ │
│ │ │ Docs    │ │ │ │ Testing │ │ │             │ │         │ │
│ │ │ update  │ │ │ │ setup   │ │ │             │ │         │ │
│ │ │ 👤 Alex │ │ │ │ 👤 Alex │ │ │             │ │         │ │
│ │ │ Dec 20  │ │ │ │ Nov 28  │ │ │             │ │         │ │
│ │ └─────────┘ │ │ └─────────┘ │ │             │ │         │ │
│ │             │ │             │ │             │ │         │ │
│ │ [+ Add]     │ │ [+ Add]     │ │ [+ Add]     │ │         │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

BOARD CONTAINER:
- Display: flex
- Overflow-x: auto (horizontal scroll)
- Gap: 16px
- Padding: 16px
- Background: #FFFBF5

COLUMN:
- Width: 280px min, 320px max
- Background: #F5F5F5
- Border radius: 12px
- Padding: 12px
- Height: calc(100vh - 180px)
- Overflow-y: auto (vertical scroll within)

COLUMN HEADER:
- Display: flex justify-between align-center
- Padding: 12px 0
- Position: sticky top 0, bg #F5F5F5
- Title: 14px semibold uppercase #6B6B6B
- Count: 14px regular #9CA3AF
- Optional color indicator bar: 4px height at top

COLUMN COLORS:
- To Do: border-top 4px #E8E4E0
- In Progress: border-top 4px #3B82F6
- In Review: border-top 4px #F59E0B
- Done: border-top 4px #10B981

TASK CARD:
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 8px
- Padding: 12px
- Margin: 8px 0
- Cursor: grab
- Hover: shadow-md, border-color #FF6B6B

TASK CARD DRAGGING STATE:
- Opacity: 0.8
- Shadow: xl
- Transform: rotate(2deg)
- Cursor: grabbing

DROP ZONE INDICATOR:
- Border: 2px dashed #FF6B6B
- Background: rgba(255, 107, 107, 0.05)
- Height: estimated card height
- Border radius: 8px

PRIORITY INDICATOR:
- Position: top-left of card
- High 🔴: bg #FEE2E2, text #991B1B
- Medium 🟡: bg #FEF3C7, text #92400E
- Low 🟢: bg #D1FAE5, text #065F46
- None: no indicator
- Size: padding 2px 8px, 10px font, rounded 4px

TASK CARD CONTENT:
- Title: 14px medium #1A1A1A, max 2 lines
- Assignee avatar: 24px circle, bottom-left
- Due date: 12px regular #6B6B6B, bottom-right
- Tags: 10px pills below title (optional)

TASK CARD INDICATORS:
- Comments: 💬 count
- Attachments: 📎 count
- Subtasks: ☑ completed/total
- Displayed in footer row, 12px, #9CA3AF

DONE COLUMN CARDS:
- Opacity: 0.7
- Strikethrough on title (optional)
- Checkmark overlay

ADD TASK INLINE:
- Position: bottom of column
- Input: full width, bg #FFFFFF, border 1px #E8E4E0
- Placeholder: "Add task..."
- Enter to create, Esc to cancel

VIEW TOGGLE:
- Board/List/Calendar options
- Same styling as project list view toggle

FILTERS:
- Assignee: avatar multi-select
- Priority: High, Medium, Low, None
- Due date: Overdue, Today, This week, No date
- Tags: multi-select

GROUP BY OPTIONS:
- None (default)
- Assignee (columns per person)
- Priority (columns per priority)
- Due date (columns per timeframe)

RESPONSIVE (<768px):
- Single column view
- Horizontal swipe between columns
- Column selector dropdown

Include drag-and-drop states, column collapse/expand, and task quick-edit.
```

---

## Prompt 74: PM-04 Task List View

```
Create an HTML/CSS wireframe for a Project Task List view for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Tabular list view of all project tasks with sorting, inline editing, bulk actions, and subtask hierarchy.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ Website Redesign › Tasks                     [+ Add Task]   │
│ [Board] [List] [Calendar]        [Filter ▾] [Group by ▾]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ☐ │ 36 tasks │ [Select all] │ [Bulk Actions ▾]             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │☐│ TASK NAME          │STATUS    │ASSIGNEE│DUE     │PRIO│ │
│ ├─┼────────────────────┼──────────┼────────┼────────┼────┤ │
│ │☐│ ▶ API Integration  │In Progress│👤 Mike│Dec 10  │🔴  │ │
│ ├─┼────────────────────┼──────────┼────────┼────────┼────┤ │
│ │☐│   └ Auth endpoints │To Do     │👤 Mike│Dec 8   │🔴  │ │
│ │☐│   └ Data endpoints │In Progress│👤 Mike│Dec 9   │🟡  │ │
│ │☐│   └ Error handling │To Do     │👤 Alex│Dec 10  │🟢  │ │
│ ├─┼────────────────────┼──────────┼────────┼────────┼────┤ │
│ │☐│ ▶ Header Design    │In Review │👤Sarah│Nov 20  │🟡  │ │
│ ├─┼────────────────────┼──────────┼────────┼────────┼────┤ │
│ │☐│   └ Desktop version│Done ✓    │👤Sarah│Nov 18  │    │ │
│ │☐│   └ Mobile version │In Review │👤Sarah│Nov 20  │🟡  │ │
│ │☐│   └ Tablet version │To Do     │👤 Jane│Nov 22  │🟢  │ │
│ ├─┼────────────────────┼──────────┼────────┼────────┼────┤ │
│ │☐│ Payment Gateway    │To Do     │👤 Mike│Dec 15  │🔴  │ │
│ ├─┼────────────────────┼──────────┼────────┼────────┼────┤ │
│ │☐│ Mobile Responsive  │In Progress│👤Sarah│Nov 22  │🔴  │ │
│ ├─┼────────────────────┼──────────┼────────┼────────┼────┤ │
│ │☐│ Icons Update       │In Review │👤 Jane│Nov 25  │🟢  │ │
│ ├─┼────────────────────┼──────────┼────────┼────────┼────┤ │
│ │☐│ Documentation      │To Do     │👤 Alex│Dec 20  │🟢  │ │
│ ├─┼────────────────────┼──────────┼────────┼────────┼────┤ │
│ │☐│ Testing Setup      │In Progress│👤 Alex│Nov 28  │🟢  │ │
│ └─┴────────────────────┴──────────┴────────┴────────┴────┘ │
│                                                             │
│ Showing 36 of 36 tasks                                      │
└─────────────────────────────────────────────────────────────┘

TABLE CONTAINER:
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 12px
- Overflow: hidden

TABLE HEADER:
- Background: #FAFAFA
- Padding: 12px 16px
- Text: 12px semibold uppercase #6B6B6B
- Letter-spacing: 0.5px
- Position: sticky top 0
- Sortable columns: cursor pointer, hover underline
- Sort icons: ▲▼ next to sortable headers

TABLE ROW:
- Padding: 12px 16px
- Border-bottom: 1px solid #E8E4E0
- Hover: bg #FAFAFA
- Selected: bg #FFF5F5

CHECKBOX COLUMN:
- Width: 40px
- Checkbox: 18px
- Center aligned

TASK NAME COLUMN:
- Min-width: 300px
- Flex-grow: 1
- Parent tasks: 14px medium #1A1A1A
- Subtasks: 14px regular #6B6B6B, indented 24px
- Expand/collapse: ▶ ▼ triangle icon

HIERARCHY INDICATORS:
- Indent: 24px per level
- Connection line: └ character or border-left styling
- Max 3 levels deep

STATUS COLUMN:
- Width: 120px
- Dropdown on click
- Status pill styling (same as board view)

ASSIGNEE COLUMN:
- Width: 100px
- Avatar: 24px circle
- Click to reassign (dropdown)

DUE DATE COLUMN:
- Width: 100px
- Format: "Nov 20" or "Dec 10"
- Overdue: #EF4444 text color
- Today: #F59E0B
- Click to change (date picker)

PRIORITY COLUMN:
- Width: 60px
- Color dots: 🔴🟡🟢
- Click to change (dropdown)

INLINE EDITING:
- Click cell to edit
- Input field replaces text
- Enter to save, Esc to cancel
- Tab to move to next cell

BULK ACTIONS BAR (when items selected):
- Position: sticky bottom
- Background: #1A1A1A
- Text: #FFFFFF
- Actions: Move, Assign, Set Priority, Delete

ROW ACTIONS (hover):
- Position: right side of row
- Quick actions: Complete, Edit, Delete
- Opacity: 0 → 1 on row hover

ADD TASK ROW:
- Position: bottom of table
- Input: spans task name column
- Placeholder: "Add task... (Tab for details)"
- Quick add: Enter creates task
- Tab: expand inline form for more fields

EXPANDED ADD TASK FORM:
┌─────────────────────────────────────────────────────────────┐
│ [Task name                                                ] │
│ [Status ▾] [Assignee ▾] [Due date    ] [Priority ▾]        │
│ [Description...                                           ] │
│ ☐ Create as subtask of: [Select parent...            ▾]    │
│                                     [Cancel] [Create Task]  │
└─────────────────────────────────────────────────────────────┘

GROUP BY SECTIONS:
- When grouped (by status, assignee, etc.)
- Section headers: collapsible
- Subtotals in header

Include keyboard navigation (arrow keys, Enter to edit) and pagination for large lists.
```

---

## Prompt 75: PM-05 Task Detail Modal

```
Create an HTML/CSS wireframe for a Task Detail Modal for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Full task details in a modal overlay including description, subtasks, comments, attachments, activity history, and AI suggestions.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ API Integration                                         [✕] │
│ Website Redesign › Tasks                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────┬───────────────────────────┐ │
│ │ TASK DETAILS                │ PROPERTIES                │ │
│ │                             │                           │ │
│ │ ☐ Mark complete             │ Status                    │ │
│ │                             │ [In Progress          ▾]  │ │
│ │ ──────────────────────────  │                           │ │
│ │                             │ Assignee                  │ │
│ │ Description                 │ [👤 Mike Johnson      ▾]  │ │
│ │ ┌───────────────────────┐   │                           │ │
│ │ │ Implement the REST    │   │ Due Date                  │ │
│ │ │ API integration with  │   │ [📅 Dec 10, 2024      ▾]  │ │
│ │ │ the backend services. │   │                           │ │
│ │ │ This includes auth,   │   │ Priority                  │ │
│ │ │ data endpoints, and   │   │ [🔴 High              ▾]  │ │
│ │ │ error handling.       │   │                           │ │
│ │ │                       │   │ Tags                      │ │
│ │ │ [Edit description]    │   │ [Backend] [API] [+ Add]   │ │
│ │ └───────────────────────┘   │                           │ │
│ │                             │ Time Tracking             │ │
│ │ ──────────────────────────  │ Estimate: 8h              │ │
│ │                             │ Logged: 5h 30m            │ │
│ │ SUBTASKS (2/3)              │ [+ Log Time]              │ │
│ │                             │                           │ │
│ │ ☑ Auth endpoints            │ ─────────────────────────│ │
│ │ ☐ Data endpoints            │                           │ │
│ │ ☐ Error handling            │ Parent Task               │ │
│ │                             │ [None                 ▾]  │ │
│ │ [+ Add subtask]             │                           │ │
│ │                             │ Dependencies              │ │
│ │ ──────────────────────────  │ Blocked by:               │ │
│ │                             │ • Database schema         │ │
│ │ ATTACHMENTS (2)             │ [+ Add dependency]        │ │
│ │                             │                           │ │
│ │ 📄 api-spec.pdf    2.3 MB   │                           │ │
│ │ 📄 endpoints.md    45 KB    │                           │ │
│ │                             │                           │ │
│ │ [+ Add attachment]          │                           │ │
│ │                             │                           │ │
│ └─────────────────────────────┴───────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI SUGGESTIONS                                       │ │
│ │                                                         │ │
│ │ Based on task dependencies and team workload:           │ │
│ │ • Consider breaking down "Data endpoints" into smaller  │ │
│ │   tasks for better tracking                             │ │
│ │ • Similar task "OAuth setup" took 6h - update estimate? │ │
│ │                                                         │ │
│ │ [Apply Suggestions] [Dismiss]                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ COMMENTS & ACTIVITY                                     │ │
│ │ [Comments] [Activity]                                   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                         │ │
│ │ 👤 Mike Johnson • 2 hours ago                          │ │
│ │ Started working on auth endpoints. Running into         │ │
│ │ some issues with token refresh logic.                   │ │
│ │ [Reply] [Edit]                                          │ │
│ │                                                         │ │
│ │ 👤 Sarah Chen • 4 hours ago                            │ │
│ │ @Mike check the auth-service repo for reference         │ │
│ │ implementation. That should help.                       │ │
│ │ [Reply]                                                 │ │
│ │                                                         │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [Write a comment...                                   ] │ │
│ │ [@mention] [📎 Attach] [😊]              [Post Comment] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [🗑️ Delete Task]                            [Close]        │
└─────────────────────────────────────────────────────────────┘

MODAL CONTAINER:
- Width: 900px max
- Height: 90vh max
- Background: #FFFFFF
- Border radius: 16px
- Shadow: xl
- Overflow-y: auto

MODAL HEADER:
- Padding: 20px 24px
- Border-bottom: 1px solid #E8E4E0
- Title: 24px semibold #1A1A1A
- Breadcrumb: 14px regular #6B6B6B
- Close button: 40x40px, top-right

TWO-COLUMN LAYOUT:
- Left (main): flex-grow, min-width 400px
- Right (sidebar): 280px fixed
- Gap: 24px
- Padding: 24px

MARK COMPLETE CHECKBOX:
- Size: 24px
- Prominent position
- Strikethrough task title when checked
- Celebration animation on complete

DESCRIPTION:
- Editable rich text
- Support markdown
- Click to edit mode
- Min height: 100px

SUBTASKS:
- Checkbox: 18px
- Text: 14px regular
- Completed: strikethrough, opacity 0.6
- Progress: "2/3" format
- Inline add new subtask

ATTACHMENTS:
- File icon by type
- Name: 14px medium, truncate
- Size: 12px regular #6B6B6B
- Actions on hover: Download, Preview, Delete

PROPERTIES SIDEBAR:
- Section labels: 12px medium #6B6B6B
- Values: dropdowns/pickers
- Each property: margin-bottom 16px

TIME TRACKING:
- Estimate input: hours
- Logged display: hours/minutes
- Progress bar if estimate set
- Log time modal trigger

DEPENDENCIES:
- "Blocked by" list
- "Blocking" list
- Link to dependent tasks
- Add/remove controls

AI SUGGESTIONS CARD:
- Background: linear-gradient(135deg, #F0FDF9 0%, #DBEAFE 100%)
- Border: 1px solid #A7F3D0
- Padding: 16px
- Dismissible

COMMENTS TAB:
- Avatar: 36px
- Author: 14px semibold
- Timestamp: 12px #9CA3AF
- Content: 14px regular
- Actions: Reply, Edit (own comments), Delete

ACTIVITY TAB:
- Timeline format
- Auto-logged events: status changes, assignments, etc.
- Icon + description + timestamp

COMMENT INPUT:
- Textarea with toolbar
- @mention autocomplete
- Emoji picker
- Attachment upload
- Submit button

FOOTER:
- Border-top: 1px #E8E4E0
- Delete: ghost red button, left
- Close: primary button, right

Include keyboard shortcuts (Cmd+Enter to save comment) and real-time updates.
```

---

## Prompt 76: PM-06 Timeline/Gantt View

```
Create an HTML/CSS wireframe for a Project Timeline/Gantt View for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Visual timeline showing project tasks, milestones, and dependencies over time with drag-to-reschedule functionality.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ Website Redesign › Timeline                  [+ Add Task]   │
│ [Board] [List] [Timeline]        [Today] [◀ Nov 2024 ▶]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │         │Nov 11│  18  │  25  │Dec 2 │  9   │  16  │ 23 │ │
│ ├─────────┼──────┴──────┴──────┴──────┴──────┴──────┴─────┤ │
│ │         │                                               │ │
│ │ DESIGN  │                                               │ │
│ │         │ ████████████████████                          │ │
│ │ Header  │ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  ●                      │ │
│ │ Design  │ Sarah │ Nov 10-20                             │ │
│ │         │                                               │ │
│ │ Icons   │         ██████████████████                    │ │
│ │ Update  │         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░  ●                │ │
│ │         │         Jane │ Nov 15-25                      │ │
│ │         │                                               │ │
│ │─────────│───────────────────────────────────────────────│ │
│ │         │                                               │ │
│ │ DEV     │                                               │ │
│ │         │               ██████████████████████████████  │ │
│ │ API     │               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░ │ │
│ │ Integr. │               Mike │ Nov 18 - Dec 10    ─┬──▶│ │
│ │         │                                          │    │ │
│ │         │                                          │    │ │
│ │ Payment │                              ████████████│████│ │
│ │ Gateway │                              ▓▓▓▓▓▓▓▓▓▓▓▓│▓▓▓▓│ │
│ │         │                              Mike │ Dec 1-15 ◀┘ │
│ │         │                                               │ │
│ │─────────│───────────────────────────────────────────────│ │
│ │         │                                               │ │
│ │MILESTON │         ◆                            ◆        │ │
│ │         │    Design Review              Final Delivery  │ │
│ │         │      Nov 20                      Dec 15       │ │
│ │         │                                               │ │
│ └─────────┴───────────────────────────────────────────────┘ │
│                                                             │
│ Legend: ▓▓ Progress │ ◆ Milestone │ ──▶ Dependency         │
└─────────────────────────────────────────────────────────────┘

GANTT CONTAINER:
- Display: grid
- Row labels: 200px fixed left column
- Timeline: scrollable right
- Row height: 48px
- Background: #FFFFFF

TIME HEADER:
- Position: sticky top
- Background: #FAFAFA
- Border-bottom: 1px solid #E8E4E0
- Month/week labels: 14px medium #1A1A1A
- Day numbers: 12px regular #6B6B6B
- Today indicator: vertical line #FF6B6B, 2px

ROW LABELS (Left Column):
- Position: sticky left
- Background: #FFFFFF
- Border-right: 1px solid #E8E4E0
- Padding: 8px 12px
- Task name: 14px medium #1A1A1A
- Grouping headers: 12px semibold uppercase #6B6B6B

GROUP SECTIONS:
- Collapsible with chevron
- Separator line between groups
- Background: #FAFAFA for headers

TASK BAR:
- Height: 28px
- Border radius: 6px
- Base color by status or assignee
- Progress fill: darker shade of base
- Text: 12px medium #FFFFFF (if fits inside)
- Hover: shadow-sm, cursor pointer

TASK BAR COLORS:
- Design tasks: #FF6B9D (pink)
- Development tasks: #4B7BEC (blue)
- Content tasks: #20B2AA (teal)
- QA tasks: #FF9F43 (orange)

PROGRESS INDICATOR:
- Solid fill for completed portion
- Striped/lighter fill for remaining
- Percentage shown on hover

MILESTONE MARKER:
- Diamond shape ◆
- Size: 16px
- Color: #FF6B6B
- Label below: 12px regular

DEPENDENCY ARROWS:
- Line: 1px solid #6B6B6B
- Arrow head at end
- Curved path between tasks
- Highlight on hover

TODAY LINE:
- Vertical line: 2px dashed #FF6B6B
- Full height of chart
- "Today" label at top

DRAG INTERACTIONS:
- Bar edges: resize duration (cursor: ew-resize)
- Bar body: move task dates (cursor: grab)
- Visual feedback during drag
- Snap to grid (day/week)

TIME SCALE OPTIONS:
- Day view: single day columns
- Week view: week columns (default)
- Month view: month columns
- Zoom controls: + / -

NAVIGATION:
- Today button: scroll to current date
- Month navigation: ◀ ▶ arrows
- Horizontal scroll: click-drag or scrollbar
- Keyboard: arrow keys

MINI TASK DETAIL (on hover):
┌─────────────────────────────┐
│ API Integration             │
│ Mike Johnson                │
│ Nov 18 - Dec 10 (23 days)   │
│ Progress: 65%               │
│ ████████████░░░░            │
└─────────────────────────────┘

RESPONSIVE:
- < 768px: List view fallback with due dates
- Horizontal scroll essential

Include zoom controls, critical path highlighting, and export to image.
```

---

## Prompt 77: PM-07 Project Calendar View

```
Create an HTML/CSS wireframe for a Project Calendar View for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Calendar view of project tasks and milestones with day, week, and month views for scheduling and deadline management.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ Website Redesign › Calendar                  [+ Add Task]   │
│ [Board] [List] [Calendar]        [Day] [Week] [Month]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [◀]     November 2024      [▶]             [Today]         │
│                                                             │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                 │
│ │ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │                 │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                 │
│ │     │     │     │     │     │  1  │  2  │                 │
│ │     │     │     │     │     │     │     │                 │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                 │
│ │  3  │  4  │  5  │  6  │  7  │  8  │  9  │                 │
│ │     │     │     │     │     │     │     │                 │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                 │
│ │ 10  │ 11  │ 12  │ 13  │ 14  │ 15  │ 16  │                 │
│ │     │┌───┐│     │     │     │┌───┐│     │                 │
│ │     ││ ● ││     │     │     ││ ● ││     │                 │
│ │     │└───┘│     │     │     │└───┘│     │                 │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                 │
│ │ 17  │ 18  │ 19  │ 20  │ 21  │ 22  │ 23  │                 │
│ │     │┌───┐│     │┌───┐│     │┌───┐│     │                 │
│ │     ││ ● ││     ││ ◆ ││     ││ ● ││     │                 │
│ │     ││ ● ││     │└───┘│     │└───┘│     │                 │
│ │     │└───┘│     │     │     │     │     │                 │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                 │
│ │ 24  │ 25  │ 26  │ 27  │ 28  │ 29  │ 30  │                 │
│ │     │┌───┐│     │     │     │     │     │                 │
│ │     ││ ● ││     │     │     │     │     │                 │
│ │     │└───┘│     │     │     │     │     │                 │
│ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                 │
│                                                             │
│ ● Task due   ◆ Milestone   ─── Spanning task               │
└─────────────────────────────────────────────────────────────┘

CALENDAR HEADER:
- Month/Year: 24px semibold #1A1A1A, centered
- Navigation arrows: 40px buttons, ghost style
- Today button: ghost button, "Today" text
- View toggle: Day/Week/Month segmented control

VIEW TOGGLE:
- Container: bg #F5F5F5, rounded 8px, padding 4px
- Button: 36px height, rounded 6px
- Active: bg #FFFFFF, shadow-sm, #1A1A1A
- Inactive: transparent, #6B6B6B

WEEKDAY HEADER:
- Background: #FAFAFA
- Text: 12px semibold uppercase #6B6B6B
- Border-bottom: 1px solid #E8E4E0
- Height: 40px

CALENDAR GRID:
- Display: grid, 7 columns
- Cell: min-height 100px
- Border: 1px solid #E8E4E0
- Background: #FFFFFF

DATE CELL:
- Date number: 14px regular #1A1A1A, top-left padding 8px
- Other month dates: opacity 0.4
- Today: date number bg #FF6B6B, color #FFFFFF, circle
- Hover: bg #FAFAFA

TASK ITEMS IN CELL:
- Container: padding 4px
- Task pill: 12px medium, rounded 4px, padding 2px 6px
- Truncate with ellipsis
- Max visible: 3, then "+N more" link
- Color by priority or category

TASK PILL COLORS:
- High priority: bg #FEE2E2, text #991B1B
- Medium priority: bg #FEF3C7, text #92400E
- Low priority: bg #D1FAE5, text #065F46
- Milestone: bg #FFE8E8, text #FF6B6B, diamond icon

MULTI-DAY TASKS:
- Span across cells
- Connected bar appearance
- Start cap on first day, end cap on last
- Text on first visible day only

"+N MORE" POPUP:
- Click to expand all tasks for that day
- Dropdown/popover with full list
- Quick task preview on hover

DAY VIEW:
┌─────────────────────────────────────────────────────────────┐
│ [◀]  Wednesday, November 20, 2024  [▶]                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ALL DAY                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ◆ Design Review Milestone                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌──────┬──────────────────────────────────────────────────┐ │
│ │ 8 AM │                                                  │ │
│ ├──────┼──────────────────────────────────────────────────┤ │
│ │ 9 AM │ ┌─────────────────────────────┐                  │ │
│ │      │ │ Team standup meeting        │                  │ │
│ │      │ └─────────────────────────────┘                  │ │
│ ├──────┼──────────────────────────────────────────────────┤ │
│ │10 AM │                                                  │ │
│ ├──────┼──────────────────────────────────────────────────┤ │
│ │11 AM │ ┌─────────────────────────────┐                  │ │
│ │      │ │ Design Review @ 11:30       │                  │ │
│ │      │ └─────────────────────────────┘                  │ │
│ └──────┴──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

DAY VIEW STRUCTURE:
- Time column: 60px, hourly slots
- Event area: flex-grow
- Hour slot: 60px height
- Half-hour lines: dashed

WEEK VIEW:
- 7 columns for days
- Similar to day view but compressed
- Time on left axis
- Current time indicator line

CREATE TASK (click on empty space):
- Quick create popover
- Pre-filled with clicked date
- Task name, time, duration fields

DRAG AND DROP:
- Drag task to reschedule
- Drag edges to resize duration
- Visual feedback during drag

RESPONSIVE:
- < 768px: Agenda list view
- Stack days vertically
- Full-width task items

Include integration with external calendars (Google, Outlook) indicator.
```

---

## Prompt 78: PM-08 Project Files & Documents

```
Create an HTML/CSS wireframe for Project Files & Documents page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
File management for project documents including upload, organization, version history, and AI-powered document analysis.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ Website Redesign › Files                    [📤 Upload]     │
│ [Overview] [Tasks] [Timeline] [Files] [Team] [Settings]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [🔍 Search files...]        [Type ▾] [Date ▾] [▤ ▦]        │
│                                                             │
│ 24 files • 156 MB used                                      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FOLDERS                                                 │ │
│ │                                                         │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │ │
│ │ │ 📁          │ │ 📁          │ │ 📁          │         │ │
│ │ │ Design      │ │ Documents   │ │ Assets      │         │ │
│ │ │ 12 files    │ │ 5 files     │ │ 7 files     │         │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘         │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ RECENT FILES                                            │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📄 │ final-mockups.fig           │ 12.5 MB │ 2h ago │ │ │
│ │ │    │ Sarah Chen                  │ Figma   │        │ │ │
│ │ ├────┼─────────────────────────────┼─────────┼────────┤ │ │
│ │ │ 📄 │ api-documentation.md        │ 45 KB   │ 1d ago │ │ │
│ │ │    │ Mike Johnson                │ Markdown│        │ │ │
│ │ ├────┼─────────────────────────────┼─────────┼────────┤ │ │
│ │ │ 🖼️ │ hero-image-v3.png          │ 2.1 MB  │ 2d ago │ │ │
│ │ │    │ Jane Doe                    │ Image   │        │ │ │
│ │ ├────┼─────────────────────────────┼─────────┼────────┤ │ │
│ │ │ 📊 │ project-timeline.xlsx       │ 120 KB  │ 3d ago │ │ │
│ │ │    │ Sarah Chen                  │ Excel   │        │ │ │
│ │ ├────┼─────────────────────────────┼─────────┼────────┤ │ │
│ │ │ 📄 │ requirements.pdf            │ 890 KB  │ 1w ago │ │ │
│ │ │    │ Client Upload               │ PDF     │        │ │ │
│ │ └────┴─────────────────────────────┴─────────┴────────┘ │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI DOCUMENT INSIGHTS                                 │ │
│ │                                                         │ │
│ │ • requirements.pdf contains 12 key deliverables -       │ │
│ │   8 are tracked as tasks, 4 may be missing              │ │
│ │ • Design files are 95% consistent with brand guidelines │ │
│ │ • api-documentation.md is outdated (last edit 2 weeks)  │ │
│ │                                                         │ │
│ │ [Review Missing Deliverables]                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

HEADER ACTIONS:
- Upload button: primary style, with dropdown for folder creation
- Upload: triggers file picker or drag-drop modal

VIEW TOGGLE:
- List view (▤): table format
- Grid view (▦): card thumbnails
- Same pattern as projects list

FOLDER CARDS:
- Width: 150px
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 12px
- Padding: 16px
- Text-align: center
- Folder icon: 48px
- Name: 14px medium #1A1A1A
- Count: 12px regular #6B6B6B
- Hover: shadow-md, border-color #FF6B6B

FILE LIST (Table View):
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 12px

FILE ROW:
- Padding: 12px 16px
- Border-bottom: 1px solid #E8E4E0
- Hover: bg #FAFAFA

FILE ICON BY TYPE:
- Document (📄): #3B82F6
- Image (🖼️): #10B981
- Spreadsheet (📊): #10B981
- PDF: #EF4444
- Video (🎬): #8B5CF6
- Archive (📦): #F59E0B
- Size: 32px

FILE ROW CONTENT:
- Icon + Name: flex, gap 12px
- Name: 14px medium #1A1A1A
- Uploader: 12px regular #6B6B6B
- Size: 14px regular #6B6B6B
- Type badge: 12px, pill style
- Date: 14px regular #6B6B6B

ROW ACTIONS (hover):
- Preview, Download, Share, Delete
- Opacity 0 → 1 on hover
- Icon buttons, 32px

GRID VIEW (Alternative):
┌───────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│ │             │ │             │ │             │          │
│ │  ┌──────┐   │ │  [image]    │ │  ┌──────┐   │          │
│ │  │ .fig │   │ │  thumbnail  │ │  │ .pdf │   │          │
│ │  └──────┘   │ │             │ │  └──────┘   │          │
│ │             │ │             │ │             │          │
│ ├─────────────┤ ├─────────────┤ ├─────────────┤          │
│ │mockups.fig  │ │hero-v3.png  │ │specs.pdf    │          │
│ │12.5 MB      │ │2.1 MB       │ │890 KB       │          │
│ └─────────────┘ └─────────────┘ └─────────────┘          │
└───────────────────────────────────────────────────────────┘

GRID CARD:
- Width: 180px
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 12px
- Thumbnail area: 120px height, bg #FAFAFA
- Info area: padding 12px

UPLOAD MODAL:
┌─────────────────────────────────────────────────────────────┐
│ Upload Files                                            [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │                    📤                                   │ │
│ │                                                         │ │
│ │          Drag & drop files here                         │ │
│ │                 or                                      │ │
│ │            [Browse Files]                               │ │
│ │                                                         │ │
│ │     Max file size: 100MB │ Any file type               │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Upload to folder:                                           │
│ [Root / Design                                         ▾]   │
│                                                             │
│ UPLOADING                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ mockups-v4.fig           ████████████░░░░ 75%      [✕] │ │
│ │ brand-assets.zip         ██████░░░░░░░░░░ 35%      [✕] │ │
│ │ readme.md                ✓ Complete                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│                                              [Cancel] [Done]│
└─────────────────────────────────────────────────────────────┘

FILE PREVIEW MODAL:
- Full-screen or large modal
- Preview by type: images, PDFs, markdown render
- Download button
- Version history sidebar
- Comments

VERSION HISTORY:
┌─────────────────────────────────┐
│ VERSION HISTORY                 │
├─────────────────────────────────┤
│ v3 (Current)                    │
│ Sarah Chen • Today              │
│                                 │
│ v2                              │
│ Sarah Chen • 2 days ago         │
│ [Restore]                       │
│                                 │
│ v1                              │
│ Jane Doe • 1 week ago           │
│ [Restore]                       │
└─────────────────────────────────┘

Include drag-drop upload, file type filters, and storage quota indicator.
```

---

## Prompt 79: PM-09 Project Team & Permissions

```
Create an HTML/CSS wireframe for Project Team & Permissions page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Manage project team members, their roles, permissions, and workload visibility.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ Website Redesign › Team                     [+ Add Member]  │
│ [Overview] [Tasks] [Timeline] [Files] [Team] [Settings]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 5 team members │ 36 tasks assigned                          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ TEAM MEMBERS                                            │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 👤          │ Sarah Chen            │ Project Lead  │ │ │
│ │ │             │ sarah@company.com     │ Full Access   │ │ │
│ │ │             │                       │               │ │ │
│ │ │             │ WORKLOAD              │               │ │ │
│ │ │             │ 8 tasks │ ████████░░ 80%             │ │ │
│ │ │             │                       │ [⋮]          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 👤          │ Mike Johnson          │ Developer     │ │ │
│ │ │             │ mike@company.com      │ Can Edit      │ │ │
│ │ │             │                       │               │ │ │
│ │ │             │ WORKLOAD              │               │ │ │
│ │ │             │ 12 tasks │ ████████████ 100% ⚠️       │ │ │
│ │ │             │                       │ [⋮]          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 👤          │ Jane Doe              │ Designer      │ │ │
│ │ │             │ jane@company.com      │ Can Edit      │ │ │
│ │ │             │                       │               │ │ │
│ │ │             │ WORKLOAD              │               │ │ │
│ │ │             │ 6 tasks │ ██████░░░░ 60%              │ │ │
│ │ │             │                       │ [⋮]          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 👤          │ Alex Kim              │ Developer     │ │ │
│ │ │             │ alex@company.com      │ Can Edit      │ │ │
│ │ │             │                       │               │ │ │
│ │ │             │ WORKLOAD              │               │ │ │
│ │ │             │ 4 tasks │ ████░░░░░░ 40%              │ │ │
│ │ │             │                       │ [⋮]          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 👤          │ Client Contact        │ Stakeholder   │ │ │
│ │ │             │ client@acme.com       │ View Only     │ │ │
│ │ │             │                       │               │ │ │
│ │ │             │ Last seen: 2 days ago │               │ │ │
│ │ │             │                       │ [⋮]          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🤖 WORKLOAD INSIGHTS                                    │ │
│ │                                                         │ │
│ │ • Mike Johnson is at capacity - consider redistributing│ │
│ │   2 tasks to Alex Kim who has 40% availability         │ │
│ │ • Sarah Chen's tasks are on track for completion       │ │
│ │                                                         │ │
│ │ [Optimize Workload]                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

TEAM MEMBER CARD:
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 12px
- Padding: 20px
- Margin: 12px 0
- Display: grid (avatar | info | role | actions)

AVATAR:
- Size: 64px circle
- Border: 3px solid #FFFFFF
- Shadow: sm
- Online indicator: 12px green dot, bottom-right

MEMBER INFO:
- Name: 18px semibold #1A1A1A
- Email: 14px regular #6B6B6B
- Workload label: 12px medium #6B6B6B

WORKLOAD BAR:
- Height: 8px
- Background: #E8E4E0
- Border radius: 4px
- Fill colors:
  - 0-50%: #10B981 (green)
  - 51-80%: #F59E0B (amber)
  - 81-100%: #EF4444 (red)
- Warning icon at 100%

ROLE BADGES:
- Project Lead: bg #FFE8E8, text #991B1B
- Developer: bg #DBEAFE, text #1E40AF
- Designer: bg #F3E8FF, text #6B21A8
- Stakeholder: bg #E5E7EB, text #374151

PERMISSION LEVELS:
- Full Access: Can manage project settings, team, delete
- Can Edit: Can create/edit tasks, upload files
- View Only: Read access only
- Displayed as secondary text

ACTIONS MENU (⋮):
- Change Role
- Adjust Permissions
- View Tasks
- Remove from Project

ADD MEMBER MODAL:
┌─────────────────────────────────────────────────────────────┐
│ Add Team Member                                         [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Search team members or invite by email                      │
│ [🔍 Search name or email...                               ] │
│                                                             │
│ TEAM MEMBERS                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☐ 👤 David Lee         │ david@company.com │ Available │ │
│ │ ☐ 👤 Emma Wilson       │ emma@company.com  │ 2 projects│ │
│ │ ☐ 👤 Tom Brown         │ tom@company.com   │ Available │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ OR INVITE BY EMAIL                                          │
│ [email@external.com                                       ] │
│                                                             │
│ ROLE                                                        │
│ [Developer                                             ▾]   │
│                                                             │
│ PERMISSION                                                  │
│ ○ Full Access  ● Can Edit  ○ View Only                     │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [Cancel]                                  [Add to Project]  │
└─────────────────────────────────────────────────────────────┘

PERMISSIONS DETAIL MODAL:
┌─────────────────────────────────────────────────────────────┐
│ Permissions: Mike Johnson                               [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Permission Level: [Can Edit                            ▾]   │
│                                                             │
│ SPECIFIC PERMISSIONS                                        │
│                                                             │
│ Tasks                                                       │
│ ☑ Create tasks                                              │
│ ☑ Edit own tasks                                            │
│ ☑ Edit all tasks                                            │
│ ☐ Delete tasks                                              │
│                                                             │
│ Files                                                       │
│ ☑ Upload files                                              │
│ ☑ Download files                                            │
│ ☐ Delete files                                              │
│                                                             │
│ Team                                                        │
│ ☐ Manage team members                                       │
│ ☐ Change permissions                                        │
│                                                             │
│ Project                                                     │
│ ☐ Edit project settings                                     │
│ ☐ Archive/Delete project                                    │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [Cancel]                                 [Save Permissions] │
└─────────────────────────────────────────────────────────────┘

AI WORKLOAD OPTIMIZATION:
- Suggestion cards
- One-click task redistribution
- Before/after workload preview

Include role presets, bulk permission changes, and activity log per member.
```

---

## Prompt 80: PM-10 Project Settings

```
Create an HTML/CSS wireframe for Project Settings page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Configure project-level settings including general info, statuses, integrations, notifications, and danger zone actions.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ Website Redesign › Settings                                 │
│ [Overview] [Tasks] [Timeline] [Files] [Team] [Settings]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│ │                 │ │                                     │ │
│ │ General         │ │ GENERAL SETTINGS                    │ │
│ │ Statuses        │ │                                     │ │
│ │ Integrations    │ │ Project Name                        │ │
│ │ Notifications   │ │ [Website Redesign                 ] │ │
│ │ Automation      │ │                                     │ │
│ │ Danger Zone     │ │ Project Key                         │ │
│ │                 │ │ [WEB] (used in task IDs: WEB-123)   │ │
│ │                 │ │                                     │ │
│ │                 │ │ Description                         │ │
│ │                 │ │ ┌─────────────────────────────────┐ │ │
│ │                 │ │ │ Complete redesign of the Acme   │ │ │
│ │                 │ │ │ Corporation website including   │ │ │
│ │                 │ │ │ new branding and features.      │ │ │
│ │                 │ │ └─────────────────────────────────┘ │ │
│ │                 │ │                                     │ │
│ │                 │ │ Client                              │ │
│ │                 │ │ [🔍 Acme Corporation            ▾]  │ │
│ │                 │ │                                     │ │
│ │                 │ │ Project Color                       │ │
│ │                 │ │ [🔴][🟠][🟡][🟢][🔵][🟣][⚪][⚫]     │ │
│ │                 │ │                                     │ │
│ │                 │ │ Project Icon                        │ │
│ │                 │ │ [📁][🎨][💻][🚀][📊][⚡] [Upload]   │ │
│ │                 │ │                                     │ │
│ │                 │ │ Dates                               │ │
│ │                 │ │ Start: [Nov 1, 2024    📅]          │ │
│ │                 │ │ Due:   [Dec 15, 2024   📅]          │ │
│ │                 │ │                                     │ │
│ │                 │ │ Budget (Optional)                   │ │
│ │                 │ │ [$] [25,000        ]                │ │
│ │                 │ │                                     │ │
│ │                 │ │ ─────────────────────────────────── │ │
│ │                 │ │                       [Save Changes]│ │
│ │                 │ │                                     │ │
│ └─────────────────┘ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

SIDEBAR NAVIGATION:
- Width: 200px
- Background: #FAFAFA
- Border-right: 1px solid #E8E4E0
- Item: padding 12px 16px, 14px medium
- Default: #6B6B6B
- Active: bg #FFFFFF, #1A1A1A, border-left 3px #FF6B6B
- Danger Zone: #EF4444 text

MAIN CONTENT:
- Padding: 32px
- Max-width: 600px

SECTION HEADER:
- Title: 20px semibold #1A1A1A
- Description: 14px regular #6B6B6B (optional)
- Margin-bottom: 24px

FORM FIELDS:
- Label: 14px medium #1A1A1A, margin-bottom 6px
- Input: height 44px, padding 12px, border 1px #E8E4E0, rounded 8px
- Focus: border-color #FF6B6B, shadow 0 0 0 3px rgba(255,107,107,0.1)
- Helper text: 12px regular #6B6B6B, margin-top 4px

TEXTAREA:
- Min-height: 100px
- Resize: vertical

COLOR PICKER:
- Grid of color circles
- Size: 32px each
- Selected: ring 2px #1A1A1A
- Custom color option

ICON PICKER:
- Grid of icon options
- Size: 40px each
- Selected: bg #FFF5F5, border #FF6B6B
- Upload custom option

STATUSES SECTION:
┌─────────────────────────────────────────────────────────────┐
│ TASK STATUSES                                               │
│                                                             │
│ Customize the statuses available for tasks in this project. │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ≡  ○ To Do                                    [✏️][🗑️] │ │
│ │ ≡  🔵 In Progress                             [✏️][🗑️] │ │
│ │ ≡  🟡 In Review                               [✏️][🗑️] │ │
│ │ ≡  🟢 Done (Final)                            [✏️]      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [+ Add Status]                                              │
│                                                             │
│ Default status for new tasks: [To Do                   ▾]   │
└─────────────────────────────────────────────────────────────┘

INTEGRATIONS SECTION:
┌─────────────────────────────────────────────────────────────┐
│ INTEGRATIONS                                                │
│                                                             │
│ Connect external tools to this project.                     │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔗 GitHub                                  [Connected]  │ │
│ │    Repository: acme/website-redesign                    │ │
│ │    Sync: Commits → Activity, PRs → Tasks                │ │
│ │                                      [Configure][Remove]│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📹 Zoom                                    [Connected]  │ │
│ │    Meeting links auto-added to calendar events          │ │
│ │                                      [Configure][Remove]│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 💬 Slack                                  [Not Connected]│
│ │    Get project notifications in Slack                   │ │
│ │                                             [Connect]   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📊 Google Drive                           [Not Connected]│
│ │    Sync files from Google Drive folder                  │ │
│ │                                             [Connect]   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

NOTIFICATIONS SECTION:
┌─────────────────────────────────────────────────────────────┐
│ NOTIFICATIONS                                               │
│                                                             │
│ Configure when project members receive notifications.       │
│                                                             │
│ Task assigned to me                    [Email ▾] [Push ▾]   │
│ Task I'm watching updated              [Email ▾] [Push ▾]   │
│ Comment on my task                     [Email ▾] [Push ▾]   │
│ Mention in comment                     [Email ▾] [Push ▾]   │
│ Milestone approaching                  [Email ▾] [Push ▾]   │
│ Daily project summary                  [Email ▾] [Off  ▾]   │
│                                                             │
│                                            [Save Preferences]
└─────────────────────────────────────────────────────────────┘

AUTOMATION SECTION:
┌─────────────────────────────────────────────────────────────┐
│ AUTOMATION RULES                                            │
│                                                             │
│ Automate repetitive actions in this project.                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ When task moved to "Done"                      [Active] │ │
│ │ → Notify task creator                                   │ │
│ │ → Log completion time                                   │ │
│ │                                           [Edit][Delete]│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ When task is overdue                           [Active] │ │
│ │ → Notify assignee                                       │ │
│ │ → Add "overdue" tag                                     │ │
│ │                                           [Edit][Delete]│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [+ Add Automation]                                          │
└─────────────────────────────────────────────────────────────┘

DANGER ZONE:
┌─────────────────────────────────────────────────────────────┐
│ DANGER ZONE                                                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Archive Project                                         │ │
│ │ Hide this project from active views. Can be restored.   │ │
│ │                                       [Archive Project] │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Transfer Ownership                                      │ │
│ │ Transfer this project to another team member.           │ │
│ │                                            [Transfer]   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Delete Project                              ⚠️ Permanent│ │
│ │ Permanently delete this project and all its data.       │ │
│ │ This action cannot be undone.                           │ │
│ │                                       [Delete Project]  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

DANGER ZONE STYLING:
- Border: 1px solid #FEE2E2
- Background: #FFF5F5
- Delete button: bg #EF4444, text #FFFFFF

Include confirmation modals for destructive actions and unsaved changes warning.
```

---

## Summary: Batch 8 Complete

**Prompts 71-80 created covering:**
- PM-01: Projects List View
- PM-02: Project Detail Overview
- PM-03: Task Board (Kanban)
- PM-04: Task List View
- PM-05: Task Detail Modal
- PM-06: Timeline/Gantt View
- PM-07: Project Calendar View
- PM-08: Project Files & Documents
- PM-09: Project Team & Permissions
- PM-10: Project Settings

**Progress: 80/90+ prompts complete (8 batches done)**

Ready for **Batch 9: PM Module Part 2 (10 prompts)**?
