'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'

/**
 * API base URL for the NestJS backend
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Token limit status
 */
export interface TokenLimitStatus {
  providerId: string
  provider: string
  tokensUsed: number
  maxTokens: number
  remaining: number
  percentageUsed: number
  isWarning: boolean
  isExceeded: boolean
}

/**
 * Fetch token limit status for all providers in workspace
 */
async function fetchLimitStatus(workspaceId: string): Promise<{ data: TokenLimitStatus[] }> {
  const response = await fetch(
    `${API_BASE_URL}/api/workspaces/${workspaceId}/ai-providers/limits`,
    {
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch limits' }))
    throw new Error(error.message || 'Failed to fetch limits')
  }

  return response.json()
}

/**
 * Update token limit for a provider
 */
async function updateLimit(
  workspaceId: string,
  providerId: string,
  maxTokensPerDay: number
): Promise<{ message: string; data: TokenLimitStatus }> {
  const response = await fetch(
    `${API_BASE_URL}/api/workspaces/${workspaceId}/ai-providers/${providerId}/limit`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maxTokensPerDay }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update limit' }))
    throw new Error(error.message || 'Failed to update limit')
  }

  return response.json()
}

/**
 * Hook to fetch token limit status for all providers
 */
export function useTokenLimits() {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId

  return useQuery({
    queryKey: ['token-limits', workspaceId],
    queryFn: () => fetchLimitStatus(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30000, // 30 seconds - check limits more frequently
    refetchInterval: 60000, // Refetch every minute
  })
}

/**
 * Hook to update token limit
 */
export function useUpdateTokenLimit() {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ providerId, maxTokensPerDay }: { providerId: string; maxTokensPerDay: number }) =>
      updateLimit(workspaceId!, providerId, maxTokensPerDay),
    onSuccess: () => {
      // Invalidate and refetch limits
      queryClient.invalidateQueries({ queryKey: ['token-limits', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['ai-providers', workspaceId] })
    },
  })
}

/**
 * Get providers that have warnings or are exceeded
 */
export function useProvidersWithWarnings() {
  const { data, ...rest } = useTokenLimits()

  const warnings = data?.data?.filter((p) => p.isWarning) || []
  const exceeded = data?.data?.filter((p) => p.isExceeded) || []

  return {
    warnings,
    exceeded,
    hasWarnings: warnings.length > 0,
    hasExceeded: exceeded.length > 0,
    ...rest,
  }
}
