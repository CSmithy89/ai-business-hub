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
