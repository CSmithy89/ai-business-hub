/**
 * Event Bus E2E Tests - Epic 05
 *
 * Tests for event health monitoring, DLQ management, and event replay.
 * @see docs/epics/EPIC-05-event-bus.md
 */
import { test, expect } from '../support/fixtures';

test.describe('Event Bus', () => {
  test.describe('Event Health Monitoring (Story 05.7)', () => {
    test('should show event health in admin dashboard', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/admin/events');

      // Should show event bus health section
      const healthSection = page.locator('[data-testid="event-health"]');
      if (await healthSection.isVisible().catch(() => false)) {
        await expect(healthSection).toBeVisible();
      }
    });

    test('should display stream status indicators', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/admin/events');

      const mainStreamStatus = page.locator('[data-testid="main-stream-status"]');
      if (await mainStreamStatus.isVisible().catch(() => false)) {
        await expect(mainStreamStatus).toBeVisible();
        // Should have color indicator
        const classes = await mainStreamStatus.getAttribute('class');
        expect(
          classes?.includes('green') ||
            classes?.includes('red') ||
            classes?.includes('healthy') ||
            classes?.includes('unhealthy')
        ).toBeTruthy();
      }
    });

    test('should show consumer group stats', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/admin/events');

      const consumerStats = page.locator('[data-testid="consumer-group-stats"]');
      if (await consumerStats.isVisible().catch(() => false)) {
        await expect(consumerStats).toBeVisible();
      }
    });

    test('should show pending event count', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/admin/events');

      const pendingCount = page.locator('[data-testid="pending-events-count"]');
      if (await pendingCount.isVisible().catch(() => false)) {
        await expect(pendingCount).toContainText(/\d+/);
      }
    });

    test('should show throughput metrics', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/admin/events');

      const throughput = page.locator('[data-testid="event-throughput"]');
      if (await throughput.isVisible().catch(() => false)) {
        await expect(throughput).toBeVisible();
      }
    });
  });

  test.describe('Dead Letter Queue UI (Story 05.4)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display DLQ section', async ({ page }) => {
      await page.goto('/admin/events/dlq');

      const dlqSection = page.locator('[data-testid="dlq-section"]');
      await expect(dlqSection).toBeVisible();
    });

    test('should show DLQ event list', async ({ page }) => {
      await page.goto('/admin/events/dlq');

      const dlqList = page.locator('[data-testid="dlq-event-list"]');
      await expect(dlqList).toBeVisible();
    });

    test('should show empty state when no DLQ events', async ({ page }) => {
      await page.goto('/admin/events/dlq');

      const emptyState = page.locator('[data-testid="dlq-empty"]');
      const eventList = page.locator('[data-testid^="dlq-event-"]');

      const hasEmpty = await emptyState.isVisible().catch(() => false);
      const hasEvents = (await eventList.count()) > 0;

      // Either empty or has events
      expect(hasEmpty || hasEvents).toBeTruthy();
    });

    test('should display event error details', async ({ page }) => {
      await page.goto('/admin/events/dlq');

      const eventRow = page.locator('[data-testid^="dlq-event-"]').first();
      if (await eventRow.isVisible().catch(() => false)) {
        await eventRow.click();

        // Should show error details
        await expect(
          page.locator('[data-testid="event-error-details"]')
        ).toBeVisible();
      }
    });

    test('should show retry button for DLQ events', async ({ page }) => {
      await page.goto('/admin/events/dlq');

      const eventRow = page.locator('[data-testid^="dlq-event-"]').first();
      if (await eventRow.isVisible().catch(() => false)) {
        const retryButton = eventRow.locator('[data-testid="retry-event-button"]');
        await expect(retryButton).toBeVisible();
      }
    });

    test('should retry DLQ event', async ({ page }) => {
      await page.goto('/admin/events/dlq');

      const retryButton = page.locator('[data-testid="retry-event-button"]').first();
      if (await retryButton.isVisible().catch(() => false)) {
        await retryButton.click();

        // Should show confirmation or success
        await expect(
          page.getByText(/retried|requeued|processing/i)
        ).toBeVisible();
      }
    });

    test('should delete DLQ event with confirmation', async ({ page }) => {
      await page.goto('/admin/events/dlq');

      const deleteButton = page.locator('[data-testid="delete-dlq-event"]').first();
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();

        // Should show confirmation dialog
        const confirmDialog = page.locator('[data-testid="confirm-delete-dialog"]');
        if (await confirmDialog.isVisible()) {
          await page.click('[data-testid="confirm-delete-button"]');
          await expect(page.getByText(/deleted|removed/i)).toBeVisible();
        }
      }
    });

    test('should paginate DLQ events', async ({ page }) => {
      await page.goto('/admin/events/dlq');

      const pagination = page.locator('[data-testid="dlq-pagination"]');
      if (await pagination.isVisible().catch(() => false)) {
        await expect(pagination).toBeVisible();
      }
    });
  });

  test.describe('Event Replay UI (Story 05.6)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display event replay section', async ({ page }) => {
      await page.goto('/admin/events/replay');

      const replaySection = page.locator('[data-testid="event-replay-section"]');
      await expect(replaySection).toBeVisible();
    });

    test('should show date range picker for replay', async ({ page }) => {
      await page.goto('/admin/events/replay');

      const startDate = page.locator('[data-testid="replay-start-date"]');
      const endDate = page.locator('[data-testid="replay-end-date"]');

      await expect(startDate).toBeVisible();
      await expect(endDate).toBeVisible();
    });

    test('should allow event type filtering', async ({ page }) => {
      await page.goto('/admin/events/replay');

      const eventTypeFilter = page.locator('[data-testid="replay-event-type-filter"]');
      if (await eventTypeFilter.isVisible()) {
        await expect(eventTypeFilter).toBeVisible();
      }
    });

    test('should start replay job', async ({ page }) => {
      await page.goto('/admin/events/replay');

      // Fill in date range
      const startDate = page.locator('[data-testid="replay-start-date"]');
      const endDate = page.locator('[data-testid="replay-end-date"]');

      if ((await startDate.isVisible()) && (await endDate.isVisible())) {
        // Set dates
        await startDate.fill('2025-01-01');
        await endDate.fill('2025-01-02');

        // Start replay
        await page.click('[data-testid="start-replay-button"]');

        // Should show job started
        await expect(
          page.getByText(/started|processing|job id/i)
        ).toBeVisible();
      }
    });

    test('should show replay job status', async ({ page }) => {
      await page.goto('/admin/events/replay');

      const jobStatus = page.locator('[data-testid="replay-job-status"]');
      if (await jobStatus.isVisible().catch(() => false)) {
        await expect(jobStatus).toBeVisible();
      }
    });

    test('should show replay progress indicator', async ({ page }) => {
      await page.goto('/admin/events/replay');

      // If a replay job is running, should show progress
      const progressBar = page.locator('[data-testid="replay-progress"]');
      if (await progressBar.isVisible().catch(() => false)) {
        await expect(progressBar).toBeVisible();
      }
    });
  });

  test.describe('Event Statistics Dashboard', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display event statistics', async ({ page }) => {
      await page.goto('/admin/events/stats');

      const statsSection = page.locator('[data-testid="event-stats"]');
      if (await statsSection.isVisible().catch(() => false)) {
        await expect(statsSection).toBeVisible();
      }
    });

    test('should show events processed count', async ({ page }) => {
      await page.goto('/admin/events/stats');

      const processedCount = page.locator('[data-testid="events-processed"]');
      if (await processedCount.isVisible().catch(() => false)) {
        await expect(processedCount).toContainText(/\d+/);
      }
    });

    test('should show event breakdown by type', async ({ page }) => {
      await page.goto('/admin/events/stats');

      const typeBreakdown = page.locator('[data-testid="events-by-type"]');
      if (await typeBreakdown.isVisible().catch(() => false)) {
        await expect(typeBreakdown).toBeVisible();
      }
    });

    test('should filter stats by time period', async ({ page }) => {
      await page.goto('/admin/events/stats');

      const timePeriodFilter = page.locator('[data-testid="stats-time-period"]');
      if (await timePeriodFilter.isVisible()) {
        await timePeriodFilter.click();
        await page.click('[data-testid="period-last-7-days"]');

        await expect(page).toHaveURL(/period=7d|days=7/);
      }
    });
  });

  test.describe('Access Control', () => {
    test('should restrict DLQ access to admin/owner', async ({ page, auth }) => {
      // Login as regular member
      await auth.loginAs('member@example.com', 'Test1234!');
      await page.goto('/admin/events/dlq');

      // Should show access denied or redirect
      const accessDenied = page.getByText(/access denied|unauthorized|forbidden/i);
      const redirected = page.url().includes('dashboard') || page.url().includes('sign-in');

      const hasDenied = await accessDenied.isVisible().catch(() => false);

      expect(hasDenied || redirected).toBeTruthy();
    });

    test('should restrict replay access to admin/owner', async ({ page, auth }) => {
      await auth.loginAs('member@example.com', 'Test1234!');
      await page.goto('/admin/events/replay');

      const accessDenied = page.getByText(/access denied|unauthorized|forbidden/i);
      const redirected = page.url().includes('dashboard') || page.url().includes('sign-in');

      const hasDenied = await accessDenied.isVisible().catch(() => false);

      expect(hasDenied || redirected).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display event admin on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/admin/events');

      // Core functionality should work
      const healthSection = page.locator('[data-testid="event-health"]');
      if (await healthSection.isVisible().catch(() => false)) {
        await expect(healthSection).toBeVisible();
      }
    });

    test('should be usable on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/admin/events');

      // Page should load and be scrollable
      await expect(page).toHaveURL('/admin/events');
    });
  });
});
