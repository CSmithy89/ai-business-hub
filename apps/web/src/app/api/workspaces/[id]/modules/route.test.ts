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
    workspaceModule: {
      findMany: vi.fn(),
      upsert: vi.fn(),
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

describe('Workspace Modules API Routes', () => {
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

  describe('GET /api/workspaces/[id]/modules', () => {
    it('masks config for non-admin members', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'member' })
      hoisted.prisma.workspaceModule.findMany.mockResolvedValue([
        {
          workspaceId: 'ws-1',
          moduleId: 'bm-crm',
          enabled: true,
          config: { secret: 'should-not-leak' },
          enabledAt: new Date().toISOString(),
        },
      ])

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/modules')
      const response = await GET(request, { params: Promise.resolve({ id: 'ws-1' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      const crm = body.data.modules.find((m: { id: string }) => m.id === 'bm-crm')
      expect(crm).toBeTruthy()
      expect(crm.enabled).toBe(true)
      expect(crm.config).toEqual({})
    })
  })

  describe('POST /api/workspaces/[id]/modules', () => {
    it('rejects non-admin members', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'member' })

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/modules', {
        method: 'POST',
        body: JSON.stringify({ moduleId: 'bm-crm' }),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'ws-1' }) })
      expect(response.status).toBe(403)
    })

    it('rejects enabling core modules', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'admin' })

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/modules', {
        method: 'POST',
        body: JSON.stringify({ moduleId: 'bm-validation' }),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'ws-1' }) })
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toMatch(/core modules/i)
    })
  })
})
