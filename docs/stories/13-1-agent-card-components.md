# Story 13.1: Agent Card Components

**Epic:** 13 - AI Agent Management
**Status:** drafted
**Points:** 3
**Priority:** P1 High

---

## User Story

**As a** user
**I want** to see agent cards with status and stats
**So that** I can quickly understand agent availability

---

## Acceptance Criteria

- [ ] AC1: Create AgentCardCompact component (avatar + name + status dot)
- [ ] AC2: Create AgentCardStandard component (with performance stats)
- [ ] AC3: Create AgentCardExpanded component (with action buttons)
- [ ] AC4: Create AgentAvatar component with status indicator
- [ ] AC5: Pulsing green dot animation for online status
- [ ] AC6: Display performance stats (tasks completed, success rate)
- [ ] AC7: "Chat with Agent" button on expanded card
- [ ] AC8: Full dark mode support

---

## Technical Details

### Component Architecture

This story creates the foundational agent card components used throughout the platform. Three variants (Compact, Standard, Expanded) enable flexible composition for different contexts.

**Component Hierarchy:**

```
AgentCard.tsx (base exports)
├── AgentCardCompact.tsx    # Minimal: Avatar + Name + Status
├── AgentCardStandard.tsx   # + Performance stats
└── AgentCardExpanded.tsx   # + Action buttons
```

**Supporting Components:**

```
AgentAvatar.tsx         # Avatar with status indicator
AgentStatusBadge.tsx    # Status badge component
```

### Component Specifications

#### 1. AgentAvatar.tsx

**Props:**
```typescript
interface AgentAvatarProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}
```

**Implementation:**
- Renders emoji/image avatar
- Status indicator overlay (pulsing green dot for online, yellow for busy, gray for offline, red for error)
- CSS animation for pulsing dot
- Sizes: sm (32px), md (48px), lg (64px)

#### 2. AgentStatusBadge.tsx

**Props:**
```typescript
interface AgentStatusBadgeProps {
  status: AgentStatus; // 'online' | 'busy' | 'offline' | 'error'
  size?: 'sm' | 'md';
}
```

**Implementation:**
- Color-coded badge with status icon and text
- Online: green (bg-green-100, text-green-700, dark:bg-green-900, dark:text-green-300)
- Busy: yellow (bg-yellow-100, text-yellow-700, dark:bg-yellow-900, dark:text-yellow-300)
- Offline: gray (bg-gray-100, text-gray-700, dark:bg-gray-700, dark:text-gray-300)
- Error: red (bg-red-100, text-red-700, dark:bg-red-900, dark:text-red-300)

#### 3. AgentCardCompact.tsx

**Props:**
```typescript
interface AgentCardCompactProps {
  agent: Agent;
  onClick?: () => void;
}
```

**Layout:**
- Horizontal layout: Avatar (sm) + Name + Status dot
- Minimal height (~56px)
- Hover effect: border color change + subtle shadow
- Optimized for grid display (dashboard view)

#### 4. AgentCardStandard.tsx

**Props:**
```typescript
interface AgentCardStandardProps {
  agent: Agent;
  onClick?: () => void;
}
```

**Layout:**
- Vertical layout:
  - Avatar (md) + Status badge (top section)
  - Name + Role (middle section)
  - Performance stats (bottom section):
    - Tasks completed (last 30 days)
    - Success rate percentage
- Card border and shadow on hover
- Height: ~200px

**Stats Display:**
```typescript
// From Agent.metrics
{
  tasksCompleted: number;
  successRate: number; // 0-100
}
```

#### 5. AgentCardExpanded.tsx

**Props:**
```typescript
interface AgentCardExpandedProps {
  agent: Agent;
  onConfigure?: () => void;
  onChat?: () => void;
}
```

**Layout:**
- Extends AgentCardStandard layout
- Action buttons at bottom:
  - "Chat with Agent" (primary button)
  - "Configure" (secondary button)
- Full feature card for detail views

### Data Model Reference

```typescript
/**
 * Agent entity from tech spec
 */
interface Agent {
  id: string;
  name: string;                    // Display name (e.g., "Vera")
  role: string;                    // Agent role (e.g., "Validation Orchestrator")
  team: AgentTeam;                 // validation | planning | branding | approval | orchestrator
  description: string;
  avatar: string;                  // Emoji or image URL
  themeColor: string;              // Brand color (hex)
  status: AgentStatus;             // online | busy | offline | error
  lastActive: Date;
  capabilities: string[];
  metrics: {
    tasksCompleted: number;
    successRate: number;           // 0-100
    avgResponseTime: number;       // milliseconds
    confidenceAvg: number;         // 0-100
  };
  // ... (config, permissions, etc.)
}

type AgentTeam = 'validation' | 'planning' | 'branding' | 'approval' | 'orchestrator';
type AgentStatus = 'online' | 'busy' | 'offline' | 'error';
```

### Styling Approach

**Base Card:**
- Use shadcn/ui Card component
- Tailwind classes for responsive design
- Dark mode via `dark:` variants

**Status Indicator (Pulsing Dot):**
```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-dot-online {
  animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**Responsive Behavior:**
- Mobile: Full width, stack elements
- Tablet: 2-column grid
- Desktop: 4-column grid (in dashboard context)

### Loading & Error States

**Loading Skeleton:**
```typescript
<Card className="animate-pulse">
  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
</Card>
```

**Error Boundary:**
- Wrap cards in error boundary
- Show fallback UI if agent data is malformed

---

## Files to Create/Modify

### New Files

```
apps/web/src/components/agents/
├── AgentCard.tsx              # Wrapper/base exports
├── AgentCardCompact.tsx       # Compact variant
├── AgentCardStandard.tsx      # Standard variant
├── AgentCardExpanded.tsx      # Expanded variant
├── AgentAvatar.tsx            # Avatar component
└── AgentStatusBadge.tsx       # Status badge component
```

### File Purposes

| File | Purpose |
|------|---------|
| `AgentCard.tsx` | Base wrapper that exports all variants |
| `AgentCardCompact.tsx` | Minimal card for grid views |
| `AgentCardStandard.tsx` | Standard card with stats |
| `AgentCardExpanded.tsx` | Full card with actions |
| `AgentAvatar.tsx` | Reusable avatar with status |
| `AgentStatusBadge.tsx` | Reusable status badge |

---

## Implementation Notes

### Patterns to Follow

1. **Component Composition:**
   - Each variant uses AgentAvatar and AgentStatusBadge
   - Build from simpler to more complex (Compact → Standard → Expanded)
   - Share common styles via base classes

2. **Type Safety:**
   - Import Agent type from shared types package
   - Use discriminated unions for status types
   - Props should be explicit, avoid `any`

3. **Accessibility:**
   - All cards keyboard navigable (if clickable)
   - Status dots have `aria-label` for screen readers
   - Proper heading hierarchy (h3 for agent name)
   - Focus visible states

4. **Dark Mode:**
   - All colors must have `dark:` variants
   - Test in both light and dark mode
   - Status colors maintain sufficient contrast

### Edge Cases

1. **Missing Avatar:**
   - Fallback to default agent icon
   - Use first letter of name as fallback

2. **Long Names:**
   - Truncate with ellipsis (`truncate` utility)
   - Show full name on hover (tooltip)

3. **Zero Stats:**
   - Show "0" instead of hiding metrics
   - Indicate "No activity yet" for new agents

4. **Offline/Error States:**
   - Gray out card slightly for offline agents
   - Red accent for error state
   - Show last active timestamp

### Performance Considerations

1. **Rendering:**
   - Cards are lightweight, no heavy computation
   - Use React.memo for card components to prevent unnecessary re-renders
   - Avatar images should be lazy loaded

2. **Animation:**
   - Pulsing dot uses CSS animation (hardware accelerated)
   - Disable animations on reduced motion preference

### Testing Requirements

See "Testing Requirements" section below for comprehensive test plan.

---

## Testing Requirements

### Unit Tests

**AgentAvatar.test.tsx:**
```typescript
describe('AgentAvatar', () => {
  it('renders avatar with emoji', () => {
    const agent = { ...mockAgent, avatar: '🤖' };
    render(<AgentAvatar agent={agent} />);
    expect(screen.getByText('🤖')).toBeInTheDocument();
  });

  it('shows status indicator when showStatus is true', () => {
    const agent = { ...mockAgent, status: 'online' };
    render(<AgentAvatar agent={agent} showStatus={true} />);
    expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
  });

  it('pulsing animation for online status', () => {
    const agent = { ...mockAgent, status: 'online' };
    render(<AgentAvatar agent={agent} showStatus={true} />);
    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveClass('status-dot-online');
  });

  it('applies correct size class', () => {
    render(<AgentAvatar agent={mockAgent} size="lg" />);
    expect(screen.getByRole('img')).toHaveClass('h-16 w-16');
  });
});
```

**AgentStatusBadge.test.tsx:**
```typescript
describe('AgentStatusBadge', () => {
  it('renders online status with green styling', () => {
    render(<AgentStatusBadge status="online" />);
    expect(screen.getByText(/online/i)).toHaveClass('text-green-700');
  });

  it('renders busy status with yellow styling', () => {
    render(<AgentStatusBadge status="busy" />);
    expect(screen.getByText(/busy/i)).toHaveClass('text-yellow-700');
  });

  it('renders offline status with gray styling', () => {
    render(<AgentStatusBadge status="offline" />);
    expect(screen.getByText(/offline/i)).toHaveClass('text-gray-700');
  });

  it('renders error status with red styling', () => {
    render(<AgentStatusBadge status="error" />);
    expect(screen.getByText(/error/i)).toHaveClass('text-red-700');
  });
});
```

**AgentCardCompact.test.tsx:**
```typescript
describe('AgentCardCompact', () => {
  it('renders agent name and status', () => {
    render(<AgentCardCompact agent={mockAgent} />);
    expect(screen.getByText(mockAgent.name)).toBeInTheDocument();
    expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const onClick = jest.fn();
    render(<AgentCardCompact agent={mockAgent} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is keyboard navigable', async () => {
    const onClick = jest.fn();
    render(<AgentCardCompact agent={mockAgent} onClick={onClick} />);
    const card = screen.getByRole('button');
    card.focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalled();
  });
});
```

**AgentCardStandard.test.tsx:**
```typescript
describe('AgentCardStandard', () => {
  it('displays performance stats', () => {
    const agent = {
      ...mockAgent,
      metrics: { tasksCompleted: 42, successRate: 95 }
    };
    render(<AgentCardStandard agent={agent} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByText(/95%/)).toBeInTheDocument();
  });

  it('shows role below name', () => {
    render(<AgentCardStandard agent={mockAgent} />);
    expect(screen.getByText(mockAgent.role)).toBeInTheDocument();
  });

  it('handles zero stats gracefully', () => {
    const agent = {
      ...mockAgent,
      metrics: { tasksCompleted: 0, successRate: 0 }
    };
    render(<AgentCardStandard agent={agent} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
```

**AgentCardExpanded.test.tsx:**
```typescript
describe('AgentCardExpanded', () => {
  it('renders action buttons', () => {
    render(<AgentCardExpanded agent={mockAgent} />);
    expect(screen.getByText(/Chat with Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/Configure/i)).toBeInTheDocument();
  });

  it('calls onChat when chat button is clicked', async () => {
    const onChat = jest.fn();
    render(<AgentCardExpanded agent={mockAgent} onChat={onChat} />);
    await userEvent.click(screen.getByText(/Chat with Agent/i));
    expect(onChat).toHaveBeenCalledTimes(1);
  });

  it('calls onConfigure when configure button is clicked', async () => {
    const onConfigure = jest.fn();
    render(<AgentCardExpanded agent={mockAgent} onConfigure={onConfigure} />);
    await userEvent.click(screen.getByText(/Configure/i));
    expect(onConfigure).toHaveBeenCalledTimes(1);
  });
});
```

### Visual Regression Tests

**Dark Mode:**
- Test all card variants in dark mode
- Verify status colors maintain contrast

**Responsive:**
- Test cards at mobile (320px), tablet (768px), desktop (1024px) widths

### Accessibility Tests

**A11y Audit:**
```typescript
it('passes accessibility audit', async () => {
  const { container } = render(<AgentCardStandard agent={mockAgent} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Screen Reader:**
- Status indicator has appropriate aria-label
- Cards have proper semantic structure (article or section)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code passes TypeScript check (`pnpm type-check`)
- [ ] Code passes ESLint (`pnpm lint`)
- [ ] All unit tests written and passing
- [ ] Components render correctly in light mode
- [ ] Components render correctly in dark mode
- [ ] Keyboard navigation works for interactive elements
- [ ] Screen reader support verified
- [ ] Loading skeleton states implemented
- [ ] Error boundaries in place
- [ ] Performance: cards render in <50ms
- [ ] Story file updated with implementation notes
- [ ] Code reviewed and approved

---

## Related Documentation

- [Epic 13 File](/home/chris/projects/work/Ai Bussiness Hub/docs/epics/EPIC-13-ai-agent-management.md)
- [Tech Spec - Epic 13](/home/chris/projects/work/Ai Bussiness Hub/docs/sprint-artifacts/tech-spec-epic-13.md)
- [Wireframes: AI-02](/home/chris/projects/work/Ai Bussiness Hub/docs/design/wireframes/Finished wireframes and html files/)
- [Agent Data Model (Tech Spec Section)](/home/chris/projects/work/Ai Bussiness Hub/docs/sprint-artifacts/tech-spec-epic-13.md#data-model)

---

_Generated by create-story workflow_
_Date: 2025-12-06_
