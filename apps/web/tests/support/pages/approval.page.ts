/**
 * Approval Queue Page Object
 *
 * Provides locators and methods for interacting with the Approval Queue page,
 * including filters, approval cards, bulk operations, and confidence indicators.
 *
 * @see docs/modules/bm-dm/stories/dm-09-3-e2e-infrastructure.md
 * @see apps/web/src/app/(dashboard)/approvals/page.tsx
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage, NavigateOptions } from './base.page';

/**
 * Approval status filter options
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'all';

/**
 * Module filter options
 */
export type ModuleFilter = 'crm' | 'pm' | 'kb' | 'branding' | 'all';

/**
 * Sort options
 */
export type SortOption = 'urgency' | 'confidence' | 'created' | 'updated';

/**
 * Confidence level classification
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Approval Queue Page Object Model
 *
 * Provides:
 * - Filter and sort controls
 * - Approval card interactions
 * - Bulk operation methods
 * - Confidence indicator verification
 * - Empty state handling
 */
export class ApprovalPage extends BasePage {
  // --------------------------
  // Page Structure Locators
  // --------------------------

  /** Page header */
  readonly pageHeader: Locator;

  /** Approval list container */
  readonly approvalList: Locator;

  /** Empty state message */
  readonly emptyState: Locator;

  /** Approval stats summary */
  readonly approvalStats: Locator;

  // --------------------------
  // Filter/Sort Locators
  // --------------------------

  /** Status filter dropdown */
  readonly statusFilter: Locator;

  /** Module filter dropdown */
  readonly moduleFilter: Locator;

  /** Sort dropdown */
  readonly sortDropdown: Locator;

  /** Search input (if available) */
  readonly searchInput: Locator;

  // --------------------------
  // Bulk Operation Locators
  // --------------------------

  /** Bulk mode toggle button */
  readonly bulkModeToggle: Locator;

  /** Bulk approve button */
  readonly bulkApproveButton: Locator;

  /** Bulk reject button */
  readonly bulkRejectButton: Locator;

  /** Bulk action bar */
  readonly bulkActionBar: Locator;

  /** Selected count indicator */
  readonly selectedCount: Locator;

  /** Confirm bulk action button */
  readonly confirmBulkAction: Locator;

  // --------------------------
  // Action Dialog Locators
  // --------------------------

  /** Approval details panel/dialog */
  readonly approvalDetails: Locator;

  /** AI reasoning section */
  readonly aiReasoning: Locator;

  /** Approve button */
  readonly approveButton: Locator;

  /** Reject button */
  readonly rejectButton: Locator;

  /** Confirm approve button */
  readonly confirmApprove: Locator;

  /** Confirm reject button */
  readonly confirmReject: Locator;

  /** Approval notes input */
  readonly approvalNotes: Locator;

  /** Rejection reason input (required) */
  readonly rejectionReason: Locator;

  constructor(page: Page) {
    super(page, '/approvals');

    // Page structure
    this.pageHeader = page.locator('[data-testid="approvals-header"]');
    this.approvalList = page.locator('[data-testid="approval-list"]');
    this.emptyState = page.locator('[data-testid="no-approvals"]');
    this.approvalStats = page.locator('[data-testid="approval-stats"]');

    // Filters
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.moduleFilter = page.locator('[data-testid="module-filter"]');
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    this.searchInput = page.locator('[data-testid="approval-search"]');

    // Bulk operations
    this.bulkModeToggle = page.locator('[data-testid="bulk-mode-toggle"]');
    this.bulkApproveButton = page.locator('[data-testid="bulk-approve-button"]');
    this.bulkRejectButton = page.locator('[data-testid="bulk-reject-button"]');
    this.bulkActionBar = page.locator('[data-testid="bulk-action-bar"]');
    this.selectedCount = page.getByText(/\d+ selected/i);
    this.confirmBulkAction = page.locator('[data-testid="confirm-bulk-action"]');

    // Action dialogs
    this.approvalDetails = page.locator('[data-testid="approval-details"]');
    this.aiReasoning = page.locator('[data-testid="ai-reasoning"]');
    this.approveButton = page.locator('[data-testid="approve-button"]').first();
    this.rejectButton = page.locator('[data-testid="reject-button"]').first();
    this.confirmApprove = page.locator('[data-testid="confirm-approve"]');
    this.confirmReject = page.locator('[data-testid="confirm-reject"]');
    this.approvalNotes = page.locator('[data-testid="approval-notes"]');
    this.rejectionReason = page.locator('[data-testid="rejection-reason"]');
  }

  // --------------------------
  // Navigation & Load Methods
  // --------------------------

  /**
   * Navigate to approval queue and wait for ready state
   *
   * @param options - Navigation options
   */
  override async goto(options: NavigateOptions = {}): Promise<void> {
    await super.goto(options);
    await this.waitForReady();
  }

  /**
   * Navigate with a specific status filter
   *
   * @param status - Status to filter by
   */
  async gotoWithStatus(status: ApprovalStatus): Promise<void> {
    await this.navigateTo(`/approvals?status=${status}`);
    await this.waitForReady();
  }

  /**
   * Wait for approval queue to be ready
   */
  override async waitForReady(): Promise<void> {
    // Wait for header to be visible
    await this.pageHeader.waitFor({ state: 'visible', timeout: 30000 });

    // Either list or empty state should be visible
    await expect
      .soft(this.approvalList.or(this.emptyState))
      .toBeVisible({ timeout: 15000 });
  }

  // --------------------------
  // Approval Card Methods
  // --------------------------

  /**
   * Get an approval card by its ID
   *
   * @param id - Approval ID
   */
  getApprovalCard(id: string): Locator {
    return this.page.locator(`[data-testid="approval-card-${id}"]`);
  }

  /**
   * Get all approval cards
   */
  getAllApprovalCards(): Locator {
    return this.page.locator('[data-testid^="approval-card-"]');
  }

  /**
   * Get the count of approval cards displayed
   */
  async getApprovalCount(): Promise<number> {
    const cards = this.getAllApprovalCards();
    return await cards.count();
  }

  /**
   * Click on an approval card to expand/view details
   *
   * @param id - Approval ID (or null to click first card)
   */
  async clickApprovalCard(id?: string): Promise<void> {
    if (id) {
      await this.getApprovalCard(id).click();
    } else {
      await this.getAllApprovalCards().first().click();
    }
  }

  /**
   * Check if the queue is empty
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible().catch(() => false);
  }

  /**
   * Wait for a new approval to appear
   *
   * @param timeout - Timeout in milliseconds (default: 30000)
   */
  async waitForNewApproval(timeout = 30000): Promise<void> {
    const initialCount = await this.getApprovalCount();
    await expect
      .poll(async () => await this.getApprovalCount(), { timeout })
      .toBeGreaterThan(initialCount);
  }

  // --------------------------
  // Filter Methods
  // --------------------------

  /**
   * Filter by status
   *
   * @param status - Status to filter by
   */
  async filterByStatus(status: ApprovalStatus): Promise<void> {
    await this.statusFilter.click();
    await this.page.click(`[data-testid="filter-${status}"]`);
    await this.page.waitForURL(new RegExp(`status=${status}`));
  }

  /**
   * Filter by module
   *
   * @param module - Module to filter by
   */
  async filterByModule(module: ModuleFilter): Promise<void> {
    await this.moduleFilter.click();
    await this.page.click(`[data-testid="filter-${module}"]`);
    await this.page.waitForURL(new RegExp(`module=${module}`));
  }

  /**
   * Sort by specified option
   *
   * @param option - Sort option
   */
  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.click();
    await this.page.click(`[data-testid="sort-${option}"]`);
    await this.page.waitForURL(new RegExp(`sort=${option}`));
  }

  /**
   * Search for approvals
   *
   * @param query - Search query
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  // --------------------------
  // Approval Action Methods
  // --------------------------

  /**
   * Approve an item with optional notes
   *
   * @param id - Approval ID (or null to use currently selected)
   * @param notes - Optional approval notes
   */
  async approveItem(id?: string, notes?: string): Promise<void> {
    if (id) {
      await this.clickApprovalCard(id);
    }

    await this.approveButton.click();

    if (notes && (await this.approvalNotes.isVisible())) {
      await this.approvalNotes.fill(notes);
    }

    await this.confirmApprove.click();
  }

  /**
   * Reject an item with required reason
   *
   * @param id - Approval ID (or null to use currently selected)
   * @param reason - Required rejection reason
   */
  async rejectItem(id: string | undefined, reason: string): Promise<void> {
    if (id) {
      await this.clickApprovalCard(id);
    }

    await this.rejectButton.click();

    // Reason is required for rejection
    await this.rejectionReason.fill(reason);
    await this.confirmReject.click();
  }

  /**
   * Verify that rejection requires a reason
   */
  async expectRejectionRequiresReason(): Promise<void> {
    await this.rejectButton.click();
    await this.confirmReject.click();
    await expect(this.page.getByText(/reason.*required/i)).toBeVisible();
  }

  // --------------------------
  // Bulk Operation Methods
  // --------------------------

  /**
   * Enable bulk selection mode
   */
  async enableBulkMode(): Promise<void> {
    await this.bulkModeToggle.click();
  }

  /**
   * Get checkbox for an approval card
   *
   * @param id - Approval ID
   */
  getApprovalCheckbox(id: string): Locator {
    return this.page.locator(`[data-testid="approval-checkbox-${id}"]`);
  }

  /**
   * Get all approval checkboxes (in bulk mode)
   */
  getAllCheckboxes(): Locator {
    return this.page.locator('[data-testid^="approval-checkbox-"]');
  }

  /**
   * Select multiple approvals by ID
   *
   * @param ids - Array of approval IDs to select
   */
  async selectApprovals(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.getApprovalCheckbox(id).click();
    }
  }

  /**
   * Select approvals by index (0-based)
   *
   * @param indices - Array of indices to select
   */
  async selectApprovalsByIndex(indices: number[]): Promise<void> {
    const checkboxes = this.getAllCheckboxes();
    for (const index of indices) {
      await checkboxes.nth(index).click();
    }
  }

  /**
   * Get the number of selected approvals
   */
  async getSelectedCount(): Promise<number> {
    const text = await this.selectedCount.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Bulk approve all selected items
   */
  async bulkApprove(): Promise<void> {
    await this.bulkApproveButton.click();
    await this.confirmBulkAction.click();
  }

  /**
   * Bulk reject all selected items with reason
   *
   * @param reason - Rejection reason for all items
   */
  async bulkReject(reason: string): Promise<void> {
    await this.bulkRejectButton.click();
    await this.rejectionReason.fill(reason);
    await this.confirmBulkAction.click();
  }

  // --------------------------
  // Confidence Methods
  // --------------------------

  /**
   * Get confidence indicator for an approval card
   *
   * @param id - Approval ID
   */
  getConfidenceIndicator(id: string): Locator {
    return this.getApprovalCard(id).locator('[data-testid="confidence-indicator"]');
  }

  /**
   * Get confidence score for an approval card
   *
   * @param id - Approval ID
   */
  getConfidenceScore(id: string): Locator {
    return this.getApprovalCard(id).locator('[data-testid="confidence-score"]');
  }

  /**
   * Get the confidence level classification for an approval
   *
   * @param id - Approval ID
   */
  async getConfidenceLevel(id: string): Promise<ConfidenceLevel | null> {
    const indicator = this.getConfidenceIndicator(id);
    const classes = await indicator.getAttribute('class');

    if (!classes) return null;

    if (classes.includes('high') || classes.includes('green')) return 'high';
    if (classes.includes('medium') || classes.includes('yellow')) return 'medium';
    if (classes.includes('low') || classes.includes('red')) return 'low';

    return null;
  }

  /**
   * Get the numeric confidence score for an approval
   *
   * @param id - Approval ID
   */
  async getConfidenceScoreValue(id: string): Promise<number | null> {
    const scoreElement = this.getConfidenceScore(id);
    const text = await scoreElement.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Check if auto-approved badge is visible for an approval
   *
   * @param id - Approval ID
   */
  async hasAutoApprovedBadge(id: string): Promise<boolean> {
    const badge = this.getApprovalCard(id).locator(
      '[data-testid="auto-approved-badge"]'
    );
    return await badge.isVisible().catch(() => false);
  }

  /**
   * Verify confidence indicator is color-coded
   *
   * @param id - Approval ID
   */
  async expectConfidenceColorCoded(id: string): Promise<void> {
    const level = await this.getConfidenceLevel(id);
    expect(level).not.toBeNull();
  }

  // --------------------------
  // AI Reasoning Methods
  // --------------------------

  /**
   * Check if AI reasoning is visible in details panel
   */
  async hasAiReasoning(): Promise<boolean> {
    return await this.aiReasoning.isVisible().catch(() => false);
  }

  /**
   * Get the AI reasoning text
   */
  async getAiReasoningText(): Promise<string | null> {
    if (await this.hasAiReasoning()) {
      return await this.aiReasoning.textContent();
    }
    return null;
  }

  // --------------------------
  // Accessibility Methods
  // --------------------------

  /**
   * Verify approval queue supports keyboard navigation
   */
  async expectKeyboardNavigable(): Promise<void> {
    await this.page.keyboard.press('Tab');
    const focused = this.page.locator(':focus');
    await expect(focused).toBeVisible();
  }

  /**
   * Verify action buttons have aria-labels
   */
  async expectActionButtonsAccessible(): Promise<void> {
    const approveVisible = await this.approveButton.isVisible().catch(() => false);
    if (approveVisible) {
      const ariaLabel = await this.approveButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  }
}
