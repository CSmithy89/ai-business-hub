'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UnsavedChangesBarProps {
  /** Callback when save button is clicked */
  onSave: () => void | Promise<void>
  /** Callback when discard button is clicked */
  onDiscard: () => void | Promise<void>
  /** Whether a save operation is in progress */
  isLoading?: boolean
  /** Custom className for the bar */
  className?: string
}

/**
 * Unsaved Changes Bar Component
 *
 * A sticky yellow bar shown at the bottom of the screen when there are
 * unsaved changes in a settings form. Provides Save and Discard actions.
 */
export function UnsavedChangesBar({
  onSave,
  onDiscard,
  isLoading = false,
  className,
}: UnsavedChangesBarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-yellow-50 border-t-2 border-yellow-400',
        'px-6 py-4 shadow-lg',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
          <p className="text-sm font-medium text-yellow-900">
            You have unsaved changes
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onDiscard}
            disabled={isLoading}
            className="text-yellow-900 hover:bg-yellow-100"
          >
            Discard
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isLoading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
