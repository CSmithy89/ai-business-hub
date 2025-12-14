'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { safeJson } from '@/lib/utils/safe-json'

function getSessionToken(session: unknown): string | undefined {
  const direct = (session as { token?: string } | null)?.token
  const nested = (session as { session?: { token?: string } } | null)?.session?.token
  return direct || nested || undefined
}

/**
 * Usage statistics
 */
export interface UsageStats {
  totalTokens: number
  totalPromptTokens: number
  totalCompletionTokens: number
  totalCost: number
  requestCount: number
}

/**
 * Daily usage data point
 */
export interface DailyUsage {
  date: string
  totalTokens: number
  totalCost: number
  requestCount: number
}

/**
 * Usage by agent
 */
export interface AgentUsage {
  agentId: string
  totalTokens: number
  totalCost: number
  requestCount: number
}

/**
 * Fetch usage statistics
 */
async function fetchUsageStats(
  workspaceId: string,
  token: string | undefined,
  startDate?: string,
  endDate?: string
): Promise<{ data: UsageStats }> {
  const base = NESTJS_API_URL?.replace(/\/$/, '')
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured')
  }

  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)

  const queryString = params.toString()
  const url = `${base}/workspaces/${encodeURIComponent(workspaceId)}/ai-providers/usage${
    queryString ? `?${queryString}` : ''
  }`

  const response = await fetch(url, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    const error = (await safeJson<{ message?: string }>(response)) || {
      message: 'Failed to fetch usage',
    }
    throw new Error(error.message || 'Failed to fetch usage')
  }

  const data = await safeJson<{ data?: UsageStats }>(response)
  if (!data?.data) throw new Error('Failed to fetch usage')
  return { data: data.data }
}

/**
 * Fetch daily usage breakdown
 */
async function fetchDailyUsage(
  workspaceId: string,
  token: string | undefined,
  days: number = 30
): Promise<{ data: DailyUsage[] }> {
  const base = NESTJS_API_URL?.replace(/\/$/, '')
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured')
  }

  const response = await fetch(
    `${base}/workspaces/${encodeURIComponent(workspaceId)}/ai-providers/usage/daily?days=${days}`,
    {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )

  if (!response.ok) {
    const error = (await safeJson<{ message?: string }>(response)) || {
      message: 'Failed to fetch daily usage',
    }
    throw new Error(error.message || 'Failed to fetch daily usage')
  }

  const data = await safeJson<{ data?: DailyUsage[] }>(response)
  return { data: data?.data || [] }
}

/**
 * Fetch usage by agent
 */
async function fetchUsageByAgent(
  workspaceId: string,
  token: string | undefined
): Promise<{ data: AgentUsage[] }> {
  const base = NESTJS_API_URL?.replace(/\/$/, '')
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured')
  }

  const response = await fetch(
    `${base}/workspaces/${encodeURIComponent(workspaceId)}/ai-providers/usage/by-agent`,
    {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )

  if (!response.ok) {
    const error = (await safeJson<{ message?: string }>(response)) || {
      message: 'Failed to fetch agent usage',
    }
    throw new Error(error.message || 'Failed to fetch agent usage')
  }

  const data = await safeJson<{ data?: AgentUsage[] }>(response)
  return { data: data?.data || [] }
}

/**
 * Hook to fetch usage statistics
 */
export function useUsageStats(startDate?: string, endDate?: string) {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['usage-stats', workspaceId, startDate, endDate],
    queryFn: () => fetchUsageStats(workspaceId!, token, startDate, endDate),
    enabled: !!workspaceId,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Hook to fetch daily usage
 */
export function useDailyUsage(days: number = 30) {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['daily-usage', workspaceId, days],
    queryFn: () => fetchDailyUsage(workspaceId!, token, days),
    enabled: !!workspaceId,
    staleTime: 60000,
  })
}

/**
 * Hook to fetch usage by agent
 */
export function useUsageByAgent() {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['agent-usage', workspaceId],
    queryFn: () => fetchUsageByAgent(workspaceId!, token),
    enabled: !!workspaceId,
    staleTime: 60000,
  })
}
