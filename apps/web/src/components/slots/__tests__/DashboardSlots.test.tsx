import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { DashboardSlots } from '../DashboardSlots';

// Mock CopilotKit
const mockUseCopilotAction = vi.fn();
const mockUseCoAgentStateRender = vi.fn();

vi.mock('@copilotkit/react-core', () => ({
  useCopilotAction: (config: unknown) => mockUseCopilotAction(config),
  useCoAgentStateRender: (config: unknown) => mockUseCoAgentStateRender(config),
}));

describe('DashboardSlots', () => {
  beforeEach(() => {
    mockUseCopilotAction.mockClear();
    mockUseCoAgentStateRender.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<DashboardSlots />);

    // Component renders state-driven widgets container in hybrid mode
    expect(document.querySelector('[data-testid="dashboard-state-widgets"]')).toBeInTheDocument();
  });

  it('registers render_dashboard_widget tool with useCopilotAction', () => {
    render(<DashboardSlots />);

    expect(mockUseCopilotAction).toHaveBeenCalledTimes(1);
    expect(mockUseCopilotAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'render_dashboard_widget',
        description: expect.any(String),
        parameters: expect.any(Array),
        render: expect.any(Function),
      })
    );
  });

  it('registers tool with correct parameters schema', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];

    expect(config.parameters).toEqual([
      expect.objectContaining({
        name: 'type',
        type: 'string',
        description: expect.any(String),
        required: true,
      }),
      expect.objectContaining({
        name: 'data',
        type: 'object',
        description: expect.any(String),
        required: true,
      }),
    ]);
  });

  it('sets available to disabled (render only)', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    expect(config.available).toBe('disabled');
  });

  it('includes type parameter description with all widget types', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const typeParam = config.parameters.find((p: { name: string }) => p.name === 'type');

    expect(typeParam.description).toContain('ProjectStatus');
    expect(typeParam.description).toContain('TaskList');
    expect(typeParam.description).toContain('Metrics');
    expect(typeParam.description).toContain('Alert');
    expect(typeParam.description).toContain('TeamActivity');
  });
});

describe('DashboardSlots render function', () => {
  beforeEach(() => {
    mockUseCopilotAction.mockClear();
    mockUseCoAgentStateRender.mockClear();
  });

  /**
   * Helper function to get the first child component from a wrapper div
   * The render function wraps everything in a div for animation
   */
  const getWrappedChild = (renderResult: { props: { children: unknown } }) => {
    return renderResult?.props?.children;
  };

  it('renders widget for valid type', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const renderResult = config.render({
      args: {
        type: 'ProjectStatus',
        data: {
          projectId: '123',
          projectName: 'Test Project',
          status: 'on_track',
          progress: 50,
          tasksCompleted: 5,
          tasksTotal: 10,
        },
      },
      status: 'complete',
    });

    // Should return a div wrapper with WidgetErrorBoundary inside
    expect(renderResult).toBeTruthy();
    expect(renderResult.type).toBe('div');
    const child = getWrappedChild(renderResult);
    expect(child.type.name).toBe('WidgetErrorBoundary');
    expect(child.props.widgetType).toBe('ProjectStatus');
  });

  it('renders error widget for invalid widget type', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const renderResult = config.render({
      args: {
        type: 'InvalidType',
        data: {},
      },
      status: 'complete',
    });

    // Should return div wrapper with ErrorWidget inside
    expect(renderResult).toBeTruthy();
    expect(renderResult.type).toBe('div');
    const child = getWrappedChild(renderResult);
    expect(child.type.name).toBe('ErrorWidget');
    expect(child.props.widgetType).toBe('InvalidType');
    expect(child.props.message).toContain('Unknown widget type');
    expect(child.props.availableTypes).toBeDefined();
  });

  it('renders loading widget when status is inProgress', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const renderResult = config.render({
      args: {
        type: 'ProjectStatus',
        data: {},
      },
      status: 'inProgress',
    });

    // Should return div wrapper with LoadingWidget inside
    expect(renderResult).toBeTruthy();
    expect(renderResult.type).toBe('div');
    const child = getWrappedChild(renderResult);
    expect(child.type.name).toBe('LoadingWidget');
    expect(child.props.type).toBe('ProjectStatus');
  });

  it('renders loading widget when status is executing', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const renderResult = config.render({
      args: {
        type: 'Metrics',
        data: {},
      },
      status: 'executing',
    });

    // Should return div wrapper with LoadingWidget inside
    expect(renderResult).toBeTruthy();
    expect(renderResult.type).toBe('div');
    const child = getWrappedChild(renderResult);
    expect(child.type.name).toBe('LoadingWidget');
  });

  it('renders error widget when data contains error field', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const renderResult = config.render({
      args: {
        type: 'ProjectStatus',
        data: { error: 'Failed to load project data' },
      },
      status: 'complete',
    });

    // Should return div wrapper with ErrorWidget inside
    expect(renderResult).toBeTruthy();
    expect(renderResult.type).toBe('div');
    const child = getWrappedChild(renderResult);
    expect(child.type.name).toBe('ErrorWidget');
    expect(child.props.message).toBe('Failed to load project data');
    expect(child.props.widgetType).toBe('ProjectStatus');
  });

  it('wraps valid widgets in error boundary', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const renderResult = config.render({
      args: {
        type: 'ProjectStatus',
        data: {
          projectId: '123',
          projectName: 'Test Project',
          status: 'on_track',
          progress: 75,
          tasksCompleted: 15,
          tasksTotal: 20,
        },
      },
      status: 'complete',
    });

    // Should be div wrapper with WidgetErrorBoundary inside
    expect(renderResult.type).toBe('div');
    const child = getWrappedChild(renderResult);
    expect(child.type.name).toBe('WidgetErrorBoundary');
    expect(child.props.widgetType).toBe('ProjectStatus');
  });

  it('renders TeamActivity widget correctly', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const renderResult = config.render({
      args: {
        type: 'TeamActivity',
        data: {
          activities: [
            { user: 'John', action: 'completed', target: 'Task 1', time: '2h ago' },
          ],
        },
      },
      status: 'complete',
    });

    // Should be div wrapper with WidgetErrorBoundary inside
    expect(renderResult).toBeTruthy();
    expect(renderResult.type).toBe('div');
    const child = getWrappedChild(renderResult);
    expect(child.type.name).toBe('WidgetErrorBoundary');
    expect(child.props.widgetType).toBe('TeamActivity');
  });
});
