'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulkActionBarProps {
  /** Number of items selected */
  selectedCount: number
  /** Callback to clear selection */
  onClearSelection: () => void
  /** Callback for bulk approve action */
  // eslint-disable-next-line no-unused-vars
  onBulkApprove: (notes?: string) => void
  /** Callback for bulk reject action (notes required) */
  // eslint-disable-next-line no-unused-vars
  onBulkReject: (notes: string) => void
  /** Optional className */
  className?: string
}

/**
 * BulkActionBar Component
 *
 * Floating action bar that appears when items are selected.
 * Provides bulk approve/reject actions with optional notes.
 *
 * Features:
 * - Sticky positioning at bottom of viewport
 * - Slide up/down animation
 * - Notes input for bulk actions
 * - Clear selection button
 * - Approve/Reject buttons with validation
 */
export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkApprove,
  onBulkReject,
  className,
}: BulkActionBarProps) {
  const [notes, setNotes] = useState('')
  const [showNotesError, setShowNotesError] = useState(false)

  // Don't render if no items selected
  if (selectedCount === 0) return null

  const handleApprove = () => {
    setShowNotesError(false)
    onBulkApprove(notes || undefined)
  }

  const handleReject = () => {
    // Reject requires notes/reason
    if (!notes.trim()) {
      setShowNotesError(true)
      return
    }
    setShowNotesError(false)
    onBulkReject(notes)
  }

  const handleClear = () => {
    setNotes('')
    setShowNotesError(false)
    onClearSelection()
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg',
        'animate-in slide-in-from-bottom-full duration-300',
        className
      )}
    >
      <Card className="border-0 rounded-none shadow-none">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            {/* Selection info */}
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="default" className="text-base px-3 py-1">
                {selectedCount} Selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>

            {/* Notes input */}
            <div className="flex-1 space-y-1">
              <Textarea
                placeholder="Add notes for this bulk action (required for rejections)..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  setShowNotesError(false)
                }}
                rows={2}
                className={cn(
                  'resize-none text-sm',
                  showNotesError && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
              {showNotesError && (
                <p className="text-xs text-red-600">
                  Notes are required when rejecting items
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={handleApprove}
                className="gap-2 border-green-600 text-green-700 hover:bg-green-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Approve All</span>
                <span className="sm:hidden">Approve</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                className="gap-2 border-red-600 text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Reject All</span>
                <span className="sm:hidden">Reject</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
