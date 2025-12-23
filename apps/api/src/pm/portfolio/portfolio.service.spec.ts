import { BadRequestException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { PortfolioService } from './portfolio.service'
import { PrismaService } from '../../common/services/prisma.service'
import { RedisProvider } from '../../events/redis.provider'

type PrismaMock = {
  project: { findMany: jest.Mock }
  user: { findMany: jest.Mock }
}

describe('PortfolioService', () => {
  let service: PortfolioService
  let prisma: PrismaMock
  let redis: { get: jest.Mock; set: jest.Mock; incr: jest.Mock }

  beforeEach(async () => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      incr: jest.fn().mockResolvedValue(1),
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PrismaService,
          useValue: {
            project: { findMany: jest.fn() },
            user: { findMany: jest.fn() },
          },
        },
        {
          provide: RedisProvider,
          useValue: { getClient: () => redis },
        },
      ],
    }).compile()

    service = moduleRef.get(PortfolioService)
    prisma = moduleRef.get(PrismaService) as unknown as PrismaMock
  })

  it('scopes portfolio queries by workspaceId', async () => {
    prisma.project.findMany.mockResolvedValueOnce([])

    await service.getPortfolio('ws-1', {})

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 'ws-1' }),
      }),
    )
  })

  it('calculates health scores and averages correctly', async () => {
    prisma.project.findMany.mockResolvedValueOnce([
      {
        id: 'proj-1',
        slug: 'alpha',
        name: 'Alpha',
        status: 'ACTIVE',
        type: 'CUSTOM',
        color: '#123456',
        icon: 'folder',
        totalTasks: 10,
        completedTasks: 4,
        healthScore: null,
        startDate: new Date('2025-01-01'),
        targetDate: new Date('2025-02-01'),
        team: {
          leadUserId: 'user-1',
          members: [{ userId: 'user-1' }],
        },
      },
      {
        id: 'proj-2',
        slug: 'beta',
        name: 'Beta',
        status: 'COMPLETED',
        type: 'CUSTOM',
        color: '#654321',
        icon: 'folder',
        totalTasks: 5,
        completedTasks: 5,
        healthScore: 90,
        startDate: null,
        targetDate: null,
        team: {
          leadUserId: null,
          members: [],
        },
      },
    ])

    prisma.user.findMany.mockResolvedValueOnce([
      { id: 'user-1', name: 'Lead User', email: 'lead@example.com' },
    ])

    const result = await service.getPortfolio('ws-1', {})

    expect(result.data.health.averageScore).toBe(65)
    expect(result.data.health.onTrack).toBe(1)
    expect(result.data.health.watch).toBe(0)
    expect(result.data.health.atRisk).toBe(1)
    expect(result.data.projects[0].startDate).toBe('2025-01-01T00:00:00.000Z')
  })

  it('throws if from date is after to date', async () => {
    const from = new Date('2025-02-01')
    const to = new Date('2025-01-01')

    await expect(service.getPortfolio('ws-1', { from, to })).rejects.toThrow(
      BadRequestException,
    )
  })

  it('returns cached data if available', async () => {
    const cachedData = { data: { some: 'data' } }
    // Mock getPortfolioVersion
    redis.get.mockResolvedValueOnce('v1')
    // Mock getCachedPortfolio
    redis.get.mockResolvedValueOnce(JSON.stringify(cachedData))

    const result = await service.getPortfolio('ws-1', {})

    expect(result).toEqual(cachedData)
    expect(prisma.project.findMany).not.toHaveBeenCalled()
  })

  it('sets cache after DB fetch', async () => {
    redis.get.mockResolvedValue(null) // no version, no cache
    prisma.project.findMany.mockResolvedValueOnce([])
    prisma.user.findMany.mockResolvedValueOnce([])

    await service.getPortfolio('ws-1', {})

    // Check version set
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('version:ws-1'),
      expect.any(String),
      'EX',
      86400,
    )
    // Check data set
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^pm:portfolio:ws-1:/),
      expect.any(String),
      'EX',
      60,
    )
  })

  it('invalidates cache correctly', async () => {
    await service.invalidateCache('ws-1')

    // Expect set with new timestamp
    expect(redis.set).toHaveBeenCalledWith(
      'pm:portfolio:version:ws-1',
      expect.any(String),
      'EX',
      86400,
    )
    // Should NOT call incr anymore
    expect(redis.incr).not.toHaveBeenCalled()
  })
})
