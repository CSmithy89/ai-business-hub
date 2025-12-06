'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ApprovalItem } from '@hyvve/shared'
import { API_ENDPOINTS } from '@/lib/api-config'

/**
 * Request body for approve/reject actions
 */
export interface ApprovalActionRequest {
  notes?: string
}

/**
 * Response type for single approval endpoint
 */
export interface ApprovalResponse {
  data: ApprovalItem
}

/**
 * Approve an approval item
 */
async function approveApproval(id: string, data: ApprovalActionRequest = {}): Promise<ApprovalResponse> {
  let response: Response

  try {
    response = await fetch(API_ENDPOINTS.approvals.approve(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
  } catch (err) {
    // Network error - API server may not be running
    console.error('[ApprovalService] Network error during approve:', err)
    throw new Error('Unable to connect to approval service. Please try again later.')
  }

  if (!response.ok) {
    if (response.status === 404) {
      console.warn('[ApprovalService] Approve endpoint not found (404) - backend may not be configured')
      throw new Error('Approval endpoint not found. Backend may not be configured.')
    }
    const error = await response.json().catch(() => ({ message: 'Failed to approve' }))
    throw new Error(error.message || 'Failed to approve')
  }

  return response.json()
}

/**
 * Reject an approval item
 */
async function rejectApproval(id: string, data: ApprovalActionRequest = {}): Promise<ApprovalResponse> {
  let response: Response

  try {
    response = await fetch(API_ENDPOINTS.approvals.reject(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
  } catch (err) {
    // Network error - API server may not be running
    console.error('[ApprovalService] Network error during reject:', err)
    throw new Error('Unable to connect to approval service. Please try again later.')
  }

  if (!response.ok) {
    if (response.status === 404) {
      console.warn('[ApprovalService] Reject endpoint not found (404) - backend may not be configured')
      throw new Error('Approval endpoint not found. Backend may not be configured.')
    }
    const error = await response.json().catch(() => ({ message: 'Failed to reject' }))
    throw new Error(error.message || 'Failed to reject')
  }

  return response.json()
}

/**
 * Hook for quick approval actions with optimistic updates and toast notifications
 *
 * This hook provides approve/reject mutations with:
 * - Optimistic UI updates for instant feedback
 * - Automatic rollback on error
 * - Toast notifications for success/error states
 * - Query cache invalidation to update approval counts
 */
export function useApprovalQuickActions() {
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApprovalActionRequest }) =>
      approveApproval(id, data),

    // Optimistic update
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['approvals'] })

      // Snapshot previous value
      const previousApprovals = queryClient.getQueryData(['approvals'])

      // Optimistically update to the new value
      queryClient.setQueriesData<{ data: ApprovalItem[]; meta: Record<string, unknown> }>(
        { queryKey: ['approvals'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === id
                ? { ...item, status: 'approved' as const, reviewedAt: new Date() }
                : item
            ),
          }
        }
      )

      return { previousApprovals }
    },

    // Success handler
    onSuccess: (response) => {
      toast.success('Approved successfully', {
        description: `${response.data.title} has been approved.`,
      })

      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: ['approval', response.data.id] })
    },

    // Error handler with rollback
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousApprovals) {
        queryClient.setQueryData(['approvals'], context.previousApprovals)
      }

      toast.error('Failed to approve', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApprovalActionRequest }) =>
      rejectApproval(id, data),

    // Optimistic update
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['approvals'] })

      // Snapshot previous value
      const previousApprovals = queryClient.getQueryData(['approvals'])

      // Optimistically update to the new value
      queryClient.setQueriesData<{ data: ApprovalItem[]; meta: Record<string, unknown> }>(
        { queryKey: ['approvals'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === id
                ? { ...item, status: 'rejected' as const, reviewedAt: new Date() }
                : item
            ),
          }
        }
      )

      return { previousApprovals }
    },

    // Success handler
    onSuccess: (response) => {
      toast.success('Rejected successfully', {
        description: `${response.data.title} has been rejected.`,
      })

      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: ['approval', response.data.id] })
    },

    // Error handler with rollback
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousApprovals) {
        queryClient.setQueryData(['approvals'], context.previousApprovals)
      }

      toast.error('Failed to reject', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
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
