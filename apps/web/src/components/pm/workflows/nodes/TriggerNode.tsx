'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TriggerNodeData {
  label: string;
  config: {
    eventType: string;
    filters?: Record<string, any>;
  };
}

export const TriggerNode = memo(({ data, selected }: NodeProps<TriggerNodeData>) => {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-card shadow-sm min-w-[180px]',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-green-500/50'
      )}
    >
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-green-500/10">
          <Play className="w-4 h-4 text-green-600" />
        </div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Trigger
        </div>
      </div>

      <div className="font-medium text-sm">{data.label}</div>

      {data.config.eventType && (
        <div className="text-xs text-muted-foreground mt-1">
          {data.config.eventType.replace(/_/g, ' ').toLowerCase()}
        </div>
      )}
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
