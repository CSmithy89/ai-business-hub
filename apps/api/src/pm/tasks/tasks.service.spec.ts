import { Test } from '@nestjs/testing'
import { TaskStatus } from '@prisma/client'
import { EventPublisherService } from '../../events'
import { PrismaService } from '../../common/services/prisma.service'
import { TasksService } from './tasks.service'

type PrismaMock = {
  project: { findFirst: jest.Mock }
  phase: { findFirst: jest.Mock }
  task: {
    findFirst: jest.Mock
    findMany: jest.Mock
    create: jest.Mock
    count: jest.Mock
    update: jest.Mock
    updateMany: jest.Mock
  }
  taskActivity: { create: jest.Mock; createMany: jest.Mock }
  $transaction: jest.Mock
}

describe('TasksService', () => {
  let service: TasksService
  let prisma: PrismaMock
  let eventPublisher: { publish: jest.Mock }

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: {
            project: { findFirst: jest.fn() },
            phase: { findFirst: jest.fn() },
            task: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            taskActivity: { create: jest.fn(), createMany: jest.fn() },
            $transaction: jest.fn(),
          },
        },
        {
          provide: EventPublisherService,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile()

    service = moduleRef.get(TasksService)
    prisma = moduleRef.get(PrismaService) as unknown as PrismaMock
    eventPublisher = moduleRef.get(EventPublisherService) as unknown as { publish: jest.Mock }
  })

  it('creates a task with the next sequential taskNumber per project', async () => {
    prisma.project.findFirst.mockResolvedValueOnce({ id: 'proj-1' })
    prisma.phase.findFirst.mockResolvedValueOnce({ id: 'phase-1' })

    const taskFindFirst = jest.fn().mockResolvedValueOnce({ taskNumber: 7 })
    const taskCreate = jest.fn().mockResolvedValueOnce({
      id: 'task-1',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      phaseId: 'phase-1',
      taskNumber: 8,
      title: 'Test',
      status: TaskStatus.BACKLOG,
    })
    const activityCreate = jest.fn().mockResolvedValueOnce({ id: 'act-1' })

    prisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        task: { findFirst: taskFindFirst, create: taskCreate },
        taskActivity: { create: activityCreate },
      }),
    )

    const result = await service.create('ws-1', 'user-1', {
      projectId: 'proj-1',
      phaseId: 'phase-1',
      title: 'Test',
    })

    expect(taskFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'proj-1' },
        orderBy: { taskNumber: 'desc' },
        select: { taskNumber: true },
      }),
    )
    expect(taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          phaseId: 'phase-1',
          taskNumber: 8,
          createdBy: 'user-1',
        }),
      }),
    )
    expect(activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: 'task-1',
          userId: 'user-1',
        }),
      }),
    )
    expect(eventPublisher.publish).toHaveBeenCalled()
    expect(result.data.taskNumber).toBe(8)
  })

  it('creates a subtask when parentId is provided', async () => {
    prisma.project.findFirst.mockResolvedValueOnce({ id: 'proj-1' })
    prisma.phase.findFirst.mockResolvedValueOnce({ id: 'phase-1' })
    prisma.task.findFirst.mockResolvedValueOnce({ id: 'task-parent', projectId: 'proj-1', parentId: null })

    const taskFindFirst = jest.fn().mockResolvedValueOnce({ taskNumber: 1 })
    const taskCreate = jest.fn().mockResolvedValueOnce({
      id: 'task-2',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      phaseId: 'phase-1',
      taskNumber: 2,
      title: 'Child',
      parentId: 'task-parent',
      status: TaskStatus.BACKLOG,
    })
    const activityCreate = jest.fn().mockResolvedValueOnce({ id: 'act-1' })

    prisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        task: { findFirst: taskFindFirst, create: taskCreate },
        taskActivity: { create: activityCreate },
      }),
    )

    const result = await service.create('ws-1', 'user-1', {
      projectId: 'proj-1',
      phaseId: 'phase-1',
      title: 'Child',
      parentId: 'task-parent',
    })

    expect(taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parentId: 'task-parent',
        }),
      }),
    )
    expect(result.data.parentId).toBe('task-parent')
  })

  it('rejects creating a task deeper than 3 levels', async () => {
    prisma.project.findFirst.mockResolvedValueOnce({ id: 'proj-1' })
    prisma.phase.findFirst.mockResolvedValueOnce({ id: 'phase-1' })

    // Parent has a parentId, and that parent also has a parentId => too deep
    prisma.task.findFirst.mockResolvedValueOnce({ id: 'task-parent', projectId: 'proj-1', parentId: 'task-pp' })
    prisma.task.findFirst.mockResolvedValueOnce({ id: 'task-pp', parentId: 'task-ppp' })

    await expect(
      service.create('ws-1', 'user-1', {
        projectId: 'proj-1',
        phaseId: 'phase-1',
        title: 'Too deep',
        parentId: 'task-parent',
      }),
    ).rejects.toThrow('Task hierarchy supports a maximum of 3 levels')
  })

  it('sets startedAt when moving into IN_PROGRESS for the first time', async () => {
    prisma.task.findFirst.mockResolvedValueOnce({
      id: 'task-1',
      projectId: 'proj-1',
      phaseId: 'phase-1',
      status: TaskStatus.TODO,
      startedAt: null,
      completedAt: null,
    })

    const taskUpdate = jest.fn().mockResolvedValueOnce({
      id: 'task-1',
      projectId: 'proj-1',
      phaseId: 'phase-1',
      status: TaskStatus.IN_PROGRESS,
    })
    const activityCreate = jest.fn().mockResolvedValueOnce({ id: 'act-1' })

    prisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        task: { update: taskUpdate },
        taskActivity: { create: activityCreate },
      }),
    )

    await service.update('ws-1', 'user-1', 'task-1', { status: TaskStatus.IN_PROGRESS })

    expect(taskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: expect.objectContaining({
          status: TaskStatus.IN_PROGRESS,
          startedAt: expect.any(Date),
        }),
      }),
    )
  })

  it('sets completedAt when moving into DONE', async () => {
    prisma.task.findFirst.mockResolvedValueOnce({
      id: 'task-1',
      projectId: 'proj-1',
      phaseId: 'phase-1',
      status: TaskStatus.IN_PROGRESS,
      startedAt: new Date('2025-01-01T00:00:00.000Z'),
      completedAt: null,
    })

    const taskUpdate = jest.fn().mockResolvedValueOnce({
      id: 'task-1',
      projectId: 'proj-1',
      phaseId: 'phase-1',
      status: TaskStatus.DONE,
    })
    const activityCreate = jest.fn().mockResolvedValueOnce({ id: 'act-1' })

    prisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        task: { update: taskUpdate },
        taskActivity: { create: activityCreate },
      }),
    )

    await service.update('ws-1', 'user-1', 'task-1', { status: TaskStatus.DONE })

    expect(taskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: expect.objectContaining({
          status: TaskStatus.DONE,
          completedAt: expect.any(Date),
        }),
      }),
    )
  })

  it('lists tasks scoped to workspaceId and excludes soft-deleted rows', async () => {
    prisma.task.count.mockResolvedValueOnce(1)
    prisma.task.findMany.mockResolvedValueOnce([{ id: 'task-1' }])
    prisma.$transaction.mockResolvedValueOnce([1, [{ id: 'task-1' }]])

    const result = await service.list('ws-1', { status: TaskStatus.BACKLOG })

    expect(prisma.task.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 'ws-1', deletedAt: null, status: TaskStatus.BACKLOG }),
      }),
    )
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 'ws-1', deletedAt: null, status: TaskStatus.BACKLOG }),
      }),
    )
    expect(result.meta.total).toBe(1)
  })

  it('bulk update uses workspace-scoped updateMany', async () => {
    prisma.task.findMany.mockResolvedValueOnce([
      { id: 'task-1', status: TaskStatus.BACKLOG, projectId: 'proj-1' },
      { id: 'task-2', status: TaskStatus.TODO, projectId: 'proj-1' },
    ])

    const updateMany = jest.fn().mockResolvedValueOnce({ count: 2 })
    const activityCreateMany = jest.fn().mockResolvedValueOnce({ count: 2 })

    prisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        task: { updateMany },
        taskActivity: { createMany: activityCreateMany },
      }),
    )

    const result = await service.bulkUpdate('ws-1', 'user-1', { ids: ['task-1', 'task-2'], status: TaskStatus.DONE })

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 'ws-1', deletedAt: null, id: { in: ['task-1', 'task-2'] } }),
      }),
    )
    expect(activityCreateMany).toHaveBeenCalled()
    expect(eventPublisher.publish).toHaveBeenCalled()
    expect(result.data.count).toBe(2)
  })
})
