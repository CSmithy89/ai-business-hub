'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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

async function createPhase(params: {
  workspaceId: string
  token?: string
  projectId: string
  data: { name: string; phaseNumber: number; description?: string }
}) {
  const base = getBaseUrl()
  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/projects/${encodeURIComponent(params.projectId)}/phases?${query.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
      },
      body: JSON.stringify(params.data),
      cache: 'no-store',
    },
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to create phase')
  }

  return body as { data: { id: string } }
}

async function updatePhase(params: {
  workspaceId: string
  token?: string
  phaseId: string
  data: { name?: string; description?: string; phaseNumber?: number }
}) {
  const base = getBaseUrl()
  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(`${base}/pm/phases/${encodeURIComponent(params.phaseId)}?${query.toString()}`, {
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
    throw new Error(message || 'Failed to update phase')
  }

  return body as { data: { id: string } }
}

export function useCreatePmPhase() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { name: string; phaseNumber: number; description?: string } }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return createPhase({ workspaceId, token, projectId, data })
    },
    onSuccess: () => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['pm-projects', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['pm-project'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create phase'
      toast.error(message)
    },
  })
}

export function useUpdatePmPhase() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ phaseId, data }: { phaseId: string; data: { name?: string; description?: string; phaseNumber?: number } }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return updatePhase({ workspaceId, token, phaseId, data })
    },
    onSuccess: () => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['pm-project'] })
      queryClient.invalidateQueries({ queryKey: ['pm-projects', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update phase'
      toast.error(message)
    },
  })
}

