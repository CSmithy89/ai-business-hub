import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ReportFrequency, ReportType, StakeholderType } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';

// Valid enum values for runtime validation
const VALID_FREQUENCIES: ReportFrequency[] = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];
const VALID_REPORT_TYPES: ReportType[] = ['PROJECT_STATUS', 'HEALTH_REPORT', 'PROGRESS_REPORT'];
const VALID_STAKEHOLDER_TYPES: StakeholderType[] = ['EXECUTIVE', 'TEAM_LEAD', 'CLIENT', 'GENERAL'];

export interface CreateScheduleDto {
  projectId: string;
  frequency: ReportFrequency;
  reportType: ReportType;
  stakeholderType?: StakeholderType;
}

export interface UpdateScheduleDto {
  frequency?: ReportFrequency;
  reportType?: ReportType;
  stakeholderType?: StakeholderType;
  enabled?: boolean;
}

@Injectable()
export class ScheduledReportService {
  private readonly logger = new Logger(ScheduledReportService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Validate enum values at runtime to prevent invalid data
   */
  private validateEnums(dto: {
    frequency?: ReportFrequency;
    reportType?: ReportType;
    stakeholderType?: StakeholderType | null;
  }): void {
    if (dto.frequency && !VALID_FREQUENCIES.includes(dto.frequency)) {
      throw new BadRequestException(`Invalid frequency: ${dto.frequency}`);
    }
    if (dto.reportType && !VALID_REPORT_TYPES.includes(dto.reportType)) {
      throw new BadRequestException(`Invalid report type: ${dto.reportType}`);
    }
    if (dto.stakeholderType && !VALID_STAKEHOLDER_TYPES.includes(dto.stakeholderType)) {
      throw new BadRequestException(`Invalid stakeholder type: ${dto.stakeholderType}`);
    }
  }

  /**
   * Create a new report schedule
   */
  async createSchedule(workspaceId: string, dto: CreateScheduleDto) {
    this.logger.log(
      `Creating report schedule for project ${dto.projectId} with frequency ${dto.frequency}`,
    );

    // Validate enum values at runtime
    this.validateEnums(dto);

    // Validate project access
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project || project.workspaceId !== workspaceId) {
      throw new ForbiddenException('Project not found or access denied');
    }

    // Calculate initial nextRun
    const nextRun = this.calculateNextRun(dto.frequency);

    // Create schedule
    const schedule = await this.prisma.reportSchedule.create({
      data: {
        workspaceId,
        projectId: dto.projectId,
        frequency: dto.frequency,
        reportType: dto.reportType,
        stakeholderType: dto.stakeholderType || null,
        nextRun,
      },
    });

    return { schedule };
  }

  /**
   * Update an existing report schedule
   */
  async updateSchedule(
    workspaceId: string,
    scheduleId: string,
    dto: UpdateScheduleDto,
  ) {
    this.logger.log(`Updating report schedule ${scheduleId}`);

    // Validate enum values at runtime
    this.validateEnums(dto);

    // Validate schedule access
    const existingSchedule = await this.prisma.reportSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule || existingSchedule.workspaceId !== workspaceId) {
      throw new NotFoundException('Schedule not found or access denied');
    }

    // Recalculate nextRun if frequency changed
    let nextRun = existingSchedule.nextRun;
    if (dto.frequency && dto.frequency !== existingSchedule.frequency) {
      nextRun = this.calculateNextRun(dto.frequency, existingSchedule.lastRun);
    }

    // Update schedule
    const schedule = await this.prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: {
        frequency: dto.frequency,
        reportType: dto.reportType,
        stakeholderType: dto.stakeholderType,
        enabled: dto.enabled,
        nextRun,
      },
    });

    return { schedule };
  }

  /**
   * Delete a report schedule
   */
  async deleteSchedule(workspaceId: string, scheduleId: string) {
    this.logger.log(`Deleting report schedule ${scheduleId}`);

    // Validate schedule access
    const schedule = await this.prisma.reportSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule || schedule.workspaceId !== workspaceId) {
      throw new NotFoundException('Schedule not found or access denied');
    }

    // Delete schedule
    await this.prisma.reportSchedule.delete({
      where: { id: scheduleId },
    });

    return { success: true };
  }

  /**
   * List report schedules
   */
  async listSchedules(workspaceId: string, projectId?: string) {
    this.logger.log(
      `Listing report schedules for workspace ${workspaceId}${projectId ? ` and project ${projectId}` : ''}`,
    );

    const where: any = {
      workspaceId,
    };

    if (projectId) {
      // Validate project access if specified
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.workspaceId !== workspaceId) {
        throw new ForbiddenException('Project not found or access denied');
      }

      where.projectId = projectId;
    }

    const [schedules, total] = await Promise.all([
      this.prisma.reportSchedule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.reportSchedule.count({ where }),
    ]);

    return { schedules, total };
  }

  /**
   * Get a single report schedule
   */
  async getSchedule(workspaceId: string, scheduleId: string) {
    const schedule = await this.prisma.reportSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!schedule || schedule.workspaceId !== workspaceId) {
      throw new NotFoundException('Schedule not found or access denied');
    }

    return { schedule };
  }

  /**
   * Toggle a schedule's enabled status
   */
  async toggleSchedule(
    workspaceId: string,
    scheduleId: string,
    enabled: boolean,
  ) {
    this.logger.log(`Toggling schedule ${scheduleId} to ${enabled}`);

    // Validate schedule access
    const existingSchedule = await this.prisma.reportSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule || existingSchedule.workspaceId !== workspaceId) {
      throw new NotFoundException('Schedule not found or access denied');
    }

    // Update enabled status
    const schedule = await this.prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: { enabled },
    });

    return { schedule };
  }

  /**
   * Find schedules that are due to run
   * Internal method used by cron job
   * @param limit Maximum number of schedules to return (for batching)
   */
  async findDueSchedules(limit?: number) {
    const now = new Date();

    const schedules = await this.prisma.reportSchedule.findMany({
      where: {
        enabled: true,
        nextRun: {
          lte: now,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            workspaceId: true,
          },
        },
      },
      orderBy: { nextRun: 'asc' }, // Oldest first
      ...(limit && { take: limit }),
    });

    return schedules;
  }

  /**
   * Update schedule after a run
   * Internal method used by cron job
   */
  async updateScheduleAfterRun(scheduleId: string) {
    const schedule = await this.prisma.reportSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const now = new Date();
    const nextRun = this.calculateNextRun(schedule.frequency, now);

    await this.prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: {
        lastRun: now,
        nextRun,
      },
    });
  }

  /**
   * Calculate the next run date based on frequency
   */
  calculateNextRun(frequency: ReportFrequency, lastRun?: Date | null): Date {
    const baseDate = lastRun ? new Date(lastRun) : new Date();
    const nextRun = new Date(baseDate);

    switch (frequency) {
      case 'DAILY':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'WEEKLY':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'BIWEEKLY':
        nextRun.setDate(nextRun.getDate() + 14);
        break;
      case 'MONTHLY': {
        // Handle month overflow (e.g., Jan 31 -> Feb 28, not Mar 3)
        const originalDay = nextRun.getDate();
        nextRun.setMonth(nextRun.getMonth() + 1);
        // If the day changed due to overflow, set to last day of target month
        if (nextRun.getDate() !== originalDay) {
          nextRun.setDate(0); // Sets to last day of previous month (our target month)
        }
        break;
      }
      default:
        throw new BadRequestException(`Invalid frequency: ${frequency}`);
    }

    // Set to midnight for consistency
    nextRun.setHours(0, 0, 0, 0);

    return nextRun;
  }
}
