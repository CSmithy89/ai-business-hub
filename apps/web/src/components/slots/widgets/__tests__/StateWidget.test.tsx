/**
 * State Widget Tests
 *
 * Unit tests for state-driven widget wrappers and related utilities.
 * Tests cover:
 * - State widgets rendering with data from store
 * - Loading state handling
 * - Error state handling
 * - Data transformation from state schema to widget props
 * - Timestamp formatting
 *
 * @see docs/modules/bm-dm/stories/dm-04-4-realtime-widget-updates.md
 * Epic: DM-04 | Story: DM-04.4
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the selector hooks
vi.mock('@/hooks/use-dashboard-selectors', () => ({
  useProjectStatus: vi.fn(),
  useMetrics: vi.fn(),
  useTeamActivity: vi.fn(),
  useAlerts: vi.fn(),
  useAnyLoading: vi.fn(),
  useWidgetError: vi.fn(),
  useLastUpdated: vi.fn(),
}));

// Mock the dashboard store
vi.mock('@/stores/dashboard-state-store', () => ({
  useDashboardStateStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      // Return a mock dismiss function
      return vi.fn();
    }
    return {};
  }),
}));

import {
  StateProjectStatusWidget,
  StateMetricsWidget,
  StateActivityWidget,
  StateAlertsWidget,
  formatTimestamp,
} from '../StateWidget';
import { RealTimeIndicator } from '../RealTimeIndicator';
import {
  useProjectStatus,
  useMetrics,
  useTeamActivity,
  useAlerts,
  useAnyLoading,
  useWidgetError,
  useLastUpdated,
} from '@/hooks/use-dashboard-selectors';

// Type the mocks
const mockUseProjectStatus = useProjectStatus as ReturnType<typeof vi.fn>;
const mockUseMetrics = useMetrics as ReturnType<typeof vi.fn>;
const mockUseTeamActivity = useTeamActivity as ReturnType<typeof vi.fn>;
const mockUseAlerts = useAlerts as ReturnType<typeof vi.fn>;
const mockUseAnyLoading = useAnyLoading as ReturnType<typeof vi.fn>;
const mockUseWidgetError = useWidgetError as ReturnType<typeof vi.fn>;
const mockUseLastUpdated = useLastUpdated as ReturnType<typeof vi.fn>;

// =============================================================================
// FORMATIMESTAMP TESTS
// =============================================================================

describe('formatTimestamp', () => {
  it('returns "Just now" for timestamps less than 1 second ago', () => {
    const now = Date.now();
    expect(formatTimestamp(now)).toBe('Just now');
    expect(formatTimestamp(now - 500)).toBe('Just now');
  });

  it('returns seconds ago for timestamps less than 1 minute ago', () => {
    const now = Date.now();
    expect(formatTimestamp(now - 5000)).toBe('5s ago');
    expect(formatTimestamp(now - 30000)).toBe('30s ago');
  });

  it('returns minutes ago for timestamps less than 1 hour ago', () => {
    const now = Date.now();
    expect(formatTimestamp(now - 60000)).toBe('1m ago');
    expect(formatTimestamp(now - 300000)).toBe('5m ago');
    expect(formatTimestamp(now - 1800000)).toBe('30m ago');
  });

  it('returns hours ago for timestamps less than 1 day ago', () => {
    const now = Date.now();
    expect(formatTimestamp(now - 3600000)).toBe('1h ago');
    expect(formatTimestamp(now - 7200000)).toBe('2h ago');
    expect(formatTimestamp(now - 43200000)).toBe('12h ago');
  });

  it('returns date string for timestamps more than 1 day ago', () => {
    const twoDaysAgo = Date.now() - 172800000;
    const result = formatTimestamp(twoDaysAgo);
    // Should be a date string, not relative time
    expect(result).not.toContain('ago');
    expect(result).not.toBe('Just now');
  });
});

// =============================================================================
// STATE PROJECT STATUS WIDGET TESTS
// =============================================================================

describe('StateProjectStatusWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnyLoading.mockReturnValue(false);
    mockUseWidgetError.mockReturnValue(undefined);
  });

  it('returns null when no data and not loading', () => {
    mockUseProjectStatus.mockReturnValue(null);

    const { container } = render(<StateProjectStatusWidget />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loading widget when loading and no data', () => {
    mockUseProjectStatus.mockReturnValue(null);
    mockUseAnyLoading.mockReturnValue(true);

    render(<StateProjectStatusWidget />);

    expect(screen.getByTestId('state-project-status-loading')).toBeInTheDocument();
    expect(screen.getByTestId('loading-widget')).toBeInTheDocument();
  });

  it('shows error widget when error and no data', () => {
    mockUseProjectStatus.mockReturnValue(null);
    mockUseWidgetError.mockReturnValue('Agent Navi failed to respond');

    render(<StateProjectStatusWidget />);

    expect(screen.getByTestId('state-project-status-error')).toBeInTheDocument();
    expect(screen.getByText('Agent Navi failed to respond')).toBeInTheDocument();
  });

  it('renders widget with data from store', () => {
    mockUseProjectStatus.mockReturnValue({
      projectId: 'proj-123',
      name: 'Website Redesign',
      status: 'on-track',
      progress: 75,
      tasksCompleted: 15,
      tasksTotal: 20,
      lastUpdated: Date.now(),
    });

    render(<StateProjectStatusWidget />);

    expect(screen.getByTestId('state-project-status')).toBeInTheDocument();
    expect(screen.getByTestId('project-status-widget')).toBeInTheDocument();
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('15/20')).toBeInTheDocument();
  });

  it('shows cached data instead of loading when loading with data', () => {
    mockUseProjectStatus.mockReturnValue({
      projectId: 'proj-123',
      name: 'Test Project',
      status: 'at-risk',
      progress: 50,
      tasksCompleted: 5,
      tasksTotal: 10,
      lastUpdated: Date.now(),
    });
    mockUseAnyLoading.mockReturnValue(true);

    render(<StateProjectStatusWidget />);

    // Should show the widget, not loading
    expect(screen.getByTestId('state-project-status')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('converts status format correctly', () => {
    mockUseProjectStatus.mockReturnValue({
      projectId: 'proj-123',
      name: 'Behind Project',
      status: 'behind',
      progress: 25,
      tasksCompleted: 2,
      tasksTotal: 8,
      lastUpdated: Date.now(),
    });

    render(<StateProjectStatusWidget />);

    expect(screen.getByText('Behind')).toBeInTheDocument();
  });
});

// =============================================================================
// STATE METRICS WIDGET TESTS
// =============================================================================

describe('StateMetricsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnyLoading.mockReturnValue(false);
    mockUseWidgetError.mockReturnValue(undefined);
  });

  it('returns null when no data and not loading', () => {
    mockUseMetrics.mockReturnValue(null);

    const { container } = render(<StateMetricsWidget />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loading widget when loading and no data', () => {
    mockUseMetrics.mockReturnValue(null);
    mockUseAnyLoading.mockReturnValue(true);

    render(<StateMetricsWidget />);

    expect(screen.getByTestId('state-metrics-loading')).toBeInTheDocument();
  });

  it('shows error widget when pulse agent errors', () => {
    mockUseMetrics.mockReturnValue(null);
    mockUseWidgetError.mockReturnValue('Pulse agent timeout');

    render(<StateMetricsWidget />);

    expect(screen.getByTestId('state-metrics-error')).toBeInTheDocument();
    expect(screen.getByText('Pulse agent timeout')).toBeInTheDocument();
  });

  it('renders widget with metrics from store', () => {
    mockUseMetrics.mockReturnValue({
      title: 'Key Metrics',
      metrics: [
        { id: '1', label: 'Tasks', value: 42, trend: 'up', changePercent: 10 },
        { id: '2', label: 'Hours', value: '168h' },
      ],
      lastUpdated: Date.now(),
    });

    render(<StateMetricsWidget />);

    expect(screen.getByTestId('state-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-widget')).toBeInTheDocument();
    expect(screen.getByText('Key Metrics')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});

// =============================================================================
// STATE ACTIVITY WIDGET TESTS
// =============================================================================

describe('StateActivityWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnyLoading.mockReturnValue(false);
    mockUseWidgetError.mockReturnValue(undefined);
  });

  it('returns null when no data and not loading', () => {
    mockUseTeamActivity.mockReturnValue(null);

    const { container } = render(<StateActivityWidget />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loading widget when loading and no data', () => {
    mockUseTeamActivity.mockReturnValue(null);
    mockUseAnyLoading.mockReturnValue(true);

    render(<StateActivityWidget />);

    expect(screen.getByTestId('state-activity-loading')).toBeInTheDocument();
  });

  it('shows error widget when herald agent errors', () => {
    mockUseTeamActivity.mockReturnValue(null);
    mockUseWidgetError.mockReturnValue('Herald agent unavailable');

    render(<StateActivityWidget />);

    expect(screen.getByTestId('state-activity-error')).toBeInTheDocument();
  });

  it('renders activities with formatted timestamps', () => {
    const fiveMinutesAgo = Date.now() - 300000;
    mockUseTeamActivity.mockReturnValue({
      activities: [
        {
          id: 'a1',
          user: 'John Doe',
          action: 'completed task',
          target: 'Fix bug',
          timestamp: fiveMinutesAgo,
        },
      ],
      hasMore: false,
      lastUpdated: Date.now(),
    });

    render(<StateActivityWidget />);

    expect(screen.getByTestId('state-activity')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('completed task')).toBeInTheDocument();
    expect(screen.getByText('Fix bug')).toBeInTheDocument();
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });
});

// =============================================================================
// STATE ALERTS WIDGET TESTS
// =============================================================================

describe('StateAlertsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no alerts', () => {
    mockUseAlerts.mockReturnValue([]);

    const { container } = render(<StateAlertsWidget />);
    expect(container.firstChild).toBeNull();
  });

  it('renders alerts from store', () => {
    mockUseAlerts.mockReturnValue([
      {
        id: 'alert-1',
        type: 'warning',
        title: 'Deadline Approaching',
        message: 'Project due in 3 days',
        timestamp: Date.now(),
        dismissable: true,
        dismissed: false,
      },
    ]);

    render(<StateAlertsWidget />);

    expect(screen.getByTestId('state-alerts')).toBeInTheDocument();
    expect(screen.getByText('Deadline Approaching')).toBeInTheDocument();
    expect(screen.getByText('Project due in 3 days')).toBeInTheDocument();
  });

  it('renders multiple alerts', () => {
    mockUseAlerts.mockReturnValue([
      {
        id: 'alert-1',
        type: 'error',
        title: 'Error 1',
        message: 'First error',
        timestamp: Date.now(),
        dismissable: true,
        dismissed: false,
      },
      {
        id: 'alert-2',
        type: 'info',
        title: 'Info 1',
        message: 'Info message',
        timestamp: Date.now(),
        dismissable: false,
        dismissed: false,
      },
    ]);

    render(<StateAlertsWidget />);

    expect(screen.getByTestId('state-alert-alert-1')).toBeInTheDocument();
    expect(screen.getByTestId('state-alert-alert-2')).toBeInTheDocument();
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Info 1')).toBeInTheDocument();
  });

  it('shows dismiss button for dismissable alerts', () => {
    mockUseAlerts.mockReturnValue([
      {
        id: 'alert-1',
        type: 'warning',
        title: 'Dismissable',
        message: 'Can be dismissed',
        timestamp: Date.now(),
        dismissable: true,
        dismissed: false,
      },
    ]);

    render(<StateAlertsWidget />);

    expect(screen.getByTestId('dismiss-alert-alert-1')).toBeInTheDocument();
  });

  it('renders action button when action provided', () => {
    mockUseAlerts.mockReturnValue([
      {
        id: 'alert-1',
        type: 'info',
        title: 'With Action',
        message: 'Has an action',
        timestamp: Date.now(),
        dismissable: false,
        dismissed: false,
        actionLabel: 'View Details',
        actionUrl: '/details',
      },
    ]);

    render(<StateAlertsWidget />);

    expect(screen.getByText('View Details')).toBeInTheDocument();
  });
});

// =============================================================================
// REALTIME INDICATOR TESTS
// =============================================================================

describe('RealTimeIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnyLoading.mockReturnValue(false);
    mockUseLastUpdated.mockReturnValue(Date.now());
  });

  it('shows green status dot when connected and not loading', () => {
    mockUseLastUpdated.mockReturnValue(Date.now());
    mockUseAnyLoading.mockReturnValue(false);

    render(<RealTimeIndicator />);

    const statusDot = screen.getByTestId('status-dot');
    expect(statusDot).toHaveClass('bg-green-500');
    expect(statusDot).not.toHaveClass('animate-pulse');
  });

  it('shows yellow pulsing dot when loading', () => {
    mockUseAnyLoading.mockReturnValue(true);

    render(<RealTimeIndicator />);

    const statusDot = screen.getByTestId('status-dot');
    expect(statusDot).toHaveClass('bg-yellow-500');
    expect(statusDot).toHaveClass('animate-pulse');
  });

  it('shows gray dot when no timestamp', () => {
    mockUseLastUpdated.mockReturnValue(0);
    mockUseAnyLoading.mockReturnValue(false);

    render(<RealTimeIndicator />);

    const statusDot = screen.getByTestId('status-dot');
    expect(statusDot).toHaveClass('bg-gray-400');
  });

  it('displays relative time correctly', () => {
    const fiveMinutesAgo = Date.now() - 300000;
    mockUseLastUpdated.mockReturnValue(fiveMinutesAgo);

    render(<RealTimeIndicator />);

    expect(screen.getByText('Last updated: 5m ago')).toBeInTheDocument();
  });

  it('shows Syncing... when loading', () => {
    mockUseAnyLoading.mockReturnValue(true);

    render(<RealTimeIndicator />);

    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('renders refresh button when onRefresh provided', () => {
    const onRefresh = vi.fn();

    render(<RealTimeIndicator onRefresh={onRefresh} />);

    expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
  });

  it('does not render refresh button when onRefresh not provided', () => {
    render(<RealTimeIndicator />);

    expect(screen.queryByTestId('refresh-button')).not.toBeInTheDocument();
  });

  it('calls onRefresh when refresh button clicked', () => {
    const onRefresh = vi.fn();

    render(<RealTimeIndicator onRefresh={onRefresh} />);

    fireEvent.click(screen.getByTestId('refresh-button'));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('disables refresh button when loading', () => {
    mockUseAnyLoading.mockReturnValue(true);
    const onRefresh = vi.fn();

    render(<RealTimeIndicator onRefresh={onRefresh} />);

    expect(screen.getByTestId('refresh-button')).toBeDisabled();
  });

  it('shows spinning icon when loading and refresh button visible', () => {
    mockUseAnyLoading.mockReturnValue(true);
    const onRefresh = vi.fn();

    render(<RealTimeIndicator onRefresh={onRefresh} />);

    const refreshButton = screen.getByTestId('refresh-button');
    const icon = refreshButton.querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });
});
