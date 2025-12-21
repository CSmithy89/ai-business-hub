'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';
import { usePhaseTransition } from '@/hooks/use-phase-transition';

interface TaskAction {
  taskId: string;
  action: 'complete' | 'carry_over' | 'cancel';
  targetPhaseId?: string;
}

interface PhaseTransitionModalProps {
  phaseId: string;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransition?: () => void;
}

export function PhaseTransitionModal({
  phaseId,
  projectId,
  open,
  onOpenChange,
  onTransition,
}: PhaseTransitionModalProps) {
  const router = useRouter();
  const [taskActions, setTaskActions] = useState<Record<string, TaskAction>>({});
  const [completionNote, setCompletionNote] = useState('');

  const {
    analysis,
    isLoading,
    isError,
    error,
    refetch,
    transitionMutation,
  } = usePhaseTransition(phaseId, projectId, open);

  // Initialize task actions from Scope recommendations
  useEffect(() => {
    if (analysis?.recommendations) {
      const initialActions = analysis.recommendations.reduce(
        (acc: Record<string, TaskAction>, rec) => ({
          ...acc,
          [rec.taskId]: {
            taskId: rec.taskId,
            action: rec.action,
            targetPhaseId: rec.suggestedPhase,
          },
        }),
        {}
      );
      setTaskActions(initialActions);
    }
  }, [analysis]);

  const handleActionChange = (taskId: string, action: string) => {
    setTaskActions((prev) => ({
      ...prev,
      [taskId]: {
        taskId,
        action: action as 'complete' | 'carry_over' | 'cancel',
      },
    }));
  };

  const handleConfirmTransition = () => {
    transitionMutation.mutate(
      {
        taskActions: Object.values(taskActions),
        completionNote: completionNote || undefined,
      },
      {
        onSuccess: (data) => {
          onTransition?.();

          // Navigate to next phase if it exists
          if (data.activePhase) {
            router.push(`/pm/phases/${data.activePhase.id}` as Parameters<typeof router.push>[0]);
          }

          onOpenChange(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground">Analyzing phase with Scope...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Analysis Failed</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to analyze phase. Please try again.'}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => refetch()}>
              Retry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analysis) return null;

  const hasBlockers = analysis.summary.blockers.length > 0;
  const canTransition = analysis.summary.readyForCompletion && !hasBlockers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Phase: {analysis.phaseName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Phase Summary Card */}
          <div className="bg-accent rounded-lg p-4">
            <h3 className="font-semibold mb-3">Phase Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Tasks:</span>
                <span className="ml-2 font-medium">{analysis.totalTasks}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <span className="ml-2 font-medium">{analysis.completedTasks}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Incomplete:</span>
                <span className="ml-2 font-medium">{analysis.incompleteTasks.length}</span>
              </div>
            </div>

            <div className="mt-3">
              <Badge variant={canTransition ? 'default' : 'secondary'}>
                {canTransition ? 'Ready for Completion' : 'Not Ready'}
              </Badge>
            </div>
          </div>

          {/* Blockers Alert */}
          {hasBlockers && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Blockers Detected</div>
                <ul className="space-y-1">
                  {analysis.summary.blockers.map((blocker: string, i: number) => (
                    <li key={i}>• {blocker}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Incomplete Tasks List */}
          {analysis.incompleteTasks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Incomplete Tasks</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose an action for each incomplete task:
              </p>

              <div className="space-y-3">
                {analysis.recommendations.map((rec) => (
                  <div key={rec.taskId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{rec.taskTitle}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          💡 {rec.reasoning}
                        </p>
                      </div>

                      <Select
                        value={taskActions[rec.taskId]?.action || rec.action}
                        onValueChange={(value) => handleActionChange(rec.taskId, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complete">Complete Now</SelectItem>
                          <SelectItem value="carry_over">Carry to Next Phase</SelectItem>
                          <SelectItem value="cancel">Cancel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Scope suggests:{' '}
                      <span className="font-medium capitalize">
                        {rec.action.replace('_', ' ')}
                      </span>
                      {taskActions[rec.taskId]?.action !== rec.action && (
                        <Badge variant="outline" className="ml-2">
                          Overridden
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Phase Preview */}
          {analysis.summary.nextPhasePreview && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-900">
                <ArrowRight className="h-5 w-5" />
                <div>
                  <h4 className="font-semibold">Next Phase</h4>
                  <p className="text-sm mt-1">{analysis.summary.nextPhasePreview}</p>
                </div>
              </div>
            </div>
          )}

          {/* Completion Note */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Completion Note (Optional)
            </label>
            <Textarea
              placeholder="Add any notes about this phase completion..."
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {completionNote.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={transitionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmTransition}
            disabled={!canTransition || transitionMutation.isPending}
          >
            {transitionMutation.isPending ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Transition
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
