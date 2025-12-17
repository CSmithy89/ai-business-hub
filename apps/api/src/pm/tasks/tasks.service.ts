import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, TaskActivityType, TaskStatus } from '@prisma/client'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { BulkUpdateTasksDto } from './dto/bulk-update-tasks.dto'
import { CreateTaskDto } from './dto/create-task.dto'
import { ListTasksQueryDto } from './dto/list-tasks.query.dto'
import { UpdateTaskDto } from './dto/update-task.dto'

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  private async assertProjectInWorkspace(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      select: { id: true },
    })
    if (!project) throw new NotFoundException('Project not found')
  }

  private async assertPhaseInProject(projectId: string, phaseId: string) {
    const phase = await this.prisma.phase.findFirst({
      where: { id: phaseId, projectId },
      select: { id: true },
    })
    if (!phase) throw new BadRequestException('phaseId is not valid for this project')
  }

  private async assertValidParentId(params: {
    workspaceId: string
    projectId: string
    taskId?: string
    parentId: string | null | undefined
  }) {
    if (!params.parentId) return
    if (params.taskId && params.parentId === params.taskId) {
      throw new BadRequestException('parentId cannot reference the task itself')
    }

    const parent = await this.prisma.task.findFirst({
      where: { id: params.parentId, workspaceId: params.workspaceId, deletedAt: null },
      select: { id: true, projectId: true, parentId: true },
    })
    if (!parent) throw new BadRequestException('parentId is not a valid task')
    if (parent.projectId !== params.projectId) throw new BadRequestException('parentId must be in the same project')

    // Prevent cycles: walk up ancestors from parent, ensure we never hit taskId.
    if (params.taskId) {
      let cursor: { id: string; parentId: string | null } | null = parent
      for (let depth = 0; depth < 10 && cursor?.parentId; depth += 1) {
        if (cursor.parentId === params.taskId) {
          throw new BadRequestException('parentId would create a cycle')
        }
        cursor = await this.prisma.task.findFirst({
          where: { id: cursor.parentId, workspaceId: params.workspaceId, deletedAt: null },
          select: { id: true, parentId: true },
        })
      }
    }

    // Enforce max depth: root (0) -> child (1) -> grandchild (2); disallow deeper.
    // That means the parent can have at most 1 ancestor with a parentId.
    const parentParentId = parent.parentId
    if (!parentParentId) return

    const parentParent = await this.prisma.task.findFirst({
      where: { id: parentParentId, workspaceId: params.workspaceId, deletedAt: null },
      select: { id: true, parentId: true },
    })
    if (parentParent?.parentId) {
      throw new BadRequestException('Task hierarchy supports a maximum of 3 levels')
    }
  }

  async create(workspaceId: string, actorId: string, dto: CreateTaskDto) {
    await this.assertProjectInWorkspace(workspaceId, dto.projectId)
    await this.assertPhaseInProject(dto.projectId, dto.phaseId)
    await this.assertValidParentId({ workspaceId, projectId: dto.projectId, parentId: dto.parentId })

    const created = await this.prisma.$transaction(async (tx) => {
      const last = await tx.task.findFirst({
        where: { projectId: dto.projectId },
        orderBy: { taskNumber: 'desc' },
        select: { taskNumber: true },
      })

      const taskNumber = (last?.taskNumber ?? 0) + 1

      const task = await tx.task.create({
        data: {
          workspaceId,
          projectId: dto.projectId,
          phaseId: dto.phaseId,
          taskNumber,
          title: dto.title,
          description: dto.description,
          type: dto.type,
          priority: dto.priority,
          assignmentType: dto.assignmentType,
          assigneeId: dto.assigneeId ?? null,
          agentId: dto.agentId ?? null,
          storyPoints: dto.storyPoints ?? null,
          dueDate: dto.dueDate ?? null,
          parentId: dto.parentId ?? null,
          status: dto.status ?? undefined,
          createdBy: actorId,
        },
      })

      await tx.taskActivity.create({
        data: {
          taskId: task.id,
          userId: actorId,
          type: TaskActivityType.CREATED,
          data: { taskNumber },
        },
      })

      return task
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_CREATED,
      { taskId: created.id, projectId: created.projectId, phaseId: created.phaseId, taskNumber: created.taskNumber },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: created }
  }

  async list(workspaceId: string, query: ListTasksQueryDto) {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)
    const skip = (page - 1) * limit

    const where: Prisma.TaskWhereInput = {
      workspaceId,
      deletedAt: null,
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.phaseId ? { phaseId: query.phaseId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assignmentType ? { assignmentType: query.assignmentType } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.parentId ? { parentId: query.parentId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [total, tasks] = await this.prisma.$transaction([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { taskNumber: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          workspaceId: true,
          projectId: true,
          phaseId: true,
          taskNumber: true,
          title: true,
          description: true,
          type: true,
          priority: true,
          assignmentType: true,
          assigneeId: true,
          agentId: true,
          storyPoints: true,
          status: true,
          dueDate: true,
          startedAt: true,
          completedAt: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getById(workspaceId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: {
        parent: {
          select: { id: true, parentId: true, taskNumber: true, title: true },
        },
        children: {
          where: { deletedAt: null },
          orderBy: [{ status: 'asc' }, { taskNumber: 'asc' }],
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
            type: true,
            priority: true,
            assigneeId: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        relations: true,
        relatedTo: true,
        labels: true,
        attachments: true,
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!task) throw new NotFoundException('Task not found')

    const childTotal = task.children.length
    const childDone = task.children.filter((c) => c.status === TaskStatus.DONE).length
    const completionPercent = childTotal === 0 ? 0 : Math.round((childDone / childTotal) * 100)

    return { data: { ...task, subtasks: { total: childTotal, done: childDone, completionPercent } } }
  }

  async update(workspaceId: string, actorId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.task.findFirst({
      where: { id, workspaceId, deletedAt: null },
      select: { id: true, projectId: true, phaseId: true, status: true, startedAt: true, completedAt: true },
    })
    if (!existing) throw new NotFoundException('Task not found')

    if (dto.phaseId) {
      await this.assertPhaseInProject(existing.projectId, dto.phaseId)
    }

    if (dto.parentId !== undefined) {
      await this.assertValidParentId({
        workspaceId,
        projectId: existing.projectId,
        taskId: existing.id,
        parentId: dto.parentId,
      })
    }

    const nextStatus = dto.status
    const statusChanged = nextStatus !== undefined && nextStatus !== existing.status

    const updateData: Prisma.TaskUncheckedUpdateInput = {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      priority: dto.priority,
      assignmentType: dto.assignmentType,
      assigneeId: dto.assigneeId,
      agentId: dto.agentId,
      storyPoints: dto.storyPoints,
      dueDate: dto.dueDate,
      approvalRequired: dto.approvalRequired,
      approvalStatus: dto.approvalStatus,
      approvedBy: dto.approvedBy,
      approvedAt: dto.approvedAt,
      parentId: dto.parentId,
      phaseId: dto.phaseId,
      status: dto.status,
    }

    if (statusChanged) {
      if (nextStatus === TaskStatus.DONE) {
        updateData.completedAt = new Date()
      } else if (existing.completedAt) {
        updateData.completedAt = null
      }

      if (nextStatus === TaskStatus.IN_PROGRESS && !existing.startedAt) {
        updateData.startedAt = new Date()
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: existing.id },
        data: updateData,
      })

      const changedKeys = Object.entries(dto)
        .filter(([, value]) => value !== undefined)
        .map(([key]) => key)

      if (statusChanged) {
        await tx.taskActivity.create({
          data: {
            taskId: existing.id,
            userId: actorId,
            type: TaskActivityType.STATUS_CHANGED,
            data: { from: existing.status, to: nextStatus, changedKeys },
          },
        })
      }

      const hasNonStatusChanges = changedKeys.some((k) => k !== 'status')
      if (!statusChanged || hasNonStatusChanges) {
        await tx.taskActivity.create({
          data: {
            taskId: existing.id,
            userId: actorId,
            type: TaskActivityType.UPDATED,
            data: { changedKeys },
          },
        })
      }

      return task
    })

    if (statusChanged) {
      await this.eventPublisher.publish(
        EventTypes.PM_TASK_STATUS_CHANGED,
        { taskId: updated.id, projectId: updated.projectId, from: existing.status, to: nextStatus },
        { tenantId: workspaceId, userId: actorId, source: 'api' },
      )
    }

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      { taskId: updated.id, projectId: updated.projectId, phaseId: updated.phaseId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: updated }
  }

  async bulkUpdate(workspaceId: string, actorId: string, dto: BulkUpdateTasksDto) {
    const existingTasks = await this.prisma.task.findMany({
      where: { id: { in: dto.ids }, workspaceId, deletedAt: null },
      select: { id: true, status: true, projectId: true },
    })

    if (existingTasks.length === 0) {
      throw new NotFoundException('No tasks found')
    }

    if (dto.phaseId) {
      const projectIds = Array.from(new Set(existingTasks.map((t) => t.projectId)))
      if (projectIds.length !== 1) {
        throw new BadRequestException('phaseId bulk update requires all tasks to belong to the same project')
      }
      await this.assertPhaseInProject(projectIds[0], dto.phaseId)
    }

    const statusProvided = dto.status !== undefined

    const updateData: Prisma.TaskUpdateManyMutationInput = {
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.assignmentType !== undefined ? { assignmentType: dto.assignmentType } : {}),
      ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
      ...(dto.agentId !== undefined ? { agentId: dto.agentId } : {}),
      ...(dto.phaseId !== undefined ? { phaseId: dto.phaseId } : {}),
      ...(dto.status === TaskStatus.DONE ? { completedAt: new Date() } : {}),
      ...(dto.status !== undefined && dto.status !== TaskStatus.DONE ? { completedAt: null } : {}),
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.task.updateMany({
        where: { id: { in: dto.ids }, workspaceId, deletedAt: null },
        data: updateData,
      })

      if (dto.status === TaskStatus.IN_PROGRESS) {
        await tx.task.updateMany({
          where: { id: { in: dto.ids }, workspaceId, deletedAt: null, startedAt: null },
          data: { startedAt: new Date() },
        })
      }

      const activities = existingTasks.map((t) => ({
        taskId: t.id,
        userId: actorId,
        type: statusProvided && dto.status !== t.status ? TaskActivityType.STATUS_CHANGED : TaskActivityType.UPDATED,
        data: statusProvided ? { from: t.status, to: dto.status } : { bulk: true },
      }))

      await tx.taskActivity.createMany({
        data: activities,
      })

      return updated
    })

    if (statusProvided) {
      await this.eventPublisher.publish(
        EventTypes.PM_TASK_STATUS_CHANGED,
        { taskIds: dto.ids, to: dto.status },
        { tenantId: workspaceId, userId: actorId, source: 'api' },
      )
    } else {
      await this.eventPublisher.publish(
        EventTypes.PM_TASK_UPDATED,
        { taskIds: dto.ids },
        { tenantId: workspaceId, userId: actorId, source: 'api' },
      )
    }

    return { data: { count: result.count } }
  }

  async softDelete(workspaceId: string, actorId: string, id: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, workspaceId, deletedAt: null },
      select: { id: true, projectId: true, phaseId: true },
    })
    if (!existing) throw new NotFoundException('Task not found')

    const task = await this.prisma.task.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_DELETED,
      { taskId: existing.id, projectId: existing.projectId, phaseId: existing.phaseId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: task }
  }
}
