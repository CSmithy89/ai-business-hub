import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CheckpointStatus, Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService } from '../../events/event-publisher.service';
import { EventTypes } from '@hyvve/shared';
import { CreateCheckpointDto, UpdateCheckpointDto } from './dto/checkpoint.dto';

interface OutstandingItems {
  summary: string;
  incompleteTasks: number;
  awaitingApprovalTasks: number;
  overdueTasks: number;
}

interface PhaseCheckpointProject {
  id: string;
  workspaceId: string;
}

interface PhaseCheckpointWithPhase {
  id: string;
  phaseId: string;
  name: string;
  description: string | null;
  checkpointDate: Date;
  status: CheckpointStatus;
  phase: {
    id: string;
    name: string;
    projectId: string;
    project: PhaseCheckpointProject;
  };
}

@Injectable()
export class CheckpointService {
  private readonly logger = new Logger(CheckpointService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * Create a new phase checkpoint
   */
  async createCheckpoint(
    workspaceId: string,
    phaseId: string,
    userId: string,
    dto: CreateCheckpointDto,
  ) {
    // Verify phase ownership
    const phase = await this.verifyPhaseAccess(workspaceId, phaseId);

    const checkpoint = await this.prisma.phaseCheckpoint.create({
      data: {
        phaseId,
        name: dto.name,
        description: dto.description,
        checkpointDate: new Date(dto.checkpointDate),
        remindAt3Days: dto.remindAt3Days ?? true,
        remindAt1Day: dto.remindAt1Day ?? true,
        remindAtDayOf: dto.remindAtDayOf ?? true,
      },
    });

    await this.eventPublisher.publish(
      EventTypes.PM_CHECKPOINT_CREATED,
      {
        checkpointId: checkpoint.id,
        phaseId,
        projectId: phase.projectId,
      },
      {
        tenantId: workspaceId,
        userId,
        source: 'pm-checkpoint-service',
      },
    );

    return checkpoint;
  }

  /**
   * List checkpoints for a phase
   */
  async listCheckpoints(workspaceId: string, phaseId: string) {
    await this.verifyPhaseAccess(workspaceId, phaseId);

    return this.prisma.phaseCheckpoint.findMany({
      where: { phaseId },
      orderBy: { checkpointDate: 'asc' },
    });
  }

  /**
   * Get a single checkpoint by ID with workspace access validation
   */
  async getCheckpointById(workspaceId: string, checkpointId: string) {
    const checkpoint = await this.prisma.phaseCheckpoint.findFirst({
      where: {
        id: checkpointId,
        phase: {
          project: { workspaceId },
        },
      },
      include: {
        phase: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
      },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    return checkpoint;
  }

  /**
   * Update checkpoint status
   */
  async updateCheckpoint(
    workspaceId: string,
    checkpointId: string,
    userId: string,
    dto: UpdateCheckpointDto,
  ) {
    const checkpoint = await this.verifyCheckpointAccess(
      workspaceId,
      checkpointId,
    );

    const updateData: Prisma.PhaseCheckpointUpdateInput = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.checkpointDate) updateData.checkpointDate = new Date(dto.checkpointDate);
    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === CheckpointStatus.COMPLETED) {
        updateData.completedAt = new Date();
      } else {
        // Clear completedAt when status changes from COMPLETED
        updateData.completedAt = null;
      }
    }

    const updated = await this.prisma.phaseCheckpoint.update({
      where: { id: checkpointId },
      data: updateData,
    });

    if (dto.status === CheckpointStatus.COMPLETED) {
      await this.eventPublisher.publish(
        EventTypes.PM_CHECKPOINT_COMPLETED,
        {
          checkpointId: checkpoint.id,
          phaseId: checkpoint.phaseId,
        },
        {
          tenantId: workspaceId,
          userId,
          source: 'pm-checkpoint-service',
        },
      );
    }

    return updated;
  }

  /**
   * Send checkpoint reminders (called by cron job)
   */
  async sendReminders(): Promise<void> {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // 3-day reminders
    await this.sendReminderBatch(now, threeDaysFromNow, '3_days');

    // 1-day reminders
    await this.sendReminderBatch(now, oneDayFromNow, '1_day');

    // Day-of reminders
    await this.sendReminderBatch(now, now, 'day_of');
  }

  /**
   * Send a batch of reminders for a specific interval
   */
  private async sendReminderBatch(
    now: Date,
    targetDate: Date,
    interval: '3_days' | '1_day' | 'day_of',
  ): Promise<void> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build where clause based on interval
    const whereClause: Prisma.PhaseCheckpointWhereInput = {
      checkpointDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: CheckpointStatus.PENDING,
    };

    // Filter by reminder preference and sent status
    if (interval === '3_days') {
      whereClause.remindAt3Days = true;
      whereClause.reminder3DaysSent = false;
    } else if (interval === '1_day') {
      whereClause.remindAt1Day = true;
      whereClause.reminder1DaySent = false;
    } else {
      whereClause.remindAtDayOf = true;
      whereClause.reminderDayOfSent = false;
    }

    const checkpoints = await this.prisma.phaseCheckpoint.findMany({
      where: whereClause,
      include: {
        phase: {
          include: {
            project: {
              select: {
                id: true,
                workspaceId: true,
              },
            },
          },
        },
      },
    });

    for (const checkpoint of checkpoints) {
      try {
        await this.sendCheckpointReminder(checkpoint as PhaseCheckpointWithPhase, interval);
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for checkpoint ${checkpoint.id}`,
          error,
        );
        // Continue processing other checkpoints
      }
    }
  }

  /**
   * Send reminder notification for a single checkpoint
   */
  private async sendCheckpointReminder(
    checkpoint: PhaseCheckpointWithPhase,
    interval: '3_days' | '1_day' | 'day_of',
  ): Promise<void> {
    const phase = checkpoint.phase;
    const project = phase.project;

    // Get outstanding items for this phase
    const outstandingItems = await this.getOutstandingItems(phase.id);

    // Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(outstandingItems);

    // Determine message based on interval
    const intervalText =
      interval === '3_days'
        ? 'in 3 days'
        : interval === '1_day'
        ? 'tomorrow'
        : 'today';

    const message = `Checkpoint reminder: "${checkpoint.name}" is ${intervalText} (${this.formatDate(checkpoint.checkpointDate)})`;

    // TODO: Replace with actual notification service when implemented
    // For now, log the notification
    this.logger.log({
      message: 'Checkpoint reminder notification',
      checkpointId: checkpoint.id,
      phaseId: phase.id,
      projectId: project.id,
      workspaceId: project.workspaceId,
      title: `Checkpoint: ${checkpoint.name}`,
      body: message,
      outstandingItems: outstandingItems.summary,
      suggestedActions,
      interval,
    });

    // Mark reminder as sent
    const updateData: Prisma.PhaseCheckpointUpdateInput = {};
    if (interval === '3_days') updateData.reminder3DaysSent = true;
    if (interval === '1_day') updateData.reminder1DaySent = true;
    if (interval === 'day_of') updateData.reminderDayOfSent = true;

    await this.prisma.phaseCheckpoint.update({
      where: { id: checkpoint.id },
      data: updateData,
    });

    // Publish event
    await this.eventPublisher.publish(
      EventTypes.PM_CHECKPOINT_REMINDER_SENT,
      {
        checkpointId: checkpoint.id,
        phaseId: phase.id,
        projectId: project.id,
        interval,
      },
      {
        tenantId: project.workspaceId,
        userId: 'SYSTEM',
        source: 'pm-checkpoint-cron',
      },
    );
  }

  /**
   * Get outstanding items for a phase (incomplete tasks, awaiting approval, etc.)
   */
  private async getOutstandingItems(phaseId: string): Promise<OutstandingItems> {
    const incompleteTasks = await this.prisma.task.count({
      where: {
        phaseId,
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
      },
    });

    const awaitingApprovalTasks = await this.prisma.task.count({
      where: {
        phaseId,
        status: TaskStatus.AWAITING_APPROVAL,
      },
    });

    const overdueTasks = await this.prisma.task.count({
      where: {
        phaseId,
        dueDate: { lt: new Date() },
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
      },
    });

    return {
      summary: `${incompleteTasks} incomplete tasks, ${awaitingApprovalTasks} awaiting approval, ${overdueTasks} overdue`,
      incompleteTasks,
      awaitingApprovalTasks,
      overdueTasks,
    };
  }

  /**
   * Generate suggested actions based on outstanding items
   */
  private generateSuggestedActions(outstandingItems: OutstandingItems): string[] {
    const actions: string[] = [];

    if (outstandingItems.awaitingApprovalTasks > 0) {
      actions.push(`Resolve ${outstandingItems.awaitingApprovalTasks} tasks awaiting approval`);
    }

    if (outstandingItems.overdueTasks > 0) {
      actions.push(`Review ${outstandingItems.overdueTasks} overdue tasks`);
    }

    if (outstandingItems.incompleteTasks > 0) {
      actions.push(`Complete remaining ${outstandingItems.incompleteTasks} tasks`);
    }

    if (actions.length === 0) {
      actions.push('Phase on track - no immediate actions needed');
    }

    return actions;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  private async verifyPhaseAccess(workspaceId: string, phaseId: string) {
    const phase = await this.prisma.phase.findFirst({
      where: {
        id: phaseId,
        project: { workspaceId },
      },
      include: { project: true },
    });

    if (!phase) {
      throw new NotFoundException('Phase not found');
    }

    return phase;
  }

  private async verifyCheckpointAccess(workspaceId: string, checkpointId: string) {
    const checkpoint = await this.prisma.phaseCheckpoint.findFirst({
      where: {
        id: checkpointId,
        phase: {
          project: { workspaceId },
        },
      },
      include: {
        phase: {
          include: { project: true },
        },
      },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    return checkpoint;
  }
}
