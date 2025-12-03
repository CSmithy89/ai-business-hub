/**
 * OpenRouter Provider
 *
 * Implementation of AIProviderInterface for OpenRouter - a meta-provider
 * that gives access to 100+ models through a single API key.
 *
 * Uses OpenAI-compatible API with custom base URL and headers.
 *
 * Features:
 * - Single API key for multiple providers (Claude, GPT-4, Llama, Mistral, etc.)
 * - Automatic fallbacks if primary model unavailable
 * - Unified billing and usage tracking
 *
 * @module ai-providers/providers/openrouter
 */

import OpenAI from 'openai';
import {
  BaseAIProvider,
  ChatParams,
  ChatResponse,
  ChatChunk,
  ValidationResult,
  TokenUsage,
} from '../interfaces/ai-provider.interface';

/**
 * OpenRouter API base URL
 */
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Default cost per million tokens (average across models)
 * OpenRouter pricing varies by model, this is a fallback
 */
const DEFAULT_COST_PER_MILLION = 5.0;

export class OpenRouterProvider extends BaseAIProvider {
  readonly provider = 'openrouter' as const;
  readonly model: string;
  private client: OpenAI;
  private appName: string;
  private appUrl: string;

  constructor(
    apiKey: string,
    model: string,
    appName = 'HYVVE Platform',
    appUrl = 'https://hyvve.io',
  ) {
    super();
    this.model = model;
    this.appName = appName;
    this.appUrl = appUrl;

    this.client = new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': appUrl,
        'X-Title': appName,
      },
    });
  }

  async validateCredentials(): Promise<ValidationResult> {
    try {
      // Make a minimal request to validate the API key
      // Use a cheap model for validation
      await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return { valid: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { valid: false, error: errorMessage };
    }
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const modelToUse = params.model || this.model;

    const response = await this.client.chat.completions.create({
      model: modelToUse,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature,
      messages: params.messages,
    });

    const choice = response.choices[0];
    const usage: TokenUsage = {
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    };

    // Track usage for cumulative stats
    // OpenRouter pricing varies by model, use default
    this.trackUsage(usage, DEFAULT_COST_PER_MILLION);

    return {
      content: choice.message.content ?? '',
      finishReason: choice.finish_reason === 'stop' ? 'stop' : 'length',
      usage,
      model: response.model,
    };
  }

  async *streamChat(params: ChatParams): AsyncGenerator<ChatChunk, void, unknown> {
    const modelToUse = params.model || this.model;

    const stream = await this.client.chat.completions.create({
      model: modelToUse,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature,
      messages: params.messages,
      stream: true,
      stream_options: { include_usage: true },
    });

    let totalUsage: TokenUsage | undefined;

    for await (const chunk of stream) {
      const choice = chunk.choices[0];

      if (choice?.delta?.content) {
        yield { delta: choice.delta.content };
      }

      // Usage is in the final chunk
      if (chunk.usage) {
        totalUsage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens,
        };
      }

      if (choice?.finish_reason) {
        // Track usage from stream if available
        if (totalUsage) {
          this.trackUsage(totalUsage, DEFAULT_COST_PER_MILLION);
        }
        yield {
          delta: '',
          finishReason: choice.finish_reason === 'stop' ? 'stop' : 'length',
          usage: totalUsage,
        };
      }
    }
  }
}
