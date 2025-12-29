/**
 * Unit Tests for useCopilotProjectContext Hook - Story DM-01.5
 *
 * Tests the project context hook that provides active project info to CopilotKit agents.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock CopilotKit
const mockUseCopilotReadable = vi.fn();

vi.mock('@copilotkit/react-core', () => ({
  useCopilotReadable: (options: { description: string; value: unknown }) => {
    mockUseCopilotReadable(options);
  },
}));

// Import the hook AFTER mocks are set up
import { useCopilotProjectContext } from '../use-copilot-project-context';
import type { ProjectDetailResponse } from '@/hooks/use-pm-projects';

// Helper to create mock project data
function createMockProject(
  overrides: Partial<ProjectDetailResponse['data']> = {}
): ProjectDetailResponse['data'] {
  return {
    id: 'proj_123',
    workspaceId: 'ws_123',
    businessId: 'biz_123',
    slug: 'test-project',
    name: 'Test Project',
    description: 'A test project',
    color: '#3B82F6',
    icon: 'folder',
    type: 'SOFTWARE', // Valid ProjectType value
    status: 'ACTIVE',
    totalTasks: 100,
    completedTasks: 50,
    startDate: '2024-01-01',
    targetDate: '2024-12-31',
    budget: null,
    actualSpend: null,
    autoApprovalThreshold: 85,
    suggestionMode: false,
    phases: [
      { id: 'phase_1', name: 'Planning', phaseNumber: 1, status: 'COMPLETED' },
      { id: 'phase_2', name: 'Development', phaseNumber: 2, status: 'CURRENT' },
      { id: 'phase_3', name: 'Testing', phaseNumber: 3, status: 'PENDING' },
    ],
    team: null,
    ...overrides,
  };
}

describe('useCopilotProjectContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('provides null context when no project', () => {
    renderHook(() => useCopilotProjectContext(null));

    expect(mockUseCopilotReadable).toHaveBeenCalledTimes(1);
    const call = mockUseCopilotReadable.mock.calls[0][0];

    expect(call.value).toBeNull();
    expect(call.description).toContain('No project is currently selected');
  });

  it('provides null context when project is undefined', () => {
    renderHook(() => useCopilotProjectContext(undefined));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value).toBeNull();
  });

  it('transforms project data correctly', () => {
    const project = createMockProject();
    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];

    expect(call.value).toEqual({
      id: 'proj_123',
      slug: 'test-project',
      name: 'Test Project',
      status: 'ACTIVE',
      type: 'SOFTWARE',
      progress: {
        totalTasks: 100,
        completedTasks: 50,
        percentage: 50,
      },
      currentPhase: {
        id: 'phase_2',
        name: 'Development',
        phaseNumber: 2,
      },
      targetDate: '2024-12-31',
    });
  });

  it('calculates progress percentage correctly', () => {
    const project = createMockProject({
      totalTasks: 200,
      completedTasks: 150,
    });

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.progress.percentage).toBe(75);
  });

  it('handles zero tasks (no division by zero)', () => {
    const project = createMockProject({
      totalTasks: 0,
      completedTasks: 0,
    });

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.progress.percentage).toBe(0);
  });

  it('rounds progress percentage', () => {
    const project = createMockProject({
      totalTasks: 3,
      completedTasks: 1,
    });

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    // 1/3 = 33.333... should round to 33
    expect(call.value.progress.percentage).toBe(33);
  });

  it('identifies current phase with CURRENT status', () => {
    const project = createMockProject();

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.currentPhase).toEqual({
      id: 'phase_2',
      name: 'Development',
      phaseNumber: 2,
    });
  });

  it('selects first non-completed phase when no CURRENT status', () => {
    const project = createMockProject({
      phases: [
        { id: 'phase_1', name: 'Planning', phaseNumber: 1, status: 'COMPLETED' },
        { id: 'phase_2', name: 'Development', phaseNumber: 2, status: 'PENDING' },
        { id: 'phase_3', name: 'Testing', phaseNumber: 3, status: 'PENDING' },
      ],
    });

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.currentPhase).toEqual({
      id: 'phase_2',
      name: 'Development',
      phaseNumber: 2,
    });
  });

  it('uses last phase when all phases completed', () => {
    const project = createMockProject({
      phases: [
        { id: 'phase_1', name: 'Planning', phaseNumber: 1, status: 'COMPLETED' },
        { id: 'phase_2', name: 'Development', phaseNumber: 2, status: 'COMPLETED' },
        { id: 'phase_3', name: 'Testing', phaseNumber: 3, status: 'COMPLETED' },
      ],
    });

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.currentPhase).toEqual({
      id: 'phase_3',
      name: 'Testing',
      phaseNumber: 3,
    });
  });

  it('handles project with no phases', () => {
    const project = createMockProject({
      phases: [],
    });

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.currentPhase).toBeNull();
  });

  it('handles project with undefined phases', () => {
    const project = createMockProject();
    // @ts-expect-error - testing undefined phases
    project.phases = undefined;

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.currentPhase).toBeNull();
  });

  it('includes project name in description', () => {
    const project = createMockProject({ name: 'My Amazing Project' });

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.description).toContain('My Amazing Project');
  });

  it('includes progress in description', () => {
    const project = createMockProject({
      totalTasks: 100,
      completedTasks: 75,
    });

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.description).toContain('75%');
    expect(call.description).toContain('75/100');
  });

  it('includes phase in description when available', () => {
    const project = createMockProject();

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.description).toContain('Development');
    expect(call.description).toContain('phase 2');
  });

  it('handles null targetDate', () => {
    const project = createMockProject({
      targetDate: null,
    });

    renderHook(() => useCopilotProjectContext(project));

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.targetDate).toBeNull();
    // Should not throw error
    expect(call.description).not.toContain('Target completion');
  });
});
