import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { VerificationService } from './verification.service'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { EventTypes } from '@hyvve/shared'

describe('VerificationService', () => {
  let service: VerificationService
  let prisma: jest.Mocked<PrismaService>
  let eventPublisher: jest.Mocked<EventPublisherService>

  beforeEach(async () => {
    const mockPrisma = {
      knowledgePage: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      pageActivity: {
        create: jest.fn(),
      },
    }

    const mockEventPublisher = {
      publish: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventPublisherService, useValue: mockEventPublisher },
      ],
    }).compile()

    service = module.get<VerificationService>(VerificationService)
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>
    eventPublisher = module.get(
      EventPublisherService,
    ) as jest.Mocked<EventPublisherService>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('markVerified', () => {
    it('should mark page as verified with 30 day expiration', async () => {
      const pageId = 'page-123'
      const userId = 'user-456'
      const workspaceId = 'ws-789'
      const tenantId = 'tenant-101'
      const dto = { expiresIn: '30d' as const }

      const mockPage = {
        id: pageId,
        workspaceId,
        tenantId,
        deletedAt: null,
      }

      const now = new Date()
      const expectedExpiry = new Date()
      expectedExpiry.setDate(expectedExpiry.getDate() + 30)

      const mockUpdatedPage = {
        ...mockPage,
        isVerified: true,
        verifiedAt: now,
        verifiedById: userId,
        verifyExpires: expectedExpiry,
      }

      prisma.knowledgePage.findUnique.mockResolvedValue(mockPage as any)
      prisma.knowledgePage.update.mockResolvedValue(mockUpdatedPage as any)
      prisma.pageActivity.create.mockResolvedValue({} as any)
      eventPublisher.publish.mockResolvedValue(undefined)

      const result = await service.markVerified(pageId, userId, dto)

      expect(result.isVerified).toBe(true)
      expect(result.verifiedById).toBe(userId)
      expect(prisma.pageActivity.create).toHaveBeenCalledWith({
        data: {
          pageId,
          userId,
          type: 'VERIFIED',
          data: {
            expiresIn: '30d',
            verifyExpires: expect.any(String),
          },
        },
      })
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        EventTypes.KB_PAGE_VERIFIED,
        expect.objectContaining({
          pageId,
          workspaceId,
          tenantId,
          verifiedById: userId,
        }),
      )
    })

    it('should mark page as verified with no expiration (never)', async () => {
      const pageId = 'page-123'
      const userId = 'user-456'
      const dto = { expiresIn: 'never' as const }

      const mockPage = {
        id: pageId,
        workspaceId: 'ws-789',
        tenantId: 'tenant-101',
        deletedAt: null,
      }

      prisma.knowledgePage.findUnique.mockResolvedValue(mockPage as any)
      prisma.knowledgePage.update.mockResolvedValue({
        ...mockPage,
        isVerified: true,
        verifyExpires: null,
      } as any)
      prisma.pageActivity.create.mockResolvedValue({} as any)
      eventPublisher.publish.mockResolvedValue(undefined)

      await service.markVerified(pageId, userId, dto)

      expect(prisma.knowledgePage.update).toHaveBeenCalledWith({
        where: { id: pageId },
        data: expect.objectContaining({
          verifyExpires: null,
        }),
      })
    })

    it('should throw NotFoundException if page does not exist', async () => {
      const pageId = 'nonexistent-page'
      const userId = 'user-456'
      const dto = { expiresIn: '30d' as const }

      prisma.knowledgePage.findUnique.mockResolvedValue(null)

      await expect(service.markVerified(pageId, userId, dto)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw NotFoundException if page is deleted', async () => {
      const pageId = 'page-123'
      const userId = 'user-456'
      const dto = { expiresIn: '30d' as const }

      prisma.knowledgePage.findUnique.mockResolvedValue({
        id: pageId,
        deletedAt: new Date(),
      } as any)

      await expect(service.markVerified(pageId, userId, dto)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('removeVerification', () => {
    it('should remove verification from page', async () => {
      const pageId = 'page-123'
      const userId = 'user-456'
      const workspaceId = 'ws-789'
      const tenantId = 'tenant-101'

      const mockPage = {
        id: pageId,
        workspaceId,
        tenantId,
        deletedAt: null,
      }

      const mockUpdatedPage = {
        ...mockPage,
        isVerified: false,
        verifiedAt: null,
        verifiedById: null,
        verifyExpires: null,
      }

      prisma.knowledgePage.findUnique.mockResolvedValue(mockPage as any)
      prisma.knowledgePage.update.mockResolvedValue(mockUpdatedPage as any)
      prisma.pageActivity.create.mockResolvedValue({} as any)
      eventPublisher.publish.mockResolvedValue(undefined)

      const result = await service.removeVerification(pageId, userId)

      expect(result.isVerified).toBe(false)
      expect(result.verifiedAt).toBeNull()
      expect(prisma.pageActivity.create).toHaveBeenCalledWith({
        data: {
          pageId,
          userId,
          type: 'UNVERIFIED',
        },
      })
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        EventTypes.KB_PAGE_UNVERIFIED,
        expect.objectContaining({
          pageId,
          workspaceId,
          tenantId,
        }),
      )
    })

    it('should throw NotFoundException if page does not exist', async () => {
      const pageId = 'nonexistent-page'
      const userId = 'user-456'

      prisma.knowledgePage.findUnique.mockResolvedValue(null)

      await expect(service.removeVerification(pageId, userId)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('getStalPages', () => {
    it('should return pages with expired verification', async () => {
      const workspaceId = 'ws-123'
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const mockPages = [
        {
          id: 'page-1',
          title: 'Expired Page',
          slug: 'expired-page',
          isVerified: true,
          verifyExpires: expiredDate,
          updatedAt: new Date(),
          viewCount: 10,
          workspaceId,
          ownerId: 'owner-1',
        },
      ]

      prisma.knowledgePage.findMany.mockResolvedValue(mockPages as any)

      const result = await service.getStalPages(workspaceId)

      expect(result).toHaveLength(1)
      expect(result[0].reasons).toContain('Expired verification')
    })

    it('should return pages not updated in 90+ days', async () => {
      const workspaceId = 'ws-123'
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 91)

      const mockPages = [
        {
          id: 'page-1',
          title: 'Old Page',
          slug: 'old-page',
          isVerified: false,
          verifyExpires: null,
          updatedAt: oldDate,
          viewCount: 10,
          workspaceId,
          ownerId: 'owner-1',
        },
      ]

      prisma.knowledgePage.findMany.mockResolvedValue(mockPages as any)

      const result = await service.getStalPages(workspaceId)

      expect(result).toHaveLength(1)
      expect(result[0].reasons).toContain('Not updated in 90+ days')
    })

    it('should return pages with viewCount < 5', async () => {
      const workspaceId = 'ws-123'

      const mockPages = [
        {
          id: 'page-1',
          title: 'Low View Page',
          slug: 'low-view-page',
          isVerified: false,
          verifyExpires: null,
          updatedAt: new Date(),
          viewCount: 3,
          workspaceId,
          ownerId: 'owner-1',
        },
      ]

      prisma.knowledgePage.findMany.mockResolvedValue(mockPages as any)

      const result = await service.getStalPages(workspaceId)

      expect(result).toHaveLength(1)
      expect(result[0].reasons).toContain('Low view count')
    })

    it('should annotate pages with multiple reasons', async () => {
      const workspaceId = 'ws-123'
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 91)

      const mockPages = [
        {
          id: 'page-1',
          title: 'Multiple Issues Page',
          slug: 'multiple-issues-page',
          isVerified: true,
          verifyExpires: expiredDate,
          updatedAt: oldDate,
          viewCount: 2,
          workspaceId,
          ownerId: 'owner-1',
        },
      ]

      prisma.knowledgePage.findMany.mockResolvedValue(mockPages as any)

      const result = await service.getStalPages(workspaceId)

      expect(result).toHaveLength(1)
      expect(result[0].reasons).toHaveLength(3)
      expect(result[0].reasons).toContain('Expired verification')
      expect(result[0].reasons).toContain('Not updated in 90+ days')
      expect(result[0].reasons).toContain('Low view count')
    })

    it('should exclude deleted pages', async () => {
      const workspaceId = 'ws-123'

      prisma.knowledgePage.findMany.mockResolvedValue([])

      await service.getStalPages(workspaceId)

      expect(prisma.knowledgePage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      )
    })

    it('should order by updatedAt ascending', async () => {
      const workspaceId = 'ws-123'

      prisma.knowledgePage.findMany.mockResolvedValue([])

      await service.getStalPages(workspaceId)

      expect(prisma.knowledgePage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: 'asc' },
        }),
      )
    })

    it('should include owner ID', async () => {
      const workspaceId = 'ws-123'

      prisma.knowledgePage.findMany.mockResolvedValue([])

      await service.getStalPages(workspaceId)

      expect(prisma.knowledgePage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            ownerId: true,
          }),
        }),
      )
    })

    it('should return empty array when no stale pages', async () => {
      const workspaceId = 'ws-123'

      prisma.knowledgePage.findMany.mockResolvedValue([])

      const result = await service.getStalPages(workspaceId)

      expect(result).toEqual([])
    })
  })
})
