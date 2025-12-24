import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { Workflow, WorkflowTriggerType, WorkflowExecution } from '@prisma/client';
import { BaseEvent, EventTypes } from '@hyvve/shared';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService, EventConsumerService } from '../../events';
import { EventSubscriber } from '../../events/decorators/event-subscriber.decorator';

interface TriggerConfig {
  filters?: {
    status?: string | string[];
    phaseId?: string;
    assigneeId?: string;
    priority?: string | string[];
    type?: string | string[];
  };
  schedule?: string;
  daysBeforeDue?: number;
}

interface ExecutionContext {
  triggerType: WorkflowTriggerType;
  triggerData: Record<string, any>;
  triggeredBy?: string;
  isDryRun?: boolean;
}

/**
 * WorkflowExecutorService
 *
 * Executes workflows when trigger conditions are met.
 * Listens to task events via event bus and evaluates active workflows.
 *
 * Story: PM-10.2 - Trigger Conditions
 */
@Injectable()
export class WorkflowExecutorService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowExecutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
    private readonly eventConsumer: EventConsumerService,
  ) {}

  onModuleInit() {
    this.logger.log('Workflow executor service initialized');
    // Event listeners are auto-registered via @EventSubscriber decorators
  }

  /**
   * Handle task created events
   */
  @EventSubscriber(EventTypes.PM_TASK_CREATED, { priority: 100 })
  async handleTaskCreated(event: BaseEvent) {
    await this.handleTaskEvent(event, 'TASK_CREATED');
  }

  /**
   * Handle task status changed events
   */
  @EventSubscriber(EventTypes.PM_TASK_STATUS_CHANGED, { priority: 100 })
  async handleTaskStatusChanged(event: BaseEvent) {
    await this.handleTaskEvent(event, 'TASK_STATUS_CHANGED');
  }

  /**
   * Handle task assigned events
   */
  @EventSubscriber(EventTypes.PM_TASK_ASSIGNED, { priority: 100 })
  async handleTaskAssigned(event: BaseEvent) {
    await this.handleTaskEvent(event, 'TASK_ASSIGNED');
  }

  /**
   * Handle task completed events
   */
  @EventSubscriber(EventTypes.PM_TASK_COMPLETED, { priority: 100 })
  async handleTaskCompleted(event: BaseEvent) {
    await this.handleTaskEvent(event, 'TASK_COMPLETED');
  }

  /**
   * Process task events and execute matching workflows
   *
   * @param event - The task event from event bus
   * @param triggerType - The workflow trigger type
   */
  private async handleTaskEvent(
    event: BaseEvent,
    triggerType: WorkflowTriggerType,
  ): Promise<void> {
    try {
      // Find active workflows for this trigger type and workspace
      const workflows = await this.prisma.workflow.findMany({
        where: {
          workspaceId: event.tenantId,
          enabled: true,
          triggerType,
        },
      });

      this.logger.debug(
        `Found ${workflows.length} active workflow(s) for trigger ${triggerType} in workspace ${event.tenantId}`,
      );

      // Evaluate trigger conditions and execute matching workflows
      for (const workflow of workflows) {
        if (this.evaluateTriggerConditions(workflow, event)) {
          this.logger.log(
            `Trigger conditions matched for workflow ${workflow.id} (${workflow.name})`,
          );

          await this.executeWorkflow(workflow.id, {
            triggerType,
            triggerData: event.data as Record<string, any>,
            triggeredBy: event.id,
          });
        } else {
          this.logger.debug(
            `Trigger conditions not matched for workflow ${workflow.id} (${workflow.name})`,
          );
        }
      }
    } catch (error) {
      this.logger.error({
        message: 'Error handling task event',
        eventType: event.type,
        eventId: event.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - we don't want to break the event consumer loop
    }
  }

  /**
   * Evaluate trigger filter conditions
   *
   * @param workflow - The workflow to evaluate
   * @param event - The event that triggered evaluation
   * @returns True if all filter conditions match
   */
  private evaluateTriggerConditions(
    workflow: Workflow,
    event: BaseEvent,
  ): boolean {
    const config = workflow.triggerConfig as TriggerConfig;

    // If no filters, always match
    if (!config.filters) return true;

    const taskData = event.data as Record<string, any>;

    // Status filter (supports single value or array)
    if (config.filters.status) {
      if (Array.isArray(config.filters.status)) {
        if (!config.filters.status.includes(taskData.status)) {
          this.logger.debug(
            `Status filter mismatch: ${taskData.status} not in [${config.filters.status.join(', ')}]`,
          );
          return false;
        }
      } else if (taskData.status !== config.filters.status) {
        this.logger.debug(
          `Status filter mismatch: ${taskData.status} !== ${config.filters.status}`,
        );
        return false;
      }
    }

    // Phase filter
    if (config.filters.phaseId && taskData.phaseId !== config.filters.phaseId) {
      this.logger.debug(
        `Phase filter mismatch: ${taskData.phaseId} !== ${config.filters.phaseId}`,
      );
      return false;
    }

    // Assignee filter
    if (config.filters.assigneeId && taskData.assigneeId !== config.filters.assigneeId) {
      this.logger.debug(
        `Assignee filter mismatch: ${taskData.assigneeId} !== ${config.filters.assigneeId}`,
      );
      return false;
    }

    // Priority filter (supports single value or array)
    if (config.filters.priority) {
      if (Array.isArray(config.filters.priority)) {
        if (!config.filters.priority.includes(taskData.priority)) {
          this.logger.debug(
            `Priority filter mismatch: ${taskData.priority} not in [${config.filters.priority.join(', ')}]`,
          );
          return false;
        }
      } else if (taskData.priority !== config.filters.priority) {
        this.logger.debug(
          `Priority filter mismatch: ${taskData.priority} !== ${config.filters.priority}`,
        );
        return false;
      }
    }

    // Type filter (supports single value or array)
    if (config.filters.type) {
      if (Array.isArray(config.filters.type)) {
        if (!config.filters.type.includes(taskData.type)) {
          this.logger.debug(
            `Type filter mismatch: ${taskData.type} not in [${config.filters.type.join(', ')}]`,
          );
          return false;
        }
      } else if (taskData.type !== config.filters.type) {
        this.logger.debug(
          `Type filter mismatch: ${taskData.type} !== ${config.filters.type}`,
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Execute a workflow
   *
   * Creates execution record and runs workflow steps.
   * PM-10.3 will implement actual step execution - for now just creates placeholder execution.
   *
   * @param workflowId - The workflow to execute
   * @param context - Execution context with trigger data
   * @returns The created workflow execution
   */
  async executeWorkflow(
    workflowId: string,
    context: ExecutionContext,
  ): Promise<WorkflowExecution> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Check rate limit: max 100 executions per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentExecutions = await this.prisma.workflowExecution.count({
      where: {
        workflowId,
        startedAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentExecutions >= 100) {
      this.logger.warn(
        `Rate limit exceeded for workflow ${workflowId}: ${recentExecutions} executions in last hour`,
      );
      throw new Error('Workflow execution rate limit exceeded (100/hour)');
    }

    this.logger.log(
      `Executing workflow ${workflowId} (${workflow.name}) - trigger: ${context.triggerType}, dry-run: ${context.isDryRun || false}`,
    );

    // Create execution record
    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId,
        triggerType: context.triggerType,
        triggeredBy: context.triggeredBy,
        triggerData: context.triggerData as any,
        status: 'RUNNING',
        isDryRun: context.isDryRun || false,
      },
    });

    try {
      // Emit execution started event
      await this.eventPublisher.publish(
        'pm.workflow.execution.started' as any,
        {
          workflowId,
          executionId: execution.id,
          triggerType: context.triggerType,
          isDryRun: context.isDryRun,
        },
        {
          tenantId: workflow.workspaceId,
          userId: 'system',
        },
      );

      // TODO: PM-10.3 will implement actual workflow step execution
      // For now, just mark as completed with placeholder data
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          stepsExecuted: 0,
          stepsPassed: 0,
          stepsFailed: 0,
          executionTrace: {
            message: 'Workflow triggered successfully. Step execution pending PM-10.3 implementation.',
          } as any,
        },
      });

      // Update workflow stats
      await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          executionCount: { increment: 1 },
          lastExecutedAt: new Date(),
        },
      });

      // Emit completion event
      await this.eventPublisher.publish(
        'pm.workflow.execution.completed' as any,
        {
          workflowId,
          executionId: execution.id,
          isDryRun: context.isDryRun,
        },
        {
          tenantId: workflow.workspaceId,
          userId: 'system',
        },
      );

      this.logger.log(`Workflow execution ${execution.id} completed successfully`);

      return execution;
    } catch (error) {
      this.logger.error({
        message: 'Workflow execution failed',
        workflowId,
        executionId: execution.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Update execution with error
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });

      // Update error count
      await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          errorCount: { increment: 1 },
        },
      });

      // Emit failure event
      await this.eventPublisher.publish(
        'pm.workflow.execution.failed' as any,
        {
          workflowId,
          executionId: execution.id,
          error: error instanceof Error ? error.message : String(error),
        },
        {
          tenantId: workflow.workspaceId,
          userId: 'system',
        },
      );

      throw error;
    }
  }
}
