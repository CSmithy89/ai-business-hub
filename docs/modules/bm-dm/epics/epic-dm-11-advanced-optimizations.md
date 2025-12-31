# Epic DM-11: Advanced Features & Optimizations

## Overview

Implement deferred features, advanced optimizations, and remaining improvements from the tech debt backlog. This epic covers all remaining items from the [Tech Debt Consolidated Document](../tech-debt-consolidated.md).

## Source Reference

**Tech Debt Document:** `docs/modules/bm-dm/tech-debt-consolidated.md`
**Priority:** Sprint 3+ - Advanced & Deferred
**Items Addressed:** TD-04, TD-08, TD-15, TD-16, TD-18, TD-19, TD-20, REC-07, REC-10, REC-11, REC-12, REC-15, REC-17, REC-18, REC-19, REC-20, REC-27, DM-09 Code Review Items (metrics auth, token estimation, visual workflow)

## Scope

### Deferred Features

| ID | Item | Category | Source Epic |
|----|------|----------|-------------|
| TD-04 | Redis persistence not implemented (deferred from DM-04.5) | State Durability | DM-04 |
| TD-19 | Approval cancellation API not implemented | Backend | DM-05 |
| REC-07 | Implement remaining widget types (ProjectStatus, TaskList, Metrics, Alert) | Feature | DM-03 |
| REC-17 | Redis persistence endpoint for state | State Durability | DM-04 |
| REC-18 | WebSocket state sync for multi-device | Multi-Device | DM-04 |

### Performance Optimizations

| ID | Item | Category | Source Epic |
|----|------|----------|-------------|
| REC-10 | Performance testing for mesh router | Performance | DM-06 |
| REC-11 | Parallel MCP server connections (currently sequential) | Startup | DM-06 |
| REC-12 | Parallel health checks in mesh (use asyncio.gather) | Performance | DM-06 |
| TD-20 | `wait_for_approval()` uses polling fallback | Efficiency | DM-05 |
| REC-27 | Implement proper event-driven notifications | Efficiency | DM-05 |

### Technical Debt Cleanup

| ID | Item | Category | Source Epic |
|----|------|----------|-------------|
| TD-08 | CopilotKit API drift between spec and implementation | Consistency | DM-01 |
| TD-15 | Retry button not wired in ErrorWidget | UX | DM-03 |
| TD-16 | Naming complexity: pulse→Vitals, navi→projectStatus | Cognitive | DM-02/04 |
| TD-18 | Integration tests for progress streaming deferred | Testing | DM-05 |
| REC-19 | State migration system when STATE_VERSION increments | Upgrade Path | DM-04 |
| REC-20 | Compress large state before localStorage save | Storage | DM-04 |

## Proposed Stories

### Story DM-11.1: Redis State Persistence

**Problem:** Dashboard state only persists to localStorage, not server-side. State lost on browser clear.

**Deferred From:** DM-04.5 (TD-04, REC-17)

**Implementation:**
- Create Redis-backed state persistence endpoint
- API: `POST/GET/DELETE /api/dashboard/state`
- Sync state to Redis on significant changes
- Restore state from Redis on login
- Handle conflict resolution (server vs local)

**API Design:**
```typescript
// Save state
POST /api/dashboard/state
Body: { version: number, state: DashboardState }
Response: { success: boolean, serverVersion: number }

// Get state
GET /api/dashboard/state
Response: { version: number, state: DashboardState, lastModified: string }

// Delete state
DELETE /api/dashboard/state
Response: { success: boolean }
```

**Conflict Resolution:**
```typescript
// On login, compare versions
if (serverVersion > localVersion) {
  // Server wins, restore from Redis
  restoreFromServer(serverState);
} else if (localVersion > serverVersion) {
  // Local wins, push to Redis
  saveToServer(localState);
} else {
  // Same version, merge or pick latest timestamp
  mergeStates(serverState, localState);
}
```

**Files to Create/Modify:**
```
apps/api/src/
├── modules/dashboard/
│   ├── dashboard-state.controller.ts
│   ├── dashboard-state.service.ts
│   └── dto/
│       └── dashboard-state.dto.ts

apps/web/src/
├── lib/api/
│   └── dashboard-state.ts
└── stores/
    └── dashboard-store.ts (add sync logic)
```

**Acceptance Criteria:**
- [ ] AC1: State persists to Redis via API
- [ ] AC2: State restores on login
- [ ] AC3: Conflict resolution handles version mismatches
- [ ] AC4: State scoped to user + workspace
- [ ] AC5: TTL configurable (default 30 days)

**Points:** 8

---

### Story DM-11.2: WebSocket State Synchronization

**Problem:** State changes on one device don't reflect on others in real-time.

**Gap Addressed:** REC-18

**Implementation:**
- Add WebSocket channel for state sync
- Broadcast state changes to all connected clients
- Handle reconnection and state reconciliation
- Optimize payload size (diff-based updates)

**WebSocket Events:**
```typescript
// Client → Server
{ type: 'state:update', payload: { path: 'widgets.w1', value: {...} } }

// Server → All Clients
{ type: 'state:sync', payload: { path: 'widgets.w1', value: {...}, version: 42 } }

// Reconnection
{ type: 'state:full', payload: { state: {...}, version: 42 } }
```

**Files to Create/Modify:**
```
apps/api/src/
├── modules/realtime/
│   └── state-sync.gateway.ts

apps/web/src/
├── lib/realtime/
│   └── state-sync-client.ts
└── stores/
    └── dashboard-store.ts (add WebSocket sync)
```

**Acceptance Criteria:**
- [ ] AC1: State changes broadcast via WebSocket
- [ ] AC2: Multi-tab sync works
- [ ] AC3: Multi-device sync works
- [ ] AC4: Reconnection restores state
- [ ] AC5: Diff-based updates minimize bandwidth

**Points:** 8

---

### Story DM-11.3: Approval Cancellation API

**Problem:** No way to cancel pending approval requests.

**Gap Addressed:** TD-19

**Implementation:**
- Add `DELETE /api/approvals/{id}` endpoint
- Update approval state to "cancelled"
- Notify waiting agent of cancellation
- Update frontend approval queue

**API Design:**
```typescript
DELETE /api/approvals/{approvalId}
Response: { success: boolean, cancelledAt: string }

// Agent receives cancellation event
{ type: 'approval:cancelled', approvalId: string, reason?: string }
```

**Files to Create/Modify:**
```
apps/api/src/
├── modules/approval/
│   └── approval.controller.ts (add DELETE)

agents/
├── approval/
│   └── approval_manager.py (handle cancellation)

apps/web/src/
├── components/approval/
│   └── ApprovalCard.tsx (add cancel button)
```

**Acceptance Criteria:**
- [ ] AC1: Cancel endpoint works
- [ ] AC2: Agent notified of cancellation
- [ ] AC3: UI shows cancel button
- [ ] AC4: Cancelled approvals excluded from queue
- [ ] AC5: Audit log captures cancellation

**Points:** 5

---

### Story DM-11.4: Parallel MCP Server Connections

**Problem:** MCP servers connect sequentially on startup, slowing agent initialization.

**Gap Addressed:** REC-11

**Current State (from DM-06):**
```python
# Sequential - slow
for server in mcp_servers:
    await connect(server)  # Each waits for previous
```

**Implementation:**
```python
# Parallel - fast
async def connect_all_mcp_servers(servers):
    tasks = [connect(server) for server in servers]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for server, result in zip(servers, results):
        if isinstance(result, Exception):
            logger.error(f"Failed to connect {server}: {result}")
```

**Files to Modify:**
```
agents/
├── mcp/
│   └── mcp_client.py (refactor to parallel)
└── main.py (update startup)
```

**Acceptance Criteria:**
- [ ] AC1: MCP connections happen in parallel
- [ ] AC2: Startup time reduced by ~Nx (N = server count)
- [ ] AC3: Individual failures don't block others
- [ ] AC4: Failed connections logged with retry
- [ ] AC5: Health check reflects partial connectivity

**Points:** 3

---

### Story DM-11.5: Parallel Health Checks

**Problem:** Agent mesh health checks run sequentially, slowing status updates.

**Gap Addressed:** REC-12

**Current State (from DM-06):**
```python
# Sequential - slow
for agent in agents:
    status = await check_health(agent)  # One at a time
```

**Implementation:**
```python
# Parallel - fast
async def check_all_health(agents):
    tasks = [
        asyncio.wait_for(check_health(agent), timeout=5.0)
        for agent in agents
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return process_results(agents, results)
```

**Files to Modify:**
```
agents/
└── mesh/
    └── mesh_router.py (refactor health checks)
```

**Acceptance Criteria:**
- [ ] AC1: Health checks run in parallel
- [ ] AC2: Individual timeouts don't block others
- [ ] AC3: Mesh status update time reduced
- [ ] AC4: Graceful handling of partial failures
- [ ] AC5: Timeout per agent configurable

**Points:** 3

---

### Story DM-11.6: Event-Driven Approval Notifications

**Problem:** `wait_for_approval()` uses polling fallback instead of events.

**Gap Addressed:** TD-20, REC-27

**Current State:**
```python
# Polling - inefficient
while not approved:
    status = await check_approval_status(id)
    await asyncio.sleep(1)
```

**Implementation:**
```python
# Event-driven - efficient
async def wait_for_approval(approval_id: str) -> ApprovalResult:
    event = asyncio.Event()

    async def on_approval_response(result):
        nonlocal result
        event.set()

    subscribe('approval:response:' + approval_id, on_approval_response)
    await event.wait()
    return result
```

**Files to Modify:**
```
agents/
├── approval/
│   └── approval_bridge.py (add event subscription)
└── gateway/
    └── events.py (approval event handlers)
```

**Acceptance Criteria:**
- [ ] AC1: Approvals use event-driven notification
- [ ] AC2: No polling in normal flow
- [ ] AC3: Polling fallback for disconnected scenarios
- [ ] AC4: CPU usage reduced during approval wait
- [ ] AC5: Response time improved

**Points:** 5

---

### Story DM-11.7: Remaining Widget Types

**Problem:** Some widget types from spec not fully implemented.

**Gap Addressed:** REC-07

**Widgets to Complete:**
1. **ProjectStatus** - Detailed project health view
2. **TaskList** - Scrollable task list with filters
3. **Metrics** - KPI display with trends
4. **Alert** - Alert/notification display

**Implementation:**
- Review existing widget stubs
- Complete component implementation
- Add A2A data fetching
- Add to widget registry

**Files to Create/Modify:**
```
apps/web/src/
├── components/widgets/
│   ├── ProjectStatusWidget.tsx
│   ├── TaskListWidget.tsx
│   ├── MetricsWidget.tsx
│   └── AlertWidget.tsx
└── lib/widgets/
    └── widget-registry.ts (register new types)
```

**Acceptance Criteria:**
- [ ] AC1: All 4 widget types implemented
- [ ] AC2: Widgets receive data from A2A
- [ ] AC3: Widgets handle loading/error states
- [ ] AC4: Widgets registered in widget registry
- [ ] AC5: Storybook stories for each widget

**Points:** 8

---

### Story DM-11.8: State Migration System

**Problem:** No migration path when STATE_VERSION changes.

**Gap Addressed:** REC-19

**Implementation:**
- Detect version mismatch on load
- Run migration functions for each version jump
- Preserve user data through migrations
- Log migration events

**Migration System:**
```typescript
const migrations: Record<number, (state: any) => any> = {
  2: (state) => ({
    ...state,
    widgets: state.widgets || [],  // Added in v2
  }),
  3: (state) => ({
    ...state,
    preferences: {
      ...state.preferences,
      theme: state.preferences?.theme || 'system',  // Added in v3
    },
  }),
};

function migrateState(state: any, fromVersion: number, toVersion: number) {
  let current = state;
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    if (migrations[v]) {
      current = migrations[v](current);
    }
  }
  return { ...current, version: toVersion };
}
```

**Files to Create/Modify:**
```
apps/web/src/
├── lib/storage/
│   └── state-migrations.ts
└── stores/
    └── dashboard-store.ts (add migration on init)
```

**Acceptance Criteria:**
- [ ] AC1: Version mismatch detected on load
- [ ] AC2: Migrations run in sequence
- [ ] AC3: User data preserved
- [ ] AC4: Migration events logged
- [ ] AC5: Failed migrations fall back to defaults

**Points:** 5

---

### Story DM-11.9: State Compression

**Problem:** Large state may exceed localStorage quota.

**Gap Addressed:** REC-20

**Implementation:**
- Add compression for state > threshold (e.g., 50KB)
- Use LZ-String or similar browser-compatible compression
- Decompress on load
- Track compression metrics

**Compression Logic:**
```typescript
import LZString from 'lz-string';

const COMPRESSION_THRESHOLD = 50 * 1024; // 50KB

function saveState(state: DashboardState) {
  const json = JSON.stringify(state);

  if (json.length > COMPRESSION_THRESHOLD) {
    const compressed = LZString.compressToUTF16(json);
    localStorage.setItem(KEY, compressed);
    localStorage.setItem(KEY + ':compressed', 'true');
  } else {
    localStorage.setItem(KEY, json);
    localStorage.removeItem(KEY + ':compressed');
  }
}

function loadState(): DashboardState {
  const data = localStorage.getItem(KEY);
  const isCompressed = localStorage.getItem(KEY + ':compressed') === 'true';

  if (isCompressed) {
    return JSON.parse(LZString.decompressFromUTF16(data));
  }
  return JSON.parse(data);
}
```

**Files to Create/Modify:**
```
apps/web/
├── package.json (add lz-string)
└── src/lib/storage/
    └── compression.ts
```

**Acceptance Criteria:**
- [ ] AC1: State compressed when > threshold
- [ ] AC2: Decompression transparent on load
- [ ] AC3: Compression ratio logged
- [ ] AC4: No data corruption
- [ ] AC5: Fallback if compression fails

**Points:** 3

---

### Story DM-11.10: Wire ErrorWidget Retry Button

**Problem:** ErrorWidget has retry prop but it's not connected.

**Gap Addressed:** TD-15

**Current State:**
```typescript
// Retry prop exists but onRetry not called
<ErrorWidget
  error={error}
  onRetry={handleRetry}  // Never triggered
/>
```

**Implementation:**
- Connect retry button onClick to onRetry prop
- Add retry loading state
- Implement retry logic in parent components
- Add retry attempt tracking

**Files to Modify:**
```
apps/web/src/
├── components/widgets/
│   └── ErrorWidget.tsx
└── components/dashboard/
    └── WidgetRenderer.tsx (pass retry handler)
```

**Acceptance Criteria:**
- [ ] AC1: Retry button triggers onRetry
- [ ] AC2: Loading state shown during retry
- [ ] AC3: Retry count tracked
- [ ] AC4: Max retries enforced (e.g., 3)
- [ ] AC5: Success clears error state

**Points:** 2

---

### Story DM-11.11: Fix CopilotKit API Drift

**Problem:** Implementation diverged from original CopilotKit spec.

**Gap Addressed:** TD-08

**Implementation:**
- Audit current CopilotKit usage against latest docs
- Update deprecated API calls
- Align prop names with conventions
- Update TypeScript types

**Audit Checklist:**
- [ ] useCopilotAction parameter order
- [ ] useCopilotReadable registration
- [ ] useHumanInTheLoop response format
- [ ] Context provider props
- [ ] Event handler signatures

**Files to Audit/Modify:**
```
apps/web/src/
├── hooks/
│   ├── useCopilotActions.ts
│   └── useCopilotContext.ts
├── components/copilot/
│   └── CopilotProvider.tsx
└── lib/copilot/
    └── actions.ts
```

**Acceptance Criteria:**
- [ ] AC1: All CopilotKit APIs match latest docs
- [ ] AC2: No deprecated API usage
- [ ] AC3: TypeScript types updated
- [ ] AC4: Tests updated for API changes
- [ ] AC5: Documented in CopilotKit patterns guide

**Points:** 5

---

### Story DM-11.12: Address Naming Complexity

**Problem:** Agent internal names don't match UI names, causing confusion.

**Gap Addressed:** TD-16

**Current Mapping:**
| Agent Internal | UI Display | Proposed |
|----------------|------------|----------|
| pulse | Vitals | Keep both, document |
| navi | projectStatus | Keep both, document |
| herald | activity | Keep both, document |

**Implementation:**
- Create name mapping utility
- Document the mappings clearly
- Add comments in code explaining dual names
- Consider renaming if safe to do so

**Mapping Utility:**
```typescript
const AGENT_NAME_MAP = {
  pulse: { display: 'Vitals', description: 'System health metrics' },
  navi: { display: 'Project Status', description: 'Project overview' },
  herald: { display: 'Activity', description: 'Recent activity feed' },
};

export function getAgentDisplayName(internalName: string): string {
  return AGENT_NAME_MAP[internalName]?.display || internalName;
}
```

**Files to Create/Modify:**
```
packages/shared/src/
└── agent-names.ts

docs/
└── architecture/agent-naming.md
```

**Acceptance Criteria:**
- [ ] AC1: Name mapping utility created
- [ ] AC2: Mapping documented
- [ ] AC3: UI uses display names consistently
- [ ] AC4: Code comments explain dual naming
- [ ] AC5: New developers can understand mapping

**Points:** 2

---

### Story DM-11.13: Metrics Endpoint Authentication Option

**Problem:** The `/metrics` endpoint is unauthenticated, relying on network ACLs for security.

**Gap Addressed:** DM-09 Code Review - Metrics endpoint security

**Implementation:**
- Add `METRICS_REQUIRE_AUTH` environment variable
- When enabled, require API key or bearer token
- Document deployment options (auth vs network ACLs)
- Add to deployment guide

**Configuration:**
```python
# agents/observability/config.py
class OtelSettings(BaseSettings):
    metrics_require_auth: bool = False  # Default: rely on network ACLs
    metrics_api_key: Optional[str] = None  # Required if metrics_require_auth=True
```

**Files to Modify:**
```
agents/
├── observability/config.py (add settings)
├── api/routes/metrics.py (add auth check)
└── api/middleware/metrics_auth.py (new)

docs/
└── guides/metrics-security.md
```

**Acceptance Criteria:**
- [ ] AC1: METRICS_REQUIRE_AUTH env var works
- [ ] AC2: Auth enforced when enabled
- [ ] AC3: Network ACL approach documented
- [ ] AC4: Deployment guide updated
- [ ] AC5: Both approaches tested

**Points:** 3

---

### Story DM-11.14: Accurate Token Estimation

**Problem:** Token count uses char/4 estimate, which can be inaccurate for non-ASCII text.

**Gap Addressed:** DM-09 Code Review - Token estimation accuracy

**Current State:**
```python
# Estimate - can be off by 20-50%
token_count = len(text) // 4
```

**Implementation:**
- Add tiktoken library for accurate Claude/OpenAI token counting
- Fall back to estimate if tiktoken unavailable
- Document estimation limitations
- Add token count to usage metrics

**Accurate Counting:**
```python
import tiktoken

def count_tokens(text: str, model: str = "cl100k_base") -> int:
    try:
        encoder = tiktoken.get_encoding(model)
        return len(encoder.encode(text))
    except Exception:
        # Fallback to estimate
        return len(text) // 4
```

**Files to Modify:**
```
agents/
├── requirements.txt (add tiktoken)
├── services/token_counter.py (new)
└── main.py (use accurate counting)
```

**Acceptance Criteria:**
- [ ] AC1: tiktoken integrated
- [ ] AC2: Graceful fallback to estimate
- [ ] AC3: Token counts in usage metrics
- [ ] AC4: Estimation documented as approximate
- [ ] AC5: Tests for accuracy

**Points:** 2

---

### Story DM-11.15: Visual Workflow Health Check

**Problem:** Visual regression workflow starts server without health check validation.

**Gap Addressed:** DM-09 Code Review - Visual workflow error handling

**Current State:**
```yaml
# Server starts but no health check
- run: pnpm dev &
- run: sleep 10  # Hope it's ready
- run: pnpm test:visual
```

**Implementation:**
- Add health check endpoint poll before tests
- Fail fast if server doesn't start
- Add timeout and retry logic
- Improve error messages

**Improved Workflow:**
```yaml
- name: Start server
  run: pnpm dev &

- name: Wait for server
  run: |
    for i in {1..30}; do
      if curl -s http://localhost:3000/api/health > /dev/null; then
        echo "Server ready"
        exit 0
      fi
      echo "Waiting for server... ($i/30)"
      sleep 2
    done
    echo "Server failed to start"
    exit 1

- name: Run visual tests
  run: pnpm test:visual
```

**Files to Modify:**
```
.github/workflows/
└── visual.yml (add health check)
```

**Acceptance Criteria:**
- [ ] AC1: Health check validates server startup
- [ ] AC2: Fail fast on startup failure
- [ ] AC3: Clear error messages
- [ ] AC4: Timeout configurable
- [ ] AC5: Works in CI environment

**Points:** 2

---

## Total Points: 64

## Dependencies

- DM-07 (Infrastructure stable)
- DM-08 (Quality hardening)
- DM-09 (Testing infrastructure for validating changes)

## Recommendations from DM-08 Retrospective

The following items from the DM-08 retrospective should be incorporated:

### From "What Went Well" Patterns

1. **Integrate response parser into A2A client** - When implementing stories that involve A2A communication:
   - Use `parse_agent_response()` from `agents/pm/schemas/base.py`
   - Validate responses with `NaviProjectResponse`, `PulseHealthResponse`, `HeraldActivityResponse`
   - Use `to_widget_data()` methods for frontend-compatible output
   - Handle validation failures with graceful fallback

2. **Wire up caching to actual dashboard data flows** - When implementing DM-11.1 (Redis State Persistence):
   - Integrate with existing `agents/services/cache.py` service
   - Use staleness tracking for cache invalidation
   - Consider cache warming on agent startup
   - Add cache metrics to observability

3. **Add rate limiting to production A2A calls** - When implementing DM-11.4/11.5 (Parallel operations):
   - Use `agents/services/rate_limiter.py` for all A2A endpoints
   - Configure per-agent thresholds based on load testing results
   - Add rate limit headers to responses
   - Monitor rate limit hits in metrics

### From "What Could Be Improved"

4. **Cross-Language Type Validation** - Consider implementing code generation from JSON Schema:
   - Current approach uses JSON intermediate format (`packages/shared/widget-types.json`)
   - Works but lacks compile-time validation
   - Consider adding build-time code generation: JSON Schema → TypeScript types + Python Pydantic models
   - This would catch type mismatches at build time rather than runtime
   - Recommended approach: Use a tool like `datamodel-code-generator` for Python or `json-schema-to-typescript`

5. **Caching TTL Environment Configuration** - TTL values are currently hardcoded in Python constants:
   - Move TTL values in `agents/services/cache.py` to environment variables
   - Allow different TTLs for different deployment tiers (dev/staging/prod)
   - Example: `CACHE_TTL_DEFAULT=300`, `CACHE_TTL_SHORT=60`, `CACHE_TTL_LONG=3600`
   - Add validation for TTL ranges to prevent misconfigurations

## Technical Notes

### State Sync Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Browser 1  │────▶│   API       │◀────│  Browser 2  │
│  (Tab A)    │     │  (WebSocket │     │  (Mobile)   │
│             │     │   + Redis)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                     Real-time sync
```

### Parallel vs Sequential Performance

```
Sequential (current):
Server1 ──[500ms]──▶
                    Server2 ──[500ms]──▶
                                        Server3 ──[500ms]──▶
Total: 1500ms

Parallel (optimized):
Server1 ──[500ms]──▶
Server2 ──[500ms]──▶
Server3 ──[500ms]──▶
Total: 500ms (3x faster)
```

## Risks

1. **State Sync Conflicts** - Multi-device sync may cause data conflicts
2. **Migration Failures** - State migrations may corrupt data
3. **Breaking Changes** - API drift fixes may break existing behavior

## Success Criteria

- State persists reliably across sessions
- Multi-device experience works seamlessly
- All widget types functional
- Performance optimizations measurable
- Technical debt backlog cleared

## References

- [Tech Debt Consolidated](../tech-debt-consolidated.md) - Source document
- [DM-04 Retrospective](../retrospectives/epic-dm-04-retro-2025-12-30.md) - TD-04, REC-17, REC-18, REC-19, REC-20
- [DM-05 Retrospective](../../sprint-artifacts/epic-dm-05-retrospective.md) - TD-18, TD-19, TD-20, REC-27
- [DM-06 Retrospective](epic-dm-06-retrospective.md) - REC-10, REC-11, REC-12
- [DM-01 Retrospective](../retrospectives/epic-dm-01-retro-2025-12-30.md) - TD-08
- [DM-02 Retrospective](../retrospectives/epic-dm-02-retro-2025-12-30.md) - TD-16
- [DM-03 Retrospective](epic-dm-03-retrospective.md) - TD-15, REC-07
