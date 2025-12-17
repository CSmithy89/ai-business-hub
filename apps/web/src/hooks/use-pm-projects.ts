'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { safeJson } from '@/lib/utils/safe-json'
import { ProjectStatusSchema, ProjectTypeSchema } from '@hyvve/shared'
import type { CreateProjectInput, ListProjectsQuery } from '@hyvve/shared'
import { z } from 'zod'
import { toast } from 'sonner'

const ProjectStatus = ProjectStatusSchema
const ProjectType = ProjectTypeSchema

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured')
  return NESTJS_API_URL.replace(/\/$/, '')
}

function getSessionToken(session: unknown): string | undefined {
  const direct = (session as { token?: string } | null)?.token
  const nested = (session as { session?: { token?: string } } | null)?.session?.token
  return direct || nested || undefined
}

export interface ProjectListItem {
  id: string
  workspaceId: string
  businessId: string
  slug: string
  name: string
  description: string | null
  color: string
  icon: string
  type: z.infer<typeof ProjectType>
  status: z.infer<typeof ProjectStatus>
  totalTasks: number
  completedTasks: number
  createdAt: string
  updatedAt: string
}

export interface ProjectsListResponse {
  data: ProjectListItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CreateProjectResponse {
  data: {
    id: string
    slug: string
    name: string
    businessId: string
    workspaceId: string
  }
}

async function fetchProjects(params: {
  workspaceId: string
  token?: string
  filters?: ListProjectsQuery
}): Promise<ProjectsListResponse> {
  const base = getBaseUrl()

  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const filters = params.filters ?? {}
  if (filters.status) query.set('status', filters.status)
  if (filters.type) query.set('type', filters.type)
  if (filters.businessId) query.set('businessId', filters.businessId)
  if (filters.search) query.set('search', filters.search)
  if (filters.page) query.set('page', String(filters.page))
  if (filters.limit) query.set('limit', String(filters.limit))

  const response = await fetch(`${base}/pm/projects?${query.toString()}`, {
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
    throw new Error(message || 'Failed to fetch projects')
  }

  if (!body || typeof body !== 'object' || !('data' in body) || !('meta' in body)) {
    throw new Error('Failed to fetch projects')
  }

  return body as ProjectsListResponse
}

async function createProject(params: {
  workspaceId: string
  token?: string
  input: CreateProjectInput
}): Promise<CreateProjectResponse> {
  const base = getBaseUrl()

  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(`${base}/pm/projects?${query.toString()}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify({ ...params.input, workspaceId: params.workspaceId }),
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to create project')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to create project')
  }

  return body as CreateProjectResponse
}

export function usePmProjects(filters: ListProjectsQuery = {}) {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['pm-projects', workspaceId, filters],
    queryFn: () => fetchProjects({ workspaceId: workspaceId!, token, filters }),
    enabled: !!workspaceId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  })
}

export function useCreatePmProject() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: (input: CreateProjectInput) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return createProject({ workspaceId, token, input })
    },
    onSuccess: () => {
      toast.success('Project created')
      queryClient.invalidateQueries({ queryKey: ['pm-projects', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create project'
      toast.error(message)
    },
  })
}
