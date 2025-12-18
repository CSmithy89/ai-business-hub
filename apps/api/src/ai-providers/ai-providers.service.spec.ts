/**
 * AI Providers Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AIProvidersService } from './ai-providers.service';
import { AIProviderFactory } from './ai-provider-factory.service';
import { PrismaService } from '../common/services/prisma.service';
import * as crypto from 'crypto';

// Mock the encryption service (async methods)
jest.mock('@hyvve/shared', () => ({
  CredentialEncryptionService: jest.fn().mockImplementation(() => ({
    encrypt: jest.fn().mockResolvedValue('encrypted-key'),
    decrypt: jest.fn().mockResolvedValue('decrypted-key'),
  })),
}));

describe('AIProvidersService', () => {
  let service: AIProvidersService;
  let prismaService: jest.Mocked<PrismaService>;
  let providerFactory: jest.Mocked<AIProviderFactory>;

  const mockWorkspaceId = 'workspace-123';
  const mockProviderId = 'provider-123';

  const mockProvider = {
    id: mockProviderId,
    workspaceId: mockWorkspaceId,
    provider: 'claude',
    apiKeyEncrypted: 'encrypted-key',
    defaultModel: 'claude-3-5-sonnet-20241022',
    isValid: true,
    lastValidatedAt: new Date(),
    validationError: null,
    maxTokensPerDay: 100000,
    tokensUsedToday: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    // Set up encryption key
    process.env.ENCRYPTION_MASTER_KEY = crypto
      .randomBytes(32)
      .toString('base64');
  });

  afterAll(() => {
    delete process.env.ENCRYPTION_MASTER_KEY;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const mockPrisma = {
      aIProviderConfig: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockFactory = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIProvidersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: AIProviderFactory,
          useValue: mockFactory,
        },
      ],
    }).compile();

    service = module.get<AIProvidersService>(AIProvidersService);
    prismaService = module.get(PrismaService);
    providerFactory = module.get(AIProviderFactory);
  });

  describe('findAll', () => {
    it('should return all providers for a workspace', async () => {
      (prismaService.aIProviderConfig.findMany as jest.Mock).mockResolvedValue([
        mockProvider,
      ]);

      const result = await service.findAll(mockWorkspaceId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockProviderId);
      expect(result[0].provider).toBe('claude');
      expect(prismaService.aIProviderConfig.findMany).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when no providers exist', async () => {
      (prismaService.aIProviderConfig.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      const result = await service.findAll(mockWorkspaceId);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a provider by id', async () => {
      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        mockProvider,
      );

      const result = await service.findOne(mockWorkspaceId, mockProviderId);

      expect(result.id).toBe(mockProviderId);
      expect(result.provider).toBe('claude');
    });

    it('should throw NotFoundException when provider not found', async () => {
      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.findOne(mockWorkspaceId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      provider: 'claude' as const,
      apiKey: 'claude_api_key_example',
      defaultModel: 'claude-3-5-sonnet-20241022',
      maxTokensPerDay: 100000,
    };

    it('should create a new provider', async () => {
      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.aIProviderConfig.create as jest.Mock).mockResolvedValue(
        mockProvider,
      );

      const result = await service.create(mockWorkspaceId, createDto);

      expect(result.provider).toBe('claude');
      expect(prismaService.aIProviderConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: mockWorkspaceId,
          provider: 'claude',
          apiKeyEncrypted: 'encrypted-key',
        }),
      });
    });

    it('should throw ConflictException when provider already exists', async () => {
      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        mockProvider,
      );

      await expect(
        service.create(mockWorkspaceId, createDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const updateDto = {
      defaultModel: 'claude-3-opus-20240229',
    };

    it('should update a provider', async () => {
      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        mockProvider,
      );
      (prismaService.aIProviderConfig.update as jest.Mock).mockResolvedValue({
        ...mockProvider,
        defaultModel: 'claude-3-opus-20240229',
      });

      const result = await service.update(
        mockWorkspaceId,
        mockProviderId,
        updateDto,
      );

      expect(result.defaultModel).toBe('claude-3-opus-20240229');
    });

    it('should re-encrypt API key when updated', async () => {
      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        mockProvider,
      );
      (prismaService.aIProviderConfig.update as jest.Mock).mockResolvedValue({
        ...mockProvider,
        isValid: false,
      });

      await service.update(mockWorkspaceId, mockProviderId, {
        apiKey: 'new-api-key',
      });

      expect(prismaService.aIProviderConfig.update).toHaveBeenCalledWith({
        where: { id: mockProviderId },
        data: expect.objectContaining({
          apiKeyEncrypted: 'encrypted-key',
          isValid: false,
          validationError: null,
        }),
      });
    });

    it('should throw NotFoundException when provider not found', async () => {
      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.update(mockWorkspaceId, 'nonexistent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a provider', async () => {
      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        mockProvider,
      );
      (prismaService.aIProviderConfig.delete as jest.Mock).mockResolvedValue(
        mockProvider,
      );

      await service.remove(mockWorkspaceId, mockProviderId);

      expect(prismaService.aIProviderConfig.delete).toHaveBeenCalledWith({
        where: { id: mockProviderId },
      });
    });

    it('should throw NotFoundException when provider not found', async () => {
      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.remove(mockWorkspaceId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('testProvider', () => {
    it('should return valid result when credentials are valid', async () => {
      const mockAIProvider = {
        validateCredentials: jest.fn().mockResolvedValue({ valid: true }),
      };

      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        mockProvider,
      );
      (providerFactory.create as jest.Mock).mockReturnValue(mockAIProvider);
      (prismaService.aIProviderConfig.update as jest.Mock).mockResolvedValue(
        mockProvider,
      );

      const result = await service.testProvider(mockWorkspaceId, mockProviderId);

      expect(result.valid).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should return invalid result with error message', async () => {
      const mockAIProvider = {
        validateCredentials: jest.fn().mockResolvedValue({
          valid: false,
          error: 'Invalid API key',
        }),
      };

      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        mockProvider,
      );
      (providerFactory.create as jest.Mock).mockReturnValue(mockAIProvider);
      (prismaService.aIProviderConfig.update as jest.Mock).mockResolvedValue(
        mockProvider,
      );

      const result = await service.testProvider(mockWorkspaceId, mockProviderId);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should throw NotFoundException when provider not found', async () => {
      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.testProvider(mockWorkspaceId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle provider creation error', async () => {
      (prismaService.aIProviderConfig.findFirst as jest.Mock).mockResolvedValue(
        mockProvider,
      );
      (providerFactory.create as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to create provider');
      });
      (prismaService.aIProviderConfig.update as jest.Mock).mockResolvedValue(
        mockProvider,
      );

      const result = await service.testProvider(mockWorkspaceId, mockProviderId);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Failed to create provider');
    });
  });
});
