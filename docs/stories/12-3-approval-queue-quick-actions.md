# Story 12.3: Approval Queue Quick Actions

**Epic:** EPIC-12 - Platform Hardening & Tech Debt
**Points:** 3
**Priority:** P1 High
**Status:** ✅ Done

---

## User Story

**As a** reviewer
**I want** to approve or reject items directly from the list
**So that** I can process approvals faster without opening modals

---

## Acceptance Criteria

- [x] AC1: Add Approve button (green/primary) to approval list cards
- [x] AC2: Add Reject button (red/destructive) to approval list cards
- [x] AC3: Quick actions work without opening detail modal
- [x] AC4: Show confirmation toast on successful action
- [x] AC5: Implement optimistic UI update on action
- [x] AC6: Handle errors with rollback and error toast
- [x] AC7: Match wireframe button styling (icon + text)
- [x] AC8: Update approval count stats immediately

---

## Implementation Details

### 1. New Hook: `use-approval-quick-actions.ts`

Created a new hook for quick approval actions with optimistic updates:

**Location:** `/apps/web/src/hooks/use-approval-quick-actions.ts`

**Features:**
- Optimistic UI updates for instant feedback
- Automatic rollback on error
- Toast notifications using `sonner`
- Query cache invalidation to update approval counts
- Reuses existing API endpoints (`/api/approvals/:id/approve` and `/api/approvals/:id/reject`)

**Key Functions:**
```typescript
export function useApprovalQuickActions() {
  return {
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    approveError: approveMutation.error,
    rejectError: rejectMutation.error,
  }
}
```

### 2. New Component: `ApprovalQuickActions`

Created a new quick actions component for list view:

**Location:** `/apps/web/src/components/approval/approval-quick-actions.tsx`

**Features:**
- Green "Approve" button with CheckCircle2 icon
- Red "Reject" button with XCircle icon
- Loading states with spinner during API calls
- No dialogs or confirmation prompts (instant action)
- Disabled state while any action is in progress

**Button Styling:**
- Approve: `bg-green-600 hover:bg-green-700 text-white`
- Reject: `variant="destructive"` (red color from theme)
- Both: `size="sm"` with icon + text

### 3. Updated Component: `ApprovalCard`

Modified the compact variant to use quick actions:

**Location:** `/apps/web/src/components/approval/approval-card.tsx`

**Changes:**
- Imported `ApprovalQuickActions` component
- Replaced `ApprovalActions` (dialog-based) with `ApprovalQuickActions` in compact variant
- Kept `ApprovalActions` in expanded variant for full form with notes

**Before:**
```tsx
<ApprovalActions
  approvalId={approval.id}
  variant="compact"
  onApprove={onActionComplete}
  onReject={onActionComplete}
/>
```

**After:**
```tsx
<ApprovalQuickActions
  approvalId={approval.id}
/>
```

### 4. Optimistic Updates

The hook implements optimistic updates using React Query:

```typescript
onMutate: async ({ id }) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey: ['approvals'] })

  // Snapshot previous value
  const previousApprovals = queryClient.getQueryData(['approvals'])

  // Optimistically update to the new value
  queryClient.setQueriesData({ queryKey: ['approvals'] }, (old) => {
    // Update item status immediately
  })

  return { previousApprovals }
}
```

On error, the optimistic update is rolled back:

```typescript
onError: (error, variables, context) => {
  // Rollback optimistic update
  if (context?.previousApprovals) {
    queryClient.setQueryData(['approvals'], context.previousApprovals)
  }

  toast.error('Failed to approve')
}
```

### 5. Toast Notifications

Using `sonner` for all notifications:

**Success:**
```typescript
toast.success('Approved successfully', {
  description: `${response.data.title} has been approved.`,
})
```

**Error:**
```typescript
toast.error('Failed to approve', {
  description: error instanceof Error ? error.message : 'An error occurred',
})
```

### 6. Query Cache Invalidation

After successful action, the hook invalidates queries to refresh data:

```typescript
onSuccess: (response) => {
  // Show success toast
  toast.success('Approved successfully')

  // Invalidate to refetch with server data
  queryClient.invalidateQueries({ queryKey: ['approvals'] })
  queryClient.invalidateQueries({ queryKey: ['approval', response.data.id] })
}
```

This ensures:
- Approval list is refreshed with updated statuses
- Individual approval detail is updated
- Approval count stats are recalculated automatically

---

## Technical Decisions

### Why Create a New Hook?

Instead of modifying `use-approvals.ts`, created a separate `use-approval-quick-actions.ts` because:

1. **Separation of Concerns:** Quick actions have different UX requirements (optimistic updates, toasts)
2. **Existing Hook Compatibility:** `use-approvals.ts` is used by `ApprovalActions` component with different patterns
3. **Easier Testing:** Isolated hook is easier to test independently
4. **Future Flexibility:** Can add quick-action-specific features without affecting existing code

### Why Keep Both Components?

- **ApprovalQuickActions:** For list view, instant actions without dialogs
- **ApprovalActions:** For detail view, with notes input and confirmation dialogs

This provides:
- Fast workflow for high-confidence items (quick actions)
- Thoughtful workflow for low-confidence items (full form with notes)

---

## Testing Notes

### Manual Testing Checklist

- [x] Approve button appears on pending approval cards
- [x] Reject button appears on pending approval cards
- [x] Clicking Approve shows loading state
- [x] Clicking Approve updates UI immediately (optimistic)
- [x] Successful approve shows success toast
- [x] Approval disappears from pending list
- [x] Failed approve shows error toast
- [x] Failed approve rolls back optimistic update
- [x] Clicking Reject shows loading state
- [x] Clicking Reject updates UI immediately (optimistic)
- [x] Successful reject shows success toast
- [x] Rejection disappears from pending list
- [x] Failed reject shows error toast
- [x] Failed reject rolls back optimistic update
- [x] Buttons are disabled during API call
- [x] Approval count stats update after action
- [x] Quick actions don't appear on non-pending items

### API Integration

The hook uses existing API endpoints:
- `POST /api/approvals/:id/approve`
- `POST /api/approvals/:id/reject`

No backend changes required.

---

## Files Changed

### New Files
1. `/apps/web/src/hooks/use-approval-quick-actions.ts` - Hook for quick actions with optimistic updates
2. `/apps/web/src/components/approval/approval-quick-actions.tsx` - Quick action buttons component
3. `/docs/stories/12-3-approval-queue-quick-actions.md` - This story file

### Modified Files
1. `/apps/web/src/components/approval/approval-card.tsx` - Updated to use quick actions in compact variant

---

## Dependencies

- `@tanstack/react-query` - For mutations and optimistic updates
- `sonner` - For toast notifications
- `lucide-react` - For icons (CheckCircle2, XCircle, Loader2)
- Existing API endpoints in NestJS backend

---

## Future Enhancements

1. **Keyboard Shortcuts:** Add keyboard shortcuts for quick approve/reject (e.g., `Ctrl+A`, `Ctrl+R`)
2. **Undo Action:** Add "Undo" button in success toast to revert the action
3. **Batch Quick Actions:** Allow selecting multiple items and using quick actions
4. **Configurable Confirmation:** Add setting to require confirmation for quick reject
5. **Analytics:** Track quick action usage vs. full form usage

---

## Story Definition of Done

- [x] Code implemented and committed
- [x] Acceptance criteria met
- [x] Component follows existing patterns
- [x] TypeScript types are correct
- [x] Error handling implemented
- [x] Optimistic updates working
- [x] Toast notifications working
- [x] No console errors or warnings
- [x] Story documentation created

---

**Completed:** 2025-12-06
**Developer:** Claude Code
