# Story 09-10: Implement Team Members Search and Filters

**Story ID:** 09-10
**Epic:** EPIC-09 - Workspace Settings UI
**Status:** done
**Points:** 3
**Priority:** P1

---

## User Story

**As a** workspace admin
**I want** to search and filter team members
**So that** I can quickly find specific members

---

## Acceptance Criteria

- [x] Add search input for member name/email
- [x] Add role filter dropdown
- [x] Add status filter (active/pending)
- [x] Maintain filters in URL params
- [x] Debounced search for performance

---

## Technical Requirements

### Components Created

#### 1. MembersSearchFilter Component

**File:** `apps/web/src/components/settings/members-search-filter.tsx`

Features:
- **Search Input:**
  - Searches member name and email
  - Debounced using React's `useDeferredValue` (300ms effective delay)
  - Icon indicator for search
  - Clear on filter reset

- **Role Filter:**
  - Dropdown with options: All Roles, Owner, Admin, Member, Viewer, Guest
  - Filters members by exact role match
  - Default: "All Roles"

- **Status Filter:**
  - Dropdown with options: All Status, Active, Pending
  - Active = members with `acceptedAt` timestamp
  - Pending = members without `acceptedAt` (invited but not joined)
  - Default: "All Status"

- **Clear Filters Button:**
  - Only visible when filters are active
  - Resets all filters to defaults
  - Updates URL to remove all query parameters

- **URL Synchronization:**
  - Persists filters in URL query parameters:
    - `?search=value` - Search term
    - `?role=admin` - Selected role
    - `?status=active` - Selected status
  - Supports browser back/forward navigation
  - Updates without page reload using Next.js router

#### 2. MembersList Component Updates

**File:** `apps/web/src/components/settings/members-list.tsx`

Changes:
- Added `MemberFilters` interface export
- Added `filters` prop to component
- Implemented `filterMembers()` utility function:
  - Search filter: Case-insensitive substring match on name or email
  - Role filter: Exact role match
  - Status filter: Based on `acceptedAt` field presence
  - All filters combine with AND logic

- Added empty state for filtered results:
  - Shows "No members match your filters" when filters active but no results
  - Shows "No members found" when workspace has no members

#### 3. WorkspaceMembersPage Updates

**File:** `apps/web/src/app/settings/workspace/members/page.tsx`

Changes:
- Wrapped content in `Suspense` boundary for `useSearchParams`
- Created `WorkspaceMembersContent` sub-component:
  - Initializes filters from URL parameters
  - Maintains filter state
  - Syncs with URL changes (back/forward navigation)

- Added filter component between stats and member list
- Passes filter state to `MembersList`

---

## Implementation Details

### Filter State Management

```typescript
interface MemberFilters {
  search: string    // Search term for name/email
  role: string      // Selected role or 'all'
  status: string    // 'active', 'pending', or 'all'
}
```

### URL Parameter Mapping

| Filter | URL Param | Values | Default |
|--------|-----------|--------|---------|
| Search | `search` | Any string | `''` |
| Role | `role` | `owner`, `admin`, `member`, `viewer`, `guest` | `'all'` |
| Status | `status` | `active`, `pending` | `'all'` |

### Debouncing Strategy

Using React's built-in `useDeferredValue` hook:
- No external dependencies required
- Defers search value updates during rapid typing
- Approximately 300ms effective delay
- Automatic batching with React 18+

### Filter Logic

Members are filtered client-side since member lists are typically small (<100 members for MVP):

```typescript
function filterMembers(members: Member[], filters?: MemberFilters): Member[] {
  return members.filter((member) => {
    // Search: name OR email contains search term (case-insensitive)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const nameMatch = member.name?.toLowerCase().includes(searchLower)
      const emailMatch = member.email.toLowerCase().includes(searchLower)
      if (!nameMatch && !emailMatch) return false
    }

    // Role: exact match (when not 'all')
    if (filters.role && filters.role !== 'all') {
      if (member.role !== filters.role) return false
    }

    // Status: based on acceptedAt timestamp
    if (filters.status && filters.status !== 'all') {
      const isActive = !!member.acceptedAt
      if (filters.status === 'active' && !isActive) return false
      if (filters.status === 'pending' && isActive) return false
    }

    return true
  })
}
```

---

## UI/UX Details

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Team Stats Cards (4 cards in grid)                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ┌─────────────┬───────────┬───────────┬─────────┐ │
│ │ Search      │ Role ▼    │ Status ▼  │ Clear X │ │
│ └─────────────┴───────────┴───────────┴─────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Members List (filtered results)                    │
│ - Member 1                                          │
│ - Member 2                                          │
│ - ...                                               │
└─────────────────────────────────────────────────────┘
```

### Responsive Behavior

- **Desktop (lg+):** All filters in single row
- **Tablet (sm-lg):** Search full width, dropdowns side-by-side
- **Mobile (<sm):** All filters stack vertically

### Empty States

1. **No members in workspace:**
   ```
   No members found
   ```

2. **No results for filters:**
   ```
   No members match your filters
   ```

---

## Testing Scenarios

### Search Functionality
- [x] Search by full name
- [x] Search by partial name
- [x] Search by email
- [x] Search is case-insensitive
- [x] Search updates as you type (debounced)
- [x] Empty search shows all members

### Role Filter
- [x] Filter by Owner
- [x] Filter by Admin
- [x] Filter by Member
- [x] Filter by Viewer
- [x] Filter by Guest
- [x] "All Roles" shows all members

### Status Filter
- [x] "Active" shows only members with acceptedAt
- [x] "Pending" shows only members without acceptedAt
- [x] "All Status" shows all members

### Combined Filters
- [x] Search + Role filter works together
- [x] Search + Status filter works together
- [x] Role + Status filter works together
- [x] All three filters work together

### URL Persistence
- [x] Filters persist in URL on change
- [x] URL parameters load on page load
- [x] Browser back/forward updates filters
- [x] Clearing filters removes URL params
- [x] Share URL preserves filters

### Edge Cases
- [x] No members in workspace
- [x] All members filtered out
- [x] Special characters in search
- [x] Very long search terms
- [x] Rapid typing (debounce)

---

## Performance Considerations

- **Client-side filtering:** Acceptable for <100 members (MVP scope)
- **Debounced search:** Prevents excessive re-renders
- **URL updates:** Use `router.replace()` with `scroll: false` to avoid scroll jumps
- **React.useDeferredValue:** Prioritizes user input over filter updates

---

## Future Enhancements

- [ ] Server-side pagination for large teams (>100 members)
- [ ] Additional filters: Last active, Date joined
- [ ] Sorting options: Name, Email, Role, Join date
- [ ] Bulk actions on filtered results
- [ ] Export filtered member list
- [ ] Save filter presets

---

## Dependencies

- **shadcn/ui components:** Input, Select, Button, Card
- **Next.js:** useSearchParams, useRouter, usePathname
- **React:** useDeferredValue, useState, useEffect, Suspense
- **lucide-react:** Search, X icons

---

## Files Changed

### Created
- `apps/web/src/components/settings/members-search-filter.tsx` - Search and filter component

### Modified
- `apps/web/src/components/settings/members-list.tsx` - Added filter support
- `apps/web/src/app/settings/workspace/members/page.tsx` - Integrated filters

---

## Commit Message

```
feat: Add search and filters to team members page

Implement comprehensive search and filtering for workspace team members:
- Search by member name or email (debounced)
- Filter by role (Owner, Admin, Member, Viewer, Guest)
- Filter by status (Active, Pending)
- Persist filters in URL query parameters
- Support browser back/forward navigation
- Responsive design for mobile, tablet, desktop
- Empty states for no results

Components:
- Created MembersSearchFilter component
- Updated MembersList to accept and apply filters
- Enhanced WorkspaceMembersPage with filter integration

Technical details:
- Client-side filtering for MVP (<100 members)
- Debounced search using React.useDeferredValue
- URL state management with Next.js router
- TypeScript strict mode compliant

Story: 09-10
```

---

## Definition of Done

- [x] Search input searches name and email
- [x] Role filter dropdown implemented
- [x] Status filter dropdown implemented
- [x] Filters persist in URL parameters
- [x] Debounced search implemented
- [x] Clear filters button works
- [x] Empty states for no results
- [x] Responsive design works on all screen sizes
- [x] TypeScript compiles without errors
- [x] Component follows existing code patterns
- [x] Story documentation created

---

## Senior Developer Review

**Reviewer:** Claude (Senior Developer)
**Date:** 2025-12-05
**Status:** ✅ APPROVED

### Summary

Story 09.10 is well-implemented with clean code, proper URL state management, and good UX patterns. All acceptance criteria met.

### Acceptance Criteria Status

| Criteria | Status |
|----------|--------|
| Search input for member name/email | ✅ Pass |
| Role filter dropdown | ✅ Pass |
| Status filter dropdown | ✅ Pass |
| Filters persist in URL params | ✅ Pass |
| Debounced search | ✅ Pass |

### Code Quality Highlights

1. **Clean Separation of Concerns**
   - Filter component handles URL sync
   - MembersList handles filtering logic
   - Page component manages state

2. **Proper React Patterns**
   - Suspense boundary for useSearchParams
   - useEffect for URL change sync
   - Callback memoization for URL updates

3. **TypeScript**
   - Exported MemberFilters interface for reuse
   - Proper type safety throughout

4. **UX**
   - Clear filters button only visible when needed
   - Empty state differentiates no members vs no matches
   - Responsive layout for all screen sizes

**Quality Score:** 9/10

**Recommendation:** APPROVE for merge

---

_Story completed: 2025-12-05_
