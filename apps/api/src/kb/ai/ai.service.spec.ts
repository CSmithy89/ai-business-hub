import { Test } from '@nestjs/testing'
import { KbAiService } from './ai.service'
import { RagService } from '../rag/rag.service'
import { AssistantClientFactory } from '../../ai-providers/assistant-client-factory.service'

const mockRagService = {
  query: jest.fn(),
}

const mockClient = {
  chatCompletion: jest.fn(),
}

const mockAssistantClientFactory = {
  createClient: jest.fn(),
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
})
