'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'

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
  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)

  const queryString = params.toString()
  const url = `${NESTJS_API_URL}/workspaces/${workspaceId}/ai-providers/usage${
    queryString ? `?${queryString}` : ''
  }`

  const response = await fetch(url, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch usage' }))
    throw new Error(error.message || 'Failed to fetch usage')
  }

  return response.json()
}

/**
 * Fetch daily usage breakdown
 */
async function fetchDailyUsage(
  workspaceId: string,
  token: string | undefined,
  days: number = 30
): Promise<{ data: DailyUsage[] }> {
  const response = await fetch(
    `${NESTJS_API_URL}/workspaces/${workspaceId}/ai-providers/usage/daily?days=${days}`,
    {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch daily usage' }))
    throw new Error(error.message || 'Failed to fetch daily usage')
  }

  return response.json()
}

/**
 * Fetch usage by agent
 */
async function fetchUsageByAgent(
  workspaceId: string,
  token: string | undefined
): Promise<{ data: AgentUsage[] }> {
  const response = await fetch(
    `${NESTJS_API_URL}/workspaces/${workspaceId}/ai-providers/usage/by-agent`,
    {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch agent usage' }))
    throw new Error(error.message || 'Failed to fetch agent usage')
  }

  return response.json()
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
