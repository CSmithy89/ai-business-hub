/**
 * Claude (Anthropic) Assistant Client
 *
 * Implementation of IAssistantClient for Anthropic Claude API.
 * Supports Claude 3 and Claude 3.5 models.
 *
 * @module ai-providers/clients
 */

import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '@nestjs/common';
import {
  BaseAssistantClient,
  ChatCompletionOptions,
  ChatCompletionResponse,
  ChatMessage,
  ProviderCapabilities,
  StreamChunk,
  ToolCall,
  ToolDefinition,
} from '../interfaces';

/**
 * Claude model configurations
 */
const MODEL_CONFIG: Record<string, { maxTokens: number; supportsTools: boolean }> = {
  'claude-3-5-sonnet-20241022': { maxTokens: 200000, supportsTools: true },
  'claude-3-5-haiku-20241022': { maxTokens: 200000, supportsTools: true },
  'claude-3-opus-20240229': { maxTokens: 200000, supportsTools: true },
  'claude-3-sonnet-20240229': { maxTokens: 200000, supportsTools: true },
  'claude-3-haiku-20240307': { maxTokens: 200000, supportsTools: true },
};

/**
 * Case-insensitive model config lookup
 */
function getModelConfig(model: string) {
  const lowerModel = model.toLowerCase();
  const key = Object.keys(MODEL_CONFIG).find((k) => k.toLowerCase() === lowerModel);
  return key ? MODEL_CONFIG[key] : MODEL_CONFIG['claude-3-5-sonnet-20241022'];
}

/**
 * Claude Assistant Client
 */
export class ClaudeClient extends BaseAssistantClient {
  readonly provider = 'claude';
  readonly model: string;

  private readonly client: Anthropic;
  private readonly logger = new Logger(ClaudeClient.name);

  constructor(
    apiKey: string,
    model: string = 'claude-3-5-sonnet-20241022',
    options?: { baseURL?: string; timeout?: number },
  ) {
    super();
    this.model = model;
    this.client = new Anthropic({
      apiKey,
      baseURL: options?.baseURL,
      timeout: options?.timeout || 60000,
    });

    this.logger.debug(`Claude client initialized with model: ${model}`);
  }

  getCapabilities(): ProviderCapabilities {
    const config = getModelConfig(this.model);

    return {
      supportsStreaming: true,
      supportsTools: config.supportsTools,
      supportsVision: true,
      supportsFunctionCalling: config.supportsTools,
      maxContextLength: config.maxTokens,
      supportedModels: Object.keys(MODEL_CONFIG),
    };
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const startTime = Date.now();

    try {
      const { systemPrompt, messages } = this.formatMessages(options.messages);
      const tools = options.tools ? this.formatTools(options.tools) : undefined;

      const response = await this.client.messages.create({
        model: options.model || this.model,
        max_tokens: options.maxTokens || 4096,
        system: systemPrompt,
        messages,
        temperature: options.temperature,
        tools,
        tool_choice: this.formatToolChoice(options.toolChoice),
      });

      const latency = Date.now() - startTime;

      // Extract content and tool uses
      let content = '';
      const toolCalls: ToolCall[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: JSON.stringify(block.input),
          });
        }
      }

      this.logger.debug(
        `Claude completion: ${response.usage.input_tokens + response.usage.output_tokens} tokens, ${latency}ms`,
      );

      return {
        id: response.id,
        content: content || null,
        role: 'assistant',
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: this.mapStopReason(response.stop_reason),
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        provider: this.provider,
      };
    } catch (error) {
      this.logger.error(`Claude completion failed: ${error}`);
      throw error;
    }
  }

  async *streamChatCompletion(
    options: Omit<ChatCompletionOptions, 'stream'>,
  ): AsyncIterable<StreamChunk> {
    const { systemPrompt, messages } = this.formatMessages(options.messages);
    const tools = options.tools ? this.formatTools(options.tools) : undefined;

    const stream = await this.client.messages.create({
      model: options.model || this.model,
      max_tokens: options.maxTokens || 4096,
      system: systemPrompt,
      messages,
      temperature: options.temperature,
      tools,
      tool_choice: this.formatToolChoice(options.toolChoice),
      stream: true,
    });

    let currentId = '';
    const toolCallsInProgress = new Map<number, Partial<ToolCall>>();

    for await (const event of stream) {
      if (event.type === 'message_start') {
        currentId = event.message.id;
      } else if (event.type === 'content_block_delta') {
        const delta = event.delta;

        if ('text' in delta && delta.type === 'text_delta') {
          yield {
            id: currentId,
            delta: {
              content: delta.text,
            },
          };
        } else if ('partial_json' in delta && delta.type === 'input_json_delta') {
          // Handle tool call updates
          const toolIndex = event.index;
          const existingTool = toolCallsInProgress.get(toolIndex) || {};
          existingTool.arguments =
            (existingTool.arguments || '') + (delta as { partial_json: string }).partial_json;
          toolCallsInProgress.set(toolIndex, existingTool);
        }
      } else if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          toolCallsInProgress.set(event.index, {
            id: event.content_block.id,
            name: event.content_block.name,
            arguments: '',
          });
        }
      } else if (event.type === 'message_delta') {
        if (event.delta.stop_reason) {
          // Yield any pending tool calls
          if (toolCallsInProgress.size > 0) {
            yield {
              id: currentId,
              delta: {
                toolCalls: Array.from(toolCallsInProgress.values()) as ToolCall[],
              },
              finishReason: 'tool_calls',
            };
          }

          yield {
            id: currentId,
            delta: {},
            finishReason: this.mapStreamingStopReason(event.delta.stop_reason),
          };
        }
      }
    }
  }

  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    try {
      // Make a minimal API call to validate the key
      await this.client.messages.create({
        model: this.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      });
      return { valid: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { valid: false, error: message };
    }
  }

  private formatMessages(messages: ChatMessage[]): {
    systemPrompt: string;
    messages: Anthropic.MessageParam[];
  } {
    let systemPrompt = '';
    const formattedMessages: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt += msg.content + '\n';
        continue;
      }

      if (msg.role === 'tool') {
        // Tool results in Claude format
        formattedMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.toolCallId || '',
              content: msg.content,
            },
          ],
        });
        continue;
      }

      if (msg.role === 'assistant' && msg.toolCalls) {
        // Assistant message with tool calls
        const content: Anthropic.ContentBlockParam[] = [];
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }
        for (const tc of msg.toolCalls) {
          let input: Record<string, unknown>;
          try {
            input = JSON.parse(tc.arguments);
          } catch {
            this.logger.warn(`Failed to parse tool call arguments for ${tc.name}, using empty object`);
            input = {};
          }
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input,
          });
        }
        formattedMessages.push({
          role: 'assistant',
          content,
        });
        continue;
      }

      formattedMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    return { systemPrompt: systemPrompt.trim(), messages: formattedMessages };
  }

  private formatTools(tools: ToolDefinition[]): Anthropic.Tool[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters as Anthropic.Tool.InputSchema,
    }));
  }

  private formatToolChoice(
    choice?: ChatCompletionOptions['toolChoice'],
  ): Anthropic.MessageCreateParams['tool_choice'] {
    if (!choice) return undefined;
    if (choice === 'auto') return { type: 'auto' };
    if (choice === 'none') return undefined;
    if (choice === 'required') return { type: 'any' };
    if (typeof choice === 'object') return { type: 'tool', name: choice.name };
    return undefined;
  }

  private mapStopReason(
    reason: string | null,
  ): 'stop' | 'tool_calls' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'tool_use':
        return 'tool_calls';
      case 'max_tokens':
        return 'length';
      default:
        return 'stop';
    }
  }

  /**
   * Map stop reason for streaming (excludes 'error')
   */
  private mapStreamingStopReason(
    reason: string | null,
  ): 'stop' | 'tool_calls' | 'length' | 'content_filter' {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'tool_use':
        return 'tool_calls';
      case 'max_tokens':
        return 'length';
      default:
        return 'stop';
    }
  }
}
