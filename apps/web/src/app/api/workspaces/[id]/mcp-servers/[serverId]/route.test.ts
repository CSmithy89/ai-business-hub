import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, DELETE } from './route'

const hoisted = vi.hoisted(() => {
  class WorkspaceAuthError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  }

  const mockRequireWorkspaceMembership = vi.fn()
  const mockRequireRole = vi.fn()
  const mockHandleWorkspaceAuthError = vi.fn()

  class PrismaClientKnownRequestError extends Error {
    code: string
    constructor(code: string) {
      super(code)
      this.code = code
    }
  }

  const prisma = {
    mCPServerConfig: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  }

  return {
    WorkspaceAuthError,
    mockRequireWorkspaceMembership,
    mockRequireRole,
    mockHandleWorkspaceAuthError,
    PrismaClientKnownRequestError,
    prisma,
  }
})

vi.mock('@/middleware/workspace-auth', () => ({
  WorkspaceAuthError: hoisted.WorkspaceAuthError,
  requireWorkspaceMembership: (...args: unknown[]) => hoisted.mockRequireWorkspaceMembership(...args),
  requireRole: (...args: unknown[]) => hoisted.mockRequireRole(...args),
  handleWorkspaceAuthError: (...args: unknown[]) => hoisted.mockHandleWorkspaceAuthError(...args),
}))

vi.mock('@hyvve/db', () => ({
  prisma: hoisted.prisma,
  Prisma: { PrismaClientKnownRequestError: hoisted.PrismaClientKnownRequestError },
}))

describe('MCP Server Detail API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.mockHandleWorkspaceAuthError.mockImplementation((error: InstanceType<typeof hoisted.WorkspaceAuthError>) => ({
      body: { success: false, error: error.message },
      status: error.status,
    }))
    hoisted.mockRequireRole.mockImplementation((role: string, allowed: string[]) => {
      if (!allowed.includes(role)) {
        throw new hoisted.WorkspaceAuthError('Forbidden', 403)
      }
    })
  })

  describe('GET /api/workspaces/[id]/mcp-servers/[serverId]', () => {
    it('masks headers/env for non-admin members', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'member' })
      hoisted.prisma.mCPServerConfig.findUnique.mockResolvedValue({
        id: '1',
        serverId: 'github',
        name: 'GitHub',
        transport: 'sse',
        command: null,
        url: 'https://example.com/sse',
        headers: { Authorization: 'Bearer secret' },
        envVars: { MCP_TOKEN: 'secret' },
        includeTools: [],
        excludeTools: [],
        permissions: 1,
        timeoutSeconds: 30,
        enabled: true,
        lastHealthCheck: null,
        healthStatus: 'healthy',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        apiKeyEncrypted: 'encrypted',
      })

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/mcp-servers/github')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'ws-1', serverId: 'github' }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.hasApiKey).toBe(true)
      expect(body.data.headers).toEqual({})
      expect(body.data.envVars).toEqual({})
      expect(body.data.headerKeys).toEqual(['Authorization'])
      expect(body.data.envVarKeys).toEqual(['MCP_TOKEN'])
    })

    it('returns raw headers/env for admins', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'admin' })
      hoisted.prisma.mCPServerConfig.findUnique.mockResolvedValue({
        id: '1',
        serverId: 'github',
        name: 'GitHub',
        transport: 'sse',
        command: null,
        url: 'https://example.com/sse',
        headers: { Authorization: 'Bearer secret' },
        envVars: { MCP_TOKEN: 'secret' },
        includeTools: [],
        excludeTools: [],
        permissions: 1,
        timeoutSeconds: 30,
        enabled: true,
        lastHealthCheck: null,
        healthStatus: 'healthy',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        apiKeyEncrypted: 'encrypted',
      })

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/mcp-servers/github')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'ws-1', serverId: 'github' }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.headers).toEqual({ Authorization: 'Bearer secret' })
      expect(body.data.envVars).toEqual({ MCP_TOKEN: 'secret' })
      expect(body.data.headerKeys).toBeUndefined()
      expect(body.data.envVarKeys).toBeUndefined()
    })
  })

  describe('DELETE /api/workspaces/[id]/mcp-servers/[serverId]', () => {
    it('returns 404 when server was already deleted (P2025)', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'admin' })
      hoisted.prisma.mCPServerConfig.delete.mockRejectedValue(new hoisted.PrismaClientKnownRequestError('P2025'))

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/mcp-servers/github', {
        method: 'DELETE',
      })
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'ws-1', serverId: 'github' }),
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toMatch(/not found/i)
    })
  })
})
