# Epic DM-04: Shared State & Real-Time - Technical Specification

## 1. Executive Summary

### What DM-04 Delivers

Epic DM-04 implements **shared state synchronization** between agents and the frontend, enabling real-time widget updates without explicit tool calls. This builds on the Dashboard Integration (DM-03) by adding automatic state propagation via AG-UI's `useCoAgentStateRender` mechanism.

**Key Deliverables:**
- Shared state schema definitions (TypeScript + Python)
- Frontend state subscription via CopilotKit hooks
- Agent-side state emission patterns
- Real-time widget update mechanisms
- State persistence for session continuity

### Key Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| CopilotKit | ^1.x | `useCoAgentStateRender` for state subscription |
| Zustand | ^4.x | Local state management and caching |
| Agno | ^0.3.x | Agent state emission via AG-UI |
| Zod | ^3.x | Runtime validation of state schemas |
| Redis | 7+ | State persistence and pub/sub |

### Integration Points with Existing Codebase

1. **CopilotKit Provider (`apps/web/src/components/copilot/`)**
   - Already configured in DM-01 with AG-UI connection
   - This epic adds state subscription hooks

2. **Dashboard Gateway Agent (`agents/gateway/`)**
   - Created in DM-02/DM-03 with tool-based rendering
   - This epic adds state emission capabilities

3. **Dashboard Slots (`apps/web/src/components/slots/`)**
   - Created in DM-01/DM-03 for tool-call rendering
   - This epic adds state-driven rendering path

4. **Zustand Store (`apps/web/src/components/copilot/use-copilot-chat-state.ts`)**
   - Existing pattern for shared state
   - This epic adds dashboard state store

---

## 2. Architecture Decisions

### 2.1 State Flow Architecture

The shared state system enables bidirectional state synchronization:

```
                    AG-UI Protocol
                         |
                         v
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  ┌─────────────────┐     ┌─────────────────────────────────┐│
│  │ useCoAgentState │ --> │ Zustand Store (dashboardState)  ││
│  │     Render      │     │                                 ││
│  └─────────────────┘     └─────────────┬───────────────────┘│
│                                        │                    │
│                           ┌────────────v────────────┐       │
│                           │  Widget Components      │       │
│                           │  (auto-update on state) │       │
│                           └─────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                         |
                    AG-UI Protocol
                         |
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Agno)                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Dashboard Gateway Agent                     ││
│  │                                                          ││
│  │  ┌──────────────┐    ┌──────────────┐                   ││
│  │  │ Agent State  │--->│ State Emitter│---> AG-UI Stream  ││
│  │  │   (dict)     │    │              │                   ││
│  │  └──────────────┘    └──────────────┘                   ││
│  │        ^                                                 ││
│  │        |                                                 ││
│  │  ┌──────────────┐                                       ││
│  │  │ A2A Results  │ <-- Navi, Pulse, Herald               ││
│  │  └──────────────┘                                       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Key Insight:** Instead of relying solely on tool calls (`render_dashboard_widget`) for UI updates, the agent can update its internal state, and CopilotKit automatically propagates those changes to subscribed frontend components.

### 2.2 State Schema Design

We use a hierarchical state schema that captures all dashboard data:

```typescript
// DashboardState - Root state object
interface DashboardState {
  version: number;              // Schema version for migrations
  timestamp: number;            // Last update timestamp
  activeProject: string | null; // Currently focused project

  // Widget data by type
  widgets: {
    projectStatus: ProjectStatusState | null;
    metrics: MetricsState | null;
    activity: ActivityState | null;
    alerts: AlertState[];
  };

  // Loading and error states
  loading: {
    isLoading: boolean;
    loadingAgents: string[];    // Which agents are being queried
  };

  errors: {
    [agentId: string]: string;  // Agent-specific errors
  };
}
```

**Rationale:**
- Single state object enables atomic updates
- Hierarchical structure maps to widget types
- Loading/error states enable optimistic UI
- Version field enables future migrations

### 2.3 State vs Tool Calls Decision Matrix

| Use Case | Mechanism | Why |
|----------|-----------|-----|
| Initial data load | State emission | Entire dashboard populates at once |
| User query response | Tool call | Explicit action, user feedback |
| Background refresh | State emission | Silent update, no UI interruption |
| Error notification | Both | State for persistence, tool for visibility |
| Widget interaction | State emission | Immediate feedback |

### 2.4 Persistence Strategy

State is persisted at multiple levels:

1. **In-Memory (Zustand):** Fast access during session
2. **Redis (Server):** Cross-session persistence, pub/sub for multi-tab
3. **Browser Storage (Optional):** Offline support future work

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Zustand    │ <-- │    Redis     │ <-- │    Agent     │
│   (Client)   │     │   (Server)   │     │   (State)    │
└──────────────┘     └──────────────┘     └──────────────┘
     ^                     ^
     |                     |
Tab 1, Tab 2 (pub/sub)  Session resume
```

---

## 3. Story-by-Story Technical Breakdown

### 3.1 Story DM-04.1: State Schema Definition (5 points)

**Objective:** Define shared state schemas in both TypeScript and Python with validation.

**Implementation Tasks:**

1. **Create TypeScript state schemas (`apps/web/src/lib/state/dashboard-state.types.ts`):**
   ```typescript
   /**
    * Dashboard Shared State Schemas
    *
    * These schemas define the structure of state shared between
    * the Dashboard Gateway agent and the frontend via AG-UI.
    *
    * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
    * Epic: DM-04 | Story: DM-04.1
    */
   import { z } from 'zod';

   // State version for schema migrations
   export const STATE_VERSION = 1;

   // =============================================================================
   // WIDGET STATE SCHEMAS
   // =============================================================================

   /**
    * Project Status Widget State
    */
   export const ProjectStatusStateSchema = z.object({
     projectId: z.string(),
     name: z.string(),
     status: z.enum(['on-track', 'at-risk', 'behind', 'completed']),
     progress: z.number().min(0).max(100),
     tasksCompleted: z.number().int().min(0),
     tasksTotal: z.number().int().min(0),
     lastUpdated: z.number(), // Unix timestamp
     summary: z.string().optional(),
   });

   export type ProjectStatusState = z.infer<typeof ProjectStatusStateSchema>;

   /**
    * Single Metric Entry
    */
   export const MetricEntrySchema = z.object({
     id: z.string(),
     label: z.string(),
     value: z.union([z.number(), z.string()]),
     unit: z.string().optional(),
     trend: z.enum(['up', 'down', 'neutral']).optional(),
     change: z.string().optional(),
     changePercent: z.number().optional(),
   });

   export type MetricEntry = z.infer<typeof MetricEntrySchema>;

   /**
    * Metrics Widget State
    */
   export const MetricsStateSchema = z.object({
     title: z.string().default('Key Metrics'),
     metrics: z.array(MetricEntrySchema),
     period: z.string().optional(), // e.g., "Last 7 days"
     lastUpdated: z.number(),
   });

   export type MetricsState = z.infer<typeof MetricsStateSchema>;

   /**
    * Activity Entry
    */
   export const ActivityEntrySchema = z.object({
     id: z.string(),
     user: z.string(),
     userAvatar: z.string().optional(),
     action: z.string(),
     target: z.string().optional(),
     timestamp: z.number(),
     projectId: z.string().optional(),
   });

   export type ActivityEntry = z.infer<typeof ActivityEntrySchema>;

   /**
    * Activity Widget State
    */
   export const ActivityStateSchema = z.object({
     activities: z.array(ActivityEntrySchema),
     hasMore: z.boolean().default(false),
     lastUpdated: z.number(),
   });

   export type ActivityState = z.infer<typeof ActivityStateSchema>;

   /**
    * Alert Entry
    */
   export const AlertEntrySchema = z.object({
     id: z.string(),
     type: z.enum(['error', 'warning', 'info', 'success']),
     title: z.string(),
     message: z.string(),
     timestamp: z.number(),
     dismissable: z.boolean().default(true),
     dismissed: z.boolean().default(false),
     actionLabel: z.string().optional(),
     actionUrl: z.string().optional(),
   });

   export type AlertEntry = z.infer<typeof AlertEntrySchema>;

   /**
    * Alerts State (array of alerts)
    */
   export const AlertStateSchema = z.array(AlertEntrySchema);

   export type AlertState = z.infer<typeof AlertStateSchema>;

   // =============================================================================
   // LOADING & ERROR STATE SCHEMAS
   // =============================================================================

   /**
    * Loading State
    */
   export const LoadingStateSchema = z.object({
     isLoading: z.boolean().default(false),
     loadingAgents: z.array(z.string()).default([]),
     startedAt: z.number().optional(),
   });

   export type LoadingState = z.infer<typeof LoadingStateSchema>;

   /**
    * Error State (map of agent -> error message)
    */
   export const ErrorStateSchema = z.record(z.string(), z.string());

   export type ErrorState = z.infer<typeof ErrorStateSchema>;

   // =============================================================================
   // ROOT DASHBOARD STATE SCHEMA
   // =============================================================================

   /**
    * Widget Container State
    */
   export const WidgetsStateSchema = z.object({
     projectStatus: ProjectStatusStateSchema.nullable().default(null),
     metrics: MetricsStateSchema.nullable().default(null),
     activity: ActivityStateSchema.nullable().default(null),
     alerts: AlertStateSchema.default([]),
   });

   export type WidgetsState = z.infer<typeof WidgetsStateSchema>;

   /**
    * Root Dashboard State
    *
    * This is the complete state object shared between agent and frontend.
    */
   export const DashboardStateSchema = z.object({
     version: z.number().default(STATE_VERSION),
     timestamp: z.number(),
     activeProject: z.string().nullable().default(null),
     workspaceId: z.string().optional(),
     userId: z.string().optional(),

     // Widget data
     widgets: WidgetsStateSchema.default({
       projectStatus: null,
       metrics: null,
       activity: null,
       alerts: [],
     }),

     // Loading state
     loading: LoadingStateSchema.default({
       isLoading: false,
       loadingAgents: [],
     }),

     // Error state
     errors: ErrorStateSchema.default({}),
   });

   export type DashboardState = z.infer<typeof DashboardStateSchema>;

   // =============================================================================
   // STATE UPDATE SCHEMAS (Partial updates)
   // =============================================================================

   /**
    * Partial update for dashboard state
    */
   export const DashboardStateUpdateSchema = DashboardStateSchema.partial();

   export type DashboardStateUpdate = z.infer<typeof DashboardStateUpdateSchema>;

   // =============================================================================
   // STATE VALIDATION HELPERS
   // =============================================================================

   /**
    * Validate dashboard state, returning typed result
    */
   export function validateDashboardState(data: unknown): DashboardState | null {
     const result = DashboardStateSchema.safeParse(data);
     if (result.success) {
       return result.data;
     }
     console.error('Invalid dashboard state:', result.error);
     return null;
   }

   /**
    * Create initial empty dashboard state
    */
   export function createInitialDashboardState(): DashboardState {
     return {
       version: STATE_VERSION,
       timestamp: Date.now(),
       activeProject: null,
       widgets: {
         projectStatus: null,
         metrics: null,
         activity: null,
         alerts: [],
       },
       loading: {
         isLoading: false,
         loadingAgents: [],
       },
       errors: {},
     };
   }
   ```

2. **Create Python state schemas (`agents/state/dashboard_state.py`):**
   ```python
   """
   Dashboard Shared State Schemas

   These Pydantic models mirror the TypeScript schemas for state
   shared between the Dashboard Gateway agent and the frontend.

   @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
   Epic: DM-04 | Story: DM-04.1
   """
   from datetime import datetime
   from enum import Enum
   from typing import Any, Dict, List, Optional, Union

   from pydantic import BaseModel, Field

   # State version for schema migrations
   STATE_VERSION = 1


   # =============================================================================
   # ENUMS
   # =============================================================================


   class ProjectStatus(str, Enum):
       """Project status values."""
       ON_TRACK = "on-track"
       AT_RISK = "at-risk"
       BEHIND = "behind"
       COMPLETED = "completed"


   class TrendDirection(str, Enum):
       """Metric trend direction."""
       UP = "up"
       DOWN = "down"
       NEUTRAL = "neutral"


   class AlertType(str, Enum):
       """Alert severity type."""
       ERROR = "error"
       WARNING = "warning"
       INFO = "info"
       SUCCESS = "success"


   # =============================================================================
   # WIDGET STATE MODELS
   # =============================================================================


   class ProjectStatusState(BaseModel):
       """Project Status Widget State."""
       project_id: str = Field(..., alias="projectId")
       name: str
       status: ProjectStatus
       progress: int = Field(..., ge=0, le=100)
       tasks_completed: int = Field(..., ge=0, alias="tasksCompleted")
       tasks_total: int = Field(..., ge=0, alias="tasksTotal")
       last_updated: int = Field(..., alias="lastUpdated")  # Unix timestamp ms
       summary: Optional[str] = None

       class Config:
           populate_by_name = True
           use_enum_values = True


   class MetricEntry(BaseModel):
       """Single metric entry."""
       id: str
       label: str
       value: Union[int, float, str]
       unit: Optional[str] = None
       trend: Optional[TrendDirection] = None
       change: Optional[str] = None
       change_percent: Optional[float] = Field(None, alias="changePercent")

       class Config:
           populate_by_name = True
           use_enum_values = True


   class MetricsState(BaseModel):
       """Metrics Widget State."""
       title: str = "Key Metrics"
       metrics: List[MetricEntry] = Field(default_factory=list)
       period: Optional[str] = None
       last_updated: int = Field(..., alias="lastUpdated")

       class Config:
           populate_by_name = True


   class ActivityEntry(BaseModel):
       """Single activity entry."""
       id: str
       user: str
       user_avatar: Optional[str] = Field(None, alias="userAvatar")
       action: str
       target: Optional[str] = None
       timestamp: int
       project_id: Optional[str] = Field(None, alias="projectId")

       class Config:
           populate_by_name = True


   class ActivityState(BaseModel):
       """Activity Widget State."""
       activities: List[ActivityEntry] = Field(default_factory=list)
       has_more: bool = Field(default=False, alias="hasMore")
       last_updated: int = Field(..., alias="lastUpdated")

       class Config:
           populate_by_name = True


   class AlertEntry(BaseModel):
       """Single alert entry."""
       id: str
       type: AlertType
       title: str
       message: str
       timestamp: int
       dismissable: bool = True
       dismissed: bool = False
       action_label: Optional[str] = Field(None, alias="actionLabel")
       action_url: Optional[str] = Field(None, alias="actionUrl")

       class Config:
           populate_by_name = True
           use_enum_values = True


   # =============================================================================
   # LOADING & ERROR STATE
   # =============================================================================


   class LoadingState(BaseModel):
       """Loading state for dashboard."""
       is_loading: bool = Field(default=False, alias="isLoading")
       loading_agents: List[str] = Field(default_factory=list, alias="loadingAgents")
       started_at: Optional[int] = Field(None, alias="startedAt")

       class Config:
           populate_by_name = True


   # =============================================================================
   # ROOT DASHBOARD STATE
   # =============================================================================


   class WidgetsState(BaseModel):
       """Container for all widget states."""
       project_status: Optional[ProjectStatusState] = Field(None, alias="projectStatus")
       metrics: Optional[MetricsState] = None
       activity: Optional[ActivityState] = None
       alerts: List[AlertEntry] = Field(default_factory=list)

       class Config:
           populate_by_name = True


   class DashboardState(BaseModel):
       """
       Root Dashboard State

       This is the complete state object shared between agent and frontend
       via the AG-UI protocol's state synchronization.
       """
       version: int = STATE_VERSION
       timestamp: int
       active_project: Optional[str] = Field(None, alias="activeProject")
       workspace_id: Optional[str] = Field(None, alias="workspaceId")
       user_id: Optional[str] = Field(None, alias="userId")

       # Widget data
       widgets: WidgetsState = Field(default_factory=WidgetsState)

       # Loading state
       loading: LoadingState = Field(default_factory=LoadingState)

       # Error state (agent_id -> error message)
       errors: Dict[str, str] = Field(default_factory=dict)

       class Config:
           populate_by_name = True

       @classmethod
       def create_initial(
           cls,
           workspace_id: Optional[str] = None,
           user_id: Optional[str] = None,
       ) -> "DashboardState":
           """Create initial empty dashboard state."""
           return cls(
               timestamp=int(datetime.utcnow().timestamp() * 1000),
               workspace_id=workspace_id,
               user_id=user_id,
           )

       def to_frontend_dict(self) -> Dict[str, Any]:
           """Convert to frontend-compatible dictionary with camelCase keys."""
           return self.model_dump(by_alias=True, exclude_none=True)
   ```

3. **Create state module init (`agents/state/__init__.py`):**
   ```python
   """Dashboard State Module."""
   from .dashboard_state import (
       DashboardState,
       WidgetsState,
       ProjectStatusState,
       MetricsState,
       MetricEntry,
       ActivityState,
       ActivityEntry,
       AlertEntry,
       LoadingState,
       ProjectStatus,
       TrendDirection,
       AlertType,
       STATE_VERSION,
   )

   __all__ = [
       "DashboardState",
       "WidgetsState",
       "ProjectStatusState",
       "MetricsState",
       "MetricEntry",
       "ActivityState",
       "ActivityEntry",
       "AlertEntry",
       "LoadingState",
       "ProjectStatus",
       "TrendDirection",
       "AlertType",
       "STATE_VERSION",
   ]
   ```

4. **Add state constants to dm_constants.py:**
   ```python
   # Add to agents/constants/dm_constants.py

   class STATE:
       """Shared state constants for DM-04+."""
       VERSION = 1
       # State update debounce to avoid flooding frontend
       UPDATE_DEBOUNCE_MS = 100
       # Maximum state size before compression
       MAX_STATE_SIZE_BYTES = 1024 * 1024  # 1MB
       # Redis key prefix for state persistence
       REDIS_KEY_PREFIX = "dashboard:state:"
       # State TTL in Redis (24 hours)
       REDIS_TTL_SECONDS = 86400
       # Maximum alerts to keep in state
       MAX_ALERTS = 50
       # Maximum activities to keep in state
       MAX_ACTIVITIES = 100
   ```

**Files to Create:**
- `apps/web/src/lib/state/dashboard-state.types.ts`
- `apps/web/src/lib/state/index.ts`
- `agents/state/__init__.py`
- `agents/state/dashboard_state.py`

**Files to Modify:**
- `agents/constants/dm_constants.py`

**Test Requirements:**
- Unit: TypeScript schemas validate correctly (Zod)
- Unit: Python schemas serialize/deserialize (Pydantic)
- Unit: Cross-language schema compatibility
- Unit: State version migrations work

**Definition of Done:**
- [ ] TypeScript schemas defined with Zod validation
- [ ] Python schemas defined with Pydantic
- [ ] Schemas are compatible between TS and Python
- [ ] createInitialDashboardState works in both languages
- [ ] Unit tests pass with >90% coverage

---

### 3.2 Story DM-04.2: Frontend State Subscription (5 points)

**Objective:** Implement frontend state subscription using CopilotKit hooks.

**Implementation Tasks:**

1. **Create dashboard state store (`apps/web/src/lib/state/use-dashboard-state.ts`):**
   ```typescript
   /**
    * Dashboard State Store
    *
    * Zustand store for managing dashboard shared state with CopilotKit integration.
    * Subscribes to agent state updates via useCoAgentStateRender and provides
    * optimistic updates for local interactions.
    *
    * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
    * Epic: DM-04 | Story: DM-04.2
    */
   import { create } from 'zustand';
   import { subscribeWithSelector } from 'zustand/middleware';
   import {
     DashboardState,
     DashboardStateUpdate,
     createInitialDashboardState,
     validateDashboardState,
     ProjectStatusState,
     MetricsState,
     ActivityState,
     AlertEntry,
   } from './dashboard-state.types';

   interface DashboardStateStore extends DashboardState {
     // Actions
     setFullState: (state: DashboardState) => void;
     updateState: (update: DashboardStateUpdate) => void;
     setActiveProject: (projectId: string | null) => void;

     // Widget-specific setters
     setProjectStatus: (status: ProjectStatusState | null) => void;
     setMetrics: (metrics: MetricsState | null) => void;
     setActivity: (activity: ActivityState | null) => void;
     addAlert: (alert: AlertEntry) => void;
     dismissAlert: (alertId: string) => void;
     clearAlerts: () => void;

     // Loading state
     setLoading: (isLoading: boolean, agents?: string[]) => void;

     // Error state
     setError: (agentId: string, error: string | null) => void;
     clearErrors: () => void;

     // Reset
     reset: () => void;
   }

   export const useDashboardState = create<DashboardStateStore>()(
     subscribeWithSelector((set, get) => ({
       // Initial state
       ...createInitialDashboardState(),

       // Set full state (from agent)
       setFullState: (state) => {
         const validated = validateDashboardState(state);
         if (validated) {
           set(validated);
         }
       },

       // Partial update
       updateState: (update) => {
         set((current) => ({
           ...current,
           ...update,
           timestamp: Date.now(),
           widgets: update.widgets
             ? { ...current.widgets, ...update.widgets }
             : current.widgets,
           loading: update.loading
             ? { ...current.loading, ...update.loading }
             : current.loading,
           errors: update.errors
             ? { ...current.errors, ...update.errors }
             : current.errors,
         }));
       },

       // Set active project
       setActiveProject: (projectId) => {
         set({ activeProject: projectId, timestamp: Date.now() });
       },

       // Widget setters
       setProjectStatus: (status) => {
         set((state) => ({
           timestamp: Date.now(),
           widgets: {
             ...state.widgets,
             projectStatus: status,
           },
         }));
       },

       setMetrics: (metrics) => {
         set((state) => ({
           timestamp: Date.now(),
           widgets: {
             ...state.widgets,
             metrics,
           },
         }));
       },

       setActivity: (activity) => {
         set((state) => ({
           timestamp: Date.now(),
           widgets: {
             ...state.widgets,
             activity,
           },
         }));
       },

       addAlert: (alert) => {
         set((state) => ({
           timestamp: Date.now(),
           widgets: {
             ...state.widgets,
             alerts: [alert, ...state.widgets.alerts].slice(0, 50), // Keep max 50
           },
         }));
       },

       dismissAlert: (alertId) => {
         set((state) => ({
           timestamp: Date.now(),
           widgets: {
             ...state.widgets,
             alerts: state.widgets.alerts.map((a) =>
               a.id === alertId ? { ...a, dismissed: true } : a
             ),
           },
         }));
       },

       clearAlerts: () => {
         set((state) => ({
           timestamp: Date.now(),
           widgets: {
             ...state.widgets,
             alerts: [],
           },
         }));
       },

       // Loading state
       setLoading: (isLoading, agents = []) => {
         set((state) => ({
           loading: {
             isLoading,
             loadingAgents: agents,
             startedAt: isLoading ? Date.now() : undefined,
           },
         }));
       },

       // Error state
       setError: (agentId, error) => {
         set((state) => {
           const errors = { ...state.errors };
           if (error === null) {
             delete errors[agentId];
           } else {
             errors[agentId] = error;
           }
           return { errors, timestamp: Date.now() };
         });
       },

       clearErrors: () => {
         set({ errors: {}, timestamp: Date.now() });
       },

       // Reset to initial state
       reset: () => {
         set(createInitialDashboardState());
       },
     }))
   );

   // Selector hooks for performance
   export const useProjectStatus = () =>
     useDashboardState((state) => state.widgets.projectStatus);

   export const useMetrics = () =>
     useDashboardState((state) => state.widgets.metrics);

   export const useActivity = () =>
     useDashboardState((state) => state.widgets.activity);

   export const useAlerts = () =>
     useDashboardState((state) => state.widgets.alerts.filter((a) => !a.dismissed));

   export const useIsLoading = () =>
     useDashboardState((state) => state.loading.isLoading);

   export const useErrors = () =>
     useDashboardState((state) => state.errors);
   ```

2. **Create CopilotKit state bridge (`apps/web/src/lib/state/use-agent-state-sync.ts`):**
   ```typescript
   /**
    * Agent State Sync Hook
    *
    * Bridges CopilotKit's useCoAgentStateRender with our Zustand store.
    * Automatically syncs agent state emissions to the dashboard state.
    *
    * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
    * Epic: DM-04 | Story: DM-04.2
    */
   'use client';

   import { useEffect, useCallback, useRef } from 'react';
   import { useCoAgentStateRender } from '@copilotkit/react-core';
   import { useDashboardState } from './use-dashboard-state';
   import { validateDashboardState, DashboardState } from './dashboard-state.types';

   // Agent name for state subscription
   const DASHBOARD_AGENT_NAME = 'dashboard_gateway';

   // Debounce interval for state updates (ms)
   const UPDATE_DEBOUNCE_MS = 100;

   interface UseAgentStateSyncOptions {
     /** Enable debug logging */
     debug?: boolean;
     /** Custom debounce interval */
     debounceMs?: number;
   }

   /**
    * Hook to sync agent state with dashboard store.
    *
    * Usage:
    *   function DashboardPage() {
    *     useAgentStateSync();
    *     // Dashboard state is now automatically synced
    *     return <DashboardContent />;
    *   }
    */
   export function useAgentStateSync(options: UseAgentStateSyncOptions = {}) {
     const { debug = false, debounceMs = UPDATE_DEBOUNCE_MS } = options;

     const setFullState = useDashboardState((s) => s.setFullState);
     const updateState = useDashboardState((s) => s.updateState);
     const setLoading = useDashboardState((s) => s.setLoading);

     // Debounce ref
     const debounceTimer = useRef<NodeJS.Timeout | null>(null);
     const lastState = useRef<DashboardState | null>(null);

     // State update handler with debouncing
     const handleStateUpdate = useCallback(
       (newState: unknown) => {
         if (debug) {
           console.log('[AgentStateSync] Received state update:', newState);
         }

         // Validate incoming state
         const validated = validateDashboardState(newState);
         if (!validated) {
           console.warn('[AgentStateSync] Invalid state received, ignoring');
           return;
         }

         // Debounce rapid updates
         if (debounceTimer.current) {
           clearTimeout(debounceTimer.current);
         }

         debounceTimer.current = setTimeout(() => {
           // Check if state actually changed
           if (
             lastState.current &&
             validated.timestamp <= lastState.current.timestamp
           ) {
             if (debug) {
               console.log('[AgentStateSync] Skipping stale state update');
             }
             return;
           }

           lastState.current = validated;
           setFullState(validated);

           if (debug) {
             console.log('[AgentStateSync] State updated:', validated.timestamp);
           }
         }, debounceMs);
       },
       [setFullState, debug, debounceMs]
     );

     // Subscribe to agent state via CopilotKit
     useCoAgentStateRender({
       name: DASHBOARD_AGENT_NAME,
       render: ({ state, status }) => {
         // Handle loading state
         if (status === 'inProgress') {
           setLoading(true, ['dashboard_gateway']);
         } else {
           setLoading(false);
         }

         // Handle state updates
         if (state) {
           handleStateUpdate(state);
         }

         // This hook doesn't render anything - it just syncs state
         return null;
       },
     });

     // Cleanup debounce timer on unmount
     useEffect(() => {
       return () => {
         if (debounceTimer.current) {
           clearTimeout(debounceTimer.current);
         }
       };
     }, []);
   }

   /**
    * Hook to render a component based on agent state.
    *
    * This is a convenience wrapper that combines state sync with rendering.
    */
   export function useAgentStateWidget<T>(
     selector: (state: DashboardState) => T
   ): T | null {
     useAgentStateSync();
     return useDashboardState(selector);
   }
   ```

3. **Update state module exports (`apps/web/src/lib/state/index.ts`):**
   ```typescript
   /**
    * State Management Module
    *
    * Exports for dashboard state management with CopilotKit integration.
    */

   // Types
   export * from './dashboard-state.types';

   // Zustand store
   export {
     useDashboardState,
     useProjectStatus,
     useMetrics,
     useActivity,
     useAlerts,
     useIsLoading,
     useErrors,
   } from './use-dashboard-state';

   // Agent sync
   export { useAgentStateSync, useAgentStateWidget } from './use-agent-state-sync';
   ```

**Files to Create:**
- `apps/web/src/lib/state/use-dashboard-state.ts`
- `apps/web/src/lib/state/use-agent-state-sync.ts`
- `apps/web/src/lib/state/index.ts` (update)

**Test Requirements:**
- Unit: Zustand store actions work correctly
- Unit: State validation rejects invalid data
- Unit: Debouncing prevents rapid updates
- Integration: CopilotKit state sync works
- Integration: Selectors return correct data

**Definition of Done:**
- [ ] Zustand store manages dashboard state
- [ ] useAgentStateSync bridges CopilotKit to Zustand
- [ ] Debouncing prevents UI thrashing
- [ ] Selector hooks enable efficient re-renders
- [ ] Unit tests pass

---

### 3.3 Story DM-04.3: Agent State Emissions (5 points)

**Objective:** Enable Dashboard Gateway agent to emit state updates.

**Implementation Tasks:**

1. **Create state emitter (`agents/gateway/state_emitter.py`):**
   ```python
   """
   Dashboard Gateway State Emitter

   Manages agent state and emits updates via AG-UI protocol.
   The emitted state is automatically synchronized to the frontend
   via CopilotKit's useCoAgentStateRender.

   @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
   Epic: DM-04 | Story: DM-04.3
   """
   import asyncio
   import logging
   import time
   from typing import Any, Dict, List, Optional, Callable

   from state import (
       DashboardState,
       WidgetsState,
       ProjectStatusState,
       MetricsState,
       ActivityState,
       AlertEntry,
       LoadingState,
       ProjectStatus,
       AlertType,
   )
   from constants.dm_constants import DMConstants

   logger = logging.getLogger(__name__)


   class DashboardStateEmitter:
       """
       Manages dashboard state and emits updates to the frontend.

       The emitter maintains the current state and provides methods
       to update individual widgets. Each update triggers a state
       emission via the agent's state callback.

       Usage:
           emitter = DashboardStateEmitter(
               on_state_change=agent.emit_state
           )
           await emitter.set_project_status(status_data)
       """

       def __init__(
           self,
           on_state_change: Callable[[Dict[str, Any]], None],
           workspace_id: Optional[str] = None,
           user_id: Optional[str] = None,
       ):
           """
           Initialize state emitter.

           Args:
               on_state_change: Callback to emit state to AG-UI
               workspace_id: Current workspace context
               user_id: Current user context
           """
           self._on_state_change = on_state_change
           self._state = DashboardState.create_initial(
               workspace_id=workspace_id,
               user_id=user_id,
           )
           self._debounce_task: Optional[asyncio.Task] = None
           self._pending_update = False

       @property
       def state(self) -> DashboardState:
           """Get current state (read-only)."""
           return self._state

       async def _emit_debounced(self) -> None:
           """Emit state with debouncing to prevent flooding."""
           await asyncio.sleep(DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000)

           if self._pending_update:
               self._pending_update = False
               self._emit()

       def _emit(self) -> None:
           """Emit current state to frontend."""
           state_dict = self._state.to_frontend_dict()
           logger.debug(f"Emitting dashboard state: timestamp={self._state.timestamp}")
           self._on_state_change(state_dict)

       def _schedule_emit(self) -> None:
           """Schedule a debounced state emission."""
           self._pending_update = True
           self._state.timestamp = int(time.time() * 1000)

           if self._debounce_task is None or self._debounce_task.done():
               self._debounce_task = asyncio.create_task(self._emit_debounced())

       async def emit_now(self) -> None:
           """Force immediate state emission (bypass debounce)."""
           if self._debounce_task and not self._debounce_task.done():
               self._debounce_task.cancel()
           self._state.timestamp = int(time.time() * 1000)
           self._emit()

       # =========================================================================
       # LOADING STATE
       # =========================================================================

       async def set_loading(
           self,
           is_loading: bool,
           agents: Optional[List[str]] = None,
       ) -> None:
           """
           Update loading state.

           Args:
               is_loading: Whether loading is in progress
               agents: List of agents currently being queried
           """
           self._state.loading = LoadingState(
               is_loading=is_loading,
               loading_agents=agents or [],
               started_at=int(time.time() * 1000) if is_loading else None,
           )
           await self.emit_now()  # Loading state emits immediately

       # =========================================================================
       # ERROR STATE
       # =========================================================================

       async def set_error(self, agent_id: str, error: Optional[str]) -> None:
           """
           Set or clear an agent error.

           Args:
               agent_id: Agent that experienced the error
               error: Error message, or None to clear
           """
           if error:
               self._state.errors[agent_id] = error
           elif agent_id in self._state.errors:
               del self._state.errors[agent_id]
           self._schedule_emit()

       async def clear_errors(self) -> None:
           """Clear all errors."""
           self._state.errors = {}
           self._schedule_emit()

       # =========================================================================
       # WIDGET STATE
       # =========================================================================

       async def set_active_project(self, project_id: Optional[str]) -> None:
           """Set the active/focused project."""
           self._state.active_project = project_id
           self._schedule_emit()

       async def set_project_status(
           self,
           project_id: str,
           name: str,
           status: ProjectStatus,
           progress: int,
           tasks_completed: int = 0,
           tasks_total: int = 0,
           summary: Optional[str] = None,
       ) -> None:
           """
           Update project status widget state.

           Args:
               project_id: Project identifier
               name: Project display name
               status: Current status (on-track, at-risk, etc.)
               progress: Progress percentage (0-100)
               tasks_completed: Number of completed tasks
               tasks_total: Total number of tasks
               summary: Optional text summary
           """
           self._state.widgets.project_status = ProjectStatusState(
               project_id=project_id,
               name=name,
               status=status,
               progress=progress,
               tasks_completed=tasks_completed,
               tasks_total=tasks_total,
               last_updated=int(time.time() * 1000),
               summary=summary,
           )
           self._schedule_emit()

       async def set_metrics(
           self,
           metrics: List[Dict[str, Any]],
           title: str = "Key Metrics",
           period: Optional[str] = None,
       ) -> None:
           """
           Update metrics widget state.

           Args:
               metrics: List of metric entries
               title: Widget title
               period: Time period description
           """
           from state import MetricEntry

           metric_entries = [MetricEntry(**m) for m in metrics]
           self._state.widgets.metrics = MetricsState(
               title=title,
               metrics=metric_entries,
               period=period,
               last_updated=int(time.time() * 1000),
           )
           self._schedule_emit()

       async def set_activity(
           self,
           activities: List[Dict[str, Any]],
           has_more: bool = False,
       ) -> None:
           """
           Update activity widget state.

           Args:
               activities: List of activity entries
               has_more: Whether there are more activities available
           """
           from state import ActivityEntry

           activity_entries = [ActivityEntry(**a) for a in activities]
           self._state.widgets.activity = ActivityState(
               activities=activity_entries,
               has_more=has_more,
               last_updated=int(time.time() * 1000),
           )
           self._schedule_emit()

       async def add_alert(
           self,
           alert_type: AlertType,
           title: str,
           message: str,
           alert_id: Optional[str] = None,
           dismissable: bool = True,
           action_label: Optional[str] = None,
           action_url: Optional[str] = None,
       ) -> str:
           """
           Add an alert to the state.

           Args:
               alert_type: Alert severity type
               title: Alert title
               message: Alert message
               alert_id: Optional custom ID (auto-generated if not provided)
               dismissable: Whether alert can be dismissed
               action_label: Optional action button label
               action_url: Optional action URL

           Returns:
               The alert ID
           """
           import uuid

           aid = alert_id or str(uuid.uuid4())
           alert = AlertEntry(
               id=aid,
               type=alert_type,
               title=title,
               message=message,
               timestamp=int(time.time() * 1000),
               dismissable=dismissable,
               action_label=action_label,
               action_url=action_url,
           )

           # Prepend alert and limit total
           self._state.widgets.alerts = [alert, *self._state.widgets.alerts][
               : DMConstants.STATE.MAX_ALERTS
           ]
           self._schedule_emit()

           return aid

       async def dismiss_alert(self, alert_id: str) -> None:
           """Mark an alert as dismissed."""
           for alert in self._state.widgets.alerts:
               if alert.id == alert_id:
                   alert.dismissed = True
                   break
           self._schedule_emit()

       async def clear_alerts(self) -> None:
           """Clear all alerts."""
           self._state.widgets.alerts = []
           self._schedule_emit()

       # =========================================================================
       # BULK UPDATES
       # =========================================================================

       async def update_from_gather(
           self,
           navi_result: Optional[Dict[str, Any]],
           pulse_result: Optional[Dict[str, Any]],
           herald_result: Optional[Dict[str, Any]],
           errors: Optional[Dict[str, str]] = None,
       ) -> None:
           """
           Update state from gather_dashboard_data results.

           Efficiently updates all widgets from a parallel agent gather.

           Args:
               navi_result: Result from Navi agent
               pulse_result: Result from Pulse agent
               herald_result: Result from Herald agent
               errors: Any errors from failed agent calls
           """
           # Update errors
           if errors:
               self._state.errors = errors
           else:
               self._state.errors = {}

           # Update project status from Navi
           if navi_result and "content" in navi_result:
               # Parse Navi response into ProjectStatusState
               # This is a simplified example - actual parsing depends on Navi's format
               self._state.widgets.project_status = self._parse_navi_response(
                   navi_result
               )

           # Update metrics from Pulse
           if pulse_result and "metrics" in pulse_result:
               self._state.widgets.metrics = self._parse_pulse_response(pulse_result)

           # Update activity from Herald
           if herald_result and "activities" in herald_result:
               self._state.widgets.activity = self._parse_herald_response(herald_result)

           # Emit all changes at once
           await self.emit_now()

       def _parse_navi_response(
           self, result: Dict[str, Any]
       ) -> Optional[ProjectStatusState]:
           """Parse Navi response into ProjectStatusState."""
           try:
               # Extract relevant fields from Navi response
               artifacts = result.get("artifacts", [])
               if artifacts and isinstance(artifacts[0], dict):
                   data = artifacts[0]
                   return ProjectStatusState(
                       project_id=data.get("project_id", "unknown"),
                       name=data.get("name", "Project"),
                       status=ProjectStatus(data.get("status", "on-track")),
                       progress=int(data.get("progress", 0)),
                       tasks_completed=int(data.get("tasks_completed", 0)),
                       tasks_total=int(data.get("tasks_total", 0)),
                       last_updated=int(time.time() * 1000),
                       summary=result.get("content"),
                   )
           except Exception as e:
               logger.warning(f"Failed to parse Navi response: {e}")
           return None

       def _parse_pulse_response(
           self, result: Dict[str, Any]
       ) -> Optional[MetricsState]:
           """Parse Pulse response into MetricsState."""
           try:
               from state import MetricEntry

               metrics_data = result.get("metrics", [])
               metrics = [MetricEntry(**m) for m in metrics_data if isinstance(m, dict)]
               return MetricsState(
                   title="Health Metrics",
                   metrics=metrics,
                   last_updated=int(time.time() * 1000),
               )
           except Exception as e:
               logger.warning(f"Failed to parse Pulse response: {e}")
           return None

       def _parse_herald_response(
           self, result: Dict[str, Any]
       ) -> Optional[ActivityState]:
           """Parse Herald response into ActivityState."""
           try:
               from state import ActivityEntry

               activities_data = result.get("activities", [])
               activities = [
                   ActivityEntry(**a) for a in activities_data if isinstance(a, dict)
               ]
               return ActivityState(
                   activities=activities,
                   has_more=len(activities) >= 10,
                   last_updated=int(time.time() * 1000),
               )
           except Exception as e:
               logger.warning(f"Failed to parse Herald response: {e}")
           return None


   # Factory function for use in agent context
   def create_state_emitter(
       on_state_change: Callable[[Dict[str, Any]], None],
       workspace_id: Optional[str] = None,
       user_id: Optional[str] = None,
   ) -> DashboardStateEmitter:
       """
       Create a state emitter for the Dashboard Gateway agent.

       Args:
           on_state_change: Callback to emit state to AG-UI
           workspace_id: Current workspace context
           user_id: Current user context

       Returns:
           Configured DashboardStateEmitter
       """
       return DashboardStateEmitter(
           on_state_change=on_state_change,
           workspace_id=workspace_id,
           user_id=user_id,
       )
   ```

2. **Update Dashboard Gateway agent to use state emitter (`agents/gateway/agent.py`):**
   ```python
   # Add to agents/gateway/agent.py

   # Import state emitter
   from .state_emitter import DashboardStateEmitter, create_state_emitter

   # Update create_dashboard_gateway_agent function to include state support
   def create_dashboard_gateway_agent(
       workspace_id: Optional[str] = None,
       model_id: Optional[str] = None,
       user_id: Optional[str] = None,
       state_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
   ):
       """
       Create a Dashboard Gateway agent instance with state emission support.

       Args:
           workspace_id: Workspace/tenant identifier
           model_id: Model identifier override
           user_id: User identifier for personalization
           state_callback: Callback for state emissions (AG-UI)
       """
       # ... existing code ...

       # Create state emitter if callback provided
       state_emitter = None
       if state_callback:
           state_emitter = create_state_emitter(
               on_state_change=state_callback,
               workspace_id=workspace_id,
               user_id=user_id,
           )

       # Store emitter on agent for tool access
       if AGNO_AVAILABLE:
           agent = Agent(
               # ... existing config ...
           )
           agent._state_emitter = state_emitter
       else:
           agent = _create_mock_agent(workspace_id, model_id, user_id)
           agent._state_emitter = state_emitter

       return agent
   ```

3. **Update tools to emit state (`agents/gateway/tools.py`):**
   ```python
   # Add state emission to gather_dashboard_data

   async def gather_dashboard_data(
       project_id: Optional[str] = None,
       agent_context: Optional[Dict[str, Any]] = None,
   ) -> Dict[str, Any]:
       """
       Gather comprehensive dashboard data and emit state update.

       In addition to returning data for tool calls, this function
       also emits state updates for real-time widget synchronization.
       """
       from a2a import get_a2a_client

       client = await get_a2a_client()

       # Get state emitter from agent context if available
       state_emitter = agent_context.get("_state_emitter") if agent_context else None

       # Set loading state
       if state_emitter:
           await state_emitter.set_loading(True, ["navi", "pulse", "herald"])

       # ... existing parallel calls code ...

       results = await client.call_agents_parallel(calls)

       # Build response
       response = {
           "project_id": project_id,
           "navi": None,
           "pulse": None,
           "herald": None,
           "errors": {},
           "duration_ms": max_duration,
       }

       # Process results
       for agent_id, result in results.items():
           if result.success:
               response[agent_id] = {
                   "content": result.content,
                   "artifacts": result.artifacts,
                   "tool_calls": result.tool_calls,
               }
           else:
               response["errors"][agent_id] = result.error

       # Emit state update
       if state_emitter:
           await state_emitter.update_from_gather(
               navi_result=response.get("navi"),
               pulse_result=response.get("pulse"),
               herald_result=response.get("herald"),
               errors=response.get("errors"),
           )
           await state_emitter.set_loading(False)

       return response
   ```

**Files to Create:**
- `agents/gateway/state_emitter.py`

**Files to Modify:**
- `agents/gateway/agent.py`
- `agents/gateway/tools.py`

**Test Requirements:**
- Unit: StateEmitter updates state correctly
- Unit: Debouncing works for rapid updates
- Unit: emit_now bypasses debounce
- Integration: State emissions reach frontend
- Integration: Loading states emit immediately

**Definition of Done:**
- [ ] DashboardStateEmitter manages state
- [ ] State emissions sent via AG-UI callback
- [ ] Debouncing prevents excessive updates
- [ ] Tools emit state alongside tool calls
- [ ] Unit tests pass

---

### 3.4 Story DM-04.4: Real-Time Widget Updates (5 points)

**Objective:** Widgets auto-update when agent state changes.

**Implementation Tasks:**

1. **Create state-driven widget wrapper (`apps/web/src/components/widgets/StateWidget.tsx`):**
   ```typescript
   /**
    * State-Driven Widget Wrapper
    *
    * Higher-order component that connects widgets to the dashboard state store.
    * Widgets automatically re-render when their corresponding state updates.
    *
    * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
    * Epic: DM-04 | Story: DM-04.4
    */
   'use client';

   import { ComponentType, memo } from 'react';
   import {
     useProjectStatus,
     useMetrics,
     useActivity,
     useAlerts,
     useIsLoading,
     useErrors,
   } from '@/lib/state';
   import { LoadingWidget } from './LoadingWidget';
   import { ErrorWidget } from './ErrorWidget';

   /**
    * State-connected Project Status Widget
    */
   export function StateProjectStatusWidget() {
     const status = useProjectStatus();
     const isLoading = useIsLoading();
     const errors = useErrors();

     if (isLoading && !status) {
       return <LoadingWidget type="ProjectStatus" />;
     }

     if (errors['navi'] && !status) {
       return <ErrorWidget message={errors['navi']} widgetType="ProjectStatus" />;
     }

     if (!status) {
       return null; // No data yet
     }

     // Dynamically import to avoid circular dependency
     const { ProjectStatusWidget } = require('./ProjectStatusWidget');

     return (
       <ProjectStatusWidget
         project_id={status.projectId}
         name={status.name}
         status={status.status}
         progress={status.progress}
         tasks_completed={status.tasksCompleted}
         tasks_total={status.tasksTotal}
         content={status.summary}
       />
     );
   }

   /**
    * State-connected Metrics Widget
    */
   export function StateMetricsWidget() {
     const metrics = useMetrics();
     const isLoading = useIsLoading();
     const errors = useErrors();

     if (isLoading && !metrics) {
       return <LoadingWidget type="Metrics" />;
     }

     if (errors['pulse'] && !metrics) {
       return <ErrorWidget message={errors['pulse']} widgetType="Metrics" />;
     }

     if (!metrics) {
       return null;
     }

     const { MetricsWidget } = require('./MetricsWidget');

     return (
       <MetricsWidget
         title={metrics.title}
         metrics={metrics.metrics}
       />
     );
   }

   /**
    * State-connected Activity Widget
    */
   export function StateActivityWidget() {
     const activity = useActivity();
     const isLoading = useIsLoading();
     const errors = useErrors();

     if (isLoading && !activity) {
       return <LoadingWidget type="TeamActivity" />;
     }

     if (errors['herald'] && !activity) {
       return <ErrorWidget message={errors['herald']} widgetType="TeamActivity" />;
     }

     if (!activity) {
       return null;
     }

     const { TeamActivityWidget } = require('./TeamActivityWidget');

     return (
       <TeamActivityWidget
         activities={activity.activities.map((a) => ({
           user: a.user,
           action: a.action,
           target: a.target,
           time: formatTimestamp(a.timestamp),
         }))}
       />
     );
   }

   /**
    * State-connected Alerts Widget
    */
   export function StateAlertsWidget() {
     const alerts = useAlerts();

     if (alerts.length === 0) {
       return null;
     }

     const { AlertWidget } = require('./AlertWidget');

     return (
       <div className="space-y-2">
         {alerts.map((alert) => (
           <AlertWidget
             key={alert.id}
             type={alert.type}
             title={alert.title}
             message={alert.message}
           />
         ))}
       </div>
     );
   }

   // Helper to format timestamp
   function formatTimestamp(ts: number): string {
     const date = new Date(ts);
     const now = new Date();
     const diff = now.getTime() - date.getTime();

     if (diff < 60000) return 'Just now';
     if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
     if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
     return date.toLocaleDateString();
   }
   ```

2. **Update DashboardSlots to support both modes (`apps/web/src/components/slots/DashboardSlots.tsx`):**
   ```typescript
   /**
    * Dashboard Slots - Dual-Mode Widget Rendering
    *
    * Supports both:
    * 1. Tool-call rendering (useRenderToolCall) - for explicit agent responses
    * 2. State-driven rendering (state widgets) - for real-time updates
    *
    * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
    * Epic: DM-04 | Story: DM-04.4
    */
   'use client';

   import { useRenderToolCall } from '@copilotkit/react-core';
   import { useAgentStateSync } from '@/lib/state';
   import {
     StateProjectStatusWidget,
     StateMetricsWidget,
     StateActivityWidget,
     StateAlertsWidget,
   } from '@/components/widgets/StateWidget';
   import { ProjectStatusWidget } from '@/components/widgets/ProjectStatusWidget';
   import { MetricsWidget } from '@/components/widgets/MetricsWidget';
   import { AlertWidget } from '@/components/widgets/AlertWidget';
   import { TeamActivityWidget } from '@/components/widgets/TeamActivityWidget';
   import { LoadingWidget } from '@/components/widgets/LoadingWidget';
   import { ErrorWidget } from '@/components/widgets/ErrorWidget';

   // Widget registry for tool-call rendering
   const WIDGET_REGISTRY: Record<string, React.ComponentType<any>> = {
     ProjectStatus: ProjectStatusWidget,
     TaskList: () => <div>TaskList (coming soon)</div>,
     Metrics: MetricsWidget,
     Alert: AlertWidget,
     TeamActivity: TeamActivityWidget,
     KanbanBoard: () => <div>Kanban (coming soon)</div>,
     GanttChart: () => <div>Gantt (coming soon)</div>,
     BurndownChart: () => <div>Burndown (coming soon)</div>,
   };

   interface DashboardSlotsProps {
     /**
      * Rendering mode:
      * - 'hybrid' (default): Both tool calls AND state updates render widgets
      * - 'tool-only': Only render from tool calls (DM-03 behavior)
      * - 'state-only': Only render from state updates
      */
     mode?: 'hybrid' | 'tool-only' | 'state-only';
   }

   export function DashboardSlots({ mode = 'hybrid' }: DashboardSlotsProps) {
     // Subscribe to agent state updates
     useAgentStateSync({ debug: process.env.NODE_ENV === 'development' });

     // Tool-call rendering (for explicit agent responses)
     useRenderToolCall({
       name: 'render_dashboard_widget',
       description: 'Render a widget on the user\'s dashboard',
       parameters: [
         { name: 'widget_type', type: 'string', required: true },
         { name: 'data', type: 'object', required: true },
         { name: 'title', type: 'string', required: false },
       ],
       render: ({ args, status }) => {
         if (mode === 'state-only') {
           return null; // Ignore tool calls in state-only mode
         }

         if (status === 'pending') {
           return <LoadingWidget type={args.widget_type} />;
         }

         const WidgetComponent = WIDGET_REGISTRY[args.widget_type];

         if (!WidgetComponent) {
           return (
             <ErrorWidget
               message={`Unknown widget type: ${args.widget_type}`}
               availableTypes={Object.keys(WIDGET_REGISTRY)}
             />
           );
         }

         if (args.data?.error) {
           return (
             <ErrorWidget
               message={args.data.error}
               widgetType={args.widget_type}
             />
           );
         }

         return (
           <div className="widget-from-tool animate-in fade-in-50 duration-300">
             {args.title && (
               <h3 className="text-sm font-medium text-muted-foreground mb-2">
                 {args.title}
               </h3>
             )}
             <WidgetComponent {...args.data} />
           </div>
         );
       },
     });

     // State-driven widgets (for real-time updates)
     if (mode === 'tool-only') {
       return null;
     }

     return (
       <div className="dashboard-state-widgets space-y-4">
         {/* Alerts always at top */}
         <StateAlertsWidget />

         {/* Main widgets grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <StateProjectStatusWidget />
           <StateMetricsWidget />
           <StateActivityWidget />
         </div>
       </div>
     );
   }
   ```

3. **Create real-time indicator component (`apps/web/src/components/widgets/RealTimeIndicator.tsx`):**
   ```typescript
   /**
    * Real-Time Update Indicator
    *
    * Shows when data was last updated and provides manual refresh.
    */
   'use client';

   import { useDashboardState } from '@/lib/state';
   import { RefreshCw } from 'lucide-react';
   import { Button } from '@/components/ui/button';

   interface RealTimeIndicatorProps {
     onRefresh?: () => void;
   }

   export function RealTimeIndicator({ onRefresh }: RealTimeIndicatorProps) {
     const timestamp = useDashboardState((s) => s.timestamp);
     const isLoading = useDashboardState((s) => s.loading.isLoading);

     const formatLastUpdate = () => {
       if (!timestamp) return 'Not updated';
       const diff = Date.now() - timestamp;
       if (diff < 1000) return 'Just now';
       if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
       if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
       return new Date(timestamp).toLocaleTimeString();
     };

     return (
       <div className="flex items-center gap-2 text-xs text-muted-foreground">
         <span
           className={`h-2 w-2 rounded-full ${
             isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
           }`}
         />
         <span>Last updated: {formatLastUpdate()}</span>
         {onRefresh && (
           <Button
             variant="ghost"
             size="sm"
             onClick={onRefresh}
             disabled={isLoading}
             className="h-6 w-6 p-0"
           >
             <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
           </Button>
         )}
       </div>
     );
   }
   ```

**Files to Create:**
- `apps/web/src/components/widgets/StateWidget.tsx`
- `apps/web/src/components/widgets/RealTimeIndicator.tsx`

**Files to Modify:**
- `apps/web/src/components/slots/DashboardSlots.tsx`
- `apps/web/src/components/widgets/index.ts`

**Test Requirements:**
- Unit: State widgets render with data
- Unit: State widgets show loading/error states
- Integration: Widgets update when state changes
- Integration: Tool calls and state work together
- E2E: Real-time updates visible in UI

**Definition of Done:**
- [ ] State-driven widgets render from store
- [ ] Hybrid mode supports both tool calls and state
- [ ] Loading indicators show during updates
- [ ] Error states display correctly
- [ ] Real-time indicator shows update status

---

### 3.5 Story DM-04.5: State Persistence (6 points)

**Objective:** Persist dashboard state for session continuity.

**Implementation Tasks:**

1. **Create Redis state service (`agents/services/state_persistence.py`):**
   ```python
   """
   Dashboard State Persistence Service

   Persists dashboard state to Redis for session continuity and
   cross-tab synchronization via pub/sub.

   @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
   Epic: DM-04 | Story: DM-04.5
   """
   import asyncio
   import json
   import logging
   from typing import Any, Callable, Dict, Optional

   from constants.dm_constants import DMConstants

   logger = logging.getLogger(__name__)

   # Redis client (lazy initialized)
   _redis_client = None


   async def get_redis_client():
       """Get or create Redis client."""
       global _redis_client
       if _redis_client is None:
           try:
               import redis.asyncio as redis
               from config import get_settings

               settings = get_settings()
               _redis_client = redis.from_url(
                   settings.redis_url,
                   encoding="utf-8",
                   decode_responses=True,
               )
               logger.info("Redis client initialized for state persistence")
           except ImportError:
               logger.warning("redis package not installed, state persistence disabled")
               return None
           except Exception as e:
               logger.error(f"Failed to connect to Redis: {e}")
               return None
       return _redis_client


   def _make_state_key(workspace_id: str, user_id: str) -> str:
       """Generate Redis key for state storage."""
       return f"{DMConstants.STATE.REDIS_KEY_PREFIX}{workspace_id}:{user_id}"


   def _make_channel_key(workspace_id: str, user_id: str) -> str:
       """Generate Redis pub/sub channel key."""
       return f"{DMConstants.STATE.REDIS_KEY_PREFIX}channel:{workspace_id}:{user_id}"


   async def save_state(
       workspace_id: str,
       user_id: str,
       state: Dict[str, Any],
   ) -> bool:
       """
       Save dashboard state to Redis.

       Args:
           workspace_id: Workspace identifier
           user_id: User identifier
           state: Dashboard state dictionary

       Returns:
           True if saved successfully
       """
       client = await get_redis_client()
       if not client:
           return False

       try:
           key = _make_state_key(workspace_id, user_id)
           state_json = json.dumps(state)

           # Check size limit
           if len(state_json) > DMConstants.STATE.MAX_STATE_SIZE_BYTES:
               logger.warning(
                   f"State too large ({len(state_json)} bytes), "
                   f"max is {DMConstants.STATE.MAX_STATE_SIZE_BYTES}"
               )
               return False

           # Save with TTL
           await client.setex(
               key,
               DMConstants.STATE.REDIS_TTL_SECONDS,
               state_json,
           )

           # Publish update for cross-tab sync
           channel = _make_channel_key(workspace_id, user_id)
           await client.publish(channel, state_json)

           logger.debug(f"State saved for {workspace_id}:{user_id}")
           return True

       except Exception as e:
           logger.error(f"Failed to save state: {e}")
           return False


   async def load_state(
       workspace_id: str,
       user_id: str,
   ) -> Optional[Dict[str, Any]]:
       """
       Load dashboard state from Redis.

       Args:
           workspace_id: Workspace identifier
           user_id: User identifier

       Returns:
           Dashboard state dictionary, or None if not found
       """
       client = await get_redis_client()
       if not client:
           return None

       try:
           key = _make_state_key(workspace_id, user_id)
           state_json = await client.get(key)

           if state_json:
               logger.debug(f"State loaded for {workspace_id}:{user_id}")
               return json.loads(state_json)

           return None

       except Exception as e:
           logger.error(f"Failed to load state: {e}")
           return None


   async def delete_state(
       workspace_id: str,
       user_id: str,
   ) -> bool:
       """
       Delete dashboard state from Redis.

       Args:
           workspace_id: Workspace identifier
           user_id: User identifier

       Returns:
           True if deleted successfully
       """
       client = await get_redis_client()
       if not client:
           return False

       try:
           key = _make_state_key(workspace_id, user_id)
           await client.delete(key)
           logger.debug(f"State deleted for {workspace_id}:{user_id}")
           return True

       except Exception as e:
           logger.error(f"Failed to delete state: {e}")
           return False


   async def subscribe_to_state(
       workspace_id: str,
       user_id: str,
       callback: Callable[[Dict[str, Any]], None],
   ):
       """
       Subscribe to state updates via Redis pub/sub.

       Args:
           workspace_id: Workspace identifier
           user_id: User identifier
           callback: Function to call with state updates
       """
       client = await get_redis_client()
       if not client:
           return

       try:
           pubsub = client.pubsub()
           channel = _make_channel_key(workspace_id, user_id)
           await pubsub.subscribe(channel)

           logger.info(f"Subscribed to state updates for {workspace_id}:{user_id}")

           async for message in pubsub.listen():
               if message["type"] == "message":
                   try:
                       state = json.loads(message["data"])
                       callback(state)
                   except json.JSONDecodeError:
                       logger.warning("Invalid JSON in state update")

       except asyncio.CancelledError:
           logger.info("State subscription cancelled")
           await pubsub.unsubscribe(channel)
       except Exception as e:
           logger.error(f"State subscription error: {e}")


   class StatePersistenceService:
       """
       Service for managing dashboard state persistence.

       Provides a higher-level interface for saving, loading, and
       subscribing to state updates.
       """

       def __init__(self, workspace_id: str, user_id: str):
           self.workspace_id = workspace_id
           self.user_id = user_id
           self._subscription_task: Optional[asyncio.Task] = None

       async def save(self, state: Dict[str, Any]) -> bool:
           """Save state to Redis."""
           return await save_state(self.workspace_id, self.user_id, state)

       async def load(self) -> Optional[Dict[str, Any]]:
           """Load state from Redis."""
           return await load_state(self.workspace_id, self.user_id)

       async def delete(self) -> bool:
           """Delete state from Redis."""
           return await delete_state(self.workspace_id, self.user_id)

       async def subscribe(self, callback: Callable[[Dict[str, Any]], None]) -> None:
           """Start subscribing to state updates."""
           self._subscription_task = asyncio.create_task(
               subscribe_to_state(self.workspace_id, self.user_id, callback)
           )

       async def unsubscribe(self) -> None:
           """Stop subscribing to state updates."""
           if self._subscription_task:
               self._subscription_task.cancel()
               try:
                   await self._subscription_task
               except asyncio.CancelledError:
                   pass
               self._subscription_task = None
   ```

2. **Create frontend persistence hook (`apps/web/src/lib/state/use-state-persistence.ts`):**
   ```typescript
   /**
    * State Persistence Hook
    *
    * Persists dashboard state to browser storage for session continuity.
    * Works alongside server-side Redis persistence.
    *
    * @see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
    * Epic: DM-04 | Story: DM-04.5
    */
   'use client';

   import { useEffect, useRef } from 'react';
   import { useDashboardState } from './use-dashboard-state';
   import { DashboardState, validateDashboardState } from './dashboard-state.types';

   const STORAGE_KEY = 'hyvve:dashboard:state';
   const STORAGE_VERSION_KEY = 'hyvve:dashboard:state:version';
   const DEBOUNCE_MS = 1000; // Save at most once per second

   interface UseStatePersistenceOptions {
     /** Enable persistence (default: true) */
     enabled?: boolean;
     /** Storage key override */
     storageKey?: string;
     /** Debounce interval in ms */
     debounceMs?: number;
   }

   /**
    * Hook to persist dashboard state to localStorage.
    *
    * Usage:
    *   function DashboardPage() {
    *     useStatePersistence();
    *     // State is now persisted to localStorage
    *     return <Dashboard />;
    *   }
    */
   export function useStatePersistence(options: UseStatePersistenceOptions = {}) {
     const {
       enabled = true,
       storageKey = STORAGE_KEY,
       debounceMs = DEBOUNCE_MS,
     } = options;

     const state = useDashboardState();
     const setFullState = useDashboardState((s) => s.setFullState);
     const debounceTimer = useRef<NodeJS.Timeout | null>(null);
     const isInitialized = useRef(false);

     // Load persisted state on mount
     useEffect(() => {
       if (!enabled || typeof window === 'undefined') return;

       try {
         const stored = localStorage.getItem(storageKey);
         if (stored) {
           const parsed = JSON.parse(stored);
           const validated = validateDashboardState(parsed);

           if (validated) {
             // Only restore if state is not too old (24 hours)
             const age = Date.now() - validated.timestamp;
             if (age < 24 * 60 * 60 * 1000) {
               setFullState(validated);
               console.log('[StatePersistence] Restored state from localStorage');
             } else {
               localStorage.removeItem(storageKey);
               console.log('[StatePersistence] Cleared stale state');
             }
           }
         }
       } catch (e) {
         console.warn('[StatePersistence] Failed to load state:', e);
         localStorage.removeItem(storageKey);
       }

       isInitialized.current = true;
     }, [enabled, storageKey, setFullState]);

     // Save state changes with debouncing
     useEffect(() => {
       if (!enabled || !isInitialized.current || typeof window === 'undefined') {
         return;
       }

       // Clear existing timer
       if (debounceTimer.current) {
         clearTimeout(debounceTimer.current);
       }

       // Schedule save
       debounceTimer.current = setTimeout(() => {
         try {
           const stateToSave: DashboardState = {
             version: state.version,
             timestamp: state.timestamp,
             activeProject: state.activeProject,
             widgets: state.widgets,
             loading: { isLoading: false, loadingAgents: [] }, // Don't persist loading state
             errors: {}, // Don't persist errors
           };

           localStorage.setItem(storageKey, JSON.stringify(stateToSave));
         } catch (e) {
           console.warn('[StatePersistence] Failed to save state:', e);
         }
       }, debounceMs);

       return () => {
         if (debounceTimer.current) {
           clearTimeout(debounceTimer.current);
         }
       };
     }, [
       enabled,
       storageKey,
       debounceMs,
       state.version,
       state.timestamp,
       state.activeProject,
       state.widgets,
     ]);
   }

   /**
    * Clear persisted state (useful for logout)
    */
   export function clearPersistedState(storageKey = STORAGE_KEY): void {
     if (typeof window !== 'undefined') {
       localStorage.removeItem(storageKey);
       localStorage.removeItem(STORAGE_VERSION_KEY);
     }
   }
   ```

3. **Add persistence API endpoint (`apps/api/src/dashboard/dashboard.controller.ts`):**
   ```typescript
   // This would be added to the NestJS API
   // For brevity, showing the route structure

   /**
    * Dashboard State Persistence Endpoints
    *
    * Provides server-side state persistence via Redis.
    */

   // POST /api/dashboard/state - Save state
   // GET /api/dashboard/state - Load state
   // DELETE /api/dashboard/state - Delete state

   // WebSocket endpoint for real-time state sync
   // WS /api/dashboard/state/subscribe
   ```

4. **Update state store with persistence integration:**
   ```typescript
   // Add to apps/web/src/lib/state/use-dashboard-state.ts

   // Export combined hook that includes persistence
   export function useDashboardStateWithPersistence() {
     useStatePersistence();
     return useDashboardState;
   }
   ```

**Files to Create:**
- `agents/services/state_persistence.py`
- `apps/web/src/lib/state/use-state-persistence.ts`

**Files to Modify:**
- `apps/web/src/lib/state/index.ts`
- `apps/web/src/lib/state/use-dashboard-state.ts`

**Test Requirements:**
- Unit: State saves to Redis correctly
- Unit: State loads from Redis correctly
- Unit: Browser storage persistence works
- Integration: Cross-tab sync via pub/sub
- Integration: State survives page refresh

**Definition of Done:**
- [ ] Redis persistence saves/loads state
- [ ] Browser storage provides offline support
- [ ] State restored on page refresh
- [ ] Cross-tab sync works via pub/sub
- [ ] Stale state detection and cleanup

---

## 4. Constants Reference

Add to `agents/constants/dm_constants.py`:

```python
# Add to DMConstants class

class STATE:
    """Shared state constants for DM-04+."""
    VERSION = 1
    # State update debounce to avoid flooding frontend
    UPDATE_DEBOUNCE_MS = 100
    # Maximum state size before compression
    MAX_STATE_SIZE_BYTES = 1024 * 1024  # 1MB
    # Redis key prefix for state persistence
    REDIS_KEY_PREFIX = "dashboard:state:"
    # State TTL in Redis (24 hours)
    REDIS_TTL_SECONDS = 86400
    # Maximum alerts to keep in state
    MAX_ALERTS = 50
    # Maximum activities to keep in state
    MAX_ACTIVITIES = 100
```

---

## 5. Testing Strategy

### 5.1 Unit Test Requirements

| Story | Test Focus | Minimum Coverage |
|-------|------------|------------------|
| DM-04.1 | Schema validation (Zod, Pydantic) | 90% |
| DM-04.2 | Zustand store actions | 85% |
| DM-04.3 | State emitter methods | 85% |
| DM-04.4 | State widget rendering | 80% |
| DM-04.5 | Redis persistence | 85% |

**Test File Locations:**
```
apps/web/src/lib/state/__tests__/
├── dashboard-state.types.test.ts
├── use-dashboard-state.test.ts
├── use-agent-state-sync.test.tsx
└── use-state-persistence.test.ts

agents/tests/
├── test_state/
│   ├── test_dashboard_state.py
│   ├── test_state_emitter.py
│   └── test_state_persistence.py
```

### 5.2 Integration Test Approach

**Focus Areas:**
1. State flows from agent to frontend via AG-UI
2. State updates trigger widget re-renders
3. Redis persistence survives restarts
4. Cross-tab synchronization works

### 5.3 E2E Test Scenarios

```typescript
// apps/web/e2e/state-sync.spec.ts
test.describe('Real-Time State Sync', () => {
  test('widgets update when agent emits state', async ({ page }) => {
    await page.goto('/dashboard');

    // Trigger data fetch
    await page.getByPlaceholder('Ask about projects').fill('Show workspace overview');
    await page.keyboard.press('Enter');

    // Verify widgets appear (state-driven, not tool call)
    await expect(page.getByTestId('state-project-status')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('state-metrics')).toBeVisible();
    await expect(page.getByTestId('state-activity')).toBeVisible();
  });

  test('state persists across page refresh', async ({ page }) => {
    await page.goto('/dashboard');

    // Load some data
    await page.getByPlaceholder('Ask about projects').fill('Get project status');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('state-project-status')).toBeVisible();

    // Refresh page
    await page.reload();

    // State should be restored
    await expect(page.getByTestId('state-project-status')).toBeVisible({
      timeout: 5000,
    });
  });
});
```

---

## 6. Performance Budgets

| Metric | Target | Critical | Measurement |
|--------|--------|----------|-------------|
| **State Emission Latency** | <50ms | <100ms | Agent to frontend |
| **Widget Re-render** | <16ms | <32ms | React render time |
| **State Size** | <100KB | <1MB | JSON payload |
| **Debounce Interval** | 100ms | 500ms | Update frequency |
| **Redis Round-trip** | <10ms | <50ms | Save/load time |
| **Browser Storage** | <5ms | <20ms | localStorage access |

---

## 7. Risk Mitigation

### 7.1 State Size Risk

**Risk:** Large state payloads may cause performance issues.

**Mitigation:**
- Maximum state size constant (1MB)
- Pagination for activities (max 100)
- Alerts capped at 50
- Schema validation rejects oversized payloads

### 7.2 Stale State Risk

**Risk:** Cached state may become stale.

**Mitigation:**
- Timestamp on every state update
- 24-hour TTL on persisted state
- Real-time indicator shows last update
- Manual refresh option

### 7.3 Synchronization Conflicts

**Risk:** Multiple tabs may have conflicting state.

**Mitigation:**
- Redis pub/sub for cross-tab sync
- Timestamp-based conflict resolution (latest wins)
- Server authoritative for persistence

### 7.4 Schema Evolution

**Risk:** State schema changes may break persistence.

**Mitigation:**
- Version field in state schema
- Migration logic for version changes
- Graceful degradation for incompatible versions

---

## 8. Dependencies & Integrations

### 8.1 DM-03 Dependencies

| Component | Status | Usage in DM-04 |
|-----------|--------|----------------|
| A2A Client | Complete | Used for data gathering |
| Dashboard Gateway | Complete | Extended with state emission |
| DashboardSlots | Complete | Extended with state rendering |
| Widget Components | Complete | Wrapped with state selectors |

### 8.2 External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @copilotkit/react-core | ^1.x | useCoAgentStateRender |
| zustand | ^4.x | State management |
| zod | ^3.x | Schema validation |
| redis | ^7+ | Server-side persistence |
| pydantic | ^2.x | Python schemas |

---

## 9. Success Criteria

| Criteria | Measurement | Target |
|----------|-------------|--------|
| State syncs without tool calls | Agent state -> widget update | Pass |
| Debouncing prevents thrashing | Update frequency | <10/second |
| State persists across refresh | Load persisted state | Pass |
| Schema validation works | Invalid state rejected | Pass |
| Performance targets met | Latency measurements | All pass |
| Cross-tab sync works | Multi-tab test | Pass |

---

## 10. References

- [Epic DM-04 Definition](./epic-dm-04-shared-state.md)
- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [Epic DM-03 Tech Spec](./epic-dm-03-tech-spec.md)
- [CopilotKit State Documentation](https://docs.copilotkit.ai/concepts/coagent-state)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

*Generated: 2025-12-30*
*Epic: DM-04 | Phase: 4 | Stories: 5 | Points: 26*
