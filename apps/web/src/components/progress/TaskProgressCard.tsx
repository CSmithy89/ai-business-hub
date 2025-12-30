/**
 * TaskProgressCard Component
 *
 * Displays real-time progress for a long-running agent task.
 * Shows step-by-step execution with status icons, overall progress,
 * estimated time remaining, and cancel/dismiss actions.
 *
 * @see docs/modules/bm-dm/stories/dm-05-4-realtime-progress-streaming.md
 * Epic: DM-05 | Story: DM-05.4
 */
'use client';

import { useMemo } from 'react';
import { Circle, Check, X, Loader2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  TaskProgress,
  TaskStepStatus,
  TaskStatusValue,
} from '@/lib/schemas/dashboard-state';

export interface TaskProgressCardProps {
  /** Task progress data */
  task: TaskProgress;
  /** Callback when user clicks cancel */
  onCancel?: (taskId: string) => void;
  /** Callback when user clicks dismiss */
  onDismiss?: (taskId: string) => void;
  /** Whether to show step details (default true) */
  showSteps?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Status badge variant mapping
 */
const statusVariants: Record<
  TaskStatusValue,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  running: 'default',
  completed: 'secondary',
  failed: 'destructive',
  cancelled: 'outline',
};

/**
 * Status badge labels
 */
const statusLabels: Record<TaskStatusValue, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

/**
 * Get icon for step status
 */
function StepIcon({ status }: { status: TaskStepStatus }) {
  switch (status) {
    case 'pending':
      return <Circle className="h-4 w-4 text-muted-foreground" />;
    case 'running':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case 'completed':
      return <Check className="h-4 w-4 text-green-600" />;
    case 'failed':
      return <X className="h-4 w-4 text-destructive" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

/**
 * Calculate weighted progress including sub-step progress
 */
function calculateWeightedProgress(task: TaskProgress): number {
  if (task.totalSteps === 0) return 0;
  let totalProgress = 0;
  for (const step of task.steps) {
    if (step.status === 'completed') {
      totalProgress += 100;
    } else if (step.status === 'running' && step.progress !== undefined) {
      totalProgress += step.progress;
    }
  }
  return Math.round(totalProgress / task.totalSteps);
}

/**
 * Calculate estimated time remaining
 */
function getEstimatedRemaining(task: TaskProgress): string | null {
  if (!task.startedAt || !task.estimatedCompletionMs) return null;
  const elapsed = Date.now() - task.startedAt;
  const remaining = Math.max(0, task.estimatedCompletionMs - elapsed);

  if (remaining === 0) return 'Almost done...';

  const seconds = Math.floor(remaining / 1000);
  if (seconds < 60) return `${seconds}s remaining`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s remaining`;
}

/**
 * Format elapsed time
 */
function formatElapsedTime(startedAt: number | undefined): string {
  if (!startedAt) return '';
  const elapsed = Date.now() - startedAt;
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * TaskProgressCard - Displays progress for a long-running task
 */
export function TaskProgressCard({
  task,
  onCancel,
  onDismiss,
  showSteps = true,
  className,
}: TaskProgressCardProps) {
  const isTerminal = ['completed', 'failed', 'cancelled'].includes(task.status);
  const isRunning = task.status === 'running' || task.status === 'pending';

  const progressPercent = useMemo(
    () => calculateWeightedProgress(task),
    [task]
  );

  const estimatedRemaining = useMemo(
    () => (isRunning ? getEstimatedRemaining(task) : null),
    [task, isRunning]
  );

  return (
    <Card className={cn('relative', className)} data-testid="task-progress-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{task.taskName}</CardTitle>
          <Badge variant={statusVariants[task.status]}>
            {statusLabels[task.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {task.currentStep + 1} of {task.totalSteps}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Time Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {task.startedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatElapsedTime(task.startedAt)} elapsed
            </span>
          )}
          {estimatedRemaining && (
            <span className="text-primary">{estimatedRemaining}</span>
          )}
        </div>

        {/* Step List */}
        {showSteps && task.steps.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {task.steps.map((step) => (
              <div
                key={step.index}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  step.status === 'pending' && 'text-muted-foreground',
                  step.status === 'running' && 'text-primary font-medium',
                  step.status === 'completed' && 'text-muted-foreground',
                  step.status === 'failed' && 'text-destructive'
                )}
              >
                <StepIcon status={step.status} />
                <span className="flex-1">{step.name}</span>
                {step.status === 'running' && step.progress !== undefined && (
                  <span className="text-xs">{step.progress}%</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {task.error && (
          <div className="flex items-start gap-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{task.error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {isRunning && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(task.taskId)}
            >
              Cancel
            </Button>
          )}
          {isTerminal && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(task.taskId)}
            >
              Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
