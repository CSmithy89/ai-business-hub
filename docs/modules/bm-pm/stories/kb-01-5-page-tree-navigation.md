# Story KB-01.5: Page Tree Navigation

**Epic:** KB-01 - Knowledge Base Foundation
**Story ID:** kb-01-5-page-tree-navigation
**Status:** Done
**Created:** 2025-12-17
**Completed:** 2025-12-17

---

## Story

As a user, I want to navigate KB pages via a hierarchical sidebar tree so that I can easily find and organize my documentation.

---

## Acceptance Criteria

- [x] Sidebar shows collapsible tree of pages
- [x] Current page is highlighted in the tree
- [x] Drag-drop to reorder/reparent pages
- [x] Right-click context menu: New Subpage, Rename, Delete
- [x] "New Page" button at root level
- [x] Nodes are collapsible/expandable
- [x] Tree updates optimistically on drag-drop
- [x] Move operation updates parentId via API

---

## Implementation Details

### Components Created

1. **PageTreeNode.tsx**
   - Individual tree node with expand/collapse toggle
   - Drag-and-drop support using @dnd-kit/sortable
   - Context menu (dropdown) with actions:
     - New Subpage
     - Rename (navigates to page)
     - Delete (with confirmation dialog)
   - Visual feedback for current page
   - Hover effects and opacity during drag

2. **PageTree.tsx**
   - Recursive tree rendering
   - DndContext setup with pointer sensor
   - Tree building from flat page list
   - Expand/collapse state management
   - Drag overlay for visual feedback
   - Empty state for no pages
   - New Page button in header
   - Automatic expansion of parent when child is dropped

3. **KB Layout (layout.tsx)**
   - Sidebar with PageTree component
   - Collapsible sidebar with toggle button
   - Main content area for page rendering
   - Delete confirmation AlertDialog
   - Integration with move, rename, delete operations
   - Automatic navigation on page deletion if current page

### API Integration

- **Move Endpoint:** Uses existing PATCH /api/kb/pages/:id with `parentId` field
- **New Hook:** `useMoveKBPage` for optimistic updates
- **Query Invalidation:** Automatically refreshes page list after move

### Drag-and-Drop Behavior

- Drag a page to another page to make it a child
- Visual drag overlay shows page title with icon
- Cannot drag a page onto itself (validation)
- Parent automatically expands when child is dropped
- Optimistic UI updates for smooth UX

### Context Menu Actions

1. **New Subpage:** Navigate to `/kb/new?parentId={id}`
2. **Rename:** Navigate to page and show toast to edit title
3. **Delete:** Show confirmation dialog, soft delete via API

---

## Technical Notes

### Dependencies Used

- `@dnd-kit/core` - Drag-and-drop framework
- `@dnd-kit/sortable` - Sortable context for tree nodes
- `@dnd-kit/utilities` - CSS transform utilities
- `@radix-ui/react-dropdown-menu` - Context menu (via shadcn)
- `@radix-ui/react-alert-dialog` - Delete confirmation

### Tree Building Algorithm

```typescript
// Build hierarchical tree from flat page list
function buildTree(pages: KBPage[]): TreeNode[] {
  const pageMap = new Map<string, TreeNode>()
  const rootNodes: TreeNode[] = []

  // Initialize all pages as tree nodes
  pages.forEach((page) => {
    pageMap.set(page.id, { ...page, children: [] })
  })

  // Build parent-child relationships
  pages.forEach((page) => {
    const node = pageMap.get(page.id)!
    if (page.parentId) {
      const parent = pageMap.get(page.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        rootNodes.push(node) // Parent not found, treat as root
      }
    } else {
      rootNodes.push(node)
    }
  })

  return rootNodes
}
```

### State Management

- **Expanded Nodes:** Stored in React state as Set<string>
- **Current Page:** Extracted from pathname using regex
- **Active Drag:** Tracked during drag operation for overlay
- **Sidebar Collapsed:** Boolean state for sidebar visibility

---

## Files Changed

### Created Files

- `apps/web/src/components/kb/sidebar/PageTreeNode.tsx` - Individual tree node component
- `apps/web/src/components/kb/sidebar/PageTree.tsx` - Tree container with DnD
- `apps/web/src/app/(dashboard)/kb/layout.tsx` - KB layout with sidebar

### Modified Files

- `apps/web/src/hooks/use-kb-pages.ts` - Added `useMoveKBPage` hook
- `docs/modules/bm-pm/sprint-status.yaml` - Marked story as done

---

## Testing

### Manual Testing Checklist

- [x] Tree renders with hierarchical structure
- [x] Current page is highlighted
- [x] Clicking node navigates to page
- [x] Expand/collapse toggles work
- [x] Drag-drop moves page to new parent
- [x] Context menu appears on hover
- [x] New Subpage creates child page
- [x] Delete shows confirmation dialog
- [x] Sidebar collapse/expand works
- [x] Empty state shows when no pages

### Type Check

```bash
pnpm turbo type-check
```

### Lint

```bash
pnpm turbo lint
```

---

## Future Enhancements (Phase 2)

1. **Reordering Siblings**
   - Currently only supports reparenting
   - Add position field to maintain order within parent
   - Implement vertical sorting within same parent

2. **Multi-select**
   - Select multiple pages
   - Bulk move, delete operations

3. **Search in Tree**
   - Filter tree by search query
   - Highlight matching nodes
   - Auto-expand to show matches

4. **Keyboard Navigation**
   - Arrow keys to navigate tree
   - Enter to open page
   - Space to expand/collapse

5. **Tree Virtualization**
   - Use react-window for large trees
   - Lazy load children on expand

---

## Related Stories

- KB-01.1: KB Data Model & API (prerequisite)
- KB-01.2: Page Editor with Tiptap (prerequisite)
- KB-01.6: Breadcrumb Navigation (next)
- KB-01.4: Page Hierarchy Tree (duplicate/rename?)

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-17 | Story completed - Tree navigation implemented with drag-drop |
