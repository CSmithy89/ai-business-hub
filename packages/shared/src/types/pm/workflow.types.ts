/**
 * Workflow Types
 * PM-10.1: Workflow Canvas
 */

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: TriggerConfig[];
  variables: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'agent';
  position: { x: number; y: number };
  data: NodeData;
}

export interface NodeData {
  label: string;
  config: NodeConfig;
  continueOnError?: boolean;
}

export type NodeConfig =
  | TriggerNodeConfig
  | ConditionNodeConfig
  | ActionNodeConfig
  | AgentNodeConfig;

export interface TriggerNodeConfig {
  eventType: WorkflowTriggerType;
  filters?: {
    status?: string;
    phaseId?: string;
    assigneeId?: string;
    priority?: string;
  };
}

export interface ConditionNodeConfig {
  condition: {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'in';
    value: any;
  };
}

export interface ActionNodeConfig {
  actionType:
    | 'update_task'
    | 'assign_task'
    | 'send_notification'
    | 'create_task'
    | 'move_to_phase'
    | 'call_webhook';
  config: Record<string, any>;
}

export interface AgentNodeConfig {
  agentName: string;
  action: string;
  config: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface TriggerFilters {
  status?: string | string[];
  phaseId?: string;
  assigneeId?: string;
  priority?: string | string[];
  type?: string | string[];
}

export interface TriggerConfig {
  eventType?: WorkflowTriggerType;
  filters?: TriggerFilters;
  schedule?: string; // Cron expression for CUSTOM_SCHEDULE
  daysBeforeDue?: number; // For DUE_DATE_APPROACHING
}

// Enums matching Prisma schema
export enum WorkflowTriggerType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  DUE_DATE_APPROACHING = 'DUE_DATE_APPROACHING',
  TASK_COMPLETED = 'TASK_COMPLETED',
  CUSTOM_SCHEDULE = 'CUSTOM_SCHEDULE',
  MANUAL = 'MANUAL',
}

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

export enum WorkflowExecutionStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Execution context and trace types
export interface ExecutionContext {
  triggerType: WorkflowTriggerType;
  triggerData: Record<string, any>;
  triggeredBy?: string;
  isDryRun?: boolean;
  variables?: Record<string, any>;
}

export interface ExecutionTrace {
  steps: StepResult[];
}

export interface StepResult {
  nodeId: string;
  type: string;
  status: 'passed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  duration?: number;
}

// Workflow entities
export interface Workflow {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  triggerType: WorkflowTriggerType;
  triggerConfig: TriggerConfig;
  status: WorkflowStatus;
  enabled: boolean;
  executionCount: number;
  lastExecutedAt?: Date;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  triggerType: WorkflowTriggerType;
  triggeredBy?: string;
  triggerData: Record<string, any>;
  status: WorkflowExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  stepsExecuted: number;
  stepsPassed: number;
  stepsFailed: number;
  executionTrace?: ExecutionTrace;
  errorMessage?: string;
  isDryRun: boolean;
}
