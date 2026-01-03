/**
 * Widget Visual Regression Tests - Story DM-09.5, DM-11.7
 *
 * Visual regression testing for dashboard widget components using Percy.
 * Since Storybook is not installed, we test components in the context of
 * real pages with mocked API data.
 *
 * DM-11.7: Extended to cover all widget states for the 4 core widget types:
 * - ProjectStatusWidget (on_track, at_risk, behind, loading, empty)
 * - TaskListWidget (mixed statuses, high priority, empty, limited)
 * - MetricsWidget (positive trend, negative trend, no trend, loading)
 * - AlertWidget (info, warning, error, success, with action)
 *
 * @see docs/modules/bm-dm/stories/dm-09-5-visual-regression-tests.md
 * @see docs/modules/bm-dm/stories/dm-11-7-remaining-widget-types.md
 * @see apps/web/.percy.yml
 */
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';
import {
  mockDashboardWidgets,
  mockAgentHealth,
} from '../support/fixtures/api-mock.fixture';

/**
 * Widget state definitions for visual testing
 * Maps component states to mock data configurations
 *
 * Note: Widget types and data schemas must match the definitions in:
 * - packages/shared/src/types/widget.ts (WidgetType, *Data interfaces)
 * - apps/web/src/components/slots/widget-registry.tsx (WIDGET_REGISTRY)
 */
interface WidgetStateConfig {
  name: string;
  description: string;
  widgets: unknown[];
}

// ============================================
// TaskList Widget States (DM-11.7)
// Schema: TaskListData { title?, tasks[], limit? }
// Task: { id, title, status: 'todo'|'in_progress'|'done', priority: 'low'|'medium'|'high', assignee? }
// ============================================
const taskListStates: WidgetStateConfig[] = [
  {
    name: 'tasklist-todo',
    description: 'TaskListWidget with todo tasks',
    widgets: [
      {
        id: 'task-todo',
        type: 'TaskList',
        data: {
          title: 'Pending Tasks',
          tasks: [
            { id: 't1', title: 'Review document', status: 'todo', priority: 'low' },
            { id: 't2', title: 'Update settings', status: 'todo', priority: 'medium' },
            { id: 't3', title: 'Plan sprint', status: 'todo', priority: 'high' },
          ],
        },
      },
    ],
  },
  {
    name: 'tasklist-in-progress',
    description: 'TaskListWidget with in-progress tasks',
    widgets: [
      {
        id: 'task-progress',
        type: 'TaskList',
        data: {
          title: 'Active Tasks',
          tasks: [
            { id: 't1', title: 'Implement feature', status: 'in_progress', priority: 'high' },
            { id: 't2', title: 'Code review', status: 'in_progress', priority: 'medium' },
          ],
        },
      },
    ],
  },
  {
    name: 'tasklist-done',
    description: 'TaskListWidget with completed tasks',
    widgets: [
      {
        id: 'task-completed',
        type: 'TaskList',
        data: {
          title: 'Completed Tasks',
          tasks: [
            { id: 't1', title: 'Deploy release', status: 'done', priority: 'high' },
            { id: 't2', title: 'Write documentation', status: 'done', priority: 'low' },
          ],
        },
      },
    ],
  },
  {
    name: 'tasklist-mixed',
    description: 'TaskListWidget with mixed status tasks',
    widgets: [
      {
        id: 'task-mixed',
        type: 'TaskList',
        data: {
          title: 'All Tasks',
          tasks: [
            { id: 't1', title: 'Design mockups', status: 'done', priority: 'high' },
            { id: 't2', title: 'Implement UI', status: 'in_progress', priority: 'high', assignee: 'John Doe' },
            { id: 't3', title: 'Write tests', status: 'todo', priority: 'medium' },
            { id: 't4', title: 'Deploy to staging', status: 'todo', priority: 'low' },
          ],
        },
      },
    ],
  },
  {
    name: 'tasklist-with-limit',
    description: 'TaskListWidget with limit showing more indicator',
    widgets: [
      {
        id: 'task-limited',
        type: 'TaskList',
        data: {
          title: 'Recent Tasks',
          tasks: [
            { id: 't1', title: 'Task 1', status: 'todo', priority: 'high' },
            { id: 't2', title: 'Task 2', status: 'in_progress', priority: 'medium' },
            { id: 't3', title: 'Task 3', status: 'done', priority: 'low' },
            { id: 't4', title: 'Task 4', status: 'todo', priority: 'medium' },
            { id: 't5', title: 'Task 5', status: 'todo', priority: 'low' },
          ],
          limit: 3,
        },
      },
    ],
  },
  {
    name: 'tasklist-empty',
    description: 'TaskListWidget with no tasks (empty state)',
    widgets: [
      {
        id: 'task-empty',
        type: 'TaskList',
        data: {
          title: 'No Tasks',
          tasks: [],
        },
      },
    ],
  },
  {
    name: 'tasklist-with-assignees',
    description: 'TaskListWidget with assignees shown',
    widgets: [
      {
        id: 'task-assignees',
        type: 'TaskList',
        data: {
          title: 'Team Tasks',
          tasks: [
            { id: 't1', title: 'Frontend development', status: 'in_progress', priority: 'high', assignee: 'Alice Smith' },
            { id: 't2', title: 'Backend API', status: 'in_progress', priority: 'high', assignee: 'Bob Johnson' },
            { id: 't3', title: 'Database design', status: 'done', priority: 'medium', assignee: 'Carol Williams' },
          ],
        },
      },
    ],
  },
];

// ============================================
// Metrics Widget States (DM-11.7)
// Schema: MetricsData { title?, metrics[] }
// Metric: { label, value, change?: { value, direction: 'up'|'down' }, icon?: string }
// Icons: 'activity', 'target', 'users', 'clock', 'tasks', 'chart'
// ============================================
const metricsWidgetStates: WidgetStateConfig[] = [
  {
    name: 'metrics-positive-trend',
    description: 'MetricsWidget showing positive/upward trends',
    widgets: [
      {
        id: 'metrics-up',
        type: 'Metrics',
        data: {
          title: 'Performance Metrics',
          metrics: [
            { label: 'Active Users', value: 1234, change: { value: 12, direction: 'up' }, icon: 'users' },
            { label: 'Completion Rate', value: '87%', change: { value: 5, direction: 'up' }, icon: 'target' },
          ],
        },
      },
    ],
  },
  {
    name: 'metrics-negative-trend',
    description: 'MetricsWidget showing negative/downward trends',
    widgets: [
      {
        id: 'metrics-down',
        type: 'Metrics',
        data: {
          title: 'Warning Metrics',
          metrics: [
            { label: 'Bounce Rate', value: '45%', change: { value: 8, direction: 'down' }, icon: 'activity' },
            { label: 'Response Time', value: '2.3s', change: { value: 15, direction: 'down' }, icon: 'clock' },
          ],
        },
      },
    ],
  },
  {
    name: 'metrics-no-change',
    description: 'MetricsWidget with no change indicators',
    widgets: [
      {
        id: 'metrics-stable',
        type: 'Metrics',
        data: {
          title: 'Current Status',
          metrics: [
            { label: 'Total Projects', value: 42, icon: 'chart' },
            { label: 'Team Size', value: 12, icon: 'users' },
            { label: 'Open Tasks', value: 156, icon: 'tasks' },
          ],
        },
      },
    ],
  },
  {
    name: 'metrics-mixed-trends',
    description: 'MetricsWidget with mixed up and down trends',
    widgets: [
      {
        id: 'metrics-mixed',
        type: 'Metrics',
        data: {
          metrics: [
            { label: 'Revenue', value: '$45,230', change: { value: 23, direction: 'up' }, icon: 'chart' },
            { label: 'Expenses', value: '$12,450', change: { value: 7, direction: 'down' }, icon: 'activity' },
            { label: 'Profit Margin', value: '32%', change: { value: 4, direction: 'up' }, icon: 'target' },
            { label: 'Churn Rate', value: '2.3%', change: { value: 1, direction: 'down' }, icon: 'users' },
          ],
        },
      },
    ],
  },
  {
    name: 'metrics-single',
    description: 'MetricsWidget with single metric',
    widgets: [
      {
        id: 'metrics-single',
        type: 'Metrics',
        data: {
          title: 'Key Metric',
          metrics: [
            { label: 'Total Revenue', value: '$1.2M', change: { value: 18, direction: 'up' }, icon: 'chart' },
          ],
        },
      },
    ],
  },
  {
    name: 'metrics-empty',
    description: 'MetricsWidget with no metrics (empty state)',
    widgets: [
      {
        id: 'metrics-empty',
        type: 'Metrics',
        data: {
          title: 'No Data',
          metrics: [],
        },
      },
    ],
  },
  {
    name: 'metrics-four-columns',
    description: 'MetricsWidget with 4 metrics in grid',
    widgets: [
      {
        id: 'metrics-grid',
        type: 'Metrics',
        data: {
          title: 'Dashboard Overview',
          metrics: [
            { label: 'Tasks', value: 42, change: { value: 12, direction: 'up' }, icon: 'tasks' },
            { label: 'Hours', value: '168h', icon: 'clock' },
            { label: 'Team', value: 8, icon: 'users' },
            { label: 'Progress', value: '78%', change: { value: 5, direction: 'up' }, icon: 'target' },
          ],
        },
      },
    ],
  },
];

// ============================================
// Alert Widget States (DM-11.7)
// Schema: AlertData { severity: 'info'|'warning'|'error'|'success', title, message, action?: { label, href } }
// ============================================
const alertWidgetStates: WidgetStateConfig[] = [
  {
    name: 'alert-info',
    description: 'AlertWidget with info severity',
    widgets: [
      {
        id: 'alert-info',
        type: 'Alert',
        data: {
          severity: 'info',
          title: 'System Information',
          message: 'System maintenance scheduled for tonight at 2:00 AM UTC. Expected downtime: 30 minutes.',
        },
      },
    ],
  },
  {
    name: 'alert-warning',
    description: 'AlertWidget with warning severity',
    widgets: [
      {
        id: 'alert-warning',
        type: 'Alert',
        data: {
          severity: 'warning',
          title: 'Deadline Approaching',
          message: 'The project deadline is in 3 days. Consider reviewing the remaining tasks.',
        },
      },
    ],
  },
  {
    name: 'alert-error',
    description: 'AlertWidget with error severity',
    widgets: [
      {
        id: 'alert-error',
        type: 'Alert',
        data: {
          severity: 'error',
          title: 'Connection Failed',
          message: 'Unable to connect to the database server. Please check your network connection and try again.',
        },
      },
    ],
  },
  {
    name: 'alert-success',
    description: 'AlertWidget with success severity',
    widgets: [
      {
        id: 'alert-success',
        type: 'Alert',
        data: {
          severity: 'success',
          title: 'Deployment Complete',
          message: 'Your application has been successfully deployed to production.',
        },
      },
    ],
  },
  {
    name: 'alert-with-action',
    description: 'AlertWidget with action button',
    widgets: [
      {
        id: 'alert-action',
        type: 'Alert',
        data: {
          severity: 'warning',
          title: 'Review Required',
          message: 'There are 5 pending approvals that require your attention.',
          action: { label: 'View Approvals', href: '/approvals' },
        },
      },
    ],
  },
  {
    name: 'alert-info-with-action',
    description: 'AlertWidget info with action button',
    widgets: [
      {
        id: 'alert-info-action',
        type: 'Alert',
        data: {
          severity: 'info',
          title: 'New Features Available',
          message: 'Check out the new dashboard widgets and improved analytics features.',
          action: { label: 'Learn More', href: '/whats-new' },
        },
      },
    ],
  },
];

// ============================================
// ProjectStatus Widget States (DM-11.7)
// Schema: ProjectStatusData { projectId, projectName, status: 'on_track'|'at_risk'|'behind', progress, tasksCompleted, tasksTotal, dueDate? }
// ============================================
const projectStatusStates: WidgetStateConfig[] = [
  {
    name: 'project-on-track',
    description: 'ProjectStatusWidget showing on_track state',
    widgets: [
      {
        id: 'project-on-track',
        type: 'ProjectStatus',
        data: {
          projectId: 'proj_001',
          projectName: 'Website Redesign',
          status: 'on_track',
          progress: 75,
          tasksCompleted: 15,
          tasksTotal: 20,
          dueDate: '2026-02-15',
        },
      },
    ],
  },
  {
    name: 'project-at-risk',
    description: 'ProjectStatusWidget showing at_risk state',
    widgets: [
      {
        id: 'project-at-risk',
        type: 'ProjectStatus',
        data: {
          projectId: 'proj_002',
          projectName: 'Mobile App Development',
          status: 'at_risk',
          progress: 45,
          tasksCompleted: 9,
          tasksTotal: 20,
          dueDate: '2026-01-10',
        },
      },
    ],
  },
  {
    name: 'project-behind',
    description: 'ProjectStatusWidget showing behind state',
    widgets: [
      {
        id: 'project-behind',
        type: 'ProjectStatus',
        data: {
          projectId: 'proj_003',
          projectName: 'Backend Migration',
          status: 'behind',
          progress: 30,
          tasksCompleted: 6,
          tasksTotal: 20,
          dueDate: '2026-01-05',
        },
      },
    ],
  },
  {
    name: 'project-complete',
    description: 'ProjectStatusWidget at 100% completion',
    widgets: [
      {
        id: 'project-complete',
        type: 'ProjectStatus',
        data: {
          projectId: 'proj_004',
          projectName: 'Q4 Release',
          status: 'on_track',
          progress: 100,
          tasksCompleted: 25,
          tasksTotal: 25,
          dueDate: '2025-12-31',
        },
      },
    ],
  },
  {
    name: 'project-no-due-date',
    description: 'ProjectStatusWidget without due date',
    widgets: [
      {
        id: 'project-no-date',
        type: 'ProjectStatus',
        data: {
          projectId: 'proj_005',
          projectName: 'Research Project',
          status: 'on_track',
          progress: 50,
          tasksCompleted: 10,
          tasksTotal: 20,
        },
      },
    ],
  },
  {
    name: 'project-just-started',
    description: 'ProjectStatusWidget at 0% progress',
    widgets: [
      {
        id: 'project-start',
        type: 'ProjectStatus',
        data: {
          projectId: 'proj_006',
          projectName: 'New Initiative',
          status: 'on_track',
          progress: 0,
          tasksCompleted: 0,
          tasksTotal: 15,
          dueDate: '2026-03-01',
        },
      },
    ],
  },
  {
    name: 'project-empty',
    description: 'ProjectStatusWidget with empty data (empty state)',
    widgets: [
      {
        id: 'project-empty',
        type: 'ProjectStatus',
        data: {},
      },
    ],
  },
];

// ============================================
// Progress Indicator States
// ============================================
const progressIndicatorStates: WidgetStateConfig[] = [
  {
    name: 'progress-zero',
    description: 'ProgressIndicator at 0%',
    widgets: [
      {
        id: 'progress-zero',
        type: 'progress',
        data: {
          progress: 0,
          label: 'Starting',
          status: 'pending',
        },
      },
    ],
  },
  {
    name: 'progress-half',
    description: 'ProgressIndicator at 50%',
    widgets: [
      {
        id: 'progress-half',
        type: 'progress',
        data: {
          progress: 50,
          label: 'Processing',
          status: 'running',
        },
      },
    ],
  },
  {
    name: 'progress-complete',
    description: 'ProgressIndicator at 100%',
    widgets: [
      {
        id: 'progress-complete',
        type: 'progress',
        data: {
          progress: 100,
          label: 'Complete',
          status: 'completed',
        },
      },
    ],
  },
  {
    name: 'progress-error',
    description: 'ProgressIndicator in error state',
    widgets: [
      {
        id: 'progress-error',
        type: 'progress',
        data: {
          progress: 45,
          label: 'Failed',
          status: 'failed',
          error: 'Connection timeout',
        },
      },
    ],
  },
];

// ============================================
// Combined Dashboard States (DM-11.7)
// Tests all 4 core widgets together in various combinations
// ============================================
const dashboardStates: WidgetStateConfig[] = [
  {
    name: 'dashboard-full',
    description: 'Full dashboard with all 4 core widget types',
    widgets: [
      {
        id: 'dash-project',
        type: 'ProjectStatus',
        data: {
          projectId: 'proj_main',
          projectName: 'Q4 Release',
          status: 'on_track',
          progress: 88,
          tasksCompleted: 22,
          tasksTotal: 25,
          dueDate: '2026-01-31',
        },
      },
      {
        id: 'dash-tasks',
        type: 'TaskList',
        data: {
          title: 'Recent Tasks',
          tasks: [
            { id: 't1', title: 'Review PR #42', status: 'todo', priority: 'high' },
            { id: 't2', title: 'Update docs', status: 'in_progress', priority: 'medium' },
            { id: 't3', title: 'Deploy staging', status: 'done', priority: 'high' },
          ],
        },
      },
      {
        id: 'dash-metrics',
        type: 'Metrics',
        data: {
          title: 'Quick Stats',
          metrics: [
            { label: 'Active Projects', value: 156, change: { value: 5, direction: 'up' }, icon: 'chart' },
            { label: 'Team Members', value: 24, icon: 'users' },
          ],
        },
      },
      {
        id: 'dash-alerts',
        type: 'Alert',
        data: {
          severity: 'warning',
          title: 'Rate Limit Warning',
          message: 'API rate limit approaching 80% of daily quota.',
          action: { label: 'View Usage', href: '/settings/usage' },
        },
      },
    ],
  },
  {
    name: 'dashboard-all-widgets-healthy',
    description: 'Dashboard showing all positive/healthy states',
    widgets: [
      {
        id: 'dash-project-healthy',
        type: 'ProjectStatus',
        data: {
          projectId: 'proj_healthy',
          projectName: 'Successful Launch',
          status: 'on_track',
          progress: 95,
          tasksCompleted: 19,
          tasksTotal: 20,
          dueDate: '2026-02-01',
        },
      },
      {
        id: 'dash-metrics-healthy',
        type: 'Metrics',
        data: {
          metrics: [
            { label: 'Revenue', value: '$125K', change: { value: 15, direction: 'up' }, icon: 'chart' },
            { label: 'Users', value: '12.5K', change: { value: 8, direction: 'up' }, icon: 'users' },
          ],
        },
      },
      {
        id: 'dash-alert-success',
        type: 'Alert',
        data: {
          severity: 'success',
          title: 'All Systems Operational',
          message: 'All services are running smoothly with 99.9% uptime.',
        },
      },
    ],
  },
  {
    name: 'dashboard-all-widgets-warning',
    description: 'Dashboard showing all warning/at-risk states',
    widgets: [
      {
        id: 'dash-project-risk',
        type: 'ProjectStatus',
        data: {
          projectId: 'proj_risk',
          projectName: 'Delayed Project',
          status: 'at_risk',
          progress: 40,
          tasksCompleted: 8,
          tasksTotal: 20,
          dueDate: '2026-01-05',
        },
      },
      {
        id: 'dash-metrics-warning',
        type: 'Metrics',
        data: {
          metrics: [
            { label: 'Response Time', value: '2.5s', change: { value: 25, direction: 'down' }, icon: 'clock' },
            { label: 'Error Rate', value: '5%', change: { value: 2, direction: 'down' }, icon: 'activity' },
          ],
        },
      },
      {
        id: 'dash-alert-warning',
        type: 'Alert',
        data: {
          severity: 'warning',
          title: 'Performance Degradation',
          message: 'Response times have increased by 25% in the last hour.',
          action: { label: 'View Metrics', href: '/monitoring' },
        },
      },
    ],
  },
  {
    name: 'dashboard-empty',
    description: 'Dashboard with no widgets (empty state)',
    widgets: [],
  },
];

// ============================================
// Visual Test Suite
// ============================================

test.describe('Widget Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Mock agent health to prevent connection errors
    await mockAgentHealth(page, true);

    // Skip Percy in local runs without PERCY_TOKEN
    if (!process.env.PERCY_TOKEN && !process.env.CI) {
      test.skip(true, 'PERCY_TOKEN not set - skipping visual tests');
    }
  });

  // ============================================
  // TaskList Widget Visual Tests (DM-11.7)
  // ============================================
  test.describe('TaskListWidget States', () => {
    for (const state of taskListStates) {
      test(`${state.name}: ${state.description}`, async ({ page }) => {
        await mockDashboardWidgets(page, state.widgets);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Wait for widgets to render
        const widgetGrid = page.getByTestId('dashboard-grid');
        await expect(widgetGrid).toBeVisible({ timeout: 15000 });

        // Take Percy snapshot
        await percySnapshot(page, `Widget: ${state.name}`);
      });
    }
  });

  // ============================================
  // Metrics Widget Visual Tests (DM-11.7)
  // ============================================
  test.describe('MetricsWidget States', () => {
    for (const state of metricsWidgetStates) {
      test(`${state.name}: ${state.description}`, async ({ page }) => {
        await mockDashboardWidgets(page, state.widgets);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        const widgetGrid = page.getByTestId('dashboard-grid');
        await expect(widgetGrid).toBeVisible({ timeout: 15000 });

        await percySnapshot(page, `Widget: ${state.name}`);
      });
    }
  });

  // ============================================
  // Alert Widget Visual Tests (DM-11.7)
  // ============================================
  test.describe('AlertWidget States', () => {
    for (const state of alertWidgetStates) {
      test(`${state.name}: ${state.description}`, async ({ page }) => {
        await mockDashboardWidgets(page, state.widgets);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        const widgetGrid = page.getByTestId('dashboard-grid');
        await expect(widgetGrid).toBeVisible({ timeout: 15000 });

        await percySnapshot(page, `Widget: ${state.name}`);
      });
    }
  });

  // ============================================
  // ProjectStatus Widget Visual Tests (DM-11.7)
  // ============================================
  test.describe('ProjectStatusWidget States', () => {
    for (const state of projectStatusStates) {
      test(`${state.name}: ${state.description}`, async ({ page }) => {
        await mockDashboardWidgets(page, state.widgets);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        const widgetGrid = page.getByTestId('dashboard-grid');
        await expect(widgetGrid).toBeVisible({ timeout: 15000 });

        await percySnapshot(page, `Widget: ${state.name}`);
      });
    }
  });

  // ============================================
  // Progress Indicator Visual Tests
  // ============================================
  test.describe('ProgressIndicator States', () => {
    for (const state of progressIndicatorStates) {
      test(`${state.name}: ${state.description}`, async ({ page }) => {
        await mockDashboardWidgets(page, state.widgets);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        const widgetGrid = page.getByTestId('dashboard-grid');
        await expect(widgetGrid).toBeVisible({ timeout: 15000 });

        await percySnapshot(page, `Widget: ${state.name}`);
      });
    }
  });

  // ============================================
  // Dashboard Combined Views (DM-11.7)
  // ============================================
  test.describe('Dashboard Combined Views', () => {
    for (const state of dashboardStates) {
      test(`${state.name}: ${state.description}`, async ({ page }) => {
        await mockDashboardWidgets(page, state.widgets);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // For empty state, look for the grid or empty placeholder
        const widgetGrid = page.getByTestId('dashboard-grid');
        await expect(widgetGrid).toBeVisible({ timeout: 15000 });

        await percySnapshot(page, `Dashboard: ${state.name}`);
      });
    }
  });

  // ============================================
  // Loading State Visual Test
  // ============================================
  test.describe('Loading States', () => {
    test('dashboard-loading: Loading skeleton state', async ({ page }) => {
      // Mock slow network to capture loading state
      await page.route('**/api/dashboard/widgets**', async (route) => {
        // Delay long enough to capture loading state
        await new Promise((resolve) => setTimeout(resolve, 100));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ widgets: [] }),
        });
      });

      await page.goto('/dashboard');
      // Don't wait for network idle - we want to capture loading state
      await page.waitForLoadState('domcontentloaded');

      // Take snapshot quickly before loading completes
      await percySnapshot(page, 'Dashboard: loading-state', {
        // Reduce widths for loading state test
        widths: [1280],
      });
    });
  });

  // ============================================
  // Error State Visual Test
  // ============================================
  test.describe('Error States', () => {
    test('dashboard-error: Error widget state', async ({ page }) => {
      await mockDashboardWidgets(page, [
        {
          id: 'error-widget-1',
          type: 'error',
          data: {
            message: 'Failed to load widget data',
            retryable: true,
          },
        },
      ]);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const widgetGrid = page.getByTestId('dashboard-grid');
      await expect(widgetGrid).toBeVisible({ timeout: 15000 });

      await percySnapshot(page, 'Widget: error-state');
    });

    test('dashboard-api-error: API failure state', async ({ page }) => {
      // Mock API error
      await page.route('**/api/dashboard/widgets**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Wait a moment for error state to render
      await page.waitForTimeout(1000);

      await percySnapshot(page, 'Dashboard: api-error-state');
    });
  });
});
