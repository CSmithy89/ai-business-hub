# AI Business Hub - Master Plan

**Version:** 2.0
**Created:** 2024-11-27
**Updated:** 2025-12-13
**Status:** Foundation Complete - Ready for Module Development

---

## Table of Contents
1. [Vision & Mission](#1-vision--mission)
2. [Core Concepts](#2-core-concepts)
3. [Platform Architecture](#3-platform-architecture)
4. [Module System](#4-module-system)
5. [AI Agent Architecture](#5-ai-agent-architecture)
6. [Model Routing Strategy](#6-model-routing-strategy)
7. [Containerization Strategy](#7-containerization-strategy)
8. [UI/UX Design](#8-uiux-design)
9. [Technical Stack](#9-technical-stack)
10. [Implementation Phases](#10-implementation-phases)
11. [Reference Implementations](#11-reference-implementations)

---

## 1. Vision & Mission

### Vision
Create the ultimate AI-powered business orchestration platform that automates 90% of business operations, requiring only ~5 hours/week of human involvement.

### Mission
Build a modular SaaS platform (similar to ERPNext/Odoo) where:
- Each module can be sold separately
- All modules integrate seamlessly when combined
- AI agents handle execution while humans approve strategic decisions
- Users bring their own AI subscriptions (BYOAI model)

### Core Problem Being Solved
Users struggle with:
- Market validation complexity
- Business planning and strategy
- Product creation across different mediums
- Ongoing content creation and marketing
- Analytics and optimization

### The Solution
Multi-agent AI orchestration with human-in-the-loop approval gates.

---

## 2. Core Concepts

### 2.1 BYOAI (Bring Your Own AI)
Users provide their own AI subscriptions:
- **Claude Pro/Max** - Via OAuth token (`sk-ant-oat01-...`)
- **Claude API** - Via API key (`sk-ant-...`)
- **Codex** - Via token-based auth
- **Gemini** - Via API key
- **OpenAI** - Via API key
- **DeepSeek** - Via API key (cost-optimized)
- **Local Models** - Via Ollama

### 2.2 Two Operational Phases

**BUILD Phase (Sequential):**
1. Discovery - User submits idea, AI validates market
2. Validation - Market research, competitor analysis, feasibility
3. Planning - Business model canvas, financial projections
4. Building - Actual product creation (course, podcast, book, etc.)
5. Launch - Launch assets and go-to-market

**OPERATE Phase (Parallel/Continuous):**
- Intelligence Loop (hourly) - Trend scanning, competitor monitoring
- Content Loop (daily) - Automated content creation
- Marketing Loop (weekly) - Campaign design and execution
- Analytics Loop (real-time) - Metrics and insights

### 2.3 Human-in-the-Loop Approval Gates
Strategic decisions queued for human approval:
- Validation results
- Business plans
- Brand identity
- Content before publishing
- Marketing campaigns and budgets

### 2.4 Modular Independence
Each module must:
- Work standalone (sellable separately)
- Integrate seamlessly with other modules
- Expose API contracts for inter-module communication
- Use event bus for loose coupling

---

## 3. Platform Architecture

### 3.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                     AI BUSINESS HUB PLATFORM                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PRESENTATION LAYER                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Next.js 14+ Dashboard                                       │   │
│  │  ├── Conversational UI (Taskosaur-inspired)                  │   │
│  │  ├── Agent Activity Visualization                            │   │
│  │  ├── Approval Center                                         │   │
│  │  ├── Module-specific UIs                                     │   │
│  │  └── Real-time WebSocket updates                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  API LAYER                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Express.js / NestJS API Server                              │   │
│  │  ├── REST API endpoints                                      │   │
│  │  ├── WebSocket server (Socket.io)                            │   │
│  │  ├── Authentication (JWT + OAuth)                            │   │
│  │  └── API key management                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ORCHESTRATION LAYER (Agno Framework)                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Multi-Agent Orchestration                                   │   │
│  │  ├── Agent Factory (creates agents from user API keys)       │   │
│  │  ├── Team Coordinator (multi-agent coordination)             │   │
│  │  ├── Workflow Engine (BMAD execution)                        │   │
│  │  ├── Approval Queue Manager                                  │   │
│  │  └── Shared Memory (PostgreSQL-backed)                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  MODEL ROUTING LAYER (CCR-inspired)                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Smart Model Router                                          │   │
│  │  ├── Per-agent model assignment                              │   │
│  │  ├── Task-based routing rules                                │   │
│  │  ├── Cost optimization                                       │   │
│  │  ├── Request transformers (provider adaptation)              │   │
│  │  └── Fallback handling                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  AGENT EXECUTION LAYER                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Containerized Agent Runtimes                                │   │
│  │  ├── Claude Agent SDK (code, strategy, content)              │   │
│  │  ├── Codex Client (code review, implementation)              │   │
│  │  ├── Gemini Client (research, intelligence)                  │   │
│  │  ├── OpenAI Client (general tasks)                           │   │
│  │  └── DeepSeek Client (cost-optimized tasks)                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  BMAD MODULE LAYER                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Business Modules (Event Bus Communication)                  │   │
│  │  ├── Core: BMV, BMP, BMB, BMI                               │   │
│  │  ├── Products: BME-Course, BME-Podcast, BME-Book, etc.      │   │
│  │  ├── Operations: BMC, BMX, BMS, BMO, BMT                    │   │
│  │  └── Each module independent but integrated                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  DATA LAYER                                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (Primary) + Redis (Cache/Queue) + S3 (Storage)  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Event Bus Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                        EVENT BUS (Redis Streams)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Publishers:                      Subscribers:                       │
│  ├── Project Management ──────►  ├── Marketing (listens for content)│
│  ├── Content Creation   ──────►  ├── Analytics (listens for events) │
│  ├── Marketing          ──────►  ├── Notifications                  │
│  └── Any Module         ──────►  └── Any Module                     │
│                                                                      │
│  Event Types:                                                        │
│  ├── project.created                                                │
│  ├── content.approved                                               │
│  ├── campaign.launched                                              │
│  ├── approval.required                                              │
│  └── agent.activity                                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Module System

### 4.1 Core Foundation Modules

| Module | Code | Purpose | Status |
|--------|------|---------|--------|
| Validation | BMV | Market research, TAM/SAM/SOM, competitor analysis | Planned |
| Planning | BMP | Business model canvas, financial projections | Planned |
| Branding | BMB | Brand identity, guidelines, voice | Planned |
| Intelligence | BMI | Trend scanning, competitor monitoring | Planned |

### 4.2 Product Creation Modules (BME-*)

| Module | Code | Purpose | Status |
|--------|------|---------|--------|
| Course | BME-Course | Online course curriculum & content | Planned |
| Podcast | BME-Podcast | Podcast series planning & episodes | Planned |
| Book | BME-Book | Book outlining & chapter writing | Planned |
| YouTube | BME-YouTube | Channel strategy & video scripts | Planned |
| Digital | BME-Digital | Templates, workbooks, digital tools | Planned |
| Physical | BME-Physical | Physical product design guidance | Planned |
| Ecommerce | BME-Ecommerce | E-commerce store setup | Planned |
| SaaS | BME-SaaS | Software product specification | Planned |

### 4.3 Business Operations Modules

| Module | Code | Purpose | Inspired By | Status |
|--------|------|---------|-------------|--------|
| Core-PM (PM + KB) | Core-PM | Platform core: project/task orchestration + knowledge base | Taskosaur, Plane | Priority 1 |
| Content | BMC | Content creation pipeline | - | Planned |
| Marketing | BMX | Marketing campaigns, automation | Mautic | Priority 2 |
| Social Media | BM-Social | Social media management | Postiz | Priority 3 |
| Customer Support | BM-Support | Unified inbox, chatbots | Chatwoot | Priority 4 |
| Analytics | BMT | Analytics & tracking | Matomo | Priority 5 |
| Sales | BMS | Sales automation | - | Planned |
| Operations | BMO | Operations management | - | Planned |

### 4.4 Module Contract Interface
Each module must implement:
```typescript
interface IBMADModule {
  // Module identification
  id: string;
  name: string;
  version: string;

  // Dependencies
  requiredModules: string[];
  optionalModules: string[];

  // API contract
  getApiRoutes(): ApiRoute[];
  getEventSubscriptions(): EventSubscription[];
  getEventPublications(): EventType[];

  // Agent integration
  getAgentTools(): AgentTool[];
  getWorkflows(): Workflow[];

  // UI components
  getDashboardWidgets(): Widget[];
  getNavigationItems(): NavItem[];
}
```

---

## 5. AI Agent Architecture

### 5.1 Agent Types

| Agent | Role | Default Model | Fallback |
|-------|------|---------------|----------|
| Strategy Agent | Business strategy, planning | Claude Opus | Claude Sonnet |
| Research Agent | Market research, intelligence | Gemini Pro | Claude Sonnet |
| Content Agent | Content creation, writing | Claude Sonnet | GPT-4o |
| Code Agent | Code generation, technical | Claude Sonnet | Codex |
| Review Agent | Code review, QA | Codex | Claude Sonnet |
| Analytics Agent | Data analysis, insights | Gemini Pro | Claude Sonnet |
| Marketing Agent | Campaign design, copy | Claude Sonnet | GPT-4o |

### 5.2 Agent Team Structure (Agno Teams)
```
Business Hub Team (Leader: Strategy Agent)
├── Research Team
│   ├── Market Research Agent
│   ├── Competitor Analysis Agent
│   └── Trend Scanner Agent
├── Content Team
│   ├── Content Strategy Agent
│   ├── Content Writer Agent
│   └── Content Editor Agent
├── Marketing Team
│   ├── Campaign Designer Agent
│   ├── Copy Writer Agent
│   └── Analytics Agent
└── Technical Team
    ├── Code Agent
    ├── Review Agent
    └── DevOps Agent
```

### 5.3 Agent Session Management
Based on Remote Coding Agent patterns:
```typescript
// Database schema for agent sessions
interface AgentSession {
  id: string;                    // UUID
  user_id: string;               // User who owns session
  agent_type: string;            // 'claude' | 'codex' | 'gemini'
  assistant_session_id: string;  // SDK session ID for resume
  active: boolean;               // One active per conversation
  metadata: {
    lastCommand?: string;
    context?: Record<string, any>;
  };
  created_at: Date;
  updated_at: Date;
}
```

---

## 6. Model Routing Strategy

### 6.1 CCR-Inspired Router Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                      MODEL ROUTER SERVICE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  User Configuration (Settings Page)                          │   │
│  │  ├── API Keys: Claude, Codex, Gemini, OpenAI, DeepSeek      │   │
│  │  ├── Per-Agent Model Assignment                              │   │
│  │  │   ├── Code Agent → Claude Sonnet                         │   │
│  │  │   ├── Review Agent → Codex                               │   │
│  │  │   ├── Research Agent → Gemini                            │   │
│  │  │   └── Content Agent → Claude Sonnet                      │   │
│  │  └── Cost Optimization Rules                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Routing Logic                                               │   │
│  │  ├── Route by agent type                                     │   │
│  │  ├── Route by task type                                      │   │
│  │  ├── Route by cost (use cheaper models for simple tasks)     │   │
│  │  └── Fallback chain if primary unavailable                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Request Transformers                                        │   │
│  │  ├── Claude transformer (Anthropic API format)               │   │
│  │  ├── OpenAI transformer (OpenAI API format)                  │   │
│  │  ├── Gemini transformer (Google API format)                  │   │
│  │  ├── Codex transformer (Codex SDK format)                    │   │
│  │  └── DeepSeek transformer (DeepSeek API format)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Response Normalizer                                         │   │
│  │  └── Convert all responses to unified MessageChunk format    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Settings Page Configuration
```typescript
interface UserModelConfig {
  // API Keys (encrypted at rest)
  apiKeys: {
    claude_oauth_token?: string;     // sk-ant-oat01-...
    claude_api_key?: string;          // sk-ant-...
    codex_id_token?: string;
    codex_access_token?: string;
    codex_refresh_token?: string;
    codex_account_id?: string;
    gemini_api_key?: string;
    openai_api_key?: string;
    deepseek_api_key?: string;
  };

  // Per-Agent Model Assignment
  agentModels: {
    strategy_agent: 'claude-opus' | 'claude-sonnet' | 'gpt-4o';
    research_agent: 'gemini-pro' | 'claude-sonnet' | 'gpt-4o';
    content_agent: 'claude-sonnet' | 'gpt-4o' | 'deepseek';
    code_agent: 'claude-sonnet' | 'codex' | 'deepseek';
    review_agent: 'codex' | 'claude-sonnet' | 'gpt-4o';
  };

  // Cost Optimization
  costOptimization: {
    enabled: boolean;
    useDeepSeekForSimpleTasks: boolean;
    maxCostPerDay?: number;
  };
}
```

### 6.3 Routing Rules
```typescript
interface RoutingRule {
  name: string;
  conditions: {
    agentType?: string;
    taskType?: string;
    complexity?: 'low' | 'medium' | 'high';
    costSensitive?: boolean;
  };
  targetModel: string;
  fallbackModels: string[];
}

// Example rules:
const defaultRules: RoutingRule[] = [
  {
    name: 'Code generation',
    conditions: { taskType: 'code_generation', complexity: 'high' },
    targetModel: 'claude-sonnet',
    fallbackModels: ['codex', 'gpt-4o']
  },
  {
    name: 'Simple content',
    conditions: { taskType: 'content', complexity: 'low', costSensitive: true },
    targetModel: 'deepseek',
    fallbackModels: ['claude-sonnet']
  },
  {
    name: 'Research',
    conditions: { agentType: 'research_agent' },
    targetModel: 'gemini-pro',
    fallbackModels: ['claude-sonnet']
  }
];
```

---

## 7. Containerization Strategy

### 7.1 Multi-Tenant Architecture Options

| Tier | Isolation Level | Description | Use Case |
|------|-----------------|-------------|----------|
| **Free** | Shared Pool | All users share container pool, session isolation via DB | Trial users |
| **Pro** | Semi-Isolated | Dedicated resource limits, priority queue | Small businesses |
| **Enterprise** | Fully Isolated | Dedicated containers per user/org | Large organizations |

### 7.2 Recommended Hybrid Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTAINERIZATION ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Load Balancer (Nginx/Caddy)                                 │   │
│  │  ├── SSL termination                                         │   │
│  │  ├── Request routing                                         │   │
│  │  └── Rate limiting                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│              ┌───────────────┼───────────────┐                      │
│              ▼               ▼               ▼                      │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│  │  API Server      │ │  API Server      │ │  API Server      │   │
│  │  (Replica 1)     │ │  (Replica 2)     │ │  (Replica N)     │   │
│  └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘   │
│           │                    │                    │               │
│           └────────────────────┼────────────────────┘               │
│                                │                                     │
│                                ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Message Queue (BullMQ + Redis)                              │   │
│  │  ├── Agent task queue                                        │   │
│  │  ├── Priority queues (free, pro, enterprise)                 │   │
│  │  └── Job scheduling                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│              ┌─────────────────┼─────────────────┐                  │
│              ▼                 ▼                 ▼                  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│  │  SHARED POOL     │ │  PRO POOL        │ │  ENTERPRISE      │   │
│  │  Agent Workers   │ │  Agent Workers   │ │  Dedicated       │   │
│  │  (Free Tier)     │ │  (Pro Tier)      │ │  Containers      │   │
│  │                  │ │                  │ │                  │   │
│  │  ├── Worker 1    │ │  ├── Worker 1    │ │  ├── Org A       │   │
│  │  ├── Worker 2    │ │  ├── Worker 2    │ │  ├── Org B       │   │
│  │  └── Worker N    │ │  └── Worker N    │ │  └── Org C       │   │
│  │                  │ │                  │ │                  │   │
│  │  Concurrency: 10 │ │  Concurrency: 5  │ │  Concurrency: ∞  │   │
│  │  per user        │ │  per user        │ │  per org         │   │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Data Layer                                                  │   │
│  │  ├── PostgreSQL (Primary - users, sessions, content)        │   │
│  │  ├── Redis (Cache, Queue, Pub/Sub)                          │   │
│  │  └── S3 (File storage, generated content)                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 Agent Worker Container
Based on Remote Coding Agent patterns:
```dockerfile
# Agent Worker Dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY dist/ ./dist/

# Create workspace directory
RUN mkdir -p /workspace && chown -R node:node /workspace

USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/worker.js"]
```

### 7.4 Docker Compose Structure
```yaml
# docker-compose.yml
version: '3.8'

services:
  # API Server
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  # Shared Pool Workers
  worker-shared:
    build: ./worker
    environment:
      - POOL_TYPE=shared
      - MAX_CONCURRENT=10
    depends_on:
      - redis
    deploy:
      replicas: 3

  # Pro Pool Workers
  worker-pro:
    build: ./worker
    environment:
      - POOL_TYPE=pro
      - MAX_CONCURRENT=5
    depends_on:
      - redis
    deploy:
      replicas: 2

  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "3001:3000"

  # Database
  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Cache/Queue
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  # Reverse Proxy
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile

volumes:
  postgres_data:
  redis_data:
```

### 7.5 Session Isolation Strategy
```typescript
// From Remote Coding Agent - Session management
interface SessionManager {
  // Create isolated session for user
  createSession(userId: string, agentType: string): Promise<Session>;

  // Resume existing session (context preservation)
  resumeSession(sessionId: string): Promise<Session>;

  // Isolate workspace per session
  getWorkspacePath(sessionId: string): string;

  // Clean up completed sessions
  cleanupSession(sessionId: string): Promise<void>;
}

// Workspace isolation
const getWorkspacePath = (userId: string, sessionId: string): string => {
  return `/workspace/${userId}/${sessionId}`;
};
```

---

## 8. UI/UX Design

### 8.1 Design Philosophy
- **Dashboard-centric** with conversational overlay
- **Agent activity visualization** (users see AI team working)
- **Approval-first workflow** (strategic decisions require human approval)
- **Module consistency** (all modules share common patterns)

### 8.2 Core UI Components

#### 8.2.1 Main Dashboard
```
┌────────────────────────────────────────────────────────────────────────┐
│  [Logo]  Business Hub                            🔔(3)  [Profile ▼]    │
├────────────────────────────────────────────────────────────────────────┤
│  Project: [Sustainable Gardening Course ▼]                             │
│  ════════════════════════════════════════════════════                  │
│  Discovery → Validation → Planning → Building → Launch → Operating     │
│  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●───────────]                    │
├─────────────────┬──────────────────────────────────────────────────────┤
│                 │                                                       │
│  📊 Dashboard   │  KEY METRICS                                         │
│  ✅ Approvals(5)│  [Revenue] [Audience] [Engagement] [Content]         │
│  📅 Content     │                                                       │
│  📈 Analytics   │  ─────────────────────────────────────────────────── │
│  💡 Intelligence│                                                       │
│  🎯 Marketing   │  NEEDS YOUR ATTENTION                                │
│  👥 Audience    │  [Approval cards with AI recommendations]            │
│  🤖 AI Team     │                                                       │
│  ⚙️  Settings   │  ─────────────────────────────────────────────────── │
│                 │                                                       │
│  ──────────────│  AI TEAM ACTIVITY                                     │
│                 │  [Live agent activity feed]                           │
│  🟢 Mary       │  Mary: Analyzing market trends...                     │
│  🟢 Winston    │  Winston: Designing schema...                         │
│  ⏸️ Amelia     │  ⏸️ Paused: Awaiting approval                         │
│  🔵 John       │                                                       │
│                 │                                                       │
└─────────────────┴──────────────────────────────────────────────────────┘
│ 💬 Chat with AI Team                                                   │
│ [Type a message or @mention a specific agent...]                       │
└────────────────────────────────────────────────────────────────────────┘
```

#### 8.2.2 Approval Center
```
┌────────────────────────────────────────────────────────────────────────┐
│  Approval Center                              [Filter ▼] [Sort ▼]      │
├────────────────────────────────────────────────────────────────────────┤
│  5 items need your approval          [Batch Actions: ✓ All | ✗ All]   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 📝 Blog Post: "10 Vertical Gardening Tips"                        │ │
│  │ Status: AI Draft Complete | Confidence: High (9.2/10) ⭐           │ │
│  │ Scheduled: Monday Nov 18, 9:00 AM                                  │ │
│  │                                                                    │ │
│  │ [Preview Content ▼]                                                │ │
│  │ AI Recommendation: ✅ Approve - "Aligns with brand voice..."       │ │
│  │                                                                    │ │
│  │ [✓ Approve] [✏ Edit] [✗ Reject] [⏰ Reschedule]                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 🎯 Campaign: "Spring Launch Promo"                                │ │
│  │ Channel: Instagram | Budget: $500 | Duration: 2 weeks             │ │
│  │ Projected ROI: 3.2x                                               │ │
│  │                                                                    │ │
│  │ [View Details] [✓ Approve] [✏ Modify] [💬 Ask AI]                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### 8.2.3 AI Team Panel (Taskosaur-inspired)
```
┌────────────────────────────────────────────────────────────────────────┐
│  AI Team                                        [Expand] [Settings]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 📊 Mary (Business Analyst)                            🟢 Active  │ │
│  │ Currently: Analyzing competitor pricing strategies                │ │
│  │ Model: Claude Sonnet | Tokens: 2,450                              │ │
│  │ [View Details] [Pause] [@Mary ask about...]                       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 🏗️ Winston (Architect)                               🟢 Active  │ │
│  │ Currently: Designing course module structure                      │ │
│  │ Model: Claude Sonnet | Tokens: 1,200                              │ │
│  │ [View Details] [Pause] [@Winston ask about...]                    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 💻 Amelia (Developer)                                ⏸️ Paused   │ │
│  │ Waiting: Approval required for database schema                    │ │
│  │ [View Request] [Approve] [Reject]                                 │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

#### 8.2.4 Settings - Model Configuration
```
┌────────────────────────────────────────────────────────────────────────┐
│  Settings > AI Model Configuration                                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  API CREDENTIALS                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Claude (Anthropic)                                   ✅ Connected │ │
│  │ ├── OAuth Token: sk-ant-oat01-●●●●●●●●        [Update] [Test]    │ │
│  │ └── Using: Claude Pro subscription                                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Codex                                                ✅ Connected │ │
│  │ └── Token: ●●●●●●●●                          [Update] [Test]     │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Gemini (Google)                                      ⚪ Not Set   │ │
│  │ └── API Key: [Enter API key...]              [Save] [Test]       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────── │
│                                                                         │
│  AGENT MODEL ASSIGNMENTS                                                │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Agent              │ Primary Model    │ Fallback      │ Status   │ │
│  │ ─────────────────────────────────────────────────────────────── │ │
│  │ Code Agent         │ [Claude Sonnet ▼]│ [Codex ▼]     │ ✅       │ │
│  │ Review Agent       │ [Codex ▼]        │ [Claude ▼]    │ ✅       │ │
│  │ Research Agent     │ [Gemini Pro ▼]   │ [Claude ▼]    │ ⚠️ No key│ │
│  │ Content Agent      │ [Claude Sonnet ▼]│ [GPT-4o ▼]    │ ✅       │ │
│  │ Strategy Agent     │ [Claude Opus ▼]  │ [Sonnet ▼]    │ ✅       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────── │
│                                                                         │
│  COST OPTIMIZATION                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ [✓] Enable cost optimization                                      │ │
│  │ [✓] Use DeepSeek for simple tasks (saves ~60%)                   │ │
│  │ [ ] Set daily cost limit: [$___] (optional)                       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│                                              [Save Changes] [Reset]    │
└────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Real-time Features
- WebSocket connections for live agent activity
- Streaming responses (like Taskosaur)
- Push notifications for approvals
- Collaborative presence (see other team members)

---

## 9. Technical Stack

### 9.1 Confirmed Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14+, React, TypeScript, Tailwind CSS | Modern, performant, great DX |
| Backend | NestJS or Express.js, TypeScript | Mature, modular, TypeScript native |
| Database | PostgreSQL 16+ | Robust, JSON support, proven |
| ORM | Prisma | Type-safe, migrations, great DX |
| Cache | Redis 7+ | Fast, pub/sub, queues |
| Queue | BullMQ | Redis-based, reliable, UI dashboard |
| Storage | S3-compatible | Scalable file storage |
| Real-time | Socket.io | WebSocket + fallbacks |
| AI Orchestration | Agno Framework | Best multi-agent support |
| Containerization | Docker, Docker Compose | Standard, portable |
| Reverse Proxy | Caddy | Auto HTTPS, simple config |
| Monitoring | Prometheus + Grafana | Industry standard |
| Error Tracking | Sentry | Detailed error reporting |

### 9.2 AI Integration Stack

| Component | Technology |
|-----------|------------|
| Multi-agent | Agno Framework (Python) |
| Claude SDK | @anthropic-ai/claude-agent-sdk |
| Model Router | Custom (inspired by CCR-Custom) |
| Tools/MCP | MCP protocol for extensibility |

---

## 10. Implementation Phases

### Phase 0: Foundation ✅ COMPLETE
- [x] Research frameworks (Agno, CCR, Taskosaur)
- [x] Document master plan
- [x] Set up monorepo structure (Turborepo + pnpm)
- [x] Create base Docker configuration
- [x] Set up CI/CD pipeline (GitHub Actions)

### Phase 1: Core Infrastructure ✅ COMPLETE (EPIC-00 to EPIC-07)
- [x] User authentication (better-auth with multi-provider OAuth)
- [x] API key management (encrypted storage with AES-256-GCM)
- [x] Model router service (BYOAI configuration)
- [x] Agent worker pool (Agno teams)
- [x] WebSocket infrastructure (Socket.io gateway)
- [x] Basic dashboard shell (responsive three-panel layout)

### Phase 2: Business Onboarding ✅ COMPLETE (EPIC-08)
- [x] Business portfolio management
- [x] 4-step onboarding wizard
- [x] Validation Team (BMV) with Vera's agents
- [x] Planning Team (BMP) with Blake's agents
- [x] Branding Team (BM-Brand) with Bella's agents
- [x] Module handoff workflows

### Phase 3: Platform Hardening ✅ COMPLETE (EPIC-09 to EPIC-14)
- [x] Multi-provider OAuth (Google, Microsoft, GitHub)
- [x] 2FA/TOTP authentication
- [x] Magic link passwordless
- [x] Rate limiting and security hardening
- [x] Agent API integration
- [x] Testing and observability (Prometheus metrics)

### Phase 4: Premium Polish ✅ COMPLETE (EPIC-15 to EPIC-16)
- [x] Responsive design (mobile, tablet, desktop)
- [x] WebSocket real-time updates
- [x] Skeleton loading and optimistic updates
- [x] Micro-animations and celebration moments
- [x] Keyboard shortcuts system
- [x] Tech debt fixes

### Phase 5: Module Development (NEXT)
- [ ] CRM Module (BM-CRM)
- [ ] Core-PM (PM + Knowledge Base)
- [ ] Content Creation (BMC)
- [ ] Marketing (BMX)
- [ ] Social Media (BM-Social)

### Phase 6: Scale & Enterprise (FUTURE)
- [ ] Enterprise features (SAML/SSO, SCIM)
- [ ] Advanced analytics
- [ ] White-labeling

---

## 11. Reference Implementations

### 11.1 Remote Coding Agent
**Location:** `./Remote coding agent/`
**Key Patterns:**
- Claude OAuth token authentication
- Codex SDK integration
- Docker containerization
- Session persistence (PostgreSQL)
- IPlatformAdapter interface
- IAssistantClient interface
- Streaming and batch modes

### 11.2 CCR-Custom
**Repository:** https://github.com/VisionCraft3r/ccr-custom
**Key Patterns:**
- Multi-model routing
- Request transformers
- Per-agent model assignment
- BMAD agent detection
- Custom routing logic

### 11.3 Taskosaur
**Repository:** https://github.com/Taskosaur/Taskosaur
**Key Patterns:**
- Conversational AI task execution
- BYOAI model support
- Real-time WebSocket updates
- NestJS + Next.js architecture

### 11.4 Agno Framework
**Documentation:** https://docs.agno.com/
**Key Patterns:**
- Multi-agent teams
- Workflow orchestration
- Human-in-the-loop
- Memory management
- Tool integration

---

## Appendix A: Database Schema (Draft)

```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Encrypted API Keys
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL, -- 'claude', 'codex', 'gemini', etc.
  encrypted_key TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  last_validated TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Model Configuration
CREATE TABLE user_model_config (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  agent_type VARCHAR(50) NOT NULL,
  primary_model VARCHAR(100) NOT NULL,
  fallback_model VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  stage VARCHAR(50) DEFAULT 'discovery',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agent Sessions
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  agent_type VARCHAR(50) NOT NULL,
  assistant_session_id VARCHAR(255), -- SDK session ID
  active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Approvals Queue
CREATE TABLE approvals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  type VARCHAR(50) NOT NULL, -- 'content', 'campaign', 'plan', etc.
  status VARCHAR(50) DEFAULT 'pending',
  content JSONB NOT NULL,
  ai_recommendation JSONB,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Content Items
CREATE TABLE content_items (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  content TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  scheduled_for TIMESTAMP,
  published_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Appendix B: API Endpoints (Draft)

```
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

# User Settings
GET    /api/settings
PUT    /api/settings
PUT    /api/settings/api-keys/:provider
DELETE /api/settings/api-keys/:provider
GET    /api/settings/model-config
PUT    /api/settings/model-config

# Projects
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

# Approvals
GET    /api/approvals
GET    /api/approvals/:id
POST   /api/approvals/:id/approve
POST   /api/approvals/:id/reject
POST   /api/approvals/:id/edit

# Agent Interaction
POST   /api/agent/message
GET    /api/agent/sessions
POST   /api/agent/sessions/:id/resume

# WebSocket Events
ws://  /socket
  - agent.activity
  - approval.created
  - content.updated
  - project.progress
```

---

**Document Status:** Living document - update as decisions are made
**Last Updated:** 2025-12-13
**Foundation Status:** Complete (17 Epics, 190 Stories, 541 Points)
**Next Milestone:** First operational module (BM-CRM)
