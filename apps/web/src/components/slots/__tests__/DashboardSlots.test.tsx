import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { DashboardSlots } from '../DashboardSlots';

// Mock CopilotKit
const mockUseCopilotAction = vi.fn();

vi.mock('@copilotkit/react-core', () => ({
  useCopilotAction: (config: unknown) => mockUseCopilotAction(config),
}));

describe('DashboardSlots', () => {
  beforeEach(() => {
    mockUseCopilotAction.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<DashboardSlots />);

    // Component renders nothing (null)
    expect(container).toBeEmptyDOMElement();
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
  });

  it('renders widget for valid type', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const renderResult = config.render({
      args: {
        type: 'ProjectStatus',
        data: { projectId: '123', projectName: 'Test' },
      },
      status: 'complete',
    });

    // Should return a React element (wrapped in error boundary)
    expect(renderResult).toBeTruthy();
    expect(renderResult.type.name).toBe('WidgetErrorBoundary');
    expect(renderResult.props.widgetType).toBe('ProjectStatus');
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

    // Should return ErrorWidget
    expect(renderResult).toBeTruthy();
    expect(renderResult.type.name).toBe('ErrorWidget');
    expect(renderResult.props.widgetType).toBe('InvalidType');
    expect(renderResult.props.message).toContain('Unknown widget type');
    expect(renderResult.props.availableTypes).toBeDefined();
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

    // Should return LoadingWidget
    expect(renderResult).toBeTruthy();
    expect(renderResult.type.name).toBe('LoadingWidget');
    expect(renderResult.props.type).toBe('ProjectStatus');
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

    // Should return LoadingWidget
    expect(renderResult).toBeTruthy();
    expect(renderResult.type.name).toBe('LoadingWidget');
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

    // Should return ErrorWidget with the error message
    expect(renderResult).toBeTruthy();
    expect(renderResult.type.name).toBe('ErrorWidget');
    expect(renderResult.props.message).toBe('Failed to load project data');
    expect(renderResult.props.widgetType).toBe('ProjectStatus');
  });

  it('wraps valid widgets in error boundary', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const renderResult = config.render({
      args: {
        type: 'ProjectStatus',
        data: { projectId: '123' },
      },
      status: 'complete',
    });

    // Should be wrapped in WidgetErrorBoundary
    expect(renderResult.type.name).toBe('WidgetErrorBoundary');
    expect(renderResult.props.widgetType).toBe('ProjectStatus');
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

    // Should be wrapped in WidgetErrorBoundary
    expect(renderResult).toBeTruthy();
    expect(renderResult.type.name).toBe('WidgetErrorBoundary');
    expect(renderResult.props.widgetType).toBe('TeamActivity');
  });
});
