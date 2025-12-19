import {
  Injectable,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import {
  RiskSeverity,
  RiskStatus,
  HealthLevel,
  HealthTrend,
} from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';

export interface HealthScore {
  score: number; // 0-100
  level: HealthLevel;
  trend: HealthTrend;
  factors: {
    onTimeDelivery: number; // 0-1
    blockerImpact: number; // 0-1
    teamCapacity: number; // 0-1
    velocityTrend: number; // 0-1
  };
  riskCount: number;
  explanation: string;
  suggestions: string[];
}

export interface RiskEntry {
  type: string;
  severity: RiskSeverity;
  title: string;
  description: string;
  affectedTasks: string[];
  affectedUsers: string[];
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private prisma: PrismaService) {}

  async runHealthCheck(
    workspaceId: string,
    projectId: string,
    userId: string,
  ): Promise<HealthScore> {
    this.logger.log(`Running health check for project ${projectId}`);

    try {
      // 1. Get project context
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          team: {
            include: {
              members: true,
            },
          },
        },
      });

      if (!project || project.workspaceId !== workspaceId) {
        throw new ForbiddenException('Project not found or access denied');
      }

      // 2. Get all tasks for analysis
      const tasks = await this.prisma.task.findMany({
        where: {
          projectId,
          deletedAt: null,
        },
      });

      // 3. Calculate health score
      const healthScore = this.calculateHealthScore(tasks, project);
      const risks = this.detectRisks(tasks, project);

      // 4. Store health score
      await this.prisma.healthScore.create({
        data: {
          workspaceId,
          projectId: project.id,
          score: healthScore.score,
          level: healthScore.level,
          trend: healthScore.trend,
          onTimeDelivery: healthScore.factors.onTimeDelivery,
          blockerImpact: healthScore.factors.blockerImpact,
          teamCapacity: healthScore.factors.teamCapacity,
          velocityTrend: healthScore.factors.velocityTrend,
          riskCount: risks.length,
          explanation: healthScore.explanation,
        },
      });

      // 5. Store risks
      for (const risk of risks) {
        await this.prisma.riskEntry.create({
          data: {
            workspaceId,
            projectId: project.id,
            title: risk.title,
            description: risk.description,
            severity: risk.severity,
            riskType: risk.type,
            affectedTasks: risk.affectedTasks,
            affectedUsers: risk.affectedUsers,
            status: RiskStatus.IDENTIFIED,
            detectedAt: new Date(),
            createdBy: userId,
          },
        });
      }

      // 6. Update project health score
      await this.prisma.project.update({
        where: { id: project.id },
        data: {
          healthScore: healthScore.score,
          lastHealthCheck: new Date(),
        },
      });

      return {
        ...healthScore,
        riskCount: risks.length,
      };
    } catch (error) {
      this.logger.error(
        `Health check failed for project ${projectId}:`,
        error,
      );
      throw error;
    }
  }

  private calculateHealthScore(tasks: any[], _project: any): HealthScore {
    const totalTasks = tasks.length;
    const now = new Date();

    // Calculate overdue tasks
    const overdueTasks = tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < now &&
        t.status !== 'DONE',
    ).length;

    // Calculate blocked tasks
    const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length;

    // On-time delivery factor (0-1)
    const onTimeDelivery =
      totalTasks > 0 ? Math.max(0, (totalTasks - overdueTasks) / totalTasks) : 1;

    // Blocker impact factor (0-1)
    const blockerImpact =
      totalTasks > 0 ? Math.max(0, 1 - blockedTasks / totalTasks) : 1;

    // Team capacity factor (0-1) - simplified for now
    const teamWorkload = new Map<string, number>();
    tasks.forEach((task) => {
      if (
        task.assigneeId &&
        task.estimatedHours &&
        task.status !== 'DONE'
      ) {
        const current = teamWorkload.get(task.assigneeId) || 0;
        teamWorkload.set(task.assigneeId, current + task.estimatedHours);
      }
    });

    const capacityScores = Array.from(teamWorkload.values()).map((hours) => {
      if (hours >= 32 && hours <= 40) return 1.0; // Ideal
      if (hours > 40) return Math.max(0, 1 - (hours - 40) / 40); // Overload penalty
      if (hours < 32) return hours / 32; // Underutilization
      return 0.8;
    });

    const teamCapacity =
      capacityScores.length > 0
        ? capacityScores.reduce((a, b) => a + b) / capacityScores.length
        : 0.8;

    // Velocity trend factor (0-1)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twentyEightDaysAgo = new Date(
      now.getTime() - 28 * 24 * 60 * 60 * 1000,
    );

    const completedLast7Days = tasks.filter(
      (t) =>
        t.completedAt &&
        new Date(t.completedAt) >= sevenDaysAgo &&
        new Date(t.completedAt) <= now,
    ).length;

    const completedLast28Days = tasks.filter(
      (t) =>
        t.completedAt &&
        new Date(t.completedAt) >= twentyEightDaysAgo &&
        new Date(t.completedAt) <= now,
    ).length;

    const currentVelocity = completedLast7Days;
    const baselineVelocity = completedLast28Days / 4;

    const velocityTrend =
      baselineVelocity > 0
        ? Math.min(1.0, currentVelocity / baselineVelocity)
        : completedLast7Days > 0
          ? 0.75
          : 0.5;

    // Calculate overall score (0-100)
    const score = Math.round(
      (onTimeDelivery * 30 + // 30% weight
        blockerImpact * 25 + // 25% weight
        teamCapacity * 25 + // 25% weight
        velocityTrend * 20) * // 20% weight
        100,
    );

    // Determine level
    const level: HealthLevel =
      score >= 85
        ? HealthLevel.EXCELLENT
        : score >= 70
          ? HealthLevel.GOOD
          : score >= 50
            ? HealthLevel.WARNING
            : HealthLevel.CRITICAL;

    // Determine trend (simplified - compare to previous score if available)
    const trend = HealthTrend.STABLE; // TODO: Compare with previous score

    // Generate explanation
    const explanationParts: string[] = [
      `Project health score is ${score}/100 (${level}).`,
    ];

    if (onTimeDelivery < 0.8) {
      explanationParts.push('On-time delivery needs improvement.');
    }
    if (blockerImpact < 0.8) {
      explanationParts.push('Too many blocked tasks.');
    }
    if (teamCapacity < 0.7) {
      explanationParts.push('Team capacity is strained.');
    }
    if (velocityTrend < 0.6) {
      explanationParts.push('Velocity has dropped.');
    }

    const explanation = explanationParts.join(' ');

    // Generate suggestions
    const suggestions: string[] = [];
    if (onTimeDelivery < 0.8) {
      suggestions.push(
        'Review overdue tasks and adjust deadlines or priorities',
      );
    }
    if (blockerImpact < 0.8) {
      suggestions.push('Address blocking issues to unblock dependent tasks');
    }
    if (teamCapacity < 0.7) {
      suggestions.push('Redistribute work to balance team capacity');
    }
    if (velocityTrend < 0.6) {
      suggestions.push(
        'Investigate velocity drop - consider team capacity or scope changes',
      );
    }

    return {
      score,
      level,
      trend,
      factors: {
        onTimeDelivery,
        blockerImpact,
        teamCapacity,
        velocityTrend,
      },
      riskCount: 0, // Will be updated after risk detection
      explanation,
      suggestions,
    };
  }

  private detectRisks(tasks: any[], project: any): RiskEntry[] {
    const risks: RiskEntry[] = [];
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Detect 48-hour deadline warnings
    const dueSoon = tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) <= in48Hours &&
        new Date(t.dueDate) >= now &&
        t.status !== 'DONE',
    );

    if (dueSoon.length > 0) {
      risks.push({
        type: 'DEADLINE_WARNING',
        severity:
          dueSoon.length > 5 ? RiskSeverity.CRITICAL : RiskSeverity.HIGH,
        title: `${dueSoon.length} task${dueSoon.length > 1 ? 's' : ''} due within 48 hours`,
        description: `Tasks: ${dueSoon.map((t) => t.title).join(', ')}`,
        affectedTasks: dueSoon.map((t) => t.id),
        affectedUsers: [
          ...new Set(dueSoon.map((t) => t.assigneeId).filter(Boolean)),
        ],
      });
    }

    // Detect team capacity overload (>40h assigned this week)
    const teamWorkload = new Map<string, { hours: number; tasks: any[] }>();
    tasks.forEach((task) => {
      if (
        task.assigneeId &&
        task.estimatedHours &&
        task.status !== 'DONE'
      ) {
        const current = teamWorkload.get(task.assigneeId) || {
          hours: 0,
          tasks: [],
        };
        teamWorkload.set(task.assigneeId, {
          hours: current.hours + task.estimatedHours,
          tasks: [...current.tasks, task],
        });
      }
    });

    teamWorkload.forEach((data, userId) => {
      if (data.hours > 40) {
        const user = project.team?.members?.find(
          (m: any) => m.userId === userId,
        )?.user;
        risks.push({
          type: 'CAPACITY_OVERLOAD',
          severity: data.hours > 60 ? RiskSeverity.CRITICAL : RiskSeverity.HIGH,
          title: `${user?.name || 'Team member'} overloaded with ${data.hours}h assigned`,
          description: `Assigned work exceeds healthy capacity (40h/week threshold)`,
          affectedTasks: data.tasks.map((t) => t.id),
          affectedUsers: [userId],
        });
      }
    });

    return risks;
  }

  async getLatestHealthScore(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.workspaceId !== workspaceId) {
      throw new ForbiddenException('Project not found or access denied');
    }

    return this.prisma.healthScore.findFirst({
      where: { projectId },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async getActiveRisks(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.workspaceId !== workspaceId) {
      throw new ForbiddenException('Project not found or access denied');
    }

    return this.prisma.riskEntry.findMany({
      where: {
        projectId,
        status: RiskStatus.IDENTIFIED,
        detectedAt: { not: null },
      },
      orderBy: [{ severity: 'desc' }, { detectedAt: 'desc' }],
    });
  }

  async acknowledgeRisk(
    workspaceId: string,
    riskId: string,
    userId: string,
  ) {
    const risk = await this.prisma.riskEntry.findUnique({
      where: { id: riskId },
      include: { project: true },
    });

    if (!risk || risk.workspaceId !== workspaceId) {
      throw new ForbiddenException('Risk not found or access denied');
    }

    return this.prisma.riskEntry.update({
      where: { id: riskId },
      data: {
        status: RiskStatus.ANALYZING,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });
  }

  async resolveRisk(workspaceId: string, riskId: string, _userId: string) {
    const risk = await this.prisma.riskEntry.findUnique({
      where: { id: riskId },
      include: { project: true },
    });

    if (!risk || risk.workspaceId !== workspaceId) {
      throw new ForbiddenException('Risk not found or access denied');
    }

    return this.prisma.riskEntry.update({
      where: { id: riskId },
      data: {
        status: RiskStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });
  }
}
