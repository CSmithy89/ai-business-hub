import { GapAnalysisService } from './analysis.service'

const mockPrismaService = {
  task: {
    findMany: jest.fn(),
  },
  knowledgePage: {
    findMany: jest.fn(),
  },
}

const mockVerificationService = {
  getStalPages: jest.fn(),
}

describe('GapAnalysisService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns missing topics, questions, and stale pages', async () => {
    mockPrismaService.task.findMany.mockResolvedValue([
      { id: 'task-1', title: 'Customer handoff checklist', description: 'handoff details' },
      { id: 'task-2', title: 'Handoff email template', description: 'handoff messaging' },
      { id: 'task-3', title: 'How do we access billing?', description: '' },
      { id: 'task-4', title: 'How do we access billing?', description: '' },
    ])
    mockPrismaService.knowledgePage.findMany.mockResolvedValue([
      { id: 'page-1', title: 'Onboarding Guide', slug: 'onboarding-guide' },
    ])
    mockVerificationService.getStalPages.mockResolvedValue([
      {
        id: 'page-2',
        title: 'Legacy Process',
        slug: 'legacy-process',
        updatedAt: new Date().toISOString(),
        viewCount: 0,
        isVerified: false,
        verifyExpires: null,
        reasons: ['Not updated in 90+ days'],
      },
    ])

    const service = new GapAnalysisService(
      mockPrismaService as any,
      mockVerificationService as any,
    )

    const result = await service.getGapAnalysis('workspace-1', {
      limit: 5,
      taskWindowDays: 90,
      minFrequency: 2,
    })

    expect(result.missingTopics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ topic: 'handoff', count: 2 }),
      ]),
    )
    expect(result.frequentQuestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ question: 'How do we access billing', count: 2 }),
      ]),
    )
    expect(result.outdatedPages).toHaveLength(1)
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('handles workspaces with no recent tasks', async () => {
    mockPrismaService.task.findMany.mockResolvedValue([])
    mockPrismaService.knowledgePage.findMany.mockResolvedValue([])
    mockVerificationService.getStalPages.mockResolvedValue([])

    const service = new GapAnalysisService(
      mockPrismaService as any,
      mockVerificationService as any,
    )

    const result = await service.getGapAnalysis('workspace-1', {})

    expect(result.missingTopics).toHaveLength(0)
    expect(result.frequentQuestions).toHaveLength(0)
    expect(result.outdatedPages).toHaveLength(0)
    expect(result.suggestions).toHaveLength(0)
  })
})
