import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowStatus as PrismaWorkflowStatus, WorkflowTriggerType as PrismaTriggerType } from '@prisma/client';
import { EventTypes } from '@hyvve/shared';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService } from '../../events';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ListWorkflowsQueryDto } from './dto/list-workflows-query.dto';
import { TestWorkflowDto, TestWorkflowResponseDto } from './dto/test-workflow.dto';
import { WorkflowExecutorService } from './workflow-executor.service';

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

  async remove(workspaceId: string, id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      select: { workspaceId: true, projectId: true },
    });

    if (!workflow || workflow.workspaceId !== workspaceId) {
      throw new NotFoundException('Workflow not found');
    }

    await this.prisma.workflow.delete({
      where: { id },
    });

    // Publish event
    await this.eventPublisher.publish(
      EventTypes.PM_WORKFLOW_DELETED,
      { workflowId: id, projectId: workflow.projectId },
      { tenantId: workspaceId, userId: 'system' },
    );

    return { success: true };
  }

  async activate(workspaceId: string, actorId: string, id: string) {
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

    // Detect cycles using DFS
    if (this.hasCycle(nodes, edges)) {
      throw new BadRequestException('Workflow definition contains circular dependencies');
    }
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
}
