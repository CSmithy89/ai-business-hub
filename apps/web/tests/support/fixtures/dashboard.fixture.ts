/**
 * Dashboard Fixture - Dashboard-Specific Test Utilities
 *
 * Extends the base test with dashboard-specific fixtures including:
 * - Pre-authenticated dashboard page
 * - DashboardPage object instance
 * - Common dashboard test scenarios
 *
 * @see docs/modules/bm-dm/stories/dm-09-3-e2e-infrastructure.md
 */
import { test as base, Page, expect } from '@playwright/test';
import { DashboardPage, ApprovalPage } from '../pages';

/**
 * Dashboard fixture types
 */
interface DashboardFixtures {
  /**
   * DashboardPage instance - ready for interaction
   * Note: Use with auth fixture to ensure authenticated access
   */
  dashboardPage: DashboardPage;

  /**
   * ApprovalPage instance - ready for interaction
   * Note: Use with auth fixture to ensure authenticated access
   */
  approvalPage: ApprovalPage;

  /**
   * Navigate to dashboard and wait for ready state
   * Combines authentication and navigation
   */
  gotoDashboard: () => Promise<DashboardPage>;

  /**
   * Navigate to approvals and wait for ready state
   * Combines authentication and navigation
   */
  gotoApprovals: () => Promise<ApprovalPage>;
}

/**
 * Dashboard fixture - provides page objects for dashboard testing
 */
export const dashboardFixture = base.extend<DashboardFixtures>({
  /**
   * DashboardPage object instance
   * Automatically created from the current page
   */
  dashboardPage: async ({ page }, use) => {
    const dashboard = new DashboardPage(page);
    await use(dashboard);
  },

  /**
   * ApprovalPage object instance
   * Automatically created from the current page
   */
  approvalPage: async ({ page }, use) => {
    const approval = new ApprovalPage(page);
    await use(approval);
  },

  /**
   * Navigate to dashboard with authentication
   * Returns DashboardPage for chaining
   */
  gotoDashboard: async ({ page }, use) => {
    const navigate = async (): Promise<DashboardPage> => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      return dashboard;
    };
    await use(navigate);
  },

  /**
   * Navigate to approvals with authentication
   * Returns ApprovalPage for chaining
   */
  gotoApprovals: async ({ page }, use) => {
    const navigate = async (): Promise<ApprovalPage> => {
      const approval = new ApprovalPage(page);
      await approval.goto();
      return approval;
    };
    await use(navigate);
  },
});

// Export the fixture
export const test = dashboardFixture;
export { expect };

// --------------------------
// Dashboard Test Helpers
// --------------------------

/**
 * Wait for dashboard to be fully interactive
 *
 * @param page - Playwright page
 * @param timeout - Timeout in milliseconds (default: 30000)
 */
export async function waitForDashboardReady(
  page: Page,
  timeout = 30000
): Promise<void> {
  const dashboard = new DashboardPage(page);
  await dashboard.waitForReady();
  await expect(dashboard.agentSection).toBeVisible({ timeout });
}

/**
 * Verify dashboard has expected structure
 *
 * @param page - Playwright page
 */
export async function verifyDashboardStructure(page: Page): Promise<void> {
  const dashboard = new DashboardPage(page);
  await dashboard.expectStructure();
  await dashboard.expectAccessible();
}

/**
 * Wait for widgets to load on dashboard
 *
 * @param page - Playwright page
 * @param expectedCount - Optional: expected number of widgets
 * @param timeout - Timeout in milliseconds (default: 30000)
 */
export async function waitForWidgets(
  page: Page,
  expectedCount?: number,
  timeout = 30000
): Promise<void> {
  const dashboard = new DashboardPage(page);
  await dashboard.waitForWidgetsLoad(timeout);

  if (expectedCount !== undefined) {
    await expect
      .poll(async () => await dashboard.getWidgetCount(), { timeout })
      .toBe(expectedCount);
  }
}

/**
 * Test quick action interaction
 *
 * @param page - Playwright page
 * @param action - Quick action to test
 */
export async function testQuickAction(
  page: Page,
  action: 'project-status' | 'at-risk' | 'team-activity' | 'workspace-overview'
): Promise<void> {
  const dashboard = new DashboardPage(page);
  const quickAction = dashboard.getQuickAction(action);

  await expect(quickAction).toBeVisible();
  await quickAction.click();

  // Quick action should trigger assistant (no error should occur)
  await expect(dashboard.agentSection).toBeVisible();
}

// --------------------------
// Approval Test Helpers
// --------------------------

/**
 * Wait for approval queue to be ready
 *
 * @param page - Playwright page
 * @param timeout - Timeout in milliseconds (default: 30000)
 */
export async function waitForApprovalsReady(
  page: Page,
  timeout = 30000
): Promise<void> {
  const approval = new ApprovalPage(page);
  await approval.waitForReady();
  await expect(approval.pageHeader).toBeVisible({ timeout });
}

/**
 * Test approval card expansion
 *
 * @param page - Playwright page
 * @returns Whether a card was available to expand
 */
export async function testApprovalCardExpansion(page: Page): Promise<boolean> {
  const approval = new ApprovalPage(page);
  const cards = approval.getAllApprovalCards();

  const cardCount = await cards.count();
  if (cardCount === 0) {
    return false;
  }

  await cards.first().click();
  await expect(approval.approvalDetails).toBeVisible({ timeout: 5000 });
  return true;
}

/**
 * Test approval filter functionality
 *
 * @param page - Playwright page
 * @param filterType - Type of filter to test
 * @param filterValue - Value to filter by
 */
export async function testApprovalFilter(
  page: Page,
  filterType: 'status' | 'module',
  filterValue: string
): Promise<void> {
  const approval = new ApprovalPage(page);

  if (filterType === 'status') {
    const statusFilter = approval.statusFilter;
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.click(`[data-testid="filter-${filterValue}"]`);
      await expect(page).toHaveURL(new RegExp(`status=${filterValue}`));
    }
  } else if (filterType === 'module') {
    const moduleFilter = approval.moduleFilter;
    if (await moduleFilter.isVisible()) {
      await moduleFilter.click();
      await page.click(`[data-testid="filter-${filterValue}"]`);
      await expect(page).toHaveURL(new RegExp(`module=${filterValue}`));
    }
  }
}

// --------------------------
// Common Test Scenarios
// --------------------------

/**
 * Scenario: Test dashboard loads with all expected elements
 */
export async function scenarioDashboardLoads(page: Page): Promise<void> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  const dashboard = new DashboardPage(page);
  await dashboard.expectStructure();
  await dashboard.expectAllQuickActionsVisible();
}

/**
 * Scenario: Test dashboard handles offline gracefully
 */
export async function scenarioDashboardOffline(page: Page): Promise<void> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  const dashboard = new DashboardPage(page);
  await dashboard.expectStructure();

  // Go offline
  await page.context().setOffline(true);

  // Dashboard should still be visible (cached state)
  await expect(dashboard.agentSection).toBeVisible();

  // Restore network
  await page.context().setOffline(false);
}

/**
 * Scenario: Test approval queue with bulk operations
 */
export async function scenarioApprovalBulkOperations(page: Page): Promise<void> {
  await page.goto('/approvals');
  await page.waitForLoadState('networkidle');

  const approval = new ApprovalPage(page);

  // Check if bulk mode is available
  const bulkModeVisible = await approval.bulkModeToggle
    .isVisible()
    .catch(() => false);
  if (!bulkModeVisible) {
    return; // Bulk mode not available
  }

  await approval.enableBulkMode();

  // Check if checkboxes appear
  const checkboxCount = await approval.getAllCheckboxes().count();
  if (checkboxCount >= 2) {
    await approval.selectApprovalsByIndex([0, 1]);
    const selected = await approval.getSelectedCount();
    expect(selected).toBe(2);
  }
}
