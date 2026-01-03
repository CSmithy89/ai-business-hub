import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('ApprovalsController', () => {
  let controller: ApprovalsController;
  let service: jest.Mocked<ApprovalsService>;

  const mockWorkspaceId = 'workspace-123';
  const mockUserId = 'user-123';
  const mockApprovalId = 'approval-123';

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockApproval = {
    id: mockApprovalId,
    workspaceId: mockWorkspaceId,
    type: 'content',
    title: 'Test Approval',
    description: 'Test description',
    confidenceScore: 72,
    factors: [],
    status: 'pending',
    priority: 'medium',
    dueAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaginatedResponse = {
    items: [mockApproval],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalsController],
      providers: [
        {
          provide: ApprovalsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            approve: jest.fn(),
            reject: jest.fn(),
            bulkAction: jest.fn(),
            cancel: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<ApprovalsController>(ApprovalsController);
    service = module.get(ApprovalsService) as jest.Mocked<ApprovalsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listApprovals', () => {
    it('should return paginated list of approvals', async () => {
      service.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.listApprovals(mockWorkspaceId, {
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findAll).toHaveBeenCalledWith(mockWorkspaceId, {
        page: 1,
        limit: 20,
      });
    });

    it('should pass query parameters to service', async () => {
      service.findAll.mockResolvedValue(mockPaginatedResponse);

      const query = {
        status: 'pending' as const,
        type: 'content',
        priority: 'high' as const,
        page: 2,
        limit: 10,
      };

      await controller.listApprovals(mockWorkspaceId, query);

      expect(service.findAll).toHaveBeenCalledWith(mockWorkspaceId, query);
    });
  });

  describe('getApproval', () => {
    it('should return single approval by ID', async () => {
      service.findOne.mockResolvedValue(mockApproval);

      const result = await controller.getApproval(
        mockWorkspaceId,
        mockApprovalId,
      );

      expect(result).toEqual(mockApproval);
      expect(service.findOne).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockApprovalId,
      );
    });

    it('should throw NotFoundException for invalid ID', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Approval item not found in this workspace'),
      );

      await expect(
        controller.getApproval(mockWorkspaceId, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for wrong workspace', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Approval item not found in this workspace'),
      );

      await expect(
        controller.getApproval('different-workspace', mockApprovalId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveItem', () => {
    it('should approve approval with notes', async () => {
      const approvedItem = {
        ...mockApproval,
        status: 'approved',
        decidedById: mockUserId,
        decidedAt: new Date(),
      };

      service.approve.mockResolvedValue(approvedItem);

      const result = await controller.approveItem(
        mockWorkspaceId,
        mockApprovalId,
        { notes: 'Looks good' },
        mockUser,
      );

      expect(result).toEqual(approvedItem);
      expect(service.approve).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        { notes: 'Looks good' },
      );
    });

    it('should approve without notes', async () => {
      const approvedItem = {
        ...mockApproval,
        status: 'approved',
        decidedById: mockUserId,
      };

      service.approve.mockResolvedValue(approvedItem);

      await controller.approveItem(
        mockWorkspaceId,
        mockApprovalId,
        {},
        mockUser,
      );

      expect(service.approve).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        {},
      );
    });

    it('should throw BadRequestException if already approved', async () => {
      service.approve.mockRejectedValue(
        new BadRequestException('Cannot approve item with status: approved'),
      );

      await expect(
        controller.approveItem(mockWorkspaceId, mockApprovalId, {}, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectItem', () => {
    it('should reject approval with reason', async () => {
      const rejectedItem = {
        ...mockApproval,
        status: 'rejected',
        decidedById: mockUserId,
        decidedAt: new Date(),
      };

      service.reject.mockResolvedValue(rejectedItem);

      const result = await controller.rejectItem(
        mockWorkspaceId,
        mockApprovalId,
        { reason: 'Needs more work' },
        mockUser,
      );

      expect(result).toEqual(rejectedItem);
      expect(service.reject).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        { reason: 'Needs more work' },
      );
    });

    it('should reject with reason and notes', async () => {
      const rejectedItem = {
        ...mockApproval,
        status: 'rejected',
      };

      service.reject.mockResolvedValue(rejectedItem);

      await controller.rejectItem(
        mockWorkspaceId,
        mockApprovalId,
        {
          reason: 'Not ready',
          notes: 'Please add more details',
        },
        mockUser,
      );

      expect(service.reject).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        {
          reason: 'Not ready',
          notes: 'Please add more details',
        },
      );
    });

    it('should throw BadRequestException if already rejected', async () => {
      service.reject.mockRejectedValue(
        new BadRequestException('Cannot reject item with status: rejected'),
      );

      await expect(
        controller.rejectItem(
          mockWorkspaceId,
          mockApprovalId,
          { reason: 'Test' },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkAction', () => {
    it('should bulk approve multiple items', async () => {
      const bulkResult = {
        successes: ['id-1', 'id-2'],
        failures: [],
        totalProcessed: 2,
      };

      service.bulkAction.mockResolvedValue(bulkResult);

      const result = await controller.bulkAction(
        mockWorkspaceId,
        {
          ids: ['id-1', 'id-2'],
          action: 'approve',
          notes: 'Batch approved',
        },
        mockUser,
      );

      expect(result).toEqual(bulkResult);
      expect(service.bulkAction).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockUserId,
        {
          ids: ['id-1', 'id-2'],
          action: 'approve',
          notes: 'Batch approved',
        },
      );
    });

    it('should bulk reject with reason', async () => {
      const bulkResult = {
        successes: ['id-1', 'id-2'],
        failures: [],
        totalProcessed: 2,
      };

      service.bulkAction.mockResolvedValue(bulkResult);

      await controller.bulkAction(
        mockWorkspaceId,
        {
          ids: ['id-1', 'id-2'],
          action: 'reject',
          reason: 'All need rework',
        },
        mockUser,
      );

      expect(service.bulkAction).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockUserId,
        {
          ids: ['id-1', 'id-2'],
          action: 'reject',
          reason: 'All need rework',
        },
      );
    });

    it('should handle partial failures', async () => {
      const bulkResult = {
        successes: ['id-1'],
        failures: [
          {
            id: 'id-2',
            error: 'Already approved',
          },
        ],
        totalProcessed: 2,
      };

      service.bulkAction.mockResolvedValue(bulkResult);

      const result = await controller.bulkAction(
        mockWorkspaceId,
        {
          ids: ['id-1', 'id-2'],
          action: 'approve',
        },
        mockUser,
      );

      expect(result.successes).toHaveLength(1);
      expect(result.failures).toHaveLength(1);
      expect(result.totalProcessed).toBe(2);
    });
  });

  describe('cancelApproval', () => {
    const mockUserWithRole = {
      ...mockUser,
      role: 'member',
    };

    const mockAdminUser = {
      ...mockUser,
      role: 'admin',
    };

    it('should cancel approval with reason', async () => {
      const cancelResult = {
        success: true,
        cancelledAt: new Date().toISOString(),
      };

      service.cancel.mockResolvedValue(cancelResult);

      const result = await controller.cancelApproval(
        mockWorkspaceId,
        mockApprovalId,
        { reason: 'No longer needed' },
        mockUserWithRole,
      );

      expect(result).toEqual(cancelResult);
      expect(service.cancel).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        { reason: 'No longer needed' },
        false, // non-admin
      );
    });

    it('should cancel approval without reason', async () => {
      const cancelResult = {
        success: true,
        cancelledAt: new Date().toISOString(),
      };

      service.cancel.mockResolvedValue(cancelResult);

      await controller.cancelApproval(
        mockWorkspaceId,
        mockApprovalId,
        {},
        mockUserWithRole,
      );

      expect(service.cancel).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        {},
        false, // non-admin
      );
    });

    it('should pass admin flag when user is admin', async () => {
      const cancelResult = {
        success: true,
        cancelledAt: new Date().toISOString(),
      };

      service.cancel.mockResolvedValue(cancelResult);

      await controller.cancelApproval(
        mockWorkspaceId,
        mockApprovalId,
        {},
        mockAdminUser,
      );

      expect(service.cancel).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        {},
        true, // is admin
      );
    });

    it('should pass admin flag when user is owner', async () => {
      const mockOwnerUser = {
        ...mockUser,
        role: 'owner',
      };

      const cancelResult = {
        success: true,
        cancelledAt: new Date().toISOString(),
      };

      service.cancel.mockResolvedValue(cancelResult);

      await controller.cancelApproval(
        mockWorkspaceId,
        mockApprovalId,
        {},
        mockOwnerUser,
      );

      expect(service.cancel).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        {},
        true, // is owner
      );
    });

    it('should throw NotFoundException for invalid ID', async () => {
      service.cancel.mockRejectedValue(
        new NotFoundException('Approval item not found in this workspace'),
      );

      await expect(
        controller.cancelApproval(
          mockWorkspaceId,
          'invalid-id',
          {},
          mockUserWithRole,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already processed', async () => {
      service.cancel.mockRejectedValue(
        new BadRequestException(
          "Approval cannot be cancelled - status is 'approved'",
        ),
      );

      await expect(
        controller.cancelApproval(
          mockWorkspaceId,
          mockApprovalId,
          {},
          mockUserWithRole,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user lacks permission', async () => {
      service.cancel.mockRejectedValue(
        new ForbiddenException(
          'You do not have permission to cancel this approval',
        ),
      );

      await expect(
        controller.cancelApproval(
          mockWorkspaceId,
          mockApprovalId,
          {},
          mockUserWithRole,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
