'use client'

import { useQuery } from '@tanstack/react-query'
import { getActiveWorkspaceId, getSessionToken, useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { safeJson } from '@/lib/utils/safe-json'

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured')
  return NESTJS_API_URL.replace(/\/$/, '')
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
    meta?: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
    relations: DependencyRelation[]
  }
}

export type DependenciesFilters = {
  projectId?: string
  relationType?: string
  crossProjectOnly?: boolean
  limit?: number
  offset?: number
}

async function fetchDependencies(params: {
  workspaceId: string
  token?: string
  filters: DependenciesFilters
}): Promise<DependenciesResponse> {
  const base = getBaseUrl()
  const search = new URLSearchParams()

  if (params.filters.projectId) search.set('projectId', params.filters.projectId)
  if (params.filters.relationType) search.set('relationType', params.filters.relationType)
  if (params.filters.crossProjectOnly !== undefined) {
    search.set('crossProjectOnly', String(params.filters.crossProjectOnly))
  }
  if (params.filters.limit !== undefined) {
    search.set('limit', String(params.filters.limit))
  }
  if (params.filters.offset !== undefined) {
    search.set('offset', String(params.filters.offset))
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

export function usePmDependencies(filters: DependenciesFilters, options?: { enabled?: boolean }) {
  const { data: session } = useSession()
  const workspaceId = getActiveWorkspaceId(session)
  const token = getSessionToken(session)
  const enabled = !!workspaceId && (options?.enabled ?? true)

  return useQuery({
    queryKey: [
      'pm-dependencies',
      workspaceId,
      filters.projectId ?? null,
      filters.relationType ?? null,
      filters.crossProjectOnly ?? null,
      filters.limit ?? null,
      filters.offset ?? null,
    ],
    queryFn: () => fetchDependencies({ workspaceId: workspaceId!, token, filters }),
    enabled,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  })
}
