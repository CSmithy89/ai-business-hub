# Risk Alert Integration Guide

How to integrate the Risk Alert components into your project pages.

## Quick Start

### 1. Add RiskAlertBanner to Project Layout

The simplest way to integrate risk alerts is to add the `RiskAlertBanner` to your project layout or page:

```tsx
// app/pm/projects/[id]/page.tsx or layout.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { RiskAlertBanner, useRiskSubscription } from '@/components/pm/health';
import { useSession } from '@/lib/auth-client';
import { NESTJS_API_URL } from '@/lib/api-config';

export default function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const { data: session } = useSession();
  const token = session?.token;

  // Fetch risks
  const { data: risks } = useQuery({
    queryKey: ['pm-risks', projectId],
    queryFn: async () => {
      const url = `${NESTJS_API_URL}/pm/agents/health/${projectId}/risks`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch risks');
      return response.json();
    },
    enabled: !!token,
  });

  // Optional: Subscribe to real-time updates
  useRiskSubscription(projectId);

  return (
    <div className="p-6">
      {/* Risk Alert Banner - shows for CRITICAL/HIGH risks only */}
      {risks && risks.length > 0 && (
        <RiskAlertBanner projectId={projectId} risks={risks} />
      )}

      {/* Rest of your project page content */}
      <h1>Project Details</h1>
      {/* ... */}
    </div>
  );
}
```

### 2. Add Manual Risk Panel Button (Optional)

If you want to provide a button to manually open the risk panel:

```tsx
'use client';

import { useState } from 'react';
import { RiskListPanel } from '@/components/pm/health';
import { Button } from '@/components/ui/button';

export function ProjectHeader({ projectId }: { projectId: string }) {
  const [showRisks, setShowRisks] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <h1>Project</h1>
      <div className="flex gap-2">
        <Button onClick={() => setShowRisks(true)}>
          View Risks
        </Button>
      </div>

      {showRisks && (
        <RiskListPanel
          projectId={projectId}
          onClose={() => setShowRisks(false)}
        />
      )}
    </div>
  );
}
```

### 3. Create Custom React Query Hook (Recommended)

For cleaner code and better reusability, create a custom hook:

```tsx
// hooks/use-pm-risks.ts

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { NESTJS_API_URL } from '@/lib/api-config';

type RiskEntry = {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  riskType: string;
  title: string;
  description: string;
  affectedTasks: string[];
  affectedUsers: string[];
  status: 'IDENTIFIED' | 'ANALYZING' | 'RESOLVED' | 'MITIGATED';
  detectedAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
};

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured');
  return NESTJS_API_URL.replace(/\/$/, '');
}

function getSessionToken(session: unknown): string | undefined {
  const direct = (session as { token?: string } | null)?.token;
  const nested = (session as { session?: { token?: string } } | null)?.session?.token;
  return direct || nested || undefined;
}

export function usePMRisks(projectId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = getSessionToken(session);

  // Fetch risks
  const risksQuery = useQuery<RiskEntry[]>({
    queryKey: ['pm-risks', projectId],
    queryFn: async () => {
      const url = `${getBaseUrl()}/pm/agents/health/${projectId}/risks`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch risks: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!token,
  });

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (riskId: string) => {
      const url = `${getBaseUrl()}/pm/agents/health/${projectId}/risks/${riskId}/acknowledge`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to acknowledge risk: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-risks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['pm-health', projectId] });
      toast.success('Risk acknowledged');
    },
    onError: (error) => {
      toast.error('Failed to acknowledge risk', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: async (riskId: string) => {
      const url = `${getBaseUrl()}/pm/agents/health/${projectId}/risks/${riskId}/resolve`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to resolve risk: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-risks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['pm-health', projectId] });
      toast.success('Risk marked as resolved');
    },
    onError: (error) => {
      toast.error('Failed to resolve risk', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  return {
    risks: risksQuery.data,
    isLoading: risksQuery.isLoading,
    isError: risksQuery.isError,
    error: risksQuery.error,
    acknowledgeRisk: acknowledgeMutation.mutate,
    resolveRisk: resolveMutation.mutate,
    isAcknowledging: acknowledgeMutation.isPending,
    isResolving: resolveMutation.isPending,
  };
}
```

Then use it in your component:

```tsx
'use client';

import { RiskAlertBanner, useRiskSubscription } from '@/components/pm/health';
import { usePMRisks } from '@/hooks/use-pm-risks';

export default function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const { risks, isLoading } = usePMRisks(projectId);

  // Optional: Subscribe to real-time updates
  useRiskSubscription(projectId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      {risks && risks.length > 0 && (
        <RiskAlertBanner projectId={projectId} risks={risks} />
      )}
      {/* Rest of content */}
    </div>
  );
}
```

## Real-Time Updates

The `useRiskSubscription` hook provides real-time updates via WebSocket (when PM-06 is implemented):

```tsx
import { useRiskSubscription } from '@/components/pm/health';

function ProjectPage({ projectId }) {
  // This hook will:
  // 1. Subscribe to project health events
  // 2. Invalidate React Query cache when risks change
  // 3. Show toast notifications for new alerts
  // 4. Gracefully degrade if WebSocket not available
  useRiskSubscription(projectId);

  // Your component code...
}
```

**Note:** The hook gracefully degrades if WebSocket infrastructure is not yet available. React Query will fall back to its default polling/refetch behavior.

## Advanced: Custom Risk Display

If you need more control, you can use the components individually:

```tsx
'use client';

import { RiskCard } from '@/components/pm/health';
import { usePMRisks } from '@/hooks/use-pm-risks';

export function CustomRiskList({ projectId }: { projectId: string }) {
  const { risks, acknowledgeRisk, resolveRisk, isAcknowledging, isResolving } = usePMRisks(projectId);

  const criticalRisks = risks?.filter(r => r.severity === 'CRITICAL') || [];

  return (
    <div className="space-y-4">
      <h2>Critical Risks</h2>
      {criticalRisks.map(risk => (
        <RiskCard
          key={risk.id}
          risk={risk}
          onAcknowledge={() => acknowledgeRisk(risk.id)}
          onResolve={() => resolveRisk(risk.id)}
          isLoading={isAcknowledging || isResolving}
        />
      ))}
    </div>
  );
}
```

## Testing Integration

### Unit Test Example

```tsx
import { render, screen } from '@testing-library/react';
import { RiskAlertBanner } from '@/components/pm/health';

describe('RiskAlertBanner', () => {
  it('displays banner for critical risks', () => {
    const risks = [
      {
        id: '1',
        severity: 'CRITICAL' as const,
        title: 'Deadline approaching',
      },
    ];

    render(<RiskAlertBanner projectId="project-1" risks={risks} />);

    expect(screen.getByText('Deadline approaching')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('does not display for medium/low risks', () => {
    const risks = [
      {
        id: '1',
        severity: 'MEDIUM' as const,
        title: 'Minor issue',
      },
    ];

    const { container } = render(<RiskAlertBanner projectId="project-1" risks={risks} />);

    expect(container.firstChild).toBeNull();
  });
});
```

### E2E Test Example

```tsx
import { test, expect } from '@playwright/test';

test('risk alert banner workflow', async ({ page }) => {
  // Navigate to project with risks
  await page.goto('/pm/projects/project-1');

  // Verify banner displays
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByText('CRITICAL')).toBeVisible();

  // Open risk panel
  await page.getByRole('button', { name: 'View Details' }).click();

  // Verify panel opens
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Project Risks')).toBeVisible();

  // Acknowledge a risk
  await page.getByRole('button', { name: 'Acknowledge' }).first().click();

  // Verify acknowledgment
  await expect(page.getByText('Acknowledged')).toBeVisible();
});
```

## Troubleshooting

### Banner not showing

1. Verify risks are being fetched: Check React Query DevTools
2. Ensure risks have CRITICAL or HIGH severity
3. Check if banner was dismissed (refresh page to reset)

### API errors

1. Verify NESTJS_API_URL is configured correctly
2. Check authentication token is valid
3. Ensure health endpoints are working (PM-05.4)

### Real-time updates not working

1. Verify WebSocket infrastructure is available (PM-06)
2. The hook gracefully degrades - updates will work via polling
3. Check browser console for WebSocket connection errors
