'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useWorkflowExecutions, useRetryExecution } from '@/hooks/use-pm-workflows';

interface ExecutionHistoryPanelProps {
  workflowId: string;
}

export function ExecutionHistoryPanel({ workflowId }: ExecutionHistoryPanelProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [expandedExecutionId, setExpandedExecutionId] = useState<string | null>(null);

  const { data, isLoading } = useWorkflowExecutions(workflowId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: 20,
  });

  const retryExecution = useRetryExecution();

  const handleRetry = (executionId: string) => {
    if (confirm('Retry this failed execution with the same trigger data?')) {
      retryExecution.mutate(executionId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLETED: { variant: 'default' as const, icon: <CheckCircle className="w-3 h-3" /> },
      FAILED: { variant: 'destructive' as const, icon: <XCircle className="w-3 h-3" /> },
      RUNNING: { variant: 'secondary' as const, icon: <Loader2 className="w-3 h-3 animate-spin" /> },
      QUEUED: { variant: 'outline' as const, icon: <Clock className="w-3 h-3" /> },
      CANCELLED: { variant: 'secondary' as const, icon: <XCircle className="w-3 h-3" /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.QUEUED;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const formatDuration = (startedAt: Date, completedAt?: Date | null) => {
    if (!completedAt) return '-';
    const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Execution History</h3>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="RUNNING">Running</SelectItem>
            <SelectItem value="QUEUED">Queued</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading executions...</p>
        </div>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">No executions found</p>
        </div>
      )}

      {!isLoading && data && data.items.length > 0 && (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((execution) => (
                  <>
                    <TableRow key={execution.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedExecutionId(
                            expandedExecutionId === execution.id ? null : execution.id
                          )}
                        >
                          {expandedExecutionId === execution.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(execution.startedAt), 'MMM d, HH:mm:ss')}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(execution.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {execution.triggerType.replace(/_/g, ' ').toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {execution.stepsExecuted || 0} steps
                            {execution.stepsFailed > 0 && (
                              <span className="text-destructive ml-1">
                                ({execution.stepsFailed} failed)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDuration(execution.startedAt, execution.completedAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {execution.status === 'FAILED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(execution.id)}
                              disabled={retryExecution.isPending}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Retry
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedExecutionId === execution.id && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <div className="p-4 bg-muted/30 border-t">
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm">Execution Details</h4>

                                {execution.errorMessage && (
                                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                    <p className="text-sm font-medium text-destructive mb-1">
                                      Error
                                    </p>
                                    <p className="text-sm text-destructive/80">
                                      {execution.errorMessage}
                                    </p>
                                  </div>
                                )}

                                {execution.executionTrace && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Steps:</p>
                                    <div className="space-y-1">
                                      {(execution.executionTrace as any)?.steps?.map(
                                        (step: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-2 text-sm p-2 rounded bg-background"
                                          >
                                            {step.status === 'passed' ? (
                                              <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : step.status === 'failed' ? (
                                              <XCircle className="w-4 h-4 text-red-500" />
                                            ) : (
                                              <Clock className="w-4 h-4 text-gray-500" />
                                            )}
                                            <span className="font-mono text-xs">
                                              {step.nodeId}
                                            </span>
                                            <span className="text-muted-foreground">
                                              {step.type}
                                            </span>
                                            {step.duration && (
                                              <span className="text-xs text-muted-foreground ml-auto">
                                                {step.duration}ms
                                              </span>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                                {execution.isDryRun && (
                                  <Badge variant="outline" className="text-xs">
                                    Dry Run (Test Mode)
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages} (
                {data.pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
