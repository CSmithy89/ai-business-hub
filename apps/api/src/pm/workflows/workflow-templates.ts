/**
 * Workflow Templates
 * PM-10-5: Workflow Templates & Management
 *
 * Pre-built workflow templates for common automation patterns.
 * Templates are static (defined in code, not database).
 */

import { WorkflowDefinition, WorkflowTriggerType } from '@hyvve/shared';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'assignment' | 'notification' | 'lifecycle' | 'escalation';
  icon: string;
  definition: WorkflowDefinition;
}

/**
 * Pre-built workflow templates
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'task-assignment-on-status',
    name: 'Task Assignment on Status Change',
    description: 'Automatically assign tasks to team members when they reach a specific status',
    category: 'assignment',
    icon: 'user-plus',
    definition: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'When task status changes',
            config: {
              eventType: 'TASK_STATUS_CHANGED' as WorkflowTriggerType,
              filters: {
                status: 'IN_PROGRESS',
              },
            },
          },
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 350, y: 100 },
          data: {
            label: 'Assign to team member',
            config: {
              actionType: 'assign_task',
              config: {
                assigneeId: '{{context.assigneeId}}',
              },
            },
            continueOnError: false,
          },
        },
        {
          id: 'action-2',
          type: 'action',
          position: { x: 600, y: 100 },
          data: {
            label: 'Send notification',
            config: {
              actionType: 'send_notification',
              config: {
                userId: '{{context.assigneeId}}',
                message: 'You have been assigned to task: {{context.taskTitle}}',
              },
            },
            continueOnError: true,
          },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'action-1' },
        { id: 'e2-3', source: 'action-1', target: 'action-2' },
      ],
      triggers: [
        {
          eventType: 'TASK_STATUS_CHANGED' as WorkflowTriggerType,
          filters: {
            status: 'IN_PROGRESS',
          },
        },
      ],
      variables: {},
    },
  },
  {
    id: 'due-date-reminder',
    name: 'Due Date Reminder Notification',
    description: 'Send reminder notifications to assignees a few days before tasks are due',
    category: 'notification',
    icon: 'bell',
    definition: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Due date approaching',
            config: {
              eventType: 'DUE_DATE_APPROACHING' as WorkflowTriggerType,
              filters: {},
            },
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 350, y: 100 },
          data: {
            label: 'Task is assigned',
            config: {
              condition: {
                field: 'assigneeId',
                operator: 'ne',
                value: null,
              },
            },
          },
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 600, y: 100 },
          data: {
            label: 'Send reminder',
            config: {
              actionType: 'send_notification',
              config: {
                userId: '{{context.assigneeId}}',
                message: 'Reminder: Task "{{context.taskTitle}}" is due in {{context.daysUntilDue}} days',
              },
            },
            continueOnError: false,
          },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'condition-1' },
        { id: 'e2-3', source: 'condition-1', target: 'action-1' },
      ],
      triggers: [
        {
          eventType: 'DUE_DATE_APPROACHING' as WorkflowTriggerType,
          daysBeforeDue: 3,
        },
      ],
      variables: {},
    },
  },
  {
    id: 'auto-close-stale',
    name: 'Auto-close Stale Tasks',
    description: 'Automatically close tasks that have been inactive for a specified number of days',
    category: 'lifecycle',
    icon: 'archive',
    definition: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Daily check',
            config: {
              eventType: 'CUSTOM_SCHEDULE' as WorkflowTriggerType,
              filters: {},
            },
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 350, y: 100 },
          data: {
            label: 'Inactive for 30 days',
            config: {
              condition: {
                field: 'daysSinceUpdate',
                operator: 'gt',
                value: 30,
              },
            },
          },
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 600, y: 100 },
          data: {
            label: 'Update status to closed',
            config: {
              actionType: 'update_task',
              config: {
                status: 'CLOSED',
              },
            },
            continueOnError: false,
          },
        },
        {
          id: 'action-2',
          type: 'action',
          position: { x: 850, y: 100 },
          data: {
            label: 'Notify assignee',
            config: {
              actionType: 'send_notification',
              config: {
                userId: '{{context.assigneeId}}',
                message: 'Task "{{context.taskTitle}}" was automatically closed due to inactivity',
              },
            },
            continueOnError: true,
          },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'condition-1' },
        { id: 'e2-3', source: 'condition-1', target: 'action-1' },
        { id: 'e3-4', source: 'action-1', target: 'action-2' },
      ],
      triggers: [
        {
          eventType: 'CUSTOM_SCHEDULE' as WorkflowTriggerType,
          schedule: '0 2 * * *', // Daily at 2 AM
        },
      ],
      variables: {},
    },
  },
  {
    id: 'escalation-on-overdue',
    name: 'Escalation on Overdue',
    description: 'Notify managers when tasks become overdue and reassign if necessary',
    category: 'escalation',
    icon: 'alert-triangle',
    definition: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Task becomes overdue',
            config: {
              eventType: 'CUSTOM_SCHEDULE' as WorkflowTriggerType,
              filters: {},
            },
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 350, y: 100 },
          data: {
            label: 'Is overdue',
            config: {
              condition: {
                field: 'isOverdue',
                operator: 'eq',
                value: true,
              },
            },
          },
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 600, y: 50 },
          data: {
            label: 'Notify assignee',
            config: {
              actionType: 'send_notification',
              config: {
                userId: '{{context.assigneeId}}',
                message: 'URGENT: Task "{{context.taskTitle}}" is overdue!',
              },
            },
            continueOnError: true,
          },
        },
        {
          id: 'action-2',
          type: 'action',
          position: { x: 600, y: 150 },
          data: {
            label: 'Notify manager',
            config: {
              actionType: 'send_notification',
              config: {
                userId: '{{context.managerId}}',
                message: 'Task "{{context.taskTitle}}" assigned to {{context.assigneeName}} is overdue',
              },
            },
            continueOnError: true,
          },
        },
        {
          id: 'action-3',
          type: 'action',
          position: { x: 850, y: 100 },
          data: {
            label: 'Update priority to high',
            config: {
              actionType: 'update_task',
              config: {
                priority: 'HIGH',
              },
            },
            continueOnError: false,
          },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'condition-1' },
        { id: 'e2-3', source: 'condition-1', target: 'action-1' },
        { id: 'e2-4', source: 'condition-1', target: 'action-2' },
        { id: 'e3-5', source: 'action-1', target: 'action-3' },
        { id: 'e4-5', source: 'action-2', target: 'action-3' },
      ],
      triggers: [
        {
          eventType: 'CUSTOM_SCHEDULE' as WorkflowTriggerType,
          schedule: '0 */6 * * *', // Every 6 hours
        },
      ],
      variables: {},
    },
  },
  {
    id: 'phase-transition',
    name: 'Phase Transition Automation',
    description: 'Automatically move tasks to the next phase when all prerequisites are completed',
    category: 'lifecycle',
    icon: 'arrow-right',
    definition: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Task completed',
            config: {
              eventType: 'TASK_COMPLETED' as WorkflowTriggerType,
              filters: {},
            },
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 350, y: 100 },
          data: {
            label: 'All phase tasks done',
            config: {
              condition: {
                field: 'allPhaseTasksCompleted',
                operator: 'eq',
                value: true,
              },
            },
          },
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 600, y: 100 },
          data: {
            label: 'Move to next phase',
            config: {
              actionType: 'move_to_phase',
              config: {
                phaseId: '{{context.nextPhaseId}}',
              },
            },
            continueOnError: false,
          },
        },
        {
          id: 'action-2',
          type: 'action',
          position: { x: 850, y: 100 },
          data: {
            label: 'Create next phase tasks',
            config: {
              actionType: 'create_task',
              config: {
                title: 'Start {{context.nextPhaseName}} phase',
                phaseId: '{{context.nextPhaseId}}',
              },
            },
            continueOnError: true,
          },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'condition-1' },
        { id: 'e2-3', source: 'condition-1', target: 'action-1' },
        { id: 'e3-4', source: 'action-1', target: 'action-2' },
      ],
      triggers: [
        {
          eventType: 'TASK_COMPLETED' as WorkflowTriggerType,
        },
      ],
      variables: {},
    },
  },
];

/**
 * Get all workflow templates
 */
export function getWorkflowTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES;
}

/**
 * Get a specific workflow template by ID
 */
export function getWorkflowTemplateById(templateId: string): WorkflowTemplate | null {
  return WORKFLOW_TEMPLATES.find((t) => t.id === templateId) || null;
}

/**
 * Get workflow templates by category
 */
export function getWorkflowTemplatesByCategory(
  category: 'assignment' | 'notification' | 'lifecycle' | 'escalation',
): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category);
}
