# Epic DM-01: CopilotKit Frontend Infrastructure - Technical Specification

## 1. Executive Summary

### What DM-01 Delivers

Epic DM-01 establishes the **frontend infrastructure** for the Dynamic Module System, enabling AI agents to render dynamic UI components (Generative UI) and users to interact with agents via natural language chat. This epic is **foundational** - all subsequent DM epics depend on it.

**Key Deliverables:**
- CopilotKit integration with AG-UI protocol support
- "Slot System" for dynamic widget rendering via `useRenderToolCall`
- Four base widget components following shadcn/ui patterns
- Global chat UI with keyboard shortcuts
- Context awareness via `useCopilotReadable`
- CCR (Claude Code Router) settings UI for routing configuration

### Key Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| `@copilotkit/react-core` | ^2.x | Core CopilotKit functionality |
| `@copilotkit/react-ui` | ^2.x | Pre-built chat components |
| `@ag-ui/agno` | ^1.x | AG-UI protocol adapter for Agno |
| AG-UI Protocol | Latest | Agent-to-User communication standard |

### Integration Points with Existing Codebase

1. **Providers (`apps/web/src/app/providers.tsx`)**
   - Add CopilotKit provider wrapping existing provider chain
   - Configure AG-UI connection to Agno backend

2. **Settings Pages (`apps/web/src/app/(dashboard)/settings/ai-config/`)**
   - New "Routing" subnav item for CCR configuration
   - Extend existing AIConfigSubnav pattern

3. **Layout Constants (`apps/web/src/lib/layout-constants.ts`)**
   - Extend with CopilotKit-specific dimensions
   - Add Z-index layers for chat panel

4. **Component Patterns**
   - Follow existing Card/CardHeader/CardContent patterns
   - Use existing hooks pattern (useQuery, useMutation)
   - Leverage existing skeleton loading components

---

## 2. Architecture Decisions

### 2.1 CopilotKit Integration with Existing Providers

The CopilotKit provider must wrap the application **inside** the existing provider chain to access React Query and other contexts:

```typescript
// apps/web/src/app/providers.tsx (modified)
import { CopilotKit } from "@copilotkit/react-core";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RealtimeProvider>
          <CopilotKit
            runtimeUrl="/api/copilotkit"
            publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_KEY}
          >
            <TooltipProvider delayDuration={300}>
              {children}
            </TooltipProvider>
          </CopilotKit>
        </RealtimeProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

**Rationale:**
- CopilotKit needs access to React Query for data fetching
- Must be inside ThemeProvider for styling consistency
- RealtimeProvider integration allows WebSocket coordination

### 2.2 Slot System Design with useRenderToolCall

The Slot System uses CopilotKit's `useRenderToolCall` hook to intercept tool calls from agents and render corresponding React components.

**Pattern:**
```typescript
// apps/web/src/components/slots/DashboardSlots.tsx
import { useRenderToolCall } from "@copilotkit/react-core";
import { WIDGET_REGISTRY } from "./widget-registry";

export function DashboardSlots() {
  useRenderToolCall({
    name: "render_dashboard_widget",
    description: "Render a widget on the user's dashboard",
    parameters: [
      { name: "type", type: "string", description: "Widget type identifier" },
      { name: "data", type: "object", description: "Widget data payload" },
    ],
    render: ({ args }) => {
      const WidgetComponent = WIDGET_REGISTRY[args.type as WidgetType];
      if (!WidgetComponent) {
        return <WidgetErrorFallback type={args.type} />;
      }
      return (
        <WidgetErrorBoundary>
          <WidgetComponent {...args.data} />
        </WidgetErrorBoundary>
      );
    },
  });

  return null; // This component is purely for side-effects
}
```

**Widget Registry Pattern:**
```typescript
// apps/web/src/components/slots/widget-registry.ts
export const WIDGET_REGISTRY: Record<WidgetType, React.ComponentType<any>> = {
  ProjectStatus: ProjectStatusWidget,
  TaskList: TaskListWidget,
  Metrics: MetricsWidget,
  Alert: AlertWidget,
};

export type WidgetType = keyof typeof WIDGET_REGISTRY;
```

### 2.3 Widget Component Architecture

All widgets follow a consistent architecture:

```
Widget Component
├── Props interface (typed data from agent)
├── Loading state (skeleton using existing Skeleton component)
├── Error state (handled by WidgetErrorBoundary)
├── Empty state (no data)
└── Data state (actual content)
```

**Widget Base Pattern:**
```typescript
interface WidgetProps<T> {
  data: T;
  isLoading?: boolean;
  error?: Error;
}

function BaseWidget<T>({ data, isLoading, error, children, ...props }: WidgetProps<T>) {
  if (isLoading) return <WidgetSkeleton />;
  if (error) throw error; // Let error boundary handle
  if (!data) return <WidgetEmpty />;
  return children;
}
```

### 2.4 CCR Settings Integration Approach

Extend the existing AI Config settings section following the established pattern:

1. **Add new subnav item** in `AIConfigSubnav`:
   ```typescript
   { label: 'Routing & Fallbacks', href: '/settings/ai-config/routing' }
   ```

2. **Create routing page** following `agent-preferences/page.tsx` pattern:
   - Server component for session check
   - Client components for interactive UI
   - Use existing SettingsLayout wrapper

3. **Reuse existing patterns**:
   - `ProviderHealthStatus` component structure for CCR status
   - `TokenUsageDashboard` patterns for quota display
   - `AgentModelPreferences` patterns for routing config

---

## 3. Technical Dependencies

### 3.1 NPM Packages Required

```json
{
  "dependencies": {
    "@copilotkit/react-core": "^2.0.0",
    "@copilotkit/react-ui": "^2.0.0",
    "@ag-ui/agno": "^1.0.0"
  }
}
```

**Installation Command:**
```bash
pnpm add @copilotkit/react-core @copilotkit/react-ui @ag-ui/agno
```

### 3.2 Environment Variables

```env
# Required
NEXT_PUBLIC_AGNO_URL=http://localhost:8000

# Optional - for CopilotKit Cloud features
NEXT_PUBLIC_COPILOTKIT_KEY=ck_...

# CCR Configuration (optional)
NEXT_PUBLIC_CCR_ENABLED=true
CCR_BASE_URL=http://localhost:3456
```

### 3.3 Backend Requirements (for E2E Testing)

For full E2E testing, DM-02 must be complete. However, DM-01 can be developed using:

1. **Mock Agno Endpoint**: Create `/api/copilotkit` mock route
2. **Static Widget Data**: Use mock data for widget development
3. **Storybook**: Widget components can be developed in isolation

---

## 4. File Structure

### 4.1 New Files to Create

```
apps/web/src/
├── app/
│   ├── api/
│   │   └── copilotkit/
│   │       └── route.ts                    # DM-01.1: CopilotKit API route
│   └── (dashboard)/
│       └── settings/
│           └── ai-config/
│               └── routing/
│                   └── page.tsx            # DM-01.6: CCR routing settings
│
├── components/
│   ├── copilot/
│   │   ├── CopilotChat.tsx                 # DM-01.4: Chat UI wrapper
│   │   ├── CopilotChatButton.tsx           # DM-01.4: Toggle button
│   │   └── CopilotKeyboardShortcut.tsx     # DM-01.4: Cmd+K handler
│   │
│   ├── slots/
│   │   ├── DashboardSlots.tsx              # DM-01.2: Slot system
│   │   ├── widget-registry.ts              # DM-01.2: Widget registry
│   │   ├── WidgetErrorBoundary.tsx         # DM-01.2: Error handling
│   │   ├── WidgetErrorFallback.tsx         # DM-01.2: Error display
│   │   └── widgets/
│   │       ├── ProjectStatusWidget.tsx     # DM-01.3: Widget
│   │       ├── TaskListWidget.tsx          # DM-01.3: Widget
│   │       ├── MetricsWidget.tsx           # DM-01.3: Widget
│   │       ├── AlertWidget.tsx             # DM-01.3: Widget
│   │       ├── WidgetSkeleton.tsx          # DM-01.3: Loading state
│   │       └── WidgetEmpty.tsx             # DM-01.3: Empty state
│   │
│   └── settings/
│       ├── ccr-routing-config.tsx          # DM-01.6: Routing UI
│       ├── ccr-status.tsx                  # DM-01.7: Connection status
│       └── ccr-quota-display.tsx           # DM-01.8: Quota display
│
├── hooks/
│   ├── useCopilotContext.ts                # DM-01.5: Context hook
│   ├── useCCRStatus.ts                     # DM-01.7: Status hook
│   └── useCCRQuota.ts                      # DM-01.8: Quota hook
│
└── lib/
    └── dm-constants.ts                     # All DM-01 constants
```

### 4.2 Existing Files to Modify

| File | Modification | Story |
|------|--------------|-------|
| `apps/web/src/app/providers.tsx` | Add CopilotKit provider | DM-01.1 |
| `apps/web/src/lib/layout-constants.ts` | Add chat/widget constants | DM-01.1 |
| `apps/web/src/components/settings/ai-config-subnav.tsx` | Add "Routing" nav item | DM-01.6 |
| `apps/web/src/app/(dashboard)/settings/ai-config/usage/page.tsx` | Add CCR quota section | DM-01.8 |

### 4.3 Component Hierarchy

```
<Providers>
  └── <CopilotKit>
      └── <DashboardLayout>
          ├── <Header>
          │   └── <CopilotChatButton />
          ├── <Sidebar />
          ├── <MainContent>
          │   ├── <DashboardSlots />     # Renders widgets from agent
          │   └── <PageContent />
          └── <CopilotChat />            # Sidebar/popup chat
```

---

## 5. Implementation Patterns

### 5.1 Error Handling Standards

**Widget Error Boundary:**
```typescript
// apps/web/src/components/slots/WidgetErrorBoundary.tsx
'use client';

import React from 'react';
import { WidgetErrorFallback } from './WidgetErrorFallback';

interface State {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetType?: string },
  State
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Widget Error]', {
      error,
      componentStack: errorInfo.componentStack,
      widgetType: this.props.widgetType,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <WidgetErrorFallback
          error={this.state.error}
          widgetType={this.props.widgetType}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
```

**CCR Error Handling:**
```typescript
// Consistent error structure for CCR operations
interface CCRError {
  code: 'CONNECTION_FAILED' | 'QUOTA_EXCEEDED' | 'PROVIDER_UNAVAILABLE';
  message: string;
  provider?: string;
  retryable: boolean;
}
```

### 5.2 Loading/Skeleton States

Use the existing Skeleton component from shadcn/ui:

```typescript
// apps/web/src/components/slots/widgets/WidgetSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function WidgetSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </CardContent>
    </Card>
  );
}
```

### 5.3 Accessibility Requirements

All components must meet WCAG 2.1 AA standards:

1. **Keyboard Navigation:**
   - Chat toggle: `Cmd+K` / `Ctrl+K`
   - Chat close: `Escape`
   - Widget focus: `Tab` navigation

2. **Screen Reader Support:**
   ```typescript
   // Dynamic content updates
   <div role="status" aria-live="polite" aria-atomic="true">
     {widgetContent}
   </div>
   ```

3. **Reduced Motion:**
   ```typescript
   // Respect user preference
   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
   const animationDuration = prefersReducedMotion ? 0 : DM_CONSTANTS.WIDGETS.ANIMATION_DURATION_MS;
   ```

4. **Focus Management:**
   ```typescript
   // When chat opens, focus the input
   useEffect(() => {
     if (isChatOpen) {
       chatInputRef.current?.focus();
     }
   }, [isChatOpen]);
   ```

### 5.4 Performance Budgets

| Metric | Target | Critical | Measurement |
|--------|--------|----------|-------------|
| Initial Widget Render | <100ms | <200ms | React DevTools Profiler |
| Widget Update | <50ms | <100ms | Re-render timing |
| Chat Response Start | <500ms | <1000ms | Time to first token |
| Bundle Size (CopilotKit) | <200KB | <300KB | `pnpm build && analyze` |
| Memory (10 widgets) | <50MB | <100MB | Chrome DevTools Heap |
| Lighthouse Score | >90 | >80 | `pnpm lighthouse` |

**Monitoring Implementation:**
```typescript
// Wrap widget renders with performance marks
function withPerformanceTracking<P>(WidgetComponent: React.ComponentType<P>) {
  return function TrackedWidget(props: P) {
    useEffect(() => {
      performance.mark('widget-render-start');
      return () => {
        performance.mark('widget-render-end');
        performance.measure('widget-render', 'widget-render-start', 'widget-render-end');
      };
    }, []);

    return <WidgetComponent {...props} />;
  };
}
```

---

## 6. Story-by-Story Technical Notes

### Story DM-01.1: CopilotKit Installation & Setup (3 points)

**Key Implementation Details:**
- Install packages: `@copilotkit/react-core`, `@copilotkit/react-ui`, `@ag-ui/agno`
- Create `/api/copilotkit` route for local development
- Add CopilotKit provider to providers.tsx
- Configure environment variables

**Files to Create:**
- `apps/web/src/app/api/copilotkit/route.ts`
- `apps/web/src/lib/dm-constants.ts`

**Files to Modify:**
- `apps/web/src/app/providers.tsx`
- `apps/web/package.json`
- `.env.local` (example)

**Integration Points:**
- Must be SSR-safe (client-side only CopilotKit)
- Must integrate with existing QueryClient

**Testing Requirements:**
- Unit: Provider renders without error
- Integration: CopilotKit context available to children
- E2E: Verify no console errors on page load

**Acceptance Criteria Mapping:**
- [x] CopilotKit provider wraps the application
- [x] AG-UI connection established (can verify in network tab)
- [x] No console errors related to CopilotKit

---

### Story DM-01.2: Slot System Foundation (5 points)

**Key Implementation Details:**
- Implement `useRenderToolCall` for `render_dashboard_widget`
- Create widget type registry with TypeScript support
- Add fallback for unknown widget types
- Implement WidgetErrorBoundary

**Files to Create:**
- `apps/web/src/components/slots/DashboardSlots.tsx`
- `apps/web/src/components/slots/widget-registry.ts`
- `apps/web/src/components/slots/WidgetErrorBoundary.tsx`
- `apps/web/src/components/slots/WidgetErrorFallback.tsx`

**Integration Points:**
- DashboardSlots must be rendered in dashboard layout
- Registry must be extensible for future widgets

**TypeScript Types:**
```typescript
// apps/web/src/components/slots/types.ts
export interface WidgetData {
  id?: string;
  title?: string;
  [key: string]: unknown;
}

export type WidgetType = 'ProjectStatus' | 'TaskList' | 'Metrics' | 'Alert';

export interface RenderWidgetArgs {
  type: WidgetType;
  data: WidgetData;
}
```

**Testing Requirements:**
- Unit: Registry returns correct component for each type
- Unit: Unknown type shows error fallback
- Unit: Error boundary catches widget errors

---

### Story DM-01.3: Base Widget Components (8 points)

**Key Implementation Details:**
- Create 4 widget components following shadcn/ui patterns
- Each widget handles loading, error, empty states
- Responsive design for all screen sizes
- Use existing Card component from UI library

**Files to Create:**
- `apps/web/src/components/slots/widgets/ProjectStatusWidget.tsx`
- `apps/web/src/components/slots/widgets/TaskListWidget.tsx`
- `apps/web/src/components/slots/widgets/MetricsWidget.tsx`
- `apps/web/src/components/slots/widgets/AlertWidget.tsx`
- `apps/web/src/components/slots/widgets/WidgetSkeleton.tsx`
- `apps/web/src/components/slots/widgets/WidgetEmpty.tsx`

**Widget Props Interfaces:**
```typescript
// ProjectStatusWidget
interface ProjectStatusData {
  projectId: string;
  projectName: string;
  status: 'on_track' | 'at_risk' | 'behind';
  progress: number; // 0-100
  dueDate?: string;
  tasksCompleted: number;
  tasksTotal: number;
}

// TaskListWidget
interface TaskListData {
  tasks: Array<{
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    assignee?: string;
  }>;
  limit?: number;
}

// MetricsWidget
interface MetricsData {
  metrics: Array<{
    label: string;
    value: number | string;
    change?: { value: number; direction: 'up' | 'down' };
    icon?: string;
  }>;
}

// AlertWidget
interface AlertData {
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: { label: string; href: string };
}
```

**Testing Requirements:**
- Unit: Each widget renders with valid data
- Unit: Loading state shows skeleton
- Unit: Empty state shows appropriate message
- Visual: Storybook stories for all states

---

### Story DM-01.4: CopilotKit Chat Integration (5 points)

**Key Implementation Details:**
- Use CopilotSidebar or CopilotPopup component
- Style to match HYVVE design tokens
- Implement `Cmd+K` keyboard shortcut
- Persist chat across navigation

**Files to Create:**
- `apps/web/src/components/copilot/CopilotChat.tsx`
- `apps/web/src/components/copilot/CopilotChatButton.tsx`
- `apps/web/src/components/copilot/CopilotKeyboardShortcut.tsx`

**Files to Modify:**
- `apps/web/src/lib/layout-constants.ts` (add CHAT z-index)
- Dashboard layout to include CopilotChat

**Styling Approach:**
```typescript
// Use CSS variables for theming
<CopilotSidebar
  className="copilot-chat"
  defaultOpen={false}
  labels={{
    placeholder: "Ask anything about your workspace...",
    title: "HYVVE Assistant",
  }}
/>
```

**CSS Customization:**
```css
/* apps/web/src/app/globals.css */
.copilot-chat {
  --copilot-primary: rgb(var(--color-primary-500));
  --copilot-background: rgb(var(--color-bg-primary));
  --copilot-text: rgb(var(--color-text-primary));
}
```

**Testing Requirements:**
- Unit: Chat button toggles chat panel
- Unit: Cmd+K opens chat
- Unit: Escape closes chat
- E2E: Chat persists across navigation

---

### Story DM-01.5: Context Provider Integration (5 points)

**Key Implementation Details:**
- Implement `useCopilotReadable` for active project
- Implement `useCopilotReadable` for current view/page
- Implement `useCopilotReadable` for selected tasks
- Ensure context updates reactively

**Files to Create:**
- `apps/web/src/hooks/useCopilotContext.ts`

**Files to Modify:**
- Project-related pages to provide project context
- Task-related pages to provide task context

**Implementation Pattern:**
```typescript
// apps/web/src/hooks/useCopilotContext.ts
import { useCopilotReadable } from "@copilotkit/react-core";
import { usePathname } from "next/navigation";

export function useCopilotProjectContext(project: Project | null) {
  useCopilotReadable({
    description: "The currently active project in the workspace",
    value: project ? {
      id: project.id,
      name: project.name,
      status: project.status,
      phase: project.currentPhase,
    } : null,
  });
}

export function useCopilotPageContext() {
  const pathname = usePathname();

  useCopilotReadable({
    description: "The current page/view the user is on",
    value: {
      path: pathname,
      section: getSection(pathname), // 'dashboard' | 'projects' | 'settings' etc
    },
  });
}
```

**Testing Requirements:**
- Unit: Context updates when project changes
- Unit: Context includes page information
- Integration: Agent receives context in requests

---

### Story DM-01.6: CCR Routing Settings UI (8 points)

**Key Implementation Details:**
- Add "Routing & Fallbacks" tab to AI Config settings
- Create CCRRoutingConfig component
- Implement agent-to-provider routing UI
- Support fallback chain configuration

**Files to Create:**
- `apps/web/src/app/(dashboard)/settings/ai-config/routing/page.tsx`
- `apps/web/src/components/settings/ccr-routing-config.tsx`
- `apps/web/src/hooks/useCCRRouting.ts`

**Files to Modify:**
- `apps/web/src/components/settings/ai-config-subnav.tsx`

**UI Pattern (follow existing AgentModelPreferences):**
```typescript
// ccr-routing-config.tsx
export function CCRRoutingConfig() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Routing Configuration
        </CardTitle>
        <CardDescription>
          Configure how AI requests are routed between providers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global default */}
        <RoutingModeSelector />

        {/* Per-agent overrides */}
        <AgentRoutingOverrides />

        {/* Fallback chains */}
        <FallbackChainConfig />
      </CardContent>
    </Card>
  );
}
```

**Testing Requirements:**
- Unit: Routing mode selector works
- Unit: Fallback chain can be configured
- Integration: Settings persist to backend

---

### Story DM-01.7: CCR Connection Status (5 points)

**Key Implementation Details:**
- Create CCRStatus component showing connection state
- Display per-provider health indicators
- Show active routing mode
- Add reconnection controls

**Files to Create:**
- `apps/web/src/components/settings/ccr-status.tsx`
- `apps/web/src/hooks/useCCRStatus.ts`

**Pattern (follow ProviderHealthStatus):**
```typescript
// useCCRStatus.ts
export interface CCRStatus {
  connected: boolean;
  mode: 'auto' | 'manual';
  providers: Array<{
    id: string;
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    latency?: number;
  }>;
  lastChecked: string;
}

export function useCCRStatus() {
  return useQuery({
    queryKey: ['ccr-status'],
    queryFn: fetchCCRStatus,
    refetchInterval: DM_CONSTANTS.CCR.STATUS_POLL_INTERVAL_MS,
  });
}
```

**Testing Requirements:**
- Unit: Status displays correctly for all states
- Unit: Reconnect button triggers reconnection
- Unit: Provider health colors are correct

---

### Story DM-01.8: CCR Quota & Usage Display (5 points)

**Key Implementation Details:**
- Add subscription quota progress bars
- Display remaining API calls per provider
- Show quota reset dates
- Integrate with existing usage dashboard

**Files to Create:**
- `apps/web/src/components/settings/ccr-quota-display.tsx`
- `apps/web/src/hooks/useCCRQuota.ts`

**Files to Modify:**
- `apps/web/src/app/(dashboard)/settings/ai-config/usage/page.tsx`

**Pattern (follow TokenUsageDashboard):**
```typescript
// ccr-quota-display.tsx
export function CCRQuotaDisplay() {
  const { data: quotas, isLoading } = useCCRQuota();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Quotas</CardTitle>
        <CardDescription>Platform subscription usage and limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {quotas?.map((quota) => (
          <QuotaProgressBar
            key={quota.provider}
            provider={quota.provider}
            used={quota.used}
            limit={quota.limit}
            resetDate={quota.resetDate}
            warningThreshold={DM_CONSTANTS.CCR.DEFAULT_QUOTA_WARNING_THRESHOLD}
          />
        ))}
      </CardContent>
    </Card>
  );
}
```

**Testing Requirements:**
- Unit: Progress bars render correctly
- Unit: Warning state shown at threshold
- Unit: Reset date displays correctly

---

## 7. Constants and Configuration

### 7.1 Constants Definition

```typescript
// apps/web/src/lib/dm-constants.ts

/**
 * Dynamic Module System Constants
 *
 * All magic numbers for DM-01 must be defined here.
 * Do NOT hardcode values in components.
 */
export const DM_CONSTANTS = {
  // CopilotKit Configuration
  COPILOTKIT: {
    /** Delay before attempting reconnection (ms) */
    RECONNECT_DELAY_MS: 1000,
    /** Maximum number of reconnection attempts */
    MAX_RECONNECT_ATTEMPTS: 5,
    /** Connection timeout (ms) */
    CONNECTION_TIMEOUT_MS: 30000,
    /** Heartbeat interval for keeping connection alive (ms) */
    HEARTBEAT_INTERVAL_MS: 15000,
  },

  // Widget Rendering
  WIDGETS: {
    /** Maximum widgets per dashboard page */
    MAX_WIDGETS_PER_PAGE: 12,
    /** Minimum widget height in pixels */
    WIDGET_MIN_HEIGHT_PX: 100,
    /** Maximum widget height in pixels */
    WIDGET_MAX_HEIGHT_PX: 600,
    /** Animation duration for widget transitions (ms) */
    ANIMATION_DURATION_MS: 200,
    /** Skeleton loading pulse duration (ms) */
    SKELETON_PULSE_DURATION_MS: 1500,
    /** Debounce delay for widget resize events (ms) */
    DEBOUNCE_RESIZE_MS: 150,
  },

  // Chat UI
  CHAT: {
    /** Maximum message length in characters */
    MAX_MESSAGE_LENGTH: 10000,
    /** Maximum messages to keep in chat history */
    MAX_HISTORY_MESSAGES: 100,
    /** Delay before showing typing indicator (ms) */
    TYPING_INDICATOR_DELAY_MS: 500,
    /** Distance from bottom to trigger auto-scroll (px) */
    AUTO_SCROLL_THRESHOLD_PX: 100,
    /** Keyboard shortcut for opening chat */
    KEYBOARD_SHORTCUT: 'k',
    /** Modifier key for keyboard shortcut */
    KEYBOARD_MODIFIER: 'meta', // Cmd on Mac, Ctrl on Windows
  },

  // CCR Configuration
  CCR: {
    /** Quota warning threshold (0-1) */
    DEFAULT_QUOTA_WARNING_THRESHOLD: 0.8,
    /** Quota critical threshold (0-1) */
    DEFAULT_QUOTA_CRITICAL_THRESHOLD: 0.95,
    /** Status polling interval (ms) */
    STATUS_POLL_INTERVAL_MS: 30000,
    /** Reconnection backoff multiplier */
    RECONNECT_BACKOFF_MULTIPLIER: 1.5,
    /** Maximum reconnection backoff (ms) */
    MAX_RECONNECT_BACKOFF_MS: 60000,
  },

  // Performance
  PERFORMANCE: {
    /** Budget for initial render (ms) */
    INITIAL_RENDER_BUDGET_MS: 100,
    /** Budget for user interactions (ms) */
    INTERACTION_BUDGET_MS: 50,
    /** Warning threshold for bundle size (KB) */
    BUNDLE_SIZE_WARNING_KB: 500,
  },

  // Z-Index Layers (extend existing Z_INDEX)
  Z_INDEX: {
    /** Copilot chat sidebar */
    COPILOT_CHAT: 60,
    /** Widget overlay (e.g., expanded view) */
    WIDGET_OVERLAY: 55,
  },
} as const;

export type DMConstantsType = typeof DM_CONSTANTS;
```

### 7.2 Rate Limiting Requirements

Apply rate limiting to compute-intensive AG-UI endpoints:

| Endpoint | Rate Limit | Burst | Rationale |
|----------|------------|-------|-----------|
| `/api/copilotkit` | 30/min | 10 | Streaming is expensive |
| Widget render (via tool call) | 60/min | 20 | Prevents UI spam |
| Chat message | 20/min | 5 | Prevents abuse |
| CCR routing changes | 10/min | 3 | Config changes are rare |
| CCR status poll | 60/min | 30 | Background polling |

**Note:** Rate limiting is implemented in DM-02 (backend). Frontend should handle 429 errors gracefully.

---

## 8. Testing Strategy

### 8.1 Unit Test Requirements

Each story must include unit tests for:

| Story | Test Focus | Minimum Coverage |
|-------|------------|------------------|
| DM-01.1 | Provider setup, env handling | 80% |
| DM-01.2 | Registry lookup, error boundary | 90% |
| DM-01.3 | Widget render, states | 85% |
| DM-01.4 | Chat toggle, keyboard shortcuts | 80% |
| DM-01.5 | Context updates | 80% |
| DM-01.6 | Routing UI interactions | 85% |
| DM-01.7 | Status display | 80% |
| DM-01.8 | Quota calculations | 85% |

**Test File Location:**
```
apps/web/src/components/slots/__tests__/
apps/web/src/components/copilot/__tests__/
apps/web/src/components/settings/__tests__/
apps/web/src/hooks/__tests__/
```

### 8.2 Integration Test Approach

**Focus Areas:**
1. CopilotKit provider integrates with existing providers
2. Slot system receives and renders widget tool calls
3. CCR settings persist and reload correctly
4. Context providers update on navigation

**Mock Strategy:**
```typescript
// __mocks__/@copilotkit/react-core.ts
export const CopilotKit = ({ children }) => children;
export const useCopilotReadable = vi.fn();
export const useRenderToolCall = vi.fn();
```

### 8.3 E2E Test Scenarios

**Playwright Tests:**

```typescript
// e2e/copilot-chat.spec.ts
test.describe('Copilot Chat', () => {
  test('opens with keyboard shortcut', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Meta+k');
    await expect(page.getByRole('dialog', { name: /assistant/i })).toBeVisible();
  });

  test('persists across navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Meta+k');
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('a[href="/projects"]');
    await expect(page.getByText('Test message')).toBeVisible();
  });
});

// e2e/widget-rendering.spec.ts
test.describe('Widget Rendering', () => {
  test('renders widget from agent tool call', async ({ page }) => {
    // This test requires DM-02 backend or mock
    await page.goto('/dashboard');
    // Trigger agent to render widget
    await page.keyboard.press('Meta+k');
    await page.fill('[data-testid="chat-input"]', 'Show project status');
    await page.press('[data-testid="chat-input"]', 'Enter');
    await expect(page.getByTestId('project-status-widget')).toBeVisible();
  });
});
```

### 8.4 Accessibility Testing

```typescript
// Use axe-core for automated a11y testing
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('chat dialog has no violations', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Meta+k');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('widgets have no violations', async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for widgets to load
    await page.waitForSelector('[data-testid^="widget-"]');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

---

## 9. Risk Mitigation

### 9.1 AG-UI Protocol Maturity

**Risk:** Protocol is relatively new, may have edge cases.

**Mitigation:**
- Implement comprehensive error handling in DashboardSlots
- Add fallback to text-only mode if tool calls fail
- Log all AG-UI errors for debugging

### 9.2 Bundle Size Impact

**Risk:** CopilotKit adds significant JS, may impact performance.

**Mitigation:**
- Use dynamic imports for CopilotKit components
- Enable tree-shaking by importing only needed exports
- Add bundle size check to CI pipeline

```typescript
// Dynamic import pattern
const CopilotSidebar = dynamic(
  () => import('@copilotkit/react-ui').then((mod) => mod.CopilotSidebar),
  { ssr: false, loading: () => <ChatSkeleton /> }
);
```

### 9.3 SSR Compatibility

**Risk:** CopilotKit may not be SSR-compatible.

**Mitigation:**
- Wrap CopilotKit components in `'use client'` boundary
- Use `typeof window !== 'undefined'` checks
- Use dynamic imports with `ssr: false`

### 9.4 Rate Limiting Bypass

**Risk:** Rate limits might be bypassed.

**Mitigation:**
- Implement client-side rate limiting as first line of defense
- Show user feedback when approaching limits
- Graceful degradation when limits reached

---

## 10. Success Criteria

| Criteria | Measurement | Target |
|----------|-------------|--------|
| CopilotKit fully integrated | Provider renders, no errors | Pass |
| Chat UI available globally | Chat accessible from all pages | Pass |
| 4 widget types implemented | All widgets render correctly | Pass |
| Context awareness working | Agent receives project/page context | Pass |
| CCR routing settings functional | Settings persist and load | Pass |
| CCR connection status visible | Status shows in settings | Pass |
| CCR quota display integrated | Quotas show on usage page | Pass |
| No performance regressions | Lighthouse score > 90 | Pass |
| All accessibility requirements met | axe-core violations = 0 | Pass |

---

## 11. References

- [Epic DM-01 Definition](./epic-dm-01-copilotkit-frontend.md)
- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [Remote Coding Agent Patterns (CCR Section)](../../architecture/remote-coding-agent-patterns.md)
- [CopilotKit Documentation](https://docs.copilotkit.ai)
- [AG-UI Protocol](https://github.com/ag-ui-protocol/ag-ui)
- [shadcn/ui Components](https://ui.shadcn.com)

---

*Generated: 2025-12-29*
*Epic: DM-01 | Phase: 1 | Stories: 8 | Points: 44*
