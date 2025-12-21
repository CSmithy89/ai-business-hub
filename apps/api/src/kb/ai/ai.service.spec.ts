import { Test } from '@nestjs/testing'
import { KbAiService } from './ai.service'
import { RagService } from '../rag/rag.service'
import { AssistantClientFactory } from '../../ai-providers/assistant-client-factory.service'
import { PrismaService } from '../../common/services/prisma.service'

const mockRagService = {
  query: jest.fn(),
}

const mockClient = {
  chatCompletion: jest.fn(),
}

const mockAssistantClientFactory = {
  createClient: jest.fn(),
}

const mockPrismaService = {
  knowledgePage: {
    findFirst: jest.fn(),
  },
}

describe('KbAiService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('generates a draft with citations', async () => {
    mockRagService.query.mockResolvedValue({
      context: 'Context snippet',
      citations: [
        { pageId: 'page-1', title: 'Auth Guide', slug: 'auth-guide', chunkIndex: 0 },
      ],
    })
    mockClient.chatCompletion.mockResolvedValue({
      id: 'resp-1',
      content: '# Draft\n\nContent',
      role: 'assistant',
      model: 'gpt-4o',
      provider: 'openai',
    })
    mockAssistantClientFactory.createClient.mockResolvedValue(mockClient)

    const moduleRef = await Test.createTestingModule({
      providers: [
        KbAiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RagService, useValue: mockRagService },
        { provide: AssistantClientFactory, useValue: mockAssistantClientFactory },
      ],
    }).compile()

    const service = moduleRef.get(KbAiService)

    const result = await service.generateDraft('tenant-1', 'workspace-1', {
      prompt: 'Draft onboarding docs',
    })

    expect(result.content).toContain('Draft')
    expect(result.citations).toHaveLength(1)
    expect(mockRagService.query).toHaveBeenCalledWith(
      'tenant-1',
      'workspace-1',
      expect.objectContaining({ q: 'Draft onboarding docs' }),
    )
    expect(mockAssistantClientFactory.createClient).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
    })
  })

  it('summarizes a page', async () => {
    mockPrismaService.knowledgePage.findFirst.mockResolvedValue({
      title: 'Auth Guide',
      contentText: 'This page explains authentication flow.',
    })
    mockClient.chatCompletion.mockResolvedValue({
      id: 'resp-2',
      content: JSON.stringify({
        summary: 'Authentication uses JWT and refresh tokens.',
        keyPoints: ['Use JWT for API requests', 'Rotate refresh tokens regularly'],
      }),
      role: 'assistant',
      model: 'gpt-4o',
      provider: 'openai',
    })
    mockAssistantClientFactory.createClient.mockResolvedValue(mockClient)

    const moduleRef = await Test.createTestingModule({
      providers: [
        KbAiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RagService, useValue: mockRagService },
        { provide: AssistantClientFactory, useValue: mockAssistantClientFactory },
      ],
    }).compile()

    const service = moduleRef.get(KbAiService)

    const result = await service.summarizePage('tenant-1', 'workspace-1', 'page-1')

    expect(result.summary).toContain('Authentication uses JWT')
    expect(result.keyPoints).toHaveLength(2)
    expect(mockPrismaService.knowledgePage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'page-1', tenantId: 'tenant-1', workspaceId: 'workspace-1', deletedAt: null } }),
    )
  })

  it('answers a question with sources', async () => {
    mockRagService.query.mockResolvedValue({
      context: 'Context snippet',
      citations: [
        { pageId: 'page-1', title: 'Auth Guide', slug: 'auth-guide', chunkIndex: 0 },
        { pageId: 'page-2', title: 'Setup', slug: 'setup', chunkIndex: 1 },
      ],
    })
    mockClient.chatCompletion.mockResolvedValue({
      id: 'resp-3',
      content: 'Use JWT for auth. [1]',
      role: 'assistant',
      model: 'gpt-4o',
      provider: 'openai',
    })
    mockAssistantClientFactory.createClient.mockResolvedValue(mockClient)

    const moduleRef = await Test.createTestingModule({
      providers: [
        KbAiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RagService, useValue: mockRagService },
        { provide: AssistantClientFactory, useValue: mockAssistantClientFactory },
      ],
    }).compile()

    const service = moduleRef.get(KbAiService)

    const result = await service.askQuestion('tenant-1', 'workspace-1', {
      question: 'How do we authenticate?',
      history: [{ role: 'user', content: 'Previous question' }],
    })

    expect(result.answer).toContain('JWT')
    expect(result.sources).toHaveLength(2)
    expect(result.confidence).toBe('medium')
  })

  it('returns Not found when no sources', async () => {
    mockRagService.query.mockResolvedValue({
      context: '',
      citations: [],
    })

    const moduleRef = await Test.createTestingModule({
      providers: [
        KbAiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RagService, useValue: mockRagService },
        { provide: AssistantClientFactory, useValue: mockAssistantClientFactory },
      ],
    }).compile()

    const service = moduleRef.get(KbAiService)

    const result = await service.askQuestion('tenant-1', 'workspace-1', {
      question: 'Unknown topic?',
    })

    expect(result.answer).toBe('Not found')
    expect(result.sources).toHaveLength(0)
    expect(result.confidence).toBe('low')
  })

  it('generates a draft from task content', async () => {
    mockClient.chatCompletion.mockResolvedValue({
      id: 'resp-4',
      content: '# Task Draft\n\nSummary',
      role: 'assistant',
      model: 'gpt-4o',
      provider: 'openai',
    })
    mockAssistantClientFactory.createClient.mockResolvedValue(mockClient)

    const moduleRef = await Test.createTestingModule({
      providers: [
        KbAiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RagService, useValue: mockRagService },
        { provide: AssistantClientFactory, useValue: mockAssistantClientFactory },
      ],
    }).compile()

    const service = moduleRef.get(KbAiService)

    const result = await service.generateDraftFromTask('tenant-1', 'workspace-1', {
      title: 'Ship knowledge extraction',
      description: 'Captured implementation details and key decisions.',
      comments: ['Great work on the draft', 'Remember to add follow-ups'],
    })

    expect(result.content).toContain('Task Draft')
    expect(mockAssistantClientFactory.createClient).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
    })
  })
})
