'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getActiveWorkspaceId, getSessionToken, useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { safeJson } from '@/lib/utils/safe-json'

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured')
  return NESTJS_API_URL.replace(/\/$/, '')
}

export type ViewType = 'LIST' | 'KANBAN' | 'CALENDAR' | 'TABLE' | 'TIMELINE'

export interface SavedView {
  id: string
  projectId: string
  userId: string
  name: string
  viewType: ViewType
  filters: Record<string, any>
  sortBy: string | null
  sortOrder: string | null
  columns: string[] | null
  isDefault: boolean
  isShared: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSavedViewInput {
  name: string
  projectId: string
  viewType: ViewType
  filters: Record<string, any>
  sortBy?: string
  sortOrder?: string
  columns?: string[]
  isDefault?: boolean
  isShared?: boolean
}

export interface UpdateSavedViewInput {
  name?: string
  viewType?: ViewType
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: string
  columns?: string[]
  isDefault?: boolean
  isShared?: boolean
}

// Fetch saved views for a project
async function fetchSavedViews(params: {
  workspaceId: string
  token?: string
  projectId: string
}): Promise<{ data: SavedView[] }> {
  const base = getBaseUrl()
  const search = new URLSearchParams()
  search.set('projectId', params.projectId)

  const response = await fetch(`${base}/pm/saved-views?${search.toString()}`, {
    credentials: 'include',
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : 'Failed to fetch saved views'
    throw new Error(message)
  }

  return body as { data: SavedView[] }
}

// Fetch default view for a project
async function fetchDefaultView(params: {
  workspaceId: string
  token?: string
  projectId: string
}): Promise<{ data: SavedView | null }> {
  const base = getBaseUrl()
  const search = new URLSearchParams()
  search.set('projectId', params.projectId)

  const response = await fetch(`${base}/pm/saved-views/default?${search.toString()}`, {
    credentials: 'include',
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    cache: 'no-store',
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : 'Failed to fetch default view'
    throw new Error(message)
  }

  return body as { data: SavedView | null }
}

// Create saved view
async function createSavedView(params: {
  workspaceId: string
  token?: string
  input: CreateSavedViewInput
}): Promise<{ data: SavedView }> {
  const base = getBaseUrl()

  const response = await fetch(`${base}/pm/saved-views`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify({
      ...params.input,
      filters: JSON.stringify(params.input.filters),
      columns: params.input.columns ? JSON.stringify(params.input.columns) : undefined,
    }),
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : 'Failed to create saved view'
    throw new Error(message)
  }

  return body as { data: SavedView }
}

// Update saved view
async function updateSavedView(params: {
  workspaceId: string
  token?: string
  id: string
  input: UpdateSavedViewInput
}): Promise<{ data: SavedView }> {
  const base = getBaseUrl()

  const response = await fetch(`${base}/pm/saved-views/${params.id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify({
      ...params.input,
      filters: params.input.filters ? JSON.stringify(params.input.filters) : undefined,
      columns: params.input.columns ? JSON.stringify(params.input.columns) : undefined,
    }),
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : 'Failed to update saved view'
    throw new Error(message)
  }

  return body as { data: SavedView }
}

// Delete saved view
async function deleteSavedView(params: {
  workspaceId: string
  token?: string
  id: string
}): Promise<{ data: { success: boolean } }> {
  const base = getBaseUrl()

  const response = await fetch(`${base}/pm/saved-views/${params.id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
  })

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : 'Failed to delete saved view'
    throw new Error(message)
  }

  return body as { data: { success: boolean } }
}

// Hook: List saved views
export function useSavedViews(projectId: string | undefined) {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const workspaceId = getActiveWorkspaceId(session)

  return useQuery({
    queryKey: ['saved-views', projectId],
    queryFn: () => fetchSavedViews({ workspaceId: workspaceId!, token, projectId: projectId! }),
    enabled: !!projectId && !!workspaceId,
  })
}

// Hook: Get default view
export function useDefaultView(projectId: string | undefined) {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const workspaceId = getActiveWorkspaceId(session)

  return useQuery({
    queryKey: ['default-view', projectId],
    queryFn: () => fetchDefaultView({ workspaceId: workspaceId!, token, projectId: projectId! }),
    enabled: !!projectId && !!workspaceId,
  })
}

// Hook: Create saved view
export function useCreateSavedView() {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const workspaceId = getActiveWorkspaceId(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSavedViewInput) => createSavedView({ workspaceId: workspaceId!, token, input }),
    onSuccess: (result: { data: SavedView }) => {
      toast.success('View saved successfully')
      queryClient.invalidateQueries({ queryKey: ['saved-views', result.data.projectId] })
      queryClient.invalidateQueries({ queryKey: ['default-view', result.data.projectId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save view')
    },
  })
}

// Hook: Update saved view
export function useUpdateSavedView() {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const workspaceId = getActiveWorkspaceId(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSavedViewInput }) =>
      updateSavedView({ workspaceId: workspaceId!, token, id, input }),
    onSuccess: (result: { data: SavedView }) => {
      toast.success('View updated successfully')
      queryClient.invalidateQueries({ queryKey: ['saved-views', result.data.projectId] })
      queryClient.invalidateQueries({ queryKey: ['default-view', result.data.projectId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update view')
    },
  })
}

// Hook: Delete saved view
export function useDeleteSavedView() {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const workspaceId = getActiveWorkspaceId(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      deleteSavedView({ workspaceId: workspaceId!, token, id }).then(() => ({ projectId })),
    onSuccess: (result: { projectId: string }) => {
      toast.success('View deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['saved-views', result.projectId] })
      queryClient.invalidateQueries({ queryKey: ['default-view', result.projectId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete view')
    },
  })
}
