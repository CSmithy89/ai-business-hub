# Story PM-12.1: Agent UI Components

**Epic:** PM-12 - Consolidated Follow-ups from PM-04/PM-05
**Status:** drafted
**Points:** 13

---

## User Story

As a **project user**,
I want **dedicated UI components for interacting with PM agents**,
So that **I can chat with agents, review suggestions, track time, see estimations, and monitor project health from a unified interface**.

---

## Acceptance Criteria

### AC1: AgentPanel Renders with Agent Selector and Message Input
**Given** I am on a project page
**When** I open the agent panel
**Then** I see a collapsible chat interface with agent selector and message input field

### AC2: SuggestionCard Displays All Suggestion Types with Actions
**Given** there are pending suggestions from agents
**When** I view the suggestions list
**Then** each SuggestionCard displays type, title, confidence, and Accept/Reject/Snooze actions

### AC3: TimeTracker Supports Start/Stop and Manual Entry
**Given** I want to log time on a task
**When** I use the TimeTracker component
**Then** I can start/stop a timer or manually enter time

### AC4: EstimationDisplay Shows Fibonacci Points with Confidence
**Given** Sage has provided a story point estimation
**When** I view the EstimationDisplay
**Then** I see Fibonacci points with confidence meter and similar tasks comparison

### AC5: HealthDashboard Integrates with Existing Health Components
**Given** I am viewing a project overview
**When** I view the HealthDashboard
**Then** I see health score gauge, factor breakdown, trend indicator, and active risks

### AC6: All Components Are Mobile-Responsive
**Given** I am on a mobile device
**When** I view any agent UI component
**Then** the component renders correctly and is usable on smaller screens

### AC7: Components Follow Existing shadcn/ui Patterns
**Given** new components are created
**When** they are implemented
**Then** they use existing shadcn/ui primitives and follow established design patterns

---

## Technical Approach

### Components to Create

#### 1. AgentPanel.tsx
Main chat interface for agent interactions.

```typescript
interface AgentPanelProps {
  projectId: string;
  defaultAgent?: 'navi' | 'sage' | 'chrono' | 'scope' | 'pulse' | 'herald';
  collapsed?: boolean;
  onSuggestionCreated?: (suggestion: Suggestion) => void;
}
```

**Features:**
- Collapsible chat interface
- Agent selector (tab or dropdown)
- Message history with React Query
- Real-time responses via WebSocket
- Slash command support

#### 2. SuggestionCard.tsx
Individual suggestion display with actions.

```typescript
interface SuggestionCardProps {
  suggestion: {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
    confidence: number;
    payload: Record<string, unknown>;
    expiresAt: string;
    status: 'pending' | 'accepted' | 'rejected' | 'snoozed';
  };
  onAccept: () => void;
  onReject: () => void;
  onSnooze: (hours: number) => void;
  isLoading?: boolean;
}
```

**Features:**
- Confidence indicator (color-coded)
- Expand/collapse for details
- Accept/Reject/Snooze actions
- Expiration countdown

#### 3. SuggestionList.tsx
Container component for listing pending suggestions.

**Features:**
- Filters by suggestion type
- Pagination or virtual scroll for many suggestions
- Empty state handling

#### 4. TimeTracker.tsx
Time tracking widget for logging work.

```typescript
interface TimeTrackerProps {
  taskId?: string;
  projectId: string;
  onTimeLogged?: (entry: TimeEntry) => void;
}
```

**Features:**
- Start/stop timer
- Manual time entry
- Task selector (optional)
- Current active timer display
- Integration with Chrono agent suggestions

#### 5. EstimationDisplay.tsx
Story point estimation UI.

```typescript
interface EstimationDisplayProps {
  taskId: string;
  estimation: {
    storyPoints: number;
    confidence: number;
    similarTasks: SimilarTask[];
    explanation: string;
  };
  onAccept: () => void;
  onAdjust: (points: number) => void;
}
```

**Features:**
- Fibonacci point display
- Confidence meter
- Similar tasks comparison
- Accept or adjust actions

#### 6. HealthDashboard.tsx
Project health overview component.

```typescript
interface HealthDashboardProps {
  projectId: string;
  compact?: boolean;
}
```

**Features:**
- Health score gauge (0-100)
- Factor breakdown (on-time, blockers, capacity, velocity)
- Trend indicator (improving/declining/stable)
- Active risks summary
- Link to RiskListPanel

### File Locations

| File | Purpose |
|------|---------|
| `apps/web/src/components/pm/agents/AgentPanel.tsx` | Main agent chat interface |
| `apps/web/src/components/pm/agents/SuggestionCard.tsx` | Individual suggestion display |
| `apps/web/src/components/pm/agents/SuggestionList.tsx` | List container for suggestions |
| `apps/web/src/components/pm/agents/TimeTracker.tsx` | Time tracking widget |
| `apps/web/src/components/pm/agents/EstimationDisplay.tsx` | Estimation results display |
| `apps/web/src/components/pm/agents/HealthDashboard.tsx` | Health score overview |
| `apps/web/src/components/pm/agents/constants.ts` | Shared constants (agent colors, icons) |
| `apps/web/src/components/pm/agents/index.ts` | Barrel exports |
| `apps/web/src/hooks/use-agent-chat.ts` | Chat state management hook |
| `apps/web/src/hooks/use-suggestions.ts` | Suggestions query hook |
| `apps/web/src/hooks/use-time-tracking.ts` | Time tracking state hook |

### Dependencies

**External Libraries:**
- React Query (already in project) - Data fetching and caching
- shadcn/ui components - UI primitives
- Lucide React - Icons

**Internal Dependencies:**
- `@/providers/socket-provider` - WebSocket connection
- `@/components/ui/*` - shadcn/ui components
- Existing health components (`RiskCard`, `RiskListPanel`)

### Design Patterns

Follow existing patterns from:
- `apps/web/src/components/pm/health/` - Health-related components
- `apps/web/src/components/pm/tasks/` - Task-related components
- `apps/web/src/components/ui/` - shadcn/ui primitives

---

## Technical Notes

### Agent Colors and Icons

**Location:** `apps/web/src/components/pm/agents/constants.ts`

```typescript
export const AGENT_CONFIG = {
  navi: {
    name: 'Navi',
    role: 'Orchestration',
    color: 'blue',
    icon: 'Compass',
  },
  sage: {
    name: 'Sage',
    role: 'Estimation',
    color: 'purple',
    icon: 'Calculator',
  },
  chrono: {
    name: 'Chrono',
    role: 'Time Tracking',
    color: 'orange',
    icon: 'Clock',
  },
  scope: {
    name: 'Scope',
    role: 'Phase Management',
    color: 'green',
    icon: 'Target',
  },
  pulse: {
    name: 'Pulse',
    role: 'Health Monitoring',
    color: 'red',
    icon: 'Heart',
  },
  herald: {
    name: 'Herald',
    role: 'Reporting',
    color: 'indigo',
    icon: 'FileText',
  },
} as const;
```

### React Query Hooks

**use-agent-chat.ts:**
```typescript
export function useAgentChat(projectId: string, agentName: string) {
  // Manages chat messages, sending messages, loading state
  // Uses React Query for conversation history
  // Integrates with WebSocket for real-time responses
}
```

**use-suggestions.ts:**
```typescript
export function useSuggestions(projectId: string) {
  // Fetches pending suggestions
  // Provides accept/reject/snooze mutations
  // Handles optimistic updates
}
```

**use-time-tracking.ts:**
```typescript
export function useTimeTracking(projectId: string) {
  // Manages active timer state
  // Provides start/stop/log mutations
  // Syncs with Chrono agent
}
```

### Confidence Color Mapping

```typescript
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'text-green-500';
  if (confidence >= 0.60) return 'text-yellow-500';
  return 'text-red-500';
}
```

---

## Dependencies

### Prerequisites

- **PM-04** (Navi, Sage, Chrono) - Agent backend services
- **PM-05** (Scope, Pulse, Herald) - Agent backend services
- **PM-06** (Real-time & Notifications) - WebSocket infrastructure

### Blocks

- **PM-12.6** (Real-time Agent Features) - Uses agent subscription hook

---

## Tasks

### Component Tasks
- [ ] Create `apps/web/src/components/pm/agents/constants.ts` with agent config
- [ ] Create `apps/web/src/components/pm/agents/AgentPanel.tsx`
- [ ] Create `apps/web/src/components/pm/agents/SuggestionCard.tsx`
- [ ] Create `apps/web/src/components/pm/agents/SuggestionList.tsx`
- [ ] Create `apps/web/src/components/pm/agents/TimeTracker.tsx`
- [ ] Create `apps/web/src/components/pm/agents/EstimationDisplay.tsx`
- [ ] Create `apps/web/src/components/pm/agents/HealthDashboard.tsx`
- [ ] Create `apps/web/src/components/pm/agents/index.ts` barrel exports

### Hook Tasks
- [ ] Create `apps/web/src/hooks/use-agent-chat.ts`
- [ ] Create `apps/web/src/hooks/use-suggestions.ts`
- [ ] Create `apps/web/src/hooks/use-time-tracking.ts`

### Integration Tasks
- [ ] Integrate AgentPanel into project detail page
- [ ] Add suggestion indicators to project header
- [ ] Connect TimeTracker to task detail panel
- [ ] Add HealthDashboard to project overview

### Responsive Design Tasks
- [ ] Test and adjust AgentPanel for mobile
- [ ] Test and adjust SuggestionCard for mobile
- [ ] Ensure touch-friendly interactions

---

## Testing Requirements

### Unit Tests

**Components:**
- AgentPanel renders agent selector and input
- SuggestionCard displays all suggestion fields
- Accept/Reject/Snooze callbacks trigger correctly
- TimeTracker timer starts and stops
- EstimationDisplay renders Fibonacci points
- HealthDashboard integrates with existing health components

**Location:** `apps/web/src/components/pm/agents/__tests__/`

### Integration Tests

**User Flows:**
- Open agent panel from project page
- Send message to agent and receive response
- Accept a pending suggestion
- Start and stop time tracker
- View health dashboard with real data

**Location:** `apps/web/e2e/pm/agents/`

### Visual Regression Tests

- Capture snapshots of all components in various states
- Test dark mode rendering
- Test mobile responsive layouts

---

## Definition of Done

- [ ] All 7 acceptance criteria met
- [ ] All 6 components implemented
- [ ] All 3 hooks implemented
- [ ] TypeScript types complete for all interfaces
- [ ] Components use shadcn/ui patterns
- [ ] Mobile-responsive on all breakpoints
- [ ] Unit tests written and passing
- [ ] Integration with existing project pages
- [ ] Code reviewed and approved
- [ ] No TypeScript errors
- [ ] Lint passing

---

## References

- [Epic Definition](../epics/epic-pm-12-consolidated-followups.md)
- [Epic Tech Spec](../tech-specs/epic-pm-12-tech-spec.md) - Section 3.1
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)
- [Existing Health Components](../../../../apps/web/src/components/pm/health/)
- [PM-04 Retrospective](../retrospectives/pm-04-retrospective.md)
- [PM-05 Retrospective](../retrospectives/pm-05-retrospective.md)

---

## Dev Notes

### Component Time Boxing

As noted in the tech spec, each component should be time-boxed to a maximum of 2 days to prevent scope creep. Focus on MVP features only.

### Existing Patterns to Follow

The `apps/web/src/components/pm/health/` directory contains RiskCard and RiskListPanel which follow similar patterns to what we need for SuggestionCard and SuggestionList.

### WebSocket Integration

The HealthDashboard should listen for `pm.health.updated` events to refresh data in real-time. The AgentPanel should listen for `pm.agent.thinking`, `pm.agent.streaming`, and `pm.agent.completed` events (from PM-12.6).

### Suggestion Expiration

Suggestions have an `expiresAt` field. The SuggestionCard should show a countdown and visually indicate when a suggestion is about to expire. Expired suggestions should be filtered out or marked as stale.

### Timer Persistence

The TimeTracker should persist active timer state to localStorage so that refreshing the page doesn't lose an active timer. The actual time entry is only created when the timer is stopped.

---
