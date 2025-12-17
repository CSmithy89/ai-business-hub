import { ForbiddenException } from '@nestjs/common'
import { BmadPhaseType, PhaseStatus, TeamRole } from '@prisma/client'
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
    const projectCreate = jest.fn().mockResolvedValueOnce({
      id: 'proj-1',
      workspaceId: 'ws-1',
      businessId: 'biz-1',
      slug: 'my-project',
    })
    const teamCreate = jest.fn().mockResolvedValueOnce({
      id: 'team-1',
      projectId: 'proj-1',
      leadUserId: 'user-1',
    })
    prisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        project: {
          create: projectCreate,
        },
        projectTeam: {
          create: teamCreate,
        },
      }),
    )

    const result = await service.create('ws-1', 'user-1', {
      businessId: 'biz-1',
      name: 'My Project',
      workspaceId: 'ws-1',
    })

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(projectCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          businessId: 'biz-1',
          slug: 'my-project',
          name: 'My Project',
        }),
      }),
    )
    expect(teamCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'proj-1',
          leadUserId: 'user-1',
          members: {
            create: expect.objectContaining({
              userId: 'user-1',
              role: TeamRole.PROJECT_LEAD,
            }),
          },
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
    const projectCreate = jest.fn().mockResolvedValueOnce({
      id: 'proj-2',
      workspaceId: 'ws-1',
      businessId: 'biz-1',
      slug: 'my-project-2',
    })
    const teamCreate = jest.fn().mockResolvedValueOnce({
      id: 'team-2',
      projectId: 'proj-2',
      leadUserId: 'user-1',
    })
    prisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        project: {
          create: projectCreate,
        },
        projectTeam: {
          create: teamCreate,
        },
      }),
    )

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

  it('creates BMAD phases when a template is selected', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(null as any)
    const projectCreate = jest.fn().mockResolvedValueOnce({
      id: 'proj-3',
      workspaceId: 'ws-1',
      businessId: 'biz-1',
      slug: 'bmad-course',
    })
    const teamCreate = jest.fn().mockResolvedValueOnce({
      id: 'team-3',
      projectId: 'proj-3',
      leadUserId: 'user-1',
    })
    const phaseCreateMany = jest.fn().mockResolvedValueOnce({ count: 10 })

    prisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        project: { create: projectCreate },
        projectTeam: { create: teamCreate },
        phase: { createMany: phaseCreateMany },
      }),
    )

    await service.create('ws-1', 'user-1', {
      businessId: 'biz-1',
      name: 'BMAD Course',
      bmadTemplateId: 'bmad-course',
    })

    expect(phaseCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            projectId: 'proj-3',
            phaseNumber: 1,
            status: PhaseStatus.CURRENT,
            bmadPhase: BmadPhaseType.PHASE_1_BRIEF,
          }),
        ]),
      }),
    )
    expect(phaseCreateMany.mock.calls[0][0].data).toHaveLength(10)
  })

  it('creates a single Backlog phase for kanban-only template', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(null as any)
    const projectCreate = jest.fn().mockResolvedValueOnce({
      id: 'proj-4',
      workspaceId: 'ws-1',
      businessId: 'biz-1',
      slug: 'kanban-only',
    })
    const teamCreate = jest.fn().mockResolvedValueOnce({
      id: 'team-4',
      projectId: 'proj-4',
      leadUserId: 'user-1',
    })
    const phaseCreateMany = jest.fn().mockResolvedValueOnce({ count: 1 })

    prisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        project: { create: projectCreate },
        projectTeam: { create: teamCreate },
        phase: { createMany: phaseCreateMany },
      }),
    )

    await service.create('ws-1', 'user-1', {
      businessId: 'biz-1',
      name: 'Kanban',
      bmadTemplateId: 'kanban-only',
    })

    expect(phaseCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            projectId: 'proj-4',
            name: 'Backlog',
            phaseNumber: 1,
            status: PhaseStatus.CURRENT,
            bmadPhase: null,
          }),
        ],
      }),
    )
  })

  it('enforces project lead access for members', async () => {
    prisma.project.findFirst.mockResolvedValueOnce({
      team: { leadUserId: 'lead-1' },
    } as any)

    await expect(service.assertProjectLead('ws-1', 'member-1', 'proj-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    )
  })

  it('allows project lead access for lead user', async () => {
    prisma.project.findFirst.mockResolvedValueOnce({
      team: { leadUserId: 'lead-1' },
    } as any)

    await expect(service.assertProjectLead('ws-1', 'lead-1', 'proj-1')).resolves.toBeUndefined()
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
