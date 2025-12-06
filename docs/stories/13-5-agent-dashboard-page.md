# Story 13.5: Agent Dashboard Page

## Story Overview
- **Epic**: 13 - AI Agent Management
- **Points**: 4
- **Priority**: P2 Medium
- **Dependencies**: Story 13.1 (Agent Card Components), Story 13.2 (Agent Detail Modal)

## User Story
As a user, I want to view all AI agents in a dashboard with filtering and search capabilities, so that I can quickly find and manage the agents working on my behalf.

## Acceptance Criteria

1. Page displays all 16+ agents in a responsive card grid
   - 4 columns on desktop (1280px+)
   - 2 columns on tablet (768px-1279px)
   - 1 column on mobile (<768px)

2. Agents are grouped by team with section headers
   - "Vera's Validation Team"
   - "Blake's Planning Team"
   - "Bella's Branding Team"
   - "Orchid's Orchestration Team"
   - Team grouping respects filter state

3. Header includes status summary component
   - Shows count of agents by status: "X online, Y busy, Z offline"
   - Color-coded stat cards (green/yellow/gray)
   - Clicking a stat filters to that status

4. Search and filter controls at top of page
   - Search input with debouncing (300ms)
   - Team filter dropdown (All, Validation, Planning, Branding, Orchestrator)
   - Status filter dropdown (All, Online, Busy, Offline, Error)
   - "Clear all filters" button appears when filters active

5. Each agent card shows:
   - Avatar with status indicator (using AgentCardStandard from Story 13.1)
   - Agent name and role
   - Performance metrics (tasks completed, success rate)
   - Hover state with subtle elevation

6. Clicking an agent card opens the Agent Detail Modal
   - Modal opens with overview tab selected
   - URL updates to include agent ID (e.g., /agents?modal=vera)
   - Modal state syncs with URL for deep linking
   - Browser back button closes modal

7. Header includes link to Activity Feed page
   - "View Activity Feed" link in top-right corner
   - Navigates to /agents/activity

8. Empty state when no agents match filters
   - Shows illustration and message
   - Suggests clearing filters
   - "Clear filters" button

## Technical Implementation

### Page Route
- **Path**: `/agents`
- **File**: `apps/web/src/app/agents/page.tsx`

### Components to Create

1. **AgentGrid.tsx**
   - Accepts `groupedAgents` prop (Map of team -> Agent[])
   - Renders team sections with headers
   - Uses CSS Grid for responsive layout
   - Handles empty state

2. **AgentFilters.tsx**
   - Search input with debounce (use `useDebouncedValue` hook)
   - Filter dropdowns using shadcn Select component
   - Clear filters button
   - Emits `onFiltersChange` callback

3. **AgentStatusSummary.tsx**
   - Calculates status counts from agent array
   - Renders stat cards with colors
   - Click handlers to update filters
   - Uses Card component from shadcn

### State Management

```typescript
// Local state in page.tsx
const [filters, setFilters] = useState({
  search: '',
  team: 'all' as AgentTeam | 'all',
  status: 'all' as AgentStatus | 'all'
});

const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

// React Query for data
const { agents, isLoading } = useAgents();

// Derived state
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
```

### URL Sync

```typescript
// Sync modal state with URL
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const modalAgent = params.get('modal');
  if (modalAgent !== selectedAgentId) {
    setSelectedAgentId(modalAgent);
  }
}, []);

const handleAgentClick = (agentId: string) => {
  setSelectedAgentId(agentId);
  const url = new URL(window.location.href);
  url.searchParams.set('modal', agentId);
  window.history.pushState({}, '', url);
};

const handleModalClose = () => {
  setSelectedAgentId(null);
  const url = new URL(window.location.href);
  url.searchParams.delete('modal');
  window.history.pushState({}, '', url);
};
```

### Layout Structure

```tsx
<div className="container mx-auto p-6 space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold">AI Agents</h1>
    <Link href="/agents/activity">
      View Activity Feed →
    </Link>
  </div>

  {/* Status Summary */}
  <AgentStatusSummary
    agents={agents}
    onStatusClick={(status) => setFilters(prev => ({ ...prev, status }))}
  />

  {/* Filters */}
  <AgentFilters
    filters={filters}
    onFiltersChange={setFilters}
  />

  {/* Agent Grid */}
  <AgentGrid
    groupedAgents={groupedAgents}
    onAgentClick={handleAgentClick}
    isLoading={isLoading}
  />

  {/* Detail Modal */}
  <AgentDetailModal
    agentId={selectedAgentId}
    open={!!selectedAgentId}
    onClose={handleModalClose}
  />
</div>
```

### Responsive Grid

```css
/* Tailwind classes for grid */
.agent-grid {
  @apply grid gap-6;
  @apply grid-cols-1;
  @apply md:grid-cols-2;
  @apply lg:grid-cols-3;
  @apply xl:grid-cols-4;
}
```

### Team Headers

```tsx
// In AgentGrid.tsx
{Object.entries(groupedAgents).map(([team, agents]) => (
  <section key={team}>
    <h2 className="text-xl font-semibold mb-4">
      {getTeamHeader(team)}
    </h2>
    <div className="agent-grid">
      {agents.map(agent => (
        <AgentCardStandard
          key={agent.id}
          agent={agent}
          onClick={() => onAgentClick(agent.id)}
        />
      ))}
    </div>
  </section>
))}

// Team header mapping
function getTeamHeader(team: AgentTeam): string {
  const headers = {
    validation: "Vera's Validation Team",
    planning: "Blake's Planning Team",
    branding: "Bella's Branding Team",
    orchestrator: "Orchid's Orchestration Team"
  };
  return headers[team] || team;
}
```

## Testing Requirements

### Unit Tests

```typescript
// __tests__/components/agents/agent-grid.test.tsx
describe('AgentGrid', () => {
  it('renders grouped agents by team', () => {
    const grouped = {
      validation: [mockVera],
      planning: [mockBlake]
    };
    render(<AgentGrid groupedAgents={grouped} onAgentClick={jest.fn()} />);
    expect(screen.getByText("Vera's Validation Team")).toBeInTheDocument();
    expect(screen.getByText("Blake's Planning Team")).toBeInTheDocument();
  });

  it('calls onAgentClick when card is clicked', async () => {
    const onAgentClick = jest.fn();
    render(<AgentGrid groupedAgents={mockGrouped} onAgentClick={onAgentClick} />);
    await userEvent.click(screen.getByText('Vera'));
    expect(onAgentClick).toHaveBeenCalledWith('vera');
  });
});

// __tests__/components/agents/agent-filters.test.tsx
describe('AgentFilters', () => {
  it('debounces search input', async () => {
    const onFiltersChange = jest.fn();
    render(<AgentFilters filters={mockFilters} onFiltersChange={onFiltersChange} />);
    await userEvent.type(screen.getByPlaceholderText('Search agents...'), 'Vera');

    // Should not call immediately
    expect(onFiltersChange).not.toHaveBeenCalled();

    // Should call after debounce
    await waitFor(() => expect(onFiltersChange).toHaveBeenCalled(), { timeout: 400 });
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/agents-dashboard.spec.ts
test('displays all agents in grid', async ({ page }) => {
  await page.goto('/agents');
  await expect(page.locator('h1')).toHaveText('AI Agents');
  const cards = await page.locator('[data-testid="agent-card"]').count();
  expect(cards).toBeGreaterThanOrEqual(16);
});

test('filters agents by search', async ({ page }) => {
  await page.goto('/agents');
  await page.fill('input[placeholder*="Search"]', 'Vera');
  await page.waitForTimeout(400); // Wait for debounce
  const cards = await page.locator('[data-testid="agent-card"]').count();
  expect(cards).toBe(1);
});

test('opens modal on agent click and syncs URL', async ({ page }) => {
  await page.goto('/agents');
  await page.click('text=Vera');
  await expect(page).toHaveURL(/\/agents\?modal=vera/);
  await expect(page.locator('[role="dialog"]')).toBeVisible();
});

test('closes modal with browser back button', async ({ page }) => {
  await page.goto('/agents?modal=vera');
  await page.goBack();
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
});
```

## Definition of Done

- [ ] All acceptance criteria implemented and verified
- [ ] Page component created at `/apps/web/src/app/agents/page.tsx`
- [ ] AgentGrid, AgentFilters, AgentStatusSummary components created
- [ ] Responsive grid layout works on mobile, tablet, desktop
- [ ] Search debouncing implemented (300ms)
- [ ] Team grouping displays correctly with headers
- [ ] Modal state syncs with URL for deep linking
- [ ] Browser back button closes modal
- [ ] Empty state shows when no agents match filters
- [ ] Link to activity feed page functional
- [ ] TypeScript types defined and exported
- [ ] Unit tests pass for all new components
- [ ] E2E tests pass for page functionality
- [ ] TypeScript/ESLint passes with no errors
- [ ] Code review approved
- [ ] Accessibility tested (keyboard navigation, screen readers)
- [ ] Dark mode styling verified
- [ ] Performance targets met (< 1s page load)
