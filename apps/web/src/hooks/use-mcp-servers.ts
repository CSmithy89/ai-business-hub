'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client'
import { safeJson } from '@/lib/utils/safe-json'

export type MCPTransport = 'stdio' | 'sse' | 'streamable-http'

export interface MCPServerSummary {
  id: string
  serverId: string
  name: string
  transport: MCPTransport
  command: string | null
  url: string | null
  includeTools: string[]
  excludeTools: string[]
  permissions: number
  permissionLevel: string
  timeoutSeconds: number
  enabled: boolean
  lastHealthCheck: string | null
  healthStatus: string | null
  createdAt: string
  updatedAt: string
}

export interface MCPServerDetail extends MCPServerSummary {
  headers: Record<string, string>
  envVars: Record<string, string>
  hasApiKey: boolean
}

export interface MCPServerCreateRequest {
  serverId: string
  name: string
  transport: MCPTransport
  command?: string
  url?: string
  apiKey?: string
  headers?: Record<string, string>
  envVars?: Record<string, string>
  includeTools?: string[]
  excludeTools?: string[]
  permissions?: number
  timeoutSeconds?: number
  enabled?: boolean
}

export interface MCPServerUpdateRequest {
  name?: string
  transport?: MCPTransport
  command?: string | null
  url?: string | null
  apiKey?: string | null
  headers?: Record<string, string>
  envVars?: Record<string, string>
  includeTools?: string[]
  excludeTools?: string[]
  permissions?: number
  timeoutSeconds?: number
  enabled?: boolean
}

interface MCPServersListResponse {
  success: true
  data: {
    servers: MCPServerSummary[]
    permissionLevels: Array<{ value: number; name: string; description: string }>
    transports: Array<{ value: MCPTransport; name: string; description: string }>
  }
}

interface MCPServerResponse {
  success: true
  data: MCPServerDetail
}

function getActiveWorkspaceId(session: unknown): string | null {
  const activeWorkspaceId = (session as { session?: { activeWorkspaceId?: string } } | null)?.session
    ?.activeWorkspaceId
  return activeWorkspaceId ?? null
}

async function fetchMCPServers(workspaceId: string): Promise<MCPServersListResponse['data']> {
  const response = await apiGet(`/api/workspaces/${encodeURIComponent(workspaceId)}/mcp-servers`)
  const body = await safeJson<Record<string, unknown>>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    const error =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : undefined
    throw new Error(message || error || 'Failed to fetch MCP servers')
  }
  const data = (body as MCPServersListResponse | null)?.data
  if (!data) throw new Error('Failed to fetch MCP servers')
  return data
}

async function fetchMCPServer(workspaceId: string, serverId: string): Promise<MCPServerDetail> {
  const response = await apiGet(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/mcp-servers/${encodeURIComponent(serverId)}`
  )
  const body = await safeJson<Record<string, unknown>>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    const error =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : undefined
    throw new Error(message || error || 'Failed to fetch MCP server')
  }
  const data = (body as MCPServerResponse | null)?.data
  if (!data) throw new Error('Failed to fetch MCP server')
  return data
}

async function createMCPServer(workspaceId: string, data: MCPServerCreateRequest): Promise<void> {
  const response = await apiPost(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/mcp-servers`,
    data
  )
  const body = await safeJson<Record<string, unknown>>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    const error =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : undefined
    throw new Error(message || error || 'Failed to create MCP server')
  }
}

async function updateMCPServer(
  workspaceId: string,
  serverId: string,
  data: MCPServerUpdateRequest
): Promise<void> {
  const response = await apiPatch(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/mcp-servers/${encodeURIComponent(serverId)}`,
    data
  )
  const body = await safeJson<Record<string, unknown>>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    const error =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : undefined
    throw new Error(message || error || 'Failed to update MCP server')
  }
}

async function deleteMCPServer(workspaceId: string, serverId: string): Promise<void> {
  const response = await apiDelete(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/mcp-servers/${encodeURIComponent(serverId)}`
  )
  const body = await safeJson<Record<string, unknown>>(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined
    const error =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : undefined
    throw new Error(message || error || 'Failed to delete MCP server')
  }
}

export function useMCPServers() {
  const { data: session } = useSession()
  const workspaceId = getActiveWorkspaceId(session)

  return useQuery({
    queryKey: ['mcp-servers', workspaceId],
    queryFn: () => fetchMCPServers(workspaceId!),
    enabled: !!workspaceId,
  })
}

export function useMCPServer(serverId: string | null) {
  const { data: session } = useSession()
  const workspaceId = getActiveWorkspaceId(session)

  return useQuery({
    queryKey: ['mcp-server', workspaceId, serverId],
    queryFn: () => fetchMCPServer(workspaceId!, serverId!),
    enabled: !!workspaceId && !!serverId,
  })
}

export function useMCPServerMutations() {
  const { data: session } = useSession()
  const workspaceId = getActiveWorkspaceId(session)
  const queryClient = useQueryClient()

  const createServer = useMutation({
    mutationFn: async (data: MCPServerCreateRequest) => {
      if (!workspaceId) throw new Error('No active workspace')
      await createMCPServer(workspaceId, data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mcp-servers', workspaceId] })
    },
  })

  const updateServer = useMutation({
    mutationFn: async (input: { serverId: string; data: MCPServerUpdateRequest }) => {
      if (!workspaceId) throw new Error('No active workspace')
      await updateMCPServer(workspaceId, input.serverId, input.data)
    },
    onSuccess: async (_data, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mcp-servers', workspaceId] }),
        queryClient.invalidateQueries({ queryKey: ['mcp-server', workspaceId, input.serverId] }),
      ])
    },
  })

  const deleteServer = useMutation({
    mutationFn: async (serverId: string) => {
      if (!workspaceId) throw new Error('No active workspace')
      await deleteMCPServer(workspaceId, serverId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mcp-servers', workspaceId] })
    },
  })

  return {
    createServer,
    updateServer,
    deleteServer,
  }
}
