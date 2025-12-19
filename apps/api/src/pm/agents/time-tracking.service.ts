import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';

interface StartTimerDto {
  taskId: string;
  workspaceId: string;
  description?: string;
}

interface StopTimerDto {
  taskId: string;
  workspaceId: string;
}

interface LogTimeDto {
  taskId: string;
  workspaceId: string;
  hours: number;
  description?: string;
  date?: string;
}

/** Task with _count for activity-based suggestions */
interface TaskWithActivityCount {
  id: string;
  title: string;
  taskNumber: number;
  _count: {
    timeEntries: number;
    activities: number;
  };
}

/** Velocity period data for sprint metrics */
export interface VelocityPeriod {
  periodStart: Date;
  periodEnd: Date;
  storyPointsCompleted: number;
  tasksCompleted: number;
  hoursLogged: number;
}

/** Task with points and hours for metrics */
interface TaskWithMetrics {
  storyPoints: number | null;
  actualHours: number | null;
}

@Injectable()
export class TimeTrackingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Start a timer for a task
   * Uses transaction to prevent race conditions
   */
  async startTimer(userId: string, dto: StartTimerDto) {
    return this.prisma.$transaction(async (tx) => {
      // Check for existing active timer on this task within transaction
      const existing = await tx.timeEntry.findFirst({
        where: {
          workspaceId: dto.workspaceId,
          taskId: dto.taskId,
          userId,
          isTimer: true,
          endTime: null,
        },
      });

      if (existing) {
        throw new BadRequestException('Timer already running for this task');
      }

      // Create timer entry atomically
      return tx.timeEntry.create({
        data: {
          workspaceId: dto.workspaceId,
          taskId: dto.taskId,
          userId,
          description: dto.description,
          startTime: new Date(),
          isTimer: true,
          duration: 0, // Will be calculated on stop
        },
      });
    });
  }

  /**
   * Stop an active timer
   * Uses transaction to prevent race conditions
   */
  async stopTimer(userId: string, dto: StopTimerDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const entry = await tx.timeEntry.findFirst({
        where: {
          workspaceId: dto.workspaceId,
          taskId: dto.taskId,
          userId,
          isTimer: true,
          endTime: null,
        },
      });

      if (!entry) {
        throw new NotFoundException('No active timer found for this task');
      }

      const endTime = new Date();
      const durationMs = endTime.getTime() - entry.startTime!.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      // Round to nearest 0.25h
      const roundedHours = Math.round(durationHours * 4) / 4;

      return tx.timeEntry.update({
        where: { id: entry.id },
        data: {
          endTime,
          duration: roundedHours,
        },
      });
    });

    // Update task actualHours (outside transaction for simplicity)
    await this.updateTaskActualHours(dto.taskId, dto.workspaceId);

    return result;
  }

  /**
   * Log time manually
   */
  async logTime(userId: string, dto: LogTimeDto) {
    if (dto.hours < 0.25) {
      throw new BadRequestException('Minimum time entry is 0.25 hours');
    }

    const startTime = dto.date ? new Date(dto.date) : new Date();
    startTime.setHours(9, 0, 0, 0); // Default to 9 AM

    const entry = await this.prisma.timeEntry.create({
      data: {
        workspaceId: dto.workspaceId,
        taskId: dto.taskId,
        userId,
        description: dto.description,
        startTime,
        endTime: startTime, // Manual entries don't have real time range
        duration: dto.hours,
        isTimer: false,
      },
    });

    // Update task actualHours
    await this.updateTaskActualHours(dto.taskId, dto.workspaceId);

    return entry;
  }

  /**
   * Get time entries for a task
   */
  async getTimeEntries(workspaceId: string, taskId: string, limit: number = 100) {
    // Enforce maximum limit to prevent abuse
    const safeLimit = Math.min(limit, 500);
    return this.prisma.timeEntry.findMany({
      where: {
        workspaceId,
        taskId,
      },
      orderBy: { startTime: 'desc' },
      take: safeLimit,
    });
  }

  /**
   * Get active timers
   */
  async getActiveTimers(workspaceId: string, projectId?: string, limit: number = 50) {
    const where: Prisma.TimeEntryWhereInput = {
      workspaceId,
      isTimer: true,
      endTime: null,
    };

    if (projectId) {
      where.task = {
        projectId,
      };
    }

    // Enforce maximum limit to prevent abuse
    const safeLimit = Math.min(limit, 200);
    return this.prisma.timeEntry.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            taskNumber: true,
            projectId: true,
          },
        },
      },
      take: safeLimit,
    });
  }

  /**
   * Generate time logging suggestions based on activity
   */
  async suggestTimeEntries(
    workspaceId: string,
    projectId: string,
    userId: string,
  ) {
    // Find tasks the user has worked on recently (updated) without time entries
    const recentTasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        projectId,
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
        OR: [
          { assigneeId: userId },
          {
            activities: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            timeEntries: {
              where: {
                userId,
                startTime: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
            activities: {
              where: {
                userId,
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        },
      },
      take: 10,
    });

    // Filter to tasks with activity but no time logged
    // Type assertion is safe because we know the shape from our include clause
    const typedTasks = recentTasks as unknown as TaskWithActivityCount[];
    const suggestions = typedTasks
      .filter((task) => task._count.activities > 0 && task._count.timeEntries === 0)
      .map((task) => ({
        taskId: task.id,
        taskTitle: task.title,
        taskNumber: task.taskNumber,
        suggestedHours: this.estimateHoursFromActivity(task._count.activities),
        reasoning: `${task._count.activities} activities recorded, but no time logged`,
        confidence: task._count.activities >= 3 ? 'medium' : 'low',
      }));

    return suggestions;
  }

  /**
   * Update task actualHours from time entries
   */
  private async updateTaskActualHours(taskId: string, workspaceId: string) {
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        workspaceId,
        taskId,
        endTime: { not: null },
      },
      select: {
        duration: true,
      },
    });

    const totalHours = entries.reduce((sum, entry) => sum + (entry.duration ?? 0), 0);

    await this.prisma.task.update({
      where: { id: taskId },
      data: { actualHours: totalHours },
    });
  }

  /**
   * Estimate hours from activity count
   */
  private estimateHoursFromActivity(activityCount: number): number {
    // Simple heuristic: 0.5h per activity, max 4h
    const estimated = activityCount * 0.5;
    return Math.min(4, Math.round(estimated * 4) / 4);
  }

  /**
   * Calculate project velocity over time periods
   */
  async calculateProjectVelocity(
    workspaceId: string,
    projectId: string,
    periods: number = 6, // Default last 6 sprints
  ) {
    // Get project start date or use first completed task date
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { createdAt: true },
    });

    const _startDate = project?.createdAt || new Date();
    const now = new Date();

    // Calculate sprint periods (2 weeks each)
    const sprintDurationMs = 14 * 24 * 60 * 60 * 1000;
    const velocityPeriods: VelocityPeriod[] = [];

    for (let i = 0; i < periods; i++) {
      const periodStart = new Date(now.getTime() - (i + 1) * sprintDurationMs);
      const periodEnd = new Date(now.getTime() - i * sprintDurationMs);

      // Get completed tasks in this period
      const tasks = await this.prisma.task.findMany({
        where: {
          workspaceId,
          projectId,
          status: 'DONE',
          completedAt: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        select: {
          storyPoints: true,
          actualHours: true,
        },
      });

      const typedTasks = tasks as TaskWithMetrics[];
      const storyPoints = typedTasks.reduce(
        (sum, task) => sum + (task.storyPoints ?? 0),
        0,
      );

      const hours = typedTasks.reduce(
        (sum, task) => sum + (task.actualHours ?? 0),
        0,
      );

      velocityPeriods.push({
        periodStart,
        periodEnd,
        storyPointsCompleted: storyPoints,
        tasksCompleted: tasks.length,
        hoursLogged: hours,
      });
    }

    // Calculate averages
    const totalPoints = velocityPeriods.reduce(
      (sum, p) => sum + p.storyPointsCompleted,
      0,
    );
    const totalHours = velocityPeriods.reduce(
      (sum, p) => sum + p.hoursLogged,
      0,
    );

    return {
      currentVelocity: velocityPeriods[0]?.storyPointsCompleted || 0,
      avgVelocity: totalPoints / periods,
      avgHoursPerPoint: totalPoints > 0 ? totalHours / totalPoints : 0,
      periods: velocityPeriods.reverse(), // Oldest first
    };
  }

  /**
   * Get velocity trends over weeks
   */
  async getVelocityTrends(
    workspaceId: string,
    projectId: string,
    weeks: number = 12,
  ) {
    const now = new Date();
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    // First, collect all week data (newest to oldest)
    const weekData: Array<{
      week: number;
      weekStart: Date;
      weekEnd: Date;
      pointsCompleted: number;
    }> = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * weekMs);
      const weekEnd = new Date(now.getTime() - i * weekMs);

      // Get completed tasks in this week
      const tasks = await this.prisma.task.findMany({
        where: {
          workspaceId,
          projectId,
          status: 'DONE',
          completedAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        select: {
          storyPoints: true,
        },
      });

      const pointsCompleted = tasks.reduce(
        (sum, task) => sum + (task.storyPoints || 0),
        0,
      );

      weekData.push({
        week: weeks - i,
        weekStart,
        weekEnd,
        pointsCompleted,
      });
    }

    // Reverse to get oldest-first order for trend calculation
    weekData.reverse();

    // Calculate trends by comparing to previous week (older)
    const trends = weekData.map((data, index) => {
      let trend: 'up' | 'down' | 'stable' = 'stable';

      if (index > 0) {
        const prevPoints = weekData[index - 1].pointsCompleted;
        if (data.pointsCompleted > prevPoints) {
          trend = 'up';
        } else if (data.pointsCompleted < prevPoints) {
          trend = 'down';
        }
      }

      return {
        ...data,
        trend,
      };
    });

    return trends; // Already in oldest-first order
  }

  /**
   * Get hours per story point average for project
   */
  async getHoursPerPointAverage(
    workspaceId: string,
    projectId: string,
  ): Promise<number> {
    const tasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        projectId,
        status: 'DONE',
        storyPoints: { not: null },
        actualHours: { gt: 0 },
      },
      select: {
        storyPoints: true,
        actualHours: true,
      },
    });

    const typedTasks = tasks as TaskWithMetrics[];
    const totalPoints = typedTasks.reduce(
      (sum, task) => sum + (task.storyPoints ?? 0),
      0,
    );

    const totalHours = typedTasks.reduce(
      (sum, task) => sum + (task.actualHours ?? 0),
      0,
    );

    return totalPoints > 0 ? totalHours / totalPoints : 0;
  }
}
