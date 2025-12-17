# Epic PM-03: Views & Navigation

**Goal:** Users can visualize work in list, kanban, and calendar formats with powerful filtering and saved views.

**FRs Covered:** FR-4.1-4.3, FR-4.5

## Wireframe References

| Story | Wireframe | Assets |
|-------|-----------|--------|
| PM-03.1: List View | PM-04 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-04_task_list_view/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-04_task_list_view/screen.png) |
| PM-03.2: Kanban Board | PM-03 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-03_task_board_(kanban_view)_/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-03_task_board_(kanban_view)_/screen.png) |
| PM-03.4: Calendar View | PM-07 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-07_project_calendar_view/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-07_project_calendar_view/screen.png) |
| PM-03.6: Saved Views | PM-26 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-26_saved_views_manager/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-26_saved_views_manager/screen.png) |
| PM-03.8: Command Bar | PM-17 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-17_global_search/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-17_global_search/screen.png) |

---

### Story PM-03.1: List View

**As a** project user,
**I want** to see tasks in a sortable table,
**So that** I can scan and manage many tasks efficiently.

**Acceptance Criteria:**

**Given** I am on project Tasks tab with List view selected
**When** the view loads
**Then** I see table with columns: checkbox, task number, title, status, priority, assignee, due date

**And** column headers are clickable for sorting

**And** bulk select via checkboxes enables bulk actions bar

**And** pagination at 50 rows with "Load More"

**And** column visibility toggle in view settings

**Prerequisites:** PM-02.1

**Technical Notes:**
- Use TanStack Table
- Virtualization for performance

---

### Story PM-03.2: Kanban Board

**As a** project user,
**I want** to see tasks in a kanban board,
**So that** I can visualize workflow and drag tasks between states.

**Acceptance Criteria:**

**Given** I select Kanban view
**When** the board loads
**Then** I see columns for each status (Backlog, Todo, In Progress, Review, Done)

**And** tasks appear as cards with: type icon, title, priority badge, assignee avatar

**And** agent-assigned tasks show AI badge

**And** drag-drop moves task between columns (updates status)

**And** card count per column in header

**Prerequisites:** PM-02.8

**Technical Notes:**
- Use @dnd-kit for drag-drop
- Optimistic updates with rollback on error

---

### Story PM-03.3: Kanban Grouping Options

**As a** project user,
**I want** to group kanban by different criteria,
**So that** I can see work from different perspectives.

**Acceptance Criteria:**

**Given** I am on Kanban view
**When** I click "Group By" dropdown
**Then** options are: Status (default), Priority, Assignee, Type, Phase

**And** selecting option re-renders board with new columns

**And** "Unassigned" column for null values

**And** WIP limits can be set per column (visual warning when exceeded)

**Prerequisites:** PM-03.2

**Technical Notes:**
- Store grouping preference in saved view

---

### Story PM-03.4: Calendar View

**As a** project user,
**I want** to see tasks on a calendar,
**So that** I can manage deadlines visually.

**Acceptance Criteria:**

**Given** I select Calendar view
**When** the view loads
**Then** I see month calendar with tasks on due dates

**And** tasks show as colored bars (by priority)

**And** click task opens detail panel

**And** drag task to new date updates dueDate

**And** week and day views available

**Prerequisites:** PM-02.1

**Technical Notes:**
- Use FullCalendar or custom implementation
- Filter by assignee

---

### Story PM-03.5: Filter Bar

**As a** project user,
**I want** to filter tasks by multiple criteria,
**So that** I can focus on relevant work.

**Acceptance Criteria:**

**Given** I am on any task view
**When** I interact with filter bar
**Then** I can filter by: status (multi-select), priority, assignee, type, labels, due date range, phase

**And** active filters show as chips

**And** "Clear All" resets filters

**And** filter state persists in URL (shareable)

**Prerequisites:** PM-03.1

**Technical Notes:**
- URL params: ?status=TODO,IN_PROGRESS&assignee=user_123

---

### Story PM-03.6: Saved Views

**As a** project user,
**I want** to save filter/sort combinations,
**So that** I can quickly access common views.

**Acceptance Criteria:**

**Given** I have filters applied
**When** I click "Save View"
**Then** modal prompts for view name

**And** I can mark as default view

**And** saved views appear in view dropdown

**And** I can share view (makes public to team)

**And** edit/delete saved views

**Prerequisites:** PM-03.5

**Technical Notes:**
- SavedView model stores filters, sort, columns as JSON

---

### Story PM-03.7: View Switcher

**As a** project user,
**I want** to switch between view types easily,
**So that** I can use the best visualization for my current task.

**Acceptance Criteria:**

**Given** I am on Tasks tab
**When** I use view switcher
**Then** toggle buttons for: List, Kanban, Calendar

**And** view preference persists per user per project

**And** filters persist across view switches

**Prerequisites:** PM-03.1, PM-03.2, PM-03.4

**Technical Notes:**
- Store preference in localStorage and user settings

---

### Story PM-03.8: Search & Command Bar

**As a** project user,
**I want** to search tasks and navigate quickly,
**So that** I can find anything fast.

**Acceptance Criteria:**

**Given** I press `Cmd/Ctrl + K`
**When** command bar opens
**Then** I can: search tasks by title/number, navigate to pages, run quick actions (create task, switch view)

**And** recent items shown by default

**And** results update as I type (debounced)

**Prerequisites:** PM-02.1

**Technical Notes:**
- Extend existing CommandBar component
- Index tasks for fast search

---
