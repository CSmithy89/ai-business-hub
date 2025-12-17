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

export type WorkspaceMemberWithUser = {
  id: string
  workspaceId: string
  userId: string
  role: string
  acceptedAt: string | null
  user: { id: string; email: string; name: string | null; image: string | null }
}

async function fetchWorkspaceMembers(params: { workspaceId: string; token?: string }): Promise<WorkspaceMemberWithUser[]> {
  const base = getBaseUrl()

  const response = await fetch(`${base}/workspaces/${encodeURIComponent(params.workspaceId)}/members`, {
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
    throw new Error(message || 'Failed to fetch workspace members')
  }

  if (!Array.isArray(body)) throw new Error('Failed to fetch workspace members')
  return body as WorkspaceMemberWithUser[]
}

export function useWorkspaceMembers() {
  const { data: session } = useSession()
  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)?.activeWorkspaceId
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => fetchWorkspaceMembers({ workspaceId: workspaceId!, token }),
    enabled: !!workspaceId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  })
}

