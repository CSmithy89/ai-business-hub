import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { Workflow, WorkflowTriggerType, WorkflowExecution } from '@prisma/client';
import { BaseEvent, EventTypes } from '@hyvve/shared';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService, EventConsumerService } from '../../events';
import { EventSubscriber } from '../../events/decorators/event-subscriber.decorator';
import { ActionExecutorService } from './action-executor.service';

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

export interface ExecutionContext {
  workflowId: string;
  workspaceId: string; // Required for tenant isolation
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
    private readonly actionExecutor: ActionExecutorService,
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
            workflowId: workflow.id,
            workspaceId: workflow.workspaceId, // Tenant isolation
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

      // Execute workflow steps
      const executionTrace = await this.executeSteps(workflow, context);

      // Truncate trace if it exceeds 100KB to prevent storage issues
      const truncatedTrace = this.truncateExecutionTrace(executionTrace);

      // Update execution with results
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: executionTrace.status,
          completedAt: new Date(),
          stepsExecuted: executionTrace.stepsExecuted,
          stepsPassed: executionTrace.stepsPassed,
          stepsFailed: executionTrace.stepsFailed,
          executionTrace: truncatedTrace as any,
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

      // Reload execution to return updated data with trace
      const updatedExecution = await this.prisma.workflowExecution.findUnique({
        where: { id: execution.id },
      });

      return updatedExecution || execution;
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

  /**
   * Execute workflow steps
   *
   * Processes nodes in topological order and executes actions.
   *
   * @param workflow - The workflow to execute
   * @param context - Execution context
   * @returns Execution trace with step results
   */
  private async executeSteps(
    workflow: Workflow,
    context: ExecutionContext,
  ): Promise<{
    status: 'COMPLETED' | 'FAILED';
    stepsExecuted: number;
    stepsPassed: number;
    stepsFailed: number;
    steps: any[];
  }> {
    const definition = workflow.definition as any;
    const nodes = definition.nodes || [];
    const edges = definition.edges || [];

    // Topologically sort nodes
    const sortedNodes = this.topologicalSort(nodes, edges);

    this.logger.debug(
      `Executing ${sortedNodes.length} node(s) for workflow ${workflow.id}`,
    );

    const steps: any[] = [];
    let stepsPassed = 0;
    let stepsFailed = 0;

    // Execute nodes in order
    for (const node of sortedNodes) {
      // Skip trigger nodes (they're just starting points)
      if (node.type === 'trigger') {
        continue;
      }

      // Execute action nodes
      if (node.type === 'action') {
        // actionType is nested inside node.data.config per template structure
        const actionType = node.data?.config?.actionType;
        const config = { nodeId: node.id, ...node.data?.config?.config };

        if (!actionType) {
          this.logger.warn(`Action node ${node.id} missing actionType, skipping`);
          continue;
        }

        const stepResult = await this.actionExecutor.executeAction(
          actionType,
          config,
          context,
        );

        steps.push(stepResult);

        if (stepResult.status === 'passed') {
          stepsPassed++;
        } else if (stepResult.status === 'failed') {
          stepsFailed++;

          // Stop execution unless continueOnError is true
          if (!node.data?.continueOnError) {
            this.logger.warn(
              `Step ${node.id} failed, halting execution (continueOnError: false)`,
            );
            break;
          }
        }
      }
    }

    const status = stepsFailed > 0 ? 'FAILED' : 'COMPLETED';

    return {
      status,
      stepsExecuted: steps.length,
      stepsPassed,
      stepsFailed,
      steps,
    };
  }

  /**
   * Topologically sort workflow nodes
   *
   * Ensures actions execute in the correct order based on edges.
   *
   * @param nodes - Workflow nodes
   * @param edges - Workflow edges
   * @returns Sorted nodes
   */
  private topologicalSort(nodes: any[], edges: any[]): any[] {
    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    for (const node of nodes) {
      adjacency.set(node.id, []);
      inDegree.set(node.id, 0);
    }

    // Build graph
    for (const edge of edges) {
      adjacency.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    // Find all nodes with no incoming edges
    const queue: any[] = [];
    for (const node of nodes) {
      if (inDegree.get(node.id) === 0) {
        queue.push(node);
      }
    }

    // Process nodes
    const sorted: any[] = [];
    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node);

      // Reduce in-degree for neighbors
      for (const neighborId of adjacency.get(node.id) || []) {
        const newDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newDegree);

        if (newDegree === 0) {
          const neighborNode = nodes.find((n) => n.id === neighborId);
          if (neighborNode) {
            queue.push(neighborNode);
          }
        }
      }
    }

    // Check for cycles
    if (sorted.length !== nodes.length) {
      this.logger.warn('Workflow contains cycles, some nodes may not execute');
    }

    return sorted;
  }

  /**
   * Truncate execution trace if it exceeds 100KB
   *
   * Preserves structure but truncates step results to prevent storage issues.
   */
  private truncateExecutionTrace(trace: any): any {
    const MAX_TRACE_SIZE = 100 * 1024; // 100KB
    const serialized = JSON.stringify(trace);

    if (serialized.length <= MAX_TRACE_SIZE) {
      return trace;
    }

    this.logger.warn(
      `Execution trace exceeds 100KB (${Math.round(serialized.length / 1024)}KB), truncating step results`,
    );

    // Create truncated version preserving structure
    const truncated = {
      ...trace,
      truncated: true,
      originalSize: serialized.length,
      steps: trace.steps?.map((step: any) => ({
        ...step,
        result: step.result
          ? { truncated: true, message: 'Result truncated due to size limit' }
          : step.result,
      })),
    };

    return truncated;
  }
}
