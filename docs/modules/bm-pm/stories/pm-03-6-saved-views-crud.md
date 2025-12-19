# PM-03-6: Saved Views CRUD

**Epic:** PM-03 - Views & Navigation
**Status:** Done
**Points:** 5
**Priority:** Medium

## Overview

Enable users to save their current filter, sort, and view mode configurations as named views. Users can manage multiple saved views per project, set a default view, and optionally share views with their team.

## User Story

As a project member, I want to save my filter/sort/view combinations as named views so that I can quickly switch between different task perspectives without reconfiguring filters each time.

## Acceptance Criteria

### 1. Save Current View
- [ ] "Save View" button appears in the toolbar when filters/sorting are applied
- [ ] Clicking "Save View" opens a modal prompting for:
  - View name (required)
  - Set as default (checkbox)
  - Share with team (checkbox)
- [ ] Saved view captures:
  - View mode (list/table/kanban/calendar)
  - Active filters (status, type, priority, search)
  - Sort configuration (if applicable)
  - Kanban grouping preference (if in kanban mode)
- [ ] Success toast notification on save

### 2. View Dropdown
- [ ] Dropdown in toolbar shows all saved views for current project
- [ ] Default view is indicated with a star icon
- [ ] Selecting a view applies all its saved settings
- [ ] "All Tasks" option to clear all filters

### 3. Manage Saved Views
- [ ] Each saved view has an edit/delete menu (three dots)
- [ ] Edit opens the same modal with pre-filled values
- [ ] Delete shows confirmation dialog
- [ ] Can set/unset any view as default
- [ ] Can toggle share status

### 4. Shared Views
- [ ] Shared views visible to all project team members
- [ ] Badge indicates shared vs. personal views
- [ ] Only creator can edit/delete their own views
- [ ] Admins can manage all shared views

### 5. Default View Behavior
- [ ] Default view automatically loads when opening project tasks
- [ ] Only one view can be default per user per project
- [ ] Setting a new default unsets the previous one

## Technical Implementation

### Database Model (Already Exists)

```prisma
model SavedView {
  id        String   @id @default(cuid())
  projectId String   @map("project_id")
  userId    String   @map("user_id")

  name      String
  viewType  ViewType @default(LIST) @map("view_type")
  filters   Json     @default("{}")
  sortBy    String?  @map("sort_by")
  sortOrder String?  @map("sort_order")
  columns   Json?    // For list view column config
  isDefault Boolean  @default(false) @map("is_default")
  isShared  Boolean  @default(false) @map("is_shared")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  project Project @relation(...)

  @@index([projectId])
  @@index([userId])
  @@map("saved_views")
}
```

### API Endpoints

**Base:** `/api/pm/projects/:projectId/saved-views`

```typescript
// GET /api/pm/projects/:projectId/saved-views
// List all saved views for project (personal + shared)
interface ListSavedViewsResponse {
  data: SavedView[]
}

// POST /api/pm/projects/:projectId/saved-views
// Create new saved view
interface CreateSavedViewRequest {
  name: string
  viewType: 'LIST' | 'KANBAN' | 'CALENDAR' | 'TABLE'
  filters: {
    status?: TaskStatus[]
    type?: TaskType[]
    priority?: TaskPriority[]
    search?: string
    assigneeId?: string[]
    // etc.
  }
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  columns?: string[] // For table view
  isDefault?: boolean
  isShared?: boolean
}

// PATCH /api/pm/projects/:projectId/saved-views/:viewId
// Update saved view
interface UpdateSavedViewRequest {
  name?: string
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: string
  isDefault?: boolean
  isShared?: boolean
}

// DELETE /api/pm/projects/:projectId/saved-views/:viewId
// Delete saved view
```

### Frontend Components

**File Structure:**
```
apps/web/src/
├── components/pm/saved-views/
│   ├── SaveViewModal.tsx        # Create/edit modal
│   ├── SavedViewsDropdown.tsx   # View selector dropdown
│   └── SavedViewActions.tsx     # Edit/delete menu
├── hooks/
│   └── use-saved-views.ts       # API hooks
```

**Component Specs:**

1. **SaveViewModal**
   - Dialog with form fields
   - Name input (required)
   - Default checkbox
   - Share checkbox
   - Cancel/Save buttons
   - Validation: name required, max 50 chars

2. **SavedViewsDropdown**
   - Dropdown menu component
   - List of saved views grouped by type (personal/shared)
   - Default view marked with star
   - "All Tasks" reset option
   - "Save Current View" action

3. **SavedViewActions**
   - Three-dot menu per view
   - Edit option (opens SaveViewModal)
   - Set/Unset as Default
   - Toggle Share
   - Delete (with confirmation)

### Integration Points

**ProjectTasksContent.tsx:**
- Add SavedViewsDropdown to toolbar
- Load default view on mount
- Apply view filters when view selected
- Update "Save View" button visibility based on active filters

### State Management

```typescript
// Current filter state
interface FilterState {
  search: string
  status: TaskStatus | 'all'
  type: TaskType | 'all'
  priority: TaskPriority | 'all'
  assigneeId?: string
}

// Active saved view
const [activeSavedView, setActiveSavedView] = useState<SavedView | null>(null)

// Apply saved view
function applySavedView(view: SavedView) {
  setViewMode(view.viewType)
  setSearch(view.filters.search || '')
  setStatus(view.filters.status || 'all')
  setType(view.filters.type || 'all')
  setPriority(view.filters.priority || 'all')
  // etc.
}
```

## UI/UX Notes

### Toolbar Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Tasks                                        [Saved Views ▼] │
│ Project Name • 42 tasks                      [Save View]     │
│                                               [Simple][Table] │
│                                               [Kanban][Cal]   │
└─────────────────────────────────────────────────────────────┘
```

### Saved Views Dropdown
```
┌─────────────────────────────┐
│ My Views                    │
│  ⭐ Active Tasks             │
│     Blocked Items            │
│                             │
│ Shared Views                │
│     Sprint Planning          │
│     QA Review Queue          │
│                             │
│ ─────────────────────────   │
│ All Tasks (Reset)           │
│ + Save Current View         │
└─────────────────────────────┘
```

## Testing Checklist

### Unit Tests
- [ ] SavedViews API endpoints
- [ ] Hook functions (create, update, delete)
- [ ] Filter serialization/deserialization

### Integration Tests
- [ ] Create saved view
- [ ] Apply saved view restores filters
- [ ] Set default view
- [ ] Delete view
- [ ] Share view with team

### E2E Tests
- [ ] Full workflow: filter → save → apply → edit → delete
- [ ] Default view loads on project open
- [ ] Shared views visible to team members

## Dependencies

- PM-03-1: Task List View (filters exist)
- PM-03-2: Kanban Board (view modes exist)
- PM-03-5: View Toggle Persistence (localStorage baseline)

## Related Stories

- PM-03-7: Advanced Filters (will extend filter schema)
- PM-09-5: View Sharing (will add permissions layer)

## Definition of Done

- [ ] API endpoints implemented and tested
- [ ] Frontend components created
- [ ] Integration with ProjectTasksContent complete
- [ ] Save/apply/edit/delete flows working
- [ ] Default view behavior working
- [ ] Shared views visible to team
- [ ] TypeScript type safety maintained
- [ ] No console errors
- [ ] Story marked as done in sprint-status.yaml

## Notes

- This story provides the foundation for advanced view management
- Future enhancements: view templates, cross-project views, AI-suggested views
- Consider rate limiting on view creation (max 20 per user per project)
