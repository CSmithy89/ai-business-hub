/**
 * IAssistantClient Interface
 *
 * Unified interface for AI assistant communication across different providers.
 * This abstraction allows the platform to work with any AI provider using
 * a consistent API.
 *
 * @module ai-providers/interfaces
 */

/**
 * Message role in conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

/**
 * Tool/Function definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Tool call from assistant
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

/**
 * Tool result to send back
 */
export interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

/**
 * Chat completion options
 */
export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required' | { name: string };
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Chat completion response
 */
export interface ChatCompletionResponse {
  id: string;
  content: string | null;
  role: MessageRole;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter' | 'error';
  usage?: TokenUsage;
  model: string;
  provider: string;
}

/**
 * Streaming chunk from assistant
 */
export interface StreamChunk {
  id: string;
  delta: {
    content?: string;
    role?: MessageRole;
    toolCalls?: Partial<ToolCall>[];
  };
  finishReason?: 'stop' | 'tool_calls' | 'length' | 'content_filter';
}

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  maxContextLength: number;
  supportedModels: string[];
}

/**
 * IAssistantClient Interface
 *
 * Core interface that all AI provider clients must implement.
 * This provides a unified way to interact with different AI providers
 * (OpenAI, Claude, Gemini, DeepSeek, OpenRouter, etc.)
 */
export interface IAssistantClient {
  /**
   * Provider identifier
   */
  readonly provider: string;

  /**
   * Current model being used
   */
  readonly model: string;

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities;

  /**
   * Send chat completion request
   *
   * @param options Chat completion options
   * @returns Promise resolving to completion response
   */
  chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;

  /**
   * Send streaming chat completion request
   *
   * @param options Chat completion options (stream will be set to true)
   * @returns AsyncIterable of stream chunks
   */
  streamChatCompletion(
    options: Omit<ChatCompletionOptions, 'stream'>,
  ): AsyncIterable<StreamChunk>;

  /**
   * Continue conversation with tool results
   *
   * @param messages Current messages including tool calls
   * @param toolResults Tool execution results
   * @param options Additional options
   * @returns Promise resolving to completion response
   */
  continueWithToolResults(
    messages: ChatMessage[],
    toolResults: ToolResult[],
    options?: Partial<ChatCompletionOptions>,
  ): Promise<ChatCompletionResponse>;

  /**
   * Validate that the client is properly configured
   *
   * @returns Promise resolving to validation result
   */
  validateConfiguration(): Promise<{ valid: boolean; error?: string }>;

  /**
   * Get estimated token count for messages
   *
   * @param messages Messages to estimate
   * @returns Estimated token count
   */
  estimateTokenCount(messages: ChatMessage[]): number;
}

/**
 * Base implementation with common functionality
 */
export abstract class BaseAssistantClient implements IAssistantClient {
  abstract readonly provider: string;
  abstract readonly model: string;

  abstract getCapabilities(): ProviderCapabilities;
  abstract chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;
  abstract streamChatCompletion(
    options: Omit<ChatCompletionOptions, 'stream'>,
  ): AsyncIterable<StreamChunk>;
  abstract validateConfiguration(): Promise<{ valid: boolean; error?: string }>;

  /**
   * Default implementation for continuing with tool results
   */
  async continueWithToolResults(
    messages: ChatMessage[],
    toolResults: ToolResult[],
    options?: Partial<ChatCompletionOptions>,
  ): Promise<ChatCompletionResponse> {
    // Add tool results to messages
    const updatedMessages: ChatMessage[] = [
      ...messages,
      ...toolResults.map((result) => ({
        role: 'tool' as MessageRole,
        content: result.content,
        toolCallId: result.toolCallId,
      })),
    ];

    return this.chatCompletion({
      messages: updatedMessages,
      ...options,
    });
  }

  /**
   * Default token estimation (rough approximation)
   * Override in provider-specific implementations for accuracy
   */
  estimateTokenCount(messages: ChatMessage[]): number {
    let totalChars = 0;

    for (const message of messages) {
      totalChars += message.content.length;
      if (message.name) {
        totalChars += message.name.length;
      }
    }

    // Rough estimation: ~4 characters per token
    return Math.ceil(totalChars / 4);
  }
}

/**
 * Factory function type for creating assistant clients
 */
export type AssistantClientFactory = (
  apiKey: string,
  model: string,
  options?: Record<string, unknown>,
) => IAssistantClient;
