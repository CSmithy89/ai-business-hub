'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useActivateWorkflow, usePauseWorkflow } from '@/hooks/use-pm-workflows';

interface WorkflowStatusToggleProps {
  workflowId: string;
  enabled: boolean;
  status: string;
}

export function WorkflowStatusToggle({
  workflowId,
  enabled,
  status,
}: WorkflowStatusToggleProps) {
  const activateWorkflow = useActivateWorkflow();
  const pauseWorkflow = usePauseWorkflow();

  const isLoading =
    (activateWorkflow.isPending && activateWorkflow.variables === workflowId) ||
    (pauseWorkflow.isPending && pauseWorkflow.variables === workflowId);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      activateWorkflow.mutate(workflowId);
    } else {
      pauseWorkflow.mutate(workflowId);
    }
  };

  const getStatusBadge = () => {
    if (status === 'ACTIVE' && enabled) {
      return <Badge variant="default">Active</Badge>;
    }
    if (status === 'PAUSED' || !enabled) {
      return <Badge variant="secondary">Paused</Badge>;
    }
    if (status === 'DRAFT') {
      return <Badge variant="outline">Draft</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center space-x-2">
        <Switch
          id={`workflow-status-${workflowId}`}
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isLoading || status === 'DRAFT'}
        />
        <Label htmlFor={`workflow-status-${workflowId}`} className="cursor-pointer">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </span>
          ) : (
            <span>{enabled ? 'Active' : 'Paused'}</span>
          )}
        </Label>
      </div>
      {getStatusBadge()}
    </div>
  );
}
