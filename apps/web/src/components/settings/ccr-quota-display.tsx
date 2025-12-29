/**
 * CCR Quota Display Component
 *
 * Displays subscription quota progress bars for each AI provider,
 * showing usage limits, current usage, and reset dates.
 *
 * @module components/settings
 * @story DM-01.8
 */

'use client';

import {
  useCCRQuota,
  getUsagePercentage,
  getQuotaStatus,
  getProgressColor,
  getStatusTextColor,
  formatNumber,
  formatResetDate,
  getRemainingQuota,
  type ProviderQuota,
  type QuotaStatus,
} from '@/hooks/useCCRQuota';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Gauge,
  AlertCircle,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Status indicator badge
 */
function StatusBadge({ status }: { status: QuotaStatus }) {
  if (status === 'normal') return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'warning'
          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      )}
      data-testid={`status-badge-${status}`}
    >
      <AlertTriangle className="h-3 w-3" />
      {status === 'warning' ? 'Warning' : 'Critical'}
    </span>
  );
}

/**
 * Individual quota progress bar
 */
function QuotaProgressBar({ quota }: { quota: ProviderQuota }) {
  const percentage = getUsagePercentage(quota.used, quota.limit);
  const status = getQuotaStatus(quota.used, quota.limit);
  const remaining = getRemainingQuota(quota.used, quota.limit);

  return (
    <div
      className="space-y-2 rounded-lg border p-4"
      data-testid={`quota-item-${quota.providerId}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{quota.providerName}</h4>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {quota.billingCycle === 'monthly' ? 'Monthly' : quota.billingCycle} quota
          </p>
        </div>
        <div className="text-right">
          <p className={cn('text-sm font-medium', getStatusTextColor(status))}>
            {formatNumber(remaining)} remaining
          </p>
          <p className="text-xs text-muted-foreground">
            of {formatNumber(quota.limit)} tokens
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <Progress
          value={percentage}
          className="h-2"
          indicatorClassName={getProgressColor(status)}
          data-testid={`quota-progress-${quota.providerId}`}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatNumber(quota.used)} used ({percentage.toFixed(1)}%)</span>
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            Resets {formatResetDate(quota.resetDate)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Summary stats row
 */
function QuotaSummary({ quotas }: { quotas: ProviderQuota[] }) {
  const totalUsed = quotas.reduce((sum, q) => sum + q.used, 0);
  const warningCount = quotas.filter(
    (q) => getQuotaStatus(q.used, q.limit) === 'warning'
  ).length;
  const criticalCount = quotas.filter(
    (q) => getQuotaStatus(q.used, q.limit) === 'critical'
  ).length;

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b"
      data-testid="quota-summary"
    >
      <div className="text-center">
        <p className="text-2xl font-bold">{quotas.length}</p>
        <p className="text-xs text-muted-foreground">Providers</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold">{formatNumber(totalUsed)}</p>
        <p className="text-xs text-muted-foreground">Total Used</p>
      </div>
      <div className="text-center">
        <p className={cn('text-2xl font-bold', warningCount > 0 && 'text-yellow-600')}>
          {warningCount}
        </p>
        <p className="text-xs text-muted-foreground">Warnings</p>
      </div>
      <div className="text-center">
        <p className={cn('text-2xl font-bold', criticalCount > 0 && 'text-red-600')}>
          {criticalCount}
        </p>
        <p className="text-xs text-muted-foreground">Critical</p>
      </div>
    </div>
  );
}

/**
 * Main CCR Quota Display component
 */
export function CCRQuotaDisplay() {
  const { data: summary, isLoading, error } = useCCRQuota();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Subscription Quotas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Subscription Quotas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load quota information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.quotas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Subscription Quotas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No subscription quotas configured. Add AI providers to see quota usage.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="ccr-quota-display">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Subscription Quotas
        </CardTitle>
        <CardDescription>
          Platform subscription usage and limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <QuotaSummary quotas={summary.quotas} />

        {/* Quota list */}
        <div className="space-y-3" data-testid="quota-list">
          {summary.quotas.map((quota) => (
            <QuotaProgressBar key={quota.providerId} quota={quota} />
          ))}
        </div>

        {/* Last updated */}
        <p className="text-xs text-muted-foreground text-right">
          Last updated: {new Date(summary.lastUpdated).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}
