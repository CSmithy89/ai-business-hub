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

export type ProjectExpense = {
  id: string
  projectId: string
  amount: string
  description: string | null
  spentAt: string
  createdAt: string
  updatedAt: string
}

export type ProjectExpensesResponse = { data: ProjectExpense[] }

async function fetchExpenses(params: {
  workspaceId: string
  token?: string
  projectId: string
}): Promise<ProjectExpensesResponse> {
  const base = getBaseUrl()
  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/projects/${encodeURIComponent(params.projectId)}/expenses?${query.toString()}`,
    {
      credentials: 'include',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
      cache: 'no-store',
    },
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to fetch expenses')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to fetch expenses')
  return body as ProjectExpensesResponse
}

async function createExpense(params: {
  workspaceId: string
  token?: string
  projectId: string
  data: { amount: number; description?: string; spentAt?: string }
}): Promise<{ data: { id: string } }> {
  const base = getBaseUrl()
  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/projects/${encodeURIComponent(params.projectId)}/expenses?${query.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
      },
      body: JSON.stringify({
        amount: params.data.amount,
        description: params.data.description,
        spentAt: params.data.spentAt ? new Date(params.data.spentAt).toISOString() : undefined,
      }),
      cache: 'no-store',
    },
  )

  const body = await safeJson<unknown>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    throw new Error(message || 'Failed to create expense')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to create expense')
  return body as { data: { id: string } }
}

export function usePmExpenses(projectId: string) {
  const { data: session } = useSession()
  const workspaceId = getActiveWorkspaceId(session)
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['pm-expenses', workspaceId, projectId],
    queryFn: () => fetchExpenses({ workspaceId: workspaceId!, token, projectId }),
    enabled: !!workspaceId && !!projectId,
    staleTime: 15000,
    refetchOnWindowFocus: true,
  })
}

export function useCreatePmExpense() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = getActiveWorkspaceId(session)
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: (params: { projectId: string; data: { amount: number; description?: string; spentAt?: string } }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return createExpense({ workspaceId, token, projectId: params.projectId, data: params.data })
    },
    onSuccess: (_result, variables) => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['pm-expenses', workspaceId, variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['pm-project'] })
      queryClient.invalidateQueries({ queryKey: ['pm-projects', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create expense'
      toast.error(message)
    },
  })
}
