import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ReportType, ReportFormat, StakeholderType } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { HealthService } from './health.service';
import { PMNotificationService } from '../notifications/pm-notification.service';

export interface ReportContent {
  summary: string;
  sections: {
    heading: string;
    content: string; // Markdown formatted
  }[];
  metrics?: Record<string, any>;
}

/**
 * Strips HTML tags from a string to prevent XSS
 * This is a defense-in-depth measure - frontend should also escape content
 */
function stripHtmlTags(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes report content by stripping HTML tags from text fields
 */
function sanitizeReportContent(content: ReportContent): ReportContent {
  return {
    summary: stripHtmlTags(content.summary),
    sections: content.sections.map((section) => ({
      heading: stripHtmlTags(section.heading),
      content: stripHtmlTags(section.content),
    })),
    metrics: content.metrics,
  };
}

export interface GenerateReportDto {
  type: ReportType;
  stakeholderType?: StakeholderType;
  format?: ReportFormat;
  days?: number; // For PROGRESS_REPORT - how many days to look back
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private prisma: PrismaService,
    private healthService: HealthService,
    private pmNotificationService: PMNotificationService,
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

    // Generate content based on type and stakeholder
    let content: ReportContent | undefined;
    let title: string | undefined;

    // If stakeholder type is specified, use stakeholder-specific generation
    if (dto.stakeholderType) {
      switch (dto.stakeholderType) {
        case StakeholderType.EXECUTIVE:
          ({ content, title } = await this.generateExecutiveReport(
            workspaceId,
            project,
            dto.type,
          ));
          break;

        case StakeholderType.TEAM_LEAD:
          ({ content, title } = await this.generateTeamLeadReport(
            workspaceId,
            project,
            dto.type,
          ));
          break;

        case StakeholderType.CLIENT:
          ({ content, title } = await this.generateClientReport(
            workspaceId,
            project,
            dto.type,
          ));
          break;

        case StakeholderType.GENERAL:
        default:
          // Fall through to standard report generation
          break;
      }
    }

    // Standard report generation (no stakeholder type or GENERAL)
    if (!content || !title) {
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
    }

    // Store report with sanitized content (defense-in-depth against XSS)
    const report = await this.prisma.report.create({
      data: {
        workspaceId,
        projectId: project.id,
        type: dto.type,
        stakeholderType: dto.stakeholderType || null,
        title: stripHtmlTags(title),
        content: sanitizeReportContent(content) as any,
        format: dto.format || ReportFormat.MARKDOWN,
        generatedBy: 'herald_agent',
      },
    });

    // PM-12.3: Send report generated notification to project team
    const recipientIds = await this.getReportRecipients(project.id, workspaceId);
    if (recipientIds.length > 0) {
      this.pmNotificationService
        .sendReportNotification(
          workspaceId,
          {
            projectId: project.id,
            projectName: project.name,
            reportId: report.id,
            reportType: dto.type,
            reportTitle: title,
            downloadUrl: `/pm/projects/${project.id}/reports/${report.id}`,
          },
          recipientIds,
        )
        .catch((error) => {
          this.logger.error('Failed to send report notification', error);
        });
    }

    return { report };
  }

  /**
   * Get recipients for report notifications
   * Returns project team members
   */
  private async getReportRecipients(
    projectId: string,
    _workspaceId: string,
  ): Promise<string[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        team: {
          select: {
            leadUserId: true,
            members: {
              where: { isActive: true },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!project) {
      return [];
    }

    const recipients: string[] = [];

    // Add project lead first (if present)
    if (project.team?.leadUserId) {
      recipients.push(project.team.leadUserId);
    }

    // Add team members (avoiding duplicates)
    if (project.team?.members) {
      for (const member of project.team.members) {
        if (!recipients.includes(member.userId)) {
          recipients.push(member.userId);
        }
      }
    }

    return recipients;
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
        take: Math.max(1, Math.min(limit, 50)), // Clamp to 1-50
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

    // Get upcoming tasks with count for accurate totals
    const [upcomingTasks, upcomingTaskCount] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          projectId: project.id,
          status: { in: ['BACKLOG', 'TODO'] },
          deletedAt: null,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({
        where: {
          projectId: project.id,
          status: { in: ['BACKLOG', 'TODO'] },
          deletedAt: null,
        },
      }),
    ]);

    const content: ReportContent = {
      summary: `In the last ${days} days: ${completedTasks.length} tasks completed, ${inProgressTasks.length} in progress, ${upcomingTaskCount} upcoming.`,
      sections: [
        {
          heading: 'Summary',
          content: [
            `**Period:** Last ${days} days`,
            `**Completed:** ${completedTasks.length} tasks`,
            `**In Progress:** ${inProgressTasks.length} tasks`,
            `**Upcoming:** ${upcomingTaskCount} tasks`,
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
            upcomingTasks.length > 0
              ? upcomingTasks
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
        upcomingTasks: upcomingTaskCount,
        days,
      },
    };

    return {
      content,
      title: `Progress Report - ${project.name} (Last ${days} Days)`,
    };
  }

  /**
   * Generate EXECUTIVE stakeholder report
   * High-level metrics and strategic focus
   */
  private async generateExecutiveReport(
    workspaceId: string,
    project: any,
    _reportType: ReportType,
  ): Promise<{ content: ReportContent; title: string }> {
    // Get all tasks for metrics
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: project.id,
        deletedAt: null,
      },
    });

    // Calculate high-level metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const completionPercent =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get health data if available
    const healthScore = await this.healthService.getLatestHealthScore(
      workspaceId,
      project.id,
    );

    const activeRisks = await this.healthService.getActiveRisks(
      workspaceId,
      project.id,
    );

    const highSeverityRisks = activeRisks.filter(
      (r) => r.severity === 'HIGH' || r.severity === 'CRITICAL',
    );

    // Timeline status
    let timelineStatus = 'On Track';
    if (project.targetDate) {
      const daysRemaining = Math.ceil(
        (new Date(project.targetDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysRemaining < 0) {
        timelineStatus = 'Overdue';
      } else if (daysRemaining < 7 && completionPercent < 90) {
        timelineStatus = 'At Risk';
      }
    }

    const content: ReportContent = {
      summary: `${project.name} is ${completionPercent}% complete. ${timelineStatus}. ${healthScore ? `Health: ${healthScore.level}.` : ''} ${highSeverityRisks.length > 0 ? `${highSeverityRisks.length} critical risk(s) identified.` : 'No critical risks.'}`,
      sections: [
        {
          heading: 'Executive Summary',
          content: [
            `**Project:** ${project.name}`,
            `**Status:** ${project.status}`,
            `**Completion:** ${completionPercent}%`,
            `**Timeline:** ${timelineStatus}`,
            healthScore
              ? `**Health Score:** ${healthScore.score}/100 (${healthScore.level})`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
        {
          heading: 'Key Metrics',
          content: [
            `- **Progress:** ${completedTasks}/${totalTasks} deliverables completed`,
            `- **Timeline Status:** ${timelineStatus}`,
            healthScore ? `- **Health Level:** ${healthScore.level}` : '',
            `- **Critical Risks:** ${highSeverityRisks.length}`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
        {
          heading: 'Strategic Outcomes',
          content:
            completionPercent >= 75
              ? 'Project is on track to deliver planned outcomes. Key milestones are being achieved consistently.'
              : completionPercent >= 50
                ? 'Project is progressing toward strategic goals. Some adjustments may be needed to ensure timely delivery.'
                : 'Project is in early stages. Focus remains on foundational work and establishing delivery momentum.',
        },
        {
          heading: 'Business Impact',
          content:
            highSeverityRisks.length > 0
              ? `**Action Required:** ${highSeverityRisks.length} critical risk(s) may impact delivery. Executive review recommended.`
              : timelineStatus === 'At Risk'
                ? 'Timeline pressure identified. Resource allocation review recommended.'
                : 'Project delivering as planned. No immediate business impact concerns.',
        },
        {
          heading: 'Recommendations',
          content: [
            highSeverityRisks.length > 0
              ? '- Review and mitigate critical risks'
              : '',
            timelineStatus === 'At Risk' || timelineStatus === 'Overdue'
              ? '- Consider timeline adjustment or resource reallocation'
              : '',
            completionPercent >= 75 ? '- Plan for deployment and rollout' : '',
            healthScore && healthScore.score < 60
              ? '- Conduct project health review'
              : '',
            !highSeverityRisks.length &&
            timelineStatus === 'On Track' &&
            completionPercent < 75
              ? '- Continue current approach'
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
      metrics: {
        completionPercent,
        timelineStatus,
        healthScore: healthScore?.score,
        healthLevel: healthScore?.level,
        criticalRisks: highSeverityRisks.length,
        totalRisks: activeRisks.length,
      },
    };

    return {
      content,
      title: `Executive Summary - ${project.name}`,
    };
  }

  /**
   * Generate TEAM_LEAD stakeholder report
   * Detailed tasks, blockers, and technical information
   */
  private async generateTeamLeadReport(
    workspaceId: string,
    project: any,
    _reportType: ReportType,
  ): Promise<{ content: ReportContent; title: string }> {
    // Get all tasks with assignees
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: project.id,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get in-progress tasks
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');

    // Get blocked/todo tasks (potential blockers)
    const blockedTasks = tasks.filter(
      (t) => t.status === 'TODO' || t.status === 'BACKLOG',
    );

    // Calculate velocity (tasks completed in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentlyCompleted = tasks.filter(
      (t) => t.status === 'DONE' && t.completedAt && t.completedAt >= sevenDaysAgo,
    );

    // Group tasks by status
    const tasksByStatus = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get current phase
    const currentPhase = project.phases.find((p: any) => p.status === 'CURRENT');

    // Calculate team capacity (simple metric based on in-progress tasks)
    const capacityPercent = Math.min(
      100,
      Math.round((inProgressTasks.length / Math.max(tasks.length * 0.3, 1)) * 100),
    );

    const content: ReportContent = {
      summary: `Sprint overview: ${inProgressTasks.length} tasks in progress, ${recentlyCompleted.length} completed last 7 days. Current velocity: ${recentlyCompleted.length} tasks/week. Team capacity: ${capacityPercent}%.`,
      sections: [
        {
          heading: 'Sprint Overview',
          content: currentPhase
            ? [
                `**Current Phase:** ${currentPhase.name}`,
                `**Phase Progress:** ${currentPhase.completedTasks}/${currentPhase.totalTasks} tasks`,
                `**Active Tasks:** ${inProgressTasks.length}`,
                `**Blocked/Waiting:** ${blockedTasks.length}`,
              ].join('\n')
            : `**Active Tasks:** ${inProgressTasks.length}\n**Blocked/Waiting:** ${blockedTasks.length}`,
        },
        {
          heading: 'Team Velocity',
          content: [
            `- **Last 7 Days:** ${recentlyCompleted.length} tasks completed`,
            `- **Average Velocity:** ${recentlyCompleted.length} tasks/week`,
            `- **Current Capacity:** ${capacityPercent}%`,
          ].join('\n'),
        },
        {
          heading: 'Active Tasks by Status',
          content: Object.entries(tasksByStatus)
            .map(([status, count]) => `- **${status}:** ${count} tasks`)
            .join('\n'),
        },
        {
          heading: 'Work in Progress',
          content:
            inProgressTasks.length > 0
              ? inProgressTasks
                  .slice(0, 10)
                  .map((t) => `- ${t.title}${t.assigneeId ? ' (assigned)' : ' (unassigned)'}`)
                  .join('\n')
              : 'No tasks currently in progress.',
        },
        {
          heading: 'Blockers and Dependencies',
          content:
            blockedTasks.length > 0
              ? blockedTasks
                  .slice(0, 10)
                  .map((t) => `- ${t.title} (${t.status})`)
                  .join('\n')
              : 'No blockers identified.',
        },
        {
          heading: 'Capacity Planning',
          content: [
            `**Team Capacity:** ${capacityPercent}%`,
            capacityPercent > 80
              ? '**Note:** Team at high capacity. Consider workload balancing.'
              : '',
            capacityPercent < 40
              ? '**Note:** Team has available capacity for additional work.'
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
        {
          heading: 'Technical Notes',
          content: [
            `- Total tasks in backlog: ${tasksByStatus.BACKLOG || 0}`,
            `- Tasks ready to start: ${tasksByStatus.TODO || 0}`,
            `- Recently completed: ${recentlyCompleted.length}`,
          ].join('\n'),
        },
      ],
      metrics: {
        velocity: recentlyCompleted.length,
        inProgressTasks: inProgressTasks.length,
        blockedTasks: blockedTasks.length,
        teamCapacity: capacityPercent,
        tasksByStatus,
      },
    };

    return {
      content,
      title: `Team Lead Report - ${project.name}`,
    };
  }

  /**
   * Generate CLIENT stakeholder report
   * Sanitized, deliverable-focused, professional tone
   */
  private async generateClientReport(
    _workspaceId: string,
    project: any,
    _reportType: ReportType,
  ): Promise<{ content: ReportContent; title: string }> {
    // Get completed tasks (deliverables)
    const completedTasks = await this.prisma.task.findMany({
      where: {
        projectId: project.id,
        status: 'DONE',
        deletedAt: null,
      },
      orderBy: { completedAt: 'desc' },
    });

    // Get total tasks for percentage
    const totalTasks = await this.prisma.task.count({
      where: {
        projectId: project.id,
        deletedAt: null,
      },
    });

    const completionPercent =
      totalTasks > 0
        ? Math.round((completedTasks.length / totalTasks) * 100)
        : 0;

    // Get completed phases (milestones)
    const completedPhases = project.phases.filter(
      (p: any) => p.status === 'COMPLETED',
    );
    const totalPhases = project.phases.length;

    // Calculate timeline
    let timelineMessage = 'Project is progressing as planned.';
    if (project.targetDate) {
      const daysRemaining = Math.ceil(
        (new Date(project.targetDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysRemaining < 0) {
        timelineMessage = 'We are working to complete remaining deliverables.';
      } else if (daysRemaining < 14) {
        timelineMessage = `Target completion in ${daysRemaining} days. Final deliverables on track.`;
      } else {
        timelineMessage = `Scheduled completion: ${new Date(project.targetDate).toLocaleDateString()}. On track.`;
      }
    }

    // Recent deliverables (last 14 days)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentDeliverables = completedTasks.filter(
      (t) => t.completedAt && t.completedAt >= twoWeeksAgo,
    );

    const content: ReportContent = {
      summary: `${project.name} is ${completionPercent}% complete with ${completedPhases.length} of ${totalPhases} milestones delivered. ${timelineMessage}`,
      sections: [
        {
          heading: 'Project Overview',
          content: [
            `**Project:** ${project.name}`,
            `**Progress:** ${completionPercent}% complete`,
            `**Milestones Completed:** ${completedPhases.length}/${totalPhases}`,
            project.targetDate
              ? `**Target Completion:** ${new Date(project.targetDate).toLocaleDateString()}`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
        {
          heading: 'Deliverables Status',
          content: [
            `- **Completed Deliverables:** ${completedTasks.length}`,
            `- **Overall Progress:** ${completionPercent}%`,
            `- **Recent Deliverables:** ${recentDeliverables.length} in last 2 weeks`,
          ].join('\n'),
        },
        {
          heading: 'Milestone Progress',
          content:
            completedPhases.length > 0
              ? completedPhases
                  .map((p: any) => `- ✓ ${p.name} (Completed)`)
                  .join('\n')
              : 'Initial milestones in progress.',
        },
        {
          heading: 'Recent Accomplishments',
          content:
            recentDeliverables.length > 0
              ? recentDeliverables
                  .slice(0, 5)
                  .map(
                    (t) =>
                      `- ${t.title} (${new Date(t.completedAt!).toLocaleDateString()})`,
                  )
                  .join('\n')
              : 'Deliverables from previous period on track.',
        },
        {
          heading: 'Timeline Update',
          content: timelineMessage,
        },
        {
          heading: 'Next Steps',
          content:
            completionPercent >= 90
              ? 'Final deliverables and quality assurance in progress. Preparing for handoff.'
              : completionPercent >= 50
                ? 'Development progressing on schedule. Next milestone deliverables on track.'
                : 'Foundation work underway. Initial deliverables proceeding as planned.',
        },
      ],
      metrics: {
        completionPercent,
        milestonesCompleted: completedPhases.length,
        totalMilestones: totalPhases,
        recentDeliverables: recentDeliverables.length,
        totalDeliverables: completedTasks.length,
      },
    };

    return {
      content,
      title: `Project Update - ${project.name}`,
    };
  }
}
