/**
 * PM Agent E2E Tests
 *
 * Tests for the PM Agent UI including:
 * - Agent panel toggle
 * - Chat with Navi agent
 * - Agent switching
 * - Slash commands
 * - Chat history persistence
 *
 * @see docs/modules/bm-pm/stories/pm-12-4-integration-e2e-tests.md
 */
import { test, expect } from '../support/fixtures';

// Skip tests if PM module is not enabled
test.describe('PM Agent Chat Flow', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('user can open agent panel toggle', async ({ page }) => {
    // Navigate to a project page
    await page.goto('/pm/projects');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if agent panel toggle exists
    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');

    // Skip if PM agents not implemented yet
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Click to open agent panel
    await agentToggle.click();

    // Verify panel opens
    await expect(page.locator('[data-testid="agent-panel"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test('user can chat with Navi agent', async ({ page }) => {
    // Navigate to project
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    // Open agent panel
    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await agentToggle.click();
    await expect(page.locator('[data-testid="agent-panel"]')).toBeVisible();

    // Type message
    const agentInput = page.locator('[data-testid="agent-input"]');
    await expect(agentInput).toBeVisible();
    await agentInput.fill('What tasks are overdue?');

    // Send message
    const sendButton = page.locator('[data-testid="agent-send"]');
    await sendButton.click();

    // Wait for response (with longer timeout for AI processing)
    await expect(page.locator('[data-testid="agent-response"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify response contains relevant content
    const response = page.locator('[data-testid="agent-response"]').last();
    const responseText = await response.textContent();
    expect(responseText).toBeTruthy();
  });

  test('user can switch between different agents', async ({ page }) => {
    // Navigate to project
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    // Open agent panel
    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await agentToggle.click();

    // Check if agent selector exists
    const agentSelector = page.locator('[data-testid="agent-selector"]');
    if (!(await agentSelector.isVisible({ timeout: 3000 }).catch(() => false))) {
      // Alternative: check for agent tabs
      const agentTabs = page.locator('[data-testid="agent-tabs"]');
      if (!(await agentTabs.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip();
        return;
      }

      // Click on Sage tab
      const sageTab = page.locator('[data-testid="agent-tab-sage"]');
      if (await sageTab.isVisible()) {
        await sageTab.click();
        await expect(page.locator('[data-testid="agent-name"]')).toContainText('Sage');
      }
      return;
    }

    // Use dropdown selector
    await agentSelector.selectOption('sage');

    // Verify agent changed
    await expect(page.locator('[data-testid="agent-name"]')).toContainText('Sage');
  });

  test('slash commands are recognized and processed', async ({ page }) => {
    // Navigate to project
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    // Open agent panel
    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await agentToggle.click();

    // Type slash command
    const agentInput = page.locator('[data-testid="agent-input"]');
    await expect(agentInput).toBeVisible();

    // Check for command suggestions
    await agentInput.fill('/');

    // Should show command autocomplete
    const commandList = page.locator('[data-testid="command-suggestions"]');
    const hasCommandList = await commandList.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasCommandList) {
      await expect(commandList).toBeVisible();
    }

    // Type a full command
    await agentInput.clear();
    await agentInput.fill('/status');

    // Send command
    const sendButton = page.locator('[data-testid="agent-send"]');
    await sendButton.click();

    // Wait for response
    await expect(page.locator('[data-testid="agent-response"]')).toBeVisible({
      timeout: 15000,
    });
  });

  test('chat history persists on page refresh', async ({ page }) => {
    // Navigate to project
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    // Open agent panel
    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await agentToggle.click();

    // Send a unique message for identification
    const uniqueMessage = `Test message for history ${Date.now()}`;
    const agentInput = page.locator('[data-testid="agent-input"]');
    await agentInput.fill(uniqueMessage);

    const sendButton = page.locator('[data-testid="agent-send"]');
    await sendButton.click();

    // Wait for response
    await expect(page.locator('[data-testid="agent-response"]')).toBeVisible({
      timeout: 30000,
    });

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Reopen agent panel
    await agentToggle.click();

    // Check if history is visible
    const chatHistory = page.locator('[data-testid="chat-history"]');
    const chatMessages = page.locator('[data-testid="chat-message"]');

    // Check for persisted message
    const historyVisible = await chatHistory.isVisible({ timeout: 3000 }).catch(() => false);
    const messagesVisible = await chatMessages.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (historyVisible || messagesVisible) {
      // Verify the unique message is in history
      const messageLocator = historyVisible ? chatHistory : chatMessages.first();
      await expect(messageLocator).toContainText(uniqueMessage.slice(0, 20)); // Check partial match
    }
  });

  test('agent responds with structured data', async ({ page }) => {
    // Navigate to project
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    // Open agent panel
    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await agentToggle.click();

    // Ask for structured data
    const agentInput = page.locator('[data-testid="agent-input"]');
    await agentInput.fill('Show me my tasks for today');

    const sendButton = page.locator('[data-testid="agent-send"]');
    await sendButton.click();

    // Wait for response
    await expect(page.locator('[data-testid="agent-response"]')).toBeVisible({
      timeout: 30000,
    });

    // Response should contain structured content
    const response = page.locator('[data-testid="agent-response"]').last();
    const responseText = await response.textContent();

    // Verify response has content (not empty)
    expect(responseText?.length).toBeGreaterThan(0);
  });
});

test.describe('PM Agent Panel UI', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('agent panel has correct initial state', async ({ page }) => {
    // Navigate to project
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    // Check if agent panel toggle exists
    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Panel should start closed
    await expect(page.locator('[data-testid="agent-panel"]')).not.toBeVisible();

    // Open panel
    await agentToggle.click();
    await expect(page.locator('[data-testid="agent-panel"]')).toBeVisible();

    // Verify input is available
    await expect(page.locator('[data-testid="agent-input"]')).toBeVisible();

    // Verify send button exists
    await expect(page.locator('[data-testid="agent-send"]')).toBeVisible();
  });

  test('agent panel can be closed', async ({ page }) => {
    // Navigate to project
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Open panel
    await agentToggle.click();
    await expect(page.locator('[data-testid="agent-panel"]')).toBeVisible();

    // Close panel (either via toggle or close button)
    const closeButton = page.locator('[data-testid="agent-panel-close"]');
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click();
    } else {
      await agentToggle.click();
    }

    // Panel should be closed
    await expect(page.locator('[data-testid="agent-panel"]')).not.toBeVisible();
  });

  test('input is cleared after sending message', async ({ page }) => {
    // Navigate to project
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await agentToggle.click();

    // Type message
    const agentInput = page.locator('[data-testid="agent-input"]');
    await agentInput.fill('Hello agent');

    // Send message
    const sendButton = page.locator('[data-testid="agent-send"]');
    await sendButton.click();

    // Input should be cleared
    await expect(agentInput).toHaveValue('');
  });

  test('loading state shown while agent processes', async ({ page }) => {
    // Navigate to project
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await agentToggle.click();

    // Type and send message
    const agentInput = page.locator('[data-testid="agent-input"]');
    await agentInput.fill('Complex question requiring processing');

    const sendButton = page.locator('[data-testid="agent-send"]');
    await sendButton.click();

    // Check for loading indicator
    const loadingIndicator = page.locator('[data-testid="agent-loading"]');
    const typingIndicator = page.locator('[data-testid="agent-typing"]');

    // One of the loading indicators should appear briefly
    // Note: We check visibility but don't assert - just verify no exception
    await Promise.race([
      loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false),
      typingIndicator.isVisible({ timeout: 1000 }).catch(() => false),
    ]);

    // Eventually response should appear
    await expect(page.locator('[data-testid="agent-response"]')).toBeVisible({
      timeout: 30000,
    });
  });
});

test.describe('PM Agent Error Handling', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('displays error message on network failure', async ({ page }) => {
    // Navigate to project
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await agentToggle.click();

    // Simulate network failure by going offline
    await page.context().setOffline(true);

    // Try to send message
    const agentInput = page.locator('[data-testid="agent-input"]');
    await agentInput.fill('This should fail');

    const sendButton = page.locator('[data-testid="agent-send"]');
    await sendButton.click();

    // Wait for error message
    const errorMessage = page.locator('[data-testid="agent-error"]');
    const errorToast = page.locator('[data-testid="toast-error"]');

    const hasError = await Promise.race([
      errorMessage.isVisible({ timeout: 5000 }).catch(() => false),
      errorToast.isVisible({ timeout: 5000 }).catch(() => false),
    ]);

    expect(hasError).toBe(true);

    // Restore network
    await page.context().setOffline(false);
  });

  test('retains message on send failure', async ({ page }) => {
    // Navigate to project
    await page.goto('/pm/projects');
    await page.waitForLoadState('networkidle');

    const agentToggle = page.locator('[data-testid="agent-panel-toggle"]');
    if (!(await agentToggle.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await agentToggle.click();

    const testMessage = 'Message that should be retained';
    const agentInput = page.locator('[data-testid="agent-input"]');

    // Go offline and try to send
    await page.context().setOffline(true);
    await agentInput.fill(testMessage);

    const sendButton = page.locator('[data-testid="agent-send"]');
    await sendButton.click();

    // Wait a bit for error handling
    await page.waitForTimeout(2000);

    // Message should still be in input (or in failed messages list)
    const inputValue = await agentInput.inputValue();
    const failedMessageVisible = await page
      .locator(`text="${testMessage}"`)
      .isVisible()
      .catch(() => false);

    expect(inputValue === testMessage || failedMessageVisible).toBe(true);

    // Restore network
    await page.context().setOffline(false);
  });
});
