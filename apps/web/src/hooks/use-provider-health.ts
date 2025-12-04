'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'

/**
 * Health check result for a provider
 */
export interface HealthCheckResult {
  providerId: string
  provider: string
  isValid: boolean
  latency?: number
  error?: string
  checkedAt: string
}

/**
 * Provider health info
 */
export interface ProviderHealthInfo {
  id: string
  provider: string
  isValid: boolean
  lastValidatedAt: string | null
  validationError: string | null
  consecutiveFailures: number
}

/**
 * Health summary for workspace
 */
export interface HealthSummary {
  total: number
  healthy: number
  unhealthy: number
  providers: ProviderHealthInfo[]
}

/**
 * Fetch workspace health summary
 */
async function fetchWorkspaceHealth(workspaceId: string): Promise<HealthSummary> {
  const response = await fetch(`/api/workspaces/${workspaceId}/ai-providers/health`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch workspace health')
  }

  const data = await response.json()
  return data.data
}

/**
 * Trigger health check for a provider
 */
async function triggerHealthCheck(
  workspaceId: string,
  providerId: string
): Promise<HealthCheckResult> {
  const response = await fetch(
    `/api/workspaces/${workspaceId}/ai-providers/${providerId}/health-check`,
    {
      method: 'POST',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    throw new Error('Failed to trigger health check')
  }

  const data = await response.json()
  return data.data
}

/**
 * Hook to fetch workspace health summary
 */
export function useWorkspaceHealth() {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId

  return useQuery({
    queryKey: ['provider-health', workspaceId],
    queryFn: () => {
      if (!workspaceId) throw new Error('No workspace selected')
      return fetchWorkspaceHealth(workspaceId)
    },
    enabled: !!workspaceId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 60 * 1000, // Consider stale after 1 minute
  })
}

/**
 * Hook to trigger health check for a provider
 */
export function useTriggerHealthCheck() {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (providerId: string) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return triggerHealthCheck(workspaceId, providerId)
    },
    onSuccess: () => {
      // Invalidate health data to refresh
      queryClient.invalidateQueries({ queryKey: ['provider-health', workspaceId] })
    },
  })
}

/**
 * Hook to get providers with health issues
 */
export function useProvidersWithHealthIssues() {
  const { data: health, isLoading, error } = useWorkspaceHealth()

  const unhealthyProviders = health?.providers.filter((p) => !p.isValid) ?? []
  const criticalProviders = health?.providers.filter((p) => p.consecutiveFailures >= 3) ?? []

  return {
    health,
    unhealthyProviders,
    criticalProviders,
    hasUnhealthy: unhealthyProviders.length > 0,
    hasCritical: criticalProviders.length > 0,
    isLoading,
    error,
  }
}
