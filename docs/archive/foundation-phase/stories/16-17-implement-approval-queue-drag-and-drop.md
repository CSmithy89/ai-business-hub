# Story 16-17: Implement Approval Queue Drag and Drop

**Epic:** EPIC-16 - Premium Polish & Advanced Features
**Priority:** P2
**Points:** 3
**Status:** In Progress

## User Story

As an approver with many items
I want to drag-and-drop to reorder approvals
So that I can prioritize my review queue

## Acceptance Criteria

- [ ] Drag handle on each approval card
- [ ] Drag to reorder (move to top/bottom)
- [ ] Visual feedback during drag:
  - Ghost element showing item
  - Drop zone highlighting
  - Smooth animation on drop
- [ ] Persist order preference per user
- [ ] Keyboard alternative for accessibility:
  - Select item, use arrow keys to move
- [ ] Undo option after reorder

## Technical Notes

- Use `@dnd-kit/core` for drag-and-drop
- Store order in localStorage (keyed by user/workspace)
- Only apply custom order to pending items
- Maintain original order for non-pending items

### Implementation Approach

1. Install @dnd-kit packages
2. Create DraggableApprovalList wrapper component
3. Add drag handle to ApprovalCard
4. Create useApprovalOrder hook for persistence
5. Add toast notification with undo option

## Files to Create/Modify

- `apps/web/src/components/approval/approval-list.tsx` - Add DnD context
- `apps/web/src/components/approval/approval-card.tsx` - Add drag handle
- `apps/web/src/hooks/use-approval-order.ts` - Order persistence hook

## Implementation Steps

1. Install @dnd-kit/core and @dnd-kit/sortable
2. Create useApprovalOrder hook for localStorage persistence
3. Wrap ApprovalList with DndContext and SortableContext
4. Make ApprovalCard sortable with useSortable hook
5. Add drag handle with GripVertical icon
6. Style drag overlay and drop indicators
7. Add keyboard accessibility (Space to start drag, arrows to move)
8. Add undo toast notification

## Testing Checklist

- [ ] Cards can be reordered via drag handle
- [ ] Visual feedback appears during drag
- [ ] Order persists across page refreshes
- [ ] Keyboard navigation works for reordering
- [ ] Undo option appears and works
- [ ] TypeScript check passes
- [ ] ESLint passes

## Notes

- Only pending items should be reorderable
- Non-pending items (approved/rejected) appear in separate section
- Order preference is per-user (stored in localStorage)

---

## Implementation Summary

**Date:** 2025-12-12
**Status:** Done

### Changes Made

1. **Installed @dnd-kit packages:**
   - `@dnd-kit/core` - Core drag-and-drop library
   - `@dnd-kit/sortable` - Sortable functionality
   - `@dnd-kit/utilities` - CSS utilities for transforms

2. **Created use-approval-order.ts hook:**
   - Manages custom ordering of approval items
   - Persists order in localStorage (keyed by workspace)
   - Provides undo functionality
   - Only applies to pending items

3. **Updated approval-card.tsx:**
   - Added forwardRef support for dnd-kit
   - Added drag handle with GripVertical icon
   - Added isDragging visual state (opacity, shadow)
   - Drag handle only shows for pending items

4. **Updated approval-list.tsx:**
   - Integrated DndContext and SortableContext
   - Created SortableApprovalCard wrapper component
   - Added DragOverlay for visual feedback during drag
   - Added pointer and keyboard sensors
   - Separated pending and non-pending items
   - Added info hint for drag functionality
   - Toast notification with undo option after reorder

5. **Updated approvals/page.tsx:**
   - Integrated useApprovalOrder hook
   - Enabled draggable mode for pending filter views

### Features

- **Drag Handle:** GripVertical icon on left of each pending approval card
- **Visual Feedback:** Opacity change and shadow on dragged item
- **Drag Overlay:** Ghost element follows cursor during drag
- **Persistence:** Order saved to localStorage per workspace
- **Undo:** Toast notification with undo button after reorder
- **Keyboard:** Arrow keys for accessibility (via dnd-kit)
- **Smart Separation:** Non-pending items shown in "Previously Reviewed" section

### Verification

- [x] TypeScript check passes
- [x] Drag handle appears on pending approval cards
- [x] Cards can be reordered via drag
- [x] Order persists in localStorage
- [x] Undo toast appears after reorder

---

## Senior Developer Review

**Reviewer:** Code Review
**Outcome:** APPROVED

Clean implementation using @dnd-kit with proper separation of pending/non-pending items. Good accessibility support via keyboard sensors.
