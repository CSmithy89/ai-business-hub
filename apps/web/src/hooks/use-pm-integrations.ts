'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { getSessionToken, useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import { safeJson } from '@/lib/utils/safe-json'

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured')
  return NESTJS_API_URL.replace(/\/$/, '')
}

export type IntegrationConnection = {
  id: string
  provider: string
  status: string
  metadata: Record<string, unknown> | null
  lastCheckedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ConnectIntegrationPayload = {
  provider: string
  token: string
  metadata?: Record<string, unknown>
}

export type GithubIssuesSyncPayload = {
  projectId: string
  owner: string
  repo: string
  state?: 'open' | 'closed' | 'all'
}

export type GithubIssuesSyncResult = {
  total: number
  created: number
  skipped: number
}

export function useListIntegrations() {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['pm-integrations'],
    queryFn: async () => {
      const base = getBaseUrl()
      const response = await fetch(`${base}/pm/integrations`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      })

      const body = await safeJson<unknown>(response)
      if (!response.ok) {
        throw new Error('Failed to load integrations')
      }

      if (!body || typeof body !== 'object' || !('data' in body)) {
        throw new Error('Failed to load integrations')
      }

      return body as { data: IntegrationConnection[] }
    },
  })
}

export function useConnectIntegration() {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: async (payload: ConnectIntegrationPayload) => {
      const base = getBaseUrl()
      const response = await fetch(
        `${base}/pm/integrations/${encodeURIComponent(payload.provider)}/connect`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ token: payload.token, metadata: payload.metadata }),
        },
      )

      const body = await safeJson<unknown>(response)
      if (!response.ok) {
        throw new Error('Failed to connect integration')
      }

      if (!body || typeof body !== 'object' || !('data' in body)) {
        throw new Error('Failed to connect integration')
      }

      return body as { data: IntegrationConnection }
    },
  })
}

export function useSyncGithubIssues() {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: async (payload: GithubIssuesSyncPayload) => {
      const base = getBaseUrl()
      const response = await fetch(`${base}/pm/integrations/github/issues/sync`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const body = await safeJson<unknown>(response)
      if (!response.ok) {
        throw new Error('Failed to sync GitHub issues')
      }

      if (!body || typeof body !== 'object' || !('data' in body)) {
        throw new Error('Failed to sync GitHub issues')
      }

      return body as { data: GithubIssuesSyncResult }
    },
  })
}
