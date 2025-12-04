import { Test, TestingModule } from '@nestjs/testing';
import { TokenUsageService, TokenUsageRecord } from './token-usage.service';
import { PrismaService } from '../common/services/prisma.service';

describe('TokenUsageService', () => {
  let service: TokenUsageService;

  const mockPrismaService = {
    tokenUsage: {
      create: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    aIProviderConfig: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenUsageService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TokenUsageService>(TokenUsageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordUsage', () => {
    it('should record usage and update daily counter', async () => {
      const record: TokenUsageRecord = {
        workspaceId: 'workspace-1',
        providerId: 'provider-1',
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 50,
        duration: 500,
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        provider: 'openai',
      });
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.recordUsage(record);

      expect(mockPrismaService.aIProviderConfig.findUnique).toHaveBeenCalledWith({
        where: { id: 'provider-1' },
        select: { provider: true },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should handle missing provider gracefully', async () => {
      const record: TokenUsageRecord = {
        workspaceId: 'workspace-1',
        providerId: 'provider-1',
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 50,
        duration: 500,
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.recordUsage(record);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('getWorkspaceUsage', () => {
    it('should return aggregated usage stats', async () => {
      mockPrismaService.tokenUsage.aggregate.mockResolvedValue({
        _sum: {
          totalTokens: 1000,
          promptTokens: 600,
          completionTokens: 400,
          estimatedCost: 0.05,
        },
        _count: 10,
      });

      const result = await service.getWorkspaceUsage('workspace-1');

      expect(result).toEqual({
        totalTokens: 1000,
        totalPromptTokens: 600,
        totalCompletionTokens: 400,
        totalCost: 0.05,
        requestCount: 10,
      });
    });

    it('should filter by date range when provided', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrismaService.tokenUsage.aggregate.mockResolvedValue({
        _sum: {
          totalTokens: 500,
          promptTokens: 300,
          completionTokens: 200,
          estimatedCost: 0.02,
        },
        _count: 5,
      });

      await service.getWorkspaceUsage('workspace-1', startDate, endDate);

      expect(mockPrismaService.tokenUsage.aggregate).toHaveBeenCalledWith({
        where: {
          workspaceId: 'workspace-1',
          requestedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: expect.any(Object),
        _count: true,
      });
    });

    it('should handle empty results', async () => {
      mockPrismaService.tokenUsage.aggregate.mockResolvedValue({
        _sum: {
          totalTokens: null,
          promptTokens: null,
          completionTokens: null,
          estimatedCost: null,
        },
        _count: 0,
      });

      const result = await service.getWorkspaceUsage('workspace-1');

      expect(result).toEqual({
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalCost: 0,
        requestCount: 0,
      });
    });
  });

  describe('getDailyUsage', () => {
    it('should return daily usage breakdown', async () => {
      const mockDate = new Date('2024-01-15T12:00:00Z');
      mockPrismaService.tokenUsage.groupBy.mockResolvedValue([
        {
          requestedAt: mockDate,
          _sum: { totalTokens: 500, estimatedCost: 0.02 },
          _count: 5,
        },
      ]);

      const result = await service.getDailyUsage('workspace-1', 30);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].totalTokens).toBe(500);
    });
  });

  describe('getUsageByAgent', () => {
    it('should return usage breakdown by agent', async () => {
      mockPrismaService.tokenUsage.groupBy.mockResolvedValue([
        {
          agentId: 'agent-1',
          _sum: { totalTokens: 300, estimatedCost: 0.01 },
          _count: 3,
        },
        {
          agentId: 'agent-2',
          _sum: { totalTokens: 700, estimatedCost: 0.03 },
          _count: 7,
        },
      ]);

      const result = await service.getUsageByAgent('workspace-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        agentId: 'agent-1',
        totalTokens: 300,
        totalCost: 0.01,
        requestCount: 3,
      });
    });
  });

  describe('checkDailyLimit', () => {
    it('should return limit status when not exceeded', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        tokensUsedToday: 50000,
        maxTokensPerDay: 100000,
      });

      const result = await service.checkDailyLimit('provider-1');

      expect(result).toEqual({
        exceeded: false,
        used: 50000,
        limit: 100000,
        remaining: 50000,
      });
    });

    it('should return limit status when exceeded', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        tokensUsedToday: 100000,
        maxTokensPerDay: 100000,
      });

      const result = await service.checkDailyLimit('provider-1');

      expect(result).toEqual({
        exceeded: true,
        used: 100000,
        limit: 100000,
        remaining: 0,
      });
    });

    it('should handle missing provider', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(null);

      const result = await service.checkDailyLimit('provider-1');

      expect(result).toEqual({
        exceeded: true,
        used: 0,
        limit: 0,
        remaining: 0,
      });
    });
  });
});
