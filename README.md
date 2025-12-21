# HYVVE - AI Business Hub

[![Build Status](https://github.com/CSmithy89/ai-business-hub/actions/workflows/test.yml/badge.svg)](https://github.com/CSmithy89/ai-business-hub/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Transform your business with AI-driven automation and human-in-the-loop approvals.**

HYVVE is an AI-powered business orchestration platform that combines multi-agent AI teams with human-in-the-loop approval gates. Think of it as your AI workforce - a team of specialized agents handling market research, content creation, marketing, sales, and operations while you focus on strategic decisions.

---

## The Vision

Most business software requires constant human attention. HYVVE flips this model:

- **AI agents handle routine operations autonomously**
- **Humans approve only strategic decisions**
- **Confidence-based routing** means high-confidence actions auto-execute
- **One SMB owner can operate with the efficiency of a much larger team**

<!-- Diagram: Comparison of traditional software (100% manual) vs HYVVE (human oversight + AI automation) -->

```text
┌─────────────────────────────────────────────────────────────────┐
│               HUMAN-IN-THE-LOOP AUTOMATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Traditional Business Software:                                  │
│  [Human] ──────────────────────────────────────► [Output]       │
│           100% manual effort                                     │
│                                                                  │
│  HYVVE:                                                          │
│  [Human] ─► [Approval] ─► [AI Team] ─────────► [Output]         │
│           human oversight  high automation                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Preview

<!-- TODO: Add dashboard screenshots when UI is ready for demonstration -->

| Dashboard | Approval Queue | AI Chat |
|-----------|----------------|---------|
| *Coming soon* | *Coming soon* | *Coming soon* |

> **Note:** Screenshots will be added once the UI is deployed to a demo environment.

---

## Key Features

### BYOAI - Bring Your Own AI
Use your existing AI subscriptions. No vendor lock-in.
- **Claude** (API or OAuth token)
- **OpenAI** (GPT-4, GPT-4o)
- **Gemini** (Google AI)
- **DeepSeek** (cost-optimized)
- **OpenRouter** (100+ models via single API)
- **Local Models** (Ollama)

### MCP Integrations (Model Context Protocol)
Connect MCP servers to safely expand what agents can read, write, and execute.

- Workspace-managed MCP servers (Settings → MCP Integrations)
- Permission controls (READ / WRITE / EXECUTE)
- Tool allow/deny lists to reduce blast radius

### AgentOS Protocols (A2A + AG-UI)
Agents run in AgentOS (FastAPI + Agno) with protocol support for discovery and streaming:

- A2A discovery + JSON-RPC invocation
- AG-UI event streaming over SSE for real-time agent output

### Workspace Knowledge (RAG)
Workspace-scoped knowledge retrieval to support retrieval-augmented agents:

- Postgres + pgvector storage per workspace
- Tenant isolation through table-per-workspace strategy
- Knowledge Base collaboration (Yjs + Hocuspocus) with cursor presence
- Offline-first editing (IndexedDB) with automatic merge on reconnect
- Background embedding pipeline + semantic search + RAG query API

### Confidence-Based Approval System

<!-- Diagram: Confidence threshold routing - high auto-executes, medium needs quick approval, low needs full review -->

```text
High Confidence (>85%)     → Auto-execute with audit log
Medium Confidence (60-85%) → 1-click quick approval
Low Confidence (<60%)      → Full human review required
```

### Multi-Agent AI Teams
Specialized agents work together like a real team:
- **Strategy Agent** - Business planning, decision support
- **Research Agent** - Market analysis, competitor intelligence
- **Content Agent** - Blog posts, social media, marketing copy
- **Marketing Agent** - Campaign design, email automation
- **Sales Agent** - Lead scoring, outreach, deal management
- **Analytics Agent** - Insights, reporting, optimization

### Modular Architecture
Each module works standalone or integrates with others:
- Buy what you need
- All modules share data seamlessly
- Event-driven communication
- **Project Management (bm-pm):** Projects + phases, BMAD templates, team management, and budget tracking

---

## Platform Architecture

<!-- Diagram: Four-layer architecture - Presentation (Next.js), API (NestJS), Orchestration (AgentOS/Python), Data (PostgreSQL/Redis) -->

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     HYVVE PLATFORM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PRESENTATION LAYER                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Next.js 15 Dashboard                                        │   │
│  │  ├── Conversational AI Interface                             │   │
│  │  ├── Agent Activity Visualization                            │   │
│  │  ├── Approval Center                                         │   │
│  │  └── Real-time WebSocket Updates                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  API LAYER                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  NestJS 10 API Server                                        │   │
│  │  ├── REST + WebSocket Endpoints                              │   │
│  │  ├── JWT + OAuth Authentication                              │   │
│  │  └── Multi-tenant Row-Level Security                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  ORCHESTRATION LAYER                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  AgentOS (Python/FastAPI)                                    │   │
│  │  ├── Agno Framework Integration                              │   │
│  │  ├── Multi-Agent Coordination                                │   │
│  │  ├── Human-in-the-Loop Approvals                             │   │
│  │  └── Model Router (BYOAI)                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  DATA LAYER                                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 16 + Redis 7 + S3                                │   │
│  │  ├── Event Bus (Redis Streams)                               │   │
│  │  ├── Multi-tenant Isolation                                  │   │
│  │  └── Encrypted API Key Storage                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Module System

### Foundation Layer (BUILD Phase)

| Module | Code | Purpose |
|--------|------|---------|
| Market Validation | BMV | TAM/SAM/SOM analysis, competitor research, feasibility studies |
| Business Planning | BMP | Business model canvas, financial projections, strategic planning |
| Branding | BMB | Brand identity, guidelines, voice development |
| Intelligence | BMI | Trend scanning, competitor monitoring, market signals |

### Product Creation Layer (BME-*)

| Module | Code | Purpose |
|--------|------|---------|
| Course Creator | BME-Course | Online course curriculum & content generation |
| Podcast | BME-Podcast | Podcast planning, scripts, show notes |
| Book | BME-Book | Book outlining & chapter writing assistance |
| YouTube | BME-YouTube | Channel strategy, video scripts, thumbnails |
| Digital Products | BME-Digital | Templates, workbooks, digital tools |
| SaaS/Website | BME-App | Software specification, website generation |

### Operations Layer (OPERATE Phase)

| Module | Code | Inspired By |
|--------|------|-------------|
| Content | BMC | AI content pipeline |
| Email/Marketing | BMX | Mautic-style automation |
| Social Media | BM-Social | Postiz patterns |
| Customer Support | BM-Support | Chatwoot-style inbox |
| Analytics | BMT | Matomo-style tracking |
| CRM | BM-CRM | Twenty CRM architecture |
| Sales | BMS | Pipeline automation |
| Core-PM (PM + KB) | Core-PM | Platform core: projects, tasks, knowledge base |

---

## Two Operational Phases

### BUILD Phase (Sequential)
For new projects and products:

<!-- Diagram: Sequential workflow from idea submission through market research, planning, product creation, to launch -->

```text
Discovery → Validation → Planning → Building → Launch
    │           │            │          │         │
    ▼           ▼            ▼          ▼         ▼
  Submit    Market       Business   Product    Launch
   idea    research     planning   creation   assets
```

### OPERATE Phase (Continuous)
For ongoing operations:

<!-- Diagram: Four continuous operational loops - Intelligence (hourly), Content (daily), Marketing (weekly), Analytics (real-time) -->

```text
┌─────────────────────────────────────────────────────────────┐
│  Intelligence Loop (hourly)    │  Trend scanning            │
│  Content Loop (daily)          │  Automated creation        │
│  Marketing Loop (weekly)       │  Campaign execution        │
│  Analytics Loop (real-time)    │  Metrics & optimization    │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js + React + TypeScript | 15.x |
| Styling | Tailwind CSS + shadcn/ui | 4.x |
| Backend | NestJS + TypeScript | 10.x |
| Agent System | Python + FastAPI + Agno | 3.12+ |
| Database | PostgreSQL | 16+ |
| ORM | Prisma | 6.x |
| Cache/Queue | Redis + BullMQ | 7+ |
| Real-time | Socket.io | 4.x |
| Containerization | Docker + Docker Compose | Latest |
| Monorepo | Turborepo + pnpm | Latest |

---

## Project Structure

```
/
├── apps/
│   ├── web/                 # Next.js 15 frontend
│   └── api/                 # NestJS backend
├── agents/                  # Python AgentOS (FastAPI + Agno)
├── packages/
│   ├── db/                  # Prisma schema + migrations
│   ├── ui/                  # Shared React components
│   └── shared/              # Shared TypeScript types
├── docs/
│   ├── prd.md               # Product Requirements
│   ├── architecture.md      # Technical Architecture
│   ├── ux-design.md         # UX Design Document
│   ├── modules/             # Module specifications (Core-PM, BM-CRM, etc.)
│   ├── archive/             # Foundation epics + sprint artifacts
│   └── research/            # Research documents
├── docker/
│   └── docker-compose.yml   # Local development
├── turbo.json               # Turborepo config
└── pnpm-workspace.yaml      # Workspace config
```

---

## Current Development Status

### Foundation Complete - All Epics Delivered

| Epic | Name | Stories | Status |
|------|------|---------|--------|
| EPIC-00 | Project Scaffolding & Core Setup | 7/7 | ✅ Complete |
| EPIC-01 | Authentication System | 8/8 | ✅ Complete |
| EPIC-02 | Workspace Management | 7/8 | ✅ Complete (1 deferred) |
| EPIC-03 | RBAC & Multi-Tenancy | 7/7 | ✅ Complete |
| EPIC-04 | Approval Queue System | 12/12 | ✅ Complete |
| EPIC-05 | Event Bus Infrastructure | 7/7 | ✅ Complete |
| EPIC-06 | BYOAI Configuration | 11/11 | ✅ Complete |
| EPIC-07 | UI Shell & Navigation | 10/10 | ✅ Complete |
| EPIC-08 | Business Onboarding & Foundation Modules | 23/23 | ✅ Complete |
| EPIC-09 | UI & Authentication Enhancements | 15/15 | ✅ Complete |
| EPIC-10 | Platform Hardening | 8/8 | ✅ Complete |
| EPIC-11 | Agent Integration | 5/5 | ✅ Complete |
| EPIC-12 | UX Polish | 8/8 | ✅ Complete |
| EPIC-13 | AI Agent Management | 6/6 | ✅ Complete |
| EPIC-14 | Testing & Observability | 19/19 | ✅ Complete |
| EPIC-15 | UI/UX Platform Foundation | 27/27 | ✅ Complete |
| EPIC-16 | Premium Polish & Advanced Features | 28/28 | ✅ Complete |

**Progress: 190/190 stories completed (100%) | 541 Story Points | Foundation Complete**

### Core-PM (Projects + Knowledge Base)

- Sprint tracking: `docs/modules/bm-pm/sprint-status.yaml`
- PM-01 through PM-08 ✅ Complete (projects, tasks, AI agents, real-time, integrations, analytics)
- PM-07: Integrations & Bridge Agent ✅ Complete (CSV import/export, GitHub issues/PR linking, Jira/Asana/Trello imports, bridge agent foundation)
- PM-08: Prism Agent & Predictive Analytics ✅ Complete (Monte Carlo forecasting, risk detection, analytics dashboard, what-if scenarios, team metrics, CSV/PDF export)
- PM-09: Advanced Views ✅ Complete (timeline/Gantt, portfolio dashboard, dependencies, view builder, sharing, templates)
- KB-01: Knowledge Base Foundation ✅ Complete
- KB-02: KB Real-Time & RAG ✅ Complete (collab editing + embeddings + semantic search + RAG)
- KB-03: KB Verification & Scribe ✅ Complete (verified content + review workflows)
- KB-04: AI-Native Knowledge Base ✅ Complete (AI drafts + summarization + Q&A + gap detection + templates)

### Latest Epic: Premium Polish & Advanced Features (EPIC-16)

**Responsive Design** - Full mobile, tablet, and desktop support:
- Mobile layout (<768px) with bottom navigation
- Tablet layout (768-1024px) with drawer sidebar
- Desktop layout (>1280px) with three-panel view
- Touch-friendly interactions (44x44px tap targets)

**Real-Time & WebSocket** - Live updates across the platform:
- WebSocket gateway for approvals, agents, notifications, and PM tasks
- Real-time Kanban with task movement animations and conflict detection
- User presence indicators with Redis-backed tracking
- In-app notification center with infinite scroll and date grouping
- Optimistic UI updates with rollback on error
- Reconnection handling with exponential backoff

**Premium UI Polish**:
- Skeleton loading screens for all data-fetching components
- Micro-animations (hover lift, button press, page transitions)
- Celebration moments (confetti, badges, checkmarks)
- Comprehensive keyboard shortcuts system
- Character-driven empty states

**Tech Debt Fixes** - From EPIC-15 retrospective:
- Hydration mismatch fixes
- 2FA error handling improvements
- localStorage optimization
- Test coverage for new features

See [CHANGELOG.md](CHANGELOG.md) for detailed feature history by epic.

---

### Core-PM Module (Post-Foundation)

| Epic | Name | Stories | Status |
|------|------|---------|--------|
| EPIC-PM-01 | Project & Phase Management | 9/9 | ✅ Complete |
| EPIC-PM-02 | Task Management System | 11/11 | ✅ Complete |
| EPIC-PM-03 | Views & Navigation | 8/8 | ✅ Complete |
| EPIC-PM-04 | AI Team - Navi, Sage, Chrono | 9/9 | ✅ Complete |
| EPIC-PM-05 | AI Team - Scope, Pulse, Herald | 8/8 | ✅ Complete |
| EPIC-PM-06 | Real-Time & Notifications | 6/6 | ✅ Complete |
| EPIC-PM-07 | Integrations & Bridge Agent | 7/7 | ✅ Complete |
| EPIC-PM-08 | Prism Agent & Analytics | 6/6 | ✅ Complete |
| EPIC-PM-09 | Advanced Views | 6/6 | ✅ Complete |
| EPIC-KB-01 | Knowledge Base Foundation | 10/10 | ✅ Complete |
| EPIC-KB-02 | KB Real-Time & RAG | 8/8 | ✅ Complete |
| EPIC-KB-03 | KB Verification & Scribe | 7/7 | ✅ Complete |
| EPIC-KB-04 | AI-Native Knowledge Base | 6/6 | ✅ Complete |

**Latest Core-PM Epic: Advanced Views (EPIC-PM-09)**
- Timeline/Gantt view with zoom, drag/resize, dependencies, and critical path
- Portfolio dashboard with health metrics, filters, and drill-downs
- Cross-project dependencies dashboard with relation filters
- Custom view builder for columns and sorting
- Shareable saved views with team links
- Reusable view templates per workspace
- Docs: `docs/sprint-artifacts/tech-spec-epic-pm-09.md`, `docs/modules/bm-pm/stories/pm-09-*.md`

**Latest KB Epic: AI-Native Knowledge Base (EPIC-KB-04)**
- AI-generated page drafts from PM tasks with approval routing
- Smart summarization for KB pages
- Q&A chat interface for instant KB answers
- Knowledge extraction from completed tasks
- Gap detection dashboard for missing topics
- Reusable KB templates for faster authoring
- Docs: `docs/modules/bm-pm/epics/epic-kb-04-ai-native-knowledge-base.md`, `docs/modules/bm-pm/stories/kb-04-*.md`

---

## Getting Started

> **Foundation Complete:** All 17 epics with 190 stories (541 points) are implemented. The platform foundation is ready for production deployment and module development.

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- pnpm 9+

### Development Setup

```bash
# Clone the repository
git clone https://github.com/CSmithy89/ai-business-hub.git
cd ai-business-hub

# Use correct Node.js version
nvm use  # Reads from .nvmrc (Node 20)

# Install dependencies
pnpm install

# Run builds (with Turborepo caching)
pnpm build

# Start development servers (when configured)
pnpm dev

# Run linting
pnpm lint

# Type checking
pnpm type-check
```

### Monorepo Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages with Turborepo |
| `pnpm dev` | Start all dev servers |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | TypeScript type checking |
| `pnpm clean` | Clean build artifacts |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [PRD](docs/prd.md) | Product requirements and scope |
| [Architecture](docs/architecture.md) | Technical architecture decisions |
| [UX Design](docs/ux-design.md) | User experience and flows |
| [Epic Index](docs/archive/foundation-phase/epics/EPIC-INDEX.md) | Foundation development roadmap |
| [Master Plan](docs/MASTER-PLAN.md) | Vision and strategy |
| [Module Research](docs/archive/foundation-phase/MODULE-RESEARCH.md) | Module specifications |
| [Next Steps](docs/NEXT-STEPS.md) | Implementation roadmap |

---

## Development Methodology

This project uses the **BMAD Method** (Business Model Agile Development):

1. **Product Brief** → High-level vision
2. **PRD** → Detailed requirements
3. **Architecture** → Technical decisions
4. **UX Design** → User experience
5. **Epics & Stories** → Breakdown
6. **Sprint Planning** → Execution plan
7. **Development** → Implementation

### Workflow Commands

```bash
# Sprint status check
/bmad:bmm:workflows:workflow-status

# Create story context
/bmad:bmm:workflows:story-context

# Execute story
/bmad:bmm:workflows:dev-story
```

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting PRs.

### Quick Start

1. Check sprint status in `docs/archive/foundation-phase/sprint-artifacts/sprint-status.yaml`
2. Pick a story from the current epic
3. Run story context to gather requirements
4. Implement following architecture patterns
5. Submit PR with tests

See the full [Contributing Guide](CONTRIBUTING.md) for detailed guidelines.

---

## License

[MIT License](LICENSE) - See LICENSE file for details.

---

## Contact

For questions or feedback, please open an issue in this repository.

---

<p align="center">
  <strong>HYVVE</strong> - Your AI Business Team
  <br>
  <em>High automation. Human oversight. Infinite possibilities.</em>
</p>
