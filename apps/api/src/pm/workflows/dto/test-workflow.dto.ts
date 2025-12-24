import { IsString, IsOptional, IsObject } from 'class-validator';

export class TestWorkflowDto {
  @IsString()
  taskId!: string;

  @IsOptional()
  @IsObject()
  overrides?: Record<string, any>;
}

export interface ExecutionStepDto {
  nodeId: string;
  type: 'trigger' | 'condition' | 'action' | 'agent';
  status: 'passed' | 'failed' | 'skipped';
  result?: {
    simulated?: boolean;
    action?: string;
    matched?: boolean;
    evaluated?: boolean;
    condition?: string;
    error?: string;
    [key: string]: any;
  };
  duration?: number;
  error?: string;
}

export interface TestWorkflowResponseDto {
  executionId: string;
  workflowId: string;
  trace: {
    steps: ExecutionStepDto[];
  };
  summary: {
    stepsExecuted: number;
    stepsPassed: number;
    stepsFailed: number;
    duration: number;
  };
}
