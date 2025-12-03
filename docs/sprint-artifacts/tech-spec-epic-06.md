# Technical Specification - EPIC-06: BYOAI Configuration

**Epic:** EPIC-06 - BYOAI Configuration
**Phase:** Phase 4 - Event Bus & BYOAI
**Status:** Contexted
**Stories:** 11
**Story Points:** 28
**Priority:** P0 (Critical - Must Have for MVP)

**Created:** 2025-12-04
**Author:** AI Technical Architect
**Version:** 1.0

---

## Executive Summary

EPIC-06 implements the BYOAI (Bring Your Own AI) configuration system, enabling users to securely configure their own AI provider API keys for use across HYVVE's agent-powered features. This epic provides workspace-level AI provider management with encrypted credential storage, token usage tracking, and seamless integration with AgentOS runtime and Agno framework.

**Key Capabilities:**
- Secure API key encryption at rest (AES-256-GCM)
- Support for 5 major providers: Claude, OpenAI, Gemini, DeepSeek, OpenRouter
- Token usage tracking per provider/workspace/agent
- Daily/monthly token limits with alerting
- Provider health monitoring and validation
- Integration with AgentOS via IAssistantClient interface pattern
- Per-agent model preferences UI

---

## Epic Overview

### Stories Breakdown

| Story | Title | Points | Priority | Dependencies |
|-------|-------|--------|----------|--------------|
| 06.1 | Implement Credential Encryption | 2 | P0 | EPIC-00 |
| 06.2 | Create AI Provider Factory | 3 | P0 | 06.1 |
| 06.3 | Create AI Provider API Endpoints | 3 | P0 | 06.2 |
| 06.4 | Create AI Provider Settings UI | 3 | P0 | 06.3 |
| 06.5 | Implement Token Usage Tracking | 3 | P0 | 06.2 |
| 06.6 | Create Token Usage Dashboard | 2 | P1 | 06.5 |
| 06.7 | Implement Daily Token Limits | 2 | P1 | 06.5 |
| 06.8 | Implement Provider Health Monitoring | 3 | P2 | 06.2 |
| 06.9 | Integrate AgentOS with BYOAI Providers | 3 | P0 | 06.2, EPIC-00.7 |
| 06.10 | Implement IAssistantClient Interface Pattern | 2 | P0 | 06.9 |
| 06.11 | Agent Model Preferences UI | 2 | P1 | 06.9, 06.10 |

**Total Points:** 28

### Dependencies

**Requires:**
- EPIC-00: Project scaffolding, AgentOS runtime setup (Story 00.7)
- EPIC-01: Authentication (for user context)
- EPIC-02: Workspace management (for tenant context)
- EPIC-03: RBAC (Owner/Admin-only access)

**Enables:**
- EPIC-04: Approval System (AI reasoning, confidence scoring)
- EPIC-08: Business Onboarding (Foundation modules with BMV/BMP/Brand teams)
- All future AI-powered features

**Optional Integration:**
- EPIC-05: Event Bus (for token limit alerts via events)

---

## Technical Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BYOAI Configuration                           │
│                                                                      │
│  ┌────────────────┐   ┌───────────────┐   ┌──────────────────┐    │
│  │   Frontend     │   │    NestJS     │   │    AgentOS       │    │
│  │  (Settings UI) │──>│  (API Layer)  │──>│  (Agent Runtime) │    │
│  └────────────────┘   └───────┬───────┘   └──────────────────┘    │
│                               │                                      │
│                               ▼                                      │
│                    ┌─────────────────────┐                          │
│                    │   PostgreSQL        │                          │
│                    │  AIProviderConfig   │                          │
│                    │  (Encrypted Keys)   │                          │
│                    └─────────────────────┘                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Supported AI Providers                          │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  │  │
│  │  │ Claude │ │ OpenAI │ │ Gemini │ │DeepSeek│ │OpenRouter│  │  │
│  │  │  API   │ │  API   │ │  API   │ │  API   │ │(100+)    │  │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Credential Encryption Strategy

**Approach:** Node.js built-in `crypto` module with AES-256-GCM

**Rationale:**
- No external dependencies (built into Node.js)
- NIST-approved symmetric encryption
- Authenticated encryption (prevents tampering)
- Fast encryption/decryption performance

**Implementation:**

```typescript
// packages/shared/src/utils/encryption.ts
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;

export class CredentialEncryptionService {
  private readonly masterKey: Buffer;

  constructor() {
    const keyBase64 = process.env.ENCRYPTION_MASTER_KEY;
    if (!keyBase64) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
    }
    this.masterKey = Buffer.from(keyBase64, 'base64');

    if (this.masterKey.length !== KEY_LENGTH) {
      throw new Error(`Master key must be ${KEY_LENGTH} bytes`);
    }
  }

  /**
   * Encrypt sensitive credential data
   * Returns: base64-encoded string containing: salt:iv:authTag:encryptedData
   */
  encrypt(plaintext: string): string {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive encryption key from master key + salt
    const key = crypto.pbkdf2Sync(this.masterKey, salt, 100000, KEY_LENGTH, 'sha256');

    // Encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Combine: salt:iv:authTag:encrypted
    const combined = Buffer.concat([salt, iv, authTag, encrypted]);
    return combined.toString('base64');
  }

  /**
   * Decrypt sensitive credential data
   */
  decrypt(ciphertext: string): string {
    const combined = Buffer.from(ciphertext, 'base64');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    // Derive key
    const key = crypto.pbkdf2Sync(this.masterKey, salt, 100000, KEY_LENGTH, 'sha256');

    // Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
```

**Master Key Generation:**

```bash
# Generate 256-bit (32-byte) key and encode as base64
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Add to .env
ENCRYPTION_MASTER_KEY="<generated-base64-string>"
```

**Security Considerations:**
- Master key stored in environment variable (never in code/database)
- Unique salt per encrypted value (prevents rainbow tables)
- Authentication tag prevents tampering
- Key rotation supported (store key version in database)

---

## AI Provider Abstraction Pattern

### Provider Factory

The system uses a **Factory Pattern** to create provider instances based on configuration:

```typescript
// apps/api/src/ai-providers/interfaces/ai-provider.interface.ts
export interface ChatParams {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'error';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface ChatChunk {
  delta: string;
  finishReason?: 'stop' | 'length';
}

export interface UsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface AIProviderInterface {
  readonly provider: 'claude' | 'openai' | 'gemini' | 'deepseek' | 'openrouter';
  readonly model: string;

  /**
   * Validate API key by making a test request
   */
  validateCredentials(): Promise<{ valid: boolean; error?: string }>;

  /**
   * Synchronous chat completion
   */
  chat(params: ChatParams): Promise<ChatResponse>;

  /**
   * Streaming chat completion
   */
  streamChat(params: ChatParams): AsyncGenerator<ChatChunk>;

  /**
   * Get current usage statistics
   */
  getUsage(): Promise<UsageStats>;
}
```

### Provider Factory Service

```typescript
// apps/api/src/ai-providers/ai-provider-factory.service.ts
import { Injectable } from '@nestjs/common';
import { AIProviderInterface } from './interfaces/ai-provider.interface';
import { AIProviderConfig } from '@prisma/client';
import { CredentialEncryptionService } from '@hyvve/shared';
import { ClaudeProvider } from './providers/claude.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';

@Injectable()
export class AIProviderFactory {
  constructor(
    private readonly encryption: CredentialEncryptionService,
  ) {}

  /**
   * Create provider instance from database configuration
   */
  create(config: AIProviderConfig): AIProviderInterface {
    const apiKey = this.encryption.decrypt(config.apiKeyEncrypted);

    switch (config.provider) {
      case 'claude':
        return new ClaudeProvider(apiKey, config.defaultModel);

      case 'openai':
        return new OpenAIProvider(apiKey, config.defaultModel);

      case 'gemini':
        return new GeminiProvider(apiKey, config.defaultModel);

      case 'deepseek':
        return new DeepSeekProvider(apiKey, config.defaultModel);

      case 'openrouter':
        return new OpenRouterProvider(apiKey, config.defaultModel);

      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }
}
```

### Example Provider Implementation

```typescript
// apps/api/src/ai-providers/providers/claude.provider.ts
import Anthropic from '@anthropic-ai/sdk';
import { AIProviderInterface, ChatParams, ChatResponse } from '../interfaces/ai-provider.interface';

export class ClaudeProvider implements AIProviderInterface {
  readonly provider = 'claude' as const;
  readonly model: string;
  private client: Anthropic;

  constructor(apiKey: string, model: string) {
    this.model = model;
    this.client = new Anthropic({ apiKey });
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    try {
      // Test with minimal request
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature,
      messages: params.messages,
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'length',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
    };
  }

  async *streamChat(params: ChatParams): AsyncGenerator<ChatChunk> {
    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature,
      messages: params.messages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield { delta: chunk.delta.text };
      }
      if (chunk.type === 'message_stop') {
        yield { delta: '', finishReason: 'stop' };
      }
    }
  }

  async getUsage(): Promise<UsageStats> {
    // Implementation would track usage per request
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    };
  }
}
```

---

## Supported AI Providers

### Provider Matrix

| Provider | Authentication | Models | Native Agno Support | Cost per 1M tokens |
|----------|---------------|--------|---------------------|-------------------|
| **Claude (Anthropic)** | API Key | claude-3-opus, claude-3-sonnet, claude-3-haiku, claude-3-5-sonnet | ✅ Yes | $3-$15 |
| **OpenAI** | API Key | gpt-4o, gpt-4-turbo, gpt-3.5-turbo, o1 | ✅ Yes | $0.50-$60 |
| **Google Gemini** | API Key | gemini-pro, gemini-flash, gemini-ultra | ✅ Yes | $0.35-$1.25 |
| **DeepSeek** | API Key | deepseek-chat, deepseek-r1, deepseek-coder | ✅ Yes | $0.14-$0.28 |
| **OpenRouter** | API Key | 100+ models (meta-provider) | ✅ Yes | Variable (pass-through) |

### OpenRouter Special Features

**OpenRouter is a meta-provider** that gives users access to 100+ models through a single API key:

- **One API Key → Multiple Providers**: Access Claude, GPT-4, Llama 3, Mistral, Gemini, and more
- **Automatic Fallbacks**: If primary model is unavailable, automatically routes to backup
- **Cost Optimization**: Select cheapest model that meets requirements
- **No Vendor Lock-in**: Switch models without changing code
- **Usage Monitoring**: Unified billing and tracking

**Agno Integration:**

```python
# agents/platform/example_agent.py
from agno.agent import Agent
from agno.models.openrouter import OpenRouter

# Access any of 100+ models via OpenRouter
agent = Agent(
    model=OpenRouter(id="anthropic/claude-3-opus"),  # or "openai/gpt-4o", etc.
    markdown=True
)

# Or mix providers
validation_agent = Agent(
    model=OpenRouter(id="deepseek/deepseek-chat"),  # Cost-effective for analysis
    markdown=True
)

content_agent = Agent(
    model=OpenRouter(id="anthropic/claude-3-5-sonnet"),  # Best for writing
    markdown=True
)
```

---

## Database Models

### AIProviderConfig

```prisma
model AIProviderConfig {
  id          String @id @default(uuid())
  workspaceId String @map("workspace_id")

  provider        String  // 'claude' | 'openai' | 'gemini' | 'deepseek' | 'openrouter'
  apiKeyEncrypted String @map("api_key_encrypted") @db.Text
  defaultModel    String @map("default_model")

  isValid         Boolean   @default(false) @map("is_valid")
  lastValidatedAt DateTime? @map("last_validated_at")
  validationError String?   @map("validation_error")

  maxTokensPerDay Int @default(100000) @map("max_tokens_per_day")
  tokensUsedToday Int @default(0) @map("tokens_used_today")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  workspace  Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  tokenUsage TokenUsage[]

  @@unique([workspaceId, provider])
  @@index([workspaceId])
  @@map("ai_provider_configs")
}
```

### TokenUsage

```prisma
model TokenUsage {
  id          String @id @default(uuid())
  workspaceId String @map("workspace_id")
  providerId  String @map("provider_id")

  agentId   String? @map("agent_id")
  sessionId String? @map("session_id")
  model     String

  promptTokens     Int @map("prompt_tokens")
  completionTokens Int @map("completion_tokens")
  totalTokens      Int @map("total_tokens")

  estimatedCost Float @map("estimated_cost")

  requestedAt DateTime @map("requested_at")
  duration    Int      // Milliseconds

  createdAt DateTime @default(now()) @map("created_at")

  workspace Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  provider  AIProviderConfig @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([providerId])
  @@index([requestedAt])
  @@map("token_usage")
}
```

**Token Reset Strategy:**

```typescript
// Cron job to reset daily tokens at midnight UTC
// apps/api/src/ai-providers/token-reset.service.ts
@Injectable()
export class TokenResetService {
  constructor(private prisma: PrismaService) {}

  @Cron('0 0 * * *') // Daily at midnight UTC
  async resetDailyTokens() {
    await this.prisma.aIProviderConfig.updateMany({
      data: { tokensUsedToday: 0 },
    });
  }
}
```

---

## API Design

### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ai-providers` | List workspace AI providers | Owner/Admin |
| POST | `/api/ai-providers` | Add new provider | Owner/Admin |
| GET | `/api/ai-providers/:id` | Get provider details | Owner/Admin |
| PATCH | `/api/ai-providers/:id` | Update provider config | Owner/Admin |
| DELETE | `/api/ai-providers/:id` | Remove provider | Owner/Admin |
| POST | `/api/ai-providers/:id/test` | Validate API key | Owner/Admin |
| GET | `/api/ai-providers/usage` | Get token usage stats | Owner/Admin/Member |
| GET | `/api/ai-providers/usage/daily` | Get daily usage breakdown | Owner/Admin |
| GET | `/api/ai-providers/usage/by-agent` | Get usage by agent | Owner/Admin |

### Request/Response Schemas

#### POST /api/ai-providers

**Request:**
```typescript
{
  provider: 'claude' | 'openai' | 'gemini' | 'deepseek' | 'openrouter';
  apiKey: string;
  defaultModel: string;
  maxTokensPerDay?: number; // Default: 100000
}
```

**Response:**
```typescript
{
  data: {
    id: string;
    provider: string;
    defaultModel: string;
    isValid: boolean;
    maxTokensPerDay: number;
    tokensUsedToday: number;
    createdAt: string;
  }
}
```

#### POST /api/ai-providers/:id/test

**Response:**
```typescript
{
  valid: boolean;
  error?: string;
  latency?: number; // ms
  model?: string;
}
```

#### GET /api/ai-providers/usage

**Query Parameters:**
- `startDate`: ISO 8601 date string
- `endDate`: ISO 8601 date string
- `providerId`: Filter by provider
- `agentId`: Filter by agent

**Response:**
```typescript
{
  data: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCost: number;
    byProvider: Array<{
      providerId: string;
      provider: string;
      tokens: number;
      cost: number;
    }>;
    byAgent: Array<{
      agentId: string;
      agentName: string;
      tokens: number;
      cost: number;
    }>;
    dailyBreakdown: Array<{
      date: string;
      tokens: number;
      cost: number;
    }>;
  }
}
```

---

## Frontend Components

### Settings Pages

#### AI Providers List

**Location:** `apps/web/src/app/(dashboard)/settings/ai-providers/page.tsx`

**Wireframe Reference:** `ST-02: API Keys Management`

**Features:**
- List all configured providers with status badges (✓ Valid, ⚠ Invalid, ○ Not Set)
- Add new provider button
- Token usage progress bars
- Quick actions (Test, Edit, Delete)

**Component Structure:**

```tsx
// apps/web/src/components/settings/ai-provider-list.tsx
'use client';

import { useState } from 'react';
import { Button } from '@hyvve/ui';
import { PlusIcon } from 'lucide-react';
import { AIProviderCard } from './ai-provider-card';
import { AddProviderDialog } from './add-provider-dialog';

export function AIProviderList() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: providers, isLoading } = useAIProviders();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">AI Providers</h2>
          <p className="text-muted-foreground">
            Configure your AI provider API keys
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <div className="grid gap-4">
        {providers?.map((provider) => (
          <AIProviderCard key={provider.id} provider={provider} />
        ))}
      </div>

      <AddProviderDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
```

#### AI Provider Card

```tsx
// apps/web/src/components/settings/ai-provider-card.tsx
'use client';

import { Badge } from '@hyvve/ui';
import { Progress } from '@hyvve/ui';

interface AIProviderCardProps {
  provider: {
    id: string;
    provider: string;
    defaultModel: string;
    isValid: boolean;
    tokensUsedToday: number;
    maxTokensPerDay: number;
  };
}

export function AIProviderCard({ provider }: AIProviderCardProps) {
  const usagePercent = (provider.tokensUsedToday / provider.maxTokensPerDay) * 100;

  return (
    <div className="border rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold capitalize">{provider.provider}</h3>
            <Badge variant={provider.isValid ? 'success' : 'destructive'}>
              {provider.isValid ? 'Valid' : 'Invalid'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Model: {provider.defaultModel}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">Test</Button>
          <Button variant="ghost" size="sm">Edit</Button>
          <Button variant="ghost" size="sm">Delete</Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Daily Token Usage</span>
          <span className="font-medium">
            {provider.tokensUsedToday.toLocaleString()} / {provider.maxTokensPerDay.toLocaleString()}
          </span>
        </div>
        <Progress value={usagePercent} />
      </div>
    </div>
  );
}
```

#### Add Provider Dialog

**Location:** `apps/web/src/components/settings/add-provider-dialog.tsx`

**Features:**
- Provider selection dropdown
- Model selection (dynamic based on provider)
- API key input (password field)
- Test connection button
- Daily token limit configuration

```tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@hyvve/ui';
import { Label, Input, Select, Button } from '@hyvve/ui';

const PROVIDER_MODELS = {
  claude: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-3-5-sonnet'],
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview'],
  gemini: ['gemini-pro', 'gemini-flash', 'gemini-ultra'],
  deepseek: ['deepseek-chat', 'deepseek-r1', 'deepseek-coder'],
  openrouter: ['anthropic/claude-3-opus', 'openai/gpt-4o', 'google/gemini-pro'],
};

export function AddProviderDialog({ open, onOpenChange }) {
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    // Test API call
    setTesting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add AI Provider</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <option value="claude">Claude (Anthropic)</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="deepseek">DeepSeek</option>
              <option value="openrouter">OpenRouter</option>
            </Select>
          </div>

          {provider && (
            <div>
              <Label>Default Model</Label>
              <Select value={model} onValueChange={setModel}>
                {PROVIDER_MODELS[provider].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label>API Key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>

          <Button
            variant="outline"
            onClick={handleTest}
            disabled={!apiKey || testing}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Token Usage Dashboard

**Location:** `apps/web/src/app/(dashboard)/settings/ai-providers/usage/page.tsx`

**Wireframe Reference:** `ST-03: Usage Analytics`

**Features:**
- Date range selector
- Provider breakdown (pie chart)
- Agent breakdown (bar chart)
- Daily usage trend (line chart)
- Export CSV button

---

## Security Considerations

### Encryption at Rest

- **Algorithm:** AES-256-GCM (NIST-approved, authenticated encryption)
- **Key Storage:** Environment variable, never in code/database
- **Key Rotation:** Supported via key version in database (future enhancement)
- **Salt:** Unique per encrypted value (prevents rainbow tables)
- **Authentication Tag:** Prevents tampering

### Access Control

- **Who can configure:** Owner and Admin roles only
- **API Key Visibility:** Never returned in API responses (only "configured" status)
- **Token Usage:** All workspace members can view
- **Audit Logging:** All provider changes logged to `audit_logs` table

### Key Rotation Support

**Future Enhancement (Post-MVP):**

```typescript
// Add keyVersion field to AIProviderConfig
model AIProviderConfig {
  // ... existing fields
  keyVersion Int @default(1) @map("key_version")
}

// Encryption service supports multiple key versions
class CredentialEncryptionService {
  private readonly keys: Map<number, Buffer> = new Map();

  constructor() {
    // Load current and previous keys
    this.keys.set(1, Buffer.from(process.env.ENCRYPTION_KEY_V1, 'base64'));
    this.keys.set(2, Buffer.from(process.env.ENCRYPTION_KEY_V2, 'base64'));
  }

  encrypt(plaintext: string, version: number = 2): string {
    const key = this.keys.get(version);
    // ... encrypt with versioned key
  }

  decrypt(ciphertext: string, version: number): string {
    const key = this.keys.get(version);
    // ... decrypt with versioned key
  }
}
```

---

## Integration with AgentOS

### IAssistantClient Interface Pattern (Story 06.10)

**Purpose:** Provide a clean abstraction layer between NestJS and AgentOS for AI provider access.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                      NestJS Backend                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         IAssistantClient Interface                     │ │
│  │  - chat(messages, options): Promise<ChatResponse>      │ │
│  │  - streamChat(messages, options): AsyncIterator        │ │
│  │  - getUsage(): Promise<UsageStats>                     │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │    AgentOSAssistantClient Implementation               │ │
│  │  - Fetches workspace AI provider config               │ │
│  │  - Makes HTTP requests to AgentOS API                 │ │
│  │  - Tracks token usage                                  │ │
│  └────────────────────┬───────────────────────────────────┘ │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      AgentOS Runtime                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │             Agno Framework                             │ │
│  │  - Reads workspace provider config from PostgreSQL    │ │
│  │  - Uses native Agno model providers                   │ │
│  │  - Returns responses with token usage                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// apps/api/src/ai-providers/interfaces/assistant-client.interface.ts
export interface IAssistantClient {
  /**
   * Send chat messages and receive response
   */
  chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string; // Override workspace default
    }
  ): Promise<{
    content: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }>;

  /**
   * Streaming chat completion
   */
  streamChat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): AsyncIterator<{ delta: string; done: boolean }>;

  /**
   * Get current usage statistics for workspace
   */
  getUsage(): Promise<{
    tokensUsedToday: number;
    maxTokensPerDay: number;
    estimatedCostToday: number;
  }>;
}
```

```typescript
// apps/api/src/ai-providers/agentos-assistant-client.ts
import { Injectable } from '@nestjs/common';
import { IAssistantClient } from './interfaces/assistant-client.interface';
import { PrismaService } from '@hyvve/db';

@Injectable()
export class AgentOSAssistantClient implements IAssistantClient {
  private readonly agentOSUrl: string;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.agentOSUrl = process.env.AGENTOS_URL || 'http://localhost:7777';
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: { temperature?: number; maxTokens?: number; model?: string }
  ) {
    const workspaceId = this.getWorkspaceIdFromContext();

    // Get workspace AI provider config
    const providers = await this.prisma.aIProviderConfig.findMany({
      where: { workspaceId, isValid: true },
    });

    if (providers.length === 0) {
      throw new Error('No valid AI providers configured for workspace');
    }

    // Use first valid provider (or specified model)
    const provider = providers[0];

    // Call AgentOS API
    const response = await fetch(`${this.agentOSUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getJWT()}`,
      },
      body: JSON.stringify({
        messages,
        model: options?.model || provider.defaultModel,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        workspace_id: workspaceId,
      }),
    });

    const data = await response.json();

    // Track token usage
    await this.trackUsage(workspaceId, provider.id, data.usage);

    return {
      content: data.content,
      usage: data.usage,
    };
  }

  async *streamChat(
    messages: Array<{ role: string; content: string }>,
    options?: { temperature?: number; maxTokens?: number; model?: string }
  ): AsyncIterator<{ delta: string; done: boolean }> {
    // SSE streaming implementation
    const workspaceId = this.getWorkspaceIdFromContext();
    const provider = await this.getFirstValidProvider(workspaceId);

    const response = await fetch(`${this.agentOSUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getJWT()}`,
      },
      body: JSON.stringify({
        messages,
        model: options?.model || provider.defaultModel,
        workspace_id: workspaceId,
      }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          yield { delta: data.delta, done: false };
        }
      }
    }

    yield { delta: '', done: true };
  }

  async getUsage() {
    const workspaceId = this.getWorkspaceIdFromContext();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.tokenUsage.aggregate({
      where: {
        workspaceId,
        requestedAt: { gte: today },
      },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
    });

    const config = await this.prisma.aIProviderConfig.findFirst({
      where: { workspaceId },
    });

    return {
      tokensUsedToday: usage._sum.totalTokens || 0,
      maxTokensPerDay: config?.maxTokensPerDay || 100000,
      estimatedCostToday: usage._sum.estimatedCost || 0,
    };
  }

  private async trackUsage(
    workspaceId: string,
    providerId: string,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number }
  ) {
    await this.prisma.tokenUsage.create({
      data: {
        workspaceId,
        providerId,
        model: 'auto',
        requestedAt: new Date(),
        duration: 0,
        ...usage,
        estimatedCost: this.calculateCost(usage.totalTokens),
      },
    });
  }

  private getWorkspaceIdFromContext(): string {
    // Extract from JWT or async context
    return 'workspace-id';
  }

  private getJWT(): string {
    // Get from request context
    return 'jwt-token';
  }

  private calculateCost(tokens: number): number {
    // Rough estimate: $0.01 per 1000 tokens
    return (tokens / 1000) * 0.01;
  }
}
```

### AgentOS BYOAI Integration (Story 06.9)

**Purpose:** Enable AgentOS to use workspace-configured AI providers.

**Implementation:**

```python
# agents/middleware/byoai.py
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.models.openai import OpenAI
from agno.models.gemini import Gemini
from agno.models.deepseek import DeepSeek
from agno.models.openrouter import OpenRouter
import os
import psycopg2
from cryptography.fernet import Fernet

class BYOAIMiddleware:
    """Middleware to inject workspace AI provider configuration into agents."""

    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.encryption_key = os.getenv("ENCRYPTION_MASTER_KEY")

    def get_workspace_provider(self, workspace_id: str, provider_name: str = None):
        """Fetch and decrypt AI provider config for workspace."""
        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor()

        # Get first valid provider if not specified
        if provider_name:
            cursor.execute(
                "SELECT provider, api_key_encrypted, default_model "
                "FROM ai_provider_configs "
                "WHERE workspace_id = %s AND provider = %s AND is_valid = true",
                (workspace_id, provider_name)
            )
        else:
            cursor.execute(
                "SELECT provider, api_key_encrypted, default_model "
                "FROM ai_provider_configs "
                "WHERE workspace_id = %s AND is_valid = true "
                "LIMIT 1",
                (workspace_id,)
            )

        result = cursor.fetchone()
        conn.close()

        if not result:
            raise ValueError(f"No valid AI provider configured for workspace {workspace_id}")

        provider, encrypted_key, model = result

        # Decrypt API key
        api_key = self.decrypt_key(encrypted_key)

        return {
            "provider": provider,
            "api_key": api_key,
            "model": model
        }

    def decrypt_key(self, encrypted_key: str) -> str:
        """Decrypt API key using master encryption key."""
        # Simplified - actual implementation matches Node.js crypto
        fernet = Fernet(self.encryption_key)
        return fernet.decrypt(encrypted_key.encode()).decode()

    def create_agent_with_workspace_config(
        self,
        workspace_id: str,
        agent_name: str,
        instructions: list,
        provider_name: str = None
    ) -> Agent:
        """Create Agno agent using workspace AI provider."""
        config = self.get_workspace_provider(workspace_id, provider_name)

        # Create appropriate model based on provider
        if config["provider"] == "claude":
            model = Claude(id=config["model"], api_key=config["api_key"])
        elif config["provider"] == "openai":
            model = OpenAI(id=config["model"], api_key=config["api_key"])
        elif config["provider"] == "gemini":
            model = Gemini(id=config["model"], api_key=config["api_key"])
        elif config["provider"] == "deepseek":
            model = DeepSeek(id=config["model"], api_key=config["api_key"])
        elif config["provider"] == "openrouter":
            model = OpenRouter(id=config["model"], api_key=config["api_key"])
        else:
            raise ValueError(f"Unsupported provider: {config['provider']}")

        return Agent(
            name=agent_name,
            model=model,
            instructions=instructions,
            markdown=True
        )
```

**Usage Example:**

```python
# agents/platform/approval_agent.py
from agno.agent import Agent
from agno.storage.postgres import PostgresStorage
from middleware.byoai import BYOAIMiddleware

byoai = BYOAIMiddleware()

def create_approval_agent(workspace_id: str, session_id: str):
    """Create approval routing agent using workspace AI config."""

    agent = byoai.create_agent_with_workspace_config(
        workspace_id=workspace_id,
        agent_name="Approval Router",
        instructions=[
            "Analyze proposed actions and calculate confidence scores.",
            "Route to auto-approve (>85%), quick review (60-85%), or full review (<60%).",
            "Provide clear reasoning for confidence assessment."
        ]
    )

    # Add storage
    agent.storage = PostgresStorage(
        table_name="agent_sessions",
        db_url=os.getenv("DATABASE_URL")
    )

    return agent
```

### Agent Model Preferences UI (Story 06.11)

**Purpose:** Allow users to configure which AI model each agent team should use.

**Location:** `apps/web/src/app/(dashboard)/settings/agent-preferences/page.tsx`

**Features:**
- List all agent teams (BMV, BMP, BM-Brand, Approval Router, etc.)
- Per-agent model selection from configured providers
- Token cost estimation per agent
- Reset to default button

**Component:**

```tsx
// apps/web/src/components/settings/agent-model-preferences.tsx
'use client';

import { Select } from '@hyvve/ui';

interface AgentPreferencesProps {
  agents: Array<{
    id: string;
    name: string;
    description: string;
    defaultModel: string;
    currentModel: string;
  }>;
  availableModels: Array<{
    provider: string;
    model: string;
    costPer1MTokens: number;
  }>;
}

export function AgentModelPreferences({ agents, availableModels }: AgentPreferencesProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Agent Model Preferences</h2>
      <p className="text-muted-foreground">
        Configure which AI model each agent team should use
      </p>

      <div className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
              </div>
              <Select defaultValue={agent.currentModel}>
                {availableModels.map((model) => (
                  <option key={`${model.provider}/${model.model}`} value={model.model}>
                    {model.provider} - {model.model} (${model.costPer1MTokens}/1M tokens)
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Story-by-Story Breakdown

### Story 06.1: Implement Credential Encryption (2 points)

**Goal:** Create encryption service for securely storing API keys.

**Implementation:**
1. Create `CredentialEncryptionService` in `packages/shared/src/utils/encryption.ts`
2. Use Node.js `crypto` module with AES-256-GCM
3. Generate master key and add to `.env.example`
4. Write unit tests for encrypt/decrypt

**Acceptance Criteria:**
- [ ] Encryption service encrypts/decrypts API keys correctly
- [ ] Master key loaded from environment variable
- [ ] Unit tests achieve >95% coverage
- [ ] Documentation added for key generation

**Technical Notes:**
- Use PBKDF2 with 100,000 iterations for key derivation
- Store salt + IV + authTag + encrypted data as base64

---

### Story 06.2: Create AI Provider Factory (3 points)

**Goal:** Implement factory pattern for creating AI provider instances.

**Implementation:**
1. Define `AIProviderInterface` in `apps/api/src/ai-providers/interfaces/`
2. Implement provider classes: `ClaudeProvider`, `OpenAIProvider`, `GeminiProvider`, `DeepSeekProvider`, `OpenRouterProvider`
3. Create `AIProviderFactory` service
4. Add provider SDK dependencies to `package.json`

**Acceptance Criteria:**
- [ ] Factory creates provider instances from config
- [ ] All 5 providers implement common interface
- [ ] Providers validate credentials on instantiation
- [ ] Error handling for invalid credentials

**Technical Notes:**
- Install SDKs: `@anthropic-ai/sdk`, `openai`, `@google/generative-ai`, `deepseek-ai`
- Use provider-specific error types

---

### Story 06.3: Create AI Provider API Endpoints (3 points)

**Goal:** Build NestJS REST API for managing AI providers.

**Implementation:**
1. Create `AIProvidersModule` in `apps/api/src/ai-providers/`
2. Implement `AIProvidersController` with CRUD endpoints
3. Implement `AIProvidersService` with business logic
4. Add validation DTOs with `class-validator`
5. Add permission guards (Owner/Admin only)

**Acceptance Criteria:**
- [ ] GET /api/ai-providers lists workspace providers
- [ ] POST /api/ai-providers adds new provider
- [ ] PATCH /api/ai-providers/:id updates config
- [ ] DELETE /api/ai-providers/:id removes provider
- [ ] POST /api/ai-providers/:id/test validates API key
- [ ] Only Owner/Admin can access endpoints

**Technical Notes:**
- Use tenant context middleware for workspace scoping
- Encrypt API key before storing in database
- Return success/error for test endpoint

---

### Story 06.4: Create AI Provider Settings UI (3 points)

**Goal:** Build frontend UI for managing AI providers.

**Implementation:**
1. Create settings page at `/settings/ai-providers`
2. Implement `AIProviderList` component
3. Implement `AIProviderCard` component
4. Implement `AddProviderDialog` component
5. Add React Query hooks for API calls

**Acceptance Criteria:**
- [ ] Users can view list of configured providers
- [ ] Users can add new provider with API key
- [ ] Users can test provider connection
- [ ] Users can edit/delete providers
- [ ] Form validation for required fields
- [ ] Loading/error states handled

**Technical Notes:**
- Use shadcn/ui components (Dialog, Select, Input, Badge)
- Mask API key input as password field
- Show validation status with badges

---

### Story 06.5: Implement Token Usage Tracking (3 points)

**Goal:** Track token usage per request, agent, and workspace.

**Implementation:**
1. Add `trackUsage()` method to each provider class
2. Create `TokenUsageService` in `apps/api/src/ai-providers/`
3. Add middleware to intercept provider calls and log usage
4. Implement daily token reset cron job
5. Add aggregation queries for usage statistics

**Acceptance Criteria:**
- [ ] Token usage tracked per AI request
- [ ] Usage includes promptTokens, completionTokens, totalTokens
- [ ] Estimated cost calculated per request
- [ ] Daily tokens reset at midnight UTC
- [ ] Usage queryable by workspace/provider/agent/date range

**Technical Notes:**
- Use `@nestjs/schedule` for cron job
- Calculate cost based on provider pricing

---

### Story 06.6: Create Token Usage Dashboard (2 points)

**Goal:** Build UI for viewing token usage statistics.

**Implementation:**
1. Create usage page at `/settings/ai-providers/usage`
2. Implement charts: pie chart (by provider), bar chart (by agent), line chart (daily trend)
3. Add date range selector
4. Add export to CSV functionality
5. Add usage summary cards

**Acceptance Criteria:**
- [ ] Users can view total tokens used
- [ ] Users can see breakdown by provider
- [ ] Users can see breakdown by agent
- [ ] Users can filter by date range
- [ ] Users can export data to CSV

**Technical Notes:**
- Use Recharts for visualizations
- Use date-fns for date handling

---

### Story 06.7: Implement Daily Token Limits (2 points)

**Goal:** Enforce daily token limits and alert users when approaching.

**Implementation:**
1. Add limit check before AI requests
2. Throw error if limit exceeded
3. Implement alert at 80% usage
4. Emit event when limit reached
5. Add UI alert on settings page

**Acceptance Criteria:**
- [ ] AI requests blocked when daily limit reached
- [ ] Users alerted at 80% usage
- [ ] Event emitted for limit reached
- [ ] Error message explains limit and current usage
- [ ] Users can increase limit in settings

**Technical Notes:**
- Check limit in `AIProviderFactory.create()`
- Use EPIC-05 event bus for alerts (optional dependency)

---

### Story 06.8: Implement Provider Health Monitoring (3 points)

**Goal:** Monitor AI provider availability and alert on failures.

**Implementation:**
1. Add health check cron job (every 5 minutes)
2. Test each provider with minimal request
3. Update `isValid` and `lastValidatedAt` fields
4. Track consecutive failures
5. Emit event on provider failure
6. Add health status to UI

**Acceptance Criteria:**
- [ ] Providers health-checked every 5 minutes
- [ ] Invalid providers marked in database
- [ ] Users notified on provider failure
- [ ] Health status visible in settings UI
- [ ] Auto-retry after failure

**Technical Notes:**
- Use minimal token request for health check
- Exponential backoff for retries

---

### Story 06.9: Integrate AgentOS with BYOAI Providers (3 points)

**Goal:** Enable AgentOS agents to use workspace-configured AI providers.

**Implementation:**
1. Create `BYOAIMiddleware` in `agents/middleware/byoai.py`
2. Add database queries to fetch workspace provider config
3. Implement API key decryption (Python equivalent)
4. Create agent factory using workspace config
5. Update existing agents to use middleware

**Acceptance Criteria:**
- [ ] AgentOS can read workspace AI config from PostgreSQL
- [ ] AgentOS can decrypt API keys
- [ ] Agents created with workspace-configured provider
- [ ] Token usage tracked from AgentOS
- [ ] Error handling for missing/invalid config

**Technical Notes:**
- Use `psycopg2` for PostgreSQL access
- Use `cryptography` library for decryption
- Match encryption algorithm with Node.js implementation

---

### Story 06.10: Implement IAssistantClient Interface Pattern (2 points)

**Goal:** Create abstraction layer for NestJS → AgentOS communication.

**Implementation:**
1. Define `IAssistantClient` interface
2. Implement `AgentOSAssistantClient` class
3. Add HTTP client for AgentOS API calls
4. Track token usage via client
5. Add error handling and retries

**Acceptance Criteria:**
- [ ] Interface provides chat() and streamChat() methods
- [ ] Client fetches workspace provider config
- [ ] Client makes HTTP requests to AgentOS
- [ ] Token usage tracked on responses
- [ ] Error handling for network/API failures

**Technical Notes:**
- Use `fetch` API for HTTP requests
- Implement SSE streaming for streamChat()

---

### Story 06.11: Agent Model Preferences UI (2 points)

**Goal:** Allow users to configure per-agent model preferences.

**Implementation:**
1. Create preferences page at `/settings/agent-preferences`
2. List all agent teams with current model
3. Add model selector per agent
4. Save preferences to database
5. Show cost estimation per model

**Acceptance Criteria:**
- [ ] Users can view all agent teams
- [ ] Users can select model per agent
- [ ] Preferences saved to database
- [ ] Cost estimation shown for each model
- [ ] Changes apply immediately to new agent sessions

**Technical Notes:**
- Store preferences in `modulePermissions` JSON field or new table
- Show models only from configured providers

---

## Testing Strategy

### Unit Tests

**Coverage Target:** >85%

**Key Test Cases:**
1. **Encryption Service**
   - Encrypt/decrypt roundtrip
   - Invalid key handling
   - Salt uniqueness

2. **AI Provider Factory**
   - Create instances for all providers
   - Invalid provider handling
   - Credential validation

3. **Token Usage Tracking**
   - Usage calculation
   - Daily reset logic
   - Limit enforcement

### Integration Tests

1. **API Endpoints**
   - CRUD operations for providers
   - Permission checks (Owner/Admin only)
   - API key validation

2. **AgentOS Integration**
   - Workspace config fetch
   - Agent creation with BYOAI
   - Token usage tracking

### E2E Tests

1. **User Flow: Add Provider**
   - Navigate to settings
   - Add new provider
   - Test connection
   - See success message

2. **User Flow: Track Usage**
   - Make AI request
   - Check usage dashboard
   - Verify token count

---

## Deployment Considerations

### Environment Variables

```bash
# Required
ENCRYPTION_MASTER_KEY="<base64-encoded-32-byte-key>"
DATABASE_URL="postgresql://..."
AGENTOS_URL="http://agentos:7777"

# Provider SDK Keys (for testing only - users provide their own)
ANTHROPIC_API_KEY="sk-ant-..." # Optional, for health check testing
OPENAI_API_KEY="sk-..." # Optional, for health check testing
```

### Migration

```sql
-- Epic 06 initial migration
CREATE TABLE ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  default_model VARCHAR(100) NOT NULL,
  is_valid BOOLEAN DEFAULT FALSE,
  last_validated_at TIMESTAMPTZ,
  validation_error TEXT,
  max_tokens_per_day INT DEFAULT 100000,
  tokens_used_today INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, provider)
);

CREATE INDEX idx_ai_provider_configs_workspace ON ai_provider_configs(workspace_id);

CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES ai_provider_configs(id) ON DELETE CASCADE,
  agent_id VARCHAR(100),
  session_id VARCHAR(100),
  model VARCHAR(100) NOT NULL,
  prompt_tokens INT NOT NULL,
  completion_tokens INT NOT NULL,
  total_tokens INT NOT NULL,
  estimated_cost DECIMAL(10, 6) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL,
  duration INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_usage_workspace ON token_usage(workspace_id);
CREATE INDEX idx_token_usage_provider ON token_usage(provider_id);
CREATE INDEX idx_token_usage_requested_at ON token_usage(requested_at);
```

### Monitoring

**Key Metrics:**
- Token usage per workspace (daily/monthly)
- Provider health check success rate
- API key validation failures
- Token limit exceeded events
- Average request latency per provider

**Alerts:**
- Provider health check failures (>3 consecutive)
- Token limit exceeded (80%, 100%)
- API key validation errors (spike detection)
- Encryption service errors

---

## Open Questions & Decisions

### Resolved

1. **Q:** Should we support OAuth tokens for providers like Claude?
   **A:** Post-MVP. Start with API keys only for simplicity.

2. **Q:** How to handle key rotation?
   **A:** Support via `keyVersion` field (Post-MVP enhancement).

3. **Q:** Should users configure provider per agent or per workspace?
   **A:** Per workspace with per-agent model preferences (Story 06.11).

### Open

1. **Q:** Should we implement rate limiting per provider?
   **A:** TBD - May be needed to prevent abuse.

2. **Q:** How to handle provider deprecations (e.g., OpenAI sunsetting models)?
   **A:** TBD - Need migration strategy.

---

## References

### Documentation
- Claude API: https://docs.anthropic.com/
- OpenAI API: https://platform.openai.com/docs/
- Gemini API: https://ai.google.dev/docs
- DeepSeek API: https://platform.deepseek.com/api-docs
- OpenRouter API: https://openrouter.ai/docs
- Agno Framework: https://docs.agno.com/
- AgentOS: https://docs.agno.com/agentos/

### ADRs
- ADR-006: BYOAI Provider Abstraction
- ADR-007: AgentOS for Agent Runtime

### Wireframes
- ST-02: API Keys Management
- ST-03: Usage Analytics
- ST-04: Provider Health Status
- ST-05: Agent Preferences

### Related Epics
- EPIC-00: Project Scaffolding (AgentOS setup)
- EPIC-04: Approval System (uses AI providers)
- EPIC-08: Business Onboarding (uses AI providers extensively)

---

**Status:** Ready for Development
**Last Updated:** 2025-12-04
**Next Step:** Change epic-06 status to "contexted" in sprint-status.yaml
