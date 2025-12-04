/**
 * AI Provider Factory Service
 *
 * Factory for creating AI provider instances from database configuration.
 * Uses the Factory Pattern to instantiate the correct provider based on type.
 *
 * @module ai-providers
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIProviderInterface,
  AIProviderType,
} from './interfaces/ai-provider.interface';
import { ClaudeProvider } from './providers/claude.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { CredentialEncryptionService } from '@hyvve/shared';

/**
 * Configuration shape for creating a provider
 * Matches the AIProviderConfig database model
 */
export interface ProviderConfig {
  id: string;
  provider: string;
  apiKeyEncrypted: string;
  defaultModel: string;
}

/**
 * Supported provider types
 */
const SUPPORTED_PROVIDERS: AIProviderType[] = [
  'claude',
  'openai',
  'gemini',
  'deepseek',
  'openrouter',
];

@Injectable()
export class AIProviderFactory {
  private readonly logger = new Logger(AIProviderFactory.name);
  private encryptionService: CredentialEncryptionService | null = null;

  constructor(private readonly configService: ConfigService) {
    // Encryption service will be lazily initialized when first needed
    const masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    if (!masterKey) {
      this.logger.warn(
        'ENCRYPTION_MASTER_KEY not configured. Provider creation will fail.',
      );
    }
  }

  /**
   * Get or create the encryption service
   * Lazy initialization to allow for missing key during module bootstrap
   */
  private getEncryptionService(): CredentialEncryptionService {
    if (!this.encryptionService) {
      this.encryptionService = new CredentialEncryptionService();
    }
    return this.encryptionService;
  }

  /**
   * Create an AI provider instance from database configuration
   *
   * @param config Provider configuration from database
   * @returns Provider instance implementing AIProviderInterface
   * @throws Error if provider type is unsupported
   */
  async create(config: ProviderConfig): Promise<AIProviderInterface> {
    const providerType = config.provider as AIProviderType;

    if (!this.isValidProvider(providerType)) {
      throw new Error(
        `Unsupported provider type: ${config.provider}. ` +
          `Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`,
      );
    }

    // Decrypt the API key
    let apiKey: string;
    try {
      apiKey = await this.getEncryptionService().decrypt(config.apiKeyEncrypted);
    } catch (error) {
      this.logger.error(
        `Failed to decrypt API key for provider ${config.id}: ${error}`,
      );
      throw new Error(
        `Failed to decrypt API key for provider ${config.provider}`,
      );
    }

    // Use provided model or fall back to default for provider type
    const model = config.defaultModel || this.getDefaultModel(providerType);

    this.logger.debug(
      `Creating ${providerType} provider with model ${model}`,
    );

    return this.createProvider(providerType, apiKey, model);
  }

  /**
   * Create a provider instance without encryption (for testing/direct use)
   *
   * @param type Provider type
   * @param apiKey Plaintext API key
   * @param model Default model to use
   * @returns Provider instance
   */
  createDirect(
    type: AIProviderType,
    apiKey: string,
    model: string,
  ): AIProviderInterface {
    if (!this.isValidProvider(type)) {
      throw new Error(
        `Unsupported provider type: ${type}. ` +
          `Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`,
      );
    }

    return this.createProvider(type, apiKey, model);
  }

  /**
   * Get list of supported provider types
   */
  getSupportedProviders(): AIProviderType[] {
    return [...SUPPORTED_PROVIDERS];
  }

  /**
   * Check if a provider type is supported
   */
  isValidProvider(type: string): type is AIProviderType {
    return SUPPORTED_PROVIDERS.includes(type as AIProviderType);
  }

  /**
   * Get default model for a provider type
   */
  getDefaultModel(type: AIProviderType): string {
    const defaults: Record<AIProviderType, string> = {
      claude: 'claude-3-5-sonnet-20241022',
      openai: 'gpt-4o',
      gemini: 'gemini-1.5-flash',
      deepseek: 'deepseek-chat',
      openrouter: 'anthropic/claude-3-5-sonnet',
    };
    return defaults[type];
  }

  /**
   * Internal method to create provider instance
   */
  private createProvider(
    type: AIProviderType,
    apiKey: string,
    model: string,
  ): AIProviderInterface {
    switch (type) {
      case 'claude':
        return new ClaudeProvider(apiKey, model);

      case 'openai':
        return new OpenAIProvider(apiKey, model);

      case 'gemini':
        return new GeminiProvider(apiKey, model);

      case 'deepseek':
        return new DeepSeekProvider(apiKey, model);

      case 'openrouter':
        return new OpenRouterProvider(apiKey, model);

      default:
        // This should never happen due to isValidProvider check
        throw new Error(`Unhandled provider type: ${type}`);
    }
  }
}
