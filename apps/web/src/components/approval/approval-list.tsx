'use client'

import { useState, useCallback, useMemo } from 'react'
import { ApprovalCard } from './approval-card'
import { Button } from '@/components/ui/button'
import type { ApprovalItem } from '@hyvve/shared'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { Undo2 } from 'lucide-react'

interface ApprovalListProps {
  approvals: ApprovalItem[]
  isLoading?: boolean
  isEmpty?: boolean
  /** Enable selection mode */
  selectable?: boolean
  /** Set of selected item IDs */
  selectedIds?: Set<string>
  /** Callback when item selection changes */
  onSelectionChange?: (id: string, selected: boolean) => void
  /** Callback to select all items */
  onSelectAll?: () => void
  /** Callback to deselect all items */
  onDeselectAll?: () => void
  /** Enable drag-and-drop reordering */
  draggable?: boolean
  /** Custom order of approval IDs */
  customOrder?: string[]
  /** Callback when order changes */
  onOrderChange?: (newOrder: string[]) => void
  /** Callback for undo functionality */
  onUndoReorder?: () => void
}

/**
 * Skeleton loading card
 */
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}

/**
 * Empty state message
 */
function EmptyState({ hasFilters }: { hasFilters?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <svg
          className="h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasFilters ? 'No approvals found' : 'No pending approvals'}
      </h3>
      <p className="text-gray-600 max-w-md">
        {hasFilters
          ? 'Try adjusting your filters to see more results.'
          : 'All caught up! There are no approvals waiting for your review.'}
      </p>
    </div>
  )
}

/**
 * Sortable wrapper for ApprovalCard
 */
interface SortableApprovalCardProps {
  approval: ApprovalItem
  selectable: boolean
  selected: boolean
  onSelectionChange?: (id: string, selected: boolean) => void
}

function SortableApprovalCard({
  approval,
  selectable,
  selected,
  onSelectionChange,
}: SortableApprovalCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: approval.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ApprovalCard
        approval={approval}
        variant="compact"
        selectable={selectable}
        selected={selected}
        onSelect={onSelectionChange}
        draggable
        isDragging={isDragging}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  )
}

/**
 * Approval list container with loading and empty states
 */
export function ApprovalList({
  approvals,
  isLoading,
  isEmpty,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onSelectAll,
  onDeselectAll,
  draggable = false,
  onOrderChange,
  onUndoReorder,
}: ApprovalListProps) {
  // Track active drag item for overlay
  const [activeId, setActiveId] = useState<string | null>(null)

  // Calculate selectable items (only pending items can be selected)
  const selectableItems = approvals.filter(a => a.status === 'pending')
  const allSelected = selectable && selectableItems.length > 0 &&
    selectableItems.every(a => selectedIds.has(a.id))
  const someSelected = selectable && selectedIds.size > 0 && !allSelected

  // Separate pending and non-pending items for drag context
  const pendingApprovals = useMemo(
    () => approvals.filter(a => a.status === 'pending'),
    [approvals]
  )
  const nonPendingApprovals = useMemo(
    () => approvals.filter(a => a.status !== 'pending'),
    [approvals]
  )
  const pendingIds = useMemo(
    () => pendingApprovals.map(a => a.id),
    [pendingApprovals]
  )

  // Active item for drag overlay
  const activeApproval = useMemo(
    () => (activeId ? approvals.find(a => a.id === activeId) : null),
    [activeId, approvals]
  )

  // Configure sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag start
  const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id))
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over || active.id === over.id) {
        return
      }

      const oldIndex = pendingIds.indexOf(String(active.id))
      const newIndex = pendingIds.indexOf(String(over.id))

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(pendingIds, oldIndex, newIndex)
        onOrderChange?.(newOrder)

        // Show toast with undo option
        toast.success('Approval order updated', {
          description: 'Drag and drop to customize your queue priority.',
          action: onUndoReorder
            ? {
                label: 'Undo',
                onClick: () => {
                  onUndoReorder()
                  toast.info('Order change undone')
                },
              }
            : undefined,
          icon: <Undo2 className="h-4 w-4" />,
        })
      }
    },
    [pendingIds, onOrderChange, onUndoReorder]
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    )
  }

  // Empty state
  if (isEmpty || approvals.length === 0) {
    return <EmptyState hasFilters={isEmpty} />
  }

  // Render with or without drag-and-drop
  const renderApprovalCards = () => {
    if (draggable && pendingApprovals.length > 0) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pendingIds}
            strategy={verticalListSortingStrategy}
          >
            {pendingApprovals.map((approval) => (
              <SortableApprovalCard
                key={approval.id}
                approval={approval}
                selectable={selectable}
                selected={selectedIds.has(approval.id)}
                onSelectionChange={onSelectionChange}
              />
            ))}
          </SortableContext>

          {/* Drag overlay for better visual feedback */}
          <DragOverlay>
            {activeApproval ? (
              <div className="opacity-90 shadow-lg">
                <ApprovalCard
                  approval={activeApproval}
                  variant="compact"
                  selectable={false}
                  selected={false}
                  draggable={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )
    }

    // Non-draggable pending items
    return pendingApprovals.map((approval) => (
      <ApprovalCard
        key={approval.id}
        approval={approval}
        variant="compact"
        selectable={selectable}
        selected={selectedIds.has(approval.id)}
        onSelect={onSelectionChange}
      />
    ))
  }

  // List of approvals
  return (
    <div className="space-y-4">
      {/* Selection header */}
      {selectable && selectableItems.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            {selectedIds.size > 0 ? (
              <span>
                <strong>{selectedIds.size}</strong> of <strong>{selectableItems.length}</strong> items selected
              </span>
            ) : (
              <span>
                <strong>{selectableItems.length}</strong> items can be selected
              </span>
            )}
          </p>
          <div className="flex gap-2">
            {someSelected || allSelected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onDeselectAll}
              >
                Deselect All
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectAll}
              >
                Select All
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Draggable info hint */}
      {draggable && pendingApprovals.length > 1 && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span>💡</span>
          <span>Drag items by the handle to reorder your approval queue</span>
        </p>
      )}

      {/* Pending approval cards (with or without drag) */}
      {renderApprovalCards()}

      {/* Non-pending items (not draggable) */}
      {nonPendingApprovals.length > 0 && (
        <>
          {pendingApprovals.length > 0 && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">
                Previously Reviewed
              </h4>
            </div>
          )}
          {nonPendingApprovals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              variant="compact"
              selectable={false}
              selected={false}
            />
          ))}
        </>
      )}
    </div>
  )
}
