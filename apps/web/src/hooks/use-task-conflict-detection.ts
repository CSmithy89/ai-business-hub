/**
 * Task Conflict Detection Hook
 *
 * Story: PM-06.3 - Real-Time Kanban
 *
 * Detects when another user updates a task while the current user is viewing/editing it.
 * Compares local updatedAt timestamp with remote updatedAt to detect conflicts.
 * Shows a warning toast with "Reload" action button when conflict detected.
 *
 * Uses 1-second tolerance to prevent false positives from:
 * - Network latency
 * - Clock skew between client and server
 * - Database timestamp precision issues
 *
 * Only active when currentlyEditing is true (user is viewing/editing the task).
 */

'use client'

// Tolerance for timestamp comparison (milliseconds)
// Prevents false positives from network latency and clock skew
const TIMESTAMP_TOLERANCE_MS = 1000

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRealtime } from '@/lib/realtime/realtime-provider'
import { useSession } from '@/lib/auth-client'
import type { PMTaskUpdatePayload } from '@/lib/realtime/types'
import type { TaskDetailResponse } from '@/hooks/use-pm-tasks'

interface UseTaskConflictDetectionOptions {
  /** Task ID to watch for conflicts */
  taskId: string | null
  /** Whether user is currently editing this task */
  currentlyEditing: boolean
}

/**
 * Hook to detect when another user updates a task you're viewing/editing
 *
 * Usage:
 * ```tsx
 * useTaskConflictDetection({
 *   taskId: 'task-123',
 *   currentlyEditing: isEditingTask, // true when task detail modal is open or editing
 * })
 * ```
 */
export function useTaskConflictDetection({
  taskId,
  currentlyEditing,
}: UseTaskConflictDetectionOptions) {
  const queryClient = useQueryClient()
  const { socket, isConnected } = useRealtime()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId

  // Store session correlation ID in ref
  const sessionCorrelationIdRef = useRef<string | undefined>(
    (session?.session as { correlationId?: string } | undefined)?.correlationId
  )

  // Update ref when session changes
  useEffect(() => {
    sessionCorrelationIdRef.current = (session?.session as { correlationId?: string } | undefined)
      ?.correlationId
  }, [session])

  useEffect(() => {
    // Only run when socket connected, task ID provided, and user is editing
    if (!socket || !isConnected || !taskId || !currentlyEditing || !workspaceId) return

    const handleTaskUpdated = (data: PMTaskUpdatePayload) => {
      // Only care about updates to the task we're editing
      if (data.id !== taskId) return

      // Skip if this is user's own action
      if (data.correlationId && data.correlationId === sessionCorrelationIdRef.current) return

      // Get local task data from cache
      const localTask = queryClient.getQueryData([
        'pm-task',
        workspaceId,
        taskId,
      ]) as TaskDetailResponse | undefined

      if (!localTask?.data) return

      // Compare timestamps to detect conflict (with tolerance for network latency)
      const localUpdatedAt = new Date(localTask.data.updatedAt).getTime()
      const remoteUpdatedAt = new Date(data.updatedAt).getTime()
      const timeDifference = remoteUpdatedAt - localUpdatedAt

      // Only trigger conflict if remote is significantly newer (beyond tolerance)
      if (timeDifference > TIMESTAMP_TOLERANCE_MS) {
        // Conflict detected - remote is newer than local by more than tolerance
        toast.warning('This task was updated by another user', {
          description: 'Your changes may conflict. Click Reload to see the latest version.',
          action: {
            label: 'Reload',
            onClick: () => {
              queryClient.invalidateQueries({
                queryKey: ['pm-task', workspaceId, taskId],
              })
            },
          },
          duration: 10000, // Show for 10 seconds
        })
      }
    }

    // Subscribe to task update events
    socket.on('pm.task.updated', handleTaskUpdated)

    // Cleanup
    return () => {
      socket.off('pm.task.updated', handleTaskUpdated)
    }
  }, [socket, isConnected, taskId, currentlyEditing, workspaceId, queryClient])
}
