# Story KB-01.6: Breadcrumb Navigation

**Status:** Done
**Epic:** KB-01 - Knowledge Base Foundation
**Story ID:** kb-01-6-breadcrumb-navigation
**Completed:** 2025-12-17

---

## Story Overview

**Goal:** Show users where they are in the page hierarchy with breadcrumb navigation.

**User Story:**
```
As a knowledge base user
I want to see breadcrumb navigation showing the page hierarchy
So that I can understand where I am and easily navigate to parent pages
```

---

## Acceptance Criteria

- [x] Given I am viewing a nested page
- [x] When breadcrumbs render
- [x] Then shows: KB Home > Parent > Current Page
- [x] And each segment is clickable
- [x] And truncates middle segments if too long (e.g., ... for deep nesting)

---

## Technical Implementation

### Components Created

#### 1. PageBreadcrumbs Component
**File:** `apps/web/src/components/kb/PageBreadcrumbs.tsx`

**Features:**
- Builds breadcrumb path by walking up parent chain
- Uses shadcn/ui Breadcrumb component
- Shows "KB Home" as first segment with home icon
- Makes each segment clickable (except current page)
- Truncates middle segments for deep hierarchies (maxVisible=3 by default)
- Shows ellipsis (...) when path is truncated

**Algorithm:**
```typescript
function buildBreadcrumbPath(currentPage, allPages) {
  1. Create a map of all pages for quick lookup
  2. Start with current page
  3. Walk up parent chain using parentId
  4. Build path array in reverse order (child to parent)
  5. Return path segments
}
```

**Truncation Logic:**
- If path.length <= maxVisible: show all segments
- If path.length > maxVisible: show first + ellipsis + last (maxVisible-1)
- Example with maxVisible=3 and 5-level deep page:
  - Full path: KB Home > L1 > L2 > L3 > L4 > L5
  - Truncated: KB Home > L1 > ... > L4 > L5

#### 2. shadcn/ui Breadcrumb Component
**File:** `apps/web/src/components/ui/breadcrumb.tsx`

**Installed via:**
```bash
cd apps/web
npx shadcn@latest add breadcrumb --yes
```

**Components Used:**
- `Breadcrumb` - Container nav element
- `BreadcrumbList` - Ordered list wrapper
- `BreadcrumbItem` - Individual segment
- `BreadcrumbLink` - Clickable link (uses Next.js Link)
- `BreadcrumbPage` - Current page (not clickable)
- `BreadcrumbSeparator` - ChevronRight icon between segments
- `BreadcrumbEllipsis` - MoreHorizontal icon for truncation

### Integration

**Modified File:** `apps/web/src/app/(dashboard)/kb/[slug]/page.tsx`

**Changes:**
1. Added import for `PageBreadcrumbs` component
2. Restructured header layout:
   - Added flex-col container with gap
   - Added breadcrumbs section at top
   - Moved title/actions below breadcrumbs
3. Pass `currentPage` and `allPages` props to breadcrumbs

**Layout Structure:**
```
<Header>
  <Breadcrumbs>
    KB Home > Parent > Current Page
  </Breadcrumbs>

  <TitleAndActions>
    <BackButton> <Title> <DeleteButton>
  </TitleAndActions>
</Header>
```

---

## Data Flow

1. Page component loads `pagesData` (all pages) and `pageData` (current page)
2. Pass both to `PageBreadcrumbs` component
3. `buildBreadcrumbPath()` walks parent chain to build path
4. Path rendered with shadcn breadcrumb components
5. Links navigate to `/kb/[slug]` on click

---

## Testing

### Manual Testing Checklist

- [x] Root page: Shows only "KB Home > Page Title"
- [x] 1-level nested: Shows "KB Home > Parent > Child"
- [x] 3-level nested: Shows "KB Home > L1 > L2 > L3"
- [x] Deep nesting (5+ levels): Shows "KB Home > L1 > ... > L4 > L5"
- [x] Clicking breadcrumb segments navigates correctly
- [x] Current page segment is not clickable (plain text)
- [x] Home icon appears in KB Home segment
- [x] Separators appear between all segments
- [x] Breadcrumbs responsive on mobile (wraps if needed)

### Edge Cases Handled

1. **Orphaned pages** (parentId points to non-existent page):
   - Treats as root-level page
   - Shows only "KB Home > Page Title"

2. **Circular references** (shouldn't happen with validation, but):
   - Algorithm naturally terminates when parent not found

3. **Very long page titles**:
   - CSS truncates individual segments with ellipsis
   - Container wraps to next line if needed

---

## UI/UX Notes

### Visual Design
- Uses muted foreground color for links
- Hover effect on links (darker color)
- Current page uses foreground color (bolder)
- ChevronRight separators (3.5x3.5 size)
- Consistent with shadcn/ui design system

### Accessibility
- Semantic breadcrumb nav element (`<nav aria-label="breadcrumb">`)
- Ordered list structure (`<ol>`)
- `aria-current="page"` on current page
- `role="presentation"` and `aria-hidden` on separators
- Screen reader text for ellipsis ("More")

### Responsive Behavior
- Wraps on small screens (flex-wrap)
- Maintains readability with appropriate spacing
- Home icon scales appropriately

---

## Dependencies

### New Dependencies
- None (shadcn/ui breadcrumb uses existing dependencies)

### Existing Dependencies Used
- `@radix-ui/react-slot` (for asChild pattern)
- `lucide-react` (Home, ChevronRight, MoreHorizontal icons)
- Next.js Link component
- React Query hooks (`useKBPages`, `useKBPage`)

---

## File Changes Summary

### Files Created
- `apps/web/src/components/kb/PageBreadcrumbs.tsx` (new component)
- `apps/web/src/components/ui/breadcrumb.tsx` (shadcn component)

### Files Modified
- `apps/web/src/app/(dashboard)/kb/[slug]/page.tsx` (integrated breadcrumbs)
- `docs/modules/bm-pm/sprint-status.yaml` (marked story as done)

### Files Not Changed (but relevant)
- `apps/web/src/hooks/use-kb-pages.ts` (uses existing hooks)

---

## Performance Considerations

### Breadcrumb Path Building
- **Time Complexity:** O(d) where d is depth of page in tree
- **Space Complexity:** O(d) for path array
- **Optimization:** Uses Map for O(1) page lookup
- **Memoization:** `useMemo` prevents unnecessary recalculations

### Render Performance
- Breadcrumbs only re-render when currentPage or allPages changes
- Conditional rendering: only shows when pagesData is available
- No unnecessary API calls (uses existing page data)

---

## Future Enhancements (Out of Scope)

1. **Breadcrumb dropdown menus**
   - Click segment to see all siblings
   - Quick navigation to related pages

2. **Keyboard navigation**
   - Arrow keys to navigate breadcrumbs
   - Tab focus management

3. **Breadcrumb customization**
   - User preference for max visible segments
   - Option to show full path always

4. **Smart truncation**
   - Truncate based on available width
   - Show more segments on wider screens

5. **Breadcrumb actions**
   - Right-click context menu
   - Quick actions (copy path, share link)

---

## Related Documentation

- [Epic KB-01 Tech Spec](../epics/epic-kb-01-tech-spec.md)
- [KB Specification](../kb-specification.md)
- [Sprint Status](../sprint-status.yaml)
- [shadcn/ui Breadcrumb Docs](https://ui.shadcn.com/docs/components/breadcrumb)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial implementation of breadcrumb navigation |
