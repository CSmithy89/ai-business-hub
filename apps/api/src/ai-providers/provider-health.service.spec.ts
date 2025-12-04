import { Test, TestingModule } from '@nestjs/testing';
import { ProviderHealthService } from './provider-health.service';
import { PrismaService } from '../common/services/prisma.service';
import { AIProviderFactory } from './ai-provider-factory.service';

describe('ProviderHealthService', () => {
  let service: ProviderHealthService;

  const mockPrismaService = {
    aIProviderConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockProviderFactory = {
    create: jest.fn(),
  };

  const mockProviderInstance = {
    validateCredentials: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderHealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AIProviderFactory,
          useValue: mockProviderFactory,
        },
      ],
    }).compile();

    service = module.get<ProviderHealthService>(ProviderHealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkProviderHealth', () => {
    it('should return not found result for missing provider', async () => {
      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(null);

      const result = await service.checkProviderHealth('non-existent');

      expect(result).toEqual({
        providerId: 'non-existent',
        provider: 'unknown',
        isValid: false,
        error: 'Provider not found',
        checkedAt: expect.any(Date),
      });
    });

    it('should return healthy result for valid provider', async () => {
      const mockProvider = {
        id: 'provider-1',
        provider: 'openai',
        apiKeyEncrypted: 'encrypted-key',
        defaultModel: 'gpt-4',
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(mockProvider);
      mockProviderFactory.create.mockResolvedValue(mockProviderInstance);
      mockProviderInstance.validateCredentials.mockResolvedValue({ valid: true });
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      const result = await service.checkProviderHealth('provider-1');

      expect(result).toEqual({
        providerId: 'provider-1',
        provider: 'openai',
        isValid: true,
        latency: expect.any(Number),
        error: undefined,
        checkedAt: expect.any(Date),
      });

      expect(mockPrismaService.aIProviderConfig.update).toHaveBeenCalledWith({
        where: { id: 'provider-1' },
        data: {
          isValid: true,
          lastValidatedAt: expect.any(Date),
          validationError: null,
        },
      });
    });

    it('should return unhealthy result for invalid provider', async () => {
      const mockProvider = {
        id: 'provider-1',
        provider: 'openai',
        apiKeyEncrypted: 'encrypted-key',
        defaultModel: 'gpt-4',
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(mockProvider);
      mockProviderFactory.create.mockResolvedValue(mockProviderInstance);
      mockProviderInstance.validateCredentials.mockResolvedValue({
        valid: false,
        error: 'Invalid API key',
      });
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      const result = await service.checkProviderHealth('provider-1');

      expect(result).toEqual({
        providerId: 'provider-1',
        provider: 'openai',
        isValid: false,
        latency: expect.any(Number),
        error: 'Invalid API key',
        checkedAt: expect.any(Date),
      });
    });

    it('should handle validation exceptions', async () => {
      const mockProvider = {
        id: 'provider-1',
        provider: 'openai',
        apiKeyEncrypted: 'encrypted-key',
        defaultModel: 'gpt-4',
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(mockProvider);
      mockProviderFactory.create.mockResolvedValue(mockProviderInstance);
      mockProviderInstance.validateCredentials.mockRejectedValue(
        new Error('Network error'),
      );
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      const result = await service.checkProviderHealth('provider-1');

      expect(result).toEqual({
        providerId: 'provider-1',
        provider: 'openai',
        isValid: false,
        latency: expect.any(Number),
        error: 'Network error',
        checkedAt: expect.any(Date),
      });

      expect(mockPrismaService.aIProviderConfig.update).toHaveBeenCalledWith({
        where: { id: 'provider-1' },
        data: {
          isValid: false,
          lastValidatedAt: expect.any(Date),
          validationError: 'Network error',
        },
      });
    });

    it('should track consecutive failures', async () => {
      const mockProvider = {
        id: 'provider-1',
        provider: 'openai',
        apiKeyEncrypted: 'encrypted-key',
        defaultModel: 'gpt-4',
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(mockProvider);
      mockProviderFactory.create.mockResolvedValue(mockProviderInstance);
      mockProviderInstance.validateCredentials.mockResolvedValue({
        valid: false,
        error: 'API error',
      });
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      // First failure
      await service.checkProviderHealth('provider-1');
      expect(service.getConsecutiveFailures('provider-1')).toBe(1);

      // Second failure
      await service.checkProviderHealth('provider-1');
      expect(service.getConsecutiveFailures('provider-1')).toBe(2);

      // Third failure
      await service.checkProviderHealth('provider-1');
      expect(service.getConsecutiveFailures('provider-1')).toBe(3);
    });

    it('should reset consecutive failures on success', async () => {
      const mockProvider = {
        id: 'provider-1',
        provider: 'openai',
        apiKeyEncrypted: 'encrypted-key',
        defaultModel: 'gpt-4',
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(mockProvider);
      mockProviderFactory.create.mockResolvedValue(mockProviderInstance);
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      // Fail first
      mockProviderInstance.validateCredentials.mockResolvedValue({
        valid: false,
        error: 'API error',
      });
      await service.checkProviderHealth('provider-1');
      expect(service.getConsecutiveFailures('provider-1')).toBe(1);

      // Then succeed
      mockProviderInstance.validateCredentials.mockResolvedValue({ valid: true });
      await service.checkProviderHealth('provider-1');
      expect(service.getConsecutiveFailures('provider-1')).toBe(0);
    });
  });

  describe('getWorkspaceHealth', () => {
    it('should return health summary for workspace', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          provider: 'openai',
          isValid: true,
          lastValidatedAt: new Date(),
          validationError: null,
        },
        {
          id: 'provider-2',
          provider: 'claude',
          isValid: false,
          lastValidatedAt: new Date(),
          validationError: 'Invalid key',
        },
      ];

      mockPrismaService.aIProviderConfig.findMany.mockResolvedValue(mockProviders);

      const result = await service.getWorkspaceHealth('workspace-1');

      expect(result).toEqual({
        total: 2,
        healthy: 1,
        unhealthy: 1,
        providers: [
          {
            id: 'provider-1',
            provider: 'openai',
            isValid: true,
            lastValidatedAt: expect.any(Date),
            validationError: null,
            consecutiveFailures: 0,
          },
          {
            id: 'provider-2',
            provider: 'claude',
            isValid: false,
            lastValidatedAt: expect.any(Date),
            validationError: 'Invalid key',
            consecutiveFailures: 0,
          },
        ],
      });
    });

    it('should return empty summary for workspace with no providers', async () => {
      mockPrismaService.aIProviderConfig.findMany.mockResolvedValue([]);

      const result = await service.getWorkspaceHealth('workspace-1');

      expect(result).toEqual({
        total: 0,
        healthy: 0,
        unhealthy: 0,
        providers: [],
      });
    });
  });

  describe('triggerHealthCheck', () => {
    it('should trigger health check and return result', async () => {
      const mockProvider = {
        id: 'provider-1',
        provider: 'openai',
        apiKeyEncrypted: 'encrypted-key',
        defaultModel: 'gpt-4',
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(mockProvider);
      mockProviderFactory.create.mockResolvedValue(mockProviderInstance);
      mockProviderInstance.validateCredentials.mockResolvedValue({ valid: true });
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      const result = await service.triggerHealthCheck('provider-1');

      expect(result).toEqual({
        providerId: 'provider-1',
        provider: 'openai',
        isValid: true,
        latency: expect.any(Number),
        error: undefined,
        checkedAt: expect.any(Date),
      });
    });
  });

  describe('getConsecutiveFailures', () => {
    it('should return 0 for providers with no failures', () => {
      expect(service.getConsecutiveFailures('new-provider')).toBe(0);
    });
  });

  describe('resetConsecutiveFailures', () => {
    it('should reset failures for a provider', async () => {
      const mockProvider = {
        id: 'provider-1',
        provider: 'openai',
        apiKeyEncrypted: 'encrypted-key',
        defaultModel: 'gpt-4',
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(mockProvider);
      mockProviderFactory.create.mockResolvedValue(mockProviderInstance);
      mockProviderInstance.validateCredentials.mockResolvedValue({
        valid: false,
        error: 'API error',
      });
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      // Cause a failure
      await service.checkProviderHealth('provider-1');
      expect(service.getConsecutiveFailures('provider-1')).toBe(1);

      // Reset
      service.resetConsecutiveFailures('provider-1');
      expect(service.getConsecutiveFailures('provider-1')).toBe(0);
    });
  });

  describe('runScheduledHealthChecks', () => {
    it('should run health checks for all providers', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          workspaceId: 'workspace-1',
          provider: 'openai',
          apiKeyEncrypted: 'encrypted-key',
          defaultModel: 'gpt-4',
        },
        {
          id: 'provider-2',
          workspaceId: 'workspace-1',
          provider: 'claude',
          apiKeyEncrypted: 'encrypted-key',
          defaultModel: 'claude-3-opus',
        },
      ];

      mockPrismaService.aIProviderConfig.findMany.mockResolvedValue(mockProviders);
      mockPrismaService.aIProviderConfig.findUnique.mockImplementation(({ where }) => {
        const provider = mockProviders.find((p) => p.id === where.id);
        return Promise.resolve(provider || null);
      });
      mockProviderFactory.create.mockResolvedValue(mockProviderInstance);
      mockProviderInstance.validateCredentials.mockResolvedValue({ valid: true });
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      await service.runScheduledHealthChecks();

      // Should have checked both providers
      expect(mockPrismaService.aIProviderConfig.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during scheduled checks', async () => {
      mockPrismaService.aIProviderConfig.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      // Should not throw
      await expect(service.runScheduledHealthChecks()).resolves.not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle factory creation failure gracefully', async () => {
      const mockProvider = {
        id: 'provider-1',
        provider: 'openai',
        apiKeyEncrypted: 'invalid-encrypted-key',
        defaultModel: 'gpt-4',
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(mockProvider);
      mockProviderFactory.create.mockRejectedValue(
        new Error('Failed to decrypt API key'),
      );
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      const result = await service.checkProviderHealth('provider-1');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Failed to decrypt API key');
    });

    it('should handle concurrent health checks for different providers', async () => {
      const mockProviders = [
        { id: 'provider-1', provider: 'openai', apiKeyEncrypted: 'key1', defaultModel: 'gpt-4' },
        { id: 'provider-2', provider: 'claude', apiKeyEncrypted: 'key2', defaultModel: 'claude-3' },
      ];

      mockPrismaService.aIProviderConfig.findUnique.mockImplementation(({ where }) => {
        const provider = mockProviders.find((p) => p.id === where.id);
        return Promise.resolve(provider || null);
      });
      mockProviderFactory.create.mockResolvedValue(mockProviderInstance);
      mockProviderInstance.validateCredentials.mockResolvedValue({ valid: true });
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      // Run concurrent checks
      const [result1, result2] = await Promise.all([
        service.checkProviderHealth('provider-1'),
        service.checkProviderHealth('provider-2'),
      ]);

      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
    });

    it('should handle provider with missing apiKeyEncrypted', async () => {
      const mockProvider = {
        id: 'provider-1',
        provider: 'openai',
        apiKeyEncrypted: null,
        defaultModel: 'gpt-4',
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(mockProvider);
      mockProviderFactory.create.mockRejectedValue(
        new Error('API key not configured'),
      );
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      const result = await service.checkProviderHealth('provider-1');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API key not configured');
    });

    it('should correctly track failures across multiple providers independently', async () => {
      const mockProviders = [
        { id: 'provider-1', provider: 'openai', apiKeyEncrypted: 'key1', defaultModel: 'gpt-4' },
        { id: 'provider-2', provider: 'claude', apiKeyEncrypted: 'key2', defaultModel: 'claude-3' },
      ];

      mockPrismaService.aIProviderConfig.findUnique.mockImplementation(({ where }) => {
        const provider = mockProviders.find((p) => p.id === where.id);
        return Promise.resolve(provider || null);
      });
      mockProviderFactory.create.mockResolvedValue(mockProviderInstance);
      mockProviderInstance.validateCredentials.mockResolvedValue({
        valid: false,
        error: 'API error',
      });
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      // Fail provider-1 twice
      await service.checkProviderHealth('provider-1');
      await service.checkProviderHealth('provider-1');

      // Fail provider-2 once
      await service.checkProviderHealth('provider-2');

      expect(service.getConsecutiveFailures('provider-1')).toBe(2);
      expect(service.getConsecutiveFailures('provider-2')).toBe(1);
    });

    it('should measure latency within reasonable bounds', async () => {
      const mockProvider = {
        id: 'provider-1',
        provider: 'openai',
        apiKeyEncrypted: 'encrypted-key',
        defaultModel: 'gpt-4',
      };

      mockPrismaService.aIProviderConfig.findUnique.mockResolvedValue(mockProvider);
      mockProviderFactory.create.mockResolvedValue(mockProviderInstance);
      mockProviderInstance.validateCredentials.mockImplementation(async () => {
        // Simulate some latency
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { valid: true };
      });
      mockPrismaService.aIProviderConfig.update.mockResolvedValue({});

      const result = await service.checkProviderHealth('provider-1');

      // Use lenient bounds to avoid flaky tests in slow CI environments
      expect(result.latency).toBeGreaterThan(0);
      expect(result.latency).toBeLessThan(10000); // 10 second max
      expect(typeof result.latency).toBe('number');
    });
  });
});
