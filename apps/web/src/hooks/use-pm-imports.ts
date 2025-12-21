'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
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

export type CsvImportMapping = Record<string, string>

export type StartCsvImportPayload = {
  projectId: string
  phaseId?: string
  csvText: string
  mapping: CsvImportMapping
  skipInvalidRows?: boolean
}

export type StartJiraImportPayload = {
  projectId: string
  baseUrl: string
  email: string
  apiToken: string
  jql?: string
  maxResults?: number
}

export type StartAsanaImportPayload = {
  projectId: string
  accessToken: string
  projectGid: string
}

export type StartTrelloImportPayload = {
  projectId: string
  apiKey: string
  token: string
  boardId: string
}

export type ImportJobSummary = {
  id: string
  status: string
  totalRows: number
  processedRows: number
  errorCount: number
  createdAt?: string
  updatedAt?: string
}

export function useStartCsvImport() {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: async (payload: StartCsvImportPayload) => {
      const base = getBaseUrl()
      const response = await fetch(`${base}/pm/imports/csv/start`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      const body = await safeJson<unknown>(response)
      if (!response.ok) {
        const message =
          body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
            ? body.message
            : undefined
        throw new Error(message || 'Failed to start CSV import')
      }

      if (!body || typeof body !== 'object' || !('data' in body)) {
        throw new Error('Failed to start CSV import')
      }

      return body as { data: ImportJobSummary }
    },
  })
}

export function useStartJiraImport() {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: async (payload: StartJiraImportPayload) => {
      const base = getBaseUrl()
      const response = await fetch(`${base}/pm/imports/jira/start`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      const body = await safeJson<unknown>(response)
      if (!response.ok) {
        const message =
          body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
            ? body.message
            : undefined
        throw new Error(message || 'Failed to start Jira import')
      }

      if (!body || typeof body !== 'object' || !('data' in body)) {
        throw new Error('Failed to start Jira import')
      }

      return body as { data: ImportJobSummary }
    },
  })
}

export function useStartAsanaImport() {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: async (payload: StartAsanaImportPayload) => {
      const base = getBaseUrl()
      const response = await fetch(`${base}/pm/imports/asana/start`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      const body = await safeJson<unknown>(response)
      if (!response.ok) {
        const message =
          body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
            ? body.message
            : undefined
        throw new Error(message || 'Failed to start Asana import')
      }

      if (!body || typeof body !== 'object' || !('data' in body)) {
        throw new Error('Failed to start Asana import')
      }

      return body as { data: ImportJobSummary }
    },
  })
}

export function useStartTrelloImport() {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useMutation({
    mutationFn: async (payload: StartTrelloImportPayload) => {
      const base = getBaseUrl()
      const response = await fetch(`${base}/pm/imports/trello/start`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      const body = await safeJson<unknown>(response)
      if (!response.ok) {
        const message =
          body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
            ? body.message
            : undefined
        throw new Error(message || 'Failed to start Trello import')
      }

      if (!body || typeof body !== 'object' || !('data' in body)) {
        throw new Error('Failed to start Trello import')
      }

      return body as { data: ImportJobSummary }
    },
  })
}

export function useImportStatus(importJobId: string | null) {
  const { data: session } = useSession()
  const token = getSessionToken(session)

  return useQuery({
    queryKey: ['pm-import-status', importJobId],
    enabled: !!importJobId,
    queryFn: async () => {
      if (!importJobId) throw new Error('Missing import job id')
      const base = getBaseUrl()
      const response = await fetch(`${base}/pm/imports/${encodeURIComponent(importJobId)}/status`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      })

      const body = await safeJson<unknown>(response)
      if (!response.ok) {
        const message =
          body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
            ? body.message
            : undefined
        throw new Error(message || 'Failed to fetch import status')
      }

      if (!body || typeof body !== 'object' || !('data' in body)) {
        throw new Error('Failed to fetch import status')
      }

      return body as { data: ImportJobSummary }
    },
  })
}
