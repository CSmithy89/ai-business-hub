import { Test } from '@nestjs/testing'
import { PhaseStatus } from '@prisma/client'
import { EventPublisherService } from '../../events'
import { PrismaService } from '../../common/services/prisma.service'
import { PhasesService } from './phases.service'

type PrismaMock = {
  project: {
    findFirst: jest.Mock
  }
  phase: {
    create: jest.Mock
    findMany: jest.Mock
    findFirst: jest.Mock
    update: jest.Mock
  }
  $transaction: jest.Mock
}

describe('PhasesService', () => {
  let service: PhasesService
  let prisma: PrismaMock
  let eventPublisher: { publish: jest.Mock }

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PhasesService,
        {
          provide: PrismaService,
          useValue: {
            project: { findFirst: jest.fn() },
            phase: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
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

    service = moduleRef.get(PhasesService)
    prisma = moduleRef.get(PrismaService) as unknown as PrismaMock
    eventPublisher = moduleRef.get(EventPublisherService) as unknown as { publish: jest.Mock }
  })

  it('creates phase for an existing project (workspace-scoped)', async () => {
    prisma.project.findFirst.mockResolvedValueOnce({ id: 'proj-1' })
    prisma.phase.create.mockResolvedValueOnce({ id: 'phase-1', projectId: 'proj-1', status: PhaseStatus.UPCOMING, phaseNumber: 1 })

    const result = await service.create('ws-1', 'user-1', 'proj-1', { name: 'Phase 1', phaseNumber: 1 })

    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'proj-1', workspaceId: 'ws-1' }) }),
    )
    expect(prisma.phase.create).toHaveBeenCalled()
    expect(eventPublisher.publish).toHaveBeenCalled()
    expect(result.data.id).toBe('phase-1')
  })

  it('rejects invalid transition UPCOMING -> COMPLETED', async () => {
    prisma.phase.findFirst.mockResolvedValueOnce({
      id: 'phase-1',
      status: PhaseStatus.UPCOMING,
      projectId: 'proj-1',
      phaseNumber: 1,
    })

    await expect(
      service.update('ws-1', 'user-1', 'phase-1', { status: PhaseStatus.COMPLETED }),
    ).rejects.toThrow('Invalid phase transition')
  })

  it('when setting CURRENT, completes existing CURRENT phase in same project', async () => {
    prisma.phase.findFirst.mockResolvedValueOnce({
      id: 'phase-2',
      status: PhaseStatus.UPCOMING,
      projectId: 'proj-1',
      phaseNumber: 2,
    })

    prisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        phase: {
          findFirst: jest.fn().mockResolvedValueOnce({ id: 'phase-1', status: PhaseStatus.CURRENT }),
          update: jest
            .fn()
            // complete old current
            .mockResolvedValueOnce({ id: 'phase-1', status: PhaseStatus.COMPLETED })
            // update target phase to current
            .mockResolvedValueOnce({ id: 'phase-2', projectId: 'proj-1', status: PhaseStatus.CURRENT, phaseNumber: 2 }),
        },
      }),
    )

    const result = await service.update('ws-1', 'user-1', 'phase-2', { status: PhaseStatus.CURRENT })

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(eventPublisher.publish).toHaveBeenCalled()
    expect(result.data.status).toBe(PhaseStatus.CURRENT)
  })
})
