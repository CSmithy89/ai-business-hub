import { useQuery } from '@tanstack/react-query'
import type { ConfidenceBreakdown } from '@hyvve/shared'
import { safeJson } from '@/lib/utils/safe-json'

/**
 * Fetch confidence breakdown for an approval item
 */
async function fetchConfidenceBreakdown(approvalId: string): Promise<ConfidenceBreakdown> {
  const response = await fetch(`/api/approvals/${approvalId}/confidence`)

  if (!response.ok) {
    throw new Error('Failed to fetch confidence breakdown')
  }

  const body = await safeJson<ConfidenceBreakdown>(response)
  if (!body) throw new Error('Failed to fetch confidence breakdown')
  return body
}

/**
 * React Query hook for fetching confidence breakdown data
 *
 * @param approvalId - The ID of the approval item
 * @returns Query result with confidence breakdown data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useConfidenceBreakdown(approvalId)
 * ```
 */
export function useConfidenceBreakdown(approvalId: string) {
  return useQuery({
    queryKey: ['confidence', approvalId],
    queryFn: () => fetchConfidenceBreakdown(approvalId),
    enabled: !!approvalId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}
