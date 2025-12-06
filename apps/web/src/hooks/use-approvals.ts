'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApprovalItem, ApprovalStatus } from '@hyvve/shared'
import { NESTJS_API_URL } from '@/lib/api-config'

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

  const url = `${NESTJS_API_URL}/api/approvals${params.toString() ? `?${params.toString()}` : ''}`

  const response = await fetch(url, {
    credentials: 'include', // Include cookies for session
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch approvals' }))
    throw new Error(error.message || 'Failed to fetch approvals')
  }

  return response.json()
}

/**
 * Fetch a single approval by ID
 */
async function fetchApproval(id: string): Promise<ApprovalResponse> {
  const response = await fetch(`${NESTJS_API_URL}/api/approvals/${id}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch approval' }))
    throw new Error(error.message || 'Failed to fetch approval')
  }

  return response.json()
}

/**
 * Approve an approval item
 */
async function approveApproval(id: string, data: ApprovalActionRequest = {}): Promise<ApprovalResponse> {
  const response = await fetch(`${NESTJS_API_URL}/api/approvals/${id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to approve' }))
    throw new Error(error.message || 'Failed to approve')
  }

  return response.json()
}

/**
 * Reject an approval item
 */
async function rejectApproval(id: string, data: ApprovalActionRequest = {}): Promise<ApprovalResponse> {
  const response = await fetch(`${NESTJS_API_URL}/api/approvals/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to reject' }))
    throw new Error(error.message || 'Failed to reject')
  }

  return response.json()
}

/**
 * Hook to fetch approvals list with filters
 */
export function useApprovals(filters: ApprovalFilters = {}) {
  return useQuery({
    queryKey: ['approvals', filters],
    queryFn: () => fetchApprovals(filters),
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to process bulk action' }))
    throw new Error(error.message || 'Failed to process bulk action')
  }

  return response.json()
}

/**
 * Hook to get mutation functions for approval actions
 */
export function useApprovalMutations() {
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApprovalActionRequest }) =>
      approveApproval(id, data),
    onSuccess: (response) => {
      // Invalidate and refetch approvals list
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      // Update single approval cache
      queryClient.setQueryData(['approval', response.data.id], response)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApprovalActionRequest }) =>
      rejectApproval(id, data),
    onSuccess: (response) => {
      // Invalidate and refetch approvals list
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      // Update single approval cache
      queryClient.setQueryData(['approval', response.data.id], response)
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
