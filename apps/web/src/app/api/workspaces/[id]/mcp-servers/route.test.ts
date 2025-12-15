import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'

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

  const prisma = {
    mCPServerConfig: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  }

  return {
    WorkspaceAuthError,
    mockRequireWorkspaceMembership,
    mockRequireRole,
    mockHandleWorkspaceAuthError,
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
  Prisma: {},
}))

vi.mock('@/lib/utils/encryption', () => ({
  encryptApiKey: vi.fn(async (value: string) => `enc:${value}`),
}))

describe('MCP Servers API Routes', () => {
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

  describe('GET /api/workspaces/[id]/mcp-servers', () => {
    it('returns server summaries (no secrets)', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'member' })
      hoisted.prisma.mCPServerConfig.findMany.mockResolvedValue([
        {
          id: '1',
          serverId: 'github',
          name: 'GitHub',
          transport: 'sse',
          command: null,
          url: 'https://example.com/sse',
          includeTools: [],
          excludeTools: [],
          permissions: 1,
          timeoutSeconds: 30,
          enabled: true,
          lastHealthCheck: null,
          healthStatus: 'healthy',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/mcp-servers')
      const response = await GET(request, { params: Promise.resolve({ id: 'ws-1' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.servers).toHaveLength(1)
      expect(body.data.servers[0].permissionLevel).toBe('Read Only')
      expect(body.data.servers[0].apiKeyEncrypted).toBeUndefined()
      expect(body.data.servers[0].headers).toBeUndefined()
      expect(body.data.servers[0].envVars).toBeUndefined()
    })
  })

  describe('POST /api/workspaces/[id]/mcp-servers', () => {
    it('rejects non-admin members', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'member' })

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/mcp-servers', {
        method: 'POST',
        body: JSON.stringify({
          serverId: 'github',
          name: 'GitHub',
          transport: 'sse',
          url: 'https://example.com/sse',
        }),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'ws-1' }) })
      expect(response.status).toBe(403)
    })

    it('rejects env vars that are not MCP_-scoped', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'admin' })
      hoisted.prisma.mCPServerConfig.findUnique.mockResolvedValue(null)
      hoisted.prisma.mCPServerConfig.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/mcp-servers', {
        method: 'POST',
        body: JSON.stringify({
          serverId: 'github',
          name: 'GitHub',
          transport: 'sse',
          url: 'https://example.com/sse',
          envVars: {
            NOT_ALLOWED: 'value',
          },
        }),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'ws-1' }) })
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('Validation failed')
    })
  })
})
