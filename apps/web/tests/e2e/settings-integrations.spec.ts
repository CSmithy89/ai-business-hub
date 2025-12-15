/**
 * Settings Integrations Smoke - Modules, API Keys, MCP
 *
 * Ensures the new settings pages render after auth and basic navigation works.
 */
import { test, expect } from '../support/fixtures';

test.describe('Settings Integrations', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('API Keys page renders', async ({ page }) => {
    await page.goto('/settings/api-keys');
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible();
  });

  test('MCP Integrations page renders', async ({ page }) => {
    await page.goto('/settings/mcp');
    await expect(page.getByRole('heading', { name: 'MCP Integrations' })).toBeVisible();
  });

  test('Modules page renders', async ({ page }) => {
    await page.goto('/settings/modules');
    await expect(page.getByRole('heading', { name: 'Modules' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /workspace modules/i })).toBeVisible();
  });
});

