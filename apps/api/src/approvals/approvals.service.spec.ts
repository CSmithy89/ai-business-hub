import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { PrismaService } from '../common/services/prisma.service';
import { EventPublisherService } from '../events';
import { ApprovalAuditService } from './services/approval-audit.service';
import { EventTypes } from '@hyvve/shared';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  type PrismaMock = {
    approvalItem: {
      findMany: jest.Mock<Promise<any>, any[]>;
      findUnique: jest.Mock<Promise<any | null>, any[]>;
      update: jest.Mock<Promise<any>, any[]>;
      count: jest.Mock<Promise<number>, any[]>;
    };
  };
  let prisma: PrismaMock;
  let eventPublisher: jest.Mocked<EventPublisherService>;
  let auditLogger: jest.Mocked<ApprovalAuditService>;

  const mockWorkspaceId = 'workspace-123';
  const mockUserId = 'user-123';
  const mockApprovalId = 'approval-123';

  const mockApproval = {
    id: mockApprovalId,
    workspaceId: mockWorkspaceId,
    type: 'content',
    title: 'Test Approval',
    description: 'Test description',
    confidenceScore: 72,
    confidenceFactors: [
      {
        factor: 'historical_accuracy',
        score: 85,
        weight: 0.5,
        explanation: 'High accuracy',
        concerning: false,
      },
    ],
    aiRecommendation: 'review',
    aiReasoning: null,
    status: 'pending',
    priority: 'medium',
    assignedToId: null,
    dueAt: new Date('2025-12-04'),
    resolvedById: null,
    resolvedAt: null,
    resolution: null,
    previewData: null,
    sourceModule: 'crm',
    sourceId: 'contact-123',
    createdAt: new Date('2025-12-02'),
    updatedAt: new Date('2025-12-02'),
    assignedTo: null,
    resolvedBy: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        {
          provide: PrismaService,
          useValue: {
            approvalItem: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: EventPublisherService,
          useValue: {
            publish: jest.fn(),
          },
        },
        {
          provide: ApprovalAuditService,
          useValue: {
            logApprovalDecision: jest.fn(),
            logBulkAction: jest.fn(),
            logApprovalCancellation: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
    eventPublisher = module.get(EventPublisherService) as jest.Mocked<EventPublisherService>;
    auditLogger = module.get(ApprovalAuditService) as jest.Mocked<ApprovalAuditService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated results with filters', async () => {
      const mockItems = [mockApproval];
      const mockCount = 1;

      prisma.approvalItem.findMany.mockResolvedValue(mockItems);
      prisma.approvalItem.count.mockResolvedValue(mockCount);

      const result = await service.findAll(mockWorkspaceId, {
        status: 'pending',
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: mockApprovalId,
            workspaceId: mockWorkspaceId,
          }),
        ]),
        total: mockCount,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      expect(prisma.approvalItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: mockWorkspaceId,
            status: 'pending',
          }),
        }),
      );
    });

    it('should respect tenant isolation', async () => {
      prisma.approvalItem.findMany.mockResolvedValue([]);
      prisma.approvalItem.count.mockResolvedValue(0);

      await service.findAll(mockWorkspaceId, { page: 1, limit: 20 });

      expect(prisma.approvalItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: mockWorkspaceId,
          }),
        }),
      );
    });

    it('should apply sorting correctly', async () => {
      prisma.approvalItem.findMany.mockResolvedValue([]);
      prisma.approvalItem.count.mockResolvedValue(0);

      await service.findAll(mockWorkspaceId, {
        sortBy: 'confidenceScore',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
      });

      expect(prisma.approvalItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { confidenceScore: 'asc' },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      prisma.approvalItem.findMany.mockResolvedValue([]);
      prisma.approvalItem.count.mockResolvedValue(45);

      const result = await service.findAll(mockWorkspaceId, {
        page: 2,
        limit: 20,
      });

      expect(result.totalPages).toBe(3);
      expect(prisma.approvalItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return full approval with relations', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(mockApproval);

      const result = await service.findOne(mockWorkspaceId, mockApprovalId);

      expect(result).toMatchObject({
        id: mockApprovalId,
        workspaceId: mockWorkspaceId,
      });

      expect(prisma.approvalItem.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockApprovalId },
          include: expect.objectContaining({
            assignedTo: expect.any(Object),
            resolvedBy: expect.any(Object),
          }),
        }),
      );
    });

    it('should throw NotFoundException for invalid ID', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(mockWorkspaceId, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for wrong workspace', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue({
        ...mockApproval,
        workspaceId: 'different-workspace',
      });

      await expect(
        service.findOne(mockWorkspaceId, mockApprovalId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should update status to approved and set decided fields', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(mockApproval);
      prisma.approvalItem.update.mockResolvedValue({
        ...mockApproval,
        status: 'approved',
        resolvedById: mockUserId,
        resolvedAt: new Date(),
      });

      const result = await service.approve(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        { notes: 'Looks good' },
      );

      expect(result.status).toBe('approved');
      expect(result.decidedById).toBe(mockUserId);
      expect(prisma.approvalItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockApprovalId },
          data: expect.objectContaining({
            status: 'approved',
            resolvedById: mockUserId,
          }),
        }),
      );
    });

    it('should throw BadRequestException if already decided', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue({
        ...mockApproval,
        status: 'approved',
      });

      await expect(
        service.approve(mockWorkspaceId, mockApprovalId, mockUserId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should emit approval.approved event', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(mockApproval);
      prisma.approvalItem.update.mockResolvedValue({
        ...mockApproval,
        status: 'approved',
      });

      await service.approve(mockWorkspaceId, mockApprovalId, mockUserId, {});

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        EventTypes.APPROVAL_APPROVED,
        expect.objectContaining({
          approvalId: mockApprovalId,
          decision: 'approved',
          decidedById: mockUserId,
        }),
        expect.objectContaining({
          tenantId: mockWorkspaceId,
          userId: mockUserId,
          source: 'approvals',
        }),
      );
    });

    it('should log to audit trail', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(mockApproval);
      prisma.approvalItem.update.mockResolvedValue({
        ...mockApproval,
        status: 'approved',
      });

      await service.approve(mockWorkspaceId, mockApprovalId, mockUserId, {
        notes: 'Test notes',
      });

      expect(auditLogger.logApprovalDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: mockWorkspaceId,
          userId: mockUserId,
          action: 'approval.approved',
          approvalId: mockApprovalId,
        }),
      );
    });
  });

  describe('reject', () => {
    it('should update status to rejected with reason', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(mockApproval);
      prisma.approvalItem.update.mockResolvedValue({
        ...mockApproval,
        status: 'rejected',
        resolvedById: mockUserId,
        resolvedAt: new Date(),
      });

      const result = await service.reject(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        { reason: 'Needs more work' },
      );

      expect(result.status).toBe('rejected');
      expect(prisma.approvalItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'rejected',
            resolvedById: mockUserId,
          }),
        }),
      );
    });

    it('should throw BadRequestException if already decided', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue({
        ...mockApproval,
        status: 'rejected',
      });

      await expect(
        service.reject(mockWorkspaceId, mockApprovalId, mockUserId, {
          reason: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should emit approval.rejected event', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(mockApproval);
      prisma.approvalItem.update.mockResolvedValue({
        ...mockApproval,
        status: 'rejected',
      });

      await service.reject(mockWorkspaceId, mockApprovalId, mockUserId, {
        reason: 'Not ready',
      });

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        EventTypes.APPROVAL_REJECTED,
        expect.objectContaining({
          approvalId: mockApprovalId,
          decision: 'rejected',
          decidedById: mockUserId,
          decisionNotes: 'Not ready',
        }),
        expect.objectContaining({
          tenantId: mockWorkspaceId,
          userId: mockUserId,
          source: 'approvals',
        }),
      );
    });

    it('should log to audit trail with reason', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(mockApproval);
      prisma.approvalItem.update.mockResolvedValue({
        ...mockApproval,
        status: 'rejected',
      });

      const reason = 'Needs improvements';
      await service.reject(mockWorkspaceId, mockApprovalId, mockUserId, {
        reason,
      });

      expect(auditLogger.logApprovalDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'approval.rejected',
          reason,
        }),
      );
    });
  });

  describe('bulkAction', () => {
    it('should process multiple approvals successfully', async () => {
      const ids = ['id-1', 'id-2'];
      prisma.approvalItem.findUnique.mockResolvedValue(mockApproval);
      prisma.approvalItem.update.mockResolvedValue({
        ...mockApproval,
        status: 'approved',
      });

      const result = await service.bulkAction(mockWorkspaceId, mockUserId, {
        ids,
        action: 'approve',
      });

      expect(result.successes).toEqual(ids);
      expect(result.failures).toEqual([]);
      expect(result.totalProcessed).toBe(2);
    });

    it('should handle partial failures gracefully', async () => {
      const ids = ['valid-id', 'invalid-id'];

      prisma.approvalItem.findUnique
        .mockResolvedValueOnce(mockApproval)
        .mockResolvedValueOnce(null);

      prisma.approvalItem.update.mockResolvedValue({
        ...mockApproval,
        status: 'approved',
      });

      const result = await service.bulkAction(mockWorkspaceId, mockUserId, {
        ids,
        action: 'approve',
      });

      expect(result.successes).toHaveLength(1);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].id).toBe('invalid-id');
    });

    it('should validate reject action has reason', async () => {
      const ids = ['id-1'];
      prisma.approvalItem.findUnique.mockResolvedValue(mockApproval);
      prisma.approvalItem.update.mockResolvedValue({
        ...mockApproval,
        status: 'rejected',
      });

      const result = await service.bulkAction(mockWorkspaceId, mockUserId, {
        ids,
        action: 'reject',
        reason: 'Bulk rejection',
      });

      expect(result.successes).toHaveLength(1);
    });
  });

  describe('cancel', () => {
    const mockApprovalWithRequester = {
      ...mockApproval,
      requestedBy: mockUserId,
    };

    it('should cancel pending approval when user is requester', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(mockApprovalWithRequester);
      prisma.approvalItem.update.mockResolvedValue({
        ...mockApprovalWithRequester,
        status: 'cancelled',
        resolvedById: mockUserId,
        resolvedAt: new Date(),
      });

      const result = await service.cancel(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        { reason: 'No longer needed' },
        false, // not admin
      );

      expect(result.success).toBe(true);
      expect(result.cancelledAt).toBeDefined();
      expect(prisma.approvalItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockApprovalId },
          data: expect.objectContaining({
            status: 'cancelled',
            resolvedById: mockUserId,
          }),
        }),
      );
    });

    it('should cancel pending approval when user is admin', async () => {
      const differentUserId = 'different-user';
      const approvalWithDifferentRequester = {
        ...mockApproval,
        requestedBy: 'original-requester',
      };

      prisma.approvalItem.findUnique.mockResolvedValue(approvalWithDifferentRequester);
      prisma.approvalItem.update.mockResolvedValue({
        ...approvalWithDifferentRequester,
        status: 'cancelled',
        resolvedById: differentUserId,
        resolvedAt: new Date(),
      });

      const result = await service.cancel(
        mockWorkspaceId,
        mockApprovalId,
        differentUserId,
        {},
        true, // is admin
      );

      expect(result.success).toBe(true);
    });

    it('should throw ForbiddenException when non-requester non-admin tries to cancel', async () => {
      const differentUserId = 'different-user';
      const approvalWithDifferentRequester = {
        ...mockApproval,
        requestedBy: 'original-requester',
      };

      prisma.approvalItem.findUnique.mockResolvedValue(approvalWithDifferentRequester);

      await expect(
        service.cancel(
          mockWorkspaceId,
          mockApprovalId,
          differentUserId,
          {},
          false, // not admin
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when approval is not pending', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue({
        ...mockApprovalWithRequester,
        status: 'approved',
      });

      await expect(
        service.cancel(
          mockWorkspaceId,
          mockApprovalId,
          mockUserId,
          {},
          false,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for invalid ID', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(null);

      await expect(
        service.cancel(
          mockWorkspaceId,
          'invalid-id',
          mockUserId,
          {},
          false,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for wrong workspace', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue({
        ...mockApprovalWithRequester,
        workspaceId: 'different-workspace',
      });

      await expect(
        service.cancel(
          mockWorkspaceId,
          mockApprovalId,
          mockUserId,
          {},
          false,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should emit APPROVAL_CANCELLED event', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(mockApprovalWithRequester);
      prisma.approvalItem.update.mockResolvedValue({
        ...mockApprovalWithRequester,
        status: 'cancelled',
      });

      await service.cancel(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        { reason: 'Test reason' },
        false,
      );

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        EventTypes.APPROVAL_CANCELLED,
        expect.objectContaining({
          approvalId: mockApprovalId,
          cancelledById: mockUserId,
          reason: 'Test reason',
        }),
        expect.objectContaining({
          tenantId: mockWorkspaceId,
          userId: mockUserId,
          source: 'approvals',
        }),
      );
    });

    it('should log to audit trail', async () => {
      prisma.approvalItem.findUnique.mockResolvedValue(mockApprovalWithRequester);
      prisma.approvalItem.update.mockResolvedValue({
        ...mockApprovalWithRequester,
        status: 'cancelled',
      });

      await service.cancel(
        mockWorkspaceId,
        mockApprovalId,
        mockUserId,
        { reason: 'Test reason' },
        false,
      );

      expect(auditLogger.logApprovalCancellation).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: mockWorkspaceId,
          userId: mockUserId,
          approvalId: mockApprovalId,
          reason: 'Test reason',
        }),
      );
    });
  });
});
