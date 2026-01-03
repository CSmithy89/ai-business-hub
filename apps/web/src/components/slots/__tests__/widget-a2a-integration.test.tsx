/**
 * Widget A2A Integration Tests - Story DM-11.7
 *
 * Tests the integration between AI agents and widgets via the A2A data flow.
 * Verifies that widgets receive and render data correctly from mock A2A responses.
 *
 * Data flow: Agent -> A2A Protocol -> CopilotKit -> Widget Registry -> React Component
 *
 * @see docs/modules/bm-dm/stories/dm-11-7-remaining-widget-types.md
 * @see apps/web/src/components/slots/widget-registry.tsx
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getWidgetComponent, isValidWidgetType, getRegisteredWidgetTypes, WIDGET_REGISTRY } from '../widget-registry';
import { ProjectStatusWidget } from '../widgets/ProjectStatusWidget';
import { TaskListWidget } from '../widgets/TaskListWidget';
import { MetricsWidget } from '../widgets/MetricsWidget';
import { AlertWidget } from '../widgets/AlertWidget';
import type {
  ProjectStatusData,
  TaskListData,
  MetricsData,
  AlertData,
} from '../types';

// ============================================
// Mock A2A Response Data
// These simulate the data structure sent by agents
// ============================================

/**
 * Mock Navi agent response for project status
 */
const mockNaviProjectResponse: ProjectStatusData = {
  projectId: 'proj_123',
  projectName: 'Test Project',
  status: 'on_track',
  progress: 75,
  tasksCompleted: 15,
  tasksTotal: 20,
  dueDate: '2026-02-15',
};

/**
 * Mock Navi agent response for task list
 */
const mockNaviTaskListResponse: TaskListData = {
  title: 'Sprint Tasks',
  tasks: [
    { id: 't1', title: 'Review PRD', status: 'done', priority: 'high' },
    { id: 't2', title: 'Design mockups', status: 'in_progress', priority: 'medium' },
    { id: 't3', title: 'Write tests', status: 'todo', priority: 'low' },
  ],
};

/**
 * Mock Pulse agent response for metrics
 */
const mockPulseHealthResponse: MetricsData = {
  title: 'Health Metrics',
  metrics: [
    { label: 'Completion Rate', value: '87%', change: { value: 5, direction: 'up' }, icon: 'target' },
    { label: 'Active Tasks', value: 42, change: { value: 8, direction: 'up' }, icon: 'tasks' },
    { label: 'Team Members', value: 12, icon: 'users' },
  ],
};

/**
 * Mock Herald agent response for alerts
 */
const mockHeraldAlertResponse: AlertData = {
  severity: 'warning',
  title: 'Deadline Approaching',
  message: 'The project deadline is in 3 days. Consider reviewing the remaining tasks.',
  action: { label: 'View Tasks', href: '/projects/123/tasks' },
};

// ============================================
// Widget Registry Tests
// ============================================

describe('Widget Registry Integration', () => {
  describe('isValidWidgetType', () => {
    it('returns true for all registered widget types', () => {
      const registeredTypes = getRegisteredWidgetTypes();

      registeredTypes.forEach(type => {
        expect(isValidWidgetType(type)).toBe(true);
      });
    });

    it('returns false for invalid widget types', () => {
      expect(isValidWidgetType('InvalidWidget')).toBe(false);
      expect(isValidWidgetType('')).toBe(false);
      expect(isValidWidgetType('projectstatus')).toBe(false); // case-sensitive
    });
  });

  describe('getWidgetComponent', () => {
    it('returns correct component for ProjectStatus', () => {
      const component = getWidgetComponent('ProjectStatus');
      expect(component).toBeDefined();
      expect(component).toBe(WIDGET_REGISTRY.ProjectStatus);
    });

    it('returns correct component for TaskList', () => {
      const component = getWidgetComponent('TaskList');
      expect(component).toBeDefined();
      expect(component).toBe(WIDGET_REGISTRY.TaskList);
    });

    it('returns correct component for Metrics', () => {
      const component = getWidgetComponent('Metrics');
      expect(component).toBeDefined();
      expect(component).toBe(WIDGET_REGISTRY.Metrics);
    });

    it('returns correct component for Alert', () => {
      const component = getWidgetComponent('Alert');
      expect(component).toBeDefined();
      expect(component).toBe(WIDGET_REGISTRY.Alert);
    });

    it('returns undefined for invalid widget type', () => {
      const component = getWidgetComponent('NonExistent');
      expect(component).toBeUndefined();
    });
  });

  describe('getRegisteredWidgetTypes', () => {
    it('includes all 4 core widget types', () => {
      const types = getRegisteredWidgetTypes();

      expect(types).toContain('ProjectStatus');
      expect(types).toContain('TaskList');
      expect(types).toContain('Metrics');
      expect(types).toContain('Alert');
    });

    it('includes TeamActivity widget', () => {
      const types = getRegisteredWidgetTypes();
      expect(types).toContain('TeamActivity');
    });

    it('includes placeholder widgets for future implementation', () => {
      const types = getRegisteredWidgetTypes();
      expect(types).toContain('KanbanBoard');
      expect(types).toContain('GanttChart');
      expect(types).toContain('BurndownChart');
    });
  });
});

// ============================================
// A2A Data Flow Tests - ProjectStatus
// ============================================

describe('ProjectStatus A2A Integration', () => {
  it('renders Navi project data correctly', () => {
    render(<ProjectStatusWidget data={mockNaviProjectResponse} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('On Track')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('15/20')).toBeInTheDocument();
  });

  it('handles all status values from agent', () => {
    const statuses = ['on_track', 'at_risk', 'behind'] as const;
    const expectedLabels = ['On Track', 'At Risk', 'Behind'];

    statuses.forEach((status, index) => {
      const { unmount } = render(
        <ProjectStatusWidget data={{ ...mockNaviProjectResponse, status }} />
      );
      expect(screen.getByText(expectedLabels[index])).toBeInTheDocument();
      unmount();
    });
  });

  it('handles missing optional fields gracefully', () => {
    const minimalData: ProjectStatusData = {
      projectId: 'proj_min',
      projectName: 'Minimal Project',
      status: 'on_track',
      progress: 50,
      tasksCompleted: 5,
      tasksTotal: 10,
    };

    render(<ProjectStatusWidget data={minimalData} />);

    expect(screen.getByText('Minimal Project')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    // Due date should not be present
    expect(screen.queryByTestId('due-date')).not.toBeInTheDocument();
  });
});

// ============================================
// A2A Data Flow Tests - TaskList
// ============================================

describe('TaskList A2A Integration', () => {
  it('renders Navi task list data correctly', () => {
    render(<TaskListWidget data={mockNaviTaskListResponse} />);

    expect(screen.getByText('Sprint Tasks')).toBeInTheDocument();
    expect(screen.getByText('Review PRD')).toBeInTheDocument();
    expect(screen.getByText('Design mockups')).toBeInTheDocument();
    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText('3 total')).toBeInTheDocument();
  });

  it('handles all task statuses from agent', () => {
    render(<TaskListWidget data={mockNaviTaskListResponse} />);

    // Check for status icons rendered (via test ids)
    expect(screen.getByTestId('task-item-t1')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-t2')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-t3')).toBeInTheDocument();
  });

  it('handles all priority levels from agent', () => {
    render(<TaskListWidget data={mockNaviTaskListResponse} />);

    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('respects limit parameter from agent', () => {
    const limitedData: TaskListData = {
      ...mockNaviTaskListResponse,
      limit: 2,
    };

    render(<TaskListWidget data={limitedData} />);

    expect(screen.getByText('Review PRD')).toBeInTheDocument();
    expect(screen.getByText('Design mockups')).toBeInTheDocument();
    expect(screen.queryByText('Write tests')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more tasks')).toBeInTheDocument();
  });
});

// ============================================
// A2A Data Flow Tests - Metrics
// ============================================

describe('Metrics A2A Integration', () => {
  it('renders Pulse health data correctly', () => {
    render(<MetricsWidget data={mockPulseHealthResponse} />);

    expect(screen.getByText('Health Metrics')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('Active Tasks')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders trend indicators correctly', () => {
    render(<MetricsWidget data={mockPulseHealthResponse} />);

    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByText('+8%')).toBeInTheDocument();
  });

  it('handles metrics without change indicators', () => {
    render(<MetricsWidget data={mockPulseHealthResponse} />);

    // Team Members has no change indicator
    const teamMetric = screen.getByTestId('metric-item-2');
    expect(teamMetric.textContent).toContain('Team Members');
    expect(teamMetric.textContent).toContain('12');
    expect(teamMetric.textContent).not.toContain('%');
  });

  it('handles empty metrics array gracefully', () => {
    const emptyData: MetricsData = {
      metrics: [],
    };

    render(<MetricsWidget data={emptyData} />);

    expect(screen.getByText('No metrics available')).toBeInTheDocument();
  });
});

// ============================================
// A2A Data Flow Tests - Alert
// ============================================

describe('Alert A2A Integration', () => {
  it('renders Herald alert data correctly', () => {
    render(<AlertWidget data={mockHeraldAlertResponse} />);

    expect(screen.getByText('Deadline Approaching')).toBeInTheDocument();
    expect(screen.getByText(/The project deadline is in 3 days/)).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    render(<AlertWidget data={mockHeraldAlertResponse} />);

    const link = screen.getByRole('link', { name: 'View Tasks' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/projects/123/tasks');
  });

  it('handles all severity levels from agent', () => {
    const severities = ['info', 'warning', 'error', 'success'] as const;

    severities.forEach((severity) => {
      const { unmount, container } = render(
        <AlertWidget data={{ ...mockHeraldAlertResponse, severity }} />
      );

      const alert = container.querySelector('[data-testid="alert-widget"]');
      expect(alert).toBeInTheDocument();
      unmount();
    });
  });

  it('returns null for incomplete alert data', () => {
    const incompleteData = {
      severity: 'info',
      // Missing title and message
    } as AlertData;

    const { container } = render(<AlertWidget data={incompleteData} />);
    expect(container).toBeEmptyDOMElement();
  });
});

// ============================================
// Dynamic Widget Rendering Tests
// ============================================

describe('Dynamic Widget Rendering via Registry', () => {
  it('can render ProjectStatus widget dynamically', () => {
    const Widget = getWidgetComponent('ProjectStatus');
    expect(Widget).toBeDefined();
    if (!Widget) throw new Error('Widget not found');

    render(<Widget data={mockNaviProjectResponse} />);
    expect(screen.getByTestId('project-status-widget')).toBeInTheDocument();
  });

  it('can render TaskList widget dynamically', () => {
    const Widget = getWidgetComponent('TaskList');
    expect(Widget).toBeDefined();
    if (!Widget) throw new Error('Widget not found');

    render(<Widget data={mockNaviTaskListResponse} />);
    expect(screen.getByTestId('task-list-widget')).toBeInTheDocument();
  });

  it('can render Metrics widget dynamically', () => {
    const Widget = getWidgetComponent('Metrics');
    expect(Widget).toBeDefined();
    if (!Widget) throw new Error('Widget not found');

    render(<Widget data={mockPulseHealthResponse} />);
    expect(screen.getByTestId('metrics-widget')).toBeInTheDocument();
  });

  it('can render Alert widget dynamically', () => {
    const Widget = getWidgetComponent('Alert');
    expect(Widget).toBeDefined();
    if (!Widget) throw new Error('Widget not found');

    render(<Widget data={mockHeraldAlertResponse} />);
    expect(screen.getByTestId('alert-widget')).toBeInTheDocument();
  });

  it('handles loading state for all widget types', () => {
    const widgetTypes = ['ProjectStatus', 'TaskList', 'Metrics', 'Alert'] as const;

    widgetTypes.forEach((type) => {
      const Widget = getWidgetComponent(type);
      expect(Widget).toBeDefined();
      if (!Widget) throw new Error('Widget not found');

      const { unmount } = render(<Widget data={{} as never} isLoading />);

      // All widgets should show skeleton when loading
      const skeleton = document.querySelector('[data-testid^="widget-skeleton"]');
      expect(skeleton).toBeInTheDocument();
      unmount();
    });
  });
});

// ============================================
// Edge Cases and Error Handling
// ============================================

describe('Widget Error Handling', () => {
  it('handles null data gracefully', () => {
    const Widget = getWidgetComponent('ProjectStatus');
    if (!Widget) throw new Error('Widget not found');

    render(<Widget data={null as unknown as ProjectStatusData} />);
    expect(screen.getByText('No project data available')).toBeInTheDocument();
  });

  it('handles undefined data gracefully', () => {
    const Widget = getWidgetComponent('TaskList');
    if (!Widget) throw new Error('Widget not found');

    render(<Widget data={undefined as unknown as TaskListData} />);
    expect(screen.getByText('No tasks to display')).toBeInTheDocument();
  });

  it('handles malformed data gracefully', () => {
    const Widget = getWidgetComponent('Metrics');
    if (!Widget) throw new Error('Widget not found');

    render(<Widget data={{ metrics: null } as unknown as MetricsData} />);
    expect(screen.getByText('No metrics available')).toBeInTheDocument();
  });

  it('clamps out-of-range progress values', () => {
    render(
      <ProjectStatusWidget
        data={{ ...mockNaviProjectResponse, progress: 150 }}
      />
    );
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles negative progress values', () => {
    render(
      <ProjectStatusWidget
        data={{ ...mockNaviProjectResponse, progress: -50 }}
      />
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
