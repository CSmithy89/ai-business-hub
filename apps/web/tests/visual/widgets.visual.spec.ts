/**
 * Widget Visual Regression Tests - Story DM-09.5
 *
 * Visual regression testing for dashboard widget components using Percy.
 * Since Storybook is not installed, we test components in the context of
 * real pages with mocked API data.
 *
 * @see docs/modules/bm-dm/stories/dm-09-5-visual-regression-tests.md
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
 */
interface WidgetStateConfig {
  name: string;
  description: string;
  widgets: unknown[];
}

// ============================================
// Task Card States
// ============================================
const taskCardStates: WidgetStateConfig[] = [
  {
    name: 'task-card-pending',
    description: 'TaskCard in pending state',
    widgets: [
      {
        id: 'task-pending',
        type: 'task-list',
        data: {
          title: 'Pending Tasks',
          tasks: [
            { id: 't1', title: 'Review document', status: 'pending', priority: 'LOW', type: 'TASK' },
            { id: 't2', title: 'Update settings', status: 'pending', priority: 'MEDIUM', type: 'TASK' },
          ],
        },
      },
    ],
  },
  {
    name: 'task-card-in-progress',
    description: 'TaskCard with in-progress tasks',
    widgets: [
      {
        id: 'task-progress',
        type: 'task-list',
        data: {
          title: 'Active Tasks',
          tasks: [
            { id: 't1', title: 'Implement feature', status: 'in_progress', priority: 'HIGH', type: 'TASK' },
            { id: 't2', title: 'Code review', status: 'in_progress', priority: 'MEDIUM', type: 'TASK' },
          ],
        },
      },
    ],
  },
  {
    name: 'task-card-completed',
    description: 'TaskCard with completed tasks',
    widgets: [
      {
        id: 'task-completed',
        type: 'task-list',
        data: {
          title: 'Completed Tasks',
          tasks: [
            { id: 't1', title: 'Deploy release', status: 'completed', priority: 'URGENT', type: 'TASK' },
            { id: 't2', title: 'Write documentation', status: 'completed', priority: 'LOW', type: 'TASK' },
          ],
        },
      },
    ],
  },
  {
    name: 'task-card-blocked',
    description: 'TaskCard with blocked tasks',
    widgets: [
      {
        id: 'task-blocked',
        type: 'task-list',
        data: {
          title: 'Blocked Tasks',
          tasks: [
            { id: 't1', title: 'Critical bug fix', status: 'blocked', priority: 'URGENT', type: 'BUG' },
            { id: 't2', title: 'Dependency update', status: 'blocked', priority: 'HIGH', type: 'TASK' },
          ],
        },
      },
    ],
  },
];

// ============================================
// Metrics Widget States
// ============================================
const metricsWidgetStates: WidgetStateConfig[] = [
  {
    name: 'metrics-positive-trend',
    description: 'MetricsWidget showing positive/upward trend',
    widgets: [
      {
        id: 'metrics-up',
        type: 'metrics',
        data: {
          value: 1234,
          label: 'Active Users',
          trend: 'up',
          trendValue: 12.5,
        },
      },
    ],
  },
  {
    name: 'metrics-negative-trend',
    description: 'MetricsWidget showing negative/downward trend',
    widgets: [
      {
        id: 'metrics-down',
        type: 'metrics',
        data: {
          value: 567,
          label: 'Bounce Rate',
          trend: 'down',
          trendValue: -8.2,
        },
      },
    ],
  },
  {
    name: 'metrics-stable',
    description: 'MetricsWidget showing stable/no change',
    widgets: [
      {
        id: 'metrics-stable',
        type: 'metrics',
        data: {
          value: 890,
          label: 'Conversion Rate',
          trend: 'stable',
          trendValue: 0,
        },
      },
    ],
  },
];

// ============================================
// Alert Widget States
// ============================================
const alertWidgetStates: WidgetStateConfig[] = [
  {
    name: 'alert-info',
    description: 'AlertWidget with info level',
    widgets: [
      {
        id: 'alert-info',
        type: 'alert',
        data: {
          level: 'info',
          message: 'System maintenance scheduled for tonight',
          timestamp: new Date().toISOString(),
        },
      },
    ],
  },
  {
    name: 'alert-warning',
    description: 'AlertWidget with warning level',
    widgets: [
      {
        id: 'alert-warning',
        type: 'alert',
        data: {
          level: 'warning',
          message: 'Low disk space detected on server',
          timestamp: new Date().toISOString(),
        },
      },
    ],
  },
  {
    name: 'alert-error',
    description: 'AlertWidget with error level',
    widgets: [
      {
        id: 'alert-error',
        type: 'alert',
        data: {
          level: 'error',
          message: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
      },
    ],
  },
];

// ============================================
// Project Status Widget States
// ============================================
const projectStatusStates: WidgetStateConfig[] = [
  {
    name: 'project-healthy',
    description: 'ProjectStatus showing healthy state',
    widgets: [
      {
        id: 'project-healthy',
        type: 'project-status',
        data: {
          health: 'healthy',
          score: 95,
          projectName: 'Website Redesign',
          tasksCompleted: 48,
          totalTasks: 50,
        },
      },
    ],
  },
  {
    name: 'project-warning',
    description: 'ProjectStatus showing at-risk state',
    widgets: [
      {
        id: 'project-warning',
        type: 'project-status',
        data: {
          health: 'warning',
          score: 65,
          projectName: 'Mobile App Development',
          tasksCompleted: 20,
          totalTasks: 35,
        },
      },
    ],
  },
  {
    name: 'project-critical',
    description: 'ProjectStatus showing critical state',
    widgets: [
      {
        id: 'project-critical',
        type: 'project-status',
        data: {
          health: 'critical',
          score: 30,
          projectName: 'Backend Migration',
          tasksCompleted: 5,
          totalTasks: 40,
        },
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
// Combined Dashboard States
// ============================================
const dashboardStates: WidgetStateConfig[] = [
  {
    name: 'dashboard-full',
    description: 'Full dashboard with multiple widget types',
    widgets: [
      {
        id: 'dash-tasks',
        type: 'task-list',
        data: {
          title: 'Recent Tasks',
          tasks: [
            { id: 't1', title: 'Review PR #42', status: 'pending', priority: 'HIGH', type: 'TASK' },
            { id: 't2', title: 'Update docs', status: 'in_progress', priority: 'MEDIUM', type: 'TASK' },
          ],
        },
      },
      {
        id: 'dash-metrics',
        type: 'metrics',
        data: {
          value: 156,
          label: 'Active Projects',
          trend: 'up',
          trendValue: 5,
        },
      },
      {
        id: 'dash-alerts',
        type: 'alert',
        data: {
          level: 'warning',
          message: 'API rate limit approaching',
          timestamp: new Date().toISOString(),
        },
      },
      {
        id: 'dash-project',
        type: 'project-status',
        data: {
          health: 'healthy',
          score: 88,
          projectName: 'Q4 Release',
          tasksCompleted: 22,
          totalTasks: 25,
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
  // Task Card Visual Tests
  // ============================================
  test.describe('TaskCard States', () => {
    for (const state of taskCardStates) {
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
  // Metrics Widget Visual Tests
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
  // Alert Widget Visual Tests
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
  // Project Status Visual Tests
  // ============================================
  test.describe('ProjectStatus States', () => {
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
  // Dashboard Combined Views
  // ============================================
  test.describe('Dashboard Views', () => {
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
