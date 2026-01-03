# CopilotKit Patterns Guide

How we use CopilotKit in the HYVVE Dynamic Module System. This guide documents patterns, best practices, and anti-patterns learned during implementation.

## Overview

CopilotKit provides the AI interaction layer between our Next.js frontend and the Agno-based agent system. We use it for:

- **AG-UI Protocol**: Agent-to-UI communication
- **Tool Calls**: Exposing agent capabilities to the UI
- **Context Sharing**: Providing page context to agents
- **HITL Approvals**: Human-in-the-loop decision flows

## Pattern 1: Tool Call Handling with useCopilotAction

Use `useCopilotAction` to define actions that agents can invoke.

### Basic Usage

```typescript
// apps/web/src/hooks/use-dashboard-actions.ts
import { useCopilotAction } from '@copilotkit/react-core';

export function useDashboardActions() {
  useCopilotAction({
    name: 'refresh_dashboard',
    description: 'Refresh all dashboard widgets with latest data',
    parameters: [
      {
        name: 'force',
        type: 'boolean',
        description: 'Force refresh even if data is fresh',
        required: false,
      },
    ],
    handler: async ({ force }) => {
      // Invalidate React Query cache
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      // Return structured response for agent
      return {
        success: true,
        message: 'Dashboard refreshed',
        timestamp: new Date().toISOString(),
      };
    },
  });
}
```

### Error Handling Pattern

Always wrap handlers in try-catch and return structured errors:

```typescript
useCopilotAction({
  name: 'create_task',
  description: 'Create a new task in the current project',
  parameters: [
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
  ],
  handler: async ({ title, description }) => {
    try {
      const task = await api.tasks.create({ title, description });
      return {
        success: true,
        taskId: task.id,
        message: `Created task: ${title}`,
      };
    } catch (error) {
      // Return error in structured format - don't throw
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'TASK_CREATE_FAILED',
      };
    }
  },
});
```

### Response Formatting

Agents expect consistent response shapes:

```typescript
// Good: Structured response
return {
  success: true,
  data: { items: [...], total: 10 },
  metadata: { cached: false, ttl: 300 },
};

// Bad: Raw data without context
return items;
```

## Pattern 2: Context Exposure with useCopilotReadable

Use `useCopilotReadable` to expose page context to agents.

### What to Expose

```typescript
// apps/web/src/providers/dashboard-context-provider.tsx
import { useCopilotReadable } from '@copilotkit/react-core';

export function DashboardContextProvider({ children }) {
  const { activeProject } = useDashboardState();
  const { user } = useAuth();

  // Expose current project context
  useCopilotReadable({
    description: 'Current project the user is viewing',
    value: activeProject
      ? {
          id: activeProject.id,
          name: activeProject.name,
          phase: activeProject.currentPhase,
          health: activeProject.healthScore,
        }
      : null,
  });

  // Expose user preferences (NOT sensitive data)
  useCopilotReadable({
    description: 'User preferences for dashboard',
    value: {
      timezone: user.timezone,
      dateFormat: user.preferences.dateFormat,
      // Never expose tokens, passwords, or PII
    },
  });

  return <>{children}</>;
}
```

### Performance Considerations

```typescript
// Bad: Exposing entire state object
useCopilotReadable({
  description: 'Dashboard state',
  value: entireStateObject, // Could be huge
});

// Good: Expose only what agents need
useCopilotReadable({
  description: 'Active project summary',
  value: useMemo(
    () => ({
      id: state.activeProject?.id,
      name: state.activeProject?.name,
      taskCount: state.activeTasks.length,
    }),
    [state.activeProject, state.activeTasks.length]
  ),
});
```

### Filtering Sensitive Data

```typescript
// Never expose:
// - API keys or tokens
// - Passwords or credentials
// - Full user records with PII
// - Internal system IDs that could be exploited

// Safe to expose:
// - Display names and labels
// - Non-sensitive preferences
// - Aggregate counts and summaries
// - Public-facing identifiers
```

## Pattern 3: Human-in-the-Loop Approvals

Our HITL system uses event-driven approvals for responsive UX.

### Approval Card Components

```typescript
// apps/web/src/components/approval/approval-card.tsx
import { ApprovalItem } from '@/types/approval';

interface ApprovalCardProps {
  approval: ApprovalItem;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
}

export function ApprovalCard({
  approval,
  onApprove,
  onReject,
  onCancel,
}: ApprovalCardProps) {
  const { confidence, context, action } = approval;

  // Confidence-based styling
  const urgencyClass =
    confidence < 60
      ? 'border-red-500' // Full review needed
      : confidence < 85
        ? 'border-yellow-500' // Quick approval
        : 'border-green-500'; // Auto-approved (shouldn't reach UI)

  return (
    <div className={`approval-card ${urgencyClass}`}>
      <h3>{action.type}</h3>
      <p>{action.description}</p>

      <div className="context-preview">
        <pre>{JSON.stringify(context, null, 2)}</pre>
      </div>

      <div className="actions">
        <Button onClick={onApprove} variant="primary">
          Approve
        </Button>
        <Button onClick={onReject} variant="destructive">
          Reject
        </Button>
        <Button onClick={onCancel} variant="ghost">
          Cancel
        </Button>
      </div>
    </div>
  );
}
```

### Timeout Handling

```typescript
// Approvals expire after 5 minutes
const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000;

function useApprovalTimeout(approvalId: string, onExpire: () => void) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onExpire();
      toast.warning('Approval request expired');
    }, APPROVAL_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [approvalId, onExpire]);
}
```

### Cancel/Reject Flows

```typescript
// Cancel: User doesn't want to decide now
async function handleCancel(approvalId: string) {
  await api.approvals.cancel(approvalId, {
    reason: 'user_cancelled',
  });
  // Agent receives CancelledError and handles gracefully
}

// Reject: User explicitly denies the action
async function handleReject(approvalId: string, reason?: string) {
  await api.approvals.reject(approvalId, {
    reason: reason || 'user_rejected',
  });
  // Agent receives rejection and may try alternative approach
}
```

## Pattern 4: Generative UI Composition

Agents can dynamically compose UI layouts using widget types.

### Layout Types

```typescript
// Widget payloads from agents
type WidgetPayload =
  | ProjectOverviewPayload
  | MetricsPayload
  | ActivityPayload
  | TaskListPayload
  | AlertsPayload
  | ChartPayload
  | MarkdownPayload
  | ErrorPayload;

// Agents return layout with widgets
interface DashboardLayout {
  grid: {
    columns: number;
    rows: number;
  };
  widgets: Array<{
    type: WidgetPayload['type'];
    position: { row: number; col: number; rowSpan?: number; colSpan?: number };
    payload: WidgetPayload;
  }>;
}
```

### Dynamic Widget Rendering

```typescript
// apps/web/src/components/slots/widget-renderer.tsx
import { WidgetPayload } from '@/types/widgets';
import { ProjectOverviewWidget } from './widgets/ProjectOverviewWidget';
import { MetricsWidget } from './widgets/MetricsWidget';
import { ErrorWidget } from './widgets/ErrorWidget';

const WIDGET_MAP = {
  project_overview: ProjectOverviewWidget,
  metrics: MetricsWidget,
  activity: ActivityWidget,
  tasks: TaskListWidget,
  alerts: AlertsWidget,
  chart: ChartWidget,
  markdown: MarkdownWidget,
  error: ErrorWidget,
} as const;

export function WidgetRenderer({ payload }: { payload: WidgetPayload }) {
  const Component = WIDGET_MAP[payload.type];

  if (!Component) {
    return <ErrorWidget error={`Unknown widget type: ${payload.type}`} />;
  }

  return <Component {...payload} />;
}
```

### Agent-Driven UI Patterns

```typescript
// Agent decides layout based on context
// Gateway Agent (Python)
async def compose_dashboard(self, context: DashboardContext) -> DashboardLayout:
    widgets = []

    # Always show project overview if project is active
    if context.active_project:
        widgets.append(
            Widget(
                type="project_overview",
                position=Position(row=0, col=0, col_span=2),
                payload=await self.get_project_overview(context.active_project),
            )
        )

    # Show alerts if any are critical
    alerts = await self.get_alerts(context.workspace_id)
    if any(a.severity == "critical" for a in alerts):
        widgets.append(
            Widget(
                type="alerts",
                position=Position(row=0, col=2),
                payload=AlertsPayload(items=alerts),
            )
        )

    return DashboardLayout(
        grid=Grid(columns=3, rows=2),
        widgets=widgets,
    )
```

## Pattern 5: State Synchronization

Keep frontend and agent state in sync.

### WebSocket State Sync

```typescript
// apps/web/src/lib/realtime/state-sync-client.ts
import { useDashboardStateStore } from '@/stores/dashboard-state-store';

export function useStateSync() {
  const { socket } = useRealtimeContext();
  const updateState = useDashboardStateStore((s) => s.updateState);

  useEffect(() => {
    if (!socket) return;

    // Listen for state updates from other tabs/devices
    socket.on('dashboard.state.sync', (payload: StateSyncPayload) => {
      // Filter self-echoed events by tab ID
      if (payload.sourceTabId === getTabId()) return;

      // Apply update if version is newer
      updateState(payload.path, payload.value, payload.version);
    });

    return () => {
      socket.off('dashboard.state.sync');
    };
  }, [socket, updateState]);
}
```

### Version-Based Conflict Detection

```typescript
// State versioning prevents stale updates
interface StateUpdate {
  path: string;
  value: unknown;
  version: number;
  sourceTabId: string;
}

function applyStateUpdate(update: StateUpdate, currentVersion: number) {
  if (update.version <= currentVersion) {
    // Stale update - ignore
    console.debug('Ignoring stale update', update.version, currentVersion);
    return false;
  }

  // Apply update and increment local version
  return true;
}
```

## Anti-Patterns

### What NOT to Do

#### 1. Throwing Errors from Handlers

```typescript
// Bad: Throws and breaks agent flow
handler: async () => {
  const data = await api.getData();
  if (!data) throw new Error('No data'); // Don't do this
};

// Good: Return error in response
handler: async () => {
  const data = await api.getData();
  if (!data) {
    return { success: false, error: 'No data available' };
  }
  return { success: true, data };
};
```

#### 2. Exposing Sensitive Data

```typescript
// Bad: Exposes everything
useCopilotReadable({
  value: user, // Includes tokens, email, etc.
});

// Good: Expose only needed fields
useCopilotReadable({
  value: { displayName: user.displayName, role: user.role },
});
```

#### 3. Blocking the UI Thread

```typescript
// Bad: Synchronous heavy computation in handler
handler: () => {
  const result = heavyComputation(); // Blocks UI
  return result;
};

// Good: Async with loading states
handler: async () => {
  setLoading(true);
  try {
    const result = await heavyComputationAsync();
    return { success: true, result };
  } finally {
    setLoading(false);
  }
};
```

#### 4. Not Memoizing Context Values

```typescript
// Bad: Creates new object every render
useCopilotReadable({
  value: { items: state.items.filter((i) => i.active) }, // New object each render
});

// Good: Memoize derived values
const activeItems = useMemo(
  () => ({ items: state.items.filter((i) => i.active) }),
  [state.items]
);
useCopilotReadable({ value: activeItems });
```

#### 5. Ignoring Error States

```typescript
// Bad: Assumes success
const { data } = await copilotAction('get_data');
renderData(data); // May be undefined

// Good: Handle all states
const result = await copilotAction('get_data');
if (!result.success) {
  showError(result.error);
  return;
}
renderData(result.data);
```

## Testing Patterns

### Mocking CopilotKit in Tests

```typescript
// apps/web/src/test/mocks/copilotkit.tsx
import { vi } from 'vitest';

export const mockCopilotAction = vi.fn();

vi.mock('@copilotkit/react-core', () => ({
  useCopilotAction: (config) => {
    mockCopilotAction(config);
    return config.handler;
  },
  useCopilotReadable: vi.fn(),
  CopilotKitProvider: ({ children }) => <>{children}</>,
}));
```

### Testing Action Handlers

```typescript
describe('Dashboard Actions', () => {
  it('should refresh dashboard on action', async () => {
    const { result } = renderHook(() => useDashboardActions());

    // Get the handler that was registered
    const refreshHandler = mockCopilotAction.mock.calls.find(
      (call) => call[0].name === 'refresh_dashboard'
    )?.[0].handler;

    const response = await refreshHandler({ force: true });

    expect(response.success).toBe(true);
    expect(queryClient.invalidateQueries).toHaveBeenCalled();
  });
});
```

## Related Documentation

- [CopilotKit Official Docs](https://docs.copilotkit.ai)
- [AG-UI Protocol](https://docs.copilotkit.ai/ag-ui)
- [HITL Approval Flow](../architecture/diagrams/hitl-approval-flow.md)
- [State Sync System](../architecture/state-sync.md)
