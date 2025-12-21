'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { safeJson } from '@/lib/utils/safe-json'

export type RiskEntry = {
  id: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  riskType: string
  title: string
  description: string
  affectedTasks: string[]
  affectedUsers: string[]
  status: 'IDENTIFIED' | 'ANALYZING' | 'RESOLVED' | 'MITIGATED'
  detectedAt: string
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolvedAt?: string
}

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured')
  return NESTJS_API_URL.replace(/\/$/, '')
}

function getSessionToken(session: unknown): string | undefined {
  const direct = (session as { token?: string } | null)?.token
  const nested = (session as { session?: { token?: string } } | null)?.session?.token
  return direct || nested || undefined
}

async function fetchRisks(params: { projectId: string; token?: string }): Promise<RiskEntry[]> {
  const url = `${getBaseUrl()}/pm/agents/health/${params.projectId}/risks`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(params.token && { Authorization: `Bearer ${params.token}` }),
    },
  })

  if (!response.ok) {
    const body = await safeJson<unknown>(response)
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Failed to fetch risks: ${response.statusText}`
    throw new Error(message)
  }

  return response.json()
}

async function acknowledgeRisk(params: {
  projectId: string
  riskId: string
  token?: string
}): Promise<RiskEntry> {
  const url = `${getBaseUrl()}/pm/agents/health/${params.projectId}/risks/${params.riskId}/acknowledge`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token && { Authorization: `Bearer ${params.token}` }),
    },
  })

  if (!response.ok) {
    const body = await safeJson<unknown>(response)
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Failed to acknowledge risk: ${response.statusText}`
    throw new Error(message)
  }

  return response.json()
}

async function resolveRisk(params: {
  projectId: string
  riskId: string
  token?: string
}): Promise<RiskEntry> {
  const url = `${getBaseUrl()}/pm/agents/health/${params.projectId}/risks/${params.riskId}/resolve`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token && { Authorization: `Bearer ${params.token}` }),
    },
  })

  if (!response.ok) {
    const body = await safeJson<unknown>(response)
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Failed to resolve risk: ${response.statusText}`
    throw new Error(message)
  }

  return response.json()
}

// Severity ordering for sorting (CRITICAL first)
const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const

/**
 * Hook for fetching and managing project risks.
 *
 * Provides:
 * - `risks` - All fetched risks
 * - `activeRisks` - Risks in IDENTIFIED or ANALYZING status
 * - `resolvedRisks` - Risks in RESOLVED or MITIGATED status
 * - `sortedActiveRisks` - Active risks sorted by severity (CRITICAL first)
 * - `isLoading` - Loading state
 * - `isError` - Error state
 * - `error` - Error object if any
 * - `acknowledgeMutation` - Mutation for acknowledging a risk
 * - `resolveMutation` - Mutation for resolving a risk
 *
 * @param projectId - The project ID to fetch risks for
 */
export function usePmRisks(projectId: string) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const token = getSessionToken(session)

  // Fetch risks query
  const {
    data: risks,
    isLoading,
    isError,
    error,
  } = useQuery<RiskEntry[]>({
    queryKey: ['pm-risks', projectId],
    queryFn: () => fetchRisks({ projectId, token }),
    enabled: !!token && !!projectId,
  })

  // Derive filtered and sorted risks
  const activeRisks = risks?.filter((r) => r.status === 'IDENTIFIED' || r.status === 'ANALYZING') || []
  const resolvedRisks = risks?.filter((r) => r.status === 'RESOLVED' || r.status === 'MITIGATED') || []
  const sortedActiveRisks = [...activeRisks].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (riskId: string) => acknowledgeRisk({ projectId, riskId, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-risks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['pm-health', projectId] })
      toast.success('Risk acknowledged')
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to acknowledge risk'
      toast.error('Failed to acknowledge risk', { description: message })
    },
  })

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: (riskId: string) => resolveRisk({ projectId, riskId, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-risks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['pm-health', projectId] })
      toast.success('Risk marked as resolved')
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to resolve risk'
      toast.error('Failed to resolve risk', { description: message })
    },
  })

  return {
    risks,
    activeRisks,
    resolvedRisks,
    sortedActiveRisks,
    isLoading,
    isError,
    error,
    acknowledgeMutation,
    resolveMutation,
  }
}
