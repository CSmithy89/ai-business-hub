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

export type DependencyRelation = {
  id: string
  relationType: string
  createdAt: string
  source: {
    taskId: string
    taskNumber: number
    title: string
    projectId: string
    projectSlug: string
    projectName: string
  }
  target: {
    taskId: string
    taskNumber: number
    title: string
    projectId: string
    projectSlug: string
    projectName: string
  }
}

export type DependenciesResponse = {
  data: {
    total: number
    relations: DependencyRelation[]
  }
}

export type DependenciesFilters = {
  projectId?: string
  relationType?: string
  crossProjectOnly?: boolean
}

async function fetchDependencies(params: {
  workspaceId: string
  token?: string
  filters: DependenciesFilters
}): Promise<DependenciesResponse> {
  const base = getBaseUrl()
  const search = new URLSearchParams()
  search.set('workspaceId', params.workspaceId)

  if (params.filters.projectId) search.set('projectId', params.filters.projectId)
  if (params.filters.relationType) search.set('relationType', params.filters.relationType)
  if (params.filters.crossProjectOnly !== undefined) {
    search.set('crossProjectOnly', String(params.filters.crossProjectOnly))
  }

  const response = await fetch(`${base}/pm/dependencies?${search.toString()}`, {
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
    throw new Error(message || 'Failed to fetch dependencies')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to fetch dependencies')
  }

  return body as DependenciesResponse
}

export function usePmDependencies(filters: DependenciesFilters) {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery({
    queryKey: [
      'pm-dependencies',
      workspaceId,
      filters.projectId ?? null,
      filters.relationType ?? null,
      filters.crossProjectOnly ?? null,
    ],
    queryFn: () => fetchDependencies({ workspaceId: workspaceId!, token, filters }),
    enabled: !!workspaceId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  })
}
