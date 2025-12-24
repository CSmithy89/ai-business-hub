'use client';

import { Play, GitBranch, Bot, Clock, Bell, User, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NodePaletteProps {
  onAddNode: (nodeType: string, data: { label: string; config: any }) => void;
}

const nodeCategories = [
  {
    category: 'Triggers',
    nodes: [
      {
        type: 'trigger',
        subtype: 'task_created',
        label: 'Task Created',
        icon: Play,
        config: { eventType: 'TASK_CREATED' },
      },
      {
        type: 'trigger',
        subtype: 'task_status_changed',
        label: 'Status Changed',
        icon: FileEdit,
        config: { eventType: 'TASK_STATUS_CHANGED' },
      },
      {
        type: 'trigger',
        subtype: 'task_assigned',
        label: 'Task Assigned',
        icon: User,
        config: { eventType: 'TASK_ASSIGNED' },
      },
      {
        type: 'trigger',
        subtype: 'due_date_approaching',
        label: 'Due Date Approaching',
        icon: Clock,
        config: { eventType: 'DUE_DATE_APPROACHING' },
      },
      {
        type: 'trigger',
        subtype: 'custom_schedule',
        label: 'Schedule',
        icon: Clock,
        config: { eventType: 'CUSTOM_SCHEDULE' },
      },
    ],
  },
  {
    category: 'Conditions',
    nodes: [
      {
        type: 'condition',
        subtype: 'if_condition',
        label: 'If Condition',
        icon: GitBranch,
        config: { condition: { field: '', operator: 'eq', value: '' } },
      },
    ],
  },
  {
    category: 'Actions',
    nodes: [
      {
        type: 'action',
        subtype: 'update_task',
        label: 'Update Task',
        icon: FileEdit,
        config: { actionType: 'update_task', config: {} },
      },
      {
        type: 'action',
        subtype: 'assign_task',
        label: 'Assign Task',
        icon: User,
        config: { actionType: 'assign_task', config: {} },
      },
      {
        type: 'action',
        subtype: 'send_notification',
        label: 'Send Notification',
        icon: Bell,
        config: { actionType: 'send_notification', config: {} },
      },
      {
        type: 'action',
        subtype: 'create_task',
        label: 'Create Related Task',
        icon: Play,
        config: { actionType: 'create_task', config: {} },
      },
    ],
  },
  {
    category: 'Agents',
    nodes: [
      {
        type: 'agent',
        subtype: 'call_agent',
        label: 'Call Agent',
        icon: Bot,
        config: { agentName: '', action: '' },
      },
    ],
  },
];

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Node Palette</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Click to add nodes to the canvas
        </p>
      </div>

      {nodeCategories.map(({ category, nodes }) => (
        <div key={category} className="mb-6">
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
            {category}
          </h4>
          <div className="space-y-1">
            {nodes.map((node) => {
              const Icon = node.icon;
              return (
                <Button
                  key={node.subtype}
                  onClick={() => onAddNode(node.type, { label: node.label, config: node.config })}
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-3 hover:bg-accent"
                >
                  <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm text-left">{node.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
