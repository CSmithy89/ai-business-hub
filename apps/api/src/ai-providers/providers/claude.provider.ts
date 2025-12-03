/**
 * Claude AI Provider
 *
 * Implementation of AIProviderInterface for Anthropic's Claude models.
 * Uses the official @anthropic-ai/sdk package.
 *
 * Supported models:
 * - claude-3-5-sonnet-20241022 (recommended)
 * - claude-3-opus-20240229
 * - claude-3-sonnet-20240229
 * - claude-3-haiku-20240307
 *
 * @module ai-providers/providers/claude
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  BaseAIProvider,
  ChatParams,
  ChatResponse,
  ChatChunk,
  ValidationResult,
  TokenUsage,
} from '../interfaces/ai-provider.interface';

/**
 * Cost per million tokens for Claude models (as of 2024)
 * Using average of input/output costs
 */
const CLAUDE_COSTS: Record<string, number> = {
  'claude-3-5-sonnet-20241022': 6.0,
  'claude-3-opus-20240229': 45.0,
  'claude-3-sonnet-20240229': 9.0,
  'claude-3-haiku-20240307': 0.75,
  default: 6.0,
};

export class ClaudeProvider extends BaseAIProvider {
  readonly provider = 'claude' as const;
  readonly model: string;
  private client: Anthropic;

  constructor(apiKey: string, model: string) {
    super();
    this.model = model;
    this.client = new Anthropic({ apiKey });
  }

  async validateCredentials(): Promise<ValidationResult> {
    try {
      // Make a minimal request to validate the API key
      await this.client.messages.create({
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

    // Convert messages to Anthropic format
    const messages = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Extract system message if present
    const systemMessage = params.messages.find((m) => m.role === 'system');

    const response = await this.client.messages.create({
      model: modelToUse,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature,
      messages,
      ...(systemMessage && { system: systemMessage.content }),
    });

    const usage: TokenUsage = {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    };

    // Track usage for cumulative stats
    const costPerMillion = CLAUDE_COSTS[modelToUse] ?? CLAUDE_COSTS.default;
    this.trackUsage(usage, costPerMillion);

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      content,
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'length',
      usage,
      model: response.model,
    };
  }

  async *streamChat(params: ChatParams): AsyncGenerator<ChatChunk, void, unknown> {
    const modelToUse = params.model || this.model;

    // Convert messages to Anthropic format
    const messages = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Extract system message if present
    const systemMessage = params.messages.find((m) => m.role === 'system');

    const stream = this.client.messages.stream({
      model: modelToUse,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature,
      messages,
      ...(systemMessage && { system: systemMessage.content }),
    });

    let totalUsage: TokenUsage | undefined;

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield { delta: event.delta.text };
      }

      if (event.type === 'message_delta' && event.usage) {
        totalUsage = {
          promptTokens: 0, // Not available in stream
          completionTokens: event.usage.output_tokens,
          totalTokens: event.usage.output_tokens,
        };
      }

      if (event.type === 'message_stop') {
        // Track usage from stream if available
        if (totalUsage) {
          const costPerMillion = CLAUDE_COSTS[modelToUse] ?? CLAUDE_COSTS.default;
          this.trackUsage(totalUsage, costPerMillion);
        }
        yield { delta: '', finishReason: 'stop', usage: totalUsage };
      }
    }
  }
}
