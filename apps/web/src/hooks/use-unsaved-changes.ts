'use client'

import { useEffect, useCallback } from 'react'

/**
 * Hook for tracking unsaved changes and preventing accidental navigation
 *
 * Features:
 * - Shows browser confirmation dialog on page unload when dirty
 * - Returns utility to show custom confirmation before navigation
 *
 * @param isDirty - Whether the form has unsaved changes
 */
export function useUnsavedChanges(isDirty: boolean) {
  // Handle browser tab/window close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        // Chrome requires returnValue to be set
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  /**
   * Wrap navigation callbacks to confirm before leaving with unsaved changes
   *
   * @param callback - Function to call if user confirms or no changes exist
   * @returns Whether navigation should proceed
   */
  const confirmNavigation = useCallback(
    (callback?: () => void): boolean => {
      if (isDirty) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        )
        if (confirmed) {
          callback?.()
          return true
        }
        return false
      }
      callback?.()
      return true
    },
    [isDirty]
  )

  return {
    /** Whether there are unsaved changes */
    isDirty,
    /** Confirm navigation when dirty, showing browser dialog */
    confirmNavigation,
  }
}
