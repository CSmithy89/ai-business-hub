/**
 * Base Page Object Class
 *
 * Provides common navigation, wait methods, and shared locators for all page objects.
 * All page objects should extend this class to inherit common functionality.
 *
 * @see docs/modules/bm-dm/stories/dm-09-3-e2e-infrastructure.md
 */
import { Page, Locator, expect } from '@playwright/test';

/**
 * Options for page navigation
 */
export interface NavigateOptions {
  /** Wait for this state after navigation. Default: 'networkidle' */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  /** Custom timeout in milliseconds. Default: 30000 */
  timeout?: number;
}

/**
 * Base page object class with common navigation and wait methods.
 *
 * Provides:
 * - Page navigation with configurable wait states
 * - Common locators for header/sidebar elements
 * - Wait utilities for page ready states
 * - Error handling utilities
 */
export abstract class BasePage {
  /** The Playwright page instance */
  protected readonly page: Page;

  /** The URL path for this page (relative to baseURL) */
  protected readonly path: string;

  // --------------------------
  // Common Layout Locators
  // --------------------------

  /** The main header element */
  readonly header: Locator;

  /** The sidebar navigation element */
  readonly sidebar: Locator;

  /** User menu dropdown trigger */
  readonly userMenu: Locator;

  /** Main content area */
  readonly mainContent: Locator;

  /** Global loading indicator (if present) */
  readonly globalLoader: Locator;

  /** Toast notification container */
  readonly toastContainer: Locator;

  /**
   * Create a new page object
   *
   * @param page - Playwright Page instance
   * @param path - URL path for this page (relative to baseURL)
   */
  constructor(page: Page, path: string) {
    this.page = page;
    this.path = path;

    // Initialize common locators
    this.header = page.locator('header').first();
    this.sidebar = page.locator('[data-testid="sidebar"], aside').first();
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.mainContent = page.locator('main').first();
    this.globalLoader = page.locator('[data-testid="global-loader"]');
    this.toastContainer = page.locator('[data-sonner-toaster]');
  }

  // --------------------------
  // Navigation Methods
  // --------------------------

  /**
   * Navigate to this page's path
   *
   * @param options - Navigation options
   */
  async goto(options: NavigateOptions = {}): Promise<void> {
    const { waitUntil = 'networkidle', timeout = 30000 } = options;
    await this.page.goto(this.path, { waitUntil, timeout });
  }

  /**
   * Navigate to a specific path
   *
   * @param path - URL path to navigate to
   * @param options - Navigation options
   */
  async navigateTo(path: string, options: NavigateOptions = {}): Promise<void> {
    const { waitUntil = 'networkidle', timeout = 30000 } = options;
    await this.page.goto(path, { waitUntil, timeout });
  }

  /**
   * Reload the current page
   *
   * @param options - Navigation options
   */
  async reload(options: NavigateOptions = {}): Promise<void> {
    const { waitUntil = 'networkidle', timeout = 30000 } = options;
    await this.page.reload({ waitUntil, timeout });
  }

  // --------------------------
  // Wait Methods
  // --------------------------

  /**
   * Wait for the page to be in a ready state
   * Override in subclasses to add page-specific wait conditions
   */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    // Wait for global loader to disappear if present
    const loaderVisible = await this.globalLoader
      .isVisible()
      .catch(() => false);
    if (loaderVisible) {
      await this.globalLoader.waitFor({ state: 'hidden', timeout: 30000 });
    }
  }

  /**
   * Wait for a specific element to be visible
   *
   * @param locator - Locator for the element
   * @param timeout - Timeout in milliseconds (default: 15000)
   */
  async waitForVisible(locator: Locator, timeout = 15000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for a specific element to be hidden
   *
   * @param locator - Locator for the element
   * @param timeout - Timeout in milliseconds (default: 15000)
   */
  async waitForHidden(locator: Locator, timeout = 15000): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Wait for text to appear on the page
   *
   * @param text - Text to wait for (string or RegExp)
   * @param timeout - Timeout in milliseconds (default: 15000)
   */
  async waitForText(text: string | RegExp, timeout = 15000): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible({ timeout });
  }

  /**
   * Wait for URL to match a pattern
   *
   * @param urlPattern - URL pattern to match (string or RegExp)
   * @param timeout - Timeout in milliseconds (default: 30000)
   */
  async waitForUrl(urlPattern: string | RegExp, timeout = 30000): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  // --------------------------
  // Assertion Helpers
  // --------------------------

  /**
   * Assert that the current URL matches the expected path
   */
  async expectAtPath(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${this.path}$`));
  }

  /**
   * Assert that the page title contains specific text
   *
   * @param text - Text expected in the page title
   */
  async expectTitleContains(text: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(text, 'i'));
  }

  // --------------------------
  // Utility Methods
  // --------------------------

  /**
   * Get the current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Take a screenshot for debugging
   *
   * @param name - Name for the screenshot file
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `playwright-report/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Get element by test ID
   *
   * @param testId - The data-testid attribute value
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by role
   *
   * @param role - ARIA role
   * @param options - Role options (name, etc.)
   */
  getByRole(
    role: Parameters<Page['getByRole']>[0],
    options?: Parameters<Page['getByRole']>[1]
  ): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Get element by text
   *
   * @param text - Text to search for
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  // --------------------------
  // Toast/Notification Methods
  // --------------------------

  /**
   * Wait for a toast notification with specific text
   *
   * @param text - Text to look for in the toast
   * @param timeout - Timeout in milliseconds (default: 10000)
   */
  async waitForToast(text: string | RegExp, timeout = 10000): Promise<void> {
    await expect(this.toastContainer.getByText(text).first()).toBeVisible({
      timeout,
    });
  }

  /**
   * Dismiss all visible toasts
   */
  async dismissToasts(): Promise<void> {
    const closeButtons = this.toastContainer.locator('button[aria-label="Close"]');
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      await closeButtons.nth(i).click().catch(() => {
        // Toast may have auto-dismissed
      });
    }
  }

  // --------------------------
  // Keyboard Shortcuts
  // --------------------------

  /**
   * Press a keyboard shortcut
   *
   * @param key - Key combination (e.g., 'Control+k', 'Meta+/')
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Focus the next interactive element
   */
  async tabToNext(): Promise<void> {
    await this.page.keyboard.press('Tab');
  }

  /**
   * Press Enter on the currently focused element
   */
  async pressEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
  }

  /**
   * Press Escape to close dialogs/modals
   */
  async pressEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
