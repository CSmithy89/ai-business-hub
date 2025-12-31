/**
 * Dashboard Page Object
 *
 * Provides locators and methods for interacting with the Dashboard page,
 * including widget grid, loading states, AI assistant, and quick actions.
 *
 * @see docs/modules/bm-dm/stories/dm-09-3-e2e-infrastructure.md
 * @see apps/web/src/app/(dashboard)/dashboard/page.tsx
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage, NavigateOptions } from './base.page';

/**
 * Quick action button identifiers
 */
export type QuickAction =
  | 'project-status'
  | 'at-risk'
  | 'team-activity'
  | 'workspace-overview';

/**
 * Widget type identifiers
 */
export type WidgetType =
  | 'project-status'
  | 'task-list'
  | 'metrics'
  | 'alert'
  | 'team-activity'
  | 'timeline'
  | 'chart'
  | 'text'
  | 'error';

/**
 * Dashboard Page Object Model
 *
 * Provides:
 * - Widget grid locators and methods
 * - Loading state detection
 * - AI assistant / chat interaction
 * - Quick action button methods
 * - Progress tracking for long-running tasks
 */
export class DashboardPage extends BasePage {
  // --------------------------
  // Page Structure Locators
  // --------------------------

  /** Dashboard heading */
  readonly heading: Locator;

  /** AI Insights section heading */
  readonly aiInsightsHeading: Locator;

  /** Dashboard agent section container */
  readonly agentSection: Locator;

  /** Dashboard widget grid container */
  readonly widgetGrid: Locator;

  /** Dashboard Assistant card/sidebar */
  readonly assistantCard: Locator;

  // --------------------------
  // Loading State Locators
  // --------------------------

  /** Loading skeleton placeholder */
  readonly loadingSkeleton: Locator;

  /** Loading spinner indicator */
  readonly loadingSpinner: Locator;

  /** Widget placeholder (no widgets yet) */
  readonly widgetPlaceholder: Locator;

  // --------------------------
  // Error State Locators
  // --------------------------

  /** Error banner/alert */
  readonly errorBanner: Locator;

  /** Error widget (individual widget error) */
  readonly errorWidget: Locator;

  // --------------------------
  // Chat/Assistant Locators
  // --------------------------

  /** Open AI Assistant button */
  readonly openChatButton: Locator;

  /** Quick actions container */
  readonly quickActionsContainer: Locator;

  /** Keyboard shortcut hint */
  readonly keyboardHint: Locator;

  // --------------------------
  // Task/Progress Locators
  // --------------------------

  /** Progress bar for active tasks */
  readonly progressBar: Locator;

  /** Task status indicator */
  readonly taskStatus: Locator;

  /** Refresh/reload button */
  readonly refreshButton: Locator;

  constructor(page: Page) {
    super(page, '/dashboard');

    // Page structure
    this.heading = page.getByRole('heading', { name: /Dashboard/i });
    this.aiInsightsHeading = page.getByRole('heading', { name: /AI Insights/i });
    this.agentSection = page.getByTestId('dashboard-agent-section');
    this.widgetGrid = page.getByTestId('dashboard-grid');
    this.assistantCard = page.getByRole('heading', {
      name: /Dashboard Assistant/i,
    });

    // Loading states
    this.loadingSkeleton = page.locator('[data-testid="loading-skeleton"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.widgetPlaceholder = page.getByText(/No widgets yet/i);

    // Error states
    this.errorBanner = page.locator('[data-testid="error-banner"]');
    this.errorWidget = page.locator('[data-testid^="error-widget-"]');

    // Chat/Assistant
    this.openChatButton = page.getByTestId('dashboard-open-chat');
    this.quickActionsContainer = page.getByText(/Quick actions/i);
    this.keyboardHint = page.getByText(/(Cmd|Ctrl)\+\//);

    // Task/Progress
    this.progressBar = page.locator('[data-testid="progress-bar"]');
    this.taskStatus = page.locator('[data-testid="task-status"]');
    this.refreshButton = page.locator('[data-testid="refresh-button"]');
  }

  // --------------------------
  // Navigation & Load Methods
  // --------------------------

  /**
   * Navigate to dashboard and wait for ready state
   *
   * @param options - Navigation options
   */
  override async goto(options: NavigateOptions = {}): Promise<void> {
    await super.goto(options);
    await this.waitForReady();
  }

  /**
   * Wait for dashboard to be in ready state
   */
  override async waitForReady(): Promise<void> {
    // Wait for agent section to be visible
    await this.agentSection.waitFor({ state: 'visible', timeout: 30000 });

    // Wait for loading skeleton to disappear if present
    const skeletonVisible = await this.loadingSkeleton
      .isVisible()
      .catch(() => false);
    if (skeletonVisible) {
      await this.loadingSkeleton.waitFor({ state: 'hidden', timeout: 30000 });
    }
  }

  /**
   * Wait for widgets to load (loading spinner disappears, grid visible)
   *
   * @param timeout - Timeout in milliseconds (default: 30000)
   */
  async waitForWidgetsLoad(timeout = 30000): Promise<void> {
    // Wait for spinner to disappear if present
    const spinnerVisible = await this.loadingSpinner
      .isVisible()
      .catch(() => false);
    if (spinnerVisible) {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout });
    }

    // Widget grid should be visible
    await this.widgetGrid.waitFor({ state: 'visible', timeout });
  }

  // --------------------------
  // Widget Methods
  // --------------------------

  /**
   * Get the number of widgets currently displayed
   */
  async getWidgetCount(): Promise<number> {
    // Widgets have data-testid starting with "widget-"
    const widgets = this.page.locator('[data-testid^="widget-"]');
    return await widgets.count();
  }

  /**
   * Get a specific widget by its test ID
   *
   * @param testId - The widget's test ID (e.g., 'widget-project-status')
   */
  getWidget(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get all widgets of a specific type
   *
   * @param type - Widget type to filter by
   */
  getWidgetsByType(type: WidgetType): Locator {
    return this.page.locator(`[data-testid^="widget-${type}"]`);
  }

  /**
   * Check if a specific widget type exists
   *
   * @param type - Widget type to check for
   */
  async hasWidgetType(type: WidgetType): Promise<boolean> {
    const widgets = this.getWidgetsByType(type);
    return (await widgets.count()) > 0;
  }

  /**
   * Check if the widget placeholder is visible (no widgets rendered)
   */
  async hasNoWidgets(): Promise<boolean> {
    return await this.widgetPlaceholder.isVisible().catch(() => false);
  }

  // --------------------------
  // Quick Action Methods
  // --------------------------

  /**
   * Get a quick action button locator
   *
   * @param action - Quick action identifier
   */
  getQuickAction(action: QuickAction): Locator {
    return this.page.getByTestId(`quick-action-${action}`);
  }

  /**
   * Click a quick action button
   *
   * @param action - Quick action to trigger
   */
  async clickQuickAction(action: QuickAction): Promise<void> {
    const button = this.getQuickAction(action);
    await button.click();
  }

  /**
   * Verify all quick action buttons are visible
   */
  async expectAllQuickActionsVisible(): Promise<void> {
    const actions: QuickAction[] = [
      'project-status',
      'at-risk',
      'team-activity',
      'workspace-overview',
    ];

    for (const action of actions) {
      await expect(this.getQuickAction(action)).toBeVisible();
    }
  }

  // --------------------------
  // Chat/Assistant Methods
  // --------------------------

  /**
   * Open the AI Assistant panel
   */
  async openAssistant(): Promise<void> {
    await this.openChatButton.click();
  }

  /**
   * Open assistant using keyboard shortcut
   * Uses Cmd+/ on Mac, Ctrl+/ on other platforms
   */
  async openAssistantWithKeyboard(): Promise<void> {
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await this.pressKey(`${modifier}+/`);
  }

  /**
   * Check if quick actions section is visible
   */
  async hasQuickActions(): Promise<boolean> {
    return await this.quickActionsContainer.isVisible().catch(() => false);
  }

  // --------------------------
  // Task/Progress Methods
  // --------------------------

  /**
   * Get the current progress bar value (0-100)
   */
  async getProgressValue(): Promise<number> {
    const value = await this.progressBar.getAttribute('aria-valuenow');
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Wait for a task to complete
   *
   * @param timeout - Timeout in milliseconds (default: 60000)
   */
  async waitForTaskCompletion(timeout = 60000): Promise<void> {
    await expect(this.taskStatus).toHaveText(/Completed|Done|Finished/i, {
      timeout,
    });
  }

  /**
   * Wait for progress to reach a specific value
   *
   * @param targetValue - Progress value to wait for (0-100)
   * @param timeout - Timeout in milliseconds (default: 30000)
   */
  async waitForProgress(targetValue: number, timeout = 30000): Promise<void> {
    await expect
      .poll(async () => await this.getProgressValue(), { timeout })
      .toBeGreaterThanOrEqual(targetValue);
  }

  /**
   * Refresh the dashboard
   */
  async refresh(): Promise<void> {
    const hasRefreshButton = await this.refreshButton
      .isVisible()
      .catch(() => false);
    if (hasRefreshButton) {
      await this.refreshButton.click();
      await this.waitForWidgetsLoad();
    } else {
      await this.reload();
      await this.waitForReady();
    }
  }

  // --------------------------
  // Error State Methods
  // --------------------------

  /**
   * Check if an error banner is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorBanner.isVisible().catch(() => false);
  }

  /**
   * Get the error message text
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.hasError()) {
      return await this.errorBanner.textContent();
    }
    return null;
  }

  /**
   * Check if any error widgets are displayed
   */
  async hasErrorWidgets(): Promise<boolean> {
    const errorCount = await this.errorWidget.count();
    return errorCount > 0;
  }

  // --------------------------
  // Accessibility Methods
  // --------------------------

  /**
   * Verify dashboard has proper accessibility attributes
   */
  async expectAccessible(): Promise<void> {
    // Grid should have role and aria-label
    await expect(this.widgetGrid).toHaveAttribute('role', 'region');
    await expect(this.widgetGrid).toHaveAttribute(
      'aria-label',
      'Dashboard widgets'
    );

    // Main heading should be visible
    await expect(this.heading).toBeVisible();
  }

  // --------------------------
  // Layout Verification Methods
  // --------------------------

  /**
   * Verify dashboard has expected structure
   */
  async expectStructure(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.agentSection).toBeVisible();
    await expect(this.widgetGrid).toBeVisible();
  }

  /**
   * Verify dashboard grid has responsive classes
   */
  async expectResponsiveGrid(): Promise<void> {
    const gridClass = await this.widgetGrid.getAttribute('class');
    expect(gridClass).toContain('grid');
    expect(gridClass).toContain('gap-4');
  }
}
