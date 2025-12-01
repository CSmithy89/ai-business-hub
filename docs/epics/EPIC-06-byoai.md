# Epic 06: BYOAI Configuration

**Epic ID:** EPIC-06
**Status:** Ready for Development
**Priority:** P0 - Critical
**Phase:** Phase 4 - Event Bus & BYOAI

---

## Epic Overview

Implement Bring Your Own AI (BYOAI) configuration allowing workspaces to connect their own AI provider API keys with encrypted storage and usage tracking.

### Business Value
BYOAI enables customers to use their existing AI provider relationships, control costs, and maintain data sovereignty. It's a key differentiator for enterprise adoption.

### Success Criteria
- [ ] Users can add Claude, OpenAI, Gemini, DeepSeek, **OpenRouter** keys
- [ ] API keys encrypted at rest (AES-256)
- [ ] Keys validated before saving
- [ ] Token usage tracked per provider
- [ ] Daily limits enforceable
- [ ] **OpenRouter integration** for access to 100+ models via single API key

---

## Stories

### Story 06.1: Implement Credential Encryption

**Points:** 2
**Priority:** P0

**As a** platform
**I want** API keys encrypted at rest
**So that** credentials are protected

**Acceptance Criteria:**
- [ ] Create `CredentialManagerService`
- [ ] Implement AES-256-GCM encryption
- [ ] Store encryption key in environment
- [ ] Create `encrypt(plaintext)` method
- [ ] Create `decrypt(ciphertext)` method
- [ ] Use unique IV per encryption

**Implementation:**
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

class CredentialManager {
  private readonly algorithm = 'aes-256-gcm'
  private readonly key: Buffer

  encrypt(plaintext: string): string { ... }
  decrypt(ciphertext: string): string { ... }
}
```

---

### Story 06.2: Create AI Provider Factory

**Points:** 3
**Priority:** P0

**As a** developer
**I want** a unified interface for AI providers
**So that** I can swap providers transparently

**Acceptance Criteria:**
- [ ] Create `AIProviderInterface`
- [ ] Implement Claude provider
- [ ] Implement OpenAI provider
- [ ] Implement Gemini provider
- [ ] Implement DeepSeek provider
- [ ] Implement **OpenRouter provider** (access to 100+ models)
- [ ] Create `AIProviderFactory` service
- [ ] All providers implement common interface

**Interface:**
```typescript
interface AIProviderInterface {
  readonly provider: 'claude' | 'openai' | 'gemini' | 'deepseek' | 'openrouter';
  validateCredentials(): Promise<boolean>;
  chat(params: ChatParams): Promise<ChatResponse>;
  streamChat(params: ChatParams): AsyncGenerator<ChatChunk>;
  getUsage(): Promise<UsageStats>;
}
```

**OpenRouter Benefit:**
OpenRouter provides unified access to 100+ models (Claude, GPT-4, Llama, Mistral, etc.) through a single API key, with automatic fallbacks and cost optimization.

---

### Story 06.3: Create AI Provider API Endpoints

**Points:** 2
**Priority:** P0

**As a** workspace admin
**I want** to manage AI providers via API
**So that** I can configure provider keys

**Acceptance Criteria:**
- [ ] POST `/api/ai-providers` - Add provider
  - Encrypt API key before storage
  - Validate key with provider
- [ ] GET `/api/ai-providers` - List providers (hide keys)
- [ ] PATCH `/api/ai-providers/:id` - Update config
- [ ] DELETE `/api/ai-providers/:id` - Remove provider
- [ ] POST `/api/ai-providers/:id/test` - Test key validity
- [ ] Owner/Admin permission required

---

### Story 06.4: Create AI Provider Settings UI

**Points:** 3
**Priority:** P0

**As a** workspace admin
**I want** a settings page for AI providers
**So that** I can configure and monitor them

**Acceptance Criteria:**
- [ ] Create page at `/settings/ai-providers`
- [ ] List configured providers with status
- [ ] Add provider form:
  - Provider selector dropdown
  - API key input (masked)
  - Default model selector
  - Daily token limit
- [ ] Test connection button
- [ ] Show validation status
- [ ] Delete with confirmation

---

### Story 06.5: Implement Token Usage Tracking

**Points:** 3
**Priority:** P0

**As a** workspace admin
**I want** to see token usage per provider
**So that** I can monitor costs

**Acceptance Criteria:**
- [ ] Create `TokenUsageService`
- [ ] Log each API call:
  - Provider, model, agent
  - Prompt tokens, completion tokens
  - Estimated cost
  - Duration
- [ ] Create GET `/api/ai-providers/usage` endpoint
- [ ] Support date range filtering
- [ ] Aggregate by provider, model, agent
- [ ] Calculate estimated costs

---

### Story 06.6: Create Token Usage Dashboard

**Points:** 2
**Priority:** P1

**As a** workspace admin
**I want** to visualize token usage
**So that** I can optimize AI costs

**Acceptance Criteria:**
- [ ] Add usage section to AI provider settings
- [ ] Show daily/weekly/monthly usage charts
- [ ] Break down by provider
- [ ] Break down by agent
- [ ] Show cost estimates
- [ ] Show usage vs daily limit

---

### Story 06.7: Implement Daily Token Limits

**Points:** 2
**Priority:** P1

**As a** workspace admin
**I want** to set daily token limits
**So that** costs don't exceed budget

**Acceptance Criteria:**
- [ ] Add `maxTokensPerDay` to provider config
- [ ] Track `tokensUsedToday` counter
- [ ] Reset counter daily (scheduled job)
- [ ] Check limit before API calls
- [ ] Return error when limit exceeded
- [ ] Emit `ai.limit.reached` event
- [ ] Send notification to admins

---

### Story 06.8: Implement Provider Health Monitoring

**Points:** 2
**Priority:** P1

**As a** platform
**I want** to monitor provider health
**So that** users know when there are issues

**Acceptance Criteria:**
- [ ] Periodic key validation (daily)
- [ ] Track API error rates
- [ ] Mark provider as invalid on persistent errors
- [ ] Notify admins on provider issues
- [ ] Show health status in UI
- [ ] Auto-failover to backup provider (future)

---

### Story 06.9: Integrate AgentOS with BYOAI Providers

**Points:** 3
**Priority:** P0

**As a** platform developer
**I want** AgentOS agents to use workspace BYOAI providers
**So that** AI agents use customer-provided API keys

**Acceptance Criteria:**
- [ ] Configure Agno model abstraction with workspace credentials
- [ ] Pass workspace API keys to AgentOS at runtime
- [ ] Support dynamic model selection based on workspace config:
  - Use workspace default model if configured
  - Fall back to platform defaults
- [ ] Route token usage tracking through NestJS service
- [ ] Handle credential refresh on key rotation
- [ ] Test with all supported providers (Claude, OpenAI, Gemini, DeepSeek)

**Implementation Notes:**
Agno supports 40+ model providers natively. Instead of building custom provider abstractions in NestJS, leverage Agno's built-in support:

```python
# agents/config.py
from agno.model.anthropic import Claude
from agno.model.openai import OpenAI
from agno.model.google import Gemini

def get_model_for_workspace(workspace_id: str, provider: str):
    """Get configured model for workspace using encrypted credentials."""
    config = fetch_workspace_ai_config(workspace_id)

    if provider == 'claude':
        return Claude(
            id="claude-sonnet-4-20250514",
            api_key=config.api_key,
        )
    elif provider == 'openai':
        return OpenAI(
            id="gpt-4o",
            api_key=config.api_key,
        )
    # ... etc
```

**References:**
- ADR-007: AgentOS for Agent Runtime
- ADR-006: BYOAI Provider Abstraction

---

### Story 06.10: Implement IAssistantClient Interface Pattern

**Points:** 3
**Priority:** P0

**As a** platform developer
**I want** a unified interface for AI SDK clients
**So that** future modules can add new AI SDKs (Claude Code, Codex) without changing core code

**Acceptance Criteria:**
- [ ] Create `IAssistantClient` interface in `packages/shared/types/assistant.ts`
- [ ] Define core interface methods:
  - `sendQuery(prompt, cwd, resumeSessionId?)` - AsyncGenerator<MessageChunk>
  - `getType()` - Returns client identifier
  - `validateCredentials()` - Test API key/token
- [ ] Define `MessageChunk` types:
  - `assistant` - Text response
  - `tool` - Tool invocation
  - `result` - Session ID for persistence
  - `thinking` - Reasoning (for Codex)
- [ ] Create `AssistantClientFactory` service in NestJS
- [ ] Implement base `AgnoAssistantClient` wrapping AgentOS
- [ ] Support both API key and OAuth token credential types
- [ ] Add credential type to `AIProviderConfig` model

**Interface Definition:**
```typescript
// packages/shared/src/types/assistant.ts
export interface MessageChunk {
  type: 'assistant' | 'tool' | 'result' | 'system' | 'thinking';
  content?: string;
  sessionId?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
}

export interface IAssistantClient {
  sendQuery(
    prompt: string,
    cwd: string,
    resumeSessionId?: string
  ): AsyncGenerator<MessageChunk>;

  getType(): string;
  validateCredentials(): Promise<boolean>;
}

export type CredentialType = 'api_key' | 'oauth_token';

export interface AssistantCredentials {
  type: CredentialType;
  value: string;  // Encrypted
  provider: string;
}
```

**Why This Matters:**
This interface enables the **Project Management module** to add:
- Claude Code SDK client (with OAuth subscription passthrough)
- Codex SDK client
- CCR Custom Router for dynamic provider selection

Without changing foundation code.

**References:**
- Research: `docs/modules/bm-pm/research/sdk-layer-integration.md`
- Pattern Source: `docs/architecture/remote-coding-agent-patterns.md`

---

### Story 06.11: Agent Model Preferences UI

**Points:** 3
**Priority:** P1

**As a** workspace admin
**I want** to configure which LLM each agent type uses
**So that** I can optimize cost/performance per agent

**Acceptance Criteria:**
- [ ] Add "Agent Preferences" section to AI Provider settings
- [ ] List all available agent types (Approval, Orchestrator, etc.)
- [ ] For each agent, allow selecting:
  - Provider (Claude, OpenAI, Gemini, DeepSeek, **OpenRouter**)
  - Model (based on provider - **OpenRouter shows 100+ models**)
  - Fallback provider/model
- [ ] Validate selected model is available with configured credentials
- [ ] Store preferences in workspace settings
- [ ] AgentOS reads preferences when initializing agents
- [ ] Show estimated cost indicator per model choice
- [ ] **OpenRouter model browser** - searchable list of 100+ available models

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ Agent Model Preferences                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Approval Agent                                               │
│ ┌───────────────────┐  ┌─────────────────┐                  │
│ │ Provider: Claude  │  │ Model: Sonnet   │  💰 Med          │
│ └───────────────────┘  └─────────────────┘                  │
│                                                              │
│ Orchestrator Agent                                           │
│ ┌───────────────────┐  ┌─────────────────┐                  │
│ │ Provider: OpenAI  │  │ Model: GPT-4o   │  💰 Med          │
│ └───────────────────┘  └─────────────────┘                  │
│                                                              │
│ Research Agent                                               │
│ ┌───────────────────┐  ┌─────────────────┐                  │
│ │ Provider:OpenRouter│ │ Model: Llama 3  │  💰 Low          │
│ └───────────────────┘  └─────────────────┘                  │
│  └─ 🔍 Browse 100+ models...                                │
│                                                              │
│ Content Agent                                                │
│ ┌───────────────────┐  ┌─────────────────┐                  │
│ │ Provider:OpenRouter│ │ Model: Mistral  │  💰 Low          │
│ └───────────────────┘  └─────────────────┘                  │
│                                                              │
│ [Save Preferences]                                           │
└─────────────────────────────────────────────────────────────┘
```

**OpenRouter Model Browser (when OpenRouter selected):**
```
┌─────────────────────────────────────────────────────────────┐
│ Select OpenRouter Model                    🔍 Search...     │
├─────────────────────────────────────────────────────────────┤
│ ⭐ Popular                                                   │
│   anthropic/claude-3-opus         $15.00/M in  💰💰💰       │
│   openai/gpt-4o                   $5.00/M in   💰💰         │
│   meta-llama/llama-3.1-70b        $0.90/M in   💰           │
│                                                              │
│ 💨 Fast & Cheap                                              │
│   anthropic/claude-3-haiku        $0.25/M in   💰           │
│   mistralai/mistral-7b            $0.07/M in   💰           │
│                                                              │
│ 🧠 Reasoning                                                 │
│   openai/o1-preview               $15.00/M in  💰💰💰       │
│   deepseek/deepseek-r1            $0.55/M in   💰           │
└─────────────────────────────────────────────────────────────┘
```

**Data Model:**
```typescript
interface AgentModelPreference {
  agentType: string;
  providerId: string;
  modelId: string;
  fallbackProviderId?: string;
  fallbackModelId?: string;
}

// Stored in WorkspaceSettings
interface WorkspaceSettings {
  // ... existing fields
  agentModelPreferences: AgentModelPreference[];
}
```

**Integration with Agno:**
```python
# agents/config.py
def get_model_for_agent(workspace_id: str, agent_type: str):
    """Get user-configured model for this agent type."""
    prefs = fetch_agent_preferences(workspace_id)
    pref = prefs.get(agent_type)

    if pref:
        return create_model(pref.provider_id, pref.model_id)

    # Fall back to workspace default
    return get_default_model(workspace_id)
```

**Note:** For advanced per-agent routing with CCR (Claude Code Router), see Project Management module (Epic 09).

---

## Dependencies

- Epic 00: Project Scaffolding
- Epic 02: Workspace Management
- Epic 03: RBAC & Multi-tenancy

## Technical Notes

### Agno Provider Support
Agno (via AgentOS) natively supports 40+ model providers. This significantly reduces BYOAI implementation effort. Key providers for HYVVE MVP:

### Supported Providers
| Provider | Models | Auth | Agno Support |
|----------|--------|------|--------------|
| Claude (Anthropic) | claude-3-opus, sonnet, haiku | API Key | ✅ Native |
| OpenAI | gpt-4o, gpt-4-turbo, gpt-3.5 | API Key | ✅ Native |
| Google Gemini | gemini-pro, gemini-pro-vision | API Key | ✅ Native |
| DeepSeek | deepseek-chat, deepseek-coder | API Key | ✅ Native |
| **OpenRouter** | **100+ models** (Claude, GPT-4, Llama, Mistral, etc.) | API Key | ✅ Native |

### OpenRouter Integration

OpenRouter is a **meta-provider** that gives access to 100+ models through a single API key:

**Key Benefits:**
- **One API key** → Access Claude, GPT-4, Llama 3, Mistral, and more
- **Automatic fallbacks** - If one model is down, routes to alternatives
- **Cost optimization** - Compare pricing across providers
- **No vendor lock-in** - Switch models without changing code

**Agno Integration:**
```python
from agno.agent import Agent
from agno.models.openrouter import OpenRouter

# Access any model via OpenRouter
agent = Agent(
    model=OpenRouter(id="anthropic/claude-3-opus"),  # or "openai/gpt-4o", "meta-llama/llama-3-70b", etc.
    markdown=True
)
```

**Models Available via OpenRouter:**
- Anthropic: Claude 3 Opus, Sonnet, Haiku
- OpenAI: GPT-4o, GPT-4 Turbo, o1
- Meta: Llama 3.1 (8B, 70B, 405B)
- Mistral: Mistral Large, Medium, Small
- Google: Gemini Pro, Gemini Flash
- And 90+ more...

**Implementation Strategy:**
- Use Agno's model abstractions for AgentOS agents (Story 06.9)
- Maintain custom NestJS BYOAI module for non-agent API calls
- Share encrypted credential storage between both services
- Route all usage tracking through NestJS for unified reporting

### Cost Calculation
Use provider pricing per 1K tokens:
- Claude Opus: $15/$75 (input/output per 1M)
- GPT-4o: $5/$15 per 1M
- etc.

---

_Epic created: 2025-11-30_
_PRD Reference: FR-4 BYOAI Configuration_
