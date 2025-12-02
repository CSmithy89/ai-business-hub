# Story 04-4: Create Approval Queue Dashboard

**Story ID:** 04-4
**Epic:** EPIC-04 - Approval Queue System
**Status:** done
**Points:** 3
**Priority:** P0

---

## User Story

**As a** workspace admin
**I want** to see all pending approvals
**So that** I can make decisions efficiently

---

## Acceptance Criteria

- [ ] Create page at `/approvals`
- [ ] Display queue with columns: Title, Type, Confidence, Priority, Due
- [ ] Filter controls (status, type, priority)
- [ ] Sort controls
- [ ] Quick stats (pending count, urgent count)
- [ ] Badge on sidebar with pending count (placeholder for now - full sidebar in Epic 07)
- [ ] Responsive design for tablet/desktop

---

## Technical Requirements

### Page Route
- **Path:** `/approvals`
- **Access:** Authenticated users with workspace context
- **Layout:** Uses app layout (sidebar and header added in Epic 07)

### API Integration

**List Approvals:**
- **Endpoint:** `GET /api/approvals`
- **Query Params:**
  - `status`: ApprovalStatus ('pending' | 'approved' | 'rejected' | 'auto_approved')
  - `type`: string (e.g., 'email', 'social_post')
  - `priority`: number
  - `assignedTo`: string (user ID)
  - `sortBy`: string ('createdAt' | 'dueAt' | 'priority')
  - `sortOrder`: 'asc' | 'desc'
  - `page`: number (default: 1)
  - `limit`: number (default: 20)
- **Response:**
  ```typescript
  {
    data: ApprovalItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
  ```

**Get Single Approval:**
- **Endpoint:** `GET /api/approvals/:id`
- **Response:** `{ data: ApprovalItem }`

### Data Fetching Strategy

Use `@tanstack/react-query` (already installed) for:
- Automatic background refetching
- Optimistic updates for approve/reject actions
- Caching and invalidation
- Loading and error states

### UI Components

**Stats Bar:**
- Pending Review count
- Auto-Approved Today count
- Avg Response Time (placeholder for now)
- Approval Rate (placeholder for now)

**Filter Controls:**
- Status filter (All, Pending, Approved, Rejected, Auto-Approved)
- Type filter (dropdown with available types)
- Confidence filter (All, High, Medium, Low)
- Sort by: Created Date, Due Date, Priority

**Approval List:**
- Simple card layout (detailed ApprovalCard in Story 04-5)
- Each card shows:
  - Colored left border based on confidence (green >85%, yellow 60-85%, red <60%)
  - Title and type
  - Confidence badge
  - Created time
  - Due date (if set)
  - Priority indicator
  - View button

**Pagination:**
- Page numbers
- Previous/Next buttons
- Items per page selector

**Empty States:**
- No approvals found
- No results matching filters

**Loading States:**
- Skeleton cards during initial load
- Spinner for refetch/pagination

### Confidence Level Colors

```typescript
const confidenceColors = {
  high: 'border-green-500',    // >85%
  medium: 'border-yellow-500', // 60-85%
  low: 'border-red-500',       // <60%
}
```

### Priority Indicators

```typescript
const priorityBadges = {
  1: { label: 'Low', variant: 'secondary' },
  2: { label: 'Medium', variant: 'default' },
  3: { label: 'High', variant: 'destructive' },
}
```

---

## Component Structure

```
apps/web/src/
├── app/
│   └── approvals/
│       └── page.tsx           # Main approval queue page
├── hooks/
│   └── use-approvals.ts       # React Query hooks for approvals API
└── components/
    └── approval/
        ├── approval-stats.tsx      # Stats bar component
        ├── approval-filters.tsx    # Filter/sort controls
        ├── approval-list.tsx       # List container
        └── approval-list-item.tsx  # Simple list item card
```

---

## Implementation Notes

- Use `@tanstack/react-query` for data fetching (already installed)
- API base URL: `process.env.NEXT_PUBLIC_API_URL` or `http://localhost:3001`
- Follow existing patterns from workspace settings pages
- Use shadcn/ui components where available
- Keep list items simple - detailed ApprovalCard will be in Story 04-5
- Stats calculations can be placeholders for now (will be enhanced in later stories)
- Ensure proper error handling and user feedback
- All dates should use `date-fns` for formatting (already installed)

---

## Testing Considerations

- Test with empty approval queue
- Test with filtered results
- Test pagination with different page sizes
- Test sorting by different columns
- Test confidence color indicators
- Test responsive layout on tablet/desktop
- Test loading and error states

---

## Files to Create/Modify

### New Files:
1. `/docs/stories/04-4-create-approval-queue-dashboard.md` (this file)
2. `/docs/stories/04-4-create-approval-queue-dashboard.context.xml`
3. `/apps/web/src/hooks/use-approvals.ts`
4. `/apps/web/src/app/approvals/page.tsx`
5. `/apps/web/src/components/approval/approval-stats.tsx`
6. `/apps/web/src/components/approval/approval-filters.tsx`
7. `/apps/web/src/components/approval/approval-list.tsx`
8. `/apps/web/src/components/approval/approval-list-item.tsx`

### Modified Files:
1. `/docs/sprint-artifacts/sprint-status.yaml` (mark 04-4 as in-progress)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Components follow shadcn/ui patterns
- [ ] Proper TypeScript types from @hyvve/shared
- [ ] Loading and error states handled
- [ ] Responsive design tested
- [ ] Code follows project conventions
- [ ] No console errors or warnings
- [ ] Ready for code review

---

## Progress Log

### 2025-12-03
- Story created and moved to in-progress
- Implementation started on branch `story/04-4-approval-queue-dashboard`

---

## Related Stories

- **04-2:** Create Approval Queue API Endpoints (dependency - completed)
- **04-3:** Implement Approval Router (dependency - completed)
- **04-5:** Create Approval Card Component (follows this story)
- **04-6:** Implement AI Reasoning Display (follows this story)
- **07-2:** Create Sidebar Navigation (sidebar badge will be added then)
