/**
 * OpenAI Assistant Client
 *
 * Implementation of IAssistantClient for OpenAI API.
 * Supports GPT-4, GPT-4o, o1, and o3 models.
 *
 * @module ai-providers/clients
 */

import OpenAI from 'openai';
import { Logger } from '@nestjs/common';
import {
  BaseAssistantClient,
  ChatCompletionOptions,
  ChatCompletionResponse,
  ChatMessage,
  ProviderCapabilities,
  StreamChunk,
  ToolDefinition,
} from '../interfaces';

/**
 * OpenAI model configurations
 */
const MODEL_CONFIG: Record<string, { maxTokens: number; supportsTools: boolean }> = {
  'gpt-4o': { maxTokens: 128000, supportsTools: true },
  'gpt-4o-mini': { maxTokens: 128000, supportsTools: true },
  'gpt-4-turbo': { maxTokens: 128000, supportsTools: true },
  'gpt-4': { maxTokens: 8192, supportsTools: true },
  'gpt-3.5-turbo': { maxTokens: 16385, supportsTools: true },
  o1: { maxTokens: 200000, supportsTools: false },
  'o1-mini': { maxTokens: 128000, supportsTools: false },
  'o3-mini': { maxTokens: 200000, supportsTools: false },
};

/**
 * Case-insensitive model config lookup
 */
function getModelConfig(model: string) {
  const lowerModel = model.toLowerCase();
  const key = Object.keys(MODEL_CONFIG).find((k) => k.toLowerCase() === lowerModel);
  return key ? MODEL_CONFIG[key] : MODEL_CONFIG['gpt-4o'];
}

/**
 * OpenAI Assistant Client
 */
export class OpenAIClient extends BaseAssistantClient {
  readonly provider = 'openai';
  readonly model: string;

  private readonly client: OpenAI;
  private readonly logger = new Logger(OpenAIClient.name);

  constructor(
    apiKey: string,
    model: string = 'gpt-4o',
    options?: { baseURL?: string; timeout?: number },
  ) {
    super();
    this.model = model;
    this.client = new OpenAI({
      apiKey,
      baseURL: options?.baseURL,
      timeout: options?.timeout || 60000,
    });

    this.logger.debug(`OpenAI client initialized with model: ${model}`);
  }

  getCapabilities(): ProviderCapabilities {
    const config = getModelConfig(this.model);

    return {
      supportsStreaming: true,
      supportsTools: config.supportsTools,
      supportsVision: this.model.toLowerCase().includes('gpt-4') || this.model.toLowerCase().includes('o'),
      supportsFunctionCalling: config.supportsTools,
      maxContextLength: config.maxTokens,
      supportedModels: Object.keys(MODEL_CONFIG),
    };
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const startTime = Date.now();

    try {
      const messages = this.formatMessages(options.messages);
      const tools = options.tools ? this.formatTools(options.tools) : undefined;

      const response = await this.client.chat.completions.create({
        model: options.model || this.model,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        tools,
        tool_choice: this.formatToolChoice(options.toolChoice),
        stream: false,
      });

      const choice = response.choices[0];
      const latency = Date.now() - startTime;

      this.logger.debug(
        `OpenAI completion: ${response.usage?.total_tokens} tokens, ${latency}ms`,
      );

      return {
        id: response.id,
        content: choice.message.content,
        role: 'assistant',
        toolCalls: choice.message.tool_calls
          ?.filter((tc): tc is OpenAI.Chat.Completions.ChatCompletionMessageToolCall & { type: 'function' } =>
            tc.type === 'function'
          )
          .map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments,
          })),
        finishReason: this.mapFinishReason(choice.finish_reason),
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        model: response.model,
        provider: this.provider,
      };
    } catch (error) {
      this.logger.error(`OpenAI completion failed: ${error}`);
      throw error;
    }
  }

  async *streamChatCompletion(
    options: Omit<ChatCompletionOptions, 'stream'>,
  ): AsyncIterable<StreamChunk> {
    const messages = this.formatMessages(options.messages);
    const tools = options.tools ? this.formatTools(options.tools) : undefined;

    const stream = await this.client.chat.completions.create({
      model: options.model || this.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      tools,
      tool_choice: this.formatToolChoice(options.toolChoice),
      stream: true,
    });

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      yield {
        id: chunk.id,
        delta: {
          content: choice.delta.content || undefined,
          role: choice.delta.role as 'assistant' | undefined,
          toolCalls: choice.delta.tool_calls?.map((tc) => ({
            id: tc.id,
            name: tc.function?.name,
            arguments: tc.function?.arguments,
          })),
        },
        finishReason: choice.finish_reason
          ? this.mapStreamingFinishReason(choice.finish_reason)
          : undefined,
      };
    }
  }

  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    try {
      // Make a minimal API call to validate the key
      await this.client.models.list();
      return { valid: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { valid: false, error: message };
    }
  }

  /**
   * More accurate token estimation for OpenAI models
   */
  estimateTokenCount(messages: ChatMessage[]): number {
    // GPT-4/3.5 uses ~4 chars per token on average
    // Add overhead for message structure
    let tokens = 0;

    for (const message of messages) {
      tokens += 4; // Message overhead
      tokens += Math.ceil(message.content.length / 4);
      if (message.name) {
        tokens += Math.ceil(message.name.length / 4);
      }
      if (message.toolCalls) {
        tokens += JSON.stringify(message.toolCalls).length / 4;
      }
    }

    tokens += 2; // Response priming
    return Math.ceil(tokens);
  }

  private formatMessages(
    messages: ChatMessage[],
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages.map((msg) => {
      if (msg.role === 'tool') {
        return {
          role: 'tool' as const,
          content: msg.content,
          tool_call_id: msg.toolCallId || '',
        };
      }

      if (msg.role === 'assistant' && msg.toolCalls) {
        return {
          role: 'assistant' as const,
          content: msg.content,
          tool_calls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: tc.arguments,
            },
          })),
        };
      }

      return {
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
        name: msg.name,
      };
    });
  }

  private formatTools(tools: ToolDefinition[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  private formatToolChoice(
    choice?: ChatCompletionOptions['toolChoice'],
  ): OpenAI.Chat.Completions.ChatCompletionToolChoiceOption | undefined {
    if (!choice) return undefined;
    if (typeof choice === 'string') return choice;
    return { type: 'function' as const, function: { name: choice.name } };
  }

  private mapFinishReason(
    reason: string | null,
  ): 'stop' | 'tool_calls' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'tool_calls':
        return 'tool_calls';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  /**
   * Map finish reason for streaming (excludes 'error')
   */
  private mapStreamingFinishReason(
    reason: string | null,
  ): 'stop' | 'tool_calls' | 'length' | 'content_filter' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'tool_calls':
        return 'tool_calls';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
