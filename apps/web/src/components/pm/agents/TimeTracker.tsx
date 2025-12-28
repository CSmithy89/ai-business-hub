/**
 * Time Tracker Component
 *
 * Story: PM-12.1 - Agent UI Components
 *
 * Time tracking widget with start/stop timer and manual entry support.
 * Persists timer state to localStorage to survive page refreshes.
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Square,
  Clock,
  Plus,
  Loader2,
  Timer,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useTimeTracking,
  formatElapsedTime,
  parseDurationToMinutes,
} from '@/hooks/use-time-tracking';
import { getAgentConfig } from './constants';

// ============================================================================
// Types
// ============================================================================

interface TimeTrackerProps {
  projectId: string;
  taskId?: string;
  taskTitle?: string;
  tasks?: Array<{ id: string; title: string }>;
  onTimeLogged?: (entry: unknown) => void;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// Manual Entry Dialog
// ============================================================================

interface ManualEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: {
    taskId?: string;
    duration: number;
    description?: string;
  }) => Promise<void>;
  tasks?: Array<{ id: string; title: string }>;
  isLoading: boolean;
}

function ManualEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  tasks,
  isLoading,
}: ManualEntryDialogProps) {
  const [taskId, setTaskId] = useState<string>('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const minutes = parseDurationToMinutes(duration);
    if (!minutes || minutes <= 0) {
      setError('Please enter a valid duration (e.g., "1h 30m", "45m", "2:30")');
      return;
    }

    await onSubmit({
      taskId: taskId || undefined,
      duration: minutes,
      description: description || undefined,
    });

    // Reset form
    setTaskId('');
    setDuration('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Log Time Manually
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Selector */}
          {tasks && tasks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="task">Task (optional)</Label>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific task</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Duration Input */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration *</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                setError(null);
              }}
              placeholder="e.g., 1h 30m, 45m, 2:30"
              className={cn(error && 'border-red-500')}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Enter time as hours and minutes (1h 30m), minutes only (45m), or HH:MM (2:30)
            </p>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !duration}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Log Time
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Timer Display Component
// ============================================================================

interface TimerDisplayProps {
  elapsedSeconds: number;
  taskTitle?: string;
  description?: string;
  onStop: () => void;
  onCancel: () => void;
  isLogging: boolean;
  className?: string;
}

function TimerDisplay({
  elapsedSeconds,
  taskTitle,
  description,
  onStop,
  onCancel,
  isLogging,
  className,
}: TimerDisplayProps) {
  const chronoConfig = getAgentConfig('chrono');

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-4 rounded-lg border',
        chronoConfig.bgColor,
        chronoConfig.borderColor,
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Timer className={cn('w-6 h-6', chronoConfig.iconColor)} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono font-bold tabular-nums">
              {formatElapsedTime(elapsedSeconds)}
            </span>
            <Badge variant="secondary" className="text-xs">
              Running
            </Badge>
          </div>
          {(taskTitle || description) && (
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {taskTitle || description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={isLogging}
          title="Cancel timer"
        >
          <X className="w-4 h-4" />
        </Button>
        <Button
          variant="default"
          onClick={onStop}
          disabled={isLogging}
          className="gap-2"
        >
          {isLogging ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          Stop
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Time Tracker Component
// ============================================================================

/**
 * Time Tracker Component
 *
 * Provides a timer widget with:
 * - Start/stop timer button
 * - Elapsed time display (persisted across page refreshes)
 * - Manual time entry dialog
 * - Optional task selector
 * - Chrono agent integration
 *
 * @param projectId - Project ID for context
 * @param taskId - Optional pre-selected task ID
 * @param taskTitle - Optional pre-selected task title
 * @param tasks - Optional list of tasks for task selector
 * @param onTimeLogged - Callback when time is logged
 * @param compact - Use compact display mode
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <TimeTracker
 *   projectId="proj_123"
 *   tasks={[{ id: 'task_1', title: 'Feature A' }]}
 *   onTimeLogged={(entry) => console.log('Logged:', entry)}
 * />
 * ```
 */
export function TimeTracker({
  projectId,
  taskId: defaultTaskId,
  taskTitle: defaultTaskTitle,
  tasks,
  onTimeLogged,
  compact = false,
  className,
}: TimeTrackerProps) {
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(defaultTaskId || '');
  const [description, setDescription] = useState('');

  const {
    activeTimer,
    elapsedSeconds,
    isRunning,
    isLogging,
    startTimer,
    stopTimer,
    cancelTimer,
    logManualTime,
  } = useTimeTracking(projectId);

  const chronoConfig = getAgentConfig('chrono');

  const handleStart = () => {
    const task = tasks?.find((t) => t.id === selectedTaskId);
    startTimer({
      taskId: selectedTaskId || defaultTaskId,
      taskTitle: task?.title || defaultTaskTitle,
      description,
    });
  };

  const handleStop = async () => {
    const entry = await stopTimer();
    if (entry && onTimeLogged) {
      onTimeLogged(entry);
    }
    setSelectedTaskId('');
    setDescription('');
  };

  const handleCancel = () => {
    cancelTimer();
    setSelectedTaskId('');
    setDescription('');
  };

  const handleManualLog = async (params: {
    taskId?: string;
    duration: number;
    description?: string;
  }) => {
    const entry = await logManualTime(params);
    if (entry && onTimeLogged) {
      onTimeLogged(entry);
    }
  };

  // Compact mode - just a button
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isRunning ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            disabled={isLogging}
            className={cn('gap-2', chronoConfig.badgeColor)}
          >
            {isLogging ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {formatElapsedTime(elapsedSeconds)}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStart}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            Start Timer
          </Button>
        )}
      </div>
    );
  }

  // Full mode - card with controls
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className={cn('p-1.5 rounded', chronoConfig.badgeColor)}>
            <chronoConfig.Icon className={cn('w-4 h-4', chronoConfig.iconColor)} />
          </div>
          Time Tracker
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Timer Display */}
        {isRunning && (
          <TimerDisplay
            elapsedSeconds={elapsedSeconds}
            taskTitle={activeTimer?.taskTitle}
            description={activeTimer?.description}
            onStop={handleStop}
            onCancel={handleCancel}
            isLogging={isLogging}
          />
        )}

        {/* Start Timer Controls */}
        {!isRunning && (
          <div className="space-y-3">
            {/* Task Selector */}
            {tasks && tasks.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Task (optional)</Label>
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select a task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific task</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description Input */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Description (optional)
              </Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                className="h-9"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleStart} className="flex-1 gap-2">
                <Play className="w-4 h-4" />
                Start Timer
              </Button>
              <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Log Manually
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        )}

        {/* Manual Entry Dialog */}
        <ManualEntryDialog
          open={manualDialogOpen}
          onOpenChange={setManualDialogOpen}
          onSubmit={handleManualLog}
          tasks={tasks}
          isLoading={isLogging}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Compact time tracker button for toolbars
 */
export function TimeTrackerButton({
  projectId,
  taskId,
  taskTitle,
  className,
}: Pick<TimeTrackerProps, 'projectId' | 'taskId' | 'taskTitle' | 'className'>) {
  const {
    elapsedSeconds,
    isRunning,
    isLogging,
    startTimer,
    stopTimer,
  } = useTimeTracking(projectId);

  const chronoConfig = getAgentConfig('chrono');

  const handleToggle = async () => {
    if (isRunning) {
      await stopTimer();
    } else {
      startTimer({ taskId, taskTitle });
    }
  };

  return (
    <Button
      variant={isRunning ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={isLogging}
      className={cn(
        'gap-2',
        isRunning && chronoConfig.badgeColor,
        className
      )}
    >
      {isLogging ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isRunning ? (
        <Square className="w-4 h-4" />
      ) : (
        <Play className="w-4 h-4" />
      )}
      {isRunning ? formatElapsedTime(elapsedSeconds) : 'Track Time'}
    </Button>
  );
}
