import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Prisma } from '@prisma/client'
import { EventPublisherService } from '../../events'
import { PrismaService } from '../../common/services/prisma.service'
import { PagesService } from './pages.service'
import { EmbeddingsService } from '../embeddings/embeddings.service'

type PrismaMock = {
  knowledgePage: {
    findUnique: jest.Mock
    findFirst: jest.Mock
    create: jest.Mock
    update: jest.Mock
    count: jest.Mock
    findMany: jest.Mock
  }
  pageVersion: {
    create: jest.Mock
  }
  pageActivity: {
    create: jest.Mock
    findMany: jest.Mock
  }
  $queryRaw: jest.Mock
  $transaction: jest.Mock
}

describe('PagesService', () => {
  let service: PagesService
  let prisma: PrismaMock
  let eventPublisher: { publish: jest.Mock }

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PagesService,
        {
          provide: PrismaService,
          useValue: {
            knowledgePage: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
            },
            pageVersion: {
              create: jest.fn(),
            },
            pageActivity: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            $queryRaw: jest.fn(),
            $transaction: jest.fn(),
          },
        },
        {
          provide: EventPublisherService,
          useValue: {
            publish: jest.fn(),
          },
        },
        {
          provide: EmbeddingsService,
          useValue: {
            enqueuePageEmbeddings: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: 'VersionsService',
          useValue: {
            createVersion: jest.fn(),
          },
        },
      ],
    }).compile()

    service = moduleRef.get(PagesService)
    prisma = moduleRef.get(PrismaService) as unknown as PrismaMock
    eventPublisher = moduleRef.get(EventPublisherService) as unknown as { publish: jest.Mock }
  })

  describe('create', () => {
    it('creates a page with unique slug', async () => {
      const pageCreate = jest.fn().mockResolvedValueOnce({
        id: 'page-1',
        workspaceId: 'ws-1',
        tenantId: 'tenant-1',
        slug: 'my-page',
        title: 'My Page',
        ownerId: 'user-1',
        parentId: null,
      })
      const versionCreate = jest.fn().mockResolvedValueOnce({ id: 'v-1' })
      const activityCreate = jest.fn().mockResolvedValueOnce({ id: 'a-1' })
      const findUnique = jest.fn().mockResolvedValueOnce(null)

      prisma.$transaction.mockImplementationOnce(async (fn: any) =>
        fn({
          knowledgePage: {
            findUnique,
            create: pageCreate,
          },
          pageVersion: {
            create: versionCreate,
          },
          pageActivity: {
            create: activityCreate,
          },
        }),
      )

      const result = await service.create('tenant-1', 'ws-1', 'user-1', {
        title: 'My Page',
      })

      expect(findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId_workspaceId_slug: { tenantId: 'tenant-1', workspaceId: 'ws-1', slug: 'my-page' } },
        }),
      )
      expect(pageCreate).toHaveBeenCalled()
      expect(versionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 1,
            changeNote: 'Initial version',
          }),
        }),
      )
      expect(eventPublisher.publish).toHaveBeenCalled()
      expect(result.data.id).toBe('page-1')
    })

    it('generates unique slug on collision', async () => {
      const pageCreate = jest.fn().mockResolvedValueOnce({
        id: 'page-1',
        slug: 'my-page-2',
      })
      const versionCreate = jest.fn().mockResolvedValueOnce({ id: 'v-1' })
      const activityCreate = jest.fn().mockResolvedValueOnce({ id: 'a-1' })
      const findUnique = jest.fn()
        .mockResolvedValueOnce({ id: 'existing' }) // First slug exists
        .mockResolvedValueOnce(null) // Second slug available

      prisma.$transaction.mockImplementationOnce(async (fn: any) =>
        fn({
          knowledgePage: {
            findUnique,
            create: pageCreate,
          },
          pageVersion: { create: versionCreate },
          pageActivity: { create: activityCreate },
        }),
      )

      await service.create('tenant-1', 'ws-1', 'user-1', {
        title: 'My Page',
      })

      expect(findUnique).toHaveBeenCalledTimes(2)
      expect(findUnique).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { tenantId_workspaceId_slug: { tenantId: 'tenant-1', workspaceId: 'ws-1', slug: 'my-page' } },
        }),
      )
      expect(findUnique).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: { tenantId_workspaceId_slug: { tenantId: 'tenant-1', workspaceId: 'ws-1', slug: 'my-page-2' } },
        }),
      )
    })

    it('retries on P2002 unique constraint violation', async () => {
      const pageCreate = jest.fn()
        .mockRejectedValueOnce(
          Object.assign(new Error('Unique constraint'), {
            code: 'P2002',
            meta: { target: ['slug'] },
            name: 'PrismaClientKnownRequestError',
          }),
        )
        .mockResolvedValueOnce({
          id: 'page-1',
          slug: 'my-page-2',
        })
      const versionCreate = jest.fn().mockResolvedValue({ id: 'v-1' })
      const activityCreate = jest.fn().mockResolvedValue({ id: 'a-1' })
      const findUnique = jest.fn().mockResolvedValue(null)

      let callCount = 0
      prisma.$transaction.mockImplementation(async (fn: any) => {
        callCount++
        const result = await fn({
          knowledgePage: {
            findUnique,
            create: pageCreate,
          },
          pageVersion: { create: versionCreate },
          pageActivity: { create: activityCreate },
        })
        return result
      })

      // Make the error look like a Prisma error
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        { code: 'P2002', meta: { target: ['slug'] }, clientVersion: '5.0.0' },
      )

      prisma.$transaction
        .mockRejectedValueOnce(prismaError)
        .mockImplementationOnce(async (fn: any) =>
          fn({
            knowledgePage: {
              findUnique,
              create: jest.fn().mockResolvedValueOnce({
                id: 'page-1',
                slug: 'my-page-2',
              }),
            },
            pageVersion: { create: versionCreate },
            pageActivity: { create: activityCreate },
          }),
        )

      const result = await service.create('tenant-1', 'ws-1', 'user-1', {
        title: 'My Page',
      })

      expect(prisma.$transaction).toHaveBeenCalledTimes(2)
      expect(result.data.id).toBe('page-1')
    })

    it('throws ConflictException after max retries', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        { code: 'P2002', meta: { target: ['slug'] }, clientVersion: '5.0.0' },
      )

      prisma.$transaction
        .mockRejectedValueOnce(prismaError)
        .mockRejectedValueOnce(prismaError)
        .mockRejectedValueOnce(prismaError)

      await expect(
        service.create('tenant-1', 'ws-1', 'user-1', { title: 'My Page' }),
      ).rejects.toThrow(ConflictException)

      expect(prisma.$transaction).toHaveBeenCalledTimes(3)
    })

    it('does not publish an event if the transaction fails', async () => {
      prisma.$transaction.mockRejectedValueOnce(new Error('transaction failed'))

      await expect(
        service.create('tenant-1', 'ws-1', 'user-1', { title: 'My Page' }),
      ).rejects.toThrow('transaction failed')

      expect(eventPublisher.publish).not.toHaveBeenCalled()
    })
  })

  describe('update - circular parent prevention', () => {
    it('rejects setting page as its own parent', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({
        id: 'page-1',
        title: 'Test',
        slug: 'test',
        content: {},
      })

      prisma.$transaction.mockImplementationOnce(async (fn: any) =>
        fn({
          knowledgePage: {
            findUnique: jest.fn(),
            update: jest.fn(),
          },
          pageActivity: { create: jest.fn() },
        }),
      )

      await expect(
        service.update('tenant-1', 'ws-1', 'user-1', 'page-1', { parentId: 'page-1' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('rejects circular reference (child as parent)', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({
        id: 'page-1',
        title: 'Parent Page',
        slug: 'parent',
        content: {},
      })

      const findUnique = jest.fn()
        // First call: get the proposed parent (page-2)
        .mockResolvedValueOnce({ parentId: 'page-1' }) // page-2's parent is page-1

      prisma.$transaction.mockImplementationOnce(async (fn: any) =>
        fn({
          knowledgePage: {
            findUnique,
            update: jest.fn(),
          },
          pageActivity: { create: jest.fn() },
        }),
      )

      // page-1 trying to set page-2 as parent, but page-2's parent is page-1
      // This would create: page-1 -> page-2 -> page-1 (circular)
      await expect(
        service.update('tenant-1', 'ws-1', 'user-1', 'page-1', { parentId: 'page-2' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('allows valid parent update (no circular reference)', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({
        id: 'page-1',
        title: 'Test',
        slug: 'test',
        content: {},
      })

      const findUnique = jest.fn()
        // Check for page-3 (proposed parent)
        .mockResolvedValueOnce({ parentId: null }) // page-3 has no parent

      const pageUpdate = jest.fn().mockResolvedValueOnce({
        id: 'page-1',
        parentId: 'page-3',
        children: [],
        projects: [],
      })
      const activityCreate = jest.fn().mockResolvedValueOnce({ id: 'a-1' })

      prisma.$transaction.mockImplementationOnce(async (fn: any) =>
        fn({
          knowledgePage: {
            findUnique,
            update: pageUpdate,
          },
          pageActivity: { create: activityCreate },
        }),
      )

      const result = await service.update('tenant-1', 'ws-1', 'user-1', 'page-1', {
        parentId: 'page-3',
      })

      expect(pageUpdate).toHaveBeenCalled()
      expect(result.data.parentId).toBe('page-3')
    })

    it('rejects deeply nested circular reference', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({
        id: 'page-1',
        title: 'Test',
        slug: 'test',
        content: {},
      })

      const findUnique = jest.fn()
        // page-4's parent is page-3
        .mockResolvedValueOnce({ parentId: 'page-3' })
        // page-3's parent is page-2
        .mockResolvedValueOnce({ parentId: 'page-2' })
        // page-2's parent is page-1 (the page being updated!)
        .mockResolvedValueOnce({ parentId: 'page-1' })

      prisma.$transaction.mockImplementationOnce(async (fn: any) =>
        fn({
          knowledgePage: {
            findUnique,
            update: jest.fn(),
          },
          pageActivity: { create: jest.fn() },
        }),
      )

      // page-1 trying to set page-4 as parent
      // Ancestor chain: page-4 -> page-3 -> page-2 -> page-1 (circular!)
      await expect(
        service.update('tenant-1', 'ws-1', 'user-1', 'page-1', { parentId: 'page-4' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('allows disconnecting parent (setting to null)', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({
        id: 'page-1',
        title: 'Test',
        slug: 'test',
        content: {},
      })

      const pageUpdate = jest.fn().mockResolvedValueOnce({
        id: 'page-1',
        parentId: null,
        children: [],
        projects: [],
      })
      const activityCreate = jest.fn().mockResolvedValueOnce({ id: 'a-1' })

      prisma.$transaction.mockImplementationOnce(async (fn: any) =>
        fn({
          knowledgePage: {
            update: pageUpdate,
          },
          pageActivity: { create: activityCreate },
        }),
      )

      const result = await service.update('tenant-1', 'ws-1', 'user-1', 'page-1', {
        parentId: null,
      })

      expect(pageUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parent: { disconnect: true },
          }),
        }),
      )
      expect(result.data.parentId).toBeNull()
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException for non-existent page', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce(null)

      await expect(service.findOne('tenant-1', 'ws-1', 'page-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('returns page with children and projects', async () => {
      const mockPage = {
        id: 'page-1',
        title: 'Test',
        children: [{ id: 'child-1', title: 'Child' }],
        projects: [{ project: { id: 'proj-1', name: 'Project' } }],
      }
      prisma.knowledgePage.findFirst.mockResolvedValueOnce(mockPage)
      prisma.knowledgePage.update.mockResolvedValueOnce({})
      prisma.pageActivity.create.mockResolvedValueOnce({})

      const result = await service.findOne('tenant-1', 'ws-1', 'page-1', 'user-1')

      expect(result.data).toEqual(mockPage)
    })
  })

  describe('remove', () => {
    it('soft deletes by setting deletedAt', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({
        id: 'page-1',
        title: 'Test',
        slug: 'test',
      })

      const pageUpdate = jest.fn().mockResolvedValueOnce({
        id: 'page-1',
        deletedAt: new Date(),
      })
      const activityCreate = jest.fn().mockResolvedValueOnce({ id: 'a-1' })

      prisma.$transaction.mockImplementationOnce(async (fn: any) =>
        fn({
          knowledgePage: { update: pageUpdate },
          pageActivity: { create: activityCreate },
        }),
      )

      const result = await service.remove('tenant-1', 'ws-1', 'user-1', 'page-1')

      expect(pageUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { deletedAt: expect.any(Date) },
        }),
      )
      expect(activityCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'DELETED' }),
        }),
      )
      expect(eventPublisher.publish).toHaveBeenCalled()
      expect(result.data.deletedAt).toBeDefined()
    })
  })

  describe('toggleFavorite', () => {
    it('adds user to favorites', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({
        id: 'page-1',
        favoritedBy: [],
      })
      prisma.knowledgePage.update.mockResolvedValueOnce({})

      await service.toggleFavorite('tenant-1', 'ws-1', 'user-1', 'page-1', true)

      expect(prisma.knowledgePage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { favoritedBy: ['user-1'] },
        }),
      )
    })

    it('removes user from favorites', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({
        id: 'page-1',
        favoritedBy: ['user-1', 'user-2'],
      })
      prisma.knowledgePage.update.mockResolvedValueOnce({})

      await service.toggleFavorite('tenant-1', 'ws-1', 'user-1', 'page-1', false)

      expect(prisma.knowledgePage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { favoritedBy: ['user-2'] },
        }),
      )
    })

    it('does not duplicate user in favorites', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({
        id: 'page-1',
        favoritedBy: ['user-1'],
      })

      await service.toggleFavorite('tenant-1', 'ws-1', 'user-1', 'page-1', true)

      expect(prisma.knowledgePage.update).not.toHaveBeenCalled()
    })

    it('rejects adding favorites when favoritedBy exceeds the maximum', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({
        id: 'page-1',
        favoritedBy: Array.from({ length: 10_000 }, (_, i) => `user-${i}`),
      })

      await expect(
        service.toggleFavorite('tenant-1', 'ws-1', 'new-user', 'page-1', true),
      ).rejects.toThrow(BadRequestException)

      expect(prisma.knowledgePage.update).not.toHaveBeenCalled()
    })
  })

  describe('getRelatedPages', () => {
    it('returns related page suggestions based on embeddings', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce({ id: 'page-1' })
      prisma.$queryRaw.mockResolvedValueOnce([
        {
          page_id: 'page-2',
          title: 'Beta',
          slug: 'beta',
          snippet: 'Beta chunk',
          distance: 0.25,
          updated_at: new Date('2025-01-01T00:00:00.000Z'),
        },
      ])

      const result = await service.getRelatedPages('tenant-1', 'ws-1', 'page-1', 5)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          pageId: 'page-2',
          title: 'Beta',
          slug: 'beta',
          snippet: 'Beta chunk',
        }),
      )
      expect(prisma.$queryRaw).toHaveBeenCalled()
    })

    it('throws if page does not exist', async () => {
      prisma.knowledgePage.findFirst.mockResolvedValueOnce(null)
      await expect(
        service.getRelatedPages('tenant-1', 'ws-1', 'missing', 5),
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })
})
