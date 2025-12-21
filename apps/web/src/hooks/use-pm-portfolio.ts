'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { safeJson } from '@/lib/utils/safe-json'

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured')
  return NESTJS_API_URL.replace(/\/$/, '')
}

function getSessionToken(session: unknown): string | undefined {
  const direct = (session as { token?: string } | null)?.token
  const nested = (session as { session?: { token?: string } } | null)?.session?.token
  return direct || nested || undefined
}

export type PortfolioFilters = {
  status?: string
  teamLeadId?: string
  search?: string
  from?: string
  to?: string
}

export type PortfolioProject = {
  id: string
  slug: string
  name: string
  status: string
  type: string
  color: string
  icon: string
  totalTasks: number
  completedTasks: number
  startDate: string | null
  targetDate: string | null
  healthScore: number
  team: {
    leadUserId: string | null
    leadName: string | null
    memberCount: number
  }
}

export type PortfolioResponse = {
  data: {
    totals: {
      totalProjects: number
      activeProjects: number
      onHoldProjects: number
      completedProjects: number
    }
    health: {
      averageScore: number | null
      onTrack: number
      watch: number
      atRisk: number
    }
    teamLeads: Array<{ id: string; name: string }>
    projects: PortfolioProject[]
  }
}

async function fetchPortfolio(params: {
  workspaceId: string
  token?: string
  filters: PortfolioFilters
}): Promise<PortfolioResponse> {
  const base = getBaseUrl()
  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  if (params.filters.status) search.set('status', params.filters.status)
  if (params.filters.teamLeadId) search.set('teamLeadId', params.filters.teamLeadId)
  if (params.filters.search) search.set('search', params.filters.search)
  if (params.filters.from) search.set('from', params.filters.from)
  if (params.filters.to) search.set('to', params.filters.to)

  const response = await fetch(`${base}/pm/portfolio?${search.toString()}`, {
    credentials: 'include',
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to fetch portfolio')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to fetch portfolio')
  }

  return body as PortfolioResponse
}

export function usePmPortfolio(filters: PortfolioFilters) {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery({
    queryKey: [
      'pm-portfolio',
      workspaceId,
      filters.status ?? null,
      filters.teamLeadId ?? null,
      filters.search ?? null,
      filters.from ?? null,
      filters.to ?? null,
    ],
    queryFn: () => fetchPortfolio({ workspaceId: workspaceId!, token, filters }),
    enabled: !!workspaceId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  })
}
