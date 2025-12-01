# AI Business Hub - Framework Deep Dive Research Report

**Date:** 2024-11-27
**Status:** Complete
**Team:** BMad Agent Team (Party Mode Session)

---

## Executive Summary

This report documents the comprehensive research conducted on key technologies for the AI Business Hub platform. The investigation covered:

1. **Agno Framework** - Multi-agent orchestration
2. **CCR-Custom** - Claude Code Router for model routing
3. **Claude Agent SDK** - Anthropic's official agent SDK
4. **Taskosaur** - Conversational project management
5. **Remote Coding Agent** - Reference containerization implementation

**Key Recommendation:** Use Agno for orchestration, build custom UI inspired by Taskosaur, leverage the Remote Coding Agent patterns for containerization, and build a custom model router inspired by CCR-Custom.

---

## 1. AGNO FRAMEWORK

### Overview
Agno is a Python framework for building multi-agent AI systems with shared memory, knowledge, and reasoning. It provides four core abstractions: **Agents**, **Teams**, **Workflows**, and **Tools**.

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    AGNO FRAMEWORK                        │
├─────────────────────────────────────────────────────────┤
│  Agent Layer                                            │
│  ├── Individual agents with models, tools, instructions │
│  ├── Memory (user memories, session history)            │
│  └── Knowledge (RAG via LanceDB, PgVector, Pinecone)   │
├─────────────────────────────────────────────────────────┤
│  Team Layer                                             │
│  ├── Team leader coordinates members                    │
│  ├── Hierarchical delegation (tree structure)           │
│  └── Shared memory across team members                  │
├─────────────────────────────────────────────────────────┤
│  Workflow Layer                                         │
│  ├── Sequential, parallel, conditional execution        │
│  ├── Steps (agents, teams, or functions)                │
│  └── State management & session persistence             │
├─────────────────────────────────────────────────────────┤
│  AgentOS (Production Runtime)                           │
│  ├── Cloud hosting & scalability                        │
│  ├── Database migrations                                │
│  └── Observability & telemetry                          │
└─────────────────────────────────────────────────────────┘
```

### Model Support (Excellent)
| Provider | Models | Native Support |
|----------|--------|----------------|
| Anthropic | Claude Sonnet 4, Opus 4, Haiku | ✅ Full |
| OpenAI | GPT-4o, GPT-5-mini, o1, o3 | ✅ Full |
| Google | Gemini 1.5 Pro/Flash | ✅ Full |
| DeepSeek | Chat, Reasoner | ✅ Full |
| Ollama | Local models | ✅ Full |
| AWS Bedrock | Claude via AWS | ✅ Full |
| Vertex AI | Claude via GCP | ✅ Full |

### Human-in-the-Loop (Critical for Business Hub)
```python
# Agno provides native HITL support:
@tool(requires_confirmation=True)
def sensitive_operation(data: str) -> str:
    """This tool pauses and asks for user confirmation"""
    return "Operation completed"

# Run response includes paused state
if run_response.is_paused:
    for tool in run_response.tools_requiring_confirmation:
        tool.confirmed = get_user_approval()
    agent.continue_run(run_response)
```

### Memory & State
- PostgreSQL, MongoDB, SQLite, Redis backends
- User memories persist across sessions
- Agents can share memories via same database
- Team-level memory coordination

### Workflow Execution Patterns
- Sequential (step-by-step)
- Parallel (concurrent execution)
- Conditional branching
- Loops and iteration
- Conversational workflows with user interaction

### Production Readiness Score: 8.5/10
- ✅ Comprehensive documentation (9,000+ code snippets)
- ✅ Multiple database backends
- ✅ AgentOS for production deployment
- ✅ Active development
- ⚠️ Relatively new framework

---

## 2. CCR-CUSTOM (Claude Code Router)

### Overview
CCR-Custom is a local proxy server that intercepts requests from Claude Code and routes them to different AI models based on configurable rules.

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│                   CCR-CUSTOM ROUTER                      │
├─────────────────────────────────────────────────────────┤
│  Client (Claude Code / Agent SDK)                       │
│            │                                            │
│            ▼                                            │
│  ┌─────────────────────┐                               │
│  │  CCR Proxy Server   │ (localhost:3456)              │
│  │  ├── Request Parser │                               │
│  │  ├── Router Logic   │                               │
│  │  └── Transformers   │                               │
│  └─────────────────────┘                               │
│            │                                            │
│    ┌───────┼───────┬───────┬───────┐                   │
│    ▼       ▼       ▼       ▼       ▼                   │
│  Claude  OpenAI  Gemini  DeepSeek  Ollama              │
└─────────────────────────────────────────────────────────┘
```

### Key Features
| Feature | Description |
|---------|-------------|
| Multi-Provider Routing | Route to OpenRouter, DeepSeek, Ollama, Gemini, etc. |
| BMAD Agent Detection | Detects `.bmad/bmm/agents/` and assigns models per agent |
| Request Transformers | Adapts requests for different provider APIs |
| CLI Tools | `ccr model`, `ccr ui`, `ccr activate` |
| Custom Routing | JavaScript-based custom routing logic |

### Production Readiness Score: 6/10
- ✅ MIT License
- ✅ Active development (315 commits)
- ⚠️ Low adoption (3 stars)
- ⚠️ Not designed for multi-tenant SaaS
- ⚠️ Single-user focus (local proxy)

---

## 3. CLAUDE AGENT SDK

### Overview
The official SDK from Anthropic that provides the building blocks to create autonomous agents. This powers Claude Code itself.

### Key Capabilities
- **Context Management**: Automatic compaction prevents context overflow
- **Tool Ecosystem**: Built-in Read, Write, Bash, plus custom tools via MCP
- **Permission Framework**: `allowedTools`, `disallowedTools`, `permissionMode`
- **Streaming**: Real-time response streaming

### Authentication Methods
- **Primary**: `ANTHROPIC_API_KEY` environment variable
- **Amazon Bedrock**: `CLAUDE_CODE_USE_BEDROCK=1`
- **Vertex AI**: `CLAUDE_CODE_USE_VERTEX=1`
- **OAuth Token**: `sk-ant-oat01-...` (for Pro/Max subscriptions)

### Container Deployment
Community project [claude-agent-sdk-container](https://github.com/receipting/claude-agent-sdk-container) provides:
- Docker multi-stage build
- REST API at `/query` endpoint
- GitHub OAuth + API key authentication
- Multi-agent collaboration support

### Production Readiness Score: 9/10
- ✅ Official Anthropic SDK
- ✅ Powers Claude Code
- ✅ Container deployment options
- ✅ MCP integration
- ⚠️ Primarily CLI-focused

---

## 4. TASKOSAUR

### Overview
Open-source project management platform with conversational AI that executes tasks directly within the application.

### Tech Stack
| Layer | Technology |
|-------|------------|
| Backend | NestJS, TypeScript, PostgreSQL 16+, Redis 7+ |
| Frontend | Next.js 15.2.2, React, TypeScript |
| Real-time | WebSockets |
| Deployment | Docker, Docker Compose |

### Key Differentiator
Taskosaur's AI doesn't just suggest - it **executes**:
> User: "Create sprint with high-priority bugs from last week"
> AI: Actually navigates the interface and completes the workflow

### Features Relevant to Business Hub
- ✅ Conversational task creation
- ✅ BYOAI model support
- ✅ Real-time WebSocket updates
- ✅ Self-hosted deployment
- ✅ Docker support

### License Concern
**Business Source License (BSL)** - allows self-hosting but has commercial protections.

### Production Readiness Score: 7/10
- ✅ Modern tech stack
- ✅ Active development
- ⚠️ BSL license
- ⚠️ Relatively new

---

## 5. REMOTE CODING AGENT (Reference Implementation)

### Critical Discovery
The user's existing "Remote coding agent" folder contains a **complete reference implementation** for containerized AI agent execution using Claude subscriptions!

### What It Solves
- **Claude OAuth tokens** (`sk-ant-oat01-...`) for Pro/Max subscriptions
- **Codex SDK** integration with token-based auth
- **Docker containerization** with compose profiles
- **Multi-platform messaging** (Telegram, GitHub webhooks)
- **Session persistence** in PostgreSQL
- **Streaming and batch modes**

### Architecture
```
┌─────────────────────────────────────────────┐
│   Platform Adapters (Telegram, GitHub)      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│            Orchestrator                     │
│   (Message Routing & Context Management)    │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────────┐
│  Command    │  │  AI Assistant    │
│  Handler    │  │  Clients         │
│  (Slash)    │  │  (Claude/Codex)  │
└─────────────┘  └────────┬─────────┘
       │                  │
       └────────┬─────────┘
                ▼
┌─────────────────────────────────────────────┐
│        PostgreSQL (3 Tables)                │
│  • Codebases  • Conversations  • Sessions   │
└─────────────────────────────────────────────┘
```

### Key Interfaces

**IPlatformAdapter** - For adding new messaging platforms:
```typescript
export interface IPlatformAdapter {
  sendMessage(conversationId: string, message: string): Promise<void>;
  getStreamingMode(): 'stream' | 'batch';
  getPlatformType(): string;
  start(): Promise<void>;
  stop(): void;
}
```

**IAssistantClient** - For adding new AI assistants:
```typescript
export interface IAssistantClient {
  sendQuery(
    prompt: string,
    cwd: string,
    resumeSessionId?: string
  ): AsyncGenerator<MessageChunk>;
  getType(): string;
}
```

### Authentication Patterns
```env
# Claude OAuth (uses Pro/Max subscription)
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-xxxxx

# Or Claude API Key (pay-per-use)
CLAUDE_API_KEY=sk-ant-xxxxx

# Codex credentials
CODEX_ID_TOKEN=eyJhbGc...
CODEX_ACCESS_TOKEN=eyJhbGc...
CODEX_REFRESH_TOKEN=rt_...
CODEX_ACCOUNT_ID=6a6a7ba6-...
```

### Session Management
- Sessions survive container restarts via database
- Supports session resume for context preservation
- Handles plan→execute transitions (new session on transition)

---

## 6. RECOMMENDED ARCHITECTURE

Based on all research, here's the recommended architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AI BUSINESS HUB ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PRESENTATION LAYER (Custom, inspired by Taskosaur)                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Next.js Dashboard + Conversational UI                       │   │
│  │  ├── Agent Activity Visualization                            │   │
│  │  ├── Approval Center                                         │   │
│  │  └── Real-time WebSocket streaming                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ORCHESTRATION LAYER (Agno)                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Agno Teams + Workflows + Agents                             │   │
│  │  ├── Multi-agent coordination                                │   │
│  │  ├── HITL approval gates                                     │   │
│  │  ├── Shared memory (PostgreSQL)                              │   │
│  │  └── Workflow execution engine                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ROUTING LAYER (Custom, inspired by CCR + Remote Agent)             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Model Router Service                                        │   │
│  │  ├── Task-based model selection                              │   │
│  │  ├── Cost optimization                                       │   │
│  │  ├── User API key management                                 │   │
│  │  └── Multi-provider support                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  EXECUTION LAYER (Claude SDK + Others via Agno)                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Containerized Agent Runtimes                                │   │
│  │  ├── Claude Agent SDK (strategy, content, code)              │   │
│  │  ├── OpenAI API (via Agno)                                   │   │
│  │  ├── Gemini API (research, intelligence)                     │   │
│  │  └── DeepSeek (cost-optimized tasks)                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  BMAD MODULE LAYER                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Modular Business Capabilities (event-bus communication)     │   │
│  │  ├── BMV (Validation) │ BMP (Planning) │ BMB (Branding)     │   │
│  │  ├── BME-* (Product Creation modules)                        │   │
│  │  ├── BMC (Content) │ BMX (Marketing) │ BMT (Analytics)      │   │
│  │  └── Each module independent but integrated                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. KEY DECISIONS

### Confirmed
1. ✅ **Use Agno** for orchestration - best multi-agent + HITL support
2. ✅ **Build custom UI** - inspired by Taskosaur (BSL license concern)
3. ✅ **Leverage Remote Coding Agent patterns** - proven containerization
4. ✅ **Build custom model router** - CCR-Custom is inspiration only
5. ✅ **Use Claude OAuth tokens** - enables Pro/Max subscription usage

### Open Questions
1. Containerization: Shared pool vs. per-tenant?
2. Phase 1 scope: Which module first?
3. Event bus: Redis Streams, NATS, or Kafka?

---

## 8. SOURCES

- [Agno Documentation](https://docs.agno.com/)
- [Claude Agent SDK Python](https://github.com/anthropics/claude-agent-sdk-python)
- [Claude Agent SDK Container](https://github.com/receipting/claude-agent-sdk-container)
- [CCR-Custom](https://github.com/VisionCraft3r/ccr-custom)
- [Taskosaur](https://github.com/Taskosaur/Taskosaur)
- [Remote Coding Agent](./Remote%20coding%20agent/) - Local reference implementation
