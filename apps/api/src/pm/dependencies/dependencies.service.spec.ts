import { Test } from '@nestjs/testing'
import { DependenciesService } from './dependencies.service'
import { PrismaService } from '../../common/services/prisma.service'

type PrismaMock = {
  taskRelation: { findMany: jest.Mock }
  project: { findMany: jest.Mock }
}

describe('DependenciesService', () => {
  let service: DependenciesService
  let prisma: PrismaMock

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DependenciesService,
        {
          provide: PrismaService,
          useValue: {
            taskRelation: { findMany: jest.fn() },
            project: { findMany: jest.fn() },
          },
        },
      ],
    }).compile()

    service = moduleRef.get(DependenciesService)
    prisma = moduleRef.get(PrismaService) as unknown as PrismaMock
  })

  it('filters relations by workspaceId on both source and target tasks', async () => {
    prisma.taskRelation.findMany.mockResolvedValueOnce([])

    await service.list('ws-1', {})

    expect(prisma.taskRelation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { sourceTask: { workspaceId: 'ws-1', deletedAt: null } },
            { targetTask: { workspaceId: 'ws-1', deletedAt: null } },
          ]),
        }),
      }),
    )
  })

  it('filters to cross-project relations and excludes null projectIds', async () => {
    prisma.taskRelation.findMany.mockResolvedValueOnce([
      {
        id: 'rel-1',
        relationType: 'BLOCKS',
        createdAt: new Date('2025-01-01'),
        sourceTask: { id: 'task-1', taskNumber: 1, title: 'A', projectId: 'proj-1' },
        targetTask: { id: 'task-2', taskNumber: 2, title: 'B', projectId: 'proj-2' },
      },
      {
        id: 'rel-2',
        relationType: 'BLOCKS',
        createdAt: new Date('2025-01-02'),
        sourceTask: { id: 'task-3', taskNumber: 3, title: 'C', projectId: 'proj-1' },
        targetTask: { id: 'task-4', taskNumber: 4, title: 'D', projectId: 'proj-1' },
      },
      {
        id: 'rel-3',
        relationType: 'BLOCKS',
        createdAt: new Date('2025-01-03'),
        sourceTask: { id: 'task-5', taskNumber: 5, title: 'E', projectId: null },
        targetTask: { id: 'task-6', taskNumber: 6, title: 'F', projectId: 'proj-2' },
      },
    ])

    prisma.project.findMany.mockResolvedValueOnce([
      { id: 'proj-1', slug: 'alpha', name: 'Alpha' },
      { id: 'proj-2', slug: 'beta', name: 'Beta' },
    ])

    const result = await service.list('ws-1', {})

    expect(result.data.total).toBe(1)
    expect(result.data.relations).toHaveLength(1)
    expect(result.data.relations[0].id).toBe('rel-1')
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['proj-1', 'proj-2'] }, workspaceId: 'ws-1' },
      }),
    )
  })
})
