import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalRouterService } from './approval-router.service';
import { PrismaService } from '../../common/services/prisma.service';
import { ConfidenceCalculatorService } from './confidence-calculator.service';
import { EventBusService } from '../stubs/event-bus.stub';
import { AuditLogService } from '../stubs/audit-logger.stub';
import { ConfidenceFactor } from '@hyvve/shared';

describe('ApprovalRouterService', () => {
  let service: ApprovalRouterService;
  let prisma: PrismaService;
  let confidenceCalculator: ConfidenceCalculatorService;
  let eventBus: EventBusService;
  let auditLogger: AuditLogService;

  const mockWorkspaceId = 'workspace-123';
  const mockRequestedBy = 'user-123';
  const mockAssignedToId = 'admin-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalRouterService,
        {
          provide: PrismaService,
          useValue: {
            approvalItem: {
              create: jest.fn(),
            },
            workspaceMember: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: ConfidenceCalculatorService,
          useValue: {
            calculate: jest.fn(),
          },
        },
        {
          provide: EventBusService,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            logApprovalDecision: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApprovalRouterService>(ApprovalRouterService);
    prisma = module.get<PrismaService>(PrismaService);
    confidenceCalculator = module.get<ConfidenceCalculatorService>(
      ConfidenceCalculatorService,
    );
    eventBus = module.get<EventBusService>(EventBusService);
    auditLogger = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('routeApproval', () => {
    const mockFactors: ConfidenceFactor[] = [
      {
        factor: 'historical_accuracy',
        score: 90,
        weight: 0.5,
        explanation: 'High historical accuracy',
        concerning: false,
      },
      {
        factor: 'data_completeness',
        score: 80,
        weight: 0.5,
        explanation: 'Complete data',
        concerning: false,
      },
    ];

    it('should route high confidence (>85%) to auto_approved', async () => {
      // Mock confidence calculation with high score
      jest.spyOn(confidenceCalculator, 'calculate').mockResolvedValue({
        overallScore: 90,
        factors: mockFactors,
        recommendation: 'approve',
      });

      // Mock default approver lookup
      jest.spyOn(prisma.workspaceMember, 'findFirst').mockResolvedValue({
        userId: mockAssignedToId,
      } as any);

      // Mock approval creation
      const mockCreatedApproval = {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'content',
        title: 'Test Approval',
        confidenceScore: 90,
        status: 'auto_approved',
        priority: 'medium',
        assignedToId: mockAssignedToId,
        dueAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
        requestedBy: mockRequestedBy,
        confidenceFactors: mockFactors,
        aiRecommendation: 'approve',
        assignedTo: {
          id: mockAssignedToId,
          name: 'Admin User',
          email: 'admin@example.com',
        },
      };

      jest
        .spyOn(prisma.approvalItem, 'create')
        .mockResolvedValue(mockCreatedApproval as any);

      // Execute
      const result = await service.routeApproval(
        mockWorkspaceId,
        mockRequestedBy,
        'content',
        'Test Approval',
        mockFactors,
      );

      // Verify status and review type
      expect(result.status).toBe('auto_approved');
      expect(result.reviewType).toBe('auto');

      // Verify approval.approved event was emitted
      expect(eventBus.emit).toHaveBeenCalledWith('approval.approved', {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'content',
        decidedById: 'system',
        decidedAt: expect.any(Date),
        confidenceScore: 90,
      });

      // Verify audit log
      expect(auditLogger.logApprovalDecision).toHaveBeenCalledWith({
        workspaceId: mockWorkspaceId,
        userId: mockRequestedBy,
        action: 'approval.auto_approved',
        approvalId: 'approval-123',
        metadata: expect.objectContaining({
          confidenceScore: 90,
          status: 'auto_approved',
          reviewType: 'auto',
        }),
      });
    });

    it('should route medium confidence (60-85%) to pending/quick review', async () => {
      // Mock confidence calculation with medium score
      jest.spyOn(confidenceCalculator, 'calculate').mockResolvedValue({
        overallScore: 75,
        factors: mockFactors,
        recommendation: 'review',
      });

      // Mock default approver lookup
      jest.spyOn(prisma.workspaceMember, 'findFirst').mockResolvedValue({
        userId: mockAssignedToId,
      } as any);

      // Mock approval creation
      const mockCreatedApproval = {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'email',
        title: 'Test Email',
        confidenceScore: 75,
        status: 'pending',
        priority: 'high',
        assignedToId: mockAssignedToId,
        dueAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
        requestedBy: mockRequestedBy,
        confidenceFactors: mockFactors,
        aiRecommendation: 'review',
        assignedTo: null,
      };

      jest
        .spyOn(prisma.approvalItem, 'create')
        .mockResolvedValue(mockCreatedApproval as any);

      // Execute
      const result = await service.routeApproval(
        mockWorkspaceId,
        mockRequestedBy,
        'email',
        'Test Email',
        mockFactors,
        { priority: 'high' },
      );

      // Verify status and review type
      expect(result.status).toBe('pending');
      expect(result.reviewType).toBe('quick');

      // Verify approval.requested event was emitted
      expect(eventBus.emit).toHaveBeenCalledWith('approval.requested', {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'email',
        confidenceScore: 75,
        reviewType: 'quick',
        priority: 'high',
        assignedToId: mockAssignedToId,
        dueAt: expect.any(Date),
      });

      // Verify audit log
      expect(auditLogger.logApprovalDecision).toHaveBeenCalledWith({
        workspaceId: mockWorkspaceId,
        userId: mockRequestedBy,
        action: 'approval.routed',
        approvalId: 'approval-123',
        metadata: expect.objectContaining({
          confidenceScore: 75,
          status: 'pending',
          reviewType: 'quick',
        }),
      });
    });

    it('should route low confidence (<60%) to pending/full review', async () => {
      // Mock confidence calculation with low score
      jest.spyOn(confidenceCalculator, 'calculate').mockResolvedValue({
        overallScore: 45,
        factors: mockFactors,
        recommendation: 'full_review',
        aiReasoning: 'Low confidence due to concerning factors',
      });

      // Mock default approver lookup
      jest.spyOn(prisma.workspaceMember, 'findFirst').mockResolvedValue({
        userId: mockAssignedToId,
      } as any);

      // Mock approval creation
      const mockCreatedApproval = {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'campaign',
        title: 'Test Campaign',
        confidenceScore: 45,
        status: 'pending',
        priority: 'urgent',
        assignedToId: mockAssignedToId,
        dueAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
        requestedBy: mockRequestedBy,
        confidenceFactors: mockFactors,
        aiRecommendation: 'full_review',
        aiReasoning: 'Low confidence due to concerning factors',
        assignedTo: null,
      };

      jest
        .spyOn(prisma.approvalItem, 'create')
        .mockResolvedValue(mockCreatedApproval as any);

      // Execute
      const result = await service.routeApproval(
        mockWorkspaceId,
        mockRequestedBy,
        'campaign',
        'Test Campaign',
        mockFactors,
        { priority: 'urgent' },
      );

      // Verify status and review type
      expect(result.status).toBe('pending');
      expect(result.reviewType).toBe('full');
      expect(result.aiReasoning).toBe('Low confidence due to concerning factors');

      // Verify approval.requested event was emitted
      expect(eventBus.emit).toHaveBeenCalledWith('approval.requested', {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'campaign',
        confidenceScore: 45,
        reviewType: 'full',
        priority: 'urgent',
        assignedToId: mockAssignedToId,
        dueAt: expect.any(Date),
      });

      // Verify audit log
      expect(auditLogger.logApprovalDecision).toHaveBeenCalledWith({
        workspaceId: mockWorkspaceId,
        userId: mockRequestedBy,
        action: 'approval.routed',
        approvalId: 'approval-123',
        metadata: expect.objectContaining({
          confidenceScore: 45,
          status: 'pending',
          reviewType: 'full',
        }),
      });
    });

    it('should calculate correct due date for urgent priority (4 hours)', async () => {
      jest.spyOn(confidenceCalculator, 'calculate').mockResolvedValue({
        overallScore: 75,
        factors: mockFactors,
        recommendation: 'review',
      });

      jest.spyOn(prisma.workspaceMember, 'findFirst').mockResolvedValue(null);

      const now = new Date();
      const expectedDueAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);

      const mockCreatedApproval = {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'content',
        title: 'Test',
        confidenceScore: 75,
        status: 'pending',
        priority: 'urgent',
        assignedToId: null,
        dueAt: expectedDueAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        requestedBy: mockRequestedBy,
        confidenceFactors: mockFactors,
        aiRecommendation: 'review',
      };

      jest
        .spyOn(prisma.approvalItem, 'create')
        .mockResolvedValue(mockCreatedApproval as any);

      const result = await service.routeApproval(
        mockWorkspaceId,
        mockRequestedBy,
        'content',
        'Test',
        mockFactors,
        { priority: 'urgent' },
      );

      // Check that dueAt is approximately 4 hours from now (within 1 minute tolerance)
      const dueAtDiff = result.dueAt.getTime() - now.getTime();
      const expectedDiff = 4 * 60 * 60 * 1000;
      expect(Math.abs(dueAtDiff - expectedDiff)).toBeLessThan(60 * 1000);
    });

    it('should calculate correct due date for high priority (24 hours)', async () => {
      jest.spyOn(confidenceCalculator, 'calculate').mockResolvedValue({
        overallScore: 75,
        factors: mockFactors,
        recommendation: 'review',
      });

      jest.spyOn(prisma.workspaceMember, 'findFirst').mockResolvedValue(null);

      const now = new Date();
      const expectedDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockCreatedApproval = {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'content',
        title: 'Test',
        confidenceScore: 75,
        status: 'pending',
        priority: 'high',
        assignedToId: null,
        dueAt: expectedDueAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        requestedBy: mockRequestedBy,
        confidenceFactors: mockFactors,
        aiRecommendation: 'review',
      };

      jest
        .spyOn(prisma.approvalItem, 'create')
        .mockResolvedValue(mockCreatedApproval as any);

      const result = await service.routeApproval(
        mockWorkspaceId,
        mockRequestedBy,
        'content',
        'Test',
        mockFactors,
        { priority: 'high' },
      );

      // Check that dueAt is approximately 24 hours from now
      const dueAtDiff = result.dueAt.getTime() - now.getTime();
      const expectedDiff = 24 * 60 * 60 * 1000;
      expect(Math.abs(dueAtDiff - expectedDiff)).toBeLessThan(60 * 1000);
    });

    it('should calculate correct due date for medium priority (48 hours)', async () => {
      jest.spyOn(confidenceCalculator, 'calculate').mockResolvedValue({
        overallScore: 75,
        factors: mockFactors,
        recommendation: 'review',
      });

      jest.spyOn(prisma.workspaceMember, 'findFirst').mockResolvedValue(null);

      const now = new Date();
      const expectedDueAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const mockCreatedApproval = {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'content',
        title: 'Test',
        confidenceScore: 75,
        status: 'pending',
        priority: 'medium',
        assignedToId: null,
        dueAt: expectedDueAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        requestedBy: mockRequestedBy,
        confidenceFactors: mockFactors,
        aiRecommendation: 'review',
      };

      jest
        .spyOn(prisma.approvalItem, 'create')
        .mockResolvedValue(mockCreatedApproval as any);

      const result = await service.routeApproval(
        mockWorkspaceId,
        mockRequestedBy,
        'content',
        'Test',
        mockFactors,
      );

      // Check that dueAt is approximately 48 hours from now
      const dueAtDiff = result.dueAt.getTime() - now.getTime();
      const expectedDiff = 48 * 60 * 60 * 1000;
      expect(Math.abs(dueAtDiff - expectedDiff)).toBeLessThan(60 * 1000);
    });

    it('should calculate correct due date for low priority (72 hours)', async () => {
      jest.spyOn(confidenceCalculator, 'calculate').mockResolvedValue({
        overallScore: 75,
        factors: mockFactors,
        recommendation: 'review',
      });

      jest.spyOn(prisma.workspaceMember, 'findFirst').mockResolvedValue(null);

      const now = new Date();
      const expectedDueAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);

      const mockCreatedApproval = {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'content',
        title: 'Test',
        confidenceScore: 75,
        status: 'pending',
        priority: 'low',
        assignedToId: null,
        dueAt: expectedDueAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        requestedBy: mockRequestedBy,
        confidenceFactors: mockFactors,
        aiRecommendation: 'review',
      };

      jest
        .spyOn(prisma.approvalItem, 'create')
        .mockResolvedValue(mockCreatedApproval as any);

      const result = await service.routeApproval(
        mockWorkspaceId,
        mockRequestedBy,
        'content',
        'Test',
        mockFactors,
        { priority: 'low' },
      );

      // Check that dueAt is approximately 72 hours from now
      const dueAtDiff = result.dueAt.getTime() - now.getTime();
      const expectedDiff = 72 * 60 * 60 * 1000;
      expect(Math.abs(dueAtDiff - expectedDiff)).toBeLessThan(60 * 1000);
    });

    it('should find default approver (owner preferred over admin)', async () => {
      jest.spyOn(confidenceCalculator, 'calculate').mockResolvedValue({
        overallScore: 75,
        factors: mockFactors,
        recommendation: 'review',
      });

      // Mock finding owner
      jest.spyOn(prisma.workspaceMember, 'findFirst').mockResolvedValue({
        userId: 'owner-123',
        role: 'owner',
      } as any);

      const mockCreatedApproval = {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'content',
        title: 'Test',
        confidenceScore: 75,
        status: 'pending',
        priority: 'medium',
        assignedToId: 'owner-123',
        dueAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        requestedBy: mockRequestedBy,
        confidenceFactors: mockFactors,
        aiRecommendation: 'review',
      };

      jest
        .spyOn(prisma.approvalItem, 'create')
        .mockResolvedValue(mockCreatedApproval as any);

      const result = await service.routeApproval(
        mockWorkspaceId,
        mockRequestedBy,
        'content',
        'Test',
        mockFactors,
      );

      expect(result.assignedToId).toBe('owner-123');
      expect(prisma.workspaceMember.findFirst).toHaveBeenCalledWith({
        where: {
          workspaceId: mockWorkspaceId,
          role: { in: ['admin', 'owner'] },
        },
        orderBy: {
          role: 'asc', // owner < admin alphabetically
        },
      });
    });

    it('should return null assignedToId if no admin or owner found', async () => {
      jest.spyOn(confidenceCalculator, 'calculate').mockResolvedValue({
        overallScore: 75,
        factors: mockFactors,
        recommendation: 'review',
      });

      // Mock no admin/owner found
      jest.spyOn(prisma.workspaceMember, 'findFirst').mockResolvedValue(null);

      const mockCreatedApproval = {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'content',
        title: 'Test',
        confidenceScore: 75,
        status: 'pending',
        priority: 'medium',
        assignedToId: null,
        dueAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        requestedBy: mockRequestedBy,
        confidenceFactors: mockFactors,
        aiRecommendation: 'review',
      };

      jest
        .spyOn(prisma.approvalItem, 'create')
        .mockResolvedValue(mockCreatedApproval as any);

      const result = await service.routeApproval(
        mockWorkspaceId,
        mockRequestedBy,
        'content',
        'Test',
        mockFactors,
      );

      expect(result.assignedToId).toBeNull();
    });

    it('should include all optional parameters in created approval', async () => {
      jest.spyOn(confidenceCalculator, 'calculate').mockResolvedValue({
        overallScore: 75,
        factors: mockFactors,
        recommendation: 'review',
      });

      jest.spyOn(prisma.workspaceMember, 'findFirst').mockResolvedValue(null);

      const mockCreatedApproval = {
        id: 'approval-123',
        workspaceId: mockWorkspaceId,
        type: 'content',
        title: 'Test Content',
        description: 'Test description',
        previewData: { key: 'value' },
        sourceModule: 'cms',
        sourceId: 'content-456',
        confidenceScore: 75,
        status: 'pending',
        priority: 'high',
        assignedToId: null,
        dueAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        requestedBy: mockRequestedBy,
        confidenceFactors: mockFactors,
        aiRecommendation: 'review',
      };

      jest
        .spyOn(prisma.approvalItem, 'create')
        .mockResolvedValue(mockCreatedApproval as any);

      const result = await service.routeApproval(
        mockWorkspaceId,
        mockRequestedBy,
        'content',
        'Test Content',
        mockFactors,
        {
          description: 'Test description',
          previewData: { key: 'value' },
          sourceModule: 'cms',
          sourceId: 'content-456',
          priority: 'high',
        },
      );

      expect(result.description).toBe('Test description');
      expect(result.previewData).toEqual({ key: 'value' });
      expect(result.sourceModule).toBe('cms');
      expect(result.sourceId).toBe('content-456');
      expect(result.priority).toBe('high');
    });
  });
});
