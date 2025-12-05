# Changelog

All notable changes to HYVVE are documented in this file.

This changelog is organized by Epic, following the BMAD Method development process.

---

## EPIC-09: UI & Authentication Enhancements (15 stories)

**Status:** Complete

### Authentication Enhancements

- Microsoft OAuth integration
- GitHub OAuth integration
- Two-Factor Authentication (2FA) setup and login flows
- 2FA management interface
- Magic link authentication
- Account linking for multiple providers
- OTP code verification

### Team Members UI Enhancements

- Team members stats cards with role distribution
- Search and filter functionality for members
- Invite member modal with role selection
- Pending invitations section
- Last active and status indicators in members table

### Advanced RBAC

- Custom role creation interface
- Permission templates for quick role setup

---

## EPIC-08: Business Onboarding & Foundation Modules (23 stories)

**Status:** Complete

### Foundation Infrastructure

- Business onboarding database models
- Portfolio dashboard with business cards
- Multi-step onboarding wizard UI
- Document upload and extraction pipeline

### Validation Team - BMV Module

- Validation team Agno configuration
- Validation chat interface
- Idea intake workflow
- Market sizing workflow (TAM/SAM/SOM)
- Competitor mapping workflow
- Customer discovery workflow
- Validation synthesis workflow

### Planning Team - BMP Module

- Planning team Agno configuration
- Planning page with workflow progress
- Business Model Canvas workflow
- Financial projections workflow
- Business plan synthesis workflow

### Branding Team - BM-Brand Module

- Branding team Agno configuration
- Branding page with visual identity preview
- Brand strategy and voice workflows
- Visual identity workflow
- Asset generation workflow

### Integration & Handoff

- Module handoff workflows
- Onboarding completion and handoff to BM-PM

---

## EPIC-07: UI Shell & Navigation (10 stories)

**Status:** Complete

### Dashboard Layout

- Responsive dashboard layout component
- Collapsible sidebar navigation
- Header bar with user menu

### Interactive Features

- Chat panel for AI interaction
- Dark/light mode theme switching
- Command palette (Cmd+K)
- Notification center with real-time updates
- Keyboard shortcuts system

### Dashboard Pages

- Dashboard home page with activity feed
- Mobile-responsive navigation

---

## EPIC-06: BYOAI Configuration (11 stories)

**Status:** Complete

### Multi-Provider AI Support

- Claude, OpenAI, Gemini, DeepSeek, OpenRouter integration
- Encrypted API key storage (AES-256-GCM)
- Provider validation and health monitoring

### Token Usage Tracking

- Per-provider daily token consumption
- Per-agent usage breakdown
- Token cost estimation by model

### Daily Token Limits

- Configurable limits per provider
- Usage alerts at 80%/90%/100% thresholds
- Automatic reset at midnight

### Provider Health Monitoring

- Latency tracking and status indicators
- 5-minute auto-refresh with exponential backoff
- Failure detection and alerting

### Agent Model Preferences

- Per-agent AI model configuration
- Override default models for any agent team
- Cost visibility for model selection

### IAssistantClient Interface

- Unified abstraction for AI communication
- Support for streaming and non-streaming responses
- Tool call handling with structured outputs
- Factory pattern for provider-specific clients

### Settings UI

- Provider configuration at `/settings/ai-config`
- Token usage dashboard with charts
- Agent preferences management

---

## EPIC-05: Event Bus Infrastructure (7 stories)

**Status:** Complete

### Redis Streams Infrastructure

- Redis Streams setup with consumer groups
- Event publisher service with correlation tracking
- Event subscriber with decorator-based handlers

### Reliability Features

- Retry mechanism with exponential backoff
- Dead letter queue (DLQ) for failed events
- Event replay service for historical reprocessing

### Event System

- Core platform event type definitions
- Admin monitoring dashboard at `/admin/events`

---

## EPIC-04: Approval Queue System (12 stories)

**Status:** Complete

### Core Approval System

- Confidence calculator service (auto/quick/full review routing)
- Approval queue API with filtering and pagination
- Approval router with confidence-based routing

### Dashboard UI

- Approval queue dashboard
- Approval card components with AI reasoning display
- Bulk approval functionality

### Workflow Features

- Escalation and reassignment
- Complete audit trail

### AgentOS Integration

- AgentOS integration with NestJS bridge
- Control plane connection for agent runs

---

## EPIC-03: RBAC & Multi-Tenancy (7 stories)

**Status:** Complete

### Permission System

- Hierarchical permission matrix
- NestJS auth guards with role checks
- Next.js middleware for route protection
- Module-level permission overrides

### Multi-Tenancy

- Prisma tenant extension for automatic filtering
- PostgreSQL Row-Level Security (RLS) policies

### Audit

- Audit logging for permission changes

---

## EPIC-02: Workspace Management (7/8 stories)

**Status:** Complete (1 deferred)

### Workspace Operations

- Workspace CRUD operations
- Workspace switching and context
- Workspace settings and deletion

### Member Management

- Member invitation system with email notifications
- Invitation acceptance flow
- Member role management (Owner, Admin, Member)

### Deferred

- Ownership transfer (tech debt - deferred from retrospective)

---

## EPIC-01: Authentication System (8 stories)

**Status:** Complete

### Core Authentication

- Better-Auth integration with email/password
- Email verification flow
- Password reset functionality
- Session management with secure cookies

### Social Login

- Google OAuth social login

### UI Components

- Auth UI components (SignIn, SignUp, ForgotPassword)

---

## EPIC-00: Project Scaffolding & Core Setup (7 stories)

**Status:** Complete

### Monorepo Setup

- Turborepo monorepo with pnpm workspaces
- Shared TypeScript types package

### Frontend

- Next.js 15 frontend with App Router

### Backend

- NestJS 10 backend with modular architecture
- Prisma ORM with PostgreSQL

### Infrastructure

- Docker Compose development environment
- AgentOS Python runtime (FastAPI + Agno)

---

## CI/CD Pipeline

### GitHub Actions

- Workflow for CI (TypeScript check, lint, build)
- Multi-AI code review pipeline (CodeAnt, Gemini, CodeRabbit, Claude)

### Pre-commit Hooks

- TypeScript type checking
- ESLint with strict rules
- Prisma client generation
- Semgrep security scan

---

## Research & Analysis

The following research informed the architecture:

- Taskosaur analysis (conversational UI patterns)
- Twenty CRM analysis (record architecture)
- Plane analysis (project management)
- Agno Framework analysis (multi-agent orchestration)
- Multi-tenant isolation strategies
- RBAC specification patterns
- Authentication system patterns
- AgentOS integration analysis
