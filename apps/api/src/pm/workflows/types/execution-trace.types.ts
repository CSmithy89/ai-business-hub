/**
 * Workflow Execution Trace Types
 *
 * Type definitions for workflow execution tracing and results.
 */

/**
 * Result of a single step execution
 */
export interface StepResult {
  nodeId: string;
  type: 'action' | 'condition' | 'trigger' | 'agent';
  status: 'passed' | 'failed' | 'skipped';
  result?: {
    simulated?: boolean;
    action?: string;
    matched?: boolean;
    evaluated?: boolean;
    condition?: string;
    error?: string;
    [key: string]: unknown;
  };
  error?: string;
  duration?: number;
}

/**
 * Complete workflow execution trace
 */
export interface WorkflowExecutionTrace {
  status: 'COMPLETED' | 'FAILED';
  stepsExecuted: number;
  stepsPassed: number;
  stepsFailed: number;
  steps: StepResult[];
  truncated?: boolean;
  originalSize?: number;
}

/**
 * Workflow node definition
 */
export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'agent';
  position: { x: number; y: number };
  data?: {
    label?: string;
    config?: {
      actionType?: string;
      config?: Record<string, unknown>;
    };
    continueOnError?: boolean;
  };
}

/**
 * Workflow edge definition
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

/**
 * Workflow definition structure
 */
export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers?: unknown[];
  variables?: Record<string, unknown>;
}
