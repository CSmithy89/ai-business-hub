'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { safeJson } from '@/lib/utils/safe-json'

function getSessionToken(session: unknown): string | undefined {
  const direct = (session as { token?: string } | null)?.token
  const nested = (session as { session?: { token?: string } } | null)?.session?.token
  return direct || nested || undefined
}

function getNestBaseUrl(): string {
  const base = NESTJS_API_URL?.replace(/\/$/, '')
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured')
  }
  return base
}

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
async function fetchLimitStatus(
  workspaceId: string,
  token: string | undefined
): Promise<{ data: TokenLimitStatus[] }> {
  const base = getNestBaseUrl()
  const response = await fetch(`${base}/workspaces/${encodeURIComponent(workspaceId)}/ai-providers/limits`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    const error = (await safeJson<{ message?: string }>(response)) || { message: 'Failed to fetch limits' }
    throw new Error(error.message || 'Failed to fetch limits')
  }

  const data = await safeJson<{ data?: TokenLimitStatus[] }>(response)
  return { data: data?.data || [] }
}

/**
 * Update token limit for a provider
 */
async function updateLimit(
  workspaceId: string,
  providerId: string,
  maxTokensPerDay: number,
  token: string | undefined
): Promise<{ message: string; data: TokenLimitStatus }> {
  const base = getNestBaseUrl()
  const response = await fetch(
    `${base}/workspaces/${encodeURIComponent(workspaceId)}/ai-providers/${encodeURIComponent(providerId)}/limit`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ maxTokensPerDay }),
    }
  )

  if (!response.ok) {
    const error = (await safeJson<{ message?: string }>(response)) || { message: 'Failed to update limit' }
    throw new Error(error.message || 'Failed to update limit')
  }

  const data = await safeJson<{ message?: string; data?: TokenLimitStatus }>(response)
  if (!data?.data) throw new Error(data?.message || 'Failed to update limit')
  return { message: data.message || 'Updated', data: data.data }
}

/**
 * Hook to fetch token limit status for all providers
 */
export function useTokenLimits() {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery<{ data: TokenLimitStatus[] }>({
    queryKey: ['token-limits', workspaceId],
    queryFn: ({ queryKey }) => {
      const [, wsId] = queryKey as ['token-limits', string | undefined]
      if (!wsId) throw new Error('No workspace selected')
      return fetchLimitStatus(wsId, token)
    },
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
  const token = getSessionToken(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ providerId, maxTokensPerDay }: { providerId: string; maxTokensPerDay: number }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return updateLimit(workspaceId, providerId, maxTokensPerDay, token)
    },
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
