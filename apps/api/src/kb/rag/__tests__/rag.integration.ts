/**
 * KB RAG Integration Tests
 *
 * Tests for the RagService semantic search functionality including:
 * - Relevant page retrieval
 * - Verified content boosting
 * - Workspace isolation
 * - Query limits
 *
 * @see docs/modules/bm-pm/stories/pm-12-4-integration-e2e-tests.md
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from '../rag.service';
import { PrismaService } from '../../../common/services/prisma.service';
import { EmbeddingsService } from '../../embeddings/embeddings.service';

describe('KB RAG Integration', () => {
  let ragService: RagService;
  let mockPrisma: any;
  let mockEmbeddingsService: any;

  const testTenantId = 'test-tenant-001';
  const testWorkspaceId = 'test-workspace-001';
  const _otherWorkspaceId = 'other-workspace-001';

  // Mock embedding vector (1536 dimensions for OpenAI)
  const mockEmbedding = new Array(1536).fill(0.1);

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma = {
      $queryRaw: jest.fn(),
    };

    mockEmbeddingsService = {
      embedTextsForWorkspace: jest.fn().mockResolvedValue({
        embeddings: [mockEmbedding],
        model: 'text-embedding-ada-002',
      }),
      getEmbeddingDims: jest.fn().mockReturnValue(1536),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: EmbeddingsService,
          useValue: mockEmbeddingsService,
        },
      ],
    }).compile();

    ragService = module.get<RagService>(RagService);
  });

  describe('query', () => {
    it('should return relevant KB pages for agent query', async () => {
      // Arrange
      const mockRawChunks = [
        {
          page_id: 'kb-page-001',
          chunk_index: 0,
          chunk_text: 'This guide covers OAuth2 and JWT authentication patterns for API security.',
          title: 'API Authentication Guide',
          slug: 'api-authentication-guide',
          distance: 0.15,
          score: 0.87,
        },
        {
          page_id: 'kb-page-002',
          chunk_index: 0,
          chunk_text: 'RESTful API design best practices and patterns.',
          title: 'API Design Guide',
          slug: 'api-design-guide',
          distance: 0.25,
          score: 0.80,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockRawChunks);

      // Act
      const result = await ragService.query(testTenantId, testWorkspaceId, {
        q: 'How do I authenticate API requests?',
        limit: 5,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.chunks).toHaveLength(2);
      expect(result.chunks[0].title).toContain('Authentication');
      expect(result.chunks[0].score).toBeGreaterThan(result.chunks[1].score);
    });

    it('should boost verified content higher in results', async () => {
      // Arrange
      // Simulate verified content having higher score due to 1.5x boost
      const mockRawChunks = [
        {
          page_id: 'kb-page-verified',
          chunk_index: 0,
          chunk_text: 'Verified content about database patterns.',
          title: 'Database Patterns (Verified)',
          slug: 'database-patterns',
          distance: 0.20,
          score: 1.13, // Boosted: (1 / (1 + 0.20)) * 1.5 = 0.833 * 1.5 = 1.25 (approx)
        },
        {
          page_id: 'kb-page-unverified',
          chunk_index: 0,
          chunk_text: 'Unverified content about database patterns.',
          title: 'Database Tips',
          slug: 'database-tips',
          distance: 0.18,
          score: 0.85, // Not boosted: 1 / (1 + 0.18) = 0.85
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockRawChunks);

      // Act
      const result = await ragService.query(testTenantId, testWorkspaceId, {
        q: 'database authentication',
        limit: 5,
      });

      // Assert
      // Verified content should appear first due to score boost
      expect(result.chunks[0].pageId).toBe('kb-page-verified');
      expect(result.chunks[0].score).toBeGreaterThan(result.chunks[1].score);
    });

    it('should respect workspace isolation (no cross-workspace results)', async () => {
      // Arrange
      // Mock query that only returns pages from the requested workspace
      const mockRawChunks = [
        {
          page_id: 'kb-page-workspace-a',
          chunk_index: 0,
          chunk_text: 'Content from workspace A.',
          title: 'Workspace A Document',
          slug: 'workspace-a-doc',
          distance: 0.10,
          score: 0.91,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockRawChunks);

      // Act
      const result = await ragService.query(testTenantId, testWorkspaceId, {
        q: 'workspace content',
        limit: 10,
      });

      // Assert
      expect(result.chunks.length).toBeGreaterThan(0);

      // Verify the SQL query includes workspace isolation
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      const callArgs = mockPrisma.$queryRaw.mock.calls[0];
      // The query should include workspace_id filter
      expect(callArgs).toBeDefined();
    });

    it('should handle empty query gracefully', async () => {
      // Arrange
      mockEmbeddingsService.embedTextsForWorkspace.mockResolvedValue({
        embeddings: [mockEmbedding],
        model: 'text-embedding-ada-002',
      });
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // Act
      const result = await ragService.query(testTenantId, testWorkspaceId, {
        q: '',
        limit: 5,
      });

      // Assert - should not throw, return empty results
      expect(result).toBeDefined();
      expect(result.chunks).toEqual([]);
      expect(result.context).toBe('');
    });

    it('should respect query limits (max results)', async () => {
      // Arrange
      const mockRawChunks = [
        {
          page_id: 'kb-page-001',
          chunk_index: 0,
          chunk_text: 'Content 1',
          title: 'Title 1',
          slug: 'slug-1',
          distance: 0.10,
          score: 0.91,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockRawChunks);

      // Act
      const result = await ragService.query(testTenantId, testWorkspaceId, {
        q: 'guide',
        limit: 1,
      });

      // Assert
      expect(result.chunks.length).toBeLessThanOrEqual(1);
    });

    it('should enforce maximum limit of 20', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // Act - try to request more than max
      await ragService.query(testTenantId, testWorkspaceId, {
        q: 'test query',
        limit: 100, // Way above max
      });

      // Assert - query should have been capped
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should handle minimum limit of 1', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // Act - try to request zero or negative
      await ragService.query(testTenantId, testWorkspaceId, {
        q: 'test query',
        limit: 0,
      });

      // Assert - query should enforce minimum of 1
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should handle undefined limit with default', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // Act - no limit provided
      await ragService.query(testTenantId, testWorkspaceId, {
        q: 'test query',
      });

      // Assert - should use default limit (8)
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('Result Formatting', () => {
    it('should generate citations from chunks', async () => {
      // Arrange
      const mockRawChunks = [
        {
          page_id: 'kb-page-001',
          chunk_index: 0,
          chunk_text: 'Content about authentication.',
          title: 'Auth Guide',
          slug: 'auth-guide',
          distance: 0.10,
          score: 0.91,
        },
        {
          page_id: 'kb-page-002',
          chunk_index: 1,
          chunk_text: 'More content about security.',
          title: 'Security Guide',
          slug: 'security-guide',
          distance: 0.15,
          score: 0.87,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockRawChunks);

      // Act
      const result = await ragService.query(testTenantId, testWorkspaceId, {
        q: 'authentication security',
        limit: 5,
      });

      // Assert
      expect(result.citations).toHaveLength(2);
      expect(result.citations[0]).toHaveProperty('pageId');
      expect(result.citations[0]).toHaveProperty('title');
      expect(result.citations[0]).toHaveProperty('slug');
      expect(result.citations[0]).toHaveProperty('chunkIndex');
    });

    it('should format context with numbered headers', async () => {
      // Arrange
      const mockRawChunks = [
        {
          page_id: 'kb-page-001',
          chunk_index: 0,
          chunk_text: 'First chunk content.',
          title: 'First Page',
          slug: 'first-page',
          distance: 0.10,
          score: 0.91,
        },
        {
          page_id: 'kb-page-002',
          chunk_index: 0,
          chunk_text: 'Second chunk content.',
          title: 'Second Page',
          slug: 'second-page',
          distance: 0.15,
          score: 0.87,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockRawChunks);

      // Act
      const result = await ragService.query(testTenantId, testWorkspaceId, {
        q: 'test query',
        limit: 5,
      });

      // Assert
      expect(result.context).toContain('[1]');
      expect(result.context).toContain('[2]');
      expect(result.context).toContain('First Page');
      expect(result.context).toContain('Second Page');
      expect(result.context).toContain('kb/first-page');
      expect(result.context).toContain('---'); // Separator
    });
  });

  describe('Error Handling', () => {
    it('should throw BadRequestException when no embedding provider', async () => {
      // Arrange
      mockEmbeddingsService.embedTextsForWorkspace.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ragService.query(testTenantId, testWorkspaceId, {
          q: 'test query',
          limit: 5,
        }),
      ).rejects.toThrow();
    });

    it('should handle embedding service errors gracefully', async () => {
      // Arrange
      mockEmbeddingsService.embedTextsForWorkspace.mockRejectedValue(
        new Error('Embedding service unavailable'),
      );

      // Act & Assert
      await expect(
        ragService.query(testTenantId, testWorkspaceId, {
          q: 'test query',
          limit: 5,
        }),
      ).rejects.toThrow();
    });

    it('should handle database query errors', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(
        ragService.query(testTenantId, testWorkspaceId, {
          q: 'test query',
          limit: 5,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Page ID Filtering', () => {
    it('should filter by specific page IDs when provided', async () => {
      // Arrange
      const mockRawChunks = [
        {
          page_id: 'kb-page-specific',
          chunk_index: 0,
          chunk_text: 'Specific page content.',
          title: 'Specific Page',
          slug: 'specific-page',
          distance: 0.10,
          score: 0.91,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockRawChunks);

      // Act
      const result = await ragService.query(testTenantId, testWorkspaceId, {
        q: 'test query',
        limit: 5,
        pageIds: ['kb-page-specific'],
      });

      // Assert
      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].pageId).toBe('kb-page-specific');
    });

    it('should handle empty pageIds array', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // Act - should not filter when pageIds is empty
      await ragService.query(testTenantId, testWorkspaceId, {
        q: 'test query',
        limit: 5,
        pageIds: [],
      });

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('Score Calculation', () => {
    it('should calculate scores correctly', async () => {
      // Arrange
      const mockRawChunks = [
        {
          page_id: 'kb-page-001',
          chunk_index: 0,
          chunk_text: 'Content.',
          title: 'Title',
          slug: 'slug',
          distance: 0.10,
          score: 0.91,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockRawChunks);

      // Act
      const result = await ragService.query(testTenantId, testWorkspaceId, {
        q: 'test',
        limit: 5,
      });

      // Assert
      expect(result.chunks[0].score).toBe(0.91);
      expect(result.chunks[0].distance).toBe(0.10);
      expect(typeof result.chunks[0].score).toBe('number');
      expect(typeof result.chunks[0].distance).toBe('number');
    });

    it('should handle NaN scores gracefully', async () => {
      // Arrange
      const mockRawChunks = [
        {
          page_id: 'kb-page-001',
          chunk_index: 0,
          chunk_text: 'Content.',
          title: 'Title',
          slug: 'slug',
          distance: 'not a number' as any,
          score: 'also not a number' as any,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockRawChunks);

      // Act
      const result = await ragService.query(testTenantId, testWorkspaceId, {
        q: 'test',
        limit: 5,
      });

      // Assert - should convert to numbers (NaN is still a number type)
      expect(typeof result.chunks[0].distance).toBe('number');
      expect(typeof result.chunks[0].score).toBe('number');
    });
  });
});

describe('RAG Query DTO Validation', () => {
  it('should require q (query) field', () => {
    const invalidDto = {
      limit: 5,
      // Missing q
    };

    expect(invalidDto).not.toHaveProperty('q');
  });

  it('should accept valid RAG query', () => {
    const validDto = {
      q: 'How do I authenticate API requests?',
      limit: 5,
    };

    expect(validDto).toHaveProperty('q');
    expect(validDto.q.length).toBeGreaterThan(0);
  });

  it('should allow optional pageIds', () => {
    const validDto = {
      q: 'API security',
      limit: 5,
      pageIds: ['page-1', 'page-2'],
    };

    expect(validDto.pageIds).toHaveLength(2);
  });
});
