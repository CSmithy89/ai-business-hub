/**
 * AI Providers Module Exports
 *
 * @module ai-providers
 */

// Module
export { AIProvidersModule } from './ai-providers.module';

// Services
export { AIProvidersService } from './ai-providers.service';
export { AIProviderFactory, ProviderConfig } from './ai-provider-factory.service';

// Controller
export { AIProvidersController } from './ai-providers.controller';

// DTOs
export * from './dto';

// Interfaces and types
export {
  AIProviderInterface,
  AIProviderType,
  ChatParams,
  ChatResponse,
  ChatChunk,
  ChatMessage,
  MessageRole,
  TokenUsage,
  UsageStats,
  ValidationResult,
  FinishReason,
  BaseAIProvider,
} from './interfaces/ai-provider.interface';

// Provider implementations
export { ClaudeProvider } from './providers/claude.provider';
export { OpenAIProvider } from './providers/openai.provider';
export { GeminiProvider } from './providers/gemini.provider';
export { DeepSeekProvider } from './providers/deepseek.provider';
export { OpenRouterProvider } from './providers/openrouter.provider';
