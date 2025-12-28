import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from '../report.service';
import { HealthService } from '../health.service';
import { PrismaService } from '../../../common/services/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { ReportType, ReportFormat, StakeholderType } from '@prisma/client';

describe('ReportService', () => {
  let service: ReportService;
  let _prismaService: PrismaService;
  let _healthService: HealthService;

  const mockWorkspaceId = 'ws-123';
  const mockProjectId = 'proj-123';
  const mockUserId = 'user-123';

  const mockPrisma = {
    project: {
      findUnique: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    report: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockHealthService = {
    getLatestHealthScore: jest.fn(),
    getActiveRisks: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _healthService = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    const mockProject = {
      id: mockProjectId,
      workspaceId: mockWorkspaceId,
      name: 'Test Project',
      status: 'ACTIVE',
      startDate: new Date(),
      targetDate: new Date(Date.now() + 86400000 * 30),
      phases: [],
    };

    it('should generate a PROJECT_STATUS report', async () => {
      const mockReport = {
        id: 'report-1',
        type: ReportType.PROJECT_STATUS,
        title: 'Project Status Report',
        content: {},
        format: ReportFormat.MARKDOWN,
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);
      mockHealthService.getLatestHealthScore.mockResolvedValue({
        score: 85,
        level: 'EXCELLENT',
        trend: 'STABLE',
      } as any);
      mockHealthService.getActiveRisks.mockResolvedValue([]);
      mockPrisma.report.create.mockResolvedValue(mockReport as any);

      const result = await service.generateReport(
        mockWorkspaceId,
        mockProjectId,
        mockUserId,
        { type: ReportType.PROJECT_STATUS },
      );

      expect(result.report).toBeDefined();
      expect(mockPrisma.report.create).toHaveBeenCalled();
    });

    it('should generate a HEALTH_REPORT', async () => {
      const mockReport = {
        id: 'report-2',
        type: ReportType.HEALTH_REPORT,
        title: 'Health Report',
        content: {},
        format: ReportFormat.MARKDOWN,
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockHealthService.getLatestHealthScore.mockResolvedValue({
        score: 75,
        level: 'GOOD',
        trend: 'IMPROVING',
        factors: {
          onTimeDelivery: 0.9,
          blockerImpact: 0.85,
          teamCapacity: 0.8,
          velocityTrend: 0.75,
        },
      } as any);
      mockHealthService.getActiveRisks.mockResolvedValue([]);
      mockPrisma.report.create.mockResolvedValue(mockReport as any);

      const result = await service.generateReport(
        mockWorkspaceId,
        mockProjectId,
        mockUserId,
        { type: ReportType.HEALTH_REPORT },
      );

      expect(result.report).toBeDefined();
      expect(result.report.type).toBe(ReportType.HEALTH_REPORT);
    });

    it('should generate a PROGRESS_REPORT with custom days', async () => {
      const mockReport = {
        id: 'report-3',
        type: ReportType.PROGRESS_REPORT,
        title: 'Progress Report',
        content: {},
        format: ReportFormat.MARKDOWN,
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(5);
      mockPrisma.report.create.mockResolvedValue(mockReport as any);

      const result = await service.generateReport(
        mockWorkspaceId,
        mockProjectId,
        mockUserId,
        { type: ReportType.PROGRESS_REPORT, days: 14 },
      );

      expect(result.report).toBeDefined();
      expect(result.report.type).toBe(ReportType.PROGRESS_REPORT);
    });

    it('should throw ForbiddenException for non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.generateReport(mockWorkspaceId, mockProjectId, mockUserId, {
          type: ReportType.PROJECT_STATUS,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for wrong workspace', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        workspaceId: 'other-ws',
      } as any);

      await expect(
        service.generateReport(mockWorkspaceId, mockProjectId, mockUserId, {
          type: ReportType.PROJECT_STATUS,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid report type', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);

      await expect(
        service.generateReport(mockWorkspaceId, mockProjectId, mockUserId, {
          type: 'INVALID_TYPE' as ReportType,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateReport with stakeholder types', () => {
    const mockProject = {
      id: mockProjectId,
      workspaceId: mockWorkspaceId,
      name: 'Test Project',
      status: 'ACTIVE',
      startDate: new Date(),
      targetDate: new Date(Date.now() + 86400000 * 30),
      phases: [],
    };

    it('should generate EXECUTIVE stakeholder report', async () => {
      const mockReport = {
        id: 'report-exec',
        type: ReportType.PROJECT_STATUS,
        stakeholderType: StakeholderType.EXECUTIVE,
        title: 'Executive Summary',
        content: {},
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(10);
      mockHealthService.getLatestHealthScore.mockResolvedValue({
        score: 80,
        level: 'GOOD',
        trend: 'STABLE',
      } as any);
      mockHealthService.getActiveRisks.mockResolvedValue([]);
      mockPrisma.report.create.mockResolvedValue(mockReport as any);

      const result = await service.generateReport(
        mockWorkspaceId,
        mockProjectId,
        mockUserId,
        {
          type: ReportType.PROJECT_STATUS,
          stakeholderType: StakeholderType.EXECUTIVE,
        },
      );

      expect(result.report).toBeDefined();
      expect(result.report.stakeholderType).toBe(StakeholderType.EXECUTIVE);
    });

    it('should generate TEAM_LEAD stakeholder report', async () => {
      const mockReport = {
        id: 'report-team',
        type: ReportType.PROJECT_STATUS,
        stakeholderType: StakeholderType.TEAM_LEAD,
        title: 'Team Lead Report',
        content: {},
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(10);
      mockHealthService.getLatestHealthScore.mockResolvedValue({
        score: 75,
        level: 'GOOD',
        trend: 'STABLE',
      } as any);
      mockHealthService.getActiveRisks.mockResolvedValue([]);
      mockPrisma.report.create.mockResolvedValue(mockReport as any);

      const result = await service.generateReport(
        mockWorkspaceId,
        mockProjectId,
        mockUserId,
        {
          type: ReportType.PROJECT_STATUS,
          stakeholderType: StakeholderType.TEAM_LEAD,
        },
      );

      expect(result.report).toBeDefined();
      expect(result.report.stakeholderType).toBe(StakeholderType.TEAM_LEAD);
    });

    it('should generate CLIENT stakeholder report', async () => {
      const mockReport = {
        id: 'report-client',
        type: ReportType.PROJECT_STATUS,
        stakeholderType: StakeholderType.CLIENT,
        title: 'Client Update',
        content: {},
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject as any);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(10);
      mockHealthService.getLatestHealthScore.mockResolvedValue({
        score: 90,
        level: 'EXCELLENT',
        trend: 'IMPROVING',
      } as any);
      mockPrisma.report.create.mockResolvedValue(mockReport as any);

      const result = await service.generateReport(
        mockWorkspaceId,
        mockProjectId,
        mockUserId,
        {
          type: ReportType.PROJECT_STATUS,
          stakeholderType: StakeholderType.CLIENT,
        },
      );

      expect(result.report).toBeDefined();
      expect(result.report.stakeholderType).toBe(StakeholderType.CLIENT);
    });
  });

  describe('getReport', () => {
    it('should return a report by ID', async () => {
      const mockReport = {
        id: 'report-1',
        projectId: mockProjectId,
        workspaceId: mockWorkspaceId,
        type: ReportType.PROJECT_STATUS,
        title: 'Test Report',
        content: { summary: 'Test' },
      };

      mockPrisma.report.findUnique.mockResolvedValue(mockReport as any);

      const result = await service.getReport(mockWorkspaceId, mockProjectId, 'report-1');

      expect(result).toBeDefined();
      expect(result.report.id).toBe('report-1');
    });

    it('should throw ForbiddenException for non-existent report', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);

      await expect(
        service.getReport(mockWorkspaceId, mockProjectId, 'nonexistent'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for wrong workspace', async () => {
      const mockReport = {
        id: 'report-1',
        workspaceId: 'other-ws',
        projectId: mockProjectId,
      };

      mockPrisma.report.findUnique.mockResolvedValue(mockReport as any);

      await expect(
        service.getReport(mockWorkspaceId, mockProjectId, 'report-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getReportHistory', () => {
    it('should return report history for project', async () => {
      const mockReports = [
        {
          id: 'report-1',
          projectId: mockProjectId,
          type: ReportType.PROJECT_STATUS,
          title: 'Report 1',
          generatedAt: new Date(),
        },
        {
          id: 'report-2',
          projectId: mockProjectId,
          type: ReportType.HEALTH_REPORT,
          title: 'Report 2',
          generatedAt: new Date(Date.now() - 86400000),
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
      } as any);
      mockPrisma.report.findMany.mockResolvedValue(mockReports as any);
      mockPrisma.report.count.mockResolvedValue(2);

      const result = await service.getReportHistory(
        mockWorkspaceId,
        mockProjectId,
        undefined, // type
        10, // limit
      );

      expect(result.reports).toHaveLength(2);
      expect(result.reports[0].id).toBe('report-1');
      expect(result.total).toBe(2);
    });

    it('should filter by report type', async () => {
      const mockReports = [
        {
          id: 'report-1',
          projectId: mockProjectId,
          type: ReportType.PROJECT_STATUS,
          title: 'Status Report',
          generatedAt: new Date(),
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
      } as any);
      mockPrisma.report.findMany.mockResolvedValue(mockReports as any);
      mockPrisma.report.count.mockResolvedValue(1);

      const result = await service.getReportHistory(
        mockWorkspaceId,
        mockProjectId,
        ReportType.PROJECT_STATUS,
      );

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].type).toBe(ReportType.PROJECT_STATUS);
    });

    it('should apply limit', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        workspaceId: mockWorkspaceId,
      } as any);
      mockPrisma.report.findMany.mockResolvedValue([]);
      mockPrisma.report.count.mockResolvedValue(0);

      await service.getReportHistory(mockWorkspaceId, mockProjectId, undefined, 5);

      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });

    it('should throw ForbiddenException for invalid project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.getReportHistory(mockWorkspaceId, mockProjectId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('generateProgressReport', () => {
    const mockProject = {
      id: mockProjectId,
      name: 'Test Project',
      status: 'ACTIVE',
      startDate: new Date(Date.now() - 86400000 * 30),
      targetDate: new Date(Date.now() + 86400000 * 30),
    };

    it('should generate progress report with completed tasks', async () => {
      const completedTasks = [
        {
          id: 'task-1',
          title: 'Completed Task 1',
          status: 'DONE',
          completedAt: new Date(Date.now() - 86400000 * 2),
        },
        {
          id: 'task-2',
          title: 'Completed Task 2',
          status: 'DONE',
          completedAt: new Date(Date.now() - 86400000 * 5),
        },
      ];

      const inProgressTasks = [
        {
          id: 'task-3',
          title: 'In Progress Task',
          status: 'IN_PROGRESS',
          assigneeId: 'user-1',
        },
      ];

      const upcomingTasks = [
        {
          id: 'task-4',
          title: 'Upcoming Task',
          status: 'TODO',
        },
      ];

      mockPrisma.task.findMany
        .mockResolvedValueOnce(completedTasks as any)
        .mockResolvedValueOnce(inProgressTasks as any)
        .mockResolvedValueOnce(upcomingTasks as any);

      mockPrisma.task.count.mockResolvedValue(3);

      const result = await (service as any).generateProgressReport(
        mockWorkspaceId,
        mockProject,
        7,
      );

      expect(result.content.summary).toContain('2 tasks completed');
      expect(result.content.summary).toContain('1 in progress');
      expect(result.content.sections).toHaveLength(5);
    });

    it('should handle empty task lists', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      const result = await (service as any).generateProgressReport(
        mockWorkspaceId,
        mockProject,
        7,
      );

      expect(result.content.summary).toContain('0 tasks completed');
      expect(result.content.sections[1].content).toContain('No tasks completed');
    });
  });

  describe('generateProjectStatusReport', () => {
    const mockProject = {
      id: mockProjectId,
      name: 'Test Project',
      status: 'ACTIVE',
      startDate: new Date(),
      targetDate: new Date(Date.now() + 86400000 * 30),
      phases: [
        { id: 'phase-1', name: 'Phase 1', phaseNumber: 1 },
        { id: 'phase-2', name: 'Phase 2', phaseNumber: 2 },
      ],
    };

    it('should generate status report with project phases', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(10);
      mockHealthService.getLatestHealthScore.mockResolvedValue({
        score: 85,
        level: 'EXCELLENT',
        trend: 'STABLE',
        factors: {
          onTimeDelivery: 0.95,
          blockerImpact: 0.9,
          teamCapacity: 0.85,
          velocityTrend: 0.8,
        },
      });
      mockHealthService.getActiveRisks.mockResolvedValue([]);

      const result = await (service as any).generateProjectStatusReport(
        mockWorkspaceId,
        mockProject,
      );

      expect(result.content).toBeDefined();
      expect(result.title).toContain(mockProject.name);
      expect(result.content.sections).toBeDefined();
    });
  });

  describe('generateHealthReport', () => {
    const mockProject = {
      id: mockProjectId,
      name: 'Test Project',
      status: 'ACTIVE',
    };

    it('should generate health report with score details', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockHealthService.getLatestHealthScore.mockResolvedValue({
        score: 75,
        level: 'GOOD',
        trend: 'STABLE',
        factors: {
          onTimeDelivery: 0.85,
          blockerImpact: 0.7,
          teamCapacity: 0.8,
          velocityTrend: 0.65,
        },
        explanation: 'Project is on track',
        suggestions: ['Review blockers', 'Monitor velocity'],
      });
      mockHealthService.getActiveRisks.mockResolvedValue([
        {
          id: 'risk-1',
          title: 'Deadline Risk',
          severity: 'HIGH',
          description: 'Some tasks are overdue',
        },
      ]);

      const result = await (service as any).generateHealthReport(
        mockWorkspaceId,
        mockProject,
      );

      expect(result.content).toBeDefined();
      expect(result.content.sections).toBeDefined();
      expect(result.title).toContain('Health');
    });

    it('should handle missing health score gracefully', async () => {
      mockHealthService.getLatestHealthScore.mockResolvedValue(null);
      mockHealthService.getActiveRisks.mockResolvedValue([]);
      mockPrisma.task.findMany.mockResolvedValue([]);

      const result = await (service as any).generateHealthReport(
        mockWorkspaceId,
        mockProject,
      );

      expect(result.content).toBeDefined();
      expect(result.content.summary).toContain('No health data');
    });
  });
});
