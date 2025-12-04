import { Test, TestingModule } from '@nestjs/testing';
import { TokenLimitService, TokenLimitExceededError } from './token-limit.service';
import { PrismaService } from '../common/services/prisma.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { EventTypes } from '@hyvve/shared';

describe('TokenLimitService', () => {
  let service: TokenLimitService;

  const mockPrismaService = {
    aIProviderConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEventPublisher = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenLimitService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventPublisherService,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    service = module.get<TokenLimitService>(TokenLimitService);

    // Clear warning cache before each test
    service.clearWarningCache();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkLimitStatus', () => {
    it('should return correct status when under limit', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        id: 'provider-1',
        provider: 'openai',
        tokensUsedToday: 50000,
        maxTokensPerDay: 100000,
        workspaceId: 'workspace-1',
      });

      const status = await service.checkLimitStatus('provider-1');

      expect(status).toEqual({
        providerId: 'provider-1',
        provider: 'openai',
        tokensUsed: 50000,
        maxTokens: 100000,
        remaining: 50000,
        percentageUsed: 50,
        isWarning: false,
        isExceeded: false,
      });
    });

    it('should return warning status at 80% usage', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        id: 'provider-1',
        provider: 'openai',
        tokensUsedToday: 85000,
        maxTokensPerDay: 100000,
        workspaceId: 'workspace-1',
      });

      const status = await service.checkLimitStatus('provider-1');

      expect(status.isWarning).toBe(true);
      expect(status.isExceeded).toBe(false);
      expect(status.percentageUsed).toBe(85);
    });

    it('should return exceeded status at 100% usage', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        id: 'provider-1',
        provider: 'openai',
        tokensUsedToday: 100000,
        maxTokensPerDay: 100000,
        workspaceId: 'workspace-1',
      });

      const status = await service.checkLimitStatus('provider-1');

      expect(status.isExceeded).toBe(true);
      expect(status.remaining).toBe(0);
      expect(status.percentageUsed).toBe(100);
    });

    it('should handle missing provider gracefully', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(null);

      const status = await service.checkLimitStatus('non-existent');

      expect(status.isExceeded).toBe(true);
      expect(status.provider).toBe('unknown');
    });
  });

  describe('enforceLimit', () => {
    it('should allow request when under limit', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        id: 'provider-1',
        provider: 'openai',
        tokensUsedToday: 50000,
        maxTokensPerDay: 100000,
        workspaceId: 'workspace-1',
      });

      const status = await service.enforceLimit(
        'provider-1',
        'workspace-1',
        'user-1',
      );

      expect(status.isExceeded).toBe(false);
    });

    it('should throw TokenLimitExceededError when limit exceeded', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        id: 'provider-1',
        provider: 'openai',
        tokensUsedToday: 100000,
        maxTokensPerDay: 100000,
        workspaceId: 'workspace-1',
      });
      mockEventPublisher.publish.mockResolvedValue('event-id');

      await expect(
        service.enforceLimit('provider-1', 'workspace-1', 'user-1'),
      ).rejects.toThrow(TokenLimitExceededError);

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        EventTypes.TOKEN_LIMIT_EXCEEDED,
        expect.objectContaining({
          providerId: 'provider-1',
          provider: 'openai',
        }),
        expect.any(Object),
      );
    });

    it('should throw when estimated tokens would exceed limit', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        id: 'provider-1',
        provider: 'openai',
        tokensUsedToday: 95000,
        maxTokensPerDay: 100000,
        workspaceId: 'workspace-1',
      });
      mockEventPublisher.publish.mockResolvedValue('event-id');

      await expect(
        service.enforceLimit('provider-1', 'workspace-1', 'user-1', 10000),
      ).rejects.toThrow(TokenLimitExceededError);
    });

    it('should emit warning event at 80% threshold', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        id: 'provider-1',
        provider: 'openai',
        tokensUsedToday: 85000,
        maxTokensPerDay: 100000,
        workspaceId: 'workspace-1',
      });
      mockEventPublisher.publish.mockResolvedValue('event-id');

      await service.enforceLimit('provider-1', 'workspace-1', 'user-1');

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        EventTypes.TOKEN_LIMIT_WARNING,
        expect.objectContaining({
          providerId: 'provider-1',
          threshold: 80,
        }),
        expect.any(Object),
      );
    });

    it('should only emit warning once per provider per day', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        id: 'provider-1',
        provider: 'openai',
        tokensUsedToday: 85000,
        maxTokensPerDay: 100000,
        workspaceId: 'workspace-1',
      });
      mockEventPublisher.publish.mockResolvedValue('event-id');

      // First call - should emit warning
      await service.enforceLimit('provider-1', 'workspace-1', 'user-1');

      // Second call - should not emit warning again
      await service.enforceLimit('provider-1', 'workspace-1', 'user-1');

      // Should only be called once for warning
      const warningCalls = mockEventPublisher.publish.mock.calls.filter(
        (call) => call[0] === EventTypes.TOKEN_LIMIT_WARNING,
      );
      expect(warningCalls.length).toBe(1);
    });
  });

  describe('getWorkspaceLimitStatus', () => {
    it('should return status for all providers in workspace', async () => {
      mockPrismaService.aIProviderConfig.findMany.mockResolvedValue([
        {
          id: 'provider-1',
          provider: 'openai',
          tokensUsedToday: 50000,
          maxTokensPerDay: 100000,
        },
        {
          id: 'provider-2',
          provider: 'claude',
          tokensUsedToday: 90000,
          maxTokensPerDay: 100000,
        },
      ]);

      const statuses = await service.getWorkspaceLimitStatus('workspace-1');

      expect(statuses).toHaveLength(2);
      expect(statuses[0].isWarning).toBe(false);
      expect(statuses[1].isWarning).toBe(true);
    });
  });

  describe('updateLimit', () => {
    it('should update the limit for a provider', async () => {
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({
        id: 'provider-1',
        maxTokensPerDay: 200000,
      });

      await service.updateLimit('provider-1', 200000);

      expect(mockPrismaService.aIProviderConfig.update).toHaveBeenCalledWith({
        where: { id: 'provider-1' },
        data: { maxTokensPerDay: 200000 },
      });
    });
  });

  describe('clearWarningCache', () => {
    it('should clear the warning cache allowing new warnings', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue({
        id: 'provider-1',
        provider: 'openai',
        tokensUsedToday: 85000,
        maxTokensPerDay: 100000,
        workspaceId: 'workspace-1',
      });
      mockEventPublisher.publish.mockResolvedValue('event-id');

      // First call - emits warning
      await service.enforceLimit('provider-1', 'workspace-1', 'user-1');

      // Clear cache
      service.clearWarningCache();

      // Second call - should emit warning again after cache clear
      await service.enforceLimit('provider-1', 'workspace-1', 'user-1');

      const warningCalls = mockEventPublisher.publish.mock.calls.filter(
        (call) => call[0] === EventTypes.TOKEN_LIMIT_WARNING,
      );
      expect(warningCalls.length).toBe(2);
    });
  });
});
