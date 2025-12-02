import {
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { TenantGuard } from './tenant.guard'
import { PrismaService } from '../services/prisma.service'

describe('TenantGuard', () => {
  let guard: TenantGuard
  let prisma: PrismaService

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    activeWorkspaceId: 'workspace-default',
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

  const mockMember = {
    id: 'member-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
    role: 'admin',
    modulePermissions: null,
    workspace: mockWorkspace,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        {
          provide: PrismaService,
          useValue: {
            workspaceMember: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    guard = module.get<TenantGuard>(TenantGuard)
    prisma = module.get<PrismaService>(PrismaService)
  })

  const createMockExecutionContext = (requestData: {
    user?: any
    params?: any
    body?: any
    query?: any
  }): ExecutionContext => {
    const mockRequest = {
      user: requestData.user,
      params: requestData.params || {},
      body: requestData.body || {},
      query: requestData.query || {},
      workspaceId: undefined,
      workspace: undefined,
      memberRole: undefined,
      modulePermissions: undefined,
    }

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any
  }

  describe('canActivate', () => {
    it('should allow requests when user is workspace member', async () => {
      const context = createMockExecutionContext({
        user: mockUser,
        params: { workspaceId: 'workspace-1' },
      })
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any)

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(context.switchToHttp().getRequest().workspaceId).toBe('workspace-1')
      expect(context.switchToHttp().getRequest().memberRole).toBe('admin')
    })

    it('should reject requests when user not workspace member', async () => {
      const context = createMockExecutionContext({
        user: mockUser,
        params: { workspaceId: 'workspace-1' },
      })
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(null)

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Access denied. You are not a member of this workspace.',
      )
    })

    it('should extract workspace ID from route params', async () => {
      const context = createMockExecutionContext({
        user: mockUser,
        params: { workspaceId: 'workspace-1' },
      })
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any)

      await guard.canActivate(context)

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-1',
            workspaceId: 'workspace-1',
          },
        },
        include: expect.any(Object),
      })
    })

    it('should extract workspace ID from request body', async () => {
      const context = createMockExecutionContext({
        user: mockUser,
        body: { workspaceId: 'workspace-2' },
      })
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue({
        ...mockMember,
        workspaceId: 'workspace-2',
      } as any)

      await guard.canActivate(context)

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-1',
            workspaceId: 'workspace-2',
          },
        },
        include: expect.any(Object),
      })
    })

    it('should extract workspace ID from query params', async () => {
      const context = createMockExecutionContext({
        user: mockUser,
        query: { workspaceId: 'workspace-3' },
      })
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue({
        ...mockMember,
        workspaceId: 'workspace-3',
      } as any)

      await guard.canActivate(context)

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-1',
            workspaceId: 'workspace-3',
          },
        },
        include: expect.any(Object),
      })
    })

    it('should extract workspace ID from user session', async () => {
      const context = createMockExecutionContext({
        user: mockUser,
      })
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue({
        ...mockMember,
        workspaceId: 'workspace-default',
      } as any)

      await guard.canActivate(context)

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-1',
            workspaceId: 'workspace-default',
          },
        },
        include: expect.any(Object),
      })
    })

    it('should throw error when workspace context missing', async () => {
      const context = createMockExecutionContext({
        user: { id: 'user-1', email: 'test@example.com' },
      })

      await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException)
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Workspace context required',
      )
    })

    it('should load member role and attach to request', async () => {
      const context = createMockExecutionContext({
        user: mockUser,
        params: { workspaceId: 'workspace-1' },
      })
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any)

      await guard.canActivate(context)

      const request = context.switchToHttp().getRequest()
      expect(request.memberRole).toBe('admin')
    })

    it('should load module permissions and attach to request', async () => {
      const memberWithPermissions = {
        ...mockMember,
        modulePermissions: { 'bm-crm': { role: 'owner' } },
      }
      const context = createMockExecutionContext({
        user: mockUser,
        params: { workspaceId: 'workspace-1' },
      })
      jest
        .spyOn(prisma.workspaceMember, 'findUnique')
        .mockResolvedValue(memberWithPermissions as any)

      await guard.canActivate(context)

      const request = context.switchToHttp().getRequest()
      expect(request.modulePermissions).toEqual({ 'bm-crm': { role: 'owner' } })
    })

    it('should throw error when user context missing', async () => {
      const context = createMockExecutionContext({
        params: { workspaceId: 'workspace-1' },
      })

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
      await expect(guard.canActivate(context)).rejects.toThrow(
        'User context missing',
      )
    })

    it('should reject access to deleted workspace', async () => {
      const deletedWorkspace = {
        ...mockMember,
        workspace: {
          ...mockWorkspace,
          deletedAt: new Date(),
        },
      }
      const context = createMockExecutionContext({
        user: mockUser,
        params: { workspaceId: 'workspace-1' },
      })
      jest
        .spyOn(prisma.workspaceMember, 'findUnique')
        .mockResolvedValue(deletedWorkspace as any)

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
      await expect(guard.canActivate(context)).rejects.toThrow(
        'This workspace has been deleted',
      )
    })

    it('should prioritize route params over body', async () => {
      const context = createMockExecutionContext({
        user: mockUser,
        params: { workspaceId: 'workspace-1' },
        body: { workspaceId: 'workspace-2' },
      })
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember as any)

      await guard.canActivate(context)

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_workspaceId: {
              userId: 'user-1',
              workspaceId: 'workspace-1',
            },
          },
        }),
      )
    })
  })
})
