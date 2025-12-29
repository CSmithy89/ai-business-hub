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

  it('includes type parameter description with widget types', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const typeParam = config.parameters.find((p: { name: string }) => p.name === 'type');

    expect(typeParam.description).toContain('ProjectStatus');
    expect(typeParam.description).toContain('TaskList');
    expect(typeParam.description).toContain('Metrics');
    expect(typeParam.description).toContain('Alert');
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
    });

    // Should return a React element (not null or error fallback)
    expect(renderResult).toBeTruthy();
    expect(renderResult.type.name).not.toBe('WidgetErrorFallback');
  });

  it('renders error fallback for invalid widget type', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const renderResult = config.render({
      args: {
        type: 'InvalidType',
        data: {},
      },
    });

    // Should return WidgetErrorFallback
    expect(renderResult).toBeTruthy();
    // The component should have widgetType prop
    expect(renderResult.props.widgetType).toBe('InvalidType');
  });

  it('wraps valid widgets in error boundary', () => {
    render(<DashboardSlots />);

    const config = mockUseCopilotAction.mock.calls[0][0];
    const renderResult = config.render({
      args: {
        type: 'ProjectStatus',
        data: { projectId: '123' },
      },
    });

    // Should be wrapped in WidgetErrorBoundary
    expect(renderResult.type.name).toBe('WidgetErrorBoundary');
    expect(renderResult.props.widgetType).toBe('ProjectStatus');
  });
});
