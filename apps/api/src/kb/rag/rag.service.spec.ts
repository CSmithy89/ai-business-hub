import { RagService } from './rag.service'

describe('RagService', () => {
  it('formats context and citations from top chunks', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          page_id: 'page-1',
          chunk_index: 0,
          chunk_text: 'Alpha chunk',
          title: 'Alpha',
          slug: 'alpha',
          distance: 0.2,
        },
        {
          page_id: 'page-2',
          chunk_index: 3,
          chunk_text: 'Beta chunk',
          title: 'Beta',
          slug: 'beta',
          distance: 0.5,
        },
      ]),
    }

    const embeddingsService = {
      embedTextsForWorkspace: jest.fn().mockResolvedValue({
        embeddings: [Array.from({ length: 1536 }, () => 0.01)],
        providerType: 'openai',
      }),
      getEmbeddingDims: jest.fn().mockReturnValue(1536),
    }

    const service = new RagService(prisma as any, embeddingsService as any)

    const result = await service.query('tenant-1', 'ws-1', { q: 'hello', limit: 2 })

    expect(result.chunks).toHaveLength(2)
    expect(result.citations).toEqual([
      { pageId: 'page-1', title: 'Alpha', slug: 'alpha', chunkIndex: 0 },
      { pageId: 'page-2', title: 'Beta', slug: 'beta', chunkIndex: 3 },
    ])
    expect(result.context).toContain('[1] Alpha (kb/alpha)')
    expect(result.context).toContain('Alpha chunk')
    expect(result.context).toContain('[2] Beta (kb/beta)')
    expect(result.context).toContain('Beta chunk')
  })
})
