'use client';

import { CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronRight, Zap, GitBranch, Play } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ExecutionStep, TestWorkflowResponse } from '@/hooks/use-pm-workflows';

interface ExecutionTraceViewerProps {
  trace: TestWorkflowResponse;
  onClose?: () => void;
}

function getStepIcon(type: ExecutionStep['type']) {
  switch (type) {
    case 'trigger':
      return <Zap className="h-4 w-4" />;
    case 'condition':
      return <GitBranch className="h-4 w-4" />;
    case 'action':
      return <Play className="h-4 w-4" />;
    default:
      return null;
  }
}

function getStatusIcon(status: ExecutionStep['status']) {
  switch (status) {
    case 'passed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'skipped':
      return <MinusCircle className="h-5 w-5 text-gray-400" />;
    default:
      return null;
  }
}

function getStatusBadgeVariant(status: ExecutionStep['status']): 'default' | 'destructive' | 'secondary' {
  switch (status) {
    case 'passed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'skipped':
      return 'secondary';
    default:
      return 'default';
  }
}

function StepResultDetails({ result }: { result: ExecutionStep['result'] }) {
  if (!result) return null;

  return (
    <div className="mt-2 space-y-1">
      {result.simulated && (
        <div className="text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">Simulated</Badge>
        </div>
      )}
      {result.action && (
        <div className="text-xs">
          <span className="font-medium">Action:</span>{' '}
          <code className="bg-muted px-1.5 py-0.5 rounded">{result.action}</code>
        </div>
      )}
      {result.condition && (
        <div className="text-xs">
          <span className="font-medium">Condition:</span>{' '}
          <code className="bg-muted px-1.5 py-0.5 rounded">{result.condition}</code>
        </div>
      )}
      {result.matched !== undefined && (
        <div className="text-xs">
          <span className="font-medium">Matched:</span>{' '}
          <span className={result.matched ? 'text-green-600' : 'text-red-600'}>
            {result.matched ? 'Yes' : 'No'}
          </span>
        </div>
      )}
      {result.evaluated !== undefined && (
        <div className="text-xs">
          <span className="font-medium">Evaluated:</span>{' '}
          <span className={result.evaluated ? 'text-green-600' : 'text-red-600'}>
            {result.evaluated ? 'True' : 'False'}
          </span>
        </div>
      )}
      {result.error && (
        <div className="text-xs text-red-600">
          <span className="font-medium">Error:</span> {result.error}
        </div>
      )}
    </div>
  );
}

function ExecutionStepItem({ step, index }: { step: ExecutionStep; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex items-start gap-3 group">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium">
          {index + 1}
        </div>
        {index < (step.duration || 0) && (
          <div className="w-0.5 h-full bg-border mt-2" />
        )}
      </div>

      <div className="flex-1 pb-4">
        <div
          className={cn(
            'border rounded-lg p-3 transition-colors',
            expanded && 'bg-muted/50'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {getStepIcon(step.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono">{step.nodeId}</code>
                  <Badge variant="outline" className="text-xs">
                    {step.type}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {step.duration !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {step.duration}ms
                </span>
              )}
              <div className="flex items-center gap-1">
                {getStatusIcon(step.status)}
                <Badge variant={getStatusBadgeVariant(step.status)} className="text-xs">
                  {step.status}
                </Badge>
              </div>
              {(step.result || step.error) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="h-6 w-6 p-0"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {expanded && (
            <div className="mt-3 pt-3 border-t">
              {step.error ? (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                  <span className="font-medium">Error:</span> {step.error}
                </div>
              ) : (
                <StepResultDetails result={step.result} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExecutionTraceViewer({ trace, onClose }: ExecutionTraceViewerProps) {
  const { summary, trace: executionTrace } = trace;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Workflow Test Results</CardTitle>
            <CardDescription>
              Execution ID: <code className="text-xs">{trace.executionId}</code>
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold">{summary.stepsExecuted}</div>
            <div className="text-xs text-muted-foreground">Steps Executed</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {summary.stepsPassed}
            </div>
            <div className="text-xs text-green-600 dark:text-green-500">Passed</div>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {summary.stepsFailed}
            </div>
            <div className="text-xs text-red-600 dark:text-red-500">Failed</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold">{summary.duration}ms</div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </div>
        </div>

        {/* Execution Trace Timeline */}
        <div>
          <h3 className="text-sm font-medium mb-4">Execution Trace</h3>
          <div className="space-y-0">
            {executionTrace.steps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No steps were executed
              </div>
            ) : (
              executionTrace.steps.map((step, index) => (
                <ExecutionStepItem key={step.nodeId} step={step} index={index} />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
