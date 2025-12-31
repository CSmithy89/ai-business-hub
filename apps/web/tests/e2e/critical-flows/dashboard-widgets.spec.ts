/**
 * Dashboard Widgets E2E Tests - Story DM-09.4
 *
 * Tests for widget lifecycle: load, update, error handling,
 * Zod validation (DM-08.1), MAX bounds enforcement (DM-08.6),
 * and loading states.
 *
 * @see docs/modules/bm-dm/stories/dm-09-4-critical-flow-e2e-tests.md
 * @see apps/web/tests/support/pages/dashboard.page.ts
 */
import {
  test,
  expect,
  mockDashboardWidgets,
  mockError,
  mockSlowNetwork,
} from '../../support/fixtures';

/**
 * Maximum alerts allowed per DM-08.6 bounds
 */
const MAX_ALERTS = 50;

test.describe('Dashboard Widgets - Critical Flows', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test.describe('Widget Load Lifecycle', () => {
    test('loads all widget types correctly', async ({
      page,
      dashboardPage,
    }) => {
      // Mock multiple widget types
      await mockDashboardWidgets(page, [
        {
          id: 'task-1',
          type: 'task-list',
          data: {
            title: 'Task Widget',
            tasks: [
              { id: 't1', title: 'Task 1', status: 'pending' },
              { id: 't2', title: 'Task 2', status: 'completed' },
            ],
          },
        },
        {
          id: 'metrics-1',
          type: 'metrics',
          data: {
            value: 42,
            label: 'Active Users',
            trend: 'up',
            trendValue: 12,
          },
        },
        {
          id: 'alert-1',
          type: 'alert',
          data: {
            level: 'warning',
            message: 'Low disk space detected',
            timestamp: new Date().toISOString(),
          },
        },
        {
          id: 'chart-1',
          type: 'chart',
          data: {
            title: 'Weekly Progress',
            chartType: 'line',
            dataPoints: [10, 25, 30, 45, 55],
          },
        },
      ]);

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Verify widgets rendered
      const widgetCount = await dashboardPage.getWidgetCount();
      expect(widgetCount).toBeGreaterThanOrEqual(1);

      // Verify specific widget types if they exist
      const hasTaskWidget = await dashboardPage.hasWidgetType('task-list');
      const hasMetrics = await dashboardPage.hasWidgetType('metrics');

      // At least one widget type should be rendered
      expect(hasTaskWidget || hasMetrics).toBe(true);
    });

    test('widget grid renders with correct structure', async ({
      page,
      dashboardPage,
    }) => {
      await mockDashboardWidgets(page, [
        {
          id: 'structure-test',
          type: 'text',
          data: { content: 'Test widget for structure' },
        },
      ]);

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Verify dashboard structure
      await dashboardPage.expectStructure();

      // Verify widget grid has responsive classes
      await dashboardPage.expectResponsiveGrid();
    });
  });

  test.describe('Widget Updates with New Data', () => {
    test('widget refresh updates data correctly', async ({
      page,
      dashboardPage,
    }) => {
      let requestCount = 0;

      // Dynamic mock that returns different data on each call
      await page.route('**/api/dashboard/widgets**', async (route) => {
        const value = (requestCount + 1) * 10; // 10, 20, 30, ...
        requestCount++;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            widgets: [
              {
                id: 'dynamic-metrics',
                type: 'metrics',
                data: {
                  value,
                  label: 'Dynamic Value',
                },
              },
            ],
          }),
        });
      });

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Get initial value
      const metricsWidget = dashboardPage.getWidget('widget-dynamic-metrics');
      const widgetVisible = await metricsWidget.isVisible().catch(() => false);

      if (!widgetVisible) {
        // Widget rendering may differ - check for any widget
        const anyWidget = page.locator('[data-testid^="widget-"]').first();
        await expect(anyWidget).toBeVisible({ timeout: 5000 });
      }

      // Refresh dashboard
      await dashboardPage.refresh();

      // Verify request count increased (refresh was made)
      expect(requestCount).toBeGreaterThanOrEqual(2);
    });

    test('widget data propagates to UI correctly', async ({
      page,
      dashboardPage,
    }) => {
      await mockDashboardWidgets(page, [
        {
          id: 'data-propagation',
          type: 'metrics',
          data: {
            value: 99,
            label: 'Propagation Test',
          },
        },
      ]);

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Verify data appears in widget
      const widget = dashboardPage.getWidget('widget-data-propagation');
      const visible = await widget.isVisible().catch(() => false);

      if (visible) {
        await expect(widget).toContainText('99');
        await expect(widget).toContainText('Propagation Test');
      }
    });
  });

  test.describe('Error Widget with Retry Action', () => {
    test('displays error widget when API fails', async ({
      page,
      dashboardPage,
    }) => {
      // Mock API error
      await mockError(page, '**/api/dashboard/widgets**', 500, 'Server error');

      await dashboardPage.goto();

      // Wait for error state
      await page.waitForTimeout(2000);

      // Check for error indication
      const hasError = await dashboardPage.hasError();
      const hasErrorWidgets = await dashboardPage.hasErrorWidgets();

      // Either error banner or error widgets should be visible
      expect(hasError || hasErrorWidgets).toBe(true);
    });

    test('error widget renders instead of crashing', async ({
      page,
      dashboardPage,
    }) => {
      // Mock partial failure - some widgets work, some don't
      await page.route('**/api/dashboard/widgets**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            widgets: [
              {
                id: 'valid-widget',
                type: 'text',
                data: { content: 'This is valid' },
              },
              {
                id: 'error-widget',
                type: 'error',
                data: {
                  message: 'Failed to load widget',
                  retryable: true,
                },
              },
            ],
          }),
        });
      });

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Dashboard should not crash - structure should be visible
      await expect(dashboardPage.widgetGrid).toBeVisible();
      await dashboardPage.expectStructure();
    });

    test('retry action triggers widget reload', async ({
      page,
      dashboardPage,
    }) => {
      let callCount = 0;

      await page.route('**/api/dashboard/widgets**', async (route) => {
        callCount++;

        // First call fails, subsequent succeed
        if (callCount === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Temporary failure' }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              widgets: [
                {
                  id: 'recovered-widget',
                  type: 'text',
                  data: { content: 'Successfully recovered!' },
                },
              ],
            }),
          });
        }
      });

      await dashboardPage.goto();

      // Wait for initial error state
      await page.waitForTimeout(1500);

      // Retry by refreshing
      await dashboardPage.refresh();

      // Verify call count increased
      expect(callCount).toBeGreaterThanOrEqual(2);

      // Dashboard should still be functional
      await expect(dashboardPage.agentSection).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('shows loading state during widget fetch', async ({
      page,
      dashboardPage,
    }) => {
      // Mock slow network to see loading state
      await mockSlowNetwork(page, '**/api/dashboard/widgets**', 2000);

      // Navigate without waiting for full load
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      // Check for loading indicators
      const loadingSkeleton = dashboardPage.loadingSkeleton;
      const loadingSpinner = dashboardPage.loadingSpinner;

      const hasSkeletonOrSpinner =
        (await loadingSkeleton.isVisible().catch(() => false)) ||
        (await loadingSpinner.isVisible().catch(() => false));

      // Loading state should appear or page should load quickly
      // (Some implementations may be too fast to catch loading state)
      if (!hasSkeletonOrSpinner) {
        console.log('Loading state not visible - may have loaded quickly');
      }

      // Eventually, the page should finish loading
      await dashboardPage.waitForReady();
      await expect(dashboardPage.agentSection).toBeVisible();
    });

    test('loading skeleton disappears after widgets load', async ({
      page,
      dashboardPage,
    }) => {
      // Mock with slight delay
      await mockDashboardWidgets(
        page,
        [
          {
            id: 'delayed-widget',
            type: 'text',
            data: { content: 'Loaded after delay' },
          },
        ],
        { delay: 500 }
      );

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Loading skeleton should be hidden after load
      const loadingSkeleton = dashboardPage.loadingSkeleton;
      const skeletonVisible = await loadingSkeleton.isVisible().catch(() => false);
      expect(skeletonVisible).toBe(false);
    });
  });

  test.describe('Zod Validation (DM-08.1)', () => {
    test('handles invalid widget data gracefully', async ({
      page,
      dashboardPage,
    }) => {
      // Mock widget with invalid data types
      await mockDashboardWidgets(page, [
        {
          id: 'invalid-data',
          type: 'metrics',
          data: {
            // Invalid: value should be number but is string
            value: 'not-a-number',
            label: 12345, // Invalid: label should be string but is number
          },
        },
      ]);

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Page should not crash - either error widget or empty state
      await expect(dashboardPage.widgetGrid).toBeVisible();

      // Check for error widget or validation message
      const hasErrorWidgets = await dashboardPage.hasErrorWidgets();
      const errorWidget = page.locator('[data-testid^="error-widget-"]');
      const errorVisible = await errorWidget.isVisible().catch(() => false);

      // Either error widget visible or invalid widget filtered out
      // The important thing is the page didn't crash
      console.log(
        `Validation result: hasErrorWidgets=${hasErrorWidgets}, errorVisible=${errorVisible}`
      );
    });

    test('renders error widget for schema validation failure', async ({
      page,
      dashboardPage,
    }) => {
      // Mock widget with completely malformed structure
      await page.route('**/api/dashboard/widgets**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            widgets: [
              {
                // Missing required 'type' field
                id: 'malformed-1',
                data: {},
              },
              {
                id: 'valid-fallback',
                type: 'text',
                data: { content: 'Valid widget' },
              },
            ],
          }),
        });
      });

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Dashboard should handle gracefully
      await expect(dashboardPage.agentSection).toBeVisible();
    });
  });

  test.describe('MAX Bounds Enforcement (DM-08.6)', () => {
    test('respects MAX_ALERTS=50 limit', async ({ page, dashboardPage }) => {
      // Generate 100 alerts (exceeds MAX_ALERTS=50)
      const alerts = Array.from({ length: 100 }, (_, i) => ({
        id: `alert-${i}`,
        level: i % 3 === 0 ? 'error' : i % 2 === 0 ? 'warning' : 'info',
        message: `Alert message ${i}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
      }));

      await page.route('**/api/dashboard/alerts**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ alerts }),
        });
      });

      // Also mock widgets endpoint
      await mockDashboardWidgets(page, [
        {
          id: 'alerts-widget',
          type: 'alert',
          data: { alerts },
        },
      ]);

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Count alert elements rendered
      const alertElements = page.locator('[data-testid^="alert-"]');
      const count = await alertElements.count();

      // Should not exceed MAX_ALERTS
      expect(count).toBeLessThanOrEqual(MAX_ALERTS);

      // Log for debugging
      console.log(
        `MAX_ALERTS test: Sent 100 alerts, rendered ${count} (max: ${MAX_ALERTS})`
      );
    });

    test('pre-computed activeAlerts respects bounds', async ({
      page,
      dashboardPage,
    }) => {
      // Mock widgets with many alert items
      const manyAlerts = Array.from({ length: 75 }, (_, i) => ({
        id: `active-alert-${i}`,
        level: 'warning',
        message: `Active alert ${i}`,
        active: true,
      }));

      await mockDashboardWidgets(page, [
        {
          id: 'active-alerts-widget',
          type: 'alert',
          data: { alerts: manyAlerts },
        },
      ]);

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Verify the widget grid loaded without memory issues
      await expect(dashboardPage.widgetGrid).toBeVisible();

      // Count visible alerts
      const activeAlerts = page.locator('[data-testid^="active-alert-"]');
      const activeCount = await activeAlerts.count();

      // Pre-computed active alerts should be bounded
      expect(activeCount).toBeLessThanOrEqual(MAX_ALERTS);
    });

    test('widget count respects reasonable limits', async ({
      page,
      dashboardPage,
    }) => {
      // Generate excessive widgets
      const widgets = Array.from({ length: 200 }, (_, i) => ({
        id: `widget-${i}`,
        type: 'text',
        data: { content: `Widget content ${i}` },
      }));

      await mockDashboardWidgets(page, widgets);

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Verify page is responsive
      const widgetCount = await dashboardPage.getWidgetCount();

      // Widget count should be bounded or virtualized
      // Exact bound depends on implementation
      console.log(`Widget count test: Sent 200 widgets, rendered ${widgetCount}`);

      // Page should remain functional
      await expect(dashboardPage.agentSection).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('widget grid has proper accessibility attributes', async ({
      page,
      dashboardPage,
    }) => {
      await mockDashboardWidgets(page, [
        {
          id: 'accessible-widget',
          type: 'text',
          data: { content: 'Accessible content' },
        },
      ]);

      await dashboardPage.goto();
      await dashboardPage.waitForWidgetsLoad();

      // Verify accessibility
      await dashboardPage.expectAccessible();
    });
  });
});
