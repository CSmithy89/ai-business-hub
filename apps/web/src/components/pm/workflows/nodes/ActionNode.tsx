'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionNodeData {
  label: string;
  config: {
    actionType?: string;
    config?: Record<string, any>;
  };
}

export const ActionNode = memo(({ data, selected }: NodeProps<ActionNodeData>) => {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-card shadow-sm min-w-[180px]',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-blue-500/50'
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-blue-500/10">
          <Zap className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Action
        </div>
      </div>

      <div className="font-medium text-sm">{data.label}</div>

      {data.config.actionType && (
        <div className="text-xs text-muted-foreground mt-1">
          {data.config.actionType.replace(/_/g, ' ').toLowerCase()}
        </div>
      )}
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
