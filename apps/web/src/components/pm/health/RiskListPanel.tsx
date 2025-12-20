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
import { usePmRisks } from '@/hooks/use-pm-risks';

interface RiskListPanelProps {
  projectId: string;
  onClose: () => void;
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
  const {
    sortedActiveRisks,
    resolvedRisks,
    isLoading,
    acknowledgeMutation,
    resolveMutation,
  } = usePmRisks(projectId);

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
