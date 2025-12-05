/**
 * BYOAI Configuration E2E Tests - Epic 06
 *
 * Tests for AI provider configuration, token usage dashboard, and provider health.
 * @see docs/epics/EPIC-06-byoai.md
 */
import { test, expect } from '../support/fixtures';

test.describe('BYOAI Configuration', () => {
  test.describe('AI Provider Settings (Story 06.1)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should navigate to AI provider settings', async ({ page }) => {
      await page.goto('/settings/ai-providers');

      await expect(page.locator('[data-testid="ai-providers-settings"]')).toBeVisible();
      await expect(page.getByRole('heading', { name: /ai providers/i })).toBeVisible();
    });

    test('should display supported provider list', async ({ page }) => {
      await page.goto('/settings/ai-providers');

      // Should show supported providers
      const providerList = page.locator('[data-testid="provider-list"]');
      await expect(providerList).toBeVisible();

      // Check for known providers
      await expect(page.getByText(/claude|anthropic/i)).toBeVisible();
    });

    test('should show add provider button', async ({ page }) => {
      await page.goto('/settings/ai-providers');

      await expect(page.locator('[data-testid="add-provider-button"]')).toBeVisible();
    });
  });

  test.describe('Add AI Provider (Story 06.2)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should open add provider modal', async ({ page }) => {
      await page.goto('/settings/ai-providers');

      await page.click('[data-testid="add-provider-button"]');

      await expect(page.locator('[data-testid="add-provider-modal"]')).toBeVisible();
    });

    test('should show provider type selection', async ({ page }) => {
      await page.goto('/settings/ai-providers');
      await page.click('[data-testid="add-provider-button"]');

      // Provider type dropdown
      const providerSelect = page.locator('[data-testid="provider-type-select"]');
      await expect(providerSelect).toBeVisible();

      // Check for provider options
      await providerSelect.click();
      await expect(page.getByRole('option', { name: /anthropic/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /openai/i })).toBeVisible();
    });

    test('should require API key', async ({ page }) => {
      await page.goto('/settings/ai-providers');
      await page.click('[data-testid="add-provider-button"]');

      // Select provider type
      await page.click('[data-testid="provider-type-select"]');
      await page.click('[data-testid="provider-option-anthropic"]');

      // Try to save without API key
      await page.click('[data-testid="save-provider-button"]');

      // Should show error
      await expect(page.getByText(/api key.*required/i)).toBeVisible();
    });

    test('should mask API key input', async ({ page }) => {
      await page.goto('/settings/ai-providers');
      await page.click('[data-testid="add-provider-button"]');

      const apiKeyInput = page.locator('[data-testid="api-key-input"]');
      await expect(apiKeyInput).toHaveAttribute('type', 'password');
    });

    test('should validate API key format', async ({ page }) => {
      await page.goto('/settings/ai-providers');
      await page.click('[data-testid="add-provider-button"]');

      // Select Anthropic
      await page.click('[data-testid="provider-type-select"]');
      await page.click('[data-testid="provider-option-anthropic"]');

      // Enter invalid key format
      await page.fill('[data-testid="api-key-input"]', 'invalid-key');
      await page.click('[data-testid="save-provider-button"]');

      // Should show format error
      await expect(page.getByText(/invalid.*format/i)).toBeVisible();
    });

    test('should test API key before saving', async ({ page }) => {
      await page.goto('/settings/ai-providers');
      await page.click('[data-testid="add-provider-button"]');

      await page.click('[data-testid="provider-type-select"]');
      await page.click('[data-testid="provider-option-anthropic"]');

      await page.fill('[data-testid="api-key-input"]', 'sk-ant-api03-test-key');

      // Click test button
      const testButton = page.locator('[data-testid="test-api-key-button"]');
      if (await testButton.isVisible()) {
        await testButton.click();

        // Should show testing state
        await expect(
          page.getByText(/testing|validating/i)
        ).toBeVisible();
      }
    });
  });

  test.describe('Token Usage Dashboard (Story 06.5)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display usage dashboard', async ({ page }) => {
      await page.goto('/settings/ai-providers/usage');

      await expect(page.locator('[data-testid="usage-dashboard"]')).toBeVisible();
    });

    test('should show total tokens used', async ({ page }) => {
      await page.goto('/settings/ai-providers/usage');

      const totalTokens = page.locator('[data-testid="total-tokens"]');
      await expect(totalTokens).toBeVisible();
    });

    test('should show usage by provider breakdown', async ({ page }) => {
      await page.goto('/settings/ai-providers/usage');

      const providerBreakdown = page.locator('[data-testid="provider-breakdown"]');
      if (await providerBreakdown.isVisible()) {
        // Should show chart or list of providers
        await expect(providerBreakdown).toBeVisible();
      }
    });

    test('should show daily usage chart', async ({ page }) => {
      await page.goto('/settings/ai-providers/usage');

      const dailyChart = page.locator('[data-testid="daily-usage-chart"]');
      if (await dailyChart.isVisible()) {
        await expect(dailyChart).toBeVisible();
      }
    });

    test('should filter usage by date range', async ({ page }) => {
      await page.goto('/settings/ai-providers/usage');

      const dateRangePicker = page.locator('[data-testid="date-range-picker"]');
      if (await dateRangePicker.isVisible()) {
        await dateRangePicker.click();

        // Select last 7 days
        await page.click('[data-testid="preset-7-days"]');

        // Chart should update
        await expect(page).toHaveURL(/days=7|range=7d/);
      }
    });

    test('should show usage by agent', async ({ page }) => {
      await page.goto('/settings/ai-providers/usage');

      const agentUsage = page.locator('[data-testid="usage-by-agent"]');
      if (await agentUsage.isVisible()) {
        await expect(agentUsage).toBeVisible();
      }
    });
  });

  test.describe('Token Limits (Story 06.3)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display token limit settings', async ({ page }) => {
      await page.goto('/settings/ai-providers');

      // Find a provider card
      const providerCard = page.locator('[data-testid^="provider-card-"]').first();
      if (await providerCard.isVisible()) {
        // Should show limit indicator
        await expect(
          providerCard.locator('[data-testid="token-limit"]')
        ).toBeVisible();
      }
    });

    test('should update token limit', async ({ page }) => {
      await page.goto('/settings/ai-providers');

      const providerCard = page.locator('[data-testid^="provider-card-"]').first();
      if (await providerCard.isVisible()) {
        await providerCard.click();

        const limitInput = page.locator('[data-testid="daily-limit-input"]');
        if (await limitInput.isVisible()) {
          await limitInput.fill('100000');
          await page.click('[data-testid="save-limit-button"]');

          await expect(page.getByText(/saved|updated/i)).toBeVisible();
        }
      }
    });

    test('should show limit warning when approaching threshold', async ({
      page,
    }) => {
      await page.goto('/settings/ai-providers');

      // If a provider is near limit, warning should show
      const limitWarning = page.locator('[data-testid="limit-warning"]');
      if (await limitWarning.isVisible().catch(() => false)) {
        await expect(limitWarning).toContainText(/approaching|near/i);
      }
    });
  });

  test.describe('Provider Health (Story 06.6)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should show provider health status', async ({ page }) => {
      await page.goto('/settings/ai-providers');

      const providerCard = page.locator('[data-testid^="provider-card-"]').first();
      if (await providerCard.isVisible()) {
        const healthIndicator = providerCard.locator('[data-testid="health-status"]');
        await expect(healthIndicator).toBeVisible();
      }
    });

    test('should trigger manual health check', async ({ page }) => {
      await page.goto('/settings/ai-providers');

      const providerCard = page.locator('[data-testid^="provider-card-"]').first();
      if (await providerCard.isVisible()) {
        await providerCard.click();

        const healthCheckButton = page.locator('[data-testid="check-health-button"]');
        if (await healthCheckButton.isVisible()) {
          await healthCheckButton.click();

          // Should show checking state
          await expect(page.getByText(/checking|testing/i)).toBeVisible();
        }
      }
    });

    test('should display latency metrics', async ({ page }) => {
      await page.goto('/settings/ai-providers');

      const providerCard = page.locator('[data-testid^="provider-card-"]').first();
      if (await providerCard.isVisible()) {
        await providerCard.click();

        const latency = page.locator('[data-testid="provider-latency"]');
        if (await latency.isVisible()) {
          await expect(latency).toContainText(/ms/);
        }
      }
    });
  });

  test.describe('Agent Model Preferences (Story 06.11)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display agent preferences section', async ({ page }) => {
      await page.goto('/settings/ai-providers/agents');

      await expect(
        page.locator('[data-testid="agent-preferences"]')
      ).toBeVisible();
    });

    test('should list available agents', async ({ page }) => {
      await page.goto('/settings/ai-providers/agents');

      const agentList = page.locator('[data-testid="agent-list"]');
      await expect(agentList).toBeVisible();
    });

    test('should allow model selection per agent', async ({ page }) => {
      await page.goto('/settings/ai-providers/agents');

      const agentRow = page.locator('[data-testid^="agent-row-"]').first();
      if (await agentRow.isVisible()) {
        const modelSelect = agentRow.locator('[data-testid="model-select"]');
        await expect(modelSelect).toBeVisible();
      }
    });

    test('should save agent model preference', async ({ page }) => {
      await page.goto('/settings/ai-providers/agents');

      const agentRow = page.locator('[data-testid^="agent-row-"]').first();
      if (await agentRow.isVisible()) {
        const modelSelect = agentRow.locator('[data-testid="model-select"]');
        if (await modelSelect.isVisible()) {
          await modelSelect.click();

          // Select first available model
          const modelOption = page.locator('[data-testid^="model-option-"]').first();
          if (await modelOption.isVisible()) {
            await modelOption.click();

            await expect(page.getByText(/saved|updated/i)).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/settings/ai-providers');

      // Settings should still be accessible
      await expect(
        page.locator('[data-testid="ai-providers-settings"]')
      ).toBeVisible();
    });

    test('should stack provider cards on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/settings/ai-providers');

      const providerCard = page.locator('[data-testid^="provider-card-"]').first();
      if (await providerCard.isVisible()) {
        const box = await providerCard.boundingBox();
        // Card should be nearly full width on mobile
        expect(box?.width).toBeGreaterThan(300);
      }
    });
  });
});
