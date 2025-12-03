# HYVVE - AI Business Hub

> **Transform your business with 90% automation, requiring only ~5 hours/week of human involvement.**

HYVVE is an AI-powered business orchestration platform that combines multi-agent AI teams with human-in-the-loop approval gates. Think of it as your AI workforce - a team of specialized agents handling market research, content creation, marketing, sales, and operations while you focus on strategic decisions.

---

## The Vision

Most business software requires constant human attention. HYVVE flips this model:

- **AI agents handle routine operations autonomously**
- **Humans approve only strategic decisions**
- **Confidence-based routing** means high-confidence actions auto-execute
- **One SMB owner can operate with the efficiency of a much larger team**

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE 90/5 PROMISE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Traditional Business Software:                                  │
│  [Human] ──────────────────────────────────────► [Output]       │
│           100% manual effort                                     │
│                                                                  │
│  HYVVE:                                                          │
│  [Human] ─► [Approval] ─► [AI Team] ─────────► [Output]         │
│           5 hrs/week      90% automated                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

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

### Confidence-Based Approval System
```
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

---

## Platform Architecture

```
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
| Project Management | BM-PM | Plane-inspired boards |

---

## Two Operational Phases

### BUILD Phase (Sequential)
For new projects and products:

```
Discovery → Validation → Planning → Building → Launch
    │           │            │          │         │
    ▼           ▼            ▼          ▼         ▼
  Submit    Market       Business   Product    Launch
   idea    research     planning   creation   assets
```

### OPERATE Phase (Continuous)
For ongoing operations:

```
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
│   ├── api/                 # NestJS backend
│   └── agents/              # Python AgentOS
│
├── packages/
│   ├── db/                  # Prisma schema + migrations
│   ├── ui/                  # Shared React components
│   ├── shared/              # Shared TypeScript types
│   └── config/              # Shared configuration
│
├── docs/
│   ├── prd.md               # Product Requirements
│   ├── architecture.md      # Technical Architecture
│   ├── ux-design.md         # UX Design Document
│   ├── epics/               # Epic breakdown
│   │   ├── EPIC-INDEX.md    # Epic overview
│   │   └── EPIC-00-07/      # Individual epics
│   ├── sprint-artifacts/    # Sprint planning
│   │   ├── sprint-status.yaml
│   │   └── tech-spec-*.md
│   └── research/            # Research documents
│
├── docker/
│   └── docker-compose.yml   # Local development
│
├── turbo.json               # Turborepo config
└── pnpm-workspace.yaml      # Workspace config
```

---

## Current Development Status

### Phase: Foundation Build (EPIC-00 - EPIC-08)

| Epic | Name | Stories | Status |
|------|------|---------|--------|
| EPIC-00 | Project Scaffolding & Core Setup | 7/7 | ✅ Complete |
| EPIC-01 | Authentication System | 8/8 | ✅ Complete |
| EPIC-02 | Workspace Management | 7/8 | ✅ Complete (1 deferred) |
| EPIC-03 | RBAC & Multi-Tenancy | 7/7 | ✅ Complete |
| EPIC-04 | Approval Queue System | 12/12 | ✅ Complete |
| EPIC-05 | Event Bus Infrastructure | 0/7 | 🔄 Ready for Dev |
| EPIC-06 | BYOAI Configuration | 0/11 | ⏳ Backlog |
| EPIC-07 | UI Shell & Navigation | 0/10 | ⏳ Backlog |
| EPIC-08 | Business Onboarding & Foundation Modules | 0/23 | ⏳ Backlog |

**Progress: 41/83 stories completed (49%)**

### Completed Features (EPIC-00 through EPIC-04)

#### Project Foundation (EPIC-00)
- Turborepo monorepo with pnpm workspaces
- Next.js 15 frontend with App Router
- NestJS 10 backend with modular architecture
- Prisma ORM with PostgreSQL
- Docker Compose development environment
- Shared TypeScript types package
- AgentOS Python runtime (FastAPI + Agno)

#### Authentication System (EPIC-01)
- Better-Auth integration with email/password
- Google OAuth social login
- Email verification flow
- Password reset functionality
- Session management with secure cookies
- Auth UI components (SignIn, SignUp, ForgotPassword)

#### Workspace Management (EPIC-02)
- Workspace CRUD operations
- Member invitation system with email notifications
- Workspace switching and context
- Member role management (Owner, Admin, Member)
- Workspace settings and deletion

#### RBAC & Multi-Tenancy (EPIC-03)
- Hierarchical permission matrix
- NestJS auth guards with role checks
- Next.js middleware for route protection
- Prisma tenant extension for automatic filtering
- PostgreSQL Row-Level Security (RLS) policies
- Module-level permission overrides
- Audit logging for permission changes

#### Approval Queue System (EPIC-04)
- Confidence calculator service (auto/quick/full review routing)
- Approval queue API with filtering and pagination
- Approval router with confidence-based routing
- Approval queue dashboard UI
- Approval card components with AI reasoning display
- Bulk approval functionality
- Escalation and reassignment
- Complete audit trail
- AgentOS integration with NestJS bridge
- Control plane connection for agent runs

### CI/CD Pipeline
- GitHub Actions workflow for CI
- TypeScript type checking
- ESLint with strict rules
- Prisma client generation
- Husky pre-commit hooks (type-check, lint, Semgrep security scan)
- Multi-AI code review pipeline (CodeAnt, Gemini, CodeRabbit, Claude)

### Completed Research
- [x] Taskosaur analysis (conversational UI patterns)
- [x] Twenty CRM analysis (record architecture)
- [x] Plane analysis (project management)
- [x] Agno Framework analysis (multi-agent orchestration)
- [x] Multi-tenant isolation strategies
- [x] RBAC specification patterns
- [x] Authentication system patterns
- [x] AgentOS integration analysis

---

## Getting Started

> **Note:** The platform is in active development. EPIC-05 (Event Bus Infrastructure) is the current milestone. Foundation epics (00-04) are complete with 41 stories implemented.

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
| [Epic Index](docs/epics/EPIC-INDEX.md) | Development roadmap |
| [Master Plan](docs/MASTER-PLAN.md) | Vision and strategy |
| [Module Research](docs/MODULE-RESEARCH.md) | Module specifications |
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

Contributions are welcome! Please read the development documentation before submitting PRs.

### Development Workflow
1. Check sprint status in `docs/sprint-artifacts/sprint-status.yaml`
2. Pick a story from the current epic
3. Run story context to gather requirements
4. Implement following architecture patterns
5. Submit PR with tests

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
  <em>90% Automation. 5 Hours/Week. Infinite Possibilities.</em>
</p>
