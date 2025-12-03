# Story 06-2: Create AI Provider Factory

## Story Info
- **Epic:** EPIC-06 - BYOAI Configuration
- **Story ID:** 06-2
- **Title:** Create AI Provider Factory
- **Points:** 3
- **Priority:** P0 (Critical)
- **Status:** drafted

## User Story
As a **platform developer**, I want a **unified provider factory** that can create AI provider instances from configuration, so that **the system can work with any supported AI provider through a consistent interface**.

## Acceptance Criteria

### AC1: Provider Interface Defined
- [ ] `AIProviderInterface` interface created in `apps/api/src/ai-providers/interfaces/ai-provider.interface.ts`
- [ ] Interface defines `provider` and `model` readonly properties
- [ ] Interface defines `validateCredentials()`, `chat()`, `streamChat()`, and `getUsage()` methods
- [ ] Supporting types defined: `ChatParams`, `ChatResponse`, `ChatChunk`, `UsageStats`

### AC2: Factory Service Created
- [ ] `AIProviderFactory` service created in `apps/api/src/ai-providers/ai-provider-factory.service.ts`
- [ ] Factory uses `CredentialEncryptionService` to decrypt API keys
- [ ] Factory creates correct provider instance based on `config.provider` field
- [ ] Factory throws descriptive error for unsupported providers

### AC3: Claude Provider Implemented
- [ ] `ClaudeProvider` class implements `AIProviderInterface`
- [ ] Uses `@anthropic-ai/sdk` for API calls
- [ ] Supports `validateCredentials()` - test API key validity
- [ ] Supports `chat()` - synchronous completion
- [ ] Supports `streamChat()` - streaming completion via AsyncGenerator
- [ ] Supports `getUsage()` - returns usage statistics

### AC4: OpenAI Provider Implemented
- [ ] `OpenAIProvider` class implements `AIProviderInterface`
- [ ] Uses `openai` SDK for API calls
- [ ] Implements all interface methods

### AC5: Gemini Provider Implemented
- [ ] `GeminiProvider` class implements `AIProviderInterface`
- [ ] Uses `@google/generative-ai` SDK for API calls
- [ ] Implements all interface methods

### AC6: DeepSeek Provider Implemented
- [ ] `DeepSeekProvider` class implements `AIProviderInterface`
- [ ] Uses OpenAI-compatible API endpoint (https://api.deepseek.com)
- [ ] Implements all interface methods

### AC7: OpenRouter Provider Implemented
- [ ] `OpenRouterProvider` class implements `AIProviderInterface`
- [ ] Uses OpenAI-compatible API endpoint (https://openrouter.ai/api/v1)
- [ ] Implements all interface methods
- [ ] Adds required `HTTP-Referer` and `X-Title` headers

### AC8: Module Registration
- [ ] `AIProvidersModule` created with all services registered
- [ ] Factory and providers properly exported for use in other modules
- [ ] Encryption service imported from shared package

### AC9: Unit Tests
- [ ] Factory tests verify correct provider instantiation
- [ ] Mock tests for each provider type
- [ ] Error handling tests for invalid provider types
- [ ] Test coverage >90%

## Technical Notes

### Directory Structure
```
apps/api/src/ai-providers/
├── ai-providers.module.ts
├── ai-provider-factory.service.ts
├── interfaces/
│   └── ai-provider.interface.ts
└── providers/
    ├── claude.provider.ts
    ├── openai.provider.ts
    ├── gemini.provider.ts
    ├── deepseek.provider.ts
    └── openrouter.provider.ts
```

### Provider SDKs Required
```bash
pnpm add @anthropic-ai/sdk openai @google/generative-ai
```

### Key Integration Points
- Uses `CredentialEncryptionService` from `@hyvve/shared` (Story 06-1)
- Will be used by API endpoints (Story 06-3)
- Will be integrated with AgentOS (Story 06-9)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests passing with >90% coverage
- [ ] TypeScript strict mode compliant
- [ ] ESLint passes with no warnings
- [ ] Code reviewed and approved
- [ ] Factory can create all 5 provider types
- [ ] Each provider implements complete interface

## Dependencies
- Story 06-1: Implement Credential Encryption (DONE)

## Out of Scope
- API endpoints (Story 06-3)
- Frontend UI (Story 06-4)
- Token usage tracking (Story 06-5)
- Health monitoring (Story 06-8)
