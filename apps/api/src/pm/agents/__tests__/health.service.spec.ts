import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../health.service';
import { PrismaService } from '../../../common/services/prisma.service';
import { HealthLevel, HealthTrend, RiskSeverity } from '@prisma/client';

describe('HealthService', () => {
  let service: HealthService;
  let _prismaService: PrismaService;

  const mockWorkspaceId = 'ws-123';
  const mockProjectId = 'proj-123';
  const mockUserId = 'user-123';

  const createMockPrisma = () => {
    const mock: any = {
      project: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      task: {
        findMany: jest.fn(),
      },
      healthScore: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      riskEntry: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    mock.$transaction.mockImplementation((callback: any) => callback(mock));
    return mock;
  };

  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    _prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runHealthCheck', () => {
    const mockProject = {
      id: mockProjectId,
      workspaceId: mockWorkspaceId,
      name: 'Test Project',
      status: 'ACTIVE',
      team: {
        members: [
          { userId: 'user-1', user: { name: 'User 1' } },
          { userId: 'user-2', user: { name: 'User 2' } },
        ],
      },
    };

    it('should calculate health score for project with tasks', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'DONE',
          dueDate: new Date(),
          completedAt: new Date(),
          estimatedHours: 4,
          assigneeId: 'user-1',
          relations: [],
        },
        {
          id: 'task-2',
          title: 'Task 2',
          status: 'IN_PROGRESS',
          dueDate: new Date(Date.now() + 86400000),
          completedAt: null,
          estimatedHours: 8,
          assigneeId: 'user-2',
          relations: [],
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue(mockTasks as any);
      mockPrisma.riskEntry.findMany.mockResolvedValue([]);

      const result = await service.runHealthCheck(mockWorkspaceId, mockProjectId, mockUserId);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.level).toBeDefined();
      expect(result.trend).toBeDefined();
      expect(result.factors).toBeDefined();
    });

    it('should throw error for non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.runHealthCheck(mockWorkspaceId, mockProjectId, mockUserId),
      ).rejects.toThrow();
    });

    it('should throw error for wrong workspace', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        workspaceId: 'other-ws',
      } as any);

      await expect(
        service.runHealthCheck(mockWorkspaceId, mockProjectId, mockUserId),
      ).rejects.toThrow();
    });

    it('should handle empty task list', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.riskEntry.findMany.mockResolvedValue([]);

      const result = await service.runHealthCheck(mockWorkspaceId, mockProjectId, mockUserId);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateHealthScore', () => {
    it('should return EXCELLENT for healthy project', () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Completed Task',
          status: 'DONE',
          dueDate: new Date(Date.now() + 86400000),
          completedAt: new Date(),
          estimatedHours: 8,
          assigneeId: 'user-1',
          isBlocked: false,
        },
      ];

      const project = {
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
        team: { members: [] },
      };

      const result = (service as any).calculateHealthScore(tasks, project);

      expect(result.score).toBeGreaterThanOrEqual(70);
      expect([HealthLevel.EXCELLENT, HealthLevel.GOOD]).toContain(result.level);
    });

    it('should return WARNING/CRITICAL for project with overdue tasks', () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Overdue Task 1',
          status: 'IN_PROGRESS',
          dueDate: new Date(Date.now() - 86400000 * 7),
          completedAt: null,
          estimatedHours: 8,
          assigneeId: 'user-1',
          isBlocked: false,
        },
        {
          id: 'task-2',
          title: 'Overdue Task 2',
          status: 'TODO',
          dueDate: new Date(Date.now() - 86400000 * 3),
          completedAt: null,
          estimatedHours: 8,
          assigneeId: 'user-2',
          isBlocked: false,
        },
      ];

      const project = {
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
        team: { members: [] },
      };

      const result = (service as any).calculateHealthScore(tasks, project);

      expect(result.score).toBeLessThan(85);
      expect(result.factors.onTimeDelivery).toBeLessThan(1);
    });

    it('should penalize blocked tasks', () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Blocked Task',
          status: 'IN_PROGRESS',
          dueDate: new Date(Date.now() + 86400000),
          completedAt: null,
          estimatedHours: 8,
          assigneeId: 'user-1',
          isBlocked: true,
        },
        {
          id: 'task-2',
          title: 'Another Blocked Task',
          status: 'TODO',
          dueDate: new Date(Date.now() + 86400000),
          completedAt: null,
          estimatedHours: 8,
          assigneeId: 'user-2',
          isBlocked: true,
        },
      ];

      const project = {
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
        team: { members: [] },
      };

      const result = (service as any).calculateHealthScore(tasks, project);

      expect(result.factors.blockerImpact).toBeLessThan(1);
    });

    it('should handle invalid estimatedHours gracefully', () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task with NaN hours',
          status: 'IN_PROGRESS',
          dueDate: new Date(Date.now() + 86400000),
          completedAt: null,
          estimatedHours: NaN,
          assigneeId: 'user-1',
          isBlocked: false,
        },
        {
          id: 'task-2',
          title: 'Task with negative hours',
          status: 'IN_PROGRESS',
          dueDate: new Date(Date.now() + 86400000),
          completedAt: null,
          estimatedHours: -5,
          assigneeId: 'user-2',
          isBlocked: false,
        },
      ];

      const project = {
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
        team: { members: [] },
      };

      const result = (service as any).calculateHealthScore(tasks, project);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(isFinite(result.score)).toBe(true);
    });

    it('should generate appropriate suggestions', () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Overdue Task',
          status: 'IN_PROGRESS',
          dueDate: new Date(Date.now() - 86400000 * 5),
          completedAt: null,
          estimatedHours: 8,
          assigneeId: 'user-1',
          isBlocked: true,
        },
      ];

      const project = {
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
        team: { members: [] },
      };

      const result = (service as any).calculateHealthScore(tasks, project);

      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('detectRisks', () => {
    it('should detect tasks due within 48 hours', () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Due Soon Task',
          status: 'IN_PROGRESS',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          completedAt: null,
          estimatedHours: 8,
          assigneeId: 'user-1',
          isBlocked: false,
        },
      ];

      const project = {
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
        team: { members: [{ userId: 'user-1', user: { name: 'User 1' } }] },
      };

      const risks = (service as any).detectRisks(tasks, project);

      expect(risks.length).toBeGreaterThan(0);
      expect(risks[0].type).toBe('DEADLINE_WARNING');
    });

    it('should detect capacity overload', () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Big Task 1',
          status: 'IN_PROGRESS',
          dueDate: new Date(Date.now() + 86400000 * 7),
          completedAt: null,
          estimatedHours: 25,
          assigneeId: 'user-1',
          isBlocked: false,
        },
        {
          id: 'task-2',
          title: 'Big Task 2',
          status: 'TODO',
          dueDate: new Date(Date.now() + 86400000 * 7),
          completedAt: null,
          estimatedHours: 20,
          assigneeId: 'user-1',
          isBlocked: false,
        },
      ];

      const project = {
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
        team: { members: [{ userId: 'user-1', user: { name: 'User 1' } }] },
      };

      const risks = (service as any).detectRisks(tasks, project);

      const capacityRisk = risks.find((r: any) => r.type === 'CAPACITY_OVERLOAD');
      expect(capacityRisk).toBeDefined();
      expect(capacityRisk.affectedUsers).toContain('user-1');
    });

    it('should not create risks for completed tasks', () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Done Task',
          status: 'DONE',
          dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
          completedAt: new Date(),
          estimatedHours: 100,
          assigneeId: 'user-1',
          isBlocked: false,
        },
      ];

      const project = {
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
        team: { members: [{ userId: 'user-1', user: { name: 'User 1' } }] },
      };

      const risks = (service as any).detectRisks(tasks, project);

      expect(risks.filter((r: any) => r.type === 'CAPACITY_OVERLOAD').length).toBe(0);
    });

    it('should return empty array when no risks detected', () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Future Task',
          status: 'TODO',
          dueDate: new Date(Date.now() + 86400000 * 14),
          completedAt: null,
          estimatedHours: 4,
          assigneeId: 'user-1',
          isBlocked: false,
        },
      ];

      const project = {
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
        team: { members: [{ userId: 'user-1', user: { name: 'User 1' } }] },
      };

      const risks = (service as any).detectRisks(tasks, project);

      expect(risks.length).toBe(0);
    });
  });

  describe('getLatestHealthScore', () => {
    it('should return latest health score for project', async () => {
      const mockHealthScore = {
        id: 'hs-1',
        projectId: mockProjectId,
        workspaceId: mockWorkspaceId,
        score: 85,
        level: HealthLevel.EXCELLENT,
        trend: HealthTrend.STABLE,
        createdAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
      } as any);
      mockPrisma.healthScore.findFirst.mockResolvedValue(mockHealthScore as any);

      const result = await service.getLatestHealthScore(mockWorkspaceId, mockProjectId);

      expect(result).toBeDefined();
      expect(result?.score).toBe(85);
      expect(result?.level).toBe(HealthLevel.EXCELLENT);
    });

    it('should return null when no health score exists', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
      } as any);
      mockPrisma.healthScore.findFirst.mockResolvedValue(null);

      const result = await service.getLatestHealthScore(mockWorkspaceId, mockProjectId);

      expect(result).toBeNull();
    });
  });

  describe('getActiveRisks', () => {
    it('should return active risks for project', async () => {
      const mockRisks = [
        {
          id: 'risk-1',
          projectId: mockProjectId,
          title: 'Deadline Risk',
          severity: RiskSeverity.HIGH,
          riskType: 'DEADLINE_WARNING',
          status: 'IDENTIFIED',
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
      } as any);
      mockPrisma.riskEntry.findMany.mockResolvedValue(mockRisks as any);

      const result = await service.getActiveRisks(mockWorkspaceId, mockProjectId);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Deadline Risk');
    });
  });

  describe('acknowledgeRisk', () => {
    it('should update risk status to ANALYZING', async () => {
      const mockRisk = {
        id: 'risk-1',
        projectId: mockProjectId,
        workspaceId: mockWorkspaceId,
        status: 'ANALYZING',
        acknowledgedAt: new Date(),
        acknowledgedBy: mockUserId,
      };

      mockPrisma.riskEntry.findUnique.mockResolvedValue({
        id: 'risk-1',
        workspaceId: mockWorkspaceId,
        projectId: mockProjectId,
        project: { workspaceId: mockWorkspaceId },
      } as any);
      mockPrisma.riskEntry.update.mockResolvedValue(mockRisk as any);

      const result = await service.acknowledgeRisk(mockWorkspaceId, 'risk-1', mockUserId);

      expect(result.status).toBe('ANALYZING');
      expect(result.acknowledgedBy).toBe(mockUserId);
    });
  });

  describe('resolveRisk', () => {
    it('should update risk status to RESOLVED', async () => {
      const mockRisk = {
        id: 'risk-1',
        projectId: mockProjectId,
        workspaceId: mockWorkspaceId,
        status: 'RESOLVED',
        resolvedAt: new Date(),
      };

      mockPrisma.riskEntry.findUnique.mockResolvedValue({
        id: 'risk-1',
        workspaceId: mockWorkspaceId,
        projectId: mockProjectId,
        project: { workspaceId: mockWorkspaceId },
      } as any);
      mockPrisma.riskEntry.update.mockResolvedValue(mockRisk as any);

      const result = await service.resolveRisk(
        mockWorkspaceId,
        mockProjectId,
        'risk-1',
        mockUserId,
      );

      expect(result.status).toBe('RESOLVED');
    });
  });

  describe('getOverdueTasks', () => {
    it('should return overdue and due-soon tasks', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Overdue Task',
          status: 'IN_PROGRESS',
          dueDate: new Date(Date.now() - 86400000),
          assigneeId: 'user-1',
        },
        {
          id: 'task-2',
          title: 'Due Soon Task',
          status: 'TODO',
          dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
          assigneeId: 'user-2',
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
      } as any);
      mockPrisma.task.findMany.mockResolvedValue(mockTasks as any);

      const result = await service.getOverdueTasks(mockWorkspaceId, mockProjectId);

      expect(result.overdue).toHaveLength(1);
      expect(result.dueSoon).toHaveLength(1);
      expect(result.overdue[0].title).toBe('Overdue Task');
    });
  });

  describe('analyzeVelocity', () => {
    it('should analyze velocity trends', async () => {
      const now = new Date();
      const mockTasks = [
        {
          id: 'task-1',
          completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          storyPoints: 3,
        },
        {
          id: 'task-2',
          completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          storyPoints: 5,
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
      } as any);
      mockPrisma.task.findMany.mockResolvedValue(mockTasks as any);

      const result = await service.analyzeVelocity(mockWorkspaceId, mockProjectId);

      expect(result).toBeDefined();
      expect(result.currentVelocity).toBeDefined();
      expect(result.baselineVelocity).toBeDefined();
      expect(result.trend).toBeDefined();
    });
  });

  describe('checkTeamCapacity', () => {
    it('should check team capacity and return overloaded members', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          assigneeId: 'user-1',
          estimatedHours: 50,
          status: 'IN_PROGRESS',
        },
      ];

      const mockProject = {
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
        team: {
          members: [{ userId: 'user-1', user: { name: 'User 1' } }],
        },
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue(mockTasks as any);

      const result = await service.checkTeamCapacity(mockWorkspaceId, mockProjectId);

      expect(result).toBeDefined();
      expect(result.overloadedMembers).toBeDefined();
      expect(result.teamHealth).toBe('overloaded');
      expect(result.overloadedMembers).toHaveLength(1);
      expect(result.overloadedMembers[0].userId).toBe('user-1');
    });

    it('should return healthy status when no one is overloaded', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          assigneeId: 'user-1',
          estimatedHours: 20,
          status: 'IN_PROGRESS',
        },
      ];

      const mockProject = {
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue(mockTasks as any);

      const result = await service.checkTeamCapacity(mockWorkspaceId, mockProjectId);

      expect(result.teamHealth).toBe('healthy');
      expect(result.overloadedMembers).toHaveLength(0);
    });
  });
});
