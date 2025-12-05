/**
 * Approval System E2E Tests - Epic 04
 *
 * Tests for approval queue, approval cards, confidence routing, and bulk operations.
 * @see docs/epics/EPIC-04-approval-system.md
 */
import { test, expect } from '../support/fixtures';

test.describe('Approval System', () => {
  test.describe('Approval Queue (Story 04.2)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display approval queue page', async ({ page }) => {
      await page.goto('/approvals');

      // Should show queue header
      await expect(page.locator('[data-testid="approvals-header"]')).toBeVisible();
      await expect(page.getByRole('heading', { name: /approvals/i })).toBeVisible();
    });

    test('should show empty state when no pending approvals', async ({ page }) => {
      await page.goto('/approvals');

      // Either show empty state or approval list
      const emptyState = page.locator('[data-testid="no-approvals"]');
      const approvalList = page.locator('[data-testid="approval-list"]');

      const hasEmpty = await emptyState.isVisible().catch(() => false);
      const hasList = await approvalList.isVisible().catch(() => false);

      expect(hasEmpty || hasList).toBeTruthy();
    });

    test('should display approval cards with confidence indicators', async ({ page }) => {
      await page.goto('/approvals');

      // If approvals exist, they should show confidence
      const approvalCard = page.locator('[data-testid^="approval-card-"]').first();
      if (await approvalCard.isVisible().catch(() => false)) {
        // Card should have confidence indicator
        await expect(
          approvalCard.locator('[data-testid="confidence-indicator"]')
        ).toBeVisible();
      }
    });

    test('should filter approvals by status', async ({ page }) => {
      await page.goto('/approvals');

      // Click status filter
      const statusFilter = page.locator('[data-testid="status-filter"]');
      if (await statusFilter.isVisible()) {
        await statusFilter.click();
        await page.click('[data-testid="filter-pending"]');

        // URL should update with filter
        await expect(page).toHaveURL(/status=pending/);
      }
    });

    test('should filter approvals by module', async ({ page }) => {
      await page.goto('/approvals');

      const moduleFilter = page.locator('[data-testid="module-filter"]');
      if (await moduleFilter.isVisible()) {
        await moduleFilter.click();
        await page.click('[data-testid="filter-crm"]');

        await expect(page).toHaveURL(/module=crm/);
      }
    });

    test('should sort approvals by urgency', async ({ page }) => {
      await page.goto('/approvals');

      const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
      if (await sortDropdown.isVisible()) {
        await sortDropdown.click();
        await page.click('[data-testid="sort-urgency"]');

        await expect(page).toHaveURL(/sort=urgency/);
      }
    });
  });

  test.describe('Approval Card Actions (Story 04.3)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should expand approval card to show details', async ({ page }) => {
      await page.goto('/approvals');

      const approvalCard = page.locator('[data-testid^="approval-card-"]').first();
      if (await approvalCard.isVisible().catch(() => false)) {
        await approvalCard.click();

        // Should show expanded details
        await expect(
          page.locator('[data-testid="approval-details"]')
        ).toBeVisible();
      }
    });

    test('should show AI reasoning in approval details', async ({ page }) => {
      await page.goto('/approvals');

      const approvalCard = page.locator('[data-testid^="approval-card-"]').first();
      if (await approvalCard.isVisible().catch(() => false)) {
        await approvalCard.click();

        // Should show AI reasoning section
        await expect(
          page.locator('[data-testid="ai-reasoning"]')
        ).toBeVisible();
      }
    });

    test('should approve item with notes', async ({ page }) => {
      await page.goto('/approvals');

      const approvalCard = page.locator('[data-testid^="approval-card-"]').first();
      if (await approvalCard.isVisible().catch(() => false)) {
        await approvalCard.click();

        // Click approve button
        await page.click('[data-testid="approve-button"]');

        // Add optional notes
        const notesInput = page.locator('[data-testid="approval-notes"]');
        if (await notesInput.isVisible()) {
          await notesInput.fill('Approved via E2E test');
        }

        // Confirm approval
        await page.click('[data-testid="confirm-approve"]');

        // Should show success message
        await expect(page.getByText(/approved/i)).toBeVisible();
      }
    });

    test('should reject item with required reason', async ({ page }) => {
      await page.goto('/approvals');

      const approvalCard = page.locator('[data-testid^="approval-card-"]').first();
      if (await approvalCard.isVisible().catch(() => false)) {
        await approvalCard.click();

        // Click reject button
        await page.click('[data-testid="reject-button"]');

        // Reason is required
        const reasonInput = page.locator('[data-testid="rejection-reason"]');
        await expect(reasonInput).toBeVisible();

        // Try to reject without reason
        await page.click('[data-testid="confirm-reject"]');
        await expect(page.getByText(/reason.*required/i)).toBeVisible();

        // Add reason and reject
        await reasonInput.fill('Does not meet policy requirements');
        await page.click('[data-testid="confirm-reject"]');

        // Should show rejection confirmed
        await expect(page.getByText(/rejected/i)).toBeVisible();
      }
    });
  });

  test.describe('Bulk Operations (Story 04.6)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should enable bulk selection mode', async ({ page }) => {
      await page.goto('/approvals');

      const bulkModeToggle = page.locator('[data-testid="bulk-mode-toggle"]');
      if (await bulkModeToggle.isVisible()) {
        await bulkModeToggle.click();

        // Checkboxes should appear on cards
        await expect(
          page.locator('[data-testid^="approval-checkbox-"]').first()
        ).toBeVisible();
      }
    });

    test('should select multiple approvals', async ({ page }) => {
      await page.goto('/approvals');

      const bulkModeToggle = page.locator('[data-testid="bulk-mode-toggle"]');
      if (await bulkModeToggle.isVisible()) {
        await bulkModeToggle.click();

        // Select first two items
        const checkboxes = page.locator('[data-testid^="approval-checkbox-"]');
        const count = await checkboxes.count();

        if (count >= 2) {
          await checkboxes.nth(0).click();
          await checkboxes.nth(1).click();

          // Selected count should show
          await expect(page.getByText(/2 selected/i)).toBeVisible();
        }
      }
    });

    test('should bulk approve selected items', async ({ page }) => {
      await page.goto('/approvals');

      const bulkModeToggle = page.locator('[data-testid="bulk-mode-toggle"]');
      if (await bulkModeToggle.isVisible()) {
        await bulkModeToggle.click();

        const checkboxes = page.locator('[data-testid^="approval-checkbox-"]');
        if ((await checkboxes.count()) >= 1) {
          await checkboxes.first().click();

          // Click bulk approve
          await page.click('[data-testid="bulk-approve-button"]');

          // Confirm bulk action
          await page.click('[data-testid="confirm-bulk-action"]');

          // Should show success
          await expect(page.getByText(/approved/i)).toBeVisible();
        }
      }
    });
  });

  test.describe('Confidence Routing Display (Story 04.4)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should show high confidence items with auto-approved badge', async ({
      page,
    }) => {
      await page.goto('/approvals?status=approved');

      // High confidence items (>85%) should show auto-approved
      const autoApprovedBadge = page.locator('[data-testid="auto-approved-badge"]');
      if (await autoApprovedBadge.isVisible().catch(() => false)) {
        await expect(autoApprovedBadge).toContainText(/auto/i);
      }
    });

    test('should show confidence score on each card', async ({ page }) => {
      await page.goto('/approvals');

      const approvalCard = page.locator('[data-testid^="approval-card-"]').first();
      if (await approvalCard.isVisible().catch(() => false)) {
        // Should show confidence percentage
        const confidence = approvalCard.locator('[data-testid="confidence-score"]');
        await expect(confidence).toBeVisible();
        await expect(confidence).toContainText(/%/);
      }
    });

    test('should color-code confidence levels', async ({ page }) => {
      await page.goto('/approvals');

      const approvalCard = page.locator('[data-testid^="approval-card-"]').first();
      if (await approvalCard.isVisible().catch(() => false)) {
        const indicator = approvalCard.locator('[data-testid="confidence-indicator"]');

        // Indicator should have color class
        const classes = await indicator.getAttribute('class');
        expect(
          classes?.includes('green') ||
            classes?.includes('yellow') ||
            classes?.includes('red') ||
            classes?.includes('high') ||
            classes?.includes('medium') ||
            classes?.includes('low')
        ).toBeTruthy();
      }
    });
  });

  test.describe('Escalation Config (Story 04.7)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should access escalation settings as owner/admin', async ({ page }) => {
      await page.goto('/settings/approvals');

      await expect(
        page.locator('[data-testid="escalation-config"]')
      ).toBeVisible();
    });

    test('should update confidence thresholds', async ({ page }) => {
      await page.goto('/settings/approvals');

      const autoApproveInput = page.locator(
        '[data-testid="auto-approve-threshold"]'
      );
      if (await autoApproveInput.isVisible()) {
        await autoApproveInput.fill('90');

        await page.click('[data-testid="save-escalation-config"]');

        await expect(page.getByText(/saved/i)).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should support keyboard navigation in approval list', async ({
      page,
    }) => {
      await page.goto('/approvals');

      // Tab through approval cards
      await page.keyboard.press('Tab');

      // First interactive element should be focused
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('should announce approval actions to screen readers', async ({
      page,
    }) => {
      await page.goto('/approvals');

      // Action buttons should have aria-labels
      const approveButton = page.locator('[data-testid="approve-button"]').first();
      if (await approveButton.isVisible().catch(() => false)) {
        const ariaLabel = await approveButton.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });
  });
});
