/**
 * Real-Time Kanban Hook
 *
 * Story: PM-06.3 - Real-Time Kanban
 *
 * Subscribes to WebSocket PM task events and updates React Query cache:
 * - pm.task.created - Invalidate to refetch with new task
 * - pm.task.updated - Update cache in place or invalidate if status changed
 * - pm.task.deleted - Remove from cache
 * - pm.task.status_changed - Invalidate to refetch (task moved between columns)
 *
 * Skips cache updates for user's own actions (correlationId matching).
 * Shows toast notifications for external updates from teammates.
 */

'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRealtime } from '@/lib/realtime/realtime-provider'
import { useSession } from '@/lib/auth-client'
import type {
  PMTaskEventPayload,
  PMTaskUpdatePayload,
  PMTaskDeletedPayload,
  PMTaskStatusPayload,
} from '@/lib/realtime/types'

interface UseRealtimeKanbanOptions {
  /** Project ID to filter events */
  projectId: string
  /** Optional phase ID to filter events */
  phaseId?: string
  /** Whether real-time updates are enabled */
  enabled?: boolean
}

/**
 * Hook to enable real-time Kanban board updates via WebSocket
 *
 * Usage:
 * ```tsx
 * useRealtimeKanban({
 *   projectId: 'proj-123',
 *   phaseId: 'phase-456', // optional
 *   enabled: true,
 * })
 * ```
 */
export function useRealtimeKanban({
  projectId,
  phaseId,
  enabled = true,
}: UseRealtimeKanbanOptions) {
  const queryClient = useQueryClient()
  const { socket, isConnected } = useRealtime()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId

  // Store session correlation ID in ref to avoid it triggering effect re-runs
  const sessionCorrelationIdRef = useRef<string | undefined>(
    (session?.session as { correlationId?: string } | undefined)?.correlationId
  )

  // Update ref when session changes
  useEffect(() => {
    sessionCorrelationIdRef.current = (session?.session as { correlationId?: string } | undefined)
      ?.correlationId
  }, [session])

  useEffect(() => {
    if (!socket || !isConnected || !enabled || !workspaceId) return

    // ========================================
    // Handler: pm.task.created
    // ========================================
    const handleTaskCreated = (data: PMTaskEventPayload) => {
      // Filter by project/phase
      if (data.projectId !== projectId) return
      if (phaseId && data.phaseId !== phaseId) return

      // Skip if this is user's own action
      if (data.correlationId && data.correlationId === sessionCorrelationIdRef.current) return

      // Invalidate Kanban query to refetch with new task
      queryClient.invalidateQueries({
        queryKey: ['pm-tasks', workspaceId, projectId],
        exact: false, // Match all queries starting with these keys
      })

      // Show toast notification
      toast.info('New task created', {
        description: data.title,
      })
    }

    // ========================================
    // Handler: pm.task.updated
    // ========================================
    const handleTaskUpdated = (data: PMTaskUpdatePayload) => {
      // Filter by project/phase
      if (data.projectId !== projectId) return
      if (phaseId && data.phaseId !== phaseId) return

      // Skip if this is user's own action
      if (data.correlationId && data.correlationId === sessionCorrelationIdRef.current) return

      // Invalidate all task queries to refetch
      queryClient.invalidateQueries({
        queryKey: ['pm-tasks', workspaceId, projectId],
        exact: false, // Match all queries starting with these keys
      })

      // Show toast notification
      toast.info('Task updated', {
        description: data.title || 'Task details changed',
      })
    }

    // ========================================
    // Handler: pm.task.deleted
    // ========================================
    const handleTaskDeleted = (data: PMTaskDeletedPayload) => {
      // Filter by project/phase
      if (data.projectId !== projectId) return
      if (phaseId && data.phaseId !== phaseId) return

      // Skip if this is user's own action
      if (data.correlationId && data.correlationId === sessionCorrelationIdRef.current) return

      // Invalidate to refetch (removes deleted task)
      queryClient.invalidateQueries({
        queryKey: ['pm-tasks', workspaceId, projectId],
        exact: false, // Match all queries starting with these keys
      })

      // Show toast notification
      toast.info('Task deleted', {
        description: data.title,
      })
    }

    // ========================================
    // Handler: pm.task.status_changed
    // ========================================
    const handleTaskStatusChanged = (data: PMTaskStatusPayload) => {
      // Filter by project/phase
      if (data.projectId !== projectId) return
      if (phaseId && data.phaseId !== phaseId) return

      // Skip if this is user's own action
      if (data.correlationId && data.correlationId === sessionCorrelationIdRef.current) return

      // Invalidate to refetch (task moved between columns)
      queryClient.invalidateQueries({
        queryKey: ['pm-tasks', workspaceId, projectId],
        exact: false, // Match all queries starting with these keys
      })

      // Show toast notification
      toast.info('Task moved', {
        description: `${data.title} moved to ${data.toStatus}`,
      })
    }

    // Subscribe to events
    socket.on('pm.task.created', handleTaskCreated)
    socket.on('pm.task.updated', handleTaskUpdated)
    socket.on('pm.task.deleted', handleTaskDeleted)
    socket.on('pm.task.status_changed', handleTaskStatusChanged)

    // Cleanup
    return () => {
      socket.off('pm.task.created', handleTaskCreated)
      socket.off('pm.task.updated', handleTaskUpdated)
      socket.off('pm.task.deleted', handleTaskDeleted)
      socket.off('pm.task.status_changed', handleTaskStatusChanged)
    }
  }, [socket, isConnected, projectId, phaseId, enabled, workspaceId, queryClient])
}
