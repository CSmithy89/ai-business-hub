# Technical Specification - Epic 13: AI Agent Management

**Epic ID:** EPIC-13
**Status:** Contexted
**Priority:** P1/P2 - High/Medium
**Phase:** Post-Foundation Enhancement
**Stories:** 6 stories, 25 points
**Dependencies:** EPIC-11 (Agent Integration) - Complete

---

## Epic Overview

Epic 13 implements the full AI agent management system from wireframes AI-02 through AI-05. This epic provides complete visibility and control over AI agents through a comprehensive UI that enables users to view, configure, and monitor all 16+ agents in the platform.

### Business Value

- **Agent Visibility:** Users can see all agents at a glance with real-time status
- **Agent Configuration:** Per-agent customization of BYOAI settings and behavior
- **Activity Monitoring:** Real-time feed of agent actions across the platform
- **Confidence Transparency:** Detailed breakdown of AI reasoning and confidence factors
- **Enterprise Adoption:** Essential control layer for organizations using AI automation

### Success Criteria

- [x] Agent dashboard shows all 16+ agents with status indicators
- [x] Agent detail modal provides full configuration access via tabbed interface
- [x] Activity feed shows real-time agent actions with filtering
- [x] Agent configuration page enables BYOAI customization per agent
- [x] Confidence breakdown shows detailed AI reasoning factors

---

## Architecture Decisions

### ADR-013.1: Component-Based Agent Cards

**Decision:** Create three variants of agent cards (Compact, Standard, Expanded) for different contexts

**Rationale:**
- Compact cards for dashboard grid views (minimal info)
- Standard cards for list views (performance stats)
- Expanded cards for detail modals (full actions)
- Reusable across multiple pages (dashboard, activity feed, search)

**Consequences:**
- Consistent agent representation across UI
- Optimized rendering for different contexts
- Flexible composition for future features

### ADR-013.2: Modal-Based Detail View

**Decision:** Use modal for agent details instead of dedicated page

**Rationale:**
- Faster interaction (no full page navigation)
- Maintains context of current view
- Follows pattern from approval system
- Better for quick agent inspection

**Consequences:**
- Must handle deep linking for agent URLs
- Modal state management required
- Need responsive behavior for mobile

### ADR-013.3: Real-Time Activity Feed

**Decision:** Use Server-Sent Events (SSE) for real-time activity updates

**Rationale:**
- Simpler than WebSocket for unidirectional updates
- Better browser compatibility and reconnection
- Existing pattern in codebase (chat streaming)
- Lower overhead than polling

**Consequences:**
- Need SSE endpoint in NestJS
- Client-side reconnection handling
- Consider rate limiting on activity events

### ADR-013.4: Confidence Factor Breakdown

**Decision:** Add confidence breakdown to approval detail modal, not separate page

**Rationale:**
- Contextual to approval item being reviewed
- Inline explanation improves decision quality
- Follows progressive disclosure principle
- Reduces navigation overhead

**Consequences:**
- Approval modal becomes slightly larger
- Need to fetch factor data on modal open
- Can be collapsed for high-confidence items

---

## Component Architecture

### Component Hierarchy

```
/components/agents/
├── AgentCard.tsx                  # Base card wrapper
│   ├── AgentCardCompact.tsx       # Avatar + name + status
│   ├── AgentCardStandard.tsx      # + performance stats
│   └── AgentCardExpanded.tsx      # + action buttons
│
├── AgentAvatar.tsx                # Avatar with status indicator
├── AgentStatusBadge.tsx           # Status indicator component
│
├── AgentDetailModal.tsx           # 5-tab modal
│   └── tabs/
│       ├── OverviewTab.tsx        # Info, metrics, capabilities
│       ├── ActivityTab.tsx        # Recent actions timeline
│       ├── ConfigurationTab.tsx   # Model settings, behavior
│       ├── PermissionsTab.tsx     # Data access, modules
│       └── AnalyticsTab.tsx       # Charts (tasks, success, time)
│
├── AgentGrid.tsx                  # Dashboard grid layout
├── AgentFilters.tsx               # Search + filters
├── AgentStatusSummary.tsx         # Header stats
│
├── ActivityFeed.tsx               # Real-time feed
├── ActivityCard.tsx               # Single activity item
├── ActivityFilters.tsx            # Filter controls
│
└── config/                        # Configuration components
    ├── ConfigSidebar.tsx          # 8-section navigation
    ├── GeneralSettings.tsx        # Name, avatar, theme
    ├── AIModelSettings.tsx        # Model, temp, tokens
    ├── BehaviorSettings.tsx       # Automation, confidence
    ├── IntegrationsSettings.tsx   # Connected services
    └── DangerZone.tsx             # Reset, disable, delete

/components/approval/
├── ConfidenceBreakdown.tsx        # Factor breakdown
├── ConfidenceFactorBar.tsx        # Individual factor bar
├── AIReasoning.tsx                # Low-confidence reasoning
└── SuggestedActions.tsx           # Action recommendations
```

### Page Routes

```
/agents                                    # Agent Dashboard (Story 13.5)
/agents/activity                           # Activity Feed (Story 13.3)
/agents/[id]/configure                     # Configuration Page (Story 13.4)
```

---

## Data Model

### Agent Entity

```typescript
/**
 * Agent configuration and metadata
 */
interface Agent {
  id: string;                      // Unique agent ID
  name: string;                    // Display name (e.g., "Vera")
  role: string;                    // Agent role (e.g., "Validation Orchestrator")
  team: AgentTeam;                 // Team type: validation | planning | branding | approval | orchestrator
  description: string;             // Agent description
  avatar: string;                  // Emoji or image URL
  themeColor: string;              // Brand color (hex)

  // Status
  status: AgentStatus;             // online | busy | offline | error
  lastActive: Date;                // Last activity timestamp

  // Capabilities
  capabilities: string[];          // List of agent capabilities

  // Performance Metrics (30-day rolling)
  metrics: {
    tasksCompleted: number;
    successRate: number;           // 0-100
    avgResponseTime: number;       // milliseconds
    confidenceAvg: number;         // 0-100
  };

  // Configuration
  config: {
    providerId: string | null;     // AI provider override (null = use workspace default)
    model: string | null;          // Model override (null = use workspace default)
    temperature: number;           // 0-2 (default 1)
    maxTokens: number;             // Max tokens per request
    contextWindow: number;         // 4000 | 8000 | 16000
    automationLevel: 'manual' | 'smart' | 'full_auto';
    confidenceThreshold: number;   // 0-100
    tone: number;                  // 0-100 (0=professional, 100=casual)
    customInstructions: string;    // Additional instructions
  };

  // Permissions
  permissions: {
    dataAccess: string[];          // Modules agent can access
    canExecuteActions: boolean;    // Can execute vs. recommend only
    requiresApproval: boolean;     // All actions need approval
  };

  // Metadata
  workspaceId: string;             // Workspace tenant ID
  enabled: boolean;                // Agent enabled/disabled
  createdAt: Date;
  updatedAt: Date;
}

type AgentTeam = 'validation' | 'planning' | 'branding' | 'approval' | 'orchestrator';
type AgentStatus = 'online' | 'busy' | 'offline' | 'error';
```

### Agent Activity Entity

```typescript
/**
 * Agent activity/action log
 */
interface AgentActivity {
  id: string;
  agentId: string;                 // Agent that performed action
  agentName: string;               // Agent display name
  workspaceId: string;             // Workspace tenant ID

  // Action details
  type: ActivityType;              // task_started | task_completed | approval_requested | error
  action: string;                  // Human-readable action (e.g., "Analyzed market size")
  module: string;                  // Source module (validation, planning, etc.)
  entityId?: string;               // Related entity ID
  entityType?: string;             // Entity type (business, approval, etc.)

  // Status
  status: 'pending' | 'completed' | 'failed';
  confidenceScore?: number;        // 0-100 if applicable

  // Data
  input?: Record<string, unknown>; // Action input data
  output?: Record<string, unknown>; // Action output data
  error?: string;                  // Error message if failed

  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  duration?: number;               // milliseconds

  createdAt: Date;
}

type ActivityType =
  | 'task_started'
  | 'task_completed'
  | 'approval_requested'
  | 'approval_processed'
  | 'error'
  | 'config_changed';
```

### Confidence Factor Entity

```typescript
/**
 * Confidence breakdown factors
 * Added to existing ApprovalItem type
 */
interface ConfidenceFactor {
  factor: string;                  // Factor name (e.g., "Content Quality")
  score: number;                   // 0-100
  weight: number;                  // 0-1 (factor importance)
  explanation: string;             // Why this score?
}

/**
 * Suggested action based on low confidence
 */
interface SuggestedAction {
  action: string;                  // Action name (e.g., "Schedule Review Call")
  reason: string;                  // Why suggested
  priority: 'high' | 'medium' | 'low';
}
```

---

## API Endpoints

### Agent Management Endpoints

| Method | Endpoint | Request | Response | Description |
|--------|----------|---------|----------|-------------|
| GET | `/api/agents` | - | `{ data: Agent[] }` | List all agents for workspace |
| GET | `/api/agents/:id` | - | `{ data: Agent }` | Get single agent details |
| PATCH | `/api/agents/:id` | `Partial<Agent['config']>` | `{ data: Agent }` | Update agent configuration |
| POST | `/api/agents/:id/enable` | - | `{ data: Agent }` | Enable agent |
| POST | `/api/agents/:id/disable` | - | `{ data: Agent }` | Disable agent |
| POST | `/api/agents/:id/reset` | - | `{ data: Agent }` | Reset to defaults |
| DELETE | `/api/agents/:id` | - | `{ success: true }` | Delete agent config |

### Activity Feed Endpoints

| Method | Endpoint | Request | Response | Description |
|--------|----------|---------|----------|-------------|
| GET | `/api/agents/activity` | `?agent&type&status&page&limit` | `{ data: AgentActivity[], meta }` | Get activity feed (paginated) |
| GET | `/api/agents/activity/stream` | - | SSE Stream | Real-time activity stream |
| GET | `/api/agents/:id/activity` | `?page&limit` | `{ data: AgentActivity[], meta }` | Get activity for specific agent |

### Confidence Breakdown Endpoints

| Method | Endpoint | Request | Response | Description |
|--------|----------|---------|----------|-------------|
| GET | `/api/approvals/:id/confidence` | - | `{ factors: ConfidenceFactor[], suggestedActions: SuggestedAction[] }` | Get confidence breakdown |

---

## State Management

### Zustand Store: Agent Store

```typescript
// stores/agent-store.ts
interface AgentStore {
  // State
  agents: Agent[];
  selectedAgent: Agent | null;
  activityFeed: AgentActivity[];
  filters: {
    search: string;
    team: AgentTeam | 'all';
    status: AgentStatus | 'all';
  };

  // Loading states
  isLoading: boolean;
  isUpdating: boolean;

  // Actions
  fetchAgents: () => Promise<void>;
  selectAgent: (id: string) => void;
  updateAgent: (id: string, config: Partial<Agent['config']>) => Promise<void>;
  enableAgent: (id: string) => Promise<void>;
  disableAgent: (id: string) => Promise<void>;
  resetAgent: (id: string) => Promise<void>;

  // Filters
  setSearchFilter: (search: string) => void;
  setTeamFilter: (team: AgentTeam | 'all') => void;
  setStatusFilter: (status: AgentStatus | 'all') => void;

  // Activity
  fetchActivity: (agentId?: string) => Promise<void>;
  subscribeToActivity: () => EventSource;
}
```

### React Query Hooks

```typescript
// hooks/use-agents.ts
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    staleTime: 30000, // 30s
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agents', id],
    queryFn: () => fetchAgent(id),
    enabled: !!id,
  });
}

export function useAgentActivity(agentId?: string) {
  return useQuery({
    queryKey: ['agent-activity', agentId],
    queryFn: () => fetchAgentActivity(agentId),
    refetchInterval: 10000, // Fallback polling every 10s
  });
}

export function useAgentActivityStream() {
  const [activities, setActivities] = useState<AgentActivity[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('/api/agents/activity/stream');

    eventSource.onmessage = (event) => {
      const activity = JSON.parse(event.data);
      setActivities(prev => [activity, ...prev].slice(0, 50));
    };

    return () => eventSource.close();
  }, []);

  return activities;
}

export function useUpdateAgent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<Agent['config']>) =>
      updateAgent(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      queryClient.invalidateQueries(['agents', id]);
    },
  });
}
```

---

## Story-by-Story Technical Breakdown

### Story 13.1: Agent Card Components (3 points)

**Priority:** P1 High

**Components to Create:**

1. **AgentAvatar.tsx**
   - Props: `agent: Agent, size: 'sm' | 'md' | 'lg', showStatus: boolean`
   - Renders emoji/image avatar with status indicator
   - Status indicator: pulsing green dot (online), yellow (busy), gray (offline), red (error)
   - CSS animation for pulsing dot

2. **AgentStatusBadge.tsx**
   - Props: `status: AgentStatus, size: 'sm' | 'md'`
   - Renders status badge with color coding
   - Includes status icon and text

3. **AgentCardCompact.tsx**
   - Props: `agent: Agent, onClick?: () => void`
   - Layout: Avatar + Name + Status dot
   - Minimal height, optimized for grid
   - Hover effect to indicate clickable

4. **AgentCardStandard.tsx**
   - Props: `agent: Agent, onClick?: () => void`
   - Layout: Avatar + Name + Status + Performance stats
   - Shows: Tasks completed, Success rate
   - Card with border and shadow on hover

5. **AgentCardExpanded.tsx**
   - Props: `agent: Agent, onConfigure?: () => void, onChat?: () => void`
   - Layout: Standard + Action buttons
   - Buttons: "Chat with Agent", "Configure"
   - Full feature card for detail views

**Technical Details:**
- Use shadcn/ui Card component as base
- All cards support dark mode
- Responsive: stack on mobile
- Loading skeleton states
- Error boundary wrapper

**Acceptance Criteria Mapping:**
- AC1-AC5: Component implementation
- AC6: Performance stats from Agent metrics
- AC7: Chat button with handler prop
- AC8: Dark mode via Tailwind dark: variants

**Files:**
```
apps/web/src/components/agents/
├── AgentCard.tsx              # Wrapper/base exports
├── AgentCardCompact.tsx
├── AgentCardStandard.tsx
├── AgentCardExpanded.tsx
├── AgentAvatar.tsx
└── AgentStatusBadge.tsx
```

---

### Story 13.2: Agent Detail Modal (5 points)

**Priority:** P1 High

**Components to Create:**

1. **AgentDetailModal.tsx**
   - Props: `agentId: string, open: boolean, onClose: () => void`
   - 5-tab interface using shadcn/ui Tabs
   - Tabs: Overview, Activity, Configuration, Permissions, Analytics
   - Responsive: Full screen on mobile, large modal on desktop
   - Deep link support via URL params

2. **OverviewTab.tsx**
   - Shows agent info (name, role, description)
   - 30-day metrics cards (tasks, success rate, avg response time)
   - Capabilities checklist with icons
   - Last active timestamp

3. **ActivityTab.tsx**
   - Timeline of recent actions (last 50)
   - Each item shows: timestamp, action, status, confidence
   - Infinite scroll or pagination
   - Filter by activity type

4. **ConfigurationTab.tsx**
   - Model selection dropdown (provider + model)
   - Temperature slider (0-2)
   - Max tokens input
   - Context window radio buttons (4K/8K/16K)
   - Read-only if user lacks permission

5. **PermissionsTab.tsx**
   - Data access toggles (per module)
   - "Can Execute Actions" checkbox
   - "Requires Approval" checkbox
   - Permission matrix display

6. **AnalyticsTab.tsx**
   - Use recharts library
   - Line chart: Tasks over time (30 days)
   - Bar chart: Success rate by task type
   - Area chart: Response time trend
   - Stat cards with deltas

**State Management:**
- Use React Query for data fetching
- Local state for tab selection
- Optimistic updates for config changes
- Error handling with toast notifications

**Acceptance Criteria Mapping:**
- AC1: Modal with 5 tabs
- AC2: Overview tab implementation
- AC3: Activity timeline
- AC4: Configuration form
- AC5: Permissions toggles
- AC6: Analytics charts
- AC7: Edit button in modal header
- AC8: Responsive design (full screen on mobile)

**Files:**
```
apps/web/src/components/agents/
├── AgentDetailModal.tsx
└── tabs/
    ├── OverviewTab.tsx
    ├── ActivityTab.tsx
    ├── ConfigurationTab.tsx
    ├── PermissionsTab.tsx
    └── AnalyticsTab.tsx
```

---

### Story 13.3: Agent Activity Feed (4 points)

**Priority:** P2 Medium

**Page Route:** `/agents/activity`

**Components to Create:**

1. **ActivityFeed.tsx** (Page Component)
   - Layout: Filters at top, feed in center, sidebar on right
   - Three-column layout on desktop, single column on mobile
   - SSE connection for real-time updates
   - "X new activities" banner when new items arrive
   - Auto-scroll to new items on click

2. **ActivityFilters.tsx**
   - Agent dropdown (multi-select)
   - Type dropdown (task_started, task_completed, etc.)
   - Status dropdown (pending, completed, failed)
   - Date range picker
   - "Clear filters" button

3. **ActivityCard.tsx**
   - Shows: Agent avatar, action, timestamp, status badge
   - Inline action buttons: "View Details", "Chat with Agent"
   - Expandable to show input/output data
   - Click to navigate to related entity (if applicable)

4. **ActivitySidebar.tsx**
   - Recent activity summary
   - Most active agents (top 5)
   - Activity type distribution (chart)
   - "Live" indicator with pulsing dot

**Real-Time Implementation:**
```typescript
// hooks/use-activity-stream.ts
export function useActivityStream() {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const eventSource = new EventSource('/api/agents/activity/stream');

    eventSource.onmessage = (event) => {
      const activity = JSON.parse(event.data);
      setActivities(prev => [activity, ...prev]);
      setNewCount(prev => prev + 1);
    };

    eventSource.onerror = () => {
      // Fallback to polling
      const interval = setInterval(fetchActivity, 10000);
      return () => clearInterval(interval);
    };

    return () => eventSource.close();
  }, []);

  const clearNewCount = () => setNewCount(0);

  return { activities, newCount, clearNewCount };
}
```

**Acceptance Criteria Mapping:**
- AC1: Page with full-page layout
- AC2: Filter controls implementation
- AC3: "Live" indicator
- AC4: "X new activities" banner
- AC5: Activity cards with actions
- AC6: Right sidebar
- AC7: Real-time via SSE
- AC8: Pagination or infinite scroll

**Files:**
```
apps/web/src/app/agents/activity/
├── page.tsx

apps/web/src/components/agents/
├── ActivityFeed.tsx
├── ActivityCard.tsx
├── ActivityFilters.tsx
└── ActivitySidebar.tsx

apps/web/src/hooks/
└── use-activity-stream.ts
```

---

### Story 13.4: Agent Configuration Page (5 points)

**Priority:** P1 High

**Page Route:** `/agents/[id]/configure`

**Components to Create:**

1. **ConfigSidebar.tsx**
   - 8-section navigation: General, AI Model, Behavior, Memory, Integrations, Notifications, Advanced, Danger Zone
   - Sticky sidebar on desktop, dropdown on mobile
   - Active section indicator
   - Smooth scroll to section on click

2. **GeneralSettings.tsx**
   - Display name input
   - Role description textarea
   - Avatar picker (emoji selector or image upload)
   - Theme color picker (preset colors)
   - Save button with unsaved changes indicator

3. **AIModelSettings.tsx**
   - Primary model dropdown (grouped by provider)
   - Fallback model dropdown
   - Temperature slider (0-2) with description
   - Max tokens input with validation
   - Context window radio buttons (4K/8K/16K)
   - Cost indicator per selection

4. **BehaviorSettings.tsx**
   - Automation level radio buttons: Manual / Smart / Full Auto
   - Confidence threshold slider (0-100)
   - Tone slider (0=Professional to 100=Casual)
   - Custom instructions textarea (500 char limit)
   - Personality traits checklist (optional)

5. **IntegrationsSettings.tsx**
   - List of connected services with toggle switches
   - "Connect New Service" button
   - Each integration shows: icon, name, status, last sync

6. **DangerZone.tsx**
   - Reset to defaults button (confirmation dialog)
   - Disable agent button (confirmation dialog)
   - Delete agent button (confirmation dialog with type-to-confirm)
   - Red border and warning styling

**Form State Management:**
```typescript
// hooks/use-agent-config-form.ts
export function useAgentConfigForm(agentId: string) {
  const { data: agent } = useAgent(agentId);
  const updateMutation = useUpdateAgent(agentId);

  const [formData, setFormData] = useState<Partial<Agent['config']>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSave = async () => {
    await updateMutation.mutateAsync(formData);
    setIsDirty(false);
  };

  const handleReset = () => {
    setFormData(agent?.config || {});
    setIsDirty(false);
  };

  return { formData, setFormData, isDirty, handleSave, handleReset };
}
```

**Acceptance Criteria Mapping:**
- AC1: Page with sidebar navigation
- AC2: 8-section sidebar
- AC3: General settings form
- AC4: AI Model settings form
- AC5: Behavior settings form
- AC6: Integrations section
- AC7: Danger zone
- AC8: Save/Cancel with unsaved detection
- AC9: Form validation (Zod schemas)

**Files:**
```
apps/web/src/app/agents/[id]/configure/
├── page.tsx

apps/web/src/components/agents/config/
├── ConfigSidebar.tsx
├── GeneralSettings.tsx
├── AIModelSettings.tsx
├── BehaviorSettings.tsx
├── IntegrationsSettings.tsx
└── DangerZone.tsx

apps/web/src/hooks/
└── use-agent-config-form.ts
```

---

### Story 13.5: Agent Dashboard Page (4 points)

**Priority:** P2 Medium

**Page Route:** `/agents`

**Components to Create:**

1. **AgentGrid.tsx**
   - Responsive grid: 4 columns (desktop), 2 (tablet), 1 (mobile)
   - Group agents by team with headers
   - Team headers: "Vera's Validation Team", "Blake's Planning Team", etc.
   - Uses AgentCardStandard components
   - Empty state for no agents

2. **AgentFilters.tsx**
   - Search input with debouncing
   - Team filter dropdown
   - Status filter dropdown
   - "Clear all" button

3. **AgentStatusSummary.tsx**
   - Header stats: "X online, Y busy, Z offline"
   - Color-coded stat cards
   - Click to filter by status
   - Link to Activity Feed

**Page Layout:**
```typescript
// app/agents/page.tsx
export default function AgentsPage() {
  const { agents, isLoading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: '', team: 'all', status: 'all' });

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesTeam = filters.team === 'all' || agent.team === filters.team;
      const matchesStatus = filters.status === 'all' || agent.status === filters.status;
      return matchesSearch && matchesTeam && matchesStatus;
    });
  }, [agents, filters]);

  const groupedAgents = useMemo(() => {
    return Object.groupBy(filteredAgents, agent => agent.team);
  }, [filteredAgents]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Agents</h1>
        <Link href="/agents/activity">
          View Activity Feed →
        </Link>
      </div>

      <AgentStatusSummary agents={agents} />

      <AgentFilters filters={filters} onFiltersChange={setFilters} />

      <AgentGrid
        groupedAgents={groupedAgents}
        onAgentClick={setSelectedAgent}
      />

      <AgentDetailModal
        agentId={selectedAgent}
        open={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
}
```

**Acceptance Criteria Mapping:**
- AC1: Page with card grid
- AC2: All 16+ agents displayed
- AC3: Grouped by team
- AC4: Search filter
- AC5: Click to open modal
- AC6: Status summary header
- AC7: Link to activity feed
- AC8: Responsive grid

**Files:**
```
apps/web/src/app/agents/
├── page.tsx

apps/web/src/components/agents/
├── AgentGrid.tsx
├── AgentFilters.tsx
└── AgentStatusSummary.tsx
```

---

### Story 13.6: Confidence Breakdown System (4 points)

**Priority:** P2 Medium

**Components to Modify:**
- `apps/web/src/components/approval/approval-detail-modal.tsx`

**Components to Create:**

1. **ConfidenceBreakdown.tsx**
   - Shows 4 confidence factors with progress bars
   - Factors: Content Quality, Brand Alignment, Recipient Match, Timing Score
   - Each factor: name, score bar, percentage, explanation
   - Collapsible for high-confidence items (>85%)

2. **ConfidenceFactorBar.tsx**
   - Props: `factor: ConfidenceFactor`
   - Progress bar with color coding:
     - Green: >80%
     - Yellow: 60-80%
     - Red: <60%
   - Shows score percentage and weight

3. **AIReasoning.tsx**
   - Shows bullet points for low-confidence items
   - Each bullet: icon, reason text, severity indicator
   - Expandable detail view
   - Only shown when confidence < 60%

4. **SuggestedActions.tsx**
   - Shows recommended actions based on factors
   - Each action: icon, name, reason, priority badge
   - Click to execute action (e.g., "Schedule Review Call")
   - Can be dismissed individually

**API Integration:**
```typescript
// hooks/use-confidence-breakdown.ts
export function useConfidenceBreakdown(approvalId: string) {
  return useQuery({
    queryKey: ['confidence', approvalId],
    queryFn: () => fetchConfidenceBreakdown(approvalId),
    enabled: !!approvalId,
  });
}

async function fetchConfidenceBreakdown(approvalId: string) {
  const response = await fetch(`/api/approvals/${approvalId}/confidence`);
  const data = await response.json();
  return {
    factors: data.factors as ConfidenceFactor[],
    suggestedActions: data.suggestedActions as SuggestedAction[],
  };
}
```

**Backend API (Story 13.6):**
```typescript
// apps/web/src/app/api/approvals/[id]/confidence/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const approval = await prisma.approvalItem.findUnique({
    where: { id: params.id, workspaceId: session.workspaceId },
  });

  if (!approval) return notFound();

  // Calculate factors (or retrieve from approval.factors if already calculated)
  const factors = calculateConfidenceFactors(approval);
  const suggestedActions = generateSuggestedActions(approval, factors);

  return NextResponse.json({
    factors,
    suggestedActions,
  });
}

function calculateConfidenceFactors(approval: ApprovalItem): ConfidenceFactor[] {
  // Example implementation
  return [
    {
      factor: 'Content Quality',
      score: 85,
      weight: 0.35,
      explanation: 'Content is well-structured and professional',
    },
    {
      factor: 'Brand Alignment',
      score: 72,
      weight: 0.25,
      explanation: 'Tone matches brand guidelines, minor style adjustments needed',
    },
    {
      factor: 'Recipient Match',
      score: 90,
      weight: 0.25,
      explanation: 'Target audience is well-defined and appropriate',
    },
    {
      factor: 'Timing Score',
      score: 65,
      weight: 0.15,
      explanation: 'Timing is acceptable but not optimal for engagement',
    },
  ];
}

function generateSuggestedActions(
  approval: ApprovalItem,
  factors: ConfidenceFactor[]
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  // Add actions based on low factors
  factors.forEach(factor => {
    if (factor.score < 70) {
      if (factor.factor === 'Brand Alignment') {
        actions.push({
          action: 'Review Brand Guidelines',
          reason: `${factor.factor} scored ${factor.score}%`,
          priority: 'high',
        });
      }
      if (factor.factor === 'Timing Score') {
        actions.push({
          action: 'Schedule for Optimal Time',
          reason: 'Timing could be improved for better engagement',
          priority: 'medium',
        });
      }
    }
  });

  if (approval.confidenceScore < 60) {
    actions.push({
      action: 'Request Human Review',
      reason: 'Overall confidence is below threshold',
      priority: 'high',
    });
  }

  return actions;
}
```

**Acceptance Criteria Mapping:**
- AC1: ConfidenceBreakdown component added to modal
- AC2-AC5: Four factor bars
- AC6: AI Reasoning section
- AC7: Suggested Actions section
- AC8: Backend API endpoint

**Files:**
```
apps/web/src/components/approval/
├── approval-detail-modal.tsx      # MODIFY: Add ConfidenceBreakdown
├── ConfidenceBreakdown.tsx        # NEW
├── ConfidenceFactorBar.tsx        # NEW
├── AIReasoning.tsx                # NEW
└── SuggestedActions.tsx           # NEW

apps/web/src/app/api/approvals/[id]/confidence/
└── route.ts                       # NEW

apps/web/src/hooks/
└── use-confidence-breakdown.ts    # NEW
```

---

## Integration Points

### With Existing Systems

1. **Agent Client Integration**
   - Existing: `/lib/agent-client.ts` handles validation/planning/branding teams
   - New: Extend to support agent management API calls
   - Add: `agentClient.getAgentList()`, `agentClient.updateAgentConfig()`

2. **Approval System Integration**
   - Existing: Approval cards and modals in `/components/approval/`
   - New: Add ConfidenceBreakdown component to approval-detail-modal
   - Pattern: Follow existing approval-card.tsx structure

3. **Settings Integration**
   - Existing: Agent model preferences in `/components/settings/`
   - New: Link from agent config page to workspace settings
   - Consistency: Use same model selector component

4. **Event Bus Integration**
   - Existing: Event bus from EPIC-05
   - New: Agent activity events published to event bus
   - Events: `agent.action.started`, `agent.action.completed`, `agent.error`

### Database Schema

**New Tables:**

```sql
-- Agent activity log
CREATE TABLE agent_activities (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  agent_name VARCHAR(255) NOT NULL,
  workspace_id VARCHAR(255) NOT NULL,

  -- Action details
  type VARCHAR(50) NOT NULL,
  action TEXT NOT NULL,
  module VARCHAR(100),
  entity_id VARCHAR(255),
  entity_type VARCHAR(100),

  -- Status
  status VARCHAR(50) NOT NULL,
  confidence_score INT,

  -- Data
  input JSONB,
  output JSONB,
  error TEXT,

  -- Timestamps
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration INT,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_activities_workspace (workspace_id),
  INDEX idx_activities_agent (agent_id),
  INDEX idx_activities_type (type),
  INDEX idx_activities_created (created_at DESC)
);

-- Agent configuration (extends workspace settings)
CREATE TABLE agent_configs (
  id VARCHAR(255) PRIMARY KEY,
  workspace_id VARCHAR(255) NOT NULL,
  agent_id VARCHAR(255) NOT NULL,

  -- Configuration
  provider_id VARCHAR(255),
  model VARCHAR(255),
  temperature DECIMAL(3,2) DEFAULT 1.0,
  max_tokens INT DEFAULT 4000,
  context_window INT DEFAULT 8000,
  automation_level VARCHAR(50) DEFAULT 'smart',
  confidence_threshold INT DEFAULT 70,
  tone INT DEFAULT 50,
  custom_instructions TEXT,

  -- Metadata
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (workspace_id, agent_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_agent_activities ON agent_activities
  USING (workspace_id = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_agent_configs ON agent_configs
  USING (workspace_id = current_setting('app.tenant_id', true));
```

**Prisma Schema Updates:**

```prisma
// packages/db/prisma/schema.prisma

model AgentActivity {
  id            String   @id @default(cuid())
  agentId       String   @map("agent_id")
  agentName     String   @map("agent_name")
  workspaceId   String   @map("workspace_id")

  type          String
  action        String
  module        String?
  entityId      String?  @map("entity_id")
  entityType    String?  @map("entity_type")

  status        String
  confidenceScore Int?   @map("confidence_score")

  input         Json?
  output        Json?
  error         String?

  startedAt     DateTime @map("started_at")
  completedAt   DateTime? @map("completed_at")
  duration      Int?

  createdAt     DateTime @default(now()) @map("created_at")

  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([agentId])
  @@index([type])
  @@index([createdAt])
  @@map("agent_activities")
}

model AgentConfig {
  id                  String   @id @default(cuid())
  workspaceId         String   @map("workspace_id")
  agentId             String   @map("agent_id")

  providerId          String?  @map("provider_id")
  model               String?
  temperature         Float    @default(1.0)
  maxTokens           Int      @default(4000) @map("max_tokens")
  contextWindow       Int      @default(8000) @map("context_window")
  automationLevel     String   @default("smart") @map("automation_level")
  confidenceThreshold Int      @default(70) @map("confidence_threshold")
  tone                Int      @default(50)
  customInstructions  String?  @map("custom_instructions")

  enabled             Boolean  @default(true)
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, agentId])
  @@index([workspaceId])
  @@map("agent_configs")
}
```

---

## Testing Strategy

### Unit Tests

**Components:**
```typescript
// __tests__/components/agents/agent-card.test.tsx
describe('AgentCard', () => {
  it('renders compact variant with avatar and name', () => {
    render(<AgentCardCompact agent={mockAgent} />);
    expect(screen.getByText(mockAgent.name)).toBeInTheDocument();
  });

  it('shows status indicator based on agent status', () => {
    render(<AgentCard agent={{ ...mockAgent, status: 'online' }} />);
    expect(screen.getByTestId('status-online')).toBeInTheDocument();
  });

  it('displays performance metrics in standard variant', () => {
    render(<AgentCardStandard agent={mockAgent} />);
    expect(screen.getByText(/Tasks: \d+/)).toBeInTheDocument();
  });
});

// __tests__/components/agents/agent-detail-modal.test.tsx
describe('AgentDetailModal', () => {
  it('renders all 5 tabs', () => {
    render(<AgentDetailModal agentId="123" open={true} onClose={jest.fn()} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('switches tabs on click', async () => {
    render(<AgentDetailModal agentId="123" open={true} onClose={jest.fn()} />);
    await userEvent.click(screen.getByText('Activity'));
    expect(screen.getByTestId('activity-tab')).toBeVisible();
  });
});
```

**Hooks:**
```typescript
// __tests__/hooks/use-agents.test.ts
describe('useAgents', () => {
  it('fetches agents on mount', async () => {
    const { result } = renderHook(() => useAgents());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.agents).toHaveLength(16);
  });

  it('filters agents by search term', () => {
    const { result } = renderHook(() => useAgentFilters());
    act(() => result.current.setSearch('Vera'));
    expect(result.current.filteredAgents).toHaveLength(1);
  });
});
```

### Integration Tests

**API Routes:**
```typescript
// __tests__/api/agents/route.test.ts
describe('GET /api/agents', () => {
  it('returns all agents for workspace', async () => {
    const response = await fetch('/api/agents', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const { data } = await response.json();
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
  });

  it('filters agents by team', async () => {
    const response = await fetch('/api/agents?team=validation');
    const { data } = await response.json();
    expect(data.every(a => a.team === 'validation')).toBe(true);
  });
});

describe('PATCH /api/agents/:id', () => {
  it('updates agent configuration', async () => {
    const response = await fetch('/api/agents/123', {
      method: 'PATCH',
      body: JSON.stringify({ temperature: 1.5 }),
    });
    const { data } = await response.json();
    expect(data.config.temperature).toBe(1.5);
  });

  it('validates temperature range', async () => {
    const response = await fetch('/api/agents/123', {
      method: 'PATCH',
      body: JSON.stringify({ temperature: 3.0 }),
    });
    expect(response.status).toBe(400);
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/agents.spec.ts
test('User can view agent dashboard', async ({ page }) => {
  await page.goto('/agents');
  await expect(page.locator('h1')).toHaveText('AI Agents');
  await expect(page.locator('[data-testid="agent-card"]')).toHaveCount(16);
});

test('User can configure agent settings', async ({ page }) => {
  await page.goto('/agents');
  await page.click('[data-agent-id="vera"]');
  await page.click('text=Configuration');
  await page.selectOption('[name="model"]', 'claude-sonnet-4');
  await page.fill('[name="temperature"]', '1.2');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Settings saved')).toBeVisible();
});

test('User can view real-time activity feed', async ({ page }) => {
  await page.goto('/agents/activity');
  await expect(page.locator('text=Live')).toBeVisible();

  // Trigger an agent action and verify it appears
  await triggerAgentAction('validation');
  await expect(page.locator('text=Analyzed market size')).toBeVisible({ timeout: 5000 });
});
```

---

## Risk Assessment

### High Risk Items

1. **Real-Time Activity Feed Performance**
   - Risk: High activity volume could overwhelm SSE connections
   - Mitigation: Implement rate limiting, pagination, client-side throttling
   - Fallback: Poll every 10s if SSE fails

2. **Agent Configuration Conflicts**
   - Risk: Workspace-level vs. agent-level config conflicts
   - Mitigation: Clear precedence rules (agent > workspace), UI indicators
   - Testing: Integration tests for all config combinations

3. **Modal State Management**
   - Risk: Deep linking, browser back button issues with modal
   - Mitigation: URL-based modal state, proper history handling
   - Testing: E2E tests for navigation scenarios

### Medium Risk Items

1. **Chart Performance**
   - Risk: Large datasets could slow analytics tab
   - Mitigation: Data aggregation, chart lazy loading, virtualization
   - Monitoring: Performance metrics on analytics tab

2. **Form Validation Complexity**
   - Risk: Complex interdependencies between config fields
   - Mitigation: Zod schemas, clear error messages, inline validation
   - Testing: Unit tests for all validation rules

### Low Risk Items

1. **Avatar Emoji Rendering**
   - Risk: Cross-browser emoji inconsistencies
   - Mitigation: Use Unicode 15.0 subset, test on all browsers
   - Fallback: Image avatars always supported

2. **Dark Mode Consistency**
   - Risk: Some components may not support dark mode
   - Mitigation: Audit all components, use Tailwind dark: variants
   - Testing: Visual regression tests

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Agent Dashboard Load | < 1s | First Contentful Paint |
| Agent Modal Open | < 300ms | Time to Interactive |
| Activity Feed SSE Connect | < 500ms | Connection established |
| Config Save | < 500ms | Optimistic update + confirmation |
| Search Filter | < 100ms | Debounced input to render |
| Chart Render | < 1s | Analytics tab load |

---

## Accessibility Requirements

- **Keyboard Navigation:** All interactions accessible via keyboard
- **Screen Reader:** All components have proper ARIA labels
- **Focus Management:** Focus trapped in modals, restored on close
- **Color Contrast:** WCAG AA compliance (4.5:1 for text)
- **Form Labels:** All inputs have associated labels
- **Error Announcements:** Screen reader announces validation errors

---

## Documentation Requirements

### Developer Documentation

1. **Component Storybook:** All agent components in Storybook
2. **API Documentation:** OpenAPI spec for agent endpoints
3. **Type Definitions:** TSDoc comments on all interfaces

### User Documentation

1. **Agent Dashboard Guide:** How to use agent dashboard
2. **Configuration Guide:** How to configure agents
3. **Activity Feed Guide:** How to monitor agent activity
4. **Troubleshooting:** Common issues and solutions

---

## Migration Strategy

### Phase 1: Infrastructure (Stories 13.1-13.2)

- Deploy base components (cards, modal)
- No data migration required
- Feature flag: `ENABLE_AGENT_MANAGEMENT`

### Phase 2: Activity & Config (Stories 13.3-13.4)

- Create database tables (agent_activities, agent_configs)
- Backfill agent configs for existing workspaces
- Enable SSE endpoints

### Phase 3: Dashboard & Breakdown (Stories 13.5-13.6)

- Deploy dashboard page
- Add confidence breakdown to approval modal
- Enable feature flag globally

---

## Success Metrics

### Technical Metrics

- Page load time: < 1s for agent dashboard
- API response time: < 300ms for agent list
- SSE connection uptime: > 99%
- Zero agent config conflicts reported

### Product Metrics

- 80%+ of users visit agent dashboard in first week
- 50%+ of users configure at least one agent
- 30%+ of users use activity feed weekly
- 90%+ confidence breakdown viewed for low-confidence approvals

---

## Open Questions

1. **Agent Naming:** Should users be able to rename agents, or are names fixed (Vera, Blake, Bella)?
   - **Resolution:** Names are fixed (character identity), but display name can have custom suffix

2. **Agent Deletion:** Should agents be soft-deleted or hard-deleted?
   - **Resolution:** Soft delete (disabled) to preserve activity history

3. **Activity Retention:** How long should activity logs be retained?
   - **Resolution:** 90 days for free tier, unlimited for paid tier

4. **Real-Time Fallback:** What's the polling frequency if SSE fails?
   - **Resolution:** 10 seconds, with exponential backoff

---

## Related Documentation

- [Epic 13 File](/home/chris/projects/work/Ai Bussiness Hub/docs/epics/EPIC-13-ai-agent-management.md)
- [Architecture Document](/home/chris/projects/work/Ai Bussiness Hub/docs/architecture.md)
- [UX Design Document](/home/chris/projects/work/Ai Bussiness Hub/docs/ux-design.md)
- [Wireframes: AI-02, AI-03, AI-04, AI-05](/home/chris/projects/work/Ai Bussiness Hub/docs/design/wireframes/)
- [Agent Client Implementation](/home/chris/projects/work/Ai Bussiness Hub/apps/web/src/lib/agent-client.ts)
- [Approval Components](/home/chris/projects/work/Ai Bussiness Hub/apps/web/src/components/approval/)

---

_Generated by epic-tech-context workflow_
_Date: 2025-12-06_
_For: Epic 13 - AI Agent Management_
