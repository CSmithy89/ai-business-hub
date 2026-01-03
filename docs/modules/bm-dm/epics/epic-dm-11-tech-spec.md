# Epic DM-11 Technical Specification: Advanced Features & Optimizations

**Epic:** DM-11
**Phase:** Sprint 3+ - Advanced & Deferred
**Stories:** 15
**Points:** 64
**Dependencies:** DM-07 (Infrastructure Stabilization), DM-08 (Quality & Performance), DM-09 (Observability & Testing)
**Source:** tech-debt-consolidated.md Deferred Items + DM-09 Code Review

---

## Executive Summary

This epic addresses all remaining deferred features, advanced optimizations, and technical debt items from the bm-dm module. It represents the final hardening phase before the Dynamic Module System is considered production-ready.

### Focus Areas

1. **State Durability** - Redis persistence and multi-device synchronization
2. **Performance Optimizations** - Parallel operations for MCP and health checks
3. **Feature Completion** - Remaining widget types and approval cancellation
4. **Efficiency** - Event-driven notifications replacing polling
5. **Developer Experience** - State migrations, compression, and naming clarity
6. **Security Hardening** - Metrics authentication options
7. **CI/CD Improvements** - Visual workflow health checks and accurate token estimation

### Items Addressed (from tech-debt-consolidated.md)

| Category | IDs |
|----------|-----|
| Tech Debt | TD-04, TD-08, TD-15, TD-16, TD-18, TD-19, TD-20 |
| Recommendations | REC-07, REC-10, REC-11, REC-12, REC-15, REC-17, REC-18, REC-19, REC-20, REC-27 |
| DM-09 Code Review | Metrics auth, token estimation, visual workflow |

---

## Architecture Context

### How DM-11 Fits Into Existing System

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   CURRENT STATE (DM-01 to DM-09)         │
                    │                                                          │
                    │   ┌────────────┐    ┌────────────┐    ┌────────────┐    │
                    │   │ CopilotKit │◄──►│ AgentOS    │◄──►│ A2A Mesh   │    │
                    │   │ (Frontend) │    │ (Backend)  │    │ (Agents)   │    │
                    │   └────────────┘    └────────────┘    └────────────┘    │
                    │         │                 │                 │            │
                    │         └─────────────────┼─────────────────┘            │
                    │                           │                              │
                    │                    ┌──────▼──────┐                       │
                    │                    │ localStorage│ ◄── Single device only│
                    │                    │ (DM-04)     │                       │
                    │                    └─────────────┘                       │
                    └─────────────────────────────────────────────────────────┘
                                                │
                                                │ DM-11 ENHANCEMENTS
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DM-11 TARGET STATE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────────────────┐  │
│   │  Browser 1  │◄───────►│   API       │◄───────►│     Browser 2           │  │
│   │  (Desktop)  │   WS    │  Gateway    │   WS    │     (Mobile)            │  │
│   └─────────────┘         └──────┬──────┘         └─────────────────────────┘  │
│          │                       │                          │                   │
│          │                       ▼                          │                   │
│          │              ┌─────────────────┐                 │                   │
│          │              │     Redis       │                 │                   │
│          │              │  (Persistence)  │ ◄── DM-11.1     │                   │
│          │              └─────────────────┘                 │                   │
│          │                       │                          │                   │
│          └───────────────────────┼──────────────────────────┘                   │
│                                  │                                               │
│                           WebSocket Sync ◄── DM-11.2                             │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        AGENT MESH (OPTIMIZED)                            │   │
│   │                                                                          │   │
│   │   ┌────────────┐    ┌────────────┐    ┌────────────┐                    │   │
│   │   │ MCP Server │    │ MCP Server │    │ MCP Server │                    │   │
│   │   │     1      │    │     2      │    │     3      │                    │   │
│   │   └─────┬──────┘    └─────┬──────┘    └─────┬──────┘                    │   │
│   │         │                 │                 │                            │   │
│   │         └────────┬────────┴────────┬────────┘                            │   │
│   │                  │                 │                                     │   │
│   │             PARALLEL         PARALLEL                                    │   │
│   │          Connections       Health Checks                                 │   │
│   │           (DM-11.4)        (DM-11.5)                                     │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        EVENT-DRIVEN APPROVALS (DM-11.6)                  │   │
│   │                                                                          │   │
│   │   Agent Request ──► Create Approval ──► Event Subscription               │   │
│   │                                               │                          │   │
│   │                          ┌───────────────────┘                           │   │
│   │                          ▼                                               │   │
│   │                     Event Fired ──► Agent Notified ──► Continue          │   │
│   │                    (No Polling)                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Integration with Prior Epics

| Epic | What It Provides | How DM-11 Extends It |
|------|------------------|---------------------|
| DM-04 | localStorage state persistence | Redis backend + multi-device sync |
| DM-05 | Approval workflow basics | Cancellation API + event-driven notifications |
| DM-06 | MCP integration | Parallel connections for faster startup |
| DM-03 | Widget rendering pipeline | Remaining widget types (ProjectStatus, TaskList, etc.) |
| DM-08 | Validation, caching, rate limiting | Leverage existing patterns in new endpoints |
| DM-09 | OpenTelemetry, metrics | Metrics auth option, token estimation accuracy |

---

## Story Dependency Graph

```
                                ┌─────────────────┐
                                │   Prerequisites  │
                                │ (DM-07, DM-08,   │
                                │  DM-09 Complete) │
                                └────────┬────────┘
                                         │
           ┌─────────────────────────────┼─────────────────────────────┐
           │                             │                             │
           ▼                             ▼                             ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│     STATE TIER      │      │   PERFORMANCE TIER  │      │    CLEANUP TIER     │
│                     │      │                     │      │                     │
│  DM-11.1            │      │  DM-11.4            │      │  DM-11.10           │
│  Redis Persistence  │      │  Parallel MCP       │      │  ErrorWidget Retry  │
│  (8 pts)            │      │  (3 pts)            │      │  (2 pts)            │
│         │           │      │                     │      │                     │
│         ▼           │      │  DM-11.5            │      │  DM-11.11           │
│  DM-11.2            │      │  Parallel Health    │      │  CopilotKit API Fix │
│  WebSocket Sync     │      │  (3 pts)            │      │  (5 pts)            │
│  (8 pts)            │      │                     │      │                     │
│         │           │      └─────────────────────┘      │  DM-11.12           │
│         ▼           │                                   │  Naming Clarity     │
│  DM-11.8            │                                   │  (2 pts)            │
│  State Migration    │                                   │                     │
│  (5 pts)            │                                   └─────────────────────┘
│         │           │
│         ▼           │
│  DM-11.9            │
│  State Compression  │
│  (3 pts)            │
└─────────────────────┘

           ┌─────────────────────┐      ┌─────────────────────┐
           │   APPROVAL TIER     │      │   OPERATIONS TIER   │
           │                     │      │                     │
           │  DM-11.3            │      │  DM-11.13           │
           │  Cancellation API   │      │  Metrics Auth       │
           │  (5 pts)            │      │  (3 pts)            │
           │         │           │      │                     │
           │         ▼           │      │  DM-11.14           │
           │  DM-11.6            │      │  Token Estimation   │
           │  Event-Driven       │      │  (2 pts)            │
           │  (5 pts)            │      │                     │
           │                     │      │  DM-11.15           │
           └─────────────────────┘      │  Visual Workflow    │
                                        │  Health Check       │
                                        │  (2 pts)            │
┌─────────────────────┐                 │                     │
│   FEATURE TIER      │                 └─────────────────────┘
│                     │
│  DM-11.7            │
│  Remaining Widgets  │
│  (8 pts)            │
│                     │
└─────────────────────┘
```

### Recommended Implementation Order

**Phase 1: Foundation (11 pts)**
1. DM-11.4: Parallel MCP Connections (3 pts) - Quick win, no dependencies
2. DM-11.5: Parallel Health Checks (3 pts) - Similar pattern, builds on above
3. DM-11.10: Wire ErrorWidget Retry (2 pts) - Simple fix
4. DM-11.13: Metrics Endpoint Auth (3 pts) - Security hardening

**Phase 2: State Management (24 pts)**
1. DM-11.1: Redis State Persistence (8 pts) - Core feature
2. DM-11.2: WebSocket State Sync (8 pts) - Depends on DM-11.1
3. DM-11.8: State Migration System (5 pts) - Supports DM-11.1
4. DM-11.9: State Compression (3 pts) - Optimization for DM-11.1

**Phase 3: Approvals & Events (10 pts)**
1. DM-11.3: Approval Cancellation API (5 pts) - Backend first
2. DM-11.6: Event-Driven Approvals (5 pts) - Depends on DM-11.3

**Phase 4: Features & Polish (19 pts)**
1. DM-11.7: Remaining Widget Types (8 pts) - Feature completion
2. DM-11.11: CopilotKit API Drift Fix (5 pts) - Consistency
3. DM-11.12: Naming Complexity (2 pts) - Developer experience
4. DM-11.14: Accurate Token Estimation (2 pts) - Metrics accuracy
5. DM-11.15: Visual Workflow Health Check (2 pts) - CI/CD robustness

---

## Technical Decisions and Trade-offs

### Decision 1: Redis vs PostgreSQL for State Persistence

**Options Considered:**
1. **Redis** - In-memory store with optional persistence
2. **PostgreSQL** - ACID-compliant relational storage
3. **Hybrid** - Redis cache + PostgreSQL for durability

**Decision: Redis with RDB persistence**

**Rationale:**
- Dashboard state is ephemeral (OK to lose on restart)
- Redis already deployed for caching (DM-08) and rate limiting (DM-08)
- Sub-millisecond read latency for state retrieval
- Native TTL support for automatic cleanup
- Lower operational overhead than adding new PostgreSQL tables

**Trade-offs:**
- Loss of state on Redis failure (mitigated by localStorage backup)
- No complex queries on state data (acceptable for dashboard use case)
- Memory limits may constrain number of active users

### Decision 2: WebSocket vs Server-Sent Events for State Sync

**Options Considered:**
1. **WebSocket** - Full duplex communication
2. **SSE** - Server-to-client only
3. **Long Polling** - HTTP fallback

**Decision: WebSocket via Socket.io (existing infrastructure)**

**Rationale:**
- Socket.io already deployed for approval notifications (Foundation Phase)
- Bidirectional communication needed (client → server state updates)
- Built-in reconnection with exponential backoff
- Room-based broadcasting matches multi-device use case
- Redis adapter already configured for horizontal scaling

**Trade-offs:**
- More complex than SSE for read-only sync
- Requires maintaining connection state
- Additional server memory per connection

### Decision 3: Compression Strategy for State

**Options Considered:**
1. **LZ-String** - Browser-compatible, UTF16 encoding
2. **pako (zlib)** - Standard compression, more efficient
3. **LZMA** - High compression, slow

**Decision: LZ-String with compressToUTF16**

**Rationale:**
- Native browser compatibility (no WASM needed)
- UTF16 output works directly with localStorage
- ~60-80% compression ratio for JSON data
- Fast compression/decompression (<10ms for typical state)
- Minimal bundle size (~4KB)

**Trade-offs:**
- Less efficient than pako for very large payloads
- UTF16 encoding adds overhead vs raw bytes

### Decision 4: Event-Driven vs Polling for Approval Notifications

**Options Considered:**
1. **Event-driven** (asyncio.Event) - Zero CPU during wait
2. **Polling** - Simple but wastes CPU cycles
3. **Hybrid** - Events with polling fallback

**Decision: Event-driven with polling fallback**

**Rationale:**
- Events eliminate 1-second polling loops
- Significant CPU reduction during approval waits
- Polling fallback handles edge cases (network disconnection)
- asyncio.Event natively supported in Python

**Trade-offs:**
- More complex state management
- Requires careful cleanup on cancellation/timeout
- Fallback adds code complexity

### Decision 5: tiktoken vs Estimation for Token Counting

**Options Considered:**
1. **tiktoken** - Accurate but adds dependency
2. **char/4 estimation** - Fast but inaccurate
3. **Model-specific tokenizers** - Most accurate, complex

**Decision: tiktoken with fallback to estimation**

**Rationale:**
- tiktoken is the de facto standard for Claude/OpenAI
- ~20-50% error in char/4 estimation for non-ASCII
- Critical for BYOAI quota management
- Lazy loading minimizes startup impact

**Trade-offs:**
- ~2MB binary dependency
- Slightly slower than estimation
- May not match all providers exactly

---

## Story Technical Specifications

### DM-11.1: Redis State Persistence (8 pts)

**Files to Create/Modify:**
```
apps/api/src/modules/dashboard/
├── dashboard-state.controller.ts   # NEW
├── dashboard-state.service.ts      # NEW
└── dto/dashboard-state.dto.ts      # NEW

apps/web/src/
├── lib/api/dashboard-state.ts      # NEW
└── stores/dashboard-store.ts       # MODIFY - Add sync logic
```

**API Contract:**
```typescript
// Save state
POST /api/dashboard/state
Headers: Authorization: Bearer <token>
Body: { version: number, state: DashboardState, checksum?: string }
Response: { success: boolean, serverVersion: number, conflictResolution?: 'server' | 'client' }

// Get state
GET /api/dashboard/state
Headers: Authorization: Bearer <token>
Response: { version: number, state: DashboardState, lastModified: string }

// Delete state
DELETE /api/dashboard/state
Headers: Authorization: Bearer <token>
Response: { success: boolean }
```

**Redis Key Structure:**
```
dashboard:state:{userId}:{workspaceId} -> JSON string
dashboard:state:{userId}:{workspaceId}:version -> integer
dashboard:state:{userId}:{workspaceId}:modified -> timestamp
```

**Conflict Resolution Logic:**
```typescript
async function resolveConflict(
  serverState: StateData,
  clientState: StateData
): Promise<'server' | 'client' | 'merge'> {
  if (serverState.version > clientState.version) {
    return 'server'; // Server wins
  }
  if (clientState.version > serverState.version) {
    return 'client'; // Client wins, push to Redis
  }
  // Same version - compare timestamps
  if (serverState.modifiedAt > clientState.modifiedAt) {
    return 'server';
  }
  return 'client';
}
```

---

### DM-11.2: WebSocket State Synchronization (8 pts)

**Files to Create/Modify:**
```
apps/api/src/modules/realtime/
└── state-sync.gateway.ts           # NEW

apps/web/src/
├── lib/realtime/state-sync-client.ts  # NEW
└── stores/dashboard-store.ts          # MODIFY
```

**WebSocket Events:**
```typescript
// Client → Server
interface StateUpdateEvent {
  type: 'state:update';
  payload: {
    path: string;        // e.g., 'widgets.w1.data'
    value: unknown;
    version: number;
    timestamp: string;
  };
}

// Server → All Clients (same user)
interface StateSyncEvent {
  type: 'state:sync';
  payload: {
    path: string;
    value: unknown;
    version: number;
    sourceDeviceId: string;  // Exclude sender from receiving
  };
}

// On Reconnection
interface StateFullEvent {
  type: 'state:full';
  payload: {
    state: DashboardState;
    version: number;
  };
}
```

**Room Structure:**
```
user:{userId}:state  // All devices for a user
```

---

### DM-11.3: Approval Cancellation API (5 pts)

**Files to Modify:**
```
apps/api/src/modules/approval/
└── approval.controller.ts          # ADD DELETE endpoint

agents/approval/
└── approval_manager.py             # MODIFY - Handle cancellation
```

**API Contract:**
```typescript
DELETE /api/approvals/{approvalId}
Headers: Authorization: Bearer <token>
Body: { reason?: string }
Response: { success: boolean, cancelledAt: string }

// Agent event
{
  type: 'approval:cancelled',
  approvalId: string,
  reason?: string,
  cancelledBy: string
}
```

**Cancellation States:**
- Only `pending` approvals can be cancelled
- `approved`, `rejected`, and `cancelled` are terminal states
- Audit log captures cancellation with reason

---

### DM-11.4: Parallel MCP Server Connections (3 pts)

**Files to Modify:**
```
agents/mcp/
└── mcp_client.py                   # REFACTOR to parallel
```

**Current (Sequential):**
```python
# ~1500ms for 3 servers
for server in mcp_servers:
    await connect(server)
```

**Optimized (Parallel):**
```python
# ~500ms for 3 servers
async def connect_all_mcp_servers(servers: list[MCPServer]) -> dict[str, ConnectionResult]:
    tasks = [connect_with_timeout(server) for server in servers]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    connection_status = {}
    for server, result in zip(servers, results):
        if isinstance(result, Exception):
            logger.error(f"Failed to connect {server.name}: {result}")
            connection_status[server.name] = ConnectionResult(
                success=False,
                error=str(result),
                retry_scheduled=True
            )
        else:
            connection_status[server.name] = result

    return connection_status

async def connect_with_timeout(server: MCPServer, timeout: float = 10.0) -> ConnectionResult:
    try:
        return await asyncio.wait_for(connect(server), timeout=timeout)
    except asyncio.TimeoutError:
        raise MCPConnectionError(f"Connection to {server.name} timed out")
```

---

### DM-11.5: Parallel Health Checks (3 pts)

**Files to Modify:**
```
agents/mesh/
└── mesh_router.py                  # REFACTOR health checks
```

**Optimized Pattern:**
```python
async def check_all_health(agents: list[AgentInfo], timeout: float = 5.0) -> dict[str, HealthStatus]:
    tasks = [
        asyncio.wait_for(check_health(agent), timeout=timeout)
        for agent in agents
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    statuses = {}
    for agent, result in zip(agents, results):
        if isinstance(result, Exception):
            statuses[agent.id] = HealthStatus(
                healthy=False,
                error=str(result),
                checked_at=datetime.utcnow()
            )
        else:
            statuses[agent.id] = result

    return statuses
```

---

### DM-11.6: Event-Driven Approval Notifications (5 pts)

**Files to Modify:**
```
agents/approval/
├── approval_bridge.py              # ADD event subscription
└── events.py                       # NEW - Event handlers
```

**Event-Driven Pattern:**
```python
class ApprovalEventManager:
    def __init__(self):
        self._pending_approvals: dict[str, asyncio.Event] = {}
        self._results: dict[str, ApprovalResult] = {}

    async def wait_for_approval(self, approval_id: str, timeout: float = 300.0) -> ApprovalResult:
        event = asyncio.Event()
        self._pending_approvals[approval_id] = event

        try:
            # Subscribe to approval events
            await self.subscribe_to_approval(approval_id)

            # Wait for event or timeout
            await asyncio.wait_for(event.wait(), timeout=timeout)

            return self._results[approval_id]
        except asyncio.TimeoutError:
            # Fallback to polling if event system fails
            return await self._poll_for_result(approval_id)
        finally:
            self._pending_approvals.pop(approval_id, None)
            self._results.pop(approval_id, None)

    async def on_approval_response(self, approval_id: str, result: ApprovalResult):
        """Called when approval response received via event bus."""
        self._results[approval_id] = result
        if event := self._pending_approvals.get(approval_id):
            event.set()
```

---

### DM-11.7: Remaining Widget Types (8 pts)

**Files to Create:**
```
apps/web/src/components/widgets/
├── ProjectStatusWidget.tsx         # NEW
├── TaskListWidget.tsx              # NEW
├── MetricsWidget.tsx               # NEW
└── AlertWidget.tsx                 # NEW
```

**Widget Specifications:**

| Widget | Purpose | Key Props | Data Source |
|--------|---------|-----------|-------------|
| ProjectStatus | Detailed project health | projectId, showTasks, showTimeline | Navi A2A |
| TaskList | Scrollable task list | filter, sortBy, limit | Navi A2A |
| Metrics | KPI display with trends | metrics[], period, compareWith | Pulse A2A |
| Alert | Alert/notification display | alerts[], dismissible, autoHide | Herald A2A |

**Registry Addition:**
```typescript
// widget-registry.ts
export const WIDGET_COMPONENTS: Record<string, React.ComponentType<WidgetProps>> = {
  // Existing
  task_card: TaskCardWidget,
  vitals: VitalsWidget,
  activity: ActivityWidget,

  // New in DM-11.7
  project_status: ProjectStatusWidget,
  task_list: TaskListWidget,
  metrics: MetricsWidget,
  alert: AlertWidget,
};
```

---

### DM-11.8: State Migration System (5 pts)

**Files to Create:**
```
apps/web/src/lib/storage/
└── state-migrations.ts             # NEW
```

**Migration System:**
```typescript
const migrations: Record<number, (state: unknown) => unknown> = {
  2: (state: any) => ({
    ...state,
    widgets: state.widgets || [],
    version: 2,
  }),
  3: (state: any) => ({
    ...state,
    preferences: {
      ...state.preferences,
      theme: state.preferences?.theme || 'system',
    },
    version: 3,
  }),
  4: (state: any) => ({
    ...state,
    syncSettings: {
      enabled: true,
      conflictResolution: 'server',
    },
    version: 4,
  }),
};

export function migrateState(
  state: unknown,
  fromVersion: number,
  toVersion: number
): { state: unknown; migrationsApplied: number[] } {
  let current = state;
  const applied: number[] = [];

  for (let v = fromVersion + 1; v <= toVersion; v++) {
    if (migrations[v]) {
      try {
        current = migrations[v](current);
        applied.push(v);
      } catch (error) {
        console.error(`Migration v${v} failed:`, error);
        // Return state as-is, don't apply further migrations
        break;
      }
    }
  }

  return { state: current, migrationsApplied: applied };
}
```

---

### DM-11.9: State Compression (3 pts)

**Files to Create:**
```
apps/web/
├── package.json                    # ADD lz-string
└── src/lib/storage/compression.ts  # NEW
```

**Compression Implementation:**
```typescript
import LZString from 'lz-string';

const COMPRESSION_THRESHOLD = 50 * 1024; // 50KB

interface StorageResult {
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

export function saveCompressedState(key: string, state: DashboardState): StorageResult {
  const json = JSON.stringify(state);
  const originalSize = json.length;

  if (originalSize > COMPRESSION_THRESHOLD) {
    const compressed = LZString.compressToUTF16(json);
    localStorage.setItem(key, compressed);
    localStorage.setItem(`${key}:compressed`, 'true');

    return {
      compressed: true,
      originalSize,
      compressedSize: compressed.length,
      ratio: compressed.length / originalSize,
    };
  }

  localStorage.setItem(key, json);
  localStorage.removeItem(`${key}:compressed`);

  return {
    compressed: false,
    originalSize,
    compressedSize: originalSize,
    ratio: 1,
  };
}

export function loadCompressedState(key: string): DashboardState | null {
  const data = localStorage.getItem(key);
  if (!data) return null;

  const isCompressed = localStorage.getItem(`${key}:compressed`) === 'true';

  try {
    if (isCompressed) {
      const decompressed = LZString.decompressFromUTF16(data);
      if (!decompressed) throw new Error('Decompression failed');
      return JSON.parse(decompressed);
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
}
```

---

### DM-11.10: Wire ErrorWidget Retry Button (2 pts)

**Files to Modify:**
```
apps/web/src/components/widgets/
├── ErrorWidget.tsx                 # MODIFY
└── WidgetRenderer.tsx              # MODIFY
```

**Implementation:**
```typescript
// ErrorWidget.tsx
interface ErrorWidgetProps {
  error: Error | string;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

export function ErrorWidget({
  error,
  onRetry,
  retryCount = 0,
  maxRetries = 3
}: ErrorWidgetProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const canRetry = onRetry && retryCount < maxRetries;

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="...">
      <p>{typeof error === 'string' ? error : error.message}</p>
      {canRetry && (
        <Button onClick={handleRetry} disabled={isRetrying}>
          {isRetrying ? 'Retrying...' : `Retry (${maxRetries - retryCount} left)`}
        </Button>
      )}
    </div>
  );
}
```

---

### DM-11.11: Fix CopilotKit API Drift (5 pts)

**Files to Audit/Modify:**
```
apps/web/src/
├── hooks/useCopilotActions.ts
├── hooks/useCopilotContext.ts
├── components/copilot/CopilotProvider.tsx
└── lib/copilot/actions.ts
```

**Audit Checklist:**
- [ ] `useCopilotAction` parameter order matches v1.x API
- [ ] `useCopilotReadable` uses correct registration signature
- [ ] `useHumanInTheLoop` response format aligns with SDK
- [ ] Context provider props match current SDK version
- [ ] Event handler signatures are correct

**Resolution Pattern:**
```typescript
// Before (potentially outdated)
useCopilotAction({
  name: 'render_widget',
  handler: async (args) => { ... },
  description: '...',
});

// After (aligned with current SDK)
useCopilotAction({
  name: 'render_widget',
  description: '...',
  handler: async (args) => { ... },
  parameters: [
    { name: 'type', type: 'string', required: true },
  ],
});
```

---

### DM-11.12: Address Naming Complexity (2 pts)

**Files to Create:**
```
packages/shared/src/
└── agent-names.ts                  # NEW

docs/architecture/
└── agent-naming.md                 # NEW
```

**Mapping Utility:**
```typescript
// agent-names.ts
export const AGENT_NAME_MAP = {
  pulse: {
    display: 'Vitals',
    description: 'System health metrics and performance indicators',
    icon: 'heart-pulse',
  },
  navi: {
    display: 'Project Status',
    description: 'Project overview and task management',
    icon: 'map',
  },
  herald: {
    display: 'Activity',
    description: 'Recent activity feed and notifications',
    icon: 'bell',
  },
} as const;

export type AgentInternalName = keyof typeof AGENT_NAME_MAP;

export function getAgentDisplayName(internalName: string): string {
  return AGENT_NAME_MAP[internalName as AgentInternalName]?.display || internalName;
}

export function getAgentDescription(internalName: string): string {
  return AGENT_NAME_MAP[internalName as AgentInternalName]?.description || '';
}
```

---

### DM-11.13: Metrics Endpoint Authentication Option (3 pts)

**Files to Modify:**
```
agents/
├── observability/config.py         # MODIFY
├── api/routes/metrics.py           # MODIFY
└── api/middleware/metrics_auth.py  # NEW

docs/guides/
└── metrics-security.md             # NEW
```

**Configuration:**
```python
# observability/config.py
class OtelSettings(BaseSettings):
    # Existing fields...

    # New metrics auth fields
    metrics_require_auth: bool = Field(
        default=False,
        description="Require authentication for /metrics endpoint"
    )
    metrics_api_key: Optional[str] = Field(
        default=None,
        description="API key for metrics endpoint (required if metrics_require_auth=True)"
    )
```

**Auth Middleware:**
```python
# api/middleware/metrics_auth.py
from fastapi import Request, HTTPException, Depends
from agents.observability.config import get_otel_settings

async def verify_metrics_auth(request: Request):
    settings = get_otel_settings()

    if not settings.metrics_require_auth:
        return True

    # Check Bearer token
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        if token == settings.metrics_api_key:
            return True

    # Check query param (for Prometheus scrape config)
    api_key = request.query_params.get("api_key")
    if api_key == settings.metrics_api_key:
        return True

    raise HTTPException(status_code=401, detail="Invalid metrics credentials")
```

---

### DM-11.14: Accurate Token Estimation (2 pts)

**Files to Modify:**
```
agents/
├── requirements.txt                # ADD tiktoken
└── services/token_counter.py       # NEW
```

**Token Counting Service:**
```python
# services/token_counter.py
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

_tiktoken_available = False
_encoder = None

try:
    import tiktoken
    _tiktoken_available = True
except ImportError:
    logger.warning("tiktoken not installed, using estimation")

@lru_cache(maxsize=8)
def get_encoder(model: str = "cl100k_base"):
    """Get cached encoder for model."""
    if not _tiktoken_available:
        return None

    import tiktoken
    try:
        return tiktoken.get_encoding(model)
    except KeyError:
        # Fall back to cl100k_base for unknown models
        return tiktoken.get_encoding("cl100k_base")

def count_tokens(text: str, model: str = "cl100k_base") -> int:
    """
    Count tokens in text accurately if tiktoken available,
    otherwise fall back to estimation.
    """
    encoder = get_encoder(model)

    if encoder:
        return len(encoder.encode(text))

    # Fallback estimation (less accurate for non-ASCII)
    # Average of 4 characters per token for English
    return len(text) // 4

def count_tokens_with_metadata(text: str, model: str = "cl100k_base") -> dict:
    """Return token count with accuracy information."""
    encoder = get_encoder(model)

    if encoder:
        tokens = len(encoder.encode(text))
        return {
            "count": tokens,
            "method": "tiktoken",
            "model": model,
            "accurate": True,
        }

    return {
        "count": len(text) // 4,
        "method": "estimation",
        "model": None,
        "accurate": False,
    }
```

---

### DM-11.15: Visual Workflow Health Check (2 pts)

**Files to Modify:**
```
.github/workflows/
└── visual.yml                      # MODIFY
```

**Improved Workflow:**
```yaml
- name: Start development server
  run: |
    pnpm dev &
    echo $! > server.pid
  env:
    NODE_ENV: development

- name: Wait for server to be ready
  run: |
    max_attempts=30
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
      if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "Server is ready after $attempt seconds"
        exit 0
      fi

      echo "Waiting for server... (attempt $((attempt + 1))/$max_attempts)"
      sleep 2
      attempt=$((attempt + 1))
    done

    echo "ERROR: Server failed to start within $((max_attempts * 2)) seconds"

    # Capture logs for debugging
    if [ -f server.pid ]; then
      pid=$(cat server.pid)
      echo "Server process status:"
      ps -p $pid || echo "Process not found"
    fi

    exit 1

- name: Run visual regression tests
  run: pnpm test:visual
  env:
    PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

- name: Cleanup server
  if: always()
  run: |
    if [ -f server.pid ]; then
      kill $(cat server.pid) 2>/dev/null || true
      rm server.pid
    fi
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation | Story |
|------|-------------|--------|------------|-------|
| State sync conflicts | Medium | High | Conflict resolution algorithm, version vectors | DM-11.1, DM-11.2 |
| Migration data corruption | Low | Critical | Backup before migration, atomic rollback | DM-11.8 |
| WebSocket scalability | Medium | Medium | Redis adapter for horizontal scaling | DM-11.2 |
| MCP parallel connection failures | Low | Medium | Individual error handling, health reporting | DM-11.4 |
| CopilotKit breaking changes | Medium | Medium | Pin SDK version, comprehensive tests | DM-11.11 |
| Compression performance | Low | Low | Threshold tuning, async compression | DM-11.9 |

---

## Testing Strategy

### Unit Tests

| Story | Test Focus | Coverage Target |
|-------|------------|-----------------|
| DM-11.1 | Redis CRUD, conflict resolution | 90% |
| DM-11.2 | WebSocket events, reconnection | 85% |
| DM-11.3 | Cancellation states, authorization | 90% |
| DM-11.4 | Parallel connection, error handling | 85% |
| DM-11.5 | Parallel health, timeout handling | 85% |
| DM-11.6 | Event subscription, polling fallback | 90% |
| DM-11.7 | Widget rendering, data binding | 85% |
| DM-11.8 | Migration paths, version jumps | 95% |
| DM-11.9 | Compression/decompression, edge cases | 90% |
| DM-11.10 | Retry logic, max retries | 90% |

### Integration Tests

| Flow | Scope | Priority |
|------|-------|----------|
| State persistence round-trip | localStorage → Redis → new device | High |
| Multi-device sync | Update on one → reflected on other | High |
| Approval cancellation | Create → cancel → verify agent notified | Medium |
| Widget rendering pipeline | All 4 new widgets with A2A data | Medium |

### Performance Tests

| Metric | Baseline | Target | Tool |
|--------|----------|--------|------|
| MCP startup time (3 servers) | ~1500ms | <600ms | k6 timing |
| Health check cycle (10 agents) | ~5000ms | <1000ms | k6 timing |
| State sync latency | N/A | <100ms | Custom metrics |
| Compression ratio | N/A | <0.4 (60% reduction) | Unit test assertions |

---

## Success Criteria

1. **State Persistence**
   - Dashboard state survives browser clear
   - Multi-device sync works within 500ms
   - Conflict resolution handles 3+ simultaneous edits

2. **Performance**
   - MCP startup 3x faster (parallel connections)
   - Health checks 5x faster (parallel execution)
   - Approval wait uses <1% CPU (event-driven)

3. **Feature Completion**
   - All 4 widget types functional with A2A data
   - Approval cancellation works end-to-end
   - Error retry button functional with attempt tracking

4. **Code Quality**
   - CopilotKit API aligned with current SDK
   - Agent naming documented and consistent
   - State migrations tested for all version paths

5. **Operations**
   - Metrics auth option documented and functional
   - Token estimation accuracy within 5% of actual
   - Visual workflow health check prevents false starts

---

## DM-08 Retrospective Recommendations Applied

The following patterns from DM-08 retrospective are incorporated:

1. **Response Parser Integration** (DM-11.7)
   - Use `parse_agent_response()` for new widgets
   - Validate with Pydantic schemas before frontend delivery
   - Handle validation failures with graceful fallback

2. **Caching Integration** (DM-11.1)
   - Integrate with `agents/services/cache.py`
   - Use staleness tracking for Redis state cache invalidation
   - Add cache metrics to observability

3. **Rate Limiting** (DM-11.4, DM-11.5)
   - Use `agents/services/rate_limiter.py` for parallel operations
   - Configure per-operation thresholds
   - Monitor rate limit hits in metrics

4. **TTL Environment Configuration** (DM-11.1)
   - Move Redis state TTL to environment variables
   - Default: `REDIS_STATE_TTL=2592000` (30 days)
   - Allow per-environment overrides

---

## References

- [Epic DM-11 Requirements](./epic-dm-11-advanced-optimizations.md)
- [Tech Debt Consolidated](../tech-debt-consolidated.md)
- [DM-04 Retrospective](../retrospectives/epic-dm-04-retro-2025-12-30.md) - State persistence patterns
- [DM-05 Retrospective](../../sprint-artifacts/epic-dm-05-retrospective.md) - Approval workflow patterns
- [DM-06 Retrospective](./epic-dm-06-retrospective.md) - MCP integration patterns
- [DM-08 Tech Spec](./epic-dm-08-tech-spec.md) - Caching and rate limiting patterns
- [DM-09 Tech Spec](./epic-dm-09-tech-spec.md) - Observability patterns
- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
