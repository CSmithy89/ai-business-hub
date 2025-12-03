'use client';

import { useState } from 'react';
import {
  useEventStats,
  useDLQEvents,
  useRetryDLQEvent,
  useDeleteDLQEvent,
} from '@/hooks/use-event-stats';
import { StatCard } from '@/components/events/stat-card';
import { DLQEventTable } from '@/components/events/dlq-event-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

/**
 * Event Monitoring Dashboard Page
 *
 * Admin page for monitoring the event bus:
 * - Event throughput metrics
 * - Dead letter queue management
 * - Consumer group status
 *
 * Story: 05-7 - Event Monitoring Dashboard
 */
export default function EventMonitoringPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch stats with auto-refresh every 5 seconds
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useEventStats(5000);

  // Fetch DLQ events with auto-refresh
  const {
    data: dlqData,
    isLoading: dlqLoading,
    error: dlqError,
  } = useDLQEvents(currentPage, itemsPerPage);

  // Mutations for retry and delete
  const retryMutation = useRetryDLQEvent();
  const deleteMutation = useDeleteDLQEvent();

  const handleRetry = (eventId: string) => {
    retryMutation.mutate(eventId, {
      onSuccess: () => {
        toast.success('Event queued for retry');
      },
      onError: (error: Error) => {
        toast.error(`Failed to retry event: ${error.message}`);
      },
    });
  };

  const handleDelete = (eventId: string) => {
    if (!confirm('Are you sure you want to permanently delete this event?')) {
      return;
    }

    deleteMutation.mutate(eventId, {
      onSuccess: () => {
        toast.success('Event deleted from DLQ');
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete event: ${error.message}`);
      },
    });
  };

  const getHealthStatus = () => {
    if (!stats) return 'unknown';
    if (stats.dlq.length > 10) return 'degraded';
    if (stats.consumerGroup.lag > 100) return 'warning';
    return 'healthy';
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Event Bus Monitoring
            </h1>
            <p className="mt-2 text-gray-600">
              Monitor event throughput, consumer health, and manage failed events
            </p>
          </div>
          <Badge
            variant={
              healthStatus === 'healthy'
                ? 'default'
                : healthStatus === 'warning'
                  ? 'secondary'
                  : 'destructive'
            }
            className="text-sm px-3 py-1"
          >
            {healthStatus === 'healthy' && 'Healthy'}
            {healthStatus === 'warning' && 'Warning'}
            {healthStatus === 'degraded' && 'Degraded'}
            {healthStatus === 'unknown' && 'Loading...'}
          </Badge>
        </div>

        {/* Error state */}
        {(statsError || dlqError) && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="font-semibold text-red-900">Error Loading Data</h3>
            <p className="text-red-700">
              {statsError?.message || dlqError?.message}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Events (24h)"
            value={stats?.throughput.last24h}
            description="Total events processed"
          />
          <StatCard
            title="Events (1h)"
            value={stats?.throughput.lastHour}
            description="Recent throughput"
          />
          <StatCard
            title="DLQ Size"
            value={stats?.dlq.length}
            alert
            description="Failed events awaiting attention"
          />
          <StatCard
            title="Consumer Lag"
            value={stats?.consumerGroup.lag}
            description="Events behind in processing"
          />
        </div>

        {/* Secondary Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stream Length
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '-' : stats?.mainStream.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Events in main stream
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Consumers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '-' : stats?.consumerGroup.consumers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Processing events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '-' : stats?.consumerGroup.pending}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting acknowledgment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dead Letter Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dead Letter Queue</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Events that failed processing and require attention
                </p>
              </div>
              {dlqData && dlqData.total > 0 && (
                <Badge variant="destructive">{dlqData.total} failed</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <DLQEventTable
              events={dlqData?.events || []}
              isLoading={dlqLoading}
              onRetry={handleRetry}
              onDelete={handleDelete}
              isRetrying={retryMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />

            {/* Pagination */}
            {dlqData && dlqData.total > itemsPerPage && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, dlqData.total)} of{' '}
                  {dlqData.total} events
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage * itemsPerPage >= dlqData.total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
