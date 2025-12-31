/**
 * Page Object Models - E2E Test Infrastructure
 *
 * Exports all page objects for use in E2E tests.
 * Page objects provide:
 * - Encapsulated locators for page elements
 * - Common interaction methods
 * - Wait and assertion helpers
 * - Consistent patterns across tests
 *
 * @see docs/modules/bm-dm/stories/dm-09-3-e2e-infrastructure.md
 *
 * @example
 * ```typescript
 * import { DashboardPage, ApprovalPage } from '../support/pages';
 *
 * test('dashboard loads correctly', async ({ page }) => {
 *   const dashboard = new DashboardPage(page);
 *   await dashboard.goto();
 *   await dashboard.expectStructure();
 * });
 * ```
 */

// Base page object class (for extension)
export { BasePage, type NavigateOptions } from './base.page';

// Dashboard page object
export {
  DashboardPage,
  type QuickAction,
  type WidgetType,
} from './dashboard.page';

// Approval queue page object
export {
  ApprovalPage,
  type ApprovalStatus,
  type ModuleFilter,
  type SortOption,
  type ConfidenceLevel,
} from './approval.page';
