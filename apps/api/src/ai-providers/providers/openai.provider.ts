/**
 * OpenAI Provider
 *
 * Implementation of AIProviderInterface for OpenAI models.
 * Uses the official openai SDK.
 *
 * Supported models:
 * - gpt-4o, gpt-4o-mini
 * - gpt-4-turbo, gpt-4
 * - gpt-3.5-turbo
 * - o1, o1-mini
 *
 * @module ai-providers/providers/openai
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
 * Cost per million tokens for OpenAI models (as of 2024)
 * Using average of input/output costs
 */
const OPENAI_COSTS: Record<string, number> = {
  'gpt-4o': 7.5,
  'gpt-4o-mini': 0.375,
  'gpt-4-turbo': 20.0,
  'gpt-4': 45.0,
  'gpt-3.5-turbo': 1.0,
  o1: 22.5,
  'o1-mini': 4.5,
  default: 7.5,
};

export class OpenAIProvider extends BaseAIProvider {
  readonly provider: 'openai' | 'deepseek' = 'openai';
  readonly model: string;
  protected client: OpenAI;

  constructor(apiKey: string, model: string, baseURL?: string) {
    super();
    this.model = model;
    this.client = new OpenAI({
      apiKey,
      ...(baseURL && { baseURL }),
    });
  }

  async validateCredentials(): Promise<ValidationResult> {
    try {
      // Make a minimal request to validate the API key
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
    const costPerMillion = this.getCostPerMillion(modelToUse);
    this.trackUsage(usage, costPerMillion);

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
          const costPerMillion = this.getCostPerMillion(modelToUse);
          this.trackUsage(totalUsage, costPerMillion);
        }
        yield {
          delta: '',
          finishReason: choice.finish_reason === 'stop' ? 'stop' : 'length',
          usage: totalUsage,
        };
      }
    }
  }

  /**
   * Get cost per million tokens for a model
   * Override in subclasses for different pricing
   */
  protected getCostPerMillion(model: string): number {
    return OPENAI_COSTS[model] ?? OPENAI_COSTS.default;
  }
}
