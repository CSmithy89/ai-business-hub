/**
 * Assistant Client Factory Service
 *
 * Factory service for creating IAssistantClient instances based on
 * provider configuration. Integrates with the BYOAI provider system.
 *
 * @module ai-providers
 */

import { Injectable, Logger } from '@nestjs/common';
import { IAssistantClient } from './interfaces';
import { OpenAIClient } from './clients/openai-client';
import { ClaudeClient } from './clients/claude-client';
import { AIProvidersService } from './ai-providers.service';

/**
 * Supported provider types
 */
export type SupportedProvider = 'openai' | 'claude' | 'gemini' | 'deepseek' | 'openrouter';

/**
 * Options for creating an assistant client
 */
export interface CreateClientOptions {
  workspaceId: string;
  providerId?: string;
  providerType?: SupportedProvider;
  modelOverride?: string;
}

@Injectable()
export class AssistantClientFactory {
  private readonly logger = new Logger(AssistantClientFactory.name);

  constructor(private readonly providersService: AIProvidersService) {}

  /**
   * Create an assistant client for a workspace
   *
   * @param options Client creation options
   * @returns IAssistantClient instance
   */
  async createClient(options: CreateClientOptions): Promise<IAssistantClient> {
    const { workspaceId, providerId, providerType, modelOverride } = options;

    this.logger.debug(
      `Creating assistant client: workspace=${workspaceId}, ` +
        `providerId=${providerId}, providerType=${providerType}`,
    );

    // Get provider configuration
    let provider;

    if (providerId) {
      // Get specific provider by ID
      provider = await this.providersService.findOne(workspaceId, providerId);
    } else if (providerType) {
      // Get provider by type
      const providers = await this.providersService.findAll(workspaceId);
      provider = providers.find((p) => p.provider === providerType && p.isValid);

      if (!provider) {
        throw new Error(`No valid ${providerType} provider found for workspace`);
      }
    } else {
      // Get default provider
      const providers = await this.providersService.findAll(workspaceId);
      provider =
        providers.find((p) => p.isDefault && p.isValid) ||
        providers.find((p) => p.isValid);

      if (!provider) {
        throw new Error('No valid AI provider found for workspace');
      }
    }

    // Get decrypted API key
    const apiKey = await this.providersService.getDecryptedApiKey(workspaceId, provider.id);

    if (!apiKey) {
      throw new Error(`Failed to get API key for provider ${provider.provider}`);
    }

    // Determine model to use
    const model = modelOverride || provider.defaultModel;

    // Create client based on provider type
    return this.createProviderClient(provider.provider as SupportedProvider, apiKey, model);
  }

  /**
   * Create a client for a specific provider type
   *
   * @param providerType Provider type
   * @param apiKey API key
   * @param model Model to use
   * @returns IAssistantClient instance
   */
  createProviderClient(
    providerType: SupportedProvider,
    apiKey: string,
    model: string,
  ): IAssistantClient {
    switch (providerType) {
      case 'openai':
        return new OpenAIClient(apiKey, model);

      case 'claude':
        return new ClaudeClient(apiKey, model);

      case 'deepseek':
        // DeepSeek uses OpenAI-compatible API
        return new OpenAIClient(apiKey, model, {
          baseURL: 'https://api.deepseek.com',
        });

      case 'openrouter':
        // OpenRouter uses OpenAI-compatible API
        return new OpenAIClient(apiKey, model, {
          baseURL: 'https://openrouter.ai/api/v1',
        });

      case 'gemini':
        // Gemini support would require a separate client implementation
        // For now, fall back to OpenAI client with a warning
        this.logger.warn('Gemini provider not yet fully supported, using OpenAI-compatible API');
        throw new Error('Gemini provider not yet implemented');

      default:
        throw new Error(`Unsupported provider type: ${providerType}`);
    }
  }

  /**
   * Get supported provider types
   */
  getSupportedProviders(): SupportedProvider[] {
    return ['openai', 'claude', 'deepseek', 'openrouter'];
  }

  /**
   * Check if a provider type is supported
   */
  isProviderSupported(providerType: string): boolean {
    return this.getSupportedProviders().includes(providerType as SupportedProvider);
  }
}
