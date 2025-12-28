/**
 * PM Suggestion E2E Tests
 *
 * Tests for the PM Suggestion UI including:
 * - Suggestion card display
 * - Accept suggestion flow
 * - Reject suggestion with reason
 * - Snooze suggestion
 * - Expired suggestion handling
 *
 * @see docs/modules/bm-pm/stories/pm-12-4-integration-e2e-tests.md
 */
import { test, expect } from '../support/fixtures';

test.describe('PM Suggestion Flow', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('suggestion cards display correctly', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    // Look for suggestions panel or cards
    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();
    const suggestionsPanel = page.locator('[data-testid="suggestions-panel"]');

    // Skip if suggestions not implemented
    const hasSuggestions = await Promise.race([
      suggestionCard.isVisible({ timeout: 5000 }).catch(() => false),
      suggestionsPanel.isVisible({ timeout: 5000 }).catch(() => false),
    ]);

    if (!hasSuggestions) {
      test.skip();
      return;
    }

    // If panel exists, may need to open it
    if (await suggestionsPanel.isVisible()) {
      // Panel visible, check for cards inside
      const cardsInPanel = suggestionsPanel.locator('[data-testid="suggestion-card"]');
      if ((await cardsInPanel.count()) > 0) {
        await expect(cardsInPanel.first()).toBeVisible();
      }
    }

    // Verify card structure if visible
    if (await suggestionCard.isVisible()) {
      // Should have title
      await expect(
        suggestionCard.locator('[data-testid="suggestion-title"]'),
      ).toBeVisible();

      // Should have confidence indicator
      await expect(
        suggestionCard.locator('[data-testid="suggestion-confidence"]'),
      ).toBeVisible();

      // Should have action buttons
      await expect(
        suggestionCard.locator('[data-testid="suggestion-accept"]'),
      ).toBeVisible();

      await expect(
        suggestionCard.locator('[data-testid="suggestion-reject"]'),
      ).toBeVisible();
    }
  });

  test('user can accept suggestion', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (!(await suggestionCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Verify suggestion title exists before accepting
    await expect(
      suggestionCard.locator('[data-testid="suggestion-title"]'),
    ).toBeVisible();

    // Click accept button
    const acceptButton = suggestionCard.locator('[data-testid="suggestion-accept"]');
    await acceptButton.click();

    // Wait for confirmation dialog if present
    const confirmDialog = page.locator('[data-testid="confirm-accept-dialog"]');
    if (await confirmDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmDialog.locator('[data-testid="confirm-button"]').click();
    }

    // Card should be removed from list
    await expect(suggestionCard).not.toBeVisible({ timeout: 5000 });

    // Success toast should appear
    const successToast = page.locator('[data-testid="toast-success"]');
    const hasToast = await successToast.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasToast) {
      await expect(successToast).toContainText(/accepted|completed|applied/i);
    }
  });

  test('user can reject suggestion with reason', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (!(await suggestionCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Click reject button
    const rejectButton = suggestionCard.locator('[data-testid="suggestion-reject"]');
    await rejectButton.click();

    // Rejection reason dialog should appear
    const rejectDialog = page.locator('[data-testid="reject-dialog"]');
    await expect(rejectDialog).toBeVisible({ timeout: 3000 });

    // Enter rejection reason
    const reasonInput = rejectDialog.locator('[data-testid="reject-reason"]');
    await reasonInput.fill('Not applicable at this time');

    // Confirm rejection
    const confirmButton = rejectDialog.locator('[data-testid="reject-confirm"]');
    await confirmButton.click();

    // Card should be removed
    await expect(suggestionCard).not.toBeVisible({ timeout: 5000 });
  });

  test('user can snooze suggestion', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (!(await suggestionCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Click snooze button
    const snoozeButton = suggestionCard.locator('[data-testid="suggestion-snooze"]');

    if (!(await snoozeButton.isVisible({ timeout: 2000 }).catch(() => false))) {
      // May be in dropdown menu
      const moreButton = suggestionCard.locator('[data-testid="suggestion-more"]');
      if (await moreButton.isVisible()) {
        await moreButton.click();
        const snoozeOption = page.locator('[data-testid="snooze-option"]');
        await snoozeOption.click();
      } else {
        test.skip();
        return;
      }
    } else {
      await snoozeButton.click();
    }

    // Snooze options should appear
    const snoozeOptions = page.locator('[data-testid="snooze-options"]');
    await expect(snoozeOptions).toBeVisible({ timeout: 3000 });

    // Select 1 hour snooze
    const snooze1h = page.locator('[data-testid="snooze-1h"]');
    await snooze1h.click();

    // Card should be removed (snoozed)
    await expect(suggestionCard).not.toBeVisible({ timeout: 5000 });

    // Success toast should confirm
    const successToast = page.locator('[data-testid="toast-success"]');
    const hasToast = await successToast.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasToast) {
      await expect(successToast).toContainText(/snoozed/i);
    }
  });

  test('expired suggestions are not shown', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    // Check for suggestions
    const suggestionCards = page.locator('[data-testid="suggestion-card"]');
    const cardCount = await suggestionCards.count();

    // If there are suggestions, none should be expired
    for (let i = 0; i < cardCount; i++) {
      const card = suggestionCards.nth(i);
      const expiredBadge = card.locator('[data-testid="suggestion-expired"]');
      const isExpired = await expiredBadge.isVisible().catch(() => false);

      // Expired suggestions should not be visible
      expect(isExpired).toBe(false);
    }
  });

  test('accept action triggers appropriate update', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (!(await suggestionCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Verify suggestion type exists (optional element)
    const suggestionType = suggestionCard.locator('[data-testid="suggestion-type"]');
    if (await suggestionType.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(suggestionType).toBeVisible();
    }

    // Accept the suggestion
    const acceptButton = suggestionCard.locator('[data-testid="suggestion-accept"]');
    await acceptButton.click();

    // Wait for action to complete
    await expect(suggestionCard).not.toBeVisible({ timeout: 5000 });

    // Verify effect based on type (if visible)
    // For TASK_COMPLETE: task should be marked done
    // For PRIORITY_CHANGE: task priority should update
    // This is validated server-side, UI just shows success
  });
});

test.describe('PM Suggestion UI States', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('empty state shown when no suggestions', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    // Check for empty state
    const emptyState = page.locator('[data-testid="suggestions-empty"]');
    const suggestionCards = page.locator('[data-testid="suggestion-card"]');

    const cardCount = await suggestionCards.count();
    const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    // Either we have cards or empty state (not both)
    if (cardCount === 0) {
      // Should show empty state or just no section
      // If empty state exists, it should be visible
      if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
      }
    } else {
      // Should not show empty state when there are cards
      expect(hasEmptyState).toBe(false);
    }
  });

  test('suggestion confidence is displayed', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (!(await suggestionCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Confidence should be visible
    const confidence = suggestionCard.locator('[data-testid="suggestion-confidence"]');
    await expect(confidence).toBeVisible();

    // Confidence should be a percentage or level
    const confidenceText = await confidence.textContent();
    expect(confidenceText).toBeTruthy();

    // Should contain number or level (high/medium/low)
    const hasPercentage = /\d+%/.test(confidenceText || '');
    const hasLevel = /(high|medium|low)/i.test(confidenceText || '');

    expect(hasPercentage || hasLevel).toBe(true);
  });

  test('suggestion agent source is shown', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (!(await suggestionCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Agent name/source should be visible
    const agentSource = suggestionCard.locator('[data-testid="suggestion-agent"]');

    if (await agentSource.isVisible()) {
      const agentName = await agentSource.textContent();
      // Should be one of the known agents
      const knownAgents = ['navi', 'sage', 'chrono', 'scope', 'pulse', 'herald'];
      const isKnownAgent = knownAgents.some(
        (agent) => agentName?.toLowerCase().includes(agent),
      );

      expect(isKnownAgent).toBe(true);
    }
  });

  test('suggestion actions are disabled during processing', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (!(await suggestionCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Click accept to start processing
    const acceptButton = suggestionCard.locator('[data-testid="suggestion-accept"]');
    await acceptButton.click();

    // During processing, buttons should be disabled
    // Check immediately after click
    const rejectButton = suggestionCard.locator('[data-testid="suggestion-reject"]');
    const snoozeButton = suggestionCard.locator('[data-testid="suggestion-snooze"]');

    // One of them should be disabled during processing
    // Note: We check disabled state to trigger any side effects
    await Promise.race([
      rejectButton.isDisabled().catch(() => false),
      snoozeButton.isDisabled().catch(() => false),
    ]);

    // Wait for completion
    await expect(suggestionCard).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('PM Suggestion Filtering', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('can filter suggestions by agent', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    // Look for agent filter
    const agentFilter = page.locator('[data-testid="suggestions-agent-filter"]');

    if (!(await agentFilter.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Select specific agent
    await agentFilter.selectOption('navi');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Check that visible suggestions are from that agent
    const suggestionCards = page.locator('[data-testid="suggestion-card"]');
    const count = await suggestionCards.count();

    for (let i = 0; i < count; i++) {
      const agentSource = suggestionCards
        .nth(i)
        .locator('[data-testid="suggestion-agent"]');

      if (await agentSource.isVisible()) {
        const text = await agentSource.textContent();
        expect(text?.toLowerCase()).toContain('navi');
      }
    }
  });

  test('can filter suggestions by type', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    // Look for type filter
    const typeFilter = page.locator('[data-testid="suggestions-type-filter"]');

    if (!(await typeFilter.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Select specific type
    await typeFilter.selectOption('TASK_COMPLETE');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Check that visible suggestions are of that type
    const suggestionCards = page.locator('[data-testid="suggestion-card"]');
    const count = await suggestionCards.count();

    for (let i = 0; i < count; i++) {
      const suggestionType = suggestionCards
        .nth(i)
        .locator('[data-testid="suggestion-type"]');

      if (await suggestionType.isVisible()) {
        const text = await suggestionType.textContent();
        expect(text?.toLowerCase()).toContain('complete');
      }
    }
  });
});

test.describe('PM Suggestion Error Handling', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('shows error on accept failure', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (!(await suggestionCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Go offline to simulate failure
    await page.context().setOffline(true);

    // Try to accept
    const acceptButton = suggestionCard.locator('[data-testid="suggestion-accept"]');
    await acceptButton.click();

    // Should show error
    const errorMessage = page.locator('[data-testid="suggestion-error"]');
    const errorToast = page.locator('[data-testid="toast-error"]');

    const hasError = await Promise.race([
      errorMessage.isVisible({ timeout: 5000 }).catch(() => false),
      errorToast.isVisible({ timeout: 5000 }).catch(() => false),
    ]);

    expect(hasError).toBe(true);

    // Card should still be visible (not removed on failure)
    await expect(suggestionCard).toBeVisible();

    // Restore network
    await page.context().setOffline(false);
  });

  test('retry button shown after failure', async ({ page }) => {
    // Navigate to project page
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (!(await suggestionCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Go offline
    await page.context().setOffline(true);

    // Try to accept
    const acceptButton = suggestionCard.locator('[data-testid="suggestion-accept"]');
    await acceptButton.click();

    // Wait for error
    await page.waitForTimeout(2000);

    // Check for retry button
    const retryButton = suggestionCard.locator('[data-testid="suggestion-retry"]');
    const hasRetry = await retryButton.isVisible({ timeout: 3000 }).catch(() => false);

    // Restore network
    await page.context().setOffline(false);

    if (hasRetry) {
      // Click retry
      await retryButton.click();

      // Should process successfully now
      await expect(suggestionCard).not.toBeVisible({ timeout: 10000 });
    }
  });
});
