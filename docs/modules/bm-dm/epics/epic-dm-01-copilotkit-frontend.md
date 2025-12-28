# Epic DM-01: CopilotKit Frontend Infrastructure

## Overview

Install and configure CopilotKit with AG-UI protocol support to enable Generative UI capabilities. This epic establishes the frontend infrastructure for the Dynamic Module System's "Slot" architecture.

## Scope

### From Architecture Doc (Phase 1)

This epic implements Phase 1 of the Dynamic Module System architecture:
- Install CopilotKit and AG-UI dependencies
- Configure CopilotKit runtime with Agno adapter
- Implement the "Slot" system using Generative UI
- Create base widget components

## Proposed Stories

### Story DM-01.1: CopilotKit Installation & Setup

Install dependencies and configure the CopilotKit provider:

- Install `@copilotkit/react-core`, `@copilotkit/react-ui`, `@ag-ui/agno`
- Configure CopilotKit provider in `apps/web/src/app/providers.tsx`
- Set up AG-UI connection to Agno backend
- Configure environment variables

**Acceptance Criteria:**
- CopilotKit provider wraps the application
- AG-UI connection established (can verify in network tab)
- No console errors related to CopilotKit

**Points:** 3

### Story DM-01.2: Slot System Foundation

Implement the base Slot system using `useRenderToolCall`:

- Create `apps/web/src/components/slots/DashboardSlots.tsx`
- Implement `render_dashboard_widget` tool handler
- Create widget type registry pattern
- Add fallback for unknown widget types

**Acceptance Criteria:**
- `useRenderToolCall` configured for dashboard widgets
- Widget registry maps types to components
- Unknown widget types show error component
- TypeScript types for widget data

**Points:** 5

### Story DM-01.3: Base Widget Components

Create foundational widget components for the Slot system:

- `ProjectStatusWidget` - Project health and status display
- `TaskListWidget` - Compact task list view
- `MetricsWidget` - Key metrics display
- `AlertWidget` - Alert/notification display

**Acceptance Criteria:**
- All widgets follow shadcn/ui patterns
- Widgets accept typed data props
- Responsive design for all screen sizes
- Loading and error states handled

**Points:** 8

### Story DM-01.4: CopilotKit Chat Integration

Add CopilotKit chat UI to the application:

- Integrate `CopilotSidebar` or `CopilotPopup` component
- Configure chat styling to match HYVVE design
- Add keyboard shortcuts for chat toggle
- Implement context-aware chat placement

**Acceptance Criteria:**
- Chat UI available globally
- Styling matches HYVVE theme
- Keyboard shortcut works (e.g., Cmd+K)
- Chat persists across navigation

**Points:** 5

### Story DM-01.5: Context Provider Integration

Implement `useCopilotReadable` for context awareness:

- Add context providers for active project
- Add context providers for current view/page
- Add context providers for selected tasks
- Ensure context updates on navigation

**Acceptance Criteria:**
- Active project context available to agents
- Current page/view context provided
- Selected items context provided
- Context updates reactively

**Points:** 5

### Story DM-01.6: CCR Routing Settings UI

Extend AI Config settings with CCR routing configuration:

- Add "Routing & Fallbacks" tab to `/settings/ai-config/`
- Create `CCRRoutingConfig` component for routing rules
- Add platform subscription toggle per agent
- Implement fallback chain configuration UI

**Acceptance Criteria:**
- New subnav item "Routing & Fallbacks" appears
- Users can toggle platform vs BYOAI per agent
- Fallback chains configurable via drag-drop or select
- Settings persist to backend

**Points:** 8

### Story DM-01.7: CCR Connection Status

Display CCR connection and provider health status:

- Add `CCRStatus` component showing connection state
- Display per-provider health indicators
- Show active routing mode (auto/manual)
- Add reconnection controls

**Acceptance Criteria:**
- CCR connection status visible in settings
- Provider health shown (green/yellow/red)
- Current routing mode displayed
- Manual reconnect button works

**Points:** 5

### Story DM-01.8: CCR Quota & Usage Display

Extend usage dashboard with CCR subscription quotas:

- Add subscription quota progress bars
- Display remaining API calls per provider
- Show quota reset dates
- Integrate with alert configuration

**Acceptance Criteria:**
- Quota usage visible per subscription
- Progress bars show consumption
- Reset dates displayed
- Low quota warnings shown

**Points:** 5

## Total Points: 44

## Dependencies

- None (foundational epic)

## Technical Notes

### Key Files to Create/Modify

```
apps/web/src/
├── app/
│   └── providers.tsx              # Add CopilotKit provider
│   └── (dashboard)/settings/ai-config/
│       └── routing/
│           └── page.tsx           # CCR routing settings page
├── components/
│   ├── slots/
│   │   ├── DashboardSlots.tsx     # Slot registry
│   │   └── widgets/
│   │       ├── ProjectStatusWidget.tsx
│   │       ├── TaskListWidget.tsx
│   │       ├── MetricsWidget.tsx
│   │       └── AlertWidget.tsx
│   ├── copilot/
│   │   └── CopilotChat.tsx        # Chat UI wrapper
│   └── settings/
│       ├── ccr-routing-config.tsx # CCR routing configuration
│       ├── ccr-status.tsx         # CCR connection status
│       └── ccr-quota-display.tsx  # CCR quota/usage display
└── hooks/
    ├── useCopilotContext.ts       # Context hook
    └── useCCRStatus.ts            # CCR status hook
```

### Environment Variables

```env
NEXT_PUBLIC_AGNO_URL=http://localhost:8000
```

## Technical Requirements (Lessons from PM-08/PM-16)

### Constants (Define Before Implementation)

All magic numbers MUST be defined as constants in a dedicated file:

```typescript
// apps/web/src/lib/dm-constants.ts

export const DM_CONSTANTS = {
  // CopilotKit Configuration
  COPILOTKIT: {
    RECONNECT_DELAY_MS: 1000,
    MAX_RECONNECT_ATTEMPTS: 5,
    CONNECTION_TIMEOUT_MS: 30000,
    HEARTBEAT_INTERVAL_MS: 15000,
  },

  // Widget Rendering
  WIDGETS: {
    MAX_WIDGETS_PER_PAGE: 12,
    WIDGET_MIN_HEIGHT_PX: 100,
    WIDGET_MAX_HEIGHT_PX: 600,
    ANIMATION_DURATION_MS: 200,
    SKELETON_PULSE_DURATION_MS: 1500,
    DEBOUNCE_RESIZE_MS: 150,
  },

  // Chat UI
  CHAT: {
    MAX_MESSAGE_LENGTH: 10000,
    MAX_HISTORY_MESSAGES: 100,
    TYPING_INDICATOR_DELAY_MS: 500,
    AUTO_SCROLL_THRESHOLD_PX: 100,
  },

  // CCR Configuration
  CCR: {
    DEFAULT_QUOTA_WARNING_THRESHOLD: 0.8,  // 80%
    DEFAULT_QUOTA_CRITICAL_THRESHOLD: 0.95, // 95%
    STATUS_POLL_INTERVAL_MS: 30000,
    RECONNECT_BACKOFF_MULTIPLIER: 1.5,
    MAX_RECONNECT_BACKOFF_MS: 60000,
  },

  // Performance
  PERFORMANCE: {
    INITIAL_RENDER_BUDGET_MS: 100,
    INTERACTION_BUDGET_MS: 50,
    BUNDLE_SIZE_WARNING_KB: 500,
  },
};
```

### Rate Limiting Requirements

AG-UI endpoints are compute-intensive (streaming, real-time). Apply rate limiting by design:

| Endpoint | Rate Limit | Burst | Rationale |
|----------|------------|-------|-----------|
| `/api/copilotkit` | 30/min | 10 | Streaming is expensive |
| Widget render | 60/min | 20 | Prevents UI spam |
| Chat message | 20/min | 5 | Prevents abuse |
| CCR routing changes | 10/min | 3 | Config changes are rare |
| CCR status poll | 60/min | 30 | Background polling |

**Implementation Pattern:**
```typescript
// Use existing @nestjs/throttler pattern from PM-08
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('copilotkit')
export class CopilotKitController { ... }
```

### Performance Budgets

| Metric | Target | Critical | Measurement |
|--------|--------|----------|-------------|
| **Initial Widget Render** | <100ms | <200ms | First Contentful Paint |
| **Widget Update** | <50ms | <100ms | Re-render after data change |
| **Chat Response Start** | <500ms | <1000ms | Time to first token |
| **Bundle Size (CopilotKit)** | <200KB | <300KB | Gzipped |
| **Memory (10 widgets)** | <50MB | <100MB | Heap snapshot |
| **Lighthouse Score** | >90 | >80 | Performance audit |

**Monitoring:**
- Add Lighthouse CI to PR checks
- Use `@next/bundle-analyzer` for bundle monitoring
- Add Web Vitals tracking (CLS, LCP, FID)

### Accessibility Requirements

- All widgets must be keyboard navigable
- Screen reader support for dynamic content updates (aria-live)
- Respect `prefers-reduced-motion` (from EPIC-16 lessons)
- Focus management when widgets appear/disappear
- Color contrast ratios per WCAG 2.1 AA

### Error Handling Standards

```typescript
// Standard error boundary pattern for widgets
class WidgetErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <WidgetErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Testing Requirements

- Unit tests for all widget components
- Integration tests for CopilotKit provider
- E2E tests for chat flow (Playwright)
- Performance tests for widget rendering
- Accessibility tests with axe-core

## Risks

1. **AG-UI Protocol Maturity** - Protocol is relatively new, may have edge cases
2. **Bundle Size** - CopilotKit adds significant JS, monitor bundle impact
3. **SSR Compatibility** - Ensure proper client-side only rendering
4. **Rate Limiting Bypass** - Ensure rate limits apply to authenticated routes

## Success Criteria

- CopilotKit fully integrated and functional
- Chat UI available throughout the application
- At least 4 widget types implemented
- Context awareness working for projects and tasks
- CCR routing settings UI functional
- CCR connection status visible
- CCR quota display integrated
- No performance regressions

## References

- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [Remote Coding Agent Patterns (CCR Section)](../../architecture/remote-coding-agent-patterns.md)
- [CopilotKit Documentation](https://docs.copilotkit.ai)
- [AG-UI Protocol](https://github.com/ag-ui-protocol/ag-ui)
- [CCR-Custom Fork](https://github.com/VisionCraft3r/ccr-custom)
