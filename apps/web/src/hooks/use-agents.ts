import { useQuery } from '@tanstack/react-query'
import type { Agent } from '@hyvve/shared'
import { safeJson } from '@/lib/utils/safe-json'

interface ApiResponse<T> {
  data: T
}

interface AgentsQueryParams {
  team?: string
  status?: string
  search?: string
}

/**
 * Fetch all agents for the workspace
 */
async function fetchAgents(params?: AgentsQueryParams): Promise<Agent[]> {
  const queryParams = new URLSearchParams()

  if (params?.team && params.team !== 'all') {
    queryParams.append('team', params.team)
  }
  if (params?.status && params.status !== 'all') {
    queryParams.append('status', params.status)
  }
  if (params?.search) {
    queryParams.append('search', params.search)
  }

  const url = `/api/agents${queryParams.toString() ? `?${queryParams}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch agents')
  }

  const result = await safeJson<ApiResponse<Agent[]>>(response)
  if (!result) throw new Error('Failed to fetch agents')
  return result.data
}

/**
 * Hook to fetch all agents
 */
export function useAgents(params?: AgentsQueryParams) {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => fetchAgents(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
