'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConditionNodeData {
  label: string;
  config: {
    condition?: {
      field: string;
      operator: string;
      value: any;
    };
  };
}

export const ConditionNode = memo(({ data, selected }: NodeProps<ConditionNodeData>) => {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-card shadow-sm min-w-[180px]',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-amber-500/50'
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-amber-500/10">
          <GitBranch className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Condition
        </div>
      </div>

      <div className="font-medium text-sm">{data.label}</div>

      {data.config.condition && (
        <div className="text-xs text-muted-foreground mt-1">
          {data.config.condition.field} {data.config.condition.operator}{' '}
          {data.config.condition.value}
        </div>
      )}
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
