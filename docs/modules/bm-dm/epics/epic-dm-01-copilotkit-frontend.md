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

## Risks

1. **AG-UI Protocol Maturity** - Protocol is relatively new, may have edge cases
2. **Bundle Size** - CopilotKit adds significant JS, monitor bundle impact
3. **SSR Compatibility** - Ensure proper client-side only rendering

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
