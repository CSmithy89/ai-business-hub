'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentNodeData {
  label: string;
  config: {
    agentName?: string;
    action?: string;
  };
}

export const AgentNode = memo(({ data, selected }: NodeProps<AgentNodeData>) => {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-card shadow-sm min-w-[180px]',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-purple-500/50'
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-purple-500/10">
          <Bot className="w-4 h-4 text-purple-600" />
        </div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Agent
        </div>
      </div>

      <div className="font-medium text-sm">{data.label}</div>

      {data.config.agentName && (
        <div className="text-xs text-muted-foreground mt-1">
          {data.config.agentName}
          {data.config.action && ` - ${data.config.action}`}
        </div>
      )}
    </div>
  );
});

AgentNode.displayName = 'AgentNode';
