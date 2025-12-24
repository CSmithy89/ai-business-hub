'use client';

import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TaskSelector } from './TaskSelector';
import { ExecutionTraceViewer } from './ExecutionTraceViewer';
import { useTestWorkflow, type TestWorkflowResponse } from '@/hooks/use-pm-workflows';

interface WorkflowTestPanelProps {
  workflowId: string;
  projectId: string;
  onTestComplete?: (trace: TestWorkflowResponse) => void;
}

export function WorkflowTestPanel({
  workflowId,
  projectId,
  onTestComplete,
}: WorkflowTestPanelProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestWorkflowResponse | null>(null);

  const testWorkflow = useTestWorkflow();

  const handleRunTest = async () => {
    if (!selectedTaskId) return;

    try {
      const result = await testWorkflow.mutateAsync({
        workflowId,
        input: { taskId: selectedTaskId },
      });

      setTestResult(result);
      onTestComplete?.(result);
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Test failed:', error);
    }
  };

  const handleClearResults = () => {
    setTestResult(null);
    setSelectedTaskId(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Workflow</CardTitle>
          <CardDescription>
            Run this workflow in dry-run mode against a sample task to verify it works correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-selector">Select Sample Task</Label>
            <TaskSelector
              projectId={projectId}
              value={selectedTaskId}
              onChange={setSelectedTaskId}
            />
            <p className="text-xs text-muted-foreground">
              Choose a task from this project to test the workflow against
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRunTest}
              disabled={!selectedTaskId || testWorkflow.isPending}
              className="flex-1"
            >
              {testWorkflow.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Test
                </>
              )}
            </Button>

            {testResult && (
              <Button variant="outline" onClick={handleClearResults}>
                Clear Results
              </Button>
            )}
          </div>

          {testWorkflow.isPending && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Executing workflow in dry-run mode. No changes will be made to your data.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {testResult && (
        <ExecutionTraceViewer trace={testResult} onClose={handleClearResults} />
      )}
    </div>
  );
}
