# Changelog

All notable changes to HYVVE are documented in this file.

This changelog is organized by Epic, following the BMAD Method development process.

**Foundation Complete:** 17 Epics | 190 Stories | 541 Points | 100% Complete

---

## EPIC-PM-08: Prism Agent & Predictive Analytics (6 stories)

**Status:** Complete
**Completed:** 2025-12-21
**Branch:** `feat/PM-08-prism-agent-analytics`
**PR:** #33

### Added

- **Prism Agent Foundation**: Python Agno agent for predictive analytics in `agents/pm/prism.py`
- **Monte Carlo Simulation**: 1000-iteration completion forecasting with Box-Muller transform
- **Percentile Predictions**: P10, P25, P50, P75, P90 completion date bands
- **Risk Detection System**: Automatic schedule, scope, and resource risk identification
- **Risk Persistence**: PmRiskEntry Prisma model with probability/impact scoring
- **Analytics Dashboard**: Velocity, scope, completion, and productivity trends with health score
- **What-If Scenarios**: Interactive scenario planning with scope, team, and velocity adjustments
- **Team Performance Metrics**: Velocity, cycle time, throughput, completion rate, capacity utilization
- **Analytics Export**: CSV downloads and structured PDF data for report generation

### API Endpoints

- `POST /pm/projects/:projectId/analytics/forecast` - Generate completion forecast
- `GET /pm/projects/:projectId/analytics/velocity` - Current velocity with trend
- `GET /pm/projects/:projectId/analytics/velocity-history` - Historical velocity data
- `GET /pm/projects/:projectId/analytics/anomalies` - Detect statistical anomalies
- `GET /pm/projects/:projectId/analytics/completion-probability` - Target date probability
- `GET /pm/projects/:projectId/analytics/risks` - Detect project risks
- `GET /pm/projects/:projectId/analytics/risks/entries` - Get risk entries
- `PATCH /pm/projects/:projectId/analytics/risks/:riskId/status` - Update risk status
- `GET /pm/projects/:projectId/analytics/dashboard` - Dashboard data aggregation
- `POST /pm/projects/:projectId/analytics/scenario-forecast` - What-if analysis
- `GET /pm/projects/:projectId/analytics/team-performance` - Team metrics
- `GET /pm/projects/:projectId/analytics/export/csv` - CSV export
- `GET /pm/projects/:projectId/analytics/export/pdf-data` - PDF data export
- `GET /pm/projects/:projectId/analytics/export/trend-data` - Raw trend data

### Notes

- Tech spec: `docs/sprint-artifacts/tech-spec-epic-pm-08.md`
- Monte Carlo uses Box-Muller transform for normal distribution sampling
- Health score formula: velocity (30%) + completion (30%) + scope (20%) + risk (20%)
- Risk detection covers schedule delays, scope creep, and resource constraints

---

## EPIC-PM-07: Integrations & Bridge Agent (7 stories)

**Status:** Complete
**Completed:** 2025-12-21
**Branch:** `epic/07-integrations-bridge-agent`

### Added

- **CSV Import Wizard**: Mapping + preview flow with import jobs and error tracking
- **CSV Export**: Filter-aware task exports with CSV streaming
- **GitHub Issues Sync**: Connect GitHub, import issues into tasks with external links
- **GitHub PR Linking**: Webhook-driven PR links surfaced on task detail
- **Jira Import**: Basic auth import with optional JQL filtering
- **Asana/Trello Imports**: Task ingestion with provider-specific metadata
- **Bridge Agent Foundation**: AgentOS bridge agent skeleton with output schema

### API Endpoints

- `POST /pm/imports/csv/start`
- `POST /pm/imports/jira/start`
- `POST /pm/imports/asana/start`
- `POST /pm/imports/trello/start`
- `GET /pm/imports/:id/status`
- `GET /pm/imports/:id/errors`
- `GET /pm/exports/tasks`
- `GET /pm/integrations`
- `POST /pm/integrations/:provider/connect`
- `POST /pm/integrations/:provider/disconnect`
- `POST /pm/integrations/github/issues/sync`
- `POST /pm/integrations/github/webhook/:workspaceId`

### Notes

- Tech spec: `docs/modules/bm-pm/epics/epic-pm-07-tech-spec.md`
---

## EPIC-PM-06: Real-Time & Notifications (6 stories)

**Status:** Complete
**Completed:** 2025-12-20
**Branch:** `epic/pm-06-real-time-notifications`

### Added

- **WebSocket Task Events**: Real-time broadcasting of task CRUD operations via Socket.io
- **Presence Indicators**: Redis-based user presence with 5-minute TTL and avatar display
- **Real-Time Kanban**: Live task updates with Framer Motion animations, optimistic updates, and conflict detection
- **Notification Preferences**: Per-type/per-channel toggles, quiet hours with timezone support, email digest settings
- **In-App Notification Center**: Bell icon with unread count, dropdown with infinite scroll, date grouping, mark as read
- **Email Digest Notifications**: BullMQ-scheduled daily/weekly digests with Handlebars templates and unsubscribe flow

### Routes

- `/settings/notifications` - Notification preferences settings page
- `/digest/unsubscribe/[token]` - Public unsubscribe confirmation page

### API Endpoints

- `GET/PATCH /pm/notifications/preferences` - User notification preferences
- `POST /pm/notifications/preferences/reset` - Reset to defaults
- `GET /pm/notifications` - List notifications (paginated)
- `GET /pm/notifications/unread-count` - Unread notification count
- `POST /pm/notifications/:id/read` - Mark notification as read
- `POST /pm/notifications/read-all` - Mark all as read
- `DELETE /pm/notifications/:id` - Delete notification
- `GET /pm/presence/projects/:projectId` - Get project presence
- `GET /pm/presence/tasks/:taskId` - Get task presence

### WebSocket Events

- `pm.task.created` / `pm.task.updated` / `pm.task.deleted` / `pm.task.status_changed`
- `pm.presence.joined` / `pm.presence.left` / `pm.presence.updated`
- `notification.new` - Real-time notification delivery

### Notes

- DB migration: `packages/db/prisma/migrations/20251220064644_add_pm_notification_preferences/`
- Tech spec: `docs/modules/bm-pm/epics/epic-pm-06-tech-spec.md`
- Uses Redis sorted sets for presence tracking with automatic 5-minute expiry
- Email service is a stub for MVP (logs instead of sending)
---

## EPIC-PM-05: AI Team - Scope, Pulse, Herald (8 stories)

**Status:** Complete
**Completed:** 2025-12-20
**Retrospective:** 2025-12-21
**Branch:** `epic/pm-05-ai-team-scope-pulse-herald`
**PR:** #30

### Added

- **Scope Agent**: AI agent for phase management and transitions
  - Phase completion analysis with task recommendations
  - Phase transition workflow with bulk task operations (complete/carry-over/cancel)
  - Milestone tracking and checkpoint reminders
  - Daily checkpoint reminder cron job

- **Pulse Agent**: AI agent for health monitoring and risk detection
  - Project health score calculation (0-100) with 4 factors
  - Automated risk detection (deadline warnings, capacity overload, velocity drops)
  - Risk alert UI (banner, list panel, risk cards)
  - Health check cron job running every 15 minutes

- **Herald Agent**: AI agent for automated reporting
  - Report generation (project status, health, progress)
  - Stakeholder-specific reports (executive, team lead, client)
  - Scheduled report automation (daily, weekly, biweekly, monthly)

### Python Agents

- `agents/pm/scope.py` - Phase management agent
- `agents/pm/pulse.py` - Health monitoring agent
- `agents/pm/herald.py` - Report generation agent
- `agents/pm/tools/phase_tools.py` - Phase analysis tools
- `agents/pm/tools/health_tools.py` - Health monitoring tools
- `agents/pm/tools/report_tools.py` - Report generation tools

### API Endpoints

- `POST /pm/phases/:id/analyze-completion` - Analyze phase completion readiness
- `POST /pm/phases/:id/transition` - Execute phase transition
- `GET /pm/phases/:id/checkpoints` - Get upcoming checkpoints
- `POST /pm/agents/health/:projectId/check` - Trigger health check
- `GET /pm/agents/health/:projectId` - Get latest health score
- `GET /pm/agents/health/:projectId/risks` - Get active risks
- `POST /pm/agents/health/:projectId/risks/:id/acknowledge` - Acknowledge risk
- `POST /pm/agents/health/:projectId/risks/:id/resolve` - Resolve risk
- `POST /pm/agents/reports/:projectId/generate` - Generate report
- `GET /pm/agents/reports/:projectId` - List report history
- `GET /pm/agents/reports/:projectId/:id` - Get specific report
- `POST /pm/agents/reports/schedules` - Create report schedule
- `GET /pm/agents/reports/schedules` - List schedules
- `PUT /pm/agents/reports/schedules/:id` - Update schedule
- `DELETE /pm/agents/reports/schedules/:id` - Delete schedule

### Frontend Components

- `PhaseTransitionModal` - Phase transition workflow UI
- `RiskAlertBanner` - Prominent risk alert banner
- `RiskListPanel` - Risk management slide-out panel
- `RiskCard` - Individual risk display with actions
- `useRiskSubscription` - WebSocket hook for real-time updates

### Database Models

- `HealthScore` - Project health scores with factor breakdown
- `RiskEntry` - Detected risks with severity and status
- `Report` - Generated reports with content and metadata
- `ReportSchedule` - Scheduled report configurations
- `PhaseCheckpoint` - Phase milestones with reminder settings

### Notes

- Health scores: 85+ Excellent, 70-84 Good, 50-69 Warning, <50 Critical
- Risk severities: CRITICAL, HIGH, MEDIUM, LOW
- Report types: PROJECT_STATUS, HEALTH_REPORT, PROGRESS_REPORT
- Stakeholder types: EXECUTIVE, TEAM_LEAD, CLIENT, GENERAL

---

## EPIC-KB-01: Knowledge Base Foundation (10 stories)

**Status:** Complete
**Completed:** 2025-12-17
**Branch:** `epic/kb-01-knowledge-base-foundation`

### Added

- **KB Data Model & API**: CRUD operations for knowledge pages with full-text search support
- **Page Version History**: Track changes with restore capability
- **Rich Text Editor**: Tiptap-based editor with toolbar, auto-save, and formatting
- **Page Tree Navigation**: Hierarchical page structure with nested pages
- **Breadcrumb Navigation**: Context-aware navigation path
- **KB Full-Text Search**: Search pages with content text indexing
- **Recent Pages & Favorites**: Track recently viewed pages and user favorites
- **Project-KB Linking**: Link KB pages to projects with primary doc designation
- **Project Docs Tab**: View and manage linked KB pages from project detail

### Routes

- `/kb` - KB home with recent pages and favorites
- `/kb/[slug]` - Page editor with info panel
- `/dashboard/pm/[slug]/docs` - Project docs tab

### API Endpoints

- `GET/POST /api/kb/pages` - List and create pages
- `GET/PATCH/DELETE /api/kb/pages/:id` - Page CRUD
- `GET /api/kb/pages/:id/versions` - Page version history
- `POST /api/kb/pages/:id/restore` - Restore page version
- `GET /api/kb/pages/me/recent` - Recent pages for current user
- `GET /api/kb/pages/me/favorites` - Favorited pages
- `POST/DELETE /api/kb/pages/:id/projects` - Link/unlink project
- `GET /pm/projects/:id/docs` - Get project docs

### Notes

- DB migration: `packages/db/prisma/migrations/20251217230000_add_knowledge_base/`
- Uses existing `KnowledgePage`, `PageVersion`, `PageActivity`, `ProjectPage` models

---

- DB migration: `packages/db/prisma/migrations/20251217230000_add_knowledge_base/`
- Uses existing `KnowledgePage`, `PageVersion`, `PageActivity`, `ProjectPage` models

---

## EPIC-KB-02: KB Real-Time & RAG (8 stories)

**Status:** Complete
**Completed:** 2025-12-18
**Branch:** `epic/kb-02-realtime-rag`

### Added

- **Real-time collaboration**: Yjs + Hocuspocus server for multi-user KB page editing
- **Presence cursors**: collaborator cursor + selection UI in the editor
- **Offline-first editing**: IndexedDB persistence with automatic sync/merge on reconnect
- **Embedding pipeline**: background job to chunk and embed `content_text` into `page_embeddings`
- **Semantic search**: vector similarity endpoint (`/api/kb/search/semantic`)
- **RAG query endpoint**: top-k chunk retrieval with citations + preformatted context (`/api/kb/rag/query`)
- **Related pages**: similarity-based suggestions for a page (`/api/kb/pages/:id/related`)

### API Endpoints

- `POST /api/kb/search/semantic` - Semantic (vector) search across KB pages
- `POST /api/kb/rag/query` - Retrieve top matching KB chunks for agent/RAG use
- `GET /api/kb/pages/:id/related` - Related pages suggestions for a KB page

### Notes

- Vector index migration: `packages/db/prisma/migrations/20251217230000_add_page_embeddings_vector_index/`
- Embeddings are OpenAI-compatible only (OpenAI / OpenRouter / DeepSeek) via workspace BYOAI config

---

## EPIC-PM-01: Project & Phase Management (9 stories)

**Status:** Complete
**Completed:** 2025-12-17
**Branch:** `epic/01-project-phase-management`

### Added

- Projects CRUD API + dashboard routes (`/dashboard/pm`, `/dashboard/pm/[slug]`)
- Phase CRUD + state machine (UPCOMING → CURRENT → COMPLETED)
- BMAD phase templates (course + kanban-only) seeded on project create
- Project settings (autosave + phases editing + archive/delete)
- Project team management (add/edit/remove members + capacity + permissions + reassignment)
- Budget tracking (enable budget, log expenses, threshold alerts, overview widget)

### Notes

- DB migration requires Postgres to apply: `packages/db/prisma/migrations/20251217193000_add_project_expenses/`
- Epic test report: `docs/modules/bm-pm/epics/epic-pm-01-test-report.md`

---

## EPIC-PM-02: Task Management System (11 stories)

**Status:** Complete
**Completed:** 2025-12-18
**Branch:** `epic/pm-02-task-management`

### Added

- **Task CRUD + Bulk Update**: create, update, soft delete, list filters, bulk updates, sequential task numbers per project
- **Task Detail Sheet**: edit title/description/status/priority/assignment/dates with activity timeline in the panel
- **Quick Task Capture**: keyboard-driven creation flow for rapid entry
- **Hierarchy**: parent/child subtasks and progress rollups
- **State Workflow**: status transitions with activity logging and `completedAt` on `DONE`
- **Relations**: blocks/blocked-by, duplicates/duplicated-by, relates-to with inverse relation handling + blocked indicators
- **Comments**: author-editable comments with soft delete + activity logging
- **Attachments**: upload + attach metadata and remove attachments + activity logging
- **Labels**: per-task labels with upsert behavior, color updates, and list filtering by label

### Routes

- `/dashboard/pm/[slug]/tasks` - Project tasks view with detail sheet

### API Endpoints

- `GET/POST /pm/tasks` - List and create tasks
- `GET/PATCH/DELETE /pm/tasks/:id` - Task CRUD
- `PATCH /pm/tasks/bulk` - Bulk update tasks
- `POST/DELETE /pm/tasks/:id/relations` - Manage task relations
- `POST/PATCH/DELETE /pm/tasks/:id/comments` - Manage task comments
- `POST/DELETE /pm/tasks/:id/attachments` - Manage task attachments
- `POST/DELETE /pm/tasks/:id/labels` - Manage task labels

### Notes

- DB migration: `packages/db/prisma/migrations/20251217194000_align_schema_to_current_prisma/`
- Tech spec: `docs/modules/bm-pm/tech-spec-epic-pm-02.md`
- Retrospective: `docs/modules/bm-pm/retrospectives/epic-pm-02-retro-2025-12-18.md`

---

## EPIC-16: Premium Polish & Advanced Features (28 stories)

**Status:** Complete
**Completed:** 2025-12-13
**Branch:** `epic/16-premium-polish-advanced-features`

### Responsive Design

- Medium screen layout (1024-1280px) with auto-collapse sidebar
- Tablet layout (768-1024px) with drawer sidebar and bottom sheet chat
- Mobile layout (<768px) with bottom navigation and full-screen pages
- Workspace vs Business relationship clarification

### Loading States & Feedback

- Skeleton loading screens for all data-fetching components
- Optimistic UI updates with rollback on error
- Form validation with inline feedback
- Demo mode consistency with realistic data

### Micro-Animations & Premium Feel

- Hover lift effects on cards
- Button press feedback animations
- Page transition animations (fade in, slide up)
- Modal and dropdown animations
- Premium shadow system (light mode shadows, dark mode glows)
- Typography refinements with Inter and JetBrains Mono

### Real-Time & Advanced Interactions

- WebSocket real-time updates for approvals, agents, notifications
- Comprehensive keyboard shortcuts system
- Approval queue drag-and-drop reordering
- Character-driven empty states

### Nice-to-Have Features

- Coming Soon module tooltips
- Breadcrumb polish and capitalization fixes
- Dynamic page title tags
- Celebration moments (confetti, badges, checkmarks)
- Keyboard shortcuts help modal
- Agent detail modal with activity history
- Console error cleanup

### Tech Debt Fixes (from EPIC-15 Retrospective)

- Hydration mismatch fix in dashboard layout
- 2FA error handling state consistency
- Rate limiting on streaming endpoint
- localStorage size limits for chat history
- Markdown XSS protection verification
- AbortError type checking fix
- Window resize calculation optimization
- localStorage save debouncing
- Tests for new hooks and API routes

---

## EPIC-15: UI/UX Platform Foundation (27 stories)

**Status:** Complete
**Completed:** 2025-12-11
**Branch:** `epic/16-premium-polish-advanced-features`

### Icon & Visual Fixes

- Fixed 404 errors for Apple/Microsoft/GitHub provider icons
- Standardized icon sizing (16x16 for social providers)
- OAuth logos saved with standard naming format

### Business Portfolio Page

- Portfolio page with business cards grid
- Add New Business modal/flow
- Business status badges and industry tags
- Business card hover effects
- Quick access buttons for each business
- Loading skeletons for portfolio

### Onboarding Wizard

- 4-step wizard: Details → Industry → Goals → Documents
- Progress stepper with active state styling
- Form validation per step
- Document upload zone with drag-and-drop
- Wizard completion triggers Vera conversation

### Chat Panel Connection

- Frontend connected to Agno agent teams
- Message streaming with SSE
- Agent response attribution
- Chat history persistence
- Loading states with typing indicator
- Error recovery and retry

### Settings Pages

- Profile settings with avatar upload
- Appearance settings (theme, font, density)
- Notification preferences management
- Security settings (password, 2FA)
- Team members management with role assignment
- Workspace general settings

### Style Guide Compliance

- Coral primary (#FF6B6B) throughout
- Warm white (#FFFBF5) backgrounds
- Border radius consistency (8px default)
- Spacing audit with 8pt grid
- Inter font integration

---

## EPIC-14: Testing & Observability (19 stories)

**Status:** Complete
**Completed:** 2025-12-10
**PRs:** [#13](https://github.com/CSmithy89/ai-business-hub/pull/13), [#14](https://github.com/CSmithy89/ai-business-hub/pull/14)

### Testing Infrastructure

- Rate limit concurrency tests with Redis testcontainers
- Zustand store unit tests for UI state management
- File upload pipeline tests with PDF/DOCX extraction
- CSRF integration tests for security validation
- Agent client unit tests with mocked fetch
- OAuth flow E2E tests with Playwright
- Approval quick actions tests

### Production Observability

- Prometheus metrics endpoint (`/api/metrics`)
  - Event bus throughput, consumer lag, DLQ size
  - HTTP request duration histograms
  - Approval queue depth by status
  - AI provider health status
  - Active WebSocket connections
- Operational runbooks in `docs/runbooks/`
  - DLQ management procedures
  - Database recovery procedures
  - Incident response guidelines
  - Key rotation procedures

### Agent Security Hardening

- Rate limiting on agent API endpoints (10/minute per user)
- Business ID ownership validation for tenant isolation
- Zod runtime validation for agent responses
- Session persistence with localStorage

### Code Quality Improvements

- API URL centralization in `agent-client.ts`
- Type-safe optimistic updates for approvals
- Countdown timer performance optimization
- Password match indicator fix
- ErrorBoundary telemetry integration
- Mock data centralization for tests
- Rate limit headers (`X-RateLimit-*`) on all rate-limited routes

### Known Issues

- OAuth authentication (Google, GitHub, Microsoft) requires Account schema fix
- See [Epic 14 Retrospective](docs/sprint-artifacts/epic-14-retrospective.md)

---

## EPIC-13: AI Agent Management (6 stories)

**Status:** Complete
**Completed:** 2025-12-08

### Agent Dashboard

- Agent card components with status indicators
- Agent detail modal with configuration view
- Agent activity feed with real-time updates
- Agent configuration page for team settings
- Agent dashboard page at `/dashboard/agents`

### Confidence System

- Confidence breakdown visualization
- Score component breakdowns by factor
- Historical confidence trends

---

## EPIC-12: UX Polish (8 stories)

**Status:** Complete
**Completed:** 2025-12-07

### Authentication UX

- OAuth provider buttons with loading states
- Confirm password field with validation
- Password strength indicator

### Approval Queue UX

- Quick actions (approve/reject) with CSRF protection
- Countdown timers for SLA deadlines
- Approval metrics calculation and display

### Chat Interface

- Streaming UI for real-time responses
- Error display cards with retry
- Preview cards for rich content

### Settings UX

- Enhanced settings navigation
- Improved form layouts and validation

---

## EPIC-11: Agent Integration (5 stories)

**Status:** Complete
**Completed:** 2025-12-06

### Agent API Endpoints

- `POST /agents/validation/runs` - Execute Vera's validation team workflow
- `GET /agents/validation/health` - Health check for validation team
- `POST /agents/planning/runs` - Execute Blake's planning team workflow
- `GET /agents/planning/health` - Health check for planning team
- `POST /agents/branding/runs` - Execute Bella's branding team workflow
- `GET /agents/branding/health` - Health check for branding team

### Frontend Integration

- `agent-client.ts` - Frontend API client with Server-Sent Events (SSE) support
- Real-time agent execution with streaming updates
- Validation page connected to Vera's validation team
- Planning page connected to Blake's planning team
- Branding page connected to Bella's branding team
- Agent name display from team metadata

### Testing

- 11 comprehensive E2E tests for agent integration
- Health check endpoint tests
- Workflow execution tests
- Real-time streaming validation
- Error handling and edge case coverage

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
