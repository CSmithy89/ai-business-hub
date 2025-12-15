import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from './route'

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
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
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

describe('Workspace Module Detail API Routes', () => {
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

  describe('GET /api/workspaces/[id]/modules/[moduleId]', () => {
    it('masks config for non-admin members', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'member' })
      hoisted.prisma.workspaceModule.findUnique.mockResolvedValue({
        enabled: true,
        config: { secret: 'should-not-leak' },
        enabledAt: new Date().toISOString(),
        disabledAt: null,
      })

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/modules/bm-crm')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'ws-1', moduleId: 'bm-crm' }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.config).toEqual({})
    })

    it('returns config for admins', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'admin' })
      hoisted.prisma.workspaceModule.findUnique.mockResolvedValue({
        enabled: true,
        config: { hello: 'world' },
        enabledAt: new Date().toISOString(),
        disabledAt: null,
      })

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/modules/bm-crm')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'ws-1', moduleId: 'bm-crm' }),
      })

      const body = await response.json()
      expect(body.data.config).toEqual({ hello: 'world' })
    })
  })

  describe('PATCH /api/workspaces/[id]/modules/[moduleId]', () => {
    it('sets disabledAt when creating a disabled module record', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'admin' })

      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

      hoisted.prisma.workspaceModule.upsert.mockResolvedValue({
        enabled: false,
        config: {},
        enabledAt: null,
        disabledAt: new Date('2025-01-01T00:00:00.000Z'),
      })

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/modules/bm-crm', {
        method: 'PATCH',
        body: JSON.stringify({ enabled: false }),
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'ws-1', moduleId: 'bm-crm' }),
      })

      expect(response.status).toBe(200)
      expect(hoisted.prisma.workspaceModule.upsert).toHaveBeenCalled()

      const call = hoisted.prisma.workspaceModule.upsert.mock.calls[0]?.[0]
      expect(call.create.enabled).toBe(false)
      expect(call.create.enabledAt).toBeNull()
      expect(call.create.disabledAt).toEqual(new Date('2025-01-01T00:00:00.000Z'))

      vi.useRealTimers()
    })
  })

  describe('DELETE /api/workspaces/[id]/modules/[moduleId]', () => {
    it('rejects disabling an already-disabled module', async () => {
      hoisted.mockRequireWorkspaceMembership.mockResolvedValue({ role: 'admin' })
      hoisted.prisma.workspaceModule.findUnique.mockResolvedValue({
        enabled: false,
      })

      const request = new NextRequest('http://localhost/api/workspaces/ws-1/modules/bm-crm', {
        method: 'DELETE',
      })

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'ws-1', moduleId: 'bm-crm' }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toMatch(/already disabled/i)
    })
  })
})
