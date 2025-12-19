/**
 * Risk Card Component
 *
 * Story: PM-05.5 - Pulse Risk Alerts
 *
 * Individual risk display with severity badges, expandable details,
 * and action buttons for acknowledging and resolving risks.
 * Supports both active and read-only (resolved) modes.
 */

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

type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type RiskStatus = 'IDENTIFIED' | 'ANALYZING' | 'RESOLVED' | 'MITIGATED';

interface RiskCardProps {
  risk: {
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
  };
  onAcknowledge?: () => void;
  onResolve?: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

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
} as const;

const riskTypeLabels: Record<string, string> = {
  DEADLINE_WARNING: 'Deadline Warning',
  BLOCKER_CHAIN: 'Blocker Chain',
  CAPACITY_OVERLOAD: 'Capacity Overload',
  VELOCITY_DROP: 'Velocity Drop',
  SCOPE_CREEP: 'Scope Creep',
};

/**
 * Risk Card Component
 *
 * Displays a risk card with:
 * - Severity badge and risk type label
 * - Expandable details section
 * - Affected tasks and users count
 * - Acknowledgment and resolution metadata
 * - Action buttons for acknowledge/resolve
 *
 * Optimized for mobile, tablet, and desktop viewports.
 */
export function RiskCard({
  risk,
  onAcknowledge,
  onResolve,
  isLoading,
  readOnly,
}: RiskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const config = severityConfig[risk.severity] || severityConfig.MEDIUM;

  return (
    <Card className={cn(config.bg, readOnly && 'opacity-60')}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className={cn('w-5 h-5 mt-0.5 shrink-0', config.icon)} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
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
            aria-label={expanded ? 'Collapse risk details' : 'Expand risk details'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Detected {format(new Date(risk.detectedAt), 'MMM d, h:mm a')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
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
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          {risk.status === 'IDENTIFIED' && onAcknowledge && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAcknowledge}
              disabled={isLoading}
              aria-label="Acknowledge risk"
              className="w-full sm:w-auto"
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
              aria-label="Mark risk as resolved"
              className="w-full sm:w-auto"
            >
              Mark Resolved
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
