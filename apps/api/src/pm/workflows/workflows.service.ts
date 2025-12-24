import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowStatus as PrismaWorkflowStatus, WorkflowTriggerType as PrismaTriggerType, WorkflowExecutionStatus as PrismaExecutionStatus } from '@prisma/client';
import { EventTypes } from '@hyvve/shared';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService } from '../../events';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ListWorkflowsQueryDto } from './dto/list-workflows-query.dto';
import { TestWorkflowDto, TestWorkflowResponseDto } from './dto/test-workflow.dto';
import { CreateFromTemplateDto } from './dto/create-from-template.dto';
import { ListExecutionsQueryDto } from './dto/list-executions-query.dto';
import { WorkflowExecutorService } from './workflow-executor.service';
import { getWorkflowTemplates, getWorkflowTemplateById } from './workflow-templates';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
    private readonly workflowExecutor: WorkflowExecutorService,
  ) {}

  async create(workspaceId: string, actorId: string, dto: CreateWorkflowDto) {
    // Validate project access
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: { workspaceId: true },
    });

    if (!project || project.workspaceId !== workspaceId) {
      throw new NotFoundException('Project not found');
    }

    // Check active workflow limit (max 50 per project)
    const activeCount = await this.prisma.workflow.count({
      where: {
        projectId: dto.projectId,
        enabled: true,
      },
    });

    if (activeCount >= 50) {
      throw new BadRequestException('Maximum number of active workflows (50) reached for this project');
    }

    // Validate workflow definition (check for cycles)
    this.validateWorkflowDefinition(dto.definition);

    // Create workflow
    const workflow = await this.prisma.workflow.create({
      data: {
        workspaceId,
        projectId: dto.projectId,
        name: dto.name,
        description: dto.description,
        definition: dto.definition as any,
        triggerType: dto.triggerType as PrismaTriggerType,
        triggerConfig: dto.triggerConfig as any,
        status: PrismaWorkflowStatus.DRAFT,
        createdBy: actorId,
      },
    });

    // Publish event
    await this.eventPublisher.publish(
      EventTypes.PM_WORKFLOW_CREATED,
      { workflowId: workflow.id, projectId: workflow.projectId },
      { tenantId: workspaceId, userId: actorId },
    );

    return workflow;
  }

  async findAll(workspaceId: string, query: ListWorkflowsQueryDto) {
    const where: any = { workspaceId };

    if (query.projectId) {
      // Validate project access
      const project = await this.prisma.project.findUnique({
        where: { id: query.projectId },
        select: { workspaceId: true },
      });

      if (!project || project.workspaceId !== workspaceId) {
        throw new NotFoundException('Project not found');
      }

      where.projectId = query.projectId;
    }

    if (query.status) {
      where.status = query.status as PrismaWorkflowStatus;
    }

    if (query.enabled !== undefined) {
      where.enabled = query.enabled;
    }

    const workflows = await this.prisma.workflow.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return workflows;
  }

  async findOne(workspaceId: string, id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        executions: {
          take: 10,
          orderBy: {
            startedAt: 'desc',
          },
        },
      },
    });

    if (!workflow || workflow.workspaceId !== workspaceId) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  async update(workspaceId: string, actorId: string, id: string, dto: UpdateWorkflowDto) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      select: { workspaceId: true },
    });

    if (!workflow || workflow.workspaceId !== workspaceId) {
      throw new NotFoundException('Workflow not found');
    }

    // Validate workflow definition if provided
    if (dto.definition) {
      this.validateWorkflowDefinition(dto.definition);
    }

    const updated = await this.prisma.workflow.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.definition && { definition: dto.definition as any }),
        ...(dto.triggerType && { triggerType: dto.triggerType as PrismaTriggerType }),
        ...(dto.triggerConfig && { triggerConfig: dto.triggerConfig as any }),
      },
    });

    // Publish event
    await this.eventPublisher.publish(
      EventTypes.PM_WORKFLOW_UPDATED,
      { workflowId: updated.id, projectId: updated.projectId },
      { tenantId: workspaceId, userId: actorId },
    );

    return updated;
  }

  async remove(workspaceId: string, id: string, actorId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      select: { workspaceId: true, projectId: true, name: true },
    });

    if (!workflow || workflow.workspaceId !== workspaceId) {
      throw new NotFoundException('Workflow not found');
    }

    await this.prisma.workflow.delete({
      where: { id },
    });

    // Publish event with actor for audit trail
    await this.eventPublisher.publish(
      EventTypes.PM_WORKFLOW_DELETED,
      {
        workflowId: id,
        projectId: workflow.projectId,
        workflowName: workflow.name,
        deletedBy: actorId,
      },
      { tenantId: workspaceId, userId: actorId },
    );

    return { success: true };
  }

  async activate(workspaceId: string, actorId: string, id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      select: { workspaceId: true, projectId: true, enabled: true },
    });

    if (!workflow || workflow.workspaceId !== workspaceId) {
      throw new NotFoundException('Workflow not found');
    }

    // Skip if already active
    if (workflow.enabled) {
      const current = await this.prisma.workflow.findUnique({ where: { id } });
      return current;
    }

    // Check active workflow limit before activating (50 per project)
    const activeCount = await this.prisma.workflow.count({
      where: {
        projectId: workflow.projectId,
        enabled: true,
      },
    });

    if (activeCount >= 50) {
      throw new BadRequestException('Maximum number of active workflows (50) reached for this project');
    }

    const updated = await this.prisma.workflow.update({
      where: { id },
      data: {
        enabled: true,
        status: PrismaWorkflowStatus.ACTIVE,
      },
    });

    // Publish event
    await this.eventPublisher.publish(
      EventTypes.PM_WORKFLOW_ACTIVATED,
      { workflowId: updated.id, projectId: updated.projectId },
      { tenantId: workspaceId, userId: actorId },
    );

    return updated;
  }

  async pause(workspaceId: string, actorId: string, id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      select: { workspaceId: true, projectId: true },
    });

    if (!workflow || workflow.workspaceId !== workspaceId) {
      throw new NotFoundException('Workflow not found');
    }

    const updated = await this.prisma.workflow.update({
      where: { id },
      data: {
        enabled: false,
        status: PrismaWorkflowStatus.PAUSED,
      },
    });

    // Publish event
    await this.eventPublisher.publish(
      EventTypes.PM_WORKFLOW_PAUSED,
      { workflowId: updated.id, projectId: updated.projectId },
      { tenantId: workspaceId, userId: actorId },
    );

    return updated;
  }

  /**
   * Validate workflow definition structure
   * - Check for cycles in workflow graph
   * - Validate max node count (50)
   * - Validate node types
   */
  private validateWorkflowDefinition(definition: any): void {
    const { nodes, edges } = definition;

    if (!nodes || !Array.isArray(nodes)) {
      throw new BadRequestException('Invalid workflow definition: nodes must be an array');
    }

    if (!edges || !Array.isArray(edges)) {
      throw new BadRequestException('Invalid workflow definition: edges must be an array');
    }

    // Validate node count
    if (nodes.length > 50) {
      throw new BadRequestException('Workflow cannot have more than 50 nodes');
    }

    // Validate node types
    const validTypes = ['trigger', 'condition', 'action', 'agent'];
    for (const node of nodes) {
      if (!validTypes.includes(node.type)) {
        throw new BadRequestException(`Invalid node type: ${node.type}`);
      }
    }

    // Require at least one trigger node
    const triggerNodes = nodes.filter((n: any) => n.type === 'trigger');
    if (triggerNodes.length === 0) {
      throw new BadRequestException('Workflow must have at least one trigger node');
    }

    // Validate edge references point to valid nodes
    const nodeIds = new Set(nodes.map((n: any) => n.id));
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        throw new BadRequestException(`Invalid edge: source node '${edge.source}' does not exist`);
      }
      if (!nodeIds.has(edge.target)) {
        throw new BadRequestException(`Invalid edge: target node '${edge.target}' does not exist`);
      }
    }

    // Detect orphan nodes (nodes not connected to any edges, except triggers which can be entry points)
    const connectedNodes = new Set<string>();
    for (const edge of edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }
    for (const node of nodes) {
      if (node.type !== 'trigger' && !connectedNodes.has(node.id)) {
        throw new BadRequestException(`Orphan node detected: '${node.id}' is not connected to any edges`);
      }
    }

    // Validate webhook action configurations (fail-fast at creation time)
    const MIN_WEBHOOK_TIMEOUT = 1000;
    const MAX_WEBHOOK_TIMEOUT = 30000;
    for (const node of nodes) {
      if (node.type === 'action') {
        const actionType = node.data?.config?.actionType;
        const config = node.data?.config?.config;

        if (actionType === 'CALL_WEBHOOK' && config?.timeout !== undefined) {
          const timeout = config.timeout;
          if (typeof timeout !== 'number' || timeout < MIN_WEBHOOK_TIMEOUT || timeout > MAX_WEBHOOK_TIMEOUT) {
            throw new BadRequestException(
              `Invalid webhook timeout in node '${node.id}': must be between ${MIN_WEBHOOK_TIMEOUT}ms and ${MAX_WEBHOOK_TIMEOUT}ms`,
            );
          }
        }
      }
    }

    // Validate trigger nodes are connected to at least one action (reachability check)
    for (const triggerNode of triggerNodes) {
      const reachableNodes = this.getReachableNodes(triggerNode.id, edges);
      const hasReachableAction = nodes.some(
        (n: any) => n.type === 'action' && reachableNodes.has(n.id),
      );
      if (!hasReachableAction) {
        throw new BadRequestException(
          `Trigger node '${triggerNode.id}' has no reachable action nodes`,
        );
      }
    }

    // Detect cycles using DFS
    if (this.hasCycle(nodes, edges)) {
      throw new BadRequestException('Workflow definition contains circular dependencies');
    }
  }

  /**
   * Get all nodes reachable from a given node via edges
   */
  private getReachableNodes(startNodeId: string, edges: any[]): Set<string> {
    const reachable = new Set<string>();
    const queue = [startNodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of edges) {
        if (edge.source === current && !reachable.has(edge.target)) {
          reachable.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    return reachable;
  }

  /**
   * Detect cycles in workflow graph using DFS
   */
  private hasCycle(nodes: any[], edges: any[]): boolean {
    const nodeIds = new Set(nodes.map((n) => n.id));
    const adjacency = new Map<string, string[]>();

    // Build adjacency list
    for (const node of nodes) {
      adjacency.set(node.id, []);
    }

    for (const edge of edges) {
      if (!adjacency.has(edge.source)) continue;
      adjacency.get(edge.source)!.push(edge.target);
    }

    // DFS with cycle detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = adjacency.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true; // Cycle detected
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) return true;
      }
    }

    return false;
  }

  /**
   * Test workflow in dry-run mode
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param id - Workflow ID to test
   * @param dto - Test configuration with task ID and optional overrides
   * @returns Test execution result with trace
   */
  async testWorkflow(
    workspaceId: string,
    id: string,
    dto: TestWorkflowDto,
  ): Promise<TestWorkflowResponseDto> {
    const startTime = Date.now();

    // Validate workflow access
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      select: {
        id: true,
        workspaceId: true,
        projectId: true,
        triggerType: true,
      },
    });

    if (!workflow || workflow.workspaceId !== workspaceId) {
      throw new NotFoundException('Workflow not found');
    }

    // Validate task access and that it belongs to the same project
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
      select: {
        id: true,
        projectId: true,
        workspaceId: true,
        title: true,
        status: true,
        priority: true,
        type: true,
        assigneeId: true,
        phaseId: true,
      },
    });

    if (!task || task.workspaceId !== workspaceId) {
      throw new NotFoundException('Task not found');
    }

    if (task.projectId !== workflow.projectId) {
      throw new BadRequestException('Task must belong to the same project as the workflow');
    }

    // Build trigger data from task (with optional overrides)
    const triggerData = {
      taskId: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      type: task.type,
      assigneeId: task.assigneeId,
      phaseId: task.phaseId,
      ...dto.overrides,
    };

    // Execute workflow in dry-run mode
    const execution = await this.workflowExecutor.executeWorkflow(workflow.id, {
      workflowId: workflow.id,
      workspaceId: workflow.workspaceId, // Tenant isolation
      triggerType: workflow.triggerType,
      triggerData,
      isDryRun: true,
    });

    // Build response from execution
    const trace = execution.executionTrace as any;
    const duration = Date.now() - startTime;

    return {
      executionId: execution.id,
      workflowId: workflow.id,
      trace: {
        steps: trace?.steps || [],
      },
      summary: {
        stepsExecuted: execution.stepsExecuted || 0,
        stepsPassed: execution.stepsPassed || 0,
        stepsFailed: execution.stepsFailed || 0,
        duration,
      },
    };
  }

  /**
   * Get workflow templates
   * PM-10-5: Workflow Templates
   */
  async getTemplates() {
    return getWorkflowTemplates();
  }

  /**
   * Create workflow from template
   * PM-10-5: Workflow Templates
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param actorId - User creating the workflow
   * @param dto - Template selection and workflow details
   * @returns Created workflow
   */
  async createFromTemplate(workspaceId: string, actorId: string, dto: CreateFromTemplateDto) {
    // Get template
    const template = getWorkflowTemplateById(dto.templateId);
    if (!template) {
      throw new NotFoundException(`Template not found: ${dto.templateId}`);
    }

    // Validate project access
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: { workspaceId: true },
    });

    if (!project || project.workspaceId !== workspaceId) {
      throw new NotFoundException('Project not found');
    }

    // Check active workflow limit (max 50 per project)
    const activeCount = await this.prisma.workflow.count({
      where: {
        projectId: dto.projectId,
        enabled: true,
      },
    });

    if (activeCount >= 50) {
      throw new BadRequestException('Maximum number of active workflows (50) reached for this project');
    }

    // Validate template definition (check for cycles, required nodes, etc.)
    this.validateWorkflowDefinition(template.definition);

    // Extract trigger type from template
    const triggerType = template.definition.triggers[0]?.eventType || 'MANUAL' as PrismaTriggerType;
    const triggerConfig = template.definition.triggers[0] || {};

    // Create workflow from template
    const workflow = await this.prisma.workflow.create({
      data: {
        workspaceId,
        projectId: dto.projectId,
        name: dto.name,
        description: dto.description || template.description,
        definition: template.definition as any,
        triggerType: triggerType as PrismaTriggerType,
        triggerConfig: triggerConfig as any,
        status: PrismaWorkflowStatus.DRAFT,
        createdBy: actorId,
      },
    });

    // Publish event
    await this.eventPublisher.publish(
      EventTypes.PM_WORKFLOW_CREATED,
      { workflowId: workflow.id, projectId: workflow.projectId, templateId: dto.templateId },
      { tenantId: workspaceId, userId: actorId },
    );

    return workflow;
  }

  /**
   * Get workflow executions with pagination
   * PM-10-5: Workflow Management
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param workflowId - Workflow ID
   * @param query - Pagination and filter options
   * @returns Paginated execution list
   */
  async getExecutions(workspaceId: string, workflowId: string, query: ListExecutionsQueryDto) {
    // Validate workflow access
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { workspaceId: true },
    });

    if (!workflow || workflow.workspaceId !== workspaceId) {
      throw new NotFoundException('Workflow not found');
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { workflowId };

    if (query.status) {
      where.status = query.status as PrismaExecutionStatus;
    }

    // Get total count
    const total = await this.prisma.workflowExecution.count({ where });

    // Get executions
    const executions = await this.prisma.workflowExecution.findMany({
      where,
      orderBy: {
        startedAt: 'desc',
      },
      skip,
      take: limit,
      select: {
        id: true,
        workflowId: true,
        triggerType: true,
        triggeredBy: true,
        triggerData: true,
        status: true,
        startedAt: true,
        completedAt: true,
        stepsExecuted: true,
        stepsPassed: true,
        stepsFailed: true,
        executionTrace: true,
        errorMessage: true,
        isDryRun: true,
      },
    });

    return {
      items: executions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retry failed workflow execution
   * PM-10-5: Workflow Management
   *
   * Creates a new execution with the same trigger data as the failed execution.
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param actorId - User retrying the execution
   * @param executionId - Failed execution ID
   * @returns New execution
   */
  async retryExecution(workspaceId: string, actorId: string, executionId: string) {
    // Load original execution
    const originalExecution = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        workflow: {
          select: {
            id: true,
            workspaceId: true,
            enabled: true,
          },
        },
      },
    });

    if (!originalExecution) {
      throw new NotFoundException('Execution not found');
    }

    if (originalExecution.workflow.workspaceId !== workspaceId) {
      throw new NotFoundException('Execution not found');
    }

    // Only allow retry for failed executions
    if (originalExecution.status !== 'FAILED') {
      throw new BadRequestException('Only failed executions can be retried');
    }

    // Prevent retrying dry-run executions (they're simulations, not real executions)
    if (originalExecution.isDryRun) {
      throw new BadRequestException('Cannot retry dry-run executions. Use test workflow to run another simulation.');
    }

    // Check if workflow is still enabled
    if (!originalExecution.workflow.enabled) {
      throw new BadRequestException('Workflow is not active. Please activate it before retrying.');
    }

    // Execute workflow with same trigger data
    const newExecution = await this.workflowExecutor.executeWorkflow(
      originalExecution.workflowId,
      {
        workflowId: originalExecution.workflowId,
        workspaceId, // Tenant isolation
        triggerType: originalExecution.triggerType,
        triggerData: originalExecution.triggerData as Record<string, any>,
        triggeredBy: `retry:${executionId}`,
        isDryRun: false,
      },
    );

    // Publish event
    await this.eventPublisher.publish(
      EventTypes.PM_WORKFLOW_EXECUTION_RETRIED,
      {
        workflowId: originalExecution.workflowId,
        originalExecutionId: executionId,
        newExecutionId: newExecution.id,
      },
      { tenantId: workspaceId, userId: actorId },
    );

    return newExecution;
  }
}
