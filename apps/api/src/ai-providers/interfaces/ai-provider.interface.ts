/**
 * AI Provider Interface and Types
 *
 * Defines the contract for all AI provider implementations (Claude, OpenAI, Gemini, etc.)
 * Each provider must implement these methods to ensure consistent behavior across the platform.
 *
 * @module ai-providers/interfaces
 */

/**
 * Supported AI provider types
 */
export type AIProviderType =
  | 'claude'
  | 'openai'
  | 'gemini'
  | 'deepseek'
  | 'openrouter';

/**
 * Message role in a chat conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Single message in a chat conversation
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * Parameters for chat completion requests
 */
export interface ChatParams {
  /**
   * Array of messages in the conversation
   */
  messages: ChatMessage[];

  /**
   * Sampling temperature (0-2). Higher values = more random
   * @default 1.0
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   * @default 4096
   */
  maxTokens?: number;

  /**
   * Model to use (overrides provider default)
   */
  model?: string;

  /**
   * Additional provider-specific options
   */
  options?: Record<string, unknown>;
}

/**
 * Reason why the model stopped generating
 */
export type FinishReason = 'stop' | 'length' | 'error';

/**
 * Token usage statistics
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Response from a synchronous chat completion
 */
export interface ChatResponse {
  /**
   * Generated text content
   */
  content: string;

  /**
   * Why the model stopped generating
   */
  finishReason: FinishReason;

  /**
   * Token usage for this request
   */
  usage: TokenUsage;

  /**
   * Model that was used
   */
  model: string;
}

/**
 * Single chunk in a streaming response
 */
export interface ChatChunk {
  /**
   * Incremental text content
   */
  delta: string;

  /**
   * Set when streaming is complete
   */
  finishReason?: FinishReason;

  /**
   * Token usage (only present in final chunk for some providers)
   */
  usage?: TokenUsage;
}

/**
 * Usage statistics with cost estimation
 */
export interface UsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  /**
   * Estimated cost in USD
   */
  estimatedCost: number;
}

/**
 * Result of credential validation
 */
export interface ValidationResult {
  /**
   * Whether the credentials are valid
   */
  valid: boolean;

  /**
   * Error message if validation failed
   */
  error?: string;
}

/**
 * AI Provider Interface
 *
 * All AI providers must implement this interface to be used by the factory.
 * This ensures consistent behavior regardless of which provider is being used.
 */
export interface AIProviderInterface {
  /**
   * Provider type identifier
   */
  readonly provider: AIProviderType;

  /**
   * Default model for this provider instance
   */
  readonly model: string;

  /**
   * Validate API key by making a minimal test request
   *
   * @returns Validation result with error message if failed
   */
  validateCredentials(): Promise<ValidationResult>;

  /**
   * Synchronous chat completion
   *
   * @param params Chat parameters including messages
   * @returns Complete response with content and usage
   */
  chat(params: ChatParams): Promise<ChatResponse>;

  /**
   * Streaming chat completion
   *
   * @param params Chat parameters including messages
   * @yields Incremental chunks as they arrive
   */
  streamChat(params: ChatParams): AsyncGenerator<ChatChunk, void, unknown>;

  /**
   * Get cumulative usage statistics for this provider instance
   *
   * @returns Usage stats with estimated cost
   */
  getUsage(): Promise<UsageStats>;
}

/**
 * Base class for AI providers with common functionality
 *
 * Providers can extend this to get built-in usage tracking
 */
export abstract class BaseAIProvider implements AIProviderInterface {
  abstract readonly provider: AIProviderType;
  abstract readonly model: string;

  protected usageStats: UsageStats = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  };

  abstract validateCredentials(): Promise<ValidationResult>;
  abstract chat(params: ChatParams): Promise<ChatResponse>;
  abstract streamChat(params: ChatParams): AsyncGenerator<ChatChunk, void, unknown>;

  /**
   * Track token usage and update cumulative stats
   *
   * @param usage Token usage from a request
   * @param costPerMillionTokens Cost per million tokens for this model
   */
  protected trackUsage(usage: TokenUsage, costPerMillionTokens: number): void {
    this.usageStats.promptTokens += usage.promptTokens;
    this.usageStats.completionTokens += usage.completionTokens;
    this.usageStats.totalTokens += usage.totalTokens;
    this.usageStats.estimatedCost +=
      (usage.totalTokens / 1_000_000) * costPerMillionTokens;
  }

  async getUsage(): Promise<UsageStats> {
    return { ...this.usageStats };
  }
}
