'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApprovalItem, ApprovalStatus } from '@hyvve/shared'
import { NESTJS_API_URL, NEXTJS_API_URL } from '@/lib/api-config'
import { toast } from 'sonner'
import { useRealtimeApprovals } from './use-realtime-approvals'
import { safeJson } from '@/lib/utils/safe-json'

/**
 * Query parameters for fetching approvals list
 */
export interface ApprovalFilters {
  status?: ApprovalStatus
  type?: string
  priority?: number
  assignedTo?: string
  sortBy?: 'createdAt' | 'dueAt' | 'priority'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

/**
 * Response type for list approvals endpoint
 */
export interface ApprovalsListResponse {
  data: ApprovalItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Response type for single approval endpoint
 */
export interface ApprovalResponse {
  data: ApprovalItem
}

/**
 * Request body for approve/reject actions
 */
export interface ApprovalActionRequest {
  notes?: string
}

/**
 * Fetch approvals list with filtering and pagination
 *
 * Uses the Next.js API route which handles:
 * - Proxying to NestJS backend when available
 * - Falling back to demo data when backend is unavailable
 *
 * Updated: Story 15.5 - Added demo data fallback support
 */
async function fetchApprovals(filters: ApprovalFilters = {}): Promise<ApprovalsListResponse> {
  const params = new URLSearchParams()

  // Add filters to query params
  if (filters.status) params.append('status', filters.status)
  if (filters.type) params.append('type', filters.type)
  if (filters.priority !== undefined) params.append('priority', filters.priority.toString())
  if (filters.assignedTo) params.append('assignedTo', filters.assignedTo)
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  // Use Next.js API route (provides demo fallback)
  const url = `${NEXTJS_API_URL}/api/approvals${params.toString() ? `?${params.toString()}` : ''}`

  const response = await fetch(url, {
    credentials: 'include', // Include cookies for session
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to fetch approvals')
  }

  if (!body || typeof body !== 'object' || !('data' in body) || !('meta' in body)) {
    throw new Error('Failed to fetch approvals')
  }
  return body as ApprovalsListResponse
}

/**
 * Fetch a single approval by ID
 */
async function fetchApproval(id: string): Promise<ApprovalResponse> {
  const response = await fetch(`${NESTJS_API_URL}/api/approvals/${encodeURIComponent(id)}`, {
    credentials: 'include',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to fetch approval')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to fetch approval')
  return body as ApprovalResponse
}

/**
 * Approve an approval item
 */
async function approveApproval(id: string, data: ApprovalActionRequest = {}): Promise<ApprovalResponse> {
  const response = await fetch(`${NESTJS_API_URL}/api/approvals/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to approve')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to approve')
  return body as ApprovalResponse
}

/**
 * Reject an approval item
 */
async function rejectApproval(id: string, data: ApprovalActionRequest = {}): Promise<ApprovalResponse> {
  const response = await fetch(`${NESTJS_API_URL}/api/approvals/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to reject')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to reject')
  return body as ApprovalResponse
}

/**
 * Hook to fetch approvals list with filters
 *
 * Story 16-15: Now includes real-time updates via WebSocket.
 * When connected, approvals are updated in real-time without polling.
 */
export function useApprovals(filters: ApprovalFilters = {}) {
  // Enable real-time updates for approvals
  const { isConnected: isRealtimeConnected } = useRealtimeApprovals()

  return useQuery({
    queryKey: ['approvals', filters],
    queryFn: () => fetchApprovals(filters),
    // When real-time is connected, we rely on WebSocket updates
    // so we can use a longer stale time to reduce polling
    staleTime: isRealtimeConnected ? 60000 : 30000,
    refetchOnWindowFocus: true,
    // Disable refetch interval when real-time is connected
    refetchInterval: isRealtimeConnected ? false : undefined,
  })
}

/**
 * Hook to fetch a single approval by ID
 */
export function useApproval(id: string) {
  return useQuery({
    queryKey: ['approval', id],
    queryFn: () => fetchApproval(id),
    enabled: !!id, // Only fetch if ID is provided
  })
}

/**
 * Request body for bulk approve/reject actions
 */
export interface BulkApprovalRequest {
  ids: string[]
  action: 'approve' | 'reject'
  notes?: string
  reason?: string // Required for reject actions
}

/**
 * Response type for bulk approval endpoint
 */
export interface BulkApprovalResponse {
  succeeded: string[]
  failed: { id: string; error: string }[]
}

/**
 * Bulk approve or reject multiple approval items
 */
async function bulkApproval(data: BulkApprovalRequest): Promise<BulkApprovalResponse> {
  const response = await fetch(`${NESTJS_API_URL}/api/approvals/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to process bulk action')
  }

  if (!body || typeof body !== 'object' || !('succeeded' in body) || !('failed' in body)) {
    throw new Error('Failed to process bulk action')
  }
  return body as BulkApprovalResponse
}

/**
 * Hook to get mutation functions for approval actions with optimistic updates
 *
 * Story 16-6: Implement Optimistic UI Updates
 * - Approvals update immediately in the UI
 * - Rollback on error with toast notification
 * - Subtle loading indicator via isPending states
 *
 * FIX: Query key includes filters, so we use fuzzy matching to update all
 * cached queries that start with ['approvals'] regardless of filter params.
 */
export function useApprovalMutations() {
  const queryClient = useQueryClient()

  // Helper to get all approval list caches for rollback
  const getAllApprovalCaches = () => {
    const cache = queryClient.getQueryCache()
    const queries = cache.findAll({ queryKey: ['approvals'] })
    return queries.map((query) => ({
      queryKey: query.queryKey,
      data: query.state.data as ApprovalsListResponse | undefined,
    }))
  }

  // Helper to update approval status in all cached queries
  const updateApprovalInAllCaches = (id: string, newStatus: ApprovalStatus) => {
    const cache = queryClient.getQueryCache()
    const queries = cache.findAll({ queryKey: ['approvals'] })

    queries.forEach((query) => {
      const data = query.state.data as ApprovalsListResponse | undefined
      if (data?.data) {
        queryClient.setQueryData<ApprovalsListResponse>(query.queryKey, {
          ...data,
          data: data.data.map((item) =>
            item.id === id
              ? { ...item, status: newStatus, reviewedAt: new Date().toISOString() }
              : item
          ),
        })
      }
    })
  }

  // Optimistic approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApprovalActionRequest }) =>
      approveApproval(id, data),

    // OPTIMISTIC UPDATE: Update all cached queries before server responds
    onMutate: async ({ id }) => {
      // Cancel all in-flight approval queries
      await queryClient.cancelQueries({ queryKey: ['approvals'] })

      // Store previous state of all cached queries for rollback
      const previousCaches = getAllApprovalCaches()

      // Also store individual approval cache
      const previousApproval = queryClient.getQueryData<ApprovalResponse>(['approval', id])

      // Optimistically update all cached queries
      updateApprovalInAllCaches(id, 'approved' as ApprovalStatus)

      // Optimistically update individual approval cache
      if (previousApproval) {
        queryClient.setQueryData<ApprovalResponse>(['approval', id], {
          ...previousApproval,
          data: { ...previousApproval.data, status: 'approved' as ApprovalStatus, reviewedAt: new Date().toISOString() },
        })
      }

      return { previousCaches, previousApproval }
    },

    // ROLLBACK: Restore all previous states on error
    onError: (_error, { id }, context) => {
      if (context?.previousCaches) {
        context.previousCaches.forEach(({ queryKey, data }) => {
          if (data) {
            queryClient.setQueryData(queryKey, data)
          }
        })
      }
      if (context?.previousApproval) {
        queryClient.setQueryData(['approval', id], context.previousApproval)
      }
      toast.error('Failed to approve. Please try again.')
    },

    onSuccess: (response) => {
      toast.success('Approval granted')
      queryClient.setQueryData(['approval', response.data.id], response)
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })

  // Optimistic reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApprovalActionRequest }) =>
      rejectApproval(id, data),

    // OPTIMISTIC UPDATE: Update all cached queries before server responds
    onMutate: async ({ id }) => {
      // Cancel all in-flight approval queries
      await queryClient.cancelQueries({ queryKey: ['approvals'] })

      // Store previous state of all cached queries for rollback
      const previousCaches = getAllApprovalCaches()

      // Also store individual approval cache
      const previousApproval = queryClient.getQueryData<ApprovalResponse>(['approval', id])

      // Optimistically update all cached queries
      updateApprovalInAllCaches(id, 'rejected' as ApprovalStatus)

      // Optimistically update individual approval cache
      if (previousApproval) {
        queryClient.setQueryData<ApprovalResponse>(['approval', id], {
          ...previousApproval,
          data: { ...previousApproval.data, status: 'rejected' as ApprovalStatus, reviewedAt: new Date().toISOString() },
        })
      }

      return { previousCaches, previousApproval }
    },

    // ROLLBACK: Restore all previous states on error
    onError: (_error, { id }, context) => {
      if (context?.previousCaches) {
        context.previousCaches.forEach(({ queryKey, data }) => {
          if (data) {
            queryClient.setQueryData(queryKey, data)
          }
        })
      }
      if (context?.previousApproval) {
        queryClient.setQueryData(['approval', id], context.previousApproval)
      }
      toast.error('Failed to reject. Please try again.')
    },

    onSuccess: (response) => {
      toast.success('Approval rejected')
      queryClient.setQueryData(['approval', response.data.id], response)
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })

  return {
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    approveError: approveMutation.error,
    rejectError: rejectMutation.error,
  }
}

/**
 * Hook for bulk approval/reject operations
 */
export function useBulkApprovalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkApproval,
    onSuccess: (response) => {
      // Invalidate approvals list to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['approvals'] })

      // If all succeeded, also invalidate individual approval caches
      if (response.succeeded.length > 0) {
        response.succeeded.forEach(id => {
          queryClient.invalidateQueries({ queryKey: ['approval', id] })
        })
      }
    },
  })
}
