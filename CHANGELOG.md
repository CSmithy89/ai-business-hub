# Changelog

All notable changes to HYVVE are documented in this file.

This changelog is organized by Epic, following the BMAD Method development process.

**Foundation Complete:** 17 Epics | 190 Stories | 541 Points | 100% Complete
**Core-PM Complete:** 16 Epics | 61 Stories | Complete
**Dynamic Module System:** Phase 1-5 Complete (DM-01, DM-02, DM-03, DM-04, DM-05)

---

## EPIC-DM-05: Advanced HITL & Streaming (5 stories)

**Status:** Complete
**Completed:** 2025-12-30
**Branch:** `epic/05-advanced-hitl-streaming`

### Added

- **HITL Tool Decorators**: Backend infrastructure for Human-in-the-Loop approval workflows
  - `@hitl_tool` decorator with configurable confidence thresholds (`auto_threshold`, `quick_threshold`)
  - `HITLConfig` Pydantic model with approval_type, risk_level, UI labels
  - `HITLToolResult` model for frontend consumption with approval metadata
  - `calculate_confidence()` function for context-aware confidence scoring
  - `determine_approval_level()` routing: AUTO (>=85%), QUICK (60-84%), FULL (<60%)
  - `is_hitl_tool()` and `get_hitl_config()` introspection utilities
  - Example tools: `sign_contract`, `delete_project`, `approve_expense`, `send_bulk_notification`
  - Audit logging for auto-executed actions with sensitive data filtering

- **Frontend HITL Handlers**: React components and hooks for inline approval UIs
  - `useHITLAction` hook wrapping CopilotKit's `useCopilotAction` with `renderAndWaitForResponse`
  - `useHITLStore` Zustand store for tracking pending HITL requests
  - `HITLApprovalCard` generic component with risk badge, confidence indicator, configurable labels
  - `ContractApprovalCard` specialized for contract signing (ID, amount, terms)
  - `DeleteConfirmCard` with name verification for destructive actions
  - `HITLActionRegistration` component registering all HITL handlers
  - HITL marker detection via `isHITLPending()` and `parseHITLResult()`
  - Toast notifications via sonner for approval/rejection feedback

- **Approval Queue Bridge**: Integration with Foundation approval system for low-confidence actions
  - `ApprovalQueueBridge` class for creating approval items from HITL tool results
  - Confidence factors generated for queue display (4 weighted factors)
  - Priority calculation: high risk OR <30% confidence = urgent
  - Due date calculation: high=4h, medium=24h, low=72h
  - `useApprovalQueue` hook for creating and tracking queued approvals
  - `useApprovalEvents` hook for WebSocket subscription to approval events
  - `ApprovalPendingCard` component showing queued status with progress indicator
  - HITL store extended with `queuedApprovals` state and actions

- **Realtime Progress Streaming**: Real-time task progress for long-running agent operations
  - `TaskStepStatus` and `TaskStatus` enums in Python/TypeScript
  - `TaskStep` and `TaskProgress` Pydantic/Zod schemas with camelCase serialization
  - `DashboardState.activeTasks` field for tracking active tasks
  - State emitter methods: `start_task()`, `update_task_step()`, `complete_task()`, `fail_task()`, `cancel_task()`
  - Progress hooks: `useActiveTasks()`, `useTaskProgress()`, `useHasRunningTasks()`, `useTasksByStatus()`
  - `TaskProgressCard` component with step indicators, progress bar, time estimation
  - Cancel button for running tasks, dismiss for completed/failed/cancelled
  - Immediate emission via `emit_now()` bypassing 100ms debounce

- **Long Running Task Support**: Async task patterns with timeout, cancellation, and background execution
  - `TaskManager` class with singleton pattern and semaphore-based concurrency limiting (default: 5)
  - `TaskState` enum: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED, TIMEOUT
  - `TaskStep` dataclass with handler, name, timeout, retries
  - `TaskResult` dataclass capturing task_id, state, result, error, duration_ms, steps
  - Per-step timeout with retry logic, overall task timeout
  - Cooperative cancellation via `cancel_requested` flag + asyncio task cancellation
  - `cleanup_completed()` for memory management (configurable retention)
  - Example tasks: `research_competitor_landscape()`, `bulk_data_export()`
  - Graceful shutdown handling for server restarts

### Key Files

**Backend (Python):**
- `agents/hitl/__init__.py` - HITL module exports
- `agents/hitl/decorators.py` - HITL decorator, models, and utilities
- `agents/hitl/approval_bridge.py` - ApprovalQueueBridge class
- `agents/hitl/task_manager.py` - TaskManager with full lifecycle management
- `agents/gateway/hitl_tools.py` - Example HITL tools
- `agents/gateway/long_tasks.py` - Example long-running tasks
- `agents/gateway/state_emitter.py` - Extended with progress methods
- `agents/schemas/dashboard_state.py` - TaskStepStatus, TaskStatus, TaskStep, TaskProgress models

**Frontend (TypeScript):**
- `apps/web/src/lib/hitl/types.ts` - HITL TypeScript interfaces
- `apps/web/src/lib/hitl/utils.ts` - HITL utilities (marker detection, formatting)
- `apps/web/src/lib/hitl/use-hitl-action.tsx` - useHITLAction hook
- `apps/web/src/lib/hitl/use-approval-queue.ts` - Approval queue hook
- `apps/web/src/lib/hitl/use-approval-events.ts` - WebSocket subscription
- `apps/web/src/stores/hitl-store.ts` - Zustand store for HITL state
- `apps/web/src/components/hitl/HITLApprovalCard.tsx` - Generic approval card
- `apps/web/src/components/hitl/ContractApprovalCard.tsx` - Contract approval
- `apps/web/src/components/hitl/DeleteConfirmCard.tsx` - Deletion confirmation
- `apps/web/src/components/hitl/ApprovalPendingCard.tsx` - Queue status card
- `apps/web/src/components/hitl/HITLActionRegistration.tsx` - Handler registration
- `apps/web/src/lib/hooks/use-task-progress.ts` - Progress subscription hooks
- `apps/web/src/components/progress/TaskProgressCard.tsx` - Progress UI component
- `apps/web/src/lib/schemas/dashboard-state.ts` - Extended with TaskProgress schemas
- `apps/web/src/stores/dashboard-state-store.ts` - Extended with task actions

### Confidence-Based Routing

| Confidence | Level | Behavior |
|------------|-------|----------|
| >= 85% | AUTO | Backend auto-execute with audit logging |
| 60-84% | QUICK | Inline CopilotKit approval UI |
| < 60% | FULL | Routed to Foundation approval queue |

### Test Coverage

- 66 Python unit tests for HITL decorators (97% coverage)
- 33 TypeScript tests for frontend HITL handlers
- 25+ Python tests for ApprovalQueueBridge (>85% coverage)
- 22 Python tests for state emitter progress methods
- 27+ TypeScript tests for TaskProgressCard
- 35 Python tests for TaskManager (88% coverage)

### Notes

- Tech spec: `docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md`
- Stories: 5 (DM-05.1 through DM-05.5)
- Total points: 34 (8 + 8 + 5 + 8 + 5)
- Integration tests for E2E progress streaming deferred to E2E testing phase

---

## EPIC-DM-04: Shared State & Real-Time (5 stories)

**Status:** Complete
**Completed:** 2025-12-30
**Branch:** `epic/04-shared-state-realtime`

### Added

- **State Schemas**: TypeScript/Python bidirectional state schemas
  - TypeScript Zod schemas in `apps/web/src/lib/schemas/dashboard-state.ts`
  - Python Pydantic models in `agents/schemas/dashboard_state.py`
  - Cross-language compatibility with camelCase/snake_case aliasing
  - `STATE` constants in `agents/constants/dm_constants.py`

- **Frontend State Subscription**: Zustand store with CopilotKit bridge
  - `useDashboardState` store in `apps/web/src/stores/dashboard-state-store.ts`
  - `useAgentStateSync` hook bridging AG-UI to Zustand
  - Selector hooks (`useProjectStatus`, `useMetrics`, `useTeamActivity`, `useAlerts`)
  - 100ms debouncing to prevent UI thrashing
  - Stale state detection via timestamp comparison

- **Agent State Emissions**: Python state emitter for Dashboard Gateway
  - `DashboardStateEmitter` class in `agents/gateway/state_emitter.py`
  - Debounced emissions (100ms) with `emit_now()` for immediate updates
  - Bulk updates via `update_from_gather()` for parallel agent results
  - Response parsers for Navi, Pulse, Herald agents
  - Dashboard Gateway agent accepts `state_callback` parameter

- **Real-Time Widget Updates**: State-driven widget wrappers
  - `StateProjectStatusWidget`, `StateMetricsWidget`, `StateActivityWidget`, `StateAlertsWidget`
  - Hybrid rendering mode (tool-only/state-only/hybrid) in `DashboardSlots`
  - `RealTimeIndicator` component with status dot and last update time
  - `formatTimestamp()` utility for relative time formatting
  - Cached data priority during background refreshes

- **State Persistence**: Browser localStorage with cross-tab sync
  - `useStatePersistence` hook with 1-second debounced saves
  - 24-hour TTL with stale state detection and cleanup
  - Cross-tab synchronization via BroadcastChannel API
  - `useDashboardStateWithPersistence()` combined hook
  - Utility functions: `clearPersistedDashboardState()`, `hasPersistedDashboardState()`

### Key Files

- `apps/web/src/lib/schemas/dashboard-state.ts` - TypeScript Zod schemas
- `agents/schemas/dashboard_state.py` - Python Pydantic models
- `apps/web/src/stores/dashboard-state-store.ts` - Zustand store
- `apps/web/src/hooks/use-agent-state-sync.ts` - CopilotKit to Zustand bridge
- `apps/web/src/hooks/use-dashboard-selectors.ts` - Selector hooks
- `agents/gateway/state_emitter.py` - Agent state emission
- `apps/web/src/components/slots/widgets/StateWidget.tsx` - State-driven widgets
- `apps/web/src/components/slots/widgets/RealTimeIndicator.tsx` - Update indicator
- `apps/web/src/hooks/use-state-persistence.ts` - localStorage persistence

### DashboardSlots Rendering Modes

| Mode | Tool Calls | State Updates | Use Case |
|------|------------|---------------|----------|
| `hybrid` (default) | Yes | Yes | Normal operation |
| `tool-only` | Yes | No | DM-03 compatibility |
| `state-only` | No | Yes | Pure state-driven |

### Notes

- Tech spec: `docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md`
- Stories: 5 (DM-04.1 through DM-04.5)
- Total points: 26 (5 + 5 + 5 + 5 + 6)
- Redis server-side persistence documented for future enhancement

---

## EPIC-DM-03: Dashboard Agent Integration (5 stories)

**Status:** Complete
**Completed:** 2025-12-30
**Branch:** `epic/03-dashboard-integration`

### Added

- **A2A Client**: `HyvveA2AClient` for inter-agent communication via JSON-RPC 2.0
  - Connection pooling with httpx and HTTP/2 support
  - Parallel agent calls using `asyncio.gather`
  - Structured `A2ATaskResult` responses with duration tracking
  - Comprehensive error handling (timeout, connection, HTTP errors)

- **Dashboard Agent Orchestration**: Tools for data gathering via A2A
  - `get_project_status()` - Calls Navi for project context
  - `get_health_summary()` - Calls Pulse for metrics
  - `get_recent_activity()` - Calls Herald for activity feed
  - `gather_dashboard_data()` - Parallel agent calls (3x faster)
  - Updated `DASHBOARD_INSTRUCTIONS` with orchestration guidance

- **Widget Rendering Pipeline**: Agent tool calls to frontend widgets
  - `TeamActivityWidget` for activity feed display
  - `LoadingWidget` for pending tool call states
  - `ErrorWidget` for failed renders with retry option
  - Loading/error state handling in `DashboardSlots`

- **Dashboard Page Integration**: AI-powered dashboard section
  - `DashboardGrid` - Responsive 1/2/3 column layout
  - `DashboardChat` - Quick action suggestions with icons
  - `DashboardAgentSection` - Container with 2:1 widgets:chat layout
  - Suspense boundary with skeleton loading

- **Comprehensive Test Suite**: E2E, unit, integration, and performance tests
  - 14 E2E tests for dashboard page flows
  - 37 component tests for dashboard widgets
  - 15 A2A integration tests for agent communication
  - 8 performance baseline tests (<500ms single, <800ms parallel)

### API Endpoints

- `POST /a2a/navi` - Navi agent A2A endpoint
- `POST /a2a/pulse` - Pulse agent A2A endpoint
- `POST /a2a/herald` - Herald agent A2A endpoint
- `POST /a2a/dashboard` - Dashboard Gateway A2A endpoint

### Widget Types Available

| Widget Type | Component | Use Case |
|-------------|-----------|----------|
| `ProjectStatus` | ProjectStatusWidget | Project overview with progress |
| `TaskList` | TaskListWidget | List of tasks with status |
| `Metrics` | MetricsWidget | Key metrics with trends |
| `Alert` | AlertWidget | Alert messages with severity |
| `TeamActivity` | TeamActivityWidget | Recent team activity feed |

### Key Files

- `agents/a2a/client.py` - A2A client implementation
- `agents/gateway/tools.py` - Dashboard Gateway orchestration tools
- `agents/gateway/agent.py` - Updated agent instructions
- `apps/web/src/components/slots/widgets/TeamActivityWidget.tsx` - Activity widget
- `apps/web/src/components/slots/widgets/LoadingWidget.tsx` - Loading state
- `apps/web/src/components/slots/widgets/ErrorWidget.tsx` - Error state
- `apps/web/src/components/dashboard/DashboardGrid.tsx` - Widget grid
- `apps/web/src/components/dashboard/DashboardChat.tsx` - Chat sidebar
- `apps/web/src/app/(dashboard)/dashboard/DashboardAgentSection.tsx` - Agent section

### Notes

- Tech spec: `docs/modules/bm-dm/epics/epic-dm-03-tech-spec.md`
- Stories: 5 (DM-03.1 through DM-03.5)
- Total points: 34 (5 + 8 + 8 + 8 + 5)
- 74 total tests across all test suites

---

## EPIC-DM-02: Agno Multi-Interface Backend (9 stories)

**Status:** Complete
**Completed:** 2025-12-30
**Branch:** `epic/dm-02-agno-backend`
**PR:** #41

### Added

- **AgentOS Multi-Interface Runtime**: Single agent with AG-UI + A2A protocol support simultaneously
- **A2A AgentCard Discovery**: `.well-known/agent.json` endpoint following Google A2A standard
- **Dashboard Gateway Agent**: Frontend orchestration agent with widget rendering tools
- **CCR Integration**: Claude Code Router for intelligent model routing
  - Health monitoring with graceful degradation
  - Task-based routing (reasoning, code_generation, long_context, general)
  - Keyword classification + explicit hints + agent defaults
  - Quota alerts at 80% (warning) and 95% (critical)
- **PM Agent Protocol Updates**: A2A adapters for Navi, Sage, Chrono, Scribe agents

### API Endpoints

- `GET /.well-known/agent.json` - A2A AgentCard discovery
- `GET /agents` - List all agents with A2A metadata
- `GET /agents/:agent_id` - Individual agent card
- `GET /ccr/metrics` - CCR usage metrics and quota status
- `GET /ccr/health` - CCR connection health check

### Key Files

- `agents/main.py` - Multi-interface AgentOS entry point
- `agents/models/ccr_provider.py` - CCRModel extending OpenAIChat
- `agents/models/task_classifier.py` - Task type classification
- `agents/services/ccr_health.py` - CCR health checking service
- `agents/services/ccr_usage.py` - Usage tracking and alerts
- `agents/platform/dashboard_gateway.py` - Dashboard Gateway agent
- `agents/platform/agent_discovery.py` - A2A AgentCard builders
- `agents/constants/dm_constants.py` - All DM routing constants

### Notes

- Tech spec: `docs/modules/bm-dm/epics/epic-dm-02-tech-spec.md`
- 290 unit tests (251 pass, 34 require agno package, 5 skipped)
- CCR hybrid mode allows BYOAI fallback when CCR unavailable

---

## EPIC-DM-01: CopilotKit Frontend Infrastructure (8 stories)

**Status:** Complete
**Completed:** 2025-12-28
**Branch:** `epic/dm-01-copilotkit-frontend`
**PR:** #40

### Added

- **CopilotKit Provider**: AG-UI protocol integration with Zustand chat state
- **Slot System**: `DashboardSlots` component with widget registry
- **Base Widgets**: ProjectStatus, TaskList, Metrics, Alert, Activity widgets
- **Chat Integration**: CopilotKit Chat panel with AG-UI endpoints
- **Context Providers**: Business, projects, and tasks context for agents
- **CCR Settings UI**: Mode selection (ccr-only, byoai, hybrid) and fallback chain config
- **CCR Connection Status**: Health monitoring with visual indicators
- **CCR Quota Display**: Usage progress bars with threshold warnings

### Routes

- `/settings/ai-config` - CCR routing configuration

### Key Files

- `apps/web/src/lib/copilotkit/` - CopilotKit configuration
- `apps/web/src/components/slots/` - Slot system and widgets
- `apps/web/src/components/chat/` - Chat panel integration
- `apps/web/src/components/settings/` - CCR config components
- `apps/web/src/hooks/` - CCR hooks (useCCRRouting, useCCRStatus, useCCRQuota)

### Notes

- Tech spec: `docs/modules/bm-dm/epics/epic-dm-01-tech-spec.md`
- Implements CopilotKit Generative UI pattern with `useRenderToolCall`

---

## EPIC-KB-04: AI-Native Knowledge Base (6 stories)

**Status:** Complete
**Completed:** 2025-12-21
**Branch:** `epic/04-ai-native-knowledge-base`

### Added

- **AI Page Drafts**: Generate KB draft content with citations and guardrails
- **Smart Summarization**: AI summaries and key points for KB pages
- **KB Q&A Chat**: Ask questions across the KB with cited answers
- **Knowledge Extraction**: Task completion extraction with approval routing
- **Gap Detection**: Admin dashboard + API to flag missing topics and stale coverage
- **KB Templates**: Built-in and custom templates, plus save-as-template flow

### Routes

- `/kb/gaps` - Gap analysis dashboard
- `/kb/new` - Template-based KB page creation

### API Endpoints

- `POST /api/kb/ai/draft` - Generate AI draft content
- `POST /api/kb/ai/summary` - Summarize KB page content
- `POST /api/kb/ask` - Ask the KB a question with citations
- `GET /api/kb/analysis/gaps` - Run gap analysis (admin only)
- `GET /api/kb/templates` - List templates (built-in + custom)
- `POST /api/kb/templates` - Create a custom template

### Notes

- Added template metadata fields (`isTemplate`, `templateCategory`) to KB pages with migration `packages/db/prisma/migrations/20251221200509_add_kb_templates_and_gap_indexes/`.

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

## EPIC-PM-09: Advanced Views (6 stories)

**Status:** Complete
**Completed:** 2025-12-22
**Branch:** `epic/pm-09-advanced-views`

### Added

- **Timeline/Gantt View**: Zoomable timeline with drag/resize, dependencies, and critical path highlighting
- **Portfolio Dashboard**: Workspace-level project health overview with filters and drill-down
- **Dependencies Dashboard**: Cross-project task relations with relation filters
- **Custom View Builder**: Column visibility and sorting controls for saved views
- **View Sharing Links**: Shareable saved views via `viewId` query parameter
- **View Templates**: Local templates per workspace for reusing view configurations

### Routes

- `/dashboard/pm/portfolio` - Executive portfolio dashboard
- `/dashboard/pm/dependencies` - Cross-project dependencies
- `/dashboard/pm/[slug]/tasks?viewId=...` - Shared view deep link

### API Endpoints

- `GET /pm/portfolio` - Portfolio dashboard aggregates
- `GET /pm/dependencies` - Task dependency list

### Notes

- Tech spec: `docs/sprint-artifacts/tech-spec-epic-pm-09.md`

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

## EPIC-PM-04: AI Team - Navi, Sage, Chrono (9 stories)

**Status:** Complete
**Completed:** 2025-12-19
**Branch:** `epic/pm-04-ai-team-navi-sage-chrono`
**PR:** #29

### Added

- **Navi Agent (Orchestrator)**: PM assistant for natural language commands, context-aware Q&A (via KB RAG), and daily briefings
- **Sage Agent (Estimation)**: Estimation specialist providing story points/hours with confidence scores and learning from actuals
- **Chrono Agent (Time)**: Time tracking assistant for timer management, manual logging, and velocity reporting
- **Suggestion Mode**: AI actions require human approval (never auto-executed) via `AgentSuggestion` workflow
- **Agent Architecture**: Python (Agno) + NestJS integration with shared auth and rate limiting
- **Daily Briefing**: Cron-scheduled morning summaries of due tasks and blockers

### API Endpoints

- `POST /pm/agents/chat` - Send message to agent
- `GET /pm/agents/briefing` - Get daily briefing
- `GET /pm/agents/suggestions` - List pending suggestions
- `POST /pm/agents/suggestions/:id/accept` - Accept suggestion
- `POST /pm/agents/estimation/estimate` - Get task estimate
- `POST /pm/agents/time/start` - Start timer
- `POST /pm/agents/time/stop` - Stop timer

### Notes

- Tech spec: `docs/modules/bm-pm/epics/epic-pm-04-tech-spec.md`
- Backend-first implementation; UI components to follow
- Implements "Suggestion Mode" for safety and auditability

---

## EPIC-KB-03: KB Verification & Scribe Agent (7 stories)

**Status:** Complete
**Completed:** 2025-12-19
**Branch:** `epic/kb-03-verification-scribe`
**PR:** #28

### Added

- **Verification System**: Mark pages as verified with expiration (30/60/90 days), visual badges, and re-verification flow
- **Expiration Workflow**: Automated detection of expired verifications with notifications
- **Stale Content Dashboard**: Admin interface to identify and manage outdated or low-traffic pages
- **Social Features**: `@mention` users and `#task` references in KB editor with autocomplete
- **Scribe Agent**: AI agent for KB management (create/update pages, verify content, detect staleness)
- **RAG Boost**: Verified content receives 1.5x relevance boost in AI queries

### API Endpoints

- `POST /api/kb/pages/:id/verify` - Mark page as verified
- `DELETE /api/kb/pages/:id/verify` - Remove verification
- `GET /api/kb/stale` - List stale pages
- `GET /api/workspace/users` - User search for mentions
- `GET /api/pm/tasks/search` - Task search for references

### Notes

- Tech spec: `docs/modules/bm-pm/epics/epic-kb-03-tech-spec.md`
- Includes CVE security fixes and rate limiting improvements

---

## EPIC-PM-03: Views & Navigation (8 stories)

**Status:** Complete
**Completed:** 2025-12-18
**Branch:** `epic/pm-03-views-navigation`

### Added

- **Task List View**: High-performance table with virtualization and column visibility toggle
- **Kanban Board**: Drag-and-drop board with grouping (Status, Priority, Assignee, Type, Phase) and WIP limits
- **Calendar View**: Month/Week/Day views with drag-to-reschedule and priority color coding
- **View Persistence**: LocalStorage-based view preferences (type, columns, grouping)
- **Saved Views**: Create, edit, share, and manage custom view configurations
- **Advanced Filters**: URL-based filtering for status, priority, assignee, labels, and date ranges
- **Bulk Operations**: Multi-select actions for status, priority, assignee, labels, and deletion

### Routes

- `/dashboard/pm/[slug]/tasks` - Main tasks interface with view switcher

### API Endpoints

- `GET /api/pm/projects/:projectId/views` - List saved views
- `POST /api/pm/projects/:projectId/views` - Create saved view
- `PATCH /api/pm/views/:viewId` - Update saved view
- `DELETE /api/pm/views/:viewId` - Delete saved view
- `PATCH /api/pm/tasks/bulk` - Execute bulk operations

### Notes

- Tech spec: `docs/modules/bm-pm/epics/epic-pm-03-tech-spec.md`
- Implements optimistic updates for all drag-and-drop interactions
- Uses `@tanstack/react-table` and `@dnd-kit` for performance and accessibility

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

## EPIC-10: Platform Hardening (8 stories)

**Status:** Complete
**Completed:** 2025-12-06
**PR:** #11

### Security Hardening

- **CSRF Protection**: HMAC-SHA256 based tokens, middleware validation, and constant-time comparison.
- **XSS Sanitization**: DOMPurify-based sanitization for user content with comprehensive test coverage.
- **Encryption Validation**: Startup validation for encryption keys ensuring >128-bit entropy.
- **Backup Code Safety**: Fixed race condition in backup code verification with pessimistic locking strategy.

### Infrastructure & Reliability

- **Redis Rate Limiting**: Migrated to `@upstash/ratelimit` for distributed rate limiting with in-memory fallback.
- **Database Migrations**: Validated and executed migrations for AgentChatMessage and AgentSession models.
- **Global Validation**: Verified NestJS `ValidationPipe` configuration for strict input validation.
- **Trusted Devices**: Validated and fixed trusted device implementation.

### Key Files

- `apps/web/src/lib/csrf.ts` - CSRF token generation/verification
- `apps/web/src/middleware.ts` - CSRF middleware
- `apps/web/src/lib/utils/rate-limit.ts` - Unified Redis rate limiter
- `apps/web/src/lib/utils/sanitize.ts` - XSS sanitization utility

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
