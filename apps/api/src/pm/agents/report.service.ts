import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ReportType, ReportFormat } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { HealthService } from './health.service';

export interface ReportContent {
  summary: string;
  sections: {
    heading: string;
    content: string; // Markdown formatted
  }[];
  metrics?: Record<string, any>;
}

export interface GenerateReportDto {
  type: ReportType;
  format?: ReportFormat;
  days?: number; // For PROGRESS_REPORT - how many days to look back
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private prisma: PrismaService,
    private healthService: HealthService,
  ) {}

  /**
   * Generate a new report for a project
   */
  async generateReport(
    workspaceId: string,
    projectId: string,
    userId: string,
    dto: GenerateReportDto,
  ) {
    this.logger.log(
      `Generating ${dto.type} report for project ${projectId}`,
    );

    // Validate access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        phases: {
          orderBy: { phaseNumber: 'asc' },
        },
      },
    });

    if (!project || project.workspaceId !== workspaceId) {
      throw new ForbiddenException('Project not found or access denied');
    }

    // Generate content based on type
    let content: ReportContent;
    let title: string;

    switch (dto.type) {
      case ReportType.PROJECT_STATUS:
        ({ content, title } = await this.generateProjectStatusReport(
          workspaceId,
          project,
        ));
        break;

      case ReportType.HEALTH_REPORT:
        ({ content, title } = await this.generateHealthReport(
          workspaceId,
          project,
        ));
        break;

      case ReportType.PROGRESS_REPORT:
        ({ content, title } = await this.generateProgressReport(
          workspaceId,
          project,
          dto.days || 7,
        ));
        break;

      default:
        throw new BadRequestException(`Invalid report type: ${dto.type}`);
    }

    // Store report
    const report = await this.prisma.report.create({
      data: {
        workspaceId,
        projectId: project.id,
        type: dto.type,
        title,
        content: content as any,
        format: dto.format || ReportFormat.MARKDOWN,
        generatedBy: 'herald_agent',
      },
    });

    return { report };
  }

  /**
   * Get report history for a project
   */
  async getReportHistory(
    workspaceId: string,
    projectId: string,
    type?: ReportType,
    limit: number = 10,
  ) {
    // Validate access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.workspaceId !== workspaceId) {
      throw new ForbiddenException('Project not found or access denied');
    }

    // Query reports
    const where: any = {
      workspaceId,
      projectId,
    };

    if (type) {
      where.type = type;
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        take: Math.min(limit, 50), // Max 50
        select: {
          id: true,
          projectId: true,
          type: true,
          title: true,
          format: true,
          generatedBy: true,
          generatedAt: true,
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { reports, total };
  }

  /**
   * Get a specific report by ID
   */
  async getReport(workspaceId: string, projectId: string, reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (
      !report ||
      report.workspaceId !== workspaceId ||
      report.projectId !== projectId
    ) {
      throw new ForbiddenException('Report not found or access denied');
    }

    return { report };
  }

  /**
   * Generate PROJECT_STATUS report
   */
  private async generateProjectStatusReport(
    workspaceId: string,
    project: any,
  ): Promise<{ content: ReportContent; title: string }> {
    // Get all tasks
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: project.id,
        deletedAt: null,
      },
    });

    // Calculate metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const completionPercent =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const tasksByStatus = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Find current phase
    const currentPhase = project.phases.find((p: any) => p.status === 'CURRENT');

    // Build report content
    const content: ReportContent = {
      summary: `Project "${project.name}" is ${completionPercent}% complete with ${completedTasks} of ${totalTasks} tasks done.`,
      sections: [
        {
          heading: 'Executive Summary',
          content: [
            `**Project:** ${project.name}`,
            `**Status:** ${project.status}`,
            `**Completion:** ${completionPercent}% (${completedTasks}/${totalTasks} tasks)`,
            currentPhase
              ? `**Current Phase:** ${currentPhase.name}`
              : '**Current Phase:** None',
          ].join('\n'),
        },
        {
          heading: 'Current Phase Progress',
          content: currentPhase
            ? [
                `**Phase:** ${currentPhase.name}`,
                `**Tasks:** ${currentPhase.completedTasks}/${currentPhase.totalTasks} completed`,
                currentPhase.startDate
                  ? `**Started:** ${new Date(currentPhase.startDate).toLocaleDateString()}`
                  : '',
                currentPhase.endDate
                  ? `**Target End:** ${new Date(currentPhase.endDate).toLocaleDateString()}`
                  : '',
              ]
                .filter(Boolean)
                .join('\n')
            : 'No active phase',
        },
        {
          heading: 'Task Breakdown',
          content: Object.entries(tasksByStatus)
            .map(([status, count]) => `- **${status}:** ${count} tasks`)
            .join('\n'),
        },
        {
          heading: 'Key Metrics',
          content: [
            `- **Total Tasks:** ${totalTasks}`,
            `- **Completed:** ${completedTasks}`,
            `- **Completion Rate:** ${completionPercent}%`,
            `- **Phases:** ${project.phases.length} total`,
          ].join('\n'),
        },
        {
          heading: 'Upcoming Milestones',
          content:
            project.phases
              .filter((p: any) => p.status === 'UPCOMING')
              .slice(0, 3)
              .map((p: any) => `- ${p.name}`)
              .join('\n') || 'No upcoming milestones',
        },
      ],
      metrics: {
        totalTasks,
        completedTasks,
        completionPercent,
        tasksByStatus,
        phaseCount: project.phases.length,
      },
    };

    return {
      content,
      title: `Project Status Report - ${project.name}`,
    };
  }

  /**
   * Generate HEALTH_REPORT
   */
  private async generateHealthReport(
    workspaceId: string,
    project: any,
  ): Promise<{ content: ReportContent; title: string }> {
    // Get latest health score
    const healthScore = await this.healthService.getLatestHealthScore(
      workspaceId,
      project.id,
    );

    // Get active risks
    const risks = await this.healthService.getActiveRisks(
      workspaceId,
      project.id,
    );

    const content: ReportContent = {
      summary: healthScore
        ? `Project health score is ${healthScore.score}/100 (${healthScore.level}). ${risks.length} active risk${risks.length !== 1 ? 's' : ''} detected.`
        : 'No health data available for this project.',
      sections: healthScore
        ? [
            {
              heading: 'Health Score Overview',
              content: [
                `**Score:** ${healthScore.score}/100`,
                `**Level:** ${healthScore.level}`,
                `**Trend:** ${healthScore.trend}`,
                `**Last Checked:** ${new Date(healthScore.calculatedAt).toLocaleString()}`,
              ].join('\n'),
            },
            {
              heading: 'Health Factors',
              content: [
                `- **On-Time Delivery:** ${Math.round(healthScore.onTimeDelivery * 100)}%`,
                `- **Blocker Impact:** ${Math.round(healthScore.blockerImpact * 100)}%`,
                `- **Team Capacity:** ${Math.round(healthScore.teamCapacity * 100)}%`,
                `- **Velocity Trend:** ${Math.round(healthScore.velocityTrend * 100)}%`,
              ].join('\n'),
            },
            {
              heading: 'Active Risks',
              content:
                risks.length > 0
                  ? risks
                      .map(
                        (r) =>
                          `- **[${r.severity}]** ${r.title}\n  ${r.description}`,
                      )
                      .join('\n\n')
                  : 'No active risks detected.',
            },
            {
              heading: 'Recommendations',
              content: healthScore.explanation || 'No specific recommendations at this time.',
            },
          ]
        : [
            {
              heading: 'No Health Data',
              content:
                'Health monitoring has not been run for this project yet. Run a health check to generate insights.',
            },
          ],
      metrics: healthScore
        ? {
            score: healthScore.score,
            level: healthScore.level,
            trend: healthScore.trend,
            riskCount: risks.length,
            factors: {
              onTimeDelivery: healthScore.onTimeDelivery,
              blockerImpact: healthScore.blockerImpact,
              teamCapacity: healthScore.teamCapacity,
              velocityTrend: healthScore.velocityTrend,
            },
          }
        : {},
    };

    return {
      content,
      title: `Health Report - ${project.name}`,
    };
  }

  /**
   * Generate PROGRESS_REPORT
   */
  private async generateProgressReport(
    _workspaceId: string,
    project: any,
    days: number,
  ): Promise<{ content: ReportContent; title: string }> {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get tasks completed in the time period
    const completedTasks = await this.prisma.task.findMany({
      where: {
        projectId: project.id,
        status: 'DONE',
        completedAt: {
          gte: cutoffDate,
        },
        deletedAt: null,
      },
      orderBy: { completedAt: 'desc' },
    });

    // Get in-progress tasks
    const inProgressTasks = await this.prisma.task.findMany({
      where: {
        projectId: project.id,
        status: 'IN_PROGRESS',
        deletedAt: null,
      },
    });

    // Get blocked tasks
    const blockedTasks = await this.prisma.task.findMany({
      where: {
        projectId: project.id,
        status: { in: ['BACKLOG', 'TODO'] },
        deletedAt: null,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const content: ReportContent = {
      summary: `In the last ${days} days: ${completedTasks.length} tasks completed, ${inProgressTasks.length} in progress, ${blockedTasks.length} upcoming.`,
      sections: [
        {
          heading: 'Summary',
          content: [
            `**Period:** Last ${days} days`,
            `**Completed:** ${completedTasks.length} tasks`,
            `**In Progress:** ${inProgressTasks.length} tasks`,
            `**Upcoming:** ${blockedTasks.length} tasks`,
          ].join('\n'),
        },
        {
          heading: 'Completed Work',
          content:
            completedTasks.length > 0
              ? completedTasks
                  .slice(0, 10)
                  .map((t) => `- ${t.title} (completed ${new Date(t.completedAt!).toLocaleDateString()})`)
                  .join('\n')
              : 'No tasks completed in this period.',
        },
        {
          heading: 'Work in Progress',
          content:
            inProgressTasks.length > 0
              ? inProgressTasks
                  .map((t) => `- ${t.title}${t.assigneeId ? ` (assigned)` : ''}`)
                  .join('\n')
              : 'No tasks currently in progress.',
        },
        {
          heading: 'Upcoming Priorities',
          content:
            blockedTasks.length > 0
              ? blockedTasks
                  .map((t) => `- ${t.title}`)
                  .join('\n')
              : 'No upcoming tasks.',
        },
        {
          heading: 'Timeline Status',
          content: [
            `**Project Status:** ${project.status}`,
            project.startDate
              ? `**Started:** ${new Date(project.startDate).toLocaleDateString()}`
              : '',
            project.targetDate
              ? `**Target Date:** ${new Date(project.targetDate).toLocaleDateString()}`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
      metrics: {
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        upcomingTasks: blockedTasks.length,
        days,
      },
    };

    return {
      content,
      title: `Progress Report - ${project.name} (Last ${days} Days)`,
    };
  }
}
