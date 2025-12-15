# Story 06-3: Create AI Provider API Endpoints

## Story Info
- **Epic:** EPIC-06 - BYOAI Configuration
- **Story ID:** 06-3
- **Title:** Create AI Provider API Endpoints
- **Points:** 3
- **Priority:** P0 (Critical)
- **Status:** drafted

## User Story
As a **workspace admin**, I want **REST API endpoints** to manage AI provider configurations, so that **I can add, update, remove, and test AI provider API keys**.

## Acceptance Criteria

### AC1: List Providers Endpoint
- [ ] GET `/api/ai-providers` returns list of workspace AI providers
- [ ] Excludes encrypted API keys from response
- [ ] Returns validation status and token usage for each provider
- [ ] Requires Owner/Admin permission

### AC2: Create Provider Endpoint
- [ ] POST `/api/ai-providers` creates new provider config
- [ ] Encrypts API key before storage using CredentialEncryptionService
- [ ] Validates required fields (provider, apiKey, defaultModel)
- [ ] Returns created provider (without API key)

### AC3: Get Provider Endpoint
- [ ] GET `/api/ai-providers/:id` returns provider details
- [ ] Excludes encrypted API key from response
- [ ] Returns 404 for non-existent provider

### AC4: Update Provider Endpoint
- [ ] PATCH `/api/ai-providers/:id` updates provider config
- [ ] Supports updating: defaultModel, maxTokensPerDay, apiKey
- [ ] Re-encrypts API key if provided
- [ ] Returns updated provider

### AC5: Delete Provider Endpoint
- [ ] DELETE `/api/ai-providers/:id` removes provider
- [ ] Returns 204 No Content on success
- [ ] Cascades to delete associated TokenUsage records

### AC6: Test Provider Endpoint
- [ ] POST `/api/ai-providers/:id/test` validates API key
- [ ] Uses AIProviderFactory to create provider instance
- [ ] Calls validateCredentials() and returns result
- [ ] Returns latency measurement

### AC7: DTOs and Validation
- [ ] CreateProviderDto with Zod validation
- [ ] UpdateProviderDto with Zod validation
- [ ] ProviderResponseDto (excludes apiKeyEncrypted)
- [ ] Proper error responses for validation failures

### AC8: Multi-tenant Isolation
- [ ] All endpoints scoped to current workspace
- [ ] TenantGuard applied to controller
- [ ] workspaceId extracted from request context

### AC9: Unit Tests
- [ ] Controller tests for all endpoints
- [ ] Service tests for business logic
- [ ] Test coverage >90%

## Technical Notes

### File Structure
```
apps/api/src/ai-providers/
├── ai-providers.controller.ts   (NEW)
├── ai-providers.service.ts      (NEW)
├── dto/
│   ├── create-provider.dto.ts   (NEW)
│   ├── update-provider.dto.ts   (NEW)
│   └── provider-response.dto.ts (NEW)
└── ai-providers.module.ts       (UPDATE - add controller, service)
```

### Dependencies
- Story 06-1: CredentialEncryptionService
- Story 06-2: AIProviderFactory

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests passing with >90% coverage
- [ ] TypeScript strict mode compliant
- [ ] ESLint passes with no warnings
- [ ] API documentation updated

## Out of Scope
- Usage tracking endpoints (Story 06-5, 06-6)
- Frontend UI (Story 06-4)
- Rate limiting
