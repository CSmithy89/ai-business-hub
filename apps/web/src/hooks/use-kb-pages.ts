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
  // Verification fields (KB-03)
  isVerified?: boolean
  verifiedAt?: string | null
  verifiedById?: string | null
  verifyExpires?: string | null
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
  processMentions?: boolean
}

export interface KBDraftCitation {
  pageId: string
  title: string
  slug: string
  chunkIndex: number
}

export interface KBDraftResponse {
  draft: {
    content: string
    citations: KBDraftCitation[]
  }
}

export interface GenerateKBDraftInput {
  prompt: string
}

export interface KBSummaryResponse {
  summary: {
    summary: string
    keyPoints: string[]
  }
}

export interface GenerateKBSummaryInput {
  pageId: string
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

async function generateKBDraft(params: {
  input: GenerateKBDraftInput
  workspaceId: string
  token?: string
}): Promise<KBDraftResponse> {
  const { input, workspaceId, token } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/ai/draft`, {
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
    throw new Error(error?.message || `Failed to generate AI draft: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as KBDraftResponse
}

async function generateKBSummary(params: {
  input: GenerateKBSummaryInput
  workspaceId: string
  token?: string
}): Promise<KBSummaryResponse> {
  const { input, workspaceId, token } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/ai/summary`, {
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
    throw new Error(error?.message || `Failed to summarize page: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as KBSummaryResponse
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

export function useKBDraft(workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: (input: GenerateKBDraftInput) =>
      generateKBDraft({ input, workspaceId, token }),
  })
}

export function useKBSummary(workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: (input: GenerateKBSummaryInput) =>
      generateKBSummary({ input, workspaceId, token }),
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

// ============================================
// Search
// ============================================

export interface KBSearchResult {
  pageId: string
  title: string
  slug: string
  snippet: string
  rank: number
  updatedAt: string
  path: string[]
}

export interface KBSearchResponse {
  query: string
  results: KBSearchResult[]
  total: number
  limit: number
  offset: number
}

async function searchKBPages(params: {
  query: string
  workspaceId: string
  token?: string
  limit?: number
  offset?: number
}): Promise<KBSearchResponse> {
  const { query, workspaceId, token, limit = 20, offset = 0 } = params

  const url = new URL(`${getBaseUrl()}/api/kb/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))

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
    throw new Error(error?.message || `Search failed: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as KBSearchResponse
}

export function useKBSearch(workspaceId: string, query: string, enabled = true) {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['kb', 'search', workspaceId, query],
    queryFn: () => searchKBPages({ query, workspaceId, token }),
    enabled: !!workspaceId && !!token && !!query && enabled,
    staleTime: 30000, // Cache results for 30 seconds
  })
}

// ============================================
// Recent Pages & Favorites
// ============================================

export interface RecentPage {
  id: string
  title: string
  slug: string
  parentId: string | null
  updatedAt: string
  lastViewedAt: string
}

export interface FavoritePage {
  id: string
  title: string
  slug: string
  parentId: string | null
  updatedAt: string
  favoritedBy: string[]
  isFavorited: boolean
}

async function fetchRecentPages(params: {
  workspaceId: string
  token?: string
  limit?: number
}): Promise<{ data: RecentPage[] }> {
  const { workspaceId, token, limit = 10 } = params

  const url = new URL(`${getBaseUrl()}/api/kb/pages/me/recent`)
  url.searchParams.set('limit', String(limit))

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
    throw new Error(error?.message || `Failed to fetch recent pages: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as { data: RecentPage[] }
}

async function fetchFavorites(params: {
  workspaceId: string
  token?: string
}): Promise<{ data: FavoritePage[] }> {
  const { workspaceId, token } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/pages/me/favorites`, {
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
    throw new Error(error?.message || `Failed to fetch favorites: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as { data: FavoritePage[] }
}

async function toggleFavorite(params: {
  pageId: string
  workspaceId: string
  token?: string
  favorite: boolean
}): Promise<{ data: { success: boolean } }> {
  const { pageId, workspaceId, token, favorite } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/pages/${pageId}/favorite`, {
    method: favorite ? 'POST' : 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      'x-workspace-id': workspaceId,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error: any = await safeJson(response)
    throw new Error(error?.message || `Failed to toggle favorite: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as { data: { success: boolean } }
}

export function useRecentPages(workspaceId: string, limit = 10) {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['kb', 'recent', workspaceId, limit],
    queryFn: () => fetchRecentPages({ workspaceId, token, limit }),
    enabled: !!workspaceId && !!token,
    staleTime: 60000, // Cache for 1 minute
  })
}

export function useFavorites(workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['kb', 'favorites', workspaceId],
    queryFn: () => fetchFavorites({ workspaceId, token }),
    enabled: !!workspaceId && !!token,
  })
}

export function useToggleFavorite(workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pageId, favorite }: { pageId: string; favorite: boolean }) =>
      toggleFavorite({ pageId, workspaceId, token, favorite }),
    onSuccess: (_data, variables) => {
      // Invalidate favorites list
      queryClient.invalidateQueries({ queryKey: ['kb', 'favorites', workspaceId] })
      // Also invalidate the specific page to update its favorite status
      queryClient.invalidateQueries({ queryKey: ['kb', 'pages'] })
      toast.success(variables.favorite ? 'Added to favorites' : 'Removed from favorites')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update favorite')
    },
  })
}

// ============================================
// Project Linking
// ============================================

export interface ProjectPageLink {
  id: string
  projectId: string
  pageId: string
  isPrimary: boolean
  linkedBy: string
  createdAt: string
  project?: {
    id: string
    name: string
    slug: string
    status?: string
  }
  page?: {
    id: string
    title: string
    slug: string
    updatedAt?: string
    contentText?: string
  }
}

async function fetchLinkedProjects(params: {
  pageId: string
  workspaceId: string
  token?: string
}): Promise<{ data: ProjectPageLink[] }> {
  const { pageId, workspaceId, token } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/pages/${pageId}/projects`, {
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
    throw new Error(error?.message || `Failed to fetch linked projects: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as { data: ProjectPageLink[] }
}

async function linkPageToProject(params: {
  pageId: string
  projectId: string
  isPrimary?: boolean
  workspaceId: string
  token?: string
}): Promise<{ data: ProjectPageLink }> {
  const { pageId, projectId, isPrimary, workspaceId, token } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/pages/${pageId}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      'x-workspace-id': workspaceId,
    },
    credentials: 'include',
    body: JSON.stringify({ projectId, isPrimary }),
  })

  if (!response.ok) {
    const error: any = await safeJson(response)
    throw new Error(error?.message || `Failed to link page to project: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as { data: ProjectPageLink }
}

async function unlinkPageFromProject(params: {
  pageId: string
  projectId: string
  workspaceId: string
  token?: string
}): Promise<{ data: { success: boolean } }> {
  const { pageId, projectId, workspaceId, token } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/pages/${pageId}/projects/${projectId}`, {
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
    throw new Error(error?.message || `Failed to unlink page from project: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as { data: { success: boolean } }
}

async function updatePageProjectLink(params: {
  pageId: string
  projectId: string
  isPrimary: boolean
  workspaceId: string
  token?: string
}): Promise<{ data: ProjectPageLink }> {
  const { pageId, projectId, isPrimary, workspaceId, token } = params

  const response = await fetch(`${getBaseUrl()}/api/kb/pages/${pageId}/projects/${projectId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      'x-workspace-id': workspaceId,
    },
    credentials: 'include',
    body: JSON.stringify({ isPrimary }),
  })

  if (!response.ok) {
    const error: any = await safeJson(response)
    throw new Error(error?.message || `Failed to update link: ${response.statusText}`)
  }

  const data = await safeJson(response)
  return data as { data: ProjectPageLink }
}

export function useLinkedProjects(pageId: string, workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['kb', 'page-projects', pageId, workspaceId],
    queryFn: () => fetchLinkedProjects({ pageId, workspaceId, token }),
    enabled: !!pageId && !!workspaceId && !!token,
  })
}

export function useLinkPageToProject(workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pageId, projectId, isPrimary }: { pageId: string; projectId: string; isPrimary?: boolean }) =>
      linkPageToProject({ pageId, projectId, isPrimary, workspaceId, token }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kb', 'page-projects', variables.pageId, workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['kb', 'project-docs'] })
      toast.success('Page linked to project')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link page')
    },
  })
}

export function useUnlinkPageFromProject(workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pageId, projectId }: { pageId: string; projectId: string }) =>
      unlinkPageFromProject({ pageId, projectId, workspaceId, token }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kb', 'page-projects', variables.pageId, workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['kb', 'project-docs'] })
      toast.success('Page unlinked from project')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unlink page')
    },
  })
}

export function useUpdatePageProjectLink(workspaceId: string) {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pageId, projectId, isPrimary }: { pageId: string; projectId: string; isPrimary: boolean }) =>
      updatePageProjectLink({ pageId, projectId, isPrimary, workspaceId, token }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kb', 'page-projects', variables.pageId, workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['kb', 'project-docs'] })
      toast.success('Link updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update link')
    },
  })
}
