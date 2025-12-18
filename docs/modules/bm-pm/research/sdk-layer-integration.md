# SDK Layer Integration Architecture

**Module:** bm-pm (Business Module - Project Management)
**Date:** 2025-12-01
**Status:** Research Complete
**Purpose:** Define how AI SDK clients integrate across Foundation and Project Management layers

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Layers](#2-architecture-layers)
3. [Foundation Layer (IAssistantClient)](#3-foundation-layer-iassistantclient)
4. [Remote Coding Agents Layer](#4-remote-coding-agents-layer)
5. [Containerization Layer](#5-containerization-layer)
6. [Integration Flow](#6-integration-flow)
7. [CCR Custom Router](#7-ccr-custom-router)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Executive Summary

The HYVVE Platform uses a **three-layer architecture** for AI integration:

| Layer | Purpose | Module | Key Features |
|-------|---------|--------|--------------|
| **Foundation** | Agent orchestration & monitoring | Platform Foundation | AgentOS, Control Plane, IAssistantClient interface, **OpenRouter (100+ models)** |
| **SDK Integration** | AI SDK client implementations | Project Management | Claude Code SDK, Codex SDK, OAuth passthrough |
| **Execution** | Isolated runtime environments | Production Infrastructure | Tiered containers, worker pools |

**Critical Feature: OAuth Token Passthrough**

Users can connect their **Claude Pro/Max subscription** via OAuth token (`claude-oauth-token-xxxxx`), allowing them to use their existing subscription through the platform **without additional API costs**.

---

## 2. Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        LAYER 3: EXECUTION ENVIRONMENT                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    Containerization Strategy                             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │    │
│  │  │ Free Tier   │  │ Pro Tier    │  │ Enterprise  │                      │    │
│  │  │ Shared Pool │  │ Warm Contrs │  │ Dedicated   │                      │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                      │    │
│  │  • Session isolation    • Workspace persistence    • VPC peering        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     LAYER 2: SDK CLIENT INTEGRATION                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                  Remote Coding Agent Patterns                            │    │
│  │                                                                          │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │    │
│  │  │ ClaudeCodeClient │  │   CodexClient    │  │   CCR Router     │       │    │
│  │  │                  │  │                  │  │                  │       │    │
│  │  │ • OAuth Token    │  │ • Access Token   │  │ • Dynamic Model  │       │    │
│  │  │ • Claude SDK     │  │ • Codex SDK      │  │ • Per-Agent      │       │    │
│  │  │ • File System    │  │ • Threading      │  │ • Routing Rules  │       │    │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘       │    │
│  │           │                     │                     │                  │    │
│  │           └─────────────────────┴─────────────────────┘                  │    │
│  │                                 │                                        │    │
│  │                    ┌────────────▼────────────┐                           │    │
│  │                    │   IAssistantClient      │  ← Foundation Interface   │    │
│  │                    │   (from packages/shared)│                           │    │
│  │                    └─────────────────────────┘                           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       LAYER 1: FOUNDATION (AgentOS)                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      Agent Framework (Agno)                              │    │
│  │                                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │    │
│  │  │   Agents     │  │    Teams     │  │  Workflows   │  │   Memory    │  │    │
│  │  │              │  │              │  │              │  │             │  │    │
│  │  │ • Approval   │  │ • Multi-     │  │ • HITL       │  │ • Sessions  │  │    │
│  │  │ • Orchestr.  │  │   Agent      │  │ • Routing    │  │ • Knowledge │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │    │
│  │                                                                          │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │    │
│  │  │                    Control Plane (os.agno.com)                   │    │    │
│  │  │  • Session monitoring   • Memory visualization   • Chat UI       │    │    │
│  │  └─────────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Foundation Layer (IAssistantClient)

### What Foundation Provides

The **Platform Foundation** (EPIC-00 through EPIC-07) establishes:

1. **IAssistantClient Interface** - Unified contract for all AI SDK clients
2. **AgnoAssistantClient** - Base implementation wrapping AgentOS
3. **Credential Storage** - Encrypted storage for API keys AND OAuth tokens
4. **AssistantClientFactory** - Factory pattern for client instantiation

### Interface Definition (Story 06.10)

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
  /**
   * Send a query and get streaming response
   * @param prompt - The user's prompt
   * @param cwd - Working directory for file operations
   * @param resumeSessionId - Optional session ID to resume
   */
  sendQuery(
    prompt: string,
    cwd: string,
    resumeSessionId?: string
  ): AsyncGenerator<MessageChunk>;

  /**
   * Get the assistant type identifier
   */
  getType(): string;

  /**
   * Validate credentials are working
   */
  validateCredentials(): Promise<boolean>;
}

export type CredentialType = 'api_key' | 'oauth_token';

export interface AssistantCredentials {
  type: CredentialType;
  value: string;  // Encrypted
  provider: string;
  expiresAt?: Date;  // For OAuth tokens
}
```

### Why This Matters

The `IAssistantClient` interface is the **extension point** that allows the Project Management module to add new SDK clients without modifying Foundation code:

```typescript
// Foundation provides:
class AgnoAssistantClient implements IAssistantClient { ... }

// Project Management module adds:
class ClaudeCodeClient implements IAssistantClient { ... }
class CodexClient implements IAssistantClient { ... }
```

---

## 4. Remote Coding Agents Layer

### What Remote Coding Agents Are

**Remote Coding Agents** are AI assistants that can:

1. **Access file systems** - Read/write code files in user workspaces
2. **Execute commands** - Run bash, git, npm, etc.
3. **Maintain sessions** - Persist context across multiple interactions
4. **Use subscriptions** - Leverage user's Claude Pro/Max subscription via OAuth

### Why They're in Project Management Module (Not Foundation)

| Reason | Explanation |
|--------|-------------|
| **Specialized Use Case** | Only needed for code generation, not general business automation |
| **Security Requirements** | File system access requires containerized isolation |
| **Subscription Model** | OAuth passthrough is specific to coding workflows |
| **SDK Dependencies** | Claude Code SDK and Codex SDK are heavy dependencies |

### Claude Code Client Implementation

```typescript
// bm-pm/src/clients/claude-code.ts

import { IAssistantClient, MessageChunk, AssistantCredentials } from '@hyvve/shared';
import { query } from '@anthropic-ai/claude-code';  // Claude Code SDK

export class ClaudeCodeClient implements IAssistantClient {
  private credentials: AssistantCredentials;
  private systemPrompt: string;

  constructor(credentials: AssistantCredentials, systemPrompt?: string) {
    this.credentials = credentials;
    this.systemPrompt = systemPrompt || 'You are a helpful coding assistant.';
  }

  async *sendQuery(
    prompt: string,
    cwd: string,
    resumeSessionId?: string
  ): AsyncGenerator<MessageChunk> {
    const options = {
      systemPrompt: this.systemPrompt,
      workingDirectory: cwd,
      allowedTools: ['Read', 'Write', 'Bash', 'Glob', 'Grep', 'Edit'],
    };

    // Use OAuth token for subscription passthrough
    if (this.credentials.type === 'oauth_token') {
      process.env.CLAUDE_CODE_OAUTH_TOKEN = this.credentials.value;
    } else {
      process.env.CLAUDE_API_KEY = this.credentials.value;
    }

    // Resume existing session if provided
    if (resumeSessionId) {
      options.resume = resumeSessionId;
    }

    // Stream responses from Claude Code SDK
    for await (const msg of query({ prompt, options })) {
      if (msg.type === 'assistant') {
        for (const block of msg.message.content) {
          if (block.type === 'text') {
            yield { type: 'assistant', content: block.text };
          } else if (block.type === 'tool_use') {
            yield {
              type: 'tool',
              toolName: block.name,
              toolInput: block.input,
            };
          }
        }
      } else if (msg.type === 'result') {
        yield { type: 'result', sessionId: msg.session_id };
      }
    }
  }

  getType(): string {
    return 'claude-code';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const testGen = this.sendQuery('Hello', '/tmp', undefined);
      await testGen.next();
      return true;
    } catch {
      return false;
    }
  }
}
```

### Codex Client Implementation

```typescript
// bm-pm/src/clients/codex.ts

import { IAssistantClient, MessageChunk, AssistantCredentials } from '@hyvve/shared';
import { CodexSDK } from '@openai/codex-sdk';  // Codex SDK

export class CodexClient implements IAssistantClient {
  private sdk: CodexSDK;

  constructor(credentials: AssistantCredentials) {
    this.sdk = new CodexSDK({
      accessToken: credentials.value,
    });
  }

  async *sendQuery(
    prompt: string,
    cwd: string,
    resumeSessionId?: string
  ): AsyncGenerator<MessageChunk> {
    // Get or create thread
    let thread;
    if (resumeSessionId) {
      thread = await this.sdk.threads.retrieve(resumeSessionId);
    } else {
      thread = await this.sdk.threads.create();
    }

    // Execute with file system access
    const result = await this.sdk.threads.execute(thread.id, {
      message: prompt,
      workingDirectory: cwd,
      fileSystemAccess: true,
    });

    // Stream events
    for await (const event of result.events) {
      if (event.type === 'item.completed') {
        switch (event.item.type) {
          case 'agent_message':
            yield { type: 'assistant', content: event.item.text };
            break;
          case 'command_execution':
            yield { type: 'tool', toolName: event.item.command };
            break;
          case 'reasoning':
            yield { type: 'thinking', content: event.item.text };
            break;
        }
      } else if (event.type === 'turn.completed') {
        yield { type: 'result', sessionId: thread.id };
        break;
      }
    }
  }

  getType(): string {
    return 'codex';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.sdk.threads.create();
      return true;
    } catch {
      return false;
    }
  }
}
```

### OAuth Token Passthrough (Critical Feature)

**What it is:** Users can authenticate with their **Claude Pro or Claude Max subscription** using an OAuth token instead of paying per-API-call.

**How to get the token:**
```bash
# User runs this locally
claude setup-token

# Returns: claude-oauth-token-xxxxx
```

**How we store it:**
```typescript
// Store as oauth_token type (not api_key)
await credentialManager.store(userId, 'claude', {
  type: 'oauth_token',
  value: 'claude-oauth-token-xxxxx',  // Encrypted
  provider: 'claude-code',
});
```

**Why this matters:**
- Users with Claude Pro ($20/mo) or Claude Max ($100/mo) get **unlimited** usage
- No per-call API costs passed to the user
- Platform can offer "Bring Your Own Subscription" model

---

## 5. Containerization Layer

### Why Containers Are Needed

Remote Coding Agents need **isolated execution environments** because:

1. **File System Access** - Agents read/write files in user workspaces
2. **Command Execution** - Agents run bash, git, npm commands
3. **Multi-tenancy** - Users must not access each other's workspaces
4. **Session Persistence** - Sessions should survive container restarts

### Tiered Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    TIER COMPARISON                                │
├──────────────┬─────────────┬─────────────┬──────────────────────┤
│ Feature      │ Free        │ Pro         │ Enterprise           │
├──────────────┼─────────────┼─────────────┼──────────────────────┤
│ Container    │ Shared pool │ Per-user    │ Dedicated always-on  │
│ Concurrent   │ 1           │ 3           │ Unlimited            │
│ Workspace    │ Ephemeral   │ 24h persist │ Permanent            │
│ Session      │ 1 hour      │ 7 days      │ 30 days              │
│ OAuth        │ No          │ Yes         │ Yes                  │
│ File Access  │ /tmp only   │ User volume │ Full workspace       │
└──────────────┴─────────────┴─────────────┴──────────────────────┘
```

### Credential Injection

```typescript
// Container receives decrypted credentials at runtime
class CredentialInjector {
  async injectCredentials(
    userId: string,
    providers: string[]
  ): Promise<Record<string, string>> {
    const env: Record<string, string> = {};

    for (const provider of providers) {
      const cred = await this.keyStorage.getKey(userId, provider);
      if (cred) {
        // Map to environment variables
        if (cred.type === 'oauth_token' && provider === 'claude') {
          env['CLAUDE_CODE_OAUTH_TOKEN'] = cred.value;
        } else if (provider === 'codex') {
          env['CODEX_ACCESS_TOKEN'] = cred.value;
        } else {
          env[`${provider.toUpperCase()}_API_KEY`] = cred.value;
        }
      }
    }

    return env;
  }
}
```

---

## 6. Integration Flow

### Complete Request Flow

```
1. User sends message via dashboard
   │
   ▼
2. Gateway authenticates, extracts workspace context
   │
   ▼
3. NestJS determines agent type needed
   │
   ├─ Business automation agent? → AgentOS (Foundation)
   │
   └─ Coding agent? → Remote Coding Agent (Project Module)
          │
          ▼
4. AssistantClientFactory creates appropriate client
   │
   ├─ ClaudeCodeClient (if user has Claude OAuth)
   ├─ CodexClient (if user has Codex token)
   └─ AgnoAssistantClient (fallback)
          │
          ▼
5. CCR Router selects model based on:
   │  • Agent type
   │  • Task complexity
   │  • User preferences
   │  • Available credentials
          │
          ▼
6. Container orchestrator assigns execution environment
   │
   ├─ Free tier → Shared worker pool
   ├─ Pro tier → Warm per-user container
   └─ Enterprise → Dedicated container
          │
          ▼
7. Agent executes in container with:
   │  • Injected credentials
   │  • Mounted workspace
   │  • Network isolation
          │
          ▼
8. Streaming response back through layers
   │
   ▼
9. Session ID persisted for resume capability
```

---

## 7. CCR Custom Router

### What CCR Is

**CCR (Claude Code Router)** - https://github.com/VisionCraft3r/ccr-custom

A routing system that allows **dynamic selection of AI providers per agent/task**.

### Why We Need It

Different tasks benefit from different models:

| Task Type | Best Model | Why |
|-----------|------------|-----|
| Complex reasoning | Claude Opus | Strongest reasoning |
| Code generation | Claude Sonnet / Codex | Good balance |
| Quick edits | Claude Haiku | Fast, cheap |
| Vision tasks | Claude / GPT-4V | Image understanding |

### Integration with IAssistantClient

```typescript
// bm-pm/src/router/ccr-router.ts

interface RoutingRule {
  agentType: string;
  taskPattern: RegExp;
  preferredClient: string;
  fallbackClient: string;
}

class CCRRouter {
  private rules: RoutingRule[];
  private factory: AssistantClientFactory;

  async route(
    agentType: string,
    taskDescription: string,
    userId: string
  ): Promise<IAssistantClient> {
    // Find matching rule
    const rule = this.rules.find(r =>
      r.agentType === agentType &&
      r.taskPattern.test(taskDescription)
    );

    // Get user's available credentials
    const credentials = await this.getAvailableCredentials(userId);

    // Select client based on rule and available credentials
    if (rule && credentials.has(rule.preferredClient)) {
      return this.factory.create(rule.preferredClient, userId);
    }

    if (rule && credentials.has(rule.fallbackClient)) {
      return this.factory.create(rule.fallbackClient, userId);
    }

    // Default to AgentOS
    return this.factory.create('agno', userId);
  }
}
```

### Example Routing Rules

```yaml
# bm-pm/config/routing-rules.yaml
rules:
  - agentType: "project-creator"
    taskPattern: "create.*project|scaffold|initialize"
    preferredClient: "claude-code"
    fallbackClient: "codex"

  - agentType: "code-reviewer"
    taskPattern: "review|analyze|audit"
    preferredClient: "claude-code"
    fallbackClient: "agno"

  - agentType: "quick-edit"
    taskPattern: "fix|update|change"
    preferredClient: "codex"  # Faster for small changes
    fallbackClient: "claude-code"
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Current)

**Epic 06 - Story 06.10: IAssistantClient Interface**
- [x] Define interface in `packages/shared`
- [x] Create `MessageChunk` types
- [x] Support `oauth_token` credential type
- [ ] Implement `AgnoAssistantClient`
- [ ] Create `AssistantClientFactory`

### Phase 2: Project Management Module (Future)

**Epic 09+ (To Be Created)**

| Story | Points | Description |
|-------|--------|-------------|
| 09.1 | 3 | Create ClaudeCodeClient implementation |
| 09.2 | 3 | Create CodexClient implementation |
| 09.3 | 2 | Implement CCR Custom Router core |
| 09.4 | 3 | Build container orchestrator integration |
| 09.5 | 2 | Add OAuth token onboarding flow |
| 09.6 | 2 | Create project creation wizard |
| 09.7 | 3 | Implement session resume for coding agents |
| 09.8 | 3 | **CCR Routing Configuration UI** - Advanced per-agent routing rules |

**Story 09.8: CCR Routing Configuration UI**

Unlike Foundation's basic agent model preferences (Story 06.11), this provides **advanced routing** for coding agent teams:

```
┌─────────────────────────────────────────────────────────────┐
│ Coding Agent Routing Rules                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Project Creator Team                                         │
│ ┌─────────────┐ ┌───────────────┐ ┌──────────────────────┐  │
│ │ Claude Code │ │ Model: Opus   │ │ Tasks: scaffold, init│  │
│ └─────────────┘ └───────────────┘ └──────────────────────┘  │
│ Fallback: Codex → GPT-4o                                     │
│                                                              │
│ Code Assistant Team                                          │
│ ┌─────────────┐ ┌───────────────┐ ┌──────────────────────┐  │
│ │ Claude Code │ │ Model: Sonnet │ │ Tasks: edit, refactor│  │
│ └─────────────┘ └───────────────┘ └──────────────────────┘  │
│ Fallback: Claude Code → Haiku                                │
│                                                              │
│ [+ Add Routing Rule]                                         │
│                                                              │
│ Task Pattern Matching:                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Pattern: "review|analyze" → Claude Opus                  │ │
│ │ Pattern: "fix|update"     → Codex (faster)               │ │
│ │ Pattern: "create|build"   → Claude Sonnet                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Save Rules]                                                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Differences from Foundation (06.11):**
| Feature | Foundation (06.11) | bm-pm (09.8) |
|---------|-------------------|--------------|
| Scope | All Agno agents | Coding agents only |
| Routing | Per agent type | Per agent + task pattern |
| SDKs | Agno models | Claude Code, Codex, CCR |
| Complexity | Simple dropdown | Rule-based with patterns |

### Phase 3: Containerization (Production)

**Epic 10+ (To Be Created)**

| Story | Points | Description |
|-------|--------|-------------|
| 10.1 | 5 | Build agent-executor Docker image |
| 10.2 | 3 | Implement WorkerPoolManager |
| 10.3 | 3 | Set up Redis job queue for containers |
| 10.4 | 5 | Configure Kubernetes deployment |
| 10.5 | 2 | Implement tier-based resource limits |
| 10.6 | 3 | Add container health monitoring |

---

## References

### Source Documents
- `docs/architecture/remote-coding-agent-patterns.md` - SDK patterns
- `docs/architecture/containerization-strategy.md` - Container architecture
- `docs/research/agentos-integration-analysis.md` - AgentOS analysis

### External Resources
- [Claude Code SDK](https://docs.anthropic.com/claude-code)
- [Codex SDK](https://openai.com/codex)
- [CCR Custom Router](https://github.com/VisionCraft3r/ccr-custom)
- [AgentOS Documentation](https://docs.agno.com/agentos)
- [OpenRouter](https://openrouter.ai/) - Meta-provider for 100+ models via single API

### Architecture Decision Records
- ADR-006: BYOAI Provider Abstraction
- ADR-007: AgentOS for Agent Runtime

---

_Research by: Claude Code_
_Date: 2025-12-01_
_Module: bm-pm (Business Module - Project Management)_
