import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { LinkingService } from './linking.service'

type PrismaMock = {
  knowledgePage: {
    findFirst: jest.Mock
  }
  project: {
    findFirst: jest.Mock
  }
  projectPage: {
    findUnique: jest.Mock
    updateMany: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }
  $transaction: jest.Mock
}

describe('LinkingService', () => {
  let service: LinkingService
  let prisma: PrismaMock
  let eventPublisher: { publish: jest.Mock }

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        LinkingService,
        {
          provide: PrismaService,
          useValue: {
            knowledgePage: { findFirst: jest.fn() },
            project: { findFirst: jest.fn() },
            projectPage: {
              findUnique: jest.fn(),
              updateMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: EventPublisherService,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile()

    service = moduleRef.get(LinkingService)
    prisma = moduleRef.get(PrismaService) as unknown as PrismaMock
    eventPublisher = moduleRef.get(EventPublisherService) as unknown as { publish: jest.Mock }
  })

  describe('linkPageToProject', () => {
    it('throws NotFoundException if page not found', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce(null)

      await expect(
        service.linkPageToProject('tenant-1', 'ws-1', 'page-1', 'user-1', {
          projectId: 'proj-1',
          isPrimary: true,
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('throws ConflictException when primary unique constraint is violated', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({ id: 'page-1', title: 't', slug: 's' })
      prisma.project.findFirst.mockResolvedValueOnce({ id: 'proj-1', name: 'p', slug: 'p' })
      prisma.projectPage.findUnique.mockResolvedValueOnce(null)

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '6.0.0',
      })
      prisma.$transaction.mockRejectedValueOnce(prismaError)

      await expect(
        service.linkPageToProject('tenant-1', 'ws-1', 'page-1', 'user-1', {
          projectId: 'proj-1',
          isPrimary: true,
        }),
      ).rejects.toThrow(ConflictException)
    })

    it('unsets existing primary before creating a new primary link', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({ id: 'page-1', title: 't', slug: 's' })
      prisma.project.findFirst.mockResolvedValueOnce({ id: 'proj-1', name: 'p', slug: 'p' })
      prisma.projectPage.findUnique.mockResolvedValueOnce(null)

      const updateMany = jest.fn().mockResolvedValueOnce({ count: 1 })
      const create = jest.fn().mockResolvedValueOnce({
        id: 'link-1',
        isPrimary: true,
        project: { id: 'proj-1', name: 'p', slug: 'p' },
        page: { id: 'page-1', title: 't', slug: 's' },
      })

      prisma.$transaction.mockImplementationOnce(async (fn: unknown) => {
        const tx = { projectPage: { updateMany, create } } as unknown
        return (fn as (tx: unknown) => unknown)(tx)
      })

      const result = await service.linkPageToProject('tenant-1', 'ws-1', 'page-1', 'user-1', {
        projectId: 'proj-1',
        isPrimary: true,
      })

      expect(updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1', isPrimary: true },
          data: { isPrimary: false },
        }),
      )
      expect(create).toHaveBeenCalled()
      expect(eventPublisher.publish).toHaveBeenCalled()
      expect(result.data.id).toBe('link-1')
    })
  })

  describe('updateLink', () => {
    it('throws ConflictException when primary unique constraint is violated', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({ id: 'page-1' })
      prisma.projectPage.findUnique.mockResolvedValueOnce({ id: 'link-1', isPrimary: false })

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '6.0.0',
      })
      prisma.$transaction.mockRejectedValueOnce(prismaError)

      await expect(
        service.updateLink('tenant-1', 'ws-1', 'page-1', 'proj-1', 'user-1', {
          isPrimary: true,
        }),
      ).rejects.toThrow(ConflictException)
    })
  })
})
