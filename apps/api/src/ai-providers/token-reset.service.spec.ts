import { Test, TestingModule } from '@nestjs/testing';
import { TokenResetService } from './token-reset.service';
import { TokenLimitService } from './token-limit.service';
import { PrismaService } from '../common/services/prisma.service';

describe('TokenResetService', () => {
  let service: TokenResetService;

  const mockPrismaService = {
    aIProviderConfig: {
      updateMany: jest.fn(),
    },
    tokenUsage: {
      deleteMany: jest.fn(),
    },
  };

  const mockTokenLimitService = {
    clearWarningCache: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenResetService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TokenLimitService,
          useValue: mockTokenLimitService,
        },
      ],
    }).compile();

    service = module.get<TokenResetService>(TokenResetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resetDailyTokens', () => {
    it('should reset all provider daily token counts', async () => {
      mockPrismaService.aIProviderConfig.updateMany.mockResolvedValue({
        count: 5,
      });

      await service.resetDailyTokens();

      expect(mockPrismaService.aIProviderConfig.updateMany).toHaveBeenCalledWith({
        data: { tokensUsedToday: 0 },
      });
    });

    it('should clear warning cache after reset', async () => {
      mockPrismaService.aIProviderConfig.updateMany.mockResolvedValue({
        count: 5,
      });

      await service.resetDailyTokens();

      expect(mockTokenLimitService.clearWarningCache).toHaveBeenCalled();
    });

    it('should handle empty providers', async () => {
      mockPrismaService.aIProviderConfig.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(service.resetDailyTokens()).resolves.not.toThrow();
    });
  });

  describe('cleanupOldUsageRecords', () => {
    it('should delete records older than 90 days', async () => {
      mockPrismaService.tokenUsage.deleteMany.mockResolvedValue({
        count: 100,
      });

      await service.cleanupOldUsageRecords();

      expect(mockPrismaService.tokenUsage.deleteMany).toHaveBeenCalledWith({
        where: {
          requestedAt: { lt: expect.any(Date) },
        },
      });

      // Verify the cutoff date is approximately 90 days ago
      const call = mockPrismaService.tokenUsage.deleteMany.mock.calls[0][0];
      const cutoffDate = call.where.requestedAt.lt;
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 90);

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(cutoffDate.getTime() - expectedDate.getTime())).toBeLessThan(1000);
    });
  });

  describe('manualResetDailyTokens', () => {
    it('should reset all tokens and return count', async () => {
      mockPrismaService.aIProviderConfig.updateMany.mockResolvedValue({
        count: 3,
      });

      const result = await service.manualResetDailyTokens();

      expect(result).toEqual({ count: 3 });
      expect(mockPrismaService.aIProviderConfig.updateMany).toHaveBeenCalledWith({
        data: { tokensUsedToday: 0 },
      });
    });
  });

  describe('resetWorkspaceTokens', () => {
    it('should reset tokens for a specific workspace', async () => {
      mockPrismaService.aIProviderConfig.updateMany.mockResolvedValue({
        count: 2,
      });

      const result = await service.resetWorkspaceTokens('workspace-1');

      expect(result).toEqual({ count: 2 });
      expect(mockPrismaService.aIProviderConfig.updateMany).toHaveBeenCalledWith({
        where: { workspaceId: 'workspace-1' },
        data: { tokensUsedToday: 0 },
      });
    });

    it('should handle workspace with no providers', async () => {
      mockPrismaService.aIProviderConfig.updateMany.mockResolvedValue({
        count: 0,
      });

      const result = await service.resetWorkspaceTokens('workspace-1');

      expect(result).toEqual({ count: 0 });
    });
  });
});
