'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { WorkspaceWithRole } from '@hyvve/shared'

/**
 * Workspace hook for managing workspace state and switching
 */
export function useWorkspace() {
  const router = useRouter()
  const [isSwitching, setIsSwitching] = useState(false)

  /**
   * Fetch all workspaces the user belongs to
   */
  const fetchWorkspaces = useCallback(async (): Promise<WorkspaceWithRole[]> => {
    const response = await fetch('/api/workspaces')
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch workspaces')
    }

    return data.data
  }, [])

  /**
   * Switch to a different workspace
   */
  const switchWorkspace = useCallback(async (workspaceId: string): Promise<void> => {
    setIsSwitching(true)

    try {
      const response = await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to switch workspace')
      }

      // Refresh the page to reload with new workspace context
      router.refresh()
    } finally {
      setIsSwitching(false)
    }
  }, [router])

  return {
    fetchWorkspaces,
    switchWorkspace,
    isSwitching,
  }
}
