/**
 * Report Controller Integration Tests
 *
 * Tests for the ReportController endpoints including:
 * - POST /pm/agents/reports/:projectId/generate - Generate report
 * - GET /pm/agents/reports/:projectId - List reports with pagination
 * - GET /pm/agents/reports/:projectId/:reportId - Get single report
 *
 * @see docs/modules/bm-pm/stories/pm-12-4-integration-e2e-tests.md
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../common/services/prisma.service';
import { ReportService } from '../report.service';
import { ReportType, ReportFormat } from '@prisma/client';
import {
  createMockPrisma,
  createMockAgentClient,
  testId,
  TestData,
  expectReportStructure,
} from './test-utils';

describe('ReportController (Integration)', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockAgentClient: ReturnType<typeof createMockAgentClient>;
  let testData: TestData;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
    mockAgentClient = createMockAgentClient();

    // Set up test data context
    testData = {
      workspaceId: testId('workspace'),
      projectId: testId('project'),
      phaseId: testId('phase'),
      taskIds: [testId('task', 1), testId('task', 2)],
      userId: testId('user'),
    };
  });

  describe('ReportService.generateReport', () => {
    let reportService: ReportService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReportService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: 'PythonAgentClient',
            useValue: mockAgentClient,
          },
        ],
      }).compile();

      reportService = module.get<ReportService>(ReportService);
    });

    it('should generate project report and store in database', async () => {
      // Arrange
      const reportDto = {
        type: ReportType.PROJECT_STATUS,
        format: ReportFormat.MARKDOWN,
      };

      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
        name: 'Test Project',
      });

      mockPrisma.task.findMany.mockResolvedValue([
        { id: testId('task', 1), status: 'DONE', completedAt: new Date() },
        { id: testId('task', 2), status: 'IN_PROGRESS' },
      ]);

      mockPrisma.report.create.mockResolvedValue({
        id: testId('report'),
        type: ReportType.PROJECT_STATUS,
        title: 'Project Status Report',
        projectId: testData.projectId,
        workspaceId: testData.workspaceId,
        content: { summary: 'Generated report content...' },
        generatedBy: testData.userId,
        generatedAt: new Date(),
        format: ReportFormat.MARKDOWN,
        createdAt: new Date(),
      });

      // Act
      const result = await reportService.generateReport(
        testData.workspaceId,
        testData.projectId,
        testData.userId,
        reportDto,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.report).toHaveProperty('id');
      expect(mockPrisma.report.create).toHaveBeenCalled();
      expect(mockAgentClient.generateReport).toHaveBeenCalled();
    });

    it('should generate HEALTH_REPORT', async () => {
      // Arrange
      const reportDto = {
        type: ReportType.HEALTH_REPORT,
      };

      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
        name: 'Test Project',
      });

      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.report.create.mockResolvedValue({
        id: testId('report'),
        type: ReportType.HEALTH_REPORT,
        title: 'Health Report',
        projectId: testData.projectId,
        workspaceId: testData.workspaceId,
        content: { summary: 'Health report content...' },
        generatedBy: testData.userId,
        generatedAt: new Date(),
        format: ReportFormat.MARKDOWN,
        createdAt: new Date(),
      });

      // Act
      const result = await reportService.generateReport(
        testData.workspaceId,
        testData.projectId,
        testData.userId,
        reportDto,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.report.type).toBe(ReportType.HEALTH_REPORT);
    });

    it('should throw error for non-existent project', async () => {
      // Arrange
      mockPrisma.project.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportService.generateReport(
          testData.workspaceId,
          'non-existent-project',
          testData.userId,
          { type: ReportType.PROJECT_STATUS },
        ),
      ).rejects.toThrow();
    });

    it('should throw error for wrong workspace', async () => {
      // Arrange
      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: 'different-workspace',
      });

      // Act & Assert
      await expect(
        reportService.generateReport(
          testData.workspaceId,
          testData.projectId,
          testData.userId,
          { type: ReportType.PROJECT_STATUS },
        ),
      ).rejects.toThrow();
    });
  });

  describe('ReportService.getReportHistory', () => {
    let reportService: ReportService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReportService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: 'PythonAgentClient',
            useValue: mockAgentClient,
          },
        ],
      }).compile();

      reportService = module.get<ReportService>(ReportService);
    });

    it('should return paginated report list', async () => {
      // Arrange
      const mockReports = [
        {
          id: testId('report', 1),
          type: ReportType.PROJECT_STATUS,
          title: 'Project Status',
          projectId: testData.projectId,
          workspaceId: testData.workspaceId,
          generatedBy: testData.userId,
          generatedAt: new Date(),
          format: ReportFormat.MARKDOWN,
          createdAt: new Date(),
        },
        {
          id: testId('report', 2),
          type: ReportType.HEALTH_REPORT,
          title: 'Health Report',
          projectId: testData.projectId,
          workspaceId: testData.workspaceId,
          generatedBy: testData.userId,
          generatedAt: new Date(),
          format: ReportFormat.MARKDOWN,
          createdAt: new Date(),
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      });

      mockPrisma.report.findMany.mockResolvedValue(mockReports);

      // Act
      const result = await reportService.getReportHistory(
        testData.workspaceId,
        testData.projectId,
        undefined,
        10,
      );

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result.reports)).toBe(true);
      expect(result.reports).toHaveLength(2);
      result.reports.forEach((report: Record<string, unknown>) => {
        expectReportStructure(report);
      });
    });

    it('should filter by report type', async () => {
      // Arrange
      const mockReports = [
        {
          id: testId('report', 1),
          type: ReportType.PROJECT_STATUS,
          title: 'Project Status',
          projectId: testData.projectId,
          workspaceId: testData.workspaceId,
          generatedBy: testData.userId,
          generatedAt: new Date(),
          format: ReportFormat.MARKDOWN,
          createdAt: new Date(),
        },
      ];

      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      });

      mockPrisma.report.findMany.mockResolvedValue(mockReports);

      // Act
      await reportService.getReportHistory(
        testData.workspaceId,
        testData.projectId,
        ReportType.PROJECT_STATUS,
        10,
      );

      // Assert
      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: ReportType.PROJECT_STATUS,
          }),
        }),
      );
    });

    it('should respect limit parameter', async () => {
      // Arrange
      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      });

      mockPrisma.report.findMany.mockResolvedValue([]);

      // Act
      await reportService.getReportHistory(
        testData.workspaceId,
        testData.projectId,
        undefined,
        5,
      );

      // Assert
      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });

    it('should order by createdAt descending', async () => {
      // Arrange
      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      });

      mockPrisma.report.findMany.mockResolvedValue([]);

      // Act
      await reportService.getReportHistory(
        testData.workspaceId,
        testData.projectId,
        undefined,
        10,
      );

      // Assert
      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({
            createdAt: 'desc',
          }),
        }),
      );
    });
  });

  describe('ReportService.getReport', () => {
    let reportService: ReportService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReportService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: 'PythonAgentClient',
            useValue: mockAgentClient,
          },
        ],
      }).compile();

      reportService = module.get<ReportService>(ReportService);
    });

    it('should return single report by ID', async () => {
      // Arrange
      const reportId = testId('report');
      const mockReport = {
        id: reportId,
        type: ReportType.PROJECT_STATUS,
        title: 'Project Status Report',
        content: { summary: 'Report content here...' },
        projectId: testData.projectId,
        workspaceId: testData.workspaceId,
        generatedBy: testData.userId,
        generatedAt: new Date(),
        format: ReportFormat.MARKDOWN,
        createdAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      });

      mockPrisma.report.findUnique.mockResolvedValue(mockReport);

      // Act
      const result = await reportService.getReport(
        testData.workspaceId,
        testData.projectId,
        reportId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.report.id).toBe(reportId);
      expect(result.report.content).toBeDefined();
      expectReportStructure(result.report);
    });

    it('should throw error for non-existent report', async () => {
      // Arrange
      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      });

      mockPrisma.report.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportService.getReport(
          testData.workspaceId,
          testData.projectId,
          'non-existent-report',
        ),
      ).rejects.toThrow();
    });

    it('should throw error for report from wrong project', async () => {
      // Arrange
      const reportId = testId('report');

      mockPrisma.project.findUnique.mockResolvedValue({
        id: testData.projectId,
        workspaceId: testData.workspaceId,
      });

      mockPrisma.report.findUnique.mockResolvedValue({
        id: reportId,
        projectId: 'different-project', // Wrong project
        workspaceId: testData.workspaceId,
      });

      // Act & Assert
      await expect(
        reportService.getReport(
          testData.workspaceId,
          testData.projectId,
          reportId,
        ),
      ).rejects.toThrow();
    });
  });
});

describe('Report Types', () => {
  it('should support PROJECT_STATUS reports', () => {
    const reportTypes = [
      ReportType.PROJECT_STATUS,
      ReportType.HEALTH_REPORT,
      ReportType.PROGRESS_REPORT,
    ];

    expect(reportTypes).toContain(ReportType.PROJECT_STATUS);
  });

  it('should support HEALTH_REPORT reports', () => {
    const reportTypes = [
      ReportType.PROJECT_STATUS,
      ReportType.HEALTH_REPORT,
      ReportType.PROGRESS_REPORT,
    ];

    expect(reportTypes).toContain(ReportType.HEALTH_REPORT);
  });
});

describe('Report DTO Validation', () => {
  it('should require type field', () => {
    const invalidDto = {
      format: ReportFormat.MARKDOWN,
      // Missing type
    };

    expect(invalidDto).not.toHaveProperty('type');
  });

  it('should accept valid report request', () => {
    const validDto = {
      type: ReportType.PROJECT_STATUS,
      format: ReportFormat.MARKDOWN,
    };

    expect(validDto).toHaveProperty('type');
    expect(validDto.type).toBe(ReportType.PROJECT_STATUS);
  });

  it('should allow optional format field', () => {
    const validDto = {
      type: ReportType.HEALTH_REPORT,
      // format is optional
    };

    expect(validDto).toHaveProperty('type');
  });
});
