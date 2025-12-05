'use client'

import { useQuery } from '@tanstack/react-query'

/**
 * API base URL for the Next.js API routes
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

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
  const response = await fetch(`${API_BASE_URL}/api/approvals/metrics`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch metrics' }))
    throw new Error(error.error || 'Failed to fetch metrics')
  }

  const json: ApprovalMetricsResponse = await response.json()
  return json.data
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
export function useApprovalMetrics() {
  return useQuery<ApprovalMetrics>({
    queryKey: ['approval-metrics'],
    queryFn: fetchApprovalMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 3,
    refetchOnWindowFocus: false, // Don't refetch on focus (too expensive)
  })
}
