import { Test, TestingModule } from '@nestjs/testing'
import { AuditService } from './audit.service'
import { PrismaService } from '../common/services/prisma.service'
import { Prisma } from '@prisma/client'

describe('AuditService', () => {
  let service: AuditService
  let prismaService: PrismaService

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<AuditService>(AuditService)
    prismaService = module.get<PrismaService>(PrismaService)

    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('logRoleChange', () => {
    it('should log a role change', async () => {
      const params = {
        workspaceId: 'workspace-123',
        actorId: 'user-123',
        targetMemberId: 'member-456',
        oldRole: 'member',
        newRole: 'admin',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }

      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'audit-123',
        ...params,
      })

      await service.logRoleChange(params)

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          workspaceId: params.workspaceId,
          action: 'role_changed',
          entity: 'workspace_member',
          entityId: params.targetMemberId,
          userId: params.actorId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: { role: params.oldRole },
          newValues: { role: params.newRole },
          metadata: {
            changeType: 'role',
            description: `Role changed from ${params.oldRole} to ${params.newRole}`,
          },
        },
      })
    })

    it('should not throw error if audit logging fails', async () => {
      mockPrismaService.auditLog.create.mockRejectedValue(new Error('Database error'))

      await expect(
        service.logRoleChange({
          workspaceId: 'workspace-123',
          actorId: 'user-123',
          targetMemberId: 'member-456',
          oldRole: 'member',
          newRole: 'admin',
        })
      ).resolves.not.toThrow()
    })
  })

  describe('logMemberAdded', () => {
    it('should log a new member addition', async () => {
      const params = {
        workspaceId: 'workspace-123',
        actorId: 'user-123',
        newMemberId: 'member-789',
        role: 'member',
        invitationId: 'invite-456',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }

      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'audit-123',
        ...params,
      })

      await service.logMemberAdded(params)

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          workspaceId: params.workspaceId,
          action: 'member_added',
          entity: 'workspace_member',
          entityId: params.newMemberId,
          userId: params.actorId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: Prisma.JsonNull,
          newValues: { role: params.role },
          metadata: {
            changeType: 'member_added',
            invitationId: params.invitationId,
            description: `New member added with role ${params.role}`,
          },
        },
      })
    })
  })

  describe('logMemberRemoved', () => {
    it('should log a member removal', async () => {
      const params = {
        workspaceId: 'workspace-123',
        actorId: 'user-123',
        removedMemberId: 'member-456',
        removedMemberEmail: 'removed@example.com',
        removedMemberRole: 'member',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }

      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'audit-123',
        ...params,
      })

      await service.logMemberRemoved(params)

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          workspaceId: params.workspaceId,
          action: 'member_removed',
          entity: 'workspace_member',
          entityId: params.removedMemberId,
          userId: params.actorId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: {
            email: params.removedMemberEmail,
            role: params.removedMemberRole,
          },
          newValues: Prisma.JsonNull,
          metadata: {
            changeType: 'member_removed',
            description: `Member ${params.removedMemberEmail} (${params.removedMemberRole}) removed`,
          },
        },
      })
    })
  })

  describe('logPermissionOverrideChange', () => {
    it('should log module permission override changes', async () => {
      const params = {
        workspaceId: 'workspace-123',
        actorId: 'user-123',
        targetMemberId: 'member-456',
        targetMemberEmail: 'user@example.com',
        targetMemberRole: 'member',
        oldPermissions: { 'bm-crm': { role: 'viewer' } },
        newPermissions: { 'bm-crm': { role: 'admin' } },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }

      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'audit-123',
        ...params,
      })

      await service.logPermissionOverrideChange(params)

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          workspaceId: params.workspaceId,
          action: 'module_permissions_updated',
          entity: 'workspace_member',
          entityId: params.targetMemberId,
          userId: params.actorId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: { modulePermissions: params.oldPermissions },
          newValues: { modulePermissions: params.newPermissions },
          metadata: {
            changeType: 'module_permissions',
            memberEmail: params.targetMemberEmail,
            memberRole: params.targetMemberRole,
            description: 'Module permission overrides updated',
          },
        },
      })
    })
  })

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with default pagination', async () => {
      const workspaceId = 'workspace-123'
      const mockLogs = [
        {
          id: 'audit-1',
          workspaceId,
          action: 'role_changed',
          entity: 'workspace_member',
          entityId: 'member-1',
          userId: 'user-1',
          oldValues: { role: 'member' },
          newValues: { role: 'admin' },
          createdAt: new Date(),
        },
        {
          id: 'audit-2',
          workspaceId,
          action: 'member_added',
          entity: 'workspace_member',
          entityId: 'member-2',
          userId: 'user-1',
          oldValues: Prisma.JsonNull,
          newValues: { role: 'member' },
          createdAt: new Date(),
        },
      ]

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs)
      mockPrismaService.auditLog.count.mockResolvedValue(2)

      const result = await service.getAuditLogs({ workspaceId })

      expect(result).toEqual({
        logs: mockLogs,
        total: 2,
        limit: 50,
        offset: 0,
      })

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      })
    })

    it('should filter audit logs by action', async () => {
      const workspaceId = 'workspace-123'
      const action = 'role_changed'

      mockPrismaService.auditLog.findMany.mockResolvedValue([])
      mockPrismaService.auditLog.count.mockResolvedValue(0)

      await service.getAuditLogs({ workspaceId, action })

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { workspaceId, action },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      })
    })

    it('should filter audit logs by user', async () => {
      const workspaceId = 'workspace-123'
      const userId = 'user-123'

      mockPrismaService.auditLog.findMany.mockResolvedValue([])
      mockPrismaService.auditLog.count.mockResolvedValue(0)

      await service.getAuditLogs({ workspaceId, userId })

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { workspaceId, userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      })
    })

    it('should filter audit logs by date range', async () => {
      const workspaceId = 'workspace-123'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')

      mockPrismaService.auditLog.findMany.mockResolvedValue([])
      mockPrismaService.auditLog.count.mockResolvedValue(0)

      await service.getAuditLogs({ workspaceId, startDate, endDate })

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      })
    })

    it('should support custom limit and offset', async () => {
      const workspaceId = 'workspace-123'

      mockPrismaService.auditLog.findMany.mockResolvedValue([])
      mockPrismaService.auditLog.count.mockResolvedValue(0)

      await service.getAuditLogs({
        workspaceId,
        limit: 10,
        offset: 20,
      })

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      })
    })
  })

  describe('getActionTypes', () => {
    it('should return available action types', () => {
      const actionTypes = service.getActionTypes()

      expect(actionTypes).toEqual([
        'role_changed',
        'member_added',
        'member_removed',
        'module_permissions_updated',
        'member_invited',
      ])
    })
  })
})
