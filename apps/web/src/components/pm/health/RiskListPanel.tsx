/**
 * Risk List Panel Component
 *
 * Story: PM-05.5 - Pulse Risk Alerts
 *
 * Slide-out panel showing all project risks with tabbed interface
 * for active and resolved risks. Includes action handlers for
 * acknowledging and resolving risks with React Query integration.
 */

'use client';

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
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { NESTJS_API_URL } from '@/lib/api-config';

interface RiskListPanelProps {
  projectId: string;
  onClose: () => void;
}

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

/**
 * Risk List Panel Component
 *
 * Displays all project risks in a slide-out sheet panel with:
 * - Tabbed interface (Active / Resolved)
 * - List of risk cards with acknowledge/resolve actions
 * - Empty states for no risks
 * - Real-time updates via React Query
 *
 * Integrates with Health API endpoints from PM-05.4.
 */
export function RiskListPanel({ projectId, onClose }: RiskListPanelProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = getSessionToken(session);

  // Fetch active risks
  const { data: risks, isLoading } = useQuery<RiskEntry[]>({
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

  // Group risks by status
  const activeRisks = risks?.filter(
    (r) => r.status === 'IDENTIFIED' || r.status === 'ANALYZING'
  ) || [];

  const resolvedRisks = risks?.filter(
    (r) => r.status === 'RESOLVED' || r.status === 'MITIGATED'
  ) || [];

  // Sort active risks by severity (CRITICAL > HIGH > MEDIUM > LOW)
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sortedActiveRisks = [...activeRisks].sort((a, b) => {
    return severityOrder[a.severity] - severityOrder[b.severity];
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
              Active ({sortedActiveRisks.length})
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
            ) : sortedActiveRisks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No active risks detected</p>
                <p className="text-xs mt-1">Your project health looks good!</p>
              </div>
            ) : (
              sortedActiveRisks.map((risk) => (
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
              resolvedRisks.map((risk) => (
                <RiskCard key={risk.id} risk={risk} readOnly />
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
