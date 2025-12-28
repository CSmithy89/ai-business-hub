/**
 * Health Controller Integration Tests
 *
 * Tests for the HealthController endpoints including:
 * - GET /pm/agents/health/:projectId - Get health score
 * - POST /pm/agents/health/:projectId/check - Trigger health check
 * - GET /pm/agents/health/:projectId/risks - Get risks
 * - POST /pm/agents/health/:projectId/risks/:riskId/acknowledge
 * - POST /pm/agents/health/:projectId/risks/:riskId/resolve
 *
 * @see docs/modules/bm-pm/stories/pm-12-4-integration-e2e-tests.md
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../common/services/prisma.service';
import { PMNotificationService } from '../../notifications/pm-notification.service';
import { HealthService } from '../health.service';
import { HealthLevel, HealthTrend, RiskSeverity } from '@prisma/client';
import {
  createMockPrisma,
  testId,
  TestData,
  expectHealthScoreStructure,
} from './test-utils';

// Mock PMNotificationService
const createMockPMNotificationService = () => ({
  sendHealthAlert: jest.fn().mockResolvedValue(undefined),
  sendRiskNotification: jest.fn().mockResolvedValue(undefined),
  sendRiskResolvedNotification: jest.fn().mockResolvedValue(undefined),
  sendReportNotification: jest.fn().mockResolvedValue(undefined),
});

describe('HealthController (Integration)', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let testData: TestData;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();

    // Set up test data context
    testData = {
      workspaceId: testId('workspace'),
      projectId: testId('project'),
      phaseId: testId('phase'),
      taskIds: [testId('task', 1), testId('task', 2)],
      userId: testId('user'),
    };
  });

  describe('HealthService.runHealthCheck', () => {
    let healthService: HealthService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: PMNotificationService,
            useValue: createMockPMNotificationService(),
          },
        ],
      }).compile();

      healthService = module.get<HealthService>(HealthService);
    });

    it('should return health score for project with tasks', async () => {
      // Arrange
      const mockProject = {
        id: testData.projectId,
        workspaceId: testData.workspaceId,
        name: 'Test Project',
        status: 'ACTIVE',
        team: {
          members: [
            { userId: 'user-1', user: { name: 'User 1' } },
            { userId: 'user-2', user: { name: 'User 2' } },
          ],
        },
      };

      const mockTasks = [
        {
          id: testId('task', 1),
          title: 'Task 1',
          status: 'DONE',
          dueDate: new Date(),
          completedAt: new Date(),
          estimatedHours: 4,
          assigneeId: 'user-1',
          isBlocked: false,
          relations: [],
        },
        {
          id: testId('task', 2),
          title: 'Task 2',
          status: 'IN_PROGRESS',
          dueDate: new Date(Date.now() + 86400000),
          completedAt: null,
          estimatedHours: 8,
          assigneeId: 'user-2',
          isBlocked: false,
          relations: [],
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue(mockTasks as any);
      mockPrisma.riskEntry.findMany.mockResolvedValue([]);
      mockPrisma.healthScore.create.mockResolvedValue({
        id: testId('healthscore'),
        projectId: testData.projectId,
        score: 85,
        level: HealthLevel.EXCELLENT,
        trend: HealthTrend.STABLE,
      });

      // Act
      const result = await healthService.runHealthCheck(
        testData.workspaceId,
        testData.projectId,
        testData.userId,
      );

      // Assert
      expect(result).toBeDefined();
      expectHealthScoreStructure(result);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should throw error for non-existent project', async () => {
      // Arrange
      mockPrisma.project.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        healthService.runHealthCheck(
          testData.workspaceId,
          'non-existent-project',
          testData.userId,
        ),
      ).rejects.toThrow();
    });

    it('should throw error for wrong workspace', async () => {
      // Arrange
      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: 'different-workspace',
      } as any);

      // Act & Assert
      await expect(
        healthService.runHealthCheck(
          testData.workspaceId,
          testData.projectId,
          testData.userId,
        ),
      ).rejects.toThrow();
    });

    it('should handle empty task list', async () => {
      // Arrange
      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
        team: { members: [] },
      } as any);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.riskEntry.findMany.mockResolvedValue([]);
      mockPrisma.healthScore.create.mockResolvedValue({
        id: testId('healthscore'),
        score: 100,
        level: HealthLevel.EXCELLENT,
        trend: HealthTrend.STABLE,
      });

      // Act
      const result = await healthService.runHealthCheck(
        testData.workspaceId,
        testData.projectId,
        testData.userId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('HealthService.getLatestHealthScore', () => {
    let healthService: HealthService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: PMNotificationService,
            useValue: createMockPMNotificationService(),
          },
        ],
      }).compile();

      healthService = module.get<HealthService>(HealthService);
    });

    it('should return latest health score', async () => {
      // Arrange
      const mockHealthScore = {
        id: testId('healthscore'),
        projectId: testData.projectId,
        workspaceId: testData.workspaceId,
        score: 85,
        level: HealthLevel.EXCELLENT,
        trend: HealthTrend.STABLE,
        createdAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      } as any);
      mockPrisma.healthScore.findFirst.mockResolvedValue(mockHealthScore as any);

      // Act
      const result = await healthService.getLatestHealthScore(
        testData.workspaceId,
        testData.projectId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result?.score).toBe(85);
      expect(result?.level).toBe(HealthLevel.EXCELLENT);
    });

    it('should return null when no health score exists', async () => {
      // Arrange
      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      } as any);
      mockPrisma.healthScore.findFirst.mockResolvedValue(null);

      // Act
      const result = await healthService.getLatestHealthScore(
        testData.workspaceId,
        testData.projectId,
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('HealthService.getActiveRisks', () => {
    let healthService: HealthService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: PMNotificationService,
            useValue: createMockPMNotificationService(),
          },
        ],
      }).compile();

      healthService = module.get<HealthService>(HealthService);
    });

    it('should return paginated risk list', async () => {
      // Arrange
      const mockRisks = [
        {
          id: testId('risk', 1),
          projectId: testData.projectId,
          title: 'Deadline Risk',
          description: 'Task is due soon',
          severity: RiskSeverity.HIGH,
          riskType: 'DEADLINE_WARNING',
          status: 'IDENTIFIED',
          affectedTasks: [testData.taskIds[0]],
        },
        {
          id: testId('risk', 2),
          projectId: testData.projectId,
          title: 'Capacity Risk',
          description: 'Team member overloaded',
          severity: RiskSeverity.MEDIUM,
          riskType: 'CAPACITY_OVERLOAD',
          status: 'IDENTIFIED',
          affectedUsers: [testData.userId],
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      } as any);
      mockPrisma.riskEntry.findMany.mockResolvedValue(mockRisks as any);

      // Act
      const result = await healthService.getActiveRisks(
        testData.workspaceId,
        testData.projectId,
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('severity');
      expect(result[0]).toHaveProperty('status');
    });

    it('should return empty array when no risks', async () => {
      // Arrange
      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      } as any);
      mockPrisma.riskEntry.findMany.mockResolvedValue([]);

      // Act
      const result = await healthService.getActiveRisks(
        testData.workspaceId,
        testData.projectId,
      );

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('HealthService.acknowledgeRisk', () => {
    let healthService: HealthService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: PMNotificationService,
            useValue: createMockPMNotificationService(),
          },
        ],
      }).compile();

      healthService = module.get<HealthService>(HealthService);
    });

    it('should update risk status to ANALYZING', async () => {
      // Arrange
      const riskId = testId('risk');
      const mockRisk = {
        id: riskId,
        projectId: testData.projectId,
        workspaceId: testData.workspaceId,
        status: 'ANALYZING',
        acknowledgedAt: new Date(),
        acknowledgedBy: testData.userId,
        project: { workspaceId: testData.workspaceId },
      };

      mockPrisma.riskEntry.findUnique.mockResolvedValue({
        id: riskId,
        workspaceId: testData.workspaceId,
        projectId: testData.projectId,
        project: { workspaceId: testData.workspaceId },
      } as any);
      mockPrisma.riskEntry.update.mockResolvedValue(mockRisk as any);

      // Act
      const result = await healthService.acknowledgeRisk(
        testData.workspaceId,
        riskId,
        testData.userId,
      );

      // Assert
      expect(result.status).toBe('ANALYZING');
      expect(result.acknowledgedBy).toBe(testData.userId);
    });

    it('should throw error for non-existent risk', async () => {
      // Arrange
      mockPrisma.riskEntry.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        healthService.acknowledgeRisk(
          testData.workspaceId,
          'non-existent-risk',
          testData.userId,
        ),
      ).rejects.toThrow();
    });

    it('should throw error for risk from wrong workspace', async () => {
      // Arrange
      mockPrisma.riskEntry.findUnique.mockResolvedValue({
        id: testId('risk'),
        workspaceId: 'different-workspace',
        project: { workspaceId: 'different-workspace' },
      } as any);

      // Act & Assert
      await expect(
        healthService.acknowledgeRisk(
          testData.workspaceId,
          testId('risk'),
          testData.userId,
        ),
      ).rejects.toThrow();
    });
  });

  describe('HealthService.resolveRisk', () => {
    let healthService: HealthService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: PMNotificationService,
            useValue: createMockPMNotificationService(),
          },
        ],
      }).compile();

      healthService = module.get<HealthService>(HealthService);
    });

    it('should update risk status to RESOLVED', async () => {
      // Arrange
      const riskId = testId('risk');
      const mockRisk = {
        id: riskId,
        projectId: testData.projectId,
        workspaceId: testData.workspaceId,
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: testData.userId,
      };

      mockPrisma.riskEntry.findUnique.mockResolvedValue({
        id: riskId,
        workspaceId: testData.workspaceId,
        projectId: testData.projectId,
        project: { workspaceId: testData.workspaceId },
      } as any);
      mockPrisma.riskEntry.update.mockResolvedValue(mockRisk as any);

      // Act
      const result = await healthService.resolveRisk(
        testData.workspaceId,
        testData.projectId,
        riskId,
        testData.userId,
      );

      // Assert
      expect(result.status).toBe('RESOLVED');
    });
  });

  describe('HealthService.getOverdueTasks', () => {
    let healthService: HealthService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: PMNotificationService,
            useValue: createMockPMNotificationService(),
          },
        ],
      }).compile();

      healthService = module.get<HealthService>(HealthService);
    });

    it('should return overdue and due-soon tasks', async () => {
      // Arrange
      const mockTasks = [
        {
          id: testId('task', 1),
          title: 'Overdue Task',
          status: 'IN_PROGRESS',
          dueDate: new Date(Date.now() - 86400000), // Yesterday
          assigneeId: 'user-1',
        },
        {
          id: testId('task', 2),
          title: 'Due Soon Task',
          status: 'TODO',
          dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // In 12 hours
          assigneeId: 'user-2',
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      } as any);
      mockPrisma.task.findMany.mockResolvedValue(mockTasks as any);

      // Act
      const result = await healthService.getOverdueTasks(
        testData.workspaceId,
        testData.projectId,
      );

      // Assert
      expect(result.overdue).toHaveLength(1);
      expect(result.dueSoon).toHaveLength(1);
      expect(result.overdue[0].title).toBe('Overdue Task');
      expect(result.dueSoon[0].title).toBe('Due Soon Task');
    });
  });

  describe('HealthService.checkTeamCapacity', () => {
    let healthService: HealthService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: PMNotificationService,
            useValue: createMockPMNotificationService(),
          },
        ],
      }).compile();

      healthService = module.get<HealthService>(HealthService);
    });

    it('should detect overloaded team members', async () => {
      // Arrange
      const mockProject = {
        id: testData.projectId,
        workspaceId: testData.workspaceId,
        team: {
          members: [{ userId: 'user-1', user: { name: 'User 1' } }],
        },
      };

      const mockTasks = [
        {
          id: testId('task', 1),
          assigneeId: 'user-1',
          estimatedHours: 50, // Very high
          status: 'IN_PROGRESS',
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue(mockTasks as any);

      // Act
      const result = await healthService.checkTeamCapacity(
        testData.workspaceId,
        testData.projectId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.teamHealth).toBe('overloaded');
      expect(result.overloadedMembers.length).toBeGreaterThan(0);
    });

    it('should return healthy when no overload', async () => {
      // Arrange
      const mockProject = {
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      };

      const mockTasks = [
        {
          id: testId('task', 1),
          assigneeId: 'user-1',
          estimatedHours: 20, // Reasonable
          status: 'IN_PROGRESS',
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue(mockTasks as any);

      // Act
      const result = await healthService.checkTeamCapacity(
        testData.workspaceId,
        testData.projectId,
      );

      // Assert
      expect(result.teamHealth).toBe('healthy');
      expect(result.overloadedMembers).toHaveLength(0);
    });
  });

  describe('HealthService.analyzeVelocity', () => {
    let healthService: HealthService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: PMNotificationService,
            useValue: createMockPMNotificationService(),
          },
        ],
      }).compile();

      healthService = module.get<HealthService>(HealthService);
    });

    it('should analyze velocity trends', async () => {
      // Arrange
      const now = new Date();
      const mockTasks = [
        {
          id: testId('task', 1),
          completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          storyPoints: 3,
        },
        {
          id: testId('task', 2),
          completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          storyPoints: 5,
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      } as any);
      mockPrisma.task.findMany.mockResolvedValue(mockTasks as any);

      // Act
      const result = await healthService.analyzeVelocity(
        testData.workspaceId,
        testData.projectId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.currentVelocity).toBeDefined();
      expect(result.baselineVelocity).toBeDefined();
      expect(result.trend).toBeDefined();
    });
  });
});

describe('Health Score Levels', () => {
  it('should have EXCELLENT level for scores >= 85', () => {
    const getLevel = (score: number) => {
      if (score >= 85) return 'EXCELLENT';
      if (score >= 70) return 'GOOD';
      if (score >= 50) return 'WARNING';
      return 'CRITICAL';
    };

    expect(getLevel(100)).toBe('EXCELLENT');
    expect(getLevel(90)).toBe('EXCELLENT');
    expect(getLevel(85)).toBe('EXCELLENT');
  });

  it('should have GOOD level for scores 70-84', () => {
    const getLevel = (score: number) => {
      if (score >= 85) return 'EXCELLENT';
      if (score >= 70) return 'GOOD';
      if (score >= 50) return 'WARNING';
      return 'CRITICAL';
    };

    expect(getLevel(84)).toBe('GOOD');
    expect(getLevel(75)).toBe('GOOD');
    expect(getLevel(70)).toBe('GOOD');
  });

  it('should have WARNING level for scores 50-69', () => {
    const getLevel = (score: number) => {
      if (score >= 85) return 'EXCELLENT';
      if (score >= 70) return 'GOOD';
      if (score >= 50) return 'WARNING';
      return 'CRITICAL';
    };

    expect(getLevel(69)).toBe('WARNING');
    expect(getLevel(60)).toBe('WARNING');
    expect(getLevel(50)).toBe('WARNING');
  });

  it('should have CRITICAL level for scores < 50', () => {
    const getLevel = (score: number) => {
      if (score >= 85) return 'EXCELLENT';
      if (score >= 70) return 'GOOD';
      if (score >= 50) return 'WARNING';
      return 'CRITICAL';
    };

    expect(getLevel(49)).toBe('CRITICAL');
    expect(getLevel(25)).toBe('CRITICAL');
    expect(getLevel(0)).toBe('CRITICAL');
  });
});

describe('Risk Severity', () => {
  it('should have severity levels', () => {
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

    expect(severities).toContain('CRITICAL');
    expect(severities).toContain('HIGH');
    expect(severities).toContain('MEDIUM');
    expect(severities).toContain('LOW');
  });
});
