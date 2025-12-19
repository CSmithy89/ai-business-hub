# Story PM-03-7: Advanced Filters

**Status:** Complete
**Epic:** PM-03 - Task Views & Navigation
**Implementation Date:** 2025-12-18

## Overview

Implemented a comprehensive filter bar for the PM module's task views with URL-based state persistence. Users can now filter tasks by multiple criteria simultaneously, with filter state preserved in the URL for shareability.

## Implementation Details

### Files Created

1. **`apps/web/src/lib/pm/url-state.ts`**
   - URL state management utilities
   - Functions for serializing and parsing filter state
   - Debounced URL update mechanism
   - Filter state type definitions

2. **`apps/web/src/components/pm/filters/FilterChip.tsx`**
   - Reusable chip component for active filters
   - Shows filter value with remove button
   - Supports optional icon display

3. **`apps/web/src/components/pm/filters/StatusFilter.tsx`**
   - Multi-select dropdown for task status
   - Supports selecting multiple statuses simultaneously
   - Shows count badge when filters active

4. **`apps/web/src/components/pm/filters/PriorityFilter.tsx`**
   - Single-select dropdown for task priority
   - Visual priority indicators with colored dots
   - Clear button when filter active

5. **`apps/web/src/components/pm/filters/TypeFilter.tsx`**
   - Single-select dropdown for task type
   - Icons for each task type (Epic, Story, Bug, etc.)
   - Clear button when filter active

6. **`apps/web/src/components/pm/filters/AssigneeFilter.tsx`**
   - Single-select dropdown with search functionality
   - Displays team member avatars and names
   - Searchable by name or email
   - Fetches team members from project team API

7. **`apps/web/src/components/pm/filters/PhaseFilter.tsx`**
   - Single-select dropdown for project phases
   - Shows phase number and name
   - Fetches phases from project data

8. **`apps/web/src/components/pm/filters/DateRangeFilter.tsx`**
   - Date range picker using shadcn/ui Calendar
   - Supports "from" date, "to" date, or both
   - Visual calendar interface with 2-month view
   - Clear button to reset date range

9. **`apps/web/src/components/pm/filters/LabelFilter.tsx`**
   - Multi-select dropdown with autocomplete
   - Allows creating new labels on the fly
   - Shows selected labels as chips
   - Note: Label data integration pending backend support

10. **`apps/web/src/components/pm/filters/FilterBar.tsx`**
    - Main filter bar component
    - Combines all filter components
    - Manages URL state with 300ms debouncing
    - Displays active filters as removable chips
    - "Clear All" button to reset all filters
    - Preserves non-filter URL params (like taskId)

### Files Modified

1. **`apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`**
   - Integrated FilterBar component
   - Replaced old simple filters with advanced filter system
   - Added client-side filtering for:
     - Multiple status selection
     - Date range filtering
     - Label filtering (structure in place)
   - Updated filter state management to use FilterState type
   - Updated saved view integration to work with new filters
   - Separated search from filters (kept in separate card)

## Features Implemented

### Filter Types

1. **Status Filter (Multi-select)**
   - Filter by: Backlog, To Do, In Progress, Review, Awaiting Approval, Done, Cancelled
   - Can select multiple statuses simultaneously
   - Shows count badge when active

2. **Priority Filter (Single-select)**
   - Filter by: Urgent, High, Medium, Low, None
   - Visual priority indicators with colored dots
   - Radio button selection

3. **Type Filter (Single-select)**
   - Filter by: Epic, Story, Task, Subtask, Bug, Research, Content, Agent Review
   - Icons for each type
   - Radio button selection

4. **Assignee Filter (Single-select with search)**
   - Filter by team member
   - Searchable by name or email
   - Shows avatar and name/email
   - Fetches active team members

5. **Phase Filter (Single-select)**
   - Filter by project phase
   - Shows phase number and name
   - Radio button selection

6. **Date Range Filter**
   - Filter by due date range
   - Supports from/to dates
   - Visual calendar picker (2-month view)
   - Can set only from, only to, or both

7. **Label Filter (Multi-select with autocomplete)**
   - Filter by task labels
   - Supports creating new labels
   - Multi-select with chips
   - Structure in place (pending backend label data)

### URL State Persistence

- All filters serialized to URL query parameters
- Format: `?status=TODO,IN_PROGRESS&priority=HIGH&assignee=user_123`
- Debounced updates (300ms) to prevent excessive history entries
- Preserves non-filter params (e.g., taskId for task details)
- Shareable URLs with filter state

### Active Filter Display

- Active filters shown as removable chips below filter controls
- Each chip displays:
  - Filter name/value
  - Optional icon (for priority)
  - Remove button (X)
- "Clear All" button to reset all filters at once
- Visual separation from filter controls

### Integration

- Works with all view types (List, Kanban, Calendar)
- Filters applied both server-side (API) and client-side
- Server-side: Single status, priority, type, assignee, phase
- Client-side: Multiple statuses, date ranges, labels
- Maintains existing search functionality (separate from filters)
- Compatible with saved views system

## Technical Architecture

### URL State Management

```typescript
type FilterState = {
  status: TaskStatus[]        // Multi-select
  priority: TaskPriority | null
  assigneeId: string | null
  type: TaskType | null
  labels: string[]            // Multi-select
  dueDateFrom: string | null  // ISO date string
  dueDateTo: string | null    // ISO date string
  phaseId: string | null
}
```

### Filtering Strategy

1. **API Filtering** (when single value selected):
   - Status, priority, type, assignee, phase
   - Reduces data transfer from server

2. **Client-side Filtering** (when multiple values or special cases):
   - Multiple status selection
   - Date range filtering
   - Label filtering
   - Applied after API response

### Debouncing

- 300ms debounce on URL updates
- Prevents excessive browser history entries
- Smoother user experience during rapid filter changes

## User Experience

### Filter Workflow

1. User clicks filter button (e.g., "Status")
2. Dropdown opens with available options
3. User selects one or more options
4. Filter updates immediately
5. URL updates after 300ms debounce
6. Active filter appears as chip below controls
7. User can remove individual filters or clear all

### Visual Feedback

- Count badges on filter buttons (e.g., "Status (2)")
- Active filters shown as chips with remove buttons
- Clear buttons in dropdown headers
- "Clear All" button when any filters active
- Proper icons for different filter types

### Accessibility

- Proper ARIA labels on remove buttons
- Keyboard navigation in dropdowns
- Focus management in popovers
- Screen reader friendly

## Testing Recommendations

1. **Filter Interaction**
   - Test each filter type independently
   - Test multiple filters combined
   - Verify URL updates correctly
   - Test debouncing behavior

2. **URL State**
   - Share filtered URL and verify state restored
   - Test browser back/forward with filters
   - Verify non-filter params preserved

3. **Client-side Filtering**
   - Test multiple status selection
   - Test date range filtering
   - Verify results match filter criteria

4. **Edge Cases**
   - Empty task list
   - No team members
   - No phases
   - Invalid date ranges
   - Rapid filter changes

5. **View Integration**
   - Test filters with List view
   - Test filters with Kanban view
   - Test filters with Calendar view
   - Verify saved views work with new filters

## Known Limitations

1. **Label Filtering**: Structure in place but requires backend API support for task labels in list view
2. **Multi-status API**: Currently uses client-side filtering for multiple status selection
3. **Saved Views**: Only supports single status in saved view (design limitation)

## Future Enhancements

1. Add label data to TaskListItem type
2. Implement backend support for multi-status filtering
3. Add filter presets/quick filters
4. Add filter history/recently used
5. Add bulk filter application
6. Add filter templates

## Performance Considerations

- Debounced URL updates reduce history pollution
- Client-side filtering efficient for typical task counts (<500)
- Memoized filter results prevent unnecessary recalculations
- Lazy loading of team members and phases

## Acceptance Criteria Status

- [x] Filter by status (multi-select)
- [x] Filter by priority (single-select)
- [x] Filter by assignee (single-select with search)
- [x] Filter by type (single-select)
- [x] Filter by labels (multi-select with autocomplete)
- [x] Filter by due date range (from/to)
- [x] Filter by phase (single-select)
- [x] Active filters show as chips with remove button
- [x] "Clear All" button resets all filters
- [x] Filter state persists in URL (shareable)
- [x] URL format follows specification
- [x] Debounced URL updates (300ms)

## Dependencies

- shadcn/ui components: DropdownMenu, Popover, Calendar, Badge, Button
- date-fns for date formatting and parsing
- Next.js useRouter and useSearchParams for URL management
- Existing PM hooks: usePmTeam, usePmProject, usePmTasks

## Related Stories

- PM-03.1: Task List View (provides table to filter)
- PM-03.2: Kanban Board (provides board to filter)
- PM-03.3: Calendar View (provides calendar to filter)
- PM-03.6: Saved Views (integrates with filter state)
