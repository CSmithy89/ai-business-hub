'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StalePageDto, BulkActionResponse } from '@hyvve/shared'

/**
 * Hook to fetch stale pages needing review
 * Admin-only access
 */
export function useStalPages() {
  return useQuery<StalePageDto[]>({
    queryKey: ['kb', 'stale'],
    queryFn: async () => {
      const res = await fetch('/api/kb/verification/stale', {
        credentials: 'include',
      })

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Admin access required')
        }
        throw new Error('Failed to fetch stale pages')
      }

      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 403 (permission denied)
      if (error instanceof Error && error.message.includes('Admin access')) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook to bulk verify multiple pages
 */
export function useBulkVerify() {
  const queryClient = useQueryClient()

  return useMutation<
    BulkActionResponse,
    Error,
    { pageIds: string[]; expiresIn: '30d' | '60d' | '90d' | 'never' }
  >({
    mutationFn: async ({ pageIds, expiresIn }) => {
      const res = await fetch('/api/kb/verification/bulk-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pageIds, expiresIn }),
      })

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Admin access required')
        }
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Bulk verify failed')
      }

      return res.json()
    },
    onSuccess: () => {
      // Invalidate stale pages list to refresh after bulk action
      queryClient.invalidateQueries({ queryKey: ['kb', 'stale'] })
      // Also invalidate general KB pages list in case it's displayed elsewhere
      queryClient.invalidateQueries({ queryKey: ['kb', 'pages'] })
    },
  })
}

/**
 * Hook to bulk delete multiple pages
 */
export function useBulkDelete() {
  const queryClient = useQueryClient()

  return useMutation<BulkActionResponse, Error, { pageIds: string[] }>({
    mutationFn: async ({ pageIds }) => {
      const res = await fetch('/api/kb/verification/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pageIds }),
      })

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Admin access required')
        }
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Bulk delete failed')
      }

      return res.json()
    },
    onSuccess: () => {
      // Invalidate stale pages list to refresh after bulk action
      queryClient.invalidateQueries({ queryKey: ['kb', 'stale'] })
      // Also invalidate general KB pages list in case it's displayed elsewhere
      queryClient.invalidateQueries({ queryKey: ['kb', 'pages'] })
    },
  })
}
