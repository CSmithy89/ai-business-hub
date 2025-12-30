/**
 * Unit tests for Copilot Context Providers
 *
 * Tests for context hooks, utilities, and provider components.
 * Mocks CopilotKit's useCopilotReadable to verify correct behavior.
 *
 * Epic: DM-06 | Story: DM-06.1
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  filterSensitiveContext,
  useProjectContext,
  useSelectionContext,
  useActivityContext,
  useDocumentContext,
  useWorkspaceContext,
  useViewContext,
  useSafeContext,
  type ProjectContext,
  type SelectionContext,
  type ActivityContext,
  type DocumentContext,
  type WorkspaceContext,
  type ViewContext,
} from '../copilot-context';

import {
  ProjectContextProvider,
  SelectionContextProvider,
  ActivityContextProvider,
  DocumentContextProvider,
  CompositeContextProvider,
} from '@/components/context';

// Mock CopilotKit
const mockUseCopilotReadable = vi.fn();
vi.mock('@copilotkit/react-core', () => ({
  useCopilotReadable: (args: { description: string; value: unknown }) =>
    mockUseCopilotReadable(args),
}));

describe('Context Type Interfaces', () => {
  it('ProjectContext has required fields', () => {
    const project: ProjectContext = {
      id: 'proj-1',
      name: 'Test Project',
      status: 'active',
      progress: 50,
      tasksTotal: 10,
      tasksCompleted: 5,
    };
    expect(project.id).toBeDefined();
    expect(project.name).toBeDefined();
    expect(project.status).toBe('active');
  });

  it('SelectionContext has required fields', () => {
    const selection: SelectionContext = {
      type: 'task',
      ids: ['task-1', 'task-2'],
      count: 2,
      summary: '2 tasks selected',
    };
    expect(selection.type).toBe('task');
    expect(selection.ids).toHaveLength(2);
    expect(selection.count).toBe(2);
  });

  it('ActivityContext has required fields', () => {
    const activity: ActivityContext = {
      recentActions: [
        { action: 'created', target: 'task-1', timestamp: Date.now() },
      ],
      currentPage: '/dashboard',
      sessionDuration: 300000,
    };
    expect(activity.recentActions).toHaveLength(1);
    expect(activity.currentPage).toBe('/dashboard');
    expect(activity.sessionDuration).toBe(300000);
  });

  it('DocumentContext has required fields', () => {
    const document: DocumentContext = {
      id: 'doc-1',
      title: 'Architecture Overview',
      type: 'markdown',
      wordCount: 1500,
      lastEdited: Date.now(),
    };
    expect(document.id).toBeDefined();
    expect(document.type).toBe('markdown');
  });

  it('WorkspaceContext has required fields', () => {
    const workspace: WorkspaceContext = {
      id: 'ws-1',
      name: 'My Workspace',
      plan: 'pro',
      memberCount: 5,
      modulesEnabled: ['pm', 'kb'],
    };
    expect(workspace.id).toBeDefined();
    expect(workspace.modulesEnabled).toContain('pm');
  });

  it('ViewContext has required fields', () => {
    const view: ViewContext = {
      type: 'board',
      filters: { status: 'open' },
      sortBy: 'priority',
      visibleCount: 10,
      totalCount: 50,
    };
    expect(view.type).toBe('board');
    expect(view.filters).toHaveProperty('status');
  });
});

describe('filterSensitiveContext', () => {
  it('filters known sensitive fields', () => {
    const result = filterSensitiveContext({
      name: 'Test',
      password: 'secret123',
      apiKey: 'sk-xxx',
    });

    expect(result.name).toBe('Test');
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('apiKey');
  });

  it('filters nested objects recursively', () => {
    const result = filterSensitiveContext({
      name: 'Test',
      config: {
        secretToken: 'abc',
        timeout: 5000,
      },
    });

    expect(result.name).toBe('Test');
    expect((result.config as Record<string, unknown>).timeout).toBe(5000);
    expect(result.config).not.toHaveProperty('secretToken');
  });

  it('handles case-insensitive matching', () => {
    const result = filterSensitiveContext({
      name: 'Test',
      API_KEY: 'xxx',
      Password: 'yyy',
      SecretValue: 'zzz',
    });

    expect(result.name).toBe('Test');
    expect(result).not.toHaveProperty('API_KEY');
    expect(result).not.toHaveProperty('Password');
    expect(result).not.toHaveProperty('SecretValue');
  });

  it('filters arrays containing objects with sensitive fields', () => {
    const result = filterSensitiveContext({
      users: [
        { name: 'Alice', password: 'pass1' },
        { name: 'Bob', apiKey: 'key2' },
      ],
    });

    const users = result.users as Array<Record<string, unknown>>;
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Alice');
    expect(users[0]).not.toHaveProperty('password');
    expect(users[1].name).toBe('Bob');
    expect(users[1]).not.toHaveProperty('apiKey');
  });

  it('preserves arrays of primitives', () => {
    const result = filterSensitiveContext({
      tags: ['alpha', 'beta', 'gamma'],
      numbers: [1, 2, 3],
    });

    expect(result.tags).toEqual(['alpha', 'beta', 'gamma']);
    expect(result.numbers).toEqual([1, 2, 3]);
  });

  it('filters ssn and creditCard fields', () => {
    const result = filterSensitiveContext({
      name: 'Test User',
      ssn: '123-45-6789',
      creditCard: '4111111111111111',
      balance: 100,
    });

    expect(result.name).toBe('Test User');
    expect(result.balance).toBe(100);
    expect(result).not.toHaveProperty('ssn');
    expect(result).not.toHaveProperty('creditCard');
  });

  it('accepts custom sensitive fields list', () => {
    const result = filterSensitiveContext(
      {
        name: 'Test',
        password: 'visible', // Not in custom list
        customSecret: 'hidden',
      },
      ['customSecret']
    );

    expect(result.name).toBe('Test');
    expect(result.password).toBe('visible');
    expect(result).not.toHaveProperty('customSecret');
  });

  it('handles empty objects', () => {
    const result = filterSensitiveContext({});
    expect(result).toEqual({});
  });

  it('handles deeply nested objects', () => {
    const result = filterSensitiveContext({
      level1: {
        level2: {
          level3: {
            visible: 'yes',
            secretToken: 'hidden',
          },
        },
      },
    });

    const nested = (
      result.level1 as Record<
        string,
        Record<string, Record<string, unknown>>
      >
    ).level2.level3;
    expect(nested.visible).toBe('yes');
    expect(nested).not.toHaveProperty('secretToken');
  });
});

describe('useProjectContext', () => {
  beforeEach(() => {
    mockUseCopilotReadable.mockClear();
  });

  it('calls useCopilotReadable with correct description', () => {
    renderHook(() =>
      useProjectContext({
        id: 'proj-1',
        name: 'Test',
        status: 'active',
        progress: 50,
        tasksTotal: 10,
        tasksCompleted: 5,
      })
    );

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'The currently active project the user is viewing',
      value: expect.objectContaining({ id: 'proj-1' }),
    });
  });

  it('filters team to teamSize for privacy', () => {
    renderHook(() =>
      useProjectContext({
        id: 'proj-1',
        name: 'Test',
        status: 'active',
        progress: 50,
        tasksTotal: 10,
        tasksCompleted: 5,
        team: [
          { id: '1', name: 'Alice', role: 'dev' },
          { id: '2', name: 'Bob', role: 'designer' },
        ],
      })
    );

    const calledValue = mockUseCopilotReadable.mock.calls[0][0].value;
    expect(calledValue.teamSize).toBe(2);
    expect(calledValue).not.toHaveProperty('team');
  });

  it('handles null project gracefully', () => {
    renderHook(() => useProjectContext(null));

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'The currently active project the user is viewing',
      value: null,
    });
  });

  it('includes all expected project fields', () => {
    renderHook(() =>
      useProjectContext({
        id: 'proj-1',
        name: 'Test Project',
        status: 'completed',
        currentPhase: 'Phase 2',
        healthScore: 85,
        progress: 75,
        tasksTotal: 20,
        tasksCompleted: 15,
      })
    );

    const calledValue = mockUseCopilotReadable.mock.calls[0][0].value;
    expect(calledValue).toEqual({
      id: 'proj-1',
      name: 'Test Project',
      status: 'completed',
      currentPhase: 'Phase 2',
      healthScore: 85,
      progress: 75,
      tasksTotal: 20,
      tasksCompleted: 15,
      teamSize: 0,
    });
  });
});

describe('useSelectionContext', () => {
  beforeEach(() => {
    mockUseCopilotReadable.mockClear();
  });

  it('calls useCopilotReadable with selection data', () => {
    renderHook(() =>
      useSelectionContext({
        type: 'task',
        ids: ['task-1'],
        count: 1,
        summary: '1 task selected',
      })
    );

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'Currently selected items in the interface',
      value: {
        type: 'task',
        ids: ['task-1'],
        count: 1,
        summary: '1 task selected',
      },
    });
  });

  it('handles null selection', () => {
    renderHook(() => useSelectionContext(null));

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'Currently selected items in the interface',
      value: null,
    });
  });

  it('supports different selection types', () => {
    renderHook(() =>
      useSelectionContext({
        type: 'document',
        ids: ['doc-1', 'doc-2'],
        count: 2,
      })
    );

    const calledValue = mockUseCopilotReadable.mock.calls[0][0].value;
    expect(calledValue.type).toBe('document');
  });
});

describe('useActivityContext', () => {
  beforeEach(() => {
    mockUseCopilotReadable.mockClear();
  });

  it('limits recent actions to 10', () => {
    const manyActions = Array.from({ length: 20 }, (_, i) => ({
      action: `action-${i}`,
      target: `target-${i}`,
      timestamp: Date.now(),
    }));

    renderHook(() =>
      useActivityContext({
        recentActions: manyActions,
        currentPage: '/dashboard',
        sessionDuration: 300000,
      })
    );

    const calledValue = mockUseCopilotReadable.mock.calls[0][0].value;
    expect(calledValue.recentActions).toHaveLength(10);
  });

  it('converts sessionDuration to minutes', () => {
    renderHook(() =>
      useActivityContext({
        recentActions: [],
        currentPage: '/dashboard',
        sessionDuration: 300000, // 5 minutes in ms
      })
    );

    const calledValue = mockUseCopilotReadable.mock.calls[0][0].value;
    expect(calledValue.sessionMinutes).toBe(5);
  });

  it('handles null activity', () => {
    renderHook(() => useActivityContext(null));

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'Recent user activity and navigation context',
      value: null,
    });
  });

  it('includes current page', () => {
    renderHook(() =>
      useActivityContext({
        recentActions: [],
        currentPage: '/projects/proj-1',
        sessionDuration: 60000,
      })
    );

    const calledValue = mockUseCopilotReadable.mock.calls[0][0].value;
    expect(calledValue.currentPage).toBe('/projects/proj-1');
  });
});

describe('useDocumentContext', () => {
  beforeEach(() => {
    mockUseCopilotReadable.mockClear();
  });

  it('truncates selection preview to 100 chars', () => {
    const longText = 'A'.repeat(200);

    renderHook(() =>
      useDocumentContext({
        id: 'doc-1',
        title: 'Test Doc',
        type: 'markdown',
        wordCount: 1000,
        lastEdited: Date.now(),
        selectedText: longText,
      })
    );

    const calledValue = mockUseCopilotReadable.mock.calls[0][0].value;
    expect(calledValue.selectionPreview).toHaveLength(100);
    expect(calledValue.hasSelection).toBe(true);
  });

  it('handles null document', () => {
    renderHook(() => useDocumentContext(null));

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'The document currently being edited',
      value: null,
    });
  });

  it('includes cursor line position', () => {
    renderHook(() =>
      useDocumentContext({
        id: 'doc-1',
        title: 'Test Doc',
        type: 'code',
        wordCount: 500,
        lastEdited: Date.now(),
        cursorPosition: { line: 42, column: 10 },
      })
    );

    const calledValue = mockUseCopilotReadable.mock.calls[0][0].value;
    expect(calledValue.cursorLine).toBe(42);
  });

  it('sets hasSelection to false when no selection', () => {
    renderHook(() =>
      useDocumentContext({
        id: 'doc-1',
        title: 'Test Doc',
        type: 'markdown',
        wordCount: 100,
        lastEdited: Date.now(),
      })
    );

    const calledValue = mockUseCopilotReadable.mock.calls[0][0].value;
    expect(calledValue.hasSelection).toBe(false);
    expect(calledValue.selectionPreview).toBeUndefined();
  });
});

describe('useWorkspaceContext', () => {
  beforeEach(() => {
    mockUseCopilotReadable.mockClear();
  });

  it('exposes workspace data directly', () => {
    renderHook(() =>
      useWorkspaceContext({
        id: 'ws-1',
        name: 'My Workspace',
        plan: 'enterprise',
        memberCount: 50,
        modulesEnabled: ['pm', 'kb', 'crm'],
      })
    );

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'The current workspace context',
      value: {
        id: 'ws-1',
        name: 'My Workspace',
        plan: 'enterprise',
        memberCount: 50,
        modulesEnabled: ['pm', 'kb', 'crm'],
      },
    });
  });

  it('handles null workspace', () => {
    renderHook(() => useWorkspaceContext(null));

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'The current workspace context',
      value: null,
    });
  });
});

describe('useViewContext', () => {
  beforeEach(() => {
    mockUseCopilotReadable.mockClear();
  });

  it('exposes view configuration', () => {
    renderHook(() =>
      useViewContext({
        type: 'board',
        filters: { status: 'in-progress', assignee: 'user-1' },
        sortBy: 'priority',
        groupBy: 'status',
        visibleCount: 15,
        totalCount: 100,
      })
    );

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'Current view configuration and visible items',
      value: {
        type: 'board',
        filters: { status: 'in-progress', assignee: 'user-1' },
        sortBy: 'priority',
        groupBy: 'status',
        visibleCount: 15,
        totalCount: 100,
      },
    });
  });

  it('handles null view', () => {
    renderHook(() => useViewContext(null));

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'Current view configuration and visible items',
      value: null,
    });
  });
});

describe('useSafeContext', () => {
  beforeEach(() => {
    mockUseCopilotReadable.mockClear();
  });

  it('filters sensitive data automatically', () => {
    renderHook(() =>
      useSafeContext('Custom config', {
        name: 'My Config',
        apiKey: 'sk-secret',
        timeout: 5000,
      })
    );

    const calledValue = mockUseCopilotReadable.mock.calls[0][0].value;
    expect(calledValue.name).toBe('My Config');
    expect(calledValue.timeout).toBe(5000);
    expect(calledValue).not.toHaveProperty('apiKey');
  });

  it('uses custom description', () => {
    renderHook(() =>
      useSafeContext('My custom context description', { data: 'test' })
    );

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'My custom context description',
      value: expect.any(Object),
    });
  });

  it('handles null data', () => {
    renderHook(() => useSafeContext('Custom context', null));

    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: 'Custom context',
      value: null,
    });
  });

  it('accepts custom sensitive fields', () => {
    renderHook(() =>
      useSafeContext(
        'Config',
        { name: 'Test', internalId: 'hidden', password: 'visible' },
        ['internalId']
      )
    );

    const calledValue = mockUseCopilotReadable.mock.calls[0][0].value;
    expect(calledValue.name).toBe('Test');
    expect(calledValue.password).toBe('visible');
    expect(calledValue).not.toHaveProperty('internalId');
  });
});

describe('Provider Components', () => {
  beforeEach(() => {
    mockUseCopilotReadable.mockClear();
  });

  it('ProjectContextProvider renders children and provides context', () => {
    render(
      <ProjectContextProvider
        project={{
          id: 'proj-1',
          name: 'Test',
          status: 'active',
          progress: 50,
          tasksTotal: 10,
          tasksCompleted: 5,
        }}
      >
        <div data-testid="child">Child Content</div>
      </ProjectContextProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockUseCopilotReadable).toHaveBeenCalled();
  });

  it('SelectionContextProvider renders children', () => {
    render(
      <SelectionContextProvider
        selection={{
          type: 'task',
          ids: ['task-1'],
          count: 1,
        }}
      >
        <div data-testid="child">Child Content</div>
      </SelectionContextProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockUseCopilotReadable).toHaveBeenCalled();
  });

  it('ActivityContextProvider renders children', () => {
    render(
      <ActivityContextProvider
        activity={{
          recentActions: [],
          currentPage: '/test',
          sessionDuration: 60000,
        }}
      >
        <div data-testid="child">Child Content</div>
      </ActivityContextProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('DocumentContextProvider renders children', () => {
    render(
      <DocumentContextProvider
        document={{
          id: 'doc-1',
          title: 'Test',
          type: 'markdown',
          wordCount: 100,
          lastEdited: Date.now(),
        }}
      >
        <div data-testid="child">Child Content</div>
      </DocumentContextProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('CompositeContextProvider combines multiple contexts', () => {
    render(
      <CompositeContextProvider
        project={{
          id: 'proj-1',
          name: 'Test',
          status: 'active',
          progress: 50,
          tasksTotal: 10,
          tasksCompleted: 5,
        }}
        selection={{
          type: 'task',
          ids: ['task-1'],
          count: 1,
        }}
        activity={{
          recentActions: [],
          currentPage: '/test',
          sessionDuration: 60000,
        }}
      >
        <div data-testid="child">Child Content</div>
      </CompositeContextProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    // Should call useCopilotReadable for each context type (6 times)
    expect(mockUseCopilotReadable).toHaveBeenCalledTimes(6);
  });

  it('CompositeContextProvider handles all null contexts', () => {
    render(
      <CompositeContextProvider>
        <div data-testid="child">Child Content</div>
      </CompositeContextProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    // Should still call hooks with null values
    expect(mockUseCopilotReadable).toHaveBeenCalledTimes(6);
  });

  it('CompositeContextProvider handles partial contexts', () => {
    render(
      <CompositeContextProvider
        project={{
          id: 'proj-1',
          name: 'Test',
          status: 'active',
          progress: 50,
          tasksTotal: 10,
          tasksCompleted: 5,
        }}
        workspace={{
          id: 'ws-1',
          name: 'Workspace',
          plan: 'pro',
          memberCount: 5,
          modulesEnabled: ['pm'],
        }}
      >
        <div data-testid="child">Child Content</div>
      </CompositeContextProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockUseCopilotReadable).toHaveBeenCalledTimes(6);

    // Verify project context was provided
    const projectCall = mockUseCopilotReadable.mock.calls.find(
      (call) =>
        call[0].description === 'The currently active project the user is viewing'
    );
    expect(projectCall?.[0].value).not.toBeNull();

    // Verify workspace context was provided
    const workspaceCall = mockUseCopilotReadable.mock.calls.find(
      (call) => call[0].description === 'The current workspace context'
    );
    expect(workspaceCall?.[0].value).not.toBeNull();
  });
});

describe('Memoization', () => {
  beforeEach(() => {
    mockUseCopilotReadable.mockClear();
  });

  it('useProjectContext memoizes context value', () => {
    const project: ProjectContext = {
      id: 'proj-1',
      name: 'Test',
      status: 'active',
      progress: 50,
      tasksTotal: 10,
      tasksCompleted: 5,
    };

    const { rerender } = renderHook(
      ({ proj }) => useProjectContext(proj),
      { initialProps: { proj: project } }
    );

    const firstCallValue = mockUseCopilotReadable.mock.calls[0][0].value;

    // Rerender with same project reference
    rerender({ proj: project });

    const secondCallValue = mockUseCopilotReadable.mock.calls[1][0].value;

    // Both calls should have same object reference due to memoization
    expect(firstCallValue).toBe(secondCallValue);
  });

  it('useActivityContext memoizes context value', () => {
    const activity: ActivityContext = {
      recentActions: [],
      currentPage: '/test',
      sessionDuration: 60000,
    };

    const { rerender } = renderHook(
      ({ act }) => useActivityContext(act),
      { initialProps: { act: activity } }
    );

    const firstCallValue = mockUseCopilotReadable.mock.calls[0][0].value;

    // Rerender with same activity reference
    rerender({ act: activity });

    const secondCallValue = mockUseCopilotReadable.mock.calls[1][0].value;

    // Both calls should have same object reference due to memoization
    expect(firstCallValue).toBe(secondCallValue);
  });
});
