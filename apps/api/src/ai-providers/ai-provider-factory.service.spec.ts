/**
 * AI Provider Factory Tests
 *
 * Comprehensive unit tests for the AIProviderFactory service.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AIProviderFactory, ProviderConfig } from './ai-provider-factory.service';
import { AIProviderType } from './interfaces/ai-provider.interface';
import { ClaudeProvider } from './providers/claude.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { CredentialEncryptionService } from '@hyvve/shared';
import * as crypto from 'crypto';

describe('AIProviderFactory', () => {
  let factory: AIProviderFactory;
  let encryptionService: CredentialEncryptionService;
  let testMasterKey: string;

  beforeAll(() => {
    // Generate a test master key (base64 encoded 32 bytes)
    testMasterKey = crypto.randomBytes(32).toString('base64');
    process.env.ENCRYPTION_MASTER_KEY = testMasterKey;
    encryptionService = new CredentialEncryptionService();
  });

  afterAll(() => {
    delete process.env.ENCRYPTION_MASTER_KEY;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIProviderFactory,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ENCRYPTION_MASTER_KEY') return testMasterKey;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    factory = module.get<AIProviderFactory>(AIProviderFactory);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(factory).toBeDefined();
    });

    it('should warn when ENCRYPTION_MASTER_KEY is not set', async () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIProviderFactory,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const factoryWithoutKey = module.get<AIProviderFactory>(AIProviderFactory);
      expect(factoryWithoutKey).toBeDefined();
    });
  });

  describe('getSupportedProviders', () => {
    it('should return all supported provider types', () => {
      const providers = factory.getSupportedProviders();
      expect(providers).toEqual([
        'claude',
        'openai',
        'gemini',
        'deepseek',
        'openrouter',
      ]);
    });

    it('should return a copy, not the original array', () => {
      const providers1 = factory.getSupportedProviders();
      const providers2 = factory.getSupportedProviders();
      expect(providers1).not.toBe(providers2);
      expect(providers1).toEqual(providers2);
    });
  });

  describe('isValidProvider', () => {
    it.each(['claude', 'openai', 'gemini', 'deepseek', 'openrouter'])(
      'should return true for valid provider: %s',
      (provider) => {
        expect(factory.isValidProvider(provider)).toBe(true);
      },
    );

    it.each(['invalid', 'gpt', 'anthropic', 'google', '', 'CLAUDE'])(
      'should return false for invalid provider: %s',
      (provider) => {
        expect(factory.isValidProvider(provider)).toBe(false);
      },
    );
  });

  describe('getDefaultModel', () => {
    const expectedDefaults: Record<AIProviderType, string> = {
      claude: 'claude-3-5-sonnet-20241022',
      openai: 'gpt-4o',
      gemini: 'gemini-1.5-flash',
      deepseek: 'deepseek-chat',
      openrouter: 'anthropic/claude-3-5-sonnet',
    };

    it.each(Object.entries(expectedDefaults))(
      'should return correct default model for %s',
      (provider, expectedModel) => {
        expect(factory.getDefaultModel(provider as AIProviderType)).toBe(
          expectedModel,
        );
      },
    );
  });

  describe('create', () => {
    const createConfig = async (
      provider: string,
      apiKey: string = 'test-api-key',
    ): Promise<ProviderConfig> => {
      const encrypted = await encryptionService.encrypt(apiKey);
      return {
        id: 'test-id',
        provider,
        apiKeyEncrypted: encrypted,
        defaultModel: 'test-model',
      };
    };

    it('should create a ClaudeProvider for claude type', async () => {
      const config = await createConfig('claude');
      const provider = await factory.create(config);
      expect(provider).toBeInstanceOf(ClaudeProvider);
      expect(provider.provider).toBe('claude');
      expect(provider.model).toBe('test-model');
    });

    it('should create an OpenAIProvider for openai type', async () => {
      const config = await createConfig('openai');
      const provider = await factory.create(config);
      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.provider).toBe('openai');
    });

    it('should create a GeminiProvider for gemini type', async () => {
      const config = await createConfig('gemini');
      const provider = await factory.create(config);
      expect(provider).toBeInstanceOf(GeminiProvider);
      expect(provider.provider).toBe('gemini');
    });

    it('should create a DeepSeekProvider for deepseek type', async () => {
      const config = await createConfig('deepseek');
      const provider = await factory.create(config);
      expect(provider).toBeInstanceOf(DeepSeekProvider);
      expect(provider.provider).toBe('deepseek');
    });

    it('should create an OpenRouterProvider for openrouter type', async () => {
      const config = await createConfig('openrouter');
      const provider = await factory.create(config);
      expect(provider).toBeInstanceOf(OpenRouterProvider);
      expect(provider.provider).toBe('openrouter');
    });

    it('should throw error for unsupported provider type', async () => {
      const config = await createConfig('unsupported');
      await expect(factory.create(config)).rejects.toThrow(
        /Unsupported provider type: unsupported/,
      );
    });

    it('should throw error when decryption fails', async () => {
      const config: ProviderConfig = {
        id: 'test-id',
        provider: 'claude',
        apiKeyEncrypted: 'invalid-encrypted-data',
        defaultModel: 'test-model',
      };
      await expect(factory.create(config)).rejects.toThrow(/Failed to decrypt API key/);
    });
  });

  describe('createDirect', () => {
    it('should create a provider without encryption', () => {
      const provider = factory.createDirect('claude', 'test-key', 'test-model');
      expect(provider).toBeInstanceOf(ClaudeProvider);
      expect(provider.model).toBe('test-model');
    });

    it('should throw error for unsupported provider', () => {
      expect(() =>
        factory.createDirect('invalid' as AIProviderType, 'key', 'model'),
      ).toThrow(/Unsupported provider type/);
    });
  });
});

describe('Provider Implementations', () => {
  describe('ClaudeProvider', () => {
    let provider: ClaudeProvider;

    beforeEach(() => {
      provider = new ClaudeProvider('test-api-key', 'claude-3-5-sonnet-20241022');
    });

    it('should have correct provider type', () => {
      expect(provider.provider).toBe('claude');
    });

    it('should have correct model', () => {
      expect(provider.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should return zero usage stats initially', async () => {
      const usage = await provider.getUsage();
      expect(usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
      });
    });
  });

  describe('OpenAIProvider', () => {
    let provider: OpenAIProvider;

    beforeEach(() => {
      provider = new OpenAIProvider('test-api-key', 'gpt-4o');
    });

    it('should have correct provider type', () => {
      expect(provider.provider).toBe('openai');
    });

    it('should have correct model', () => {
      expect(provider.model).toBe('gpt-4o');
    });
  });

  describe('GeminiProvider', () => {
    let provider: GeminiProvider;

    beforeEach(() => {
      provider = new GeminiProvider('test-api-key', 'gemini-1.5-flash');
    });

    it('should have correct provider type', () => {
      expect(provider.provider).toBe('gemini');
    });

    it('should have correct model', () => {
      expect(provider.model).toBe('gemini-1.5-flash');
    });
  });

  describe('DeepSeekProvider', () => {
    let provider: DeepSeekProvider;

    beforeEach(() => {
      provider = new DeepSeekProvider('test-api-key', 'deepseek-chat');
    });

    it('should have correct provider type', () => {
      expect(provider.provider).toBe('deepseek');
    });

    it('should have correct model', () => {
      expect(provider.model).toBe('deepseek-chat');
    });

    it('should extend OpenAIProvider', () => {
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });
  });

  describe('OpenRouterProvider', () => {
    let provider: OpenRouterProvider;

    beforeEach(() => {
      provider = new OpenRouterProvider(
        'test-api-key',
        'anthropic/claude-3-5-sonnet',
      );
    });

    it('should have correct provider type', () => {
      expect(provider.provider).toBe('openrouter');
    });

    it('should have correct model', () => {
      expect(provider.model).toBe('anthropic/claude-3-5-sonnet');
    });
  });
});

describe('BaseAIProvider usage tracking', () => {
  let provider: ClaudeProvider;

  beforeEach(() => {
    provider = new ClaudeProvider('test-key', 'claude-3-5-sonnet-20241022');
  });

  it('should start with zero usage', async () => {
    const usage = await provider.getUsage();
    expect(usage.totalTokens).toBe(0);
    expect(usage.estimatedCost).toBe(0);
  });

  it('should return a copy of usage stats', async () => {
    const usage1 = await provider.getUsage();
    const usage2 = await provider.getUsage();
    expect(usage1).toEqual(usage2);
    expect(usage1).not.toBe(usage2);
  });
});
