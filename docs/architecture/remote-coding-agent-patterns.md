# Remote Coding Agent - Code Patterns Deep Dive

**Purpose:** Extract and document reusable patterns from the Remote Coding Agent for the AI Business Hub
**Source:** `./Remote coding agent/` (README, architecture.md, cloud-deployment.md)

---

## Table of Contents
1. [Overview](#1-overview)
2. [Core Interfaces](#2-core-interfaces)
3. [AI Assistant Client Pattern](#3-ai-assistant-client-pattern)
4. [Platform Adapter Pattern](#4-platform-adapter-pattern)
5. [Session Management](#5-session-management)
6. [Streaming Patterns](#6-streaming-patterns)
7. [Command System](#7-command-system)
8. [Authentication Patterns](#8-authentication-patterns)
9. [Database Schema](#9-database-schema)
10. [Adaptation for Business Hub](#10-adaptation-for-business-hub)

---

## 1. Overview

### What Remote Coding Agent Solves
- Control AI coding assistants (Claude Code, Codex) remotely
- Multi-platform support (Telegram, GitHub webhooks)
- Persistent sessions that survive container restarts
- Streaming and batch response modes

### Key Design Principles
1. **Interface-driven**: Both platform adapters and AI clients implement strict interfaces
2. **Streaming-first**: All AI responses stream through async generators
3. **Session persistence**: AI sessions survive container restarts via database
4. **Generic commands**: User-defined commands in Git-versioned markdown files
5. **Platform-specific streaming**: Each platform controls stream vs batch

### System Architecture
```
┌─────────────────────────────────────────────┐
│   Platform Adapters (Telegram, GitHub)      │
│   • IPlatformAdapter interface              │
│   • Handle platform-specific messaging      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│            Orchestrator                     │
│   • Route slash commands → Command Handler  │
│   • Route AI queries → Assistant Clients    │
│   • Manage session lifecycle                │
│   • Stream responses back to platforms      │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────────────┐
│  Command    │  │  AI Assistant       │
│  Handler    │  │  Clients            │
│             │  │  • IAssistantClient │
│  (Slash     │  │  • Factory pattern  │
│  commands)  │  │  • Streaming API    │
└─────────────┘  └────────┬────────────┘
       │                  │
       └────────┬─────────┘
                ▼
┌─────────────────────────────────────────────┐
│        PostgreSQL (3 Tables)                │
│  • Codebases  • Conversations  • Sessions   │
└─────────────────────────────────────────────┘
```

---

## 2. Core Interfaces

### 2.1 IPlatformAdapter Interface
**Location:** `src/types/index.ts:49-74`

```typescript
export interface IPlatformAdapter {
  // Send a message to the platform
  sendMessage(conversationId: string, message: string): Promise<void>;

  // Get the configured streaming mode
  getStreamingMode(): 'stream' | 'batch';

  // Get the platform type identifier
  getPlatformType(): string;

  // Start the platform adapter (polling, webhook server, etc.)
  start(): Promise<void>;

  // Stop the platform adapter gracefully
  stop(): void;
}
```

**How We'll Adapt This:**
For Business Hub, we'll create adapters for:
- `WebDashboardAdapter` - Next.js frontend via WebSocket
- `MobileAppAdapter` - Future mobile app
- `APIAdapter` - REST API for external integrations

### 2.2 IAssistantClient Interface
**Location:** `src/types/index.ts:93-106`

```typescript
export interface IAssistantClient {
  // Send a query and get streaming response
  sendQuery(
    prompt: string,
    cwd: string,
    resumeSessionId?: string
  ): AsyncGenerator<MessageChunk>;

  // Get the assistant type identifier
  getType(): string;
}
```

**MessageChunk Types:**
```typescript
interface MessageChunk {
  type: 'assistant' | 'result' | 'system' | 'tool' | 'thinking';
  content?: string;       // Text content
  sessionId?: string;     // Session ID for persistence
  toolName?: string;      // Tool being used
  toolInput?: Record<string, unknown>; // Tool parameters
}
```

---

## 3. AI Assistant Client Pattern

### 3.1 Claude Client Implementation
**Location:** `src/clients/claude.ts`

```typescript
export class ClaudeClient implements IAssistantClient {
  async *sendQuery(
    prompt: string,
    cwd: string,
    resumeSessionId?: string
  ): AsyncGenerator<MessageChunk> {

    // Build options for Claude Code SDK
    const options = {
      systemPrompt: this.systemPrompt,
      workingDirectory: cwd,
      // Permission modes for tool access
      allowedTools: ['Read', 'Write', 'Bash', 'Glob', 'Grep'],
    };

    // Resume or start new session
    if (resumeSessionId) {
      console.log(`[Claude] Resuming session: ${resumeSessionId}`);
      options.resume = resumeSessionId;
    }

    // Stream responses from SDK
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
        // Return session ID for persistence
        yield { type: 'result', sessionId: msg.session_id };
      }
    }
  }

  getType(): string {
    return 'claude';
  }
}
```

### 3.2 Codex Client Implementation
**Location:** `src/clients/codex.ts`

```typescript
export class CodexClient implements IAssistantClient {
  async *sendQuery(
    prompt: string,
    cwd: string,
    resumeSessionId?: string
  ): AsyncGenerator<MessageChunk> {

    // Initialize or resume thread
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
        break; // CRITICAL: Exit loop on turn completion
      }
    }
  }

  getType(): string {
    return 'codex';
  }
}
```

### 3.3 Client Factory Pattern
**Location:** `src/clients/factory.ts`

```typescript
export function getAssistantClient(type: string): IAssistantClient {
  switch (type) {
    case 'claude':
      return new ClaudeClient();
    case 'codex':
      return new CodexClient();
    default:
      throw new Error(`Unknown assistant type: ${type}`);
  }
}
```

**How We'll Extend This:**
```typescript
// For Business Hub, extend with more clients
export function getAssistantClient(type: string, config: UserModelConfig): IAssistantClient {
  switch (type) {
    case 'claude':
      return new ClaudeClient(config.apiKeys.claude_oauth_token || config.apiKeys.claude_api_key);
    case 'codex':
      return new CodexClient(config.apiKeys.codex_access_token);
    case 'gemini':
      return new GeminiClient(config.apiKeys.gemini_api_key);
    case 'openai':
      return new OpenAIClient(config.apiKeys.openai_api_key);
    case 'deepseek':
      return new DeepSeekClient(config.apiKeys.deepseek_api_key);
    default:
      throw new Error(`Unknown assistant type: ${type}`);
  }
}
```

---

## 4. Platform Adapter Pattern

### 4.1 Implementation Guide

```typescript
import { IPlatformAdapter } from '../types';

export class YourPlatformAdapter implements IPlatformAdapter {
  private streamingMode: 'stream' | 'batch';

  constructor(config: YourPlatformConfig, mode: 'stream' | 'batch' = 'stream') {
    this.streamingMode = mode;
  }

  async sendMessage(conversationId: string, message: string): Promise<void> {
    const MAX_LENGTH = 4096; // Platform-specific limit

    if (message.length <= MAX_LENGTH) {
      await this.client.sendMessage(conversationId, message);
    } else {
      // Split long messages intelligently
      const chunks = splitMessage(message, MAX_LENGTH);
      for (const chunk of chunks) {
        await this.client.sendMessage(conversationId, chunk);
      }
    }
  }

  getStreamingMode(): 'stream' | 'batch' {
    return this.streamingMode;
  }

  getPlatformType(): string {
    return 'your-platform';
  }

  async start(): Promise<void> {
    // Start polling, webhook server, WebSocket, etc.
  }

  stop(): void {
    // Cleanup
  }
}
```

### 4.2 Polling vs Webhooks vs WebSocket

**Polling (Telegram pattern):**
```typescript
async start(): Promise<void> {
  this.bot.on('message', async (ctx) => {
    const conversationId = this.getConversationId(ctx);
    const message = ctx.message.text;
    await this.onMessageHandler(conversationId, message);
  });
  await this.bot.launch({ dropPendingUpdates: true });
}
```

**Webhooks (GitHub pattern):**
```typescript
// Express route
app.post('/webhooks/github', async (req, res) => {
  const signature = req.headers['x-signature'];
  await adapter.handleWebhook(req.body, signature);
  res.sendStatus(200);
});

// In adapter
async handleWebhook(payload: any, signature: string): Promise<void> {
  if (!this.verifySignature(payload, signature)) return;
  const { conversationId, message } = this.parseEvent(payload);
  await handleMessage(this, conversationId, message);
}
```

**WebSocket (Business Hub pattern - NEW):**
```typescript
// For Business Hub dashboard
export class WebDashboardAdapter implements IPlatformAdapter {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  async sendMessage(conversationId: string, message: string): Promise<void> {
    // Emit to specific user's socket room
    this.io.to(conversationId).emit('agent:message', {
      type: 'assistant',
      content: message,
      timestamp: Date.now()
    });
  }

  async start(): Promise<void> {
    this.io.on('connection', (socket) => {
      socket.on('user:message', async (data) => {
        const conversationId = socket.userId; // From auth
        await handleMessage(this, conversationId, data.message);
      });
    });
  }
}
```

---

## 5. Session Management

### 5.1 Session Lifecycle

```
1. User sends message
   → getOrCreateConversation()
   → getActiveSession() // null if first message

2. No session exists
   → createSession({ active: true })

3. Send to AI, get session ID
   → updateSession(session.id, aiSessionId)

4. User sends another message
   → getActiveSession() // returns existing
   → Resume with assistant_session_id

5. User sends /reset
   → deactivateSession(session.id)
   → Next message creates new session
```

### 5.2 Session Database Operations

```typescript
// Create new session
async createSession(data: CreateSessionData): Promise<Session> {
  return db.session.create({
    data: {
      userId: data.userId,
      conversationId: data.conversationId,
      agentType: data.agentType,
      active: true,
      metadata: {}
    }
  });
}

// Get active session for conversation
async getActiveSession(conversationId: string): Promise<Session | null> {
  return db.session.findFirst({
    where: {
      conversationId,
      active: true
    }
  });
}

// Update with SDK session ID (for resume capability)
async updateSession(id: string, assistantSessionId: string): Promise<void> {
  await db.session.update({
    where: { id },
    data: { assistantSessionId }
  });
}

// Update metadata (track last command, context, etc.)
async updateSessionMetadata(id: string, metadata: Record<string, any>): Promise<void> {
  await db.session.update({
    where: { id },
    data: {
      metadata: {
        ...existingMetadata,
        ...metadata
      }
    }
  });
}

// Deactivate session (on /reset or plan→execute transition)
async deactivateSession(id: string): Promise<void> {
  await db.session.update({
    where: { id },
    data: { active: false }
  });
}
```

### 5.3 Special Case: Plan→Execute Transition

```typescript
// Check for plan→execute transition (requires NEW session)
const needsNewSession =
  commandName === 'execute' &&
  session?.metadata?.lastCommand === 'plan-feature';

if (needsNewSession) {
  // Deactivate old session, create new one
  await sessionDb.deactivateSession(session.id);
  session = await sessionDb.createSession({...});
} else if (!session) {
  // No session exists - create one
  session = await sessionDb.createSession({...});
} else {
  // Resume existing session
  console.log(`Resuming session ${session.id}`);
}
```

---

## 6. Streaming Patterns

### 6.1 Stream Mode
Real-time message delivery as AI generates.

```typescript
if (mode === 'stream') {
  for await (const msg of aiClient.sendQuery(...)) {
    if (msg.type === 'assistant' && msg.content) {
      await platform.sendMessage(conversationId, msg.content);
    } else if (msg.type === 'tool' && msg.toolName) {
      const toolMessage = formatToolCall(msg.toolName, msg.toolInput);
      await platform.sendMessage(conversationId, toolMessage);
    }
  }
}
```

### 6.2 Batch Mode
Accumulate all, send final summary.

```typescript
if (mode === 'batch') {
  const assistantMessages: string[] = [];

  for await (const msg of aiClient.sendQuery(...)) {
    if (msg.type === 'assistant' && msg.content) {
      assistantMessages.push(msg.content);
    }
    // Tool calls logged but not sent to user
  }

  // Extract clean summary (filter out tool indicators)
  const finalMessage = extractCleanSummary(assistantMessages);
  await platform.sendMessage(conversationId, finalMessage);
}
```

### 6.3 Tool Formatter

```typescript
export function formatToolCall(
  toolName: string,
  toolInput?: Record<string, unknown>
): string {
  let message = `🔧 ${toolName.toUpperCase()}`;

  if (toolName === 'Bash' && toolInput?.command) {
    message += `\n${toolInput.command}`;
  } else if (toolName === 'Read' && toolInput?.file_path) {
    message += `\nReading: ${toolInput.file_path}`;
  } else if (toolName === 'Edit' && toolInput?.file_path) {
    message += `\nEditing: ${toolInput.file_path}`;
  }

  return message;
}
```

---

## 7. Command System

### 7.1 Command Architecture

```
User: /command-invoke plan "Add dark mode"
           ↓
Orchestrator: Parse command + args
           ↓
Read file: .claude/commands/plan.md
           ↓
Variable substitution: $1 → "Add dark mode"
           ↓
Send to AI client: Injected prompt
           ↓
Stream responses back to platform
```

### 7.2 Command Storage (Database)

```json
{
  "prime": {
    "path": ".claude/commands/prime.md",
    "description": "Research codebase"
  },
  "plan": {
    "path": ".claude/commands/plan-feature.md",
    "description": "Create implementation plan"
  }
}
```

### 7.3 Variable Substitution

```typescript
export function substituteVariables(
  text: string,
  args: string[],
  metadata: Record<string, unknown> = {}
): string {
  let result = text;

  // Replace $1, $2, $3, etc.
  args.forEach((arg, index) => {
    result = result.replace(new RegExp(`\\$${index + 1}`, 'g'), arg);
  });

  // Replace $ARGUMENTS
  result = result.replace(/\$ARGUMENTS/g, args.join(' '));

  // Replace escaped dollar signs
  result = result.replace(/\\\$/g, '$');

  return result;
}
```

---

## 8. Authentication Patterns

### 8.1 Claude OAuth Token (Pro/Max Subscription)

```bash
# Generate OAuth token
claude setup-token
# Returns: sk-ant-oat01-xxxxx
```

```env
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-xxxxx
```

**This allows using Claude Pro/Max subscription without per-call API costs!**

### 8.2 Claude API Key (Pay-per-use)

```env
CLAUDE_API_KEY=sk-ant-xxxxx
```

### 8.3 Codex Credentials

```bash
# Authenticate with Codex CLI
codex login

# Extract from auth file
cat ~/.codex/auth.json
```

```env
CODEX_ID_TOKEN=eyJhbGc...
CODEX_ACCESS_TOKEN=eyJhbGc...
CODEX_REFRESH_TOKEN=rt_...
CODEX_ACCOUNT_ID=6a6a7ba6-...
```

### 8.4 Secure Storage for Business Hub

```typescript
// Encrypt API keys at rest
interface SecureKeyStorage {
  // Store encrypted key
  async storeKey(userId: string, provider: string, key: string): Promise<void> {
    const encrypted = await encrypt(key, process.env.ENCRYPTION_KEY);
    await db.userApiKeys.upsert({
      where: { userId_provider: { userId, provider } },
      create: { userId, provider, encryptedKey: encrypted },
      update: { encryptedKey: encrypted }
    });
  }

  // Retrieve and decrypt
  async getKey(userId: string, provider: string): Promise<string | null> {
    const record = await db.userApiKeys.findUnique({
      where: { userId_provider: { userId, provider } }
    });
    if (!record) return null;
    return decrypt(record.encryptedKey, process.env.ENCRYPTION_KEY);
  }
}
```

---

## 9. Database Schema

### 9.1 Remote Agent Schema (3 tables)

```sql
-- Repository metadata + commands
CREATE TABLE remote_agent_codebases (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  repository_url VARCHAR(500),
  default_cwd VARCHAR(500),
  ai_assistant_type VARCHAR(50), -- 'claude' | 'codex'
  commands JSONB, -- {command_name: {path, description}}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Platform conversation tracking
CREATE TABLE remote_agent_conversations (
  id UUID PRIMARY KEY,
  platform_type VARCHAR(50), -- 'telegram' | 'github'
  platform_conversation_id VARCHAR(255),
  codebase_id UUID REFERENCES remote_agent_codebases(id),
  cwd VARCHAR(500),
  ai_assistant_type VARCHAR(50), -- LOCKED at creation
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(platform_type, platform_conversation_id)
);

-- AI session management
CREATE TABLE remote_agent_sessions (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES remote_agent_conversations(id),
  codebase_id UUID REFERENCES remote_agent_codebases(id),
  ai_assistant_type VARCHAR(50),
  assistant_session_id VARCHAR(255), -- SDK session ID for resume
  active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 10. Adaptation for Business Hub

### 10.1 What We Keep
- ✅ IAssistantClient interface pattern
- ✅ Session management with resume capability
- ✅ Streaming async generators
- ✅ OAuth token support for Claude
- ✅ Client factory pattern
- ✅ MessageChunk types

### 10.2 What We Adapt

| Remote Agent | Business Hub |
|--------------|--------------|
| IPlatformAdapter (Telegram, GitHub) | IPlatformAdapter (WebSocket Dashboard) |
| Codebases table | Projects table |
| 2 AI clients (Claude, Codex) | 5+ AI clients (Claude, Codex, Gemini, OpenAI, DeepSeek) |
| Single user | Multi-tenant |
| Environment variables for keys | Encrypted per-user key storage |
| Fixed assistant per codebase | Dynamic model routing per agent |

### 10.3 New Components to Build

```typescript
// Model Router (CCR-inspired)
interface IModelRouter {
  route(agentType: string, taskType: string, userId: string): Promise<IAssistantClient>;
}

// Agent Activity Stream
interface IAgentActivityStream {
  subscribe(userId: string, callback: (activity: AgentActivity) => void): void;
  publish(activity: AgentActivity): void;
}

// Approval Queue
interface IApprovalQueue {
  addApproval(approval: Approval): Promise<void>;
  getPendingApprovals(userId: string): Promise<Approval[]>;
  resolveApproval(id: string, decision: 'approved' | 'rejected'): Promise<void>;
}
```

### 10.4 Implementation Checklist

- [ ] Port IAssistantClient interface
- [ ] Create ClaudeClient with OAuth support
- [ ] Create CodexClient with token auth
- [ ] Create GeminiClient
- [ ] Create OpenAIClient
- [ ] Create DeepSeekClient
- [ ] Build client factory with routing
- [ ] Port session management
- [ ] Create WebSocketAdapter for dashboard
- [ ] Build encrypted key storage
- [ ] Implement model router
- [ ] Add agent activity streaming
- [ ] Build approval queue
