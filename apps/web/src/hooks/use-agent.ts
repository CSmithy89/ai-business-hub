import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Agent } from '@hyvve/shared'
import { safeJson } from '@/lib/utils/safe-json'

interface ApiResponse<T> {
  data: T
}

interface AgentActivity {
  id: string
  agentId: string
  agentName: string
  type: 'task_started' | 'task_completed' | 'approval_requested' | 'error'
  action: string
  module: string
  status: 'pending' | 'completed' | 'failed'
  confidenceScore?: number
  startedAt: string
  completedAt?: string
  duration?: number
}

interface ActivityResponse {
  data: AgentActivity[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface AnalyticsData {
  tasksOverTime: Array<{ date: string; tasks: number }>
  successByType: Array<{ type: string; successRate: number }>
  responseTimeTrend: Array<{ date: string; avgResponseTime: number }>
}

/**
 * Fetch single agent by ID
 */
async function fetchAgent(id: string): Promise<Agent> {
  const response = await fetch(`/api/agents/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch agent')
  }

  const result = await safeJson<ApiResponse<Agent>>(response)
  if (!result) throw new Error('Failed to fetch agent')
  return result.data
}

/**
 * Fetch agent activity with pagination
 */
async function fetchAgentActivity(
  agentId: string,
  page = 1,
  limit = 50,
  type?: string
): Promise<ActivityResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (type) {
    params.append('type', type)
  }

  const response = await fetch(`/api/agents/${agentId}/activity?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch agent activity')
  }

  const result = await safeJson<ActivityResponse>(response)
  if (!result) throw new Error('Failed to fetch agent activity')
  return result
}

/**
 * Fetch agent analytics data
 */
async function fetchAgentAnalytics(agentId: string): Promise<AnalyticsData> {
  const response = await fetch(`/api/agents/${agentId}/analytics`)

  if (!response.ok) {
    throw new Error('Failed to fetch agent analytics')
  }

  const result = await safeJson<ApiResponse<AnalyticsData>>(response)
  if (!result) throw new Error('Failed to fetch agent analytics')
  return result.data
}

/**
 * Update agent configuration
 */
async function updateAgent(
  id: string,
  config: Partial<Agent['config']>
): Promise<Agent> {
  const response = await fetch(`/api/agents/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const error =
      body && typeof body === 'object' && 'error' in body && typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : undefined
    throw new Error(error || 'Failed to update agent')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to update agent')
  }
  return (body as ApiResponse<Agent>).data
}

/**
 * Hook to fetch single agent
 */
export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agents', id],
    queryFn: () => fetchAgent(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch agent activity with optional filters
 */
export function useAgentActivity(
  agentId: string,
  page = 1,
  limit = 50,
  type?: string
) {
  return useQuery({
    queryKey: ['agent-activity', agentId, page, limit, type],
    queryFn: () => fetchAgentActivity(agentId, page, limit, type),
    enabled: !!agentId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 1000 * 30, // 30 seconds
  })
}

/**
 * Hook to fetch agent analytics
 */
export function useAgentAnalytics(agentId: string) {
  return useQuery({
    queryKey: ['agent-analytics', agentId],
    queryFn: () => fetchAgentAnalytics(agentId),
    enabled: !!agentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to update agent configuration
 */
export function useUpdateAgent(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: Partial<Agent['config']>) => updateAgent(id, config),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['agents', id] })
    },
  })
}
