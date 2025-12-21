# PM Health Components

React components for displaying project health risks and alerts from the Pulse agent.

**Story:** PM-05.5 - Pulse Risk Alerts
**Epic:** PM-05 - AI Team: Scope, Pulse, Herald

## Components

### RiskAlertBanner

Prominent banner displayed at top of project pages showing critical or high severity risks.

**Features:**
- Only displays for CRITICAL or HIGH severity risks
- Shows risk count and primary risk title
- Severity-based color coding (red for critical, orange for high)
- "View Details" button to open RiskListPanel
- Dismissible for current session

**Usage:**

```tsx
import { RiskAlertBanner } from '@/components/pm/health';

function ProjectPage({ projectId }) {
  const { data: risks } = useQuery({
    queryKey: ['pm-risks', projectId],
    queryFn: () => fetch(`/api/pm/agents/health/${projectId}/risks`).then(r => r.json()),
  });

  return (
    <div>
      {risks && risks.length > 0 && (
        <RiskAlertBanner projectId={projectId} risks={risks} />
      )}
      {/* Rest of page content */}
    </div>
  );
}
```

### RiskListPanel

Slide-out panel showing all project risks with tabbed interface for active and resolved risks.

**Features:**
- Tabbed interface (Active / Resolved)
- Sortable by severity (CRITICAL > HIGH > MEDIUM > LOW)
- Action buttons for acknowledging and resolving risks
- Empty states for no risks
- Real-time updates via React Query

**Usage:**

```tsx
import { RiskListPanel } from '@/components/pm/health';

function ProjectRisks({ projectId }) {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <>
      <button onClick={() => setShowPanel(true)}>View Risks</button>
      {showPanel && (
        <RiskListPanel
          projectId={projectId}
          onClose={() => setShowPanel(false)}
        />
      )}
    </>
  );
}
```

### RiskCard

Individual risk display with severity badges, expandable details, and action buttons.

**Features:**
- Severity badge and risk type label
- Expandable details section (click chevron)
- Affected tasks count
- Acknowledgment and resolution metadata
- Action buttons (Acknowledge, Mark Resolved)
- Read-only mode for resolved risks

**Usage:**

```tsx
import { RiskCard } from '@/components/pm/health';

function RiskList({ risks, onAcknowledge, onResolve }) {
  return (
    <div className="space-y-4">
      {risks.map(risk => (
        <RiskCard
          key={risk.id}
          risk={risk}
          onAcknowledge={() => onAcknowledge(risk.id)}
          onResolve={() => onResolve(risk.id)}
        />
      ))}
    </div>
  );
}
```

### useRiskSubscription

React hook for WebSocket real-time risk updates.

**Features:**
- Subscribes to project health events
- Invalidates React Query cache on updates
- Shows toast notifications for new alerts
- Gracefully degrades if WebSocket not available

**Usage:**

```tsx
import { useRiskSubscription } from '@/components/pm/health';

function ProjectPage({ projectId }) {
  // Subscribe to real-time updates (optional)
  useRiskSubscription(projectId);

  // Rest of component...
}
```

## API Integration

These components integrate with the Health API endpoints from PM-05.4:

- `GET /api/pm/agents/health/:projectId/risks` - Get all risks
- `POST /api/pm/agents/health/:projectId/risks/:riskId/acknowledge` - Acknowledge risk
- `POST /api/pm/agents/health/:projectId/risks/:riskId/resolve` - Resolve risk

## Types

```typescript
type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type RiskStatus = 'IDENTIFIED' | 'ANALYZING' | 'RESOLVED' | 'MITIGATED';

interface RiskEntry {
  id: string;
  severity: RiskSeverity;
  riskType: string;
  title: string;
  description: string;
  affectedTasks: string[];
  affectedUsers: string[];
  status: RiskStatus;
  detectedAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}
```

## Risk Types

- **DEADLINE_WARNING**: Tasks due within 48 hours
- **CAPACITY_OVERLOAD**: Team member assigned more than 40 hours
- **BLOCKER_CHAIN**: 3+ tasks blocked by same dependency
- **VELOCITY_DROP**: Velocity 30%+ below baseline
- **SCOPE_CREEP**: Scope increased significantly during phase

## Severity Color Coding

- **CRITICAL**: Red (`bg-red-50`, `border-red-200`, `text-red-600`)
- **HIGH**: Orange (`bg-orange-50`, `border-orange-200`, `text-orange-600`)
- **MEDIUM**: Yellow (`bg-yellow-50`, `border-yellow-200`, `text-yellow-600`)
- **LOW**: Blue (`bg-blue-50`, `border-blue-200`, `text-blue-600`)

## Accessibility

All components follow WCAG AA standards:

- Semantic HTML with proper heading hierarchy
- ARIA labels on all interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus trap in RiskListPanel
- Color contrast meets WCAG AA standards
- Screen reader support with aria-live regions

## Responsive Design

Components are optimized for all viewport sizes:

- **Mobile (< 640px)**: Stacked layouts, full-width panels
- **Tablet (640px - 1024px)**: Horizontal layouts, 80% width panels
- **Desktop (1024px+)**: Full horizontal layouts, max-width panels

## Dependencies

- `@tanstack/react-query` - Data fetching and caching
- `lucide-react` - Icons
- `date-fns` - Date formatting
- `sonner` - Toast notifications
- `shadcn/ui` - UI components (Sheet, Tabs, Badge, Button, Card, Alert)

## Testing

Unit tests: `apps/web/src/components/pm/health/*.spec.tsx`
E2E tests: `apps/web/e2e/pm/health/risk-alerts.spec.ts`

Run tests:
```bash
pnpm test                    # Unit tests
pnpm test:e2e               # E2E tests
```
