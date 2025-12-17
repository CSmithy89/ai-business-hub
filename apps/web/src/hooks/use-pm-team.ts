'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export type ProjectTeamMember = {
  id: string
  teamId: string
  userId: string
  role: string
  customRoleName: string | null
  hoursPerWeek: number
  productivity: number
  canAssignTasks: boolean
  canApproveAgents: boolean
  canModifyPhases: boolean
  isActive: boolean
  joinedAt: string
  assignedTaskCount: number
  user: null | { id: string; email: string; name: string | null; image: string | null }
}

export type ProjectTeamResponse = {
  data: {
    id: string
    projectId: string
    leadUserId: string
    members: ProjectTeamMember[]
  }
}

async function fetchTeam(params: {
  workspaceId: string
  token?: string
  projectId: string
}): Promise<ProjectTeamResponse> {
  const base = getBaseUrl()
  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/projects/${encodeURIComponent(params.projectId)}/team?${query.toString()}`,
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
    throw new Error(message || 'Failed to fetch team')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to fetch team')
  return body as ProjectTeamResponse
}

async function addMember(params: {
  workspaceId: string
  token?: string
  projectId: string
  data: Record<string, unknown>
}): Promise<{ data: { id: string } }> {
  const base = getBaseUrl()
  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(
    `${base}/pm/projects/${encodeURIComponent(params.projectId)}/team/members?${query.toString()}`,
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
    throw new Error(message || 'Failed to add team member')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to add team member')
  return body as { data: { id: string } }
}

async function updateMember(params: {
  workspaceId: string
  token?: string
  teamMemberId: string
  data: Record<string, unknown>
}): Promise<{ data: { id: string } }> {
  const base = getBaseUrl()
  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)

  const response = await fetch(`${base}/pm/team-members/${encodeURIComponent(params.teamMemberId)}?${query.toString()}`, {
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
    throw new Error(message || 'Failed to update team member')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to update team member')
  return body as { data: { id: string } }
}

async function removeMember(params: {
  workspaceId: string
  token?: string
  teamMemberId: string
  reassignToUserId?: string
}): Promise<{ data: { id: string; isActive: boolean } }> {
  const base = getBaseUrl()
  const query = new URLSearchParams()
  query.set('workspaceId', params.workspaceId)
  if (params.reassignToUserId) query.set('reassignToUserId', params.reassignToUserId)

  const response = await fetch(`${base}/pm/team-members/${encodeURIComponent(params.teamMemberId)}?${query.toString()}`, {
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
    throw new Error(message || 'Failed to remove team member')
  }

  if (!body || typeof body !== 'object' || !('data' in body)) throw new Error('Failed to remove team member')
  return body as { data: { id: string; isActive: boolean } }
}

export function usePmTeam(projectId: string) {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['pm-team', workspaceId, projectId],
    queryFn: () => fetchTeam({ workspaceId: workspaceId!, token, projectId }),
    enabled: !!workspaceId && !!projectId,
    staleTime: 15000,
    refetchOnWindowFocus: true,
  })
}

export function useAddPmTeamMember() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Record<string, unknown> }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return addMember({ workspaceId, token, projectId, data })
    },
    onSuccess: (_result, variables) => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['pm-team', workspaceId, variables.projectId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to add team member'
      toast.error(message)
    },
  })
}

export function useUpdatePmTeamMember() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ teamMemberId, data }: { teamMemberId: string; data: Record<string, unknown> }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return updateMember({ workspaceId, token, teamMemberId, data })
    },
    onSuccess: () => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['pm-team', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update team member'
      toast.error(message)
    },
  })
}

export function useRemovePmTeamMember() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: ({ teamMemberId, reassignToUserId }: { teamMemberId: string; reassignToUserId?: string }) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return removeMember({ workspaceId, token, teamMemberId, reassignToUserId })
    },
    onSuccess: () => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['pm-team', workspaceId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to remove team member'
      toast.error(message)
    },
  })
}

