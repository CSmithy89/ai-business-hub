/**
 * Health Dashboard Component
 *
 * Story: PM-12.1 - Agent UI Components
 *
 * Project health overview with gauge, factor breakdown, trend indicator,
 * and active risks summary. Integrates with Pulse agent.
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Gauge,
  ChevronRight,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePmRisks } from '@/hooks/use-pm-risks';
import { RiskCard } from '@/components/pm/health/RiskCard';
import { RiskListPanel } from '@/components/pm/health/RiskListPanel';
import { getAgentConfig } from './constants';

// ============================================================================
// Types
// ============================================================================

interface HealthFactor {
  name: string;
  label: string;
  score: number; // 0-100
  weight: number; // 0-1
  trend?: 'improving' | 'declining' | 'stable';
  details?: string;
}

interface HealthData {
  overallScore: number; // 0-100
  trend: 'improving' | 'declining' | 'stable';
  trendPercent?: number;
  factors: HealthFactor[];
  lastUpdated: string;
}

interface HealthDashboardProps {
  projectId: string;
  healthData?: HealthData;
  isLoading?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getHealthColor(score: number): {
  text: string;
  bg: string;
  border: string;
} {
  if (score >= 80) {
    return {
      text: 'text-green-600',
      bg: 'bg-green-100',
      border: 'border-green-200',
    };
  }
  if (score >= 60) {
    return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-100',
      border: 'border-yellow-200',
    };
  }
  if (score >= 40) {
    return {
      text: 'text-orange-600',
      bg: 'bg-orange-100',
      border: 'border-orange-200',
    };
  }
  return {
    text: 'text-red-600',
    bg: 'bg-red-100',
    border: 'border-red-200',
  };
}

function getHealthLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'At Risk';
}

function getTrendIcon(trend: 'improving' | 'declining' | 'stable') {
  switch (trend) {
    case 'improving':
      return TrendingUp;
    case 'declining':
      return TrendingDown;
    case 'stable':
      return Minus;
  }
}

function getTrendColor(trend: 'improving' | 'declining' | 'stable'): string {
  switch (trend) {
    case 'improving':
      return 'text-green-600';
    case 'declining':
      return 'text-red-600';
    case 'stable':
      return 'text-gray-500';
  }
}

// ============================================================================
// Health Gauge Component
// ============================================================================

interface HealthGaugeProps {
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  trendPercent?: number;
  size?: 'sm' | 'md' | 'lg';
}

function HealthGauge({ score, trend, trendPercent, size = 'md' }: HealthGaugeProps) {
  const colors = getHealthColor(score);
  const TrendIcon = getTrendIcon(trend);
  const trendColor = getTrendColor(trend);

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  // Calculate the arc for the gauge
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * 0.75; // 75% of circle
  const strokeDasharray = `${progress * circumference} ${circumference}`;

  return (
    <div className="flex flex-col items-center">
      <div className={cn('relative', sizeClasses[size])}>
        <svg
          viewBox="0 0 100 100"
          className="transform -rotate-135"
        >
          {/* Background arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted/20"
            strokeDasharray={`${0.75 * circumference} ${circumference}`}
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={colors.text}
            strokeDasharray={strokeDasharray}
            style={{
              transition: 'stroke-dasharray 0.5s ease-in-out',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold tabular-nums', textSizes[size])}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      {/* Trend indicator */}
      <div className={cn('flex items-center gap-1 mt-2', trendColor)}>
        <TrendIcon className="w-4 h-4" />
        <span className="text-sm font-medium capitalize">{trend}</span>
        {trendPercent !== undefined && (
          <span className="text-xs">
            ({trendPercent > 0 ? '+' : ''}
            {trendPercent}%)
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Factor Breakdown Component
// ============================================================================

interface FactorBreakdownProps {
  factors: HealthFactor[];
}

function FactorBreakdown({ factors }: FactorBreakdownProps) {
  return (
    <div className="space-y-3">
      {factors.map((factor) => {
        const colors = getHealthColor(factor.score);
        const TrendIcon = factor.trend ? getTrendIcon(factor.trend) : null;
        const trendColor = factor.trend ? getTrendColor(factor.trend) : '';

        return (
          <TooltipProvider key={factor.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {factor.label}
                      {TrendIcon && (
                        <TrendIcon className={cn('w-3 h-3', trendColor)} />
                      )}
                    </span>
                    <span className={cn('font-medium', colors.text)}>
                      {factor.score}%
                    </span>
                  </div>
                  <Progress
                    value={factor.score}
                    className={cn(
                      'h-2',
                      factor.score >= 80 && '[&>div]:bg-green-500',
                      factor.score >= 60 && factor.score < 80 && '[&>div]:bg-yellow-500',
                      factor.score >= 40 && factor.score < 60 && '[&>div]:bg-orange-500',
                      factor.score < 40 && '[&>div]:bg-red-500'
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{factor.label}</p>
                  {factor.details && (
                    <p className="text-xs">{factor.details}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Weight: {Math.round(factor.weight * 100)}%
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// ============================================================================
// Risks Summary Component
// ============================================================================

interface RisksSummaryProps {
  projectId: string;
  onViewAll: () => void;
}

function RisksSummary({ projectId, onViewAll }: RisksSummaryProps) {
  const { sortedActiveRisks, isLoading, acknowledgeMutation, resolveMutation } = usePmRisks(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sortedActiveRisks.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
        <p className="text-sm font-medium text-green-600">No Active Risks</p>
        <p className="text-xs text-muted-foreground mt-1">
          Project health is in good standing
        </p>
      </div>
    );
  }

  // Show only top 2 risks
  const displayRisks = sortedActiveRisks.slice(0, 2);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">
            {sortedActiveRisks.length} Active Risk
            {sortedActiveRisks.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
          View All
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {displayRisks.map((risk) => (
          <RiskCard
            key={risk.id}
            risk={risk}
            onAcknowledge={() => acknowledgeMutation.mutate(risk.id)}
            onResolve={() => resolveMutation.mutate(risk.id)}
            isLoading={
              acknowledgeMutation.isPending || resolveMutation.isPending
            }
          />
        ))}
      </div>

      {sortedActiveRisks.length > 2 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onViewAll}
          className="w-full"
        >
          View {sortedActiveRisks.length - 2} more risks
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Health Dashboard Component
// ============================================================================

/**
 * Health Dashboard Component
 *
 * Displays project health overview with:
 * - Health score gauge (0-100)
 * - Trend indicator (improving/declining/stable)
 * - Factor breakdown (on-time, blockers, capacity, velocity)
 * - Active risks summary
 * - Link to RiskListPanel for full details
 *
 * @param projectId - Project ID for context
 * @param healthData - Health data from Pulse agent
 * @param isLoading - Whether data is loading
 * @param onRefresh - Callback to refresh health data
 * @param compact - Use compact display mode
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <HealthDashboard
 *   projectId="proj_123"
 *   healthData={{
 *     overallScore: 78,
 *     trend: 'improving',
 *     factors: [...],
 *     lastUpdated: '2024-01-15T10:30:00Z'
 *   }}
 * />
 * ```
 */
export function HealthDashboard({
  projectId,
  healthData,
  isLoading,
  onRefresh,
  compact = false,
  className,
}: HealthDashboardProps) {
  const [riskPanelOpen, setRiskPanelOpen] = useState(false);
  const pulseConfig = getAgentConfig('pulse');

  // Default health data for loading/empty state
  const defaultHealth: HealthData = {
    overallScore: 0,
    trend: 'stable',
    factors: [],
    lastUpdated: new Date().toISOString(),
  };

  const health = healthData || defaultHealth;
  const healthColors = getHealthColor(health.overallScore);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Compact mode - just score and trend
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-default',
                healthColors.bg,
                healthColors.border,
                className
              )}
            >
              <Gauge className={cn('w-4 h-4', healthColors.text)} />
              <span className={cn('font-bold', healthColors.text)}>
                {health.overallScore}
              </span>
              {health.trend !== 'stable' && (
                <span className={cn('text-xs', getTrendColor(health.trend))}>
                  {health.trend === 'improving' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Project Health: {getHealthLabel(health.overallScore)} ({health.trend})
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <Card className={cn(pulseConfig.bgColor, pulseConfig.borderColor, 'border', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className={cn('p-1.5 rounded', pulseConfig.badgeColor)}>
                <pulseConfig.Icon className={cn('w-4 h-4', pulseConfig.iconColor)} />
              </div>
              Project Health
              <Badge variant="secondary" className="text-xs font-normal">
                by {pulseConfig.name}
              </Badge>
            </CardTitle>
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Health Gauge and Label */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <HealthGauge
              score={health.overallScore}
              trend={health.trend}
              trendPercent={health.trendPercent}
              size="md"
            />
            <div className="flex-1 text-center sm:text-left">
              <p className={cn('text-2xl font-bold', healthColors.text)}>
                {getHealthLabel(health.overallScore)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Overall project health score
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground justify-center sm:justify-start">
                <Clock className="w-3 h-3" />
                <span>
                  Last updated:{' '}
                  {new Date(health.lastUpdated).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Factor Breakdown */}
          {health.factors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Health Factors
              </p>
              <FactorBreakdown factors={health.factors} />
            </div>
          )}

          {/* Risks Summary */}
          <div className="pt-4 border-t">
            <RisksSummary
              projectId={projectId}
              onViewAll={() => setRiskPanelOpen(true)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Risk List Panel */}
      {riskPanelOpen && (
        <RiskListPanel
          projectId={projectId}
          onClose={() => setRiskPanelOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Health score badge for inline display
 */
export function HealthBadge({
  score,
  trend,
  onClick,
}: {
  score: number;
  trend?: 'improving' | 'declining' | 'stable';
  onClick?: () => void;
}) {
  const colors = getHealthColor(score);
  const TrendIcon = trend ? getTrendIcon(trend) : null;
  const trendColor = trend ? getTrendColor(trend) : '';

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 cursor-pointer hover:opacity-80 transition-opacity',
        colors.bg,
        colors.border
      )}
      onClick={onClick}
    >
      <Gauge className={cn('w-3 h-3', colors.text)} />
      <span className={cn('font-bold', colors.text)}>{score}</span>
      {TrendIcon && (
        <TrendIcon className={cn('w-3 h-3', trendColor)} />
      )}
      <ExternalLink className="w-3 h-3 ml-1 text-muted-foreground" />
    </Badge>
  );
}
