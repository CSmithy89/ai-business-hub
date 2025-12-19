/**
 * EXAMPLE: Risk Alert Integration
 *
 * Story: PM-05.5 - Pulse Risk Alerts
 *
 * This file demonstrates how to integrate the Risk Alert components
 * into a project page. This is a complete working example.
 *
 * DO NOT USE THIS FILE IN PRODUCTION - It's for reference only.
 * Copy and adapt the patterns to your actual project pages.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { RiskAlertBanner, useRiskSubscription } from '@/components/pm/health';
import { useSession } from '@/lib/auth-client';
import { NESTJS_API_URL } from '@/lib/api-config';

// Helper functions (same as in RiskListPanel)
function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured');
  return NESTJS_API_URL.replace(/\/$/, '');
}

function getSessionToken(session: unknown): string | undefined {
  const direct = (session as { token?: string } | null)?.token;
  const nested = (session as { session?: { token?: string } } | null)?.session?.token;
  return direct || nested || undefined;
}

// Risk type definition
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

/**
 * EXAMPLE: Project Page with Risk Alerts
 *
 * This example shows a complete integration of risk alerts into a project page.
 * The RiskAlertBanner will automatically appear when critical/high risks are detected.
 */
export function ExampleProjectPage({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const token = getSessionToken(session);

  // Fetch risks from Health API
  const { data: risks, isLoading: _isLoading, isError: _isError } = useQuery<RiskEntry[]>({
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
    refetchInterval: 60000, // Refetch every minute (optional)
  });

  // Subscribe to real-time updates (optional - gracefully degrades if WebSocket not available)
  useRiskSubscription(projectId);

  return (
    <div className="container mx-auto p-6">
      {/* Risk Alert Banner - automatically shows for CRITICAL/HIGH risks */}
      {risks && risks.length > 0 && (
        <RiskAlertBanner projectId={projectId} risks={risks} />
      )}

      {/* Rest of your project page content */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Project Details</h1>

        {/* Project content goes here */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Your project widgets, charts, task lists, etc. */}
        </div>
      </div>
    </div>
  );
}

/**
 * EXAMPLE: Custom Hook for PM Risks
 *
 * This example shows how to create a reusable custom hook for risk management.
 * This approach is recommended for cleaner code and better reusability.
 */
export function useProjectRisks(projectId: string) {
  const { data: session } = useSession();
  const token = getSessionToken(session);

  const query = useQuery<RiskEntry[]>({
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

  // Helper to get only critical/high risks (for banner)
  const criticalRisks = query.data?.filter(
    (r) => r.severity === 'CRITICAL' || r.severity === 'HIGH'
  ) || [];

  // Helper to get active risks
  const activeRisks = query.data?.filter(
    (r) => r.status === 'IDENTIFIED' || r.status === 'ANALYZING'
  ) || [];

  // Helper to get resolved risks
  const resolvedRisks = query.data?.filter(
    (r) => r.status === 'RESOLVED' || r.status === 'MITIGATED'
  ) || [];

  return {
    risks: query.data,
    criticalRisks,
    activeRisks,
    resolvedRisks,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * EXAMPLE: Using the Custom Hook
 *
 * Simplified component using the custom hook.
 */
export function ExampleProjectPageWithHook({ projectId }: { projectId: string }) {
  const { risks, isLoading } = useProjectRisks(projectId);

  // Subscribe to real-time updates
  useRiskSubscription(projectId);

  if (isLoading) {
    return <div className="p-6">Loading project...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Risk Alert Banner */}
      {risks && risks.length > 0 && (
        <RiskAlertBanner projectId={projectId} risks={risks} />
      )}

      {/* Project content */}
      <h1 className="text-3xl font-bold">Project Details</h1>
      {/* ... */}
    </div>
  );
}

/**
 * EXAMPLE: Manual Risk Panel Button
 *
 * Shows how to add a button to manually open the risk panel.
 */
export function ExampleProjectHeader({ projectId }: { projectId: string }) {
  const [showRisks, setShowRisks] = useState(false);
  const { risks, activeRisks } = useProjectRisks(projectId);

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">My Project</h1>

      <div className="flex gap-2">
        {/* Button to manually open risks panel */}
        <Button
          variant="outline"
          onClick={() => setShowRisks(true)}
          disabled={!risks || risks.length === 0}
        >
          View Risks
          {activeRisks.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {activeRisks.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Risk panel */}
      {showRisks && (
        <RiskListPanel
          projectId={projectId}
          onClose={() => setShowRisks(false)}
        />
      )}
    </div>
  );
}

// Note: Add these imports at the top for the manual panel example
import { useState } from 'react';
import { RiskListPanel } from '@/components/pm/health';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
