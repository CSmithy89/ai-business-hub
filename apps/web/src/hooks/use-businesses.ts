/**
 * React Query hook for fetching businesses
 *
 * Story: 08.2 - Implement Portfolio Dashboard with Business Cards
 */

import { useQuery } from '@tanstack/react-query'
import type { Business } from '@hyvve/db'

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
