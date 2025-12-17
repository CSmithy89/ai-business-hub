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

export interface ProjectDetailResponse {
  data: {
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
    startDate: string | null
    targetDate: string | null
    budget: string | null
    actualSpend: string | null
    autoApprovalThreshold: number
    suggestionMode: boolean
    phases: Array<{
      id: string
      name: string
      phaseNumber: number
      status: string
    }>
    team: null | {
      id: string
      leadUserId: string
      members: Array<{ id: string }>
    }
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

async function fetchProjectBySlug(params: {
  workspaceId: string
  token?: string
  slug: string
}): Promise<ProjectDetailResponse> {
  const base = getBaseUrl()

  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(`${base}/pm/projects/by-slug/${encodeURIComponent(params.slug)}?${query.toString()}`, {
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
    throw new Error(message || 'Failed to fetch project')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to fetch project')
  }

  return body as ProjectDetailResponse
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

export function usePmProject(slug: string) {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['pm-project', workspaceId, slug],
    queryFn: () => fetchProjectBySlug({ workspaceId: workspaceId!, token, slug }),
    enabled: !!workspaceId && !!slug,
    staleTime: 15000,
    refetchOnWindowFocus: true,
  })
}

async function updateProject(params: {
  workspaceId: string
  token?: string
  projectId: string
  data: Record<string, unknown>
}): Promise<ProjectDetailResponse> {
  const base = getBaseUrl()

  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(`${base}/pm/projects/${encodeURIComponent(params.projectId)}?${query.toString()}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify(params.data),
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to update project')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to update project')
  return body as ProjectDetailResponse
}

async function deleteProject(params: {
  workspaceId: string
  token?: string
  projectId: string
}): Promise<{ data: { id: string; deletedAt: string | null } }> {
  const base = getBaseUrl()

  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(`${base}/pm/projects/${encodeURIComponent(params.projectId)}?${query.toString()}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to delete project')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to delete project')
  return body as { data: { id: string; deletedAt: string | null } }
}

export function useUpdatePmProject() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Record<string, unknown> }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return updateProject({ workspaceId, token, projectId, data })
    },
    onSuccess: (result) => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['pm-project', workspaceId, result.data.slug] })
      queryClient.invalidateQueries({ queryKey: ['pm-projects', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update project'
      toast.error(message)
    },
  })
}

export function useDeletePmProject() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ projectId }: { projectId: string }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return deleteProject({ workspaceId, token, projectId })
    },
    onSuccess: () => {
      toast.success('Project deleted')
      queryClient.invalidateQueries({ queryKey: ['pm-projects', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to delete project'
      toast.error(message)
    },
  })
}

export interface ProjectDocLink {
  id: string
  projectId: string
  pageId: string
  isPrimary: boolean
  createdAt: string
  page: {
    id: string
    title: string
    slug: string
    updatedAt: string
    contentText: string | null
  }
}

export interface ProjectDocsResponse {
  data: ProjectDocLink[]
}

async function fetchProjectDocs(params: {
  workspaceId: string
  token?: string
  projectId: string
}): Promise<ProjectDocsResponse> {
  const base = getBaseUrl()

  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/projects/${encodeURIComponent(params.projectId)}/docs?${query.toString()}`,
    {
      credentials: 'include',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
      cache: 'no-store',
    }
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to fetch project docs')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Failed to fetch project docs')
  }

  return body as ProjectDocsResponse
}

export function useProjectDocs(projectId: string) {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['pm-project-docs', workspaceId, projectId],
    queryFn: () => fetchProjectDocs({ workspaceId: workspaceId!, token, projectId }),
    enabled: !!workspaceId && !!projectId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  })
}
