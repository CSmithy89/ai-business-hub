import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, TaskActivityType, TaskRelationType, TaskStatus } from '@prisma/client'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { BulkUpdateTasksDto } from './dto/bulk-update-tasks.dto'
import { CreateTaskAttachmentDto } from './dto/create-task-attachment.dto'
import { CreateTaskCommentDto } from './dto/create-task-comment.dto'
import { CreateTaskRelationDto } from './dto/create-task-relation.dto'
import { CreateTaskDto } from './dto/create-task.dto'
import { ListTasksQueryDto } from './dto/list-tasks.query.dto'
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { UpsertTaskLabelDto } from './dto/upsert-task-label.dto'

const RELATION_INVERSE: Record<TaskRelationType, TaskRelationType> = {
  BLOCKS: TaskRelationType.BLOCKED_BY,
  BLOCKED_BY: TaskRelationType.BLOCKS,
  DUPLICATES: TaskRelationType.DUPLICATED_BY,
  DUPLICATED_BY: TaskRelationType.DUPLICATES,
  RELATES_TO: TaskRelationType.RELATES_TO,
  DEPENDS_ON: TaskRelationType.DEPENDENCY_OF,
  DEPENDENCY_OF: TaskRelationType.DEPENDS_ON,
  PARENT_OF: TaskRelationType.CHILD_OF,
  CHILD_OF: TaskRelationType.PARENT_OF,
}

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

  async create(workspaceId: string, actorId: string, dto: CreateTaskDto, correlationId?: string) {
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
      {
        id: created.id,
        taskId: created.id,
        projectId: created.projectId,
        phaseId: created.phaseId,
        taskNumber: created.taskNumber,
        title: created.title,
        description: created.description,
        type: created.type,
        priority: created.priority,
        status: created.status,
        assigneeId: created.assigneeId,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        correlationId,
      },
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
      ...(query.label
        ? {
            labels: {
              some: {
                name: { equals: query.label, mode: 'insensitive' },
              },
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              // Also search by task number for numeric queries (e.g., #123)
              ...(/^\d+$/.test(query.search)
                ? [{ taskNumber: parseInt(query.search, 10) }]
                : []),
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
        relations: {
          where: { targetTask: { deletedAt: null } },
          include: {
            targetTask: {
              select: { id: true, taskNumber: true, title: true, status: true, type: true, priority: true },
            },
          },
          orderBy: [{ relationType: 'asc' }, { createdAt: 'desc' }],
        },
        relatedTo: {
          where: { sourceTask: { deletedAt: null } },
          include: {
            sourceTask: {
              select: { id: true, taskNumber: true, title: true, status: true, type: true, priority: true },
            },
          },
          orderBy: [{ relationType: 'asc' }, { createdAt: 'desc' }],
        },
        labels: {
          orderBy: { name: 'asc' },
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' },
        },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
        },
        externalLinks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!task) throw new NotFoundException('Task not found')

    const childTotal = task.children.length
    const childDone = task.children.filter((c) => c.status === TaskStatus.DONE).length
    const completionPercent = childTotal === 0 ? 0 : Math.round((childDone / childTotal) * 100)

    const isBlocked = task.relations.some((r) => r.relationType === TaskRelationType.BLOCKED_BY)
      ? true
      : task.relatedTo.some((r) => r.relationType === TaskRelationType.BLOCKS)

    return {
      data: { ...task, subtasks: { total: childTotal, done: childDone, completionPercent }, isBlocked },
    }
  }

  async createRelation(workspaceId: string, actorId: string, taskId: string, dto: CreateTaskRelationDto) {
    if (taskId === dto.targetTaskId) throw new BadRequestException('targetTaskId cannot be the same as taskId')

    const allowed: Set<TaskRelationType> = new Set([
      TaskRelationType.BLOCKS,
      TaskRelationType.BLOCKED_BY,
      TaskRelationType.RELATES_TO,
      TaskRelationType.DUPLICATES,
      TaskRelationType.DUPLICATED_BY,
    ])

    if (!allowed.has(dto.relationType)) {
      throw new BadRequestException('relationType is not supported')
    }

    const inverseType = RELATION_INVERSE[dto.relationType] ?? dto.relationType

    const created = await this.prisma.$transaction(async (tx) => {
      const source = await tx.task.findFirst({
        where: { id: taskId, workspaceId, deletedAt: null },
        select: { id: true, projectId: true, phaseId: true },
      })
      if (!source) throw new NotFoundException('Task not found')

      const target = await tx.task.findFirst({
        where: { id: dto.targetTaskId, workspaceId, deletedAt: null },
        select: { id: true, projectId: true, phaseId: true },
      })
      if (!target) throw new BadRequestException('targetTaskId is not a valid task')
      if (target.projectId !== source.projectId) throw new BadRequestException('targetTaskId must be in the same project')

      await tx.taskRelation.createMany({
        data: [
          {
            sourceTaskId: source.id,
            targetTaskId: target.id,
            relationType: dto.relationType,
            createdBy: actorId,
          },
          {
            sourceTaskId: target.id,
            targetTaskId: source.id,
            relationType: inverseType,
            createdBy: actorId,
          },
        ],
        skipDuplicates: true,
      })

      await tx.taskActivity.createMany({
        data: [
          {
            taskId: source.id,
            userId: actorId,
            type: TaskActivityType.RELATION_ADDED,
            data: { targetTaskId: target.id, relationType: dto.relationType },
          },
          {
            taskId: target.id,
            userId: actorId,
            type: TaskActivityType.RELATION_ADDED,
            data: { targetTaskId: source.id, relationType: inverseType },
          },
        ],
      })

      const updated = await tx.task.findFirst({
        where: { id: source.id, workspaceId, deletedAt: null },
        include: {
          parent: { select: { id: true, parentId: true, taskNumber: true, title: true } },
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
          relations: {
            where: { targetTask: { deletedAt: null } },
            include: {
              targetTask: {
                select: { id: true, taskNumber: true, title: true, status: true, type: true, priority: true },
              },
            },
            orderBy: [{ relationType: 'asc' }, { createdAt: 'desc' }],
          },
          relatedTo: {
            where: { sourceTask: { deletedAt: null } },
            include: {
              sourceTask: {
                select: { id: true, taskNumber: true, title: true, status: true, type: true, priority: true },
              },
            },
            orderBy: [{ relationType: 'asc' }, { createdAt: 'desc' }],
          },
          labels: true,
          attachments: true,
          comments: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
          activities: { orderBy: { createdAt: 'desc' } },
        },
      })
      if (!updated) throw new NotFoundException('Task not found')

      const childTotal = updated.children.length
      const childDone = updated.children.filter((c) => c.status === TaskStatus.DONE).length
      const completionPercent = childTotal === 0 ? 0 : Math.round((childDone / childTotal) * 100)

      const isBlocked = updated.relations.some((r) => r.relationType === TaskRelationType.BLOCKED_BY)
        ? true
        : updated.relatedTo.some((r) => r.relationType === TaskRelationType.BLOCKS)

      return { ...updated, subtasks: { total: childTotal, done: childDone, completionPercent }, isBlocked }
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      { taskId: taskId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )
    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      { taskId: dto.targetTaskId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: created }
  }

  async deleteRelation(workspaceId: string, actorId: string, taskId: string, relationId: string) {
    const deleted = await this.prisma.$transaction(async (tx) => {
      const relation = await tx.taskRelation.findFirst({
        where: { id: relationId, sourceTaskId: taskId, sourceTask: { workspaceId, deletedAt: null } },
        select: { id: true, sourceTaskId: true, targetTaskId: true, relationType: true },
      })
      if (!relation) throw new NotFoundException('Relation not found')

      const inverseType = RELATION_INVERSE[relation.relationType] ?? relation.relationType

      await tx.taskRelation.deleteMany({
        where: {
          OR: [
            { sourceTaskId: relation.sourceTaskId, targetTaskId: relation.targetTaskId, relationType: relation.relationType },
            { sourceTaskId: relation.targetTaskId, targetTaskId: relation.sourceTaskId, relationType: inverseType },
          ],
        },
      })

      await tx.taskActivity.createMany({
        data: [
          {
            taskId: relation.sourceTaskId,
            userId: actorId,
            type: TaskActivityType.RELATION_REMOVED,
            data: { targetTaskId: relation.targetTaskId, relationType: relation.relationType },
          },
          {
            taskId: relation.targetTaskId,
            userId: actorId,
            type: TaskActivityType.RELATION_REMOVED,
            data: { targetTaskId: relation.sourceTaskId, relationType: inverseType },
          },
        ],
      })

      const updated = await tx.task.findFirst({
        where: { id: relation.sourceTaskId, workspaceId, deletedAt: null },
        include: {
          parent: { select: { id: true, parentId: true, taskNumber: true, title: true } },
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
          relations: {
            where: { targetTask: { deletedAt: null } },
            include: {
              targetTask: {
                select: { id: true, taskNumber: true, title: true, status: true, type: true, priority: true },
              },
            },
            orderBy: [{ relationType: 'asc' }, { createdAt: 'desc' }],
          },
          relatedTo: {
            where: { sourceTask: { deletedAt: null } },
            include: {
              sourceTask: {
                select: { id: true, taskNumber: true, title: true, status: true, type: true, priority: true },
              },
            },
            orderBy: [{ relationType: 'asc' }, { createdAt: 'desc' }],
          },
          labels: true,
          attachments: true,
          comments: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
          activities: { orderBy: { createdAt: 'desc' } },
        },
      })
      if (!updated) throw new NotFoundException('Task not found')

      const childTotal = updated.children.length
      const childDone = updated.children.filter((c) => c.status === TaskStatus.DONE).length
      const completionPercent = childTotal === 0 ? 0 : Math.round((childDone / childTotal) * 100)

      const isBlocked = updated.relations.some((r) => r.relationType === TaskRelationType.BLOCKED_BY)
        ? true
        : updated.relatedTo.some((r) => r.relationType === TaskRelationType.BLOCKS)

      return { ...updated, subtasks: { total: childTotal, done: childDone, completionPercent }, isBlocked }
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      { taskId: taskId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: deleted }
  }

  async createComment(workspaceId: string, actorId: string, taskId: string, dto: CreateTaskCommentDto) {
    const trimmed = dto.content.trim()
    if (!trimmed) throw new BadRequestException('content cannot be empty')

    await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, workspaceId, deletedAt: null },
        select: { id: true, projectId: true },
      })
      if (!task) throw new NotFoundException('Task not found')

      const parentId = dto.parentId ?? null
      if (parentId) {
        const parent = await tx.taskComment.findFirst({
          where: { id: parentId, taskId, deletedAt: null },
          select: { id: true },
        })
        if (!parent) throw new BadRequestException('parentId is not a valid comment for this task')
      }

      const comment = await tx.taskComment.create({
        data: {
          taskId,
          userId: actorId,
          content: trimmed,
          parentId,
        },
        select: { id: true },
      })

      await tx.taskActivity.create({
        data: {
          taskId,
          userId: actorId,
          type: TaskActivityType.COMMENTED,
          data: { commentId: comment.id, parentId },
        },
      })
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      { taskId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return this.getById(workspaceId, taskId)
  }

  async updateComment(
    workspaceId: string,
    actorId: string,
    taskId: string,
    commentId: string,
    dto: UpdateTaskCommentDto,
  ) {
    const trimmed = dto.content.trim()
    if (!trimmed) throw new BadRequestException('content cannot be empty')

    await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, workspaceId, deletedAt: null },
        select: { id: true },
      })
      if (!task) throw new NotFoundException('Task not found')

      const existing = await tx.taskComment.findFirst({
        where: { id: commentId, taskId, deletedAt: null },
        select: { id: true, userId: true, content: true },
      })
      if (!existing) throw new NotFoundException('Comment not found')
      if (existing.userId !== actorId) throw new ForbiddenException('Only the comment author can edit this comment')

      if (existing.content !== trimmed) {
        await tx.taskComment.update({
          where: { id: existing.id },
          data: { content: trimmed },
        })
      }

      await tx.taskActivity.create({
        data: {
          taskId,
          userId: actorId,
          type: TaskActivityType.UPDATED,
          data: { commentId, action: 'comment_updated' },
        },
      })
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      { taskId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return this.getById(workspaceId, taskId)
  }

  async deleteComment(workspaceId: string, actorId: string, taskId: string, commentId: string) {
    await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, workspaceId, deletedAt: null },
        select: { id: true },
      })
      if (!task) throw new NotFoundException('Task not found')

      const existing = await tx.taskComment.findFirst({
        where: { id: commentId, taskId, deletedAt: null },
        select: { id: true, userId: true },
      })
      if (!existing) throw new NotFoundException('Comment not found')
      if (existing.userId !== actorId) throw new ForbiddenException('Only the comment author can delete this comment')

      await tx.taskComment.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      })

      await tx.taskActivity.create({
        data: {
          taskId,
          userId: actorId,
          type: TaskActivityType.UPDATED,
          data: { commentId, action: 'comment_deleted' },
        },
      })
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      { taskId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return this.getById(workspaceId, taskId)
  }

  async createAttachment(workspaceId: string, actorId: string, taskId: string, dto: CreateTaskAttachmentDto) {
    await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, workspaceId, deletedAt: null },
        select: { id: true },
      })
      if (!task) throw new NotFoundException('Task not found')

      const attachment = await tx.taskAttachment.create({
        data: {
          taskId,
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          fileType: dto.fileType,
          fileSize: dto.fileSize,
          uploadedBy: actorId,
        },
        select: { id: true },
      })

      await tx.taskActivity.create({
        data: {
          taskId,
          userId: actorId,
          type: TaskActivityType.ATTACHMENT_ADDED,
          data: { attachmentId: attachment.id, fileName: dto.fileName, fileUrl: dto.fileUrl },
        },
      })
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      { taskId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return this.getById(workspaceId, taskId)
  }

  async deleteAttachment(workspaceId: string, actorId: string, taskId: string, attachmentId: string) {
    await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, workspaceId, deletedAt: null },
        select: { id: true },
      })
      if (!task) throw new NotFoundException('Task not found')

      const attachment = await tx.taskAttachment.findFirst({
        where: { id: attachmentId, taskId },
        select: { id: true, fileName: true, fileUrl: true },
      })
      if (!attachment) throw new NotFoundException('Attachment not found')

      await tx.taskAttachment.delete({ where: { id: attachment.id } })

      await tx.taskActivity.create({
        data: {
          taskId,
          userId: actorId,
          type: TaskActivityType.ATTACHMENT_REMOVED,
          data: { attachmentId: attachment.id, fileName: attachment.fileName, fileUrl: attachment.fileUrl },
        },
      })
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      { taskId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return this.getById(workspaceId, taskId)
  }

  async upsertLabel(workspaceId: string, actorId: string, taskId: string, dto: UpsertTaskLabelDto) {
    const trimmed = dto.name.trim()
    if (!trimmed) throw new BadRequestException('name cannot be empty')

    await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, workspaceId, deletedAt: null },
        select: { id: true },
      })
      if (!task) throw new NotFoundException('Task not found')

      const existing = await tx.taskLabel.findFirst({
        where: { taskId, name: { equals: trimmed, mode: 'insensitive' } },
        select: { id: true, color: true },
      })

      if (existing) {
        if (dto.color && dto.color !== existing.color) {
          await tx.taskLabel.update({ where: { id: existing.id }, data: { color: dto.color } })
        }
        return
      }

      await tx.taskLabel.create({
        data: { taskId, name: trimmed, color: dto.color ?? undefined },
        select: { id: true },
      })

      await tx.taskActivity.create({
        data: {
          taskId,
          userId: actorId,
          type: TaskActivityType.LABEL_ADDED,
          data: { name: trimmed, color: dto.color ?? null },
        },
      })
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      { taskId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return this.getById(workspaceId, taskId)
  }

  async deleteLabel(workspaceId: string, actorId: string, taskId: string, labelId: string) {
    await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, workspaceId, deletedAt: null },
        select: { id: true },
      })
      if (!task) throw new NotFoundException('Task not found')

      const existing = await tx.taskLabel.findFirst({
        where: { id: labelId, taskId },
        select: { id: true, name: true, color: true },
      })
      if (!existing) throw new NotFoundException('Label not found')

      await tx.taskLabel.delete({ where: { id: existing.id } })

      await tx.taskActivity.create({
        data: {
          taskId,
          userId: actorId,
          type: TaskActivityType.LABEL_REMOVED,
          data: { name: existing.name, color: existing.color },
        },
      })
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      { taskId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return this.getById(workspaceId, taskId)
  }

  async update(workspaceId: string, actorId: string, id: string, dto: UpdateTaskDto, correlationId?: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, workspaceId, deletedAt: null },
      select: { id: true, projectId: true, phaseId: true, status: true, startedAt: true, completedAt: true, taskNumber: true, title: true },
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
        {
          id: updated.id,
          taskId: updated.id,
          projectId: updated.projectId,
          phaseId: updated.phaseId,
          taskNumber: existing.taskNumber,
          title: dto.title ?? existing.title,
          from: existing.status,
          to: nextStatus,
          toStatus: nextStatus,
          status: nextStatus,
          correlationId,
        },
        { tenantId: workspaceId, userId: actorId, source: 'api' },
      )
    }

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_UPDATED,
      {
        id: updated.id,
        taskId: updated.id,
        projectId: updated.projectId,
        phaseId: updated.phaseId,
        taskNumber: existing.taskNumber,
        title: dto.title ?? existing.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority,
        status: dto.status,
        assigneeId: dto.assigneeId,
        agentId: dto.agentId,
        assignmentType: dto.assignmentType,
        dueDate: dto.dueDate,
        updatedAt: updated.updatedAt.toISOString(),
        correlationId,
      },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: updated }
  }

  async bulkUpdate(workspaceId: string, actorId: string, dto: BulkUpdateTasksDto, correlationId?: string) {
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
      const tasksBeforeUpdate = await tx.task.findMany({
        where: { id: { in: dto.ids }, workspaceId, deletedAt: null },
        select: { id: true, status: true },
      })
      if (tasksBeforeUpdate.length === 0) {
        throw new NotFoundException('No tasks found')
      }

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

      const activities = tasksBeforeUpdate.map((t) => ({
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
        { taskIds: dto.ids, to: dto.status, correlationId },
        { tenantId: workspaceId, userId: actorId, source: 'api' },
      )
    } else {
      await this.eventPublisher.publish(
        EventTypes.PM_TASK_UPDATED,
        { taskIds: dto.ids, correlationId },
        { tenantId: workspaceId, userId: actorId, source: 'api' },
      )
    }

    return { data: { count: result.count } }
  }

  async softDelete(workspaceId: string, actorId: string, id: string, correlationId?: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, workspaceId, deletedAt: null },
      select: { id: true, projectId: true, phaseId: true, taskNumber: true, title: true },
    })
    if (!existing) throw new NotFoundException('Task not found')

    const task = await this.prisma.task.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    })

    await this.eventPublisher.publish(
      EventTypes.PM_TASK_DELETED,
      { taskId: existing.id, projectId: existing.projectId, phaseId: existing.phaseId, taskNumber: existing.taskNumber, title: existing.title, correlationId },
      { tenantId: workspaceId, userId: actorId, source: 'api' },
    )

    return { data: task }
  }

  /**
   * Get unique label names for a project (for autocomplete)
   * Returns distinct label names used across all tasks in the project
   * Optimized query: fetches task IDs first to avoid N+1 on the task relation
   */
  async getProjectLabels(
    workspaceId: string,
    projectId: string,
    search?: string,
    limit = 50,
    offset = 0,
  ) {
    // Verify project belongs to workspace
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    })
    if (!project) throw new NotFoundException('Project not found')

    // Build where clause using subquery pattern to avoid N+1
    // This filters labels by task properties in a single query
    const whereClause = {
      task: {
        projectId,
        workspaceId,
        deletedAt: null,
      },
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    }

    // Get total count for pagination (count distinct label names)
    const totalCount = await this.prisma.taskLabel.groupBy({
      by: ['name'],
      where: whereClause,
    })

    // Get distinct labels with pagination
    const labels = await this.prisma.taskLabel.findMany({
      where: whereClause,
      select: {
        name: true,
        color: true,
      },
      distinct: ['name'],
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    })

    return {
      data: labels,
      total: totalCount.length,
      limit,
      offset,
    }
  }
}
