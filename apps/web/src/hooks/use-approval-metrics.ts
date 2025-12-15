'use client'

import { useQuery } from '@tanstack/react-query'
import { API_ENDPOINTS, IS_MOCK_DATA_ENABLED, CACHE_DURATIONS } from '@/lib/api-config'
import { safeJson } from '@/lib/utils/safe-json'

/**
 * Approval metrics data structure
 */
export interface ApprovalMetrics {
  /** Number of items pending review */
  pendingCount: number
  /** Number of items auto-approved today */
  autoApprovedToday: number
  /** Average response time in hours */
  avgResponseTime: number
  /** Approval rate as percentage (0-100) */
  approvalRate: number
}

/**
 * Response type from the metrics API
 */
interface ApprovalMetricsResponse {
  data: ApprovalMetrics
}

/**
 * Fetch approval metrics from the API
 */
async function fetchApprovalMetrics(): Promise<ApprovalMetrics> {
  const response = await fetch(API_ENDPOINTS.metrics.approvals(), {
    credentials: 'include',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const error =
      body && typeof body === 'object' && 'error' in body && typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : undefined
    throw new Error(error || 'Failed to fetch metrics')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to fetch metrics')
  return (body as ApprovalMetricsResponse).data
}

/**
 * Hook for fetching approval metrics with caching
 *
 * Features:
 * - 5-minute cache (staleTime)
 * - Auto-refetch every 5 minutes
 * - React Query integration for optimistic updates
 *
 * @example
 * const { data: metrics, isLoading, error } = useApprovalMetrics()
 */
/**
 * Result type including mock data indicator
 */
export interface UseApprovalMetricsResult {
  data: ApprovalMetrics | undefined
  isLoading: boolean
  error: Error | null
  /** Whether the data is mock/demo data */
  isMockData: boolean
}

export function useApprovalMetrics(): UseApprovalMetricsResult {
  const query = useQuery<ApprovalMetrics>({
    queryKey: ['approval-metrics'],
    queryFn: fetchApprovalMetrics,
    staleTime: CACHE_DURATIONS.METRICS,
    refetchInterval: CACHE_DURATIONS.METRICS,
    retry: 3,
    refetchOnWindowFocus: false, // Don't refetch on focus (too expensive)
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isMockData: IS_MOCK_DATA_ENABLED,
  }
}
