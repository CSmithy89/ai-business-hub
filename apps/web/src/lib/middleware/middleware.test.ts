/**
 * Integration tests for Next.js API route middleware
 * Tests authentication, tenant context, and permission checking
 *
 * @module middleware.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withTenant, withPermission } from './index'
import { PERMISSIONS } from '@hyvve/shared'
import type { User, Workspace } from '@hyvve/db'

// Mock better-auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

// Mock Prisma
vi.mock('@hyvve/db', () => ({
  prisma: {
    workspaceMember: {
      findUnique: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@hyvve/db'

// Test fixtures
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: false,
  image: null,
  passwordHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockWorkspace: Workspace = {
  id: 'workspace-123',
  name: 'Test Workspace',
  slug: 'test-workspace',
  image: null,
  timezone: 'UTC',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const mockWorkspaceMember = {
  id: 'member-123',
  userId: 'user-123',
  workspaceId: 'workspace-123',
  role: 'admin',
  modulePermissions: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  workspace: mockWorkspace,
}

// Helper to create mock request
function createMockRequest(
  url: string,
  options: Partial<NextRequest> = {}
): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

describe('withAuth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when no session exists', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const handler = withAuth(async (_req, { user }) => {
      return NextResponse.json({ userId: user.id })
    })

    const req = createMockRequest('/api/test')
    const response = await handler(req)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
    expect(body.message).toBe('Valid session required')
  })

  it('should return 401 when session has no user', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: null } as any)

    const handler = withAuth(async (_req, { user }) => {
      return NextResponse.json({ userId: user.id })
    })

    const req = createMockRequest('/api/test')
    const response = await handler(req)

    expect(response.status).toBe(401)
  })

  it('should pass user to handler when session is valid', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: mockUser,
      session: { id: 'session-123' },
    } as any)

    const handler = withAuth(async (_req, { user }) => {
      return NextResponse.json({ userId: user.id, email: user.email })
    })

    const req = createMockRequest('/api/test')
    const response = await handler(req)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.userId).toBe('user-123')
    expect(body.email).toBe('test@example.com')
  })

  it('should handle session validation errors gracefully', async () => {
    vi.mocked(auth.api.getSession).mockRejectedValue(new Error('Session error'))

    const handler = withAuth(async (_req, { user }) => {
      return NextResponse.json({ userId: user.id })
    })

    const req = createMockRequest('/api/test')
    const response = await handler(req)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })
})

describe('withTenant Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 when workspace ID is not in URL', async () => {
    const handler = withTenant(async (_req, { workspace }) => {
      return NextResponse.json({ workspaceId: workspace.id })
    })

    const req = createMockRequest('/api/test')
    const response = await handler(req, { user: mockUser })

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Bad Request')
    expect(body.message).toBe('Workspace ID required')
  })

  it('should extract workspace ID from URL pathname', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(
      mockWorkspaceMember as any
    )

    const handler = withTenant(async (_req, { workspace }) => {
      return NextResponse.json({ workspaceId: workspace.id })
    })

    const req = createMockRequest('/api/workspaces/workspace-123/members')
    const response = await handler(req, { user: mockUser })

    expect(response.status).toBe(200)
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: {
          userId: 'user-123',
          workspaceId: 'workspace-123',
        },
      },
      include: {
        workspace: true,
      },
    })
  })

  it('should extract workspace ID from query string', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(
      mockWorkspaceMember as any
    )

    const handler = withTenant(async (_req, { workspace }) => {
      return NextResponse.json({ workspaceId: workspace.id })
    })

    const req = createMockRequest('/api/test?workspaceId=workspace-123')
    const response = await handler(req, { user: mockUser })

    expect(response.status).toBe(200)
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalled()
  })

  it('should return 403 when user is not a workspace member', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null)

    const handler = withTenant(async (_req, { workspace }) => {
      return NextResponse.json({ workspaceId: workspace.id })
    })

    const req = createMockRequest('/api/workspaces/workspace-123/members')
    const response = await handler(req, { user: mockUser })

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toBe('Forbidden')
    expect(body.message).toBe('Not a workspace member')
  })

  it('should return 410 when workspace is soft-deleted', async () => {
    const deletedWorkspace = {
      ...mockWorkspaceMember,
      workspace: {
        ...mockWorkspace,
        deletedAt: new Date(),
      },
    }

    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(
      deletedWorkspace as any
    )

    const handler = withTenant(async (_req, { workspace }) => {
      return NextResponse.json({ workspaceId: workspace.id })
    })

    const req = createMockRequest('/api/workspaces/workspace-123/members')
    const response = await handler(req, { user: mockUser })

    expect(response.status).toBe(410)
    const body = await response.json()
    expect(body.error).toBe('Gone')
  })

  it('should pass workspace and memberRole to handler', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(
      mockWorkspaceMember as any
    )

    const handler = withTenant(async (_req, { user, workspace, memberRole }) => {
      return NextResponse.json({
        userId: user.id,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        role: memberRole,
      })
    })

    const req = createMockRequest('/api/workspaces/workspace-123/members')
    const response = await handler(req, { user: mockUser })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.userId).toBe('user-123')
    expect(body.workspaceId).toBe('workspace-123')
    expect(body.workspaceName).toBe('Test Workspace')
    expect(body.role).toBe('admin')
  })

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockRejectedValue(
      new Error('Database error')
    )

    const handler = withTenant(async (_req, { workspace }) => {
      return NextResponse.json({ workspaceId: workspace.id })
    })

    const req = createMockRequest('/api/workspaces/workspace-123/members')
    const response = await handler(req, { user: mockUser })

    expect(response.status).toBe(500)
  })
})

describe('withPermission Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 403 when user lacks required permission', async () => {
    const handler = withPermission(
      [PERMISSIONS.WORKSPACE_DELETE],
      async (_req, { workspace: _workspace }) => {
        return NextResponse.json({ deleted: true })
      }
    )

    const req = createMockRequest('/api/workspaces/workspace-123')
    const response = await handler(req, {
      user: mockUser,
      workspace: mockWorkspace,
      memberRole: 'viewer' as any,
      modulePermissions: null,
    })

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toBe('Forbidden')
    expect(body.message).toBe('Insufficient permissions')
    expect(body.required).toContain(PERMISSIONS.WORKSPACE_DELETE)
  })

  it('should allow handler execution when user has permission', async () => {
    const handler = withPermission(
      [PERMISSIONS.MEMBERS_INVITE],
      async (_req, { workspace: _workspace }) => {
        return NextResponse.json({ invited: true })
      }
    )

    const req = createMockRequest('/api/workspaces/workspace-123/members/invite')
    const response = await handler(req, {
      user: mockUser,
      workspace: mockWorkspace,
      memberRole: 'admin' as any,
      modulePermissions: null,
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.invited).toBe(true)
  })

  it('should use OR logic for multiple permissions', async () => {
    const handler = withPermission(
      [PERMISSIONS.RECORDS_DELETE, PERMISSIONS.WORKSPACE_DELETE],
      async (_req, { workspace: _workspace }) => {
        return NextResponse.json({ success: true })
      }
    )

    const req = createMockRequest('/api/workspaces/workspace-123')

    // Admin has RECORDS_DELETE but not WORKSPACE_DELETE
    // Should pass because of OR logic
    const response = await handler(req, {
      user: mockUser,
      workspace: mockWorkspace,
      memberRole: 'admin' as any,
      modulePermissions: null,
    })

    expect(response.status).toBe(200)
  })

  it('should allow owner to access all permissions', async () => {
    const handler = withPermission(
      [PERMISSIONS.WORKSPACE_DELETE],
      async (_req, { workspace: _workspace }) => {
        return NextResponse.json({ deleted: true })
      }
    )

    const req = createMockRequest('/api/workspaces/workspace-123')
    const response = await handler(req, {
      user: mockUser,
      workspace: mockWorkspace,
      memberRole: 'owner' as any,
      modulePermissions: null,
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.deleted).toBe(true)
  })

  it('should handle invalid permissions array', async () => {
    const handler = withPermission(
      [] as any,
      async (_req, { workspace: _workspace }) => {
        return NextResponse.json({ success: true })
      }
    )

    const req = createMockRequest('/api/workspaces/workspace-123')
    const response = await handler(req, {
      user: mockUser,
      workspace: mockWorkspace,
      memberRole: 'admin' as any,
      modulePermissions: null,
    })

    expect(response.status).toBe(500)
  })
})

describe('Middleware Composition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should compose withAuth and withTenant', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: mockUser,
      session: { id: 'session-123' },
    } as any)

    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(
      mockWorkspaceMember as any
    )

    const handler = withAuth(
      withTenant(async (_req, { user, workspace, memberRole }) => {
        return NextResponse.json({
          userId: user.id,
          workspaceId: workspace.id,
          role: memberRole,
        })
      })
    )

    const req = createMockRequest('/api/workspaces/workspace-123/members')
    const response = await handler(req)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.userId).toBe('user-123')
    expect(body.workspaceId).toBe('workspace-123')
    expect(body.role).toBe('admin')
  })

  it('should compose withAuth, withTenant, and withPermission', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: mockUser,
      session: { id: 'session-123' },
    } as any)

    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(
      mockWorkspaceMember as any
    )

    const handler = withAuth(
      withTenant(
        withPermission([PERMISSIONS.MEMBERS_INVITE], async (_req, { user, workspace }) => {
          return NextResponse.json({
            userId: user.id,
            workspaceId: workspace.id,
            action: 'invite',
          })
        })
      )
    )

    const req = createMockRequest('/api/workspaces/workspace-123/members/invite')
    const response = await handler(req)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.userId).toBe('user-123')
    expect(body.workspaceId).toBe('workspace-123')
    expect(body.action).toBe('invite')
  })

  it('should short-circuit on auth failure', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const handler = withAuth(
      withTenant(async (_req, { user: _user, workspace: _workspace }) => {
        return NextResponse.json({ success: true })
      })
    )

    const req = createMockRequest('/api/workspaces/workspace-123/members')
    const response = await handler(req)

    expect(response.status).toBe(401)
    // withTenant should not be called
    expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled()
  })

  it('should short-circuit on tenant validation failure', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: mockUser,
      session: { id: 'session-123' },
    } as any)

    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null)

    let handlerCalled = false

    const handler = withAuth(
      withTenant(
        withPermission([PERMISSIONS.MEMBERS_INVITE], async (_req, _ctx) => {
          handlerCalled = true
          return NextResponse.json({ success: true })
        })
      )
    )

    const req = createMockRequest('/api/workspaces/workspace-123/members/invite')
    const response = await handler(req)

    expect(response.status).toBe(403)
    expect(handlerCalled).toBe(false)
  })

  it('should short-circuit on permission check failure', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: mockUser,
      session: { id: 'session-123' },
    } as any)

    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      ...mockWorkspaceMember,
      role: 'viewer', // Viewer doesn't have WORKSPACE_DELETE permission
    } as any)

    let handlerCalled = false

    const handler = withAuth(
      withTenant(
        withPermission([PERMISSIONS.WORKSPACE_DELETE], async (_req, _ctx) => {
          handlerCalled = true
          return NextResponse.json({ success: true })
        })
      )
    )

    const req = createMockRequest('/api/workspaces/workspace-123')
    const response = await handler(req)

    expect(response.status).toBe(403)
    expect(handlerCalled).toBe(false)
  })
})
