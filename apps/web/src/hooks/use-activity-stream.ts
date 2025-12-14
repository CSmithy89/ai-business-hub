'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { safeJson } from '@/lib/utils/safe-json'

interface AgentActivity {
  id: string
  agentId: string
  agentName: string
  workspaceId: string
  type: 'task_started' | 'task_completed' | 'approval_requested' | 'approval_processed' | 'error' | 'config_changed'
  action: string
  module: string
  entityId?: string
  entityType?: string
  status: 'pending' | 'completed' | 'failed'
  confidenceScore?: number
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  startedAt: string
  completedAt?: string
  duration?: number
  createdAt: string
}

interface ActivityFilters {
  agentId?: string
  type?: string
  status?: string
}

interface UseActivityStreamResult {
  activities: AgentActivity[]
  newCount: number
  isConnected: boolean
  isLoading: boolean
  error: Error | null
  clearNewCount: () => void
  loadMore: () => void
  hasMore: boolean
}

/**
 * useActivityStream Hook
 *
 * Manages real-time activity stream with SSE or polling fallback.
 * Provides automatic reconnection and infinite scroll support.
 *
 * @param filters - Optional filters for activities
 */
export function useActivityStream(filters?: ActivityFilters): UseActivityStreamResult {
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [newCount, setNewCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  /**
   * Fetch activities from API with pagination and filters
   */
  const fetchActivities = useCallback(
    async (pageNum: number) => {
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: '20',
        })

        if (filters?.agentId) params.append('agent', filters.agentId)
        if (filters?.type) params.append('type', filters.type)
        if (filters?.status) params.append('status', filters.status)

        const response = await fetch(`/api/agents/activity?${params}`)

        if (!response.ok) {
          throw new Error('Failed to fetch activities')
        }

        const data = await safeJson<{
          data: AgentActivity[]
          meta: { page: number; totalPages: number }
        }>(response)
        if (!data) throw new Error('Failed to fetch activities')

        if (pageNum === 1) {
          setActivities(data.data)
        } else {
          setActivities(prev => [...prev, ...data.data])
        }

        setHasMore(data.meta.page < data.meta.totalPages)
        setIsLoading(false)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setIsLoading(false)
      }
    },
    [filters]
  )

  /**
   * Start polling fallback (defined first to avoid circular dependency)
   */
  const startPolling = useCallback(() => {
    console.log('Starting polling fallback (10s interval)')

    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Poll every 10 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchActivities(1)
    }, 10000)

    // Initial fetch
    fetchActivities(1)
  }, [fetchActivities])

  /**
   * Connect to SSE stream for real-time updates
   */
  const connectSSE = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = new EventSource('/api/agents/activity/stream')

      eventSource.onopen = () => {
        setIsConnected(true)
        reconnectAttempts.current = 0
        console.log('SSE connection established')
      }

      eventSource.onmessage = event => {
        try {
          const activity = JSON.parse(event.data)
          setActivities(prev => [activity, ...prev])
          setNewCount(prev => prev + 1)
        } catch (err) {
          console.error('Error parsing SSE message:', err)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        eventSource.close()
        console.error('SSE connection error, falling back to polling')

        // Exponential backoff for reconnection
        const backoffDelay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000)
        reconnectAttempts.current += 1

        reconnectTimeoutRef.current = setTimeout(() => {
          if (reconnectAttempts.current < 5) {
            console.log(`Attempting SSE reconnection (${reconnectAttempts.current}/5)`)
            connectSSE()
          } else {
            // Fall back to polling after 5 failed attempts
            startPolling()
          }
        }, backoffDelay)
      }

      eventSourceRef.current = eventSource
    } catch (err) {
      console.error('Error creating SSE connection:', err)
      startPolling()
    }
  }, [startPolling])

  /**
   * Clear new activity count
   */
  const clearNewCount = useCallback(() => {
    setNewCount(0)
  }, [])

  /**
   * Load more activities (infinite scroll)
   */
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchActivities(nextPage)
    }
  }, [page, isLoading, hasMore, fetchActivities])

  /**
   * Initialize connection on mount
   */
  useEffect(() => {
    // Initial data fetch
    fetchActivities(1)

    // Try SSE connection
    connectSSE()

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [fetchActivities, connectSSE])

  /**
   * Refetch when filters change
   */
  useEffect(() => {
    setPage(1)
    setActivities([])
    setIsLoading(true)
    fetchActivities(1)
  }, [filters, fetchActivities])

  return {
    activities,
    newCount,
    isConnected,
    isLoading,
    error,
    clearNewCount,
    loadMore,
    hasMore,
  }
}
