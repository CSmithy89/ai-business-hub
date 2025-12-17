import { Test } from '@nestjs/testing'
import { EventPublisherService } from '../../events'
import { PrismaService } from '../../common/services/prisma.service'
import { ProjectsService } from './projects.service'

type PrismaMock = {
  project: {
    findUnique: jest.Mock
    findFirst: jest.Mock
    create: jest.Mock
    count: jest.Mock
    findMany: jest.Mock
    update: jest.Mock
  }
  $transaction: jest.Mock
}

describe('ProjectsService', () => {
  let service: ProjectsService
  let prisma: PrismaMock
  let eventPublisher: { publish: jest.Mock }

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: EventPublisherService,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile()

    service = moduleRef.get(ProjectsService)
    prisma = moduleRef.get(PrismaService) as unknown as PrismaMock
    eventPublisher = moduleRef.get(EventPublisherService) as unknown as { publish: jest.Mock }
  })

  it('creates a project scoped to workspaceId', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(null as any)
    prisma.project.create.mockResolvedValueOnce({
      id: 'proj-1',
      workspaceId: 'ws-1',
      businessId: 'biz-1',
      slug: 'my-project',
    } as any)

    const result = await service.create('ws-1', 'user-1', {
      businessId: 'biz-1',
      name: 'My Project',
      workspaceId: 'ws-1',
    })

    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          businessId: 'biz-1',
          slug: 'my-project',
        }),
      }),
    )
    expect(eventPublisher.publish).toHaveBeenCalled()
    expect(result.data.id).toBe('proj-1')
  })

  it('generates a unique slug on collision', async () => {
    prisma.project.findUnique
      .mockResolvedValueOnce({ id: 'existing-1' } as any)
      .mockResolvedValueOnce(null as any)
    prisma.project.create.mockResolvedValueOnce({
      id: 'proj-2',
      workspaceId: 'ws-1',
      businessId: 'biz-1',
      slug: 'my-project-2',
    } as any)

    const result = await service.create('ws-1', 'user-1', {
      businessId: 'biz-1',
      name: 'My Project',
    })

    expect(prisma.project.findUnique).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { workspaceId_slug: { workspaceId: 'ws-1', slug: 'my-project' } },
      }),
    )
    expect(prisma.project.findUnique).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { workspaceId_slug: { workspaceId: 'ws-1', slug: 'my-project-2' } },
      }),
    )
    expect(result.data.slug).toBe('my-project-2')
  })

  it('excludes soft-deleted projects from list', async () => {
    ;(prisma.$transaction as jest.Mock).mockResolvedValueOnce([
      1,
      [{ id: 'proj-1', deletedAt: null }],
    ])

    await service.list('ws-1', { page: 1, limit: 20 })

    expect(prisma.project.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 'ws-1', deletedAt: null }),
      }),
    )
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 'ws-1', deletedAt: null }),
      }),
    )
  })

  it('soft deletes by setting deletedAt', async () => {
    prisma.project.findFirst.mockResolvedValueOnce({
      id: 'proj-1',
      businessId: 'biz-1',
      slug: 'proj',
    } as any)
    prisma.project.update.mockResolvedValueOnce({ id: 'proj-1', deletedAt: new Date() } as any)

    const result = await service.softDelete('ws-1', 'user-1', 'proj-1')

    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'proj-1' },
        data: { deletedAt: expect.any(Date) },
      }),
    )
    expect(eventPublisher.publish).toHaveBeenCalled()
    expect(result.data.id).toBe('proj-1')
  })

  it('gets project by slug scoped to workspace', async () => {
    prisma.project.findFirst.mockResolvedValueOnce({
      id: 'proj-1',
      slug: 'my-project',
      workspaceId: 'ws-1',
      phases: [],
    })

    const result = await service.getBySlug('ws-1', 'my-project')

    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'my-project', workspaceId: 'ws-1', deletedAt: null },
      }),
    )
    expect(result.data.slug).toBe('my-project')
  })
})
