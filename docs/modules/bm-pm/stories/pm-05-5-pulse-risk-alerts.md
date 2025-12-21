# Story PM-05.5: Pulse Risk Alerts

**Epic:** PM-05 - AI Team: Scope, Pulse, Herald
**Status:** in-progress
**Points:** 5

---

## User Story

As a **project manager**,
I want **risk alerts displayed prominently in the UI**,
So that **I can quickly see and respond to project health issues**.

---

## Acceptance Criteria

### AC1: Risk Alert Banner Display
**Given** Pulse has detected critical or high severity risks
**When** user views project page
**Then** risk alert banner displayed at top with:
- Risk severity indicator (critical=red, high=orange, medium=yellow)
- Risk count badge
- Primary risk title
- "View Details" button

### AC2: Risk List Panel
**Given** user clicks "View Details" on risk banner
**When** risk panel opens
**Then** displays:
- All active risks for project
- Each risk shows: type, severity, title, description, affected tasks count
- Risks sorted by severity (critical > high > medium)
- Action buttons: "Acknowledge" and "Resolve"

### AC3: Risk Acknowledgment Workflow
**Given** user sees an unacknowledged risk
**When** user clicks "Acknowledge" button
**Then**:
- Risk status changes to ANALYZING
- Risk shows acknowledgment badge with user name and timestamp
- Risk remains visible but visually de-emphasized

### AC4: Risk Resolution Workflow
**Given** user has addressed a risk
**When** user clicks "Resolve" button
**Then**:
- Risk status changes to RESOLVED
- Risk moves to "Resolved Risks" section
- Risk count badge decrements
- Success toast notification displayed

### AC5: Real-Time Risk Updates
**Given** Pulse detects new risks (via cron job)
**When** health check completes
**Then**:
- New risks appear in UI without refresh
- Risk count badge updates
- Alert banner appears if critical/high risks detected
- User receives in-app notification

---

## Technical Notes

### Component Architecture

```
ProjectLayout
├── RiskAlertBanner (top of page, conditional)
│   ├── Severity indicator badge
│   ├── Risk count badge
│   ├── Primary risk title
│   └── "View Details" button
│
└── RiskListPanel (slide-out panel)
    ├── Active Risks Section
    │   ├── RiskCard (for each active risk)
    │   │   ├── Severity badge
    │   │   ├── Risk type icon
    │   │   ├── Title & description
    │   │   ├── Affected tasks count
    │   │   ├── Acknowledgment status
    │   │   └── Action buttons (Acknowledge, Resolve)
    │   └── Empty state (if no active risks)
    │
    └── Resolved Risks Section (collapsible)
        └── RiskCard (read-only, resolved risks)
```

### Frontend Components

**Location:** `apps/web/src/components/pm/health/`

#### 1. RiskAlertBanner Component

```typescript
// apps/web/src/components/pm/health/RiskAlertBanner.tsx

'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RiskListPanel } from './RiskListPanel';

interface RiskAlertBannerProps {
  projectId: string;
  risks: Array<{
    id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
  }>;
}

export function RiskAlertBanner({ projectId, risks }: RiskAlertBannerProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show banner for CRITICAL or HIGH severity risks
  const criticalRisks = risks.filter(
    (r) => r.severity === 'CRITICAL' || r.severity === 'HIGH'
  );

  if (criticalRisks.length === 0 || dismissed) {
    return null;
  }

  const primaryRisk = criticalRisks[0];
  const severityConfig = {
    CRITICAL: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-900',
      badge: 'bg-red-600 text-white',
      icon: 'text-red-600',
    },
    HIGH: {
      bg: 'bg-orange-50 border-orange-200',
      text: 'text-orange-900',
      badge: 'bg-orange-600 text-white',
      icon: 'text-orange-600',
    },
  };

  const config =
    severityConfig[primaryRisk.severity as 'CRITICAL' | 'HIGH'] ||
    severityConfig.HIGH;

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-4 p-4 border-l-4 rounded-lg mb-6',
          config.bg
        )}
      >
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className={cn('w-5 h-5 mt-0.5', config.icon)} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={config.badge}>
                {primaryRisk.severity}
              </Badge>
              <Badge variant="outline" className={config.text}>
                {criticalRisks.length} risk{criticalRisks.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <p className={cn('font-medium', config.text)}>
              {primaryRisk.title}
            </p>
            {criticalRisks.length > 1 && (
              <p className={cn('text-sm mt-1', config.text)}>
                +{criticalRisks.length - 1} more risk
                {criticalRisks.length - 1 > 1 ? 's' : ''} detected
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowPanel(true)}>
            View Details
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

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

#### 2. RiskListPanel Component

```typescript
// apps/web/src/components/pm/health/RiskListPanel.tsx

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiskCard } from './RiskCard';
import { Loader2 } from 'lucide-react';

interface RiskListPanelProps {
  projectId: string;
  onClose: () => void;
}

export function RiskListPanel({ projectId, onClose }: RiskListPanelProps) {
  const queryClient = useQueryClient();

  // Fetch active risks
  const { data: risks, isLoading } = useQuery({
    queryKey: ['risks', projectId],
    queryFn: () =>
      fetch(`/api/pm/agents/health/${projectId}/risks`).then((r) => r.json()),
  });

  // Group risks by status
  const activeRisks = risks?.filter(
    (r: any) => r.status === 'IDENTIFIED' || r.status === 'ANALYZING'
  ) || [];

  const resolvedRisks = risks?.filter(
    (r: any) => r.status === 'RESOLVED'
  ) || [];

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (riskId: string) =>
      fetch(`/api/pm/agents/health/${projectId}/risks/${riskId}/acknowledge`, {
        method: 'POST',
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['health', projectId] });
    },
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: (riskId: string) =>
      fetch(`/api/pm/agents/health/${projectId}/risks/${riskId}/resolve`, {
        method: 'POST',
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['health', projectId] });
    },
  });

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Project Risks</SheetTitle>
          <SheetDescription>
            Detected risks and alerts from Pulse health monitoring
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="active" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active ({activeRisks.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedRisks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeRisks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No active risks detected</p>
                <p className="text-xs mt-1">Your project health looks good!</p>
              </div>
            ) : (
              activeRisks.map((risk: any) => (
                <RiskCard
                  key={risk.id}
                  risk={risk}
                  onAcknowledge={() => acknowledgeMutation.mutate(risk.id)}
                  onResolve={() => resolveMutation.mutate(risk.id)}
                  isLoading={
                    acknowledgeMutation.isPending || resolveMutation.isPending
                  }
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="mt-6 space-y-4">
            {resolvedRisks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No resolved risks</p>
              </div>
            ) : (
              resolvedRisks.map((risk: any) => (
                <RiskCard key={risk.id} risk={risk} readOnly />
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

#### 3. RiskCard Component

```typescript
// apps/web/src/components/pm/health/RiskCard.tsx

'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface RiskCardProps {
  risk: {
    id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    riskType: string;
    title: string;
    description: string;
    affectedTasks: string[];
    affectedUsers: string[];
    status: 'IDENTIFIED' | 'ANALYZING' | 'RESOLVED';
    detectedAt: string;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    resolvedAt?: string;
  };
  onAcknowledge?: () => void;
  onResolve?: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function RiskCard({
  risk,
  onAcknowledge,
  onResolve,
  isLoading,
  readOnly,
}: RiskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    CRITICAL: {
      bg: 'bg-red-50 border-red-200',
      badge: 'bg-red-600 text-white',
      icon: 'text-red-600',
    },
    HIGH: {
      bg: 'bg-orange-50 border-orange-200',
      badge: 'bg-orange-600 text-white',
      icon: 'text-orange-600',
    },
    MEDIUM: {
      bg: 'bg-yellow-50 border-yellow-200',
      badge: 'bg-yellow-600 text-white',
      icon: 'text-yellow-600',
    },
    LOW: {
      bg: 'bg-blue-50 border-blue-200',
      badge: 'bg-blue-600 text-white',
      icon: 'text-blue-600',
    },
  };

  const config = severityConfig[risk.severity] || severityConfig.MEDIUM;

  const riskTypeLabels: Record<string, string> = {
    DEADLINE_WARNING: 'Deadline Warning',
    BLOCKER_CHAIN: 'Blocker Chain',
    CAPACITY_OVERLOAD: 'Capacity Overload',
    VELOCITY_DROP: 'Velocity Drop',
    SCOPE_CREEP: 'Scope Creep',
  };

  return (
    <Card className={cn(config.bg, readOnly && 'opacity-60')}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className={cn('w-5 h-5 mt-0.5', config.icon)} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={config.badge}>{risk.severity}</Badge>
                <Badge variant="outline">
                  {riskTypeLabels[risk.riskType] || risk.riskType}
                </Badge>
                {risk.status === 'ANALYZING' && (
                  <Badge variant="secondary">Acknowledged</Badge>
                )}
                {risk.status === 'RESOLVED' && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base">{risk.title}</CardTitle>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{risk.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Detected {format(new Date(risk.detectedAt), 'MMM d, h:mm a')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {risk.affectedTasks.length} task
                {risk.affectedTasks.length !== 1 ? 's' : ''} affected
              </span>
            </div>
          </div>

          {risk.acknowledgedBy && risk.acknowledgedAt && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="text-muted-foreground">
                Acknowledged by <span className="font-medium">{risk.acknowledgedBy}</span>
                {' on '}
                {format(new Date(risk.acknowledgedAt), 'MMM d, h:mm a')}
              </p>
            </div>
          )}

          {risk.resolvedAt && (
            <div className="p-3 bg-green-50 rounded-md text-sm">
              <p className="text-green-900">
                Resolved on {format(new Date(risk.resolvedAt), 'MMM d, h:mm a')}
              </p>
            </div>
          )}
        </CardContent>
      )}

      {!readOnly && (
        <CardFooter className="flex gap-2">
          {risk.status === 'IDENTIFIED' && onAcknowledge && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAcknowledge}
              disabled={isLoading}
            >
              Acknowledge
            </Button>
          )}
          {onResolve && (
            <Button
              variant="default"
              size="sm"
              onClick={onResolve}
              disabled={isLoading}
            >
              Mark Resolved
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
```

### API Integration

The components use the existing Health API endpoints created in PM-05.4:

**Health Service Endpoints:**
- `GET /api/pm/agents/health/:projectId/risks` - Get all risks
- `POST /api/pm/agents/health/:projectId/risks/:riskId/acknowledge` - Acknowledge risk
- `POST /api/pm/agents/health/:projectId/risks/:riskId/resolve` - Resolve risk

**Health Controller Endpoints (already implemented):**
```typescript
// apps/api/src/pm/agents/health.controller.ts

@Get(':projectId/risks')
@Roles('owner', 'admin', 'member')
async getActiveRisks(
  @CurrentWorkspace() workspaceId: string,
  @Param('projectId') projectId: string,
) {
  return this.healthService.getActiveRisks(workspaceId, projectId);
}

@Post(':projectId/risks/:riskId/acknowledge')
@Roles('owner', 'admin', 'member')
async acknowledgeRisk(
  @CurrentWorkspace() workspaceId: string,
  @Param('riskId') riskId: string,
  @CurrentUser() user: User,
) {
  return this.healthService.acknowledgeRisk(workspaceId, riskId, user.id);
}

@Post(':projectId/risks/:riskId/resolve')
@Roles('owner', 'admin', 'member')
async resolveRisk(
  @CurrentWorkspace() workspaceId: string,
  @Param('riskId') riskId: string,
  @CurrentUser() user: User,
) {
  return this.healthService.resolveRisk(workspaceId, riskId, user.id);
}
```

### Real-Time Updates

For real-time risk updates, integrate with WebSocket:

```typescript
// apps/web/src/components/pm/health/useRiskSubscription.ts

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/lib/socket';

export function useRiskSubscription(projectId: string) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Subscribe to project health events
    socket.emit('project:subscribe', { projectId });

    // Listen for health updates
    socket.on('health:updated', (data) => {
      queryClient.invalidateQueries({ queryKey: ['health', projectId] });
      queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
    });

    // Listen for new risk alerts
    socket.on('health:alert', (data) => {
      queryClient.invalidateQueries({ queryKey: ['risks', projectId] });

      // Show toast notification
      toast({
        title: 'New Risk Detected',
        description: data.message,
        variant: data.severity === 'critical' ? 'destructive' : 'default',
      });
    });

    return () => {
      socket.off('health:updated');
      socket.off('health:alert');
    };
  }, [socket, projectId, queryClient]);
}
```

### Integration with Project Layout

Add RiskAlertBanner to project layout:

```typescript
// apps/web/src/app/pm/projects/[id]/layout.tsx

export default function ProjectLayout({ children, params }: LayoutProps) {
  const { data: health } = useQuery({
    queryKey: ['health', params.id],
    queryFn: () =>
      fetch(`/api/pm/agents/health/${params.id}`).then(r => r.json()),
  });

  const { data: risks } = useQuery({
    queryKey: ['risks', params.id],
    queryFn: () =>
      fetch(`/api/pm/agents/health/${params.id}/risks`).then(r => r.json()),
  });

  // Subscribe to real-time updates
  useRiskSubscription(params.id);

  return (
    <div className="p-6">
      {risks && risks.length > 0 && (
        <RiskAlertBanner projectId={params.id} risks={risks} />
      )}
      {children}
    </div>
  );
}
```

---

## Dependencies

### Prerequisites

- **PM-05.4** (Pulse Health Agent) - Risk detection and health score calculation
- **PM-01** (Projects) - Project context
- **PM-02** (Tasks) - Affected tasks display

### Blocks

- **PM-06** (Real-Time & Notifications) - Full WebSocket integration for live updates

---

## Tasks

### Frontend Tasks
- [ ] Create `apps/web/src/components/pm/health/RiskAlertBanner.tsx`
- [ ] Create `apps/web/src/components/pm/health/RiskListPanel.tsx`
- [ ] Create `apps/web/src/components/pm/health/RiskCard.tsx`
- [ ] Create `apps/web/src/components/pm/health/useRiskSubscription.ts` hook
- [ ] Add RiskAlertBanner to project layout
- [ ] Add shadcn Sheet component (if not already available)
- [ ] Add shadcn Tabs component (if not already available)

### API Tasks (already completed in PM-05.4)
- [x] Health service risk detection implemented
- [x] GET /api/pm/agents/health/:projectId/risks endpoint
- [x] POST /api/pm/agents/health/:projectId/risks/:riskId/acknowledge endpoint
- [x] POST /api/pm/agents/health/:projectId/risks/:riskId/resolve endpoint

### Integration Tasks
- [ ] Test risk alert banner displays for CRITICAL/HIGH risks
- [ ] Test risk list panel shows all active and resolved risks
- [ ] Test acknowledge workflow updates risk status
- [ ] Test resolve workflow moves risk to resolved section
- [ ] Test real-time updates when new risks detected
- [ ] Verify workspace scoping on all risk operations

---

## Testing Requirements

### Unit Tests

**Frontend Components:**
- `RiskAlertBanner` displays for CRITICAL/HIGH risks only
- `RiskAlertBanner` can be dismissed
- `RiskListPanel` groups risks by status (active/resolved)
- `RiskCard` displays all risk details correctly
- `RiskCard` severity colors match severity level
- Action buttons disabled during loading

**Location:** `apps/web/src/components/pm/health/*.spec.tsx`

### Integration Tests

**API Integration:**
- Fetching risks returns properly formatted data
- Acknowledging risk updates status to ANALYZING
- Resolving risk updates status to RESOLVED
- Risk count updates after acknowledgment/resolution
- Workspace isolation enforced

**Location:** `apps/web/e2e/pm/health/risk-alerts.spec.ts`

### E2E Tests (Playwright)

**User Flows:**
1. Navigate to project with risks → see alert banner → click "View Details" → panel opens
2. View active risks → click "Acknowledge" → risk status updates → badge shows "Acknowledged"
3. Click "Mark Resolved" → risk moves to resolved tab → count decrements
4. Dismiss alert banner → banner disappears (persists for session)
5. Health check detects new risk → real-time update → new risk appears in list

**Location:** `apps/web/e2e/pm/health/risk-alerts.spec.ts`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] RiskAlertBanner component displays for CRITICAL/HIGH risks
- [ ] RiskListPanel shows active and resolved risks in tabs
- [ ] RiskCard displays all risk details with proper styling
- [ ] Acknowledge workflow updates risk status
- [ ] Resolve workflow moves risk to resolved section
- [ ] Real-time updates work (when WebSocket available)
- [ ] Alert banner can be dismissed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] Component usage docs
  - [ ] Risk alert workflow docs
- [ ] Accessibility verified (ARIA labels, keyboard navigation)
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Dark mode support verified

---

## Implementation Notes

### Severity Color Coding

Following the health score color scheme from HealthWidget:
- **CRITICAL**: Red (bg-red-50, border-red-200, text-red-600)
- **HIGH**: Orange (bg-orange-50, border-orange-200, text-orange-600)
- **MEDIUM**: Yellow (bg-yellow-50, border-yellow-200, text-yellow-600)
- **LOW**: Blue (bg-blue-50, border-blue-200, text-blue-600)

### Risk Status Flow

```
IDENTIFIED → (user acknowledges) → ANALYZING → (user resolves) → RESOLVED
```

### UI/UX Decisions

1. **Banner Placement**: Top of project page, above content
2. **Banner Visibility**: Only shows for CRITICAL/HIGH risks
3. **Banner Dismissal**: Persists for session (not permanently dismissed)
4. **Panel Type**: Slide-out sheet from right (standard pattern)
5. **Risk Grouping**: Active vs Resolved tabs
6. **Risk Sorting**: By severity (desc), then detection time (desc)
7. **Expandable Details**: Click chevron to expand/collapse risk details
8. **Action Buttons**: Primary actions in card footer

---

## References

- [Epic Definition](../epics/epic-pm-05-ai-team-scope-pulse-herald.md)
- [Epic Tech Spec](../epics/epic-pm-05-tech-spec.md)
- [PM-05.4 Story](./pm-05-4-pulse-health-agent.md) - Pulse agent and risk detection
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)

---
