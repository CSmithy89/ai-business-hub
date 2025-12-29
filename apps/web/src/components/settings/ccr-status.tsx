/**
 * CCR Status Component
 *
 * Displays real-time CCR connection status, provider health indicators,
 * and reconnection controls.
 *
 * @module components/settings
 * @story DM-01.7
 */

'use client';

import {
  useCCRStatus,
  useReconnectCCR,
  getStatusColor,
  getStatusTextColor,
  getStatusLabel,
  formatLatency,
  formatLastChecked,
  type ProviderStatus,
} from '@/hooks/useCCRStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Activity,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Connection status badge
 */
function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
        connected
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      )}
      data-testid="connection-badge"
    >
      {connected ? (
        <>
          <Wifi className="h-4 w-4" />
          Connected
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          Disconnected
        </>
      )}
    </div>
  );
}

/**
 * Provider status row
 */
function ProviderStatusRow({ provider }: { provider: ProviderStatus }) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b last:border-b-0"
      data-testid={`provider-status-${provider.id}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn('h-2.5 w-2.5 rounded-full', getStatusColor(provider.status))}
          data-testid={`provider-indicator-${provider.status}`}
        />
        <div>
          <p className="font-medium text-sm">{provider.name}</p>
          <p className="text-xs text-muted-foreground">{provider.provider}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {provider.latency !== undefined && (
          <div className="flex items-center gap-1 text-muted-foreground" title="Latency">
            <Zap className="h-3.5 w-3.5" />
            <span>{formatLatency(provider.latency)}</span>
          </div>
        )}
        <span className={cn('font-medium', getStatusTextColor(provider.status))}>
          {getStatusLabel(provider.status)}
        </span>
      </div>
    </div>
  );
}

/**
 * Stats summary
 */
function StatusStats({
  uptime,
  totalRequests,
  failedRequests,
}: {
  uptime?: number;
  totalRequests?: number;
  failedRequests?: number;
}) {
  if (uptime === undefined && totalRequests === undefined) return null;

  return (
    <div className="grid grid-cols-3 gap-4 py-4 border-t" data-testid="status-stats">
      {uptime !== undefined && (
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{uptime}%</p>
          <p className="text-xs text-muted-foreground">Uptime</p>
        </div>
      )}
      {totalRequests !== undefined && (
        <div className="text-center">
          <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Requests</p>
        </div>
      )}
      {failedRequests !== undefined && (
        <div className="text-center">
          <p className={cn('text-2xl font-bold', failedRequests > 0 ? 'text-yellow-600' : 'text-green-600')}>
            {failedRequests}
          </p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
      )}
    </div>
  );
}

/**
 * Main CCR Status component
 */
export function CCRStatus() {
  const { data: status, isLoading, error, refetch, isFetching } = useCCRStatus();
  const reconnectMutation = useReconnectCCR();

  const handleReconnect = async () => {
    await reconnectMutation.mutateAsync();
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Connection Status
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
            <Activity className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load connection status</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            CCR is not configured. Configure routing first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="ccr-status">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription className="mt-1">
              Real-time CCR connection and provider health
            </CardDescription>
          </div>
          <ConnectionBadge connected={status.connected} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode and last checked */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last checked: {formatLastChecked(status.lastChecked)}</span>
          </div>
          <span className="text-muted-foreground">
            Mode: <span className="font-medium text-foreground capitalize">{status.mode}</span>
          </span>
        </div>

        {/* Provider list */}
        <div className="rounded-lg border" data-testid="provider-list">
          {status.providers.map((provider) => (
            <ProviderStatusRow key={provider.id} provider={provider} />
          ))}
        </div>

        {/* Stats */}
        <StatusStats
          uptime={status.uptime}
          totalRequests={status.totalRequests}
          failedRequests={status.failedRequests}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            data-testid="refresh-status"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>

          {!status.connected && (
            <Button
              size="sm"
              onClick={handleReconnect}
              disabled={reconnectMutation.isPending}
              data-testid="reconnect-button"
            >
              {reconnectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Wifi className="h-4 w-4 mr-2" />
              )}
              Reconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
