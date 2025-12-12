/**
 * React Query hook for fetching and managing businesses
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 * Story: 16.6 - Implement Optimistic UI Updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Business } from '@hyvve/db'
import { toast } from 'sonner'

/**
 * Business API error with typed error code
 */
export interface BusinessError extends Error {
  code?: 'UNAUTHORIZED' | 'NO_WORKSPACE' | 'INTERNAL_ERROR'
}

/**
 * Fetch all businesses for the current workspace
 */
export function useBusinesses() {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const res = await fetch('/api/businesses', {
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch businesses' }))
        const error: BusinessError = new Error(errorData.message || 'Failed to fetch businesses')
        error.code = errorData.error
        throw error
      }

      const json = await res.json()
      return json.data as Business[]
    },
    staleTime: 30000, // 30 seconds - businesses don't change frequently
    refetchOnWindowFocus: true,
  })
}

/**
 * Update business data (partial update)
 */
async function updateBusiness(id: string, data: Partial<Business>): Promise<Business> {
  const res = await fetch(`/api/businesses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Failed to update business' }))
    throw new Error(errorData.message || 'Failed to update business')
  }

  const json = await res.json()
  return json.data as Business
}

/**
 * Hook for business mutation operations with optimistic updates
 *
 * Story 16.6: Implement Optimistic UI Updates
 * - Business status changes show immediately
 * - Rollback on error with toast notification
 * - Supports any business field update
 */
export function useBusinessMutations() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Business> }) =>
      updateBusiness(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['businesses'] })
      const previousData = queryClient.getQueryData<Business[]>(['businesses'])

      if (Array.isArray(previousData)) {
        queryClient.setQueryData<Business[]>(['businesses'],
          previousData.map((business) =>
            business.id === id
              ? { ...business, ...data, updatedAt: new Date() }
              : business
          )
        )
      }

      return { previousData }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['businesses'], context.previousData)
      }
      toast.error('Failed to update business')
    },

    onSuccess: (_, variables) => {
      if ('stage' in variables.data) {
        toast.success(`Business stage updated to ${variables.data.stage}`)
      } else {
        toast.success('Business updated')
      }
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })

  return {
    updateBusiness: updateMutation.mutate,
    updateBusinessAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}
