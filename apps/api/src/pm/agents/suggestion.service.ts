import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/services/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { Prisma, SuggestionType, SuggestionStatus } from '@prisma/client';
import { CreateSuggestionDto } from './dto/suggestion.dto';
import { TIME_UNITS, SUGGESTION_SETTINGS } from './constants';

// Type alias for Prisma transaction client
type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class SuggestionService {
  private readonly logger = new Logger(SuggestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Create a new suggestion from agent
   */
  async createSuggestion(params: CreateSuggestionDto) {
    const suggestion = await this.prisma.agentSuggestion.create({
      data: {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        userId: params.userId,
        agentName: params.agentName,
        suggestionType: params.suggestionType,
        title: params.title,
        description: params.description,
        reasoning: params.reasoning,
        confidence: params.confidence,
        priority: params.priority || 'medium',
        actionPayload: params.actionPayload,
        expiresAt: new Date(Date.now() + SUGGESTION_SETTINGS.EXPIRY_HOURS * TIME_UNITS.HOUR_MS),
      },
    });

    // TODO: Publish event via EventPublisherService
    // await this.eventPublisher.publish(...)

    // Send WebSocket notification
    try {
      this.realtimeGateway.server
        .to(`project:${params.projectId}`)
        .emit('suggestion:created' as any, suggestion);
    } catch (error) {
      this.logger.warn(`Failed to emit WebSocket event: ${error}`);
    }

    this.logger.log(
      `Created suggestion ${suggestion.id} for user ${params.userId} from ${params.agentName}`,
    );

    return suggestion;
  }

  /**
   * Get suggestions for user/project
   */
  async getSuggestions(params: {
    workspaceId: string;
    projectId?: string;
    userId?: string;
    agentName?: string;
    status?: SuggestionStatus;
    limit?: number;
  }) {
    const where: any = {
      workspaceId: params.workspaceId,
    };

    if (params.projectId) where.projectId = params.projectId;
    if (params.userId) where.userId = params.userId;
    if (params.agentName) where.agentName = params.agentName;
    if (params.status) {
      where.status = params.status;
    } else {
      where.status = SuggestionStatus.PENDING;
    }

    // Filter out expired suggestions
    where.expiresAt = { gte: new Date() };

    return this.prisma.agentSuggestion.findMany({
      where,
      orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
      take: params.limit || 50,
    });
  }

  /**
   * Accept suggestion and execute action
   */
  async acceptSuggestion(
    suggestionId: string,
    workspaceId: string,
    userId: string,
    modifications?: Record<string, any>,
  ) {
    // Use transaction to ensure atomicity: status update + action execution
    // If execution fails, the suggestion status won't be changed
    const result = await this.prisma.$transaction(async (tx) => {
      const suggestion = await tx.agentSuggestion.findUnique({
        where: { id: suggestionId },
      });

      if (!suggestion) {
        throw new NotFoundException('Suggestion not found');
      }

      if (suggestion.workspaceId !== workspaceId) {
        throw new ForbiddenException('Access denied');
      }

      if (suggestion.status !== SuggestionStatus.PENDING) {
        throw new BadRequestException('Suggestion already processed');
      }

      // Apply modifications if provided
      const basePayload = suggestion.actionPayload as Record<string, any>;
      const finalPayload = modifications
        ? { ...basePayload, ...modifications }
        : basePayload;

      // Execute the suggested action FIRST (within transaction)
      // This ensures we only mark as accepted if execution succeeds
      const executionResult = await this.executeSuggestionInTransaction(
        tx,
        suggestion,
        finalPayload,
      );

      // Update status only after successful execution
      await tx.agentSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: SuggestionStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      return executionResult;
    });

    // TODO: Publish event via EventPublisherService
    // await this.eventPublisher.publish(...)

    this.logger.log(
      `Accepted suggestion ${suggestionId} for user ${userId}`,
    );

    return { success: true, result };
  }

  /**
   * Reject suggestion
   */
  async rejectSuggestion(
    suggestionId: string,
    workspaceId: string,
    userId: string,
    reason?: string,
  ) {
    const suggestion = await this.prisma.agentSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    if (suggestion.workspaceId !== workspaceId) {
      throw new ForbiddenException('Access denied');
    }

    // Update status with rejection reason
    const currentPayload = suggestion.actionPayload as Record<string, any>;
    await this.prisma.agentSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: SuggestionStatus.REJECTED,
        rejectedAt: new Date(),
        actionPayload: {
          ...currentPayload,
          rejectionReason: reason,
        },
      },
    });

    // TODO: Publish event via EventPublisherService
    // await this.eventPublisher.publish(...)

    this.logger.log(
      `Rejected suggestion ${suggestionId} for user ${userId}`,
    );

    return { success: true };
  }

  /**
   * Snooze suggestion (hide for specified hours)
   */
  async snoozeSuggestion(
    suggestionId: string,
    workspaceId: string,
    userId: string,
    hours: number = 4,
  ) {
    const suggestion = await this.prisma.agentSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    if (suggestion.workspaceId !== workspaceId) {
      throw new ForbiddenException('Access denied');
    }

    // Update with snooze timestamp
    await this.prisma.agentSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: SuggestionStatus.SNOOZED,
        snoozedUntil: new Date(Date.now() + hours * TIME_UNITS.HOUR_MS),
      },
    });

    this.logger.log(
      `Snoozed suggestion ${suggestionId} for ${hours} hours`,
    );

    return { success: true };
  }

  /**
   * Execute the suggested action (standalone - used when not in transaction)
   */
  private async executeSuggestion(
    suggestion: any,
    payload: Record<string, any>,
  ) {
    switch (suggestion.suggestionType) {
      case SuggestionType.CREATE_TASK:
        return this.executeCreateTask(suggestion, payload);

      case SuggestionType.UPDATE_TASK:
        return this.executeUpdateTask(suggestion, payload);

      case SuggestionType.ASSIGN_TASK:
        return this.executeAssignTask(suggestion, payload);

      case SuggestionType.MOVE_PHASE:
        return this.executeMovePhase(suggestion, payload);

      case SuggestionType.SET_PRIORITY:
        return this.executeSetPriority(suggestion, payload);

      default:
        throw new BadRequestException(
          `Unknown suggestion type: ${suggestion.suggestionType}`,
        );
    }
  }

  /**
   * Execute the suggested action within a transaction
   * This version accepts a transaction client for atomicity
   */
  private async executeSuggestionInTransaction(
    tx: TransactionClient,
    suggestion: any,
    payload: Record<string, any>,
  ) {
    switch (suggestion.suggestionType) {
      case SuggestionType.CREATE_TASK:
        return this.executeCreateTaskInTx(tx, suggestion, payload);

      case SuggestionType.UPDATE_TASK:
        return this.executeUpdateTaskInTx(tx, suggestion, payload);

      case SuggestionType.ASSIGN_TASK:
        return this.executeAssignTaskInTx(tx, suggestion, payload);

      case SuggestionType.MOVE_PHASE:
        return this.executeMovePhaseInTx(tx, suggestion, payload);

      case SuggestionType.SET_PRIORITY:
        return this.executeSetPriorityInTx(tx, suggestion, payload);

      default:
        throw new BadRequestException(
          `Unknown suggestion type: ${suggestion.suggestionType}`,
        );
    }
  }

  /**
   * Transaction-aware task creation
   */
  private async executeCreateTaskInTx(
    tx: TransactionClient,
    suggestion: any,
    payload: any,
  ) {
    const { projectId, workspaceId } = suggestion;
    const { title, description, phaseId, priority, assigneeId } = payload;

    // Get the next task number atomically within the transaction
    const last = await tx.task.findFirst({
      where: { projectId },
      orderBy: { taskNumber: 'desc' },
      select: { taskNumber: true },
    });

    const taskNumber = (last?.taskNumber ?? 0) + 1;

    return tx.task.create({
      data: {
        workspaceId,
        projectId,
        phaseId,
        title,
        description,
        priority: priority || 'MEDIUM',
        assigneeId,
        taskNumber,
        status: 'TODO',
        createdBy: suggestion.userId,
      },
    });
  }

  /**
   * Transaction-aware task update
   */
  private async executeUpdateTaskInTx(
    tx: TransactionClient,
    _suggestion: any,
    payload: any,
  ) {
    const { taskId, changes } = payload;
    return tx.task.update({
      where: { id: taskId },
      data: changes,
    });
  }

  /**
   * Transaction-aware task assignment
   */
  private async executeAssignTaskInTx(
    tx: TransactionClient,
    _suggestion: any,
    payload: any,
  ) {
    const { taskId, assigneeId } = payload;
    return tx.task.update({
      where: { id: taskId },
      data: { assigneeId },
    });
  }

  /**
   * Transaction-aware phase move
   */
  private async executeMovePhaseInTx(
    tx: TransactionClient,
    _suggestion: any,
    payload: any,
  ) {
    const { taskId, phaseId } = payload;
    return tx.task.update({
      where: { id: taskId },
      data: { phaseId },
    });
  }

  /**
   * Transaction-aware priority update
   */
  private async executeSetPriorityInTx(
    tx: TransactionClient,
    _suggestion: any,
    payload: any,
  ) {
    const { taskId, priority } = payload;
    return tx.task.update({
      where: { id: taskId },
      data: { priority },
    });
  }

  private async executeCreateTask(suggestion: any, payload: any) {
    const { projectId, workspaceId } = suggestion;
    const { title, description, phaseId, priority, assigneeId } = payload;

    // Use transaction to prevent race conditions in task number generation
    const task = await this.prisma.$transaction(async (tx) => {
      // Get the next task number atomically within the transaction
      const last = await tx.task.findFirst({
        where: { projectId },
        orderBy: { taskNumber: 'desc' },
        select: { taskNumber: true },
      });

      const taskNumber = (last?.taskNumber ?? 0) + 1;

      return tx.task.create({
        data: {
          workspaceId,
          projectId,
          phaseId,
          title,
          description,
          priority: priority || 'MEDIUM',
          assigneeId,
          taskNumber,
          status: 'TODO',
          createdBy: suggestion.userId,
        },
      });
    });

    // TODO: Publish event via EventPublisherService
    // await this.eventPublisher.publish(...)

    return task;
  }

  private async executeUpdateTask(suggestion: any, payload: any) {
    const { taskId, changes } = payload;

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: changes,
    });

    // TODO: Publish event via EventPublisherService
    // await this.eventPublisher.publish(...)

    return task;
  }

  private async executeAssignTask(suggestion: any, payload: any) {
    const { taskId, assigneeId } = payload;

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
    });

    // TODO: Publish event via EventPublisherService
    // await this.eventPublisher.publish(...)

    return task;
  }

  private async executeMovePhase(suggestion: any, payload: any) {
    const { taskId, phaseId } = payload;

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { phaseId },
    });

    // TODO: Publish event via EventPublisherService
    // await this.eventPublisher.publish(...)

    return task;
  }

  private async executeSetPriority(suggestion: any, payload: any) {
    const { taskId, priority } = payload;

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { priority },
    });

    // TODO: Publish event via EventPublisherService
    // await this.eventPublisher.publish(...)

    return task;
  }

  /**
   * Clean up expired suggestions (cron job)
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSuggestions() {
    this.logger.log('Running cleanup for expired suggestions');

    const result = await this.prisma.agentSuggestion.updateMany({
      where: {
        status: SuggestionStatus.PENDING,
        expiresAt: { lt: new Date() },
      },
      data: {
        status: SuggestionStatus.EXPIRED,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} suggestions`);
    }

    return result;
  }
}
