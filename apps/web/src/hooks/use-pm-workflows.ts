'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getActiveWorkspaceId, getSessionToken, useSession } from '@/lib/auth-client';
import { NESTJS_API_URL } from '@/lib/api-config';
import { safeJson } from '@/lib/utils/safe-json';
import type {
  Workflow,
  WorkflowDefinition,
  WorkflowTriggerType,
  WorkflowStatus,
} from '@hyvve/shared';
import { toast } from 'sonner';

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured');
  return NESTJS_API_URL.replace(/\/$/, '');
}

export interface CreateWorkflowInput {
  projectId: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  triggerType: WorkflowTriggerType;
  triggerConfig: Record<string, any>;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  definition?: WorkflowDefinition;
  triggerType?: WorkflowTriggerType;
  triggerConfig?: Record<string, any>;
}

export interface ListWorkflowsQuery {
  projectId?: string;
  status?: WorkflowStatus;
  enabled?: boolean;
}

export interface TestWorkflowInput {
  taskId: string;
  overrides?: Record<string, any>;
}

export interface ExecutionStep {
  nodeId: string;
  type: 'trigger' | 'condition' | 'action';
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

export interface TestWorkflowResponse {
  executionId: string;
  workflowId: string;
  trace: {
    steps: ExecutionStep[];
  };
  summary: {
    stepsExecuted: number;
    stepsPassed: number;
    stepsFailed: number;
    duration: number;
  };
}

async function fetchWorkflows(params: {
  workspaceId: string;
  token?: string;
  filters?: ListWorkflowsQuery;
}): Promise<Workflow[]> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);

  const filters = params.filters ?? {};
  if (filters.projectId) query.set('projectId', filters.projectId);
  if (filters.status) query.set('status', filters.status);
  if (filters.enabled !== undefined) query.set('enabled', String(filters.enabled));

  const response = await fetch(`${base}/pm/workflows?${query.toString()}`, {
    credentials: 'include',
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    cache: 'no-store',
  });

  const body = await safeJson<unknown>(response);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to fetch workflows');
  }

  return body as Workflow[];
}

async function fetchWorkflow(params: {
  workspaceId: string;
  workflowId: string;
  token?: string;
}): Promise<Workflow> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);

  const response = await fetch(`${base}/pm/workflows/${params.workflowId}?${query.toString()}`, {
    credentials: 'include',
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    cache: 'no-store',
  });

  const body = await safeJson<unknown>(response);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to fetch workflow');
  }

  return body as Workflow;
}

async function createWorkflow(params: {
  workspaceId: string;
  token?: string;
  input: CreateWorkflowInput;
}): Promise<Workflow> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);

  const response = await fetch(`${base}/pm/workflows?${query.toString()}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify(params.input),
  });

  const body = await safeJson<unknown>(response);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to create workflow');
  }

  return body as Workflow;
}

async function updateWorkflow(params: {
  workspaceId: string;
  token?: string;
  workflowId: string;
  input: UpdateWorkflowInput;
}): Promise<Workflow> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);

  const response = await fetch(`${base}/pm/workflows/${params.workflowId}?${query.toString()}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify(params.input),
  });

  const body = await safeJson<unknown>(response);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to update workflow');
  }

  return body as Workflow;
}

async function deleteWorkflow(params: {
  workspaceId: string;
  token?: string;
  workflowId: string;
}): Promise<void> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);

  const response = await fetch(`${base}/pm/workflows/${params.workflowId}?${query.toString()}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
  });

  if (!response.ok) {
    const body = await safeJson<unknown>(response);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to delete workflow');
  }
}

async function activateWorkflow(params: {
  workspaceId: string;
  token?: string;
  workflowId: string;
}): Promise<Workflow> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);

  const response = await fetch(
    `${base}/pm/workflows/${params.workflowId}/activate?${query.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    }
  );

  const body = await safeJson<unknown>(response);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to activate workflow');
  }

  return body as Workflow;
}

async function pauseWorkflow(params: {
  workspaceId: string;
  token?: string;
  workflowId: string;
}): Promise<Workflow> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);

  const response = await fetch(
    `${base}/pm/workflows/${params.workflowId}/pause?${query.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    }
  );

  const body = await safeJson<unknown>(response);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to pause workflow');
  }

  return body as Workflow;
}

async function testWorkflow(params: {
  workspaceId: string;
  token?: string;
  workflowId: string;
  input: TestWorkflowInput;
}): Promise<TestWorkflowResponse> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);

  const response = await fetch(
    `${base}/pm/workflows/${params.workflowId}/test?${query.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
      },
      body: JSON.stringify(params.input),
    }
  );

  const body = await safeJson<unknown>(response);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to test workflow');
  }

  return body as TestWorkflowResponse;
}

// Query hooks
export function useWorkflows(filters?: ListWorkflowsQuery) {
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useQuery({
    queryKey: ['workflows', workspaceId, filters],
    queryFn: () => fetchWorkflows({ workspaceId: workspaceId!, token, filters }),
    enabled: !!workspaceId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useWorkflow(workflowId: string | null) {
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useQuery({
    queryKey: ['workflow', workspaceId, workflowId],
    queryFn: () => fetchWorkflow({ workspaceId: workspaceId!, workflowId: workflowId!, token }),
    enabled: !!workspaceId && !!workflowId,
    staleTime: 30000,
  });
}

// Mutation hooks
export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useMutation({
    mutationFn: (input: CreateWorkflowInput) => {
      if (!workspaceId) throw new Error('No workspace selected');
      return createWorkflow({ workspaceId, token, input });
    },
    onSuccess: () => {
      toast.success('Workflow created');
      queryClient.invalidateQueries({ queryKey: ['workflows', workspaceId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create workflow';
      toast.error(message);
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useMutation({
    mutationFn: ({ workflowId, input }: { workflowId: string; input: UpdateWorkflowInput }) => {
      if (!workspaceId) throw new Error('No workspace selected');
      return updateWorkflow({ workspaceId, token, workflowId, input });
    },
    onSuccess: (_, { workflowId }) => {
      toast.success('Workflow updated');
      queryClient.invalidateQueries({ queryKey: ['workflow', workspaceId, workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows', workspaceId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update workflow';
      toast.error(message);
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useMutation({
    mutationFn: (workflowId: string) => {
      if (!workspaceId) throw new Error('No workspace selected');
      return deleteWorkflow({ workspaceId, token, workflowId });
    },
    onSuccess: () => {
      toast.success('Workflow deleted');
      queryClient.invalidateQueries({ queryKey: ['workflows', workspaceId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to delete workflow';
      toast.error(message);
    },
  });
}

export function useActivateWorkflow() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useMutation({
    mutationFn: (workflowId: string) => {
      if (!workspaceId) throw new Error('No workspace selected');
      return activateWorkflow({ workspaceId, token, workflowId });
    },
    onSuccess: (_, workflowId) => {
      toast.success('Workflow activated');
      queryClient.invalidateQueries({ queryKey: ['workflow', workspaceId, workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows', workspaceId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to activate workflow';
      toast.error(message);
    },
  });
}

export function usePauseWorkflow() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useMutation({
    mutationFn: (workflowId: string) => {
      if (!workspaceId) throw new Error('No workspace selected');
      return pauseWorkflow({ workspaceId, token, workflowId });
    },
    onSuccess: (_, workflowId) => {
      toast.success('Workflow paused');
      queryClient.invalidateQueries({ queryKey: ['workflow', workspaceId, workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows', workspaceId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to pause workflow';
      toast.error(message);
    },
  });
}

export function useTestWorkflow() {
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useMutation({
    mutationFn: ({ workflowId, input }: { workflowId: string; input: TestWorkflowInput }) => {
      if (!workspaceId) throw new Error('No workspace selected');
      return testWorkflow({ workspaceId, token, workflowId, input });
    },
    onSuccess: () => {
      toast.success('Workflow test completed');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to test workflow';
      toast.error(message);
    },
  });
}

// PM-10-5: Workflow Templates & Management

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'assignment' | 'notification' | 'lifecycle' | 'escalation';
  icon: string;
  definition: WorkflowDefinition;
}

export interface CreateFromTemplateInput {
  templateId: string;
  name: string;
  projectId: string;
  description?: string;
}

export interface WorkflowExecutionListItem {
  id: string;
  workflowId: string;
  triggerType: WorkflowTriggerType;
  triggeredBy?: string;
  triggerData: Record<string, any>;
  status: string;
  startedAt: Date;
  completedAt?: Date | null;
  stepsExecuted: number;
  stepsPassed: number;
  stepsFailed: number;
  executionTrace?: any;
  errorMessage?: string | null;
  isDryRun: boolean;
}

export interface WorkflowExecutionsResponse {
  items: WorkflowExecutionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchWorkflowTemplates(params: {
  workspaceId: string;
  token?: string;
}): Promise<WorkflowTemplate[]> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);

  const response = await fetch(`${base}/pm/workflows/templates?${query.toString()}`, {
    credentials: 'include',
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    cache: 'no-store',
  });

  const body = await safeJson<unknown>(response);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to fetch workflow templates');
  }

  return body as WorkflowTemplate[];
}

async function createFromTemplate(params: {
  workspaceId: string;
  token?: string;
  input: CreateFromTemplateInput;
}): Promise<Workflow> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);

  const response = await fetch(`${base}/pm/workflows/from-template?${query.toString()}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify(params.input),
  });

  const body = await safeJson<unknown>(response);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to create workflow from template');
  }

  return body as Workflow;
}

async function fetchWorkflowExecutions(params: {
  workspaceId: string;
  token?: string;
  workflowId: string;
  query?: {
    status?: string;
    page?: number;
    limit?: number;
  };
}): Promise<WorkflowExecutionsResponse> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);
  if (params.query?.status) query.set('status', params.query.status);
  if (params.query?.page) query.set('page', params.query.page.toString());
  if (params.query?.limit) query.set('limit', params.query.limit.toString());

  const response = await fetch(
    `${base}/pm/workflows/${params.workflowId}/executions?${query.toString()}`,
    {
      credentials: 'include',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
      cache: 'no-store',
    }
  );

  const body = await safeJson<unknown>(response);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to fetch workflow executions');
  }

  return body as WorkflowExecutionsResponse;
}

async function retryExecution(params: {
  workspaceId: string;
  token?: string;
  executionId: string;
}): Promise<any> {
  const base = getBaseUrl();

  const query = new URLSearchParams();
  query.set('workspaceId', params.workspaceId);

  const response = await fetch(
    `${base}/pm/workflow-executions/${params.executionId}/retry?${query.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    }
  );

  const body = await safeJson<unknown>(response);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : undefined;
    throw new Error(message || 'Failed to retry execution');
  }

  return body;
}

export function useWorkflowTemplates() {
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useQuery({
    queryKey: ['workflow-templates', workspaceId],
    queryFn: () => fetchWorkflowTemplates({ workspaceId: workspaceId!, token }),
    enabled: !!workspaceId,
    staleTime: 60000, // Templates don't change often
  });
}

export function useCreateFromTemplate() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useMutation({
    mutationFn: (input: CreateFromTemplateInput) => {
      if (!workspaceId) throw new Error('No workspace selected');
      return createFromTemplate({ workspaceId, token, input });
    },
    onSuccess: () => {
      toast.success('Workflow created from template');
      queryClient.invalidateQueries({ queryKey: ['workflows', workspaceId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create workflow';
      toast.error(message);
    },
  });
}

export function useWorkflowExecutions(
  workflowId: string,
  query?: {
    status?: string;
    page?: number;
    limit?: number;
  }
) {
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useQuery({
    queryKey: ['workflow-executions', workspaceId, workflowId, query],
    queryFn: () =>
      fetchWorkflowExecutions({ workspaceId: workspaceId!, token, workflowId, query }),
    enabled: !!workspaceId && !!workflowId,
    staleTime: 10000,
    refetchInterval: 30000, // Auto-refresh every 30s for running executions
  });
}

export function useRetryExecution() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const workspaceId = getActiveWorkspaceId(session);
  const token = getSessionToken(session);

  return useMutation({
    mutationFn: (executionId: string) => {
      if (!workspaceId) throw new Error('No workspace selected');
      return retryExecution({ workspaceId, token, executionId });
    },
    onSuccess: () => {
      toast.success('Execution retried');
      queryClient.invalidateQueries({ queryKey: ['workflow-executions', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workflows', workspaceId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to retry execution';
      toast.error(message);
    },
  });
}
