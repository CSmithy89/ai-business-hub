import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthGuard } from './auth.guard'
import { TenantGuard } from './tenant.guard'
import { RolesGuard } from './roles.guard'
import { PrismaService } from '../services/prisma.service'

describe('Guards Integration', () => {
  let authGuard: AuthGuard
  let tenantGuard: TenantGuard
  let rolesGuard: RolesGuard
  let prisma: PrismaService
  let reflector: Reflector

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    emailVerified: true,
  }

  const mockSession = {
    id: 'session-1',
    token: 'valid-token',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 86400000),
    activeWorkspaceId: 'workspace-1',
    user: mockUser,
  }

  const mockWorkspace = {
    id: 'workspace-1',
    name: 'Test Workspace',
    slug: 'test-workspace',
    image: null,
    timezone: 'UTC',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

  const mockAdminMember = {
    id: 'member-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
    role: 'admin',
    modulePermissions: null,
    workspace: mockWorkspace,
  }

  const mockMemberMember = {
    ...mockAdminMember,
    role: 'member',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        TenantGuard,
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            session: {
              findUnique: jest.fn(),
            },
            workspaceMember: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    authGuard = module.get<AuthGuard>(AuthGuard)
    tenantGuard = module.get<TenantGuard>(TenantGuard)
    rolesGuard = module.get<RolesGuard>(RolesGuard)
    prisma = module.get<PrismaService>(PrismaService)
    reflector = module.get<Reflector>(Reflector)
  })

  const createMockExecutionContext = (
    authHeader?: string,
    workspaceId?: string,
    isPublic = false,
    requiredRoles?: string[],
  ): ExecutionContext => {
    const mockRequest = {
      headers: authHeader ? { authorization: authHeader } : {},
      params: workspaceId ? { workspaceId } : {},
      body: {},
      query: {},
      user: undefined,
      workspaceId: undefined,
      workspace: undefined,
      memberRole: undefined,
      modulePermissions: undefined,
    }

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'isPublic') return isPublic
      if (key === 'roles') return requiredRoles
      return undefined
    })

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any
  }

  describe('Full Guard Chain (AuthGuard + TenantGuard + RolesGuard)', () => {
    it('should allow admin to access admin endpoint', async () => {
      const context = createMockExecutionContext(
        'Bearer valid-token',
        'workspace-1',
        false,
        ['admin', 'owner'],
      )

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession as any)
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockAdminMember as any)

      // Run all guards in sequence
      await authGuard.canActivate(context)
      await tenantGuard.canActivate(context)
      const result = rolesGuard.canActivate(context)

      expect(result).toBe(true)
      const request = context.switchToHttp().getRequest()
      expect(request.user).toBeDefined()
      expect(request.workspaceId).toBe('workspace-1')
      expect(request.memberRole).toBe('admin')
    })

    it('should deny member from accessing admin endpoint', async () => {
      const context = createMockExecutionContext(
        'Bearer valid-token',
        'workspace-1',
        false,
        ['admin', 'owner'],
      )

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession as any)
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMemberMember as any)

      await authGuard.canActivate(context)
      await tenantGuard.canActivate(context)

      expect(() => rolesGuard.canActivate(context)).toThrow('Insufficient permissions')
    })

    it('should allow @Public() endpoint to bypass all auth', async () => {
      const context = createMockExecutionContext(undefined, undefined, true)

      const authResult = await authGuard.canActivate(context)

      expect(authResult).toBe(true)
      expect(prisma.session.findUnique).not.toHaveBeenCalled()
    })

    it('should deny non-member from accessing workspace endpoint', async () => {
      const context = createMockExecutionContext('Bearer valid-token', 'workspace-1')

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession as any)
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(null)

      await authGuard.canActivate(context)

      await expect(tenantGuard.canActivate(context)).rejects.toThrow(
        'You are not a member of this workspace',
      )
    })

    it('should allow access when no @Roles() specified', async () => {
      const context = createMockExecutionContext(
        'Bearer valid-token',
        'workspace-1',
        false,
        undefined,
      )

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession as any)
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMemberMember as any)

      await authGuard.canActivate(context)
      await tenantGuard.canActivate(context)
      const result = rolesGuard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should handle workspace switching correctly', async () => {
      // First workspace
      const context1 = createMockExecutionContext('Bearer valid-token', 'workspace-1')
      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession as any)
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockAdminMember as any)

      await authGuard.canActivate(context1)
      await tenantGuard.canActivate(context1)

      expect(context1.switchToHttp().getRequest().workspaceId).toBe('workspace-1')

      // Second workspace (different)
      const context2 = createMockExecutionContext('Bearer valid-token', 'workspace-2')
      const workspace2Member = {
        ...mockMemberMember,
        workspaceId: 'workspace-2',
        workspace: { ...mockWorkspace, id: 'workspace-2' },
      }
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(workspace2Member as any)

      await authGuard.canActivate(context2)
      await tenantGuard.canActivate(context2)

      expect(context2.switchToHttp().getRequest().workspaceId).toBe('workspace-2')
    })

    it('should fail fast on invalid JWT without querying workspace', async () => {
      const context = createMockExecutionContext('Bearer invalid-token', 'workspace-1')
      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(null)

      await expect(authGuard.canActivate(context)).rejects.toThrow()
      expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled()
    })

    it('should properly attach all context data in correct order', async () => {
      const context = createMockExecutionContext('Bearer valid-token', 'workspace-1')
      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession as any)
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockAdminMember as any)

      // AuthGuard attaches user
      await authGuard.canActivate(context)
      const afterAuth = context.switchToHttp().getRequest()
      expect(afterAuth.user).toBeDefined()
      expect(afterAuth.workspaceId).toBeUndefined()

      // TenantGuard attaches workspace context
      await tenantGuard.canActivate(context)
      const afterTenant = context.switchToHttp().getRequest()
      expect(afterTenant.workspaceId).toBe('workspace-1')
      expect(afterTenant.workspace).toBeDefined()
      expect(afterTenant.memberRole).toBe('admin')

      // RolesGuard validates but doesn't modify request
      rolesGuard.canActivate(context)
      const afterRoles = context.switchToHttp().getRequest()
      expect(afterRoles).toEqual(afterTenant)
    })
  })

  describe('Owner-only Endpoint', () => {
    it('should allow owner to access', async () => {
      const ownerMember = { ...mockAdminMember, role: 'owner' }
      const context = createMockExecutionContext(
        'Bearer valid-token',
        'workspace-1',
        false,
        ['owner'],
      )

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession as any)
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(ownerMember as any)

      await authGuard.canActivate(context)
      await tenantGuard.canActivate(context)
      const result = rolesGuard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should deny admin from owner-only endpoint', async () => {
      const context = createMockExecutionContext(
        'Bearer valid-token',
        'workspace-1',
        false,
        ['owner'],
      )

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession as any)
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockAdminMember as any)

      await authGuard.canActivate(context)
      await tenantGuard.canActivate(context)

      expect(() => rolesGuard.canActivate(context)).toThrow('Insufficient permissions')
    })
  })
})
