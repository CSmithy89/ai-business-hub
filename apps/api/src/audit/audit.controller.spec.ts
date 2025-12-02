import { Test, TestingModule } from '@nestjs/testing'
import { AuditController } from './audit.controller'
import { AuditService } from './audit.service'

describe('AuditController', () => {
  let controller: AuditController
  let service: AuditService

  const mockAuditService = {
    getAuditLogs: jest.fn(),
    getActionTypes: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    })
      .overrideGuard(require('../common/guards/auth.guard').AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(require('../common/guards/tenant.guard').TenantGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(require('../common/guards/roles.guard').RolesGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<AuditController>(AuditController)
    service = module.get<AuditService>(AuditService)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getAuditLogs', () => {
    it('should return audit logs', async () => {
      const workspaceId = 'workspace-123'
      const mockResponse = {
        logs: [
          {
            id: 'audit-1',
            workspaceId,
            action: 'role_changed',
            entity: 'workspace_member',
            entityId: 'member-1',
            userId: 'user-1',
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0',
            oldValues: { role: 'member' },
            newValues: { role: 'admin' },
            metadata: {},
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      }

      mockAuditService.getAuditLogs.mockResolvedValue(mockResponse)

      const result = await controller.getAuditLogs(workspaceId, {
        limit: 50,
        offset: 0,
      })

      expect(result).toEqual(mockResponse)
      expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith({
        workspaceId,
        limit: 50,
        offset: 0,
        action: undefined,
        userId: undefined,
        startDate: undefined,
        endDate: undefined,
      })
    })

    it('should pass filters to service', async () => {
      const workspaceId = 'workspace-123'
      const query = {
        limit: 20,
        offset: 10,
        action: 'role_changed',
        userId: 'user-123',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      }

      mockAuditService.getAuditLogs.mockResolvedValue({
        logs: [],
        total: 0,
        limit: 20,
        offset: 10,
      })

      await controller.getAuditLogs(workspaceId, query)

      expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith({
        workspaceId,
        limit: query.limit,
        offset: query.offset,
        action: query.action,
        userId: query.userId,
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      })
    })
  })

  describe('getActionTypes', () => {
    it('should return available action types', async () => {
      const actionTypes = [
        'role_changed',
        'member_added',
        'member_removed',
        'module_permissions_updated',
      ]

      mockAuditService.getActionTypes.mockReturnValue(actionTypes)

      const result = await controller.getActionTypes()

      expect(result).toEqual({ actionTypes })
      expect(mockAuditService.getActionTypes).toHaveBeenCalled()
    })
  })
})
