/**
 * BYOAI Configuration E2E Tests - Epic 06 (Updated routes)
 *
 * HYVVE UX:
 * - API Keys live at /settings/api-keys
 * - Usage dashboard lives at /settings/ai-config/usage
 */
import { test, expect } from '../support/fixtures';

test.describe('BYOAI Configuration', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('API Keys page renders', async ({ page }) => {
    await page.goto('/settings/api-keys');
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /ai api keys/i })).toBeVisible();
  });

  test('Add Key dialog renders when available providers exist', async ({ page }) => {
    await page.goto('/settings/api-keys');

    const addButton = page.getByRole('button', { name: /add key/i }).first();
    if (!(await addButton.isVisible().catch(() => false))) {
      test.skip(true, 'No available providers to add in this environment');
    }

    await addButton.click();

    await expect(page.getByRole('heading', { name: /add ai key/i })).toBeVisible();

    const apiKeyInput = page.locator('input#apiKey');
    await expect(apiKeyInput).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: /^add key$/i }).click();
    await expect(page.getByText(/please fill in all required fields/i)).toBeVisible();
  });

  test('Token Usage page renders', async ({ page }) => {
    await page.goto('/settings/ai-config/usage');
    await expect(page.getByRole('heading', { name: 'Token Usage' })).toBeVisible();
  });
});

