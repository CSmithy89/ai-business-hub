'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { safeJson } from '@/lib/utils/safe-json'
import type { TiptapDocument } from '@hyvve/shared'
import { toast } from 'sonner'

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured')
  return NESTJS_API_URL.replace(/\/$/, '')
}

function getSessionToken(session: unknown): string | undefined {
  const direct = (session as { token?: string } | null)?.token
  const nested = (session as { session?: { token?: string } } | null)?.session?.token
  return direct || nested || undefined
}

export interface KBPage {
  id: string
  workspaceId: string
  parentId: string | null
  title: string
  slug: string
  content: TiptapDocument
  contentText: string
  ownerId: string
  viewCount: number
  lastViewedAt: string | null
  favoritedBy: string[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface KBPageListResponse {
  data: KBPage[]
  meta?: {
    total: number
  }
}

export interface KBPageResponse {
  data: KBPage
}

export interface CreateKBPageInput {
  title: string
  parentId?: string
  content?: TiptapDocument
}

export interface UpdateKBPageInput {
  title?: string
  content?: TiptapDocument
  parentId?: string
  createVersion?: boolean
  changeNote?: string
}

async function fetchKBPages(params: {
  workspaceId: string
  token?: string
  flat?: boolean
}): Promise<KBPageListResponse> {
  const { workspaceId, token, flat = true } = params

  const url = new URL(`${getBaseUrl()}/api/kb/pages`)
  url.searchParams.set('flat', String(flat))

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      'x-workspace-id': workspaceId,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error: any = await safeJson(response)
    throw new Error(error?.message || `Failed to fetch KB pages: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as KBPageListResponse
}

async function fetchKBPage(params: {
  id: string
  workspaceId: string
  token?: string
}): Promise<KBPageResponse> {
  const { id, workspaceId, token } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/pages/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      'x-workspace-id': workspaceId,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error: any = await safeJson(response)
    throw new Error(error?.message || `Failed to fetch KB page: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as KBPageResponse
}

async function createKBPage(params: {
  input: CreateKBPageInput
  workspaceId: string
  token?: string
}): Promise<KBPageResponse> {
  const { input, workspaceId, token } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      'x-workspace-id': workspaceId,
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error: any = await safeJson(response)
    throw new Error(error?.message || `Failed to create KB page: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as KBPageResponse
}

async function updateKBPage(params: {
  id: string
  input: UpdateKBPageInput
  workspaceId: string
  token?: string
}): Promise<KBPageResponse> {
  const { id, input, workspaceId, token } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/pages/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      'x-workspace-id': workspaceId,
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error: any = await safeJson(response)
    throw new Error(error?.message || `Failed to update KB page: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as KBPageResponse
}

async function deleteKBPage(params: {
  id: string
  workspaceId: string
  token?: string
}): Promise<{ success: boolean }> {
  const { id, workspaceId, token } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/pages/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      'x-workspace-id': workspaceId,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error: any = await safeJson(response)
    throw new Error(error?.message || `Failed to delete KB page: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as { success: boolean }
}

// ============================================
// React Query Hooks
// ============================================

export function useKBPages(workspaceId: string, flat = true) {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['kb', 'pages', workspaceId, flat],
    queryFn: () => fetchKBPages({ workspaceId, token, flat }),
    enabled: !!workspaceId && !!token,
  })
}

export function useKBPage(id: string, workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['kb', 'pages', id, workspaceId],
    queryFn: () => fetchKBPage({ id, workspaceId, token }),
    enabled: !!id && !!workspaceId && !!token,
  })
}

export function useCreateKBPage(workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateKBPageInput) =>
      createKBPage({ input, workspaceId, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb', 'pages', workspaceId] })
      toast.success('Page created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create page')
    },
  })
}

export function useUpdateKBPage(workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateKBPageInput }) =>
      updateKBPage({ id, input, workspaceId, token }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kb', 'pages', variables.id, workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['kb', 'pages', workspaceId] })
      // Only show toast for manual saves with version creation
      if (variables.input.createVersion) {
        toast.success('Page saved')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update page')
    },
  })
}

export function useDeleteKBPage(workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteKBPage({ id, workspaceId, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb', 'pages', workspaceId] })
      toast.success('Page deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete page')
    },
  })
}

export function useMoveKBPage(workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null | undefined }) =>
      updateKBPage({ id, input: { parentId: parentId ?? undefined }, workspaceId, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb', 'pages', workspaceId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to move page')
    },
  })
}
