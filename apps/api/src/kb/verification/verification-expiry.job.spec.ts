import { Test, TestingModule } from '@nestjs/testing'
import { EventTypes } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { EventPublisherService } from '../../events'
import { VerificationExpiryJob } from './verification-expiry.job'

describe('VerificationExpiryJob', () => {
  let job: VerificationExpiryJob
  let prisma: jest.Mocked<PrismaService>
  let eventPublisher: jest.Mocked<EventPublisherService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationExpiryJob,
        {
          provide: PrismaService,
          useValue: {
            knowledgePage: {
              findMany: jest.fn(),
            },
            pageActivity: {
              create: jest.fn(),
            },
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

    job = module.get<VerificationExpiryJob>(VerificationExpiryJob)
    prisma = module.get(PrismaService)
    eventPublisher = module.get(EventPublisherService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('checkExpirations', () => {
    it('should find pages with verifyExpires <= now()', async () => {
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago

      const mockExpiredPage = {
        id: 'page-1',
        title: 'Expired Page',
        slug: 'expired-page',
        isVerified: true,
        verifyExpires: expiredDate,
        workspaceId: 'workspace-1',
        tenantId: 'tenant-1',
        ownerId: 'owner-1',
      }

      prisma.knowledgePage.findMany.mockResolvedValue([mockExpiredPage])
      prisma.pageActivity.create.mockResolvedValue({} as any)
      eventPublisher.publish.mockResolvedValue(undefined)

      await job.checkExpirations()

      expect(prisma.knowledgePage.findMany).toHaveBeenCalledWith({
        where: {
          isVerified: true,
          verifyExpires: {
            lte: expect.any(Date),
            not: null,
          },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          workspaceId: true,
          tenantId: true,
          ownerId: true,
          verifyExpires: true,
          isVerified: true,
        },
      })
    })

    it('should skip pages with verifyExpires = null', async () => {
      prisma.knowledgePage.findMany.mockResolvedValue([])

      await job.checkExpirations()

      expect(prisma.knowledgePage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            verifyExpires: {
              lte: expect.any(Date),
              not: null,
            },
          }),
        }),
      )
    })

    it('should skip deleted pages', async () => {
      prisma.knowledgePage.findMany.mockResolvedValue([])

      await job.checkExpirations()

      expect(prisma.knowledgePage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      )
    })

    it('should create PageActivity entry', async () => {
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const mockExpiredPage = {
        id: 'page-1',
        title: 'Expired Page',
        slug: 'expired-page',
        isVerified: true,
        verifyExpires: expiredDate,
        workspaceId: 'workspace-1',
        tenantId: 'tenant-1',
        ownerId: 'owner-1',
      }

      prisma.knowledgePage.findMany.mockResolvedValue([mockExpiredPage])
      prisma.pageActivity.create.mockResolvedValue({} as any)
      eventPublisher.publish.mockResolvedValue(undefined)

      await job.checkExpirations()

      expect(prisma.pageActivity.create).toHaveBeenCalledWith({
        data: {
          pageId: 'page-1',
          userId: 'system',
          type: 'VERIFICATION_EXPIRED',
          data: {
            title: 'Expired Page',
            slug: 'expired-page',
            expiredAt: expect.any(String),
            verifyExpires: expiredDate.toISOString(),
          },
        },
      })
    })

    it('should publish kb.page.verification_expired event', async () => {
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const mockExpiredPage = {
        id: 'page-1',
        title: 'Expired Page',
        slug: 'expired-page',
        isVerified: true,
        verifyExpires: expiredDate,
        workspaceId: 'workspace-1',
        tenantId: 'tenant-1',
        ownerId: 'owner-1',
      }

      prisma.knowledgePage.findMany.mockResolvedValue([mockExpiredPage])
      prisma.pageActivity.create.mockResolvedValue({} as any)
      eventPublisher.publish.mockResolvedValue(undefined)

      await job.checkExpirations()

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        EventTypes.KB_PAGE_VERIFICATION_EXPIRED,
        {
          pageId: 'page-1',
          workspaceId: 'workspace-1',
          ownerId: 'owner-1',
        },
        {
          tenantId: 'tenant-1',
          userId: 'system',
          source: 'kb-verification-expiry-job',
        },
      )
    })

    it('should process multiple expired pages', async () => {
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const mockExpiredPages = [
        {
          id: 'page-1',
          title: 'Expired Page 1',
          slug: 'expired-page-1',
          isVerified: true,
          verifyExpires: expiredDate,
          workspaceId: 'workspace-1',
          tenantId: 'tenant-1',
          ownerId: 'owner-1',
        },
        {
          id: 'page-2',
          title: 'Expired Page 2',
          slug: 'expired-page-2',
          isVerified: true,
          verifyExpires: expiredDate,
          workspaceId: 'workspace-1',
          tenantId: 'tenant-1',
          ownerId: 'owner-2',
        },
      ]

      prisma.knowledgePage.findMany.mockResolvedValue(mockExpiredPages)
      prisma.pageActivity.create.mockResolvedValue({} as any)
      eventPublisher.publish.mockResolvedValue(undefined)

      await job.checkExpirations()

      expect(prisma.pageActivity.create).toHaveBeenCalledTimes(2)
      expect(eventPublisher.publish).toHaveBeenCalledTimes(2)
    })

    it('should continue processing on error', async () => {
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const mockExpiredPages = [
        {
          id: 'page-1',
          title: 'Page 1',
          slug: 'page-1',
          isVerified: true,
          verifyExpires: expiredDate,
          workspaceId: 'workspace-1',
          tenantId: 'tenant-1',
          ownerId: 'owner-1',
        },
        {
          id: 'page-2',
          title: 'Page 2',
          slug: 'page-2',
          isVerified: true,
          verifyExpires: expiredDate,
          workspaceId: 'workspace-1',
          tenantId: 'tenant-1',
          ownerId: 'owner-2',
        },
      ]

      prisma.knowledgePage.findMany.mockResolvedValue(mockExpiredPages)

      // First page fails, second should still process
      prisma.pageActivity.create
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({} as any)

      eventPublisher.publish.mockResolvedValue(undefined)

      await job.checkExpirations()

      // Should still process second page
      expect(eventPublisher.publish).toHaveBeenCalledTimes(1)
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        EventTypes.KB_PAGE_VERIFICATION_EXPIRED,
        expect.objectContaining({ pageId: 'page-2' }),
        expect.any(Object),
      )
    })

    it('should handle no expired pages', async () => {
      prisma.knowledgePage.findMany.mockResolvedValue([])

      await job.checkExpirations()

      expect(prisma.pageActivity.create).not.toHaveBeenCalled()
      expect(eventPublisher.publish).not.toHaveBeenCalled()
    })
  })
})
