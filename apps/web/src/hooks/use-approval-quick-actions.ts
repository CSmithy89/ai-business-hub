'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ApprovalItem } from '@hyvve/shared'
import { apiPost } from '@/lib/api-client'
import { NESTJS_API_URL } from '@/lib/api-config'

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
 * Action type for approval operations
 */
type ApprovalActionType = 'approve' | 'reject'

/**
 * Perform an approval action (approve or reject)
 *
 * Uses apiPost to automatically include CSRF token for protection
 * against cross-site request forgery attacks.
 *
 * @param id - Approval item ID
 * @param action - Action type ('approve' or 'reject')
 * @param data - Optional request body with notes
 * @returns Promise with the updated approval item
 */
async function performApprovalAction(
  id: string,
  action: ApprovalActionType,
  data: ApprovalActionRequest = {}
): Promise<ApprovalResponse> {
  let response: Response

  try {
    response = await apiPost(`/api/approvals/${id}/${action}`, data, {
      baseURL: NESTJS_API_URL,
    })
  } catch (err) {
    // Network error - API server may not be running
    console.error(`[ApprovalService] Network error during ${action}:`, err)
    throw new Error('Unable to connect to approval service. Please try again later.')
  }

  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`[ApprovalService] ${action} endpoint not found (404) - backend may not be configured`)
      throw new Error('Approval endpoint not found. Backend may not be configured.')
    }
    const error = await response.json().catch(() => ({ message: `Failed to ${action}` }))
    throw new Error(error.message || `Failed to ${action}`)
  }

  return response.json()
}

/**
 * Approve an approval item
 */
async function approveApproval(id: string, data: ApprovalActionRequest = {}): Promise<ApprovalResponse> {
  return performApprovalAction(id, 'approve', data)
}

/**
 * Reject an approval item
 */
async function rejectApproval(id: string, data: ApprovalActionRequest = {}): Promise<ApprovalResponse> {
  return performApprovalAction(id, 'reject', data)
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
