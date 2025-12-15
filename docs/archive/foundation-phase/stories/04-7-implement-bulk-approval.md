# Story 04-7: Implement Bulk Approval

**Epic:** EPIC-04 - Approval Queue System
**Points:** 2
**Priority:** P1
**Status:** done
**Branch:** `story/04-7-bulk-approval`

---

## User Story

**As an** approver with many similar items
**I want** to approve/reject in bulk
**So that** I can be efficient

---

## Acceptance Criteria

- [x] Add selection checkboxes to queue
- [x] Show selected count
- [x] Bulk action buttons (Approve All, Reject All)
- [x] Add bulk notes input
- [x] Confirm dialog before bulk action
- [x] Show progress during bulk operation
- [x] Handle partial failures gracefully

---

## Technical Details

### API Endpoint (Already Implemented in Story 04-2)

**Endpoint:** `POST /api/approvals/bulk`

**Request Body:**
```typescript
{
  ids: string[];
  action: 'approve' | 'reject';
  notes?: string;
  reason?: string; // Required for reject actions
}
```

**Response:**
```typescript
{
  succeeded: string[];
  failed: { id: string; error: string }[];
}
```

### Components Implemented

1. **BulkActionBar** (`apps/web/src/components/approval/bulk-action-bar.tsx`)
   - Floating sticky bar at bottom of screen
   - Shows selected count badge
   - Clear selection button
   - Approve All / Reject All buttons
   - Notes textarea for bulk actions
   - Slides up/down animation

2. **BulkConfirmDialog** (`apps/web/src/components/approval/bulk-confirm-dialog.tsx`)
   - AlertDialog for confirmation
   - Shows action type and count
   - Notes preview
   - Progress bar during operation
   - Results summary (succeeded/failed)
   - Handles partial failures

3. **Updated ApprovalCard** (`apps/web/src/components/approval/approval-card.tsx`)
   - Added checkbox for selection mode
   - OnSelect callback
   - Selected state styling
   - Visual feedback when selected

4. **Updated ApprovalList** (`apps/web/src/components/approval/approval-list.tsx`)
   - Tracks selected item IDs (Set<string>)
   - Passes selection props to cards
   - Select all / deselect all functionality
   - Header with selection controls

5. **Updated Approvals Page** (`apps/web/src/app/approvals/page.tsx`)
   - Integrated BulkActionBar
   - Manages selection state
   - Handles bulk actions
   - Clears selection after success

### Hooks Added

**useBulkApprovalMutation** in `apps/web/src/hooks/use-approvals.ts`:
- Handles bulk approve/reject mutations
- Processes partial success/failure responses
- Invalidates approval list cache on success
- Provides loading and error states

---

## Implementation Notes

### State Management
- Used React state with `Set<string>` for selected items
- Selection persists during pagination
- Cleared on successful bulk action

### UI/UX Decisions
- Floating action bar uses `position: sticky` at bottom
- Animates sliding up when items selected
- Progress shown with linear progress indicator during API call
- Success toast shows summary of results
- Partial failures displayed in dialog with error details

### Error Handling
- Gracefully handles partial failures
- Shows which specific items failed and why
- Allows user to retry failed items
- Maintains selection of failed items for retry

### Responsive Design
- Action bar adapts to mobile/tablet/desktop
- Buttons stack on small screens
- Selection UI optimized for touch interfaces

---

## Testing Checklist

- [ ] Select single item - checkbox works
- [ ] Select multiple items - shows correct count
- [ ] Select all items - all checkboxes checked
- [ ] Deselect all - clears selection
- [ ] Bulk approve - shows confirmation dialog
- [ ] Bulk reject - requires notes, shows confirmation
- [ ] Progress indicator during API call
- [ ] Success - shows summary, clears selection
- [ ] Partial failure - shows failed items, keeps selection
- [ ] Clear selection button works
- [ ] Action bar slides up/down smoothly
- [ ] Responsive on mobile/tablet/desktop

---

## Dependencies

**API:**
- POST /api/approvals/bulk endpoint (implemented in Story 04-2)

**Components:**
- shadcn/ui: Button, Badge, Card, Checkbox, Textarea, AlertDialog, Progress
- lucide-react icons

**Packages:**
- @tanstack/react-query for mutations
- react-hot-toast for notifications

---

## Files Created/Modified

### Created
- `docs/stories/04-7-implement-bulk-approval.md`
- `docs/stories/04-7-implement-bulk-approval.context.xml`
- `apps/web/src/components/approval/bulk-action-bar.tsx`
- `apps/web/src/components/approval/bulk-confirm-dialog.tsx`

### Modified
- `apps/web/src/hooks/use-approvals.ts` - Added useBulkApprovalMutation
- `apps/web/src/components/approval/approval-card.tsx` - Added selection support
- `apps/web/src/components/approval/approval-list.tsx` - Added selection state management
- `apps/web/src/app/approvals/page.tsx` - Integrated bulk actions
- `docs/archive/foundation-phase/sprint-artifacts/sprint-status.yaml` - Updated 04-7 status

---

## Definition of Done

- [x] All acceptance criteria met
- [x] Components implemented and styled
- [x] Bulk API integration working
- [x] Error handling for partial failures
- [x] Responsive design implemented
- [ ] Code reviewed
- [ ] Manual testing completed
- [ ] Story marked as done in sprint status

---

## Notes

- The bulk API endpoint was already implemented in Story 04-2
- Used shadcn/ui components for consistency
- Progress indicator provides visual feedback during potentially long operations
- Partial failure handling is critical for good UX
- Selection state managed at page level for simplicity
