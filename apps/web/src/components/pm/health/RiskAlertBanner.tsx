/**
 * Risk Alert Banner Component
 *
 * Story: PM-05.5 - Pulse Risk Alerts
 *
 * Prominent banner displayed at top of project pages showing
 * critical or high severity risks. Includes risk count, primary
 * risk title, and button to open RiskListPanel. Dismissible for
 * the current session.
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RiskListPanel } from './RiskListPanel';
import { type RiskSeverity, getSeverityConfig } from './constants';

interface RiskAlertBannerProps {
  projectId: string;
  risks: Array<{
    id: string;
    severity: RiskSeverity;
    title: string;
  }>;
}

/**
 * Risk Alert Banner Component
 *
 * Displays a prominent alert banner for critical/high severity risks with:
 * - Severity indicator and color coding
 * - Risk count badge
 * - Primary risk title
 * - "View Details" button to open RiskListPanel
 * - Dismiss button (session-based)
 *
 * Only renders for CRITICAL or HIGH severity risks.
 * Banner is dismissible but returns on page refresh if risks still active.
 */
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
  const config = getSeverityConfig(primaryRisk.severity);

  return (
    <>
      <div
        className={cn(
          'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-l-4 rounded-lg mb-6',
          config.bg
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <AlertTriangle className={cn('w-5 h-5 mt-0.5 shrink-0', config.icon)} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowPanel(true)}
            className="flex-1 sm:flex-none"
          >
            View Details
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 shrink-0"
            aria-label="Close risk alert banner"
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
